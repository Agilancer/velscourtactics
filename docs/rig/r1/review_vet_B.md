# Rig review, round 1, group B: veteran (critic 1)

Method: I read every card, then measured the joint positions in `r1/rest/*.json` and `r1/motion/*.json` (the same data the
cards are drawn from) and overlaid the joints on the clean renders at 2-3x to check them against the mesh. Heights in % are
of the whole model (as on the cards). "z" means front/back in the side view. "Walk float" is the height of the lowest
ankle or ball joint above its standing height, plus the lowest mesh pixel above the floor line, over the 6 sampled frames.

dragoon_f_v2: PASS   score 8
- Spine (lower back) [minor]: kinks 4 cm toward the belly (the Spine joint at 64% sits in front of the hips-to-Spine1 line). Move it back 4 cm onto the line. Side view, rest.
- Knees [minor]: sit only 1.2-1.3 cm in front of the hip-to-ankle line. The reference wants 2-2.5% of stature (3.5-4 cm). Move them forward about 2.5 cm. Side view, rest.
- Walk float [minor, systemic]: both feet are 4.6 cm off the floor at the passing pose (f0/f5). The stance foot gets back to within 1.3 cm at best. Walk side, f0/f5.
- Shoulders, elbows, wrists, head, hips and feet are all good. The elbows bend cleanly in the Run (f0/f3/f4 side), and the knee lift in the Thrust deforms the thigh plate without tearing.
- Cloth note (out of scope): in the Thrust lunge the purple skirt goes about 3.5 cm through the floor.

dragoon_m_v2: PASS   score 8
- Walk float [minor, systemic]: 5.4 cm at the passing pose (f0/f5). The stance ankle comes back to within 1.9 cm, but the soles never get closer than about 3 cm in the sampled frames. Walk side, f0-f5.
- Everything else is good. Shoulder joints sit inside the pauldrons and mirror within 1.5 cm. The spine runs straight up the middle. The head pivot is behind the jaw inside the helm. Knees sit 2-3 cm forward, as the reference asks. Ankles and balls are right on the boots. Front and side, rest.
- Cloth note (out of scope): the skirt goes about 2 cm through the floor in the Thrust lunge.

flint_v2: PASS   score 7
- Feet in Shoot [minor]: both soles hover 2.4-3.9 cm off the floor for the whole Shoot. The knees bend 6-9 cm but the hips don't drop to match. Lower the hips about 2 cm during the clip. Shoot, all frames.
- Knees [minor]: dead on the hip-to-ankle line (+0.2 / -0.5 cm). Move them forward about 3.5 cm. Side view, rest.
- Walk float [minor, systemic]: 4.4 cm at the passing pose, 1.4 cm at best. Walk side.
- Everything else is good. Spine is straight, about a quarter of the way in from the back, which is right for the belly. Head pivot is behind the beard at the jaw. Shoulders mirror within 1 cm. Elbow and wrist sit at the coat cuff. Ankle is over the heel; ball sits at about 69% of the boot length. The raised right arm in Shoot shows no tearing.

ghoul_v2: FAIL   score 3
- Head and neck [blocker]: the ghoul's head juts forward, but its rig neck goes straight up into the hump. The head pivot (88%) sits at the back of the hump, about 17 cm behind the base of the skull, and the neck joint is about 8 cm behind the real neck. Move the head joint forward about 17 cm to just behind the jaw angle, roughly level with the mouth. Move the neck forward about 8 cm onto the line of the neck. As it stands, any head turn swings the whole skull around a point in the upper back. Side view rest (head panel); Rake f2-f3.
- L shoulder joint [major]: 24.3 cm from the spine against 17.3 cm for the R, while the elbows (138/142 px) and wrists mirror. The L joint sits at the skin of the deltoid, and that pre-bends the L elbow 44 degrees against 21 on the R. Move the L shoulder in about 6 cm to mirror the R. Front view, rest.
- Shoulders, front-to-back [major]: the R shoulder joint is 6.5 cm further back than the L. Put both at the centre of the deltoid in the side view. Side view, rest.
- L knee [major]: 3.7 cm higher than the R (32.9% vs 30.8%), which gives thighs of 35.8 vs 40.2 cm. Lower the L knee about 3.7 cm to match the R. Front view, rest (hips and knees panel).
- Ball of the foot [minor]: sits about 4 cm behind the toe roots on the bare foot. Move it forward about 4 cm. Side view, rest (feet panel).
- Walk float [minor, systemic]: 4.8 cm at the passing pose, 1.3 cm at best.
- Spine: follows the hump at about a third of the way in from the back. That's acceptable for this body.

