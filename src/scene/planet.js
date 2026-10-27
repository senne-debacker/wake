import { IcosahedronGeometry, Mesh } from 'three/webgpu'
import { PLANET } from '../config.js'
import { createWaterMaterial } from '../tsl/waterMaterial.js'

// The sea is an icosphere: `detail` splits every edge of the 20 faces into (detail + 1) pieces, so it has
// 20 * (detail + 1)^2 triangles (32: 21,780, 48: 48,020, 64: 84,500). Smaller triangles show the waves in more
// detail (and cost more on the GPU: every vertex runs the wave noise). Non-indexed geometry: every triangle owns
// its vertices, which is what gives the faceted low-poly look together with flat shading.
export const waterTriangles = (detail) => 20 * (detail + 1) ** 2

// `fish`: the fish's buffers (scene/fish.js), whose shadows the water paints.
export function createPlanet(fish, detail = PLANET.detail) {
  const geometry = new IcosahedronGeometry(PLANET.radius, detail)
  const mesh = new Mesh(geometry, createWaterMaterial(fish.boids))
  mesh.userData.detail = detail
  mesh.name = 'planet-water'
  // Vertices are displaced on the GPU, so the CPU-side bounding sphere is too
  // small by up to the wave amplitude; never frustum-cull the planet.
  mesh.frustumCulled = false
  return mesh
}

// Gives the sea another detail level at run time (developer panel > View > Water detail).
export function setWaterDetail(mesh, detail) {
  if (mesh.userData.detail === detail) return
  mesh.geometry.dispose()
  mesh.geometry = new IcosahedronGeometry(PLANET.radius, detail)
  mesh.userData.detail = detail
}
