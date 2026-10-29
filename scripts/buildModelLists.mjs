// Reads the cards next to the models and writes the lists the game reads:
//   public/models/boats/<id>.txt   -> public/models/boats/boats.json     (blender/BOATS.md)
//   public/models/worlds/<id>.txt  -> public/models/worlds/worlds.json   (blender/WORLDS.md)
// A model is a pair of files: <id>.glb and <id>.txt. Runs before `npm run dev` and `npm run build`
// (and by hand: npm run models).
//
// Cards may also give the economy numbers (src/economy.js): a boat's `price` (coins) and `hold` (kg of fish it
// carries), `light` (how brightly its lamp shines, 1 = the starter boat; 0.8 = a little softer), a world's `price` (the chart), `requires` (the id of a boat you must own) and `fish` (its set of
// 32 fish, see src/fishing/fishDatabase.js: `home` or `frostmere`; no line means the home waters).
//
// A card is "key: value" lines; a value may go on indented lines below its key (the "anything special" of
// a world often does).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SPEED = ['slow', 'medium', 'fast']
const HANDLING = ['heavy', 'medium', 'nimble']

function readCard(path) {
  const card = {}
  let key = null
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z ]*?)\s*:\s*(.*?)\s*$/)
    if (match) {
      key = match[1].toLowerCase()
      card[key] = match[2]
    } else if (key && line.trim()) {
      card[key] = `${card[key]} ${line.trim().replace(/^-\s*/, '')}`.trim() // a continuation line
    }
  }
  return card
}

function build(kind, extra) {
  const dir = fileURLToPath(new URL(`../public/models/${kind}/`, import.meta.url))
  if (!existsSync(dir)) return
  const list = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
    const id = file.replace(/\.txt$/, '')
    if (!existsSync(`${dir}${id}.glb`)) {
      console.warn(`[models] ${kind}/${file} has no ${id}.glb next to it: skipped`)
      continue
    }
    const card = readCard(`${dir}${file}`)
    list.push({
      id,
      name: card.name ?? id,
      description: card.description ?? '',
      special: card['anything special'] ?? '',
      file: `models/${kind}/${id}.glb`,
      ...extra(card),
    })
  }
  writeFileSync(`${dir}${kind}.json`, JSON.stringify(list, null, 2) + '\n')
  console.log(`[models] ${kind}: ${list.map((entry) => entry.id).join(', ') || '-'}`)
}

const pick = (value, allowed, fallback) => (allowed.includes(String(value).toLowerCase()) ? String(value).toLowerCase() : fallback)
const number = (value) => (Number.isFinite(Number(value)) && String(value).trim() !== '' ? Number(value) : undefined) // (left out when the card has none: the game's defaults apply)
build('boats', (card) => ({ speed: pick(card.speed, SPEED, 'medium'), handling: pick(card.handling, HANDLING, 'medium'), price: number(card.price), hold: number(card.hold), light: number(card.light) }))

// The fish that have a 3D model: public/models/fish/<world>/<id>.glb (blender/FISH.md). The logbook shows those
// as a small 3D scene instead of the SVG (src/fishing/fishViewer.js). The list is "<world>/<id>" per model.
{
  const dir = fileURLToPath(new URL('../public/models/fish/', import.meta.url))
  const found = []
  if (existsSync(dir)) {
    for (const world of readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      for (const file of readdirSync(`${dir}${world.name}`).filter((f) => f.endsWith('.glb')).sort()) found.push(`${world.name}/${file.replace(/\.glb$/, '')}`)
    }
    writeFileSync(`${dir}fish3d.json`, JSON.stringify(found, null, 2) + '\n')
  }
  console.log(`[models] fish with a 3D model: ${found.join(', ') || '-'}`)
}
build('worlds', (card) => ({ price: number(card.price), requires: card.requires || undefined, fish: card.fish || undefined }))
