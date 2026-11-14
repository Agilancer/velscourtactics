# velscourtactics

VELSCOUR TACTICS: isometric open world, turn-based fights where you stand. See README.md for the layout.

The V and T rule from bm holds here: V = Velscour (the bad one), T = Tessariel (the good one). No line of
dialogue names both, nothing of the one stands near anything of the other, and no art carries letters or
monograms. Lines live in `src/data/cast.js`; the voice is grim, wry and warm, and nobody explains lore.

Auto-play plays the whole game, so keep it up with anything you add: a new errand outside a fight is an
entry in `goals()` in `src/game/auto.js`; inside a fight the AI is `Battle.plan`, and a new kind of skill
effect has to be scored there or neither the dead nor auto-play will use it.

Sound: an event worth hearing is a call on `sfx` in `src/core/audio.js` (recordings in `assets/audio/sfx`, each
with a made-up stand-in); music sets and stingers are `src/core/music.js`, the world's beds and fires
`src/core/ambience.js`. The title (`src/ui/title.js`) runs before the game loads; `?nosplash` skips its cards.

After changing data or the map run `node tools/check.mjs`. To try the game, serve the folder
(`python -m http.server 8417`) and open it. In the Claude browser pane `requestAnimationFrame` does not
fire, so step it by hand: `game.update(1/60)` in a loop (battle waits are real `setTimeout`s).

Real models replace stand-ins by key through `assets/models/manifest.json`; `docs/MODELS.md` lists the keys,
the manifest's fields and the animation states. Lisandra is the worked example. To see a model in the
running game, serve with `python tools/serve.py 8417` (it saves screenshots the page posts) and tile
them with `python tools/sheet.py <tag>`.

The Meshy prompts (the look, the style blocks, a subject line per model) are data in `tools/meshy/prompts.json`;
`node tools/meshy/prompt.mjs <key> [image]` prints one ready to paste. New models go picture, 3D, rig, then
`tools/blender/retarget.py` for the animation set: `docs/MODELS.md` section 12 is the recipe. Meshy costs
credits: state the cost and get a yes before generating.
