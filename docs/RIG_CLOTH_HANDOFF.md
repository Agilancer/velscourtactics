# Rigs and cloth: where it stands (handoff, 2026-11-14)

The job: every Meshy figure (67 of them, `<key>_v2`) gets a skeleton that sits inside its body with every joint in the
right place, feet that stand on the floor, and a walk like bm's heroes. After that, long gowns, robes, coat tails and
capes are cut loose into cloth of their own that swings under physics and collides with the legs, so the legs stop
dragging them about. The user asked for at least 3 critic rounds on the rigging alone before any cloth work, 4 rounds in
all, then a list of what still fails and of anything too far gone to save. Too far gone means remake it in Meshy
without flowing cloth.

Critics: the "2 critics" system (memory `two-critics-review.md`). A 30-year veteran rigger and a young up-and-comer
each review the same cards and give every figure PASS or FAIL with a score out of 10. You iterate until both pass it.
The brief they get is [docs/rig/critic_brief.md](rig/critic_brief.md). Round 1's ten reviews are in [docs/rig/r1/](rig/r1/).

## Done

- **Round 1 (critics):** all 67 figures reviewed by both critics. They agreed on 18 passes: barbarian_f, barbarian_m,
  bard_m, boomerang_knight_m, dragoon_f, dragoon_m, flint, homunculus, jamie, kestrel, mortimer, squire, totem_master_f,
  wren, zombie_drowner, zombie_gnawer, zombie_husk, zombie_rimewalker.
  - Only the veteran passed: jasper, slime_lord_f, zombie_shambler.
  - Only the up-and-comer passed: arcane_sorcerer_f, bard_f, death_knight_f, gunner_f, ranger_f, ranger_m, stevie.
  - Worst (scores vet+upc): lisandra 2+2, carrion_witch_m 3+2, zombie_abbess 2+3, ghoul 3+3, lily 3+3, lancer_f 5+2,
    lancer_m 4+2, maudlin 3+4, wizard_f 3+4, zombie_leechmother 3+4, zombie_driftling 2+5, zombie_slinger 4+3,
    zombie_warden 4+3. Lancers and slime lords were remade in Meshy batch 9: see "Batch 9: 32 bodies for rounds 3 and 4" below.
- **The round-1 faults that ran across many figures, and what now handles each:**
  - *Floating:* clips hung 9-21 cm off the floor. retarget.py's `body()` now sets every library pose down on the
    figure's rest floor (`rest_z`, `lift`, applied in `grab()`), and mixamo.py's `_mx_floor` does the same for the
    Mixamo takes. Checked on Maudlin: the lowest foot in her walk is now -0.1 to +1.0 cm, idle and cast -0.6 cm.
  - *Bouncy walk:* Walk and Run are now bm's heroes' walk and jog (`bmclips.py`, `bm_load`, through
    `Target.mx_sample`), and the dead stride on it too. Without mixamo.py it falls back to the library's walk,
    aligned (`Target.align`).
  - *Joint placement:* `polish()` in rigfix.py, run at the end of `refit()`:
    - Spine: on a smooth curve from the hips to the head, re-spaced at bm's fractions when bunched.
    - Knees: at the centre of the leg's cross-section, at least 1.2% forward of the hip-ankle line.
    - Ankles: in the boot shaft.
    - Hidden feet: mirror the other foot, or go under the hip.
    - Shoulders: an implausible one is rebuilt from the elbow; sides are mirrored, the better side wins.
    - Elbows and wrists: moved down the arm chord when hidden in a sleeve or too short.
    - Clavicles: over the shoulder.
    - Per-figure head pivots and arm fixes the critics asked for are in `OVER` in rigfix.py.
  - *Cross-sections:* found exactly: a level plane is cut through the triangles and the pieces are joined by welded
    edges (`section_loops`). Shells stay apart that way (a leg inside a gown, a neck inside a collar), where the old
    parity test put knees outside legs.
- **Cloth, runtime:** [src/gfx/cloth.js](../src/gfx/cloth.js) is wired into `models.js` (`makeCloth(obj, def.cloth)`,
  updated in `u.post` after the mixer).
  - The solver: Verlet chains pulled toward where the body would carry them, chain lengths, a ring constraint across a
    skirt, capsules round the legs, and a floor 3 cm under the ground (`sink`).
  - It is inert until a manifest entry has a `cloth` block; none has one yet.
  - The bisect harness (tools/build/rig/bisect.js) showed the solver is sound. The gown following the legs came from
    the skin weights: the old `leg_free` counted anything within 15 cm of a leg bone as leg.
