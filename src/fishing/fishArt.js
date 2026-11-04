// Draws a low-poly fish as inline <svg> markup from a short description, so a species needs a dozen
// words of art direction instead of a hand-placed polygon list. Same rules as the hand-drawn fish in
// fishDatabase.js: 120 x 60, faces right, flat polygons, no id= / url(#), no scripts.
//
// The description (`art`):
//   body     'torpedo' | 'deep' | 'long' | 'eel' | 'round' | 'blunt' | 'ray'   the outline
//   back, belly            the two body colours (the facets are lighter and darker mixes of them)
//   fin      fin colour (default: a darker back)       accent   stripes, spots and plates
//   h        half the body's height (default per body)  tail    'fork' | 'lunate' | 'round' | 'fan' | 'none'
//   dorsal   'tri' | 'sail' | 'spiny' | 'long' | 'two' | 'none'
//   stripes  number of upright bands     spots    number of dots     plates   number of armour plates
//   barbels, teeth, spikes, crest        true: whiskers, a row of teeth, spines along the back, a crown
//   lure     true: an angler's lamp      tusk     true: a long bill or horn from the nose
//   glow     colour: the eye (or lamp) gets a halo of this colour
//   seed     moves the dots about
// More, each optional (the Sunken Ruins fish use them):
//   body 'box' (a blocky fish) and 'bell' (a bronze bell with the opening at the nose)
//   eyeDark  true: a black eye with a small white highlight (instead of a white eye with a pupil)
//   scales   rows of round scales over the body     scaleColour   their colour    spotSize   makes the dots bigger
//   bricks   true: mortar lines like a brick wall   mortar        their colour
//   tiles    (a ray) the colours of floor tiles over its back
//   trailing true: two long trailing filaments      aura  colour: a faint halo round the whole fish
//   bigMouth true: a wide dark mouth                jaw   true: a lower jaw that juts out and up    crestSize  size of the crest
//   silhouette true: the same shape in one dark colour, for a fish that has not been caught yet
// And for the river fish:
//   eyeRing (a colour: a ring round the eye)   eyeScale (a bigger or smaller eye)   lateral (a colour: a stripe along the side)
//   spotRow (n dots in a row, spotFrom / spotTo along the body, spotLine how far down)   spotRing (n dots in a ring)
//   diagonal (with stripes: slanted bands, like a rope)   barbels as a number (4, 6...) and chinBarbel (one whisker)
//   barbelWidth   dorsalSpots (a colour: dots on a sail fin)   tailSpot (a dark dot near the tail)   knot (a whisker tied in a knot)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
export const mix = (a, b, t) => '#' + [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0')).join('')
const lighter = (c, t) => mix(c, '#ffffff', t)
const darker = (c, t) => mix(c, '#000000', t)
const f = (n) => Math.round(n * 10) / 10
const points = (list) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')
const poly = (list, fill, extra = '') => `  <polygon points="${points(list)}" fill="${fill}"${extra}/>`

// Body templates: half-height multipliers at the stations u = 0 (the tail) .. 1 (the nose).
const U = [0, 0.17, 0.34, 0.52, 0.7, 0.88, 1]
const BODIES = {
  torpedo: { h: 13, top: [0.3, 0.62, 0.88, 1, 0.82, 0.45, 0], bottom: [0.26, 0.55, 0.8, 0.92, 0.78, 0.42, 0], nose: 112, tailX: 24 },
  deep: { h: 18, top: [0.28, 0.7, 1, 1.05, 0.85, 0.45, 0], bottom: [0.3, 0.75, 1, 1, 0.85, 0.5, 0], nose: 110, tailX: 26 },
  long: { h: 8, top: [0.34, 0.55, 0.68, 0.72, 0.66, 0.42, 0], bottom: [0.3, 0.5, 0.62, 0.66, 0.6, 0.38, 0], nose: 114, tailX: 22 },
  eel: { h: 6, top: [0.5, 0.8, 1, 1, 0.95, 0.7, 0], bottom: [0.5, 0.8, 1, 1, 0.95, 0.7, 0], nose: 112, tailX: 10, wave: 7 },
  round: { h: 21, top: [0.34, 0.8, 1, 1, 0.94, 0.6, 0], bottom: [0.34, 0.8, 1, 1, 0.94, 0.6, 0], nose: 106, tailX: 30 },
  box: { h: 15, top: [0.85, 1, 1, 1, 1, 0.9, 0], bottom: [0.85, 1, 1, 1, 1, 0.9, 0], nose: 108, tailX: 26 },
  blunt: { h: 17, top: [0.2, 0.42, 0.66, 0.9, 1, 0.78, 0], bottom: [0.2, 0.4, 0.58, 0.76, 0.95, 0.74, 0], nose: 110, tailX: 22 },
}

// A tiny repeatable random number generator for the dots.
function random(seed) {
  let s = (seed ?? 1) * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const SIL = '#222831' // the silhouette colour
// A silhouette: every colour becomes SIL and the faint things (halos) are gone.
const flatten = (markup) => markup.replace(/(fill|stroke)="#[0-9a-fA-F]{6}"/g, `$1="${SIL}"`).replace(/ opacity="[\d.]+"/g, '')
const eyeMarkup = (x, y, r, art) =>
  art.eyeDark
    ? [`  <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#0b0f14"/>`, `  <circle cx="${f(x + r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.38)}" fill="#ffffff"/>`]
    : [`  <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${art.eye ?? '#ffffff'}"/>`, `  <circle cx="${f(x + 0.8)}" cy="${f(y)}" r="${f(r * 0.5)}" fill="#0b0f14"/>`]
const inside = (polygon, [x, y]) => {
  let yes = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) yes = !yes
  }
  return yes
}

