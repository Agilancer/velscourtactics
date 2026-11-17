# Round 2 rig review: veteran, group F (batch-9 recruits, first time before critics)

Cards: `tools/build/rig/r9/cards/<key>_v2_rig.png` and `_v2_motion.png`. Numbers from `tools/build/rig/r9/rest/<key>_v2.json`
(fractions are of the whole model including hats; "knee fwd" is the side-view distance of the knee in front of the
hip-ankle line, as % of that height; "ball" is where the ball joint sits along the boot, measured from the heel's back).

Every figure fails on the one known, unhandled issue, the right foot riding high in the attack clip. The verdict
line therefore says FAIL for all 14. The score is mostly about the rig itself: 7 means the rig is clean apart from
that clip issue.

The round-2 floor fix holds: in every Walk and Run frame the stance foot sits on the same baseline, with no hanging.

---

bertram_v2: FAIL   score 5
- L/R shldr [major]: both shoulder joints are about 3.5 cm too far in. They sit 14.5 cm from the centre (29 cm apart) on a heavy
  torso about 45 cm wide at the armpits, at the inner edge of the puffed sleeve cap. The upper-arm bone runs along the
  sleeve's inner edge instead of its middle. Move each one out to about 18 cm from the centre and keep the height (72.4%).
  Seen in the front view and the shoulders close-up, and on the L arm in Walk three-quarter frames 1 and 6. No tear shows
  yet, but any raised-arm pose will drag the chest and the ruff.
- R foot, attack clip [major, known/unhandled]: the right foot rides high through the whole Strum. The R knee is bent about 30°
  while the L leg is locked straight, and the R boot sole floats about 15 cm above the L. Frames 1-6.
- L/R knee [minor]: 1.0-1.1% forward of the hip-ankle line, below the 1.2% the refit promises. Move them about 0.3 cm forward.
  Side view.
- L/R ball [minor]: the ball joint sits about 64% of the boot length back from the heel, about 2 cm behind where the sole
  flexes. Side feet close-up.
- Strum [note, not rig]: he strums at his chest while the lute stays slung on his back.
- gait: the hero walk reads well on him. The jog stride (about 1.3 m) is long for a short, round body.

bram_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh lifts to horizontal and the ankle is about 40 cm
  off the floor (a flamingo pose). In the end frames (1, 6) the R boot sits about 15 cm above the L.
- L knee [minor]: 0.75% forward of the hip-ankle line (R is 1.0%), and the L knee is 0.5 cm behind the R in the side view.
  Bring L about 1 cm forward to match R and the 1.2% rule.
- L/R ball [minor]: about 62% of the boot length from the heel, about 2 cm behind the flex. Side feet close-up.
- Otherwise sound: the shoulder joints sit under the pauldron domes, the elbows at the couters, the wrists at the gauntlet
  cuffs, the ankles in the boot shafts, and the spine runs straight. The tasset rising with the thigh in Thrust 3-4 is cloth, out of scope.

crispin_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Shoot frames 1-6 the R knee is bent while the L leg is straight, and the R boot
  sits about 15 cm above the L.
- L/R knee [minor]: 0.93-0.96% forward of the hip-ankle line, so the legs are nearly dead straight in the side view.
  Move them about 0.5 cm forward.
- L/R ball [minor]: about 62% of the boot length from the heel, about 2 cm back. Side feet close-up.
- Otherwise clean: the shoulders sit inside the coat's shoulders, the elbows at the cuffs, and the head pivot behind the jaw
  (about 2/3 back from the nose). The long coat following the legs is out of scope.

esteban_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Throw frames 1 and 6 the R knee is bent and the R boot sole floats about 15-20 cm
  above the L, while the L leg is locked straight.
- L/R ball [minor]: 61% of the boot length from the heel (14.9 cm into a 24.4 cm boot), about 2.5 cm behind the flex. Move it
  forward. Side feet close-up.
- L/R knee [minor]: 1.16% forward, just under the rule. Leave it, or add 0.1 cm.
- The R pauldron and shoulder deform cleanly with the arm straight overhead in Throw frames 4-5. Elbows are at the top of the
  bracers, ankles are in the boot shafts with the spurs, and the head pivot is behind the jaw. The tunic skirt following the
  thighs is out of scope.

fiammetta_v2: FAIL   score 6
- R foot, attack clip [major, known/unhandled]: in the Throw end frames 1 and 6 the R foot is about 15 cm high, the R knee bent and
  the L leg straight.
- L/R knee [minor]: these are the straightest legs in the group. L is 0.63% and R 0.84% forward of the hip-ankle line, so the
  L knee is about 1 cm and the R about 0.6 cm short of the 1.2% rule. Side view.
- L/R feet [minor]: the L ankle and ball are 1.4-1.7 cm wider than a mirrored R (front). This follows the mesh's toe-out, so
  just check it is intentional.
- Good: on the heeled boots each ankle sits over the heel and each ball where the forefoot meets the floor. The shoulder
  joint is inside the L pauldron, the hip joints are 12.7 cm apart over the thighs' centres, and the head pivot is at the
  back of the neck under the tricorne. The doublet skirt following the legs is out of scope.

gunnar_v2: FAIL   score 4
- head and neck [major]: the head pivot is about 6 cm too far forward. It sits in the beard about 5 cm behind the nose tip
  instead of at the base of the skull. HeadTop_End is equally forward of the helmet's centre. A nod will swing the back of the
  helmet on a big arc around his mouth. Move the head and neck back about 6 cm. Side view and head close-up (side).
- spine [minor]: it bends forward to reach that pivot (neck 2.5 cm and head 4.9 cm ahead of the hips) and runs in the front third
  of the torso at chest height. It should follow the head fix. Side view.
- L/R shldr [major]: the joints are 15.3 cm from the centre (30.6 cm apart) on a 1.95 m armoured torso about 60 cm wide. They sit at
  the inner edge of the pauldrons, and below the pauldron the upper-arm bone runs about 3 cm in from the arm's middle.
  Move each one out about 4 cm (to about 19-20 cm) and keep the height. Front view and shoulders close-up.
- L knee [minor]: it is 4.6 cm further out than a mirrored R (front) and 2.5 cm further back (side). L is 0.37% forward of its
  hip-ankle line against R's 1.83%. The sideways offset follows his uneven mesh legs. The depth offset does not need to: bring L
  forward about 1.5 cm.
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh is horizontal and the ankle about 40 cm up. In the
  end frames the R boot is about 15 cm high.
- gait: the hero jog's 1.3 m stride is long for this build. Otherwise the walk sits on him fine.

hakon_v2: FAIL   score 6
- head [minor]: the pivot is about 3-4 cm forward, under the jaw in the beard instead of at the base of the skull. It sits
  about 46% of the way back through the head; the others in this group sit at 55-68%. Move it back about 3 cm. Head close-up (side).
- R foot, attack clip [major, known/unhandled]: in the Throw end frames 1 and 6 the R boot is about 15 cm above the L, the R knee
  bent and the L leg straight.
- Otherwise sound: the shoulders sit inside the fur collar, the knees are 1.2-1.4% forward, the ankles are in the boot shafts,
  and the ball is at about 70%. The long coat's front panels swing with the thighs (worst in Walk three-quarter frame 3 and the
  Run); that is out of scope.

