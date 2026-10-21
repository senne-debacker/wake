import { WEATHER } from '../config.js'
import { uniforms } from '../uniforms.js'

const rand = (min, max) => min + Math.random() * (max - min)

// Weather state machine. `choice` is 'auto' (cycle through WEATHER.cycle) or one
// of the manual presets. The three levels ease towards the target, so a front
// rolls in over ten seconds or so instead of snapping. Levels are written to the
// shared uniforms: `storm` also drives the boat physics (wave height).
export function createWeather() {
  const KEYS = ['storm', 'cover', 'rain']
  const levels = {}
  for (const key of KEYS) levels[key] = WEATHER.cycle[0][key] // start in the first state, no fade-in
  let index = 0
  let remaining = rand(WEATHER.cycle[0].min, WEATHER.cycle[0].max)
  let label = WEATHER.cycle[0].name

  return {
    levels,
    custom: { storm: 0, cover: 0, rain: 0 }, // dev panel: the targets for the choice 'custom'
    instant: false, // dev panel: levels jump to the target instead of easing
    get label() {
      return label
    },

    update(delta, choice) {
      let target
      if (choice === 'auto') {
        remaining -= delta
        if (remaining <= 0) {
          index = (index + 1) % WEATHER.cycle.length
          remaining = rand(WEATHER.cycle[index].min, WEATHER.cycle[index].max)
        }
        target = WEATHER.cycle[index]
        label = target.name
      } else if (choice === 'custom') {
        target = this.custom
        label = 'custom (manual)'
      } else {
        target = WEATHER.presets[choice]
        label = `${choice} (manual)`
      }

      const k = this.instant ? 1 : 1 - Math.exp(-WEATHER.easeRate * delta)
      for (const key of KEYS) levels[key] += (target[key] - levels[key]) * k

      uniforms.storm.value = levels.storm
      uniforms.cover.value = levels.cover
      uniforms.rain.value = levels.rain
    },
  }
}
