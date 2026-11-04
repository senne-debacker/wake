// Draws the fish that were designed for a world (src/fishing/species/sunkenRuins.js, riverlands.js) and writes them to
// blender/fish/<world id>/:
//   <fish-id>.svg               the logbook illustration (120 x 60, the nose on the right, a transparent background)
//   <fish-id>-silhouette.svg    the same shape in one dark colour, for a fish that has not been caught yet
//   <world id>-fish.json        the data of every fish
//   index.html                  an overview of all of them on paper, both versions
//   npm run export:ruins-fish    npm run export:riverlands-fish      (node scripts/exportFishDesign.mjs <ruins|riverlands>)
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const WORLDS = {
  ruins: {
    module: '../src/fishing/species/sunkenRuins.js', list: 'SUNKEN_RUINS', id: 'w_003-sunken-ruins', title: 'The Sunken Ruins (Planet 4)', short: 'ruins',
    priceRanges: { common: '14-30', uncommon: '60-100', rare: '260-340', legendary: '900-1,200' },
    notes: [
      'All 16 names are as in the brief.',
      'The game gives every world 32 fish in five rarities (10 common, 9 uncommon, 7 rare, 5 epic, 1 legendary) and exactly one legendary fish per world, so `gameRarity` is what the fish would be there: The Drowned King stays legendary, Temple Arowana becomes epic.',
      'The brief has 16 fish and the game wants 32: 16 more would have to be designed (or the world given a smaller set) before it can go in the game.',
      'Rod groups, map areas and conditions (horn, lamp) are not mechanics of the game yet: they are written down here as designed.',
    ],
  },
  riverlands: {
    module: '../src/fishing/species/riverlands.js', list: 'RIVERLANDS', id: 'w_005-riverlands', title: 'The Riverlands (Planet 3)', short: 'riverlands',
    priceRanges: { common: '10-24', uncommon: '45-80', rare: '150-220', epic: '260-400', legendary: '900' },
    notes: [
      'All 32 names are as in the brief (10 common, 9 uncommon, 7 rare, 5 epic, 1 legendary), the same split as every world of the game.',
      'The files are named by the game’s ids (f_005-1c01-river-roach, and -silhouette), not <FishName>.svg: see blender/NAMING.md.',
      'Not in the game yet: the card of the world still says it fishes the Harbour’s fish. Rod groups, map areas and the conditions (lamp on, the wheel turning again, fast water after rain) are not mechanics of the game, and the game’s fish are priced per kilo by rarity, not per fish: they are written down here as designed.',
      'The Golden Mahseer: the game has rain, so its condition stays "dawn, in fast water after rain".',
    ],
  },
}

