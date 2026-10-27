// The 32 species of Frostmere (the snow world, public/models/worlds/snow.txt says `fish: frostmere`): 10 common,
// 9 uncommon, 7 rare, 5 epic and 1 legendary. All new: none of them lives in the home waters. Same fields as
// fishDatabase.js, with the picture as an `art` description that fishArt.js draws; the legendary one is drawn by
// hand because nothing in the generator is big enough for it.

const SVG = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"'

export const FROSTMERE = [
  // --- Common -----------------------------------------------------------------------------------
  {
    id: 'snowdrift-smelt',
    name: 'Snowdrift Smelt',
    rarity: 'common',
    weight: [0.05, 0.3],
    description: 'Arrives in such numbers that the water looks like it is snowing upwards.',
    art: { body: 'long', h: 7, back: '#7a9cb4', belly: '#e4eef6', accent: '#4a6a84', tail: 'fork', dorsal: 'tri', dorsalHeight: 6 },
  },
  {
    id: 'icefin-cod',
    name: 'Icefin Cod',
    rarity: 'common',
    weight: [1, 5],
    description: 'Its blood is thin as meltwater, so it never freezes. Its manners are another matter.',
    art: { body: 'blunt', h: 16, back: '#8a9aa0', belly: '#e6ecee', accent: '#5f6e74', tail: 'round', dorsal: 'two', barbels: true, spots: 6, seed: 11 },
  },
  {
    id: 'slushback-dab',
    name: 'Slushback Dab',
    rarity: 'common',
    weight: [0.4, 1.8],
    description: 'Lies on the bottom and goes grey and lumpy like old slush. Do not step on it, it will not apologise.',
    art: { body: 'deep', h: 15, back: '#a89f90', belly: '#e2dccf', accent: '#6f685a', tail: 'round', dorsal: 'long', spots: 6, seed: 12 },
  },
  {
    id: 'rimescale-sprat',
    name: 'Rimescale Sprat',
    rarity: 'common',
    weight: [0.04, 0.2],
    description: 'Each scale wears a fringe of frost. They tinkle faintly in the net.',
    art: { body: 'torpedo', h: 8, back: '#7aa0c0', belly: '#eaf3fa', accent: '#bcd8ee', tail: 'fork', dorsal: 'tri', stripes: 1 },
  },
  {
    id: 'hoarfrost-haddock',
    name: 'Hoarfrost Haddock',
    rarity: 'common',
    weight: [0.8, 3.4],
    description: 'Bears a dark thumbprint on each side, said to be where the cold first touched it.',
    art: { body: 'torpedo', h: 12, back: '#6d7a8a', belly: '#e8eaee', accent: '#2a323c', tail: 'fork', dorsal: 'two', barbels: true, spots: 1, seed: 14 },
  },
  {
    id: 'shiverfin-bleak',
    name: 'Shiverfin Bleak',
    rarity: 'common',
    weight: [0.06, 0.3],
    description: 'Never sits still. Whatever it is running from has not turned up yet.',
    art: { body: 'long', h: 7, back: '#4a9aa0', belly: '#cfe8e8', fin: '#7cc0c4', tail: 'fork', dorsal: 'tri' },
  },
  {
    id: 'glaze-sculpin',
    name: 'Glaze Sculpin',
    rarity: 'common',
    weight: [0.2, 0.9],
    description: 'All head and spines, glazed with ice like a bad pastry.',
    art: { body: 'blunt', h: 18, back: '#5c6a58', belly: '#a8b09a', accent: '#3a4636', tail: 'round', dorsal: 'spiny', spikes: true, spots: 5, seed: 15 },
  },
  {
    id: 'mittenfish',
    name: 'Mittenfish',
    rarity: 'common',
    weight: [0.5, 2],
    description: 'Round, soft and woollen-looking. Children in Frostmere are given one to keep their hands warm.',
    art: { body: 'round', h: 19, back: '#b0abc8', belly: '#e8e6f2', accent: '#7a74a0', fin: '#8a86aa', tail: 'round', dorsal: 'tri', dorsalHeight: 7, spots: 3, seed: 16 },
  },
  {
    id: 'drift-vendace',
    name: 'Drift Vendace',
    rarity: 'common',
    weight: [0.1, 0.5],
    description: 'Goes wherever the current goes, and is usually surprised to arrive.',
    art: { body: 'torpedo', h: 10, back: '#b8c8d4', belly: '#f8fafc', accent: '#7894a8', tail: 'fork', dorsal: 'tri', stripes: 1 },
  },
  {
    id: 'slate-pollock',
    name: 'Slate Pollock',
    rarity: 'common',
    weight: [1, 4.5],
    description: 'The colour of the sky on a day when nothing is going to happen. It delivers.',
    art: { body: 'torpedo', h: 13, back: '#44505e', belly: '#9aa6b2', tail: 'fork', dorsal: 'two' },
  },

  // --- Uncommon ---------------------------------------------------------------------------------
  {
    id: 'floeback-char',
    name: 'Floeback Char',
    rarity: 'uncommon',
    weight: [1, 4.8],
    description: 'Green on top and orange below, like a sunset seen from a cold porch.',
    art: { body: 'torpedo', h: 13, back: '#3f6f6a', belly: '#e8845a', fin: '#e8845a', accent: '#f4e6c8', tail: 'fork', dorsal: 'tri', spots: 11, seed: 17 },
  },
  {
    id: 'icepick-pike',
    name: 'Icepick Pike',
    rarity: 'uncommon',
    weight: [2, 9],
    description: 'Strikes straight through the thinnest ice, and then hangs about to see who comes to look.',
    art: { body: 'long', h: 9, back: '#5a7f86', belly: '#d8e8e8', accent: '#3a5a62', tail: 'fork', dorsal: 'tri', stripes: 6, teeth: true },
  },
  {
    id: 'aurora-trout',
    name: 'Aurora Trout',
    rarity: 'uncommon',
    weight: [1, 4],
    description: 'Green and violet in turn, as though the northern lights had been poured into a fish.',
    art: { body: 'torpedo', h: 13, back: '#58a898', belly: '#b78ad8', accent: '#7ae8c8', fin: '#8a6ac0', tail: 'fork', dorsal: 'tri', stripes: 3, spots: 5, seed: 18 },
  },
  {
    id: 'cairn-lumpsucker',
    name: 'Cairn Lumpsucker',
    rarity: 'uncommon',
    weight: [1.5, 6],
    description: 'Stacks itself on the rocks like a little cairn. Fishermen leave them be; the stones fall down otherwise.',
    art: { body: 'round', h: 19, back: '#7a6f66', belly: '#b8a998', accent: '#a79888', tail: 'round', dorsal: 'tri', dorsalHeight: 9, spikes: true, spots: 8, seed: 19 },
  },
  {
    id: 'whiteout-halibut',
    name: 'Whiteout Halibut',
    rarity: 'uncommon',
    weight: [4, 16],
    description: 'Lies so white against the snowy shelf that you only find it by standing on it.',
    art: { body: 'deep', h: 16, back: '#bcc6d0', belly: '#eef2f5', accent: '#8a96a2', tail: 'fan', dorsal: 'long', spots: 4, seed: 20 },
  },
  {
    id: 'spruce-grayling',
    name: 'Spruce Grayling',
    rarity: 'uncommon',
    weight: [0.8, 3],
    description: 'Wears a big sail on its back, dark green like the pines. It smells of the forest, faintly.',
    art: { body: 'torpedo', h: 12, back: '#5a7a5a', belly: '#c8d4b8', accent: '#2f4a2f', tail: 'fork', dorsal: 'sail', spots: 5, seed: 21 },
  },
  {
    id: 'tallow-burbot',
    name: 'Tallow Burbot',
    rarity: 'uncommon',
    weight: [1.5, 6],
    description: 'Greasy, patient and fond of the dark. The liver is the best part, they say, and the rest is not bad.',
    art: { body: 'eel', h: 8, back: '#a8946a', belly: '#e8dcb8', accent: '#7a6a44', tail: 'round', dorsal: 'long', barbels: true, spots: 6, seed: 22 },
  },
  {
    id: 'crystalmouth-lamprey',
    name: 'Crystalmouth Lamprey',
    rarity: 'uncommon',
    weight: [0.6, 2.4],
    description: 'A ring of glassy teeth on a body like a wet rope. It does not want to be your friend.',
    art: { body: 'eel', h: 5, back: '#5a6a8a', belly: '#c0cadf', accent: '#9fe8ff', tail: 'round', dorsal: 'none', teeth: true },
  },
  {
    id: 'gloamfin-skate',
    name: 'Gloamfin Skate',
    rarity: 'uncommon',
    weight: [3, 13],
    description: 'Glides under the ice in the grey hour, like a cloud that has decided to swim.',
    art: { body: 'ray', back: '#6a7a98', belly: '#d8dff0', accent: '#2e3a52', spots: 4, seed: 23 },
  },

  // --- Rare -------------------------------------------------------------------------------------
  {
    id: 'glacier-sturgeon',
    name: 'Glacier Sturgeon',
    rarity: 'rare',
    habitat: { weather: 'clear', hours: [10, 15], boost: 2, hint: 'Prefers clear skies and the light of noon.' },
    weight: [25, 80],
    description: 'Armoured in plates the colour of old ice. It has been in the same pool since before the glacier arrived.',
    art: { body: 'long', h: 12, back: '#5a7a9a', belly: '#d0dcea', accent: '#a8c4de', tail: 'fork', dorsal: 'tri', plates: 6, barbels: true },
  },
  {
    id: 'wolfjaw-catfish',
    name: 'Wolfjaw Catfish',
    rarity: 'rare',
    habitat: { weather: 'rough', boost: 2, hint: 'Prefers wind and rough water.' },
    weight: [6, 24],
    description: 'Tusks like a wolf and a temper to match. It breaks mussel shells for fun and fingers for sport.',
    art: { body: 'blunt', h: 18, back: '#4a5a66', belly: '#aab4bc', accent: '#26323c', tail: 'round', dorsal: 'long', stripes: 4, teeth: true },
  },
  {
    id: 'shardscale-salmon',
    name: 'Shardscale Salmon',
    rarity: 'rare',
    habitat: { weather: 'rain', hours: [4, 8], boost: 2, hint: 'Prefers rain at dawn.' },
    weight: [5, 18],
    description: 'Its scales stand up like splinters of glass, and sing when the rain hits them. Handle with the gloves you hate.',
    art: { body: 'torpedo', h: 15, back: '#a8c4d8', belly: '#f0b8a0', accent: '#e0f0fa', tail: 'fork', dorsal: 'tri', spikes: true, spots: 5, seed: 24 },
  },
  {
    id: 'halo-opah',
    name: 'Halo Opah',
    rarity: 'rare',
    habitat: { weather: 'calm', hours: [11, 14], boost: 2, hint: 'Prefers still water and the middle of the day.' },
    weight: [12, 45],
    description: 'A blue disc dotted with white and ringed in red, as if someone had painted a moon and thought better of it.',
    art: { body: 'round', h: 22, back: '#4a7aa8', belly: '#e88a7a', accent: '#f4f8fb', fin: '#e8506a', tail: 'lunate', dorsal: 'tri', dorsalHeight: 12, spots: 12, seed: 25 },
  },
  {
    id: 'snowblind-ray',
    name: 'Snowblind Ray',
    rarity: 'rare',
    habitat: { weather: 'clear', hours: [22, 3], boost: 2, hint: 'Prefers clear skies and the small hours.' },
    weight: [10, 36],
    description: 'White on white on white. It is easier to find with your eyes shut, and quite a lot harder to land.',
    art: { body: 'ray', back: '#c0d0e0', belly: '#eef3f8', accent: '#7f9ab6', spots: 5, seed: 26 },
  },
  {
    id: 'winterbell-eelpout',
    name: 'Winterbell Eelpout',
    rarity: 'rare',
    habitat: { weather: 'rain', hours: [18, 24], boost: 2, hint: 'Prefers rain in the evening.' },
    weight: [3, 12],
    description: 'Purple as a bruise and slick as a rumour. Folk say it rings, faintly, under the ice at dusk.',
    art: { body: 'eel', h: 9, back: '#8a5a8a', belly: '#d8b8d0', accent: '#5a3a5a', tail: 'round', dorsal: 'long', spots: 6, seed: 27 },
  },
  {
    id: 'hollowhorn-unicornfish',
    name: 'Hollowhorn Unicornfish',
    rarity: 'rare',
    habitat: { weather: 'rough', hours: [8, 12], boost: 2, hint: 'Prefers rough water in the morning.' },
    weight: [8, 28],
    description: 'A single hollow horn, long enough to be a mistake. Whoever took it for a spear was not wrong.',
    art: { body: 'torpedo', h: 14, back: '#7a9ab8', belly: '#dce8f2', accent: '#4a6a8a', tail: 'lunate', dorsal: 'tri', tusk: true, stripes: 2 },
  },

  // --- Epic -------------------------------------------------------------------------------------
  {
    id: 'crystalhorn-narwhalfish',
    name: 'Crystalhorn Narwhalfish',
    rarity: 'epic',
    habitat: { weather: 'clear', hours: [3, 6], boost: 2, hint: 'Prefers clear skies before dawn.' },
    weight: [60, 180],
    description: 'Its horn is a rod of clear ice that catches the starlight and gives it back as a faint note.',
    art: { body: 'long', h: 13, back: '#a9c6dc', belly: '#eef6fc', accent: '#5aa0e0', fin: '#7a9cb8', tail: 'lunate', dorsal: 'tri', tusk: true, tuskColour: '#9fd0ff', glow: '#9fd0ff', stripes: 2 },
  },
  {
    id: 'bergmaw-angler',
    name: 'Bergmaw Angler',
    rarity: 'epic',
    habitat: { weather: 'rain', hours: [0, 6], boost: 2, hint: 'Prefers rain in the small hours.' },
    weight: [60, 200],
    description: 'Lives in the black water beneath the icebergs and fishes for ships. Its lantern is the colour of the ice, and much colder.',
    art: { body: 'blunt', h: 22, back: '#2a3a52', belly: '#6a86a8', accent: '#e8f4ff', tail: 'round', dorsal: 'spiny', teeth: true, lure: true, glow: '#aef0ff' },
  },
  {
    id: 'blizzard-sturgeon',
    name: 'Blizzard Sturgeon',
    rarity: 'epic',
    habitat: { weather: 'rough', hours: [20, 24], boost: 2, hint: 'Prefers rough water at night.' },
    weight: [80, 240],
    description: 'Grows its own storm: a skin of white plates that clatter in the wind like hail. Nobody has caught one in fair weather.',
    art: { body: 'long', h: 16, back: '#c4d6e6', belly: '#9ab6cc', accent: '#5a7a9a', fin: '#7a9cb8', tail: 'fork', dorsal: 'sail', plates: 7, barbels: true },
  },
  {
    id: 'aurora-moonfish',
    name: 'Aurora Moonfish',
    rarity: 'epic',
    habitat: { weather: 'calm', hours: [22, 3], boost: 2, hint: 'Prefers still water and the dead of night.' },
    weight: [70, 220],
    description: 'A glowing disc, green into violet, that rises when the northern sky is quiet. Sailors say you should not look at it for long.',
    art: { body: 'round', h: 24, back: '#78e0c8', belly: '#b88af0', accent: '#ffffff', fin: '#8ac0e0', tail: 'fan', dorsal: 'tri', dorsalHeight: 12, glow: '#78e0c8', spots: 12, seed: 28 },
  },
  {
    id: 'ghostwhite-pike',
    name: 'Ghostwhite Pike',
    rarity: 'epic',
    habitat: { weather: 'calm', hours: [12, 16], boost: 2, hint: 'Prefers still water and the pale afternoon.' },
    weight: [30, 95],
    description: 'Bleached bone-white, with an eye the blue of a crevasse. It is only ever seen once, they say, and then only the once.',
    art: { body: 'long', h: 11, back: '#cdd9e8', belly: '#e6edf5', accent: '#7f9cc0', tail: 'fork', dorsal: 'tri', teeth: true, glow: '#7ac8ff', stripes: 3 },
  },

  // --- Legendary --------------------------------------------------------------------------------
  {
    id: 'glacier-maw',
    name: 'The Glacier Maw',
    rarity: 'legendary',
    habitat: { weather: 'thunderstorm', hours: [22, 2], boost: 2, hint: 'Prefers storm and the dead of night.' },
    weight: [180, 520],
    description: 'A fish the size of an iceberg, and about as friendly. The glacier is said to have grown around it, not the other way round.',
    imgUrl: `<svg ${SVG}>
  <polygon points="22,30 3,10 9,30 3,50" fill="#35506e"/>
  <polygon points="22,30 9,30 3,50" fill="#2a4260"/>
  <polygon points="36,14 42,2 48,13" fill="#cfe8f6"/>
  <polygon points="50,12 58,0 66,12" fill="#e8f6ff"/>
  <polygon points="68,12 76,3 82,15" fill="#cfe8f6"/>
  <polygon points="40,46 46,57 52,46" fill="#8fb6d2"/>
  <polygon points="64,48 70,58 76,47" fill="#8fb6d2"/>
  <polygon points="112,31 96,13 62,10 28,20 18,30" fill="#4a6d90"/>
  <polygon points="112,31 96,48 62,50 28,40 18,30" fill="#a9c9e0"/>
  <polygon points="96,13 62,10 70,30 100,30" fill="#6a8fb4"/>
  <polygon points="62,10 28,20 44,30 70,30" fill="#3a5878"/>
  <polygon points="48,22 56,16 60,26" fill="#d6ecf8"/>
  <polygon points="72,18 80,14 82,24" fill="#d6ecf8"/>
  <polygon points="34,30 44,30 38,38" fill="#c4ddee"/>
  <polygon points="112,31 98,31 104,40 90,37 92,31" fill="#1a2a44"/>
  <polygon points="108,31 106,36 104,31" fill="#f1ece0"/>
  <polygon points="102,31 100,37 98,31" fill="#f1ece0"/>
  <polygon points="96,31 94,36 92,31" fill="#f1ece0"/>
  <polygon points="111,30 109,25 107,30" fill="#f1ece0"/>
  <polygon points="104,30 102,25 100,30" fill="#f1ece0"/>
  <path d="M84 20 Q80 30 84 40" fill="none" stroke="#26405c" stroke-width="1.8"/>
  <circle cx="92" cy="22" r="9" fill="#7ae0ff" opacity="0.3"/>
  <circle cx="92" cy="22" r="4" fill="#bff3ff"/>
  <circle cx="93" cy="22" r="1.8" fill="#0b2a44"/>
</svg>`,
  },
]
