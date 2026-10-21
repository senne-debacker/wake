import { FISH_SPECIES } from './fishing/fishDatabase.js'
import { BOAT } from './config.js'

// Developer mode. The normal game has no way to force the weather or to run the clock: those keys
// (1 2 3 4, T) and everything else in here are locked. Open the page with `?dev`, type the code on the
// keypad and they unlock for this browser tab (sessionStorage); a small DEV tab then opens a panel with
// the weather, the clock and the fishing tools. This is a gate for players, not security: the code is
// in the source.
//
// Markup: #dev-gate (keypad), #dev-tab and #dev (panel) in index.html; look in style.css.

const CODE = '1815'
const STORAGE_KEY = 'wake.dev'

export function createDevMode({ interaction, clock, atmosphere, boat, world, weather, wind, lightning, spots, logbook, boatState, layout, teleport, startFishing, getState }) {
  const $ = (id) => document.getElementById(id)
  const gate = $('dev-gate')
  const panel = $('dev')
  const tab = $('dev-tab')
  const dots = [...$('dev-dots').children]
  const message = $('dev-message')
  let typed = ''
  let gateOpen = false
  let unlocked = false
  try {
    unlocked = sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // no storage: the code has to be typed on every load
  }

  const paintDots = () => dots.forEach((dot, i) => dot.classList.toggle('on', i < typed.length))

  function unlock() {
    unlocked = true
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // not remembered
    }
    apply()
  }

  // Everything that depends on being unlocked.
  function apply() {
    interaction.dev = unlocked
    document.body.classList.toggle('dev', unlocked)
    if (!unlocked) panel.classList.remove('show')
  }

  function closeGate() {
    if (!gateOpen) return
    gateOpen = false
    removeEventListener('keydown', onGateKey, true)
    gate.classList.remove('show')
  }

  function enter(digit) {
    if (typed.length >= 4) return
    typed += digit
    paintDots()
    if (typed.length < 4) return
    if (typed === CODE) {
      message.textContent = 'Unlocked'
      gate.classList.add('ok')
      unlock()
      setTimeout(() => {
        closeGate()
        gate.classList.remove('ok')
      }, 500)
    } else {
      message.textContent = 'Wrong code'
      gate.classList.add('wrong')
      setTimeout(() => {
        typed = ''
        paintDots()
        gate.classList.remove('wrong')
        message.textContent = 'Esc continues as a player'
      }, 600)
    }
  }
  function back() {
    typed = typed.slice(0, -1)
    paintDots()
  }

  // The gate swallows every key (in the capture phase) so nothing leaks into the game behind it.
  function onGateKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (/^[0-9]$/.test(event.key)) enter(event.key)
    else if (event.key === 'Backspace') back()
    else if (event.key === 'Escape') closeGate()
  }
  for (const button of gate.querySelectorAll('[data-digit]')) button.addEventListener('click', () => enter(button.dataset.digit))
  gate.querySelector('[data-action="back"]').addEventListener('click', back)
  gate.querySelector('[data-action="cancel"]').addEventListener('click', closeGate)

  // ---- the panel ------------------------------------------------------------------------------------
  // A slider with a read-out. `read()` is what the slider shows while nobody is dragging it.
  const sliders = []
  function slider(id, { format, onInput, read }) {
    const input = $(id)
    const out = input.parentElement.querySelector('output')
    const show = () => (out.textContent = format(Number(input.value)))
    input.addEventListener('input', () => {
      show()
      onInput(Number(input.value))
    })
    sliders.push({
      input,
      sync() {
        if (read && document.activeElement !== input) input.value = read()
        show()
      },
    })
  }
  const percent = (v) => `${Math.round(v * 100)}%`
  const times = (v) => `x${v.toFixed(2)}`

  // Weather: the presets, and three sliders that take over ('custom') as soon as one is moved.
  const weatherButtons = [...panel.querySelectorAll('[data-weather]')]
  for (const button of weatherButtons) button.addEventListener('click', () => (interaction.input.weather = button.dataset.weather))
  for (const key of ['storm', 'cover', 'rain']) {
    slider(`dev-w-${key}`, {
      format: percent,
      read: () => weather.levels[key],
      onInput(value) {
        if (interaction.input.weather !== 'custom') Object.assign(weather.custom, weather.levels)
        weather.custom[key] = value
        interaction.input.weather = 'custom'
      },
    })
  }
  const instant = $('dev-w-instant')
  instant.addEventListener('change', () => (weather.instant = instant.checked))
  const windAuto = $('dev-wind-auto')
  windAuto.addEventListener('change', () => {
    if (windAuto.checked) wind.manual = null
    else wind.manual = wind.strength
  })
  slider('dev-wind', {
    format: percent,
    read: () => wind.strength,
    onInput(value) {
      wind.manual = value
      windAuto.checked = false
    },
  })
  slider('dev-fog', { format: times, onInput: (value) => (atmosphere.fogMultiplier = value) })
  $('dev-strike').addEventListener('click', () => lightning.strike())

  // Time
  const timeSlider = $('dev-time')
  const freeze = $('dev-freeze')
  timeSlider.addEventListener('input', () => (clock.timeOfDay = Number(timeSlider.value) / 24))
  for (const button of panel.querySelectorAll('[data-hour]')) button.addEventListener('click', () => (clock.timeOfDay = Number(button.dataset.hour) / 24))
  freeze.addEventListener('change', () => (clock.paused = freeze.checked))
  slider('dev-clock-speed', { format: times, onInput: (value) => (clock.speed = value) })

  // Boat. The top speeds are scaled in place (the wake and the sounds read them too, so they follow).
  const stock = { maxSpeed: BOAT.maxSpeed, boostSpeed: BOAT.boostSpeed, maxReverseSpeed: BOAT.maxReverseSpeed }
  const setTopSpeed = (factor) => {
    for (const key in stock) BOAT[key] = stock[key] * factor
  }
  slider('dev-speed', { format: times, onInput: setTopSpeed })
  slider('dev-boat-size', { format: times, onInput: (value) => boat.setScale(value) })
  slider('dev-buoy-size', { format: times, onInput: (value) => world.setBuoyScale(value) })
  const ghostBox = $('dev-ghost')
  ghostBox.addEventListener('change', () => (api.ghost = ghostBox.checked))
  $('dev-stop').addEventListener('click', () => {
    boatState.vel.set(0, 0, 0)
    boatState.yawRate = 0
  })
  $('dev-home').addEventListener('click', () => teleport(layout.start.dir))
  $('dev-ocean').addEventListener('click', () => teleport(layout.ocean.dir))
  let spotIndex = 0
  $('dev-next-spot').addEventListener('click', () => {
    const list = spots.spots
    teleport(list[spotIndex++ % list.length].dir)
  })

  // Fishing
  const species = $('dev-species')
  for (const fish of FISH_SPECIES) species.append(new Option(`${fish.name} (${fish.rarity})`, fish.id))
  $('dev-refill').addEventListener('click', () => spots.refill())
  $('dev-fight').addEventListener('click', () => {
    const spot = spots.nearest(boatState.dir, Infinity)?.spot ?? spots.spots.find((s) => !s.empty) ?? spots.spots[0]
    if (spot && getState() === 'playing') {
      panel.classList.remove('show')
      startFishing(spot, FISH_SPECIES.find((fish) => fish.id === species.value) ?? null)
    }
  })
  $('dev-fill').addEventListener('click', () => FISH_SPECIES.forEach((fish) => logbook.record({ id: fish.id, weight: (fish.weight[0] + fish.weight[1]) / 2 })))
  $('dev-clear').addEventListener('click', () => logbook.reset())

  // View
  const fpsBox = $('dev-fps')
  const fpsRead = $('dev-fps-read')
  const hideHud = $('dev-hidehud')
  fpsBox.addEventListener('change', () => (fpsRead.hidden = !fpsBox.checked))
  hideHud.addEventListener('change', () => document.body.classList.toggle('dev-nohud', hideHud.checked))

  $('dev-lock').addEventListener('click', () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // nothing stored
    }
    unlocked = false
    clock.paused = false
    clock.speed = 1
    interaction.input.weather = 'auto'
    weather.instant = false
    wind.manual = null
    atmosphere.fogMultiplier = 1
    setTopSpeed(1)
    boat.setScale(1)
    world.setBuoyScale(1)
    api.ghost = false
    for (const box of [freeze, instant, ghostBox, fpsBox, hideHud]) box.checked = false
    windAuto.checked = true
    fpsRead.hidden = true
    document.body.classList.remove('dev-nohud')
    for (const id of ['dev-speed', 'dev-clock-speed', 'dev-fog', 'dev-boat-size', 'dev-buoy-size']) $(id).value = 1
    apply()
  })
  tab.addEventListener('click', () => panel.classList.toggle('show'))
  $('dev-close').addEventListener('click', () => panel.classList.remove('show'))
  addEventListener('keydown', (event) => {
    if (unlocked && event.code === 'Backquote' && !event.repeat && !gateOpen) panel.classList.toggle('show')
  })

  apply()
  let shownWeather = null
  let shownClock = null

  let fpsSmooth = 16.7
  let fpsLast = performance.now()
  const api = {
    ghost: false, // sail through islands and rocks (read by main.js)
    get unlocked() {
      return unlocked
    },
    // `?dev` in the address: ask for the code (unless this tab is unlocked already).
    begin() {
      if (!new URLSearchParams(location.search).has('dev') || unlocked || gateOpen) return
      gateOpen = true
      typed = ''
      paintDots()
      gate.classList.add('show')
      addEventListener('keydown', onGateKey, true)
    },
    // Every frame: keeps the panel in step with what the keys and the clock do.
    update() {
      if (!unlocked) return
      if (!fpsRead.hidden) {
        const now = performance.now()
        fpsSmooth += (now - fpsLast - fpsSmooth) * 0.05
        fpsLast = now
        fpsRead.textContent = `${Math.round(1000 / fpsSmooth)} fps`
      }
      if (!panel.classList.contains('show')) return
      const weatherChoice = interaction.input.weather
      if (weatherChoice !== shownWeather) {
        shownWeather = weatherChoice
        for (const button of weatherButtons) button.classList.toggle('on', button.dataset.weather === weatherChoice)
      }
      const hours = Math.round(clock.timeOfDay * 24 * 4) / 4
      if (hours !== shownClock && document.activeElement !== timeSlider) {
        shownClock = hours
        timeSlider.value = hours
      }
      $('dev-clock').textContent = clock.format()
      freeze.checked = clock.paused
      for (const item of sliders) item.sync()
    },
  }
  return api
}
