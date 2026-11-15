# Rig review r1, group A: veteran

Judged from the 10:37 cards (`r1/cards/*_rig.png`, `*_motion.png`), plus the card-time joint JSON for measurements. Heights
are fractions of stature (floor to HeadTop_End). Lateral distances are measured from the spine in the front view. "Forward"
and "back" refer to the side view, where the figure faces left. Floats are the lowest foot joint against its rest height
in the side frames.

Note for whoever fixes these: r1/rest and r1/motion were rewritten at 10:47-10:49 for arcane_sorcerer_f/m,
barbarian_f/m, bard_f/m, boomerang_knight_f/m and brakka, after the cards were made. Some findings below, such as
arcane_f's feet, may already be different in that newer data. Re-render the cards before round 2.

```
arcane_sorcerer_f_v2: FAIL   score 5
- L/R feet [major]: the feet don't match. In the side view the L ankle is ~17 cm AHEAD of the R ankle and the L ball ~15 cm
  ahead of the R ball. The L shin slants ~12 cm forward from the knee and the R shin slants back, but the front view shows two
  straight legs with the feet side by side, and there the L ankle is 2.7 cm higher than the R (16.0 vs 13.2 cm). The gown hides
  the boots, so at least one foot is guessed. Put both ankles over the heel under the hip line (the R one is closer), mirror,
  and set both ankles to the same height. Shown in the rest side view and the feet close-up (side).
- shoulders [minor]: the R joint is 13.7 cm from the midline and the L 11.3 cm, so 2.4 cm asymmetric and both a little
  narrow. Move the L one ~2 cm out. Front view and shoulders close-up.
- spine: straight, reclined ~3.7 cm back from hips to head. Fine. The head pivot is at the jaw line. Fine.
- motion: the knees bend forward and nothing tears. The gown front tents forward over the lifted knee (Walk side frames 1
  and 6). That is cloth and out of scope.

arcane_sorcerer_m_v2: FAIL   score 4
- feet [major]: in the side view the L ankle sits ~16 cm BEHIND the R ankle. The L foot (ankle to ball) is 18 cm and the R
  foot 10.6 cm, with the R ball almost straight under the R ankle. In the front view the L ball turns ~5 cm inward of the L
  ankle. Both feet are under the robe and at least one is wrong. Bring the L ankle ~8 cm forward, move the R ball ~7 cm
  forward, and mirror. Feet close-ups, front and side.
- wrists and forearms [major]: both wrist joints sit mid-bracer, ~6-8 cm short of where the glove starts (front and side,
  clearest on the R arm). The forearm bones are only ~12.5 cm (reference ~22 cm), so the forearm twist and the hand bend
  happen inside the bracer. In the Bolt and Run frames the hand and bracer reach well past the wrist dot. Move each wrist
  ~7 cm out to the glove cuff. Then re-seat the elbow where the forearm enters the bell sleeve: it is probably ~5-7 cm too
  high, but I can't see it under the sleeve.
- upper spine and neck [major]: Spine2 is 5.7 cm and Neck 7.2 cm behind the hips line, then the head comes 7 cm forward
  again. The neck pivot sits at the back of the high collar. Move Neck ~5-6 cm forward and Spine2 ~4 cm forward onto the
  straight line from Spine1 to Head. Rest side view and shoulders close-up (side).
- shoulders [major]: the R joint is 15.7 cm from the midline and the L 11.1 cm. The L pivot is ~4.5 cm inside the shoulder,
  under the cape lining. Move it ~4 cm out.
- motion: the legs deform fine. The data says the Bolt stance floats ~5 cm; I couldn't check that on the card because the
  files were rewritten.

barbarian_f_v2: PASS   score 8
- shoulders [minor]: R 13.7 cm and L 16.9 cm from the midline (3.2 cm asymmetric), and the L elbow is 1.8 cm higher than the
  R. Move R ~1.5 cm out and L ~1.5 cm in, then let the L elbow come down to match. Front view.
- spine [minor]: the first Spine joint sits ~4 cm forward of the line from Hips to Spine1 (a small kink low in the belly).
  Move it ~4 cm back. Rest side view.
- knees [minor]: +1.1 and +1.3% forward, a touch straight. Fine to leave.
- legs and feet: ankles over the heel, balls at the sole bend, proportions on the reference. The Walk, Run and Swing are
  clean and the Swing is planted (+1 cm).

barbarian_m_v2: PASS   score 9
- knees [minor]: dead straight in rest (+0.1 and +0.3% forward against the reference 2-2.5%). Each joint is still inside the
  knee, but nudging both ~2-3 cm forward would give the knees a clear bend direction. Hips-and-knees close-up (side).
- R upper arm [minor]: 2 cm shorter than the L (the R elbow is ~2 cm higher). Front view.
- motion: clean. The Swing is planted. The Run's contact frame (frame 3) pushes the foot ~2 cm through the floor (systemic).

bard_f_v2: FAIL   score 7
- neck [major]: the Neck joint is 6.3 cm behind Spine2 and 2 cm behind the head joint, at the back surface of the neck
  under the high collar. Nods will hinge at the nape and stretch the throat. Move it ~5 cm forward onto the line from Spine2
  to Head. Head close-up (side).
- L elbow [minor]: ~3 cm higher up the arm than the R (upper arm 17.6 cm vs 20.5 cm). The shoulders are also 2.3 cm
  asymmetric (L 17.3 cm, R 15.0 cm from the midline). Front view and shoulders close-up.
- knees [minor]: 0.4-0.9 cm behind the line from hip to ankle (slightly hyperextended in rest). Move ~2 cm forward.
- feet: the heeled boots are right, ankle over the heel and ball at the sole bend. The Walk, Run and Strum deform cleanly.

bard_m_v2: PASS   score 8
- neck [minor]: the Neck joint is ~4 cm behind the line from Spine2 to Head (at the back of the collar). Move it ~3 cm
  forward. Rest side view.
- elbows [minor]: the upper arms are short (0.12 of stature against the 0.133+ reference), so the elbows sit ~2 cm high at
  the end of the puffed sleeve. Check them, and move ~2 cm down if the crease is lower. Front close-up.
- head [minor]: the head pivot is at 0.888, ~2 cm above the reference, at the chin line. Acceptable.
- motion: clean. The Strum is planted.

boomerang_knight_f_v2: FAIL   score 5
- shoulders [major]: the R joint is 11.6 cm from the midline and the L 18.6 cm, 7 cm asymmetric. The R one sits at the inner
  edge of the upper arm under the pauldron and the L one at the outer top of the shoulder under the cape. Move R ~3.5 cm
  out and L ~3.5 cm in. The L upper arm (15 cm) and forearm (17 cm) come out short because of this. Re-check the L elbow and
  wrist after the move. Front view and the shoulders close-up.
- upper spine [major]: Spine2 is ~5.5 cm behind Spine1 and ~5 cm behind the Neck, a zig-zag with Spine2 at the shoulder
  blades. Move Spine2 ~4-5 cm forward onto the line from Spine1 to Neck. Shoulders close-up (side).
- legs and feet: good. The knees are +2.6% forward (on the reference), and the heeled boot is right (ankle over the heel,
  ball at the sole bend). The Throw is planted and deforms fine.

boomerang_knight_m_v2: PASS   score 8
- elbows [minor]: they sit at the top edge of the vambrace, ~2-3 cm high (upper arm 0.106-0.114 against forearm 0.13).
  Move them ~2 cm down the arm. Front view.
- shoulders [minor]: R 16.2 cm and L 17.9 cm from the midline (1.7 cm asymmetric).
- Throw [minor]: the stance floats 1.5-2 cm in every frame.
- the spine is straight, the knees are a touch straight (+0.5%), and the feet are good.

brakka_v2: FAIL   score 5
- L arm [major]: the L shoulder joint is 26.5 cm from the midline (R 23.1 cm) and 6.3 cm further back than the R in the
  side view, sitting in the fur mantle. The L elbow hangs ~9 cm behind the visible arm in the side view: the cyan elbow is
  out behind the bicep. Move the L shoulder ~3 cm in and ~6 cm forward, and the L elbow ~8-9 cm forward into the middle of
  the arm. Rest side view and the shoulders close-up (side).
- planted stance [major]: the Swing floats 3-4 cm in all six frames, and the Walk stance foot is up to 7.7 cm off the floor.
  The hip height in the retarget is too high for her legs.
- upper arms: short (0.10), but the elbows sit at the top of the bracers where the crease is, so the arms themselves are
  fine. The R arm is fine.
- legs, feet and spine: good. The knees are on the leg's middle, the ankles over the heel, the balls at the sole bend, and
  the spine is straight.

carrion_witch_f_v2: FAIL   score 5
- R shoulder [major]: the R joint is only 9 cm from the midline (L 20 cm), under the feather collar near the base of the
  neck. Raising the arm in the Bolt will pull the collar and chest with it. Move R ~5-6 cm out and L ~2-3 cm in. The R arm
  chain is shifted inward with it (R upper arm 0.131 against L 0.100), so re-check the R elbow and wrist after the move.
  Front view and shoulders close-up.
- spine [minor]: Spine, Spine1 and Spine2 bow ~4 cm forward of the line from hips to neck, toward the corset front, and the
  neck kinks back 4 cm. Straighten the spine (Spine1 ~3 cm back). Shoulders close-up (side).
- legs: hidden under the robe. The feet sit under the toes that peek out, and the knees are +1.5% forward. Fine.
- motion: the legs bend fine. The Bolt floats ~2 cm (minor).

carrion_witch_m_v2: FAIL   score 3
- R foot [blocker]: the R ankle and ball sit in the robe folds ~12 cm to the figure's right of the R boot (the boot is
  visible between the robe panels in the front render) and ~16 cm behind the L foot in the side view. The R shin bone is
  6 cm longer than the L (0.289 vs 0.251 of stature). Move the R ankle ~12 cm toward the midline and ~15 cm forward, then
  mirror the L leg. Feet close-ups, front and side.
- shoulders [major]: both joints are only 8-8.5 cm from the midline, at the base of the neck inside the feather mantle. The
  tops of the arms are ~16-17 cm out. Move both ~8 cm outward. Front view and shoulders close-up.
- upper spine [major]: Spine2 is 7-8 cm behind both Spine1 and the Neck, a zig-zag at the shoulder blades. Move Spine2 ~7 cm
  forward. Rest side view.
- motion: the Walk and Run bend the right way at this size. The Bolt floats ~2 cm.

death_knight_f_v2: FAIL   score 7
- neck [major]: the Neck joint is only 2 cm under the head joint (0.894 vs 0.906), at the bottom rim of the helmet, ~6 cm too
  high. The neck has no length, so the gorget rides on Spine2 and the head hinges at the chin. Move the Neck ~6 cm down to the
  top of the gorget (~0.85-0.86). Head close-up, front and side.
- head bone [minor]: HeadTop_End sits ~30 degrees off to the figure's left and forward, outside the helm. Straighten it
  above the head joint.
- the rest is good. The shoulders are symmetric (18 cm each, inside the pauldrons), the elbows sit in the red elbow gaps, the
  wrists at the gauntlet cuff, and the spine is straight. The knees are +2.2% (L) and +0.8% (R) forward. The feet are right.
  The Swing is planted.

death_knight_m_v2: FAIL   score 6
- pelvis and spine [major]: the Hips root is 5 cm behind the hip joints, Spine and Spine1 run in line with the hip joints,
  and Spine2 steps back 6 cm to the depth of the shoulder joints. The torso pivots at the back of the plate twice. Bring the
  Hips root ~5 cm forward to sit between the hip joints, and Spine2 ~5 cm forward onto the line. Shoulders close-up (side).
- knees [minor]: 1.6 cm behind the line from hip to ankle (hyperextended in rest). The joint is still inside the poleyn.
  Nudge it ~2-3 cm forward.
- L elbow [minor]: 2.8 cm higher than the R (upper arm 0.097 vs 0.112). Front view.
- floor [minor]: the figure sinks. The Walk stance is 1.3-1.8 cm into the floor, the Swing 0.6-1.2 cm, and the Run's contact
  frame (frame 3) 4.5 cm. The retarget hip height is ~1.5 cm low.

dragon_knight_f_v2: FAIL   score 4
- floor [blocker]: she floats in every clip. The boots are ~8 cm above the floor in all six Swing frames and ~10-12 cm in
  the Walk stance, though the rest pose is on the floor. The gown hem reaches the floor and hides some of it, but the boots
  don't touch. The retarget hip height is ~8 cm too high. I checked this on the Swing and Walk side frames with the floor
  line drawn.
- upper spine [major]: Spine2 is 5.7 cm behind Spine1 and 6.8 cm behind the Neck, which juts forward. Move Spine2 ~5 cm
  forward. Rest side view and shoulders close-up (side).
- legs [minor]: in the front view the L knee is 1.4 cm and the L ankle 2.7 cm higher than the R. The legs are hidden in
  flared trousers and I can't see the boots. Mirror.
- shoulders [minor]: R 11.9 cm and L 14.5 cm from the midline (2.6 cm asymmetric). Move L ~1.5 cm in and R ~1.5 cm out.
- motion: the knees, hips and elbows deform cleanly.

dragon_knight_m_v2: FAIL   score 6
- upper spine [major]: Spine2 is ~10 cm behind Spine1. It sits at the depth of the shoulder joints at the back of the chest
  plate, while Spine1 is ~3 cm forward of the torso's middle. Move Spine2 ~6 cm forward and Spine1 ~2 cm back. Rest side
  view and shoulders close-up (side).
- shoulders [minor]: the shoulder joints are 8-9 cm behind the hip line in the side view, probably ~3 cm too far back in the
  deltoid. They are laterally symmetric (18 and 19 cm). Check.
- R knee [minor]: 1.7 cm lower than the L in the front view.
- Swing [minor]: the stance floats 2.5-3 cm in every frame.
- the head, elbows, wrists and feet are good. The Walk, Run and Swing deform cleanly. The tail rides on the legs, so give it
  its own bones or hip-only weights later.
```

