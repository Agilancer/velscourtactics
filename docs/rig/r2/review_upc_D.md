# Rig review r2, group D: critic 2 (up-and-comer)

How I measured: I read both cards for every figure. Then I checked `r2/rest/<key>_v2.json` and every `r2/motion/<key>_v2__<clip>__<n>.json`
against the clean renders (the same frames with no skeleton drawn), brightened, with 5 cm floor lines and the joints drawn on top.
Frames are numbered 1-6, left to right, as on the cards. "Up" or "into the floor" is a joint's height in that frame minus its rest
height, so 0 means planted. "Head bow" is how far the Head-to-HeadTop line pitches forward from its own rest angle in the side
view. I give % against the height in the card title, and cm everywhere else. On the hatted and hooded figures HeadTop_End sits
inside the hat, so on those I scale proportions from the head pivot (reference: shoulder 0.90 of the head pivot's height).

What got better since r1 for the whole group: the living Walk is planted. The stance foot is within ±0.5 cm in every frame
(1.5 cm at most, in double support), the knees bend forward, and nothing floats. The 9-21 cm hover from r1 is gone, and the
standing attacks sit on the floor. Spines are straight or smoothly curved on every figure, and L/R shoulder mismatches are gone.

```
squire_v2: FAIL   score 7
- head in Walk and Run [major]: the hero walk bows his head 24-27° below its rest angle in every Walk frame, and 31-32° in the Run.
  He walks looking at the ground about 2 m ahead, and from the game camera you see the top of the helmet, not the face. bm's archer
  walks head-level. This is the retarget, not his joints (see systemic 1); Walk side frames 1-6, Walk three-quarter
- elbows [minor]: the joint sits at the top edge of the couter, about 2 cm toward the shoulder from the couter's centre. The upper arm
  is 17.3 cm against a 20.3 cm forearm; front view, 69.5% line
- Thrust, planted foot [minor]: the L foot sinks 2.5 cm in frame 2 and 2.1 cm in frame 5. The R foot's 17-26 cm lift in frames 3-4
  is the step itself and bends the right way
- fine: shoulders inside the pauldron (15.7 cm out, mirrored), head pivot at the base of the skull, ankles over the heel, balls at the bend
- round 1: no blockers or majors. Minors: Walk float fixed (stance foot 0-1.1 cm), Thrust sink better (4 → 2.5 cm), knees better
  (1.6-2.0 → 2.4-2.5 cm in front of the hip-ankle line). Fix the head bow and he passes
```

```
stevie_v2: FAIL   score 7
- head in Walk and Run [major]: her head bows 21-24° in the Walk and 28° in the Run, so she looks at her feet. This is the same
  retarget fault (systemic 1); Walk side and three-quarter, all frames
- shoulders, side [minor]: still about 3 cm behind the middle of the upper arm under the pauldron (5.4 cm behind Spine2; the elbow
  is 2.7 cm further forward). Move about 2-3 cm forward; rest side, shoulders close-up
- Thrust, planted foot [minor]: the L foot sinks 2.9 cm in frame 2 and 1.9-2.4 cm in frames 4-5
- knees L/R [minor]: the L knee is 2.2 cm further out than the R (17.8 vs 15.6 cm) and 1.2 cm wider at the ankle. Check this against
  the mesh's stance before mirroring; front view, 28% line
- gait (not rig): the R forearm is locked at about 53° below horizontal in all six Walk frames and does not swing. That is better than
  r1's level forearm, but still stiff
- round 1: no blockers or majors. Minors: neck at the gorget front fixed (neck and head now in line), shoulder depth better (moved
  1.5 cm forward, about 3 cm to go), Walk float fixed. The veteran's low head pivot is fixed (moved up 8.5 cm, now at nose-base height)
```

```
totem_master_f_v2: FAIL   score 6
- head in Walk and Run [major]: this is the worst head bow in the group: 45-49° in the Walk and 52-55° in the Run. Her mask points at
  the floor in every frame, and the headdress tips forward like a nod that never comes back up. Her rest neck leans 20° back, and the
  retarget sets it to the same +12-15° world tilt it gives everyone. That is a 32-35° swing of the neck, and the head adds the rest.
  Walk side frames 1-6, Run side
- knees [minor]: +2.0 / +2.2 cm in front of the hip-ankle line (1.1-1.2%), still about 1.5 cm short of the reference; side view, 28% line
- elbows [minor]: can't judge under the sleeve. The upper arm is 15.4 cm against a 17.1 cm forearm, so the elbow may be 1-2 cm high
- legs L/R [minor]: the L knee, ankle and ball sit 0.9-1.6 cm further out than the R; front view
- Bolt: planted (L -0.4 cm), with the R ball 1.3 cm up. That is the known attack-clip R-foot issue
- cloth (out of scope): the poncho and robe panels still ride the thighs in Walk frames 2 and 5
- round 1: no blockers or majors. Minors: chest-top kink fixed (smooth curve now), knees better (0 → 2.1 cm), L/R shoulders fixed
  (mirrored, 21.5 cm), elbow better (1.6 cm lower), Walk float fixed (0-0.8 cm)
```

```
totem_master_m_v2: FAIL   score 5
- shoulder joints L and R [major]: they are 14.0 cm from the midline at 1.279 m, on the teal collar and tabard edge at the inner rim
  of the pauldron. The bare upper arm under the pad, traced up from the elbow along its centreline, meets that height at about 21 cm.
  Move each joint about 7 cm out (3.8%) and 1-2 cm down, into the middle of the shoulder under the pad. In Bolt three-quarter frames
  3-4 the casting R arm still leaves from the collar beside the mask's chin; front view, 69% line, shoulders close-up
- head in Walk and Run [major]: it bows 20-23° in the Walk and 28° in the Run (systemic 1)
- knees [minor]: +2.1 / +2.2 cm (1.1-1.2%), about 1.5 cm short of the reference; side view
- Bolt: planted (-0.7 cm), with the R ball 1.1 cm up (known)
- round 1: shoulder blocker better, not fixed (moved 3 cm out from 11 cm, about 7 cm still to go). Elbow: a second look puts it at
  the top inner edge of the bracer, which is right. R knee 1.8 cm low fixed, knees on the line better (+2.1 cm), chest kink fixed,
  Walk and Bolt float fixed
```

```
wizard_f_v2: FAIL   score 6
- head in Walk and Run [major]: it bows 15-19° in the Walk and 23° in the Run. Under the brim that hides her face completely from the
  game camera, and the hat reads as nodding at the floor (systemic 1); Walk side frames 1-6
- legs L/R [minor]: the hidden legs are not mirrored. The L knee, ankle and ball are 2.2-2.5 cm further out than the R (8.5 / 6.3,
  8.3 / 5.9, 10.7 / 8.2 cm). Mirror them, or put both under the hips at ±9 cm; front view, feet close-up
- rest contact [minor]: the trailing back hem sets the floor and the boot toes stand 1.1-1.5 cm above it. In the Walk her stance boot
  is therefore about 1.6-2.8 cm up, and in the Bolt the L boot goes 1.0-1.4 cm under the rest floor. Side view, feet close-up
- knees [minor]: can't see them under the gown. They are at 53.8 cm, with a 35.8 cm thigh against a 40.9 cm shin, so probably about
  3 cm high
- wrists [minor]: the joint sits about 3 cm up the glove from where the hand begins; front view, 57.7% line. Elbow: can't judge under
  the bell sleeve (upper arm 14.7 cm, forearm 17.2 cm)
- cloth (out of scope): the gown's back panel still flies with the legs in the Run
- round 1: hover blocker fixed (Bolt hips at rest height, Walk stance 0.3-1.5 cm). The 40° neck lean is fixed (neck now straight
  under the head). Shoulders better (2 cm wider, at the top of the sleeve under the mantle edge). Knees unchanged; rest contact unchanged
```

```
wizard_m_v2: FAIL   score 7
- head in Walk and Run [major]: it bows 16-19° in the Walk and 23° in the Run, and the brim drops over the face (systemic 1)
- legs L/R [minor]: the L knee, ankle and ball are 1.9-2.5 cm further out than the R (15.1 / 12.9, 21.1 / 19.2, 24.0 / 21.5 cm). Check
  this against the mesh; front view
- elbows [minor]: can't judge under the coat sleeve (upper arm 17.2 cm, forearm 19.1 cm)
- Bolt: planted (0.0 cm), with the R ball 1.2 cm up (known)
- cloth (out of scope): the coat tails still swing with the thighs in Walk frames 2 and 5
- round 1: float major fixed (Bolt 0.0 cm, Walk -0.5 to +0.3 cm). The elbow minor is still can't-judge. Knees better (on the line →
  +2.5-2.7 cm). The veteran's L shoulder 5 cm back is fixed (mirrored, both 5 cm behind the spine line, inside the arm)
```

```
wren_v2: FAIL   score 7
- head in Walk and Run [major]: it bows 28-32° in the Walk and 36° in the Run. She walks staring at the ground in front of her boots,
  the most visible case after totem_f (systemic 1); Walk side and three-quarter frames 1-6
- knees [minor]: +1.9 cm (1.1%), under the refit's own 1.2% floor; move them about 1.5-2 cm forward; side view, 30% line
- elbows [minor]: can't judge under the sleeve. The upper arm is 18.0 cm against a 19.9 cm forearm, so the elbow may be 1-2 cm high
- Shoot: planted (L -0.2 to -0.5 cm), with the R ball 1.6-2.4 cm up (known)
- gait/attack (not rig): in Shoot three-quarter frames 3-4 the drawing arm is still flung straight back at shoulder height with an
  open hand. It reads as a wave, not a draw to the jaw
- round 1: no blockers or majors. Minors: L/R shoulders fixed (both 17.3 cm), knees better (1.1-1.9 → 1.9 cm), elbows better (the
  forearm is no longer 4 cm longer), Walk and Shoot float fixed
```

```
zombie_abbess_v2: FAIL   score 5
- shoulder joints L and R [major]: both are at 19.2 cm out and 1.698 m, with the collarbone roots at 1.721 m. That is under the dress
  neckline (about 1.76 m), down in the upper chest. The reference puts the shoulder at 0.90 of the head pivot's height, 1.785 m. The
  mirroring appears to have kept the old R (sternum) joint's height, so both arms now pivot about 8 cm low and 5 cm in, at the armpit.
  Move both to where the r1 L was: about 24-25 cm out, 1.78 m, 5-6 cm behind the spine line. That also gives a 29 cm upper arm against
  a 27 cm forearm, in the reference ratio. Front view, 74-78% lines; Roar three-quarter frames 2-5, where the reach starts at the armpit
- Walk heel strike [minor]: the L heel goes 4.5 cm through the floor in Walk side frame 2, and the R 2.2 cm in frames 4-5. Her steep
  rest foot (ankle 12.4 cm above the ball) plus the walk's 20° heel-down pitch drives the heel in; pin the heel at the strike
- Roar: the L ankle sinks 1.4-1.9 cm and the R ball rides 2.2-2.7 cm up in all six frames (the R is the known issue)
- read [ok]: the best dead walk in the group. The head hangs 50-54°, the neck is 23-26° forward and the stride is planted
- round 1: R shoulder blocker better (off the sternum, mirrored) but not right; both are now about 8 cm low (major above). Float
  major fixed (no hover in the Walk or the Roar). Elbow minor better (27.6 vs 27.2 cm, against 25 vs 32)
```

```
zombie_bonesack_v2: FAIL   score 6
- head and neck [major, known and not handled]: the Walk now bows the head only 2-6° below its rest angle. The sculpted ~30° upward
  tilt stays, so he still stares at the sky in all six Walk frames, and in the Roar the head goes another 26-33° back. The spine leans
  back 1-2° while the other dead lean 3-11° forward. Walk side frames 1-6, Roar three-quarter frames 2-5
- toe spikes [major, known and not handled]: in Run side frames 1, 3, 5 and 6 the toes stretch into 15-20 cm blades
- balls of the feet [minor]: unchanged. They are 10.6 cm in front of the ankle, in the arch behind the toe roots; move about 3 cm
  forward to the toe bend; side view, feet close-up
- Walk heel [minor]: the L heel goes 2.3 cm through the floor in Walk frame 2
- Roar: planted (-0.2 cm), with the R ball 1.9-2.0 cm up (known)
- round 1: head major better in motion (it no longer pitches back 21-26° during the Walk) but unchanged in the read (the face still
  points up). Balls minor unchanged. Knee L/R mismatch fixed (3.7 vs 3.2 cm, against 4.5 vs 3.0)
```

```
zombie_brute_v2: FAIL   score 4
- feet in the Walk [major]: at mid-stance (Walk side frame 3) both feet are off the floor. The stance L ankle is 7.5 cm up and the
  ball 6.4 cm, and in frame 4 the foot is still 2.4 cm up. In frame 5 the R heel goes 2.5 cm through the floor. The slumped dead walk
  bends his knees more than the hip height allows for. A 2.3 m giant that lifts off at mid-stance reads weightless; pin the stance foot
- feet in the Roar [major]: the L foot hovers 4.6-5.7 cm in all six frames, and the R ball is 1.9 cm up with the heel down. This looks
  like the known attack-clip foot problem, but on the L and bigger
- shoulder joints L and R [major, a regression]: the mirroring moved both in to 26.2 cm (from 31.7 / 32.4 cm in r1). They now sit on
  the pec-deltoid seam. The upper arm's centreline, traced up from the elbow, meets that height at about 31-32 cm, and r1's width
  matched it. Move both about 5.5 cm out and keep the new depth; front view, 77.5% line, shoulders close-up
- toe spikes [major, known and not handled]: in Run side frames 1, 3, 5 and 6 the foot wraps stretch into 30-40 cm blades
- head pivot [minor]: now at the back of the iron collar ring at chin height, with the neck chain in line under it. It may still be
  3-5 cm behind the base of the skull; can't see under the hood. Side view, head close-up
- collarbones [minor]: the roots sit ±15.9 cm out on top of the trapezius, 10 cm above Spine2, so a shrug pivots from the top of the
  trap, not the sternum; front view
- feet L/R [minor]: the whole R foot is set 2.5 cm further back than the L in the rest side view (ankle -9.7 vs -7.2 cm)
- cloth (out of scope): the tabard bunches into a slab around the boots in Walk frames 2-4 and the Run
- round 1: head and neck major fixed (head 10 cm and neck 11 cm forward, chain straight). Float major better, not fixed (Roar 6.2 cm →
  1.9 cm on the R but 5 cm on the L; Walk mid-stance 8.5 → 6.4 cm). R shoulder depth minor fixed by mirroring, but the width regressed
```

```
zombie_cinder_v2: FAIL   score 7
- toe spikes [major, known and not handled]: the trailing foot's toes pull into thin spikes of about 15 cm in Run side frames 1, 3, 5
  and 6, and in three-quarter frames 1 and 5
- knees [minor]: +1.5 / +1.9 cm (0.9-1.1%), under the refit's own 1.2% floor; move them about 2 cm forward; side view, 30% line
- Walk heel [minor]: the L heel goes 2.2 cm into the floor in Walk frame 2
- Roar: planted (L -0.2 to -0.8 cm), with the R ball 1.7-2.0 cm up (known)
- read [ok]: the slump is right (spine 6° forward, neck 24-27°, head bowed 35-39°), and the head pivot is at the jaw hinge under
  the skull
- round 1: R shoulder major fixed (mirrored, both 15.8 cm out and 5.2 cm back, inside the deltoid). Chest-top kink fixed. This one
  passes once the toe spikes are dealt with
```

```
zombie_driftling_v2: FAIL   score 4
- elbows L and R [blocker]: both now sit at ±27.0 cm and 1.061 m, under the arm, 2-3 cm outside the mesh's lower surface and about
  6-7 cm below the arm's centreline, next to the hanging fur. The bend (the top of the bandage wrap) is at about ±31 cm and 1.10-1.11 m.
  Move both about 4 cm out and 4-5 cm up. The R was right in r1 (-28.9 cm, 1.118 m) and moved 5.7 cm straight down; "move hidden
  elbows down the arm" went down in world space, not along the arm. In Roar three-quarter frame 3 the reaching R arm humps upward at
  the elbow. Front view, 66-70% lines, shoulders close-up
- knees [ok]: now centred on the kneecaps (the veteran's between-the-legs knees are fixed). The L leg stands 1.6-2 cm wider than the
  R, which follows the mesh
- read [ok]: the walk is hunched (spine 10-11°, neck 36-39° forward), the stance foot is within 1 cm and the Roar crouch is planted
- round 1: L elbow blocker unchanged (still out of the arm, and the R is now out too). L/R shoulders fixed (both 19.4 cm). R knee
  forward of the L fixed (both 0.7 cm). Fix the elbows and this one passes
```

## Systemic, ranked by how many figures they hit (of these 12)

1. **The retarget bows the head and neck. 12 of 12 in the Run, all 7 living figures in the Walk [major].** The heroes' Walk
   bows the head 15-49° below each figure's rest angle: wizard_f 15-19°, wizard_m 16-19°, totem_m 20-23°, stevie 21-24°, squire 24-27°,
   wren 28-32°, totem_f 45-49°. The Run bows 23-55° on every figure, dead included. bm's archer walks head-level. The cause shows in
   the Spine2-to-head line, which lands at the same world tilt on every figure: +12-15° in every living Walk frame and +29-37° in
   every Run frame, whatever that figure's rest neck was. So the neck and head are being given bm's world orientation, not bm's
   rotation applied on top of each figure's own bind. Retarget the neck and head as offsets from the bind. As it stands every hero
   walks looking at its feet, and from a 35-45° camera you see hat tops and hair, not faces. This is the one thing between most of
   the living figures and a pass.
2. **The Run reads as bounding, not a jog. 12 of 12 [gait].** The lowest foot is 11-24 cm up in frames 1, 3 and 5, so the figure is
   airborne about 60% of the cycle. The hips travel 20-29 cm, and frame 4 lands in a deep crouch with the knees 25-43 cm in front of
   the hip-ankle line. All five dead run it upright (spine +10°, same as the heroes), with their heads bowed by item 1. That reads as
   an upright jogger staring at its shoes, not a lurch. I flagged the upright run on the dead in r1 and it is unchanged.
3. **Feet outside the living Walk. 11 of 12 [minor; major on the brute].** The living Walk is fixed, but these still miss:
   - Planted feet sink in attacks: stevie 2.9, squire 2.5, abbess 1.9 and wizard_f 1.4 cm.
   - The slumped dead Walk drives the heel into the floor at the strike: abbess 4.5, brute 2.5, bonesack 2.3 and cinder 2.2 cm.
   - The brute lifts off at mid-stance (6.4 cm) and hovers his L foot 5 cm through the whole Roar.
   - The known attack-clip R foot rides 1.0-2.7 cm on 8 figures.

   Pin the stance foot per frame (or IK it), not only the clip's lowest point.
4. **The upper arm is shorter than the forearm. 10 of 12 [minor, mostly can't judge].** The ratio is 0.83-0.97 against the reference's
   1.05-1.1 on all but abbess and brute. Most elbows are under sleeves, so this is a check list, not a verdict.
5. **Knees are still short of 2-2.5% in front of the hip-ankle line. 8 of 12 [minor].** Squire, stevie, totem_f, totem_m, wizard_m,
   wren, cinder and driftling are at 0.9-1.5%. Four of them (wren, cinder, totem_f L, totem_m L) are under the refit's own 1.2% floor,
   so the forward offset seems to be measured on something other than the leg's side profile.
6. **Leg joints are not mirrored L/R. 5 of 12 [minor].** Wizard_f, wizard_m, stevie, totem_f and wren have one leg 1.5-2.5 cm further
   out at the knee and ankle. Where the mesh stands asymmetrically that is right. Wizard_f's legs are hidden, so hers should have been
   mirrored.
7. **The new placement rules chose wrong values. 4 of 12 [blocker / major].** These are the figures that fail on joints, not motion:
   - "Mirror and keep the better side" kept the bad side's height on abbess (both shoulders 8 cm low).
   - It narrowed brute's correct shoulders by 5.5 cm.
   - "Rebuild from the elbow" left totem_m's shoulder 7 cm in, still on the collar.
   - "Move hidden elbows down the arm" moved driftling's straight down, out of the arm, and broke the R one, which was right.

   Check each rebuilt joint against the limb's centreline traced from the next joint, and keep r1 positions that the reviews passed.
8. **Toe spikes on the bare-footed dead. 3 of 12 [major, known].** Bonesack, cinder and brute in the Run. Driftling and abbess do not
   show them.

Gait, one line: the new hero Walk is a real improvement, planted and weighted like bm's. With the head bow fixed it will read well
from the game camera. The Run needs either a lower, shorter-flight jog or a slumped dead version.
