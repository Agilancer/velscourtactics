# Rig review r2, group D: veteran

How I measured: I read every round-2 rig and motion card. I checked the rest joints in `r2/rest/*_v2.json` against the
raw front and side renders, with the joints drawn on top at 2-3x, and compared them with the round-1 JSON to see what
moved. Floor contact and head pitch come from the side-view motion JSON:
- **Heights in a clip** are each foot joint's height minus its rest height.
- **Head pitch** is the Head-to-headfront angle minus its rest value; a positive number means the face is turned down.

Conventions:
- **Frames** are numbered 1-6 from the left of each strip. In the Walk and Run, frame 6 repeats frame 1, so a Run has
  5 distinct frames.
- **Forward and back** are read in the side view, where the figure faces left.
- **Lateral** is measured from the spine in the front view.
- **Known** marks the four faults brief_r2 lists as unhandled.

squire_v2: PASS   score 7
- head in Walk and Run [minor]: through the Walk the face is pitched 24-27° further down than at rest, and 31° in the Run.
  It reads as lowered from the game camera. The cause is the systemic head fault; the rest pivot itself is right. Walk
  side frames 1-6, Run side.
- planted L foot in Thrust [minor]: it sinks 1.5-2.5 cm in the lunge (frame 2: ball -2.5, ankle -1.5; frame 5: ball
  -2.1). That is slightly worse than round 1's 1.7 cm. Thrust side frames 2 and 5.
- R foot in Thrust [minor, known]: the R ball is 1.3-1.4 cm up with the heel down in the stance frames 1 and 6. This is
  the right-foot fault, small here.
- L and R elbow [minor]: the upper arm is 17.3 cm against a 20.3 cm forearm, so the bend could come ~1.5 cm down the arm.
  This is mostly the mesh's proportion. Rest front.
- Run (gait) [minor]: bm's jog reads as a bounding sprint here. Both feet are up to 22 cm off the floor in 3 of the 5
  frames, and the hips drop 18 cm. Run side.
- round 1: there were no blockers or majors. The shoulder-height minor is fixed (1.9 cm lower). The rest of the rig
  holds:
  - knees 2.4-2.5 cm (1.5%) forward on the kneecaps
  - ankles over the heels
  - a straight spine
  - Walk contact within 0-1 cm

stevie_v2: PASS   score 7
- head in Walk and Run [minor]: the face is pitched 21-24° further down than at rest in the Walk, and 28° in the Run.
  Walk side frames 1-6.
- planted L foot in Thrust [minor]: it sinks ~2.5 cm in the lunge (frame 2: ball -2.9, ankle -2.3; frame 5: both
  -2.4). Thrust side frames 2 and 5.
- push-off toes in Walk [minor]: the L toes dig 2.5-3 cm into the floor at push-off. Walk side frame 4.
- L and R shoulder [minor]: in the side view each joint sits ~3 cm toward the back edge of the upper arm. Bring them
  ~2-3 cm forward. Rest side, shoulders close-up.
- neck [minor]: the neck joint is at 141.9 cm, 15.5 cm under the head pivot, low in the tall collar. It could come up
  ~3 cm. Rest side.
- R foot in Thrust [minor, known]: the R ball is 1.0-1.1 cm up in stance frames 1 and 6.
- Run (gait) [minor]: up to 24 cm of flight, and the hips drop 19 cm. Run side.
- round 1:
  - head pivot (major): fixed. It is now at 157.4 cm, at nose-bottom level, ~8.7 cm behind the nose; it was 8-9 cm low.
  - shoulder height (minor): fixed, 2 cm lower.

totem_master_f_v2: FAIL   score 6
- head pivot / head in Walk [major]: the head joint is 3.5 cm behind the neck joint, so the Neck-to-Head bone leans back
  26°.
  - It sits at the back of the hood at chin height, ~15 cm behind the mask's nose and ~3-5 cm low and behind the base of
    the skull. Round 1 already showed the head 3.4 cm back, but the old walk hid it.
  - Through that lean the new Walk bows the head 45-49° below rest, and the Run 53°. The neck juts forward and the mask
    aims at the floor; from a 35-45° camera the face is gone.
  - Fix: move the head joint ~4 cm forward over the neck joint and ~3 cm up (≈11 cm behind the nose), and have the
    retarget hold the face near level.
  - Where to see it: rest side head close-up, every Walk side frame, the Run.
