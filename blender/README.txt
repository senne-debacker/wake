Blender files for Wake. This folder is your workshop: the game never reads it. The game only loads the exported
.glb files in public/models/ (boats/ and worlds/, each with a .txt card).

  boats/    your boat .blend files, plus wake-boat.glb: the game's own boat with every part named, to start from.
            Export rules: BOATS.md. Exported boats go to public/models/boats/<id>.glb + <id>.txt.
  worlds/   your world .blend files, plus wake-world.glb: the world as the game builds it (the sea, 7 islands,
            74 trees, 9 rocks, 6 buoys, the lighthouse, the start position and the 6 fishing spots), to start from.
            Export rules: WORLDS.md. Exported worlds go to public/models/worlds/<id>.glb + <id>.txt.

In Blender use File > Import > glTF 2.0. (glTF is Y up; Blender's importer turns that into Z up by itself, so
nothing needs rotating.)

Re-make worlds/wake-world.glb from the game's own generator at any time (after changing the layout in
src/config.js, say):   npm run export:world
