import { WebGPURenderer, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, Group, Box3, Vector3, AnimationMixer } from 'three/webgpu'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// The 3D fish of the logbook. A fish with a model file (public/models/fish/<world>/<id>.glb, see blender/FISH.md)
// is shown in the logbook's picture frame as a small live 3D scene instead of its flat SVG: it turns gently back
// and forth (drag it with the mouse or a finger to turn it yourself: it eases back to the sway a moment after
// you let go), and plays the animation that came with the model (swimming) when there is one. Without a file the
// logbook keeps the SVG. The scene has its own small renderer (the game's renderer draws the world, and the
// logbook is a layer of the page above it), made the first time a model is shown, and it only draws while the
// logbook is open.

// Which fish have a model: scripts/buildModelLists.mjs writes models/fish/fish3d.json, a list of "<world>/<id>".
export async function loadFishModels() {
  try {
    const response = await fetch(new URL('models/fish/fish3d.json', document.baseURI).href)
    if (!response.ok) throw new Error(response.statusText)
    return new Set(await response.json())
  } catch {
    return new Set() // no list: every fish stays a picture
  }
}

const LENGTH = 2.0 // the length of the fish on screen, in the viewer's own units
const SWAY = 0.55 // radians of turning to each side: enough to see that it is a solid thing
const DRAG_YAW = 0.012 // radians of turning per pixel dragged sideways
const DRAG_PITCH = 0.008 // ... and up and down (limited to PITCH_LIMIT)
const PITCH_LIMIT = 0.7
const RESUME_AFTER = 1.6 // seconds after letting go until it eases back to swaying

