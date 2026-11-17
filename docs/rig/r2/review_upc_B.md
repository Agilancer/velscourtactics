# Rig review r2, group B: critic 2 (up-and-comer)

How I read the cards: motion frames are counted 1-6 left to right. Floor contact comes from each side render's alpha
measured against the card's floor mark, and joint heights come from the motion JSONs. "Head pitch" is the angle of the
Head-to-HeadTop bone in the side view minus its rest angle (+ = chin down). cm offsets are from the midline in the front
view and from the hip joint's vertical in the side view (+ = forward); % is of the whole model's height. My round-1
verdicts are in tools/build/rig/r1/review_upc_A.md (the dragon knights) and review_upc_B.md (the rest); docs/rig/r1/
does not exist.

dragon_knight_f_v2: PASS   score 7
- head carriage [minor]: in the new Walk the head pitches 16-19 deg chin-down, and 23 deg in the Run (round 1: level). That is the smallest drop in the group, because her rest neck is nearly upright (+4 deg). See systemic 1. Walk side frames 1-6.
- feet in Swing [minor]: the L ankle sits 0.9-1.7 cm below its rest height (the heel sinks slightly), and the R ball rides 1.5-2.7 cm high (a known item: the right foot high in attacks). Swing frames 1-6, from the JSON; too small to see on the card.
- hidden feet [minor]: they are not quite mirrored. The L ankle is 20.8 cm from the midline and the R 17.5 cm; the L knee is 14.9 cm and the R 12.8 cm. Mirror them per the brief. Front rest view.
- Out of scope: the gown hem goes 7-16 cm under the floor in the Walk (worst in frame 4), the Swing (all frames) and the Run (19 cm in frame 4).
- round 1: the feet/root-float blocker is fixed (the planted boot stays within 1 cm of its rest height through the Walk, with no hover in the Swing). The minors are fixed too: the ankle mismatch (both at 7.6%), the spine and neck jog (all within 0.2 cm of a straight line) and the shoulders (mirrored at 15.8 cm).

