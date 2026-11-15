# Rig review r1, group A (critic 2, up-and-comer)

How I measured: I read every card, then checked the numbers in r1/rest/*.json and r1/motion/*.json, the same renders the cards are built from. Distances are in cm on the model. Side-view offsets are measured against the Hips joint; a negative number means the joint is forward of it, since the figure faces left. "Float" is how high the lower of the two feet sits above its own rest height, frame by frame, and I checked it against a floor line drawn on the frames. Frames are counted 1-6 from the left of each strip. Head joints at the chin or jaw line match the bm reference (head about 0.875), so I did not flag those.

Data freshness: the cards are from 10:37. While I was reviewing, r1/rest and r1/motion were rendered again for arcane_sorcerer_f through brakka, between 10:47 and 10:49, and the motion frames were resampled (0/4.8/9.6... instead of 0/5/10...). I judged what the cards show. Two things already differ in the newer data:
- Both arcane sorcerers' hidden feet are now mirrored, 9.3 cm forward on _f and under the hips on _m. But the _f L knee now sits 7 cm behind its hip-ankle line, so it bends backwards.
- arcane_sorcerer_m still floats: 5 cm through the standing Bolt and 5-9 cm through the Walk.
Every figure from carrion_witch_f onward is unchanged since its card.

arcane_sorcerer_f_v2: PASS   score 7
- legs under the gown [minor]: in the side rest view the legs stand in a stride. The L ankle is 9 cm in front of the hip and the R ankle 8 cm behind it, so the shins cross at the knee. Both feet are long (17-19 cm from ankle to ball), and the R ball sits under the L ankle. In front view the L ankle is 2.6 cm higher than the R. The feet are hidden, so set both ankles side by side under the hips at the same height and shorten the ball to about 13 cm ahead of the ankle. (Rest side view and feet close-up.)
- shoulders [minor]: not mirrored. The L shoulder joint is 11.3 cm from the spine and the R 13.7 cm. The R collarbone starts 4.3 cm off the spine, the L 1.2 cm. Both shoulder joints sit on the top line of the shoulder, about 2 cm higher than the middle of the upper arm. (Front rest view and shoulder close-up.)
- hips [minor, can't fully judge under the gown]: the hip joints are at 0.58 of the head's top joint, against 0.53-0.55 in the reference, so they may be about 4 cm high.
- cloth (out of scope, one line): in Run side frames 2-4 the gown tears into flat horizontal flaps behind the kicking shin.

arcane_sorcerer_m_v2: FAIL   score 4
- feet / root height [blocker]: he floats. In the Walk the lower foot is 10, 12, 2, 2, 8 and 10 cm above the floor across frames 1-6, so the robe hem hangs clear of the ground in side frames 1, 2 and 6. His Run sits about 10 cm higher than every other figure on the same clip. Even the standing Bolt floats 2 cm. (Walk side strip.)
- neck / upper spine [major]: Spine2 is 5.7 cm and Neck 7.2 cm behind the Hips line. That puts the neck joint in the back of the high collar, 7 cm behind the head joint, so the chain bends 29° back and then 41° forward. In the Walk side strip (every frame) the collar and veil tip back about 15-20° from their rest angle, so he walks looking at the sky. Move Neck about 6 cm forward under the head and Spine2 about 5 cm forward onto the Spine1-Neck line.
- feet at rest [minor, hidden]: the L ankle is 10.7 cm behind the hips and the R ankle 4.9 cm in front. The R ball is only 5 cm ahead of its ankle (that foot points steeply down), while the L ball is 14 cm ahead. Mirror both feet, roughly 3 cm behind the hips. (Side rest view and feet close-up.)
- shoulders [minor]: the L shoulder joint is 11.1 cm from the spine and the R 15.7 cm, a 4.6 cm mismatch. (Front rest view.)
- arms [minor, can't fully judge]: the chain is very short (17 cm upper arm, 12-13 cm forearm), but the gloves really do start at the wrist joints. The mesh's hands come out of the bell sleeves close to the body, so I am not flagging the elbows.

barbarian_f_v2: PASS   score 7
- spine [minor]: the lowest Spine joint is 3.9 cm in front of the line from Hips to Spine1, so the spine kinks in the belly. Put it back on that line. (Side rest view.)
- shoulders [minor]: not mirrored. L is 16.9 cm from the spine and R 13.7 cm, a 3.2 cm mismatch, and the collarbone roots are 1 cm (R) against 5 cm (L). Both shoulder joints sit on the top edge of the arm, about 2 cm high. (Front rest view and shoulder close-up.)
- elbows [minor]: the upper arm (18-20 cm) is shorter than the forearm (21-22 cm). The reference has the upper arm the same length or longer, so the elbows are probably 2 cm high. (Front rest view.)
- knees [minor]: only 1.1-1.3% in front of the hip-ankle line, against 2-2.5% in the reference. Nudge them about 1.5 cm forward. (Side rest view.)
- feet: float 1-5 cm in the Walk (frames 1 and 6 are worst); this one is systemic.

barbarian_m_v2: PASS   score 8
- knees [minor]: the knees are dead on the hip-ankle line (0.1-0.6%), against 2-2.5% in the reference. Move them about 3 cm forward. (Side rest view.)
- shoulders [minor]: the joints sit on the top edge of the arm under the pauldron line, about 2 cm higher than the middle of the upper arm. (Shoulder close-up, front.)
- elbows [minor]: the upper arm (20-22 cm) is shorter than the forearm (23-25 cm), so the elbows may be about 2 cm high.
- Clean in motion: the fur mantle follows well and the Swing reads strongly.

bard_f_v2: PASS   score 7
- neck [minor]: the Neck joint is 6 cm behind Spine2, at the back of the stand-up collar. Spine2-Neck leans 38° back and Neck-Head 16° forward. Move Neck about 4 cm forward into the middle of the neck. In the Strum her head hangs about 15° lower than bard_m's on the same clip (compare the Strum frames).
- shoulders [minor]: not mirrored. L is 17.3 cm from the spine and R 15.0 cm, a 2.3 cm mismatch. (Front rest view.)
- knees [minor]: they sit 0.3-0.5% behind the hip-ankle line, where the reference has them 2-2.5% in front. Move them about 4 cm forward. (Side rest view.)
- feet: float 1-4 cm in the Walk (systemic).

bard_m_v2: PASS   score 8
- neck [minor]: the Neck joint is 4 cm behind Spine2 and the Head joint 4.3 cm in front of the neck (bends of 25° and -31°). Move Neck about 3 cm forward. (Side rest view and head close-up.)
- shoulders [minor]: L is 15.4 cm from the spine and R 17.6 cm, a 2.2 cm mismatch.
- knees [minor]: 0.3-0.5% in front of the line, against 2-2.5%. Move them about 3 cm forward.
- The cape swinging out in the Walk three-quarter strip is cloth and out of scope.

boomerang_knight_f_v2: FAIL   score 6
- shoulders [major]: 7 cm out of mirror. The R shoulder joint is 11.6 cm from the spine, at the inner edge of the pauldron, and the L is 18.6 cm, about 3 cm out into the upper arm. The wrists are symmetric (37.5 cm each side), so the L arm chain comes out 32 cm against 38 cm on the R. Set both shoulder joints about 15 cm from the spine and 2 cm lower, inside the deltoid. (Front rest view and shoulder close-up.)
- spine [minor]: Spine2 is about 5 cm behind its neighbours (Spine1 -1.3 cm, Spine2 +4.2 cm, Neck -0.8 cm), with bends of 29° and -43°. Straighten it. (Side rest view.)
- elbows [minor]: the upper arms are short (15 cm L, 17 cm R) against forearms of 17 cm (L) and 21 cm (R). Recheck the elbows once the shoulders are fixed.
- feet: float 2-6 cm in the Walk (systemic). The knees (2.6%) and heeled feet are good.

boomerang_knight_m_v2: PASS   score 8
- elbows [minor]: the upper arm (18-19 cm) is shorter than the forearm (22 cm), so the elbows may be 2-3 cm high. (Front rest view.)
- knees [minor]: 0.5% in front of the line, against 2-2.5%. Move them about 3 cm forward.
- feet: float 2-5 cm in the Walk (systemic). The overhead Throw deforms cleanly; the cape following the arm up in Throw frames 4-5 is cloth.

brakka_v2: FAIL   score 5
- feet / root height [major]: she hovers. The boots are 3-4 cm off the floor through the whole standing Swing, with a visible gap under the soles in the side view, and 4-8 cm off in the Walk (frames 1 and 6 worst).
- L shoulder [major]: not mirrored in depth. In the side view the L shoulder joint is 8.4 cm behind the Hips line against 2.1 cm for the R, 6 cm further back. In front it is 26.5 cm from the spine against 23.1 cm, 3.4 cm wider. Mirror it from the R. (Side rest view and shoulder close-up, side.)
- arms [minor, can't fully judge]: the upper arm (19-20 cm) is shorter than the forearm (25-28 cm), but both elbows sit at the tops of the bracers and the L arm hangs straighter than the R in the mesh itself. Recheck after the shoulder fix.
- The head pivot and the spine are good. The tipped-back laughing head is the mesh's own pose.

carrion_witch_f_v2: FAIL   score 4
- R shoulder [blocker]: the R shoulder joint is 9 cm from the spine, right beside the collar brooch, against 19.9 cm for the L, an 11 cm mismatch. The R upper-arm bone runs diagonally through the feather mantle from the collar. In the Bolt three-quarter strip (frames 2-4) the casting arm grows out of the front of the chest. Move the R shoulder joint about 7 cm out and the L about 3 cm in, so both sit about 16 cm from the spine inside the deltoid. (Front rest view and shoulder close-up.)
- spine [major]: the spine runs through the belly. Spine, Spine1 and Spine2 are 3.8, 2.6 and 3.4 cm in front of the Hips line, then Neck kinks 4 cm back (a 38° bend). Move the spine joints about 3 cm back and straighten the neck. (Side rest view.)
- elbows [minor]: the L upper arm is 16 cm against 21 cm on the R, so the L elbow is about 3 cm higher up the arm than the R. Remeasure after the shoulder fix.
- R leg [minor]: the R knee is 6.2 cm from the centre line against 9.2 cm for the L, so the R leg leans in (front rest view). The ankles do sit in their boots.
- feet: float 2-6 cm in the Walk (systemic).

carrion_witch_m_v2: FAIL   score 2
- shoulders [blocker]: both shoulder joints are at the base of the neck, 8.0 cm (R) and 8.8 cm (L) from the spine, under the neck ruff. The sleeves leave the mantle about 15-16 cm out. Move both about 7 cm out and 2 cm down. (Front rest view and shoulder close-up.)
- R leg and foot [blocker]: the R foot is not in its boot. In the brightened rest front view the R boot is about 12 cm nearer the centre than the R ankle, which sits out in the robe 16.9 cm from the centre (the L is at 10.1 cm). In the side view the R ankle is 18.8 cm behind the hips against 3 cm for the L, and the R knee is pulled 5 cm in (4.8 cm from the centre against 9.3 cm), 7.6 cm (4.6%) in front of its hip-ankle line. That makes the leg a zigzag in both views. Put the R ankle in the R boot, mirrored from the L, and the knee back on a straight line. (Front and side rest views, feet close-up.)
- spine [major]: it zigzags back and forth by about 7 cm (Spine -3.8, Spine1 -5.0, Spine2 +2.4, Neck -4.4 cm), with bends of 35° and -50°. Keep the hunch, but as one smooth curve. (Side rest view.)
- feet: float 2-7 cm in the Walk, worst in frames 3-4 at 7 cm.

death_knight_f_v2: PASS   score 7
- neck [minor]: the Neck joint is only 2 cm below the Head joint (at 85.5% of the model) and 9 cm above Spine2, so it is about 4-5 cm too high. Bring it down to the top of the gorget, about 6-7 cm below the head joint. (Head close-up and front rest view.)
- head end [minor]: the head bone's end leans 23° to her L in the front view because it lands on a crown spike. Point it straight up. (Front rest view.)
- elbows [minor]: the upper arms are short (15 cm L, 17 cm R) against 23-24 cm forearms, so the elbows are about 3 cm high, and the L elbow is 2.1 cm higher than the R. (Front rest view.)
- L/R [minor]: the L knee is 2.5 cm further forward than the R in the side view (2.2% against 0.8%) and 1.2 cm higher, and the L ankle is 0.8 cm higher. Mirror them.
- cloth (out of scope): in the Swing the cape sinks 15-18 cm through the floor.

death_knight_m_v2: FAIL   score 6
- spine [major]: Spine and Spine1 sit 5.3 cm in front of the Hips line, inside the belly plate (about 3.5 cm in front of the middle of the torso). Spine2 jumps back to +0.9 cm (bends of -24° and +27°). In the Walk side strip (frames 1, 3 and 6) the torso curls into a hunch with the backplate bulging, which boomerang_knight_m and barbarian_m do not do on the same clip. Move Spine and Spine1 about 4 cm back. (Side rest view.)
- knees [minor]: they sit 1.6 cm behind the hip-ankle line, where the reference has them about 4 cm in front. Nudge them about 3 cm forward. (Side rest view.)
- elbows [minor]: the upper arm (17-20 cm) is shorter than the forearm (26 cm), and the L elbow is 2.6 cm higher than the R. The elbows are about 3 cm high. (Front rest view.)
- feet [minor]: they sink 1-2 cm in the Walk (frames 3-4) and 5 cm in Run side frame 3, the opposite of everyone else.

dragon_knight_f_v2: FAIL   score 4
- feet / root height [blocker]: she floats 7-8 cm through the whole standing Swing and 10-13 cm through the Walk. In the side frames the claw toes stay clearly in the air under the gown hem. (Walk and Swing, side.)
- ankles [minor]: in the boots the L ankle is 2.7 cm higher than the R and the L knee 1.5 cm higher. Mirror them. (Front rest view and feet close-up.)
- spine and neck [minor]: Spine2 is about 6 cm behind its neighbours (Spine1 -2.8, Spine2 +2.9, Neck -3.9 cm). The Neck joint sits at the front of the throat, about 2-3 cm too far forward. (Side rest view and head close-up.)
- shoulders [minor]: L is 14.5 cm from the spine and R 11.9 cm, a 2.6 cm mismatch.

dragon_knight_m_v2: FAIL   score 6
- spine [major]: there is a 40° kink at Spine1. Spine2 is 9.7 cm behind the Hips line (about 4 cm behind the middle of the chest), Spine1 is about 2 cm in front of the middle of the belly, and Neck and Head are 6 cm back. In the Walk side strip (frames 1 and 6) the chest rolls forward into a rounded hunch. Put Spine2 on a straight line from Spine1 to Neck, in the middle of the chest. (Side rest view.)
- L/R [minor]: the L knee is 1.9 cm higher than the R and the L elbow 1.2 cm higher. (Front rest view.)
- feet: float 3-6 cm in the Walk and 3 cm in the standing Swing.
- Gait note: in his Swing the L arm folds across the chest. Check that this is the clip's intent; it is not the case on barbarian_m or death_knight_m.

## Systemic (seen across many figures)
- Floating feet: 8 of 15 figures never get a foot fully down in the Walk (the lower foot is always at least 2 cm up), and most figures are 4-6 cm up in frames 1 and 6. The worst are arcane_sorcerer_m (up to 12 cm), dragon_knight_f (10-13 cm) and brakka (4-8 cm). Two even hover in a standing attack (brakka 3-4 cm, dragon_knight_f 7-8 cm). The root height on retarget needs to be set from each figure's planted foot, not a ratio.
- Crooked spines and necks in the side view: Spine2 or Neck pushed 3-10 cm forward or back, with bends of 25-50°, on arcane_sorcerer_m, bard_f and bard_m (neck), boomerang_knight_f, carrion_witch_f and carrion_witch_m, death_knight_m, and dragon_knight_f and dragon_knight_m. The front views are perfectly centred on every figure. The motion frames show the same spine angles on every figure on a given clip, so a crooked rest spine turns straight into a torso bend. That is where the death_knight_m and dragon_knight_m hunches come from.
- Shoulders not mirrored across the spine. The L and R distances differ by 2-11 cm (carrion_witch_f 11, boomerang_knight_f 7, arcane_sorcerer_m 4.6, brakka 3.4 plus 6 cm in depth), and robed casters get shoulder joints at the collar (both carrion witches). Mirror the joints from the better side, then fit them inside the deltoid, about 2 cm below the top of the shoulder.
- Upper arm shorter than the forearm on nearly all armoured figures (upper 15-20 cm, forearm 22-28 cm). In the reference the upper arm is the same length or longer, so most elbows are probably 2-4 cm high.
- Knees almost exactly on the hip-ankle line (-1% to +1%) on most figures, against 2-2.5% forward in the reference. A small fix, but it gives the bend a clean pivot.
- Legs hidden under gowns are guessed inconsistently: stride stances on both arcane sorcerers, and carrion_witch_m's R foot outside its boot. Where a boot is visible in a brightened render, put the ankle in it. Where nothing is visible, mirror the two feet and place them side by side under the hips.
- Small height mismatches between L and R (1.2-2.7 cm at the ankles, knees and elbows) on dragon_knight_f, death_knight_f and death_knight_m.
- Gait (one line): the Mixamo walk bobs and the run kicks the shin up flat behind. That is what rips the robes into horizontal flaps in Run frames 2-4, and bm's grounded hero walk and jog will fix most of it.
