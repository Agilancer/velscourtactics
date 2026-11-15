# Rig review r1, group D: critic 2 (up-and-comer)

How I measured: I read every card, then checked the joint positions in `rest/<key>.json` and `motion/<key>__<clip>__<n>.json`
against the clean renders (the same frames with no skeleton drawn on them), with the floor line drawn in. "Float" is how high the
lowest ball joint sits in a frame compared with its height at rest. Walk and Run frames are numbered 1-6, left to right, as on the cards.
Stature for the ratios is the HeadTop_End joint. On the hatted figures that joint is inside the hat, so on those I trust centimetres over ratios.

```
totem_master_f_v2: PASS   score 7
- spine, upper chest [minor]: Spine2 sits 8 cm behind Spine1 (side x +6.6 vs -1.5 cm), and the neck base then comes 3 cm forward again, so the chest top has a backward kink instead of a straight line from pelvis to neck; side view, 64-70% lines
- knees [minor]: both knees sit on the hip-to-ankle line (0 to +0.4 cm). The reference puts the knee 3.5-4 cm (2-2.5%) in front of it; move them about 3 cm forward; side view, 28% line
- elbows [minor]: can't judge under the sleeve. The upper arm is 15.5 cm against a 19 cm forearm, so the elbow may be about 2 cm too high (toward the shoulder). It sits at the top of the orange cuff, which reads as right; front view
- shoulders L/R [minor]: the L shoulder joint is 1.8 cm further from the midline than the R (21.0 vs 19.2 cm); front view
- feet in the walk [minor]: the stance foot is down in Walk frames 3-4 (1 cm). In frames 1, 2 and 6 the whole figure floats 4 cm, with both balls up; Walk side
- cloth (out of scope): the poncho and robe panels are carried by the thighs and fan out between the legs in Walk frames 2 and 5
```

```
totem_master_m_v2: FAIL   score 3
- shoulder joints L and R [blocker]: both shoulder joints sit on the teal collar beside the neck, ±11-11.5 cm from the midline. The shoulder ball under the pad, where the bare upper arm's centreline meets the shoulder line, is at about ±21-24 cm. Move each joint about 10 cm (5.5%) out, and probably 2-4 cm down, into the middle of the shoulder under the pauldron. The upper-arm bone now runs through the armpit along the inner edge of the arm. In the Bolt the cast arm leaves from the collar; front view, 70% line; Bolt three-quarter frames 2-4
- elbows [minor]: the elbow is 3-4 cm up the arm from the top edge of the forearm bracer, toward the inner side of the arm. Move it down to the bracer top; front view, 61% line
- knees L/R [minor]: the R knee is 1.8 cm lower than the L (0.485 vs 0.503 m); front view, 26-27% lines
- knees [minor]: both sit on the hip-to-ankle line (0 to +0.4 cm, reference 3.5-4 cm in front); side view
- spine, upper chest [minor]: Spine2 is 5.8 cm behind Spine1 (side +5.9 vs +0.1 cm), the same kink as on totem_f; side view
- feet in the walk and Bolt [minor]: the figure floats 2.6-5.3 cm through the Walk and 2.4 cm in the standing Bolt; Walk side frames 1-2 and 6
```

```
wizard_f_v2: FAIL   score 4
- hips, ground contact [blocker]: she floats through every clip. Walk: the lowest ball is 19-22 cm up against 4.9 cm at rest, 14-17 cm (8-10% of her height) off the floor in all six frames. Bolt (standing): the hips are 10 cm above rest and both feet 12.5 cm off the floor. The hip translation is not fitted to her legs. Lower it about 10 cm in the Bolt, and in the walk until the stance ball touches; Walk side frames 1-6, Bolt
- head pivot [minor]: can't judge exactly, because the collar and brim hide the face. The neck bone leans 40° forward and the head pivot sits near the front of the collar, probably 3-4 cm in front of the base of the skull; side view, 74-78% lines
- shoulder joints [minor]: ±11-12 cm from the midline, at the inner edge of the mantle above the armpit. The shoulder ball under the mantle is probably 3-5 cm further out; I can't see it. Front view, 70.6% line
- knees [minor]: can't see them under the gown. The thigh is 35 cm against a 41 cm shin, so the knee is probably about 3 cm too high; front view, 31% line
- rest contact [minor]: the boot soles stand 1.4 cm above the floor in the rest side view. The gown hem defines the floor; side view, feet close-up
- cloth (out of scope): the gown's back panel flies up behind her like a cape in Walk frames 2-3 and Run frames 2-4
```