dragon_knight_m_v2: FAIL   score 5
- head carriage [major]: the head drops 41-45 deg chin-down through the whole Walk and 48-49 deg in the Run, so the visor points at the floor about a metre ahead (Walk side frames 1-6, Run side frames 1-6). In round 1 it stayed within -4..+2 deg. Cause: his rest Neck-to-Head bone leans back 22 deg (the Neck is 3.2 cm and the Head 6.3 cm behind the hips). The new retarget swings that bone to the clip's +14-16 deg and carries the head with it. This is the worst in the group. Fix it in the retarget (systemic 1). On the rig side, putting the Neck back under the Head (-6.1 cm, where round 1 had it) would make the bone vertical.
- tail [major, known item: dragon_knight_m's tail]: the tail rides the legs. It swings between them with each stride and its spikes hang to the floor (Walk three-quarter frames 1, 3 and 6, Run side frames 1-6).
- R knee [minor]: 1.5 cm (0.8%) in front of the hip-ankle line, under the brief's 1.2% minimum; the L is 2.3 cm (1.2%). Rest side view.
- Swing [minor]: the R foot is 0.9-1.6 cm high (known item). The L arm still folds across the chest instead of swinging (the clip, as in round 1).
- round 1: the spine major is fixed (the 40 deg kink at Spine1 is gone, and Spine to Spine2 lie within 1.1 cm of a smooth curve). The L/R knee and elbow minors are fixed (mirrored), and the Walk float is fixed (boots at 0 to -1.6 cm). The Swing arm fold is unchanged (it is the clip).

dragoon_f_v2: FAIL   score 5
- head carriage [major]: 28-31 deg chin-down through the Walk and 35 deg in the Run, so the helmet's face looks at the ground (Walk side frames 1-6). Her rest Neck-to-Head bone leans back 8 deg.
- trailing sabaton in the Run [major]: at push-off a thin needle of mesh shoots 20-30 cm out of the toe of the trailing foot, pointing down and forward (Run side frames 1, 3 and 5). A 4-5 cm version shows in Walk side frame 2. It looks like toe-tip vertices weighted to the wrong bone, dragged when the toe bends. Check the sabaton tip's weights (ToeBase against Foot/Leg).
- Thrust [minor]: the R foot starts and ends 1.4 cm high (known item). The clip is still the knee-to-hip hop with both forearms held out; swap it.
- The rig underneath is clean. The spine is within 0.4 cm of the line, the shoulders are mirrored at 20.1 cm, and the knees are 2.8-3.2 cm (1.6-1.8%) forward. The ankle is at 7.8% and the ball at 2.2%. The elbow sits in the couter gap and the wrist at the gauntlet cuff.
- Out of scope: the cape hem goes 3-6 cm under the floor in Thrust frames 2-5, and the cape rides the legs in the Run.
- round 1: there were no blockers or majors. The Spine jog minor is fixed, and the Walk float minor is fixed.

dragoon_m_v2: PASS   score 7
- head carriage [minor, on the line]: 22-25 deg chin-down through the Walk (worst in frames 2 and 5) and 29 deg in the Run.
- trailing sabaton in the Run [minor]: the pointed toe curls down into a talon at push-off (Run side frames 3 and 5). It holds its shape, with no stretch like dragoon_f's.
- Thrust [minor]: the R foot is 1.6 cm high in frames 1 and 6 (known item). It is still the knee-hop clip.
- Everything else is in place. The spine is on the line (within 0.1 cm), the shoulders are mirrored at 19.2 cm, and the knees are 3.4-3.6 cm (1.8-1.9%) forward. The ankle is at 8.3% and the ball at 2.3%.
- Out of scope: the cape goes 8-9 cm under the floor in Thrust frames 3-4.
- round 1: there were no blockers or majors. The Walk float is fixed.

flint_v2: FAIL   score 3
- boots in the Run [blocker]: at push-off the boot toe stretches into a curved blade that reaches 25-35 cm past the ball joint. The trailing foot does it in Run side frames 1, 3 and 5 and Run three-quarter frames 1, 3 and 5, and the leading boot flattens into a flipper in frames 1 and 5. This is round 1's toe hook made much worse by the jog's hard toe bend. The ball joint is right at rest (2.4%, at the sole's bend), so the fault is in the skin weights: the long toe and flared sole are weighted to ToeBase too far back. Weight the toe cap to ToeBase only in front of the ball, and cap the toe bend for stiff boots.
- head carriage [major]: 31-35 deg chin-down through the Walk and 39 deg in the Run; the hat brim points at his boots (Walk side frames 1-6). His rest Neck-to-Head bone leans back 12 deg.
- Shoot [minor]: the R foot is 1.4-1.9 cm high (known item). Otherwise the whole clip now sits on the floor.
- Out of scope: the R coat cuff still hangs as a flat flag under the raised forearm (Shoot three-quarter frames 2-4).
- round 1: there were no blockers or majors. The Shoot hover is fixed (+0.3 cm), and so is the Walk float. The toe hook is fixed in the Walk, but the problem is now far worse in the Run (above).

ghoul_v2: FAIL   score 5
- posture in Walk and Run [major]: the hunch is straightened out of him. The torso goes from 14 deg forward at rest to 4 deg, the neck from 57 deg to 14 deg, and the head tips 35-39 deg back. He walks bolt upright with his jaw to the sky (Walk side frames 1-6; the head is -30 deg in the Run). The hunch only comes back in the Rake. From the iso camera he now reads as a man in a sheet. This has the same cause as the heroes' head drop (systemic 1), in the other direction. Keep his rest posture (a retarget relative to rest) or give him the slumped walk of the dead.
- toes in the Run [major, known item: toe spikes on the bare-footed dead]: the toenails stretch into 10-12 cm needles at push-off (Run side frames 1, 3 and 5).
- head pivot [minor]: it is now in the skull but at its back, about 4 cm behind the base of the skull and 1-2 cm low. HeadTop_End stops at 91% height while the crown is near 99%. Move the Head about 4 cm forward and run the head bone to the crown. Head side close-up.
- Rake [minor]: the R foot is up to 2.5 cm high (known item).
- Out of scope: the rag on the R forearm rides up with the arm into a 60 cm streamer (Rake frame 2).
- round 1: the head/neck blocker is fixed (the pivot moved 16 cm forward, out of the hump and into the skull). The L shoulder major is fixed (both at 19.3 cm), and the knee-height major is fixed (both at 31.8%). The ankle minor is unchanged at 7.9%, though it reads acceptably over the heel now.

gunner_f_v2: PASS   score 7
- head carriage [minor]: 20-23 deg chin-down in the Walk and 27-28 deg in the Run, with the neck jutting forward over the collar (Walk side frames 1-6).
- knees [minor]: only 0.5-0.8 cm (0.3-0.4%) in front of the hip-ankle line, under the brief's 1.2%; they are centred in the leg from the front. Rest side view.
- upper arm [minor]: 18.5 cm against a 22.7 cm forearm. The elbow sits at the top of the gauntlet cuff, which looks right, so this is probably the mesh. Shoulders and arms close-up.
- Shoot [minor]: the R foot is 1.7-2.3 cm high (known item).
- round 1: there were no blockers or majors. The Spine2 jog is fixed, the Shoot hover is fixed (the clip is planted at -0.7 cm now), and the Walk float is fixed.

gunner_m_v2: PASS   score 8
- head carriage [minor]: 17-20 deg chin-down in the Walk and 24-25 deg in the Run (Walk side frames 1-6).
- trailing boot in the Run [minor]: the toe pinches into a 3-4 cm point at push-off (Run side frame 1).
- Shoot [minor]: the R foot is 1.9-2.5 cm high (known item). The raised R arm keeps the shoulder intact through frames 2-4.
- Clean otherwise. The shoulders are mirrored at 17.1 cm, and the elbows and wrists sit at the sleeve and the gauntlet. The knees are 2.0-2.1 cm (1.1-1.2%) forward, the ankle is at 8.0% and the ball at 2.3%.
- round 1: the L shoulder major is fixed (both at 17.1 cm, both upper arms 23.1 cm). The shoulder-depth minor is fixed (both at -6.8 cm), and the Walk float is fixed.

homunculus_v2: FAIL   score 5
- head carriage [major]: 38-41 deg chin-down in the Walk and 45-46 deg in the Run: his chin rests on his chest and the beard is pushed into the gorget (Walk side frames 1-6). His rest Neck-to-Head bone leans back 19 deg.
- head pivot [minor]: unchanged from round 1, at the bottom of the beard about 1-2 cm below the chin line (82.1%). Raise it about 2 cm. Head close-ups.
- knees [minor]: 1.2-1.6 cm (0.6-0.8%) forward, under the 1.2% minimum. Rest side view.
- Swing [minor]: the R foot is 1.4-2.4 cm high (known item).
- round 1: there were no blockers or majors. On the shoulder-depth minor, the numbers are unchanged (-7.4 cm), but on this card the joint reads as centred under the banded rerebrace (side shoulders close-up), so I withdraw it. The neck jog is fixed (the Neck moved 4 cm forward onto the curve). The head minor is unchanged, and the Walk float is fixed.

ismene_v2: PASS   score 7
- head carriage [minor]: 16-20 deg chin-down in the Walk and 23-24 deg in the Run.
- Bolt feet [minor]: the L ankle is 1.2 cm below rest (the heel sinks slightly), and the R foot is 1.5 cm high (known item). Numbers from the side JSON.
- upper arm [can't judge: the mantle hides the deltoid]: it is 15.9 cm against an 18.3 cm forearm (0.092 of height, the shortest in the group). Check that the shoulder joint isn't 2-3 cm too far in. Shoulders and arms close-up.
- knees [minor]: 1.2-1.9 cm (0.7-1.1%) forward.
- Out of scope: the coat tails drag 7-12 cm under the floor (all Bolt frames, Walk frames 1, 3 and 4) and 22 cm in Run frame 4.
- round 1: the knee-height major is fixed (both at 30.9%). The R shoulder minor is fixed (15.3 / 15.4 cm), and the Walk float is fixed.

jamie_v2: PASS   score 7
- head carriage [minor, close to major]: 21-24 deg chin-down in the Walk and 28-29 deg in the Run; he walks studying the floor (Walk side frames 1-6).
- head pivot [minor]: unchanged at 86.4% (2 cm under the reference 87.5%; no hat). Head close-ups.
- Throw [minor]: the R foot is 1.5-2.4 cm high (known item).
- His is still the cleanest fit in the group. The spine is straight and the shoulders are mirrored at 18.2 cm. The knees are 2.7-3.3 cm (1.5-1.8%) forward, the ankle is at 7.8% and the ball at 2.3%. The overhead Throw (frames 4-5) keeps the shoulder intact.
- round 1: there were no blockers or majors. The shoulder minor is fixed, the head minor is unchanged, and the Walk float is fixed.

jasper_v2: FAIL   score 6
- head carriage [major]: 26-30 deg chin-down in the Walk and 33-34 deg in the Run, so the hat brim hides his face from the camera (Walk side frames 1-6). His rest Neck-to-Head bone leans back 7 deg.
- trailing boot in the Run [minor]: the soft boot's toe pinches into a 4-5 cm point at push-off (Run side frames 3 and 5).
- Strum [minor]: the R foot is 1.6-2.2 cm high (known item).
- round 1: the head major is better. The pivot moved up 3.0 cm and back 1.0 cm, out of the collar onto the chin line behind the jaw, which is where the other figures' pivots sit. The neck jog is fixed, and the Walk float is fixed.

kestrel_v2: FAIL   score 6
- head carriage [major]: 28-31 deg chin-down in the Walk and 35-36 deg in the Run; the helmet's face points at the ground (Walk side frames 1-6). Her rest Neck-to-Head bone leans back 8 deg.
- trailing boot [minor]: at toe-off in the Walk the boot tip dips 3.6 cm through the floor (Walk side frame 4). In the Run the toe folds into a hook at push-off (Run side frames 3 and 5).
- Thrust [minor]: the R foot is 1.4 cm high in frames 1 and 6 (known item). It is still the knee-hop clip.
- round 1: there were no blockers or majors. The Spine2 jog is fixed, and the shoulders are fixed (mirrored at 16.9 cm). The knees are better (2.2-2.3 cm, 1.2% forward, against round 1's on-the-line), and the Walk float is fixed.

## Systemic (ranked by how many figures they hit)

1. Heads pitch down in the new Walk and Run: 13 of 13 (major on dragon_knight_m, homunculus, flint, dragoon_f,
   kestrel and jasper; minor on the other six; reversed on the ghoul). This is a round-2 regression: in round 1 every
   Walk head stayed within -4..+2 deg. The head's change is always the neck bone's change plus about 6 deg. The retarget
   gives the Neck bone the clip's world direction (+14-16 deg in the Walk, +28-33 deg in the Run, the same on every
   figure), and the Head rides along. So the further a figure's rest neck leans back, the further its head drops:
   dragon_knight_m (rest Neck-to-Head -22 deg) 41-45 deg, homunculus (-19) 38-41 deg, flint (-12) 31-35 deg, down to
   dragon_knight_f (+4) at 16-19 deg. The ghoul (+57) goes the other way: 35-39 deg back, and it loses its hunch. The
   round-2 spine smoothing made this worse by moving the Necks forward (homunculus 4.0 cm, dragon_knight_m 2.9 cm,
   jasper 2.7 cm), which tips those bones back. The attacks are unaffected (+14..+21 deg, the same as in round 1).
   Fix it in the retarget: carry the clip's Neck and Head rotation relative to each skeleton's rest, or hold the head's
   world orientation as round 1 did.
2. The right foot is high in attack clips: 13 of 13 (a known item). The R ball sits 1.4-2.7 cm above its rest height,
   and the L heel sometimes sinks 1-1.7 cm (dragon_knight_f, ismene). By the brief's rule this fails every figure. I
   graded it minor on its own, since it is the same size as the Shoot hovers I passed in round 1. So the PASS lines above
   mean "passes apart from this known item".
3. The Run bounces: 13 of 13 (gait). The Hips joint travels 20-23 cm (jamie: 80 to 102 cm against 100 cm standing).
   In 3 of the 5 sampled poses (frames 1, 3 and 5) the whole body is 4-22 cm off the floor on every figure without a
   gown, and frame 4 drops into a deep lunge with the knee bent 120 deg. It reads as bounding, not a jog; a jog's pelvis moves 6-9 cm. With the head drop on top, the Run is
   the weakest clip. The Walk, by contrast, is a big step up from round 1's Mixamo walk: heel strike, a roll through the
   ball and a 4 cm pelvis bob. The planted boot stays within 0 to -2 cm of the floor on every figure (it never hovers),
   and the knees bend forward.
4. Toes stretch at the Run's push-off: 7 of 13. The jog points the trailing foot nearly vertical and bends the toe hard,
   and long or stiff toes tear. Flint's toe becomes a 25-35 cm blade (blocker), dragoon_f grows a 20-30 cm needle
   (major) and the ghoul's toenails become 10-12 cm needles (known item). gunner_m, jasper, kestrel and dragoon_m get
   3-5 cm pinches or hooks. Cap the ToeBase bend for boots and sabatons, and check the toe-tip weights.
5. Upper arms are shorter than forearms on 10 of 13 (for example ismene 15.9 / 18.3 cm, gunner_f 18.5 / 22.7 cm,
   jasper 18.0 / 21.4 cm). The reference has them equal or longer. Most elbows look right on the mesh, so this is mostly
   the meshes; ismene's can't be checked under her mantle.
6. Knees are under the 1.2% minimum on 4 of 13: gunner_f 0.3-0.4%, homunculus 0.6-0.8%, ismene 0.7-1.1% and
   dragon_knight_m's R knee at 0.8%. This is harmless for FK clips.
7. Clips, not the rig: the Thrust (both dragoons and kestrel) is still the knee-to-hip hop with the arms held out, so
   swap it. The dragon knights' Swing folds the arms across the chest with no arc.
8. What got fixed across the group: every round-1 L/R mismatch in shoulders, knees and ankles is now mirrored (ghoul,
   gunner_m, ismene, jamie, kestrel and both dragon knights). Every spine and neck jog now lies on a smooth line (within
   1.1 cm). The ghoul's head is out of the hump, and the Walk and idle float is gone. Can't judge: foot sliding (the
   frames are rendered in place) and candy-wrapper twist at the wrists (the frames are too small). I saw no collapse in
   the attack frames I zoomed on (gunner_m, gunner_f, flint, jamie, both dragon knights, homunculus).
