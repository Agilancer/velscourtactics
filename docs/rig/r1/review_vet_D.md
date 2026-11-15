# Rig review, round 1, group D (veteran)

How I measured: I read every card, then checked the joints against the raw rest renders (`r1/rest/*_front.png`, `*_left.png`) with the
joints from the JSON drawn on top, so I could see the mesh without the card's see-through overlay. Floor contact comes from the
motion JSON: the lowest ball joint in each frame minus its rest height. The motion strips have no floor line, so I could not read
float from them by eye. L and R are the figure's own sides. "x cm from the spine" is the distance sideways from the hips' vertical
line in the front view.

```
totem_master_f_v2: PASS   score 7
- L/R shoulder [minor]: L shoulder joint 21.0 cm from the spine, R 19.2 cm; L clavicle root 1.3 cm further out than R. Mirror
  them (L ~1 cm in, R ~1 cm out). Both sit correctly at the top of the striped sleeve just under the mantle edge. Front view,
  shoulders close-up.
- spine [minor]: Spine2 jumps 8 cm back from Spine1 (64% to 70%) and sits against the back of the upper chest. The neck then comes
  3 cm forward and the head goes 3.4 cm back, so the upper spine zig-zags. Bring Spine2 ~3-4 cm forward into the middle of the
  chest. Side view.
- knees [minor]: on the hip-ankle line (0 cm forward; the reference is ~3.5-4 cm). Move each knee ~3 cm forward inside the
  trouser leg. Side view.
- feet [minor]: planted standing (+0.7 cm in the Bolt). In Walk frames 1 and 6 both balls are 4 cm off the floor (the library
  walk's hip bounce).
- (cloth, out of scope) the tabard and the purple arm drapes ride the legs and arms.

totem_master_m_v2: FAIL   score 5
- R/L shoulder joint [major]: both sit on the beaded collar, 11 cm from the spine. That is ~7 cm too far in and ~3-4 cm too high
  compared with where the bare upper arm's axis goes in under the shoulder pad. Move them to ~18 cm from the spine at ~1.26 m
  height, under the inner half of the pad. Front view, shoulders close-up. In Bolt frames 2-4 the raised R arm pivots out of the
  chest.
- feet [minor]: 2.5 cm off the floor through the whole Bolt (ankles +2 cm). The Walk never gets closer than 2.6 cm. Bolt and Walk.
- R knee [minor]: 1.8 cm lower than L (48.5 vs 50.3 cm), and the R shin is 3 cm shorter. Mirror them. Front view.
- spine [minor]: Spine2 and Neck ~6 cm behind the Spine1 line (a jog backward at 64-70%). Side view.
- knees [minor]: on the hip-ankle line (0 cm forward vs ~3.5-4 cm). Side view.

wizard_f_v2: FAIL   score 3
- hips / feet in motion [blocker]: in the Bolt the hips stand 10 cm above their rest height with near-straight legs. The boots are
  12-15 cm off the floor in all six frames while the hem trails on the floor behind them (motion/wizard_f_v2__Bolt__0_left.png).
  In the Walk the balls never come within 14 cm of the floor. The rest joints are not the cause: the motion's hip height is not
  fitted to this body. Bolt and Walk strips.
- knees [minor]: hidden under the gown; by proportion ~2 cm too high (thigh 35-36 cm, shin 40-41 cm). Front and side views.
- spine [minor]: Spine2 jogs 6.5 cm back from Spine1 to the back of the upper chest, then the head comes 6 cm forward. Side view.
- balls [minor]: 4.9 cm off the floor. In heeled boots the sole bends ~2.5-3 cm up, so the ball is ~2 cm high. Feet close-up.
- (cloth, out of scope) the gown moves as two trouser legs in Walk frames 2-5.

wizard_m_v2: FAIL   score 5
- feet in motion [major]: 5 cm off the floor through the whole Bolt (balls +5.0 cm, ankles +4.5 cm). The Walk never gets closer
  than 5 cm (up to 8 cm). Bolt and Walk.
- L shoulder joint [major]: 5 cm further back than R (8.9 vs 4.0 cm behind the spine line). That puts it at the back edge of the
  big L pauldron, ~5 cm behind the centre of the upper arm hanging under it. Move it ~5 cm forward to mirror R. Side view,
  shoulders close-up (side).
- shoulders [minor]: upper arm 17.6-17.9 cm against a forearm of 21-21.4 cm. Both joints sit on the outer edge of the coat's
  shoulder seam and look ~2 cm too far out. The coat hides the crease, so this is by proportion. Front view.
- knees [minor]: under the robe; by proportion ~2 cm too high (thigh 36.5 cm, shin 41.7 cm).

wren_v2: PASS   score 7
- L/R shoulder [minor]: L shoulder joint 16.7 cm from the spine, R 14.5 cm; L clavicle root 1.5 cm further out. The whole girdle
  sits ~1 cm toward the figure's left. The L elbow is 1.3 cm higher than the R. Mirror them. Front view, shoulders close-up.
- elbows [minor]: upper arm 18-19 cm against a forearm of 22 cm, so the elbows look ~2-3 cm too close to the shoulder. The sleeve
  hides the crease, so I judge by proportion. Front view.
- feet [minor]: 1.6-1.8 cm off the floor through the whole Shoot. The Walk never gets closer than 2.2 cm.
- (animation, not rig) Shoot frames 3-4: the drawing R hand is flung back at arm's length instead of coming to the jaw.

zombie_abbess_v2: FAIL   score 2
- R shoulder joint [blocker]: on the sternum, on the rosary. It is 3.7 cm from the spine (the L is 25 cm out), 8.7 cm lower than
  the L (1.70 vs 1.785 m) and 12.7 cm in front of the spine line. The R clavicle root is also 8.7 cm low, and the R clavicle points
  straight forward. Mirror the L: shoulder joint ~25 cm out at 1.785 m, ~6 cm behind the spine line; clavicle root at the spine at
  1.785 m. Front and side views. In the Walk three-quarter frames and the Roar the R arm grows out of the chest.
- feet in motion [major]: 3.7-4.4 cm off the floor in every Roar and Walk frame; the feet never touch.
- L elbow [minor]: upper arm 24.6 cm against a forearm of 33.5 cm (R forearm 30.6). By proportion it is ~4 cm too close to the
  shoulder; it is under the bell sleeve. Front view.
- (gait, one line) the library walk and run read as a living person, not a lurch.

zombie_bonesack_v2: FAIL   score 6
- head [major]: the bind pose has the head thrown back ~30° (the face looks at the sky in the side view), and the rig takes that
  as neutral. In every Walk frame the face points 45-60° upward, and in the Roar too: the opposite of a drooping head. The head
  joint itself is in the right place (base of the skull, 82%). Re-pose the head and neck ~30° forward and apply that as the rest
  pose, or offset the head in the retarget. Side view; Walk side frames 2-3.
- balls [minor]: on the bare feet the ball is ~2.5 cm too far back, in the arch behind the toe roots, and ~1.5 cm too high
  (3.7 cm). The toes will fold mid-arch. Side feet close-up.
- shoulders [minor]: the joints sit at the very top of the deltoid, ~2 cm too high. The L clavicle root is 4.8 cm from the spine,
  the R 2.9 cm. Front view.
- feet [minor]: standing contact is fine (+0.9 cm). In Walk frames 3 and 5 the mesh dips 1-2 cm through the floor (toes and heel).

zombie_brute_v2: FAIL   score 4
- head and neck joints [major]: the head joint is at the back of the hood, ~23 cm behind the face, which puts it 9-10 cm behind
  the base of the skull. The neck joint is on the back surface of the trapezius, ~8 cm behind the middle of the neck. Move both ~9
  cm forward: the head joint under the ear line at chin height, the neck in the middle of the neck. Side view, head close-up
  (side). As it stands, every nod swings the face on a ~10 cm longer arm.
- feet in motion [major]: 6 cm off the floor in every Roar frame. In Walk frames 3-4 both feet are 8 cm up. Meanwhile the tattered
  skirt goes 6 cm through the floor in the Roar crouch (cloth).
- clavicles and upper spine [minor]: the clavicle roots are 16 cm out from the spine and 14 cm above Spine2; start them ~4-5 cm
  off centre at the top of the sternum. The spine is unevenly spaced: Spine to Spine1 is 6 cm, Spine2 to Neck is 26 cm, so the
  upper chest is one rigid block and the hunch folds low. Even it out to roughly Spine 1.46, Spine1 1.62, Spine2 1.78 m. Front
  view.
- R shoulder [minor]: 4.5 cm further back than the L, and the R clavicle is 4 cm longer. Mirror them. Side view.

zombie_cinder_v2: FAIL   score 6
- R shoulder joint [major]: ~4-5 cm too far in. It sits on the chest at the armpit line instead of inside the deltoid: 13.1 cm
  from the spine vs 16.1 cm for the L, and 2.7 cm further back than the L. The R upper arm comes out 23.7 cm against the L's
  20.6 cm. Move it ~3-4 cm out and ~2.5 cm forward to mirror the L. Front view, shoulders close-up.
- clavicles [minor]: both sweep steeply backward (R 52°, L 36° from straight out sideways), which puts the shoulder joints in the
  back third of the torso. Side view.
- feet [minor]: +1.3 cm through the Roar; the Walk never gets closer than 1.5-2.0 cm.

zombie_driftling_v2: FAIL   score 2
- L elbow [blocker]: in the hanging rags beside the flank, ~7 cm in from and ~4 cm below the arm's real bend (where the bandages
  start). The L upper-arm bone hangs straight down the side while the mesh's upper arm angles outward, and the forearm bone cuts
  across the true elbow. Put the joint at the top of the bandages, ~1.13 m high and ~31 cm from the spine. Front view, shoulders
  close-up.
- R/L knee [blocker]: both knee joints sit between the legs, outside the knees, on the loincloth: R ~6 cm and L ~7.5 cm in from
  the middle of the knee. Move them out to the middle of each knee, R ~9 cm and L ~10 cm from the spine. Front view, hips and
  knees close-up. A hinge 6-7 cm outside the leg will shear the knees sideways as soon as they bend.
- head [minor]: at the jaw hinge, ~3.5 cm in front of the base of the skull. Side view, head close-up.
- L shoulder [minor]: 2.3 cm further out than the R; the L clavicle is 2 cm longer. Front view.
- (cloth, out of scope) the coat hem goes 9 cm through the floor in the Roar crouch.

zombie_drowner_v2: PASS   score 7
- L shoulder [minor]: 2.7 cm further back and 1.6 cm further out than the R. Mirror them. Side and front views.
- spine [minor]: Spine2 jogs 5.8 cm back from Spine1 and the neck stays back (+6 cm), then the head comes 7 cm forward. That works
  for a hunch, but Spine2 ~3 cm further forward would bend more evenly. Side view.
- ankles [minor]: 14.3-15.1 cm (8.2-8.6%), ~1-2 cm high, and the L is 0.8 cm higher than the R. Feet close-up.
- feet [minor]: +1.5 cm through the Roar; the Walk never gets closer than 1.7 cm. The rags go 4 cm through the floor in the Roar
  crouch (cloth).
- The long forearms (26 cm) belong to the mesh: elbows and wrists sit at the bends.
```

