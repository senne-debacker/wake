The models the game loads. The Blender sources are in blender/ (the game never reads that folder).

Every model has one id, and the id is the name of its files (the rules: blender/NAMING.md):

  boats/<id>.glb + <id>.txt     a boat and its card (blender/BOATS.md). npm run models turns the cards into boats.json
  (the boat built into the game, "fishing-boat", is only in code: it starts the scene, the standard boat is swapped in)
  worlds/<id>.glb + <id>.txt    a world and its card (blender/WORLDS.md), listed in worlds.json the same way
  fish/<world id>/<fish id>.svg the fish pictures, written by npm run export:fish (the game draws them itself;
                                these are for looking at), e.g. fish/w_001-harbour/f_001-1c01-dusk-herring.svg

A .glb without a card is ignored, so it is a safe place to drop something that is not ready.

Optional: models/dolphin.glb, your own dolphin (DOLPHIN in src/config.js; the dolphins are switched off at the moment).
Without it a low-poly dolphin built in code is used. No rig needed: the model is bent along its body in the shader.
