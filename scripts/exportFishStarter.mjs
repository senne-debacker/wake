// Makes blender/fish/fish-starter.glb: a small low-poly fish with a swim animation, to import into Blender as a
// reference for the size, the direction and the names (blender/FISH.md), and to see what the logbook does with a
// model that moves. The game does not use it.
//
//   npm run export:fish-starter
//
// Nose towards -Z in the file (that is +Y once Blender has imported it), belly down, about 1.04 long. The tail is
// its own object ("Tail") that turns about its front edge; the clip "Swim" wags it. A model can do the same with
// any animated objects (or a skeleton).
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.()
    })
  }
}

const THREE = await import('three')
const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')

const material = (name, colour, extra = {}) => Object.assign(new THREE.MeshStandardMaterial({ color: colour, roughness: 0.85, metalness: 0 }), { name }, extra)
const back = material('Body_Back', '#6d8fae')
const belly = material('Body_Belly', '#cdd9e3')
const fin = material('Fin', '#4a647c', { side: THREE.DoubleSide })
const white = material('Eye_White', '#ffffff')
const black = material('Eye_Pupil', '#0b0f14')

// A flat piece from points given as [z, y] pairs (the fish's side view, drawn on the plane x = 0)
function plate(points, x = 0) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)))
  const geometry = new THREE.ShapeGeometry(shape).rotateY(-Math.PI / 2).translate(x, 0, 0) // (x of the shape -> z of the world)
  return geometry
}

const fish = new THREE.Group()
fish.name = 'Fish'

// The body: an ellipsoid, the top half in the back colour and the bottom half in the belly colour
const half = (top) => {
  const geometry = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2).toNonIndexed()
  geometry.scale(0.17, 0.2, 0.52)
  return geometry
}
const bodyBack = new THREE.Mesh(half(true), back)
bodyBack.name = 'Body_Back'
const bodyBelly = new THREE.Mesh(half(false), belly)
bodyBelly.name = 'Body_Belly'
fish.add(bodyBack, bodyBelly)

// Fins: the dorsal fin, two side fins, and the tail on its own pivot at the back of the body
const dorsal = new THREE.Mesh(plate([[-0.12, 0.18], [0.05, 0.4], [0.2, 0.15]]), fin)
dorsal.name = 'Fin_Dorsal'
const sideLeft = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.14, -0.04, -0.1), new THREE.Vector3(0.3, -0.16, 0.06), new THREE.Vector3(0.13, -0.1, 0.1)]), fin)
sideLeft.name = 'Fin_Left'
const sideRight = sideLeft.clone()
sideRight.scale.x = -1
sideRight.name = 'Fin_Right'
fish.add(dorsal, sideLeft, sideRight)

const tail = new THREE.Group()
tail.name = 'Tail'
tail.position.set(0, 0, 0.48)
const tailFin = new THREE.Mesh(plate([[0, 0.02], [0.32, 0.25], [0.22, 0], [0.32, -0.25], [0, -0.02]]), fin)
tailFin.name = 'Tail_Fin'
tail.add(tailFin)
fish.add(tail)

for (const side of [-1, 1]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), white)
  eye.name = side < 0 ? 'Eye_Left' : 'Eye_Right'
  eye.position.set(0.125 * -side, 0.06, -0.33)
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), black)
  pupil.name = eye.name + '_Pupil'
  pupil.position.set(0.028 * -side, 0.005, -0.012)
  eye.add(pupil)
  fish.add(eye)
}

// The swim: the tail swings from side to side, the whole fish rolls a little (a loop of 1.2 seconds)
const quaternion = (axis, angle) => new THREE.Quaternion().setFromAxisAngle(axis, angle).toArray()
const times = [0, 0.3, 0.6, 0.9, 1.2]
const swing = [0, 0.5, 0, -0.5, 0].map((angle) => quaternion(new THREE.Vector3(0, 1, 0), angle)).flat()
const wobble = [0, 0.06, 0, -0.06, 0].map((angle) => quaternion(new THREE.Vector3(0, 1, 0), angle)).flat()
const clip = new THREE.AnimationClip('Swim', 1.2, [
  new THREE.QuaternionKeyframeTrack('Tail.quaternion', times, swing),
  new THREE.QuaternionKeyframeTrack('Fish.quaternion', times, wobble),
])

const scene = new THREE.Scene()
scene.add(fish)
const result = await new GLTFExporter().parseAsync(scene, { binary: true, animations: [clip] })
const target = fileURLToPath(new URL('../blender/fish/fish-starter.glb', import.meta.url))
mkdirSync(fileURLToPath(new URL('../blender/fish/', import.meta.url)), { recursive: true })
writeFileSync(target, Buffer.from(result))
console.log(`[fish] wrote blender/fish/fish-starter.glb (${(result.byteLength / 1024).toFixed(1)} KB)`)
