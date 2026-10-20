// Full screen on and off (the F key, the button on the start and pause screens, the strip in the game).
// The page itself goes full screen. iPhones have no full screen for web pages, so there the buttons stay hidden.
// `body.is-fullscreen` follows the real state, so Esc (which the browser handles itself) is picked up too.
export function setupFullscreen() {
  const root = document.documentElement
  const supported = Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled)
  const current = () => document.fullscreenElement ?? document.webkitFullscreenElement ?? null
  document.body.classList.toggle('no-fullscreen', !supported)

  const sync = () => {
    const on = current() !== null
    document.body.classList.toggle('is-fullscreen', on)
    for (const icon of document.querySelectorAll('[data-fullscreen-icon]')) icon.setAttribute('href', on ? '#i-shrink' : '#i-expand')
    for (const label of document.querySelectorAll('[data-fullscreen-label]')) label.textContent = on ? 'Exit full screen' : 'Full screen'
  }
  document.addEventListener('fullscreenchange', sync)
  document.addEventListener('webkitfullscreenchange', sync)
  sync()

  return {
    supported,
    toggle() {
      if (!supported) return
      const request = current() ? (document.exitFullscreen ?? document.webkitExitFullscreen) : (root.requestFullscreen ?? root.webkitRequestFullscreen)
      Promise.resolve(request?.call(current() ? document : root)).catch(() => {}) // (refused outside a user gesture: nothing to do)
    },
  }
}
