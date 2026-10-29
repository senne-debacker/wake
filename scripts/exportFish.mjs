// Writes every fish as a stand-alone SVG file, for making 3D models from them or drawing them better:
//   npm run export:fish  ->  public/models/fish/<world>/<id>.svg   (+ an index.txt)
// The pictures are the ones the game draws (src/fishing/fishDatabase.js): 120 x 60, the fish faces right (the
// nose is on the right), flat polygons, nothing but <polygon>, <path>, <polyline> and <circle>. Each file is also
// given a size (480 x 240), a <title> and its rarity. Run again after changing a fish; the files are not read
// by the game.
import { mkdirSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const { FISH_SETS, RARITIES, formatWeight } = await import('../src/fishing/fishDatabase.js')
const root = fileURLToPath(new URL('../public/models/fish/', import.meta.url))
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')

// Only the SVGs are replaced: anything else in the folder stays.
if (existsSync(root)) {
  for (const world of readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
    for (const file of readdirSync(`${root}${world.name}`).filter((f) => f.endsWith('.svg'))) rmSync(`${root}${world.name}/${file}`)
  }
}
const index = ['Wake: every fish, as an SVG (npm run export:fish writes these; they are made from src/fishing).', 'The nose is on the right. The picture is 120 x 60, here shown at 480 x 240.', '']
for (const [world, list] of Object.entries(FISH_SETS)) {
  mkdirSync(`${root}${world}`, { recursive: true })
  index.push(`${world}  (${list.length} fish)`)
  for (const fish of list) {
    const svg = fish.imgUrl
      .replace('<svg ', '<svg width="480" height="240" ')
      .replace(/(<svg [^>]*>)/, `$1\n  <title>${escape(fish.name)} (${RARITIES[fish.rarity].label})</title>`)
    writeFileSync(`${root}${world}/${fish.id}.svg`, svg + '\n')
    index.push(`  ${world}/${fish.id}.svg   ${fish.name}, ${RARITIES[fish.rarity].label}, ${formatWeight(fish.weight[0])} to ${formatWeight(fish.weight[1])}`)
  }
  index.push('')
}
writeFileSync(`${root}index.txt`, index.join('\n'))
console.log(`[fish] ${Object.values(FISH_SETS).flat().length} svg files in public/models/fish/`)
