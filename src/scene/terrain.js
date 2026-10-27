import { BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardNodeMaterial, Color, Vector3 } from 'three/webgpu'
import { PLANET, WORLD_PALETTE as P, waterEdge } from '../config.js'
import { createIslandShape } from '../physics/islandShape.js'

// One low-poly island, built as a polar grid on the sphere: a centre vertex and rings spaced `edge` apart, each
// ring with as many vertices as fit round it at that spacing (so the triangles are about `edge` everywhere, the
// same size as the sea's, not slivers near the centre). Neighbouring rings with different counts are zipped
// together. Each vertex sits at
//   direction  = the island centre rotated by (ring distance) along (bearing)
//   height     = a plateau profile * simplex noise, measured above sea level
// and the outer rim dips well below the waves so no skirt ever shows. The mesh
// is non-indexed with one colour per triangle (cliff, sand, grass ...) so it
// matches the flat-shaded look of the water.

const R = PLANET.radius
const DEFAULT_EDGE = waterEdge(64) // the sea's triangle edge on a computer; main.js passes the one of the quality in use

export function createTerrain(island, edge = DEFAULT_EDGE) {
  // The shape (coastline, heights) is shared with the collision code.
  const shape = island.shape ?? createIslandShape(island)
  const { pointAt, outer } = shape

  // Vertex grid: ring k sits at u = k / rings and holds as many vertices as fit round it.
  const rings = Math.max(4, Math.ceil(outer / edge))
  const counts = Array.from({ length: rings + 1 }, (_, k) => (k === 0 ? 1 : Math.max(6, Math.round((2 * Math.PI * (k / rings) * outer) / edge))))
  const grid = counts.map((count, k) => (k === 0 ? [pointAt(0, 0)] : Array.from({ length: count }, (_, j) => pointAt(k / rings, (j / count) * Math.PI * 2))))

  // Triangles, wound counter-clockwise seen from outside.
  const triangles = []
  const first = grid[1]
  for (let j = 0; j < first.length; j++) triangles.push([grid[0][0], first[j], first[(j + 1) % first.length]])
  for (let ring = 2; ring <= rings; ring++) {
    // Zip the inner and outer ring: always advance the one whose next vertex comes first round the circle.
    const [inner, outer_] = [grid[ring - 1], grid[ring]]
    let [i, j] = [0, 0]
    while (i < inner.length || j < outer_.length) {
      const advanceOuter = i >= inner.length ? true : j >= outer_.length ? false : (j + 1) / outer_.length <= (i + 1) / inner.length
      if (advanceOuter) { triangles.push([inner[i % inner.length], outer_[j % outer_.length], outer_[(j + 1) % outer_.length]]); j++ }
      else { triangles.push([inner[i % inner.length], outer_[j % outer_.length], inner[(i + 1) % inner.length]]); i++ }
    }
  }

  // Non-indexed geometry with one colour per triangle.
  const colours = {
    sand: new Color(P.sand), cliff: new Color(P.cliff), cliffDark: new Color(P.cliffDark),
    top: new Color({ grass: P.grass, autumn: P.autumnGround, rock: P.rockTop }[island.ground] ?? P.grass),
  }
  const positions = []
  const colors = []
  const [edge1, edge2, normal, centroid, tint] = [new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Color()]
  triangles.forEach((triangle, index) => {
    centroid.set(0, 0, 0)
    for (const vertex of triangle) {
      centroid.add(vertex.point)
      positions.push(vertex.point.x, vertex.point.y, vertex.point.z)
    }
    centroid.divideScalar(3)
    edge1.subVectors(triangle[1].point, triangle[0].point)
    edge2.subVectors(triangle[2].point, triangle[0].point)
    normal.crossVectors(edge1, edge2).normalize()

    const height = centroid.length() - R
    const upright = normal.dot(centroid.clone().normalize()) // 1 = flat, small = cliff
    const hash = Math.sin(index * 12.9898 + island.seed) * 43758.5453
    const jitter = 0.93 + 0.14 * (hash - Math.floor(hash)) // +-7% brightness per triangle
    if (height < 0.12) tint.copy(colours.sand)
    else if (upright < 0.8) tint.copy(index % 2 ? colours.cliff : colours.cliffDark)
    else tint.copy(colours.top)
    tint.multiplyScalar(jitter)
    for (let v = 0; v < 3; v++) colors.push(tint.r, tint.g, tint.b)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()

  const mesh = new Mesh(geometry, new MeshStandardNodeMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }))
  mesh.name = island.name

  return { mesh, pointAt, centre: grid[0][0], outer }
}
