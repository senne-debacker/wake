import { Vector3, Quaternion, Box3, Raycaster, Mesh } from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { PLANET, WORLD, BOAT } from '../config.js'
import { fromStart } from './layout.js'
import { islandFrame, shorelineFromContour, CONTOUR_COUNT } from '../physics/islandShape.js'

// A world made in Blender (see blender/WORLDS.md) read into the same structure as world/layout.js builds,
// so the rest of the game cannot tell the difference. The file is what `npm run export:world` writes, edited:
//   Islands > Island_<name>     the land (vertex colours); extras: shoreline_radius, peak_height, ground, lighthouse
//   Trees, Rocks                meshes standing on the sea; the Rocks collide (icebergs are rocks too)
//   Lighthouse                  an empty or group: where the (generated) lighthouse stands
//   Buoys > Buoy_nn             where the (generated, floating) buoys are
//   Markers > Start             the boat's start; its -Z is the bow. FishingSpot_n, Open_Ocean (extras: radius), and
//                               optionally Harbour (or any empty named Dock...): the world's own selling point, at the water end of a
//                               dock that the file draws itself (else the game's small floating dock goes near the start on clear water)
// The coastline of every island is measured from its mesh (rays down onto the land, outwards from the
// island's centre), so the collisions follow what you see.
//
// Returns { start, islands, rocks, buoys, colliders, bodies, ocean, fishingSpots, imported } with
// `imported` = { scene, islands: [{ mesh }], trees, rocks, lighthouse: { position, quaternion } | null }.

const R = PLANET.radius
const UP = new Vector3(0, 1, 0)
const origin = new Vector3()

const find = (scene, name) => scene.getObjectByName(name)
const worldPosition = (object) => object.getWorldPosition(new Vector3())
const direction = (object) => worldPosition(object).normalize()

export async function importWorldLayout(file) {
  const gltf = await new GLTFLoader().loadAsync(new URL(file, document.baseURI).href)
  return layoutFromScene(gltf.scene)
}

// (separate from the loading, so the Node checks can feed it a scene)
export function layoutFromScene(scene) {
  scene.updateMatrixWorld(true)

  // ---- markers --------------------------------------------------------------------------------------------
  const startNode = find(scene, 'Start')
  if (!startNode) throw new Error('The world has no "Start" marker')
  const startDir = direction(startNode)
  const bow = new Vector3(0, 0, -1).applyQuaternion(startNode.getWorldQuaternion(new Quaternion()))
  const start = { dir: startDir, heading: bow.addScaledVector(startDir, -bow.dot(startDir)).normalize() }

  const oceanNode = find(scene, 'Open_Ocean')
  const ocean = { dir: oceanNode ? direction(oceanNode) : startDir.clone().negate(), radius: oceanNode?.userData?.radius ?? 0 }

  const fishingSpots = []
  scene.traverse((node) => {
    if (/^FishingSpot_/i.test(node.name)) fishingSpots.push({ dir: direction(node), seed: (fishingSpots.length + 1) * 17.3 })
  })

  const buoys = []
  const buoyGroup = find(scene, 'Buoys')
  for (const buoy of buoyGroup?.children ?? []) buoys.push({ dir: direction(buoy), heading: new Vector3(1, 0, 0) })

  const lighthouseNode = find(scene, 'Lighthouse')
  const lighthouse = lighthouseNode ? { position: worldPosition(lighthouseNode), quaternion: lighthouseNode.getWorldQuaternion(new Quaternion()) } : null

  // ---- islands: the shoreline is measured from the mesh --------------------------------------------------
  const islands = []
  for (const mesh of find(scene, 'Islands')?.children ?? []) {
    if (!mesh.isMesh) continue
    islands.push(measureIsland(mesh))
  }

  // ---- rocks (they collide) and trees (they do not) ------------------------------------------------------
  const rocks = []
  const box = new Box3()
  const size = new Vector3()
  for (const mesh of find(scene, 'Rocks')?.children ?? []) {
    if (!mesh.isMesh) continue
    box.setFromObject(mesh).getSize(size)
    rocks.push({ dir: direction(mesh), radius: Math.max(size.x, size.y, size.z) / 2, mesh })
  }
  const trees = (find(scene, 'Trees')?.children ?? []).filter((mesh) => mesh.isMesh)

  // ---- the harbour: a `Harbour` (or `Dock...`) marker, else the game's own dock near the start where nothing stands ----
  let harbourNode = find(scene, 'Harbour')
  if (!harbourNode) scene.traverse((node) => { if (!harbourNode && !node.isMesh && /^dock/i.test(node.name) && node.parent?.name === 'Markers') harbourNode = node })
  const arc = (a, b) => Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) * R
  const clearOfLand = (dir) =>
    [...islands.map((i) => [i.dir, i.shape.maxShoreline]), ...rocks.map((r) => [r.dir, r.radius])].every(([centre, extent]) => arc(dir, centre) > extent + WORLD.harbour.radius + BOAT.shoreMargin + 0.5) &&
    buoys.every((b) => arc(dir, b.dir) > 0.8) &&
    fishingSpots.every((spot) => arc(dir, spot.dir) > 1.1)
  let harbourDir = harbourNode ? direction(harbourNode) : null
  if (!harbourDir) {
    // near the start, on the port side first; the first place that is clear of land, buoys and fishing spots
    search: for (const distance of [WORLD.harbour.distance, WORLD.harbour.distance * 1.4, WORLD.harbour.distance * 1.8]) {
      for (const bearing of [WORLD.harbour.bearing, -WORLD.harbour.bearing, -90, 90, 180, -135, 135, -20, 20]) {
        const candidate = fromStart(start, bearing, distance)
        if (clearOfLand(candidate)) {
          harbourDir = candidate
          break search
        }
      }
    }
    harbourDir ??= fromStart(start, WORLD.harbour.bearing, WORLD.harbour.distance)
  }
  const harbour = { dir: harbourDir, heading: new Vector3(1, 0, 0), own: Boolean(harbourNode) } // own: the file draws the dock, so the game adds none (and no solid circle)

  // The file's own dock is solid where it stands out of the water: every mesh inside a node named Dock... / Pier... /
  // Jetty... (not the marker) that rises above the sea becomes a small circle, like a rock but without shore foam.
  const dockSolids = []
  if (harbour.own) {
    const seen = new Set()
    const corner = new Vector3()
    scene.traverse((group) => {
      if (group.isMesh || group.parent?.name === 'Markers' || !/^(.*[_-])?(dock|pier|jetty)/i.test(group.name)) return
      group.traverse((mesh) => {
        if (!mesh.isMesh || seen.has(mesh)) return
        seen.add(mesh)
        box.setFromObject(mesh)
        let top = 0
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) top = Math.max(top, corner.set(x, y, z).length())
        if (top < R + 0.02) return // under water: a piling, not something the hull meets
        box.getSize(size)
        dockSolids.push({ dir: box.getCenter(corner).normalize().clone(), radius: Math.max(size.x, size.y, size.z) / 2 })
      })
    })
  }

  // ---- what the rest of the game reads (as in world/layout.js) -------------------------------------------
  const colliders = [
    ...islands.map((island) => ({ kind: 'island', dir: island.dir, shape: island.shape, reach: island.shape.maxShoreline + BOAT.shoreMargin * 2 })),
    ...rocks.map((rock) => ({ kind: 'circle', dir: rock.dir, radius: rock.radius + BOAT.shoreMargin, reach: rock.radius + BOAT.shoreMargin * 2 })),
    ...dockSolids.map((part) => ({ kind: 'circle', dir: part.dir, radius: part.radius + BOAT.shoreMargin, reach: part.radius + BOAT.shoreMargin * 2 })), // the file's dock
    ...(harbour.own ? [] : [{ kind: 'circle', dir: harbour.dir, radius: WORLD.harbour.radius + BOAT.shoreMargin, reach: WORLD.harbour.radius + BOAT.shoreMargin * 2 }]), // the game's dock (last)
  ]
  // The water shader draws shore foam round at most WORLD.maxBodies bodies: every island, then the biggest rocks.
  const bodies = [
    ...islands.map((island) => ({ dir: island.dir, radius: island.radius })),
    ...[...rocks].sort((a, b) => b.radius - a.radius).map((rock) => ({ dir: rock.dir, radius: rock.radius })),
  ].slice(0, WORLD.maxBodies)

  return {
    start,
    islands,
    rocks,
    buoys,
    colliders,
    bodies,
    ocean,
    fishingSpots,
    harbour,
    imported: { scene, trees, lighthouse },
  }
}

