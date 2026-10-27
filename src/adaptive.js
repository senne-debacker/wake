// Auto resolution: the renderer's pixel ratio follows how fast the computer manages to draw. The game is
// limited by the number of pixels it has to colour (the sea, the wake and the fish shadows are worked out per
// pixel), and a Retina screen has four times as many as the page's size says, so a ratio that is just right on
// one machine is far too much on another. It starts at 1.5 and steps through 2 / 1.75 / 1.5 / 1.25 / 1 (slow = 19 ms)
//   a window of frames that is too slow (average over 19 ms: a 60 Hz screen then misses its frame time often)  -> one step down, and the ratio it left is not tried again
//   a window that is quick (average under `quick` ms, i.e. at the screen's limit)  -> one step up, if not tried before
// Frames that took over a quarter of a second (a tab switch, a loading hitch) are left out. Used when the
// Resolution setting is "Auto" (display.js).

const STEPS = [2, 1.75, 1.5, 1.25, 1]

export function createAdaptiveResolution({ max = Math.min(devicePixelRatio, 2), start = 1.5, slow = 19, quick = 17.8, windowFrames = 75, onChange }) {
  const steps = STEPS.filter((ratio) => ratio <= max + 1e-6)
  if (!steps.length) steps.push(1)
  let index = Math.max(0, steps.findIndex((ratio) => ratio <= Math.min(start, max) + 1e-6))
  let blocked = Infinity // this ratio and everything above it was too slow on this machine
  let warmup = 45 // frames to skip after a change (the new render target, the shader caches)
  let frames = 0
  let total = 0

  return {
    get ratio() {
      return steps[index]
    },
    // Call once per frame with the time the frame took, in milliseconds.
    frame(ms) {
      if (steps.length < 2 || ms > 250) return
      if (warmup > 0) {
        warmup--
        return
      }
      frames++
      total += ms
      if (frames < windowFrames) return
      const average = total / frames
      frames = 0
      total = 0
      if (average > slow && index < steps.length - 1) {
        blocked = Math.min(blocked, steps[index])
        index++
      } else if (average < quick && index > 0 && steps[index - 1] < blocked) index--
      else return
      warmup = 45
      onChange(steps[index], average)
    },
  }
}