- L and R elbow [minor]: the upper arm is 15.4 cm against a 17.1 cm forearm; the elbow could come ~1 cm down. Rest front.
- R foot in Bolt [minor, known]: the R ball is 1.3 cm up with the heel down in all 6 frames.
- Run (gait) [minor]: 23 cm of flight, and the hips drop 20 cm.
- round 1: there were no blockers or majors.
  - Spine2 moved 4.5 cm forward and the spine is a smooth curve: fixed.
  - The shoulders are mirrored at 21.5 cm: fixed.
  - The knees are 2.0-2.2 cm (1.3%) forward; they were on the line: better.
  - Bolt contact is -0.3 to -0.5 cm: fixed.

totem_master_m_v2: FAIL   score 6
- L and R shoulder joint [major]: both are at 14.0 cm from the spine and 127.9 cm high, on the stole's edge at the inner
  edge of the shoulder pad.
  - The bare upper arm's axis goes in under the pad ~18-21 cm out, so each joint is still ~4-6 cm too far in.
  - The upper-arm bone runs 48° from vertical against the arm's ~34°.
  - Fix: move each joint ~5 cm out to ~19 cm; the height (1.26-1.28 m) is fine.
  - Where to see it: rest front, shoulders close-up. The raised arm in the Bolt now reads clean at game size, so this is
    the last of it.
- head in Walk and Run [minor]: the face is pitched 20-23° further down than at rest in the Walk, and 27-28° in the Run.
- R foot in Bolt [minor, known]: the R ball is 1.1 cm up with the heel down in all 6 frames.
- Run (gait) [minor]: 23 cm of flight, and the hips drop 20 cm.
- round 1:
  - shoulders (major): better, not fixed. They moved from 11 cm to 14 cm out of the ~18-19 cm asked.
  - The minors are all fixed:
    - feet: Bolt -0.2 to -0.7 cm, Walk within 1 cm
    - the R knee mirrored
    - Spine2 and Neck 5.8 cm forward onto the line
    - knees 2.1-2.2 cm (1.3%) forward

wizard_f_v2: PASS   score 7
- knees [minor]: hidden under the gown. By proportion they are still ~2.5 cm too high (thigh 35.7 cm, shin 40.9 cm).
  This is unchanged. Rest front and side.
- balls [minor]: 4.9 cm off the floor, ~2 cm high for a heeled boot. Unchanged. Feet close-up.
- L and R elbow [minor]: the upper arm is 14.7 cm against a 17.2 cm forearm; the elbow could come ~1.5 cm down. Rest
  front.
- Spine2 [minor]: 4 cm below the collarbone roots, so the collarbones rise from it in a V. It could come up ~3 cm. Rest
  front.
- feet in Bolt [minor]: the ankle is 1.4 cm under its rest height (the heel presses in slightly); the R ball is 1.0 cm up
  (known). Bolt side.
- head in Walk and Run [minor]: the face is pitched 16-19° down in the Walk and 23° in the Run, the least in this group.
- (cloth, out of scope) in the Run the gown flares to hip height, rides the legs, and goes 10-26 cm through the floor.
- round 1:
  - hips/feet floating 10-15 cm in motion (blocker): fixed. Bolt ball -0.5 cm; Walk lowest +0.4 to +1.2 cm.
  - The spine zig-zag minor is fixed; the spine is straight now.

wizard_m_v2: PASS   score 7
- L and R shoulder [minor]: still at the top-outer edge of the puffed sleeve, ~2-3 cm too high and too far out. The upper
  arm is 17.2 cm against a 19.1 cm forearm. Unchanged from round 1. Rest front.
