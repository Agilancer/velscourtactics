# Rig review round 2, group E (the dead): veteran

How I measured: joint numbers come from `r2/rest/*.json` and `r2/motion/*.json`, turned into centimetres with each view's
px_per_m. "Under the floor" and "above the floor" come from the alpha of the clean frame renders (`r2/motion/*_left.png`)
against the floor mark, foot by foot (a flood fill from each ball joint), and were checked by eye on blown-up crops.
Spike lengths are measured from the ball joint to the tip and compared with the same foot at rest. "Toe-off" is the
trailing foot pushing off; "lead" is the foot in front. Heights are fractions of the whole model as the cards draw them.

```
zombie_drowner_v2: FAIL   score 6
- feet, Run [major]: the rag-wrapped forefoot stretches whenever ToeBase bends. The trailing L toes draw into a spike reaching 31 cm from the ball (about 22 cm past the rest toe) in Run f2 side, and the lifting L foot does the same, pointing down at the floor, in Run f3. Under the lead foot the sole pulls back into a blade of about 20 cm behind the heel in Run f0 and f4 (side and three-quarter). This is the open "toe spikes on the bare-footed dead" item. The Walk is clean. Fix: everything behind the ball 100% Foot, the toes 100% ToeBase, a blend band of 2-3 cm at the crease.
- feet on the floor, Walk [minor]: the trailing L toe goes 2.5 cm under the floor at toe-off in Walk f1 and f3 side. The stance foot sits on the floor.
- ankles [minor]: 14.7 cm up (0.084), about 1 cm high for the wrap. L and R now match. Rest side, feet close-up.
- R foot, Roar [minor, known open item]: the R ball rides 1.8 cm above its rest height through the Roar. The rags 3-5 cm through the floor are cloth.
- round 1: no blockers or majors. Minors: L shoulder fixed (mirrored), Spine2 jog fixed (the chain is straight within 0.4 cm), ankle L/R fixed, Walk hover fixed. The Run spikes are new with the new Run.
Spine, head pivot (base of the skull, back third), shoulders, elbows at the bends, knees (3.1% forward, mid-leg) and balls (66% from the heel) are good. Nothing collapses at the knees, elbows or shoulders in Walk, Run or Roar.

zombie_dryking_v2: PASS   score 8
- balls [minor]: about 4 cm behind the toe crease (57% of the foot from the heel, the crease is about 70%) and 5.7 cm up, in the upper half of the foot. Move them about 4 cm forward and 1.5 cm down. Rest side, feet close-up.
- feet on the floor, Walk [minor]: the trailing L toe goes 3.6 cm under the floor at toe-off in Walk f3 side.
- R foot, Roar [minor, known open item]: the R ankle rises 3.0 cm and the R ball 3.4 cm above rest through Roar f1-f4. The toe still touches, so the R heel is raised about 3 cm while the L stands flat.
- legs L/R [minor]: in the front view the R knee is 1.2 cm and the R ankle 1.4 cm nearer the midline than the L (10.6 against 11.8 cm, 11.7 against 13.1 cm). Mirror them. Rest front.
- round 1: Spine and Spine1 in the belly [major] fixed. The chain is straight within 0.4 cm and now runs in the back third of the ribcage, behind the sunken belly (rest side, 60-75%). Elbows (minor) better: upper arm and forearm are both 30 cm. Walk hover (minor) fixed. Balls (minor) unchanged.
Head pivot (jaw level, back third of the skull under the crown), neck, shoulders, knees (2.5% forward) and ankles (0.064) are good. The bare feet stay clean through Walk and Run. Cloth: the robe hem is 13 cm through the floor in Run f3 and 6-9 cm in the Roar.

zombie_gnawer_v2: FAIL   score 7
- feet on the floor, Walk [major]: the Walk (the jog, by design in retarget.py) drives the feet through the floor at both ends of the stride. The lead L heel is 5.9 cm under in Walk f0, the trailing L toes 7.2 cm under in Walk f2, and the trailing R toes 4.5 cm under in Walk f4 (side). The stance foot in f1/f3 sits on the floor, so this is the leg's reach under the slump crouch, not the root height. It needs a ground clamp or foot lock per frame, or less crouch on the long strides.
- knees [minor]: 1.6-1.8% in front of the hip-ankle line (reference 2-2.5%). Move them about 1 cm forward. Rest side, hips and knees close-up.
- balls [minor]: about 3 cm behind the toe crease (62% from the heel). Rest side, feet close-up.
- R foot, Roar [minor, known open item]: hovers 1.4 cm.
- round 1: no blockers or majors. Minors: elbows better (upper arm = forearm = 20.2 cm, L = R), L knee 1.1 cm high fixed, knees better (1.4-1.6% to 1.6-1.8%), balls unchanged.
Spine straight and centred, head pivot at the base of the skull, shoulders good. The bare feet stay clean in Walk and Run, with no spikes.

zombie_husk_v2: FAIL   score 7
- feet on the floor, Walk [major]: the same as the gnawer. The lead L heel is 5.4 cm under in Walk f0, the trailing L toes 7.7 cm under in Walk f2 and the trailing R toes 5.0 cm under in Walk f4 (side). The stance foot is on the floor. Same fix.
- balls [minor]: about 3 cm behind the toe crease (58% from the heel). Rest side, feet close-up.
- R foot, Roar [minor, known open item]: hovers 1.2-2.0 cm.
- round 1: no blockers or majors. Minors: spine kink fixed (straight within 0.1 cm), elbows better (18.8 = 18.8 cm, L = R), balls unchanged.
Head pivot at the base of the skull (37% of the skull depth from the back, upper-teeth level), knees 2.1-2.2% forward, ankles and shoulders good. The bare feet stay clean.

zombie_leechmother_v2: PASS   score 8
- head [can't judge]: the hair hides the skull in both views. The Head joint sits 7.5 cm behind the hips line and the Neck-Head bone tips about 25 degrees back. In Walk, Run and Roar the head and hair move as one piece with no tearing, so I have nothing to fault.
- feet on the floor, Walk [minor]: the trailing L toe goes 2.6 cm under at toe-off in Walk f3.
- balls [minor]: about 3 cm behind the crease (63% from the heel). Rest side, feet close-up.
- R foot, Roar [minor, known open item]: hovers 1.6 cm.
- round 1: floating about 10 cm in every clip [blocker] fixed. The stance foot now sits within 0.6 cm of the floor through the Walk and within 0.4 cm through the Roar. L knee 2.1 cm low fixed (mirrored), knees 0.7-1.2% fixed (now 1.9-2.1%), L shoulder 2.8 cm back fixed.
Spine toward the back of the bloated body, shoulder joints inside the deltoids. The bare feet stay clean in Walk and Run.

zombie_lurker_v2: FAIL   score 4
- feet, Run [blocker]: the trailing L toes stretch into a spike reaching 43 cm from the ball (the rest toe reaches 11 cm, so about 32 cm of stretch) in Run f2 side. Under the lead L foot the sole draws back into a blade of about 22 cm behind the heel in Run f0 and f4 (side and three-quarter). This is the open "toe spikes on the bare-footed dead" item. Re-weight as for the drowner.
- balls [minor]: the L/R mismatch is unchanged. The R ball is 19.0 cm from the ankle against 16.0 cm for the L (76% against 63% of the foot from the heel). Mirror both onto the crease at about 70%. Rest side, feet close-up.
- feet on the floor, Walk [minor]: the toes go about 2 cm under at toe-off in Walk f1 and f3. The moss strands hang 8-23 cm through the floor in Walk and Roar (cloth).
- L foot, Roar [minor]: on this figure the L ball, not the R, rides 1.7 cm high.
- round 1: R forefoot spike [major] fixed in the Walk (the toes fold cleanly in f0-f4) and worse in the Run (now both feet, 22-32 cm). Balls L/R (minor) unchanged. L shoulder and L knee L/R (minor) fixed (mirrored). Hover (minor) fixed.
Spine straight and centred, head pivot inside the hood at the base of the skull, knees 3.1% forward and bending forward. Can't judge the elbows under the moss sleeves (upper arm 19.0 cm against a 22.0 cm forearm).

zombie_rimewalker_v2: PASS   score 8
- knees [minor]: 1.27% (2.3 cm) in front of the hip-ankle line, reference 2-2.5%. Move them about 1.5 cm forward. Rest side, hips and knees close-up.
- feet on the floor, Walk [minor]: the trailing L boot toe goes 3.6 cm under at toe-off in Walk f1 and 2.1 cm under in f3.
- R foot, Roar [minor, known open item]: hovers 1.0 cm (the ball is 2.3 cm above rest).
- round 1: no blockers or majors. Minors: knees better (0.7% to 1.27%), Walk hover fixed.
Spine straight and centred, shoulder joints inside the coat's shoulders, head pivot at the base of the skull under the helmet. Elbows, wrists, ankles (0.079) and balls (68% from the heel) are good. The boots stay rigid through Walk and Run. Cloth: the greatcoat skirt rides with the thighs.

zombie_shambler_v2: FAIL   score 7
- bare L foot, Run [major]: the toes stretch into a spike of about 11 cm past the rest toe on the trailing foot in Run f2 side, and flick down in Run f3. The shoe on the R foot stays rigid. This is the open "toe spikes on the bare-footed dead" item. Re-weight the bare foot as for the drowner.
- knees [minor]: 1.4-1.5% in front of the hip-ankle line. Move them about 1 cm forward. Rest side.
- feet on the floor, Walk [minor]: the bare L toe goes 3.4 cm under at toe-off in Walk f3.
- balls [minor]: the L ball is 1 cm further back than the R (15.1 against 16.1 cm from the ankle). Rest side, feet close-up.
- R foot, Roar [minor, known open item]: hovers 1.4 cm.
- round 1: no blockers or majors. Minors: knees better (0.1-0.4% to 1.4-1.5%), L shoulder and L upper arm fixed (mirrored, upper arm = forearm = 18.6 cm), L knee 2.9 cm out better (now 1.2 cm), trailing-shoe spike fixed on the shoe, Walk hover fixed.
The head hangs forward as sculpted and the pivot sits at the top of the neck, mid-depth. Spine, shoulders and ankles are good.

zombie_slagback_v2: FAIL   score 4
- feet and claws [blocker]: the claws stretch whenever ToeBase bends, and this happens in the Walk. The trailing R claws reach 31 cm from the ball (14 cm at rest) in Walk f1 side, and the trailing claws draw out again in Walk f3. In the Run the trailing L claws reach 59 cm (Run f2), and 30 cm blades hang under the lead foot (Run f0 and f4). In the Roar the claws curl 6-8 cm into the floor on both feet (Roar f1-f4 side), worse than round 1's 3-5 cm. This belongs to the known bare-feet item, but here it is in the Walk. Weight the claws rigidly to ToeBase and stop the Foot/ToeBase blend at the claw roots.
- shoulders [major]: the rebuilt shoulder joints sit 12.9 cm from the midline, inside the hip joints (17.7 cm), at 0.772, above the collarbone root (0.755), on the neck-side edge of the pauldrons. The bare R arm leaves the trunk about 6-7 cm further out and about 8 cm lower. The L arm's armour starts about 10 cm further out. Move both joints about 7 cm out and 8 cm down, under the pauldron domes (about 20 cm from the midline, near 0.735). Rest front, shoulders close-up. Walk, Run and Roar don't tear yet, but any raise will pivot the arm round the collar.
- ankles [minor]: 19 cm up (0.087), about 2 cm high. Unchanged. Rest side, feet close-up.
- R foot, Roar [minor, known open item]: the R ball rides 1.6 cm above rest.
- round 1: Neck/Head through the hump [major] fixed. The Head joint moved about 21 cm forward to the base of the skull inside the hood, the neck arcs forward to it, and the skull rides with the neck in the Walk and Run three-quarter. Elbows a third of the way down the arm [major] fixed: the elbow is now mid-arm on the bare R arm (upper arm 35.6 cm, forearm 31.5 cm), but the shoulder joints moved too far in (above). Claws stretching [major] unchanged in the Walk and worse in the Run. Ankles (minor) unchanged. Claw tips under the floor in the Roar (minor) worse.

zombie_slinger_v2: FAIL   score 3
- ankles [major]: unchanged from round 1. The ankle is 12.8 cm up (0.075), about 5 cm above the talus and 2-3 cm in front of the tibia in the side view, on the tibia's inner edge in the front view. The Foot joint sits exactly under the hip (z = 0.0) with ToeBase straight ahead of it (same x), which looks as if the hidden-feet rule fired on a figure whose bone feet are in plain view. On a figure of rigid bones the whole foot now swings on an arc round a point inside the shin. In Walk f1 the R heel bone sits 5 cm beyond the ankle joint along the shin. Put the ankle on the talus, where the tibia meets the foot bones (about 7.5 cm up, about 2.5 cm further back). Rest side and front, feet close-ups.
- toes [blocker]: the balls float about 3 cm above the toe bones, at the inner edge of each foot (rest side and front). The phalanges stretch: in Walk f1 the R toes reach 17 cm from the ball against 5 cm at rest, and in Run f1/f2 the trailing toes spike to about 42 cm, and down into the floor in Run f3. Put the balls on the metatarsal heads and weight the phalanges wholly to ToeBase. Bones must not stretch.
- spine and neck [minor]: the chain is now straight and goes through the lumbar vertebrae. At chest height it runs about 4-5 cm in front of the thoracic column, and the Neck joint about 3-4 cm in front of the cervical vertebrae. Move Spine2 and Neck back onto the column. Rest side, 70-82%.
- knees [minor]: only 0.9-1.0 cm (0.5%) in front of the hip-ankle line, below the refit's own 1.2% floor. Move them about 2.5 cm forward. Rest side. They still bend forward in the strips.
- round 1: Spine/Spine1 Z [major] better (straight, see above). Ankles [major] unchanged. Toes [major] unchanged in the Walk and worse in the Run. R knee asymmetry (minor) fixed (mirrored).
Head pivot, shoulder joints on the humeral heads, and elbows at the ends of the humerus are good.

zombie_stoker_v2: FAIL   score 4
- boots, Run [blocker]: the boots stretch into blades. The trailing L boot reaches 72 cm from its ball against 13 cm at rest (Run f2 side). The lead boot flattens into a pancake 25-30 cm long (Run f0, f2, f4), and the same shows in the three-quarter view. This is a boot, not a bare foot, so it is not the known toe-spike item. It is the weights.
- boots, Walk [major]: the shaft of the swinging boot folds out into a flap of 10-15 cm (Walk f2 and f3 side), so the cuff rides with Foot instead of Leg. The trailing boot bends like rubber at the toe (Walk f1 and f3). Make each boot rigid: the shaft above the ankle on Leg, the boot on Foot, the toe cap on ToeBase, with a narrow blend at the ball only.
- ankles [minor]: 22 cm up (0.085), about 2 cm high for the boot. Unchanged, but L and R now match. Rest side, feet close-up.
- knees [minor]: 1.1-1.2% forward. Move them about 2 cm forward. Rest side.
- feet on the floor [minor]: the trailing toe is 4.0 cm under at toe-off (Walk f1). The soles sink about 1.5 cm in the Roar.
- R foot, Roar [minor, known open item]: the R heel is up about 3 cm on its toe (the ball is 2.8 cm above rest).
- round 1: shoulders at the back of the deltoid [major] fixed. L and R are mirrored and the joints are now within about 1-2 cm of the middle of the upper arm in the side view. Boots stretching [major] unchanged in cause: the Walk shows flaps and bending instead of a 20 cm blade, and the Run is worse. Ankles (minor) unchanged. Knees (minor) better (0.2-0.9% to 1.1-1.2%).
Spine straight and centred, head pivot good, balls good (73% of the boot).

zombie_warden_v2: PASS   score 8
- head pivot [minor]: it sits toward the back of the skull, about a quarter of the head's depth from the back of the helm (a third is the base of the skull), so about 2-3 cm too far back. The Neck-Head bone tips back while Spine2 bows 2.8 cm forward. Move Head about 2-3 cm forward and let the neck run straight. Rest side, head close-up.
- feet on the floor, Walk [minor]: the trailing boot toe goes 3.6 cm under at toe-off in Walk f1 and 4.3 cm under in f3.
- ankles [minor]: 21 cm up (0.082), about 2 cm high. Unchanged. Rest side, feet close-up.
- R foot, Roar [minor, known open item]: the R ball is 3.2 cm above rest with the toe on the floor, so the heel is up.
- round 1: Hips on the front plate and spine zigzag [major] fixed. Hips now sits between the hip joints (1.3 cm in front of them) and the chain runs as a smooth curve. R shoulder 7 cm inboard [major] fixed (mirrored, both 21.3 cm from the midline, under the pauldrons). Walk hover (minor) fixed.
Knees (1.6-1.7%), elbows and the shoulders under the pauldrons are good. The boots stay rigid through Walk and Run. The armour and the fur mantle hold together. Cloth: the cape and tassets move with the legs, and the cape goes 18 cm through the floor in Run f3.
```

