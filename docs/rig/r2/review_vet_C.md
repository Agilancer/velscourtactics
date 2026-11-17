# Rig review, round 2, group C: veteran

Method: I read every card by eye. Where a call was close, I re-cut the rest renders from `r2/rest` and the motion frames from `r2/motion` with the
joints drawn on. Distances come from the joint JSON (world cm, floor at z = 0, directions are the figure's own,
forward = toward the face). Unless I say otherwise, "above rest" means a joint's height in a clip minus its height in the rest pose.
I also measured joints against the front silhouette (alpha) of the rest render where the legs or arms are clear of
cloth. Round-1 verdicts are from `tools/build/rig/r1/review_vet_B.md` (lily, lisandra) and `review_vet_C.md` (the rest).

Per the round-2 brief, the right foot riding high in attack clips is a known, unhandled issue that still fails a figure.
Wherever it is the only thing failing a figure, I say so, and the score is for the rig itself.

```
lily_v2: PASS   score 7
- L/R feet under the gown [minor]: not mirrored front to back. The L ankle sits 3.7 cm ahead of the hip line and the R
  ankle sits straight under it (0.0); the balls are 3.6 cm apart the same way. Side to side they match within 1 cm. The L foot
  matches the shoe toe that peeks out of the hem, so mirror the R onto it (R ankle and ball ~3.7 cm forward). Rest side,
  feet close-up.
- Collarbones [minor]: the roots are still 6.4 cm in front of the shoulder joints (5.8 cm in front of Spine2), so the
  clavicle chain makes a V. Move them back ~5 cm. Rest side, shoulders close-up.
- Bolt feet [minor]: both heels stay lifted ~2 cm through the whole Bolt (L ankle +1.6, R +2.0-2.2 cm above rest, balls
  on their rest height). It's under the gown and won't read.
- Upper arm [minor]: 17.9 cm (0.102 of height) against a 19.8 cm forearm. The elbows sit on the arm's axis from the front,
  so the shoulder height is what's short (systemic 2).
- Gait: the head pitches ~10 deg in the Walk, like the reference. Feet are planted within 0.4-0.6 cm except the passing frame f3
  (1.9 cm). Knees are 2.4% (L) and 3.3% (R) forward.
- round 1: whole figure off the floor [blocker] fixed (Walk stance 0.4-0.6 cm, Bolt planted). Head pivot [major]
  fixed: it moved 5.5 cm back and is now ~9 cm behind the veil's front, just above chin height. Of the minors, the spine
  bow and the forearm mismatch are fixed; the collarbones are unchanged.

lisandra_v2: FAIL   score 3
- Whole figure off the floor [blocker]: in the Bolt both ankles are 12.7 cm above standing height in all 6 frames and the
  lowest point of the mesh (the hem) is 6.5 cm off the floor. In the Walk both ankles and balls are 5.8-6.5 cm above rest in
  every frame, so no foot ever lands, while the gown goes 24 cm through the floor at f0. The round-2 floor pass did not
  take on her. Bolt side f0-f5, Walk side f0-f4.
- Head in the Walk [major]: the head pitches 30 deg down against rest through the whole Walk, the worst in the group, and the hat
  brim tips to the floor. The reference walk keeps the head up (~10 deg). Her neck-to-head line leans 9.6 deg back at rest
  and the retarget forces it to the same 15 deg forward as every figure (systemic 1). Walk side f0-f4.
- R ankle [minor]: 2.5 cm toward the midline from the middle of the R boot shaft. The boots show through the gown's front
  opening: the R boot is centred ~4.6 cm right of the spine, the R ankle 2.1 cm. The L sits on its boot. Move the R ankle and
  ball ~2.5 cm out. Rest front, feet close-up.
- Head bone [minor]: HeadTop_End is only 2.8 cm above the head pivot (14-30 cm on the others). It's harmless for FK, but
  anything that reads the head bone's length (look-at, weight transfer) gets a stub. Run it up to the crown, ~15 cm.
- Upper arm [minor]: 15.8 cm (0.093) against a 16.3 cm forearm, the shortest in the group.
- round 1: floor [blocker] better in the Walk (hem from 14-19 cm up to feet ~6 cm up), unchanged in the Bolt (ankles 12.8 ->
  12.7 cm), so NOT fixed. Head pivot [blocker] fixed: 7.5 cm back, now ~9 cm behind the nose at mouth/earlobe height
  (136 cm); the 4 cm drop I asked for in round 1 isn't needed at this depth. Spine chain [major] fixed: gaps 7-10 cm and
  the spine on the hips-head line. R arm [major] fixed: mirrored, 16.1 cm each side. R knee bow [major] fixed: now 1.8 cm in,
  within the line.

maudlin_v2: PASS   score 8
- Knees [minor]: from the front, 1.5-1.8 cm toward the midline of the hip-ankle line under the gown (slightly
  knock-kneed). Move out ~1.5 cm. Rest front, hips-and-knees close-up.
- Upper arm [minor]: 15.7 cm (0.104) against a 17.3 cm forearm.
- Otherwise clean: the head pivot sits at mouth level ~8 cm behind the nose. The Walk head pitch is 15 deg. Feet are planted in
  the Walk (0.1-0.8 cm) and the Bolt (-0.5 cm). Her R foot rides only 0.6 cm, the least in the group.
- round 1: feet/root [blocker] fixed (Walk 0.1-0.8 cm, Bolt planted, hips back at rest height). Wrists [major] fixed: moved
  ~5 cm out, now at the end of the cuff where the hand starts. Knee height, L ankle and neck kink (minors) fixed.
- Cloth (out of scope): the gown walks as trousers and splits in the Run.

mortimer_v2: FAIL   score 7
- R foot in the Bolt [major, the known unhandled issue]: the R ankle and ball ride 1.7-1.9 cm above rest in all 6 frames
  while the L is planted (-0.1 cm). He fails on this alone. Bolt side numbers, three-quarter strip.
- Knees [minor]: 2.1-2.2 cm (1.1-1.2%) ahead of the hip-ankle line against the reference 2-2.5%, and bowed 1.3-1.6 cm outward
  from the front. Move ~2 cm forward and ~1.5 cm in. Rest side and front.
- Clean otherwise: the shoulders are now centred in the arm root front and side. The ankle is over the heel and the ball at the bend.
  The Walk head pitch is 12 deg, with feet planted 0.1-0.5 cm (1.4 cm at the passing frame). No collapse in the strips. The
  coat tails ride the legs (out of scope).
- round 1: no blockers or majors (PASS 7). Of the minors, shoulders fixed (2.2 cm down), L elbow fixed (mirrored), knees better
  (from dead straight to 1.1-1.2%, bow 2.3 -> 1.5 cm).

necromancer_f_v2: FAIL   score 6
- Head in the Walk [major]: pitched 25 deg down against rest all through the Walk; the hat brim points at the floor. Her
  neck leans 3.9 deg back at rest and the retarget forces it to 15 deg forward (systemic 1). Walk side f0-f4.
- R foot in the Bolt [major, known]: 1.6-1.9 cm above rest in all 6 frames.
- Knees [minor]: the L is 1.2 cm (0.67%) and the R 1.9 cm (1.03%) ahead of the hip-ankle line, under the brief's 1.2% floor and
  the reference 2%. Move both ~2.5 cm forward. Rest side.
- Upper arm [minor]: 19.0 cm (0.103) against a 22.5 cm forearm.
- round 1: knees [major] fixed (moved 4-5 cm in and ~7 cm back; now in the boot line front and side). Bolt float [major]
  fixed (planted, -0.1 cm). Neck fixed (on the line). Shoulders 2 cm lower.

necromancer_m_v2: FAIL   score 4
- L and R knee [blocker]: 17.6 cm ahead of the hip-ankle line (9.8% of stature; reference 2-2.5%). They sit at the front edge
  of the coat flap, outside the leg; the boot shafts below put the leg's centre ~2 cm behind the hip line. The knee fit took
  the coat's front flap for the leg. In motion the retarget straightens the bent chain. His hips ride 5.4 cm above rest in
  the planted Bolt (108 vs 102.6 cm), and he stands 3-6 cm TALLER than at rest in the Bolt and the Walk (top of mesh 188-191
  vs 185 cm). He is the only figure in the group that grows (necromancer_f, same body, shrinks 3-5 cm). Move both knees ~15.5 cm
  back to ~2 cm ahead of the hip-ankle line. Rest side legs; Bolt side f0.
- R foot in the Bolt [major, known]: R ball 1.9-2.2 cm and ankle 1.3-1.6 cm above rest in all 6 frames.
- Clean otherwise: shoulders on the arm root (the R one now mirrors the L), ankles centred in the boots front and side,
  Walk head pitch 10 deg.
- round 1: knees [major] WORSE (10.3 -> 17.6 cm forward). R shoulder [major] fixed (mirrored at 15.7 cm). R elbow height
  and the Bolt foot sink (minors) fixed.
- Cloth (out of scope): the red sash tail goes ~20 cm through the floor at Walk f0.

ninja_f_v2: FAIL   score 6
- Head in the Walk [major]: pitched 26 deg down against rest; the hood points at her feet. Her neck leans 5 deg back at rest
  (systemic 1). Walk side and three-quarter.
- R foot in the Slash [major, known]: R ball 1.3-2.2 cm above rest; the L is planted (-0.2 to -1.1 cm).
- Collarbones [minor]: the roots are 6.7 cm in front of the shoulder joints (the root 2.4 cm ahead of the hip line, the shoulder 4.3 cm
  behind it). Move back ~4 cm. Rest side, shoulders close-up.
- Upper arm [minor]: 18.6 cm (0.108) against a 20.6 cm forearm.
- round 1: head [major] fixed: now ~9.5 cm behind the mask's front at mid-mask height, no longer at the chin. The minors
  are all fixed: Spine2 back on the line, L arm mirrored, knees +2.4/+2.8 cm and level, Slash L foot planted.

ninja_m_v2: FAIL   score 6
- Head in the Walk [major]: pitched 22 deg down against rest (systemic 1). Walk side f0-f4.
- R foot in the Slash [major, known]: R ball 1.4-1.9 cm above rest.
- Shoulders [minor]: 22.1 cm from the centre, 1.5-2 cm further OUT than in round 1, where I asked for ~2.5 cm in. Still 6 cm
  behind the hip line in the side view, ~3 cm behind the middle of the arm. The upper arm measures 19.7 cm against a 21.8 cm
  forearm. They are on the arm's axis from the front, so slide them ~3 cm in along it and ~3 cm forward. Rest front and side.
- round 1: Slash float [major] fixed (planted, -0.1 to -0.6 cm, the mesh touches the floor). Knees fixed (+2.2-2.3 cm).
  Shoulders unchanged (slightly worse sideways).

paladin_f_v2: FAIL   score 7
- R foot in the Swing [major, known]: R ball 1.7-2.6 cm and ankle up to 1.9 cm above rest. She fails on this alone.
- Head [minor]: the pivot is at chin height inside the helmet (146.2 cm), ~3 cm under the nose-bottom/earlobe line. Its depth
  is right now (~11.5 cm behind the nose). Move up ~3 cm. Rest side, head close-up.
- Upper arm [minor]: 16.6 cm (0.092) against an 18.7 cm forearm.
- Walk head pitch 13 deg, fine. Legs centred, knees 1.6-1.8% forward, ankles over the heel.
- round 1: Swing float [major] fixed (the L is planted, -0.2 to -0.8 cm). L shoulder fixed (mirrored at 15.9 cm). Lower spine
  fixed (on the line). Head depth fixed (moved 3 cm forward).

paladin_m_v2: FAIL   score 7
- R foot in the Swing [major, known]: R ball 1.6-2.3 cm and ankle up to 2.2 cm above rest. He fails on this alone.
- Head in the Walk [minor]: pitched 18 deg down against rest, ~8 deg more than the clean figures, from the same retarget cause
  (systemic 1). Walk side.
- Knees [minor]: 2.0 and 2.3 cm (1.1-1.2%) forward. Move ~1.5 cm forward.
- Upper arm [minor]: 18.0 cm (0.097) against a 19.8 cm forearm.
- round 1: elbows [major] fixed: they are now in the middle of the couter's red inner-elbow gap, not at its top. The shoulder came down
  2 cm with them, so the upper arm still measures 18 cm. Swing feet fixed (planted). Knees about the same.
- Cloth (out of scope): the cape still goes 10-14 cm under the floor through the Swing (8-12 cm in round 1).

ranger_f_v2: FAIL   score 6
- Head in the Walk [major]: pitched 28 deg down against rest; she watches her feet. Her neck leans 6.9 deg back at rest
  (systemic 1). Walk side f0-f4.
- R foot in the Shoot [major, known]: R ball 1.6-2.4 cm above rest.
- Neck [minor]: the head went up 6 cm but the neck stayed at the collar. The neck bone is now 13 cm (head 147.0, neck 134.0)
  against 7-8 cm on the rest of the group, and the neck sits at 0.91 of the head pivot's height against 0.95 on the
  others. Move it up ~3 cm to mid-neck. Rest side, head close-up.
- Knees [minor]: 1.9 cm (1.1%) forward, under the 1.2% floor. Move ~2 cm forward.
- round 1: head [major] fixed: 6 cm up, now in the hood at mouth/nose-bottom height ~11 cm behind the nose. Neck kink fixed
  (on the line). Shoulders mirrored.

ranger_m_v2: FAIL   score 6
- Head in the Walk [major]: pitched 22 deg down against rest (systemic 1). Walk side f0-f4.
- R foot in the Shoot [major, known]: R ball 1.2-2.1 cm and ankle 1.0-2.4 cm above rest.
- Upper arm [minor]: 19.4 cm (0.105) against a 21.5 cm forearm.
- Legs good: knees 1.55% forward, ankles over the heel, balls at the bend.
- round 1: Shoot float [major] fixed (the L is planted, -0.3 to -0.4 cm). Spine2 fixed (on the line). Shoulders 2 cm lower and elbows
  2.2 cm further down the arm, both as asked.
- Cloth (out of scope): the feathered cloak is still the worst rider in the group, trailing off both legs in the Walk and Run.

skeleton_v2: FAIL   score 5
- Ankles and balls [major]: 4 cm toward the midline from the front, outside the bones. The joints are 9.1 cm from the centre,
  while the shin bones at the ankle span 10.5-16.5 cm (their centre ~13 cm), and the balls sit 1-2 cm inside the inner edge of
  each bony foot (the feet span 10.5-20.9 cm). The side view is right. Move the ankles ~4 cm out and the balls ~5-6 cm out, onto
  the toed-out metatarsal heads. Rest front, feet close-up.
- Toes [major, the known unhandled toe spikes]: the toes stretch into long spikes in Run f1-f3 and Walk f1 (three-quarter).
  The misplaced balls above will be feeding this.
- R foot in the Swing [major, known]: R ball 1.5-2.7 cm above rest.
- Head [minor]: on the top of the neck vertebrae just under the jaw (149.8 cm), still ~2-3 cm under the skull base behind the
  jaw angle. Move up ~2.5 cm. Rest side, head close-up.
- Collarbones [minor]: the roots are at 139.7 cm, ~2 cm under where the clavicles leave the sternum. Move up ~2 cm.
- Walk head pitch is 26 deg. On the dead it reads as a slump and is acceptable here, but it is the same retarget fault as
  on the living (systemic 1).
- round 1: lumbar Spine [major] fixed (on the column now). Shoulder girdle [major] fixed: the shoulder joints went up 4 cm into the
  humeral heads and the upper arm now measures 0.143, the only one in range. Head better (2.5 cm up). R knee fixed (both knees
  centred on the joints). R ankle unchanged, and the L now matches it at 4 cm in.
```