export function createFishViewer() {
  const scene = new Scene()
  const camera = new PerspectiveCamera(28, 2, 0.1, 50)
  camera.position.set(0.4, 0.35, 3.0)
  camera.lookAt(0, 0, 0)
  scene.add(new HemisphereLight(0xffffff, 0x8a7a66, 1.9))
  const sun = new DirectionalLight(0xfff1d6, 2.4)
  sun.position.set(2, 3, 4)
  scene.add(sun)

  let renderer = null
  let starting = null // the renderer is created the first time a model is shown
  let host = null // the element the canvas sits in
  let running = false
  let frame = 0
  let last = 0
  let time = 0
  let shown = null // { pivot, mixer }
  let token = 0 // a newer show() makes older, slower ones give up
  const loaded = new Map() // "<world>/<id>" -> Promise of { root, clips }
  const size = { w: 0, h: 0 }
  const user = { yaw: 0, pitch: 0, sway: 1, idle: 0, dragging: null } // what the hand did; `sway` (0..1) is how much of the gentle turning is back

  function start() {
    starting ??= (async () => {
      renderer = new WebGPURenderer({ alpha: true, antialias: true })
      await renderer.init()
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      listen(renderer.domElement)
    })()
    return starting
  }

  // Dragging turns the fish: sideways spins it round (as far as you like), up and down tips it a little.
  function listen(canvas) {
    canvas.style.touchAction = 'none' // (a finger drags the fish, it does not scroll the page)
    canvas.style.cursor = 'grab'
    canvas.addEventListener('pointerdown', (event) => {
      user.dragging = { id: event.pointerId, x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
      user.sway = 0
    })
    canvas.addEventListener('pointermove', (event) => {
      const grab = user.dragging
      if (!grab || grab.id !== event.pointerId) return
      user.yaw += (event.clientX - grab.x) * DRAG_YAW
      user.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, user.pitch + (event.clientY - grab.y) * DRAG_PITCH))
      grab.x = event.clientX
      grab.y = event.clientY
    })
    const release = (event) => {
      if (user.dragging?.id !== event.pointerId) return
      user.dragging = null
      user.idle = 0
      user.yaw = Math.atan2(Math.sin(user.yaw), Math.cos(user.yaw)) // (the shortest way back, not all the turns again)
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerup', release)
    canvas.addEventListener('pointercancel', release)
  }

  // Loads the model once. The model is turned so that its nose (towards -Z in glTF, which is where Blender's +Y
  // goes) points right like the SVG, centred, and scaled to LENGTH.
  function load(key) {
    if (!loaded.has(key)) {
      loaded.set(
        key,
        new GLTFLoader().loadAsync(new URL(`models/fish/${key}.glb`, document.baseURI).href).then((gltf) => {
          const root = gltf.scene
          root.traverse((node) => {
            if (!node.isMesh) return
            for (const material of [node.material].flat()) material.flatShading = true // the low-poly look, like the boats
          })
          root.updateMatrixWorld(true)
          const box = new Box3().setFromObject(root)
          const centre = box.getCenter(new Vector3())
          const extent = box.getSize(new Vector3())
          const pivot = new Group()
          const turn = new Group() // the nose to the right
          turn.rotation.y = -Math.PI / 2
          root.position.sub(centre)
          turn.add(root)
          pivot.add(turn)
          pivot.scale.setScalar(LENGTH / Math.max(extent.x, extent.z, 1e-6))
          return { pivot, root, clips: gltf.animations }
        }),
      )
    }
    return loaded.get(key)
  }

  function resize() {
    const w = host?.clientWidth ?? 0
    const h = host?.clientHeight ?? 0
    if (!w || !h || (w === size.w && h === size.h)) return
    size.w = w
    size.h = h
    renderer.setSize(w, h, false) // (the canvas is sized by the style sheet: 100% of the frame)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function tick(now) {
    frame = requestAnimationFrame(tick)
    if (!running || !renderer || !host) return
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now
    time += delta
    resize()
    if (shown) {
      shown.mixer?.update(delta)
      if (!user.dragging) {
        user.idle += delta
        if (user.idle > RESUME_AFTER) {
          const ease = 1 - Math.exp(-delta * 2.5)
          user.yaw -= user.yaw * ease // back to the middle of the sway, and the sway grows back in
          user.pitch -= user.pitch * ease
          user.sway += (1 - user.sway) * ease
        }
      }
      shown.pivot.rotation.order = 'YXZ'
      shown.pivot.rotation.y = user.yaw + Math.sin(time * 0.7) * SWAY * user.sway
      shown.pivot.rotation.x = user.pitch
      shown.pivot.position.y = Math.sin(time * 1.3) * 0.03 // a little bob, like it is hanging in the water
    }
    renderer.render(scene, camera)
  }

  return {
    // Shows the model of `key` ("<world>/<id>") in the element `container`. Resolves true when it is showing,
    // false when it could not be loaded (then the logbook keeps the SVG).
    async show(key, container) {
      const mine = ++token
      try {
        await start()
        const model = await load(key)
        if (mine !== token) return false
        if (shown) scene.remove(shown.pivot)
        shown = { pivot: model.pivot, mixer: null }
        if (model.clips.length) {
          shown.mixer = new AnimationMixer(model.root)
          for (const clip of model.clips) shown.mixer.clipAction(clip).play() // (they loop)
        }
        scene.add(model.pivot)
        host = container
        container.replaceChildren(renderer.domElement)
        size.w = size.h = 0
        time = 0
        Object.assign(user, { yaw: 0, pitch: 0, sway: 1, idle: 0, dragging: null }) // (a new fish starts in the middle)
        if (!running) {
          running = true
          last = performance.now()
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(tick)
        }
        return true
      } catch (error) {
        console.warn(`Fish model ${key} could not be shown:`, error)
        return false
      }
    },
    // Where the hand has turned the fish (radians), for the checks.
    get angles() {
      return { yaw: user.yaw, pitch: user.pitch, dragging: Boolean(user.dragging), sway: user.sway }
    },
    // The picture is an SVG again (another fish, or the logbook was closed).
    hide() {
      token++
      running = false
      cancelAnimationFrame(frame)
      if (shown) scene.remove(shown.pivot)
      shown = null
      host = null
    },
  }
}
