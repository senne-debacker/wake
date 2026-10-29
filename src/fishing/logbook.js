import { RARITIES, FISH_SETS, HOME, FISH_BY_ID, fishInRarity, formatWeight } from './fishDatabase.js'
import { createFishViewer, loadFishModels } from './fishViewer.js'
import { describeHabitat } from './habitat.js'

// The fish logbook: which species you have caught, how many, and the heaviest of each. Saved in
// localStorage, so it survives reloads. Two parts: createLogbookStore is the bookkeeping (no DOM,
// checked in tests/fishing.check.mjs), createLogbook is the screen (#logbook in index.html).

const STORAGE_KEY = 'wake.logbook'

// localStorage can be missing or throw (private windows, blocked site data): then the book simply
// is not remembered.
function browserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function createLogbookStore(storage = browserStorage()) {
  const caught = new Map() // species id -> { count, best (kg) }
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    for (const [id, entry] of Object.entries(saved?.fish ?? {})) {
      // Only species that still exist, with sane numbers.
      if (FISH_BY_ID.has(id) && Number.isFinite(entry?.count) && entry.count > 0 && Number.isFinite(entry.best) && entry.best > 0) {
        caught.set(id, { count: Math.floor(entry.count), best: entry.best })
      }
    }
  } catch {
    // unreadable: start with an empty book
  }
  const save = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, fish: Object.fromEntries(caught) }))
    } catch {
      // not saved
    }
  }

  return {
    get: (id) => caught.get(id) ?? null,
    species: () => caught.size,
    total: () => [...caught.values()].reduce((sum, entry) => sum + entry.count, 0),

    // Writes a catch into the book. isNew: the first one of its species; isRecord: heavier than the
    // best one so far (a first catch is not called a record).
    record({ id, weight }) {
      if (!FISH_BY_ID.has(id)) throw new Error(`Unknown fish "${id}"`)
      const entry = caught.get(id) ?? { count: 0, best: 0 }
      const isNew = entry.count === 0
      const isRecord = !isNew && weight > entry.best
      caught.set(id, { count: entry.count + 1, best: Math.max(entry.best, weight) })
      save()
      return { isNew, isRecord }
    },

    clear() {
      caught.clear()
      save()
    },
  }
}

