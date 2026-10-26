import { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, ExtrudeGeometry, Shape, MeshStandardNodeMaterial } from 'three/webgpu'
import { WORLD } from '../config.js'
import { createBoatState, createBoatPose, computeBoatPose } from '../physics/boat.js'

// The harbour: a small floating dock with a shed, crates and a lantern. It rides the waves like a buoy (the same
// CPU wave function), so it bobs in a storm. The lantern comes on at night. The dock is solid (a circle of
// WORLD.harbour.radius, see world/layout.js); dropping the anchor near it opens the harbour (main.js, harbour.js).
// Built in code, low-poly like the rest; local axes: +Y up, the long side of the dock along X, origin on the waterline.

const FOOTPRINT = { sampleHalfLength: 0.25, sampleHalfWidth: 0.2 }
const COLOURS = { wood: '#8a6a45', woodDark: '#5b432b', float: '#2d3a45', shed: '#b9543a', shedRoof: '#3b4a5c', crate: '#a98a58', lantern: '#ffcf70', rope: '#cdbb94' }

const material = (color, extra = {}) => new MeshStandardNodeMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...extra })

export function createHarbour(dir, heading) {
  const root = new Group()
  root.name = 'harbour'
  const model = new Group()
  root.add(model)
  const add = (geometry, mat, x, y, z, name) => {
    const mesh = new Mesh(geometry, mat)
    mesh.position.set(x, y, z)
    if (name) mesh.name = name
    model.add(mesh)
    return mesh
  }

  const wood = material(COLOURS.wood)
  const dark = material(COLOURS.woodDark)
  // The deck and the floats under it.
  add(new BoxGeometry(0.78, 0.04, 0.34), wood, 0, 0.05, 0, 'Dock_Deck')
  for (const z of [-0.12, 0.12]) add(new CylinderGeometry(0.05, 0.05, 0.74, 7).rotateZ(Math.PI / 2), material(COLOURS.float), 0, 0.0, z, 'Dock_Float')
  // Planks: thin dark lines across the deck.
  for (let i = -3; i <= 3; i++) add(new BoxGeometry(0.012, 0.045, 0.34), dark, i * 0.11, 0.052, 0)
  // Mooring posts at the corners.
  for (const [x, z] of [[-0.35, -0.14], [-0.35, 0.14], [0.35, -0.14], [0.35, 0.14]]) add(new CylinderGeometry(0.02, 0.025, 0.2, 6), dark, x, 0.17, z, 'Dock_Post')

  // The shed at the left end: a box and a gable roof.
  const shed = material(COLOURS.shed)
  add(new BoxGeometry(0.22, 0.17, 0.2), shed, -0.22, 0.155, 0, 'Dock_Shed')
  const gable = new Shape()
  gable.moveTo(-0.13, 0)
  gable.lineTo(0.13, 0)
  gable.lineTo(0, 0.11)
  gable.closePath()
  const roof = new Mesh(new ExtrudeGeometry(gable, { depth: 0.26, bevelEnabled: false }).translate(0, 0, -0.13).rotateY(Math.PI / 2), material(COLOURS.shedRoof))
  roof.position.set(-0.22, 0.24, 0)
  roof.name = 'Dock_Roof'
  model.add(roof)
  add(new BoxGeometry(0.06, 0.1, 0.012), dark, -0.22, 0.12, 0.103, 'Dock_Door')

  // Crates and a barrel.
  add(new BoxGeometry(0.1, 0.09, 0.1), material(COLOURS.crate), 0.08, 0.115, -0.08, 'Dock_Crate')
  add(new BoxGeometry(0.08, 0.07, 0.08), material(COLOURS.crate), 0.14, 0.105, 0.07, 'Dock_Crate')
  add(new CylinderGeometry(0.04, 0.04, 0.1, 8), dark, 0.0, 0.12, 0.09, 'Dock_Barrel')

  // The lantern on a post at the right end.
  add(new CylinderGeometry(0.012, 0.016, 0.34, 5), dark, 0.36, 0.27, 0, 'Dock_Lantern_Post')
  const glass = material(COLOURS.lantern, { emissive: COLOURS.lantern, emissiveIntensity: 0.1 })
  add(new SphereGeometry(0.035, 6, 4), glass, 0.36, 0.46, 0, 'Dock_Lantern')

  const state = createBoatState(dir, heading)
  const pose = createBoatPose()
  const place = (time, storm) => {
    computeBoatPose(state, time, storm, pose, FOOTPRINT)
    root.position.copy(pose.position)
    root.quaternion.copy(pose.quaternion)
  }
  place(0, 0)

  return {
    root,
    dir,
    radius: WORLD.harbour.radius,
    // Every frame: it rides the waves, and the lantern glows at night (`darkness` 0..1).
    update(elapsed, storm, darkness) {
      place(elapsed, storm)
      glass.emissiveIntensity = 0.1 + 2.4 * darkness
    },
  }
}
