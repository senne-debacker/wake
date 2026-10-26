Blender files for Wake. Everything here is glTF Binary (.glb): in Blender use File > Import > glTF 2.0.
(glTF is Y up; Blender's importer turns that into Z up by itself, so nothing needs rotating.)

wake-boat.glb    the game's current boat, every part named. See BOATS.md for how to export a new boat.
wake-world.glb   the world as the game builds it: the sea, 7 islands, 74 trees, 9 rocks, 6 buoys, the
                 lighthouse, the start position and the 6 fishing spots. See WORLDS.md.

Re-make wake-world.glb from the game's own generator at any time (after changing the layout in
src/config.js, say):   npm run export:world
