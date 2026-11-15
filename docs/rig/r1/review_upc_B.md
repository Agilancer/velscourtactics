# Rig review r1, group B: critic 2 (up-and-comer)

How I read the cards: motion frames are counted 1-6 left to right as on the card. "Float" is the gap between the lowest
point of the mesh and the floor in the side render, measured from the render's alpha against the card's floor mark, and
checked by eye with a floor line drawn in. Joint numbers come from the rest JSONs: heights are a % of the whole model,
and cm offsets are from the midline (front view) or from the hip joint's vertical (side view, + = forward). The Walk
float pattern is the same on all 15 figures, so it is listed once under systemic and only called out per figure where a
figure is clearly worse.

dragoon_f_v2: PASS   score 7
- Spine (lowest spine joint) [minor]: about 4 cm forward of the line from Hips to Spine1, which makes a "<" kink in the belly; move it back ~4 cm onto the line. Shown in the rest side view and the shoulders/arms side close-up.
- Feet [minor]: the Walk floats 5.4 cm at frames 1/6 and 1.3 cm at best (systemic, see below).
- Arms: the elbow sits in the gap between the rerebrace and the couter, and the wrist sits where the gauntlet begins. The upper arm is short (17 cm against a 24 cm forearm), but that comes from the mesh, not the joints.
- Out of scope: the cape hem dips about 5 cm under the floor in Thrust frames 2-5, and the cape rides with the legs in the Run.

dragoon_m_v2: PASS   score 8
- Feet [minor]: the Walk floats 5.8 cm at frames 1/6 and 2.6 cm at best (systemic).
- Nothing else found. The spine is straight up the middle. The knees sit 2.0-2.9 cm in front of the hip-ankle line (among the closest to the reference). Shoulders are symmetric (18.0 / 17.5 cm). Ankle and ball are in the right places in the boot. The Thrust knee lift keeps the tassets and the hip intact.
- Out of scope: the cape, as on dragoon_f.

flint_v2: PASS   score 7
- Root/feet [minor]: the whole Shoot clip hovers 2.4 cm (the boots never touch the floor in any frame). The Walk floats 4.7 cm at frames 1/6. Lower the root about 2.4 cm for this figure. Shown in the Shoot side renders.
- Ball/toe [minor]: at toe-off the boot toe folds about 60 degrees into a hook (Walk side frames 3 and 5). That comes mostly from the Mixamo clip. Check that the ball joint is not forward of the sole's bend line (it looks right at rest).
- Out of scope: the R coat cuff flares into a flat 20 cm flag under the raised forearm (Shoot three-quarter frames 2-4).

ghoul_v2: FAIL   score 3
- Head/neck [blocker]: the Head and Neck joints sit in the hump of the upper back, not in the head. The face is 31 cm in front of the Head joint. The pivot is about 15-20 cm behind the base of the skull and should move forward to about the back of the jaw (side view, roughly 87-88% height). Every nod or turn will swing the face through a big arc and drag the hump. Shown in the rest side view, the head side close-up and the Walk side frames (the chain draws well behind the head).
- L shoulder joint [major]: 24.3 cm from the midline against 17.3 cm for the R. It sits on the outer skin of the L upper arm. The elbows and wrists are symmetric, so the mesh is too. Move the L shoulder in about 6 cm to mirror the R. Shown in the rest front view and the shoulders/arms close-up.
- Knees [major]: the L knee is 3.7 cm higher than the R (57.6 cm against 53.9 cm), but the kneecaps in the mesh are level. Put both at about the L kneecap centre (about 32% height) or meet in the middle. Shown in the rest front view and the hips/knees close-up.
- Ankle [minor]: about 2 cm above the ankle bone of the bare foot (the dot is at the shin-foot junction). Lower it about 2 cm. Shown in the feet side close-up.
- The elbows are fine: the bare forearm muscle begins right under the dot. The long forearms belong to the mesh.

