# Rig review, round 2, group E (the dead): critic 2 (up-and-comer)

How I checked: I read both cards for every figure. Then I took the joints from `r2/rest/*.json` and `r2/motion/*.json`,
drew them on the clean renders at 2-3x with the floor line, and diffed the rest joints against `r1/rest/*.json`.
"Sinks" and "floats" are measured from the lowest mesh pixel and from the planted ankle and ball compared with their
rest heights. Frames are numbered 0-5, left to right as on the cards. My round-1 verdicts are in `r1/review_upc_E.md`
(drowner's is in `r1/review_upc_D.md`).

What is better everywhere: every spine is now a smooth line up the torso, left and right are exactly mirrored, the
idle and Roar stance feet sit within 1 cm of the floor (the old 2-9 cm floats are gone), and the heads I flagged
moved up by the amounts I asked for. The rig problems that are left are at the floor contacts and the feet.

```
zombie_drowner_v2: FAIL   score 6
- Feet in Run [blocker, known toe-spike issue, not handled]: the wrapped bare feet tear into thin wedges off the sole and toe whenever a foot points down. L about 24 cm (Run f0, leading foot, wedge runs back and down from the sole), L about 30 cm (f2, trailing foot, runs down and forward off the toe), L about 19 cm (f3), R 10-15 cm (f1, f4). Side view.
- Walk contacts [minor]: the heel goes 2.5 cm into the floor at heel strike (f1, planted L ankle 2.5 cm below rest) and the toe tip dips 2.5 cm at toe-off (f3). Side view.
- Rest rig [ok]: the spine is straight (0.4 cm off the Hips-Head line), the knees are 5.5 cm ahead of the hip-ankle line, the wrists sit where the hands start, and the head pivot is at the jaw angle.
- Cloth (out of scope): rag strands go 5.6 cm through the floor in Roar f1-f4.
- Gait: the slumped walk with the hanging head is the best read in the group. The Run turns it back into an upright human jogger.
- round 1: no blockers or majors. Minors: chest kink fixed (Spine2 was 5.8 cm back, now 0.4); L/R shoulder mismatch fixed (mirrored).

zombie_dryking_v2: PASS   score 8
- Walk contacts [minor]: the heel goes 2.3 cm into the floor at heel strike (f1) and the toes about 3.6 cm at toe-off (f3). Side view.
- Roar R foot [minor, known]: the R foot rides 2.9 cm (ankle) to 3.5 cm (ball) high through the Roar. Three-quarter f1-f4.
- Elbows [minor / can't judge]: upper arm and forearm are both 30.0 cm (0.12 of the height), so the elbow sits exactly halfway between shoulder and wrist. With the reference ratio of about 1.08 it may be 1-1.5 cm high, but the gaunt arm shows no clear bend to check against. Front view.
- Bare feet stay intact in the Walk and Run, with no toe spikes.
- Cloth (out of scope): the robe hem goes 13.5 cm through the floor at Run f3 and 8.6 cm in Roar f2.
- round 1: spine zig-zag [major] fixed (Spine and Spine1 moved back 11.4 cm; the chain is now within 0.4 cm of a straight line); planted-foot float [minor] fixed (the stance ball now sits within 0.3 cm of rest height).

zombie_gnawer_v2: FAIL   score 7
- Walk floor contact [major]: this figure gets a deep, lunging version of the walk (the hips drop to 73.5 cm against 97.5 at rest, and the stride is about 1.0 of hip height against 0.55-0.65 on the others). The feet go through the floor on both contacts. The leading heel goes 6-7 cm in at f0 (planted L ankle 6.9 cm below rest, lowest mesh 5.9 cm under). At toe-off the near-vertical trailing foot drives its toes 7.2 cm into the floor (f2) and 4.5 cm (f4). Lift the root by the penetration in those frames, or let ToeBase bend the toes flat at push-off. Side view.
- Knees [minor]: in rest they are 2.8-3.1 cm (1.6-1.8%) ahead of the hip-ankle line against 2-2.5% on the reference. Side view.
- Elbows [minor]: the upper arm and forearm are equal (20.2 cm each), so the elbow may be about 1 cm high. It reads fine in the Roar.
- Run and Roar: clean, with bare feet intact and no spikes. The lead foot leaves the 260 px render frame in Walk f0 and Run f0 (a card framing issue).
- Gait: the crouched stalk suits a gnawer, but it needs its own floor fit.
- round 1: no blockers or majors. Minors: L elbow height fixed (mirrored); head pivot fixed (raised 2.0 cm to the jaw angle).

zombie_husk_v2: FAIL   score 7
- Walk floor contact [major]: it has the same deep lunge as the gnawer (hips 68-80 cm against 89.7 at rest, stride about 1.06 of hip height). The leading heel goes 6.5 cm in at f0 (lowest mesh 5.4 cm under), and the trailing toes stab 7.7 cm into the floor at toe-off f2 and 5.0 cm at f4. Side view.
- Rest rig [ok]: the head pivot is at the jaw angle (88.7%), the knees are 3.5 cm ahead, and the spine is within 0.1 cm of straight.
- Elbows [minor]: the upper arm and forearm are equal (18.8 cm each), so the elbow may be about 1 cm high.
- Run and Roar: clean, with no foot spikes.
- round 1: no blockers or majors. Minors: head pivot fixed (raised 3.0 cm); R elbow mismatch fixed (mirrored).

zombie_leechmother_v2: PASS   score 8
- Shoulders [minor]: mirroring pulled both shoulder joints in to 18.1 cm from the centre (the round-1 L was 23.2). Her deltoid and sleeve run out to about 30 cm, so the joint now sits about 4-5 cm inboard of the upper arm's centreline, at the inner top of the sleeve. Move both out about 4 cm. Front view and shoulders close-up. The Walk and Roar shoulders still deform cleanly.
- Walk contacts [minor]: the heel goes 1.6 cm into the floor at f1 and the toes 2.6 cm at f3.
- Roar R foot [minor, known]: it rides 1.6-2.1 cm high.
- Bare feet stay intact in the Walk and Run.
- round 1: root float [blocker] fixed (the Walk stance ball is within 0.2 cm of rest and the Roar within 0.3 cm, against 6-9 cm before); head and neck [major] fixed (head raised 5.0 cm to the jaw angle, neck 3.0 cm); shoulder L/R mismatch [minor] fixed but overcorrected inward, see above; knees [minor] fixed (now equal heights, 3.3-3.6 cm ahead).

zombie_lurker_v2: FAIL   score 5
- L foot in Run [blocker, known toe-spike issue, not handled]: a thin spike tears off the sole of the L foot whenever that foot is off the ground: about 26 cm running back and down from the leading foot (f0), about 35 cm running forward and down from the trailing foot (f2), and 20-30 cm at f4. The R foot is clean, so something on the L sole (a root strand or skin) is weighted partly to a bone that stays low. Weight it fully to LeftFoot or LeftToeBase. Side view.
- R ball [minor]: it is still 15.6 cm in front of the ankle against 11.7 cm on the L (R foot bone 19.0 cm against 16.0), so it sits in the toes. Move it back about 4 cm. Side feet close-up.
- R knee [minor]: it is 2.7 cm inboard of the hip-ankle line in the front view (the L is 0.4). Under the roots, so judge it in motion; it reads fine there.
- Walk contacts [minor]: the planted feet are within 1.7 cm of the floor.
- Cloth-like (out of scope): the root fringe goes 23 cm through the floor in the Roar crouch (31 cm in round 1) and up to 9.7 cm in the Walk.
- round 1: L heel/root spike [major] unchanged (it moved from the heel in Run f4 to the L sole in Run f0, f2 and f4, 25-35 cm); foot float [minor] fixed; R ball [minor] unchanged; shoulder L/R [minor] fixed (mirrored at 20.0 cm out).

zombie_rimewalker_v2: PASS   score 8
- Walk contacts [minor]: the heel goes 3.6 cm into the floor at heel strike (f1, planted L ankle 2.9 cm below rest) and the toes 2.1 cm at f3. Side view.
- Knees [minor]: they are 2.3 cm (1.3%) ahead of the hip-ankle line against 2-2.5% on the reference. Side view, under the coat.
- Roar R foot [minor, known]: it rides 1.2-2.4 cm high.
- Boots stay intact through the Walk and Run, and the shoulders, elbows and wrists are where they should be.
- round 1: no blockers or majors. Minors: head pivot fixed (raised 3.0 cm); knees better (1.2 cm ahead, now 2.3); Walk float fixed.

zombie_shambler_v2: FAIL   score 6
- Bare L foot in Run [blocker, known toe-spike issue, not handled]: the L toes stretch into a thin wedge about 20 cm long down and forward off the trailing foot (Run f2), and about 10 cm at f1. The shod R foot is clean. Side view.
- L toes in Walk [minor]: at toe-off (f3) the L toes stab 3.4 cm into the floor with a short sliver; that is much better than round 1's 20-25 cm fold-back.
- Knees [minor]: they are 2.4-2.7 cm (1.4-1.5%) ahead of the hip-ankle line. Side view.
- Arms [can't judge]: the upper arm and forearm are 18.6 cm each (0.106 of the height). The wrists sit where the hands come out of the sleeves and the shoulders sit under the coat's shoulder line, so the short arms are in the mesh, not the rig.
- round 1: toe fold-back [blocker] better (gone from the Walk, but a 20 cm toe spike remains in the Run); arm L/R [minor] fixed; knees [minor] better (0.3-0.7 cm ahead, now 2.4-2.7); head and neck [minor] fixed (head raised 4.0 cm, neck brought 4.6 cm forward into line); Walk float [minor] fixed.

zombie_slagback_v2: FAIL   score 3
- Shoulders [blocker]: the "rebuild from the elbow" pulled both shoulder joints in from 36-38 cm to 12.9 cm from the centre (77.2%, 169.9 cm). They now sit beside the neck under the collar scarf, about 16 cm inboard of where the arm hinges under the middle of each pauldron (about 28-31 cm out). The upper arm runs 35.6 cm diagonally through the chest and collar (0.16 of the height, against a 31.5 cm forearm). In Roar f2 (three-quarter) the R arm visibly comes out of the middle of the chest under the hood. Move both joints out about 16-18 cm and up about 2 cm, under the middle of the pauldrons, so the upper arm comes to about 25 cm. Front view and shoulders close-up.
- Feet in Run [blocker, known toe-spike issue, not handled]: the clawed toes of both feet stretch into pale blades 30-40 cm long in every Run frame, forward off the leading foot and back off the trailing one (f0-f4). Side view.
- Feet in Walk and Roar [major, same cause]: the swinging and leading toes stretch 10-15 cm and lie up to 4 cm through the floor (Walk f0, f1). In the Roar the R toes hang 8.5 cm through the floor (f1-f4; round 1 had about 3 cm). Side view.
- Walk contacts [minor]: the heel goes 3.7-4.1 cm into the floor at heel strike (f1).
- Spine [can't judge]: the chain now curves forward to a hunched neck (head pivot 21 cm ahead of the hips, Spine2 9 cm behind the Hips-Head line). That fits the hunched silhouette, but the real back is still hidden under the slag shell.
- round 1: toes [blocker] unchanged (worse in the Roar); shoulders [major] worse (they were too far out, now far too far in; this is now a blocker); Walk float [minor] fixed.

zombie_slinger_v2: FAIL   score 5
- Toe bones in Run [blocker, known toe-spike issue, not handled]: the phalanges stretch into 30-35 cm streaks behind or ahead of the foot whenever it points down (Run f0, f2, f4, both feet). At f3 the toes of both feet go 9 cm through the floor. In the Walk the swinging foot's toe bones splay down 5-10 cm (f1, f2). Side view.
- Knees [minor]: they are only 0.9-1.0 cm (0.5-0.6%) ahead of the hip-ankle line, below the refit's own 1.2% minimum (round 1's R was 6.4; it was moved back 5.4 cm, not the 3 cm I asked for). Bend both about 2 cm forward, onto the femoral condyles. Side view.
- Collarbones [minor]: the Shoulder joints (132.2 cm) sit 3.3 cm below the shoulder joints and about 5 cm below the visible clavicles, so the collar line makes a V up to the shoulders. Raise them about 5 cm onto the clavicles' inner ends. Front view and shoulders close-up.
- Shoulders [minor]: they are about 2 cm below the centre of the visible humeral head (79.7%, 135.5 cm). Front view.
- Spine [minor]: the chain is straight now, but it runs up the middle of the ribcage, about 9 cm in front of the thoracic vertebrae and 2-3 cm in front of the lumbar ones. The ribcage is rigid, so this costs little. Side view.
- round 1: spine zig-zag [blocker] fixed (Spine1 moved 13.5 cm, Spine 10.8 cm, now within 0.2 cm of straight); shoulders [major] better (raised 3.0 cm, about 2 cm low remains); toe fold-back [blocker] unchanged (gone from the Walk's toe-off, but 30-35 cm streaks in the Run); R knee [minor] fixed but overshot (see knees).

zombie_stoker_v2: FAIL   score 4
- Boots [blocker, NOT on the brief's known list: these are boots, not bare feet]: whenever a boot points down, its toe folds back under the heel and smears into a sheet. In the Walk swing the R boot smears 20-30 cm back and down from the ball (f1, f2, f3). In the Run both boots stretch into flat blades 40-60 cm long in every frame (f0-f4). The weights on the boot's toe follow ToeBase rolling the wrong way, the same fold-back as round 1. Side view.
- Walk contacts [minor]: the heel goes 4.7 cm into the floor at heel strike (f1, planted L ankle 3.3 cm below rest). Side view.
- Knees [minor]: they are 3.0-3.2 cm (1.15-1.2%) ahead of the hip-ankle line, at the refit's minimum. Side view.
- Roar R foot [minor, known]: it rides 1.8-2.8 cm high.
- round 1: boot fold-back [blocker] unchanged (worse in the Run); shoulder L/R [minor] fixed (mirrored at 29.1 cm out); R knee and ankle heights [minor] fixed.

zombie_warden_v2: PASS   score 7
- Shoulders [minor]: they are now 21.3 cm out at 75.1%, at the inner edge of the pauldrons where they meet the chest plate. That is about 5-6 cm inboard of the pauldron's middle, where the arm hinges. The bone runs inside the armoured upper arm, and the Walk and Roar three-quarter frames deform cleanly. Move both out about 5 cm. Front view.
- Walk contacts [minor]: the heel goes 5.0 cm into the floor at heel strike (f1, planted L ankle 4.8 cm below rest) and the toes 4.3 cm at f3. That is 2% of the height, the most of the booted figures. Side view.
- Roar R foot [minor, known]: it rides 1.3-3.2 cm high.
- Boots stay intact through the Walk and Run.
- Cloth (out of scope): the cape hem goes 18 cm through the floor at Run f3.
- round 1: shoulders [blocker] better (R 9.9 and L 17.2 cm out before, now 21.3 each; the arms come from the shoulders now, about 5 cm left to go); Hips placement [major] fixed (now 8.8 cm above the hip joints, 1.3 cm forward; the spine runs up the middle); toe fold-back [blocker] fixed; Walk float [minor] fixed.
```

## Systemic (ranked by how many figures they hit)

1. The Walk breaks the floor at its contact frames on 12 of 12. At heel strike (f1; f0 on gnawer and husk) the planted
   ankle sits 1.6-6.9 cm below its rest height and the heel goes into the floor. At toe-off (f3; f2 and f4 on gnawer and
   husk) the toes go 2-8 cm in. Worst are gnawer and husk (6-8 cm, their deep lunge), then warden, stoker, slagback and
   rimewalker (3.6-5 cm). bm's heroes on the same walk stay within 1 cm (ranger_f: +0.2 at f1, +0.7 at f3), so the
   slumped variant lowers the hips without refitting the floor. Fix it with a per-frame root lift (or foot IK to the floor),
   and let ToeBase bend the toes flat at push-off.
2. The Run on 12 of 12 is the hero jog as is: 10-20 cm flight phases (lowest mesh 12-20 cm up at f0, f2 and f4), the
   head up and the arms pumping. It reads as an athletic jogger and throws away the slumped read the walk sets up.
   (Gait, not rig.)
3. The R foot rides 1.5-3.5 cm high in the Roar on 12 of 12 (the known attack-clip issue; minor on its own).
4. Foot spikes in the Run on 6 of 12: drowner, lurker (L only), shambler (bare L only), slagback, slinger and stoker. Toes,
   soles or boot fronts stretch into 20-60 cm blades whenever the foot points down, and stoker shows it in the Walk swing
   as well. Stoker wears boots, so this is not only the bare-foot case the brief lists. The six clean ones (dryking,
   gnawer, husk, leechmother, rimewalker, warden) show it is weighting and ToeBase roll, not the clip. Round 1's warden
   fold-back is fixed, but drowner and lurker now show it because the new Run points the feet harder.
5. The elbow sits at the exact midpoint of shoulder and wrist on 7 of 12 (upper arm equals forearm on dryking, gnawer,
   husk, leechmother, rimewalker, shambler; drowner nearly). The reference upper arm is 5-10% longer, so these elbows
   are about 1-1.5 cm high. Minor, and invisible under sleeves.
6. Shoulder joints under armour and mantles are still unreliable, on 3 of 12: slagback (pulled in to the neck, blocker),
   leechmother (pulled in 5 cm by mirroring) and warden (5 cm short of the pauldron's middle). "Rebuild from the elbow"
   overcorrects inward when the pauldron is huge. Fit the joint under the pauldron's centre, on the upper arm's centreline.
7. Rest knees at or below the refit's 1.2% minimum on 2 of 12: slinger (0.5%) and stoker (1.15%). Rimewalker, shambler
   and gnawer are at 1.3-1.8%, against 2-2.5% on the reference.
