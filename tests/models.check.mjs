// Checks of the model folders (blender/NAMING.md), run with `npm run check`. No browser needed.
//   - every id is lowercase words joined by dashes, and a card's `id:` is its file name
//   - every boat and world the game loads has its Blender source, blender/<kind>/<id>.blend, and the other way round
//   - versions (-v2) and backups stay out of the live folders

import { readdirSync, readFileSync, existsSync } from 'node:fs'

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures++
}

// Blender files that have no model in the game on purpose (work in progress, or a model loaded without a card).
const ONLY_IN_BLENDER = { boats: [], worlds: [] }
// b_001-tug, w_001-harbour: a letter for the kind, a number of three digits, a dash, the name (words joined by dashes)
const ID = { boats: /^b_\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/, worlds: /^w_\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/ }

const ids = (dir, ext) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)) : [])

for (const kind of ['boats', 'worlds']) {
  const live = ids(`public/models/${kind}`, '.glb')
  const cards = ids(`public/models/${kind}`, '.txt')
  const blends = ids(`blender/${kind}`, '.blend')
  const all = [...live, ...cards, ...blends]
  check(`${kind}: every file name is an id (b_001-tug / w_001-harbour)`, all.every((id) => ID[kind].test(id)), all.filter((id) => !ID[kind].test(id)).join())
  check(`${kind}: no version numbers outside archive/`, all.every((id) => !/-v\d+$/.test(id)), all.filter((id) => /-v\d+$/.test(id)).join())
  const numbers = [...new Set(all.map((id) => id.slice(0, 5)))]
  const taken = numbers.filter((n) => new Set(all.filter((id) => id.startsWith(n)).map((id) => id.slice(5))).size > 1)
  check(`${kind}: every number is one thing (two ids never share a number)`, taken.length === 0, taken.join())
  const badCards = cards.filter((id) => {
    const line = readFileSync(`public/models/${kind}/${id}.txt`, 'utf8').match(/^id:\s*(\S+)/m)
    return line && line[1] !== id
  })
  check(`${kind}: every card's id: is its file name`, badCards.length === 0, badCards.join())
  const noBlend = live.filter((id) => !blends.includes(id))
  check(`${kind}: every model in public/models/${kind} has blender/${kind}/<id>.blend`, noBlend.length === 0, noBlend.join())
  const noModel = blends.filter((id) => !live.includes(id) && !ONLY_IN_BLENDER[kind].includes(id))
  check(`${kind}: every .blend has its model in public/models/${kind} (or is listed as Blender only)`, noModel.length === 0, noModel.join())
  const stray = existsSync(`blender/${kind}`) ? readdirSync(`blender/${kind}`).filter((f) => f.endsWith('.glb') && !(kind === 'worlds' && ['w_000-wake.glb', 'wake-base-world.glb'].includes(f))) : []
  check(`${kind}: no .glb files in blender/${kind} except templates (they belong in public/models or archive/)`, stray.length === 0, stray.join())
}

console.log(failures ? `\n${failures} model check(s) FAILED` : '\nall model checks passed')
process.exit(failures ? 1 : 0)
