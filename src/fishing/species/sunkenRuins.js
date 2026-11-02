// The fish of The Sunken Ruins (Planet 4): 16 species designed from the brief (6 common, 5 uncommon, 3 rare,
// 2 legendary). NOT in the game yet: the game's worlds have 32 fish each (10 / 9 / 7 / 5 / 1, see
// fishDatabase.js), so this set is design material until it is extended and put behind a world card (`fish:`).
// `npm run export:ruins-fish` draws every fish and writes blender/fish/sunken-ruins/ (an SVG and a silhouette
// SVG per fish, a JSON file with all the data and an overview page).
//
// Fields: name, rarity (as in the brief), gameRarity (what it would be with the game's five rarities: the game
// allows one legendary fish per world, so the second legendary of the brief is epic there), rod (night / deep /
// bottom / none), where (a map area, or Anywhere), when (any time, a time of day, or a condition), weight [min, max]
// in kg, value (coins), logbook (the line shown in the logbook), art (see fishing/fishArt.js).

export const AREAS = ['Flooded Gate', 'Canal Quarter', "Sigrid's Slipway", 'Drowned Plaza', 'Bell Tower', 'Old Hulls', 'Temple Steps', 'Deep Cistern']

const dark = { eyeDark: true }

export const SUNKEN_RUINS = [
  // --- Common: 14-30 coins -----------------------------------------------------------------------------------
  {
    name: 'Moss Perch', rarity: 'common', gameRarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.3, 1.2], value: 18,
    logbook: 'Wears the swamp like a sweater.',
    art: { ...dark, body: 'deep', h: 16, back: '#7aa24f', belly: '#d4e2a0', accent: '#4f7a32', tail: 'fork', dorsal: 'spiny', dorsalHeight: 9, spots: 6, spotSize: 2.4, seed: 3 },
  },
  {
    name: 'Brickfish', rarity: 'common', gameRarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.5, 2], value: 22,
    logbook: "Square, sturdy, and slightly confused about whether it's a fish or a wall.",
    art: { ...dark, body: 'box', back: '#c4553a', belly: '#dc8a62', fin: '#a8452f', mortar: '#8f3a28', bricks: true, tail: 'fan', dorsal: 'tri', dorsalHeight: 7 },
  },
  {
    name: 'Bog Bream', rarity: 'common', gameRarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.4, 1.5], value: 16,
    logbook: 'Unremarkable, and perfectly happy that way.',
    art: { ...dark, body: 'deep', h: 21, back: '#9b7a3c', belly: '#d2b068', accent: '#6e5526', tail: 'fork', dorsal: 'long', dorsalHeight: 9, spots: 4, seed: 7 },
  },
  {
    name: 'Silt Loach', rarity: 'common', gameRarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.05, 0.25], value: 14,
    logbook: 'Wriggles through the silt between old cobbles.',
    art: { ...dark, body: 'eel', h: 6, back: '#cdaa6a', belly: '#efe0b8', accent: '#8a6a3a', tail: 'round', dorsal: 'long', dorsalHeight: 4, barbels: true, spots: 9, spotSize: 0.8, seed: 5 },
  },
  {
    name: 'Lily Gourami', rarity: 'common', gameRarity: 'common', rod: 'none', where: 'Anywhere', when: 'Any time', weight: [0.1, 0.4], value: 26,
    logbook: 'Drifts between the lily pads like it has nowhere to be.',
    art: { ...dark, body: 'deep', h: 14, back: '#8fc5b8', belly: '#dff2e6', fin: '#7bb0c8', accent: '#5f9fa8', tail: 'fan', dorsal: 'long', dorsalHeight: 8, trailing: true, spots: 3, seed: 2 },
  },
  {
    name: 'Cobble Carp', rarity: 'common', gameRarity: 'common', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [1, 3], value: 30,
    logbook: 'Grazes the old streets as if it still pays rent.',
    art: { ...dark, body: 'deep', h: 19, back: '#7e868b', belly: '#bfc4c4', scales: 3, scaleColour: '#a2a9ac', tail: 'fork', dorsal: 'long', dorsalHeight: 9, barbels: true },
  },

  // --- Uncommon: 60-100 coins ---------------------------------------------------------------------------------
  {
    name: 'Gargoyle Goby', rarity: 'uncommon', gameRarity: 'uncommon', rod: 'bottom', where: 'Anywhere', when: 'Any time', weight: [0.3, 1], value: 65,
    logbook: 'Sits on ledges pulling faces. Harmless.',
    art: { ...dark, body: 'blunt', h: 16, back: '#868b90', belly: '#b4b8ba', accent: '#5a6064', crest: true, crestColour: '#6b7176', crestSize: 0.9, bigMouth: true, tail: 'round', dorsal: 'two' },
  },
  {
    name: 'Bronzescale', rarity: 'uncommon', gameRarity: 'uncommon', rod: 'none', where: 'Anywhere', when: 'Dusk', weight: [1, 3], value: 80,
    logbook: 'Looks like it swam off a fountain and never went back.',
    art: { ...dark, body: 'deep', h: 16, back: '#7f8a3e', belly: '#b89a4a', scales: 3, scaleColour: '#a9a458', tail: 'fork', dorsal: 'tri' },
  },
  {
    name: 'Swamp Snakehead', rarity: 'uncommon', gameRarity: 'uncommon', rod: 'night', where: 'Anywhere', when: 'Night', weight: [2, 5], value: 95,
    logbook: 'Hunts at night between the roots. Polite enough by day.',
    art: { ...dark, body: 'long', h: 10, back: '#2f5a34', belly: '#9cb07a', accent: '#1d3a22', tail: 'round', dorsal: 'long', dorsalHeight: 5, spots: 7, spotSize: 1.1, seed: 4 },
  },
  {
    name: 'Wisp Ghostfish', rarity: 'uncommon', gameRarity: 'uncommon', rod: 'night', where: 'Anywhere', when: 'Night, lamp on', weight: [0.3, 1], value: 100,
    logbook: 'The swamp’s little lantern. Follows your lamp like it wants to talk.',
    art: { ...dark, body: 'torpedo', h: 11, back: '#e0f0f0', belly: '#f6fcfb', fin: '#c6e8e4', accent: '#c9e2e0', aura: '#bff7e0', tail: 'fan', dorsal: 'tri' },
  },
  {
    name: 'Mosaic Ray', rarity: 'uncommon', gameRarity: 'uncommon', rod: 'deep', where: 'Anywhere', when: 'Day', weight: [2, 6], value: 75,
    logbook: 'Its back is a mosaic. Nobody knows who laid it.',
    art: { ...dark, body: 'ray', back: '#d9c7a3', belly: '#efe6d0', accent: '#a58a5a', tiles: ['#c4553a', '#3f8a8a', '#d9a43a', '#f0e6c8', '#5f7a4a'] },
  },

  // --- Rare: 260-340 coins ------------------------------------------------------------------------------------
  {
    name: 'Statue Grouper', rarity: 'rare', gameRarity: 'rare', rod: 'bottom', where: 'Drowned Plaza', when: 'Dusk', weight: [6, 14], value: 300,
    logbook: 'Stays so still by the fallen statue that people have tried to read the inscription on it.',
    art: { ...dark, body: 'blunt', h: 20, back: '#8d9296', belly: '#c2c6c7', accent: '#5f8f3a', spots: 6, spotSize: 2.2, seed: 6, crest: true, crestColour: '#5f9a3a', crestSize: 1.2, tail: 'round', dorsal: 'spiny' },
  },
  {
    name: 'Bellringer', rarity: 'rare', gameRarity: 'rare', rod: 'deep', where: 'Bell Tower', when: 'Night, after blowing the horn under the tower', weight: [4, 9], value: 340,
    logbook: 'Comes up when something rings. Even a boat horn will do.',
    art: { ...dark, body: 'bell', back: '#b07a3a', belly: '#d9a85a', accent: '#5a3c1c', fin: '#8a5a24' },
  },
  {
    name: 'Keelback', rarity: 'rare', gameRarity: 'rare', rod: 'none', where: 'Old Hulls', when: 'Night', weight: [5, 10], value: 280,
    logbook: 'Lives inside the old hulls. Treats them like a house.',
    art: { ...dark, body: 'long', h: 11, back: '#2d3944', belly: '#6a7581', fin: '#8a6a3a', accent: '#c9a05a', plates: 7, tail: 'fork', dorsal: 'long', dorsalHeight: 8 },
  },

  // --- Legendary: 900-1,200 coins -----------------------------------------------------------------------------
  {
    name: 'The Drowned King', rarity: 'legendary', gameRarity: 'legendary', rod: 'deep', where: 'Deep Cistern', when: 'Clear nights', weight: [18, 25], value: 1200,
    logbook: 'The city’s last ruler, some say. It still sits in the middle of the room.',
    art: { ...dark, body: 'deep', h: 23, back: '#8c9a3a', belly: '#d6b448', fin: '#9aa23a', scales: 3, scaleColour: '#a8b04e', crest: true, crestColour: '#e0b83a', crestSize: 1.7, barbels: true, tail: 'fan', dorsal: 'long', dorsalHeight: 10 },
  },
  {
    name: 'Temple Arowana', rarity: 'legendary', gameRarity: 'epic', rod: 'none', where: 'Temple Steps', when: 'Dawn', weight: [12, 20], value: 1000,
    logbook: 'Swims up the temple steps at sunrise, as if it’s late for something.',
    art: { ...dark, body: 'long', h: 12, back: '#d9a830', belly: '#f4dc86', fin: '#c9922a', scales: 2, scaleColour: '#fff0a8', jaw: true, jawColour: '#f0d070', barbels: true, tail: 'round', dorsal: 'long', dorsalHeight: 6 },
  },
]

// "Moss Perch" -> "MossPerch": the file names (as in the brief's example FrostCod.svg)
export const fileName = (fish) => fish.name.replace(/[^A-Za-z0-9]+/g, '')