## Systemic (ranked by how many figures they hit)

1. **Feet sink at the ends of the Walk stride: 12 of 12.** The stance foot sits on the floor now, but at toe-off (Walk
   f1/f3) the trailing toe goes 2-4.5 cm through the floor on ten figures. On the gnawer and the husk, whose Walk is the jog,
   the lead heel and the trailing toes go 4.5-7.7 cm under (f0, f2, f4). The rest-floor offset is a constant, so it
   can't follow the foot. A per-frame ground clamp or foot lock on heel and toe fixes all of it.
2. **The R foot rides high in the Roar: 11 of 12 (known open item).** The R ball sits 1.4-3.4 cm above its rest height
   while the L stays planted. On the gnawer, husk, leechmother, rimewalker, shambler and slinger the R foot hovers
   1-2 cm. On the dryking, warden and stoker it stands on its toe with the heel up about 3 cm. Minor everywhere. The
   lurker is the odd one out: its L foot rises.
3. **Feet stretch when ToeBase bends: 6 of 12 (slinger, slagback, stoker, lurker, drowner, shambler), a blocker on
   4.** Toes, claws and boots draw out into spikes reaching 30-72 cm from the ball at push-off. Under the lead foot the
   sole folds back into a 20-30 cm blade behind the heel when the toes bend up. On the slinger, slagback and stoker it
   already happens in the Walk. It is not the clip: the dryking, gnawer, husk and leechmother (bare feet) and the
   rimewalker and warden (boots) go through the same Walk and Run with clean feet. The weights are spread across Foot
   and ToeBase (and on the stoker the boot shaft is on Foot). Fix: behind the ball 100% Foot, toes 100% ToeBase, a
   2-3 cm blend, boots and claws rigid. Only some of these are "bare-footed": the stoker wears boots.
