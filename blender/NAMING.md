# Names for everything

One idea: **a thing has one id, and the id is the name of every file it has.** Then you can say `b_001-tug` or
`w_002-frostmere` and both of us know exactly which files that is: in Blender, in the game and in git.

## 1. The ids

| Kind | Pattern | Examples |
|---|---|---|
| Boat | `b_<NNN>-<name>` | `b_001-tug` |
| World | `w_<NNN>-<name>` | `w_000-wake` (the world the game once built itself: no longer a world of the game, its number stays reserved), `w_001-harbour`, `w_002-frostmere`, `w_003-sunken-ruins`, `w_004-reef` |
| Fish | `f_<WWW>-<R><r><NN>-<name>` | `f_001-1c01-dusk-herring`, `f_002-5l01-glacier-maw` |

- `NNN` is a running number, **in the order the thing was made. A number is never reused**, not even when the thing is retired.
- `<name>`: lowercase words joined by dashes. No `-world`, `-boat`, `_v2`, spaces or capitals.
- **Fish:** `WWW` is the number of the world it lives in (`001` = `w_001-harbour`). `R` is the rarity rank and `r` its
  letter, so the files sort by rarity: `1c` common, `2u` uncommon, `3r` rare, `4e` epic, `5l` legendary. `NN` counts the fish of that
  world and rarity: `01`, `02`... in the order they were added (never reorder, never reuse a number; add the next one).
- The id is the same everywhere: the card's `id:`, the file names, the saves, my messages.
- `npm run check` checks all of this (the numbers, the letters, that card and file name agree).

**An id never changes once a save could hold it** (a player's boats, charts and logbook are remembered by id). The
display name (`name:` on the card: "Little Tug") can change whenever you like. When an id really has to change, the old
one goes into `RENAMED` in `src/economy.js` (fish: `src/fishing/legacyIds.js`), so old saves keep working.

## 2. Where the files go

| What | Blender source (workshop, the game never reads it) | The game reads |
|---|---|---|
| Boat | `blender/boats/b_001-tug.blend` | `public/models/boats/b_001-tug.glb` + `b_001-tug.txt` |
| World | `blender/worlds/w_001-harbour.blend` | `public/models/worlds/w_001-harbour.glb` + `w_001-harbour.txt` |
| Fish | `blender/fish/f_001-1c01-dusk-herring.blend` (3D, later) | `public/models/fish/w_001-harbour/f_001-1c01-dusk-herring.svg` (made by `npm run export:fish`) |
| Renders and screenshots | `blender/<kind>/renders/<id>-<what>.png` (`w_002-frostmere-fjord.png`) | not used |
| Old versions | `blender/<kind>/archive/<id>-v1.glb` (`.blend`, `.txt`) | not used |
| Retired things | `blender/<kind>/archive/` too: the Blender source, the model and the card, all with `-v1` | not used |

A `.glb` in `public/models/` **without a card** (`<id>.txt`) is ignored by the game: a safe place to drop something that is not ready.
The one exception to "id = file name" is the template of the generated world: `blender/worlds/w_000-wake.glb`
(`npm run export:world` writes it).

## 3. Versions

- **The live file never carries a version.** `public/models/worlds/w_001-harbour.glb` is always the current Harbour.
- To give me a new version, drop it as `<id>-v2.glb` (or `-v3`...) in `blender/<kind>/` or `public/models/<kind>/` and say
  "new version of w_001-harbour". I put it in place as `<id>.glb`, move the old one to `archive/<id>-v1.glb`, check it and commit.
- If you want two versions in the game at once, they are two things with two numbers (`w_001-harbour` and `w_005-harbour-bay`).
- `.blend1` files are Blender's own backups: ignored by git, delete them any time.

## 4. Names inside a model

Objects use `Prefix_Name` (capital first letter, underscores), and the prefix says what the game does with it.

| Where | Names |
|---|---|
| Worlds | `Island_<name>`, `Rock_001`, `Pine_001`, `Buoy_01`, `Lighthouse`, markers: `Start`, `FishingSpot_1`..`_6`, `Open_Ocean`, `Dock_<Person>` (the selling point), `Area_<Name>`, `Resident_<Name>`, `Quest_<Name>`; a solid dock is a group `<Person>_Dock` |
| Boats | `Hull`, `Horn` / `Bell`, `Flag`, `Bow_Lamp` (empty), `Smoke` (empty) or `Funnel`, materials `Window...` and `Lamp...` |
| Fish (3D, later) | `Fish` (root), `Tail`, `Fin_...`, animation `Swim` |

(Details: BOATS.md and WORLDS.md.)

## 5. Cards

`<id>.txt` next to the `.glb`: `id` (must equal the file name), `name`, `description`, and the numbers (`price`,
`standard: yes`, `fish:` (the id of the world whose fish it catches: `w_001-harbour`), `size`, `light`...). A world with no
`fish:` line catches the fish of `w_001-harbour`. `npm run models` warns when an `id:` and a file name differ.

## What was done when this system was introduced

| Was | Now |
|---|---|
| `tug` | `b_001-tug` (the only boat in the game now) |
| `dinghy`, `sloop`, `speedboat`, `yacht`, the built-in `fishing-boat` | retired: `blender/boats/archive/<name>-v1.*` (the built-in boat stays in code only to start the scene; it is not offered in the shop) |
| `harbour`, `snow` (Frostmere), `frostmere`, `sunken-ruins`, `reef`, `wake` (generated) | `w_001-harbour`, `w_002-frostmere`, `w_002-frostmere`, `w_003-sunken-ruins`, `w_004-reef` (Blender only), `w_000-wake` |
| fish sets `home` and `frostmere` | `w_001-harbour` and `w_002-frostmere` |
| the 64 fish (`dusk-herring`, `glacier-maw`...) | `f_001-1c01-dusk-herring`... (full list: `src/fishing/legacyIds.js`) |
| `blender/fish/sunken-ruins/` | `blender/fish/w_003-sunken-ruins/` (the Sunken Ruins fish: `f_003-1c01-moss-perch`... design only, not in the game) |
