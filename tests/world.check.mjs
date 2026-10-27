// World import checks: a world file (blender/worlds/wake-world.glb, public/models/worlds/*.glb) is read into the layout
// the game uses. The original world is the reference: reading its exported file must give back the
// coastlines, rocks and markers of the generated layout.
import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { Vector3 } from 'three/webgpu'
import { PLANET, WORLD, BOAT } from '../src/config.js'
import { islandFrame } from '../src/physics/islandShape.js'
import { resolveCollisions } from '../src/physics/collision.js'
import { createBoatState } from '../src/physics/boat.js'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((r) => { this.result = r; this.onloadend?.() }) }
}
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
const { createLayout } = await import('../src/world/layout.js')
const { layoutFromScene } = await import('../src/world/importWorld.js')

const R = PLANET.radius
let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`)
}
async function load(path) {
  const buffer = readFileSync(path)
  const gltf = await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '')
  return layoutFromScene(gltf.scene)
}
const arc = (a, b) => Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) * R

// ---- the original world, exported and read back --------------------------------------------------------------
{
  const generated = createLayout()
  const read = await load('blender/worlds/wake-world.glb')
  // The generated world's harbour: clear of islands, rocks, buoys and fishing spots, close to the start.
  {
    const dockClear = Math.min(...generated.colliders.slice(0, -1).map((c) => arc(generated.harbour.dir, c.dir) - (c.kind === 'island' ? c.shape.maxShoreline : c.radius)))
    check('wake world: the harbour dock is on clear water near the start', dockClear > 0.5 && arc(generated.harbour.dir, generated.start.dir) < 2 && generated.buoys.every((b) => arc(b.dir, generated.harbour.dir) > 0.6) && generated.fishingSpots.every((s) => arc(s.dir, generated.harbour.dir) > 0.9), `${dockClear.toFixed(2)} from land, ${arc(generated.harbour.dir, generated.start.dir).toFixed(2)} from the start`)
  }
  check('wake world: same number of islands, buoys and fishing spots', read.islands.length === generated.islands.length && read.buoys.length === generated.buoys.length && read.fishingSpots.length === generated.fishingSpots.length, `${read.islands.length} / ${read.buoys.length} / ${read.fishingSpots.length}`)
  check('wake world: the start is where it was, with the same heading', arc(read.start.dir, generated.start.dir) < 0.01 && read.start.heading.dot(generated.start.heading.clone().addScaledVector(generated.start.dir, -generated.start.heading.dot(generated.start.dir)).normalize()) > 0.99)
  check('wake world: the open ocean is where it was', arc(read.ocean.dir, generated.ocean.dir) < 0.01 && Math.abs(read.ocean.radius - generated.ocean.radius) < 0.01)
  // Each imported island is found at its generated twin. Its measured shoreline points are laid against the
  // twin's real shoreline (in the twin's own bearings): they should lie on it.
  let worst = 0
  let matched = 0
  for (const island of read.islands) {
    const twin = generated.islands.find((g) => arc(g.dir, island.dir) < 0.15)
    if (!twin) continue
    matched++
    const mine = islandFrame(island.dir)
    const theirs = islandFrame(twin.dir)
    for (let k = 0; k < 36; k++) {
      const theta = (k / 36) * Math.PI * 2
      const angle = island.shape.shorelineAt(theta) / R
      const point = island.dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(mine.t1, Math.cos(theta) * Math.sin(angle)).addScaledVector(mine.t2, Math.sin(theta) * Math.sin(angle))
      const thetaTwin = Math.atan2(point.dot(theirs.t2), point.dot(theirs.t1))
      worst = Math.max(worst, Math.abs(arc(point, twin.dir) - twin.shape.shorelineAt(thetaTwin)))
    }
  }
  check('wake world: every island matches a generated island', matched === read.islands.length, `${matched} of ${read.islands.length}`)
    check('wake world: the measured coastlines lie on the generated ones', worst < 0.25, `worst difference ${worst.toFixed(2)} units`)
  check('wake world: rocks and the shore bodies', read.rocks.length === generated.rocks.length && read.bodies.length <= WORLD.maxBodies, `${read.rocks.length} rocks, ${read.bodies.length} bodies`)
  check('wake world: colliders are islands, rocks and the dock, each with a reach that covers the biggest hull', read.colliders.length === read.islands.length + read.rocks.length + 1 && read.colliders.every((c) => c.reach > 0 && (c.kind === 'circle' || c.shape.maxShoreline + BOAT.shoreMargin <= c.reach)))
}

// ---- the new worlds in public/models/worlds ------------------------------------------------------------------
for (const file of readdirSync('public/models/worlds').filter((f) => f.endsWith('.glb'))) {
  const id = file.replace(/\.glb$/, '')
  const layout = await load(`public/models/worlds/${file}`)
  const problems = []
  if (!layout.islands.length) problems.push('no islands')
  if (layout.fishingSpots.length < 1 || layout.fishingSpots.length > 6) problems.push(`${layout.fishingSpots.length} fishing spots (1 to 6 fit)`)
  if (layout.bodies.length > WORLD.maxBodies) problems.push('too many shore bodies')
  for (const island of layout.islands) {
    const reach = Math.max(...Array.from({ length: 36 }, (_, k) => island.shape.shorelineAt((k / 36) * Math.PI * 2)))
    if (!(reach > 0.2)) problems.push(`${island.name}: no shoreline found`)
    if (island.radius > 0 && reach > island.radius * 2.5) problems.push(`${island.name}: shoreline ${reach.toFixed(2)} vs extras ${island.radius.toFixed(2)}`)
  }
  // the boat must not start on land
  for (const c of layout.colliders) {
    const away = arc(layout.start.dir, c.dir)
    const limit = c.kind === 'island' ? c.shape.maxShoreline : c.radius
    if (away < limit + BOAT.shoreMargin) problems.push(`the start is inside ${c.kind} collider`)
  }
  // The dock: on clear water, and its own circle stops a boat.
  {
    const dock = layout.colliders.at(-1)
    const others = layout.colliders.slice(0, -1)
    const clearance = Math.min(...others.map((c) => arc(layout.harbour.dir, c.dir) - (c.kind === 'island' ? c.shape.maxShoreline : c.radius)))
    if (!(clearance > 0.5)) problems.push(`the harbour is only ${clearance.toFixed(2)} from land`)
    if (layout.buoys.some((b) => arc(b.dir, layout.harbour.dir) < 0.6)) problems.push('a buoy is at the harbour')
    if (layout.fishingSpots.some((s) => arc(s.dir, layout.harbour.dir) < 0.9)) problems.push('a fishing spot is at the harbour')
    if (arc(layout.harbour.dir, layout.start.dir) > 4) problems.push('the harbour is far from the start')
    if (dock.kind !== 'circle') problems.push('the last collider is not the dock')
  }
  // Sail into every island and every rock: the collision must stop the boat short of the land (and not throw).
  for (const collider of layout.colliders) {
    const { t1, t2 } = collider.kind === 'island' ? collider.shape : islandFrame(collider.dir)
    const reachHere = collider.kind === 'island' ? collider.shape.shorelineAt(0.7) : collider.radius
    const angle = (reachHere * 0.5) / R // half way between the centre and the coast: inside
    const dir = collider.dir.clone().multiplyScalar(Math.cos(angle)).addScaledVector(t1, Math.cos(0.7) * Math.sin(angle)).addScaledVector(t2, Math.sin(0.7) * Math.sin(angle))
    const boat = createBoatState(dir, t1.clone())
    try {
      for (let i = 0; i < 90; i++) resolveCollisions(boat, [collider], 1 / 60)
    } catch (error) {
      problems.push(`${collider.kind} collision throws: ${error.message}`)
      break
    }
    const out = arc(boat.dir, collider.dir)
    if (!(out > reachHere * 0.5 + 0.02)) problems.push(`a boat inside a ${collider.kind} is not pushed out`)
  }
  for (const spot of layout.fishingSpots) if (layout.colliders.some((c) => arc(spot.dir, c.dir) < (c.kind === 'island' ? c.shape.maxShoreline : c.radius))) problems.push('a fishing spot is on land')
  check(`world "${id}": ${layout.islands.length} islands, ${layout.rocks.length} rocks, ${layout.buoys.length} buoys, ${layout.fishingSpots.length} spots`, problems.length === 0, problems.join('; '))
}

console.log(failed ? `\n${failed} world check(s) FAILED` : '\nall world checks passed')
process.exit(failed ? 1 : 0)
