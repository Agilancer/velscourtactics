# Rig review, round 2, group B: veteran

Method: I read every card, then measured `r2/rest/*.json` and `r2/motion/*.json` (the data the cards are drawn from),
and overlaid the joints on the clean renders at 1.5-2.4x wherever a number looked off. Heights in % are of the whole model,
as on the cards. "z" is front/back in the side view. Frames are f0-f5, left to right on the card (f5 repeats f0).
"Head bow" is how far the head bone (head to head-top) pitches forward in the clip compared with the rest pose. bm's
paladin on the reference sheet walks with his head level.

dragon_knight_f_v2: PASS   score 8
- Head bow in Walk / Run [minor, systemic]: the head pitches 16-19 deg down in the Walk and 23 deg in the Run compared with
  rest. It's the smallest bow in the group, but she still walks looking a little at her boots. Walk side, all frames.
- Feet in Swing [minor]: the L ankle sinks 1.0-1.8 cm into the floor in every frame. The R ball rides 1.5-2.7 cm up (the
  known R-foot issue). Swing side, f1-f3.
- Good: the spine is a clean curve (within 0.4 cm of the hips-head line). Shoulders mirror at 15.8 cm. Knees, ankles and
  balls match L to R in height. Knees are 3.6-3.8 cm (2.0-2.1%) forward of the line, as the reference asks. Ankles sit in
  the boot shafts and balls at the toes. The Walk stance foot is planted within 0.3-1 cm, and the knees and elbows bend
  cleanly.
- Cloth (out of scope): the gown and cape go up to 12.5 cm through the floor in the Walk and 16 cm in the Swing.
- round 1: floor float [blocker] fixed (8-12 cm in r1, now on the floor in every clip). Spine2 dog-leg [major] fixed
  (Spine2 now 0.4 cm off the line, was 6 cm behind). r1 minors: L knee and ankle height fixed; shoulder asymmetry fixed.

dragon_knight_m_v2: FAIL   score 5
- Head bow in Walk / Run [major]: the head pitches 41-45 deg down in the Walk and 48-49 deg in the Run. He walks with his
  face to the floor, and from the game camera you see only the helm's crown and horns. Two things cause it. First, the
  retarget forces every neck to the source's direction (see systemic 1). Second, his own head pivot sits 3.1 cm behind the
  neck joint (head z +6.3 against neck +3.2), so the Neck-to-Head bone tips 22 deg backwards in the rest pose. That's
  because the refit moved the neck 2.9 cm forward to smooth the spine and left the head where it was. Fix the retarget
  first. If the rig stays as it is, put the head pivot over the neck, about 3 cm forward. Walk three-quarter, all frames;
  Run, all frames.
- Tail [blocker, known, not handled]: it still rides the legs in the Walk and Run, and in the Swing the tip dips 1-4 cm
  through the floor. Swing three-quarter f0/f2.
- Shoulders, front-to-back [minor]: unchanged from r1. They sit 7.6 cm behind the hip line, toward the back of the deltoid
  under the pauldron. Width is good and mirrored (20.6 cm). Side view, rest.
- R knee [minor]: 1.5 cm (0.8%) forward of the line, under the refit's own 1.2% floor. The L is 2.3 cm. Side view, rest.
- Feet in Swing [minor, known]: the R ankle and ball ride 0.6-2.1 cm up. The L is on the floor.
- Good: the spine curve is clean, shoulders mirror, and knee heights match.
- round 1: Spine2 dog-leg [major] fixed (Spine2 now 2.7 cm in front of the hips-head line, was 10 cm behind Spine1). r1
  minors: R knee height fixed; Swing float better (L planted, R +1-2 cm); shoulder depth unchanged.

dragoon_f_v2: PASS   score 7
- Head bow in Walk / Run [minor, borderline]: the head pitches 28-31 deg down in the Walk and 35 deg in the Run. She stares
  at the floor in the Walk. Her Neck-to-Head bone tips back 8 deg in rest, which adds to the retarget's bow (systemic 1).
  Walk side, f0-f4.
- Feet in Thrust [minor]: the planted L foot sinks 2.5-2.9 cm into the floor at f1 and f4, and the R rides +1.5 cm at f0
  and f5. Thrust side, f1/f4.