// A bell: bronze, domed at the back, the opening (a dark ring) at the nose.
function bell(art) {
  const sil = Boolean(art.silhouette)
  const { back, belly, accent = darker(back, 0.4), fin = darker(back, 0.25) } = art
  // the profile flares from a narrow crown (left) to the wide opening (right), like a bell seen from the side
  const flare = [[28, 5], [34, 9], [44, 14], [58, 18], [74, 21], [88, 23], [98, 24]]
  const topEdge = flare.map(([x, k]) => [x, 30 - k])
  const bottomEdge = flare.map(([x, k]) => [x, 30 + k])
  const y = (edge, x) => {
    for (let i = 0; i < edge.length - 1; i++) if (x >= edge[i][0] && x <= edge[i + 1][0]) return edge[i][1] + ((edge[i + 1][1] - edge[i][1]) * (x - edge[i][0])) / (edge[i + 1][0] - edge[i][0])
    return edge[edge.length - 1][1]
  }
  const out = [
    poly([[27, 30], [8, 20], [14, 30], [8, 40]], fin),
    poly([[40, 42], [34, 53], [54, 47]], fin),
    poly([[78, 52], [76, 59], [94, 54]], fin),
    poly([[24, 30], ...topEdge, [102, 30]], back),
    poly([[24, 30], ...bottomEdge, [102, 30]], belly),
    poly([topEdge[1], topEdge[2], topEdge[3], [66, 22], [44, 27]], mix(back, belly, 0.3)),
    poly([topEdge[3], topEdge[4], topEdge[5], topEdge[6], [90, 18]], lighter(back, 0.18)),
    poly([bottomEdge[1], bottomEdge[2], bottomEdge[3], [62, 40], [42, 35]], lighter(belly, 0.25)),
    `  <ellipse cx="101" cy="30" rx="9" ry="25" fill="${lighter(belly, 0.12)}"/>`,
  ]
  if (!sil) {
    out.push(poly([[48, y(topEdge, 48) + 0.5], [52, y(topEdge, 52) + 0.5], [52, y(bottomEdge, 52) - 0.5], [48, y(bottomEdge, 48) - 0.5]], accent, ' opacity="0.75"'))
    out.push(poly([[70, y(topEdge, 70) + 0.5], [74, y(topEdge, 74) + 0.5], [74, y(bottomEdge, 74) - 0.5], [70, y(bottomEdge, 70) - 0.5]], accent, ' opacity="0.75"'))
    out.push(`  <ellipse cx="101" cy="30" rx="6" ry="20" fill="#2a2018"/>`, `  <circle cx="99" cy="38" r="4.5" fill="${darker(back, 0.3)}"/>`)
    out.push(...eyeMarkup(74, 22, 3.6, art))
  }
  return out
}

