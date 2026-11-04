// The fish of The Riverlands (w_005-riverlands), designed from the brief: 32 species, 10 common, 9 uncommon, 7 rare,
// 5 epic and 1 legendary, like every world of the game. They are the fish set of the world (fishDatabase.js). The game uses
// the name, rarity, weight, logbook line (as the description), art and `habitat` (the time of day and the weather of the
// brief: dawn 4-8, day 8-17, dusk 17-21, night 21-4). NOT used yet: `rod` (night / deep / bottom / none), `where` (a map
// area, or Anywhere), the conditions "lamp on" and "after the mill wheel turns again", and `value` (the game pays per kilo by
// rarity). `npm run export:riverlands-fish` draws every fish and writes blender/fish/w_005-riverlands/ (an SVG and a
// silhouette SVG per fish, a JSON file with the data, an overview page).
//
// Fields: name, rarity, rod, where, when (as in the brief), weight [min, max] in kg, value (coins), logbook (the line shown
// in the logbook), habitat (when it bites better, fishing/habitat.js), art (fishing/fishArt.js).

export const AREAS = ['River Mouth', 'The Meanders', "Bram's Mill", 'Willow Lake', 'The Narrows', 'Reedmarsh', 'Stone Bridge', 'Wide Water']

const dark = { eyeDark: true }

