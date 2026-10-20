// Two overlays (markup in index.html, look in style.css):
//   #start  the start screen: title, five key hints and the "Set sail" button. Everything else
//           is the 3D scene behind it, a close-up of the boat
//   #menu   the pause screen: a short list (Resume, Controls, Settings, Logbook, About, Home screen).
//           Controls, Settings, About and the "go home?" question are pages inside the same card: one .menu-view is shown at a time,
//           Esc or "Back" returns to the list
// Enter presses whichever button is showing.
const TITLES = { main: 'Paused', controls: 'Controls', settings: 'Settings', about: 'About', confirm: 'Go home?' }

export function createMenu({ audio, display, onStart, onResume, onHome, onLogbook, onMute, onFullscreen }) {
  const $ = (id) => document.getElementById(id)
  const start = $('start')
  const startButton = $('start-action')
  const pause = $('menu')
  const card = pause.querySelector('.menu-card')
  const resumeButton = $('menu-action')
  const music = $('volume-music')
  const effects = $('volume-sfx')

  music.value = audio.settings.music
  effects.value = audio.settings.sfx
  music.addEventListener('input', () => audio.setMusicVolume(Number(music.value)))
  effects.addEventListener('input', () => audio.setSfxVolume(Number(effects.value)))

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
  function show(next) {
    view = next
    card.dataset.view = next
    for (const element of pause.querySelectorAll('.menu-view')) element.hidden = element.id !== `view-${next}`
    $('menu-state').textContent = TITLES[next]
    pause.scrollTop = 0
    const first = pause.querySelector(`#view-${next} ${next === 'main' ? '#menu-action' : '[data-back]'}`)
    first?.focus({ preventScroll: true })
  }
  for (const button of pause.querySelectorAll('.menu-item[data-view]')) button.addEventListener('click', () => show(button.dataset.view))
  for (const button of pause.querySelectorAll('[data-back]')) button.addEventListener('click', () => show('main'))
  $('menu-logbook').addEventListener('click', () => onLogbook())
  $('menu-home').addEventListener('click', () => show('confirm')) // asks first
  $('menu-home-confirm').addEventListener('click', () => onHome())

  const soundButton = $('sound-button')
  soundButton.addEventListener('click', () => {
    onMute()
    soundButton.blur() // otherwise Space or Enter would press it again
  })
  const fullscreenButton = $('fullscreen-button')
  fullscreenButton.addEventListener('click', () => {
    onFullscreen()
    fullscreenButton.blur()
  })

  startButton.addEventListener('click', () => onStart())
  resumeButton.addEventListener('click', () => onResume())

  addEventListener('keydown', (event) => {
    if (event.code !== 'Enter') return
    if (start.classList.contains('show') && !start.classList.contains('leaving') && document.activeElement !== startButton) {
      event.preventDefault()
      onStart()
    } else if (view === 'main' && pause.classList.contains('show') && !pause.contains(document.activeElement)) {
      event.preventDefault() // (on one of the list's buttons Enter just presses it)
      onResume()
    }
  })

  return {
    // The Sound and Full screen buttons and the "Made by" tag are shown on the start and pause screens.
    showSound(visible) {
      document.body.classList.toggle('show-sound', visible)
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
      showSettings()
      pause.classList.add('show')
      show('main')
    },
    closePause() {
      pause.classList.remove('show')
      document.activeElement?.blur?.()
    },
    // The mute state changed (the M key): show it on the Settings page.
    refresh: showSettings,
    // Esc on a page goes back to the list. Returns false when the list was already showing (Esc then resumes).
    back() {
      if (view === 'main') return false
      show('main')
      return true
    },
  }
}
