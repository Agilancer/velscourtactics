# Rig review, round 1, group C: veteran

Method: every card read by eye, then the close-ups re-rendered larger from `r1/rest` and `r1/motion` with the joints
drawn on and a pixel grid where a call was close. Distances come from the joint JSON beside each render (world cm, the
floor at z = 0). "Float" means how far the foot's ball sits above its own rest height, taken from the side-view joints
of the 6 sampled frames. The floor line in the three-quarter strips can't be used for contact because that camera
looks down, so contact is judged from the side views and the numbers. Directions are the figure's own (its left/right;
forward = toward the face, which is LEFT in the side views).

```
maudlin_v2: FAIL   score 3
- Feet / root height [blocker]: both boots hover 9-10 cm off the floor in EVERY frame of the Walk (closest frame: ball 9.3 cm over its rest height) and of the Bolt (9.0-9.2 cm, all 6 frames). The hips ride 6-7 cm above rest (Bolt hips 94-95 cm, rest 88 cm) on her short legs, and the gown hem is pushed 5 cm through the floor in Bolt. Lower this figure's root ~9 cm in every clip (the clips' hip height isn't scaled to her 1.5 m body). Side strips, Walk f0-f5 and Bolt.
- L and R wrist [major]: the wrist joints sit ~5 cm up the forearm inside the cuff, and the hand starts ~5 cm further out. Move each wrist ~5 cm out along the forearm to the end of the cuff where the hand begins. The arm chain is short overall: upper arm 14.3 (L) / 16.3 (R) cm, forearm 15.7 / 15.3 cm. Rest front (shoulders-and-arms close-up), Bolt f2 three-quarter and Run f0 side (the outstretched R hand bends ahead of its joint).
- Knees [minor]: can't see the legs under the gown. Judging by the hips and boots the knees are ~4 cm high: thigh 29.5 cm against shin 38 cm, knee at 51 (L) / 49 (R) cm where the midpoint is ~47 cm. Move both ~4 cm down. Rest side, hips-and-knees close-up.
- L ankle [minor]: 2.2 cm higher than the R (13.6 vs 11.4 cm) in mirrored shoes. Bring L down ~1 cm and R up ~1 cm. Feet close-up, front.
- Neck [minor]: the neck joint sits 2.5 cm behind the line from chest to head (a small kink). Move it ~2.5 cm forward. Side view.
- Cloth (out of scope): the gown walks as trousers and splits in the Run.

mortimer_v2: PASS   score 7
- L and R shoulder [minor]: on the coat's shoulder seam, i.e. the top edge of the arm, ~2-3 cm high and ~2 cm toward the neck from the middle of the arm root. Move down ~2.5 cm and out ~2 cm. Rest front, shoulders close-up.
- L elbow [minor]: 2.7 cm closer to the shoulder than the R (upper arm 21.9 vs 24.6 cm; the L shoulder joint is also 1.6 cm further out). Mirror the R arm. Rest front.
- Knees [minor]: dead straight in the side view (0.6 / 0.4% in front of the hip-ankle line; reference 2-2.5%), and 2.3 cm outside that line from the front (a slight bow). Move ~3 cm forward and ~2 cm in. Rest side and front, hips-and-knees close-ups.
- Otherwise clean: the ankle sits over the heel (27% of the shoe from the back) and the ball where the sole bends. Feet are planted in Walk and Bolt (within 0-1.7 cm). No collapse at elbows, knees or shoulders in the strips. The coat tails ride the legs (out of scope).

necromancer_f_v2: FAIL   score 5
- L and R knee [major]: the knees sit outside the legs, out in the coat's flare. From the front they're 6 cm outside the hip-ankle line on each side (L knee 12.4 cm from centre while the hip is at 6.4 and the ankle at 5.6). From the side they're 8.5 cm in front of the hip-ankle line (4.6%; reference 2-2.5%), so ~4.5 cm too far forward. Move each knee ~6 cm inward and ~4 cm back, over the boot shafts. Rest front and side legs; Walk f1 three-quarter shows the R knee riding out in the coat.
- Feet in Bolt [major]: hover through the whole clip, L ball 3.2 cm and R ball 5.0 cm above rest. The Walk never gets closer than 3.5 cm. Lower the root ~3 cm. Bolt side frames.
- Neck [minor]: 3.5 cm behind the chest-head line, at the nape. Move ~3 cm forward. Side head close-up.
- L and R shoulder [minor]: on the top edge of the arm, ~2-3 cm high (the L one under the pauldron). Move down ~2 cm. Rest front.
- Coat (out of scope): moves with the legs.

necromancer_m_v2: FAIL   score 5
- L and R knee [major]: 10.3 cm in front of the hip-ankle line in the side view (5.6%; reference 2-2.5%), so ~6 cm too far forward. That puts the knee in front of the shin, inside the coat hem, and the shin bone leans ~14 degrees against the vertical boot shaft. Move both ~6 cm back. The front view is fine. Rest side legs.
- R shoulder [major]: the R shoulder joint is 4.5-5 cm too far in, inside the feather collar beside the neck (R 8.9 cm from centre, L 13.9 cm), so the R upper arm measures 25.9 cm against the L's 21.5. Move R out ~5 cm to mirror the L. Rest front, shoulders close-up.
- R elbow [minor]: 2.3 cm lower than the L (124.9 vs 127.2 cm). Mirror. Rest front.
- Feet [minor]: the L foot sinks ~2 cm through the floor all through the Bolt (ball 2.0 cm under its rest height), and ~2 cm at mid-stance in the Walk. Raise the root ~2 cm in Bolt. Bolt side.
- Coat (out of scope): moves with the legs.

ninja_f_v2: FAIL   score 6
- Head [major]: the pivot is too far forward and at chin level: 4-6 cm behind the mask's front and 6.2 cm in front of the neck joint, so the neck-to-head bone leans ~45 degrees forward. The base of the skull is ~10 cm behind the face. Move the head joint ~4 cm back and ~2 cm up. Rest side, head close-up.
- Spine2 [minor]: 6.2 cm behind Spine1 (out at the shoulder blades), so the chain zig-zags. Put it on the line from Spine1 to Neck (~4 cm forward). Side view.
- L arm [minor]: the L shoulder joint is 2.5 cm further out than the R (16.2 vs 13.7 cm) and the L elbow 2.9 cm higher, so the L upper arm measures 17.3 cm against the R's 19.8. Mirror the R. Rest front.
- Knees [minor]: straight in the side view (L +0.4 cm, R -0.8 cm, i.e. the R is slightly hyperextended), and the L knee is 2.1 cm higher than the R. Move both ~3 cm forward and even out the heights. Rest side and front.
- Feet [minor]: Slash planted L foot 1.0-1.5 cm up, R 2.8-3.7 cm; the Walk's closest frame is 1.8 cm. Slash and Run otherwise deform cleanly.

ninja_m_v2: FAIL   score 6
- Feet / root in Slash [major, borderline]: the whole figure never touches the floor in the Slash. The lowest point of the mesh is 1.8-2.3 cm up in every frame; L ball 1.8-2.3 cm and R ball 3.8-4.3 cm above rest. The Walk's closest frame is 2.1 cm. Lower the root ~2 cm. Slash side.
- L and R shoulder [minor]: 20 cm from the centre, ~2-3 cm too far out. The elbows sit correctly at the tops of the bracers, so it's the shoulder that makes the upper arm measure short (19.4 / 21.1 cm). In the side view they're also 6.7 cm behind the spine line, ~3 cm behind the middle of the arm. Move in ~2.5 cm and forward ~3 cm. Rest front and side.
- Knees [minor]: dead straight in the side view (0.0 / +0.1 cm). Move ~3 cm forward. They're centred on the knee-pad caps from the front.
- Head, spine, wrists, ankles and balls are good. No collapse in the Run or Slash.

paladin_f_v2: FAIL   score 6
- Feet in Swing [major]: the sabatons hover through the whole Swing, L ball 2.0-2.6 cm and R ball 4.5-5.5 cm above rest; the tabard hem reaches the floor but the boots don't. The Walk's closest frame is 2.7 cm. Lower the root ~2.5 cm. Swing; side strips.
- L shoulder [minor]: 3.3 cm further out than the R (16.1 vs 12.8 cm). Both elbows sit right on the couters, so the L upper arm measures 17.2 cm against the R's 19.4. Move L in ~3 cm. Rest front, shoulders close-up.
- Lower spine [minor]: Spine and Spine1 sit 5 cm forward of the line from Hips to Spine2, toward the belly plate. Move back ~5 cm. Side view.
- Head [minor]: the pivot is 14.7 cm behind the face, ~3 cm too far back in the helmet. Move ~3 cm forward. Side, head close-up.
- Legs are centred, knee height right (0.32), knee 1.5% forward, ankle over the heel. The tabard rides the legs (out of scope).

paladin_m_v2: FAIL   score 6
- L and R elbow [major]: ~3-4 cm too close to the shoulder, at the top of the red inner-elbow gap rather than its middle. Upper arm 17.0 / 17.9 cm (0.10 of stature; reference 0.133-0.153) against a 22.4 / 22.9 cm forearm, so the bend lands inside the rerebrace plate. Move each elbow ~3.5 cm down the arm. Rest front, shoulders-and-arms close-up.
- Knees [minor]: nearly straight in the side view (+1.2 / +0.4 cm). Move ~2 cm forward. They're centred on the poleyns from the front.
- Feet [minor]: Swing L ball 1.3-1.9 cm and R 3.7-4.3 cm above rest; the Walk's closest frame is 1.8 cm.
- Shoulders sit inside the pauldrons (1.4 cm L/R difference, fine). Wrists, head and feet are good.
- Cloth (out of scope): the cape goes 8-12 cm under the floor through the Swing.

ranger_f_v2: FAIL   score 6
- Head [major]: the pivot is ~6 cm low. It sits at 140.9 cm, 2.7 cm below the chin (chin ~143.6, nose bottom ~148), in the hood's collar. Move up ~6 cm to about the nose-bottom / earlobe level (~147 cm). Depth is fine (~11 cm behind the nose). Rest side, head close-up.
- Neck [minor]: 4.8 cm behind the chest-head line, at the nape. Move ~4 cm forward. Side view.
- L and R shoulder [minor]: the L is 2.8 cm further out than the R (14.2 vs 11.4 cm), and the R sits ~2 cm inside the arm root at the pauldron's inner edge. Move R out ~1.5 cm and L in ~1.5 cm. Rest front.
- Knees [minor]: almost straight in the side view (+1.2 / +1.4 cm). Move ~2 cm forward.
- Legs are centred in the boots, ankle over the heel, ball at the bend. Shoot planted (L within 0.7 cm). Shoot and Run deform cleanly.

ranger_m_v2: FAIL   score 6
- Feet in Shoot [major]: the whole figure hovers through the entire Shoot. The lowest point of the mesh is 2.6-2.9 cm above the floor in every frame; L ball 2.5-2.7 cm and R 4.0-4.9 cm above rest. The Walk's closest frame is 3.1 cm. Lower the root ~2.7 cm. Shoot; side strips.
- Spine2 [minor]: 4 cm behind the line from Spine1 to Neck (Spine1 -0.1, Spine2 -4.0, Neck -0.3 cm against the hips). Move ~4 cm forward. Side view.
- L and R shoulder [minor]: on the top edge of the arm under the pauldron lip, ~2-3 cm high. Move down ~2 cm. Rest front.
- L and R elbow [minor]: the upper arm measures 19.1 / 20.1 cm against a 24 cm forearm, and from the front the elbow sits ~3 cm above where the sleeve meets the bracer. Check it, and move ~2-3 cm toward the wrist if the crease is there. Rest front.
- Legs are good (knee 0.30, ankle over the heel, ball at the bend). Cloth (out of scope): the feathered cloak is the worst rider in the group, trailing off both legs in the Walk and Run.

skeleton_v2: FAIL   score 5
- Spine (lumbar) [major]: the Spine joint is 9-10 cm forward of the backbone, out in the open belly in front of the lumbar vertebrae, so the chain zig-zags: Hips to Spine goes 4.8 cm forward, then Spine to Spine1 goes 10 cm back. On a figure whose torso IS the spine column, any bend there kinks the column off its line. Move Spine ~8 cm back onto the line from Hips to Spine1. Rest side; the spine is visible behind the rib cage.
- Shoulder girdle [major]: too low. The shoulder joints sit 5-7 cm down the humerus shafts below the humeral heads (and ~2 cm too far out), and the collarbone joints sit ~8-10 cm below the top of the sternum where the clavicles start. Raise the shoulder joints ~6 cm into the humeral heads (and ~2 cm in), and the collarbone joints ~8 cm. This is the one figure where the bones are visible, and the 0.79-of-height formula misses them. Rest front, shoulders close-up.
- Head [minor]: at the bottom of the jaw, ~2-3 cm low. Move up to the base of the skull behind the jaw angle. Head close-up.
- R knee and R ankle [minor]: 3-4 cm toward the midline of the bones' centre from the front (the mesh's R leg stands wider than the rig's mirrored legs; the L is ~1.5 cm off). Harmless for the bend, but it shows when the leg twists. Move the R knee, ankle and ball ~3 cm out. Rest front legs.
- Knees, ankles and balls are right in the side view. Feet are planted in Walk and Swing. No collapse in the strips.

slime_lord_f_v2: PASS   score 7
- Neck [minor]: 5.3 cm behind the chest-head line, at the nape under the ermine. Move ~5 cm forward. Side, head close-up.
- L and R shoulder [minor]: on the top edge of the arm under the cape, ~2-3 cm high. Move down ~2 cm. Rest front.
- Hips [note, not a fault]: the hip joints are at 0.46 of the height, low by the reference, but they sit ~10 cm above the crotch of this short-legged, heavy body, which is right for this mesh.
- Knees, ankles and balls are centred front and side; the knee is 1-1.2% forward. Feet are planted in Walk (0.9 cm) and Swing. No collapse in the strips.

slime_lord_m_v2: FAIL   score 6
- L and R shoulder [major]: not mirrored on a symmetric body. The L joint is 21.7 cm from the centre and the R 17.1 cm (4.6 cm apart). The R is also 3.5 cm further back (7.3 vs 3.8 cm behind the hip line) and sits ~3-4 cm behind the middle of the arm. Set both at ~19.5 cm from the centre and bring the R ~3 cm forward. Rest front and side, shoulders close-ups.
- Knees [minor]: 1.1 / 1.6 cm BEHIND the hip-ankle line in the side view (a hyperextended rest pose). Move ~5 cm forward to +2%. The strips still bend forward.
- Legs, feet and head are good. Feet are planted (Walk 0.6 cm, Swing L 0.3-0.9 cm).
- Cloth (out of scope): the robe and cape go 8-12 cm under the floor through the Swing.

squire_v2: PASS   score 8
- L and R shoulder [minor]: on the top of the arm under the spaulders, ~3 cm high, and the upper arm measures a little short (18.9 / 19.4 cm). Move down ~2.5 cm. Rest front, shoulders close-up.
- Knees [minor]: slightly straight in the side view (+1.6 / +2.0 cm, 0.9-1.1%). Move ~1.5 cm forward.
- Feet in Thrust [minor]: the planted L foot sinks up to 1.7 cm under the floor at the lunge frames. Raise the root ~1.5 cm there.
- Knees on the poleyns, ankles over the heels, balls at the bend, spine straight, head at the skull base. The Thrust knee-raise deforms cleanly (the faulds sit over the raised thigh).

stevie_v2: FAIL   score 5
- Head [major]: the pivot is 8-9 cm low. It sits at 148.9 cm, 4.8 cm BELOW the chin (chin ~153.7, nose bottom ~157.9), down in the gorget, and 6.2 cm behind the neck joint, so the neck-to-head bone leans backward. Move up ~9 cm to ~157.5 cm and ~3-4 cm forward (to ~9-10 cm behind the nose). Rest head close-up, front and side: the "head" label sits in the collar below the face.
- L and R shoulder [minor]: on the top edge of the arm under the pauldron lip, ~2-3 cm high. The upper arm measures 18.2 cm against a 22.3 cm forearm. Move down ~2 cm. Rest front.
- Feet [minor]: the Thrust planted foot sinks up to 1.4 cm; the Walk's closest frame is 1.2 cm.
- Legs are good: wide stance, joints centred in the greaves, knee 1.9% forward, ankle over the heel, ball at the bend.
```