// The logbook screen: the species of one world at a time (a tab per world: `pages`, each { id, name, set } with `set`
// an array of species), shown as tiles (a black silhouette until you have caught one), grouped by rarity, and a
// detail panel for the selected one. The book opens on the page of the world you are in (`current`).
// `onClose` is called when it has been closed. Esc and B close it; they are stopped in the capture phase so the
// game does not see them.
export function createLogbook({ onClose, storage, pages = [{ id: HOME, name: 'Wake', set: FISH_SETS[HOME] }], current = pages[0].id } = {}) {
  const store = createLogbookStore(storage)
  const $ = (id) => document.getElementById(id)
  const root = $('logbook')
  const grid = $('logbook-grid')
  const tabs = $('logbook-tabs')
  const closeButton = $('logbook-close')
  const detail = { image: $('detail-image'), name: $('detail-name'), rarity: $('detail-rarity'), stats: $('detail-stats'), text: $('detail-text'), habitat: $('detail-habitat') }
  const tiles = new Map() // species id -> its button (the page showing)
  // A fish with a model file (public/models/fish/<world>/<id>.glb, blender/FISH.md) is a small 3D scene in the picture
  // frame once it has been caught, instead of its SVG.
  const viewer = createFishViewer()
  let models = new Set() // "<world>/<id>" of the fish that have a model
  let viewing = null // the key of the model in the frame now
  let page = pages.find((entry) => entry.id === current) ?? pages[0]
  let fishSet = page.set
  let selected = fishSet[0].id
  let open = false
  let openedAt = 0
  // The tap that opens the book (it opens on pointerdown) is still going on when the book appears, and
  // its click lands on whatever is under the finger now: ignore pointer closes for a moment.
  const tapSettled = () => performance.now() - openedAt > 400

  // The tabs: one per world (only when there is more than one).
  const tabButtons = new Map()
  tabs.hidden = pages.length < 2
  for (const entry of pages) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'logbook-tab'
    button.setAttribute('role', 'tab')
    button.dataset.page = entry.id
    const label = document.createElement('span')
    label.textContent = entry.name
    const count = document.createElement('small')
    button.append(label, count)
    tabs.append(button)
    tabButtons.set(entry.id, button)
  }
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('.logbook-tab')
    if (button) showPage(button.dataset.page)
  })

  // Builds the tiles of the showing page, grouped by rarity; refresh() only changes classes and text afterwards.
  function build() {
    grid.replaceChildren()
    tiles.clear()
    for (const [rarity, info] of Object.entries(RARITIES)) {
      if (!fishInRarity(rarity, fishSet).length) continue
      const group = document.createElement('section')
      group.className = 'logbook-group'
      group.style.setProperty('--rarity', info.colour)
      const heading = document.createElement('h3')
      heading.append(info.label)
      const count = document.createElement('small')
      count.dataset.rarity = rarity
      heading.append(count)
      const list = document.createElement('div')
      list.className = 'logbook-tiles'
      for (const fish of fishInRarity(rarity, fishSet)) {
        const tile = document.createElement('button')
        tile.type = 'button'
        tile.className = 'tile'
        tile.dataset.id = fish.id
        const image = document.createElement('span')
        image.className = 'tile-image'
        image.innerHTML = fish.imgUrl // our own static SVG strings (fishDatabase.js)
        const name = document.createElement('span')
        name.className = 'tile-name'
        tile.append(image, name)
        list.append(tile)
        tiles.set(fish.id, tile)
      }
      group.append(heading, list)
      grid.append(group)
    }
  }
  build()

  function showPage(id) {
    const next = pages.find((entry) => entry.id === id)
    if (!next || next === page) return
    page = next
    fishSet = page.set
    selected = fishSet[0].id
    build()
    grid.scrollTop = 0
    refresh()
  }

  function refresh() {
    for (const [id, tile] of tiles) {
      const entry = store.get(id)
      tile.classList.toggle('locked', !entry)
      tile.classList.toggle('selected', id === selected)
      tile.querySelector('.tile-name').textContent = entry ? FISH_BY_ID.get(id).name : '???'
    }
    for (const count of grid.querySelectorAll('small[data-rarity]')) {
      const species = fishInRarity(count.dataset.rarity, fishSet)
      count.textContent = `${species.filter((fish) => store.get(fish.id)).length} / ${species.length}`
    }
    $('logbook-count').textContent = `${fishSet.filter((fish) => store.get(fish.id)).length} / ${fishSet.length} species`
    for (const [id, button] of tabButtons) {
      const entry = pages.find((candidate) => candidate.id === id)
      button.setAttribute('aria-selected', String(entry === page))
      button.querySelector('small').textContent = `${entry.set.filter((fish) => store.get(fish.id)).length} / ${entry.set.length}`
    }

    const fish = FISH_BY_ID.get(selected)
    const entry = store.get(selected)
    const info = RARITIES[fish.rarity]
    $('logbook-detail').style.setProperty('--rarity', info.colour)
    const key = `${fish.set}/${fish.id}`
    const solid = Boolean(entry) && models.has(key)
    detail.image.classList.toggle('locked', !entry)
    detail.image.classList.toggle('model', solid)
    if (solid && open) {
      if (viewing !== key) {
        viewing = key
        detail.image.innerHTML = fish.imgUrl // (the picture shows until the model has loaded, or for good if it cannot)
        viewer.show(key, detail.image).then((ok) => {
          if (ok || viewing !== key) return
          viewing = null
          detail.image.classList.remove('model')
        })
      }
    } else {
      viewing = null
      viewer.hide()
      detail.image.innerHTML = fish.imgUrl
    }
    detail.name.textContent = entry ? fish.name : '???'
    detail.rarity.textContent = info.label
    // Caught / Best / Range as three cells (theme.css draws the lines between them).
    const cell = (label, value) => {
      const element = document.createElement('span')
      const small = document.createElement('small')
      small.textContent = label
      const big = document.createElement('b')
      big.textContent = value
      if (value.length > 9) big.classList.add('long') // ("180.0-520.0 kg" has to fit its cell)
      element.append(small, big)
      return element
    }
    const [low, high] = fish.weight.map(formatWeight)
    const range = low.split(' ')[1] === high.split(' ')[1] ? `${low.split(' ')[0]}-${high}` : `${low}-${high}` // "200-800 g"
    detail.stats.classList.toggle('empty', !entry)
    detail.stats.replaceChildren(
      ...(entry
        ? [cell('Caught', `${entry.count}\u00d7`), cell('Best', formatWeight(entry.best)), cell('Range', range)]
        : [cell('Caught', '\u2013'), cell('Best', '\u2013'), cell('Range', range)]),
    )
    detail.text.textContent = entry ? fish.description : 'Catch one to learn what it is.'
    // Rare and legendary fish bite better in the right weather and hour: a hint at first, the whole rule once caught.
    detail.habitat.hidden = !fish.habitat
    if (fish.habitat) detail.habitat.querySelector('span').textContent = entry ? describeHabitat(fish.habitat) : fish.habitat.hint
  }

  grid.addEventListener('click', (event) => {
    const tile = event.target.closest('.tile')
    if (!tile) return
    selected = tile.dataset.id
    refresh()
  })

  function close() {
    if (!open) return
    open = false
    removeEventListener('keydown', onKeyDown, true)
    root.classList.remove('show')
    viewing = null
    viewer.hide() // (no drawing while the book is shut)
    closeButton.blur()
    onClose?.()
  }
  function onKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.code === 'Escape' || (event.key.length === 1 && event.key.toLowerCase() === 'b')) {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!event.repeat) close()
    }
  }
  closeButton.addEventListener('click', () => tapSettled() && close())
  root.addEventListener('pointerdown', (event) => event.target === root && tapSettled() && close()) // a click on the dim area

  loadFishModels().then((list) => {
    models = list
    refresh()
  })
  refresh()

  return {
    store,
    get isOpen() {
      return open
    },
    // Records a catch (see createLogbookStore) and updates the screen.
    record(entry) {
      const result = store.record(entry)
      const home = pages.find((candidate) => candidate.set.some((fish) => fish.id === entry.id))
      if (home && home !== page) showPage(home.id) // (a catch shows on the page of its world)
      selected = entry.id
      refresh()
      return result
    },
    // Empties the book (developer mode).
    reset() {
      store.clear()
      refresh()
    },
    open() {
      if (open) return
      open = true
      openedAt = performance.now()
      showPage(current) // the book opens on the world you are in
      refresh()
      root.classList.add('show')
      closeButton.focus({ preventScroll: true })
      addEventListener('keydown', onKeyDown, true)
    },
    close,
    toggle() {
      if (open) close()
      else this.open()
    },
  }
}