- Upper arm [minor]: 18.5 cm against a 20.5 cm forearm (0.103 / 0.114). The elbow is about 2 cm high, at the top of the
  vambrace. It bends cleanly in the Run, so I'm only noting it.
- Good: shoulder joints sit inside the pauldrons at the top of the arm and mirror. The head pivot is behind the jaw inside
  the helm. The spine is within 0.9 cm of the line. Knees are 2.8-3.2 cm (1.6-1.8%) forward. Ankles and balls are right.
- Cloth (out of scope): the skirt goes about 3.5 cm through the floor in the Thrust.
- round 1: no blockers or majors. Minors: lower-spine kink fixed; knees better (+2.8/+3.2 cm, were +1.2/+1.3); walk float
  fixed.

dragoon_m_v2: PASS   score 8
- Head bow in Walk / Run [minor, systemic]: 22-25 deg in the Walk, 29 deg in the Run. Walk side.
- Feet in Thrust [minor]: the planted L foot sinks 2.5-3.0 cm at f1, f3 and f4 (the boot sole goes 2.8 cm under the floor
  at f1). The R rides +1.6 cm at rest frames. Thrust side, f1/f4.
- Upper arm [minor]: 19.9 cm against a 22.1 cm forearm. Noted only, since it deforms cleanly.
- Good: shoulders sit inside the pauldrons and mirror. The spine is straight (within 0.3 cm). The head pivot is behind
  the jaw. Knees are 3.4-3.6 cm (1.8-1.9%) forward. Feet are right. The Walk stance foot is planted within 0.2 cm, and the
  Thrust's high knee deforms the thigh plate without tearing.
- round 1: no blockers or majors. Minor walk float fixed.

flint_v2: FAIL   score 6
- Head bow in Walk / Run [major]: 31-35 deg down in the Walk, 39 deg in the Run. His chin sits on his chest for the whole
  Walk (the hat brim points at his boots). His head pivot is 1.5 cm behind the neck joint, so the Neck-to-Head bone tips
  back 12 deg in rest, and that is added to the retarget's bow. Fix the retarget (systemic 1). If the rig stays, move the
  head pivot about 1.5 cm forward over the neck. Walk side, f0-f4; Run, all frames.
- Toes at push-off [minor]: the trailing toe goes 1.3 cm through the floor at Walk f3.
- Feet in Shoot [minor, known]: the R ball rides +1.4-1.9 cm. The L is planted.
- Good: the shoulders mirror (21.4 cm) inside the coat. The elbow and wrist sit at the cuff. The ankle is over the heel and
  the ball is at the boot's bend. The raised R arm in Shoot deforms cleanly at the cuff and shoulder.
- round 1: no blockers or majors. Minors: Shoot hover fixed (feet within 0-1.9 cm, hips now drop 2-3 cm); knees better
  (+2.0/+2.7 cm, were +0.2/-0.5); walk float fixed.

ghoul_v2: FAIL   score 5
- Walk and Run posture [major]: the retarget straightens the ghoul. At rest he is hunched, with the trunk 9 deg forward
  and the head thrust 23 cm in front of the hips. In the Walk the trunk comes up to 2.0-2.6 deg, the head comes back to 6-8
  cm in front of the hips, and the head tips 35-39 deg backwards, so he strides upright with his mouth to the sky. The Run
  is the same, with the head 30 deg back. That isn't "a slumped version of the same stride"; he slumps less than the heroes
  do. Cause: systemic 1. The source's neck and head directions are copied onto a skeleton whose rest neck runs 57 deg
  forward. Walk side f2/f3, Run side f1.
- Toe spikes [blocker, known, not handled]: in Run f1 the leading foot's toes stretch into a spike about 9 cm long below the
  sole. In Run f3 the trailing foot ends in a point. At Walk f0 the trailing toes stretch too. Run side f1/f3.
- Walk float [minor]: the soles never quite reach the floor. The lowest mesh is 0.9-1.4 cm up in every Walk frame except f3,
  and the stance ankle is at best 1.0 cm above standing height. Walk side, all frames.
- Knees, front-to-back [minor]: the R knee is 1.9 cm further back than the L (L 2.7%, R 1.6% forward of the line). Side
  view, rest.