gunner_f_v2: PASS   score 7
- Spine2 [minor]: 4.5 cm behind Spine1, a backward jog at the chest; put it on the line. Shown in the rest side view.
- Root/feet [minor]: the whole Shoot clip hovers 2.6 cm and the boots never touch. The Walk floats 6.5 cm at frames 1/6, the worst of the non-gown figures. Lower the root about 2.5 cm. Shown in the Shoot side renders and the Walk side frames 1/6.
- Everything else sits in the right place: elbow at the top of the gauntlet cuff, wrist where the hand starts, ankle over the boot heel, ball at the sole bend.

gunner_m_v2: FAIL   score 5
- L shoulder joint [major]: 23.4 cm from the midline against 15.1 cm for the R (L collarbone 0.108 against 0.079). It sits on the outer edge of the shoulder at the sleeve seam, while the elbows and wrists are symmetric. Move it in about 8 cm to mirror the R (about 15.5 cm), which also gives the L upper arm back its length (0.109 against 0.140). Shown in the rest front view and the shoulders/arms close-up.
- L/R shoulder depth [minor]: the L joint is 3 cm further forward than the R. Shown in the rest side view.
- Feet [minor]: the Walk floats 4.0 cm at frames 1/6 (systemic).

homunculus_v2: PASS   score 7
- Shoulder joints [minor]: about 4-5 cm behind the middle of the upper arm in the side view (under the pauldron's rear half). Move them forward about 4 cm. Shown in the rest side view and the shoulders/arms side close-up.
- Neck [minor]: 7 cm behind Spine2, a backward jog at the base of the neck. Move it forward about 4 cm. Shown in the rest side view.
- Head [minor]: inside the beard, 1-2 cm below the chin line. Raise it about 2 cm. Shown in the head close-ups.
- Feet [minor]: the Walk floats 5.6 cm at frames 1/6 (systemic). Elbow, wrist, knee and ankle are all in the right places.

ismene_v2: FAIL   score 5
- Knees [major]: the L knee is 3.3 cm higher than the R (0.318 against 0.299 of height) while the boots and hips are level and the leg chain lengths match. One knee is wrong. Put both at about 0.305-0.31. Shown in the rest front view and the hips/knees close-up.
- R shoulder joint [minor]: 10.3 cm from the midline against 14.9 cm for the L. It sits at the inner edge of the R shoulder pad by the collar. Move it out about 2.5 cm (the mesh itself sits a little to her L). Shown in the shoulders/arms close-up.
- Feet [minor]: the boots float 3-6.5 cm through the Walk (systemic).
- Out of scope: the coat tails drag 4-9 cm under the floor in every clip, including the standing Bolt.

jamie_v2: PASS   score 8
- Head [minor]: on the neck just under the jaw line, about 2 cm below the skull base (0.864 against the reference 0.875; there is no hat, so this is a true ratio). Raise it about 2 cm. Shown in the head close-ups.
- Shoulders [minor]: L 17.4 cm against R 14.9 cm from the midline; mirror them. Shown in the rest front view.
- Feet [minor]: the Walk floats 4.2 cm at frames 1/6 (systemic). This is the cleanest fit in the group: hip 0.522, knee 0.303, ankle 0.078, ball 0.023, upper arm and forearm 0.13, and the spine is straight.

jasper_v2: FAIL   score 6
- Head [major]: 2.5 cm below the chin, inside the high collar, and about 4-5 cm below the ear-lobe line (the base of the skull). It is the lowest head pivot in the group. Move it up about 4 cm and back about 1 cm. Head turns will drag the collar, and nods will rock the face forward. Shown in the head close-ups (front and side).
- Neck [minor]: 3.7 cm behind Spine2 and 2.5 cm behind the Head, a backward jog. Put it on the line. Shown in the rest side view.
- Feet [minor]: the Walk floats 3.5 cm at frames 1/6, and the Strum is grounded. Arms, legs and feet are otherwise well placed.

kestrel_v2: PASS   score 7
- Spine2 [minor]: 4.7 cm behind Spine1 (6.7 cm behind the hip line), a backward jog at the chest; put it on the line. Shown in the rest side view.
- Shoulders [minor]: L 16.5 cm against R 13.8 cm from the midline; mirror them at about 15 cm. Shown in the rest front view.
- Knees [minor]: in the side view they sit about 1.5 cm behind the middle of the knee cop and on the hip-ankle line. Move them forward about 2 cm. In the front view they sit dead centre in the cops. Shown in the hips/knees side close-up.
- Feet [minor]: the Walk floats 4.7 cm at frames 1/6 (systemic). Ankle and ball are well placed in the boot.

lancer_f_v2: FAIL   score 2
- Ankles and balls [blocker]: in the front view both ankles and both balls sit about 11 cm toward the midline from the sabatons, in the empty gap between the legs. The side view is fine. The numbers look like an untouched template (ankle and ball both at exactly ±14.0 cm, ball straight under the ankle). Move each ankle and ball out about 11 cm into the centre of its boot. In motion the sabatons stretch into 30-40 cm spikes (Walk side frames 2, 3 and 5). Shown in the feet front close-up.
- R shoulder joint [blocker]: 12.1 cm from the midline, at the inner edge of the R pauldron by the gorget. The L is 26.0 cm, and the elbows and wrists are symmetric (about 32 cm and 49 cm out). Move the R out about 8-9 cm. Shown in the rest front view and the shoulders/arms close-up.
- L shoulder joint [major]: about 4-5 cm too far out, in the pauldron. Bring it in to about 21 cm so both sides match. Shown in the same views.
- Feet [major]: the Walk floats up to 6.4 cm (frames 1/6), and frame 4 lifts 5.9 cm again.
- Not judged: the R arm is held forward at about 30 degrees with the elbow locked at 40 degrees through the whole Walk and Run, on both lancers. It looks like a deliberate lance-carry layer.
- Out of scope: the tabard hem goes about 4 cm under the floor in Thrust frames 3-4.

lancer_m_v2: FAIL   score 2
- Ankles [blocker]: in the side view both ankles sit about 10 cm in front of the shin, outside the mesh in front of the instep. They are exactly under the hip joint, the same template as on lancer_f. In the front view they sit about 5 cm toward the midline, at the inner edge of each boot. Move each one back about 10 cm and out about 5 cm, to the middle of the lower greave just above the heel. Shown in the feet side close-up.
- Balls [major]: at the toe-cap tip, about 4-5 cm too far forward. Move them back to where the sabaton's plates bend. Shown in the feet side close-up.
- Knees [blocker]: hyperextended at rest, 6.7 cm (L) and 5.4 cm (R) behind the hip-ankle line and about 6 cm behind the middle of the knee cop. Move them forward 7-8 cm to sit about 2% in front of the line. Shown in the rest side view and the hips/knees side close-up.
- R shoulder joint [major]: 29.1 cm from the midline against 23.9 cm for the L, on the rim of the pauldron. It is also 8 cm behind the hip line while the L is 1.5 cm in front, about 10 cm out of mirror in depth (R collarbone 0.141 against 0.098, R upper arm 0.078 against 0.096). Move it in about 5 cm and forward to match the L. Shown in the rest front and side views.
- Feet [major]: the Walk floats up to 8.3 cm (frames 1/6), the worst of the non-gown figures. In the three-quarter Walk frames 1 and 5 the trailing sabaton twists.

lily_v2: FAIL   score 3
- Root/feet [blocker]: the whole figure hovers in every clip. The gown hem clears the floor by about 10 cm through the standing Bolt, 11-15 cm through the Walk and 9-19 cm in the Run, and the foot joints sit 10-15 cm above their rest height. Her root height in the retarget is wrong. Shown in the Bolt and Walk side renders with the floor line.
- Head [major]: just under the chin, 3.3 cm behind the front of the veil. That is about 3-4 cm forward of the skull base and about 2 cm low. The Neck-to-Head bone leans forward about 4 cm. Move the Head back about 3.5 cm and up about 2 cm. Shown in the head side close-up.
- Legs [can't judge]: they are hidden in the gown and no toes show in the dark render. The ankles are low (0.055-0.060 against the reference 0.067-0.08) and the shins long (0.25-0.26), which is worth a check against the shoe.

lisandra_v2: FAIL   score 2
- Root/feet [blocker]: she hovers in every clip. The gown hem clears the floor by 8 cm through the standing Bolt (the foot joints are 12.8 cm up) and by 14-18 cm through the Walk. Shown in the Bolt and Walk side renders with the floor line.
- Head [blocker]: the head pivot is on the face, 1 cm inside the chin's front surface. HeadTop_End sits on the nose, so the head bone is 3 cm long. Move the Head about 7 cm back and 2 cm up to the base of the skull, and put HeadTop_End at the crown under the hat. Shown in the rest side view and the head side close-up.
- Spine [major]: the spine zig-zags. Spine is 4.2 cm forward of the hips, Spine1 2.5 cm back and Spine2 4.1 cm back. Spine1, Spine2 and Neck are bunched into 6 cm while Spine to Spine1 spans 19 cm. Space the joints evenly from the hips (0.573) to the neck (0.747) on a straight line up the middle. Shown in the rest side view and the shoulders/arms side close-up.
- R knee [major]: 4-5 cm out from the line between the R hip and ankle in the front view, while the L leg is straight (the boots show between the gown panels). Move it in about 4 cm. Shown in the rest front view and the hips/knees close-up.
- Shoulders [minor]: R 9.3 cm against L 14.7 cm from the midline, under the feather mantle and bell sleeves, so I can't place the true deltoid. Mirror them.

## Systemic

1. The Walk floats on every figure [major, in the retarget]. The mesh is 4-6.5 cm off the floor at frames 1/6 and still 0.4-3 cm off at the best frames, so no foot ever plants. The pattern is identical across all 15 figures, while most standing attacks sit on the floor (0-1.5 cm). That points to the retarget's hip-height scaling or the Mixamo clip's root bob, not to each skeleton. Fix it (scale the hip translation by the target's hip height, or pin the lowest foot) before bm's walk goes on, or the new walk will float too.
2. Some figures hover even when standing [blocker or minor, per figure]: lily (about 10 cm) and lisandra (8-13 cm) in every clip; flint (2.4 cm) and gunner_f (2.6 cm) through the whole Shoot clip. Check each figure's root offset.
3. Foot joints were never refitted on the lancers [blocker]. Both have the same template numbers (ankle exactly under the hip and ±14.0 cm from the midline, ball straight under the ankle and 12.2 cm forward), leaving the joints outside the boots. Scan every key for those exact values.
4. Left and right are not mirrored [major]. Shoulder joints were fitted on each side separately: lancer_f 12/26 cm from the midline, gunner_m 15/23, ghoul 17/24, lancer_m 29/24 (plus 10 cm in depth), ismene 10/15, lisandra 9/15. Knee heights differ by 3.3-3.7 cm on ghoul and ismene. In each case the elbows, wrists and boots are symmetric, so the mesh is too. Mirror the better side by default and only allow asymmetry where the mesh shows it.
5. Head pivots. The bad ones: on the face (lisandra), under the chin front (lily), in the back hump (ghoul), in the collar (jasper). Most of the rest sit at the chin line, 1-3 cm below the skull base. That works, but raise them toward the ear-lobe line.
6. Spine jogs [minor]: one spine joint is 4-7 cm off the line (dragoon_f Spine, gunner_f Spine2, kestrel Spine2, homunculus and jasper Neck, and the lisandra zig-zag). Straighten them; otherwise the belly and chest crease at a point when the torso bends.
7. Most knees at rest sit on or just behind the hip-ankle line (-0.7 to +1.3 cm), against the reference 2-2.5% forward. Only ghoul, lily and dragoon_m come close. This is harmless for these FK clips but will bite any foot IK. Lancer_m's hyperextended knees are the extreme case.
8. Things I could not judge: candy-wrapper twist at the wrists and forearms, because the strip frames are about 230 px tall. I saw no collapse at elbows, knees, shoulders or hips on any figure, and no bone changes length by more than 4% in any frame.
9. The gait (these are the Mixamo clips): the walk kicks the heel up behind and folds the boot toes into hooks at toe-off, and it reads bouncy beside bm's planted hero walk. The Thrust is a knee-to-hip hop with open hands and reads as a dance, not a lunge, so swap that clip. Out of scope but the worst cloth cases: the dragoon capes and the lily and lisandra gowns ride the legs in the Run, and capes, tabards and ismene's coat tails dip 4-9 cm under the floor.
