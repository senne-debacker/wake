// The worlds. The standard one (a card with `standard: yes`) comes first, then the game's own (built by world/layout.js), then the other worlds made in Blender
// (public/models/worlds/, listed in worlds.json from their cards by scripts/buildModelLists.mjs).
// The developer panel picks one (World): the choice is kept for the tab and the page reloads, because the
// whole world is built at start-up. Players always get the game's own world.
const DEV_KEY = 'wake.dev'
const WORLD_KEY = 'wake.dev.world'

import { standardFirst } from './standard.js'

export const DEFAULT_WORLD = {
  id: 'wake',
  name: 'Wake',
  description: 'The original world, built by the game itself.',
  price: 300, // (a chart, once another world is the standard one)
  special: '',
  fish: 'home', // its set of fish (fishing/fishDatabase.js)
  file: null, // (generated, not read from a file)
}

export async function loadWorlds() {
  try {
    const response = await fetch(new URL('models/worlds/worlds.json', document.baseURI).href)
    if (!response.ok) throw new Error(response.statusText)
    return standardFirst([DEFAULT_WORLD, ...(await response.json())]) // the standard world first: owned and used from the start
  } catch {
    return [DEFAULT_WORLD]
  }
}

// The world this tab asked for (developer mode only), or null for the game's own.
export function chosenWorldId() {
  try {
    if (sessionStorage.getItem(DEV_KEY) !== '1') return null
    const id = sessionStorage.getItem(WORLD_KEY)
    return id || null
  } catch {
    return null
  }
}

// The developer panel's choice is dropped when the player sails to a world by buying a chart.
export function clearWorldChoice() {
  try {
    sessionStorage.removeItem(WORLD_KEY)
  } catch {
    // nothing to clear
  }
}

// Remembers the choice and reloads.
export function chooseWorld(id) {
  try {
    sessionStorage.setItem(WORLD_KEY, id) // (always kept: picking the world that is the standard one must work after sailing elsewhere)
  } catch {
    // not remembered
  }
  location.reload()
}
