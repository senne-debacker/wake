// Checks of the fishing rules, run with `npm run check`. No browser needed: the fish database, the
// fight rules and the logbook's bookkeeping have no DOM in them. Exits with an error if a check fails.
//
//   1. database  32 species per world (10 / 9 / 7 / 5 / 1 per rarity), clean SVGs and svg files, drop rates really are the drop rates
//   2. fight     the rules of the minigame: hold = progress slowly and tension quickly, release = tension
//                drops, 100% tension snaps, 100% progress lands the fish, pulls are announced, a careful
//                player can win at every difficulty and one that just holds cannot
//   3. logbook   new species / personal best, saved and loaded, survives a broken or missing storage
//   4. spots     where the fishing spots are (open water with room to anchor, deterministic, the rest of
//                the world untouched) and how they behave (nearest, empty until midnight after a catch)

import { existsSync } from 'node:fs'
import { Vector3 } from 'three/webgpu'
import { FISHING, PLANET } from '../src/config.js'
import { createLayout } from '../src/world/layout.js'
import { createFishingSpots } from '../src/scene/fishingSpots.js'
import {
  FISH_SPECIES, FISH_SETS, FISH_BY_ID, RARITIES, fishSet, fishInRarity, rollRarity, rollFish, rollWeight, formatWeight, speciesWeights,
} from '../src/fishing/fishDatabase.js'
import { createFight, stepFight } from '../src/fishing/fishingMinigame.js'
import { createLogbookStore } from '../src/fishing/logbook.js'
import { habitatActive, describeHabitat, inHours, WEATHER_KINDS } from '../src/fishing/habitat.js'

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures++
}
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ---- 1. database -----------------------------------------------------------------------------------
{
  check('database: 32 species in each world, 64 in all', Object.values(FISH_SETS).every((set) => set.length === 32) && FISH_SPECIES.length === 64 && Object.keys(FISH_SETS).join() === 'home,frostmere', `${FISH_SPECIES.length}`)
  for (const [name, set] of Object.entries(FISH_SETS)) {
    const counts = Object.keys(RARITIES).map((rarity) => fishInRarity(rarity, set).length)
    check(`database: ${name} has 10 common, 9 uncommon, 7 rare, 5 epic and exactly 1 legendary`, counts.join() === '10,9,7,5,1', counts.join(' / '))
  }
  check('database: the Wake-Eater is the home waters\u2019 only legendary fish', fishInRarity('legendary', FISH_SETS.home).map((f) => f.id).join() === 'wake-eater')
  check('database: every species knows its set, and no species is in two', FISH_SPECIES.every((f) => FISH_SETS[f.set].includes(f)) && FISH_SETS.home.every((f) => f.set === 'home') && FISH_SETS.frostmere.every((f) => f.set === 'frostmere'))
  check('database: a missing or unknown fish set is the home waters', fishSet(undefined) === FISH_SETS.home && fishSet('nowhere') === FISH_SETS.home && fishSet('frostmere') === FISH_SETS.frostmere)
  check('database: every species has a known rarity', FISH_SPECIES.every((fish) => fish.rarity in RARITIES))
  check('database: ids and names are unique', new Set(FISH_SPECIES.map((f) => f.id)).size === 64 && new Set(FISH_SPECIES.map((f) => f.name)).size === 64 && FISH_BY_ID.size === 64)
  check('database: ids are plain slugs (the logbook is saved under them)', FISH_SPECIES.every((f) => /^[a-z]+(-[a-z]+)*$/.test(f.id)))
  check('database: weight ranges are sane (0 < min < max)', FISH_SPECIES.every((f) => f.weight.length === 2 && f.weight[0] > 0 && f.weight[0] < f.weight[1]))
  check('database: rarer fish can be heavier', Object.values(FISH_SETS).every((set) => Math.max(...fishInRarity('legendary', set).map((f) => f.weight[1])) > Math.max(...fishInRarity('common', set).map((f) => f.weight[1])) * 20))
  check('database: every species has a description', FISH_SPECIES.every((f) => typeof f.description === 'string' && f.description.length > 20))

  // The pictures: inline SVG, same size, and nothing that could clash or run.
  const problems = []
  for (const fish of FISH_SPECIES) {
    const svg = fish.imgUrl
    if (!/^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*viewBox="0 0 120 60"[^>]*>/.test(svg) || !svg.trimEnd().endsWith('</svg>')) problems.push(`${fish.id}: not a 120 x 60 svg`)
    if (/\sid\s*=|url\(|<script|\son\w+\s*=|href|<image|<foreignObject|<style/i.test(svg)) problems.push(`${fish.id}: id / reference / script`)
    // Tags balance (self-closing ones excluded).
    const stack = []
    for (const [, closing, name, , selfClosing] of svg.matchAll(/<(\/?)([a-zA-Z]+)((?:"[^"]*"|[^>"])*?)(\/?)>/g)) {
      if (selfClosing) continue
      if (!closing) stack.push(name)
      else if (stack.pop() !== name) problems.push(`${fish.id}: </${name}> does not match`)
    }
    if (stack.length) problems.push(`${fish.id}: ${stack.join()} not closed`)
    if (!/<(polygon|path|circle|ellipse)/.test(svg)) problems.push(`${fish.id}: empty picture`)
  }
  check('database: every picture is a clean, balanced 120 x 60 inline svg without ids, references or scripts', problems.length === 0, problems.join('; '))
  check('database: every species has a SVG file in public/models/fish (npm run export:fish)', FISH_SPECIES.every((f) => existsSync(new URL(`../public/models/fish/${f.set}/${f.id}.svg`, import.meta.url))), FISH_SPECIES.filter((f) => !existsSync(new URL(`../public/models/fish/${f.set}/${f.id}.svg`, import.meta.url))).map((f) => f.id).join())
  check('database: drop rates add up to 1 and difficulty rises with rarity', Math.abs(Object.values(RARITIES).reduce((sum, r) => sum + r.rate, 0) - 1) < 1e-9 && Object.values(RARITIES).every((r, i, all) => i === 0 || (r.difficulty > all[i - 1].difficulty && r.rate < all[i - 1].rate)))

  // Rolling: the observed shares match the rates, every species can come up, weights stay in range.
  const random = mulberry32(7)
  const draws = 300000
  const seen = new Map(FISH_SETS.home.map((f) => [f.id, 0]))
  const byRarity = Object.fromEntries(Object.keys(RARITIES).map((name) => [name, 0]))
  for (let i = 0; i < draws; i++) {
    const fish = rollFish(random)
    seen.set(fish.id, seen.get(fish.id) + 1)
    byRarity[fish.rarity]++
  }
  const worst = Object.entries(RARITIES).reduce((w, [name, r]) => Math.max(w, Math.abs(byRarity[name] / draws - r.rate)), 0)
  check('rolling: the share of each rarity matches its drop rate', worst < 0.004, `worst deviation ${(worst * 100).toFixed(2)} points over ${draws} rolls; ${Object.values(byRarity).join(' / ')}`)
  check('rolling: every species comes up', [...seen.values()].every((n) => n > 0), `rarest seen ${Math.min(...seen.values())} times`)
  {
    // The other world rolls its own fish only, with the same odds.
    const frost = new Map(FISH_SETS.frostmere.map((f) => [f.id, 0]))
    const r = mulberry32(21)
    let foreign = 0
    for (let i = 0; i < 200000; i++) {
      const fish = rollFish(r, null, FISH_SETS.frostmere)
      if (!frost.has(fish.id)) foreign++
      else frost.set(fish.id, frost.get(fish.id) + 1)
    }
    const glacier = frost.get('glacier-maw') / 200000
    check('rolling: Frostmere rolls only Frostmere\u2019s fish, every one of them, the legendary at its rate', foreign === 0 && [...frost.values()].every((n) => n > 0) && Math.abs(glacier - RARITIES.legendary.rate) < 0.003, `legendary ${(glacier * 100).toFixed(2)}%`)
  }
  const share = (rarity) => fishInRarity(rarity).map((f) => seen.get(f.id) / byRarity[rarity])
  check('rolling: within a rarity every species is about equally likely', Object.keys(RARITIES).every((rarity) => share(rarity).every((s) => Math.abs(s - 1 / fishInRarity(rarity).length) < 0.02)))
  check('rolling: rollRarity never returns an unknown name, even at the extremes', [0, 0.5199, 0.52, 0.7899, 0.79, 0.9299, 0.93, 0.9849, 0.985, 0.999999].every((x) => rollRarity(() => x) in RARITIES) && rollRarity(() => 0) === 'common' && rollRarity(() => 0.999999) === 'legendary')
  let outside = 0, sum = 0
  const heavy = FISH_BY_ID.get('wake-eater')
  for (let i = 0; i < 20000; i++) {
    const w = rollWeight(heavy, random)
    sum += w
    if (w < heavy.weight[0] || w > heavy.weight[1]) outside++
  }
  const [lo, hi] = heavy.weight
  check('rolling: weights stay in the species range, lighter ones are more common', outside === 0 && sum / 20000 < (lo + hi) / 2, `mean ${(sum / 20000).toFixed(0)} kg of ${lo}-${hi}`)

  // Habitats: only rare and legendary fish have one, the rule is checked against the weather and the hour,
  // and a fish whose habitat is right comes up about `boost` times as often.
  const withHabitat = FISH_SPECIES.filter((f) => f.habitat)
  check('habitat: only rare, epic and legendary species have one, each with a hint and a boost above 1', withHabitat.length > 0 && withHabitat.every((f) => (f.rarity === 'rare' || f.rarity === 'epic' || f.rarity === 'legendary') && f.habitat.hint && f.habitat.boost > 1 && (f.habitat.weather || f.habitat.hours) && (!f.habitat.weather || f.habitat.weather in WEATHER_KINDS)))
  check('habitat: the wake-eater wants a thunderstorm between 02:00 and 04:00', (() => {
    const h = FISH_BY_ID.get('wake-eater').habitat
    const storm = { storm: 1, cover: 1, rain: 1 }
    return habitatActive(h, { ...storm, hour: 3 }) && !habitatActive(h, { ...storm, hour: 4 }) && !habitatActive(h, { ...storm, hour: 1.9 }) && !habitatActive(h, { storm: 1, cover: 1, rain: 0, hour: 3 }) && !habitatActive(h, { storm: 0, cover: 0.1, rain: 0, hour: 3 }) && !habitatActive(h, null)
  })())
  check('habitat: hours wrap past midnight', inHours(23, [22, 2]) && inHours(1.5, [22, 2]) && !inHours(2, [22, 2]) && !inHours(12, [22, 2]) && inHours(12, [10, 14]) && !inHours(14, [10, 14]))
  check('habitat: the text spells the rule out', describeHabitat(FISH_BY_ID.get('wake-eater').habitat) === 'Twice as likely to bite during a thunderstorm, between 02:00 and 04:00.' && describeHabitat(FISH_BY_ID.get('bonewhistle').habitat) === 'Twice as likely to bite in rough weather.', describeHabitat(FISH_BY_ID.get('old-moonfin').habitat))
  check('habitat: weights add up to 1 without conditions and every boost shows when its habitat is right', (() => {
    const sum = (w) => w.reduce((a, b) => a + b, 0)
    if (Math.abs(sum(speciesWeights()) - 1) > 1e-9) return false
    const storm = speciesWeights({ hour: 3, storm: 1, cover: 1, rain: 1 })
    const i = FISH_SPECIES.findIndex((f) => f.id === 'wake-eater')
    return Math.abs(storm[i] / speciesWeights()[i] - 2) < 1e-9
  })())
  const rollShare = (id, conditions) => {
    const r = mulberry32(11)
    let n = 0
    for (let i = 0; i < 400000; i++) if (rollFish(r, conditions).id === id) n++
    return n / 400000
  }
  const night = { hour: 3, storm: 1, cover: 1, rain: 1 }
  const ratio = rollShare('wake-eater', night) / rollShare('wake-eater', { hour: 12, storm: 0, cover: 0.1, rain: 0 })
  check('habitat: the wake-eater is about twice as likely in a thunderstorm at 03:00', ratio > 1.85 && ratio < 2.1, `${ratio.toFixed(2)} times`)
  check('habitat: a boost in the wrong hour or weather changes nothing', Math.abs(rollShare('wake-eater', { hour: 3, storm: 0, cover: 0.1, rain: 0 }) - rollShare('wake-eater', null)) < 0.002)
  check('weight text: grams below a kilo, kilos above', formatWeight(0.25) === '250 g' && formatWeight(0.05) === '50 g' && formatWeight(2.44) === '2.4 kg' && formatWeight(0.9996) === '1.0 kg' && formatWeight(143.26) === '143.3 kg')
}