const caster = new Raycaster()
const down = new Vector3()
const hit = new Vector3()

// The island's centre, its shoreline table (a distance for each bearing) and the numbers the game keeps
// per island. The mesh is the truth; the extras (shoreline_radius, peak_height, ground) are only a fallback.
function measureIsland(mesh) {
  mesh.updateMatrixWorld(true)
  // Centre: the average direction of the vertices that are above sea level.
  const position = mesh.geometry.getAttribute('position')
  const centre = new Vector3()
  const v = new Vector3()
  let peak = 0
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
    const height = v.length() - R
    if (height > 0) {
      centre.add(v.normalize())
      peak = Math.max(peak, height)
    }
  }
  if (centre.lengthSq() < 1e-9) throw new Error(`The island "${mesh.name}" has no land above the sea`)
  centre.normalize()

  // The mesh's own surface height at a direction: a ray from far above, straight down at the planet's centre.
  caster.firstHitOnly = true
  const heightAt = (dir) => {
    caster.set(down.copy(dir).multiplyScalar(R + 4), hit.copy(dir).negate())
    const result = caster.intersectObject(mesh, false)[0]
    return result ? result.point.length() - R : -Infinity
  }

  const { t1, t2 } = islandFrame(centre)
  const probe = new Vector3()
  const at = (theta, distance) => {
    const angle = distance / R
    return probe.copy(centre).multiplyScalar(Math.cos(angle)).addScaledVector(t1, Math.cos(theta) * Math.sin(angle)).addScaledVector(t2, Math.sin(theta) * Math.sin(angle)).clone()
  }
  // How far the mesh reaches from the centre: the farthest vertex.
  let reach = 0
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).normalize()
    reach = Math.max(reach, Math.acos(Math.min(1, centre.dot(v))) * R)
  }

  // For each bearing walk inwards from the rim until the ground rises above sea level.
  const contour = new Float32Array(CONTOUR_COUNT)
  const STEP = 0.03
  for (let i = 0; i < CONTOUR_COUNT; i++) {
    const theta = (i / CONTOUR_COUNT) * Math.PI * 2
    for (let distance = reach; distance >= 0; distance -= STEP) {
      if (heightAt(at(theta, distance)) >= 0) {
        contour[i] = distance
        break
      }
    }
  }
  const shape = { ...shorelineFromContour(contour), centre, t1, t2, outer: reach } // (the fields of a generated island's shape that collision.js reads)
  const meanShore = contour.reduce((sum, d) => sum + d, 0) / CONTOUR_COUNT

  return {
    name: mesh.name.replace(/^Island_/, ''),
    dir: centre,
    radius: mesh.userData?.shoreline_radius ?? meanShore,
    height: mesh.userData?.peak_height ?? peak,
    ground: mesh.userData?.ground ?? 'rock',
    lighthouse: Boolean(mesh.userData?.lighthouse),
    shape,
    mesh,
  }
}