gunner_f_v2: FAIL   score 6
- Walk float [major, systemic]: the soles never reach the floor in any sampled frame. They are 4.4 cm off at best and 7.1 cm at the passing pose (stance ankle at best 3.1 cm above standing height). She glides. This is a heeled boot, and the two heeled figures in this group float the most, so check how the retarget handles a pitched foot. Walk side, f0-f5.
- Feet in Shoot [minor]: soles hover 2.1-2.9 cm off the floor for the whole Shoot. Shoot, all frames.
- Spine2 [minor]: kinks 3-4.5 cm toward the back at the collarbone root (z -2.7 against -7.3 below and -5.0 above). Move it forward about 3.5 cm onto the line. Side view, rest.
- Knees [minor]: on the hip-to-ankle line (+0.3 / +0.7 cm). Move them forward about 3 cm. Side view, rest.
- Everything else is good. Shoulders and arms mirror within 1.5 cm, the head pivot is at the jaw, and the ankle sits over the heel of the heeled boot. Arms deform cleanly when raised in Shoot.

gunner_m_v2: FAIL   score 6
- L shoulder joint [major]: 23.4 cm from the spine against 15.1 for the R, while the elbows (191/197 px) and wrists mirror. The L joint sits at the outer edge of the shoulder cape, which makes the L upper arm almost vertical and pre-bends the L elbow 36 degrees (R 18). Move it in about 8 cm to mirror the R. It is also 3 cm in front of the R in the side view, so match the depth too. Front view, rest (shoulders panel).
- Knees [minor]: on the hip-to-ankle line (-0.3 / 0 cm). Move them forward about 3.5 cm. Side view, rest.
- Walk float [minor, systemic]: 3.7 cm at the passing pose. The stance foot does reach the floor.
- Everything else is good. The spine is straight, the head pivot sits behind the jaw at ear level, the feet are good, the Shoot plants both feet, and the raised R arm deforms cleanly.

