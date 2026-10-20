// The tutorial: a few pop-ups that explain how to sail and how to fish. Markup in index.html (#tutorial),
// look in style.css. It starts by itself the first time the game is played (remembered in localStorage),
// can be skipped with the "Skip tutorial" button at any time, and can be played again from the pause menu.
//
// Each step waits for the player to do what it says (sail, steer, ...) and moves on by itself, with a
// short tick; the "Next" button moves on without doing it. Every frame main.js calls `update` with what is
// going on: { state, input, touch, tilt, nearSpot } (nearSpot: a fishing spot is within reach).
const STORAGE_KEY = 'wake.tutorial'

const kbd = (text, wide = false) => `<kbd${wide ? ' class="wide"' : ''}>${text}</kbd>`
const SPACE = kbd('Space', true)

// `text(ctx)`   what to say (our own markup: <b> and <kbd> only)
// `done(ctx)`   true while the player is doing it; `hold` seconds of that moves the step on
// `after`       seconds after which the step moves on by itself (the last one)
const STEPS = [
  {
    id: 'sail',
    text: (c) => (c.touch ? 'Push the <b>joystick up</b> to sail forward.' : `Hold ${kbd('W')} or ${kbd('&uarr;')} to <b>sail forward</b>.`),
    done: (c) => c.input.throttle > 0.5,
    hold: 0.8,
  },
  {
    id: 'steer',
    text: (c) => (c.touch ? (c.tilt ? '<b>Tilt your phone</b> left or right to steer.' : 'Push the joystick <b>left or right</b> to steer.') : `Press ${kbd('A')} and ${kbd('D')} (or ${kbd('&larr;')} ${kbd('&rarr;')}) to <b>steer</b>.`),
    done: (c) => Math.abs(c.input.steer) > 0.4,
    hold: 0.6,
  },
  {
    id: 'look',
    text: (c) => (c.touch ? 'Drag the sea to <b>look around</b>, pinch to zoom. The <b>View</b> button shows the whole planet.' : `Drag with the mouse to <b>look around</b>, scroll to zoom. ${kbd('C')} shows the whole planet.`),
  },
  {
    id: 'find',
    text: () => 'Look for <b>bubbling water</b> on the sea, where the fish are, and sail up to it.',
    done: (c) => c.nearSpot,
  },
  {
    id: 'anchor',
    text: (c) => {
      if (c.input.anchored && !c.nearSpot) return 'No fish here. Lift the anchor and move onto the <b>bubbling water</b>.'
      return c.touch ? 'Tap the <b>anchor</b> button while you are over the bubbles.' : `Drop the <b>anchor</b> over the bubbles: ${SPACE}`
    },
    // (dropping the anchor over a spot starts the fight, see the jump in update)
  },
  {
    id: 'reel',
    text: (c) => (c.touch ? '<b>Hold the Reel button</b> to reel in. Let go when the Tension bar turns red, or the line snaps!' : `<b>Hold ${SPACE}</b> to reel in. Let go when the Tension bar turns red, or the line snaps!`),
  },
  {
    id: 'finish',
    text: (c) => (c.touch ? 'Every catch goes in your <b>logbook</b> (top left). Tap the anchor again to sail on. Good luck!' : `Every catch goes in your <b>logbook</b> (${kbd('B')}). Lift the anchor with ${SPACE} to sail on. Good luck!`),
    after: 12,
  },
]
const REEL = STEPS.findIndex((step) => step.id === 'reel')
const FINISH = STEPS.length - 1
const TICK = 0.7 // seconds the tick shows before the next step

function seen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}
function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done')
  } catch {
    // not remembered: it will start again next time
  }
}

export function createTutorial() {
  const $ = (id) => document.getElementById(id)
  const root = $('tutorial')
  const text = $('tut-text')
  const count = $('tut-count')
  const dots = $('tut-dots')
  const nextButton = $('tut-next')
  for (let i = 0; i < STEPS.length; i++) dots.append(document.createElement('i'))

  let index = -1 // -1: not running
  let held = 0 // seconds the player has been doing what the step says
  let tick = 0 // seconds left of the tick
  let age = 0 // seconds on this step
  let wasFishing = false
  let shown = ''

  function render(ctx) {
    const html = STEPS[index].text(ctx)
    if (html !== shown) {
      shown = html
      text.innerHTML = html // our own static strings above
    }
  }
  function go(next, ctx) {
    index = next
    held = tick = age = 0
    shown = ''
    root.classList.remove('ok')
    count.textContent = `${index + 1} / ${STEPS.length}`
    dots.querySelectorAll('i').forEach((dot, i) => dot.classList.toggle('on', i <= index))
    nextButton.textContent = index === FINISH ? 'Done' : 'Next'
    if (ctx) render(ctx)
  }
  function finish() {
    index = -1
    remember()
    root.hidden = true
    document.body.classList.remove('tutorial-open')
  }

  let last = null // the latest context, for the buttons
  nextButton.addEventListener('click', () => {
    nextButton.blur() // otherwise Space (reel, anchor) would press it again
    if (index === FINISH) finish()
    else go(index + 1, last)
  })
  $('tut-skip').addEventListener('click', (event) => {
    event.currentTarget.blur()
    finish()
  })

  return {
    get running() {
      return index >= 0
    },

    // The first time the game is played.
    maybeStart() {
      if (index < 0 && !seen()) this.start()
    },

    // From the beginning (also from the pause menu).
    start() {
      root.hidden = false
      wasFishing = false
      go(0, last)
    },

    update(delta, ctx) {
      last = ctx
      if (index < 0) return
      const visible = ctx.state === 'playing' || ctx.state === 'fishing'
      root.classList.toggle('away', !visible) // (hidden behind the pause screen and the logbook)
      document.body.classList.toggle('tutorial-open', visible)
      if (!visible) return

      // Fishing started or ended by itself, whatever step this is.
      if (ctx.state === 'fishing' && index < REEL) go(REEL, ctx)
      else if (wasFishing && ctx.state === 'playing' && index <= REEL) go(FINISH, ctx)
      wasFishing = ctx.state === 'fishing'

      const step = STEPS[index]
      render(ctx)
      age += delta
      if (tick > 0) {
        tick -= delta
        if (tick <= 0) go(index + 1, ctx)
        return
      }
      if (step.after && age >= step.after) return finish()
      if (step.done) {
        held = step.done(ctx) ? held + delta : 0
        if (held >= (step.hold ?? 0) && step.done(ctx)) {
          tick = TICK
          root.classList.add('ok')
        }
      }
    },
  }
}