- knees [minor]: under the robe. By proportion they are ~2 cm too high (thigh 36.5 cm, shin 42.0 cm). Unchanged.
- ankles [minor]: at 14.5 cm, at the top of the boot shaft, ~2-3 cm high. Rest side, feet close-up.
- head in Walk and Run [minor]: the face is pitched 16-19° down in the Walk and 23° in the Run.
- R foot in Bolt [minor, known]: the R ball is 1.2 cm up with the heel down in all 6 frames.
- Run (gait) [minor]: 23 cm of flight, and the hips drop 21 cm.
- round 1:
  - feet 5 cm off in motion (major): fixed. Bolt 0 to -0.4 cm; Walk within 0.5 cm.
  - L shoulder 5 cm back (major): fixed. The shoulders are mirrored, both 5.0 cm behind the spine line.

wren_v2: FAIL   score 6
- head in Walk and Run [major]: the face is pitched 28-32° further down than at rest through the whole Walk, and 36° in
  the Run. The chin is on the chest in every side frame, where bm's archer walks with a level head. The rest
  Neck-to-Head bone leans back 9°, which the retarget turns into a bow. Hold the head near level. Walk side frames 1-6.
- R foot in Shoot [major, known]: the whole R foot hangs off the floor in frames 2-4 (ankle +1.5 cm, ball +2.4 cm), a
  visible gap, while the L is planted. It is the known right-foot fault; I fail her for it as the brief says. Shoot side
  frames 2-4.
- knees [minor]: 1.9 cm (1.1%) forward, under the refit's own 1.2%. Move them ~0.5 cm forward. Rest side.
- L and R elbow [minor]: the upper arm is 18.0 cm against a 19.9 cm forearm; the sleeve hides the crease. Rest front.
- Run (gait) [minor]: 22 cm of flight, and the hips drop 21 cm.
- round 1: there were no blockers or majors.
  - The shoulders are mirrored: the minor is fixed.
  - The round-1 float through the Shoot (1.6-1.8 cm) is fixed for the L foot but not the R (see above).
  - The (animation) R hand flung back at arm's length in the Shoot is unchanged.

zombie_abbess_v2: PASS   score 6
- shoulder girdle [minor]: low by proportion.
  - The shoulder joints are at 169.8 cm (75% of stature; the reference is 79%), 18.7 cm under the neck joint where bm's
    figures sit ~10 cm under it.
  - The collarbone roots (172.1 cm) are 5.5 cm below Spine2 (177.6 cm), so they hang from it in a V.
  - The joints lie on the A-pose arm's line under the veil, and the Roar arm reads clean, so it is by proportion only.
    Raise the collarbone roots ~5 cm to Spine2; the shoulders could come ~3-4 cm up along the arm.
  - Where to see it: rest front.
- heel in Walk [minor]: the L heel goes ~3 cm through the floor in frame 2 (ankle -4.3 cm), and the R heel ~2 cm in
  frames 4-5. Walk side.
- R foot in Roar [minor, known]: the R toe lifts 2.2-2.7 cm (ball up, heel down) in all 6 frames.
- head in Walk [minor]: the face is pitched 49-53° down. That is the slump plus the systemic head fault. For a dead nun
  it is in character, but the face is gone from the game camera. Walk side.
- Run (gait) [minor]: she runs the living jog with no slump: 29 cm of flight, and the hips drop 29 cm. Run side.
- round 1:
  - R shoulder on the sternum (blocker): fixed. Both shoulders are mirrored at 19.2 cm out, 169.8 cm high, 5.5 cm behind
    the spine.
  - feet 3.7-4.4 cm off the floor (major): fixed. Walk balls +0.1 to +0.2 cm; Roar -0.2 cm.
  - The L elbow minor is fixed: the upper arm is 27.6 cm against a 27.2 cm forearm.

zombie_bonesack_v2: FAIL   score 3
- toes [blocker, known]: the bare toes stretch into long blades through the floor in Walk frames 2 and 4 and in most Run
  frames. The worst is Run frame 4, where the mesh is 9.2 cm under the floor. This is the known toe-spike fault. Walk
  and Run side.
