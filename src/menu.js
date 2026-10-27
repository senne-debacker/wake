// Two overlays (markup in index.html, look in style.css and theme.css):
//   #start  the start screen: a paper sheet with the title, the "Set sail" button and the rows Settings /
//           Controls / About (which open those pages below, and go back to the start screen). Everything else
//           is the 3D scene behind it, a close-up of the boat
//   #menu   the pause screen: a short list (Resume, Controls, Tutorial, Settings, Logbook, About, Home screen).
//           Controls, Settings, About and the "go home?" question are pages inside the same card: one .menu-view is shown at a time,
//           Esc or "Back" returns to the list
// Enter presses whichever button is showing.
const TITLES = { main: 'Paused', controls: 'Controls', settings: 'Settings', about: 'About', confirm: 'Go home?' }

export function createMenu({ audio, display, purse, onStart, onResume, onHome, onLogbook, onTutorial, onFullscreen }) {
  const $ = (id) => document.getElementById(id)
  const start = $('start')
  const startButton = $('start-action')
  const pause = $('menu')
  const card = pause.querySelector('.menu-card')
  const resumeButton = $('menu-action')
  const music = $('volume-music')
  const effects = $('volume-sfx')

  // The filled part of a slider's track is drawn from --fill (theme.css).
  const fill = (input) => input.style.setProperty('--fill', `${(Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`)
  music.value = audio.settings.music
  effects.value = audio.settings.sfx
  fill(music)
  fill(effects)
  music.addEventListener('input', () => { audio.setMusicVolume(Number(music.value)); fill(music) })
  effects.addEventListener('input', () => { audio.setSfxVolume(Number(effects.value)); fill(effects) })

  // The visual settings: a row of buttons per setting, the current value pressed.
  const segments = [...pause.querySelectorAll('.seg[data-setting]')]
  // (Sound is not a display setting: it is the mute switch, the same as the M key.)
  const current = (key) => (key === 'sound' ? (audio.muted ? 'off' : 'on') : display.get(key))
  const showSettings = () => {
    for (const seg of segments) {
      for (const button of seg.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.value === current(seg.dataset.setting)))
    }
  }
  for (const seg of segments) {
    seg.addEventListener('click', (event) => {
      const button = event.target.closest('button')
      if (!button) return
      if (seg.dataset.setting === 'sound') audio.setMuted(button.dataset.value === 'off')
      else display.set(seg.dataset.setting, button.dataset.value)
      showSettings()
    })
  }
  showSettings()
  $('setting-fullscreen').addEventListener('click', () => {
    onFullscreen()
    $('setting-fullscreen').blur()
  })

  // The pages of the pause card.
  let view = 'main'
  let fromStart = false // the Settings page was opened from the start screen: Back closes the card instead of going to the list
  function show(next) {
    view = next
    card.dataset.view = next
    for (const element of pause.querySelectorAll('.menu-view')) element.hidden = element.id !== `view-${next}`
    $('menu-tag').textContent = TITLES[next] // the title tag on the pages (the list has the stamp instead)
    $('menu-purse').textContent = next === 'main' && purse ? purse() : ''
    pause.scrollTop = 0
    const first = pause.querySelector(`#view-${next} ${next === 'main' ? '#menu-action' : '[data-back]'}`)
    first?.focus({ preventScroll: true })
  }
  for (const button of pause.querySelectorAll('.menu-item[data-view]')) button.addEventListener('click', () => show(button.dataset.view))
  for (const button of pause.querySelectorAll('[data-back]')) button.addEventListener('click', () => back())
  $('menu-logbook').addEventListener('click', () => onLogbook())
  $('menu-tutorial').addEventListener('click', () => onTutorial())
  $('menu-home').addEventListener('click', () => show('confirm')) // asks first
  $('menu-home-confirm').addEventListener('click', () => onHome())

  // The rows of the start sheet open a page of the pause card over the start screen.
  for (const button of start.querySelectorAll('[data-start-view]')) {
    button.addEventListener('click', () => {
      button.blur() // otherwise Space or Enter would press it again
      openPage(button.dataset.startView)
    })
  }

  function openPage(page) {
    fromStart = true
    showSettings()
    pause.classList.add('show')
    document.body.classList.add('overlay')
    show(page)
  }
  // Esc or Back: up one level. Returns false when there is nowhere to go (the list of the pause screen).
  function back() {
    if (fromStart) {
      fromStart = false
      pause.classList.remove('show')
      document.body.classList.remove('overlay')
      startButton.focus({ preventScroll: true })
      return true
    }
    if (view === 'main') return false
    show('main')
    return true
  }

  startButton.addEventListener('click', () => onStart())
  resumeButton.addEventListener('click', () => onResume())

  addEventListener('keydown', (event) => {
    if (event.code !== 'Enter') return
    if (start.classList.contains('show') && !start.classList.contains('leaving') && !pause.classList.contains('show') && document.activeElement !== startButton) {
      event.preventDefault()
      onStart()
    } else if (view === 'main' && pause.classList.contains('show') && !pause.contains(document.activeElement)) {
      event.preventDefault() // (on one of the list's buttons Enter just presses it)
      onResume()
    }
  })

  return {
    // The Settings button and the "Made by" tag are shown on the start screen.
    showCorner(visible) {
      document.body.classList.toggle('show-corner', visible)
    },
    showStart() {
      start.classList.remove('leaving')
      start.classList.add('show')
      startButton.focus({ preventScroll: true })
    },
    // Fades the start screen out (the camera is swinging round behind the boat meanwhile).
    hideStart() {
      start.classList.add('leaving')
      startButton.blur()
      setTimeout(() => start.classList.remove('show', 'leaving'), 900)
    },
    openPause() {
      fromStart = false
      showSettings()
      pause.classList.add('show')
      show('main')
    },
    closePause() {
      fromStart = false
      document.body.classList.remove('overlay')
      pause.classList.remove('show')
      document.activeElement?.blur?.()
    },
    // The mute state changed (the M key): show it on the Settings page.
    refresh: showSettings,
    // Esc on a page goes back to the list. Returns false when the list was already showing (Esc then resumes).
    back,
  }
}