## Across many figures (systemic)

1. **The upper spine has a dog-leg.** On eight of these figures, Spine2 (or the Neck) is pulled back to the depth of the
   shoulder joints, 4-10 cm behind the line from Spine1 to Head:
   - Spine2: dragon_knight_m 10 cm, carrion_witch_m 7-8 cm, dragon_knight_f 6 cm, boomerang_knight_f 5 cm,
     death_knight_m 6 cm.
   - Neck: arcane_sorcerer_m 7 cm, bard_f 6 cm, bard_m 4 cm.

   The fitter seems to root the clavicles at the shoulder-blade line and drag Spine2 with them. Fit the spine as one
   straight line from the Hips root (between the hip joints) to the base of the skull, at about the middle of the torso's
   depth, and let the clavicles start from there.
2. **The shoulders aren't left/right symmetric.** Pauldrons, capes, fur and feather collars pull one side's shoulder pivot
   in or out:
   - carrion_witch_f: 11 cm apart.
   - boomerang_knight_f: 7 cm.
   - arcane_sorcerer_m: 4.6 cm.
   - brakka: 3.4 cm, plus 6 cm in depth.
   - barbarian_f: 3.2 cm.
   - dragon_knight_f: 2.6 cm.
   - arcane_sorcerer_f: 2.4 cm.
   - bard_f: 2.3 cm.

   On carrion_witch_m both shoulders are ~8 cm too far in. Every figure is an A-pose, so fit the cleaner side and mirror it
   (shoulder joint at the armpit line under the deltoid). Mirror elbows, knees and ankles the same way unless the mesh is
   clearly posed.