function ray(art) {
  const { back, belly, accent = darker(back, 0.35), fin = darker(back, 0.3) } = art
  const nose = [112, 30]
  const top = [66, 4]
  const bottom = [66, 56]
  const rear = [34, 30]
  const out = [
    `  <polyline points="34,30 4,30" fill="none" stroke="${fin}" stroke-width="2.4" stroke-linecap="round"/>`,
    poly([[8, 30], [2, 26], [5, 30], [2, 34]], fin),
    poly([nose, top, rear], back),
    poly([nose, bottom, rear], belly),
    poly([top, [66, 30], rear], mix(back, belly, 0.3)),
    poly([bottom, [66, 30], rear], lighter(belly, 0.3)),
    poly([nose, [88, 20], [88, 30]], lighter(back, 0.18)),
  ]
  if (art.silhouette) return out
  const dots = random(art.seed)
  for (let i = 0; i < (art.spots ?? 0); i++) {
    const x = 48 + dots() * 38
    const y = 30 + (dots() - 0.5) * 20
    out.push(`  <circle cx="${f(x)}" cy="${f(y)}" r="${f(1.3 + dots() * 1.2)}" fill="${accent}"/>`)
  }
  if (art.tiles) {
    // floor tiles: a grid of small squares in a few colours over the back, only where they fit on the wing
    const quad = [nose, top, rear, bottom]
    const size = 7
    let n = 0
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const x = 46 + gx * (size + 1)
        const y = 12 + gy * (size + 1)
        const corners = [[x, y], [x + size, y], [x + size, y + size], [x, y + size]]
        if (!corners.every((corner) => inside(quad, [corner[0] * 0.98 + 1, corner[1]]))) continue
        out.push(poly(corners, art.tiles[n++ % art.tiles.length]))
      }
    }
  }
  const eyes = [[98, 24], [98, 36]]
  if (art.glow) out.push(`  <circle cx="98" cy="30" r="9" fill="${art.glow}" opacity="0.28"/>`)
  for (const [ex, ey] of eyes) out.push(...(art.eyeDark ? eyeMarkup(ex, ey, 3, art) : [`  <circle cx="${ex}" cy="${ey}" r="3" fill="#fff"/>`, `  <circle cx="${ex + 1}" cy="${ey}" r="1.5" fill="#0b0f14"/>`]))
  return out
}

