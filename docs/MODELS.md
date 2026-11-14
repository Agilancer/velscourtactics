# Models for VELSCOUR TACTICS

What to make in Meshy (or Tripo), what to type, which animations each model needs, and how a finished
`.glb` gets into the game. Everything on screen today is a stand-in built from boxes in
`src/gfx/models.js`; each stand-in has a **key**, and a real model replaces it by using the same key.

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

## 2. The sixteen classes (male and female each)

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

## 5. The dead, and what the classes summon

| Key | Subject line |
|---|---|
| `zombie_shambler` | A risen villager, grey-green skin, burial shroud and work clothes, one shoe, slack jaw, arms hanging |
| `zombie_gnawer` | A thin fast ghoul on all fours, long arms, stretched jaw, torn nightshirt, hunched to run |
| `zombie_lurker` | A dead woodsman half-covered in pine needles and moss, built to lie flat, one clawed hand forward |
| `zombie_bonesack` | A bloated corpse, belly swollen and split with yellow sacs, stubby legs, head tipped back |
| `zombie_brute` | A huge corpse too big for one grave, broken chains at wrists and neck, iron collar, stitched shoulders |
| `wolf` | A lean grey wolf, scarred muzzle |
| `skeleton` | A plain skeleton with a rusted cap and a splinter of a blade |
| `ghoul` | A violet-grey ghoul, hunched, long nails |
| `slime` | A knee-high cobalt slime with two dark eyes |
| `squire` | A small knight in plain plate with a short lance |
| `whelp` | A cat-sized red dragon whelp with stubby wings |
| `turret` | A brass clockwork gun on a tripod |
| `totem` | A carved wooden spirit pole of three stacked faces, bear, bird and serpent |

Monsters get the style block too, minus "5-heads-tall" and "neutral expression".

## 6. Townsfolk and scenery (later)

`garrick`, `orrin`, `zafir`, `fortunato`, `tamsin`, `aggie`, the apprentices, `kit`, `jory`, `hob`, `agnes`
(see `src/data/cast.js` for who each is), and the eight recruits, who can use the class models.
Scenery worth having as real models: oak (1, 4 and 9 tile), pine (1, 4, 9), the well, the bounty board,
a chest, a signpost, a market stall, fence and wall pieces, six house shapes.

## 7. The first batch: what to make first

1. The five named: `lisandra`, `homunculus`, `lily`, `jamie`, `stevie`.
2. `zombie_shambler`, `zombie_gnawer`, `zombie_lurker`, `zombie_bonesack`, `zombie_brute`. **Done (section 12).**
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

A model with no entry keeps its stand-in, so they can arrive one at a time.

### The states a model can have

Every model needs the first seven. The rest fall back if missing (in brackets).

`idle`, `walk`, `attack`, `cast`, `hit`, `dead`, `cheer`; then `run` (walk), `jump` (keeps walking),
`wounded` (idle; played under 30% life), `stunned` (idle), `guard` (idle; played while guarded),
`revive` (idle), `talk` (idle; played while that character is speaking), `item` (cast), `taunt` (nothing;
played after putting one of the dead down), `point` (nothing; the leader, when placement opens). A skill can name its own state with `anim` in
`src/data/classes.js` (Lisandra's are `cast_bolt`, `snap`, `lantern`, `wave`; the Lancer's are `thrust`, `guard_up`, `rally`,
`charge`); a model without it plays
`cast` or `attack`.

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

`paladin_m`, `ranger_f` and `wizard_m` were made this way, start to finish, for 29 credits each.

**The prompts live in `tools/meshy/prompts.json`**: the look, the style blocks, the negative prompt and a
subject line for every model in the game. `node tools/meshy/prompt.mjs <key>` prints one ready to paste
(`... <key> image` for the picture step, `... <key> 3` to add tier-3 armour); with no key it lists them all.
Change a prompt there, not here.

1. **Picture** (9 credits): `meshy_text_to_image`, `nano-banana-pro`, `pose_mode: a-pose`, with the
   `image` prompt. Look at it: right class, right palette, and no letters or marks anywhere (the V and T
   rule). The pictures are kept in `art/concepts/<key>.png`.
2. **3D** (15): `meshy_image_to_3d` from that picture, `meshy-t2.5` smart topology at 15,000 triangles,
   texture `meshy-n1`, `pose_mode: a-pose`.
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

| Model | Its own clips |
|---|---|
| `paladin_m` | `Swing` (plain attack), `Smite`, `Bolt` (Holy Bolt), `Bless` (Blessed Light), `Wave` (Consecration), `Shield_Bash` (unused) |
| `ranger_f` | `Shoot` (plain attack, Quick Shot, Multishot), `Volley` (Rain of Arrows), `Call` (Wolf Pack) |
| `wizard_m` | `Bolt` (plain attack, Fire Bolt), `Wave` (Frost Nova), `Meteor`; Chain Lightning uses `Cast` |

None of the three holds a weapon yet (section 4), and none has been through the critics. `paladin_f`,
`ranger_m` and `wizard_f` are still stand-ins. Finished files for Homunculus, Lily Belle and Jamie are in
the CHARACTERS folder beside Lisandra's and Stevie's sources, on the library's own rig, and are not in the
game yet.

### Looking at a model in the running game

`python tools/serve.py 8417` serves the game and saves any picture the page posts:
`game.r.render(); fetch('/shot?name=x', {method: 'POST', body: game.r.gl.domElement.toDataURL()})`
writes `tools/build/shots/x.png`, and `python tools/sheet.py <tag>` tiles a set of them into one sheet.
