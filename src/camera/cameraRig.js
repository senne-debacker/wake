import { Quaternion, Vector3 } from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLANET, CAMERA } from '../config.js'
import { createChaseCamera } from './chaseCamera.js'
import { createIntroCamera } from './introCamera.js'

// The ways to look at the planet:
//   title   a close-up of the boat for the start screen (camera/introCamera.js)
//   pan     the swing from the title view round to behind the boat, started by `pan()`
//   chase   the game camera
//   planet  a free orbit around the planet's centre
// OrbitControls reads camera.up only when it is created, so the orbit controls are rebuilt
// whenever we switch to them.
export function createCameraRig(camera, domElement, state) {
  const chase = createChaseCamera(camera)
  const intro = createIntroCamera(camera)
  const opening = { phase: 'title', t: 0, seconds: 1, onDone: null } // phase: title -> panning -> done
  let orbit = null
  const lastDir = new Vector3() // where the boat was last frame, to carry the planet view along
  const carry = new Quaternion()

  // Switching between chase and planet view glides: the camera is blended from the pose it had
  // when the key was pressed to the pose of the new view, which keeps moving with the boat. The
  // orbit controls keep their own "true" pose underneath (they read the camera every frame), so
  // that pose is saved and restored around the blend.
  const glide = { active: false, t: 0, fromPos: new Vector3(), fromQuat: new Quaternion(), restore: false }
  const truePos = new Vector3()
  const toQuat = new Quaternion()
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
  const dirA = new Vector3()
  const dirB = new Vector3()
  const arc = new Quaternion()
  const identity = new Quaternion()
  const full = new Quaternion()

  function startGlide() {
    glide.active = true
    glide.t = 0
    glide.restore = false
    glide.fromPos.copy(camera.position)
    glide.fromQuat.copy(camera.quaternion)
  }

  function applyGlide(delta) {
    glide.t += delta / CAMERA.switchSeconds
    if (glide.t >= 1) {
      glide.active = false
      return
    }
    const k = ease(glide.t)
    // Position: turn round the planet centre (not a straight line) while the distance changes.
    dirA.copy(glide.fromPos)
    dirB.copy(camera.position)
    const [lengthA, lengthB] = [dirA.length(), dirB.length()]
    full.setFromUnitVectors(dirA.normalize(), dirB.normalize())
    arc.slerpQuaternions(identity, full, k) // the part of the way round that we are at
    camera.position.copy(dirA).applyQuaternion(arc).multiplyScalar(lengthA + (lengthB - lengthA) * k)
    toQuat.copy(camera.quaternion)
    camera.quaternion.copy(glide.fromQuat).slerp(toQuat, k)
  }

  chase.snap(state)

  addEventListener('wheel', (event) => {
    if (!orbit && opening.phase === 'done') chase.zoomBy(Math.exp(event.deltaY * 0.001)) // not during the title and the swing round
  }, { passive: true })

  // Drag with the mouse to look round the boat; double-click puts the camera back behind it.
  let dragging = false
  addEventListener('pointerdown', (event) => {
    if (event.target !== domElement || event.button !== 0 || orbit || opening.phase !== 'done') return
    dragging = true
    domElement.setPointerCapture(event.pointerId)
  })
  addEventListener('pointermove', (event) => {
    if (dragging) chase.look(-event.movementX * CAMERA.dragSpeed, event.movementY * CAMERA.dragSpeed)
  })
  for (const type of ['pointerup', 'pointercancel']) addEventListener(type, () => (dragging = false))
  addEventListener('dblclick', (event) => {
    if (event.target === domElement) chase.resetLook()
  })

  function enterOrbit() {
    camera.up.set(0, 1, 0)
    camera.position.copy(state.dir).multiplyScalar(PLANET.radius * 2.8).add({ x: 0.3, y: 0.8, z: 0.3 })
    orbit = new OrbitControls(camera, domElement)
    orbit.enableDamping = true
    orbit.minDistance = PLANET.radius * 1.3
    orbit.maxDistance = PLANET.radius * 6
    lastDir.copy(state.dir)
    orbit.update()
  }

  // Planet view follows the boat: whenever it moves round the sphere, the whole orbit camera
  // (position, up and the controls' own frame) is turned by the same rotation, so the view
  // relative to the boat stays as the player left it, and can still be orbited and zoomed.
  function followBoat() {
    carry.setFromUnitVectors(lastDir, state.dir)
    lastDir.copy(state.dir)
    camera.position.applyQuaternion(carry)
    camera.up.applyQuaternion(carry)
    orbit._quat.setFromUnitVectors(camera.up, new Vector3(0, 1, 0))
    orbit._quatInverse.copy(orbit._quat).invert()
  }

  function leaveOrbit() {
    orbit.dispose()
    orbit = null
    chase.snap(state)
  }

  return {
    get mode() {
      return orbit ? 'planet' : 'chase'
    },

    // Swing from the title view to the chase view over `seconds`, then call `onDone`.
    pan(seconds, onDone) {
      opening.phase = 'panning'
      opening.t = 0
      opening.seconds = seconds
      opening.onDone = onDone
    },

    update(delta, planetView, time = 0, driving = false) {
      if (opening.phase !== 'done') {
        if (opening.phase === 'panning') opening.t += delta / opening.seconds
        const finished = opening.t >= 1
        intro.update(state, finished ? 1 : opening.t, time)
        if (finished) {
          opening.phase = 'done'
          chase.snap(state) // hand over to the chase camera: it is at exactly this pose
          opening.onDone?.()
        }
        return
      }

      if (planetView && !orbit) {
        startGlide()
        enterOrbit()
      } else if (!planetView && orbit) {
        startGlide()
        leaveOrbit()
      }

      if (orbit) {
        if (glide.restore) camera.position.copy(truePos) // undo last frame's blend
        followBoat()
        orbit.update()
        truePos.copy(camera.position)
      } else chase.update(state, delta, dragging, driving)

      if (glide.active) applyGlide(delta)
      glide.restore = glide.active && orbit !== null
    },
  }
}
