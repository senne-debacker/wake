// Exports the world the game builds (the sea, the islands, the trees and rocks, the lighthouse, the buoys,
// the start position and the fishing spots) as a .glb that Blender can import:
//
//   npm run export:world        ->  blender/wake-world.glb
//
// It runs the game's own generator (world/layout.js + scene/world.js), so the file is what you see in the
// game. The sea is the flat sphere (radius 5): the waves are drawn by the GPU on top of it while playing.
// glTF is Y up and Blender's importer turns that into Z up by itself.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// GLTFExporter wants a browser's FileReader to write the binary file; Node has Blob but no FileReader.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.()
    })
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`
      this.onloadend?.()
    })
  }
}

const THREE = await import('three')
const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
const { PLANET, WORLD_PALETTE: P } = await import('../src/config.js')
const { createLayout } = await import('../src/world/layout.js')
const { createWorld } = await import('../src/scene/world.js')

const R = PLANET.radius
const layout = createLayout()
const world = createWorld(layout)

// ---- materials: the game's node materials become plain ones the exporter and Blender understand -------------
const cache = new Map() // one material per name and look, shared by everything that uses it
function plain(source, name) {
  const key = `${name}|${source.color?.getHexString()}|${source.vertexColors}|${source.emissive?.getHexString()}`
  if (cache.has(key)) return cache.get(key)
  const material = new THREE.MeshStandardMaterial({
    name,
    color: source.color ?? '#ffffff',
    roughness: source.roughness ?? 0.9,
    metalness: source.metalness ?? 0,
    vertexColors: Boolean(source.vertexColors),
    flatShading: true,
  })
  if (source.emissive && source.emissive.getHex() !== 0) {
    material.emissive = source.emissive.clone()
    material.emissiveIntensity = 0.6 // (it glows at night in the game)
  }
  cache.set(key, material)
  return material
}

const out = new THREE.Group()
out.name = 'Wake_World'
const folder = (name) => {
  const group = new THREE.Group()
  group.name = name
  out.add(group)
  return group
}

// Something standing on the sea at `dir`, with +Y pointing away from the planet.
const stand = (object, dir, heading = null) => {
  const up = dir.clone().normalize()
  object.position.copy(up).multiplyScalar(R)
  if (heading) {
    const forward = heading.clone().addScaledVector(up, -heading.dot(up)).normalize() // the bow points along -Z
    object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(up, forward.clone().negate()), up, forward.clone().negate()))
  } else object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)
}

// ---- the sea -------------------------------------------------------------------------------------------------
const water = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 32), new THREE.MeshStandardMaterial({ name: 'Water', color: '#2c6f86', roughness: 0.4, flatShading: true }))
water.name = 'Water'
water.userData = { radius: R, note: 'Sea level. The game draws the waves on top of this sphere (up to 0.14 high in calm weather, 0.5 in a storm).' }
out.add(water)

// ---- islands, trees, rocks, lighthouse, buoys ----------------------------------------------------------------
const islands = folder('Islands')
const trees = folder('Trees')
const rocks = folder('Rocks')
const buoys = folder('Buoys')
const counters = { Pine: 0, Autumn_Tree: 0, Rock: 0 }
const pad = (n, size = 3) => String(n).padStart(size, '0')

for (const child of [...world.group.children]) {
  if (child.isInstancedMesh) {
    const kind = { pines: 'Pine', autumns: 'Autumn_Tree', rocks: 'Rock' }[child.name]
    const matrix = new THREE.Matrix4()
    const tint = new THREE.Color()
    for (let i = 0; i < child.count; i++) {
      child.getMatrixAt(i, matrix)
      child.getColorAt(i, tint)
      const geometry = child.geometry.clone()
      const colours = geometry.getAttribute('color') // the instance's tint is baked into the vertex colours
      for (let v = 0; v < colours.count; v++) colours.setXYZ(v, colours.getX(v) * tint.r, colours.getY(v) * tint.g, colours.getZ(v) * tint.b)
      const mesh = new THREE.Mesh(geometry, plain(child.material, kind === 'Rock' ? 'Rock' : 'Tree'))
      mesh.name = `${kind}_${pad(++counters[kind])}`
      matrix.decompose(mesh.position, mesh.quaternion, mesh.scale)
      ;(kind === 'Rock' ? rocks : trees).add(mesh)
    }
  }
}

// Islands: the terrain meshes (one colour per triangle, as vertex colours).
for (const island of layout.islands) {
  const source = world.group.children.find((c) => c.isMesh && c.name === island.name)
  if (!source) continue
  const mesh = new THREE.Mesh(source.geometry, plain(source.material, 'Terrain'))
  mesh.name = `Island_${island.name}`
  mesh.userData = { shoreline_radius: island.radius, peak_height: island.height, ground: island.ground, trees: island.trees, lighthouse: Boolean(island.lighthouse) }
  islands.add(mesh)
}

// Lighthouse: only the solid parts (the sweeping light and its beams are drawn by the game).
if (world.lighthouse) {
  const tower = new THREE.Group()
  tower.name = 'Lighthouse'
  tower.position.copy(world.lighthouse.root.position)
  tower.quaternion.copy(world.lighthouse.root.quaternion)
  let n = 0
  for (const part of world.lighthouse.root.children) {
    if (!part.isMesh || !part.material.isMeshStandardNodeMaterial) continue
    const mesh = new THREE.Mesh(part.geometry, plain(part.material, `Lighthouse_${pad(n + 1, 2)}`))
    mesh.name = `Lighthouse_Part_${pad(++n, 2)}`
    mesh.position.copy(part.position)
    mesh.quaternion.copy(part.quaternion)
    tower.add(mesh)
  }
  out.add(tower)
}

// Buoys: the game places them on the waves every frame, here they stand on the flat sea.
const buoyModels = world.group.children.find((c) => c.name === 'buoys').children
layout.buoys.forEach((buoy, i) => {
  const holder = new THREE.Group()
  holder.name = `Buoy_${pad(i + 1, 2)}`
  stand(holder, buoy.dir)
  let n = 0
  for (const part of buoyModels[i].children) {
    if (!part.isMesh) continue
    const mesh = new THREE.Mesh(part.geometry, plain(part.material, part.material.emissive?.getHex() ? 'Buoy_Lamp' : `Buoy_${pad(++n, 2)}`))
    mesh.name = `Buoy_Part_${pad(i + 1, 2)}_${n}`
    mesh.position.copy(part.position)
    mesh.quaternion.copy(part.quaternion)
    holder.add(mesh)
  }
  buoys.add(holder)
})

// ---- markers (empties): where the boat starts and where the fish are -----------------------------------------
const markers = folder('Markers')
const start = new THREE.Object3D()
start.name = 'Start'
stand(start, layout.start.dir, layout.start.heading)
start.userData = { note: 'Where the boat starts. The bow points along -Z of this empty (glTF) = +Y in Blender.' }
markers.add(start)
layout.fishingSpots.forEach((spot, i) => {
  const marker = new THREE.Object3D()
  marker.name = `FishingSpot_${i + 1}`
  stand(marker, spot.dir)
  marker.userData = { note: 'A patch of bubbling water: anchor within 0.45 of it to fish.' }
  markers.add(marker)
})
const ocean = new THREE.Object3D()
ocean.name = 'Open_Ocean'
stand(ocean, layout.ocean.dir)
ocean.userData = { radius: layout.ocean.radius, note: 'The centre of the big empty ocean: no islands, rocks or buoys inside this radius.' }
markers.add(ocean)

// ---- write it ------------------------------------------------------------------------------------------------
const scene = new THREE.Scene()
scene.add(out)
const glb = await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: false })
const target = fileURLToPath(new URL('../blender/wake-world.glb', import.meta.url))
writeFileSync(target, Buffer.from(glb))

let triangles = 0
out.traverse((o) => { if (o.isMesh) triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.getAttribute('position').count) / 3 })
console.log(`wrote ${target}`)
console.log(`${(glb.byteLength / 1e6).toFixed(1)} MB, ${islands.children.length} islands, ${trees.children.length} trees, ${rocks.children.length} rocks, ${buoys.children.length} buoys, ${layout.fishingSpots.length} fishing spots, ${Math.round(triangles).toLocaleString()} triangles`)