- **Cloth, building it:** rigfix.py has `leg_tubes` (8 rays from each leg bone decide whether a leg is really there or
  it is a hollow gown), `leg_free2`, `cloth_plan`, `cloth_build`, `cloth_def` and `cloth(key)`. They are written but
  **not yet run on any figure**.

## Round 2 (2026-11-17): done, reviewed

All 67 refit cleanly (`tools/build/rig/refit2/notes.json`, saved; no errors). The 63 originals (the old lancers and
slime lords left out: batch 9 replaced them) and the 28 batch-9 recruits went to both critics in seven groups:

- A-E: the originals, cards in `tools/build/rig/r2/cards`.
- F-G: the recruits, cards in `tools/build/rig/r9/cards`.

The reviews, the round-2 brief and `tally.txt` are in [docs/rig/r2/](rig/r2/).

**Both critics passed 21 of 91:**
- 18 of the originals: barbarian_f, barbarian_m, bard_m, carrion_witch_f, death_knight_f, death_knight_m,
  dragon_knight_f, dragoon_m, gunner_f, gunner_m, ismene, jamie, lily, maudlin, zombie_dryking, zombie_leechmother,
  zombie_rimewalker, zombie_warden;
- 3 recruits: nell, perkin, prudence.

The joints themselves mostly landed. The floats, spines, mirroring and round 1's head pivots are fixed. Most of the
failures are in the motion, and nearly all of them come from a few shared causes.

## Round 3: the fixes, written, not yet run (branch `feat/rig-r3`)

**Motion (tools/blender/retarget.py):**
- **The right foot rides high in every attack (all 91).** `crouch()` bends the knees toward the library's
  spell-cast stance, which has one foot forward. The lance `jab()` takes a lunge. Grounding the lowest foot leaves the
  other in the air, up to 40 cm in Thrust. New `plant()` is a two-bone solve that sets each lifted or sunk foot flat on
  the floor and keeps the stance. It runs in `crouch()`, `jab()` and `blow()`, but not in the dead's stride.
- **Heads drop 15-55° in the Walk and Run, and the ghoul's goes 35° back.** Main's `upright()` (from the batch-9
  critics) came after round 2's shots. It now works both ways, and runs on `blow()` too.
