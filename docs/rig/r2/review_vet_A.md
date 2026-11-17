# Rig review r2, group A: veteran

I judged these from the round-2 cards (`r2/cards/*_v2_rig.png`, `*_v2_motion.png`) and checked them against the joint JSON
in `r2/rest` and `r2/motion`. The cards and the data agree. I re-rendered the rest and motion frames at 1.5-3x with the
skeleton drawn over them wherever the cards were too small to read.

Conventions:
- **Heights** are fractions of the whole model unless marked "of stature" (floor to HeadTop_End).
- **Forward and back** are in the side view, where the figure faces left. **Lateral** is in the front view, measured from
  the Hips joint.
- **Frame numbers** are 1-6, as the strips show them. Frame 6 repeats frame 1.
- **Floats and sinks** are each foot joint's height in a frame minus its rest height, taken from the side-view JSON. The
  three-quarter attack strips cut the planted foot off at the card's bottom edge on the bigger figures, so I read foot
  contact in the attack clips from the data, not the strip.
- **Walk head (retarget, not this rig).** The head drop in the walk is a retarget fault that hits every hero the same way,
  so one fix in the retarget clears it. I list it per figure as [minor] so that it does not decide the rig verdict. For the
  Walk clip itself it is a **major**, and I would not ship the Walk until it is fixed (see the systemic list).

