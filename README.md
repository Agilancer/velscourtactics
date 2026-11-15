# VELSCOUR TACTICS

An isometric open-world tactics game in the VELSCOUR universe. You walk Herrington Hollow, the pines
round it and the four lands past the pines with a party of up to six in a chain behind you; when one of the dead sees you, the walk stops
and it becomes a turn-based fight on the spot, Final Fantasy Tactics style.

Every class, the townsfolk, the summons and the dead of the pines wear their real models. The dead of the four lands and
their lords, and whoever minds a recruit's shop once they've joined, are still box stand-ins until theirs are made
(`docs/MODELS.md` has the prompts, the animation list and the order to make them in). A figure with a model is never
shown as boxes, and only those near the party have their bodies loaded: the rest are freed, so a phone can hold the world.

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
| Talk, open, confirm, next line | Enter or E | A, or a tap on the world |
| Back | Esc | |
| The book, at Party | Tab | Party (or a tap on anyone in the party list) |
| Auto-play | P | Auto |
| Call it (your one call in a fight under auto-play) | C | Call it |
| Fight speed, 1x or 2x (remembered) | F | 1x / 2x, in a fight |
| Zoom | mouse wheel (or a trackpad pinch) | pinch with two fingers |

The grid's four directions are the screen's four diagonals, so the d-pad has two settings (Settings, **D-pad A / B**):
in A, Left goes down-left; in B, Left goes up-left. The other three follow.

## The screen

`src/ui/ui.js` and `css/hud.css`, laid out for a phone first:

- **The party** down the top left: a medal, a name, life and mana. A tap on one opens their sheet.
- **The purse** top right: the day, how bold the dead have grown (a tap opens the scores), the gold; the quests under it.
- **The buttons**: Party, Journal, Orders, Auto, Settings. A row along the top on a big screen; a rail of round ones
  down the right edge on a phone. Under them, a line says what auto-play is about and why (a tap opens its orders).
- **Red dots** (`src/game/chronicle.js`: `st.fresh`, `dotCounts`): anything that has arrived since the player last
  looked wears one, all the way down: the button, the leaf, the tab, the hero, the item. Looking at the thing clears it.
  A green arrow means something in the bag is better than what's on.