- **Shoulders shrug to the ears in the Walk and Run.** The collarbones are kept near the idle's (`calm`).
- **The Run bounds 20-33 cm.** `fly(p, 0.4)` keeps 40% of the flight. The arms' back-swing is taken down 30%.
- **Heels and toes go through the floor (the dead's walk, push-offs).** `lowest()` and `ground()` now count each
  sole's heel and toe tip (`SOLE`), not only the joints.
- **Toe blades.** The toes bend at most `TOE` = 35° in every written clip.
- **Lisandra floats 6-13 cm.** Her own clips (`retarget(src, name=...)`) now get the same `lift` as `grab()`.

**Joints and weights (tools/blender/rigfix.py):**
- **Knees on robe panels** (necromancer_m 18 cm forward, both arcane sorcerers, carrion_witch_m 5 cm in): every knee
  is kept 1.5-3.5% of stature forward of its hip-ankle line and within 2% to either side.
- **Shoulders too far in or out** (gunnar, bertram, totem_master_m, zombie brute, slagback, warden, leechmother):
  - each is put on the upper arm's own centreline, from two cuts across the arm, at the shoulder's height;
  - default shoulder height is 0.79 (bm's), which lengthens the short upper arms;
  - mirroring now also scores the shoulder's height (the abbess kept the low side).
- **Elbows in a cloak, or moved out of the arm** (brakka, driftling): each elbow is centred in its arm before the
  sides are mirrored, and again after being moved down the arm.
- **The neck in front of the head pivot** (dragon_knight_m, homunculus): the neck is never more than 0.5% forward of
  the head.
- **Toe spikes and boots stretching** (skeleton, slinger, slagback, stoker, lurker, shambler, drowner, cinder,
  bonesack, ghoul, boomerang_knight_m, flint, dragoon_f), **and Soraya's welded boots**:
  - everything in a foot's zone (below the ankle, near the sole) is weighted to that foot alone, nothing else;
  - the toe blend is 3 cm;
  - these weights are left out of the smoothing.
- **Per figure (`OVER`):**
  - slagback: no longer pulled in;
  - head pivots back: gunnar 7 cm, hakon 3.5, carrion_witch_m 7.5;
  - arcane_sorcerer_m: wrists out 9 cm;
  - skeleton: feet 4 cm out to the bones.
- **The slinger's bony ankles** count as a foot that shows (a thinner shaft is accepted).
- **`review()` shoots no Run for the dead.** They never run in the game: their Run is dropped from what they export.

**To run it (needs Blender with the MCP server started):**
1. Open the b9crit copy, `v2 ornate - rigfix b9crit.blend`. It is the working file plus the four class bodies'
   critic fixes.
2. Copy the .blend aside first.
3. Load the tools from this branch's checkout: set `NS['ROOT']` to it, then exec `tools/blender/queue.py`.
4. Queue every figure except lancer_m/f and slime_lord_m/f (they passed their own rounds):
   `NS['q3_start'](keys, 'r3', 'refit3')`.
5. Then `python tools/rigsheet.py r3 --cards`, and run critic round 3 on all seven groups with a round-3 brief.
6. **Rebake the recruits' Mixamo banks (`moves.make`) after the refit, then export.**

**Left for the remake list unless round 3 says otherwise:**
- zombie_bonesack's head, modelled tipped back 30°;
- dragon_knight_m's tail;
- zombie_lurker's moss strands;
- Strum playing a lute that stays slung on the back (bertram, halvard): gear, not rig;
- the rangers' dead bow draw (sigrun, sorrel, ximena): the elbow stays straight at full draw, a fix for `bow()` in
  retarget.py;
- marigold's quiver skinned to the right thigh.

## What is left, in order

1. **Round 3:** run the above, then cards and critics.
2. **Fix what round 3 finds**, with another rig round if it needs one.
3. **Cloth (only after the rigs pass).**
   1. Run `NS['cloth'](key)` for each figure. It writes `tools/build/rig/cloth/<key>.json`, or returns None where the
      legs are fully there. Likely cloth figures: the gowned and robed ones, e.g. maudlin, lisandra, lily, wizard_f/m,
      necromancer_f/m, carrion_witch_f/m, arcane_sorcerer_f/m, zombie_abbess, zombie_leechmother, ismene.
      `cloth_plan` decides itself; check its `drop` and `count`.
   2. Export: `NS['export_figure'](key, path)`. Back up the glb you replace first (some are untracked).
   3. Add the json's `cloth` block to the figure's entry in assets/models/manifest.json.
   4. Film it: tools/build/rig/film.js and bisshots.js, served with `python tools/serve.py 8417`. Then
      `python tools/clothsheet.py <tag>`, and check from the front, side and three-quarter. The hem must clear the legs
      in Walk, Run and the class's blow, and must not explode on a tile jump.
   5. **Capes have no back or torso capsule yet**: add one in `cloth_def` (Spine to Spine2) before trying a cape.
4. **Round 4 (final): the critics review rig and cloth together.** Then give the user:
   - What still fails, figure by figure, from both critics.
   - A remake list: figures too far gone, to make again in Meshy with no flowing cloth or capes. Meshy costs credits:
     state the cost and get a yes first (CLAUDE.md).
5. **Ship it:** docs/MODELS.md (the manifest's `cloth` field, the cloth's bone naming `Cloth_<piece>_<col>_<link>`),
   `node tools/check.mjs`, try the game, then commit from a worktree (memory `shared-folder-commits.md`).

## Batch 9: 32 bodies for rounds 3 and 4

Batch 9 (`docs/HANDOFF_BATCH9.md`, `docs/MODELS.md` "The ninth batch") added 32 bodies:
- `lancer_m`, `lancer_f`, `slime_lord_m` and `slime_lord_f`, which replace the round-1 lancers and slime lords;
- the 28 recruits who wore bm bodies.

Each went through `refit()` once, under round 2's rules, and was exported to the game. None of them has been before the
critics yet.
- **They join round 3 and round 4** with the other figures. Their cards are made with
  `python tools/rigsheet.py r9 --cards`, their shots are in `tools/build/rig/r9`, and their notes are in
  `tools/build/rig/refit9/notes.json`.
- **Blender file:** the 32 are in the working file below, `v2 ornate - rigfix.blend` (saved 2026-11-15 01:59), as
  `<key>_v2` with their clips and Mixamo takes. The version before them is its `.blend1`. Requeue from it with
  `NS['q3_start'](keys, 'r3', 'refit3')` as for the rest.
- **Before the refit's backup,** webbing from hand to hip was cut off `lancer_m` and `osric`, and hanging gear on twelve
  bodies lost its arm weights. A refit restores from that backup, so the fixes hold.
- **No cloth:** they were made under `style.fitted`, with nothing below the knee but boots and plate, so none should
  need cloth.
- **What to look at first:** polish moved the shoulders of `lancer_m` (16 cm), `gunnar` (14 cm) and `slime_lord_m`
  (13 cm) the most.
- **Mixamo banks:** each body's bank was baked against its refit rest. Rebake a figure's bank (`moves.make`) after any
  refit that moves its joints.
- **The four class bodies have had their own critics' rounds** (PR #27, `docs/MODELS.md` "The critics' rounds"):
  - `lancer_m`, `lancer_f`, `slime_lord_m` and `slime_lord_f` were recoloured (`tools/blender/retint.py`);
  - the slime lords' fingers were bent into fists in the rest mesh (`tools/blender/handcurl.py`). The manifest's
    `hold.at` for the mace is the middle of those fists.

  These changes are saved only in the copy `v2 ornate - rigfix b9crit.blend`, next to the working file, which
  predates them. A refit and export of the four from the working file would undo them. Either take the four from
  the copy, or before the export run `retint_image(img, key)` on each body's base-colour image and
  `curl(key, 'Right')` and `curl(key, 'Left')` on each slime lord. Then rebake their banks.

## How to drive Blender

- The working file is `F:\!   VELSCOUR TACTICS\CHARACTERS\meshy\v2 ornate - rigfix.blend`: scene `Scene`, 24 fps,
  every figure as `<key>_v2` plus `<key>_v2_mesh`, and the motion library's `Armature`.
  - The window has been found switched to another scene (`EDG_Dragons`, someone else's). Set `window.scene` back to
    `Scene` if restore fails with "not in View Layer".
- An MCP call times out at about 60 s. Anything long runs on `bpy.app.timers`.
- The tools share one namespace: `D = bpy.app.driver_namespace; NS = D['NS']`. Define `D` in every MCP call.
- Load everything with `exec(open(ROOT + 'tools/blender/queue.py').read(), NS)`. That runs retarget.py, rigfix.py,
  mixamo.py and bmclips.py into NS.
  - mixamo.py is not committed; it belongs to the Mixamo-takes work in the shared folder. Without it, Walk and Run fall
    back to the library's.
- Blender's Python has no PIL: dump JSON in Blender and draw with the system Python (rigsheet.py, clothsheet.py).
- The pieces:
  - `NS['refit'](key, NS['OVER'].get(key))` fits the rig again, from Meshy's own, and rebuilds the clips.
  - `NS['review']([key], batch)` takes the shots.
  - `tools/blender/contact.py`: `NS['contact'](key)` gives, per clip, how high the lowest foot rides over its rest
    height (cm) and how far the toes bend. Every standing clip should sit at about 0.
  - `NS['backup'](key)` / `NS['restore'](key)` keep and bring back Meshy's original joints and weights.
- bm's hero proportions are in `BM` in rigfix.py, as fractions of stature (Hs = Head.z / 0.875). Pelvis 0.511,
  neck 0.830, upper arm 0.153, forearm 0.152, thigh 0.520, calf 0.297, with the spine dead straight. The rest are in
  the critic brief.

## Who else is in the folder

The "Velscour tactics game setup" session is waiting for Blender to make Meshy batch 9 (lancers, slime lords and
more; docs/HANDOFF_BATCH9.md in the shared folder). Tell it when SAVED.txt has appeared and Blender is free. Its new figures will need
this same refit once they are in the file.
