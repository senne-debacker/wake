// Economy checks: money, the hold, selling, buying boats and charts, and the save.
import { createEconomy, fishValue, priceOfBoat, holdOfBoat, priceOfWorld, DEFAULTS } from '../src/economy.js'
import { FISH_BY_ID, RARITIES } from '../src/fishing/fishDatabase.js'

let failed = 0
const check = (name, ok, detail = '') => {
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`)
}
const memory = () => {
  const map = new Map()
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), raw: map }
}
const boats = [
  { id: 'fishing-boat', name: 'Fishing Boat', price: 0, hold: 25 },
  { id: 'dinghy', name: 'Dinghy', price: 150, hold: 10 },
  { id: 'sloop', name: 'Sloop', price: 900, hold: 30 },
  { id: 'plain', name: 'A boat without numbers' },
]
const worlds = [
  { id: 'wake', name: 'Wake' },
  { id: 'snow', name: 'Frostmere', price: 600, requires: 'sloop' },
  { id: 'far', name: 'Far' },
]
const herring = FISH_BY_ID.get('dusk-herring')
const eater = FISH_BY_ID.get('wake-eater')

// values
check('value: weight times the rarity price, at least 1 coin', fishValue(herring, 0.5) === Math.max(1, Math.round(0.5 * RARITIES.common.price)) && fishValue(eater, 200) === 200 * RARITIES.legendary.price && fishValue(herring, 0.01) === 1)
check('defaults: a card without numbers gets the default price and hold', priceOfBoat(boats[3]) === DEFAULTS.boatPrice && holdOfBoat(boats[3]) === DEFAULTS.boatHold && priceOfWorld(worlds[2]) === DEFAULTS.worldPrice)

// the hold and selling
{
  const e = createEconomy({ boats, worlds, storage: memory() })
  check('start: no coins, an empty hold, the game\'s own boat and world', e.coins === 0 && e.hold.length === 0 && e.boat.id === 'fishing-boat' && e.world.id === 'wake' && e.capacity === 25)
  check('hold: a catch is kept while there is room', e.addCatch(herring, 0.5).kept && e.holdWeight === 0.5)
  check('hold: a catch that does not fit is not kept', !e.addCatch(eater, 200).kept && e.holdWeight === 0.5)
  e.addCatch(herring, 0.4)
  const worth = e.sellable()
  check('sell: all of it brings the sum of the values and empties the hold', e.sell() === worth && e.coins === worth && e.hold.length === 0 && worth === fishValue(herring, 0.5) + fishValue(herring, 0.4))
  e.addCatch(herring, 0.3); e.addCatch(herring, 0.2)
  check('sell: one fish by its place in the hold', e.sell(0) === fishValue(herring, 0.3) && e.hold.length === 1)
}

// buying
{
  const e = createEconomy({ boats, worlds, storage: memory() })
  check('buy: not enough coins is refused and nothing changes', !e.buyBoat('dinghy').ok && e.coins === 0 && !e.ownsBoat('dinghy'))
  e.addCoins(1000)
  check('buy: a boat costs its price and is then owned', e.buyBoat('dinghy').ok && e.coins === 850 && e.ownsBoat('dinghy') && !e.buyBoat('dinghy').ok)
  check('equip: only an owned boat can be used, and the hold follows', !e.equipBoat('sloop').ok && e.equipBoat('dinghy').ok && e.boat.id === 'dinghy' && e.capacity === 10)
  check('chart: a world that needs a boat is blocked until you own it', e.worldBlocked('snow') !== null && !e.buyWorld('snow').ok && e.coins === 850)
  e.addCoins(1500)
  e.buyBoat('sloop')
  check('chart: with the boat and the coins it can be bought and set as the next world', e.worldBlocked('snow') === null && e.buyWorld('snow').ok && e.setWorld('snow').ok && e.world.id === 'snow')
  check('chart: a world you do not own cannot be set', !e.setWorld('far').ok)
}

// the save
{
  const storage = memory()
  const a = createEconomy({ boats, worlds, storage })
  a.addCoins(2000); a.buyBoat('sloop'); a.equipBoat('sloop'); a.addCatch(herring, 0.5)
  const b = createEconomy({ boats, worlds, storage })
  check('save: everything comes back', b.coins === a.coins && b.boat.id === 'sloop' && b.ownsBoat('sloop') && b.hold.length === 1 && b.hold[0].fish.id === 'dusk-herring')
  // a boat that was removed from the list: no longer offered, the game's own is used instead, coins stay
  const c = createEconomy({ boats: boats.filter((x) => x.id !== 'sloop'), worlds, storage })
  check('save: a boat that is gone falls back to the first and keeps the coins', c.boat.id === 'fishing-boat' && c.coins === a.coins)
  // prices come from the cards as they are now
  const d = createEconomy({ boats: boats.map((x) => (x.id === 'dinghy' ? { ...x, price: 1 } : x)), worlds, storage: memory() })
  d.addCoins(1)
  check('save: a changed price on a card applies at once', d.buyBoat('dinghy').ok)
  storage.setItem('wake.save', '{ not json')
  check('save: a damaged save gives a fresh start', createEconomy({ boats, worlds, storage }).coins === 0)
  storage.setItem('wake.save', JSON.stringify({ version: 1, coins: 5, hold: [{ id: 'no-such-fish', weight: 1 }, { id: 'dusk-herring', weight: -2 }, { id: 'dusk-herring', weight: 0.3 }], boats: ['ghost'], boat: 'ghost', worlds: [], world: 'nowhere' }))
  const f = createEconomy({ boats, worlds, storage })
  check('save: unknown fish and bad numbers are dropped, an unknown boat or world falls back', f.coins === 5 && f.hold.length === 1 && f.boat.id === 'fishing-boat' && f.world.id === 'wake')
}

console.log(failed ? `\n${failed} economy check(s) FAILED` : '\nall economy checks passed')
process.exit(failed ? 1 : 0)
