# 3D fish for Wake

A fish with a 3D model is shown in the **logbook** as a small live 3D scene (it turns gently, and plays its
swimming animation if the model has one; **drag it with the mouse or a finger to turn it yourself**, and it eases
back to swaying a moment after you let go) instead of its flat picture. The picture is still used for fish
without a model, for fish you have not caught yet (the black silhouette), and if a model cannot be read.
That is the only place the models are used: not in the water, not on the catch card.

## The short version

1. `public/models/fish/<world>/<id>.svg` is the picture of the fish (all 64 are there, `index.txt` lists them).
   Use it as a reference: File > Import > Scalable Vector Graphics, or as a background image.
2. Model the fish (rules below), with or without an animation.
3. Export a **glTF Binary (.glb)** and save it **next to the SVG with the same name**:
   `public/models/fish/home/dusk-herring.glb`.
4. Restart the dev server (or run `npm run models`): the list `fish3d.json` is made from the files.
5. Open the logbook (B), catch the fish if you have not (developer mode > Fishing > Fill logbook), and select it.

`<world>` is `home` (the original world) or `frostmere`; `<id>` is the file name of its SVG (`dusk-herring`,
`glacier-maw`...). A file with a name that is not a fish of that world is reported by `npm run check`.

## Start from the starter fish

`blender/fish/fish-starter.glb` is a small low-poly fish made for this: import it into Blender (File > Import >
glTF 2.0) and model next to it, or take it apart and reuse it. It has the right size, direction and names, a
tail of its own, and a swimming clip ("Swim", 1.2 s, looping). Make it again with `npm run export:fish-starter`.
It is not in the game (it is not in `public/`); copy it to a fish's name to try the logbook with it.

## Rules for the model

| | |
|---|---|
| **Direction** | The nose points towards **+Y** in Blender (Front view, numpad 1: the nose points away from you). Belly down (-Z), back up (+Z), left and right along X. The exporter turns that into glTF's -Z, which the game knows. |
| **Size** | About **1 unit long**. The game scales every model to the same length on screen, so the exact number does not matter, but keep the origin around the middle. |
| **Transforms** | Apply them all (select everything, Ctrl+A > All Transforms). Keep the fish near the world origin. |
| **Weight** | Low-poly, like the boats: at most about 2,000 triangles. Flat colours: one Principled BSDF per colour with a plain Base Color. The game draws it flat-shaded in its own light. Textures work but are not needed. |
| **Nothing else** | No lights, no cameras, no modifiers left unapplied. Transparency is fine for fins (but keep it simple). |
| **Colours** | Match the SVG, or do not: the model is its own thing. Light fish are easier to see against the paper if they are not pure white. |

## Animation (a fish that really swims)

Optional. If the file has animations, the game plays **all of them in a loop** from the start. Make the clip loop
(the last frame equal to the first) and keep it short, 0.8 to 2 seconds.

Two ways that both work:
- **Objects.** Parent the tail (and fins) to the body, give the tail object its own origin at the point where it
  joins the body, and keyframe its rotation (and perhaps the body's slight sway). This is what the starter fish does.
- **Skeleton.** An armature with a few bones and a skin works too (Blender exports it with the mesh).

Export: tick **Animation** in the glTF export options, with **Animation mode = Actions** or "Active Actions
merged" (Include: Selected Objects; the animation must belong to what you export). Check in a fresh scene that
the .glb plays when you import it. With no animation the fish simply turns and bobs a little, as the viewer
does for every fish.

## Export settings (as for the boats)

File > Export > glTF 2.0 (.glb):
- Format **glTF Binary (.glb)**
- Include: Selected Objects (select the whole fish), Limit to Visible
- Transform: **+Y Up** ticked
- Mesh: **Apply Modifiers** ticked, Normals ticked
- Material: Export (Images: Automatic if you use textures)
- Animation: ticked if the fish moves; Cameras / Lights: nothing

## Trying it in the game

`npm run dev`, open `http://localhost:5173/?dev` and enter 1815, then **Fishing > Fill logbook** (so the fish
counts as caught: the silhouette stays a flat picture), press **B** and click the fish. The frame shows the
picture for a moment while the model loads. If it never turns into a model, open the browser's console: the
reason is printed there ("Fish model ... could not be shown"). Most often the file name is not the fish's id, the
export has no mesh, or the fish is not caught in this world's logbook (a fish of the other world is on its own tab).

## Commands

| | |
|---|---|
| `npm run export:fish` | Writes the 64 SVGs again (after a fish was changed in the code). It only replaces the `.svg` files: your `.glb` files stay. |
| `npm run export:fish-starter` | Makes `blender/fish/fish-starter.glb` again. |
| `npm run models` | Makes the list of fish models (also runs before `npm run dev` and `npm run build`). |
| `npm run check` | Checks that every `.glb` belongs to a fish of its world and that the list is up to date. |

## How it works (for the curious)

- `scripts/buildModelLists.mjs` writes `public/models/fish/fish3d.json`: a list like `["home/dusk-herring"]`.
- `src/fishing/fishViewer.js` makes a second small WebGPU renderer the first time a model is shown, loads
  `models/fish/<world>/<id>.glb`, turns the nose to the right, centres it, scales it to a fixed length, lights it
  and draws it while the logbook is open. `src/fishing/logbook.js` puts its canvas in the detail frame.
- A fish needs to be caught before the model shows (until then it is the silhouette).
