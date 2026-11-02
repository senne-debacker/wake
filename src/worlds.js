// The worlds: the ones made in Blender (public/models/worlds/, listed in worlds.json from their cards by
// scripts/buildModelLists.mjs), the standard one (a card with `standard: yes`) first. The world the game builds itself
// (world/layout.js, `DEFAULT_WORLD`) is not one of them any more: it is only the fallback when no world file can be read.
// The developer panel picks one (World): the choice is kept for the tab and the page reloads, because the
// whole world is built at start-up.
const DEV_KEY = 'wake.dev'
const WORLD_KEY = 'wake.dev.world'

import { standardFirst } from './standard.js'
import { RENAMED } from './economy.js'

export const DEFAULT_WORLD = {
  id: 'w_000-wake', // (built by the game itself: world number 000)
  name: 'Wake',
  description: 'The original world, built by the game itself.',
  special: '',
  fish: 'w_001-harbour', // its set of fish (fishing/fishDatabase.js)
  file: null, // (generated, not read from a file)
}

export async function loadWorlds() {
  try {
    const response = await fetch(new URL('models/worlds/worlds.json', document.baseURI).href)
    if (!response.ok) throw new Error(response.statusText)
    const list = standardFirst(await response.json()) // the standard world first: owned and used from the start
    return list.length ? list : [DEFAULT_WORLD]
  } catch {
    return [DEFAULT_WORLD]
  }
}

// The world this tab asked for (developer mode only), or null for the game's own.
export function chosenWorldId() {
  try {
    if (sessionStorage.getItem(DEV_KEY) !== '1') return null
    const id = sessionStorage.getItem(WORLD_KEY)
    return id ? (RENAMED.worlds[id] ?? id) : null
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
