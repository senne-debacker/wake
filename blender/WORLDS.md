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

Send me the first one and I will write the importer for it and add a world picker to the dev version.
