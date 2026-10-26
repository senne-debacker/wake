import { RARITIES } from './fishing/fishDatabase.js'
import { fishValue, priceOfBoat, holdOfBoat, priceOfWorld } from './economy.js'
import { formatWeight } from './fishing/fishDatabase.js'

// The harbour screen (markup #harbour in index.html, look in style.css): three tabs.
//   Sell    the hold, fish by fish or all at once, at the price of each rarity
//   Boats   every boat of the game (public/models/boats): buy it, use it
//   Charts  every world (public/models/worlds): buy the chart, sail there (the page reloads into that world)
// It only shows and asks: the money and the belongings are the economy's (economy.js); `onEquip(id)` switches the
// boat in the scene and `onTravel(id)` leaves for another world (both are main.js). Esc closes it.
//
//   createHarbourScreen({ economy, boats, worlds, onEquip, onTravel, onClose, onSold }) -> { open, close, isOpen }
export function createHarbourScreen({ economy, boats, worlds, onEquip, onTravel, onClose, onSold }) {
  const $ = (id) => document.getElementById(id)
  const root = $('harbour')
  const purse = $('harbour-purse')
  const note = $('harbour-note')
  const tabs = [...root.querySelectorAll('[data-tab]')]
  const panels = { sell: $('harbour-sell'), boats: $('harbour-boats'), charts: $('harbour-charts') }
  let open = false
  let openedAt = 0
  let tab = 'sell'
  // The tap that opens it (the anchor button, on a phone) is still going on when it appears: ignore taps for a moment.
  const tapSettled = () => performance.now() - openedAt > 400

  const el = (tag, className, text) => {
    const element = document.createElement(tag)
    if (className) element.className = className
    if (text !== undefined) element.textContent = text
    return element
  }
  const button = (label, onClick, { disabled = false, primary = false, title = '' } = {}) => {
    const b = el('button', primary ? 'h-button primary' : 'h-button', label)
    b.type = 'button'
    b.disabled = disabled
    if (title) b.title = title
    b.addEventListener('click', () => tapSettled() && onClick())
    return b
  }
  const say = (text) => (note.textContent = text)
  const coins = (n) => `${n.toLocaleString('en')} coin${n === 1 ? '' : 's'}`

  function showPurse() {
    purse.textContent = `${coins(economy.coins)}  ·  hold ${economy.holdWeight.toFixed(1)} / ${economy.capacity} kg`
  }

  // ---- Sell -------------------------------------------------------------------------------------------------
  function drawSell() {
    const panel = panels.sell
    panel.replaceChildren()
    const hold = economy.hold
    if (!hold.length) {
      panel.append(el('p', 'h-empty', 'Your hold is empty. Catch some fish first: sail to the bubbling water and drop the anchor.'))
      return
    }
    const list = el('div', 'h-list')
    hold.forEach((item, index) => {
      const row = el('div', 'h-row')
      row.style.setProperty('--rarity', RARITIES[item.fish.rarity].colour)
      const name = el('div', 'h-main')
      name.append(el('b', '', item.fish.name), el('span', 'h-sub', `${RARITIES[item.fish.rarity].label}  ·  ${formatWeight(item.weight)}`))
      const value = fishValue(item.fish, item.weight)
      row.append(name, el('span', 'h-price', coins(value)), button('Sell', () => sell(index)))
      list.append(row)
    })
    const total = economy.sellable()
    const footer = el('div', 'h-footer')
    footer.append(button(`Sell all  ·  ${coins(total)}`, () => sell(null), { primary: true }))
    panel.append(list, footer)
  }
  function sell(index) {
    const count = index === null ? economy.hold.length : 1
    const gained = economy.sell(index)
    say(`Sold ${count} fish for ${coins(gained)}.`)
    onSold?.(count, gained)
    refresh()
  }

  // ---- Boats ------------------------------------------------------------------------------------------------
  function drawBoats() {
    const panel = panels.boats
    panel.replaceChildren()
    const list = el('div', 'h-list')
    for (const entry of boats) {
      const owned = economy.ownsBoat(entry.id)
      const inUse = economy.boat.id === entry.id
      const price = priceOfBoat(entry)
      const row = el('div', inUse ? 'h-row active' : 'h-row')
      const main = el('div', 'h-main')
      main.append(el('b', '', entry.name), el('span', 'h-desc', entry.description), el('span', 'h-sub', `${entry.speed}, ${entry.handling}  ·  carries ${holdOfBoat(entry)} kg`))
      row.append(main)
      if (inUse) row.append(el('span', 'h-state', 'In use'))
      else if (owned) row.append(button('Use', () => equip(entry)))
      else {
        const missing = price - economy.coins
        row.append(button(`Buy  ·  ${coins(price)}`, () => buyBoat(entry), { disabled: missing > 0, title: missing > 0 ? `needs ${missing} more coins` : '' }))
      }
      list.append(row)
    }
    panel.append(list)
  }
  async function buyBoat(entry) {
    const result = economy.buyBoat(entry.id)
    say(result.ok ? `You bought the ${entry.name}.` : `Not yet: ${result.reason}.`)
    if (result.ok) onSold?.(0, 0)
    refresh()
  }
  async function equip(entry) {
    if (economy.holdWeight > holdOfBoat(entry)) {
      say(`Sell some fish first: the ${entry.name} carries ${holdOfBoat(entry)} kg and your hold has ${economy.holdWeight.toFixed(1)} kg.`)
      return
    }
    say('Changing boats...')
    const done = await onEquip(entry)
    if (!done) say(`The ${entry.name} could not be loaded.`)
    else say(`You are on the ${entry.name}.`)
    refresh()
  }

  // ---- Charts -----------------------------------------------------------------------------------------------
  function drawCharts() {
    const panel = panels.charts
    panel.replaceChildren()
    const list = el('div', 'h-list')
    for (const entry of worlds) {
      const owned = economy.ownsWorld(entry.id)
      const here = economy.world.id === entry.id
      const price = priceOfWorld(entry)
      const blocked = economy.worldBlocked(entry.id)
      const row = el('div', here ? 'h-row active' : 'h-row')
      const main = el('div', 'h-main')
      main.append(el('b', '', entry.name), el('span', 'h-desc', entry.description))
      if (!owned && blocked) main.append(el('span', 'h-sub warn', `Needs the ${blocked.replace(/^needs the /, '')}`))
      row.append(main)
      if (here) row.append(el('span', 'h-state', 'You are here'))
      else if (owned) row.append(button('Sail there', () => travel(entry), { primary: true }))
      else {
        const missing = price - economy.coins
        row.append(button(`Buy chart  ·  ${coins(price)}`, () => buyWorld(entry), { disabled: Boolean(blocked) || missing > 0, title: blocked ?? (missing > 0 ? `needs ${missing} more coins` : '') }))
      }
      list.append(row)
    }
    panel.append(list)
  }
  function buyWorld(entry) {
    const result = economy.buyWorld(entry.id)
    say(result.ok ? `You bought the chart of ${entry.name}.` : `Not yet: ${result.reason}.`)
    refresh()
  }
  function travel(entry) {
    if (!economy.setWorld(entry.id).ok) return
    say(`Setting sail for ${entry.name}...`)
    onTravel(entry)
  }

  // ---- the tabs and the screen -----------------------------------------------------------------------------
  function refresh() {
    showPurse()
    for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.tab === tab))
    for (const [name, panel] of Object.entries(panels)) panel.hidden = name !== tab
    if (tab === 'sell') drawSell()
    else if (tab === 'boats') drawBoats()
    else drawCharts()
  }
  for (const t of tabs) {
    t.addEventListener('click', () => {
      tab = t.dataset.tab
      say('')
      refresh()
    })
  }

  function close() {
    if (!open) return
    open = false
    removeEventListener('keydown', onKeyDown, true)
    root.classList.remove('show')
    document.activeElement?.blur?.()
    onClose?.()
  }
  function onKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!event.repeat) close()
    }
  }
  $('harbour-close').addEventListener('click', () => tapSettled() && close())
  root.addEventListener('pointerdown', (event) => event.target === root && tapSettled() && close())

  return {
    get isOpen() {
      return open
    },
    // `startTab`: 'sell' normally; 'sell' is also what you see first when you have fish.
    open(startTab = 'sell') {
      if (open) return
      open = true
      openedAt = performance.now()
      tab = startTab
      say('')
      refresh()
      root.classList.add('show')
      addEventListener('keydown', onKeyDown, true)
    },
    close,
    refresh,
  }
}
