import { Vector3 } from 'three/webgpu'
import { DAY } from './config.js'
import { isTouch } from './touch.js'

// The in-game interface: a paper half-disc at the top with a ring that turns with the time of day (the
// red marker is "now") and the day and the clock, paper cards for the anchor / boost / horn / lamp /
// camera at the bottom left, the logbook under the stat box (speed and sea state) at the top left and a few
// key tabs at the top right. The markup is in index.html, the look in style.css and theme.css. Everything here only touches the DOM when a
// value actually changes.

const north = new Vector3()
const east = new Vector3()
const forward = new Vector3()

// Heading in degrees clockwise from north, where north is towards the planet's +Y pole.
export function compassHeading(boatState) {
  const { dir, heading } = boatState
  north.set(0, 1, 0).addScaledVector(dir, -dir.y)
  if (north.lengthSq() < 1e-4) north.set(1, 0, 0).addScaledVector(dir, -dir.x) // standing on a pole
  north.normalize()
  east.crossVectors(north, dir) // (east, north, up) is right-handed
  forward.copy(heading).addScaledVector(dir, -heading.dot(dir))
  return (Math.atan2(forward.dot(east), forward.dot(north)) * 180) / Math.PI
}

const RING = 134 // radius of the ring's middle, in the dial's own units (theme.css draws it 14 wide)
const { dawn, day, dusk, night } = DAY.hours
const PHASES = [ // [start, end] as a fraction of the day, and the colour; the hours come from DAY.hours
  [0, dawn / 24, '#1F2B3A'], // night (--ink)
  [dawn / 24, day / 24, '#F2C46D'], // morning twilight (--amber)
  [day / 24, dusk / 24, '#9CC3D0'], // day (--day)
  [dusk / 24, night / 24, '#F2C46D'], // evening twilight
  [night / 24, 1, '#1F2B3A'], // night
]
const onRing = (t) => [RING * Math.sin(t * Math.PI * 2), -RING * Math.cos(t * Math.PI * 2)] // midnight at the top, noon at the bottom
const arc = (t0, t1) => {
  const [x0, y0] = onRing(t0)
  const [x1, y1] = onRing(t1)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${RING} ${RING} 0 ${t1 - t0 > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

const seaState = (storm) => (storm < 0.2 ? ['Calm', 'good'] : storm < 0.5 ? ['Choppy', 'warn'] : storm < 0.8 ? ['Rough', 'bad'] : ['Stormy', 'bad'])

export function createHud() {
  const $ = (id) => document.getElementById(id)
  const root = $('hud')
  const cache = {}
  const change = (key, value, apply) => {
    if (cache[key] === value) return
    cache[key] = value
    apply(value)
  }

  // Colour the day ring.
  const phases = $('dial-phases')
  for (const [from, to, colour] of PHASES) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', arc(from, to))
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', colour)
    path.setAttribute('stroke-width', '14')
    phases.appendChild(path)
  }

  // Scale the interface with the window.
  // On a phone the HUD is sized from both sides of the screen (it is narrow upright, short sideways),
  // and the menus are not scaled at all: they are laid out for the screen and scroll (style.css).
  let sizeFactor = 1 // the Interface size setting (display.js)
  const rescale = () => {
    const root = document.documentElement.style
    const ui = (isTouch() ? Math.min(1, Math.max(0.6, Math.min(innerHeight / 640, innerWidth / 520))) : Math.min(1.4, Math.max(0.7, innerHeight / 900))) * sizeFactor
    root.setProperty('--ui', ui.toFixed(3))
    // The menu sheets follow the Interface size too, but never grow past what fits the window (the biggest sheet,
    // the logbook, is about 1290 x 860). 1 at 1440 x 900: the sheets are drawn at their own size.
    const fits = Math.min(innerHeight / 860, innerWidth / 1290)
    const menu = Math.min(1.3, Math.max(0.5, Math.min(innerHeight / 900, innerWidth / 1300))) * sizeFactor
    root.setProperty('--menu-scale', (isTouch() ? 1 : Math.max(0.5, Math.min(menu, fits))).toFixed(3))
  }
  rescale()
  addEventListener('resize', rescale)
  addEventListener('touchmode', rescale)

  let toastTimer = 0
  const toastElement = $('toast')

  return {
    show(visible) {
      root.classList.toggle('off', !visible) // fades in and out
    },

    // 'small' | 'normal' | 'large'
    setSize(name) {
      sizeFactor = { small: 0.85, normal: 1, large: 1.2 }[name] ?? 1
      rescale()
    },

    // A short message under the dial.
    toast(text, seconds = 1.6) {
      toastElement.textContent = text
      toastElement.classList.add('show')
      clearTimeout(toastTimer)
      toastTimer = setTimeout(() => toastElement.classList.remove('show'), seconds * 1000)
    },

    update(s) {
      change('time', s.time, (v) => ($('dial-time').textContent = v))
      change('day', s.day, (v) => ($('dial-day').textContent = v.replace(', ', ' \u00b7 '))) // "Monday, Day 1" -> "Monday · Day 1"
      change('ring', Math.round(s.timeOfDay * 720), (v) => phases.setAttribute('transform', `rotate(${(180 - v / 2).toFixed(1)})`)) // "now" at the bottom

      change('anchor', s.anchored, (v) => {
        $('dial-anchor').classList.toggle('down', v)
        $('tool-anchor').classList.toggle('on', v)
        $('t-anchor').classList.toggle('on', v) // (the same buttons in touch mode)
      })
      change('lamp', s.lights, (v) => {
        $('tool-lamp').classList.toggle('on', v)
        $('tool-lamp').querySelector('.tool-label').textContent = v ? 'Lamp on' : 'Lamp'
        $('t-lamp').classList.toggle('on', v)
      })
      change('boost', s.boost, (v) => {
        $('tool-boost').classList.toggle('active', v)
        $('touch-boost').classList.toggle('active', v)
      })
      change('horn', s.horn, (v) => {
        $('tool-horn').classList.toggle('on', v)
        $('t-horn').classList.toggle('on', v)
      })

      change('speed', Math.round(s.speed * 5), (v) => ($('stat-speed').textContent = v)) // 1 unit/s reads as 5 knots
      const [label, tone] = seaState(s.storm)
      change('sea', label, (v) => {
        const element = $('stat-sea')
        element.textContent = v
        element.className = tone
      })

      change('camera', s.camera, (v) => {
        $('tool-camera').classList.toggle('on', v !== 'chase')
        $('strip-view').classList.toggle('active', v !== 'chase') // (the button in touch mode)
      })
      change('muted', s.muted, (v) => {
        $('sound-icon').setAttribute('href', v ? '#i-muted' : '#i-speaker')
        $('strip-sound').classList.toggle('off', v)
      })
    },
  }
}
