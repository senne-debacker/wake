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
  const dots = random(art.seed)
  for (let i = 0; i < (art.spots ?? 0); i++) {
    const x = 48 + dots() * 38
    const y = 30 + (dots() - 0.5) * 20
    out.push(`  <circle cx="${f(x)}" cy="${f(y)}" r="${f(1.3 + dots() * 1.2)}" fill="${accent}"/>`)
  }
  out.push(`  <circle cx="98" cy="24" r="3" fill="#fff"/>`, `  <circle cx="99" cy="24" r="1.5" fill="#0b0f14"/>`)
  out.push(`  <circle cx="98" cy="36" r="3" fill="#fff"/>`, `  <circle cx="99" cy="36" r="1.5" fill="#0b0f14"/>`)
  if (art.glow) out.splice(out.length - 4, 0, `  <circle cx="98" cy="30" r="9" fill="${art.glow}" opacity="0.28"/>`)
  return out
}

export function drawFish(art) {
  const svg = (parts) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60">\n${parts.join('\n')}\n</svg>`
  if (art.body === 'ray') return svg(ray(art))

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
  const bands = art.stripes ?? 0
  for (let i = 0; i < bands; i++) {
    const u = 0.3 + (0.42 * (i + 0.5)) / bands
    const half = (0.42 / bands) * 0.3
    const a = at(u - half)
    const b = at(u + half)
    out.push(poly([[a.x, a.top + 1], [b.x, b.top + 1], [b.x, b.bottom - 1], [a.x, a.bottom - 1]], accent, ' opacity="0.85"'))
  }
  const dots = random(art.seed)
  for (let i = 0; i < (art.spots ?? 0); i++) {
    const p = at(0.26 + dots() * 0.5)
    const y = p.top + (p.bottom - p.top) * (0.2 + dots() * 0.6)
    out.push(`  <circle cx="${f(p.x)}" cy="${f(y)}" r="${f(clamp(h * 0.1, 1.3, 2.4) * (0.7 + dots() * 0.6))}" fill="${accent}"/>`)
  }
  const plates = art.plates ?? 0
  for (let i = 0; i < plates; i++) {
    const p = at(0.28 + (0.5 * i) / Math.max(1, plates - 1))
    const y = p.top + (p.bottom - p.top) * 0.28
    out.push(poly([[p.x - 2.6, y], [p.x, y - 3.2], [p.x + 2.6, y], [p.x, y + 3.2]], accent))
  }
  if (art.spikes) {
    for (let i = 0; i < 6; i++) {
      const p = at(0.22 + i * 0.1)
      out.push(poly([[p.x - 2, p.top + 1], [p.x - 0.5, p.top - 5], [p.x + 2, p.top + 1]], accent))
    }
  }

  // --- pectoral fin, gill, eye
  const gill = at(0.78)
  const fish = at(0.66)
  out.push(poly([[fish.x, fish.mid - h * 0.05], [fish.x - 9, fish.mid + h * 0.28], [fish.x - 1, fish.mid + h * 0.42]], darker(fin, 0.1)))
  out.push(`  <path d="M${f(gill.x)} ${f(gill.top + 4)} Q${f(gill.x - 4)} ${f(gill.mid)} ${f(gill.x)} ${f(gill.bottom - 4)}" fill="none" stroke="${darker(back, 0.4)}" stroke-width="1.5"/>`)
  const eyeAt = at(0.9)
  const eye = [eyeAt.x, eyeAt.mid - h * 0.18]
  const eyeR = clamp(h * 0.2, 2.2, 4.2)
  if (art.glow && !art.lure) out.push(`  <circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(eyeR * 2.3)}" fill="${art.glow}" opacity="0.3"/>`)
  out.push(`  <circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(eyeR)}" fill="${art.eye ?? '#ffffff'}"/>`)
  out.push(`  <circle cx="${f(eye[0] + 0.8)}" cy="${f(eye[1])}" r="${f(eyeR * 0.5)}" fill="#0b0f14"/>`)

  // --- extras at the head
  const mouth = [nose, centre(nose)]
  if (art.barbels) {
    out.push(`  <path d="M${f(nose - 4)} ${f(mouth[1] + 2)} Q${f(nose + 4)} ${f(mouth[1] + h * 0.7)} ${f(nose - 4)} ${f(mouth[1] + h * 1.1)} M${f(nose - 10)} ${f(mouth[1] + 4)} Q${f(nose - 6)} ${f(mouth[1] + h * 0.9)} ${f(nose - 14)} ${f(mouth[1] + h * 1.25)}" fill="none" stroke="${darker(belly, 0.45)}" stroke-width="1.8" stroke-linecap="round"/>`)
  }
  if (art.teeth) {
    const row = [0, 1, 2, 3, 4].map((i) => {
      const x = nose - 3 - i * 3.6
      return poly([[x, mouth[1] + 1.4], [x - 1.2, mouth[1] + 5], [x - 2.6, mouth[1] + 1.6]], '#f1ece0')
    })
    out.push(...row)
  }
  if (art.tusk) out.push(poly([[nose - 2, mouth[1] - 1.5], [Math.min(119, nose + 11), mouth[1] - 3], [nose - 2, mouth[1] + 1.5]], art.tuskColour ?? lighter(belly, 0.5)))
  if (art.crest) {
    const head = at(0.82)
    out.push(poly([[head.x - 12, head.top + 1], [head.x - 9, head.top - 8], [head.x - 6, head.top], [head.x - 3, head.top - 9], [head.x, head.top - 1], [head.x + 3, head.top - 7], [head.x + 5, head.top + 2]], art.crestColour ?? accent))
  }
  if (art.lure) {
    const head = at(0.84)
    const [lx, ly] = [Math.min(114, head.x + 12), head.top - 12]
    out.push(`  <path d="M${f(head.x - 2)} ${f(head.top + 1)} Q${f(head.x)} ${f(head.top - 14)} ${f(lx)} ${f(ly)}" fill="none" stroke="${darker(back, 0.3)}" stroke-width="1.6" stroke-linecap="round"/>`)
    const colour = art.glow ?? '#ffd870'
    out.push(`  <circle cx="${f(lx)}" cy="${f(ly)}" r="7" fill="${colour}" opacity="0.3"/>`, `  <circle cx="${f(lx)}" cy="${f(ly)}" r="3.4" fill="${colour}"/>`, `  <circle cx="${f(lx)}" cy="${f(ly)}" r="1.4" fill="#ffffff"/>`)
  }
  return svg(out)
}