```
wizard_m_v2: FAIL   score 6
- hips, ground contact [major]: he floats the whole Walk, with the lowest ball 9.7-12.7 cm against 4.6 cm at rest (5-8 cm, 3-4% of his height). He also stands 5 cm off the floor in the Bolt, where the hips are 2.4 cm high and the knees slightly bent. Lower the hips until the stance ball meets the floor; Walk side frames 1-6, Bolt side
- elbows [minor]: can't judge under the coat sleeve. The upper arm is 17.5 cm against a 21 cm forearm. The elbow sits at the gauntlet's top edge, which may be right; front view, 62% line
- head [ok]: the pivot is under the ear at jaw level, and the spine runs straight up the middle. This is the cleanest torso in the group
- cloth (out of scope): the coat tails swing with the thighs in Walk frames 2 and 5
```

```
wren_v2: PASS   score 8
- shoulders L/R [minor]: the R shoulder joint is 2.2 cm nearer the midline than the L (14.5 vs 16.7 cm). The R is about 2 cm inside the R upper arm's centreline; front view, 78% line
- elbows [minor]: can't judge under the sleeve. The upper arm is 18-19 cm against a 22 cm forearm. The elbow sits at the top of the vambrace, which reads as right; front view, 70% line
- knees [minor]: they are 1.1-1.9 cm in front of the hip-to-ankle line, against the reference 3.4-4.2 cm; move them about 2 cm forward; side view, 30% line
- feet in the walk [minor]: she floats 2.2-5.6 cm (the lowest ball is 6-9.6 cm against 4.0 cm at rest), and 1.8 cm in the standing Shoot; Walk side frames 1-2 and 6
- gait/attack (not rig): in the Shoot the drawing arm is flung straight back at shoulder height with an open hand, which reads as a wave, not a bow draw; Shoot three-quarter frames 3-4
```

```
zombie_abbess_v2: FAIL   score 3
- R shoulder joint [blocker]: the R shoulder joint (RightArm) is on the sternum, not in the shoulder: 3.7 cm from the midline against the L's 25.2 cm, 8.7 cm lower (1.698 vs 1.785 m), and 18.6 cm further forward (side -12.7 vs +5.9 cm). The R clavicle runs down into the chest. Mirror the L joint: move the R about 21.5 cm out, 8.7 cm up and 18.6 cm back. The R arm comes out of the middle of the chest beside the rosary when she reaches; front view, 74-78% lines; Roar three-quarter frames 2-4
- hips, ground contact [major]: both feet hover 3.5-4.2 cm in every frame of the Walk and of the standing Roar (the lowest ball is 8.8-9.5 cm against 5.3 cm at rest), so she never touches down; Walk side, Roar
- elbows [minor]: can't judge under the bell sleeves. The upper arm is 25 cm against a 32 cm forearm (0.78; the reference is about 1.05-1.1), so the elbows may be about 4 cm too high. R and L match; front view, 68% line
- read: the walk's slump, droop and reach are right for the dead (head pitched 27-33° down)
```

```
zombie_bonesack_v2: FAIL   score 6
- head/neck in motion [major]: through the whole Walk the head pitches back 21-26°. That adds to the mesh's head, which is already sculpted tilted up about 30°, so he stares straight at the sky with the throat stretched. The other dead drop their heads 0-36° down in theirs. The spine also leans back 0-4° while the other dead lean forward 7-23°. The head and neck rest orientation (or the pitch axis) is off. Correct the head bone so the sculpted tilt is the rest, and the walk's droop goes down, not up; Walk side frames 1-6, Walk three-quarter
- balls of the feet [minor]: the ball is at 58% of the foot from the heel. It should be at about 70%, where the toes bend; move it about 3-4 cm forward; side view, feet close-up
- knees [minor]: the L knee is 4.5 cm in front of the hip-to-ankle line and the R 3.0 cm (2.9% vs 1.9%). Bring the L back about 1.5 cm to match; side view, 27% line
- spine depth [ok]: the spine sits about 16 cm in from the back of the bloated belly, which is right for that body; side view
- feet in the walk [ok]: the planted foot stays within 1-1.5 cm of rest
```

```
zombie_brute_v2: FAIL   score 5
- head and neck pivots [major]: the Head joint is at the back of the hood, about 12-13 cm (5.5%) behind the base of the skull. The Neck joint is on top of the trapezius hump, about 10 cm behind the neck's centre. The neck column runs through the middle of the iron collar ring. Move both forward into it: Head about 12 cm forward, Neck about 8-10 cm. Head nods now swing the face in an arc around a point in the hood cloth; side view, 84-87% lines, head close-up
- hips, ground contact [major]: he stands 6.2 cm off the floor through the whole Roar (both balls 11.5-14.7 cm against 5.3 cm at rest). In the Walk the stance foot leaves the floor at mid-stance: frames 3-4, ankle 31 cm against 20 cm at rest, ball 8.5 cm up. A 2.3 m giant has to look heavy; this reads as floaty from the camera; Roar side, Walk side frames 3-4
- shoulders L/R [minor]: the R shoulder joint is 4.5 cm further back than the L (side +6.6 vs +2.1 cm). Both are still inside the deltoid; side view, 78.7% line
- cloth (out of scope): the tabard crumples into a heap around the boots on deep knee bends; Walk side frames 2-5
```

