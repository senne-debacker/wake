import { QUALITY } from './quality.js'

// The visual settings on the pause screen's Settings page, remembered between visits.
//   resolution  auto | low | medium | high   the renderer's pixel ratio: auto follows how fast the computer draws
//               (adaptive.js, starting at 1.5), or 1, up to 1.5, up to 2
//   glow        on | off              the bloom (post.js)
//   hud         small | normal | large  the interface scale (hud.js)
// A phone starts on low resolution (quality.js). Settings saved before Auto existed (version 1) keep every value
// except the resolution: a "high" that was only the old default is not kept.
const STORAGE_KEY = 'wake.display'
const OPTIONS = {
  resolution: ['auto', 'low', 'medium', 'high'],
  glow: ['on', 'off'],
  hud: ['small', 'normal', 'large'],
}
let autoRatio = Math.min(devicePixelRatio, 1.5) // what "auto" is using now (set by adaptive.js)
const DEFAULTS = { resolution: QUALITY.low ? 'low' : 'auto', glow: 'on', hud: 'normal' }
const RATIOS = { auto: () => autoRatio, low: () => 1, medium: () => Math.min(devicePixelRatio, 1.5), high: () => Math.min(devicePixelRatio, 2) }

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {} // storage blocked: the defaults will do
  }
}

// `onChange(key, value)` is called when a setting changes (not for the loaded values: apply those yourself).
export function createDisplay(onChange) {
  const saved = load()
  const values = {}
  for (const key of Object.keys(OPTIONS)) values[key] = OPTIONS[key].includes(saved[key]) && !(key === 'resolution' && saved.v !== 2) ? saved[key] : DEFAULTS[key]

  return {
    get: (key) => values[key],
    pixelRatio: () => RATIOS[values.resolution](),
    setAutoRatio: (ratio) => (autoRatio = ratio),
    set(key, value) {
      if (!OPTIONS[key]?.includes(value) || values[key] === value) return
      values[key] = value
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...values, v: 2 }))
      } catch {
        // not remembered, still applied
      }
      onChange(key, value)
    },
  }
}