- head [major, known]: still thrown back ~30° in the bind pose. The Walk adds only 2-5°, so the face still looks at the
  sky, and the Roar throws it to ~65° up. This is the known backward head. Rest side, every Walk frame, Roar
  three-quarter frames 2-5.
- R foot in Roar [major, known]: the whole R foot hangs in all 6 frames (ankle +1.5 cm, ball +1.9-2.0 cm). Roar.
- balls [minor]: still 3-4 cm behind the toe roots, up in the arch, and 3.7 cm high. Unchanged. Feet close-up.
- Run (gait) [minor]: 20 cm of flight.
- round 1:
  - head (major): unchanged.
  - The shoulder-height minor is fixed (1.8 cm lower), and the collarbones are mirrored.
  - The knees are good: 3.2-3.7 cm forward.

zombie_brute_v2: FAIL   score 4
- L and R shoulder joint [major, regressed]: both were rebuilt and mirrored to 26.2 cm out, 178.3 cm high and 8.6 cm
  behind the spine line.
  - That is ~6 cm in from the middle of the deltoid, and in the side view ~5-7 cm toward the back of the upper arm.
  - Round 1 had them right (31.7 cm out, 181 cm).
  - Fix: put them back at ~31 cm out, ~1.80 m high, ~2-3 cm behind the spine line.
  - Where to see it: rest front and side, shoulders close-ups.
- feet in motion [major]:
  - Walk: in frames 2-4 the stance foot never flattens. In frame 3 (mid-stance) both ankles are ≥7.5 cm and both balls
    ≥6.4 cm over rest, so the sole is ~3.5 cm off the floor; frames 2 and 4 touch only at a heel.
  - Roar: the R foot is planted, but the L hangs 4.6-5.7 cm up (the whole foot) in all 6 frames.
  - Walk and Roar side.
- head pivot [minor]: still ~20 cm behind the nose tip at the collar strap, ~5 cm behind the base of the skull. Move it
  ~5 cm forward. Rest side.
- collarbone roots [minor]: still 15.9 cm out from the spine. Bring them in to ~4-5 cm. Unchanged. Rest front.
- spine [minor]: Spine2 to Neck is still 20 cm, against the next segment's 15.9 cm. Rest side.
- knees: can't judge. In the front view they are 3.3-3.5 cm inside the hip-ankle line on a wide stance, but they are
  under the skirt.
- Run (gait) [minor]: 33 cm of flight, in 4 of the 5 frames.
- (cloth, out of scope) the skirt goes 6-13 cm through the floor in the Roar and Run.
- round 1:
  - head and neck joints (major): better. The head moved 10 cm forward, and the neck moved 11.3 cm forward to the middle
    of the neck.
  - feet in motion (major): better, not fixed. The R is planted in the Roar and the Walk contact is closer, but see above.
  - The R shoulder mirror is fixed. Mirroring moved the good shoulders, though (see above).

zombie_cinder_v2: FAIL   score 5
- toes [blocker, known]: the bare toes stretch into spikes that poke through the floor in Walk frames 2 and 4, Run
  frames 1, 2 and 4, and Roar frame 3. The worst is Run frame 4, 5.6 cm under the floor. This is the known toe-spike
  fault, and the only thing failing her. Walk and Run side, Roar.
- knees [minor]: 1.5-1.9 cm (0.9-1.1%) forward, under the refit's own 1.2%. Move them ~0.5-1 cm forward. Rest side.
- head in Walk [minor]: the rest Neck-to-Head bone leans back 13.5°, and the Walk bows the head 35-39° (Run 40°). For a
  slumped dead this is acceptable, at the edge.
- R foot in Roar [minor, known]: the R ball is 1.7-2.0 cm up with the heel down in all 6 frames.
- Run (gait) [minor]: 22 cm of flight. The dead run the living jog with no slump.
- round 1:
  - R shoulder 3-4 cm in (major): fixed. It is mirrored at 15.8 cm out, 5.2 cm behind the spine.
  - The collarbone sweep is fixed (~16° back).
  - Walk and Roar contact is fixed (ball -0.2 to +0.3 cm).

