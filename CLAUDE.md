# velscourtactics

VELSCOUR TACTICS: isometric open world, turn-based fights where you stand. See README.md for the layout.

The V and T rule from bm holds here: V = Velscour (the bad one), T = Tessariel (the good one). No line of
dialogue names both, nothing of the one stands near anything of the other, and no art carries letters or
monograms. Lines live in `src/data/cast.js`; the voice is grim, wry and warm, and nobody explains lore.

Auto-play plays the whole game, so keep it up with anything you add: a new errand outside a fight is an
entry in `goals()` in `src/game/auto.js`; inside a fight the AI is `Battle.plan`, and a new kind of skill
effect has to be scored there or neither the dead nor auto-play will use it.

After changing data or the map run `node tools/check.mjs`. To try the game, serve the folder
(`python -m http.server 8417`) and open it. In the Claude browser pane `requestAnimationFrame` does not
fire, so step it by hand: `game.update(1/60)` in a loop (battle waits are real `setTimeout`s).

Real models replace stand-ins by key through `assets/models/manifest.json`; `docs/MODELS.md` lists the keys.
