import { BOAT } from './config.js'

// The boats. The first one is the game's own fishing boat (the built-in model, or public/models/boat.glb);
// the others come from public/models/boats/boats.json (made from the boat cards by scripts/buildModelLists.mjs).
// A boat changes three things: its look (the model), how big its hull is (measured from the model) and how
// it handles (the card's speed and handling words, as factors on the BOAT numbers in config.js).
//
// BOAT is changed in place, like the developer panel's top-speed slider does, so the physics, the
// sound and the wake keep reading it where they always did.

const BASE = {
  maxSpeed: BOAT.maxSpeed,
  boostSpeed: BOAT.boostSpeed,
  maxReverseSpeed: BOAT.maxReverseSpeed,
  turnRate: BOAT.turnRate,
  yawResponse: BOAT.yawResponse,
  length: BOAT.length,
  width: BOAT.width,
  sampleHalfLength: BOAT.sampleHalfLength,
  sampleHalfWidth: BOAT.sampleHalfWidth,
  shoreMargin: BOAT.shoreMargin,
}

const SPEED = { slow: 0.7, medium: 1, fast: 1.4 } // factors on the top speeds
const HANDLING = { heavy: 0.75, medium: 1, nimble: 1.3 } // factors on how fast it turns

export const DEFAULT_BOAT = {
  id: 'fishing-boat',
  name: 'Fishing Boat',
  description: 'The old red fishing boat.',
  speed: 'medium',
  handling: 'medium',
  special: '',
  file: BOAT.model.file, // (if it is not there, the boat that is built in code is used)
  fitLength: BOAT.model.fitLength, // the other boats keep the size they were modelled in
}

// The default boat first, then the ones on the list. Without the list there is just the default.
export async function loadBoats() {
  try {
    const response = await fetch(new URL('models/boats/boats.json', document.baseURI).href)
    if (!response.ok) throw new Error(response.statusText)
    const list = await response.json()
    return [DEFAULT_BOAT, ...list.map((entry) => ({ fitLength: false, ...entry }))]
  } catch {
    return [DEFAULT_BOAT]
  }
}

// Sets BOAT for `entry`. `hull` = { length, width } measured from its model (null: the default hull);
// `speedFactor` is the developer panel's top-speed slider on top.
export function applyBoatStats(entry, hull = null, speedFactor = 1) {
  const speed = SPEED[entry.speed] ?? 1
  const turn = HANDLING[entry.handling] ?? 1
  const lengthRatio = hull ? hull.length / BASE.length : 1
  const widthRatio = hull ? hull.width / BASE.width : 1
  BOAT.maxSpeed = BASE.maxSpeed * speed * speedFactor
  BOAT.boostSpeed = BASE.boostSpeed * speed * speedFactor
  BOAT.maxReverseSpeed = BASE.maxReverseSpeed * speed * speedFactor
  BOAT.turnRate = BASE.turnRate * turn
  BOAT.yawResponse = BASE.yawResponse * turn
  BOAT.length = BASE.length * lengthRatio
  BOAT.width = BASE.width * widthRatio
  BOAT.sampleHalfLength = BASE.sampleHalfLength * lengthRatio
  BOAT.sampleHalfWidth = BASE.sampleHalfWidth * widthRatio
  BOAT.shoreMargin = BASE.shoreMargin * Math.max(lengthRatio, widthRatio) // (a bigger hull meets the shore sooner)
}