4. **Knees still under the reference: 6 of 12.** 0.5-1.8% in front of the hip-ankle line against 2-2.5%: the slinger
   at 0.5% (below the refit's own 1.2% floor), the stoker 1.1-1.2%, the rimewalker 1.27%, the shambler 1.4-1.5%, the
   warden 1.6-1.7% and the gnawer 1.6-1.8%. No knee bends backwards in any strip.
5. **Feet details unchanged from round 1: 8 of 12.** Ankles are 1-2 cm high on the big booted or wrapped figures
   (stoker, slagback, warden, drowner, lurker; 0.082-0.087). Balls sit 3-4 cm behind the toe crease on the bare feet
   (dryking, gnawer, husk, leechmother). The lurker's balls are 3 cm apart L/R.
6. **The rules misfire on single figures: 2.** On the slagback, "rebuild the shoulder from the elbow" put the joints 12.9 cm
   from the midline, inside the hip joints. On the slinger the feet look placed by the hidden-feet rule (ankle exactly
   under the hip, ball straight ahead) on a figure whose bone feet are in plain view. Check any rebuilt shoulder against
   the hip width and the arm's root in the front view. Never run the hidden-feet rule on a figure whose toes are
   visible.
7. **Gait (all 12).** The slumped Walk reads right: torso pitched, head hung, a short stride, arms loose. The Run is
   bm's jog under the slump, but it reads as a bounding sprint: 11-20 cm of flight in f0/f2/f4 and the trailing shin
   kicked up to horizontal in f0/f5. That is too athletic for the dead, and wrong for the 2.5-2.6 m robed dryking and
   warden. The warden's head hangs about 50 degrees in the Walk and 60 in the Run, so the iso camera loses the face. The
   gnawer and husk use the jog as their Walk by design, which is what drives their floor problem (item 1).
