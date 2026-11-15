# Models for VELSCOUR TACTICS

What to make in Meshy (or Tripo), what to type, which animations each model needs, and how a finished
`.glb` gets into the game. Every figure has a **key**. A key with an entry in the manifest
is that model and is never shown as anything else; a key without one is a stand-in built from boxes in
`src/gfx/models.js` (today: the dead of the four lands, and the four who mind a recruit's shop), and a real model
replaces it by using the same key.

## 1. The look

Tactics-RPG job-class figures in the manner of the three Final Fantasy Tactics games, turned grim:

- **From the PlayStation game:** compact figures about five heads tall, small plain faces with almost no
  nose, big gloves and boots, layered cloth over armour, muted earth and wine colours, each job readable
  from its hat and its outline alone.
- **From the Game Boy Advance game:** chunky, slightly oversized hands, feet and headgear, so a figure
  still reads when it is two centimetres tall on screen.
- **From the DS game:** more costume detail per job (belts, pouches, trims, asymmetric pieces) and a
  distinct male and female cut of the same uniform.
- **Made VELSCOUR:** the "Grim Nocturne" palette from `velscour/docs/art_style/01_VELSCOUR_ART_BIBLE.md`
  (grave steel, reliquary gold, wine, night indigo, undead flesh), worn and patched and travel-stained,
  lit as if by one lantern. Rarity shows in the craft of the costume, never in brightness.
- **Never:** skull pauldrons, spikes on everything, glowing red eyes, faceless hoods, bat wings, neon,
  chains on everything. And by the V and T rule, **no letters or monograms anywhere**.

### The style block

These prompts are also kept as data in `tools/meshy/prompts.json` (section 12); that file is the one to edit.
Paste this at the end of every character prompt. (Meshy's prompt box is short; if it cuts you off, drop
the last sentence first.)

```
Stylized hand-painted tactics-RPG character, compact 5-heads-tall proportions, small plain face with a
tiny nose, oversized gloves and boots, layered worn cloth over armor, muted grimdark palette of grave
steel, wine red, night indigo and tarnished gold, matte painted textures, no glow, no text or symbols.
Full body, A-pose, arms 45 degrees down, legs slightly apart, empty hands, neutral expression, single
character, plain background, game-ready low-poly.
```

Settings: **A-pose on**, symmetry on, target about 15-25k triangles for heroes, 8-15k for monsters and
townsfolk, 2k textures (the camera is far away). Generate the body **without a weapon in its hands**:
weapons are separate models (section 4) that the game puts in the hand.

**Negative prompt:** `weapon in hand, text, letters, logo, skull shoulder pads, spikes, glowing eyes,
realistic photo, long legs, tall thin proportions, base, pedestal, multiple characters`

## 2. The seventeen classes (male and female each)

Key is `<class>_m` or `<class>_f`. Write the prompt as *subject line + style block*. For the other
gender, swap "man" and "woman" and keep the uniform; give the female cut a shorter coat or tabard and the
male cut broader shoulders, as the DS game does.

| Key | Subject line |
|---|---|
| `paladin_m/f` | A weary holy knight, dark-skinned bearded man, dented silver plate with a navy tabard and gold trim, flat-topped great helm under one arm removed, processional sash, kite shield strap on the back |
| `ranger_m/f` | A wildwood archer woman, moss-green hooded cloak, patched leather jerkin, bracers, quiver on the hip, feathers and a hawk's jess at the belt, mud to the knee |
| `wizard_m/f` | An elemental scholar, tall drooping pointed hat with a wide brim, rust-orange robe with gold hem singed black at the cuffs, ink-stained gloves, book chained at the belt |
| `necromancer_m/f` | A courteous undertaker-mage, deep violet funeral coat with bone toggles, top-knot under a mourning hood, grave-dirt on the hem, a string of finger bones as a rosary |
| `barbarian_m/f` | A muscular red-haired northern pit-fighter woman, horned fur cap, bare scarred arms, wolf pelt over one shoulder, wide studded belt, wrapped fists |
| `dragoon_m/f` | A lancer who leaps, blue-grey scaled half-plate, tall swept-back wyrm-crest helm with a visor, long split tail-coat, heavy landing greaves |
| `totem_master_m/f` | A spirit-pole shaman, carved wooden face-mask pushed up on the head, teal poncho with ochre bands, feather and bone talismans, bare feet wrapped in cord |
| `death_knight_m/f` | A fallen champion, blackened plate rimed with frost, closed helm with a narrow slit, tattered wine cloak frozen stiff, pale blue rune inlay on the breastplate (shapes, not letters) |
| `arcane_sorcerer_m/f` | A veiled star-gazer, night-indigo robe sewn with pale star studs, astrolabe on a chain, half-veil over the lower face, tall collar, brass lens on a headband |
| `carrion_witch_m/f` | A swamp hag, crooked wide-brimmed black hat, moss-green ragged gown, crow feathers at the shoulders, a rag poppet doll tied to the belt, muddy hem |
| `bard_m/f` | A roguish travelling minstrel, wine-red doublet with one sleeve slashed, feathered cap, half-cape, knife sheaths, fingerless gloves |
| `slime_lord_m/f` | A king made of translucent cobalt slime in the shape of a stout man, small tarnished gold crown sinking into his head, a royal mantle floating inside the body |
| `boomerang_knight_m/f` | A dashing light knight, teal surcoat over mail, rounded steel cap with a white plume, two curved-blade holsters crossed on the back, tall riding boots |
| `lancer_m/f` | An unbreakable knight-captain, heavy pale-steel full plate, bucket helm with a flat crest, broad pauldrons, tower-shield bracket on the left arm, banner pole socket on the back |
| `dragon_knight_m/f` | A wyrm-blooded knight, crimson scale armour with black trim, horned open helm, scaled gauntlets ending in claws, ember-orange lining to the cloak |
| `gunner_m/f` | A powder-stained engineer, brass goggles on a leather cap, long oilskin coat, bandolier of charges, heavy tool belt, scorched gloves |
| `ninja_m/f` | A quiet killer from the far roads, charcoal wrapped jacket with a wine-red sash, deep hood and a cloth mask, lacquered leather plates on forearms and shins, a closed pouch of throwing irons, two short hooked knives sheathed at the small of the back (made in the eighth batch; at tiers 3 and 5 they still wear bm's bodies) |

### The five who matter (remember to send me these)

**Lisandra and Stevie are in (sections 10 and 11). I still need Homunculus, Lily and Jamie from you.** Until they arrive, each wears a class stand-in.

| Key | Who | Subject line |
|---|---|---|
| `lisandra` | Lisandra, late of a cave up the Long Road | An old witch three hundred years old, bent and sharp-eyed, long patched brown gown, crooked hat with no tassel, a lantern at her belt, good cheekbones. (bm already has `assets/game/lisandra/witch.glb` and `pretty.glb`; either can be dropped in as-is.) |
| `homunculus` | Homunculus the Proud, smith and "Paladin" | An enormous, magnificent, beaming blacksmith in a leather apron over mismatched plate, huge forearms, a hammer loop, a great double-crescent axe strapped to his back |
| `lily` | Lily Belle the Veiled, enchanter | A veiled sorceress in deep green and violet, floating rune charms on threads, crystal at the throat, face hidden below the eyes |
| `jamie` | Jamie the Curator, jeweler | A lean monk-jeweler with a hand drill on a cord and jeweler's lenses pushed up on his forehead, teal surcoat, many small pouches |
| `stevie` | Stevie the Stronger, armorer | A broad armoured figure with a dented helmet and a tower shield, sleeves rolled, armourer's apron over plate |

## 3. Armour sets

Meshy makes one fused mesh, so armour cannot be peeled off a body. The workable route:

1. Make the class body once (section 2) and **rig it once**. That skeleton is the class's skeleton forever.
2. For each armour look, generate the *same character again* with **Image to 3D** from a re-dressed
   picture (or "retexture" for a recolour), then auto-rig it with the same preset so the bones match.
3. Name it `<class>_<g>_t<tier>`; the game will pick the model by the tier of the body armour equipped.
   (That lookup is not written yet; today one model per class is used.)

There are three weights and five tiers. The prompts, to append to a class subject line:

| Weight (classes) | Tier 1 Rusted | Tier 2 Iron | Tier 3 Steel | Tier 4 Tempered | Tier 5 Mithril |
|---|---|---|---|---|---|
| **Cloth** (wizard, necromancer, astronomer, witch, Lisandra) | threadbare patched robe, rope belt | shroud-silk robe, plain hem | scholar's layered robe, embroidered cuffs | vigil robe with metal-thread trim and mantle | ancient vestment, heavy brocade, tarnished gold clasps |
| **Leather** (ranger, barbarian, bard, totem master, boomerang knight, gunner) | cracked hide scraps, mismatched straps | studded leather jerkin | hunter's long coat with reinforced shoulders | brigandine with riveted plates | dark wyrmhide with scaled pauldrons |
| **Plate** (paladin, dragoon, death knight, slime lord, lancer, dragon knight) | rusted chain mail, dented pot helm | plain iron breastplate over mail | full steel plate, simple fluting | templar plate with engraved borders, tabard | ancient ornate plate, gold inlay, tall crest |

Start with **tier 1 and tier 3 only**; the other three can wait.

## 4. Weapons

One model per weapon type to start (ten), then a tier-3 and tier-5 version of each. Modelled alone,
**upright, grip at the origin, pointing up +Y**, so the game can parent it to the hand bone.

```
A single [WEAPON], stylized hand-painted tactics-RPG prop, chunky readable silhouette, worn grimdark
materials, grave steel and dark wood with tarnished gold fittings, matte, no glow, no text. Isolated
object, vertical, plain background, game-ready low-poly.
```

| Key | [WEAPON] |
|---|---|
| `w_sword` | short arming sword with a wide blade and a simple crossguard |
| `w_axe` | bearded one-handed war axe on a notched haft |
| `w_mace` | flanged chapel mace shaped like a small bell |
| `w_spear` | long boar spear with a leaf blade and a lugged socket |
| `w_bow` | recurved hunting bow, unstrung look, leather-wrapped grip |
| `w_pistol` | heavy brass-fitted flintlock pistol with a flared muzzle |
| `w_boomerang` | hooked steel throwing blade, curved like a crescent |
| `w_staff` | gnarled grave-iron staff shod with bone, caged ember at the head |
| `w_wand` | bone wand with a candle-stub tip |
| `w_lute` | battered travelling lute with a mourning ribbon |
| `w_shield_kite`, `w_shield_tower` | kite shield / tall tower shield, plain painted field, no device |
| `w_lance` | the lancer's three-metre jousting lance, as in bm: fluted shaft tapering to a leaf point, bell-shaped vamplate over a short grip |

The lancer carries `w_lance` (3 m) in the right fist and `w_shield_tower` (1.24 m) in the left. Don't draw them into the
body's picture: the A-pose 3D step leaves out anything held, so the lancer bodies come out empty-handed like the rest.
In the game they hang on the hand bones by the manifest's `props` (section 9), and `retarget.py` turns the hands in every
lancer clip so they point the right way: the lance upright, level at the foe in Thrust and Charge; the shield's face out to
the left, or square to the front in Guard_Up and Shield_Bash. Each file is in metres, upright along +Y (Blender's +Z), its
grip at the origin; the shield's face is toward +Z (Blender's -Y).

## 5. The dead, and what the classes summon

| Key | Subject line |
|---|---|
| `zombie_shambler` | A risen villager, grey-green skin, burial shroud and work clothes, one shoe, slack jaw, arms hanging |
| `zombie_gnawer` | A thin fast ghoul on all fours, long arms, stretched jaw, torn nightshirt, hunched to run |
| `zombie_lurker` | A dead woodsman half-covered in pine needles and moss, built to lie flat, one clawed hand forward |
| `zombie_bonesack` | A bloated corpse, belly swollen and split with yellow sacs, stubby legs, head tipped back |
| `zombie_brute` | A huge corpse too big for one grave, broken chains at wrists and neck, iron collar, stitched shoulders |
| `zombie_rimewalker` | A soldier frozen dead on the march and still walking, blue-white frostbitten skin, a rimed greatcoat and cracked border-guard cuirass sheathed in ice, icicles hanging from the jaw and elbows, one arm locked stiff, snow packed in the eye sockets |
| `zombie_driftling` | A gaunt pale ghoul built to lie flat under snow, bone-white skin, long clawed arms, a tattered white fur mantle and frozen rags that make it a snowdrift from above, black frostbitten fingers and nose, jaw hung open |
| `zombie_husk` | A sun-dried mummified corpse, thin as rope, leather-brown skin tight on the bones, wind-shredded desert wrappings and the faded silk of a caravan robe trailing behind, hunched forward to sprint, sand pouring from the mouth |
| `zombie_slinger` | A sun-bleached skeleton in the rags of a caravan guard, half its ribs missing and the rest sharpened, a quiver made of its own ribcage, cracked leather harness, faded red headcloth, one long arm cocked back |
| `zombie_drowner` | A drowned corpse risen from a bog, swollen grey-green waterlogged skin, a rotted fisherman's oilskin, pond weed and reeds trailing from the shoulders, long dripping arms with webbed black hands, mouth full of mud |
| `zombie_leechmother` | A bloated drowned corpse in a burst mourning gown, its body a mass of fat black leeches clinging and hanging in ropes, pale belly split open, stubby legs, head tipped back, veil of pond weed |
| `zombie_cinder` | A charred corpse still smouldering, blackened cracked skin with dull ember-orange in the cracks, the burnt rags of a railway porter's uniform, brass buttons fused to the chest, smoke-stained jaw, clawed hands of coal |
| `zombie_slagback` | A huge corpse with a hump of cooled furnace slag and iron plate fused across its back and shoulders, a foundryman's leather apron, rivets through the skin, one arm cased in black iron, bent double under the weight |
| `zombie_warden` | A towering dead fortress captain frozen at his post, an ornate border-guard plate harness cased in ice, a great fur-collared cloak stiff with rime, a crown of icicles grown through the open helm, frost-white beard, gauntlets fused shut |
| `zombie_dryking` | A tall mummified desert king, sun-black skin on long bones, a tarnished gold collar and the bleached shreds of royal silk, a tall cracked crown of bone and gilt, jeweled finger-claws, robes of wind-torn linen trailing sand |
| `zombie_abbess` | A tall drowned abbess, grey waterlogged face under a rotted wimple and long veil, a black brocade habit heavy with water and silt, a rosary of river stones, reeds and pond weed hanging from the sleeves, hands folded and clawed |
| `zombie_stoker` | A giant dead locomotive fireman, soot-black skin cracked with furnace glow, a scorched leather apron and iron-shod boots, a boiler plate riveted across the chest, a soot-caked cap fused to the skull, forearms like burnt timbers |
| `wolf` | A lean grey wolf, scarred muzzle |
| `skeleton` | A risen cathedral guard in the corroded remains of ceremonial armour, a rusted crested cap |
| `ghoul` | A violet-grey ghoul, hunched, long nails, the rags of a fine burial shroud |
| `slime` | A knee-high cobalt slime with two dark eyes |
| `squire` | A young knight-squire in plain polished half-plate, a striped pennant on the back (no device) |
| `whelp` | A cat-sized red dragon whelp with stubby wings |
| `turret` | A brass clockwork gun on a tripod |
| `totem` | A carved wooden spirit pole of three stacked faces, bear, bird and serpent |

Monsters get the style block too, minus "5-heads-tall" and "neutral expression".

## 6. Townsfolk and scenery

`garrick`, `orrin`, `zafir`, `fortunato`, `tamsin`, `aggie`, the apprentices, `kit`, `jory`, `hob`, `agnes`
(see `src/data/cast.js` for who each is). The eight recruits have bodies of their own (the eighth batch).
The scenery is in (the sixth to eighth batches, section 12): pine, oak, a tree for each land (snow pine, dead
tree, charred tree, palm), the well, the bounty board, a signpost, a market stall, fence and stone wall pieces, two
cottages, a townhouse, a shop house, the inn and the forge, each land's broken wall and standing stone, and the
crypt's sarcophagus. Still wanted: the townsfolk.

## 7. The first batch: what to make first

1. The five named: `lisandra`, `homunculus`, `lily`, `jamie`, `stevie`.
2. `zombie_shambler`, `zombie_gnawer`, `zombie_lurker`, `zombie_bonesack`, `zombie_brute`. **Done (section 12), and redone in the ornate look (the sixth batch).**
   **Still to make (stand-ins in the game now):** the eight that walk the lands past the pines, `zombie_rimewalker`,
   `zombie_driftling` (the White Waste), `zombie_husk`, `zombie_slinger` (the Red Badlands), `zombie_drowner`,
   `zombie_leechmother` (the Drowned Fen), `zombie_cinder`, `zombie_slagback` (the Cinder Reach), and the four lords,
   `zombie_warden`, `zombie_dryking`, `zombie_abbess`, `zombie_stoker` (about 1.7 tiles tall on a 1-tile footing).
   Animation needs: the zombie set; `pounce` for the driftling, `sweep` for the warden.
3. Four classes, both genders (eight bodies): `paladin`, `ranger`, `wizard`, `barbarian`.
4. The ten weapons and the two shields.
5. `wolf`, `skeleton`, `totem`, `turret`.
6. The other twelve classes, then tier-3 armour for all, then townsfolk and scenery.

That is 34 models for a first playable look, 58 with every class.

## 8. Animations

The code today plays seven states: `idle`, `walk`, `attack`, `cast`, `hit`, `dead`, `cheer`. The lists
below are everything the game will want; the first seven are what to make first. Humanoids should share
one skeleton (Meshy's auto-rig or Mixamo's) so one clip serves every class.

### Every humanoid (make once, reuse on all)

| Clip | Notes |
|---|---|
| `idle` | breathing, weight shift; loop |
| `walk` | loop, in place (no root motion), one tile per 0.15 s feels right at about 1.3x speed |
| `run` | loop; for auto-play's faster pace |
| `jump` | crouch, leap, land in about 0.3 s; in place, the game moves the body |
| `climb_hop` | a hop up or down a ledge half a body high |
| `hit` | flinch back, recover |
| `dead` | collapse and stay down (last frame held) |
| `revive` | get back up from `dead` |
| `cheer` | victory, loop |
| `kneel` | low on life, loop |
| `guard` | braced, shield or arms up, loop |
| `item` | drink or hand over a draught |
| `talk` | small hand gestures, loop |
| `point` | the leader ordering the line, for placement |
| `stunned` | reeling, loop |

### By what is in the hand (each used by several classes)

| Clip | Used by |
|---|---|
| `attack_swing` (one-handed overhand) | paladin, death knight, dragon knight, slime lord, barbarian |
| `attack_dual` (two axes, left then right) | barbarian |
| `attack_thrust` (two-handed spear) | dragoon, lancer |
| `attack_bow` (nock, draw, loose) | ranger |
| `attack_shoot` (pistol, recoil) | gunner |
| `attack_throw` (sidearm throw, catch) | boomerang knight |
| `attack_staff` (staff jab) and `cast_staff` (raise staff, slam) | wizard, witch, totem master, Lisandra |
| `cast_wand` (flick forward) | necromancer, astronomer |
| `cast_two_hand` (both arms up, long) | every big spell |
| `play_lute` (strum, loop) | bard |
| `shield_bash`, `shield_raise` | paladin, lancer |

### Class only

| Class | Clips |
|---|---|
| Paladin | `smite` (hammer from overhead), `pray` (kneel, light) |
| Ranger | `volley` (three fast shots up), `whistle` (calls the wolf) |
| Wizard | `meteor` (pull down from the sky), `nova` (arms out, spin) |
| Necromancer | `raise` (hand lifts something out of the ground), `curse` (slow point) |
| Barbarian | `whirlwind` (spin, loop), `leap_slam`, `ground_slam`, `roar` |
| Dragoon | `jump_up` (leaves the screen), `dive_land` (spear first), `breath` |
| Totem Master | `plant_totem` (drive it into the ground), `spirit_call` |
| Death Knight | `obliterate` (huge two-handed cleave), `death_coil` (off-hand throw) |
| Astronomer | `chart` (draws in the air), `pull_down` (star fall) |
| Carrion Witch | `hex` (pin in the poppet), `release_crows` (cloak thrown open) |
| Bard | `ballad` (plays facing friends), `sharp_note` (one hard strum) |
| Slime Lord | `belly_flop`, `split` (a slimeling drops off), `spit` |
| Boomerang Knight | `twin_throw`, `blade_spin` |
| Lancer | `shield_wall` (plant the tower shield), `charge` (lance couched, run), `rally` (banner up) |
| Dragon Knight | `fire_breath`, `scales` (arms crossed, flex), `call_whelp` |
| Gunner | `grenade_lob`, `deploy_turret` (kneel, set down), `fan_fire` |
| Lisandra | `snap` (the finger snap), `lantern_up`, `candle_wave` (sweep of the hand) |
| Homunculus | `hammer_blessing` (as if at the anvil), `beam` (hands on hips, proud) |

### Monsters only

| Model | Clips |
|---|---|
| All zombies | `idle` (sway, groan), `shamble` (walk), `alert` (head snaps round, arms up: plays under the red **!**), `rake` (two-arm swipe), `hit`, `dead`, `rise` (out of the ground) |
| Gnawer | `lope` (four-limbed run), `bite` |
| Lurker | `play_dead` (lying still, loop), `spring_up`, `pounce` |
| Bonesack | `retch` (ranged spit), `burst` (the death) |
| Brute | `chain_sweep` (wide spin), `slam` (two fists down), `roar` |

### Summons and scenery

Wolf: `idle`, `run`, `bite`, `hit`, `dead`. Slime: `idle`, `hop`, `lunge`, `dead`. Whelp: `hover`,
`fly`, `spit`, `dead`. Skeleton, ghoul and squire use the humanoid set. Turret: `idle`, `fire`,
`break`. Totem: `idle` (faces glow), `pulse`, `break`. Chest: `open`. Trees: none.

## 9. Putting a finished model in the game

1. Save the file as `assets/models/<key>.glb` (animations inside the same file).
2. Add it to `assets/models/manifest.json`. Lisandra's entry is the worked example:

```json
{
  "lisandra": {
    "file": "lisandra.glb",
    "height": 1.7,
    "inPlace": true,
    "lift": 0.15,
    "normal": 0.5,
    "outline": 0.018,
    "bones": { "Spine": [1.15, 1, 1.15], "Head": 1.4, "LeftUpLeg": 0.85, "RightUpLeg": 0.85, "LeftHand": 1.15, "RightHand": 1.15 },
    "glow": { "bone": "Hips", "at": [16.9, -33.9, 13.9], "color": "#e8922e", "size": 0.24, "opacity": 0.55, "light": 2.2, "held": { "lantern": "LeftHand" } },
    "anims": { "idle": "Idle", "walk": "Walk_Bent", "attack": "Bolt", "cast": "Cast", "hit": "Hit", "dead": "Dead_Fall", "cheer": "Victory" },
    "speed": { "walk": 1.4 }
  }
}
```

| Field | What it does |
|---|---|
| `height` | how tall she stands, in tiles (a stand-in is 1.6) |
| `turn` | radians, if the model faces the wrong way |
| `anims` | the game's state names mapped to the clip names inside the file |
| `speed` | playback speed per state |
| `inPlace` | flattens the root bone's sideways and forward travel, so Mixamo clips stay on their tile |
| `lift` | how much of the model's own colour glows back; dark costumes need a little |
| `normal` | normal map strength; Meshy's bakes sparkle at this distance unless it is turned down |
| `outline` | thickness of the dark hull round the figure, in the model's own units |
| `bones` | scales for bones whose names end with the key: bigger head and hat, shorter legs, the compact tactics look |
| `glow` | a lit thing she carries: a glow and a small light at a bone, which moves to another bone in the states listed in `held` |
| `trim` | `{state: [from, to]}`: the seconds of the clip to keep for that state; library clips come with long wind-ups, and a blow has to land 0.26 s after it starts |
| `matte` | `false` keeps the file's metalness (there is no environment to reflect, so the default reads metal as paint) |
| `bank` | the clip bank the model plays instead of clips of its own (`heroes` or `folk`: `assets/models/clips/`, `src/gfx/clipbank.js`); `anims` then names the bank's clips |
| `dye` | a palette from `src/gfx/dye.js` (`PALETTES`) the body wears until armour paints over it; only bm's bodies can be dyed (below) |
| `props` | held models, each `{file, bone, at, rot, scale}`: a weapon's own file hung on the bone whose name ends with `bone`, placed at `at` and turned by the quaternion `rot` in that bone's frame. Don't work these out by hand: `Target.props()` in `retarget.py` prints them after `build`, and the clips are made to suit them (the lancers' entries are the example) |

A key with no entry keeps its stand-in, so they can arrive one at a time. Once a key has its entry its stand-in is
never built, so take its case out of `makeZombie` (or `makePerson`'s `KIT`) then.

Bodies are loaded only near the party (`Explore.rouse`: `wake`/`sleep` in `models.js`) and their files freed once
nobody near wears them, so that a phone can hold the world. Anything that takes a figure off the stage for good calls
`sleep(model)` first.

### The states a model can have

Every model needs the first seven. The rest fall back if missing (in brackets).

`idle`, `walk`, `attack`, `cast`, `hit`, `dead`, `cheer`; then `run` (walk), `jump` (keeps walking),
`wounded` (idle; played under 30% life), `stunned` (idle), `guard` (idle; played while guarded),
`revive` (idle), `talk` (idle; played while that character is speaking), `item` (cast), `taunt` (nothing;
played after putting one of the dead down), `point` (nothing; the leader, when placement opens). A skill can name its own state with `anim` in
`src/data/classes.js` (Lisandra's are `cast_bolt`, `snap`, `lantern`, `wave`; the Lancer's are `thrust`, `guard_up`, `rally`,
`charge`); a model without it plays
`cast` or `attack`.

### bm's bodies: recruits and what they wear

`python tools/bm/heroes.py` brings 38 of bm's 44 hero bodies over to `assets/models/heroes/`. Each comes in under two
kinds of key:

| Key | What it is |
|---|---|
| `hero_<body>` | the body a recruit walks in, named by the recruit's `model` in `src/data/cast.js` (`hero_archer_f6` is Marigold) |
| `<class>_<g>_t<tier>` | the same body as an armour tier: worn by anyone of that class once their armour is that tier or better (`explore.js`, `bodyKey`) |

Every one shares bm's rig and plays its clip bank. Each is cut, vertex by vertex, into the pieces of bm's harness
(helm, chest, shoulders, arms, legs, boots, mail, in the file's `pieces` extra and its `_PIECE` attribute), and beside
it is `<body>.dye.png`, which texels are dyed cloth or enamel (red), bare steel, ivory or undyed cloth (green), and
gilt (blue). bm's own recolour rule decides each one.

`src/gfx/dye.js` paints each piece by what covers it there. The helm paints the head. The armour paints the chest,
shoulders, arms, legs and feet, each in its own part of the item's skin: one of bm's 152 player skins
(`src/data/skins.js`), rolled with the item from those of its rarity. That gives the part's cloth, its trim and a weave
of bm's, laid on the cloth with the shading kept. The metal is toned by the item's tier, from rust-brown to the blue of
Mithril. A part nothing covers wears the recruit's own `palette`. Eight bodies came with crosses in their paint, and have them
painted off as they are copied (`tools/bm/marks/README.md`). Six more have crosses sculpted into the mesh, which paint
can't reach: paladin_m2, f1 and f2, lancer_m2, m3 and m4 stay in bm (`SCULPTED` in `heroes.py`) until someone
re-sculpts them. Re-sculpting means smoothing each cross off its breastplate or tabard and keeping the UVs.

## 10. Lisandra, as done

Source: `LISANDRA OLD.glb` (Meshy, Mixamo rig, 51 MB). The game copy is `assets/models/lisandra.glb`
(2.2 MB: textures at 1024 as JPEG, sword clips dropped). The Blender working file with every clip is
saved beside the source as `LISANDRA OLD - tactics.blend`.

Her seventeen clips were composed in Blender from poses of the clips the model came with (a pose from one
clip for some bones, blended, retimed or reversed), all on one bent idle so nothing snaps:

`Idle`, `Walk_Bent`, `Run_Bent`, `Hop`, `Bolt` (Old Tricks and her plain attack), `Snap` (The Snap),
`Lantern_Up` (Lantern Light; the glow moves to her raised hand), `Wave` (Wave of Candles), `Cast`, `Hit`,
`Stunned`, `Wounded`, `Dead_Fall`, `Revive`, `Victory`, `Talk`, `Drink`.

The texture was regraded for this camera: lifted out of the dark, the hat pushed to night indigo, the
mantle to wine, the pale cloth to dirty parchment.

Two critics reviewed her twice, one on animation and one on how she sits in the game. Scores went from
4 and 4 to 6 and 6.5, and the second round of fixes went in after that without a third review. What they
still wanted and has not been done: a guard or dodge reaction, a distinct charge-and-hold for the generic
cast, and darker gloves.

## 11. Stevie the Stronger, as done

Source: `Stevie the Stronger.glb` (Meshy, the same Mixamo rig as Lisandra, but only a walk and a run).
The game copy is `assets/models/stevie.glb` (2.3 MB); the Blender working file is saved beside the source
as `Stevie the Stronger - tactics.blend`.

Her clips were **retargeted from Lisandra's motion library**. The two models share bone names but not
bind poses, so each of Lisandra's poses is carried over in armature space through an offset measured where
both are known to be in the same pose: frame 0 of the walk they share. Lisandra's walk, sent through that,
lands within 8 degrees of Stevie's own walk on every bone. The same route will serve any other model on
this rig that arrives with a walk.

Her twenty-one clips, on an upright idle (she is not bent):

- the same list as Lisandra's: `Idle`, `Walk`, `Run`, `Hop`, `Cast`, `Hit`, `Stunned`, `Wounded`,
  `Dead_Fall`, `Revive`, `Victory`, `Talk`, `Drink`
- the lance and shield: `Thrust` (Lance Thrust and her plain attack), `Charge` (Lance Charge),
  `Guard_Up` (Tower Shield), `Guard` (how she stands while guarded), `Rally` (Squire Knight),
  `Shield_Bash` (mapped as `bash`; nothing uses it yet)
- her own: `Flex` (the `taunt` after a kill), `Point` (when she leads and placement opens)

She has no spear or shield in her hands: weapons are separate models (section 4) and none exist yet, so
the thrust is an empty-handed lunge for now. She has not been through the critics.

## 12. The five dead, as done

*These first five were replaced under the same keys by the ornate ones of the sixth batch (further down); this is
how the first ones were made.*

All five zombies are in: `zombie_shambler`, `zombie_gnawer`, `zombie_lurker`, `zombie_bonesack`, `zombie_brute`
(about 1.1 MB each: 12k triangles, one 1024 JPEG). Made entirely through the Meshy API, 241 credits for the five:

1. a design picture from the section 5 subject line plus the style block (text to image, `nano-banana-pro`, T-pose);
2. image to 3D with `meshy-t2.5` smart topology at 12,000 triangles and the `meshy-n1` texture;
3. Meshy's auto-rig (bones are plain `Hips`, `Spine`, `Head`, `LeftUpLeg`..., no `mixamorig:` prefix, so Lisandra's
   library does not retarget onto them without a rename);
4. clips from Meshy's animation library, merged into the one file, then trimmed and sped up in the manifest.

| State | Clip | Who |
|---|---|---|
| `idle` | `Idle` | all |
| `walk` | `Mummy_Stagger_inplace` / `Lean_Forward_Sprint_inplace` / `Cautious_Crouch_Walk_Forward_inplace` / `Slow_Orc_Walk_inplace` | shambler / gnawer / lurker / bonesack and brute |
| `attack` | `Punch_Forward_with_Both_Fists` (the rake and the bite); `Charged_Ground_Slam` | all; brute |
| `cast`, `cheer` | `Zombie_Scream` (the bonesack's retch) | all |
| `pounce` | `Jumping_Punch`, the landing half | lurker (Pounce names it with `anim`) |
| `sweep` | `Axe_Spin_Attack` | brute (Chain Sweep names it with `anim`) |
| `hit`, `dead` | `Hit_Reaction`, `Dead` | all |

Not made: `alert`, `rise`, the gnawer's four-limbed lope (the rig is a biped's; it sprints bent forward instead),
the lurker's `play_dead` (it lies in the last frame of `dead`), the bonesack's `burst`. They have not been through the critics,
and have only been looked at posed in the square, not in a fight.

## 12. Making a model from nothing: the Meshy route

The class models were made this way, start to finish, for 29 credits each.

**The prompts live in `tools/meshy/prompts.json`**: the look, the style blocks, the negative prompt and a
subject line for every model in the game. `node tools/meshy/prompt.mjs <key>` prints one ready to paste
(`... <key> image` for the picture step, `... <key> 3` to add tier-3 armour); with no key it lists them all.
Change a prompt there, not here.

1. **Picture** (9 credits): `meshy_text_to_image`, `nano-banana-pro`, `pose_mode: a-pose`, with the
   `image` prompt. Look at it: right class, right palette, and no letters or marks anywhere (the V and T
   rule). The pictures are kept in `art/concepts/<key>.png`.
2. **3D** (15): `meshy_image_to_3d` from that picture, `meshy-t2.5` smart topology at 30,000 triangles
   (15,000 before the ornate restyle), texture `meshy-n1`, `pose_mode: a-pose`.
3. **Rig** (5): `meshy_rig`. Download `Animation_Walking_withSkin.glb` from its result: the model, its
   skeleton and the walk the next step calibrates on.
4. **Animations** (no credits): in Blender, open the motion library `LISANDRA OLD - tactics.blend`, then

   ```python
   exec(open(r"<repo>/tools/blender/retarget.py").read())
   T = Target("paladin_m", r"<path>/paladin_m_walk.glb")
   T.build("paladin")                       # the common set plus the class's own clips
   T.sheet(["Idle", "Swing", "Smite"], "check")
   T.export(r"<repo>/assets/models/paladin_m.glb")
   ```

   It renames Meshy's bones to the library's, measures the offset between the two figures on frame 0 of
   the walk, carries every library pose across, and composes the clips. It prints how far the library's
   walk lands from the model's own (8 to 12 degrees at worst on these three). A new class is one more
   branch in `build()`.
5. **Game**: an entry in `assets/models/manifest.json` (copy `paladin_m`'s), and `anim` on the class's
   skills in `src/data/classes.js` so each skill plays its own clip.

Every model made this way has the common sixteen: `Idle`, `Walk`, `Run`, `Hop`, `Cast`, `Hit`, `Stunned`,
`Wounded`, `Dead_Fall`, `Revive`, `Victory`, `Talk`, `Drink`, `Guard`, `Point`, `Flex`. On top of those:

| Class (models made) | Its own clips |
|---|---|
| Paladin (`paladin_m`, `paladin_f`) | `Swing` (plain attack), `Smite`, `Bolt` (Holy Bolt), `Bless` (Blessed Light), `Wave` (Consecration), `Shield_Bash` (unused) |
| Ranger (`ranger_m`, `ranger_f`) | `Shoot` (plain attack, Quick Shot, Multishot), `Volley` (Rain of Arrows), `Call` (Wolf Pack) |
| Wizard (`wizard_m`, `wizard_f`) | `Bolt` (plain attack, Fire Bolt), `Wave` (Frost Nova), `Meteor`; Chain Lightning uses `Cast` |
| Barbarian (`barbarian_m`, `barbarian_f`) | `Swing` (plain attack), `Bash`, `Leap`, `Whirl` (Whirlwind), `Slam` (Earthquake) |
| Necromancer (`necromancer_m`) | `Bolt` (plain attack, Bone Spike), `Raise` (Raise Skeleton), `Curse` (Weaken); Corpse Explosion uses `Cast` |
| Dragoon (`dragoon_m`) | `Thrust` (plain attack, Lance Jab), `Leap` (Jump, Dragon Dive), `Breath` (Dragon Breath) |
| Death Knight (`death_knight_m`) | `Swing` (plain attack, Frost Strike), `Bolt` (Death Coil), `Raise` (Raise Ghoul), `Smite` (Obliterate) |
| Carrion Witch (`carrion_witch_f`) | `Bolt` (plain attack, Rot Bolt), `Wave` (Crow Swarm), `Hex` (Voodoo Doll); Toxic Rain uses `Cast` |
| Bard (`bard_m`) | `Strum` (plain attack, Plucked Note), `Ballad` (Ballad of Valor, Lullaby), `Bless` (Hymn of Mending) |

Thirteen models have been made this way, in two batches. None holds a weapon yet (section 4), and none has
been through the critics.

**Still stand-ins:** the other sex of necromancer, dragoon, death knight, carrion witch and bard; both sexes
of totem master, astronomer, slime lord, boomerang knight, lancer, dragon knight and gunner; the summons; the
townsfolk.

### The ornate restyle

All eighteen humans (the five of the party and the thirteen class models) were then made again from new
pictures in the ornate grimdark look of `prompts.json`, the same route at 30,000 triangles, and replaced the
first models under the same keys. The Blender working file holding all eighteen is
`v2 ornate (eighteen) - tactics.blend` in the meshy folder. What changed in the recipe:

- **No stylising.** The restyled entries have no `bones`, `outline`, `lift` or `normal`: the figures keep the
  proportions and the shading they were drawn with. What makes them read on dark ground is not per model: every
  party member and every one of the dead gets an edge light and a thin outline in its side's colour, a ring at its
  feet and its darks lifted a little, at run time (`src/gfx/outline.js`, tuned in its `LOOK`).
- **Height by the head.** Meshy places `HeadTop_End` wherever a hat ends, so stature is measured from the
  `Head` bone as 0.87 of the body, and `height` = wanted head height in tiles x whole height / stature.
- **New class branches** in `retarget.py`: `lancer` (Stevie: `Thrust`, `Guard_Up`, `Rally`, `Charge`,
  `Shield_Bash`), `arcane_sorcerer` (Lily: `Bolt`, `Bless`, `Meteor`, `Wave`), `boomerang_knight` (Jamie:
  `Throw`, `Twin`, `Whirl`, `Typhoon`), and `doorkeeper`, which carries Lisandra's seventeen library clips
  across whole. `T.retarget(src, name=...)` writes a clip under any name.
- **Look at the picture for marks.** The necromancer's coffin lids came back with crosses; they were painted
  out of the picture before the 3D step and the prompt now asks for plain lids.

`viewer.html` (same server) shows any set of models side by side with every clip, the game's lights and
camera, and frame stepping: `viewer.html?m=lily,jamie` opens those two.

**Things learnt.** Look at every picture before the 3D step: the first death knight came back with a chest
emblem made of V-shaped chevrons and was redrawn (its prompt now says "no emblem"). The two sexes of a class
come out in the same uniform but not always the same colours (the two wizards' hats differ). A rigging call
made before its 3D task has finished is refused without charge; wait and call again.

### The fifth batch: the last class bodies, and three summons

`totem_master_m` and `_f`, `slime_lord_m` and `_f`, `dragon_knight_m` and `_f`, `gunner_f`, and the summons
`skeleton`, `ghoul` and `squire` (20,000 triangles; the squire's prompt takes the character style, the other two
the monster one). Summons now go through the manifest like everyone else: `battle.js` asks
`withOverride` for the summon's key. All of them have their models, so there are no summon stand-ins any more: a new
summon needs its manifest entry before it can be seen. New branches in
`build()`:

| Branch | Its own clips |
|---|---|
| `totem_master` | `Bolt` (plain attack, Spirit Strike), `Slam` (Earth Shock), `Plant` (Healing and Searing Totem: a post lifted, raised overhead and driven into the ground) |
| `slime_lord` | `Swing` (plain attack), `Bolt` (Slime Ball), `Slam` (Body Slam, the leap), `Split` (Slimeling: shaken all over, a lump let go), `Wave` (Acid Splash) |
| `dragon_knight` | `Swing` (plain attack, Flame Slash), `Breath` (Fire Breath, the dragoon's), `Scales` (Dragon Scales: arms crossed, then thrown wide), `Call` (Summon Whelp) |
| `gunner` | `Shoot` (plain attack, Pistol Shot), `Fan` (Bullet Hell: four shots swept across), `Lob` (Grenade, underarm), `Deploy` (Gun Turret: down on the knees) |
| `skeleton`, `ghoul`, `squire` | `Swing`, `Rake` (both hands up, then raking down), `Thrust` |

The slime lords hold their arms 22 degrees out (round as a cask), the dragon knights and totem masters 15. The slime
is drawn see-through but the game draws bodies solid, so they read as glossy cobalt.

### The sixth batch: the dead again, five creatures, and the scenery

Twenty models for 505 credits: the five dead redrawn in the ornate look, the five summons that are not people,
and ten pieces of scenery. Pictures `nano-banana-pro` (9 credits; creatures stand square instead of in an A-pose,
`creature_image` in `prompts.json`), 3D `meshy-t2.5` with `meshy-n1` (15), and a rig (5) for the dead only. The
pictures are kept in `art/concepts/v2/`, and the Blender working file with all fifty-eight models of the
ornate look is `v2 ornate (fifty-eight) - tactics.blend` in the meshy folder.

**The dead** are rigged by Meshy and built by `retarget.py` like the classes (`T.build("zombie_brute")`), on a
branch of their own: one slumped idle under every clip (back and neck bent, arms hung forward from the shoulders,
knees given), a squat measured with both feet flat so a crouch stays on its soles, and per kind the lean, the reach
and the walk's sway. The library's `Run`, `Victory`, `Talk`, `Drink`, `Point` and `Flex` are left out.

| Key | `height` | Its own clips, on top of `Idle`, `Walk`, `Hop`, `Roar` (cast, cheer, taunt), `Hit`, `Dead_Fall`, `Revive`, `Wounded`, `Stunned`, `Guard` |
|---|---|---|
| `zombie_shambler` | 1.7 | `Rake` (attack): both arms up, raked down |
| `zombie_gnawer` | 1.65 | `Bite` (attack): a lunge of the head, the bite, a tearing twist |
| `zombie_lurker` | 1.8 | `Rake` (attack), `Pounce` (coiled low, off the ground with the legs tucked, down on all fours) |
| `zombie_bonesack` | 1.6 | `Rake` (attack), `Retch` (cast: heaved up from the belly, the neck thrown forward) |
| `zombie_brute` | 2.3 | `Slam` (attack, and its Slam), `Sweep` (Chain Sweep: one whole turn, arms out) |

Meshy can lay the hips bone over (the brute's is tilted 45 degrees), so `retarget.py` now takes up as the
armature's Z (`self.Z`) wherever it locks the hips, sets the feet on the floor or turns the body, not as the hips'
own axis; before that the brute's slam left its feet 15 cm in the air.

**The creatures** (`wolf`, `slime`, `whelp`, `turret`, `totem`) have no Meshy rig (it is for two legs). Each is
rigged by hand in Blender: `tools/blender/creature.py` builds an armature bone by bone and skins the mesh by
distance to the bones (Meshy's meshes are shells within shells, and Blender's bone heat fails on them; the turret is
skinned rigid, head and base); `tools/blender/summons.py` holds each one's bones and hand-keyed clips. With the 3D
model imported as `<key>_s2`:

```python
exec(open(r"<repo>/tools/blender/creature.py").read()); exec(open(r"<repo>/tools/blender/summons.py").read())
prep("wolf", 0.95)                           # turned to face -Y, its height in metres, feet on the floor
arm, names = BUILD["wolf"]()                 # the armature and its clip names
export("wolf", arm, names, r"<repo>/assets/models/wolf.glb")
```

| Key | `height` | Clips (the game state they play) |
|---|---|---|
| `wolf` | 0.95 | `Idle`, `Run` (walk, run), `Bite` (attack), `Howl` (cast, cheer), `Hit`, `Dead` |
| `whelp` | 0.9 | `Hover` (idle; it never lands), `Fly` (walk, jump), `Spit` (attack, cast), `Roar` (cheer), `Hit`, `Dead` |
| `slime` | 0.7 | `Idle` (a slow wobble), `Hop` (walk, jump), `Lunge` (attack, cast), `Hit`, `Dead` (it runs flat) |
| `turret` | 0.9 | `Idle` (the head scanning), `Fire` (attack: recoil), `Hit`, `Break` (dead) |
| `totem` | 1.4 | `Idle`, `Pulse` (attack, cast, heal: the top face swells), `Hit`, `Break` (dead: it topples) |

**The scenery** is static, in `assets/props/`, made by `tools/blender/props.py` (`place` turns a piece to face
the game's south and sizes it in tiles, a tile being a metre; `split` gives a tree a trunk and a crown material;
`decimate`; `export`). `src/world/render.js` draws them with `loadProp(key)`, and keeps the old code-built shapes
for anything whose file is missing.

| Key | Size (wide x deep x tall, tiles) | In the world |
|---|---|---|
| `pine`, `oak` | made 1 tall; 1,563 and 2,717 triangles | every pine and oak of the map (about 3,100), scaled to the old trees' heights, each crown one of four greens; a fight takes the crowns and leaves the trunks |
| `cottage`, `townhouse` | 4.8 x 4.6 x 4.2; 4.8 x 4.6 x 5.5 | each building's `look` in `map.js`; a wide plot of townhouses takes two with their doors toward the middle (the inn has its own since the seventh batch); every other house is mirrored, and each is slid so its door is near the front tile |
| `well`, `bounty_board` | 1.3 x 1.1 x 1.8; 1.7 x 0.7 x 2.0 | the square |
| `market_stall`, `signpost` | 2.2 x 1.4 x 2.2; 1.7 x 1.0 x 2.3 | three stalls round the square, a signpost on each road out (`decor` in `map.js`) |
| `fence`, `stone_wall` | 2 tiles long each | the town's edge, leaving the roads open: stone near the four roads, fence beyond (`decor`) |

Every board, sign and sheet of parchment is blank, as the V and T rule asks. None of the twenty has been through
the critics.

### The seventh batch: the dead past the pines, the lands' trees, the inn and the forge

Twenty models for about 568 credits (550 were asked for; the dead tree took three pictures): the twelve dead of
the four lands, a tree for each land, the inn and the forge, and two class bodies, `boomerang_knight_f` and
`gunner_m`. The same route as the sixth batch (pictures in `art/concepts/v2/`); the Blender working file is now
`v2 ornate (seventy-eight) - tactics.blend` in the meshy folder.

**The dead** go through the zombie branch of `retarget.py`, each with its own posture (lean, neck, droop, arms,
knees) and walk; the dust husk runs on the gnawer's lunging gait. Two new clips, which the skills ask for by `anim`
in `enemies.js` (an unknown one falls back to the attack, so the stand-ins are unchanged):

| Key | `height` | Its own clips (the shared set as in the sixth batch) |
|---|---|---|
| `zombie_rimewalker` | 1.85 | `Rake` (attack) |
| `zombie_driftling` | 1.6 | `Bite` (attack), `Pounce` |
| `zombie_husk` | 1.6 | `Rake` (attack) |
| `zombie_slinger` | 1.7 | `Rake` (attack), `Throw` (Rib Throw: a rib wrenched out over the shoulder and slung) |
| `zombie_drowner` | 1.75 | `Rake` (attack), `Drag` (Drag Under: both hands out to seize, then hauled back and down) |
| `zombie_leechmother` | 1.75 | `Rake` (attack), `Retch` (cast) |
| `zombie_cinder` | 1.7 | `Rake` (attack) |
| `zombie_slagback` | 2.2 | `Slam` (attack), `Sweep` |
| `zombie_warden` | 2.6 | `Slam` (attack), `Sweep` (Winter Toll) |
| `zombie_dryking` | 2.5 | `Rake` (attack) |
| `zombie_abbess` | 2.3 | `Rake` (attack), `Drag` (Drag Under) |
| `zombie_stoker` | 2.6 | `Slam` (attack), `Sweep` |

The dry king's gold collar came out of the 3D step with faint marks like writing on it; they were painted out of
the texture in Blender (a blur over the gold of the collar band only) before export.

**The trees** take a plainer style block of their own, `style.tree` in `prompts.json` (`prompt.mjs` uses it for
`pine`, `oak`, `snowpine`, `dead_tree`, `char_tree` and `palm`): the village block put ironwork and stonework round
a tree's foot. The first dead tree stood in a stone planter under a roof and the second had iron spikes and a
brass band, one spike like a cross; the third, from the tree block, is clean. The charred tree and the snow pine
keep a few small stones at the foot, which are part of the root mesh and hardly show at the game's distance.

| Key | Size (wide x deep x tall, tiles) | In the world |
|---|---|---|
| `snowpine`, `dead_tree`, `char_tree`, `palm` | made 1 tall, about 4,600 triangles each, trunk and crown split | every tree of that kind in the lands (`KIND` in `render.js`), each crown tinted one of four shades; the code-built shapes stay for a missing file |
| `inn` | 9.7 x 4.7 x 6.0 | The Last Toll's whole 11-wide plot, instead of two townhouses |
| `forge` | 4.8 x 3.2 x 3.9 | The Proud Anvil. Meshy walled in the open smithy of the picture: it is a stone workshop with a timber front |

**The class bodies**: `boomerang_knight_f` (1.8, Jamie's clips: `Throw`, `Twin`, `Whirl`, `Typhoon`) and
`gunner_m` (1.82, `gunner_f`'s: `Shoot`, `Fan`, `Lob`, `Deploy`). The gunner's crossed bandoliers make an X of
gear on the chest, which was judged not to be a device. `bodyKey` prefers a bm tier body at or under the armour
worn, so `boomerang_knight_f` shows at tiers 1 and 2 only, and `gunner_m` not at all while `gunner_m_t1` is in the
manifest (it was taken out in the eighth batch).

### The eighth batch: the ninja, the eight recruits, the lords' places, two houses and a sarcophagus

Twenty models for about 530 credits (560 were asked for): the ninja's two class bodies, a body for each of the eight
recruits, each land's broken wall and standing stone, a second townhouse and cottage, and the crypt's sarcophagus.
The same route as the sixth batch (pictures in `art/concepts/v2/`); the Blender working file is now
`v2 ornate (ninety-eight) - tactics.blend` in the meshy folder.

**The ninja** (`ninja_m`, `ninja_f`) has a branch of its own in `retarget.py`, built on named hand positions (wind,
cut, through, jab, cock, fling): `Slash` (attack, Venom Edge), `Cuts` (Hundred Cuts, Last Cut: both hands in turn,
then a double jab), `Stars` (Throwing Stars, Caltrops: three flat throws), `Smoke` (Smoke Bomb, Vanish: the ball
raised, a dash, a crouch behind the arm) and `Step` (Shadow Step: low, then a cut out of it). The picture asked for
the knives sheathed at the small of the back, since an A-pose 3D step drops held weapons; in the game the knives come
from the gear. They cross in an X on the back, gear like the gunner's bandoliers. `ninja_m_t1` and `ninja_f_t1`
(bm bodies) are out of the manifest, so these show at tiers 1 and 2.

**The recruits** are named keys (`HEROES[id].model` in `cast.js`, so `bodyKey` takes them before any class body) and
wear their class body's clips: built with `T.build(<their class>)`. Their `height`s put each head where the class
bodies' are, so a hat, a crest or a crow on top makes the figure taller rather than the person smaller:

| Key | Class (clips as) | `height` |
|---|---|---|
| `wren` | ranger (`ranger_f`) | 1.7 |
| `ismene` | wizard (`wizard_f`) | 1.74 |
| `mortimer` | necromancer (`necromancer_m`) | 1.89 |
| `brakka` | barbarian (`barbarian_f`) | 1.96 |
| `kestrel` | dragoon (`dragoon_m`) | 1.94 |
| `maudlin` | carrion witch (`carrion_witch_f`) | 1.51 |
| `jasper` | bard (`bard_m`) | 1.92 |
| `flint` | gunner (`gunner_m`) | 1.86 |

Flint's breastplate first had tooling that read as letters: it was blurred out of the picture before the 3D step,
and the tooling Meshy painted back in its place (scrolls that might pass for runes) was painted out of the texture
in Blender, the dark strokes on his front's leather faces only. Jasper's papers are blank and Mortimer's tape is
gone in the 3D.

**The scenery** takes a third style block, `style.wild` (`prompt.mjs` uses it for the ruins, the stones and the
sarcophagus): weathered stone, no carving, no figures, no crosses.

| Key | Size (wide x deep x tall, tiles) | In the world |
|---|---|---|
| `ruin_waste`, `ruin_badlands`, `ruin_fen`, `ruin_ash` | 1 x 1 x 1.3 to 2, 1,800 triangles | each land's place (`ruin` in `REGIONS`): every block of its broken wall, scaled to fill its tile and as tall as the wall there, turned a quarter at a time |
| `spire_ice`, `spire_hoodoo`, `spire_basalt` | 0.92 across, 1.2 to 2 tall, 1,500 triangles | each land's standing stones (`stone` in `REGIONS`; the Fen has none), as tall as before and narrower the shorter they are |
| `shophouse` | 4.8 x 4.6 x 5.7 | Thicker Than Hope and Fortunato's Wheel; its door is in the middle |
| `cottage_2` | 4.8 x 3.8 x 3.5 | Reed Saddlery and The Curator's Bench: a stone cottage with a lean-to |
| `sarcophagus` | 0.94 x 1.9 x 0.75, chest and lid as two materials | the crypt's four, turned so the old wax on the lid is under the candles; the lidless one by the gate draws the chest, the lid pushed aside, and the dark inside |

`buildRuins` and `buildCrypt` keep the boxes and cones for a missing file.

### Looking at a model in the running game

`python tools/serve.py 8417` serves the game and saves any picture the page posts:
`game.r.render(); fetch('/shot?name=x', {method: 'POST', body: game.r.gl.domElement.toDataURL()})`
writes `tools/build/shots/x.png`, and `python tools/sheet.py <tag>` tiles a set of them into one sheet.

## 13. Mixamo takes: every class's blows, by level, and its cheers

The sources are Mixamo downloads kept outside the repo (`F:\!    BM V2\ANIMATIONS\`): single clips on Y Bot, and two packs
on X Bot, the axe pack (`axe:<clip>`) and the sword and shield pack (`sns:<clip>`). `tools/blender/mixamo.py` carries a
pose from them onto any figure with Mixamo's joint names (Meshy's, and bm's hero rig under its own names), and cuts a
stretch of a clip into a take: eased in from the idle, its blow landing on a set frame, eased back out.
`tools/blender/moves.py` names the moves (a stretch of a clip each) and which class does which, by state:

| state | when the game plays it |
|---|---|
| `<basic>_1`, `_2`, `_3` | the plain blow (`swing`, `thrust`, `shoot`, `bolt`...) from level 1, 5 and 10 (`game/party.js` basicTier) |
| `sk_<skill id>` | that skill (`game/battle.js` plays a skill's own take where the figure has one, else its `anim`) |
| `cheer`, `taunt` | the fight won; after a kill |

Every take says when its blows land (`hits`): the battle waits for the first before the damage shows, and spaces a
combo's numbers by the rest. A weapon in the hand is held in the take's Mixamo fist while it plays (`gfx/gear.js`
holdGear, eased by the take's `GripW` track), so a sword swings with its edge along the cut. Where the fist alone would
hold it wrong, the take turns the hand itself: a staff, a bow or a pistol stands up out of it, a spear is held level
at the foe in a thrust or driven down from a leap, and any weapon in a cheer or a taunt is raised rather than left
lying across the body (moves.py, the `up`, `level` and `down` options). The turn is worked on the weapon, matched to the
game's own blend from the idle grip, so nothing swings round on the way in or out. The lancer's lance and shield are
the figure's own props: its takes hold the lance up, or level in a thrust, and the shield's face out.

A take can be more than one stretch of one clip:
- `first` plays a lead-in before it, at its own pace (a charge, then the throw); the blow comes that much later.
- `then` plays a stretch after it, crossfaded in, its last pose held (a sheathe, then a hero's pose to end a cheer on).
- `skip` cuts a still stretch out of the middle (the long hold at full draw in the bow clip).
- `face` takes off some or all of the hips' turn, so a blow that spins the body away stays facing the foe.
- `tilt` pitches the spine (an arrow lofted, a breath sent down) and sweeps it across the blow (a fan of arrows).
- `aim` picks how a turned hand holds its weapon (`stand`, `raise`, `level`, `down`). A weapon standing up by the face
  leans out, away from the head. A level spear points at the foe whichever way the chest has turned.

Cheers and taunts ease in over 6 frames instead of 3 and hold the weapon up. The draw and sheathe moves leave it in
the fist.

Baking, in the work .blend (headless is fine; nothing is saved):

    exec(open(r"<repo>/tools/blender/retarget.py").read()); exec(open(r"<repo>/tools/blender/mixamo.py").read())
    load_mixamo(r"<folder of fbx>", {"axe": r"<axe pack>", "sns": r"<sword and shield pack>"})   # once per .blend
    exec(open(r"<repo>/tools/blender/moves.py").read())
    make("paladin_m_v2", "paladin_m", "paladin")      # a figure: assets/models/clips/mx/paladin_m.json + .bin
    make_hero("dragoon")                              # bm's hero bodies, any class wearing one: mx/hero_dragoon.*

Then `python tools/mx_manifest.py` sets `"mx": "<key>"` on each figure with a bank. bm's hero bodies (the armour tiers
`<class>_<g>_t3..5` and the recruits) need no entry: any class may wear one, so the game plays `hero_<class>` on whoever
has it on (`withOverride(key, standIn, { cls })`). A take replaces whatever the figure played for that state before;
states without a take keep their own clips.

A bank is the figure's bones' turns against their rest, one frame in 24, as Int16s, then the hips' place (Float32), with
a `.json` naming the clips, their blows, their grip ease, and the fist (where it holds, its axis, its knuckles) in each
hand. A hero bank was made on `heroes/paladin_m1.glb` and says how big that body is (`motionScale`): the pelvis's
travel is scaled to each body's own.