## Systemic (ranked by how many figures they hit)

1. **The retarget copies world bone directions, not rotations relative to each rig's rest (13 of 13; major on 7).**
   - In every Walk frame, on every figure, the Neck-to-Head bone sits at the same 15.0-15.2 deg forward lean, whatever its
     rest angle (-9.6 to +10.8 deg).
   - So the head mesh pitches down by about 21 deg minus its rest neck lean:
     - lisandra 30, ranger_f 28, ninja_f 26, skeleton 26, necromancer_f 25, ninja_m 22, ranger_m 22, paladin_m 18
     - maudlin 15, paladin_f 13, mortimer 12, lily 10, necromancer_m 10
   - bm's walk keeps the head up. Moving the head pivots back this round leaned those necks backward, and the retarget turned
     that into a bow.
   - The trunk shows it too: Hips to Neck tips 1-7 deg more on the figures whose rest spine leans back.
   - The same mechanism straightens necromancer_m's bent leg chain and lifts him 5 cm.
   - Fix: transfer each bone's rotation as a delta from the source rest onto the target rest, at least for Spine..Head.
2. **Upper arms still read short and the shoulder and neck heights still come from a formula (12 of 13; minor).**
   - Upper arms are 0.092-0.109 of height against the reference 0.133-0.153; only the skeleton is in range.
   - Forearms are 0.096-0.122.
   - The shoulder joint sits at exactly 0.889 of the head pivot's height on 10 of 13, and the neck at 0.950-0.953 on 9.
   - Both came down ~2 cm since round 1. Where I checked, they're inside the arm root now, and the elbows and wrists sit at the crease or
     cuff (paladin_m, maudlin, ninja_m, mortimer).
   - The formula left ranger_f's neck at the collar when her head went up, and ninja_m's shoulders ~3 cm out along the arm.
   - Fit the shoulder to the arm root (between the armpit and the deltoid top, on the arm's axis), not to the head height.
3. **Walk passing frame (12 of 13; minor).** At f3 the stance heel is up and both feet are 0.8-1.9 cm above rest. The other walk
   frames are planted within 0.0-0.6 cm. Lisandra is the exception at 6.5 cm.
4. **The R foot rides high in the attack clips (11 of 13; major, the known unhandled issue).**
   - The R ball is 1.2-2.7 cm and the R ankle 1.0-2.5 cm above rest, through the whole Bolt/Swing/Slash/Shoot.
   - Hit: mortimer, both necromancers, both ninjas, both paladins, both rangers, skeleton.
   - Lily's heels lift ~2 cm under the gown. Maudlin is the only clean one (0.6 cm).
   - The L foot is planted on all of them, so the floor pass works and this is the R foot's own offset.
   - It alone fails mortimer and both paladins.
5. **Knees are under the reference 2-2.5% forward offset (11 of 13; minor).**
   - Six are under the brief's own 1.2% floor:
     - necromancer_f 0.67 / 1.03%
     - lisandra L 1.0%
     - ranger_f 1.1%
     - paladin_m L 1.1%
     - skeleton 1.1%
     - mortimer 1.1-1.2%
   - The one going the other way is necromancer_m at 9.8% (see 7).
6. **Feet that weren't fitted to their own foot (3 of 13).**
   - skeleton: ankles and balls 4 cm toward the midline, outside the bones (major).
   - lily: L/R 3.7 cm apart front to back under the gown (minor).
   - lisandra: R ankle 2.5 cm inside the boot (minor).
   - The "mirror the better side" step copied the bad side on the skeleton.
7. **The fitter still takes cloth for the body on the odd figure (2 of 13; blockers).**
   - necromancer_m: knees in the coat's front flap, 17.6 cm forward, worse than round 1.
   - lisandra: still hangs 6-13 cm above the floor in every clip; the floor pass did not take.
8. **Fixed across the board:**
   - The spine sits on a smooth line on all 13 (within 1.3 cm of the hips-head line, even spacing).
   - Every clip is set on the floor on 12 of 13.
   - L/R arms and legs are mirrored on all 13.
   - Every head pivot I flagged in round 1 is now at the skull base or close (lily, lisandra, ninja_f, ranger_f, paladin_f depth).
   - No candy-wrapper, tearing or stretching at elbows, knees, shoulders or wrists in any strip, apart from necromancer_m's
     legs.
9. **Gait:**
   - The Walk now has the reference's low foot, heel strike and roll, and a 2-3 cm hip bob. The head bow (1) is the visible
     difference from bm's heroes.
   - The Run reads as a bounding sprint, not a jog. The hips dip ~20 cm at the f3 contact (77-79 cm against ~99 standing). In
     f0/f2/f4 both feet are 11-25 cm off the floor, and at f1 the nearer foot is still 4-5 cm up. If this is bm's jog, check
     the root height on the retarget; a jog wants ~5 cm of bob.
10. **Cloth (out of scope):** the worst riders are:
   - ranger_m's feather cloak (34 cm under the floor at Walk f0) and Maudlin's gown.
   - The paladins' tabards and capes: 23 cm under the floor at paladin_f Walk f0, 10-14 cm through paladin_m's Swing, and
     flat sheets in the Run.
   - lisandra's gown, 24 cm through the floor at Walk f0.
   - necromancer_m's sash tail, ~20 cm.