- **Words** are said in speech bubbles over heads and kept in a chat log, both brought over from bm
  (`src/ui/speech.js`, `src/ui/chatlog.js`): paper and ink, a tail to the speaker, never over another bubble or the log,
  never off the screen; with no tail and a name on it when the speaker is out of sight. A conversation is one bubble at a
  time over whoever is speaking (the story's own voice sits low in the middle), a tap anywhere goes on, and what can be
  answered is a row of buttons at the foot. The log fades line by line; a tap on it opens the chronicle.
- **A fork** (`UI.choose`): a few cards to pick from. Under auto-play a clock runs and the first is taken when it is up.

**The book** has four leaves:

- **Party**: everyone along the top; for whoever is picked a paper doll (their own body on a turntable, drag it round;
  helm, weapon and a ring down the left, charm, armor and a ring down the right), their numbers, and the bag as a grid
  of squares (`src/ui/partyui.js`). Tap a thing in the bag and the slots it could go in light up and the numbers show
  what it would change; tap a lit slot (or Wear, or double-click) and it's on. Tabs: Bag, Skills, Stance, The line
  (marching order and who waits at the inn).
- **Journal**: Quests; the Chronicle (everything that has happened, day by day, with a line where you had read to);
  Scores (how bold the dead are, the ones with a price on them, the boons kept).
- **Orders**: what auto-play is about (below).
- **Settings**: sound, speech bubbles, the camera in a fight, fight speed, the d-pad, the keys.

## Auto-play

Auto-play plays the whole game. What the player decides while it does (`src/game/doctrine.js`):

- **Orders**: the errands in the order they are taken up (rest, the board, recruiting, spending, settling a score,
  chests, the hunt), any of them switched off; where the hunt goes (wherever is fair, one land, or the lords); how bold
  (how far above the party's level is still a fair fight); when to turn back; what the gold is for (better kit, the
  forge, draughts only, or nothing). `Auto.goals()` in `src/game/auto.js` reads them.
- **A stance** for each hero (Party, Stance): Steady, Reckless, Guarded, Shield, Sparing. Weights on the fight's AI.
- **Call it**: one call a fight (focus one of the dead, all out, hold the line). It lasts a round and comes back
  after a few turns.
- **Boons**: a lord's fall offers three; one is kept.

What it shows for it: under the turn order, what whoever is up means to do ("flanking the Grave Caller", "setting up a
Shatter", "saving mana"); the camera leaning in on a crit, a kill, a body through a wall, and slowing for the last of
them; how the fight looks before it starts (a formality … grave); the party talking to itself (`src/game/banter.js`,
lines in `BANTER` in `src/data/cast.js`); and the chronicle, for whoever left it running.

In a fight: place your party on the green tiles, press Begin, then each turn is a Move and an act in
either order. Click or tap a tile, or steer the cursor with the d-pad and press A. Height, facing
(hits from behind and the side do more) and reach all count. Knock them into a wall or a body and it hurts
more; step them onto a trap and they stop there.

Not every fight is a rout (`src/game/encounter.js`): an ambush (they go first), a runner to stop before it reaches the
trees with the pack's takings, somebody from the Hollow to get home alive, ground to hold while more come. A lord winds
up its great blow a turn ahead on marked red ground (get off it), calls its court at two thirds and turns the ground
itself at a third. Combos (`COMBOS` in `src/data/classes.js`): a blow of cold leaves rime and the next plain blow
shatters it; fire on the poisoned, the Light on the cursed, storm on the slowed. The dead may do it to you.

Lose a fight and whichever of the dead did the most of it gets a name, a level and a price from the Watch: a score to
settle. Every day a lord stands the dead grow bolder (stronger in the pines); at the worst they come to the gate.

The fight's log sits bottom left (across the top on a phone): drag its corner to size it, fold it with the arrow,
and the gear sets the letter size, how dark the window is and its size. Those settings stay in your browser.

On a phone, either way up, the screen is kept for the game. Party, Bag, Quests, Auto, the fight's speed, the
D-pad setting and Sound fold into a drawer behind the round button at the top right, and the quests in hand are listed
in it rather than down the side of the screen. The button shows a light when a quest can be claimed and says AUTO
while auto-play has the party. The party is a column of slim bars at the top left (tap them for the Party screen). In a
fight the d-pad, the A and B buttons and the party column go away: you tap the tiles, and the log starts folded to its
last line.

## What is in it

- **Herrington Hollow**: eleven buildings, a well, a bounty board, ringed with trees, four roads out.
- **Four lands past the pines**, one down each road (the map is 256 tiles square): the **White Waste** north
  (snow, ice, snow pines, the Frozen Border Fort), the **Red Badlands** east (sand, cracked clay, hoodoos, the
  Dry Court, and the palms at Last Water), the **Drowned Fen** south (black pools, bare trees, the Swamp Abbey)
  and the **Cinder Reach** west (ash, basalt, a dead rail line, Cinder Halt). The names are VELSCOUR's
  (the Great Hunt's lands, the Siege's forts, the Iron Express); the ground is bm's snow, fen, ash and desert textures.
- **Ground that runs together**: where two kinds of ground meet the edge is torn and ragged, not a square, with gravel,
  dirt or litter along the join; pools have banks and reeds, stones and grass are strewn about, and each land has
  its own air (snow in the Waste, dust in the Badlands, fireflies in the Fen, embers and ash in the Reach).
- **Seventeen classes**, sixteen from VELSCOUR and the Ninja, male and female, eight skills each opening at levels 1, 2,
  3, 4, 6, 8, 10, 13 (`src/data/classes.js`), plus Lisandra's own: four from VELSCOUR's trees (1, 3, 6, 10) and four only this game
  has (2, 4, 8, 13), built on the board: pushes and pulls, lines and cones, chains, traps, blinks, turn order
  bent forward and back, wards, dooms, ripostes, taunts and the wyrm.
- **Fights worth watching**: the skill's name along the top, a cut-in across the screen for each class's last two,
  casting circles, the world dimming and the view leaning in for big spells, a look for every school of magic,
  hit-stop and shake on heavy blows, and big outlined numbers that bounce off whoever is hit.
- **Fifty-seven people to walk with**: Lisandra (from the start), Homunculus the Proud, Lily Belle the
  Veiled, Jamie the Curator, Stevie the Stronger, eight more standing about the Hollow, and forty-four more about the
  Hollow, the pines and the four lands (eight to a land, by its road), each in one of bm's hero bodies in colours of
  their own. Six walk at once; the rest wait at The Last Toll.
- **Ten shops**: weapons, armour, spell scrolls, gems, rings and charms, bag room, enhancing (+1 to +10),
  enchanting, sockets and gem removal, and the inn (beds and draughts).
- **Twenty-six kinds of foe** in about 80 packs. In the pines, five kinds of the dead and the things that keep their
  company (the possessed, grave spiders, barrow goblins, plague knights, carrion harpies, Grave Callers, werewolves,
  plague giants), harder the farther from town; in each land beyond, two kinds of the dead (levels 10 to 17) and a lord
  at home in the land's ruin with a chest behind it. A bounty for most kinds, a writ for each lord. The twelve kinds of
  the lands beyond are stand-ins until their Meshy models are made (`docs/MODELS.md` sections 5 and 7).
- **The crypt** in the deep pines: a roofless ruin of bm's catacomb stone, its keeper the Bone Golem, and a chest.
- **Gear you can see**: every weapon is drawn in the hand that holds it (a ninja's knives in both), and the armour
  worn changes the body (steel and up, for the classes bm has bodies for). On bm's bodies, what is worn also paints
  the part of the body it covers: the helm the head, the armour the chest, shoulders, arms, legs and feet, each in the
  cloth, trim and weave of one of bm's 152 player skins, and the metal toned by the item's rarity (`src/gfx/dye.js`).
- **Auto-play**: rests, reads the board, fills the party, hunts, fights, wears what is better.

## Where things are

| | |
|---|---|
| `src/world/map.js` | the world as data: tiles, heights, trees, buildings, packs |
| `src/world/render.js` | the isometric view, textures, tile highlights; the trees: one light model for every kind (`TREE_LOOK`), wind, the kind by the ground under it, a hole cut round whoever stands behind one, felled to stumps in a fight |
| `src/world/ground.js` | the ground: tile tops and cliff faces, the ragged blends where two kinds of ground meet, grit along the joins, shores, each land's water |
| `src/world/scatter.js` | stones, grass, reeds, flowers and the rest strewn over the ground, and the soft dark under trees and houses |
| `src/gfx/ambient.js` | the air of each land: motes, fireflies, leaves, snow, dust, embers, ash and low mist |
| `src/gfx/models.js` | the loader for real models (loaded near the party, freed far from it), and the stand-ins for kinds with none yet |
| `src/game/explore.js` | walking, the follow chain, townsfolk, the dead spotting you |
| `src/game/battle.js` | the fight: placement, the turn clock, skills, statuses, the AI |
| `src/game/show.js` | how a fight looks: each skill's staging, the numbers, the banners and cut-ins |
| `src/gfx/fx.js` | the particles, flares, beams, rings and screen effects show.js draws with |
| `src/ui/combatlog.js`, `src/core/pinch.js` | the fight's log window and its settings; pinch to zoom |
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
bm: a cross is Tessariel's, so the cross-shaped shields stayed there, and so did six hero bodies with crosses sculpted into
them (two paladins and a paladin's armour, three lancers). Eight more had crosses only in their paint, which is painted
off as they come over (`tools/bm/marks`).

| | | |
|---|---|---|
| `assets/gear/` | 129 weapons, shields and lutes, baked small, with their icons | `tools/gear/bake.py`, `tools/gear/sources.txt` |
| `assets/models/heroes/` | 38 hero bodies, each a recruit's (`hero_<body>`) and most again as armour tiers 3 to 5 (`<class>_<g>_t<n>`), with a dye mask each (`<body>.dye.png`) | `tools/bm/heroes.py` |
| `assets/skins/`, `src/data/skins.js` | bm's 152 player skins: each part's cloth, trim and weave, and the 593 weave swatches in one sheet | `tools/bm/skins.py` |
| `assets/models/folk/` | ten townsfolk bodies and their paint | `tools/bm/folk.py` |
| `assets/models/clips/` | bm's hero and townsfolk clip banks (`"bank"` in the manifest) | the two above |
| `assets/models/foes/` | the new kinds of foe, a look or three each, their own clips in the file | `tools/bm/foes.py` |
| `assets/props/`, `assets/tex/crypt/` | the chest with its lid, the crypt's iron doors, the catacomb stone | `src/world/render.js` |
| `assets/ui/` | bars, buttons, tabs, slots, menu icons, goods, gems, spell pictures | `src/ui/art.js` |

The plague knight's crosses are painted off as `tools/bm/foes.py` copies it (`PAINT`). `node tools/check.mjs` doesn't
look at models; `viewer.html` shows any manifest key with what it carries.