// ---- 2. fight --------------------------------------------------------------------------------------
{
  const { progressRate, progressSlip, tensionRise, tensionFall, thrash } = FISHING.fight
  const dt = 1 / 60

  // Spec: holding fills progress slowly and tension quickly; releasing drains tension quickly.
  const held = createFight(1, mulberry32(1))
  for (let t = 0; t < 1; t += dt) stepFight(held, true, dt)
  check('fight: while held, tension rises at least twice as fast as progress', held.tension > 2 * held.progress && held.progress > 0.1, `after 1 s: progress ${held.progress.toFixed(2)}, tension ${held.tension.toFixed(2)}`)
  const rest = createFight(1, mulberry32(1))
  rest.tension = 0.8
  for (let t = 0; t < 0.5; t += dt) stepFight(rest, false, dt)
  check('fight: when released, tension drops quickly', rest.tension < 0.5 && rest.tension > 0.4, `0.80 -> ${rest.tension.toFixed(2)} in 0.5 s`)
  const idle = createFight(1, mulberry32(1))
  idle.progress = 0.5
  for (let t = 0; t < 5; t += dt) stepFight(idle, false, dt)
  check('fight: progress slips back while the reel is idle, and never below 0', idle.progress < 0.5 && idle.progress >= 0)

  // Snapping: holding all the time must break the line, after about 1 / tensionRise seconds.
  const hold = createFight(1, mulberry32(2))
  while (hold.outcome === 'playing') stepFight(hold, true, dt)
  check('fight: holding all the time snaps the line (tension 100% first)', hold.outcome === 'snapped' && hold.progress < 0.5, `after ${hold.time.toFixed(2)} s with progress ${hold.progress.toFixed(2)}`)
  check('fight: ... after 1 / tensionRise seconds', Math.abs(hold.time - 1 / tensionRise) < 2 * dt, `${hold.time.toFixed(2)} s vs ${(1 / tensionRise).toFixed(2)} s`)

  // Never touching the reel: nothing happens (the fish does not win, the line does not break).
  const never = createFight(1.6, mulberry32(3))
  for (let t = 0; t < 120; t += dt) stepFight(never, false, dt)
  check('fight: never holding neither lands nor loses the fish', never.outcome === 'playing' && never.progress === 0 && never.tension === 0)

  // The edges: progress 100% before tension 100% = caught; tension 100% = snapped; both at once = caught.
  const edge = (progress, tension) => {
    const fight = createFight(1, mulberry32(4))
    fight.pullIn = Infinity
    Object.assign(fight, { progress, tension })
    return stepFight(fight, true, 0.05)
  }
  check('fight: progress reaching 100% first lands the fish', edge(0.999, 0.5) === 'caught')
  check('fight: tension reaching 100% first snaps the line', edge(0.5, 0.999) === 'snapped')
  check('fight: both in the same frame is a catch', edge(0.999, 0.999) === 'caught')
  const done = createFight(1, mulberry32(5))
  done.progress = 0.999
  stepFight(done, true, 0.1)
  const frozen = JSON.stringify([done.progress, done.tension, done.time])
  stepFight(done, false, 1)
  check('fight: once it is over it stays over', done.outcome === 'caught' && JSON.stringify([done.progress, done.tension, done.time]) === frozen)

  // Same fight at 30, 60 and 144 fps: the rules must not depend on the frame rate.
  const schedule = (time) => time % 3 < 1.4 // reel 1.4 s, rest 1.6 s, and so on
  const at = (fps) => {
    const fight = createFight(1, mulberry32(6))
    for (let frame = 0; frame < fps * 9; frame++) stepFight(fight, schedule(frame / fps), 1 / fps)
    return fight
  }
  const [a, b, c] = [30, 60, 144].map(at)
  check('fight: the same play gives the same bars at 30, 60 and 144 fps', Math.abs(a.progress - c.progress) < 0.03 && Math.abs(b.progress - c.progress) < 0.03 && Math.abs(a.tension - c.tension) < 0.05, `progress ${a.progress.toFixed(3)} / ${b.progress.toFixed(3)} / ${c.progress.toFixed(3)}`)

  // Difficulty: the line snaps sooner, and a harder fish cannot be reeled in faster.
  const snapTime = (difficulty) => {
    const fight = createFight(difficulty, mulberry32(8))
    while (fight.outcome === 'playing') stepFight(fight, true, dt)
    return fight.time
  }
  const times = Object.values(RARITIES).map((r) => snapTime(r.difficulty))
  check('fight: a harder fish snaps the line sooner when held', times.every((t, i) => i === 0 || t < times[i - 1]), times.map((t) => t.toFixed(2)).join(' > ') + ' s')

  // Pulls: announced first, then a burst of extra tension, and then a new countdown.
  const pulls = createFight(1, mulberry32(9))
  const log = []
  for (let t = 0; t < 40; t += dt) {
    stepFight(pulls, false, dt)
    const mood = pulls.pulling ? 'pull' : pulls.warning ? 'warn' : 'calm'
    if (log[log.length - 1]?.mood !== mood) log.push({ mood, at: t })
  }
  const order = log.map((e) => e.mood).join(' ')
  check('fight: every pull is announced (calm, warn, pull, calm, ...)', /^calm( warn pull calm)+/.test(order) && !/calm pull|warn calm|pull warn/.test(order), order.slice(0, 60))
  const warns = log.filter((e, i) => e.mood === 'warn' && log[i + 1]?.mood === 'pull').map((e, i) => log[log.indexOf(e) + 1].at - e.at)
  const lengths = log.filter((e, i) => e.mood === 'pull' && log[i + 1]).map((e) => log[log.indexOf(e) + 1].at - e.at)
  check('fight: the warning lasts about FISHING.fight.thrash.warn, a pull about its duration', warns.every((w) => Math.abs(w - thrash.warn) < 3 * dt) && lengths.every((l) => Math.abs(l - thrash.duration) < 3 * dt), `${warns[0]?.toFixed(2)} s warning, ${lengths[0]?.toFixed(2)} s pull`)
  const gaps = log.filter((e) => e.mood === 'warn').map((e, i, all) => (i ? e.at - all[i - 1].at : null)).filter((g) => g !== null)
  check('fight: pulls come within the configured spacing', gaps.every((g) => g >= thrash.every[0] - 0.01 && g <= thrash.every[1] + thrash.duration + 0.01), `${Math.min(...gaps).toFixed(1)}-${Math.max(...gaps).toFixed(1)} s between pulls`)
  const pulled = createFight(1, mulberry32(10))
  const plain = createFight(1, mulberry32(10))
  pulled.pullLeft = 0.6
  pulled.pullIn = plain.pullIn = Infinity
  stepFight(pulled, true, 0.1)
  stepFight(plain, true, 0.1)
  check('fight: a pull adds tension on top of holding', pulled.tension > plain.tension + 0.04, `${plain.tension.toFixed(3)} -> ${pulled.tension.toFixed(3)} in 0.1 s`)

  // Without pulls (thrash: null) nothing is announced and the fight is purely hold / release.
  const saved = FISHING.fight.thrash
  FISHING.fight.thrash = null
  const calm = createFight(1.6, mulberry32(11))
  let any = false
  for (let t = 0; t < 120; t += dt) {
    stepFight(calm, t % 3 < 1, dt)
    any ||= calm.pulling || calm.warning
  }
  FISHING.fight.thrash = saved
  check('fight: with thrash switched off there are no pulls and no warnings', !any)

  // Players. A careful one holds until the tension is high, lets go to rest, and lets go at a warning
  // or a pull; it reacts late (it acts on what the bars showed `lag` seconds ago). It must win at every
  // rarity. One that never lets go must lose.
  const play = (difficulty, seed, { hi, lag }) => {
    const fight = createFight(difficulty, mulberry32(seed))
    const seen = []
    let holding = false
    while (fight.outcome === 'playing' && fight.time < 120) {
      seen.push({ tension: fight.tension, alarm: fight.warning || fight.pulling })
      const view = seen[Math.max(0, seen.length - 1 - Math.round(lag / dt))]
      if (holding && (view.tension >= hi || view.alarm)) holding = false
      else if (!holding && view.tension <= 0.2 && !view.alarm) holding = true
      stepFight(fight, holding, dt)
    }
    return fight
  }
  for (const [label, style] of [['sharp (0.15 s late)', { hi: 0.75, lag: 0.15 }], ['average (0.3 s late)', { hi: 0.65, lag: 0.3 }]]) {
    const results = Object.entries(RARITIES).map(([name, rarity]) => {
      const runs = Array.from({ length: 150 }, (_, i) => play(rarity.difficulty, 100 + i, style))
      const won = runs.filter((r) => r.outcome === 'caught')
      return { name, rate: won.length / runs.length, mean: won.reduce((s, r) => s + r.time, 0) / Math.max(1, won.length) }
    })
    check(`fight: the ${label} player wins every rarity, in 8 to 45 seconds`, results.every((r) => r.rate === 1 && r.mean > 8 && r.mean < 45), results.map((r) => `${r.name} ${r.mean.toFixed(0)} s`).join(', '))
  }
  const greedy = Object.values(RARITIES).map((r) => {
    const fight = createFight(r.difficulty, mulberry32(12))
    while (fight.outcome === 'playing') stepFight(fight, true, dt)
    return fight.outcome
  })
  check('fight: a player who never lets go loses at every rarity', greedy.every((o) => o === 'snapped'))
  check('fight: even a slow player (0.45 s late) can land a common fish', play(RARITIES.common.difficulty, 1, { hi: 0.55, lag: 0.45 }).outcome === 'caught')
}

