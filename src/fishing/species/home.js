// The 16 species added to the home waters (the original world) on top of the 16 in fishDatabase.js, which
// makes 32 there: 10 common, 9 uncommon, 7 rare, 5 epic and 1 legendary (the Wake-Eater). Same fields as
// there, but the picture is an `art` description that fishArt.js draws (see its header).

export const HOME_NEW = [
  // --- Common -----------------------------------------------------------------------------------
  {
    id: 'sandskipper',
    name: 'Sandskipper',
    rarity: 'common',
    weight: [0.1, 0.5],
    description: 'Hops from puddle to puddle on the ebb tide, quite sure that the beach belongs to it.',
    art: { body: 'blunt', h: 11, back: '#c9a86a', belly: '#efe0b8', accent: '#8a6a3a', tail: 'round', dorsal: 'long', spots: 5, seed: 3 },
  },
  {
    id: 'pebblefin',
    name: 'Pebblefin',
    rarity: 'common',
    weight: [0.3, 1.2],
    description: 'Speckled like the stones it sleeps among. You only ever notice it when it moves.',
    art: { body: 'deep', h: 14, back: '#6f8f7a', belly: '#d8e0c8', accent: '#3d5a4a', tail: 'round', dorsal: 'tri', spots: 8, seed: 5 },
  },
  {
    id: 'kelpback-smelt',
    name: 'Kelpback Smelt',
    rarity: 'common',
    weight: [0.08, 0.4],
    description: 'Smells of cucumber and sea wind. The gulls will fight you for every one.',
    art: { body: 'long', h: 7, back: '#5f8f4a', belly: '#d6e6b8', tail: 'fork', dorsal: 'tri', dorsalHeight: 6 },
  },
  {
    id: 'gullbait-minnow',
    name: 'Gullbait Minnow',
    rarity: 'common',
    weight: [0.03, 0.2],
    description: 'Too small to eat and too silly to mind. The gulls call it breakfast.',
    art: { body: 'torpedo', h: 9, back: '#8aa6c0', belly: '#f0f0f0', accent: '#37506a', tail: 'fork', dorsal: 'tri', stripes: 1 },
  },

  // --- Uncommon ---------------------------------------------------------------------------------
  {
    id: 'copperscale-bream',
    name: 'Copperscale Bream',
    rarity: 'uncommon',
    weight: [1, 4.2],
    description: 'Every scale is a tiny coin that nobody can spend. Sailors keep one in a pocket for the way home.',
    art: { body: 'deep', h: 19, back: '#b0622c', belly: '#e8b878', accent: '#7a3d16', tail: 'fork', dorsal: 'spiny', spots: 10, seed: 8 },
  },
  {
    id: 'reedtooth-pike',
    name: 'Reedtooth Pike',
    rarity: 'uncommon',
    weight: [2, 8],
    description: 'Hangs still among the reeds, then is somewhere else. It has more teeth than manners.',
    art: { body: 'long', h: 9, back: '#4f7a3a', belly: '#cfd89a', accent: '#355526', tail: 'fork', dorsal: 'tri', stripes: 5, teeth: true },
  },
  {
    id: 'lacewing-ray',
    name: 'Lacewing Ray',
    rarity: 'uncommon',
    weight: [2, 9],
    description: 'Its wings look knitted by someone patient and unpicked by someone less so.',
    art: { body: 'ray', back: '#9a7fb0', belly: '#e6dcef', accent: '#f4eefa', spots: 7, seed: 2 },
  },
  {
    id: 'candlefin-trout',
    name: 'Candlefin Trout',
    rarity: 'uncommon',
    weight: [0.9, 3.6],
    description: 'Its fins burn amber at dusk. The old pier lamps are said to have been copied from them.',
    art: { body: 'torpedo', h: 12, back: '#6a8f5a', belly: '#f0d8a8', fin: '#e8a43a', accent: '#3b2a1a', tail: 'fork', dorsal: 'tri', spots: 9, seed: 4 },
  },

  // --- Rare -------------------------------------------------------------------------------------
  {
    id: 'ghostlight-cod',
    name: 'Ghostlight Cod',
    rarity: 'rare',
    habitat: { weather: 'rain', hours: [21, 3], boost: 2, hint: 'Prefers rain after dark.' },
    weight: [6, 22],
    description: 'Pale as the inside of a shell, with an eye that glows when the rain comes down. Heard before it is seen, and never quite heard.',
    art: { body: 'blunt', h: 18, back: '#7f93a8', belly: '#e8eef4', accent: '#566a80', tail: 'round', dorsal: 'two', barbels: true, glow: '#9fe8ff', spots: 4, seed: 6 },
  },
  {
    id: 'gilded-mullet',
    name: 'Gilded Mullet',
    rarity: 'rare',
    habitat: { weather: 'clear', hours: [5, 9], boost: 2, hint: 'Prefers clear skies and the first light of day.' },
    weight: [3, 12],
    description: 'Catches the first sun before the sun has caught anything. Gold, and well aware of it.',
    art: { body: 'torpedo', h: 13, back: '#d6a83a', belly: '#fbe9a8', accent: '#9a6a16', tail: 'fork', dorsal: 'two', stripes: 4 },
  },
  {
    id: 'siren-barbel',
    name: 'Siren Barbel',
    rarity: 'rare',
    habitat: { weather: 'calm', hours: [18, 22], boost: 2, hint: 'Prefers still water at dusk.' },
    weight: [5, 18],
    description: 'It sings, they say, in a voice only the water can hear. Its whiskers hum on still evenings.',
    art: { body: 'deep', h: 15, back: '#a03c5a', belly: '#f0b8c0', accent: '#6a2038', fin: '#c85a78', tail: 'lunate', dorsal: 'sail', barbels: true },
  },
  {
    id: 'tempest-tuna',
    name: 'Tempest Tuna',
    rarity: 'rare',
    habitat: { weather: 'rain', hours: [12, 18], boost: 2, hint: 'Prefers rain in the afternoon.' },
    weight: [18, 60],
    description: 'Built like a thrown spear and twice as ill-tempered. Rides the squalls the way a cart horse climbs a hill.',
    art: { body: 'torpedo', h: 17, back: '#2a4a78', belly: '#d8e4f0', accent: '#16284a', tail: 'lunate', dorsal: 'two', stripes: 3 },
  },

  // --- Epic -------------------------------------------------------------------------------------
  {
    id: 'crimson-sunfish',
    name: 'Crimson Sunfish',
    rarity: 'epic',
    habitat: { weather: 'clear', hours: [11, 13], boost: 2, hint: 'Prefers a clear sky and the high sun.' },
    weight: [60, 190],
    description: 'A red disc that floats up to bask at noon, as if the sun had dropped something. Slow, vast and blushing.',
    art: { body: 'round', h: 23, back: '#d0503a', belly: '#f6c898', accent: '#8a2a1e', fin: '#a83a2c', tail: 'fan', dorsal: 'tri', dorsalHeight: 16, spots: 6, seed: 9 },
  },
  {
    id: 'drowned-bell-ray',
    name: 'Drowned Bell Ray',
    rarity: 'epic',
    habitat: { weather: 'rain', hours: [0, 5], boost: 2, hint: 'Prefers rain in the dead of night.' },
    weight: [40, 140],
    description: 'A great dark ray that rings like a bell under the water. Rain is its weather, and every note a farewell.',
    art: { body: 'ray', back: '#2a3f5a', belly: '#7a92b0', accent: '#9fe8ff', glow: '#9fe8ff', spots: 6, seed: 7 },
  },
  {
    id: 'ironjaw-marlin',
    name: 'Ironjaw Marlin',
    rarity: 'epic',
    habitat: { weather: 'rough', hours: [14, 20], boost: 2, hint: 'Prefers rough water in the afternoon.' },
    weight: [70, 210],
    description: 'Its bill has been through three hulls, or so the story goes. The fourth was a mistake.',
    art: { body: 'long', h: 12, back: '#3a5a8a', belly: '#c8d8ea', accent: '#1e3358', tail: 'lunate', dorsal: 'sail', tusk: true, tuskColour: '#9fb4cc', stripes: 4 },
  },
  {
    id: 'abyss-anglerking',
    name: 'Abyss Anglerking',
    rarity: 'epic',
    habitat: { weather: 'rough', hours: [21, 3], boost: 2, hint: 'Prefers rough water after dark.' },
    weight: [50, 160],
    description: 'The lamplit angler’s grandfather, many times over. Its light is the last thing some boats ever see.',
    art: { body: 'blunt', h: 22, back: '#2a2438', belly: '#5a4a6a', accent: '#f1ece0', tail: 'round', dorsal: 'spiny', teeth: true, lure: true, glow: '#7ae0ff' },
  },
]
