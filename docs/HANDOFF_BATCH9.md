# Batch 9 handoff: 32 new bodies and 2 props, generated, not yet in the game

Written 2026-11-14 by the session that generated them. It ran out of weekly compute, so another account finishes the job.
On main: the prompts (`tools/meshy/prompts.json`, `tools/meshy/sent.json` for the picture fixes), the task ids
(`assets/models/batch9/ref/tasks9.json`), this handoff and the style guide. Not committed: the pictures, the walks and the
props, and the game is unchanged: no manifest entry, no `model:` field and no render.js line points at any of these files.

## What was asked

The user's words: "Do all 30, plus a new, much better looking lancer and slime lord with NO CAPES or long flowy cloth. We
want GOOD animations here. Make sure that the new Lancer looks SICK like the other lancers from the 43."

- **28 heroes** that still wear bm bodies get their own body (`model: '<id>'` in `src/data/cast.js`):
  - The Hollow: marigold, nell, bram, crispin.
  - The pines: sorrel, bertram, fiammetta, hild, oswin, ingram, osric, perkin.
  - The Frozen Border Fort: sigrun, halvard, hakon, thordis, leif, ragna, gunnar, prudence.
  - The Dry Court: ximena, soraya, paloma, esteban, isabeau, rodrigo, silas, lorenzo.
- **New class bodies** lancer_m, lancer_f, slime_lord_m and slime_lord_f replace the current ones. They have no capes and no
  long cloth: midnight-blue and gold plate with a fin-crested helm for the lancer, and gold armour strapped over cobalt
  slime for the slime lord.
- **Two props:**
  - `chest`: replaces bm's chest. Its lid must come off as a separate part, because it swings up on its hinge.
  - `crypt_gate`: one gatepost of the crypt gate. The current gateposts in render.js `buildCrypt` are 0.9 × 2.5 × 0.9 m
    boxes with a 1.06 × 0.16 × 1.06 cap and a candle at 2.66 m.

## Done

- **Prompts:**
  - `tools/meshy/prompts.json` has a new `style.fitted` block, so nothing reaches below the knee except boots and plate.
  - It has a `fitted` list (the lancer, the slime lord and the 28 heroes) and 28 new `named` lines.
  - It has new `lancer` and `slime_lord` class lines, and `chest` and `crypt_gate` scenery lines.
  - `tools/meshy/prompt.mjs` picks the fitted style for every key in that list.
- **Pictures:** every picture is in `art/concepts/v2/<key>.png`. The old lancer and slime-lord pictures are in git history.
  - These were edited or remade so that no cross shows (the V and T rule): lancer_f's faceplate, osric's X-shaped scar,
    ingram's compass (now a plain locket) and soraya's ribboned parcel (removed).
  - lancer_m lost a stray shield plate, isabeau lost a painted frame, and thordis was remade with a human face.
  - The exact wording of each fix, with its task ids, is in `tools/meshy/sent.json` (`node tools/meshy/prompt.mjs <key> sent`).
- **Meshy (all succeeded):**
  - 3D: meshy-t2.5 smart topology with the meshy-n1 texture, 30,000 polys and A-pose for the bodies; 8,000 polys for the
    chest and 6,000 for the gatepost.
  - Rig: auto-rig at each class body's height.
  - Every task id, for the picture, the 3D model and the rig of each key, is in `assets/models/batch9/ref/tasks9.json`,
    under `img`, `fix`, `d3` and `rig`.