// ---- 3. logbook ------------------------------------------------------------------------------------
{
  const memory = () => {
    const data = new Map()
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data }
  }
  const storage = memory()
  const book = createLogbookStore(storage)
  check('logbook: starts empty', book.species() === 0 && book.total() === 0 && book.get('dusk-herring') === null)
  const first = book.record({ id: 'dusk-herring', weight: 0.5 })
  check('logbook: the first catch of a species is new, not a record', first.isNew && !first.isRecord)
  const heavier = book.record({ id: 'dusk-herring', weight: 0.7 })
  const lighter = book.record({ id: 'dusk-herring', weight: 0.3 })
  check('logbook: a heavier catch is a personal best, a lighter one is neither', !heavier.isNew && heavier.isRecord && !lighter.isNew && !lighter.isRecord)
  book.record({ id: 'wake-eater', weight: 200 })
  check('logbook: counts species, catches and the best weight', book.species() === 2 && book.total() === 4 && book.get('dusk-herring').count === 3 && book.get('dusk-herring').best === 0.7)

  const reopened = createLogbookStore(storage)
  check('logbook: is saved and read back', reopened.species() === 2 && reopened.get('dusk-herring').count === 3 && reopened.get('wake-eater').best === 200)

  const damaged = memory()
  damaged.setItem('wake.logbook', '{ this is not json')
  check('logbook: a damaged save gives an empty book instead of an error', createLogbookStore(damaged).species() === 0)
  const odd = memory()
  odd.setItem('wake.logbook', JSON.stringify({ version: 1, fish: { 'dusk-herring': { count: 2, best: 0.4 }, 'removed-fish': { count: 1, best: 3 }, mudgrubber: { count: -5, best: 1 }, 'ember-eel': { count: 'many', best: 2 }, 'bonewhistle': null } }))
  const sane = createLogbookStore(odd)
  check('logbook: unknown species and nonsense numbers in a save are ignored', sane.species() === 1 && sane.get('dusk-herring').count === 2)
  const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
  const unsaved = createLogbookStore(broken)
  check('logbook: without usable storage it still works for the session', unsaved.record({ id: 'mudgrubber', weight: 1 }).isNew && unsaved.species() === 1)
  check('logbook: ... and with no storage at all', createLogbookStore(null).record({ id: 'mudgrubber', weight: 1 }).isNew)
  let threw = false
  try {
    book.record({ id: 'sea-monkey', weight: 1 })
  } catch {
    threw = true
  }
  check('logbook: recording an unknown species is an error', threw)
  book.clear()
  check('logbook: clear empties it (and the save)', book.species() === 0 && createLogbookStore(storage).species() === 0)
}