halvard_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Strum frames 1-6 the R knee is bent and the R boot is about 15 cm above the L.
- Strum [note, not rig]: he plays at his chest while the fiddle stays on his back.
- Clean rig: the shoulder joints sit inside the pauldrons and in line with the hips in the side view. The elbows are at the cuff
  tops, the wrists at the gloves, and the knees 1.34% forward. The ankles are in the shafts, the ball is at about 68%, and the
  head pivot is behind the jaw. The L boot sits 2.5 cm wider than a mirrored R, but that follows the mesh.

hild_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh is horizontal and the ankle about 40 cm up. In the
  end frames the R boot is about 15 cm high.
- L/R knee [minor]: 0.98-1.0% forward, under the 1.2% rule. Move them about 0.4 cm forward. Side view.
- Good: the shoulder joints are 21.4 cm out, which is right for her broad armoured mesh (the bone runs down the middle of the
  upper arm). The elbows sit at the armour gap and the head pivot at the back of the neck. The ankles are in the greaves, and the
  ball is at about 69%.

ingram_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh is horizontal and the ankle about 40 cm up. In the
  end frames the R boot is about 15 cm high.
- Clean rig: the shoulders are under the pauldrons, the elbows at the couters, and the wrists at the gauntlets. The knees sit in
  the knee cops, 1.7-1.8% forward. The ankles are in the sabaton shafts, the ball is at about 67%, and the head pivot is behind
  the cheek guard. The tassets following the thighs are out of scope.

isabeau_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh is horizontal and the ankle about 40 cm up. In the
  end frames the R boot is about 15 cm high.