export function drawFish(art) {
  const sil = Boolean(art.silhouette)
  const svg = (parts) => {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">\n${parts.join('\n')}\n</svg>`
    return sil ? flatten(markup) : markup
  }
  if (art.body === 'ray') return svg(ray(art))
  if (art.body === 'bell') return svg(bell(art))

  const template = BODIES[art.body] ?? BODIES.torpedo
  const h = art.h ?? template.h
  const { top, bottom, nose, tailX } = template
  const wave = template.wave ?? 0
  const centre = (x) => 30 + wave * Math.sin(((x - tailX) / (nose - tailX)) * Math.PI * 2.2)
  const xs = U.map((u) => tailX + u * (nose - tailX))
  const upper = xs.map((x, i) => [x, centre(x) - h * top[i]])
  const lower = xs.map((x, i) => [x, centre(x) + h * bottom[i]])
  const middle = xs.map((x) => [x, centre(x)])
  const { back, belly } = art
  const fin = art.fin ?? darker(back, 0.28)
  const accent = art.accent ?? darker(back, 0.35)
  const out = []

  // Along the body at u (0..1): the top, bottom and centre.
  const at = (u) => {
    const x = tailX + u * (nose - tailX)
    const found = U.findIndex((value) => value > u)
    const i = found === -1 ? 5 : clamp(found - 1, 0, 5)
    const t = (u - U[i]) / (U[i + 1] - U[i])
    const lerp = (a, b) => a + (b - a) * t
    return { x, top: lerp(upper[i][1], upper[i + 1][1]), bottom: lerp(lower[i][1], lower[i + 1][1]), mid: centre(x) }
  }

  // --- tail
  const tail = art.tail ?? 'fork'
  const [tx, ty] = [tailX, centre(tailX)]
  const tl = art.tailLength ?? clamp(h * 1.1, 11, 20)
  const th = art.tailHeight ?? clamp(h * 1.0, 8, 17)
  const tailColour = art.tailColour ?? fin
  if (tail === 'fork') out.push(poly([[tx + 3, ty], [tx - tl, ty - th], [tx - tl * 0.55, ty]], tailColour), poly([[tx + 3, ty], [tx - tl * 0.55, ty], [tx - tl, ty + th]], darker(tailColour, 0.15)))
  else if (tail === 'lunate') out.push(poly([[tx + 3, ty - 2], [tx - tl * 0.9, ty - th * 1.25], [tx - tl * 0.2, ty]], tailColour), poly([[tx + 3, ty + 2], [tx - tl * 0.2, ty], [tx - tl * 0.9, ty + th * 1.25]], darker(tailColour, 0.15)))
  else if (tail === 'round' || tail === 'fan') {
    const k = tail === 'fan' ? 1.15 : 0.8
    out.push(poly([[tx + 3, ty - 3], [tx - tl * 0.8, ty - th * k], [tx - tl, ty]], tailColour), poly([[tx + 3, ty + 3], [tx - tl, ty], [tx - tl * 0.8, ty + th * k]], darker(tailColour, 0.15)))
  }

  // --- fins on the back and belly (drawn behind the body)
  const dorsal = art.dorsal ?? 'tri'
  const dh = art.dorsalHeight ?? clamp(h * 0.75, 6, 18)
  const place = (u0, u1, height, lean = 0.25) => {
    const a = at(u0)
    const b = at(u1)
    return poly([[a.x, a.top + 1.5], [a.x + (b.x - a.x) * lean, Math.min(a.top, b.top) - height], [b.x, b.top + 1.5]], fin)
  }
  if (dorsal === 'tri') out.push(place(0.34, 0.66, dh))
  else if (dorsal === 'sail') {
    const a = at(0.28)
    const b = at(0.72)
    out.push(poly([[a.x, a.top + 2], [a.x + 4, a.top - dh * 1.6], [b.x - 6, a.top - dh * 1.25], [b.x, b.top + 2]], fin), poly([[a.x + 4, a.top - dh * 1.6], [(a.x + b.x) / 2, a.top - dh * 0.5], [b.x - 6, a.top - dh * 1.25]], lighter(fin, 0.2)))
    if (art.dorsalSpots && !sil) for (const [px, py] of [[0.3, 0.95], [0.5, 0.78], [0.5, 1.1], [0.7, 0.9], [0.25, 0.7]]) out.push(`  <circle cx="${f(a.x + (b.x - a.x) * px)}" cy="${f(a.top - dh * py)}" r="1.6" fill="${art.dorsalSpots}"/>`)
  } else if (dorsal === 'spiny') {
    for (const [u0, u1] of [[0.3, 0.4], [0.4, 0.5], [0.5, 0.6], [0.6, 0.7]]) out.push(place(u0, u1, dh * (0.9 + u0 * 0.3), 0.1))
  } else if (dorsal === 'long') {
    const run = [0.2, 0.34, 0.5, 0.66, 0.8].map((u) => at(u))
    out.push(poly([[run[0].x, run[0].top + 2], ...run.map((p, i) => [p.x, p.top - dh * [0.4, 0.8, 0.9, 0.7, 0.35][i]]), [run[4].x, run[4].top + 2]], fin))
  } else if (dorsal === 'two') out.push(place(0.3, 0.5, dh), place(0.55, 0.7, dh * 0.6))

  const anal = [at(0.22), at(0.4)]
  out.push(poly([[anal[0].x, anal[0].bottom - 1.5], [anal[0].x - 4, anal[0].bottom + h * 0.45], [anal[1].x, anal[1].bottom - 1.5]], fin))
  const pelvic = [at(0.52), at(0.64)]
  out.push(poly([[pelvic[0].x, pelvic[0].bottom - 1.5], [pelvic[0].x - 3, pelvic[0].bottom + h * 0.4], [pelvic[1].x, pelvic[1].bottom - 1.5]], darker(fin, 0.12)))

  // --- the body in facets
  const nosePoint = [nose, centre(nose)]
  const tailPoint = [tailX, centre(tailX)]
  out.push(poly([nosePoint, ...upper.slice(0, 6).reverse(), tailPoint], back))
  out.push(poly([nosePoint, ...lower.slice(0, 6).reverse(), tailPoint], belly))
  out.push(poly([upper[1], upper[2], upper[3], upper[4], [xs[4], centre(xs[4])], [xs[3], centre(xs[3])], [xs[2], centre(xs[2])], [xs[1], centre(xs[1])]], mix(back, belly, 0.28)))
  out.push(poly([upper[2], upper[3], [xs[3], centre(xs[3]) - h * 0.35]], darker(back, 0.16)))
  out.push(poly([upper[4], upper[5], nosePoint, [xs[5], centre(xs[5])]], lighter(back, 0.14)))
  out.push(poly([lower[2], lower[3], lower[4], [xs[4], centre(xs[4]) + h * 0.12], [xs[2], centre(xs[2]) + h * 0.12]], lighter(belly, 0.3)))

  // --- markings
  const decor = (...lines) => {
    if (!sil) out.push(...lines)
  }
  const bands = art.stripes ?? 0
  for (let i = 0; i < bands; i++) {
    const u = 0.3 + (0.42 * (i + 0.5)) / bands
    const half = (0.42 / bands) * 0.3
    const a = at(u - half)
    const b = at(u + half)
    const lean = art.diagonal ? 3 : 0
    decor(poly([[a.x + lean, a.top + 1], [b.x + lean, b.top + 1], [b.x - lean, b.bottom - 1], [a.x - lean, a.bottom - 1]], accent, ' opacity="0.85"'))
  }
  const dots = random(art.seed)
  for (let i = 0; i < (art.spots ?? 0); i++) {
    const p = at(0.26 + dots() * 0.5)
    const y = p.top + (p.bottom - p.top) * (0.2 + dots() * 0.6)
    decor(`  <circle cx="${f(p.x)}" cy="${f(y)}" r="${f(clamp(h * 0.1, 1.3, 2.4) * (0.7 + dots() * 0.6) * (art.spotSize ?? 1))}" fill="${accent}"/>`)
  }
  const plates = art.plates ?? 0
  for (let i = 0; i < plates; i++) {
    const p = at(0.28 + (0.5 * i) / Math.max(1, plates - 1))
    const y = p.top + (p.bottom - p.top) * 0.28
    decor(poly([[p.x - 2.6, y], [p.x, y - 3.2], [p.x + 2.6, y], [p.x, y + 3.2]], accent))
  }
  if (art.lateral) {
    const a = at(0.12)
    const b = at(0.86)
    decor(poly([[a.x, a.mid - 1.5], [b.x, b.mid - 1.5], [b.x, b.mid + 1.5], [a.x, a.mid + 1.5]], art.lateral))
  }
  if (art.spotRow) {
    const from = art.spotFrom ?? 0.3
    const to = art.spotTo ?? 0.8
    for (let i = 0; i < art.spotRow; i++) {
      const p = at(from + ((to - from) * i) / Math.max(1, art.spotRow - 1))
      decor(`  <circle cx="${f(p.x)}" cy="${f(p.top + (p.bottom - p.top) * (art.spotLine ?? 0.4))}" r="${f(clamp(h * 0.14, 1.4, 2.4))}" fill="${accent}"/>`)
    }
  }
  if (art.spotRing) {
    for (let i = 0; i < art.spotRing; i++) {
      const angle = (i / art.spotRing) * Math.PI * 2
      const p = at(0.5 + Math.cos(angle) * 0.17)
      decor(`  <circle cx="${f(p.x)}" cy="${f(p.top + (p.bottom - p.top) * (0.5 + Math.sin(angle) * 0.3))}" r="2.3" fill="${art.spotRingColour ?? '#f6f4e8'}"/>`)
    }
  }
  if (art.tailSpot) {
    const p = at(0.14)
    decor(`  <circle cx="${f(p.x)}" cy="${f(p.mid - h * 0.1)}" r="${f(clamp(h * 0.16, 1.8, 3))}" fill="${accent}"/>`)
  }
  if (art.spikes) {
    for (let i = 0; i < 6; i++) {
      const p = at(0.22 + i * 0.1)
      out.push(poly([[p.x - 2, p.top + 1], [p.x - 0.5, p.top - 5], [p.x + 2, p.top + 1]], accent))
    }
  }

  // Round scales in staggered rows.
  if (art.scales) {
    const rows = art.scales
    const colour = art.scaleColour ?? lighter(back, 0.22)
    for (let r = 0; r < rows; r++) {
      const fy = 0.22 + (0.56 * (r + 0.5)) / rows
      for (let c = 0; c < 7; c++) {
        const u = 0.28 + c * 0.075 + (r % 2) * 0.035
        const p = at(u)
        if (u > 0.82) continue
        decor(`  <circle cx="${f(p.x)}" cy="${f(p.top + (p.bottom - p.top) * fy)}" r="${f(clamp(h * 0.17, 2.2, 3.6))}" fill="${colour}"/>`)
      }
    }
  }
  // Bricks: mortar lines in rows with staggered joints, over a boxy body.
  if (art.bricks) {
    const mortar = art.mortar ?? darker(back, 0.32)
    const x0 = at(0.2).x
    const x1 = at(0.84).x
    const rowsY = [-0.52, 0, 0.52].map((k) => centre(60) + h * k)
    rowsY.forEach((y, r) => {
      decor(poly([[x0, y - 0.7], [x1, y - 0.7], [x1, y + 0.7], [x0, y + 0.7]], mortar))
      const bandTop = r === 0 ? at(0.5).top + 1.5 : rowsY[r - 1] + 0.7
      for (let x = x0 + 8 + (r % 2) * 7; x < x1 - 3; x += 14) decor(poly([[x - 0.7, bandTop], [x + 0.7, bandTop], [x + 0.7, y - 0.7], [x - 0.7, y - 0.7]], mortar))
    })
    const lastTop = rowsY[2] + 0.7
    for (let x = x0 + 8 + 7; x < x1 - 3; x += 14) decor(poly([[x - 0.7, lastTop], [x + 0.7, lastTop], [x + 0.7, at(0.5).bottom - 1.5], [x - 0.7, at(0.5).bottom - 1.5]], mortar))
  }
  // Trailing filaments (a gourami's long pelvic fins).
  if (art.trailing) {
    const root = at(0.6)
    const colour = art.trailColour ?? lighter(fin, 0.2)
    out.push(poly([[root.x, root.bottom - 1], [root.x - 2.5, root.bottom + 1], [root.x - 34, root.bottom + 17], [root.x - 32, root.bottom + 14]], colour))
    out.push(poly([[root.x + 7, root.bottom - 1], [root.x + 4.5, root.bottom + 1], [root.x - 24, root.bottom + 19], [root.x - 22, root.bottom + 16]], darker(colour, 0.1)))
  }
  // A jaw that juts out and up (an arowana's).
  if (art.jaw) {
    const m = centre(nose)
    out.push(poly([[nose - 11, m + 2], [Math.min(119, nose + 6), m - 4], [Math.min(119, nose + 7), m - 1], [nose - 6, m + 8]], art.jawColour ?? lighter(belly, 0.1)))
  }
  // A wide dark mouth.
  if (art.bigMouth) {
    const m = centre(nose)
    decor(poly([[nose + 0.5, m - 1], [nose - 18, m + 0.5], [nose - 18, m + h * 0.55], [nose - 1, m + 5]], art.mouthColour ?? '#2a1f1f'))
  }

  // --- pectoral fin, gill, eye
  const gill = at(0.78)
  const fish = at(0.66)
  decor(poly([[fish.x, fish.mid - h * 0.05], [fish.x - 9, fish.mid + h * 0.28], [fish.x - 1, fish.mid + h * 0.42]], darker(fin, 0.1)))
  decor(`  <path d="M${f(gill.x)} ${f(gill.top + 4)} Q${f(gill.x - 4)} ${f(gill.mid)} ${f(gill.x)} ${f(gill.bottom - 4)}" fill="none" stroke="${darker(back, 0.4)}" stroke-width="1.5"/>`)
  const eyeAt = at(0.9)
  const eye = [eyeAt.x, eyeAt.mid - h * 0.18]
  const eyeR = clamp(h * 0.2, 2.2, 4.2) * (art.eyeScale ?? 1)
  if (art.eyeRing) decor(`  <circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(eyeR * 1.5)}" fill="${art.eyeRing}"/>`)
  if (art.glow && !art.lure) decor(`  <circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(eyeR * 2.3)}" fill="${art.glow}" opacity="0.3"/>`)
  decor(...eyeMarkup(eye[0], eye[1], eyeR, art))

  // --- extras at the head
  const mouth = [nose, centre(nose)]
  if (art.barbels) {
    out.push(`  <path d="M${f(nose - 4)} ${f(mouth[1] + 2)} Q${f(nose + 4)} ${f(mouth[1] + h * 0.7)} ${f(nose - 4)} ${f(mouth[1] + h * 1.1)} M${f(nose - 10)} ${f(mouth[1] + 4)} Q${f(nose - 6)} ${f(mouth[1] + h * 0.9)} ${f(nose - 14)} ${f(mouth[1] + h * 1.25)}" fill="none" stroke="${darker(belly, 0.45)}" stroke-width="1.8" stroke-linecap="round"/>`)
  }
  if (typeof art.barbels === 'number') {
    const colour = darker(belly, 0.45)
    for (let i = 0; i < art.barbels; i++) {
      const x0 = nose - 3 - i * 5
      const y0 = mouth[1] + 2 + i * 0.6
      out.push(`  <path d="M${f(x0)} ${f(y0)} Q${f(x0 + 5)} ${f(mouth[1] + h * (0.5 + i * 0.08))} ${f(x0 - 4 - i)} ${f(mouth[1] + h * (0.85 + i * 0.1))}" fill="none" stroke="${colour}" stroke-width="${art.barbelWidth ?? 1.6}" stroke-linecap="round"/>`)
    }
  }
  if (art.chinBarbel) out.push(`  <path d="M${f(nose - 14)} ${f(mouth[1] + h * 0.55)} Q${f(nose - 12)} ${f(mouth[1] + h * 0.9)} ${f(nose - 17)} ${f(mouth[1] + h * 1.1)}" fill="none" stroke="${darker(belly, 0.45)}" stroke-width="1.8" stroke-linecap="round"/>`)
  if (art.knot) {
    // two long whiskers under the chin, one of them tied in a loose knot
    const colour = darker(belly, 0.5)
    const m = mouth[1]
    out.push(`  <path d="M${f(nose - 6)} ${f(m + 5)} C${f(nose - 8)} ${f(m + 15)} ${f(nose - 18)} ${f(m + 19)} ${f(nose - 25)} ${f(m + 16)} C${f(nose - 32)} ${f(m + 12)} ${f(nose - 26)} ${f(m + 6)} ${f(nose - 20)} ${f(m + 10)} C${f(nose - 13)} ${f(m + 15)} ${f(nose - 16)} ${f(m + 26)} ${f(nose - 24)} ${f(m + 28)}" fill="none" stroke="${colour}" stroke-width="2.2" stroke-linecap="round"/>`)
    out.push(`  <path d="M${f(nose - 2)} ${f(m + 5)} C${f(nose - 1)} ${f(m + 16)} ${f(nose - 8)} ${f(m + 24)} ${f(nose - 15)} ${f(m + 27)}" fill="none" stroke="${colour}" stroke-width="2.2" stroke-linecap="round"/>`)
  }
  if (art.teeth) {
    const row = [0, 1, 2, 3, 4].map((i) => {
      const x = nose - 3 - i * 3.6
      return poly([[x, mouth[1] + 1.4], [x - 1.2, mouth[1] + 5], [x - 2.6, mouth[1] + 1.6]], '#f1ece0')
    })
    decor(...row)
  }
  if (art.tusk) out.push(poly([[nose - 2, mouth[1] - 1.5], [Math.min(119, nose + 11), mouth[1] - 3], [nose - 2, mouth[1] + 1.5]], art.tuskColour ?? lighter(belly, 0.5)))
  if (art.crest) {
    const head = at(0.82)
    const k = art.crestSize ?? 1
    out.push(poly([[head.x - 12, head.top + 1], [head.x - 9, head.top - 8 * k], [head.x - 6, head.top], [head.x - 3, head.top - 9 * k], [head.x, head.top - 1], [head.x + 3, head.top - 7 * k], [head.x + 5, head.top + 2]], art.crestColour ?? accent))
  }
  if (art.lure) {
    const head = at(0.84)
    const [lx, ly] = [Math.min(114, head.x + 12), head.top - 12]
    out.push(`  <path d="M${f(head.x - 2)} ${f(head.top + 1)} Q${f(head.x)} ${f(head.top - 14)} ${f(lx)} ${f(ly)}" fill="none" stroke="${darker(back, 0.3)}" stroke-width="1.6" stroke-linecap="round"/>`)
    const colour = art.glow ?? '#ffd870'
    decor(`  <circle cx="${f(lx)}" cy="${f(ly)}" r="7" fill="${colour}" opacity="0.3"/>`)
    out.push(`  <circle cx="${f(lx)}" cy="${f(ly)}" r="3.4" fill="${colour}"/>`)
    decor(`  <circle cx="${f(lx)}" cy="${f(ly)}" r="1.4" fill="#ffffff"/>`)
  }
  if (art.aura && !sil) out.unshift(`  <ellipse cx="${f((nose + tailX) / 2)}" cy="${f(centre(60))}" rx="${f((nose - tailX) / 2 + 8)}" ry="${f(h + 9)}" fill="${art.aura}" opacity="0.28"/>`)
  return svg(out)
}
