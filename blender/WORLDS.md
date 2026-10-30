# The world file

`wake-world.glb` is what the game builds, exported by `npm run export:world` (scripts/exportWorld.mjs).
Import it with File > Import > glTF 2.0. The collections are:

| Node | What it is |
|---|---|
| `Water` | the sea: a sphere of radius **5** around the world origin. Sea level is exactly its surface. While playing, the game draws waves on top of it (up to 0.14 high in calm weather, 0.5 in a storm) |
| `Islands` > `Island_<name>` | the land: a mesh per island with one vertex colour per triangle (the Color Attribute). The rim of every island sinks well below the sea so no edge shows. The custom properties hold the shoreline radius, peak height and ground type |
| `Trees` > `Pine_001...`, `Autumn_Tree_001...` | the trees (about 0.4 to 0.9 high) |
| `Rocks` > `Rock_001...` | rocks on the islands and in open water |
| `Lighthouse` | the striped tower, standing on `Island_lighthouse` (the sweeping light is drawn by the game) |
| `Buoys` > `Buoy_01...` | the navigation buoys |
| `Markers` > `Start` | where the boat starts. Its -Z (glTF) / +Y (Blender) axis is the way the bow points |
| `Markers` > `FishingSpot_1...` | the patches of bubbling water |
| `Markers` > `Open_Ocean` | the centre of the big empty ocean (the radius is in its custom properties) |

If the colours look flat grey in Blender's Material Preview, the island and tree colours are in the
vertex colours: add a **Color Attribute** node to the material's Base Color.

## Making a new world

The game's world is a sphere (radius 5, centre at the origin), so a new world is a new arrangement on that
sphere: keep the `Water` sphere as it is and change what stands on it.

1. Keep the **names and the collection structure** above. I read a new world by those names.
2. Islands are meshes named `Island_<anything>`. Everything is measured from the sea: heights are
   distances above the sphere's surface. The part above the water gives the coastline (I work out the
   shore and the collisions from the mesh), so give each island a clear, closed shoreline and let its rim
   sink below the sea.
3. Trees, rocks, buoys: any mesh in the right collection, named as above. They stand on the surface with
   their +Z (Blender) up and pointing away from the planet centre.
4. `Start`: an Empty on the sea, its +Y axis towards the bow. `FishingSpot_n`: an Empty on the sea for each
   patch. Keep the start at least 2.4 units from any island.
5. Write a world card next to the file: `id`, `name`, one line of description, and anything special
   (it only rains here, it is always night, ...).

## Putting a new world in the game

Export it as glTF Binary the same way as the boats (+Y Up, Apply Modifiers) and save it as
`public/models/worlds/<id>.glb`, with a card `<id>.txt` next to it (`id`, `name`, `description`, and an
`anything special:` that may go on indented lines below). Optional numbers: `price:` (what the chart of this world
costs in the harbour; default 500) and `requires:` (the id of a boat the player must own first, e.g. `sloop`). `standard: yes` marks the world the player starts in (free and owned: one world only; the others are charts). `fish:` is the world's set of 32 fish
(`home` or `frostmere`; no line = `home`): a world with its own fish needs a set in `src/fishing/species/`, see
`src/fishing/fishDatabase.js` (10 common, 9 uncommon, 7 rare, 5 epic and exactly 1 legendary). Restart the dev server and pick it in the developer
panel under **World**: the page reloads into that world (the choice is kept for the tab; "Lock developer
mode" goes back to the original).

What the game takes from the file (src/world/importWorld.js):
- `Islands`: each mesh is shown as it is and measured for the coastline (rays onto the land, outwards from the
  island's centre), so the collisions follow the mesh. The custom properties are only a fallback.
- `Trees` and `Rocks`: shown as they are. **Every mesh in `Rocks` collides**, like an iceberg or a boulder (its
  size is the mesh's biggest extent).
- `Lighthouse`, `Buoys`: only the positions: the lighthouse (with its sweeping light) and the floating buoys are
  the game's own.
- `Markers`: `Start` (the bow points along its -Z, +Y in Blender), up to **6** `FishingSpot_n`, `Open_Ocean`, and
  and the **selling point**: an empty named `Harbour` or `Dock_<name>` (e.g. `Dock_Wim`) at the water end of a dock
  that you model yourself. Anchoring within 1.15 units of it opens the harbour (sell fish, buy boats and charts). The
  dock is **solid** where it stands out of the water: put its parts in a group whose name starts with `Dock`, `Pier`
  or `Jetty` (e.g. `Wim_Dock`; not under `Markers`): every mesh in it that rises above the sea (more than 0.02 above
  radius 5) stops the boat like a small rock, and parts that are under the water (pilings) are left out. A world
  without such a marker gets the game's small floating dock near the start on clear water instead.
- The `Water` sphere in the file is ignored: the game draws its own sea (the same sphere, radius 5).
- The shore foam goes round at most **32** bodies: every island, then the biggest rocks.
- Not read yet: a mood for the world (sea colour, snow instead of rain, the sun). The card can describe it.

