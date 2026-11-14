# VELSCOUR TACTICS

An isometric open-world tactics game in the VELSCOUR universe. You walk Herrington Hollow and the pines
round it with a party of up to six in a chain behind you; when one of the dead sees you, the walk stops
and it becomes a turn-based fight on the spot, Final Fantasy Tactics style.

This is the first playable build. Lisandra has her real model; every other figure is a stand-in made of boxes until the Meshy models arrive
(`docs/MODELS.md` has the prompts, the animation list and the order to make them in).

## Run it

`play.bat`, or `python tools/serve.py 8417` and open http://localhost:8417. No build step: plain ES
modules, three.js vendored in `vendor/three`.

## The title

Up from the first paint, while the game loads behind it (`src/ui/title.js`, Bellmourn's title brought
over): Blastorama Gaming's card fades in and out, then Jamie Herrington's, each with four-pointed glints
flaring on the edges of its letters, a sheen of light across them, gold dust rising, and a tinkle of
little glass bells for every glint. Then the VELSCOUR TACTICS logo over the black with the title's song,
and once the Hollow is built the black lifts to it drifting by through a dark veil and the menu (New
Game, Continue) comes up under the logo. A click, a tap or a key skips a card. A browser plays no sound
till it's been clicked, so where it won't, the title first asks for that click. `?nosplash` in the
address goes straight to the logo.

## The sound

All of Bellmourn's sound and music, copied whole into `assets/audio` (`music`, `amb`, `sfx`;
`build_report.json` says which source file each came from):

- **Music** (`src/core/music.js`): "Frozen Hearts" from the moment the logo comes up, on under the making
  of who came down the road; "Cursed Citadel" over Lisandra's opening; then the Hollow's light tracks,
  the pines' ambient ones and the dark ones far out where the pines go black, a track at a time with a
  quiet between; the action tracks for a fight; and the three stingers (someone joins you, a fight lost,
  a fight won or a bounty paid).
- **The world** (`src/core/ambience.js`): wind, birds and, far out, the night's insects; the forge, the
  Last Toll's hearth, Moss Cottage's chimney and the lantern by the bounty board, heard from where they
  are.
- **Effects** (`src/core/audio.js`): footsteps on earth or stone (and in mail, for plate), jumps and
  landings; blades, axes, maces, bows, pistols and the dead's claws, teeth and chains; hits, blocks on
  mail, crits; each element's spells as they leave the hand and as they land; deaths; a burst bonesack;
  the townsfolk's panic when the dead are seen near the Hollow and their gasp when you're carried back;
  chests, shop doors, the smith's and the lapidary's hammers, the enchanter's kiln; the Last Toll's bells
  for a night's sleep; a stone down the well. The interface's tick, coins and the glass bells are made
  in code. The Sound button mutes it all (and remembers).

Not yet placed, for want of anywhere in the world to put them: water and wood footsteps, and the
caves', rain's, sea's, rivers' and waterfalls' beds.

Credits carried over from Bellmourn: the Last Toll's bells are "Orthodox Church Bells Ringing" from Free
Sounds Library (freesoundslibrary.com, CC BY 4.0), its first 16 s; the townsfolk's gasp is "Crowd Gasp"
from Free Sounds Library (CC BY 4.0); the scream a fallen hero lets out now and then is the Wilhelm
scream, from BigSoundBank.com, sound 0477.

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
| `src/ui/title.js` | the title: the two cards, the logo, the menu |
| `src/ui/ui.js` | character creation, HUD, talk, panels and shops |
| `src/core/audio.js`, `music.js`, `ambience.js` | the effects, the music, the world's own sound |
| `src/data/` | classes, items, the dead and their bounties, the cast and every line they say |
| `assets/tex`, `assets/trees`, `assets/desert` | textures copied from bm (`assets/game/tex`, `art/trees`, `assets/desert`) |
| `assets/audio`, `assets/title` | bm's sound and music, its two title cards, and the VELSCOUR TACTICS logo (its source: `art/logo`) |

`node tools/check.mjs` checks the world and the data without a browser.
