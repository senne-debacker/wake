import { float, vec3, smoothstep, mix } from 'three/tsl'
import { PLANET, SEA_ZONES } from '../config.js'
import { uniforms } from '../uniforms.js'

// The colour of the sea where a world paints it (a lagoon, deep water, a blue hole): round patches, tested per pixel so
// that their edges stay round on the faceted water. Returns { tint, cover }: the patch's colour and how much of a patch
// covers this point (0 = none, the sea keeps the normal palette; every world without Sea_ layers is all 0).
const edge = SEA_ZONES.edge / PLANET.radius // half the width of the soft edge, as an angle

export function seaZones(dir) {
  let tint = vec3(0, 0, 0)
  let cover = float(0)
  for (let i = 0; i < SEA_ZONES.count; i++) {
    const zone = uniforms.seaZones.element(i)
    // zone.w is the cosine of the radius; the two cosines are near it, so a first-order step is exact enough
    const width = float(edge).mul(zone.w.mul(zone.w).oneMinus().max(0).sqrt())
    const inside = smoothstep(zone.w.sub(width), zone.w.add(width).add(1e-5), dir.dot(zone.xyz))
    tint = mix(tint, uniforms.seaZoneColors.element(i), inside)
    cover = cover.max(inside)
  }
  return { tint, cover }
}