- Ball of the foot [minor]: unchanged from r1, about 4 cm behind the toe roots. Side view, rest (feet panel).
- Good: the head pivot is now behind the jaw at mouth level, and the neck is at the base of the thrust neck. Shoulders are
  mirrored inside the deltoids (19.3/19.4 cm, same depth). Knees are level. The Rake keeps the head down and the feet down:
  the L is within 0.2-2.5 cm, and the R rides up to 3 cm (the known issue).
- round 1: head and neck [blocker] fixed (head pivot moved 16 cm forward, neck 6 cm; head turns now pivot at the skull
  base). L shoulder width [major] fixed (19.3 against 19.4 cm). Shoulder depth [major] fixed (both +6.8 cm). L knee height
  [major] fixed (both 55.7 cm).

gunner_f_v2: PASS   score 7
- Knees [minor]: still on the hip-to-ankle line, +0.4 / +0.8 cm (0.2-0.4%). That is under the refit's own 1.2% floor. Move
  them forward about 3 cm. Side view, rest (I measured 0.7 cm on the overlay).
- Head bow in Walk / Run [minor, systemic]: 20-23 deg in the Walk, 27 deg in the Run.
- Upper arm [minor, can't fully judge]: 18.5 cm against a 22.7 cm forearm. The elbow sits at the top of the brass gauntlet,
  about 3 cm high on proportion. Check it against the crease under the sleeve. Front view, rest.
- Feet in Shoot [minor, known]: the R ball rides +1.6-2.3 cm and the L ankle sinks 0.5-0.9 cm. Shoot, all frames.
- Good: the heeled boot now walks on the floor (stance foot within 0.1-0.4 cm). Ankles sit in the boot shaft over the heel.
  Shoulders mirror (16.5 cm). The head pivot is at the jaw.
- round 1: walk float [major] fixed (soles were 4.4-7.1 cm up; the stance foot is now on the floor). r1 minors: Shoot hover
  fixed; Spine2 kink fixed; knees unchanged.

gunner_m_v2: PASS   score 8
- Head bow in Walk / Run [minor, systemic]: 17-20 deg in the Walk, 25 deg in the Run.
- Feet in Shoot [minor, known]: the R ankle and ball ride +0.8-2.5 cm. The L is planted.
- Knees [minor]: 2.0-2.1 cm (1.1-1.2%) forward. Better, but still short of the reference's 2-2.5%.
- Good: the shoulder joints sit under the shoulder cape at the top of the arm and mirror. The spine is straight (within 0.3
  cm). The head pivot is behind the jaw. The raised R arm in Shoot deforms cleanly.
- round 1: L shoulder joint [major] fixed (17.1 / 17.1 cm, were 23.4 / 15.1 cm; depth matched). r1 minors: knees better;
  walk float fixed.

homunculus_v2: FAIL   score 6
- Head bow in Walk / Run [major]: 38-41 deg in the Walk, 45-46 deg in the Run. He walks looking at the ground, and in the
  Run his face drops behind the pauldron. The refit moved his neck 4 cm forward (as I asked in r1) and left the head pivot
  where it was. The head now sits 2.7 cm behind the neck joint, and the Neck-to-Head bone tips back 19 deg in rest. Add the
  retarget's bow to that (systemic 1). Fix the retarget. If the rig stays, bring the head pivot about 2.5 cm forward over
  the neck. Walk side, f0-f4; Run three-quarter f2.
- Toes at push-off [minor]: the trailing toe goes 2.0 cm through the floor at Walk f3.
- Knees [minor]: unchanged at 1.2 / 1.6 cm (0.6-0.8%) forward of the line. That is under the refit's own 1.2% floor. Move
  them forward about 2.5 cm. Side view, rest.
- Feet in Swing [minor, known]: the R ankle rides +2.5 cm at f1-f3.
- Upper arm [minor]: 23.2 cm against a 25.7 cm forearm. Unchanged and deforms cleanly, so noted only.
- Good: shoulders sit inside both pauldrons and mirror (26.2 cm). The spine is clean. The neck joint is now in the middle of
  the neck. Proportions are still spot on.
- round 1: no blockers or majors. Minors: neck fixed (moved 4 cm forward, but see the head-bow major); Swing hover fixed;
  walk float fixed; knees unchanged; elbow unchanged.

ismene_v2: PASS   score 7
- Head bow in Walk / Run [minor, systemic]: 17-20 deg in the Walk, 24 deg in the Run.
- Knees [minor]: 1.2 / 1.9 cm (0.7 / 1.1%) forward. The L is under the refit's 1.2% floor. Move both forward about 2 cm.
  Side view, rest.
- Upper arm [minor, can't fully judge]: 15.9 cm against an 18.3 cm forearm. The elbow is about 2 cm high, under the shawl.
  Front view, rest.
- Feet in Bolt [minor]: the L ankle sinks 1.3 cm and the R ball rides +1.5 cm (known), steady through the clip.
- Good: the heeled boots now walk on the floor (stance foot within 0.1-0.3 cm). Ankles are in the boot shafts. Shoulders
  mirror under the shawl (15.4 cm). The spine is straight (within 0.3 cm). The head pivot is behind the jaw.
- Cloth (out of scope): the gown tails go about 8 cm through the floor in the Walk and 11 cm in the Bolt.
- round 1: L knee height [major] fixed (both 53.1 cm). Walk float [major] fixed (stance foot was 3.2 cm up at best). r1
  minors: spine bow fixed; R shoulder fixed; Bolt hover fixed (it now sinks 1.3 cm instead).

jamie_v2: PASS   score 8
- Head bow in Walk / Run [minor, systemic]: 21-24 deg in the Walk, 28-29 deg in the Run.
- Feet in Throw [minor, known]: the R ankle and ball ride +0.7-2.4 cm.
- Upper arm [minor]: 20.6 cm against a 24.1 cm forearm. Noted only.
- Good: still the cleanest rig here. The spine is within 0.2 cm of the line. Shoulders mirror in width and depth. Knees
  are 2.7-3.3 cm (1.5-1.8%) forward. The head pivot is behind the jaw under the ear. The raised arm in the Throw (f3/f4)
  deforms cleanly under the cape.
- round 1: no blockers or majors. Minors: knees better; R shoulder depth fixed; walk float fixed.

jasper_v2: PASS   score 7
- Head bow in Walk / Run [minor, borderline]: 26-30 deg in the Walk, 34 deg in the Run. The hat brim covers the face for
  most of the Walk. The Neck-to-Head bone tips back 7 deg in rest (that's where I asked for the head and neck to go in r1,
  and it's right for his collar). This one is the retarget's (systemic 1).
- Upper arm [minor]: 18.0 cm against a 21.4 cm forearm. Noted only.
- Feet in Strum [minor, known]: the R ankle and ball ride +0.9-2.2 cm.
- Good: shoulders mirror and the arms are good. Ankles and balls are right on the boots.
- round 1: no blockers or majors. Minors: head pivot fixed (raised 3 cm to the jaw angle); neck fixed (2.7 cm forward,
  Spine2 now on the line); knees better (+1.9/+2.1 cm, were -0.7/-0.5); walk float fixed.

kestrel_v2: PASS   score 7
- Head bow in Walk / Run [minor, borderline]: 28-31 deg in the Walk, 35-36 deg in the Run. The Neck-to-Head bone tips back
  8 deg in rest and adds to it (systemic 1).
- Toes at push-off [minor]: the trailing toe goes 3.6 cm through the floor at Walk f3. It's the worst in the group, and the
  toe doesn't bend at the ball. Walk side, f3.
- Feet in Thrust [minor]: both heels sit 1.1-1.4 cm up at f0 and f5, and the planted L sinks 2.1-2.4 cm at f1 and f4.
  Thrust side.
- Knees [minor]: 2.2-2.3 cm (1.2%) forward, on the refit's floor and short of the reference.
- Good: the spine is clean. Shoulders mirror (16.9 cm). The head pivot is behind the cheek guards at the jaw. Feet are good.
  The Thrust's high knee lift deforms cleanly.
- round 1: no blockers or majors. Minors: Spine2 kink fixed (now 0.9 cm off the line, was 4.7 cm); L shoulder fixed; knees
  better (+2.2 cm, were -0.4/-0.5); walk float fixed.

## Systemic (ranked by how many figures they hit)

1. **Head and neck are retargeted by direction, not by rotation from rest [major; all 13].** In every Walk frame the
   Neck-to-Head bone points 14-16 deg forward and Spine2-to-Neck 10-13 deg, whatever the figure's rest pose was.
   dragon_knight_m's neck goes from 22 deg back to 14 forward, gunner_m's from 2 to 14, and the ghoul's from 57 down to 14.
   The head bow comes out at about 20 deg minus the rest Neck-to-Head angle:
   - dragon_knight_m 43, homunculus 40, flint 33 (major);
   - dragoon_f 29, kestrel 29, jasper 28 (borderline);
   - jamie 22, dragoon_m 23, gunner_f 21, gunner_m 19, ismene 18, dragon_knight_f 17;
   - the ghoul's head goes 37 deg backwards and his hump flattens.

   The Run adds about 6 deg on top. Even paladin_m_v2 bows about 17 deg through this retarget (r2/motion), while bm's
   paladin on the reference sheet walks head-level. Fix it in the retarget: carry the source's rotations as deltas from its
   own rest pose onto each figure's rest pose, at least for Spine1, Spine2, Neck and Head. Then the dead's slump becomes a
   layer on top, not a replacement for the ghoul's own hunch. The same cause puts a Z in every attack clip's neck: at f0,
   Spine2-to-Neck tips 26 deg back and Neck-to-Head 21 deg forward. Collars and helms hide it so far, but it will crease a
   bare neck.
2. **Attack clips aren't grounded per foot [minor-to-major; all 13].** The R foot rides 1.4-3 cm high in every attack,
   even at the neutral f0 (the known issue). The L stance foot sinks:
   - 2.5-3.0 cm in the dragoons' Thrust;
   - 2.1-2.4 cm in kestrel's Thrust;
   - up to 2.5 cm in the ghoul's Rake;
   - 1.0-1.8 cm in dragon_knight_f's Swing;
   - 1.3 cm in ismene's Bolt.

   It looks like the clip is set down on the average of the feet, or the pelvis roll doesn't match. Plant the stance foot
   with IK or a per-foot floor pass.
3. **Upper arms are shorter than forearms [minor; 11 of 13].** The odd ones out are gunner_m (23.1 / 22.2 cm) and
   dragon_knight_f and the ghoul (equal). Elsewhere the upper arm is 0.092-0.127 of height against the reference's
   0.133-0.153, and the forearms are close to range, so most elbows sit 2-3 cm high, often at the top of a vambrace or
   gauntlet.
   They bend cleanly in the Run, so nobody fails on it, but the mirror-copy has now made it symmetric everywhere. Check it
   against the mesh's elbow crease once.
4. **The Run reads as a bound, not a jog [gait note; all 13].** The hips travel 22-24 cm per stride. The stance knee folds
   to 88 deg at f3, and both feet are 20-35 cm off the floor at f2/f4. Heads bow 23-49 deg (item 1). bm's paladin test
   (`bmtest/motion`) shows the same 23 cm hip travel, so this is the source, not the refit. Check it against bm's jog
   in the game before it ships as the hero run.
5. **The trailing toe goes through the floor at push-off [minor; at least 3].** At Walk f3 it's 3.6 cm on kestrel, 2.0 cm on
   homunculus and 1.3 cm on flint. Others are 1-2 cm, but cloth makes them hard to separate. The ToeBase doesn't extend as
   the heel lifts, so carry the source's toe bend, or clamp the toe tip to the floor.
6. **Knees below the refit's own 1.2% rule [minor; 4].** gunner_f is at 0.2-0.4% and homunculus at 0.6-0.8%; ismene's L
   (0.7%) and dragon_knight_m's R (0.8%) also fall short. The rest are now 1.1-2.7%, which is a clear improvement on round 1.
   I measured from the hip joint to the ankle joint in the side view; check that the refit uses the same line.
7. **Known and still open, as the brief says:** dragon_knight_m's tail, the ghoul's toe spikes, and the R foot in the
   attacks (item 2).

What round 2 fixed across the board:
- The Walk is on the floor: every stance foot is within 0-0.5 cm, against 3-7 cm in r1, and that includes the two heeled
  figures. Only the ghoul is still about 1 cm up.
- The Walk itself now matches bm's (heel strike, planted stance, knees forward).
- Spines are clean curves.
- Shoulders, knees and feet mirror.
- Every blocker and major from my round-1 list is fixed.

The new failures are almost all the head and neck retarget.
