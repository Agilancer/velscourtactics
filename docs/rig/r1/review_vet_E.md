# Rig review, group E (zombies): veteran

Heights below are fractions of the whole model (crowns, hoods and humps included), as the cards draw them. Where a
figure wears something tall I compare against the skull top, not the hat. Distances come from the card joint data
(rest/*.json, motion/*.json) and were checked against the rendered frames. "Lowest point" means the lowest pixel of
the mesh against the floor line in the side view.

```
zombie_dryking_v2: FAIL   score 5
- Spine, Spine1 [major]: these two bow about 11 cm forward of the straight line from Hips to Spine2. They sit at the front of the ribcage and the sunken belly, 1-2 cm inside the skin: the "spine in the belly" fault. Move both back about 11 cm onto the Hips-Spine2 line, through the middle of the torso. Shows in the rest side view, torso at 66-72%, as a forward "<" in the yellow chain.
- feet on the floor [minor]: the lowest point of the mesh stays 1.3-3.5 cm above the floor in every Walk frame, so no foot ever quite plants. Walk side, f0-f4.
- balls [minor]: about 3 cm too far back (58% of the foot length from the heel; the toe crease is about 70%) and 6 cm off the floor. Rest side, feet close-up.
- elbows [minor]: upper arm 0.30 m against a forearm of 0.34 m, so the elbows are probably about 2 cm high. Can't confirm it on the thin arm in the front view.
- cloth (out of scope): the robe hem cuts about 7 cm into the floor in Roar f1-f4.
Head pivot, neck, shoulders, knees (1.9% forward) and ankles are good. Nothing collapses at the elbows, shoulders or knees in Walk, Run or Roar.

zombie_gnawer_v2: PASS   score 8
- elbows [minor]: upper arm 0.19 m (L) and 0.21 m (R) against forearms of 0.22 m, so the elbows sit about 2 cm high. The L elbow is also about 1 cm higher than the R. Rest front, shoulders close-up.
- knees [minor]: the L knee is 1.1 cm higher than the R. Both are only 1.4-1.6% in front of the hip-ankle line (reference 2-2.5%): move them forward 1-1.5 cm. Rest front and side.
- balls [minor]: about 2 cm behind the toe crease (61%). Rest side, feet close-up.
The spine is centred and straight. The neck joint sits at the back third of the drooping neck and the head pivot at the base of the skull. Feet stay on the floor (within 1 cm) through Walk and Roar, and the bare feet stay clean in the Run. Gait: a lunging scuttle that kicks the shin up to horizontal. Over the top, but it deforms cleanly.

zombie_husk_v2: PASS   score 8
- spine [minor]: a small kink in the side view: Spine1 is 1.9 cm back and Spine2 1.6 cm forward, a 3.5 cm zigzag. Straighten it. Rest side, torso at 65-78%.
- elbows [minor]: upper arm 0.17-0.18 m against forearms of 0.22-0.23 m, so the elbows are about 2-3 cm high. The R forearm is 1 cm longer than the L. Rest front.
- balls [minor]: about 2 cm behind the toe crease (59%). Rest side, feet close-up.
Head, shoulders, hips, knees (1.7-2.1% forward) and ankles are good. Feet stay planted in Walk and Roar, with no tearing or collapse. Same scuttling walk as the gnawer.

zombie_leechmother_v2: FAIL   score 3
- whole body / root height [blocker]: she floats about 10 cm above the floor in every animated frame. The lowest point of the mesh is 6.8-10.5 cm up through the Walk and 9.3-9.8 cm up in the Roar, and the balls sit at 12.9-14.9 cm against 4.0 cm at rest. The rest pose stands on the floor, so the hip height of these clips is not fitted to her short legs (hip joints at 0.82 m). Lower the root by about 9-10 cm. Walk side f0-f5 and Roar side: clear daylight under both feet.
- L knee [minor]: 2.1 cm lower than the R (26.3% against 27.5%); the L thigh is 0.37 m and the R 0.35 m. Mirror them. Rest front, hips and knees close-up.
- knees [minor]: only 1.2 cm (L) and 2.1 cm (R) in front of the hip-ankle line (0.7-1.2%), almost locked. Move them forward about 2 cm. Rest side.
- L shoulder [minor]: 2.8 cm further back than the R in the side view. Mirror it.
The spine sits rightly towards the back of the bloated body, not in the belly. Shoulder joints are inside the deltoid, and the head pivot and the feet are good. Nothing tears in the Walk or the Roar.

zombie_lurker_v2: FAIL   score 6
- R forefoot [major]: in Walk f2 side, the trailing R toes are pulled back and down into a thin spike of about 15-20 cm behind the ball, and Run f3 does the same. The toe skinning stretches the foot instead of folding it at the ball.
- feet on the floor [minor]: the stance foot hovers about 2-3 cm through the Walk and the Roar (balls at 7.2-8.4 cm against 4.7 cm at rest). Roar f0-f5 side, feet close-up.
- balls [minor]: L/R mismatch of 4 cm. The L ball is about 2 cm behind the toe crease and the R about 2 cm in front of it (64% against 78% of the foot). Mirror them onto the crease. Rest side, feet close-up.
- L/R [minor]: the L shoulder sits 3.1 cm further forward and 2.7 cm further out than the R; the L knee is 3.5 cm further out than the R in the front view. Mirror them.
- cloth (out of scope): the moss strands on the R shin hang 8-22 cm through the floor in Walk f2 and all Roar frames.
The spine is straight and centred, the head pivot sits right inside the hood, and the knees bend forward.

zombie_rimewalker_v2: PASS   score 8
- knees [minor]: only 1.2-1.3 cm (0.7%) in front of the hip-ankle line, legs near locked. Move the knees about 2-3 cm forward. Rest side, hips and knees close-up.
- feet on the floor [minor]: the lowest point stays 1.7-3.3 cm above the floor through Walk f0-f4, so the stance boot hovers about 2 cm.
- cloth (out of scope): the greatcoat skirt rides with the thighs.
The spine is straight and centred, and the shoulder joints sit inside the coat's shoulders. The head pivot is at the base of the skull under the helmet. Elbows, wrists, ankles and balls (69%) are good. The boots keep their shape in the Walk and the Run, with no spikes.

zombie_shambler_v2: PASS   score 7
- knees [minor]: only 0.3-0.7 cm (0.1-0.4%) in front of the hip-ankle line, locked straight. Move them about 3-4 cm forward. Rest side, hips and knees close-up.
- L shoulder / upper arms [minor]: the L shoulder joint is 2 cm further out than the R (19.7 cm against 17.7 cm from the midline) and the L upper arm 2 cm shorter (0.17 m against 0.19 m). Both upper arms are short against the 0.22 m forearms, so the elbows are about 2-3 cm high. Rest front, shoulders close-up.
- L knee [minor]: 2.9 cm further out than the R in the front view.
- trailing shoe [minor]: in Run f3-f4 the toe of the shoe is drawn into a spike of about 10 cm. The Walk is clean.
- feet on the floor [minor]: the lowest point stays 1.3-2.8 cm up in Walk f0-f3.
The head hangs forward as sculpted (the neck is pitched 31 degrees at rest) and the chain follows it, with the pivot at the base of the skull. Spine, shoulders (side), ankles and balls are good.

zombie_slagback_v2: FAIL   score 4
- Neck, Head [major]: the chain runs straight up through the slag hump. The hooded skull hangs about 20 cm in front of the head joint, and HeadTop_End ends in the top of the hump (97%), not in the skull. A nod or turn pivots the skull around a point 20 cm behind it and drags the hump along. Bring the Head joint about 20 cm forward to the base of the skull and arc the neck forward to it. Run f0 and Walk f3 side and three-quarter: the skull sits wholly in front of the yellow line.
- elbows / upper arms [major]: the upper-arm bone is 0.15 m and the forearm 0.30-0.33 m, 1:2 against a reference of about 1:0.9. On the bare R arm the elbow sits a third of the way down from the shoulder joint, about 8 cm above the middle of the arm and above the cloth wrap. In Run f0 three-quarter the L arm folds right at the pauldron's lower rim. Move both elbows about 8 cm down the arm. Rest front, shoulders close-up. Also check the shoulder joints, which sit at the pauldron's outer lower rim rather than under its dome.
- feet / claws [major]: in Walk f2 side the trailing R forefoot stretches into a blade of about 25 cm behind the heel, and Run f1/f3/f4 do the same on both feet. The claws need to ride rigidly with ToeBase, and the Foot/ToeBase blend should stop at the claw roots.
- ankles [minor]: 19 cm up (0.087 of the height, about 0.09 of the skull height; reference 0.067-0.08), about 2 cm high. Rest side, feet close-up.
- claw tips [minor]: 3-5 cm under the floor in Roar f1-f4.
Spine straight and centred, hips, knees (1.7-2.1% forward) and balls (64%) are good.

zombie_slinger_v2: FAIL   score 4
- Spine, Spine1 [major]: a 24 cm Z through the torso in the side view. Spine sits about 10 cm in front of the visible vertebral column, in the hollow under the robe; Spine1 sits about 13 cm behind it, inside the quiver. Put Hips, Spine, Spine1 and Spine2 on the vertebrae. Rest side, torso at 60-75%. In the Walk the chain is pulled onto the vertebrae, and the lumbar section bows into a long C behind the robe (Walk f0/f3 side). How much of that comes from the clip I can't separate.
- ankles [major]: the joints sit on the shin bones about 4-5 cm above the talus (12.8 cm up; the bare talus top is about 7-8 cm up) and about 2 cm in front of the middle of the shin bones. On a figure made of rigid bones, the shin bends above the foot instead of the foot turning at the ankle. In Walk f2 the R foot hinges on the tibia. Rest side and front, feet close-ups.
- toes [major]: in Walk f2 side the trailing R toe bones splay into spikes about 1.5 times their length, and Run f1 does the same. Rigid bones must not stretch: weight the phalanges wholly to ToeBase.
- R knee [minor]: 6.4 cm (3.7%) in front of the hip-ankle line against 3.4 cm (2.0%) for the L; the L knee sits 3 cm further back than the R. Mirror them. Rest side, hips and knees close-up.
Head, neck and shoulders are good, and the elbows sit right at the ends of the humerus.

zombie_stoker_v2: FAIL   score 5
- shoulders [major]: in the side view the shoulder joints sit at the back of the deltoid: the L about 5 cm and the R about 9 cm behind the middle of the upper arm (10-13 cm behind the spine line). The R is 3.5 cm further back than the L. The upper-arm bones run down and forward to elbows that sit mid-arm. Move L forward about 5 cm and R about 9 cm. Rest side, shoulders close-up. In the front view the L is also 3.2 cm further out than the R.
- boots [major]: in Walk f2 side the trailing R boot's toe drags into a blade of about 20 cm. In Walk f4 the trailing boot squashes flat like a slipper, and in Run f1/f3/f4 both boots stretch into blades. Make the boot rigid on Foot plus ToeBase, with only a narrow blend at the ball.
- ankles [minor]: 22-23 cm up (0.083-0.088), about 2-4 cm high for the boot. The L is 1.3 cm higher than the R. Rest side, feet close-up.
- knees [minor]: only 2.5 cm (L) and 0.6 cm (R) in front of the hip-ankle line (0.9% and 0.2%). Move them about 2-4 cm forward. Rest side.
Spine straight and centred, head pivot good, hips good, balls good (76% of the boot).

zombie_warden_v2: FAIL   score 4
- Hips (root) and spine [major]: the Hips joint sits on the front armour plate, about 13-15 cm in front of the hip joints and of Spine, so the Hips-Spine bone runs back and up at 45 degrees. Spine2 then sits 8 cm behind Spine1 and the neck 6 cm forward of Spine2: a zigzag. Put Hips between the hip joints (about 14 cm back) and run Spine to Spine2 straight up the middle of the torso. Rest side at 55-75%; the forward kink at the pelvis also shows in every Walk side frame.
- R shoulder [major]: in the front view the R shoulder joint is 9.9 cm from the midline against 17.2 cm for the L. It sits about 7 cm in towards the neck, which makes the R upper arm 0.44 m against 0.39 m. Mirror the L (move R out about 7 cm). Rest front, shoulders close-up.
- ankles [minor]: 21-22 cm up (about 0.087 of the skull height), about 2 cm high. Rest side, feet close-up.
- feet on the floor [minor]: the lowest point stays 1.7-3.3 cm above the floor through the Walk, so the boots hover about 2-3 cm.
- cloth (out of scope): the cape and tasset tails move with the legs.
Knees (1.7-1.9% forward), elbows and head pivot under the crown are good. The armour and the fur mantle hold together in the Walk and the Roar.
```

## Systemic (seen across many figures)

1. **The spine chain is not straight where the torso has something odd in it.** The chain bows into a sunken belly
   (dryking), zigzags through a quiver (slinger), roots on the front armour plate (warden), or climbs a hump instead
   of reaching the skull (slagback's neck and head). The refit keeps Meshy's front-to-back placement wherever there is
   "room". It should instead fit Hips to Spine2 on a straight line from the midpoint of the hip joints to the neck at
   mid-depth of the body core, ignoring hoods, humps, quivers and mantles, and put the Head at the base of the skull.
2. **Forefoot and toe skinning stretches.** When the toe bone bends, boots, claws and toe bones draw out into blades
   or spikes 10-25 cm long: slagback, stoker, slinger and lurker in the Walk, and the shambler in the Run. The rimewalker
   and warden boots and the bare feet of dryking, gnawer and husk do not. Keep rigid feet (boots, claws, bone) fully
   on Foot and ToeBase, with a blend band of only 2-3 cm at the ball.
3. **Floor contact in motion.** The leechmother floats about 10 cm in every clip, so the root height is not fitted to
   her short legs. Dryking, rimewalker, warden, shambler and lurker hover 1.5-3.5 cm through the Walk. The Roar lifts
   the R foot 2-6 cm on every figure (the clip, not the rig). A per-figure root-height fit plus a floor lock on the
   stance foot would cover all of it.
4. **Knees locked straight at rest:** 0.1-1.2% of the height in front of the hip-ankle line on the shambler,
   rimewalker, stoker and leechmother, against 2-2.5% in the reference. No knee bends backwards in these strips, but
   the margin for knee direction is thin.
5. **Short upper arms and high elbows.** The upper arm is 0.095-0.12 of the height on most figures (reference
   0.133-0.153), with the forearm as long or longer. Elbows sit 2-3 cm high on the gnawer, husk, shambler and dryking.
   The slagback is far worse at 1:2.
6. **Left and right do not match:** 2-7 cm differences in shoulders (warden 7 cm, stoker, lurker, leechmother,
   shambler), knees (slinger, leechmother, lurker, shambler) and balls (lurker). Mirror one side after fitting.
7. **Feet details:** ankles are 2-4 cm high on the big booted figures (stoker, warden, slagback). Balls sit 2-3.5 cm
   behind the toe crease on the bare feet (dryking, gnawer, husk).
8. **Gait (one line):** the library Walk and Run are bouncy and upright for the dead. The gnawer and husk get a
   lunging scuttle with the shin kicked to horizontal. The Roar crouch reads well on all of them.