homunculus_v2: PASS   score 7
- Neck [minor]: the neck joint sits about 5 cm behind the middle of the neck, at the back of the gorget, so the Spine2-to-neck bone leans back about 40 degrees. Move the neck forward about 5 cm. Side view, rest (head panel).
- Feet in Swing [minor]: soles hover 1.6-2.7 cm off the floor for the whole Swing. Swing, all frames.
- Walk float [minor, systemic]: 5.1 cm at the passing pose. The ankle gets back to within 1.5 cm, but the soles stay at least 3.9 cm up in the sampled frames.
- Knees [minor]: only 1.2 cm in front of the hip-to-ankle line. Move them forward about 3 cm.
- Upper arm and forearm [minor, can't fully judge]: upper arm 22-24 cm against forearm 28-29 cm, so the elbow is short of the reference proportion. It sits at the top of the leather bracer, and the arms deform cleanly in the Run, so I'm not moving it on proportion alone. Check it against the elbow crease.
- Everything else is good. Shoulder joints sit inside both pauldrons and mirror. The head pivot is behind the jaw. Proportions are spot on: hip 0.525, knee 0.31, shoulder 0.79, head 0.875.

ismene_v2: FAIL   score 5
- L knee [major]: 3.3 cm higher than the R (31.8% vs 29.9%), which gives thighs of 36.7 vs 39.4 cm and shins of 41.1 vs 38.2 cm. Lower the L knee about 3.3 cm to match the R. It's hidden under the coat, but it will skew the stride and the cloth collision later. Front view, rest (hips and knees panel).
- Walk float [major, systemic]: the stance foot never comes back to the floor. It is 3.2 cm up at best and 6.5 cm at the passing pose. She is heeled, like gunner_f. Walk side.
- Spine and Spine1 [minor]: bowed 3.6-4.9 cm toward the front of the chest (forward of the hips-to-neck line), so the spine runs through the front half of the bodice. Move them back about 4-5 cm. Side view, rest.
- R shoulder joint [minor]: about 3-4 cm closer to the spine than the L (10.3 vs 14.9 cm), while the shawl's shoulder tops mirror. Move it out about 3 cm. Front view, rest.
- Feet in Bolt [minor]: about 1.7 cm hover through the Bolt.
- Cloth note (out of scope): the gown's trailing tails go 4 cm through the floor in the Walk and 8-9 cm in the Bolt.
- Good: the head pivot is behind the jaw, the ankles sit over the heels, and the balls are right.

jamie_v2: PASS   score 8
- Knees [minor]: only 0.3-1.1 cm in front of the hip-to-ankle line. Move them forward about 3 cm. Side view, rest.
- Shoulders, front-to-back [minor]: the R shoulder joint is 2.2 cm behind the L. Even them up. Side view, rest.
- Walk float [minor, systemic]: 3.7 cm at the passing pose. The stance foot does reach the floor.
- The cleanest rig in this group. Every proportion falls inside the reference (hip 0.52, knee 0.30, shoulder 0.785, head 0.87, upper arm 0.13, forearm 0.135). The spine is straight. The head pivot sits behind the jaw under the ear. The Throw plants both feet. The coat moving with the legs is out of scope.

jasper_v2: PASS   score 7
- Head pivot [minor]: sits about 3 cm low, just under the chin at the top of the shirt collar. Raise it about 3 cm to behind the jaw angle, around ear-lobe height. Side view, rest (head panel).
- Neck [minor]: sits about 3 cm behind the middle of the neck, at the back of the high collar, which leaves Spine2 4.3 cm in front of the hips-to-neck line. Move the neck forward about 3 cm. Side view, rest.
- Knees [minor]: 0.5-0.7 cm behind the hip-to-ankle line. Move them forward about 4 cm to reach the reference. Side view, rest.
- Walk float [minor, systemic]: 3.2 cm at the passing pose. The stance foot reaches the floor.
- Everything else is good. Shoulders mirror, the arms are good, ankles and balls are right on the boots, and the Strum plants both feet.

kestrel_v2: PASS   score 7
- Spine2 [minor]: kinks 4.7 cm toward the back at the shoulder-blade line. Move it forward about 4.5 cm onto the line. Side view, rest.
- L shoulder joint [minor]: 2.7 cm further from the spine than the R (16.5 vs 13.8 cm). Move it in about 1.5 cm and the R out about 1 cm. Front view, rest.
- Knees [minor]: 0.4-0.5 cm behind the hip-to-ankle line. Move them forward about 4 cm. Side view, rest.
- Walk float [minor, systemic]: 4.3 cm at the passing pose, 1.2 cm at best.
- Everything else is good. The head pivot is behind the cheek guards at the jaw, feet are good, and the Thrust's high knee lift deforms cleanly.

lancer_f_v2: FAIL   score 5
- Shoulder joints [major]: not mirrored. The R joint is 12.1 cm from the spine, the L 26.0 cm, while the elbows (198/200 px) and wrists (303/307 px) mirror. The R joint sits inside the chest plate, so the R upper arm runs at 53 degrees through the breastplate's side. The L joint sits out on the pauldron, so the L upper arm hangs at 22 degrees. Move the R out about 7 cm and the L in about 7 cm, to about 19 cm either side under each pauldron's centre. Front view, rest (shoulders panel).
- Walk float [minor, systemic]: 6.2 cm at the passing pose. The ankle gets back to within 2.9 cm, but the soles reach about 0.9 cm.
- L knee [minor]: 1.2 cm behind the hip-to-ankle line (the R is 0.7 cm in front). Move both forward about 3-4 cm. Side view, rest.
- Good: spine straight up the middle, head pivot at the bottom of the great helm, and the ankles and balls sit right in the sabatons.
- Cloth note (out of scope): the tabard goes about 3.4 cm through the floor in the Thrust lunge.

lancer_m_v2: FAIL   score 4
- Knees [major]: 5.4-6.7 cm behind the hip-to-ankle line. The rest leg bows backward (hyperextended), and the pivot sits at the back of the knee, not under the knee cop. Move both knees forward about 8 cm, so they sit 2-4 cm in front of the line in the middle of the poleyn. Side view, rest (hips and knees panel).
- Shoulder joints [major]: not mirrored in depth or width. The R joint is 4.4 cm behind the spine line at the back edge of the pauldron; the L is 5.4 cm in front of it. That's 9.8 cm apart front-to-back. Width is off too: R 29.1 cm from the spine against L 23.9 cm, while the elbows and wrists mirror. Move the R forward about 5 cm and in about 2.5 cm, and the L back about 5 cm and out about 2.5 cm, to meet at the centre of the arm under each pauldron. Side and front views, rest (shoulders panel).
- Walk float [minor, systemic]: 7.2 cm at the passing pose, the worst in the group. The ankle stays at least 3.2 cm up, but the soles reach about 2 cm.
- Good: spine straight, head pivot at the bottom of the helm, feet right in the sabatons.
- Cloth note (out of scope): the tabard goes about 5 cm through the floor in the Thrust lunge.

lily_v2: FAIL   score 3
- Whole figure off the floor [blocker]: in every clip the root is 8-15 cm too high. Walk soles are 10.8-15.2 cm off the floor, Run 8.3-18.9, and even the standing Bolt 8.4-9.4 (hips 9-10 cm above standing height). In the rest pose she stands on the floor. This is a root or hips offset in the retarget, not the joint fit. Every clip, side view; drawing the floor line under Bolt f2 and Walk f3 shows it plainly.
- Head pivot [major]: sits at the front of the veiled face, about 7 cm in front of the base of the skull (at chin height). Move it back about 7 cm. Side view, rest (head panel).
- Spine [minor]: the Spine joint bows 4.9 cm toward the belly. Move it back about 5 cm. Side view, rest.
- Collarbones [minor]: the collarbone roots sit 6 cm in front of the shoulder joints, which puts a V in the clavicle chain. Move them back about 5 cm. Side view, rest (shoulders panel).
- Wrists [minor]: the R forearm is 2.7 cm longer than the L (23.4 vs 20.7 cm), and the R wrist is 2.4 cm lower. Mirror the L. Front view, rest.
- Feet [can't judge]: the gown hides the shoes. The ankles sit at 9.7/10.6 cm, about 4 cm lower than the rest of the cast, and 0.9 cm apart L to R. Hips and knees are fine, with knees 3.3-3.6 cm forward as the reference asks.

lisandra_v2: FAIL   score 2
- Whole figure off the floor [blocker]: the same root offset as Lily. The gown hem hangs 13.8-18.6 cm off the floor in the Walk, 13-29 cm in the Run and 8 cm in the standing Bolt (ankles 12.8 cm above standing height, hips +8-14 cm). In the rest pose the hem is on the floor. Every clip; the floor line under Bolt f2 and Walk f2 shows it.
- Head pivot [blocker]: sits on the face at nose height (80.1%), about 8 cm in front of and about 4 cm above the base of the skull, and the head bone is only 3 cm long. Move it back about 8 cm and down about 4 cm to behind the jaw angle (about 77-78%). Side view, rest (head panel).
- Spine chain [major]: the Spine joint sits 4 cm toward the belly. Spine1, Spine2 and Neck are bunched into 6 cm (71.1 / 73.3 / 74.7%) after an 18 cm gap from Spine. Spine1 is about 8 cm too high and Spine2 about 3 cm too high, and the chain zig-zags back to the shoulder blades and then forward again, with the neck at the front of the throat. Space them evenly up the middle of the back: about 61.5 / 66 / 70.5%, neck about 3 cm further back. Side view, rest.
- R arm [major]: the R shoulder joint is 9.3 cm from the spine against 14.7 cm for the L, and the R elbow is 19.8 cm against 25.3 cm, while the wrists and hands mirror. Move the R shoulder and elbow out about 5 cm. Front view, rest (shoulders panel).
- R knee [major]: bowed about 5 cm outward of the hip-to-ankle line; the L is straight. Move it in about 5 cm. It's hidden under the gown, but it will splay the R stride and push the cloth collision out of shape. Front view, rest (hips and knees panel).
- Collarbone roots [minor]: the L and R roots are 2.6 cm apart front-to-back.
- Feet [can't judge]: the gown covers the boots completely. The ankles are only 8 cm apart.

## Systemic

1. Walk root height, retarget [major across the board]: in the library walk, the hips rise 3-7 cm above standing height at the passing pose and both feet leave the floor on every figure. On gunner_f, ismene and lancer_m the stance foot never gets back down (2-4 cm at best). The two heeled figures, gunner_f and ismene, float the most, so check how a pitched foot is retargeted. Fix the hips translation, scaled by the hip-height ratio and grounded by the lowest foot, before bm's walk goes on, or the new walk will float too.
2. Lily and Lisandra carry an extra 8-15 cm root offset in every clip, including the in-place Bolt. They are the only two that do, so look for a stale per-figure hips offset.
3. Attack clips that bend the knees without lowering the hips leave the feet hovering 2-4 cm: flint Shoot, gunner_f Shoot, homunculus Swing, ismene Bolt.
4. Shoulders are fitted per side and not mirrored. On gunner_m, lancer_f, lancer_m, ghoul and lisandra, one shoulder joint is 5-14 cm off its twin while the elbows and wrists mirror, so the bad side sits either on the pauldron or cape edge or inside the chest plate. Enforce L/R symmetry, or mirror the side that matches the elbow line.
5. Knees sit on the hip-to-ankle line (about -0.7 to +1.3 cm) on most figures, against the reference's 2-2.5% of stature (3.5-4.5 cm) forward. lancer_m's knees are 5-7 cm behind it. That's harmless for FK playback but wrong for IK, leg poles and the new walk. Give every knee a consistent forward offset.
6. Spine2 or Neck kinks 4-7 cm toward the back on kestrel, gunner_f, homunculus and jasper. The lower Spine bows 4-5 cm toward the belly on dragoon_f, ismene, lily and lisandra. Fit the spine at even spacing to the back third of the torso.
7. Head pivots are right on every upright head but fail on the unusual ones. The ghoul's forward-thrust head is pivoted in the hump; lily's and lisandra's veiled or hat-shadowed faces are pivoted on the face. The fitter seems to assume an upright neck and a visible jaw, so fit these to the skull.
8. Upper arms come out shorter than forearms on most figures (ratio 0.6-0.9 against the reference's longer upper arm). The elbows still bend cleanly in the Run, so I haven't failed anyone on it, but check dragoon_f, kestrel, homunculus and ghoul against the mesh's elbow crease.
9. Gait, one line: the library walk hops at the passing pose and kicks the shin up to near-horizontal behind. bm's hero walk keeps the hips level and a foot planted, so the replacement can't come soon enough.
10. Cloth, out of scope: skirts, tabards and gown tails go 3-9 cm through the floor in lunges and casts (dragoon_f/m, lancer_f/m Thrust, ismene Bolt and Walk).