```
zombie_cinder_v2: FAIL   score 6
- R shoulder joint [major]: the R does not match the L. It is 3.0 cm nearer the midline (13.1 vs 16.1 cm) and 2.7 cm further back (side +10.3 vs +7.6 cm). That puts it about 8 cm in from the R deltoid's outer edge, against 5.5 cm on the L, at the inner edge of the upper arm. Move it about 3 cm out and 2.5 cm forward to mirror the L. I see no collapse at strip resolution, but this zombie reaches forward all the time; front view, 77% line; side view
- spine, chest top [minor]: the neck base is 6 cm behind Spine2 (side +4.4 vs -1.7 cm), a backward kink at the collar; side view, 77-81% lines
- feet in the walk [ok]: within 1.5-2 cm of rest. The head pivot is at the jaw hinge under the skull, which is good
```

```
zombie_driftling_v2: FAIL   score 5
- L elbow [blocker]: the L elbow is not in the arm. It sits in the hanging fur under it, about 7-8 cm (4.5-5%) toward the body and 2-4 cm lower than the mesh's L elbow at the top of the arm-wrap. The mirror of the R elbow would be 4.7 cm further out and 2.8 cm higher than it is now. The L forearm bone now runs from the fur to the wrist, so bending this elbow will fold the arm at the wrong point and drag the fur with it. It is now at front x +24 cm, 1.09 m; move it to about +30 cm, 1.11 m (the R elbow is at -29 cm, 1.12 m); front view, 68% line
- shoulders L/R [minor]: the L shoulder joint is 2.3 cm further from the midline than the R (19.6 vs 17.3 cm); front view, 79% line
- knees L/R [minor]: the R knee is 1.7 cm further forward than the L (4.8 vs 3.1 cm in front of the hip-to-ankle line); side view, 32% line
- read [ok]: the walk is hunched (spine 19-23° forward, neck 42-47°), the feet stay planted within 1.4 cm, and the head pivots under the skull. Fix the elbow and this one is good
```

```
zombie_drowner_v2: PASS   score 8
- spine, upper chest [minor]: Spine2 is 5.8 cm behind Spine1 (side +5.3 vs -0.5 cm), the same chest-top kink; side view, 71-78% lines
- shoulders L/R [minor]: the L shoulder joint is 2.7 cm further back than the R (side +5.1 vs +2.4 cm) and 1.6 cm wider (22.9 vs 21.3 cm); side view, 78% line
- elbows [minor]: can't judge under the rags. The upper arm is 18.5-20.5 cm against a 26 cm forearm; the mesh's forearms are long, and the elbows sit mid-crease; front view, 68% line
- read [ok]: the strongest dead walk in the group: the head hangs (pitched 27-36° down), feet within 2 cm of the floor, knees bending forward the right way
```

## Systemic (seen across many figures)

- Hip height is not fitted to each figure's legs. Every figure lifts off the floor somewhere in the Walk; the lowest foot is 1-17 cm above its rest height. It is bad on wizard_f (14-17 cm), wizard_m (5-8 cm), brute (8.5 cm at mid-stance) and abbess (4 cm constant). Four figures float even in the standing clips: wizard_f 12.5, brute 6.2, wizard_m 5 and abbess 3.6 cm. The new bm walk and jog will inherit this unless the hip translation is fitted per figure, or the stance foot is pinned to the floor.
- The L shoulder joint sits further from the midline than the R on 6 of 11 figures: totem_f +1.8, wizard_f +1.0, wren +2.2, cinder +3.0, driftling +2.3 and drowner +1.6 cm. That looks like a bias in the refit's mirroring, not in the meshes, which are symmetric there.
- Where a collar or mantle covers the shoulder, the fitter takes the collar's inner edge for the shoulder. It does on totem_m (blocker, 10 cm), likely on wizard_f, and on abbess's R side it collapsed onto the sternum. Fit the shoulder to the upper arm's centreline, not to the top surface.
- The upper chest kinks backward on totem_f, totem_m, wizard_f, cinder and drowner: Spine2 or the neck base sits 5.8-8 cm behind the lower spine's line. The reference spine is straight from pelvis to neck.
- Knees sit on the hip-to-ankle line on totem_f, totem_m and wizard_m (0 to 0.6 cm in front). The reference has them 2-2.5% of stature (3.5-4 cm) in front.
- The upper arm is shorter than the forearm on 7 figures (ratio 0.7-0.9; the reference is about 1.05-1.1), mostly under sleeves. Check each elbow against the top of the bracer, glove or cuff; several may be 2-4 cm too high.
- Can't judge from these cards: twist and candy-wrapper collapse at wrists, elbows and shoulders. At 260x380 per motion frame the forearms are a few pixels wide. Next round, the attack frames need larger close-ups.
- Gait, one line: the Mixamo walk's hip bounce and the shin kicking up behind read floaty next to bm's walk. All six dead also use the upright human jog for their Run, arms pumping, which breaks the slumped read the walk sets up.