export const RIVERLANDS = [
  // --- Common (10): 10-24 coins ---------------------------------------------------------------------------------
  {
    name: 'River Roach', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.1, 0.4], value: 12,
    logbook: 'Small, silver, and everywhere. The river’s welcome committee.',
    art: { ...dark, body: 'torpedo', h: 11, back: '#aab4bd', belly: '#eceff1', fin: '#e04a3a', eyeRing: '#e04a3a', tail: 'fork', dorsal: 'tri' },
  },
  {
    name: 'Mudpout', rarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.3, 1.5], value: 14,
    logbook: 'Lives in the mud, likes the mud, will tell you about the mud.',
    art: { ...dark, body: 'blunt', h: 14, back: '#6a4a30', belly: '#a88358', barbels: 4, barbelWidth: 1.8, tail: 'round', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Reed Perch', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.2, 1], value: 18,
    logbook: 'Hides in the reeds and dares you to find it.',
    art: { ...dark, body: 'deep', h: 15, back: '#a0a63e', belly: '#e6df98', accent: '#3d4a22', stripes: 4, tail: 'fork', dorsal: 'spiny', dorsalHeight: 10 },
  },
  {
    name: 'Silver Bream', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.3, 1.2], value: 16,
    logbook: 'Flat as a dinner plate and about as shiny.',
    art: { ...dark, body: 'deep', h: 22, back: '#b8c4cc', belly: '#eef2f4', scales: 2, scaleColour: '#d8e2e8', tail: 'fork', dorsal: 'tri', dorsalHeight: 9 },
  },
  {
    name: 'Gudgeon', rarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.05, 0.2], value: 10,
    logbook: 'Tiny, curious, and always first to the bait.',
    art: { ...dark, body: 'torpedo', h: 9, back: '#a89a6a', belly: '#e8e0c0', accent: '#4a4030', spots: 7, seed: 3, barbels: 2, tail: 'fork', dorsal: 'tri', dorsalHeight: 7 },
  },
  {
    name: 'Brook Minnow', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.02, 0.08], value: 11,
    logbook: 'Barely a fish. Very proud of it anyway.',
    art: { ...dark, body: 'torpedo', h: 7, back: '#e0b84a', belly: '#f6e8b0', lateral: '#3a3220', tail: 'fork', dorsal: 'tri', dorsalHeight: 5 },
  },
  {
    name: 'Surface Bleak', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.02, 0.1], value: 10,
    logbook: 'Flickers at the surface like someone’s dropping coins.',
    art: { ...dark, body: 'long', h: 6, back: '#c4d4e0', belly: '#fafcfd', fin: '#9fb4c4', tail: 'fork', dorsal: 'tri', dorsalHeight: 5 },
  },
  {
    name: 'Spotted Dace', rarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.1, 0.3], value: 13,
    logbook: 'Quick, tidy and never late.',
    art: { ...dark, body: 'long', h: 9, back: '#8a9a50', belly: '#dfe4c0', accent: '#2f3820', spotRow: 7, spotFrom: 0.3, spotTo: 0.82, spotLine: 0.38, tail: 'fork', dorsal: 'tri', dorsalHeight: 7 },
  },
  {
    name: 'Stone Loach', rarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.02, 0.1], value: 12,
    logbook: 'Looks exactly like a pebble until it doesn’t.',
    art: { ...dark, body: 'eel', h: 6, back: '#8a8070', belly: '#c8bfa8', accent: '#4a4238', spots: 10, seed: 6, barbels: 6, barbelWidth: 1.2, tail: 'round', dorsal: 'long', dorsalHeight: 4 },
  },
  {
    name: 'Prickle Ruffe', rarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.05, 0.2], value: 14,
    logbook: 'Prickly to hold, sweet-natured underneath.',
    art: { ...dark, body: 'blunt', h: 12, back: '#8a6a48', belly: '#cfb890', accent: '#4a3220', spots: 8, seed: 9, tail: 'round', dorsal: 'spiny', dorsalHeight: 12 },
  },

  // --- Uncommon (9): 45-80 coins ---------------------------------------------------------------------------------
  {
    name: 'Rope Eel', rarity: 'uncommon', rod: 'night', where: 'Anywhere', when: 'Night', weight: [0.8, 3], value: 65,
    logbook: 'Bram swears he didn’t name it. Bram named it.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'eel', h: 7, back: '#6a4a30', belly: '#a8845a', accent: '#3e2a18', stripes: 12, diagonal: true, tail: 'round', dorsal: 'long', dorsalHeight: 4 },
  },
  {
    name: 'Golden Tench', rarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Dusk', weight: [1, 3], value: 55,
    logbook: 'Glows like old brass in the evening light.',
    habitat: { hours: [17, 21], boost: 2, hint: 'Prefers the evening light.' },
    art: { ...dark, body: 'deep', h: 18, back: '#8f8a2a', belly: '#cdbb55', fin: '#6f6a22', eyeRing: '#d03a2a', eyeScale: 0.8, tail: 'fan', dorsal: 'tri', dorsalHeight: 9 },
  },
  {
    name: 'Striped Zander', rarity: 'uncommon', rod: 'night', where: 'Anywhere', when: 'Night', weight: [1.5, 4], value: 75,
    logbook: 'Sees in the dark better than you do. Knows it, too.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'long', h: 11, back: '#6f8a78', belly: '#cdd8cc', accent: '#2d3a34', stripes: 6, eyeScale: 1.6, eyeRing: '#cfe8e4', tail: 'fork', dorsal: 'two', dorsalHeight: 9 },
  },
  {
    name: 'Golden Rudd', rarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Day', weight: [0.4, 1.5], value: 48,
    logbook: 'Sunbathes near the surface on nice days.',
    habitat: { hours: [8, 17], boost: 2, hint: 'Prefers the bright hours of the day.' },
    art: { ...dark, body: 'deep', h: 15, back: '#e0b030', belly: '#f6dd7a', fin: '#d0382a', tail: 'fork', dorsal: 'tri', dorsalHeight: 10 },
  },
  {
    name: 'Bristle Barbel', rarity: 'uncommon', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [1, 4], value: 60,
    logbook: 'Sweeps the riverbed like it’s expecting guests.',
    art: { ...dark, body: 'long', h: 10, back: '#b07a3a', belly: '#e0c088', barbels: 4, barbelWidth: 2.4, tail: 'fork', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Mirror Chub', rarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.5, 2.5], value: 50,
    logbook: 'Eats anything. Admires itself in every puddle.',
    art: { ...dark, body: 'blunt', h: 17, back: '#8aa09a', belly: '#dfe8e4', scales: 2, scaleColour: '#d4e6e0', bigMouth: true, mouthColour: '#4a3a3a', tail: 'fork', dorsal: 'tri', dorsalHeight: 9 },
  },
  {
    name: 'Sailfin Grayling', rarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Dawn', weight: [0.4, 1.5], value: 70,
    logbook: 'Raises its sail at first light, like it’s signalling someone.',
    habitat: { hours: [4, 8], boost: 2, hint: 'Prefers the first light of day.' },
    art: { ...dark, body: 'torpedo', h: 11, back: '#8a84b8', belly: '#d8d4ec', fin: '#a89ad0', tail: 'fork', dorsal: 'sail', dorsalHeight: 12 },
  },
  {
    name: 'Orange Ide', rarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Day', weight: [0.5, 2], value: 58,
    logbook: 'So orange the herons think it’s a warning.',
    habitat: { hours: [8, 17], boost: 2, hint: 'Prefers the bright hours of the day.' },
    art: { ...dark, body: 'torpedo', h: 12, back: '#e8902a', belly: '#f6c878', fin: '#e0702a', tail: 'fork', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Night Burbot', rarity: 'uncommon', rod: 'night', where: 'Anywhere', when: 'Night', weight: [1, 3], value: 72,
    logbook: 'Only comes out when the river goes quiet.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the quiet of the night.' },
    art: { ...dark, body: 'long', h: 9, back: '#5a5a3a', belly: '#a8a678', accent: '#2f2f1c', spots: 9, seed: 4, chinBarbel: true, tail: 'round', dorsal: 'long', dorsalHeight: 5 },
  },

  // --- Rare (7): 150-220 coins -----------------------------------------------------------------------------------
  {
    name: 'Millrace Trout', rarity: 'rare', rod: 'none', where: "Bram's Mill", when: 'Dawn', weight: [2, 5], value: 180,
    logbook: 'Waits in the millrace every morning for whatever the wheel brings down.',
    habitat: { hours: [4, 8], boost: 2, hint: 'Prefers the first light of day.' },
    art: { ...dark, body: 'torpedo', h: 14, back: '#8a6a3c', belly: '#e8b84a', accent: '#c03a2a', spots: 9, seed: 5, tail: 'fork', dorsal: 'tri', dorsalHeight: 9 },
  },
  {
    name: 'Willow Carp', rarity: 'rare', rod: 'bottom', where: 'Willow Lake', when: 'Dawn', weight: [4, 9], value: 200,
    logbook: 'Rests under the willows, where the light is green and slow.',
    habitat: { hours: [4, 8], boost: 2, hint: 'Prefers the first light of day.' },
    art: { ...dark, body: 'deep', h: 19, back: '#a8803a', belly: '#d6b86a', scales: 3, scaleColour: '#a8a850', barbels: 2, tail: 'fork', dorsal: 'long', dorsalHeight: 10 },
  },
  {
    name: 'Gorge Sturgeon', rarity: 'rare', rod: 'deep', where: 'The Narrows', when: 'Night', weight: [6, 12], value: 220,
    logbook: 'Older than the bridge above it. Possibly older than the river.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'long', h: 13, back: '#5a6670', belly: '#a8b0b4', accent: '#c8cdd0', plates: 7, barbels: 4, barbelWidth: 1.8, tail: 'fork', dorsal: 'tri', dorsalHeight: 7 },
  },
  {
    name: 'Silver Shad', rarity: 'rare', rod: 'none', where: 'River Mouth', when: 'Dawn', weight: [1, 3], value: 150,
    logbook: 'Swims up from the sea every morning, then changes its mind.',
    habitat: { hours: [4, 8], boost: 2, hint: 'Prefers the first light of day.' },
    art: { ...dark, body: 'deep', h: 18, back: '#9aaab8', belly: '#f0f4f6', accent: '#2a3440', spotRow: 4, spotFrom: 0.66, spotTo: 0.8, spotLine: 0.26, scales: 2, scaleColour: '#c4d2dc', tail: 'fork', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Meander Pike', rarity: 'rare', rod: 'none', where: 'The Meanders', when: 'Day', weight: [3, 8], value: 170,
    logbook: 'Lies in the slow bends, perfectly still, perfectly smug.',
    habitat: { hours: [8, 17], boost: 2, hint: 'Prefers the bright hours of the day.' },
    art: { ...dark, body: 'long', h: 11, back: '#4a7a3a', belly: '#d8e0b0', accent: '#e8e0b8', spots: 12, seed: 8, tail: 'fork', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Marsh Bowfin', rarity: 'rare', rod: 'bottom', where: 'Reedmarsh', when: 'Dusk', weight: [2, 5], value: 160,
    logbook: 'Breathes air when the water’s too warm. Clever old thing.',
    habitat: { hours: [17, 21], boost: 2, hint: 'Prefers the evening light.' },
    art: { ...dark, body: 'long', h: 12, back: '#6a7a3a', belly: '#b8b878', accent: '#2a3018', tailSpot: true, tail: 'round', dorsal: 'long', dorsalHeight: 10 },
  },
  {
    name: 'Ghost Koi', rarity: 'rare', rod: 'night', where: 'Wide Water', when: 'Night', weight: [2, 6], value: 210,
    logbook: 'Drifts under the lamp like a lost paper lantern.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'deep', h: 17, back: '#dfe3e0', belly: '#f6f7f4', fin: '#c8cdc8', accent: '#e0b440', spots: 4, spotSize: 2.6, seed: 2, barbels: 2, tail: 'fan', dorsal: 'tri', dorsalHeight: 9 },
  },

  // --- Epic (5): 260-400 coins -----------------------------------------------------------------------------------
  {
    name: 'Moon Carp', rarity: 'epic', rod: 'deep', where: 'Wide Water', when: 'Clear nights', weight: [8, 14], value: 400,
    logbook: 'Rises on clear nights to look at the moon. Then right back down.',
    habitat: { weather: 'clear', hours: [21, 4], boost: 2, hint: 'Prefers clear skies and the dead of night.' },
    art: { ...dark, body: 'deep', h: 23, back: '#e0c870', belly: '#f4f0d0', scales: 3, scaleColour: '#fffbe8', aura: '#dfe8ff', barbels: 2, tail: 'fan', dorsal: 'long', dorsalHeight: 11 },
  },
  {
    name: 'Golden Mahseer', rarity: 'epic', rod: 'none', where: 'The Narrows', when: 'Dawn, in fast water after rain', weight: [6, 12], value: 360,
    logbook: 'The river’s strongest swimmer. Bram’s best line was made for this one.',
    habitat: { weather: 'rain', hours: [4, 8], boost: 2, hint: 'Prefers rain at first light.' },
    art: { ...dark, body: 'torpedo', h: 17, back: '#d9a02c', belly: '#f0c868', fin: '#e0702a', scales: 3, scaleColour: '#f4cc58', jaw: true, jawColour: '#e8b848', barbels: 2, tail: 'lunate', dorsal: 'tri', dorsalHeight: 11 },
  },
  {
    name: 'Lily King', rarity: 'epic', rod: 'none', where: 'Willow Lake', when: 'Dusk on clear days', weight: [5, 10], value: 320,
    logbook: 'Holds court under the lily pads. Never seems surprised.',
    habitat: { weather: 'clear', hours: [17, 21], boost: 2, hint: 'Prefers clear skies and the evening light.' },
    art: { ...dark, body: 'deep', h: 20, back: '#6a8a3a', belly: '#c8b84a', fin: '#566e2e', spotRing: 9, eyeScale: 0.8, tail: 'fan', dorsal: 'tri', dorsalHeight: 10 },
  },
  {
    name: 'Reed Ghost', rarity: 'epic', rod: 'night', where: 'Reedmarsh', when: 'Night, lamp on', weight: [4, 9], value: 300,
    logbook: 'Seen once, then gone between the reeds. Locals argue about it.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'long', h: 11, back: '#d8dfd4', belly: '#f2f5ee', fin: '#c4ccc0', accent: '#a6b2a0', stripes: 6, aura: '#dfeede', tail: 'fork', dorsal: 'tri', dorsalHeight: 8 },
  },
  {
    name: 'Millpond Grayling', rarity: 'epic', rod: 'night', where: "Bram's Mill", when: 'Night, lamp on', weight: [2, 5], value: 260,
    logbook: 'Comes to the lantern on the mill dock, like a moth with fins.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dark of night.' },
    art: { ...dark, body: 'torpedo', h: 12, back: '#8a7ac0', belly: '#d6d0ec', fin: '#a898d4', dorsalSpots: '#e8b83a', tail: 'fork', dorsal: 'sail', dorsalHeight: 14 },
  },

  // --- Legendary (1): 900 coins ----------------------------------------------------------------------------------
  {
    name: 'Old Knot', rarity: 'legendary', rod: 'bottom', where: 'Stone Bridge', when: 'Night, only after the mill wheel turns again', weight: [12, 18], value: 900,
    logbook: 'It only came back when the wheel started turning. Bram says it missed the noise.',
    habitat: { hours: [21, 4], boost: 2, hint: 'Prefers the dead of night.' },
    art: { ...dark, body: 'blunt', h: 21, back: '#6a5a48', belly: '#a89878', accent: '#4a3c2c', fin: '#54463a', spots: 9, seed: 7, lateral: '#8a7a64', knot: true, tail: 'round', dorsal: 'tri', dorsalHeight: 10 },
  },
]

// The id of every fish: f_<world number>-<rarity rank><rarity letter><number in that rarity>-<name> (blender/NAMING.md).
// The world is 005; the number counts the fish of that rarity in the order of this list, so never reorder or delete: add at the end.
const RANK = { common: '1c', uncommon: '2u', rare: '3r', epic: '4e', legendary: '5l' }
const counters = {}
for (const fish of RIVERLANDS) {
  counters[fish.rarity] = (counters[fish.rarity] ?? 0) + 1
  const slug = fish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  fish.id = `f_005-${RANK[fish.rarity]}${String(counters[fish.rarity]).padStart(2, '0')}-${slug}`
}
