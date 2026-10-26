// The worlds. The first is the game's own (built by world/layout.js); the others are worlds made in Blender
// (public/models/worlds/, listed in worlds.json from their cards by scripts/buildModelLists.mjs).
// The developer panel picks one (World): the choice is kept for the tab and the page reloads, because the
// whole world is built at start-up. Players always get the game's own world.
const DEV_KEY = 'wake.dev'
const WORLD_KEY = 'wake.dev.world'

export const DEFAULT_WORLD = {
  id: 'wake',
  name: 'Wake',
  description: 'The original world.',
  special: '',
  file: null, // (generated, not read from a file)
}

export async function loadWorlds() {
  try {
    const response = await fetch(new URL('models/worlds/worlds.json', document.baseURI).href)
    if (!response.ok) throw new Error(response.statusText)
    return [DEFAULT_WORLD, ...(await response.json())]
  } catch {
    return [DEFAULT_WORLD]
  }
}

// The world this tab asked for (developer mode only), or null for the game's own.
export function chosenWorldId() {
  try {
    if (sessionStorage.getItem(DEV_KEY) !== '1') return null
    const id = sessionStorage.getItem(WORLD_KEY)
    return id && id !== DEFAULT_WORLD.id ? id : null
  } catch {
    return null
  }
}

// Remembers the choice and reloads.
export function chooseWorld(id) {
  try {
    if (id === DEFAULT_WORLD.id) sessionStorage.removeItem(WORLD_KEY)
    else sessionStorage.setItem(WORLD_KEY, id)
  } catch {
    // not remembered
  }
  location.reload()
}