3. **Feet hidden under robes and gowns are guessed.** On arcane_sorcerer_f, arcane_sorcerer_m and carrion_witch_m the two
   ankles differ by 12-17 cm front to back (or side to side) and by up to 2.7 cm in height, with one foot outside its boot.
   When the legs can't be seen, put the ankles under the hip joints over the toes that peek out and mirror. Never leave the
   two feet different in a symmetric stance.
4. **The retarget hip height is wrong per figure, so feet float or sink.**
   - Planted clips: dragon_knight_f floats ~8 cm (blocker); arcane_sorcerer_m ~5 cm (unverified); brakka 3-4 cm;
     dragon_knight_m 2.5-3 cm; the carrion witches ~2 cm; boomerang_knight_m 1.5-2 cm. Death_knight_m sinks 1-2 cm.
   - Run: the contact frame (frame 3) pushes the foot 1.5-4.5 cm through the floor on most figures.
   - Walk: the stance foot lifts 2-6 cm at the passing frame on every figure.

   Scale the root height by each figure's own rest hip height, and add a foot-plant pass (ankle IK, or at least a per-frame
   offset so the lowest foot touches the floor in grounded clips).
5. **Most rest knees are dead straight, and a few bend backwards.** Most are 0-1% forward against the reference's 2-2.5%;
   death_knight_m (-1%) and bard_f (-0.5%) sit behind the line. The joint centres are still inside the knees, so this is
   minor, but a 2-3 cm forward bias gives the knees an unambiguous bend direction for the new walk.
6. **Upper arms are short against the forearms** on many figures (0.08-0.11 of stature against the 0.133-0.153 reference).
   Where the elbow sits in a visible elbow gap or at a bracer top (the death knights, brakka) that's the mesh's proportion
   and fine. Where the wrist sits inside a bracer (arcane_sorcerer_m) or the elbow at the top edge of the vambrace
   (boomerang_knight_m), the joint is wrong. Fit the wrist at the start of the glove.
7. **Gait (one line):** the Mixamo walk bounces, flicks the shin up behind to knee height and swings the arms wide, and the
   run kicks the heel to the seat. It's nothing like the planted, weighty walk in bm's reference sheets, so replacing it is
   right.
8. **Cloth (one line, out of scope):** the worst cases riding on the legs and arms are the robes of both arcane sorcerers
   and both carrion witches, dragon_knight_f's gown and cape, the death knights' capes and brakka's fur cloak. Dragon_knight_m's
   tail does the same and isn't cloth, so it needs its own handling.