## Systemic (across the group)

1. **The motion's hip height is not fitted to each body.** In the standing clips (Bolt, Shoot, Roar) the lowest ball sits 1-12 cm
   above the floor: wizard_f 12.5, brute 6.2, wizard_m 5.0, abbess 3.7, totem_m 2.5, wren 1.7, drowner 1.5, cinder 1.3 cm. In the
   Walk, wizard_f (14 cm), wizard_m (5 cm), abbess (4 cm) and totem_m (2.6 cm) never touch the floor at all. Scale the root
   translation by each figure's own hip-joint height, not its overall height with hats, and add a foot-plant pass. Check it by the
   lowest ball per frame.
2. **Gross misplacements got through, all in the dead:** abbess R shoulder, driftling L elbow, driftling knees. Two checks would
   have caught them: an automatic "is the joint inside the limb" test (cast a ray front and side through each joint) and an L/R
   mirror test that flags any pair more than 2 cm apart. The mirror test also flags wren, cinder, wizard_m's L shoulder, totem_f,
   the drowner, the brute and totem_m's R knee.
3. **The upper spine jogs backward:** Spine2 and Neck sit 6-8 cm behind the Spine1 line, against the back of the upper chest, on
   totem_f, totem_m, wizard_f and the drowner. The brute's spine segments are badly uneven.
4. **Knees sit on the hip-ankle line** (0-2 cm forward against the reference 3.5-4.5 cm) on totem_f, totem_m, wizard_m, wizard_f
   and wren.
5. **Upper arms come out shorter than forearms** on wren, wizard_m, the abbess's L arm and totem_f: elbows ~2-4 cm too close to the
   shoulder where a sleeve hides the crease, or shoulders on the outer edge of the garment. Check them against the mesh.
6. **A posed head in the bind pose is taken as neutral** (the bonesack looks at the sky). Normalise the rest pose of any head that
   was modelled tilted.
7. **(Gait, one line)** the library walk lifts both feet in its passing frames, and the dead walk and run like the living. Replace
   them with bm's walk and jog plus a lurch set, as planned.
8. **(Cloth, out of scope)** gowns, robes, coat hems and rags ride the legs, and in crouches they go 4-9 cm through the floor
   (brute, driftling, drowner).
