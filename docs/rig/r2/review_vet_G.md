# Round 2 rig review, group G (batch-9 recruits), veteran

Sources: `tools/build/rig/r9/cards/<key>_v2_rig.png` and `_motion.png`, with numbers measured from
`r9/rest/<key>_v2.json` and the per-frame `r9/motion/<key>_v2__<clip>__<n>.json`. Percentages are of the whole model
height, as on the cards. Frame numbers are the cards' frames, 1 to 6 from the left. "Head pitch" is how far the
Head-to-HeadTop line tips forward in the side view compared with the rest pose. "Float" and "sink" are the lowest of
ankle and ball, measured against their own rest heights. These are recruits, so there are no round-1 lines.

Gait in one line, for all 14: bm's walk is there. Heels strike, toes push off, the stance foot stays within 0 to 1.5 cm
of its rest height, and the jog has real flight frames. Three things spoil it on every figure: the bowed head (see the
systemic list), a mid-swing knee lift that puts the ankle 32 to 36 cm off the floor (walk frame 5), and a jog landing
(run frame 4) that drops the hips 17 to 19 cm below the walk's height into a crouch, chin on chest.
Can't judge foot sliding: the clips play in place and the cards carry no root speed.

nell_v2: PASS   score 7
- head/neck [minor]: head pitched 18-21 deg down through the Walk and 25-26 deg through the Run (that includes the
  run's 15 deg body lean). Reads as watching her feet. Walk side, all frames.
- knees [minor]: in the rest side view the knees sit only 0.60% (L) and 0.56% (R) of height ahead of the hip-ankle
  line, about 1.0 cm. The refit promises at least 1.2%, so move both ~1.1 cm forward. They still bend the right way in
  every clip.
- L foot [minor]: sinks 0.9-1.4 cm below its rest height through the whole Strum, all frames.
- hips [minor]: hip joints at +/-5.7 cm, narrow for her pelvis; they sit ~1-2 cm inboard of the trouser legs' centres.
  Front close-up.
- not rig, one line: in Strum her hands play the air in front of her chest while the drum hangs at her left hip.
- shoulders, elbows, wrists, ankles and balls are good: the shoulder joints sit inside the puffed sleeves, not on their
  edge, and the elbows sit just above the bracers.

osric_v2: FAIL   score 5
- head/neck [major]: the worst head pitch in the group, 33-36 deg down through the Walk and 40 deg through the Run.
  He shuffles along staring at the floor like one of the dead. Walk side and three-quarter, all frames.
- neck [major]: at rest the neck-to-head line leans 14 deg BACK; the head pivot sits 1.8 cm behind the neck joint and
  3.9 cm behind the hips in the side view. Every other figure that leans back gets more pitch added in the walk (see
  systemic 1). Move the neck joint ~2.5 cm back toward the nape, or the head pivot 1-2 cm forward, so the neck leans
  forward ~10 deg.
- R foot in Swing [major]: the known "right foot riding high" problem. The whole foot floats 1.8-2.9 cm off the floor
  (ankle up to 3.5 cm) in frames 1-6, the most of any non-Thrust clip.
- knees [minor]: left and right differ. The L knee is 1.84% (3.5 cm) ahead of the hip-ankle line, the R knee only 0.92%
  (1.8 cm). Bring R forward ~1.5 cm to match. Rest side view.
- knees [minor]: at 27.6% the joints sit at the bottom edge of the poleyns. That may be ~1-2 cm low; check against the
  kneecap plate.
- shoulders, elbows and wrists fit the armour well: shoulders under the pauldrons, elbows on the couters, wrists at
  the gauntlet cuffs.

oswin_v2: FAIL   score 5
- R leg in Thrust [major]: the known "right foot riding high". At the thrust (frames 3-4) the R thigh comes up level
  with the hip and the whole foot is 16-18.5 cm off the floor while the body lunges on the left leg. It reads as a crane
  kick.
- L foot in Thrust [major]: the stance foot sinks 2.5 cm (frame 2) and 2.4 cm (frame 5) through the floor. This one is
  not on the known list.
- head/neck [major]: head pitched 21-25 deg down through the Walk and 29 deg through the Run. Walk side, all frames.
- knees [minor]: only 0.60% (1.1 cm) ahead of the hip-ankle line at rest. Move both ~1.1 cm forward.
- head pivot [minor]: at chin level; it could go ~2 cm up toward the earlobe. Head close-up.
- the rest of the rest rig is clean and symmetric. Shoulders sit inside the pauldrons, ankles 29% of foot length from
  the heel.

paloma_v2: FAIL   score 6
- head/neck [major]: head pitched 24-28 deg down through the Walk and 32 deg through the Run; the crest points forward
  ~35 deg. Walk side and three-quarter, all frames.
- elbows [minor]: probably ~2 cm too high. The upper arm is 0.094 of height against a forearm of 0.111, the shortest
  upper arm but one. The joint sits mid-sleeve, ~4 cm above where the red bracer begins. Front rest view.
- knees [minor]: 0.70% / 0.68% (1.2 cm) ahead of the hip-ankle line. Move ~0.9 cm forward.
- R foot in Throw [minor]: floats 1.4-1.5 cm in frames 2-5 (the known right-foot problem, small here).
- the head pivot at chin level matches bm's 0.875 convention once the 9-10% of helmet and crest is taken off. Fine.

perkin_v2: PASS   score 7
- head/neck [minor]: head pitched 16-19 deg down through the Walk and 23-24 deg through the Run.
- L knee [minor]: 0.81% (1.5 cm) ahead of the hip-ankle line against R 1.11%. Move L ~0.7 cm forward.
- shoulders [minor]: the joints sit at the coat's sleeve seam, on the top-outer edge of the shoulder. They could go
  ~1.5 cm down and ~1 cm in. No collapse shows in Slash or Run.
- R foot in Slash [minor]: floats 0.7-1.0 cm in frames 2-4.
- out of scope: the coat tails ride the thighs (walk side frame 5).

prudence_v2: PASS   score 8
- head/neck [minor]: head pitched 18-22 deg down through the Walk and 25-26 deg through the Run.
- R foot in Swing [minor]: floats 1.5-1.6 cm in frames 2-4 (the known problem).
- knees [minor]: at 28.6% the joints sit ~2 cm below the centre of the poleyns. Rest side view.
- the best rest rig in the group: upper arm longer than forearm (0.119 / 0.111), elbows on the couters, knees 1.4-1.6%
  forward, ankles 24% of foot length from the heel. The swing deforms cleanly through the pauldrons and couters.

ragna_v2: FAIL   score 5
- R leg in Thrust [major]: the known problem. The R knee comes up to hip height and the foot is 15-17 cm off the floor
  in frames 3-4.
- L foot in Thrust [major]: the stance foot sinks 2.9 cm (frame 2) and 3.1 cm (frame 5) through the floor.
- head/neck [major]: head pitched 23-27 deg down through the Walk and 31 deg through the Run; the kettle hat hides her
  face in walk frames 1-6 and in Thrust frame 3.
- arms [minor]: shoulder to wrist is 0.204 of height (upper arm 0.097, forearm 0.107), stubby. The joints sit at the
  pauldron, couter and gauntlet cuff, so this is the mesh, not the rig. Noted in case animators wonder why her reach is
  short.
- legs are good: knees 2.6-2.8% forward and in the poleyns, ankles over the heel, wide stance matched left and right.

rodrigo_v2: FAIL   score 5
- R leg in Thrust [major]: the known problem. The foot is 16.6-18.8 cm up in frames 3-4, and it already floats 1.5 cm
  in the idle frames 1 and 6.
- L foot in Thrust [major]: the stance foot sinks 2.5 cm (frame 2) and 2.2 cm (frame 5).
- head/neck [major]: head pitched 26-30 deg down through the Walk and 34 deg through the Run; the visor faces the
  floor. Walk side frame 1 is the clearest.
- neck [minor]: the neck-to-head line leans 7 deg back at rest (head pivot 1.0 cm behind the neck joint), which feeds
  the pitch above. Move the neck joint ~1.5 cm toward the nape.
- knees [minor]: 0.74% / 0.82% (1.4-1.6 cm). Move ~0.8 cm forward.
- elbow discs and pauldrons follow the arms cleanly in Run and Thrust.

sigrun_v2: FAIL   score 6
- R arm in Shoot [major]: the draw never reaches the face. At full draw (frames 3-4) the R elbow is almost straight
  (162-178 deg in both views), and the open draw hand sits 40-52 cm from the head, out behind her at shoulder height. A
  draw has the hand at the jaw with the elbow folded under 40 deg. This is the retarget dropping elbow flexion, not
  joint placement, but it is what the player sees on every attack.
- shoulders [minor]: the joints sit on the pauldron's fur rim, ~2 cm too high and ~1.5 cm too far out. Her upper arm is
  the shortest against its forearm (0.093 vs 0.117). Move the shoulder joints into the head of the arm, which also
  evens the ratio. Front rest view. The bow arm still lifts cleanly in Shoot.
- R foot in Shoot [minor]: floats 1.9-2.0 cm in frames 2-4 (the known problem).
- head/neck [minor]: head pitched 15-19 deg down through the Walk, the least in the group.

silas_v2: FAIL   score 6
- head/neck [major]: head pitched 22-26 deg down through the Walk and 30 deg through the Run. Walk side frame 2 is the
  clearest.
- R arm in Shoot [minor, can't fully judge]: no pistol is on the model, so I can't check the aim. In frame 3 the arm
  goes up at 45 deg with the wrist bent back ~60 deg, palm up, and reads as a wave, not an aim. Check the wrist's roll
  and bend in the retarget.
- shoulders [minor]: the joints sit on the coat's sleeve seam at the outer edge of the shoulder. They could go
  ~1.5 cm down and ~1 cm in. No collapse shows when the arm rises.
- knees [minor]: 0.85% / 0.90% (1.6 cm). Move ~0.6 cm forward.
- R foot in Shoot [minor]: floats 1.4-1.5 cm in frames 2-4.

soraya_v2: FAIL   score 3
- boots/feet skin [blocker]: the boots are weighted to BOTH feet. In every Walk and Run frame the boot leather stretches
  into a sheet along the floor from one foot to the other: ~40 cm in walk frame 1, near the whole stride (about 1 m) in
  run frames 3 and 5. In Strum frames 1-6 the boots smear into one lump. In the rest mesh her feet touch (the balls are
  3 cm apart, and the R ankle is on the midline, -0.9 cm). Repaint each boot 100% to its own Leg, Foot and ToeBase,
  and check for the same fault on any figure whose rest feet touch.
- hips [minor]: hip joints at +/-4.1 cm, against +/-8 cm for a woman's pelvis. They sit at the inner edge of the
  bloomer legs, 2-3 cm too narrow on each side. Front rest close-up. No tearing shows at the hips yet, but move them
  out before the cloth pass.
- balls [minor]: the L ball is 3.6 cm from the toe tip on a 21 cm heeled boot, ~2.5 cm too far forward of where the
  sole meets the floor. The R ball (hidden behind the L boot) looks the same. Rest side view.
- head/neck [minor]: head pitched 15-19 deg down through the Walk.
- the rest mesh stands with the R foot back (shin raked 17 deg). The rig follows the mesh correctly, and the walk
  numbers come out as clean as everyone else's.

sorrel_v2: FAIL   score 5
- R arm in Shoot [major]: same fault as sigrun. At full draw (frames 3-4) the elbow is nearly straight (162-180 deg),
  and the hand is 45-57 cm from the head, held out behind and down at ~40 deg with an open palm.
- head/neck [major]: head pitched 27-30 deg down through the Walk and 34-35 deg through the Run.
- neck [minor]: the neck-to-head line leans 8 deg back at rest (head pivot 1.0 cm behind the neck joint). Move the
  neck joint ~1.5 cm toward the nape.
- R foot in Shoot [minor]: floats 2.0-2.1 cm in frames 2-4.
- shoulders [minor]: the joints sit on the sleeve seam at the top-outer edge. They could go ~1.5 cm down and ~1 cm in.
- legs are good: hips +/-8.7 cm, knees 1.35-1.46% forward, ankles 23% of foot length from the heel.

thordis_v2: FAIL   score 5
- R leg in Thrust [major]: the known problem. The R knee comes up to hip height and the foot is 14.3-16.6 cm up in
  frames 3-4.
- L foot in Thrust [major]: the stance foot sinks 3.0 cm (frame 2) and 3.2 cm (frame 5), the deepest in the group.
- head/neck [major]: head pitched 23-26 deg down through the Walk and 30 deg through the Run.
- otherwise the cleanest armoured rest rig here: shoulders inside the pauldrons, elbows on the couters, hips centred in
  the cuisses (+/-11.8 cm), knees 1.16% forward and in the poleyns, ankles 25% of foot length from the heel, balls 31%
  back from the toe. Knees and sabatons deform cleanly in Walk and Run.

ximena_v2: FAIL   score 6
- R arm in Shoot [major]: same fault as sigrun. At full draw the elbow is nearly straight (162-179 deg), and the hand is
  41-53 cm from the head, held out behind and down. Frames 3-4, both views.
- head/neck [minor]: head pitched 18-21 deg down through the Walk.
- R foot in Shoot [minor]: floats 1.3-1.4 cm in frames 2-4.
- a clean rest rig: knees 1.83-1.85% forward, hips +/-10.4 cm, shoulders inside the pauldrons, elbows where the
  vambraces begin, ankles 28% of foot length from the heel.

## Systemic problems, ranked by how many figures they hit

1. Head bowed in the Walk and Run: 14 of 14 (major on 8: osric, sorrel, rodrigo, paloma, ragna, thordis, silas, oswin).
   The added pitch is about 20 deg minus the rest neck lean, almost exactly on every figure. Osric's neck leans back
   14 deg and gets +33-36; Sigrun's leans forward 4 deg and gets +15-19. So the retarget matches the Neck bone's
   direction to the source and leaves the Head to inherit the difference, on top of a ~20 deg constant. Fix it in the
   retarget: drive Head (and Neck) by the source's world orientation, or take the source's head pitch relative to its
   own rest. Then move the neck joint back on the three figures whose neck leans back (osric, sorrel, rodrigo).
2. Feet in the attack clips: 13 of 14.
   - Most clips: the R foot floats 1.3-2.9 cm (the known "riding high" problem). It is worst on osric's Swing.
   - Thrust (4 of 4: oswin, ragna, rodrigo, thordis): the R knee comes up to hip height and the foot is 14-19 cm off
     the floor at the thrust.
   - Thrust, new: the stance L foot also sinks 2.2-3.2 cm through the floor in frames 2 and 5. That is a floor problem
     not on the known list.
3. Run landing (frame 4) is a crouch, not a jog: 14 of 14. The hips drop 17-19 cm below walk height and the bowed head
   goes into the chest. This is a gait problem, minor on its own; with problem 1 it reads as a stumble.
4. Forearm as long as or longer than the upper arm: 11 of 14 (upper / forearm 0.79-0.91; bm's heroes have 1.05-1.12).
   On most figures the elbows sit correctly at the couters or the tops of the bracers, so this is mostly Meshy's
   proportions. Check sigrun's shoulders (on the fur rim) and paloma's elbows (mid-sleeve), which are rig.
5. Knees under the promised 1.2% forward offset at rest: 7 of 14 (nell 0.56-0.60, oswin 0.60, paloma 0.68-0.70,
   rodrigo 0.74-0.82, perkin L 0.81, silas 0.85-0.90, osric R 0.92), measured in the side view of `r9/rest/*.json`.
   Minor, since every knee still bends the right way in every clip, but the refit's guarantee is not holding. Check how
   it measures.
6. Ranger draw arm dead in Shoot: 3 of 3 (sigrun, sorrel, ximena). The elbow stays straight and the hand stays 40-57 cm
   from the face. This is elbow flexion lost in the retarget, the same everywhere.
7. Shoulder joints on the sleeve seam or pauldron rim, ~1.5-2 cm high and ~1 cm out: 4 of 14 (sigrun, silas, sorrel,
   perkin). Minor; no collapse shows yet.
8. Boot skinned to both feet: 1 of 14 (soraya), but a blocker. Any figure whose rest feet touch should be checked for
   it.