```
arcane_sorcerer_f_v2: FAIL   score 5
- L knee [major]: not the mirror of the R. In the front view it sits 9.8 cm out from the line from hip to ankle,
  20.4 cm from the midline against 10.6 cm for the R knee, out in the cape lining. In the side view it sits 5.2 cm
  (3% of stature) BEHIND that line, so the L leg is bowed out and hyperextended while the R leg is straight with its knee
  3.5 cm forward. Move the L knee ~10 cm in and ~8.7 cm forward onto the mirror of the R (10.6 cm out, 2.5 cm in front
  of the Hips' depth). Rest front and side views, hips-and-knees close-up.
- R foot in Bolt [major, known and not handled]: the R ankle rides 4.2 cm and the R ball 3.7 cm above their rest heights
  in all six frames, while the L foot is planted (-0.1 cm). The gown hides it now; it will show as soon as the gown is
  cut loose.
- the rest is good. The spine is smooth (within 1.5 cm of the line from hips to head). The head pivot is behind the jaw.
  The shoulders are mirrored at 14.9 cm. The elbows are in the sleeves, the wrists where the glove starts, and the feet
  are mirrored (ankle 12.4 cm, ball 4.0 cm). The Walk is planted (0-0.3 cm). The Run's contact frame sinks 1.3 cm.
- Walk head [minor, retarget]: the head pitches 31-35 deg further down than at rest, chin into the collar, in every
  Walk side frame.
- round 1: feet (major) fixed. Shoulders (minor) fixed.

arcane_sorcerer_m_v2: FAIL   score 4
- wrists and forearms [major]: both wrists still sit mid-bracer.
  - The R wrist is ~10 cm short of the glove cuff. In the Bolt three-quarter frames 2-4, the bracer and hand reach well
    past the wrist dot, so the hand bends halfway up the bracer.
  - The L wrist isn't even the mirror of the R. It sits 4.2 cm nearer the midline, 2.2 cm lower, and 8.3 cm further
    back: in the side view it is 2.6 cm BEHIND the Hips, in the cape, while the L glove is ~15 cm in front of the body.
  - The forearms come out at L 11.4 cm and R 14.1 cm.
  - The fix: move the R wrist ~10 cm down the arm to the glove cuff and mirror it to the L. Shoulder to wrist is then
    ~35 cm, so put the elbow at its middle, ~3 cm further down the arm than now (the upper arm is 14.1 cm, 0.08 of
    stature, far too short). Shoulders-and-arms close-up, front and side, and the Bolt strip.
- L knee [major]: the L knee is 13.9 cm (8% of stature) in front of the line from hip to ankle in the side view, out in
  the robe's front panel, and 3.4 cm out in the front view. The R knee is 3.5 cm forward. Move the L knee ~10.4 cm back
  and ~3 cm in, onto the mirror of the R. Rest side view and hips-and-knees close-up (side).
- R foot in Bolt [major, known and not handled]: the R ankle sits 6.0 cm and the R ball 5.4 cm above rest in all six
  frames, under the robe. The L foot is planted.
- good now:
  - The spine runs straight up the middle, and the head pivot is behind the jaw in the collar.
  - The shoulders are mirrored at 15.8 cm, and the feet are mirrored.
  - The Walk is planted (-0.1 to 0.5 cm). The Run's contact frame sinks 2.1 cm.
- Walk head [minor, retarget]: the head pitches 20-24 deg further down than at rest.
- round 1:
  - feet (major): fixed.
  - wrists and forearms (major): unchanged on the R and worse on the L.
  - upper spine and neck (major): fixed.
  - shoulders (major): fixed.

barbarian_f_v2: PASS   score 8
- R foot in Swing [minor, known and not handled]: the whole R foot is 2.2-2.6 cm off the floor in frames 2-4, and the
  L ball sinks 0.3-0.8 cm. These are joint data, because the Swing strip cuts the L foot off at the bottom edge.
- ankles [minor]: L 18.7 cm and R 15.8 cm from the midline (2.9 cm apart). They follow the boots as modelled, so leave
  them.
- good now:
  - The shoulders are mirrored at 17 cm, under the pauldron and the fur. The spine is straight, and the head pivot is
    behind the jaw.
  - The elbows sit at the bracer tops and the wrists at the gloves. The knees are +1.6% forward. The ankles are over
    the heel, and the balls at the sole bend.
  - The Walk is planted, and the Run's contact frame lands at +0.1 cm.
- Walk head [minor, retarget]: the head pitches 21-24 deg further down than at rest.
- round 1: no majors. Shoulder asymmetry (minor) fixed, spine kink (minor) fixed, knees (minor) better.

barbarian_m_v2: PASS   score 9
- knees [minor]: still nearly straight. The L knee is 1.7 cm (0.9%) and the R 1.2 cm (0.6%) in front of the line from
  hip to ankle, under the 1.2% the refit was supposed to guarantee. Nudge both ~1.5 cm forward. Hips-and-knees close-up
  (side).
- R foot in Swing [minor, known and not handled]: the whole R foot is 2.2-2.5 cm up in frames 2-4. The L ball sinks up to
  0.9 cm.
- good now: the shoulders are mirrored at 19 cm under the pauldron. The spine is straight, and the head pivot is behind
  the beard. The elbows are at the bracer tops, the feet are good, and the Walk is planted.
- Walk head [minor, retarget]: the head pitches 15-18 deg further down than at rest.
- round 1: no majors. Knees (minor) better. R upper arm (minor) fixed. The Run contact sink (minor) is fixed: it now
  lands at +0.6 cm.

bard_f_v2: PASS   score 8
- planted foot in Strum [minor]: the L heel is 0.5-1.2 cm into the floor in every frame, and the R toe 1.2-1.9 cm up.
- Walk head [minor, retarget]: the head pitches 28-31 deg further down than at rest. This is the worst-looking case of
  the systemic fault: her chin is on her chest in every Walk side frame, where bm's archer walks with a level head.
- good now:
  - The neck is on the spine line (0.8 cm off), and the head pivot is behind the jaw. The shoulders are mirrored at
    17.6 cm.
  - The elbows are at the end of the puffed sleeve, and the wrists at the glove. The knees are +1.0% forward.
  - The heeled boots are right: ankle over the heel at 14.3 cm, ball 4.0 cm.
- round 1: neck (major) fixed. L elbow and shoulder asymmetry (minor) fixed. Knees behind the line (minor) fixed.

bard_m_v2: PASS   score 8
- elbows [minor]: unchanged from round 1. The upper arm is 18.1 cm against a 22.0 cm forearm. The elbow sits at the
  bottom edge of the puffed sleeve, ~2 cm above where the arm would crease. Move it ~2 cm down if the crease is lower.
  Shoulders-and-arms close-up (front).
- R foot in Strum [minor]: 1.5-2.2 cm up in frames 2-4. The L foot is planted.
- good now: the neck is on the spine line. The knees are +1.2/1.3% forward. The feet and shoulders are good.
- Walk head [minor, retarget]: the head pitches 16-19 deg further down than at rest.
- round 1: no majors. Neck (minor) fixed. Elbows (minor) unchanged. The head pivot (minor) is unchanged and acceptable.

boomerang_knight_f_v2: PASS   score 8
- planted foot in Throw [minor]: the L heel sinks 1.2-1.8 cm into the floor in all six frames (in round 1 it was planted),
  and the R toe is 1.4-2.1 cm up. A per-frame floor offset fixes it.
- forearms [minor]: 16.9 cm (0.10 of stature). The wrist is at the gauntlet cuff and the elbow at the red elbow band, so
  this is the mesh's proportion. Fine.
- good now:
  - The shoulders are mirrored at 14 cm, under the pauldron and the cape.
  - The spine is straight (Spine2 0.5 cm off the line).
  - The knees are +1.2/1.3% forward, and the heeled boots are right.
  - The R arm goes overhead cleanly in Throw frames 4-5.
- Walk head [minor, retarget]: the head pitches 24-28 deg further down than at rest.
- round 1: shoulders (major) fixed. Upper spine (major) fixed.

boomerang_knight_m_v2: PASS   score 9
- elbows [minor]: better. They now sit at the break between the couter and the vambrace. The upper arm is 18.3 cm and
  the forearm 19.2 cm. Fine.
- R foot in Throw [minor]: in frames 2-5 the heel is 0.9-1.3 cm up and the toe 1.9-2.1 cm. The L foot is planted
  (-0.2 to -0.7 cm).
- good now: the shoulders are mirrored at 19 cm. The knees are +1.4% forward, the spine is straight, and the head pivot is
  behind the helmet's cheek guard.
- Walk head [minor, retarget]: the head pitches 19-23 deg further down than at rest.
- round 1: no majors. Elbows (minor) better, shoulders (minor) fixed, Throw float (minor) fixed.

brakka_v2: FAIL   score 6
- elbows [major]: both elbow joints sit 11.3 cm behind the line from shoulder to wrist in the side view. They are out in
  the fur cloak behind the bicep, while the arm itself hangs at about the Hips' depth. This was my round-1 complaint
  about the L elbow; the mirror kept the wrong side, so now both arms have it. Bending the elbow will swing the bracer
  around a pivot outside the arm. Move both elbows ~9-10 cm forward, to ~1-2 cm behind the Hips' depth over the top of
  the bracer. The upper arm then comes out ~21 cm. Rest side view and shoulders-and-arms close-up (side).
- R foot in Swing [minor]: 1.2-2.8 cm up in frames 2-4. The L foot is planted and sinks no more than 1.0 cm.
- good now:
  - The shoulders are mirrored at 24.3 cm under the pauldron and the fur, and their depth is fixed.
  - The legs, feet and spine are good, and the head pivot is behind the jaw.
  - The Walk is planted (-0.1 to 0.7 cm).
- Walk head [minor, retarget]: the head pitches 26-29 deg further down than at rest.
- round 1: L arm (major): the shoulder is fixed, and the elbow is worse (both sides now). Planted stance (major) fixed.

carrion_witch_f_v2: PASS   score 8
- R knee [minor]: 1.8 cm in from the line from hip to ankle in the front view, while the L knee is on it. Mirror.
- ankles [minor]: L 8.9 cm and R 6.0 cm from the midline. Each sits ~2 cm inside the centre of its boot (both boots show
  under the robe hem). Move each ~2 cm out.
- good now: the shoulders are mirrored at 13.2 cm at the top of the arm under the feather collar. The spine is straight.
  The knees are +1.1/1.3% forward. The Bolt is planted (-0.5 cm).
- Walk head [minor, retarget]: the head pitches 22-25 deg further down than at rest, and the hat brim dips in every frame.
- round 1: R shoulder (major) fixed.

carrion_witch_m_v2: FAIL   score 5
- head pivot [major]: the Head joint sits on the front of the jaw at the chin, ~8 cm in front of the base of the skull,
  which is below and just behind the ear. The Neck joint is on the front of the throat, ~3 cm forward of the neck's
  middle. Every nod or turn will swing the skull and the wide hat around the chin. Move the Head ~8 cm back, to under
  the ear at its current height, and the Neck ~3 cm back. Head close-up (side).
- R knee [major]: 5.1 cm in from the line from hip to ankle in the front view (R knee 5.0 cm from the midline, L knee
  9.5 cm). The R leg is knock-kneed while the L is straight. Mirror the L knee. Rest front view and hips-and-knees
  close-up (front).
- R ankle [minor]: ~3 cm out from the centre of the R boot. The boots show between the robe panels.
- good now:
  - The shoulders are mirrored at 14.4 cm at the top of the arm.
  - The spine is a smooth curve up into a forward neck, which suits the hunch.
  - The feet are mirrored at 9.8 cm, 5.5 cm behind the hips, and the Bolt is planted.
- Walk head: this is the only figure in my group whose head stays upright in the walk, because its rest neck already
  leans 20 deg.
- round 1: R foot (blocker) fixed. Shoulders (major) fixed. Upper spine (major) fixed.

death_knight_f_v2: PASS   score 8
- head bone [minor]: unchanged. HeadTop_End is still 7.6 cm off to the L and 4.9 cm forward (~25 deg off), outside the
  helm. Straighten it above the head joint. Rest front view.
- R foot in Swing [minor, known and not handled]: the whole R foot is 2.6-2.9 cm up in frames 2-4. The L foot is planted.
- good now:
  - The Neck is now 8.4 cm under the Head, at the top of the gorget (0.86 of stature), and the head pivot is in the
    lower helm.
  - The shoulders are mirrored at 19.8 cm, and the knees are +1.1/1.2% forward.
  - The feet are right, and the Walk is planted.
- Walk head [minor, retarget]: the head pitches 20-24 deg further down than at rest.
- round 1: neck (major) fixed.

death_knight_m_v2: PASS   score 8
- knees [minor]: the L knee is 1.1 cm (0.6%) and the R 1.8 cm (1.0%) forward. They are no longer behind the line, but
  still nearly straight. Nudge the L ~1 cm forward. Hips-and-knees close-up (side).
- R foot in Swing [minor, known and not handled]: the R heel is 4.2 cm and the R ball 2.5 cm up in frames 2-4, so the
  toe tip comes to ~1.5 cm off the floor. The L foot is planted.
- good now:
  - The Hips root is 2.2 cm behind the hip joints (it was 5 cm), and the spine runs straight up the middle of the plate.
  - The shoulders are under the pauldrons, and the elbows are at the couters.
  - The feet are good, and the Walk is planted.
- Walk head [minor, retarget]: the head pitches 19-22 deg further down than at rest.
- round 1: pelvis and spine (major) fixed (2.2 cm now, acceptable).
```