zombie_driftling_v2: FAIL   score 3
- L and R elbow [blocker]: both are at 27.0 cm out and 106.1 cm high. That is ~5 cm in from and ~5 cm below the arm's
  real bend at the top of the bandages (~32 cm out, ~111 cm).
  - The upper-arm bone hangs at 22° from vertical where the mesh arm runs at ~40-45°, and the forearm bone cuts under the
    bend.
  - The R was right in round 1 (28.9 cm, 111.8 cm, 39°). Mirroring copied the bad L over it.
  - Fix: put both at the round-1 R spot, ~29-32 cm out at ~111 cm.
  - Where to see it: rest front, shoulders-and-arms close-up; Roar three-quarter.
- push-off toes in Walk [minor]: they dig 1-2 cm into the floor. Walk side frame 4.
- Run (gait) [minor]: 21 cm of flight, and the hips drop 21 cm.
- (cloth, out of scope) the coat goes 7-11 cm through the floor in the Roar.
- round 1:
  - knees between the legs (blocker): fixed. Each is now centred on its kneecap.
  - L elbow (blocker): unchanged (~5 cm in and ~5 cm low).
  - R elbow: regressed by the mirror.
  - The head minor (4.5 cm back) and the L shoulder mirror are fixed.

## Systemic problems, ranked by how many figures they hit

1. The Run reads as a bound, not a jog (12 of 12).
   - Both feet are 20-33 cm off the floor in 3-4 of the 5 frames.
   - The hips drop 16-29 cm, and the thighs split up to ~110°.
   - The dead run the living jog with no slump.
   - The Walk is a high-stepping march (thigh to ~49°, swing knee to 77-85°), though its floor contact is now good
     everywhere but the brute.
   - Compare against bm's jog on bm's own heroes. If bm's reads lighter, the root motion is not scaled to these legs.
2. The head is pitched down in the new Walk and Run (11 of 12; bonesack is tipped the other way).
   - The face is 16-19° below rest on the wizards, 20-27° on squire, stevie and totem_m, and 28-32° on wren. On the dead
     it is 22-39°, and 45-53° on totem_f and abbess.
   - The excess tracks each rig's rest Neck-to-Head back-lean (totem_f 26°, cinder 13.5°, wren 9°). bm's sheets carry
     ~10-15°.
   - It is a major on totem_f and wren and visible on all of the living.
   - Fix: retarget head and neck rotation in the bind's own frame (or cancel the rest lean), so the face sits ≤10-15° down
     from the game camera.
3. The foot rides high in attack clips (known; 10 of 12 have the R foot, and the brute has the L).
   - It is a visible whole-foot hang on wren (+1.5 cm ankle / +2.4 cm ball), bonesack (+1.5/+2.0) and the brute's L
     (+4.6-5.7).
   - Elsewhere it is a 1.0-2.7 cm toe lift with the heel down.
   - Only the driftling is clean (under 1 cm).
4. The upper arm is short against the forearm (6: squire, stevie, totem_f, wizard_f, wizard_m, wren). It is 1-2.5 cm
   short, mostly the mesh's proportion. Minor.
5. Planted feet sink 1.5-4 cm in lunges, push-offs and heel strikes (5: squire and stevie in the Thrust, stevie and
   driftling at push-off, abbess's heels in the Walk). Minor each.
6. Exact mirroring and the shoulder rebuild copy the bad side (3).
   - The driftling's good R elbow became its bad L.
   - The brute's correct shoulders were moved 6 cm in and back.
   - totem_m's were moved only halfway off the stole.
   - These are the only regressions this round. Mirror toward the side a reviewer passed, not toward the one the rebuild
     picks.
7. Toe spikes on the bare-footed dead (known; 2: bonesack, cinder). A blocker wherever it shows; the dead in wraps
   (abbess, driftling) are clean.
8. Knees under the refit's own 1.2% forward (2: cinder 0.9-1.1%, wren 1.1%). Minor.
9. (cloth, out of scope) Gowns, skirts and coats go through the floor in the Run and the attacks (wizard_f 10-26 cm,
   brute 6-13 cm, driftling 7-11 cm).
