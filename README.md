# VELSCOUR TACTICS

An isometric open-world tactics game in the VELSCOUR universe. You walk Herrington Hollow, the pines
round it and the four lands past the pines with a party of up to six in a chain behind you; when one of the dead sees you, the walk stops
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

- **Herrington Hollow**: eleven buildings, a well, a bounty board, ringed with trees, four roads out.
- **Four lands past the pines**, one down each road (the map is 256 tiles square): the **White Waste** north
  (snow, ice, snow pines, the Frozen Border Fort), the **Red Badlands** east (sand, cracked clay, hoodoos, the
  Dry Court, and the palms at Last Water), the **Drowned Fen** south (black pools, bare trees, the Swamp Abbey)
  and the **Cinder Reach** west (ash, basalt, a dead rail line, Cinder Halt). The names are VELSCOUR's
  (the Great Hunt's lands, the Siege's forts, the Iron Express); the ground is bm's snow, fen, ash and desert textures.
- **Sixteen classes** from VELSCOUR, male and female, four skills each opening at levels 1, 3, 6, 10
  (`src/data/classes.js`), plus Lisandra's own.
- **Thirteen people to walk with**: Lisandra (from the start), Homunculus the Proud, Lily Belle the
  Veiled, Jamie the Curator, Stevie the Stronger, and eight more standing about the Hollow.
- **Ten shops**: weapons, armour, spell scrolls, gems, rings and charms, bag room, enhancing (+1 to +10),
  enchanting, sockets and gem removal, and the inn (beds and draughts).
- **Twenty-six kinds of foe** in about 80 packs. In the pines, five kinds of the dead and the things that keep their
  company (the possessed, grave spiders, barrow goblins, plague knights, carrion harpies, Grave Callers, werewolves,
  plague giants), harder the farther from town; in each land beyond, two kinds of the dead (levels 10 to 17) and a lord
  at home in the land's ruin with a chest behind it. A bounty for most kinds, a writ for each lord. The twelve kinds of
  the lands beyond are stand-ins until their Meshy models are made (`docs/MODELS.md` sections 5 and 7).
- **The crypt** in the deep pines: a roofless ruin of bm's catacomb stone, its keeper the Bone Golem, and a chest.
- **Gear you can see**: every weapon is drawn in the hand that holds it, and the armour worn changes the body
  (steel and up, for the classes bm has bodies for).
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
| `src/data/gear.js`, `src/gfx/gear.js` | what each weapon and shield looks like, and putting it in a hand or on an arm |
| `src/gfx/clipbank.js` | bm's two clip banks, fitted to the bodies that play them |
| `src/ui/art.js` | the interface's painted pictures, by name |
| `assets/tex`, `assets/trees`, `assets/desert` | textures copied from bm (`assets/game/tex`, `art/trees`, `assets/desert`) |
| `assets/audio`, `assets/title` | bm's sound and music, its two title cards, and the VELSCOUR TACTICS logo (its source: `art/logo`) |

`node tools/check.mjs` checks the world and the data without a browser.

## From bm

A good deal of this came over from bm (its `origin/main`, read with `git -C ../bm show`, never changed). Each piece is
written out by a tool here that says what it took and what it left behind. Anything carrying either side's mark stayed in
bm: a cross is Tessariel's, so the cross-shaped shields, the paladin and lancer bodies, and two dragoon bodies stayed there.

| | | |
|---|---|---|
| `assets/gear/` | 129 weapons, shields and lutes, baked small, with their icons | `tools/gear/bake.py`, `tools/gear/sources.txt` |
| `assets/models/heroes/` | 22 hero bodies, worn as armour tiers 3 to 5 (`<class>_<g>_t<n>`) | `tools/bm/heroes.py` |
| `assets/models/folk/` | ten townsfolk bodies and their paint | `tools/bm/folk.py` |
| `assets/models/clips/` | bm's hero and townsfolk clip banks (`"bank"` in the manifest) | the two above |
| `assets/models/foes/` | the new kinds of foe, a look or three each, their own clips in the file | `tools/bm/foes.py` |
| `assets/props/`, `assets/tex/crypt/` | the chest with its lid, the crypt's iron doors, the catacomb stone | `src/world/render.js` |
| `assets/ui/` | bars, buttons, tabs, slots, menu icons, goods, gems, spell pictures | `src/ui/art.js` |

The plague knight's crosses are painted off as `tools/bm/foes.py` copies it (`PAINT`). `node tools/check.mjs` doesn't
look at models; `viewer.html` shows any manifest key with what it carries.