## Across many figures (systemic), by how many figures they hit

1. **The Walk drops the head (12 of 13, all but carrion_witch_m).**
   - Every hero walks with the neck pitched 11-15 deg forward from Spine2 to Head, whatever its rest neck angle, and the
     head bone a further 15-35 deg down from rest. The worst are arcane_f (+31-35 deg), bard_f (+28-31 deg) and brakka
     (+26-29 deg). In the Run it gets worse: the neck reaches 29-36 deg and the head up to 47 deg.
   - The only figure that walks with an upright head is carrion_witch_m, whose rest neck already leans 20 deg. So the
     retarget is imposing the source's neck angle instead of applying the motion relative to each figure's own rest
     pose.
   - bm's archer and paladin walk with a level head. Ours walk looking at their boots, which from the game's 35-45 deg
     camera reads as a moping hero. The dead are supposed to slump, not the living.
   - Major for the Walk clip. One fix: retarget the neck and head as offsets from each figure's rest pose, or keep the
     face level.
2. **The Run is a sprint, not a jog (13 of 13).**
   - The thighs swing up to 78-82 deg from vertical, and the trailing ankle kicks 32-46 cm up, to about knee height.
   - Both feet are off the floor in 4 of the 5 distinct frames, by up to 26 cm, and the hips bob 23 cm.
   - The contact frame drops into a crouch (hips -21 to -23 cm, knees 30-42 cm forward) and sinks the ball up to 2.1 cm
     (arcane_m) or 1.3 cm (arcane_f).
   - If this is bm's jog as authored, it is a dash, not a move between tiles. The Run frames 1 and 6 on the cards also
     cut off the extended feet at the frame edges.
