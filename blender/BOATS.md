# Exporting a boat for Wake

One boat per file. Save it as `public/models/boats/<id>.glb`, where `<id>` is a short lowercase name with
dashes (`trawler`, `sloop`, `old-tug`), and write a boat card (the last section) next to it.

## In Blender

1. **Scale.** 1 Blender unit = 1 game unit. Import `blender/wake-boat.glb` into the same scene as a
   reference and model next to it: it is 0.9 long and 0.38 wide. A bigger boat is simply bigger than it
   (a boat twice as long = 1.8). The game keeps the size you model, and measures the hull from it.
2. **Orientation.** The bow points towards **+Y**: in Blender's Front view (numpad 1) the bow points away from you.
   The keel runs along the Y axis. The boat is centred on X and Y.
3. **Waterline.** Z = 0 is the waterline: whatever is below is under water. The game lifts every boat a
   little (0.05).
4. **Origin.** The object origins and the 3D cursor do not matter, but **apply all transforms**
   (select everything, Ctrl+A > All Transforms) so the numbers are real, and keep the whole boat around the
   world origin.
5. **Weight.** Low-poly in the style of the game, at most about 5,000 triangles and 15 materials per
   boat. No modifiers left unapplied, no armature, no animation, no shape keys, no lights, no cameras.
6. **Materials.** Principled BSDF with a plain Base Color (flat colours look right; the game does flat
   shading and its own lighting). Base-colour textures work but are not needed. Nothing else is used.

## Names the game looks for (everything else is simply drawn)

| What | Name |
|---|---|
| Horn (shakes while H is held) | an object whose name starts with `Horn`; a child starting with `Bell` swells and shrinks |
| Windows (glow when the lamp is on) | materials starting with `Window` (their Emission colour is used) |
| Lamp glass (glows brighter) | materials starting with `Lamp` |
| Flag or pennant (waves in the wind) | a mesh starting with `Flag` |
| **Bow lamp** (where the light and its beam start) | an **Empty** named `Bow_Lamp`, placed where the lamp is. The beam points the way the bow points. Without it I put the lamp at the front of the deck |

## Export

File > Export > glTF 2.0 (.glb):
- Format: **glTF Binary (.glb)**
- Include: Selected Objects (select the whole boat and the `Bow_Lamp` empty), tick Limit to Visible
- Transform: **+Y Up** ticked
- Mesh: **Apply Modifiers** ticked, Normals ticked
- Material: Export; Images: Automatic if you use textures
- Lighting Mode / Cameras / Lights: nothing

Check: import the exported .glb into a fresh Blender scene. It should lie the same way and be the same size
as `wake-boat.glb` next to it.

## The boat card (a few lines, in a text file or in the message)

    id:           trawler
    name:         Old Trawler
    description:  one line for the boat picker
    speed:        slow / medium / fast          (the current boat is medium: 5 knots, 8 with boost)
    handling:     heavy / medium / nimble       (the current boat is medium)
    price:        900                            (coins in the harbour shop; default 600)
    hold:         30                             (kg of fish it carries; default 20)
    anything special: e.g. "carries a bigger crate", "louder horn", "starts at night"

## What I do with it

I add the boat to the dev version (a boat list, a picker, the hull and wake sized from your model, the
speed and handling from the card), and tell you what it looks like next to the old one.

## Money

Boats are bought with coins from selling fish at the harbour (src/economy.js). Everything about a boat's
economy lives on its card, so changing a boat means editing its card (and restarting the dev server):
`price` and `hold`. The save only remembers which boats the player owns by id, so a changed price applies
at once, and a boat that is removed from the folder simply stops being offered. Use the same `id` when you
replace a boat's model and the player keeps it.
