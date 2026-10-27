import { LIGHTNING } from '../config.js'

// Where and when a rare, epic or legendary fish likes to bite. A species can have a `habitat` (see
// fishDatabase.js):
//   weather  'thunderstorm' | 'rain' | 'rough' | 'calm' | 'clear'   (a key of WEATHER_KINDS), optional
//   hours    [from, to]  game hours, from <= hour < to, may wrap past midnight ([22, 2]), optional
//   boost    how many times likelier the species is while the habitat is right
//   hint     what the logbook says before you have caught one (vague)
// With both `weather` and `hours` both have to be right. The logbook spells the habitat out once you
// have caught the fish (describeHabitat).

// What the sea is doing: `levels` are the weather levels (storm, cover, rain, each 0..1).
export const WEATHER_KINDS = {
  thunderstorm: { phrase: 'during a thunderstorm', test: (l) => l.rain > LIGHTNING.minRain && l.storm > LIGHTNING.minStorm }, // the same as when lightning strikes (world/lightning.js)
  rain: { phrase: 'in the rain', test: (l) => l.rain >= 0.2 },
  rough: { phrase: 'in rough weather', test: (l) => l.storm >= 0.35 },
  calm: { phrase: 'on calm seas', test: (l) => l.storm < 0.2 },
  clear: { phrase: 'under clear skies', test: (l) => l.cover < 0.3 && l.rain < 0.05 },
}

export const inHours = (hour, [from, to]) => (from <= to ? hour >= from && hour < to : hour >= from || hour < to)

// `conditions`: { hour (0..24), storm, cover, rain }. null (no conditions): nothing is right.
export function habitatActive(habitat, conditions) {
  if (!habitat || !conditions) return false
  if (habitat.weather && !WEATHER_KINDS[habitat.weather].test(conditions)) return false
  if (habitat.hours && !inHours(conditions.hour, habitat.hours)) return false
  return true
}

const clockText = (hour) => `${String(hour % 24).padStart(2, '0')}:00`
const TIMES = { 2: 'Twice', 3: 'Three times' }

// "Twice as likely to bite during a thunderstorm, between 02:00 and 04:00."
export function describeHabitat(habitat) {
  const parts = []
  if (habitat.weather) parts.push(WEATHER_KINDS[habitat.weather].phrase)
  if (habitat.hours) parts.push(`between ${clockText(habitat.hours[0])} and ${clockText(habitat.hours[1])}`)
  return `${TIMES[habitat.boost] ?? `${habitat.boost} times`} as likely to bite ${parts.join(', ')}.`
}