- Clean rig: her narrow stance is matched (hip joints 12.9 cm apart over the thighs' centres) and the knees are 1.5% forward.
  The elbows sit at the vambrace tops and the head pivot is at the base of the jaw ahead of the bun. A 1.6 cm L/R knee width
  difference follows the mesh.

leif_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in Thrust frames 3-4 the R thigh is horizontal and the ankle about 40 cm up. In the
  end frames the R boot is about 15 cm high.
- Clean rig: the knees are 2.0-2.2% forward, the closest to bm's heroes in this group. The shoulders are under the pauldrons and
  the single wing rides the R shoulder without stretching in Walk and Run. The ankles are in the sabaton shafts, and the ball sits
  where the real foot would bend inside the pointed sabaton. The head pivot is behind the jaw.

lorenzo_v2: FAIL   score 7
- R foot, attack clip [major, known/unhandled]: in the Slash end frames 1 and 6 the R boot is about 15 cm above the L, the R knee
  bent and the L leg straight.
- Clean rig: the knees are 1.4-1.6% forward and the ball is at about 68%. The elbows are at the bracer tops and the wrists at the
  gloves, the head pivot is behind the jaw, and the spine runs straight. The coat following the legs is out of scope.

marigold_v2: FAIL   score 6
- R foot, attack clip [major, known/unhandled]: in Shoot frames 1-6 the R knee is bent and the R boot is about 15 cm above the L.
- quiver [minor]: it is weighted to the R thigh. It kicks back with the leg in Walk side frame 1 and hangs straight in frame 2.
  Bind it to Hips.
- Shoot [note, clip/retarget]: at full draw (frames 3-4) the R arm goes straight out behind at shoulder height, with the hand about
  45 cm behind the shoulder instead of at the jaw. The joints aren't the cause; check the clip or the retarget of the R
  forearm.
- Good: the knees are 1.4-1.5% forward, the ankles are in the tall boot shafts, and the ball is at about 70%. The shoulders sit in
  the leather pauldrons and the head pivot is behind the jaw.

---

## Systemic, ranked by how many figures they hit

1. **The right foot rides high in every attack clip (14/14, known and unhandled).** Strum, Shoot, Throw and Slash start and end
   with the R knee bent about 30° and the L leg locked straight, so the R boot sole floats about 10-20 cm above the L. Thrust
   (bram, gunnar, hild, ingram, isabeau, leif) is worse: in frames 3-4 the R thigh comes up to horizontal and the ankle is
   about 40 cm off the floor. This alone fails every figure in the group.
2. **Knees below the refit's own 1.2% rule (7/14).** bertram 1.0-1.1, bram L 0.75, crispin 0.93, esteban 1.16, fiammetta
   0.63/0.84, gunnar L 0.37, hild 1.0 (side-view % of height). Either the rule isn't applied to the batch-9 set or it is
   measured differently. Each needs 0.3-1.5 cm forward. Minor.
3. **Ball joint 2-2.5 cm behind where the sole flexes (4/14).** bertram, bram, crispin and esteban have it at 61-64% of the boot
   length from the heel; it should be about 70%. Minor.
4. **Shoulder joints too far in on the heavy-set figures (2/14, major).** bertram and gunnar: about 3.5-4 cm in from the middle of
   the upper arm, at the inner edge of the sleeve or pauldron. The joints on every armoured figure with a slimmer frame are right, so
   whatever placed these two worked off the chest's width rather than the arm's.
5. **Head pivot forward in a big beard (2/14).** gunnar's is 6 cm forward (major), hakon's 3-4 cm (minor). The fitter seems to
   read the beard's front as the face. Check any other bearded figure.
6. **Props and clips, not rig, but visible.** Strum plays an instrument that stays slung on the back (bertram, halvard),
   marigold's quiver is skinned to the R thigh, and marigold's bow draw ends with the arm straight back.
7. **Watch, not a fault (11/14):** the upper arm measures shorter than the forearm, while bm's heroes have it 5-12% longer.
   Against the armour joints the elbows look right, so this is the meshes' proportions more than the rig.

Gait: the hero walk sits well on all 14. Heel strike and toe-off are clean, the feet stay planted, and the knees bend the
right way. The high knee in the passing pose reads a little marching. The hero jog's long flight and about 1.3 m stride is
too long for the stocky ones (bertram, gunnar, bram). Out of scope: coats (crispin, hakon, lorenzo), tunic and doublet
skirts (esteban, fiammetta) and tassets (bram, gunnar, ingram, leif, hild, isabeau) all follow the thighs; the worst are bram's
tasset in Thrust 3-4 and hakon's coat.