// ---- 4. spots --------------------------------------------------------------------------------------
{
  const R = PLANET.radius
  const arc = (a, b) => Math.acos(Math.min(1, a.dot(b))) * R
  const cfg = FISHING.spots
  const layout = createLayout()
  const spots = layout.fishingSpots
  const id = (list) => list.map((x) => [x.dir.x, x.dir.y, x.dir.z].map((v) => v.toFixed(6)).join()).join('|')

  check('spots: the configured number is placed', spots.length === cfg.count, `${spots.length}`)
  check('spots: the first one is close to the start (something to find at once)', arc(spots[0].dir, layout.start.dir) < 3, `${arc(spots[0].dir, layout.start.dir).toFixed(1)} units`)
  check('spots: at least oceanCount of them are in the big ocean', spots.filter((s) => arc(s.dir, layout.ocean.dir) < layout.ocean.radius).length >= cfg.oceanCount)
  check('spots: all are on the sphere and far enough from each other', spots.every((s) => Math.abs(s.dir.length() - 1) < 1e-9) && spots.every((a, i) => spots.every((b, j) => i === j || arc(a.dir, b.dir) >= cfg.gap)))

  // Room to anchor: no island's real shoreline (the collider), rock or buoy within reach of the trigger circle.
  const tooClose = []
  for (const [i, spot] of spots.entries()) {
    for (const collider of layout.colliders) {
      if (arc(spot.dir, collider.dir) < collider.reach + cfg.triggerRadius) tooClose.push(`spot ${i} / ${collider.kind}`)
    }
    for (const buoy of layout.buoys) if (arc(spot.dir, buoy.dir) < 0.6) tooClose.push(`spot ${i} / buoy`)
  }
  check('spots: the whole trigger circle is clear of islands, rocks and buoys (the boat can anchor anywhere in it)', tooClose.length === 0, tooClose.join(', '))

  check('spots: the same every time', id(createLayout().fishingSpots) === id(spots))
  const saved = cfg.count
  cfg.count = 0
  const without = createLayout()
  cfg.count = saved
  check('spots: placing them changes nothing else (islands, rocks, buoys identical to a world without them)', without.fishingSpots.length === 0 && id(without.islands) === id(layout.islands) && id(without.rocks) === id(layout.rocks) && id(without.buoys) === id(layout.buoys))

  // Behaviour: nearest / deplete / cooldown / the bubbles dying away and coming back.
  const field = createFishingSpots(spots)
  const first = field.spots[0]
  const beside = (spot, distance) => {
    // a point `distance` units from the spot over the sea, along any tangent
    const tangent = new Vector3(0, 1, 0).cross(spot.dir).normalize()
    return spot.dir.clone().multiplyScalar(Math.cos(distance / R)).addScaledVector(tangent, Math.sin(distance / R)).normalize()
  }
  check('spots: nearest finds a spot inside the trigger radius and nothing outside it', field.nearest(beside(first, cfg.triggerRadius * 0.9), cfg.triggerRadius)?.spot === first && field.nearest(beside(first, cfg.triggerRadius * 1.1), cfg.triggerRadius) === null)
  check('spots: the distance it reports is the distance over the sea', Math.abs(field.nearest(beside(first, 0.5), 1).distance - 0.5) < 1e-6)
  field.deplete(first)
  check('spots: a spot that gave up a fish is skipped', field.nearest(first.dir, 5)?.spot !== first)
  for (let t = 0; t < 600; t += 1 / 60) field.update({ delta: 1 / 60, time: t, storm: 0, space: 0 }) // ten minutes of real time
  check('spots: it stays empty (no timer): only refill() brings it back', first.empty === true && field.nearest(first.dir, 0.1) === null)
  check('spots: the bubbles die away while it is empty', first.level < 0.05, `level ${first.level.toFixed(3)}`)
  const other = field.spots[1]
  check('spots: the other spots are untouched', other.empty === false && other.level > 0.95)
  field.refill()
  check('spots: refill() (at midnight) makes every spot fishable again', field.spots.every((s) => !s.empty) && field.nearest(first.dir, 0.1)?.spot === first)
  for (let t = 0; t < 8; t += 1 / 60) field.update({ delta: 1 / 60, time: t, storm: 0, space: 0 })
  check('spots: ... and the bubbles come back', first.level > 0.95, `level ${first.level.toFixed(3)}`)
  const none = createFishingSpots([])
  none.update({ delta: 1 / 60, time: 0, storm: 0, space: 0 })
  check('spots: a world without spots does not crash', none.nearest(new Vector3(0, 1, 0), 10) === null)
}

console.log(failures ? `\n${failures} fishing check(s) FAILED` : '\nall fishing checks passed')
process.exit(failures ? 1 : 0)