## Systemic

1. **Root height isn't matched to the refitted legs, so in-place clips float.** These are the planted foot's height above rest, across all 6 frames of the attack clip:
   - Maudlin: 9 cm
   - necromancer_f: 3.2 cm
   - ranger_m: 2.6 cm (no part of the mesh ever touches the floor)
   - paladin_f: 2.0-2.6 cm
   - ninja_m: 1.8-2.3 cm (no part of the mesh ever touches the floor)
   - paladin_m: 1.3-1.9 cm
   - necromancer_m, squire and stevie sink 1.4-2 cm instead.

   In the Walk, 7 of 15 never bring a foot within 1.8 cm of the floor (Maudlin 9.3, necromancer_f 3.5, ranger_m 3.1, paladin_f 2.7, ninja_m 2.1, ninja_f 1.8, paladin_m 1.8). Fix it once in the retarget: scale the root's height by the refitted hip height, or add a foot-plant pass that drops the root until the lower foot meets the floor.
2. **In every attack clip on every figure, the R foot rides 1.5-2.5 cm above the L, with the toe pitched up.** The R ball rises more than the R ankle, about 6 degrees of toe-up. That looks like the R foot's rest orientation differs from the library's.
3. **The head pivot is placed by proportion, not by the skull.** Stevie is 8-9 cm low (below the chin) and ranger_f ~6 cm low (below the chin). ninja_f is ~4 cm too far forward (at the face). The skeleton and paladin_f are off by 2-4 cm. Fit it to the base of the skull: about nose-bottom/earlobe height, ~9-10 cm behind the nose.
4. **Shoulder joints come from a formula:** exactly 0.790 of (head joint / 0.875) on all 15, and the neck at 0.832-0.835 on all 15.
   - On most figures the shoulder joint lands on the top edge of the arm, 2-3 cm high.
   - On the skeleton, where the bones are visible, it is 6 cm low, on the humerus shaft.
   - L and R aren't mirrored on symmetric bodies: slime_lord_m 4.6 cm, necromancer_m 5.0, paladin_f 3.3, ranger_f 2.8, ninja_f 2.5, mortimer 1.6.

   Fit the shoulders to the arm root, centred in the arm's thickness, and mirror them.
