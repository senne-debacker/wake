// Reads the boat cards (public/models/boats/<id>.txt, see blender/BOATS.md) and writes
// public/models/boats/boats.json, the list the game reads. Runs before `npm run dev` and `npm run build`
// (and by hand: npm run boats). A boat is a pair of files: <id>.glb and <id>.txt.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../public/models/boats/', import.meta.url))
const SPEED = ['slow', 'medium', 'fast']
const HANDLING = ['heavy', 'medium', 'nimble']
const boats = []
for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
  const id = file.replace(/\.txt$/, '')
  if (!existsSync(`${dir}${id}.glb`)) {
    console.warn(`[boats] ${file} has no ${id}.glb next to it: skipped`)
    continue
  }
  const card = {}
  for (const line of readFileSync(`${dir}${file}`, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z ]+?)\s*:\s*(.+?)\s*$/)
    if (match) card[match[1].toLowerCase()] = match[2]
  }
  const pick = (value, allowed, fallback) => (allowed.includes(String(value).toLowerCase()) ? String(value).toLowerCase() : fallback)
  boats.push({
    id,
    name: card.name ?? id,
    description: card.description ?? '',
    speed: pick(card.speed, SPEED, 'medium'),
    handling: pick(card.handling, HANDLING, 'medium'),
    special: card['anything special'] ?? '',
    file: `models/boats/${id}.glb`,
  })
}
writeFileSync(`${dir}boats.json`, JSON.stringify(boats, null, 2) + '\n')
console.log(`[boats] ${boats.length} boats: ${boats.map((b) => b.id).join(', ') || '-'}`)