const config = WORLDS[process.argv[2]]
if (!config) {
  console.error(`usage: node scripts/exportFishDesign.mjs <${Object.keys(WORLDS).join('|')}>`)
  process.exit(1)
}
const module = await import(config.module)
const fishList = module[config.list]
const { drawFish } = await import('../src/fishing/fishArt.js')
const dir = fileURLToPath(new URL(`../blender/fish/${config.id}/`, import.meta.url))
mkdirSync(dir, { recursive: true })
for (const old of readdirSync(dir).filter((f) => f.endsWith('.svg'))) rmSync(`${dir}${old}`) // (so a renamed fish leaves no old file behind)

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const finish = (markup, title) => markup.replace('<svg ', '<svg width="480" height="240" ').replace(/(<svg [^>]*>)/, `$1\n  <title>${escape(title)}</title>`)
const grams = (kg) => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg} kg`)

const rows = []
for (const fish of fishList) {
  const picture = finish(drawFish(fish.art), fish.name)
  const silhouette = finish(drawFish({ ...fish.art, silhouette: true }), `${fish.name} (silhouette)`)
  writeFileSync(`${dir}${fish.id}.svg`, picture + '\n')
  writeFileSync(`${dir}${fish.id}-silhouette.svg`, silhouette + '\n')
  rows.push({
    id: fish.id,
    name: fish.name,
    rarity: fish.rarity,
    gameRarity: fish.gameRarity ?? fish.rarity,
    rodGroup: fish.rod,
    where: fish.where,
    when: fish.when,
    weightKg: { min: fish.weight[0], max: fish.weight[1] },
    weight: `${grams(fish.weight[0])} to ${grams(fish.weight[1])}`,
    valueCoins: fish.value,
    logbookLine: fish.logbook,
    illustration: `${fish.id}.svg`,
    silhouette: `${fish.id}-silhouette.svg`,
    shapes: (picture.match(/<(polygon|circle|ellipse|path|polyline)/g) ?? []).length,
  })
}

const json = { world: config.title, notes: config.notes, areas: module.AREAS, priceRanges: config.priceRanges, fish: rows }
writeFileSync(`${dir}${config.id}-fish.json`, JSON.stringify(json, null, 2) + '\n')

const cards = rows
  .map((r) => `<div class="c ${r.rarity}"><div class="pair"><img src="${r.illustration}" alt="${r.name}"><img src="${r.silhouette}" alt="${r.name} silhouette"></div><b>${r.name}</b><i>${r.rarity} &middot; ${r.valueCoins} coins &middot; ${r.weight}</i><small>${r.where} &middot; ${r.when} &middot; rod: ${r.rodGroup}</small><p>${escape(r.logbookLine)}</p></div>`)
  .join('')
writeFileSync(
  `${dir}index.html`,
  `<!doctype html><meta charset="utf-8"><title>${escape(config.title)}: fish</title><style>body{margin:0;padding:20px;background:#e8d9bc;font:15px/1.35 'Nunito',system-ui,sans-serif;color:#1f2b3a}h1{font:800 40px 'Barlow Condensed',sans-serif;letter-spacing:.04em;margin:0 0 14px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}.c{background:#f1e6cc;border:2px solid #1f2b3a;padding:10px}.c.rare{border-color:#5b4b8a}.c.epic{border-color:#1f6670}.c.legendary{border-color:#7a4a12}.c.uncommon{border-color:#3f5e4a}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}img{width:100%;height:auto;display:block}b{display:block;font:700 22px 'Barlow Condensed',sans-serif;letter-spacing:.05em;text-transform:uppercase;margin-top:6px}i{display:block;color:#5a4a36}small{display:block;color:#5a4a36;margin:2px 0 6px}p{margin:0;font-style:italic}</style><h1>${escape(config.title)}</h1><main>${cards}</main>`,
)

// The brief's own rules, checked: the split, the price ranges, the weights, the shapes per fish.
const problems = []
const counts = Object.fromEntries(['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => [r, rows.filter((x) => x.rarity === r).length]))
if (config.short === 'riverlands') {
  if (Object.values(counts).join() !== '10,9,7,5,1') problems.push(`the split is ${Object.values(counts).join('/')}, not 10/9/7/5/1`)
  const ranges = { common: [10, 24], uncommon: [45, 80], rare: [150, 220], epic: [260, 400], legendary: [900, 900] }
  for (const r of rows) if (r.valueCoins < ranges[r.rarity][0] || r.valueCoins > ranges[r.rarity][1]) problems.push(`${r.name}: ${r.valueCoins} coins is outside ${ranges[r.rarity].join('-')}`)
  for (const r of rows) if (r.weightKg.max > 18) problems.push(`${r.name}: heavier than 18 kg`)
}
for (const r of rows) if (r.shapes > 48) problems.push(`${r.name}: ${r.shapes} shapes (a few dozen at most)`)
console.log(`[${config.short}] ${rows.length} fish (illustration + silhouette each), the data and the overview written to blender/fish/${config.id}/  ${JSON.stringify(counts)}`)
console.log(problems.length ? `PROBLEMS: ${problems.join('; ')}` : `all rules of the brief hold; most shapes in one fish: ${Math.max(...rows.map((r) => r.shapes))}`)