- **Downloaded:**
  - In `assets/models/batch9/`, as `<key>_v2_walk.glb`: every body whose file is there now. List the folder to see which;
    any key in `tasks9.json` → `rig` with no file there is still to fetch.
    - Each file is Meshy's rigged mesh with its walk clip.
    - Each is also copied to `F:\!   VELSCOUR TACTICS\CHARACTERS\meshy\<key>_v2_walk.glb`, where the Blender pipeline reads
      it.
  - Also in `assets/models/batch9/`: `chest_raw.glb` and `crypt_gate_raw.glb`, the props' untouched meshes.
  - The previous lancer and slime-lord walks, which the current game bodies were built from, are backed up in
    `F:\...\meshy\old9\`.

## To do

### 1. Download the rest of the walks

The keys still missing are the ones in `tasks9.json` → `rig` that have no `assets/models/batch9/<key>_v2_walk.glb` yet.

1. For each one, call `meshy_download_model` with `task_id` = the rig id and `task_type: "rigging"`. It returns
   `basic_animations.walking_glb_url`.
2. Download that URL to `assets/models/batch9/<key>_v2_walk.glb`, and copy the file to
   `F:\!   VELSCOUR TACTICS\CHARACTERS\meshy\<key>_v2_walk.glb`.
3. The signed URLs expire on 2026-11-18. After that, ask for the task again and it returns fresh URLs; the tasks
   themselves stay on the Meshy account.

The tasks belong to the Meshy account in this machine's MCP config. A different Meshy account cannot read them.

### 2. Look at the bodies before building them

No 3D model was viewed before rigging. Render a turnaround of each walk, then check:
- that the mesh is clean;
- that nothing reaches below the knee;
- that no cross, letter or emblem shows (the V and T rule: crosses, emblems and holy figures count).

To remake one: picture, then 3D, then rig, with the same parameters as above. Meshy costs credits, so state the cost and
get a yes from the user first.

### 3. Build each body in Blender

Use the route the "Meshy model rigging and cloth physics" session set up. It runs in Blender's driver namespace:

```python
D = bpy.app.driver_namespace; NS = D['NS']
# exec tools/blender/retarget.py, rigfix.py, mixamo.py and bmclips.py into NS (keep NS['OVER'])
NS['bm_load'](ROOT)                                        # once
T, P, notes, moved = NS['refit'](key, NS['OVER'].get(key))  # per key
NS['cloth'](key)               # only for long skirts, robes or coat tails: batch 9 should need none
NS['export_figure'](key, REPO + r'\assets\models\' + key + '.glb')
```

- `assets/models/batch9/ref/build8.py` is the older batch-8 loop: `Target(...)`, `.build(cls)` and `.export`, with a turn
  and tile render to check. It shows which clip names each class owns.
- **Blender is busy:** wait until `tools/build/rig/refit2/SAVED.txt` exists. Until then the rigging session's round-2 refit
  runs on a timer over all 67 figures, and Blender MCP calls time out.
- **Same refit for the new bodies:** once in the file, they need the refit every other figure got, through
  `tools/blender/queue.py`. That rig and cloth work was merged as Agilancer/velscourtactics#22; read
  `docs/RIG_CLOTH_HANDOFF.md` before building.
- The lancer's props stay as they are: `w_lance` in the right fist, `w_shield_tower` on the left, and moves.py `_lancer`
  with `T.hold`.
- **Blender rules:**
  - Never save over `F:\!   VELSCOUR TACTICS\CHARACTERS\LISANDRA OLD - tactics.blend`.
  - Save only with `bpy.ops.wm.save_as_mainfile(filepath=..., copy=True)`, to a new file in `F:\...\CHARACTERS\meshy\`.
  - Only one Blender may run at a time: about 1 GB of RAM is free while the animation session bakes.
- **Mixamo banks:** these belong to the "BM V2 animation assets" session, or `tools/mx_manifest.py`. Each new key needs its
  `<key>_v2_walk.glb` in the meshy folder, a manifest entry and `cls` in cast.js.
  - A bank is baked against a body's bone rest. That session baked the lancer and slime lord banks on the old bodies, so
    once the new GLBs are exported with manifest entries, rebake their banks with `tools/blender/moves.py`.
  - For a class body, run `make(<key>_v2, <key>, <cls>)`, then `python tools/mx_manifest.py`. `docs/MODELS.md` section 13
    has the details.

Each key's class (for the clips) and its height in metres (for the manifest):

| key | class | height | key | class | height |
|---|---|---|---|---|---|
| lancer_m | lancer | 1.95 | sigrun | ranger | 1.84 |
| lancer_f | lancer | 1.90 | halvard | bard | 1.81 |
| slime_lord_m | slime_lord | 1.91 | hakon | boomerang_knight | 1.85 |
| slime_lord_f | slime_lord | 1.86 | thordis | dragoon | 1.80 |
| marigold | ranger | 1.84 | leif | dragoon | 1.84 |
| nell | bard | 1.75 | ragna | lancer | 1.90 |
| bram | lancer | 1.95 | gunnar | lancer | 1.95 |
| crispin | gunner | 1.82 | prudence | paladin | 1.84 |
| sorrel | ranger | 1.84 | ximena | ranger | 1.84 |
| bertram | bard | 1.81 | soraya | bard | 1.75 |
| fiammetta | boomerang_knight | 1.80 | paloma | boomerang_knight | 1.80 |
| hild | dragoon | 1.80 | esteban | boomerang_knight | 1.85 |
| oswin | dragoon | 1.84 | isabeau | dragoon | 1.80 |
| ingram | lancer | 1.95 | rodrigo | lancer | 1.95 |
| osric | paladin | 1.91 | silas | gunner | 1.82 |
| perkin | ninja | 1.82 | lorenzo | ninja | 1.82 |

The heights are the class bodies' heights. Tune each one so the head sits where the class bodies' heads do: a crest, horns
or plumes make the figure taller than its head.

### 4. Wire them into the game

- **`assets/models/manifest.json`:**
  - Add one entry per hero, copied from the class entry with `file` and `height` changed.
    `assets/models/batch9/ref/manifest8.py` does exactly this.
  - Re-export lancer_m, lancer_f, slime_lord_m and slime_lord_f over their current files, and check whether any `_t1` tier
    entries in front of them should go.
  - The manifest uses CRLF line endings: round-trip it the way manifest8.py does.
- **`src/data/cast.js`:** set `model: '<id>'` on each of the 28 heroes. Today they point at `hero_*` bm bodies.
- **Props:**
  - Chest: split the lid from the box at the height where the lid meets it, as two materials. `ref/props8.py`'s `lid(key, at)`
    did this for the sarcophagus. Then point render.js `buildChests` at it, with the lid pivoting on its back edge.
  - Gatepost: scale `crypt_gate` to replace the gatepost boxes in `buildCrypt`, keeping the candle on its cap.
- **Checks:** run `node tools/check.mjs`. Then serve with `python tools/serve.py 8417` and look in the game.
  - In the Claude browser pane, rAF fires only while the pane is shown.
  - Back up the save before testing and restore it after. Each port has its own save.
- **`docs/MODELS.md`:** add a ninth-batch section, following the eighth.

### 5. Commit

Other sessions edit the same files in this folder at the same time: render.js, map.js, MODELS.md, retarget.py and README.md.

1. Snapshot each file before your first edit.
2. Commit only your own hunks, from a worktree made from origin/main. Don't switch branches or stash in the shared folder.
3. Ask the user before committing, opening a PR or merging.

The walk GLBs are about 6 MB each. The raw walks in `assets/models/batch9/` are build inputs, so leave them out of git unless
the user says otherwise.

## The style guide for other accounts

The user asked for a zip that lets another Claude account make models in exactly this style. It is
`docs/meshy-style-guide.zip`, and its README covers the route, the parameters and the rules.
