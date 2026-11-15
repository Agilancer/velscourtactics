# Rig review, round 1, group E (zombies): critic 2 (up-and-comer)

How I checked: I looked at both cards for every figure. I also overlaid the joint positions from `r1/rest/*.json` and
`r1/motion/*.json` on the rest and motion renders at 2-4x, with the floor line drawn, so the distances below are measured.
"Float" is the planted foot's ankle and ball height in a frame minus their height at rest.

zombie_dryking_v2: FAIL   score 6
- Spine, Spine1 [major]: the chain zig-zags in the side view. Spine (64%) and Spine1 (70%) sit 11 cm in front of the line from Hips to Spine2, about 4 cm in front of the torso's middle (in the belly and front ribs), while Spine2 (76%) sits 4 cm behind it. Move Spine and Spine1 back about 9-10 cm onto a straight Hips-to-Spine2 line. Seen in the rest side view and the side "shoulders and arms" close-up (the yellow kink). The walk strip still reads acceptably, but the slump of every zombie idle bends exactly these two joints.
- Feet in Walk [minor]: the planted foot rides about 1.5 cm above the floor through the whole Walk (ball 7.6 cm against 6.0 cm at rest; side frames 0, 1, 4 and 5).
- Elbows [minor / can't judge]: upper arm 29 cm against forearm 34 cm (0.12 against 0.14 of the height). The elbow may be about 2 cm high, but the gaunt arm shows no clear elbow to check against.
- Cloth (out of scope): the robe hem goes about 8 cm through the floor in Roar frames 1-4.

zombie_gnawer_v2: PASS   score 8
- L arm [minor]: the L upper arm is 19.2 cm against 21.1 cm on the R, so the L elbow is 1.2 cm higher (67.5% against 66.8%). Lower the L elbow about 1 cm so the two sides match. Front view.
- Head [minor]: the head pivot (86.1%) is 2-3 cm below the jaw line, in the top of the neck. Raise it about 2 cm. Side head close-up.
- Feet: within 1 cm of the floor in Walk and Roar. Knees bend forward and shoulders and hips deform cleanly. The gait is a crouched lope with a high back-kick that reads as running, not shambling.

zombie_husk_v2: PASS   score 8
- Head [minor]: the head pivot (138.9 cm, 86.8%) is about 2 cm below the jaw (141 cm) and 5 cm below the back of the skull (about 144 cm), in the upper neck of a long neck, so a nod will bend the neck in its middle. Raise it about 3 cm. Side head close-up.
- R elbow [minor]: the R upper arm is 16.8 cm against 18.0 cm on the L (R forearm 23.3 cm against 21.7 cm), so the R elbow sits about 1.2 cm nearer the shoulder. Lower it about 1 cm to match the L. Front view.
- Walk deformation is clean (side frames 0-4: knees, hips and shoulders) and the feet stay within 1 cm of the floor.

zombie_leechmother_v2: FAIL   score 4
- Root height in motion [blocker]: the whole figure floats. The lowest point is 6-9 cm off the floor in every Walk frame, both feet hover about 8.5 cm through the static Roar, and the Run contact frame floats 6.6 cm. Lower the root about 9 cm, or work out the root offset from this rig's own hip height: her hip joints are at only 47% of the height. Seen in Walk side frames 0-4 with the floor line, and in Roar frames 0-5.
- Head, Neck [major]: the head pivot (144 cm, 82.5%) is about 5 cm below the chin (150 cm), at the fur collar and the base of the neck. The neck joint (137 cm) is about 3 cm low, at the upper chest. Raise the head about 5 cm (to jaw-angle height, just behind the jaw) and the neck about 3 cm. Head close-ups, front and side.
- Shoulders [minor]: the R shoulder joint is 1.7 cm further out and 2.8 cm further forward than the L, and the R upper arm is 19.1 cm against 21.7 cm. Mirror the L. Front and side views.
- Knees [minor]: the L knee is 2 cm lower than the R (26.3% against 27.5%). Both knees are only 1-2 cm ahead of the hip-ankle line, against about 3.5 cm in the reference. They are under the skirt, so judge them by the walk.

zombie_lurker_v2: FAIL   score 6
- L heel / root strand [major]: in Run frame 4 (side), a tapered spike about 50 cm long stretches down from the heel of the kicked-back L foot. It is either a root strand or heel skin weighted half to the foot and half to something that stays low. Either way it tears out of the leg. Re-weight it wholly to the foot (or wholly to the shin).
- Feet [minor]: both feet hover about 3 cm through the Walk (stance ball 7.2-7.9 cm against 4.7 cm at rest) and the static Roar (ankle 18.3-18.6 cm against 15.5 cm).
- R ball [minor]: the R ball is 15.6 cm in front of the ankle against 11.7 cm on the L, so it sits in the toes while the L sits at the toe crease. Move the R ball back about 4 cm. Side feet close-up.
- Shoulders [minor]: the R shoulder joint is 2.7 cm nearer the centre and 3 cm further back than the L (16.3 cm against 19.0 cm out). At mid upper arm the R bone runs about 2.5 cm outboard of the sleeve's middle. The R knee is also 1 cm lower and 1.6 cm further forward than the L. Mirror the L side. Front view.
- Cloth-like (out of scope): the root fringe on the shins goes up to 31 cm through the floor in the Roar crouch and 9 cm in the Walk.

zombie_rimewalker_v2: PASS   score 8
- Head [minor]: the head pivot (155.7 cm, 84.2%) is 3-4 cm below the jaw, inside the coat collar. Raise it about 3 cm. Side head close-up.
- Knees [minor]: in rest the knees are only 1.2-1.3 cm ahead of the hip-ankle line, against about 4 cm in the reference. Move them about 2.5 cm forward. Side view (under the coat).
- Feet [minor]: the planted boot rides about 1.5 cm above the floor through the Walk. Otherwise clean: shoulders sit in the sleeves, elbows at the bend, ankles over the heel, and the trailing boot keeps its shape at toe-off.

zombie_shambler_v2: FAIL   score 5
- Trailing L foot toes [blocker]: at toe-off the bare toes fold backward under the heel and stretch into a spike about 20-25 cm long (Walk side frame 4). ToeBase is turning the wrong way; see the systemic note.
- Arms [minor]: the upper arms are short (L 16.6 cm, R 18.8 cm, about 0.10 of the height) against 22 cm forearms. The elbows may be 2-3 cm high, and the L elbow is about 2 cm nearer its shoulder than the R. The sleeves hide the elbow, but the Roar bend reads fine. At least match the L to the R.
- Knees [minor]: the knees are only 0.3-0.7 cm ahead of the hip-ankle line (reference about 3.5 cm), so the legs read ramrod straight in the side view. Move them about 3 cm forward. Side view and hips-and-knees close-up.
- Head, Neck [minor]: the head pivot is about 4 cm below the open jaw, and the neck joint sits at the nape, 4.8 cm behind both Spine2 and the head (a zig-zag). Raise the head about 3 cm and bring the neck forward about 2 cm. Side head close-up.
- Feet [minor]: the planted foot floats about 1.5 cm in the Walk.

zombie_slagback_v2: FAIL   score 4
- Toes, both feet [blocker]: in Walk side frames 2 and 4, the trailing foot's toes fold backward and stretch into a blade about 35-40 cm long behind the heel. The same happens in Run frames 1, 3 and 4. In the Roar (frames 1-4) the toes hang down about 3 cm through the floor while the heels hover about 4-5 cm.
- Shoulders / upper arm [major]: the shoulder joints (75.6%, 36-38 cm from the centre) sit at the lower outer edge of the pauldrons, where the arm comes out. That leaves a 15 cm upper arm against a 30-33 cm forearm (0.07 against 0.15 of the height). The elbows do sit at the armour's joint and the bare arm's bend, so move the shoulder joints into the shoulder under the pauldron instead, about 6 cm up and 5 cm in, giving an upper arm of about 25 cm. Front view and shoulders close-up.
- Feet in Walk [minor]: the planted sole sits 1-2 cm above the floor.
- Spine [can't judge]: the spine is buried under the slag shell, so I can't see where the back actually is.

zombie_slinger_v2: FAIL   score 3
- Spine chain [blocker]: in the side view, Spine is 10.9 cm in front of the Hips (in the empty belly, in front of the lumbar vertebrae), Spine1 is 13.4 cm behind (inside the quiver) and Spine2 is 5 cm behind: a 24 cm zig-zag on a model whose own vertebral column is visible. Put Spine, Spine1 and Spine2 on the visible vertebrae: about 2 cm behind the Hips line at the waist, rising to about 4 cm behind at the back of the ribcage. In Walk side frames 0-4 the ribcage shears and the lumbar region bends like a rubber hose.
- Shoulders [major]: the shoulder joints (78%, 1.33 m) sit about 5 cm below the visible humeral heads (about 1.38 m). On the bare L arm in the front view the ball of the humerus is clearly above the joint. Raise both about 5 cm.
- Toes [blocker]: at toe-off the trailing foot's toe bones fold backward into a 30-40 cm spray behind the ball (Walk side frames 2 and 4).
- R knee [minor]: the R knee is 6.4 cm ahead of the hip-ankle line against 3.4 cm on the L. Move the R knee back about 3 cm to match. Side view, under the skirt.

zombie_stoker_v2: FAIL   score 5
- Boots [blocker]: in Walk side frames 2 and 4 the trailing boot folds its toe backward and stretches into a blade about 35-40 cm long. The same happens in Run frames 1, 3 and 4.
- Shoulders [minor]: the L shoulder joint is 3.2 cm further out (28.5 cm against 25.3 cm) and 3.5 cm further forward (9.5 cm against 13 cm behind the spine) than the R. Both bones still run through the middle of the arm, so mirror one side. Front and side views.
- Knees, ankles [minor]: the R knee is almost straight (0.6 cm ahead of the hip-ankle line against 2.5 cm on the L), and the L ankle is 1.3 cm higher than the R (22.9 cm against 21.6 cm). Match the R knee and the ankle heights to the L.
- Otherwise good: the ball sits at the boot's crease, the head pivot is at the jaw, and the planted boots sit on the floor in the Walk and Roar.

zombie_warden_v2: FAIL   score 3
- Shoulders [blocker]: both shoulder joints sit at the collarbones beside the neck (R 9.9 cm and L 17.2 cm from the centre) instead of in the shoulders under the fur mantle, about 27-29 cm out. The upper arms therefore run diagonally through the chest plate (R upper arm 44 cm, L 38.9 cm). In the Walk and Roar (three-quarter) the arms visibly sprout from the middle of the chest with the mantle sitting above them. Move the R about 17 cm out and the L about 12 cm out, both about 5 cm down, and mirror them. Front view and shoulders close-up.
- Hips [major]: the Hips root sits 13 cm in front of the hip joints and 14 cm above them (56% against 51%), at the front of the tassets. The spine runs diagonally up and back from there to Spine2, 24 cm behind it. Move the Hips about 13 cm back and 9 cm down, to about 5 cm above the midpoint of the hip joints, and straighten the spine up the middle. Rest side view.
- Toes [blocker]: the trailing boot folds its toe backward by about 20 cm in Walk side frames 2 and 4.
- Feet [minor]: the planted boot floats about 2.4 cm in the Walk.
- Cloth (out of scope): the cape hem goes about 5 cm through the floor in the Roar.

## Systemic (across group E)

- Toe fold-back at toe-off: on 5 of the 11 figures (shambler, slagback, slinger, stoker, warden) the trailing foot's ToeBase bends backward past the sole in the Walk and Run, so toes and boot fronts stretch into 20-40 cm spikes behind the heel on every step. It does not happen on dryking, gnawer, husk, leechmother, rimewalker or lurker, which points at ToeBase's orientation after the refit (the library's toe channel lands mirrored), not at the clip. Check ToeBase's roll against Foot on the bad five, or zero the toe channel.
- The spine chain is not one straight line up the middle of the torso. Slinger (24 cm zig-zag into the belly and the quiver), dryking (Spine and Spine1 11 cm forward) and warden (Hips 13 cm forward of the hip joints, spine running diagonally). Fit Spine, Spine1 and Spine2 on the Hips-to-Neck line through the torso's middle (or the visible vertebrae).
- The root height in motion is not matched to each rig's leg length: leechmother floats 9 cm; lurker and slagback 3-5 cm in places; dryking, shambler, rimewalker and warden 1.5-2.5 cm. Derive the root offset from each rig's own hip height, or lock the stance foot to the floor.
- The head pivot is placed by proportion, at or below the jaw line, so on long or fat necks it lands 2-5 cm down in the neck (leechmother 5, husk 3, shambler 4, rimewalker 3-4, gnawer 2). Put it at the base of the skull, at jaw-angle height just behind the jaw. It matters more on zombies, whose idle is a drooping head.
- Shoulder joints placed where the arm comes out of armour or a mantle instead of inside the shoulder: slagback (too far out and too low, at the pauldron's lower edge), warden (far too far in, at the collarbones), slinger (5 cm below the humeral head). Upper arms on slagback, shambler, husk and gnawer come out at 0.07-0.11 of the height against forearms of 0.13-0.16.
- Left and right differ by 2-4 cm at shoulders, elbows, knees and balls on lurker, stoker, leechmother, shambler, husk and gnawer. Fit one side and mirror it.
- Rest knees are nearly straight (0.3-1.3 cm ahead of the hip-ankle line against about 4 cm): shambler, rimewalker, the stoker's R knee and leechmother.
- Gait (one line): the library walk is an upright, bouncy march with the arms out. Gnawer and husk get a jog-like lope with a high back-kick. None of it shambles yet; these need slumped, foot-dragging cycles.
- Out of scope but worst: in the Roar crouch, robes, capes and root fringes go through the floor (lurker 31 cm, dryking 8 cm, warden 5 cm).
