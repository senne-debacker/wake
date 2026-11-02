// Draws the fish of The Sunken Ruins (src/fishing/species/sunkenRuins.js) and writes them to blender/fish/w_003-sunken-ruins/:
//   <fish-id>.svg               the logbook illustration (120 x 60, the nose on the right, a transparent background)
//   <fish-id>-silhouette.svg    the same shape in one dark colour, for a fish that has not been caught yet
//   w_003-sunken-ruins-fish.json      the data of every fish
//   index.html                  an overview of all of them on paper, both versions
//   npm run export:ruins-fish
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const { SUNKEN_RUINS, AREAS, fileName } = await import('../src/fishing/species/sunkenRuins.js')
const { drawFish } = await import('../src/fishing/fishArt.js')
const dir = fileURLToPath(new URL('../blender/fish/w_003-sunken-ruins/', import.meta.url))
mkdirSync(dir, { recursive: true })
for (const old of readdirSync(dir).filter((f) => f.endsWith('.svg'))) rmSync(`${dir}${old}`) // (so a renamed fish leaves no old file behind)

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const finish = (markup, title) => markup.replace('<svg ', '<svg width="480" height="240" ').replace(/(<svg [^>]*>)/, `$1\n  <title>${escape(title)}</title>`)
const grams = (kg) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg} kg`)

const rows = []
for (const fish of SUNKEN_RUINS) {
  const name = fileName(fish)
  const picture = finish(drawFish(fish.art), fish.name)
  const silhouette = finish(drawFish({ ...fish.art, silhouette: true }), `${fish.name} (silhouette)`)
  writeFileSync(`${dir}${name}.svg`, picture + '\n')
  writeFileSync(`${dir}${name}-silhouette.svg`, silhouette + '\n')
  const shapes = (picture.match(/<(polygon|circle|ellipse|path|polyline)/g) ?? []).length
  rows.push({
    id: fish.id,
    name: fish.name,
    rarity: fish.rarity,
    gameRarity: fish.gameRarity,
    rodGroup: fish.rod,
    where: fish.where,
    when: fish.when,
    weightKg: { min: fish.weight[0], max: fish.weight[1] },
    weight: `${grams(fish.weight[0])} to ${grams(fish.weight[1])}`,
    valueCoins: fish.value,
    logbookLine: fish.logbook,
    illustration: `${name}.svg`,
    silhouette: `${name}-silhouette.svg`,
    shapes,
  })
}

const json = {
  world: 'The Sunken Ruins (Planet 4)',
  notes: [
    'All 16 names are as in the brief.',
    'The game gives every world 32 fish in five rarities (10 common, 9 uncommon, 7 rare, 5 epic, 1 legendary) and exactly one legendary fish per world, so `gameRarity` is what the fish would be there: The Drowned King stays legendary, Temple Arowana becomes epic.',
    'The brief has 16 fish and the game wants 32: 16 more would have to be designed (or the world given a smaller set) before it can go in the game.',
    'Rod groups, map areas and conditions (horn, lamp) are not mechanics of the game yet: they are written down here as designed.',
  ],
  areas: AREAS,
  priceRanges: { common: '14-30', uncommon: '60-100', rare: '260-340', legendary: '900-1,200' },
  fish: rows,
}
writeFileSync(`${dir}w_003-sunken-ruins-fish.json`, JSON.stringify(json, null, 2) + '\n')

const cards = rows
  .map((r) => {
    const base = r.illustration.replace('.svg', '')
    return `<div class="c ${r.rarity}"><div class="pair"><img src="${r.illustration}" alt="${r.name}"><img src="${r.silhouette}" alt="${r.name} silhouette"></div><b>${r.name}</b><i>${r.rarity} &middot; ${r.valueCoins} coins &middot; ${r.weight}</i><small>${r.where} &middot; ${r.when} &middot; rod: ${r.rodGroup}</small><p>${escape(r.logbookLine)}</p></div>`
  })
  .join('')
writeFileSync(
  `${dir}index.html`,
  `<!doctype html><meta charset="utf-8"><title>The Sunken Ruins: fish</title><style>body{margin:0;padding:20px;background:#e8d9bc;font:15px/1.35 'Nunito',system-ui,sans-serif;color:#1f2b3a}h1{font:800 40px 'Barlow Condensed',sans-serif;letter-spacing:.04em;margin:0 0 14px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}.c{background:#f1e6cc;border:2px solid #1f2b3a;padding:10px}.c.rare{border-color:#5b4b8a}.c.legendary{border-color:#7a4a12}.c.uncommon{border-color:#3f5e4a}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}img{width:100%;height:auto;display:block}b{display:block;font:700 22px 'Barlow Condensed',sans-serif;letter-spacing:.05em;text-transform:uppercase;margin-top:6px}i{display:block;color:#5a4a36}small{display:block;color:#5a4a36;margin:2px 0 6px}p{margin:0;font-style:italic}</style><h1>The Sunken Ruins</h1><main>${cards}</main>`,
)
console.log(`[ruins] ${rows.length} fish (illustration + silhouette each), the data and the overview written to blender/fish/w_003-sunken-ruins/`)
console.log(rows.map((r) => `${r.name} ${r.shapes}`).join(', '))
