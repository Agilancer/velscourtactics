# Round 2: what changed since round 1 (read after critic_brief.md, this overrides it where they differ)

Every figure has been refitted again. Judge each one fresh from its round-2 cards. Where you reviewed it in round 1,
also say in one line whether each of your round-1 blockers or majors is now fixed, better, or unchanged. The round-1
reviews are at `docs/rig/r1/review_vet_*.md` and `docs/rig/r1/review_upc_*.md`, grouped differently from now, so search
for the figure's key.

Recruits from batch 9 (bertram, bram, crispin, ...) were never in round 1. Judge them fresh.

## What the refit now does

- **Floor.** Every clip is set down on the figure's own rest floor. In round 1 the walk and idle hung 9-21 cm in the
  air.
- **Walk and Run.** They are now bm's hand-animated hero walk and jog (the reference sheets
  `tools/build/rig/ref_walk_hero_paladin_m1.png` and `ref_walk_hero_archer_f1.png`), not the bouncy Mixamo ones. The
  dead walk a slumped version of the same stride. Judge the gait as well now.
- **Spine.** It runs on a smooth curve from the hips to the head pivot, spaced as bm's heroes are when it was bunched.
- **Knees.** Each knee is put at the centre of the leg's cross-section at its height (the leg, not a gown around it), at
  least 1.2% of stature forward of the hip-ankle line.
- **Ankles.** Each ankle is in the boot shaft.
- **Feet hidden under a gown.** They mirror the visible one, or go under the hip.
- **Shoulders.** A shoulder joint sitting on a pauldron or collar edge is rebuilt from the elbow, and left and right are
  mirrored, the better side kept.
- **Elbows and wrists.** Those hidden in sleeves are moved down the arm.
- **Collarbones.** They sit over the shoulder joints.
- **Head pivots.** Those you flagged were moved by hand.

Still NOT handled (fail for them if you see them, but say so plainly):
- toe spikes on the bare-footed dead;
- zombie_bonesack's backward-tipped head;
- the right foot riding high in attack clips;
- dragon_knight_m's tail.

Out of scope as before: gowns, robes, coats, capes and tails moving with the legs. They become physics cloth after the
rigs pass.

## The cards

- `tools/build/rig/r2/cards/<key>_v2_rig.png`: the rest rig.
- `tools/build/rig/r2/cards/<key>_v2_motion.png`: the motion strips.
- Batch-9 recruits are at `tools/build/rig/r9/cards/<key>_v2_rig.png` and `<key>_v2_motion.png`.
- Joint positions, if you want numbers: `tools/build/rig/r2/rest/<key>_v2.json` (and `r9/rest/`).

## What to return

Write your review to the file you were given, in exactly the critic_brief form:

```
<key>_v2: PASS | FAIL   score <1-10>
- <joint or region> [<blocker | major | minor>]: <what>, <which way, how far>, <which view or frame>
- round 1: <fixed | better | unchanged> for each of your round-1 blockers or majors (omit for recruits)
```

End with the systemic problems you saw across many figures, ranked by how many figures they hit.
