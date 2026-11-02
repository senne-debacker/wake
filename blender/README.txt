Blender files for Wake. This folder is your workshop: the game never reads it. The game only loads the exported
.glb files in public/models/. Names: NAMING.md (b_001-tug, w_001-harbour, f_001-1c01-dusk-herring: one id per thing,
and the id is the name of every file it has).

  boats/<id>.blend            the source of public/models/boats/<id>.glb. Export rules: BOATS.md
  worlds/<id>.blend           the source of public/models/worlds/<id>.glb. Export rules: WORLDS.md
  worlds/w_000-wake.glb       the world as the game generates it (the world "Wake"), to start a new world from.
                              Re-make it at any time with:  npm run export:world
  worlds/renders/<id>-<what>.png   renders and screenshots
  fish/<id>.blend             fish models (not in the game yet)
  fish/w_003-sunken-ruins/    the drawings of the Sunken Ruins fish (npm run export:ruins-fish), not in the game yet
  <kind>/archive/<id>-v1...   old versions (git keeps them as well)

In Blender use File > Import > glTF 2.0. (glTF is Y up; Blender's importer turns that into Z up by itself, so
nothing needs rotating.)

Blender's own backups (*.blend1) are ignored by git and can be deleted any time.