5. **The upper arm reads short on 13 of 15 figures,** 0.098-0.123 of stature against the reference 0.133-0.153, while every forearm is in range (0.12-0.14). Mostly that's the shoulder sitting too far out or high. On paladin_m it's the elbow, sitting high inside the plate. Check each elbow against the inner-elbow crease.
6. **Rest knees are straight on most figures:**
   - 0 to +1.3% forward of the hip-ankle line against the reference +2-2.5%.
   - slime_lord_m and ninja_f's R knee bend slightly backward.
   - Both necromancers go the other way, 4.6-5.7% forward.

   The FK strips still bend the right way. Any IK or foot-plant pass will need the forward hint, so put every knee at +2-2.5%.
7. **Spine and neck zig-zags:** single joints pushed 4-10 cm off the line from pelvis to head.
   - skeleton Spine: 10 cm
   - ninja_f Spine2: 6 cm
   - paladin_f Spine/Spine1: 5 cm forward
   - slime_lord_f Neck: 5 cm
   - ranger_f Neck: 5 cm
   - ranger_m Spine2: 4 cm
   - necromancer_f Neck: 3.5 cm

   Smooth each chain onto a straight, or gently curved, line up the middle of the torso.
8. **Deformation itself is clean once joints are in the right place.** I saw no candy-wrapper, tearing or stretching at elbows, knees, shoulders or wrists in any strip at this resolution. Every deformation problem above traces back to a joint's placement.
9. **Gait (one line):** the Mixamo walk is bouncy and kicks the swing shin up to horizontal behind (Walk f2), and the arms hang slack. bm's hero walk on the reference sheets keeps the foot low and the body level, so it's the right replacement.
10. **Cloth (out of scope):** the worst riders are ranger_m's feather cloak, Maudlin's gown, the necromancers' coats and the paladins' tabards. On paladin_m and slime_lord_m the cape and robe go 8-12 cm through the floor in the Swing.