3. **Feet in the attack clips (known and not handled, 7 of 13 over 1.9 cm).**
   - The R foot rides high in every frame: arcane_m 5.4-6.0 cm, arcane_f 3.7-4.2 cm (both under the robe), death_knight_m
     heel 4.3 cm, death_knight_f 2.6 cm, the barbarians 2.5 cm, and bard_m 2.2 cm.
   - The planted L foot sinks 0.5-1.8 cm on 11 of 13, the worst being boomerang_knight_f at 1.8 cm and bard_f at 1.2 cm.
   - A per-frame floor offset plus ankle IK for the rear foot would clear both.
4. **Hidden legs are not mirrored after the knee pass (4 figures).**
   - The fitter's "centre of the leg's cross-section" has latched onto robe and cape panels: arcane_sorcerer_f's L knee
     sits 10 cm out and 5 cm back, arcane_sorcerer_m's L knee 13.9 cm forward, carrion_witch_m's R knee 5 cm in, and
     carrion_witch_f's R knee 1.8 cm in.
   - This is exactly the "never leave the two sides different in a symmetric stance" rule from round 1, which the feet
     and shoulders now obey and the knees do not.
   - When a leg can't be seen, fit the knee on the line from hip to ankle (or the cleaner leg), then mirror.
5. **The Walk has no foot on the floor at its 60% frame (10 of 13, minor).**
   - In frame 4 both feet are 0.7-1.5 cm up: the trailing ball has lifted and the leading heel hasn't landed.
   - A walk has no flight phase, so lock the plant foot in the foot-plant pass.
6. **"Mirror, the better side kept" kept the worse side where the arm is hidden (2 figures).**
   - brakka's bad L elbow (in the fur cloak) is now on both arms, 11 cm behind the arm.
   - arcane_sorcerer_m's wrists are still mid-bracer, and the L one isn't mirrored at all.
   - Judge "better" by whether the joint is inside the visible limb, not by which side moved less.
7. **Knees short of the promised 1.2% (3 figures, minor).** barbarian_m R 0.6% and L 0.9%, death_knight_m L 0.6%,
   carrion_witch_m R 0.65%. They still bend the right way in every frame.
8. **Cards:** on the bigger figures (the barbarians, brakka, death_knight_m) the three-quarter attack strips cut the planted
   foot off at the bottom edge, so contact in those clips can only be read from the JSON. Widen the frame or lower the
   camera target.

Gait in one line: the new Walk is bm's stride and it is planted, the knees lead and the heels strike. It reads far better
than the Mixamo walk, apart from the dropped head. The Run needs to come down to a jog.
