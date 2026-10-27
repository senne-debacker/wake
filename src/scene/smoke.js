import { InstancedMesh, IcosahedronGeometry, MeshStandardNodeMaterial, Object3D, Vector3, Color } from 'three/webgpu'

// Smoke from a boat's chimney: low-poly puffs that leave the funnel, rise, drift and are left behind in the
// world (so a moving boat draws a trail). A puff is a flat-shaded icosahedron that swells and then shrinks;
// the colour goes from soft grey at idle to dark grey at full throttle. All puffs are one InstancedMesh.
// Which boats smoke: scene/boat.js finds the chimney by name (an empty "Smoke", else a node starting with
// "Funnel", "Chimney" or "Stack"); `update` gets its world position, or null for a boat without one.

const COUNT = 64
const LIGHT = new Color('#dcd7cc')
const DARK = new Color('#5f5b57')

export const SMOKE = {
  life: 2.8, // seconds a puff lives
  rise: 0.16, // how fast it climbs away from the planet (units / s)
  idleRate: 2.6, // puffs per second at a standstill
  fullRate: 8, // ... at full throttle (a little more with boost)
  startSize: 0.011,
  endSize: 0.05,
  drag: 1.2, // 1 / s: how fast a puff loses the boat's speed
}

export function createSmoke() {
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0, flatShading: true, transparent: true, opacity: 0.88, depthWrite: false })
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), material, COUNT)
  mesh.name = 'smoke'
  mesh.frustumCulled = false
  mesh.count = COUNT
  const puffs = Array.from({ length: COUNT }, () => ({ age: 1, life: 1, position: new Vector3(), velocity: new Vector3(), spin: 0, size: 0 }))
  const dummy = new Object3D()
  const last = new Vector3()
  const velocity = new Vector3()
  const up = new Vector3()
  const colour = new Color()
  let hasLast = false
  let carry = 0 // fraction of a puff left over between frames
  let next = 0 // the next puff to (re)use

  // Park every puff out of sight.
  dummy.scale.setScalar(0)
  dummy.updateMatrix()
  for (let i = 0; i < COUNT; i++) {
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, LIGHT)
  }

  function spawn(at, boatVelocity, heat) {
    const index = next
    const puff = puffs[index]
    next = (next + 1) % COUNT
    puff.age = 0
    puff.life = SMOKE.life * (0.8 + Math.random() * 0.4)
    puff.position.copy(at).addScaledVector(up.copy(at).normalize(), 0.01)
    puff.velocity.copy(boatVelocity).multiplyScalar(0.8)
    puff.velocity.x += (Math.random() - 0.5) * 0.16 // a lazy drift to the side
    puff.velocity.z += (Math.random() - 0.5) * 0.16
    puff.spin = Math.random() * Math.PI * 2
    puff.size = 0.85 + Math.random() * 0.4
    mesh.setColorAt(index, colour.copy(LIGHT).lerp(DARK, heat))
    mesh.instanceColor.needsUpdate = true
  }

  return {
    mesh,
    // delta: game seconds (0 while paused)   at: Vector3 (world) of the chimney's mouth, or null
    // power 0..1.3: the throttle (a little over 1 with boost)
    update(delta, at, power = 0) {
      if (delta > 0) {
        if (at) {
          // the boat's own velocity from where the chimney was last frame (puffs start with it)
          if (hasLast) velocity.copy(at).sub(last).divideScalar(delta).clampLength(0, 3)
          else velocity.set(0, 0, 0)
          last.copy(at)
          hasLast = true
          const rate = SMOKE.idleRate + (SMOKE.fullRate - SMOKE.idleRate) * Math.min(1.3, power)
          carry += rate * delta
          while (carry >= 1) {
            carry -= 1
            spawn(at, velocity, Math.min(1, power))
          }
        } else hasLast = false

        for (const puff of puffs) {
          if (puff.age >= puff.life) continue
          puff.age += delta
          up.copy(puff.position).normalize()
          puff.velocity.multiplyScalar(Math.exp(-SMOKE.drag * delta))
          puff.position.addScaledVector(puff.velocity, delta).addScaledVector(up, SMOKE.rise * delta)
          // (the speed it started with also has a part along the planet's normal: keep the puff above the water)
        }
      }

      for (let i = 0; i < COUNT; i++) {
        const puff = puffs[i]
        const t = puff.age / puff.life
        if (t >= 1) {
          dummy.scale.setScalar(0)
        } else {
          const swell = Math.min(1, t * 3) // grows quickly, then slowly shrinks away
          const fade = 1 - Math.max(0, (t - 0.55) / 0.45) ** 1.5
          dummy.position.copy(puff.position)
          dummy.rotation.set(puff.spin, puff.spin * 0.7, 0)
          dummy.scale.setScalar((SMOKE.startSize + (SMOKE.endSize - SMOKE.startSize) * swell) * puff.size * fade)
        }
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
  }
}
