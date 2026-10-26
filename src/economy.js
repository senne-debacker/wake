import { RARITIES, FISH_BY_ID } from './fishing/fishDatabase.js'

// The player's money and belongings: coins, the hold (the fish caught and not sold yet), the boats and the
// charts (worlds) owned, and which boat and world are in use. Saved in localStorage (`wake.save`).
//
// Boats and worlds come from their cards (public/models/boats/*.txt, worlds/*.txt: see boats.js / worlds.js),
// so a new or changed boat needs no code: `price` and `hold` (kg) on a boat's card, `price` and `requires`
// (a boat id) on a world's card. Missing numbers get the defaults below. The save only remembers ids: if a
// boat or world is removed or renamed it is simply not offered any more (an unknown boat in use falls back to
// the first one), and prices and holds are always read from the cards as they are now.
//
//   createEconomy({ boats, worlds, storage }) -> the economy; `boats` / `worlds` are the lists the game loaded
//   (the first of each is the game's own: owned from the start, free).
const STORAGE_KEY = 'wake.save'
const VERSION = 1

export const DEFAULTS = { boatPrice: 600, boatHold: 20, worldPrice: 500 }

export const priceOfBoat = (entry) => Math.max(0, Math.round(Number(entry.price ?? DEFAULTS.boatPrice)))
export const holdOfBoat = (entry) => Math.max(1, Number(entry.hold ?? DEFAULTS.boatHold))
export const priceOfWorld = (entry) => Math.max(0, Math.round(Number(entry.price ?? DEFAULTS.worldPrice)))

// What the harbour pays for one fish: its weight times its rarity's price per kilo.
export const fishValue = (fish, weight) => Math.max(1, Math.round(weight * RARITIES[fish.rarity].price))

function browserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function createEconomy({ boats, worlds, storage = browserStorage() }) {
  const own = { coins: 0, hold: [], boats: [boats[0].id], boat: boats[0].id, worlds: [worlds[0].id], world: worlds[0].id }
  const listeners = []

  // ---- load: only what makes sense is kept -------------------------------------------------------------------
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    if (saved && saved.version === VERSION) {
      if (Number.isFinite(saved.coins) && saved.coins > 0) own.coins = Math.floor(saved.coins)
      for (const item of saved.hold ?? []) if (FISH_BY_ID.has(item?.id) && Number.isFinite(item.weight) && item.weight > 0) own.hold.push({ id: item.id, weight: item.weight })
      for (const id of saved.boats ?? []) if (typeof id === 'string' && !own.boats.includes(id)) own.boats.push(id)
      for (const id of saved.worlds ?? []) if (typeof id === 'string' && !own.worlds.includes(id)) own.worlds.push(id)
      if (typeof saved.boat === 'string') own.boat = saved.boat
      if (typeof saved.world === 'string') own.world = saved.world
    }
  } catch {
    // unreadable: a fresh start
  }
  // What is in use must exist and be owned; otherwise the game's own.
  if (!boats.some((b) => b.id === own.boat) || !own.boats.includes(own.boat)) own.boat = boats[0].id
  if (!worlds.some((w) => w.id === own.world) || !own.worlds.includes(own.world)) own.world = worlds[0].id

  const save = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...own }))
    } catch {
      // not saved
    }
    for (const listener of listeners) listener()
  }
  const boatEntry = (id) => boats.find((b) => b.id === id)
  const worldEntry = (id) => worlds.find((w) => w.id === id)

  const economy = {
    onChange: (listener) => listeners.push(listener),
    get coins() {
      return own.coins
    },
    get hold() {
      return own.hold.map((item) => ({ ...item, fish: FISH_BY_ID.get(item.id) }))
    },
    get holdWeight() {
      return own.hold.reduce((sum, item) => sum + item.weight, 0)
    },
    get capacity() {
      return holdOfBoat(boatEntry(own.boat))
    },
    get boat() {
      return boatEntry(own.boat)
    },
    get world() {
      return worldEntry(own.world)
    },
    ownsBoat: (id) => own.boats.includes(id),
    ownsWorld: (id) => own.worlds.includes(id),

    // A fish is caught: it goes in the hold if there is room. Returns { kept, value }.
    addCatch(fish, weight) {
      const value = fishValue(fish, weight)
      if (economy.holdWeight + weight > economy.capacity + 1e-9) return { kept: false, value }
      own.hold.push({ id: fish.id, weight })
      save()
      return { kept: true, value }
    },

    // Sells the whole hold (or the fish at `index`). Returns the coins it brought.
    sell(index = null) {
      const items = index === null ? own.hold.splice(0) : own.hold.splice(index, 1)
      const gained = items.reduce((sum, item) => sum + fishValue(FISH_BY_ID.get(item.id), item.weight), 0)
      own.coins += gained
      save()
      return gained
    },
    sellable: () => own.hold.reduce((sum, item) => sum + fishValue(FISH_BY_ID.get(item.id), item.weight), 0),

    // Buying. Each returns { ok: true } or { ok: false, reason }.
    buyBoat(id) {
      const entry = boatEntry(id)
      if (!entry) return { ok: false, reason: 'unknown boat' }
      if (own.boats.includes(id)) return { ok: false, reason: 'already yours' }
      const price = priceOfBoat(entry)
      if (own.coins < price) return { ok: false, reason: `needs ${price - own.coins} more coins` }
      own.coins -= price
      own.boats.push(id)
      save()
      return { ok: true }
    },
    equipBoat(id) {
      if (!own.boats.includes(id) || !boatEntry(id)) return { ok: false, reason: 'not yours' }
      own.boat = id
      save()
      return { ok: true }
    },
    // A chart: needs the boat named in `requires` (if any) and the price.
    worldBlocked(id) {
      const entry = worldEntry(id)
      if (entry?.requires && !own.boats.includes(entry.requires)) return `needs the ${boatEntry(entry.requires)?.name ?? entry.requires}`
      return null
    },
    buyWorld(id) {
      const entry = worldEntry(id)
      if (!entry) return { ok: false, reason: 'unknown world' }
      if (own.worlds.includes(id)) return { ok: false, reason: 'already yours' }
      const blocked = economy.worldBlocked(id)
      if (blocked) return { ok: false, reason: blocked }
      const price = priceOfWorld(entry)
      if (own.coins < price) return { ok: false, reason: `needs ${price - own.coins} more coins` }
      own.coins -= price
      own.worlds.push(id)
      save()
      return { ok: true }
    },
    // Where the next start-up goes.
    setWorld(id) {
      if (!own.worlds.includes(id) || !worldEntry(id)) return { ok: false, reason: 'not yours' }
      own.world = id
      save()
      return { ok: true }
    },

    // Developer panel.
    addCoins(amount) {
      own.coins += amount
      save()
    },
    reset() {
      own.coins = 0
      own.hold = []
      own.boats = [boats[0].id]
      own.boat = boats[0].id
      own.worlds = [worlds[0].id]
      own.world = worlds[0].id
      save()
    },
  }
  return economy
}
