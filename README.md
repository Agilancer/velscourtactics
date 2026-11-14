# VELSCOUR TACTICS

An isometric open-world tactics game in the VELSCOUR universe. You walk Herrington Hollow and the pines
round it with a party of up to six in a chain behind you; when one of the dead sees you, the walk stops
and it becomes a turn-based fight on the spot, Final Fantasy Tactics style.

This is the first playable build. Lisandra has her real model; every other figure is a stand-in made of boxes until the Meshy models arrive
(`docs/MODELS.md` has the prompts, the animation list and the order to make them in).

## Run it

`play.bat`, or `python tools/serve.py 8417` and open http://localhost:8417. No build step: plain ES
modules, three.js vendored in `vendor/three`.

## Play it

| | Keyboard | On screen |
|---|---|---|
| Walk | arrows or WASD | d-pad |
| Jump (needed for ledges two half-steps high) | Space | B |
| Talk, open, confirm | Enter or E | A |
| Back | Esc | |
| Party screen | Tab | Party |
| Auto-play | P | Auto |
| Zoom | mouse wheel | |

The grid's four directions are the screen's four diagonals, so the d-pad has two settings (the
**D-pad A / B** button): in A, Left goes down-left; in B, Left goes up-left. The other three follow.

In a fight: place your party on the green tiles, press Begin, then each turn is a Move and an act in
either order. Click or tap a tile, or steer the cursor with the d-pad and press A. Height, facing
(hits from behind and the side do more) and reach all count.

## What is in it

- **Herrington Hollow**: eleven buildings, a well, a bounty board, ringed with trees, three roads out
  (north, east, south) that run to the map's edge and stop.
- **Sixteen classes** from VELSCOUR, male and female, four skills each opening at levels 1, 3, 6, 10
  (`src/data/classes.js`), plus Lisandra's own.
- **Thirteen people to walk with**: Lisandra (from the start), Homunculus the Proud, Lily Belle the
  Veiled, Jamie the Curator, Stevie the Stronger, and eight more standing about the Hollow.
- **Ten shops**: weapons, armour, spell scrolls, gems, rings and charms, bag room, enhancing (+1 to +10),
  enchanting, sockets and gem removal, and the inn (beds and draughts).
- **Five kinds of the dead** in 21 packs, harder the farther from town, and a bounty for each kind.
- **Auto-play**: rests, reads the board, fills the party, hunts, fights, wears what is better.

## Where things are

| | |
|---|---|
| `src/world/map.js` | the world as data: tiles, heights, trees, buildings, packs |
| `src/world/render.js` | the isometric view, textures, see-through trees, tile highlights |
| `src/gfx/models.js` | stand-in models, their animation, and the loader for real ones |
| `src/game/explore.js` | walking, the follow chain, townsfolk, the dead spotting you |
| `src/game/battle.js` | the fight: placement, the turn clock, skills, statuses, the AI |
| `src/game/auto.js` | auto-play's errands outside a fight |
| `src/game/party.js` | heroes, stats, quests, the save |
| `src/ui/ui.js` | title, character creation, HUD, talk, panels and shops |
| `src/data/` | classes, items, the dead and their bounties, the cast and every line they say |
| `assets/tex`, `assets/trees`, `assets/desert` | textures copied from bm (`assets/game/tex`, `art/trees`, `assets/desert`) |

`node tools/check.mjs` checks the world and the data without a browser.
