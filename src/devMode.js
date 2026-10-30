import { applyBoatStats, BUILT_IN_BOAT_ID } from './boats.js'
import { chooseWorld } from './worlds.js'
import { setWaterDetail } from './scene/planet.js'
import { QUALITY } from './quality.js'

// Developer mode. The normal game has no way to force the weather or to run the clock: those keys
// (1 2 3 4, T) and everything else in here are locked. Open the page with `?dev`, type the code on the
// keypad and they unlock for this browser tab (sessionStorage); a small DEV tab then opens a panel with
// the weather, the clock and the fishing tools. This is a gate for players, not security: the code is
// in the source.
//
// Markup: #dev-gate (keypad), #dev-tab and #dev (panel) in index.html; look in style.css.

const CODE = '1815'
const STORAGE_KEY = 'wake.dev'

export function createDevMode({ fishSet, interaction, clock, atmosphere, boat, boats, economy, planet, worlds, activeWorld, world, weather, wind, lightning, spots, logbook, boatState, layout, teleport, startFishing, getState }) {
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

  // Economy: money for trying out the harbour.
  const economyInfo = $('dev-economy-info')
  const showEconomy = () => (economyInfo.textContent = `${economy.coins} coins, hold ${economy.holdWeight.toFixed(1)} / ${economy.capacity} kg, ${economy.hold.length} fish`)
  $('dev-coins').addEventListener('click', () => economy.addCoins(1000))
  $('dev-reset-save').addEventListener('click', () => {
    economy.reset()
    location.reload()
  })
  economy.onChange(showEconomy)
  showEconomy()

  // World (worlds.js): the game's own or one made in Blender. The whole world is built at start-up, so a change reloads the page.
  const worldSelect = $('dev-world')
  for (const entry of worlds) worldSelect.append(new Option(entry.name, entry.id))
  worldSelect.value = activeWorld.id
  $('dev-world-info').textContent = `${activeWorld.description}${activeWorld.special ? ` (${activeWorld.special.slice(0, 160)}${activeWorld.special.length > 160 ? '...' : ''})` : ''}`
  worldSelect.addEventListener('change', () => chooseWorld(worldSelect.value))

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

  // Boat. Which boat (boats.js) it is: its model, hull and handling. The top-speed slider is a factor on top
  // of that boat's own speed (BOAT is changed in place, so the wake and the sounds follow).
  const boatSelect = $('dev-boat')
  const boatInfo = $('dev-boat-info')
  for (const entry of boats) boatSelect.append(new Option(entry.name, entry.id))
  let currentBoat = { entry: boats.find((candidate) => candidate.id === BUILT_IN_BOAT_ID) ?? boats[0], hull: null } // (the boat built into the scene)
  let speedFactor = 1
  const BOAT_KEY = 'wake.dev.boat'
  // The boat in the scene is `entry` (the harbour changed it, or the picker): its hull and handling, and the panel.
  function setCurrentBoat(entry, hull) {
    currentBoat = { entry, hull }
    boatSelect.value = entry.id
    applyBoatStats(entry, hull, speedFactor)
    const size = hull ? `${hull.length.toFixed(2)} x ${hull.width.toFixed(2)}` : 'standard hull'
    boatInfo.textContent = `${entry.speed}, ${entry.handling}, ${size}. ${entry.description}${entry.special ? ` (${entry.special})` : ''}`
  }
  async function selectBoat(id) {
    const entry = boats.find((candidate) => candidate.id === id) ?? boats[0]
    const result = await boat.setBoat(entry)
    if (!result) {
      boatInfo.textContent = `Could not load ${entry.name}`
      boatSelect.value = currentBoat.entry.id
      return
    }
    setCurrentBoat(entry, result.hull)
    try {
      sessionStorage.setItem(BOAT_KEY, entry.id)
    } catch {
      // not remembered
    }
  }
  boatSelect.addEventListener('change', () => selectBoat(boatSelect.value))
  slider('dev-speed', {
    format: times,
    onInput(factor) {
      speedFactor = factor
      applyBoatStats(currentBoat.entry, currentBoat.hull, speedFactor)
    },
  })
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
  for (const fish of fishSet) species.append(new Option(`${fish.name} (${fish.rarity})`, fish.id))
  $('dev-refill').addEventListener('click', () => spots.refill())
  $('dev-fight').addEventListener('click', () => {
    const spot = spots.nearest(boatState.dir, Infinity)?.spot ?? spots.spots.find((s) => !s.empty) ?? spots.spots[0]
    if (spot && getState() === 'playing') {
      panel.classList.remove('show')
      startFishing(spot, fishSet.find((fish) => fish.id === species.value) ?? null)
    }
  })
  $('dev-fill').addEventListener('click', () => fishSet.forEach((fish) => logbook.record({ id: fish.id, weight: (fish.weight[0] + fish.weight[1]) / 2 })))
  $('dev-clear').addEventListener('click', () => logbook.reset())

  // View: how finely the sea is cut into triangles (scene/planet.js). Remembered for the tab.
  const WATER_KEY = 'wake.dev.water'
  const waterSelect = $('dev-water')
  const nearest = (value) => [...waterSelect.options].map((o) => Number(o.value)).reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a))
  waterSelect.value = String(nearest(planet.userData.detail ?? QUALITY.waterDetail))
  waterSelect.addEventListener('change', () => {
    setWaterDetail(planet, Number(waterSelect.value))
    try {
      sessionStorage.setItem(WATER_KEY, waterSelect.value)
    } catch {
      // not remembered
    }
  })
  try {
    const savedWater = unlocked ? sessionStorage.getItem(WATER_KEY) : null
    if (savedWater && [...waterSelect.options].some((o) => o.value === savedWater)) {
      waterSelect.value = savedWater
      setWaterDetail(planet, Number(savedWater))
    }
  } catch {
    // nothing remembered
  }
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
    boat.setScale(1)
    world.setBuoyScale(1)
    api.ghost = false
    setWaterDetail(planet, QUALITY.waterDetail)
    waterSelect.value = String(nearest(QUALITY.waterDetail))
    try {
      sessionStorage.removeItem(WATER_KEY)
    } catch {
      // nothing to forget
    }
    for (const box of [freeze, instant, ghostBox, fpsBox, hideHud]) box.checked = false
    windAuto.checked = true
    speedFactor = 1
    selectBoat(boats[0].id) // back to the standard boat
    if (activeWorld.id !== worlds[0].id) chooseWorld(worlds[0].id) // ... and the standard world (the page reloads)
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
  if (unlocked) {
    try {
      const saved = sessionStorage.getItem(BOAT_KEY) // the boat of this tab's last visit
      if (saved && saved !== boats[0].id) selectBoat(saved)
    } catch {
      // nothing remembered
    }
  }
  let shownWeather = null
  let shownClock = null

  let fpsSmooth = 16.7
  let fpsLast = performance.now()
  const api = {
    ghost: false, // sail through islands and rocks (read by main.js)
    setCurrentBoat,
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
