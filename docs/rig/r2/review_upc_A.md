# Rig review r2, group A (critic 2, up-and-comer)

How I measured: I read every r2 card, then checked the numbers in r2/rest/*.json and r2/motion/*.json. Distances are in cm on the model. Side-view depth is measured against the Hips joint, and "behind" means toward the back (the figure faces left). Stature is the head joint / 0.875, the same convention as bm's heroes, so the % figures are comparable to the brief. "Lift" is how far a foot's heel or ball sits above its own rest height. "Head nod" is how far the Head-to-HeadTop bone pitches forward in a motion frame compared with rest; it is rigid with the skull, so it is the real head rotation. "Shoulder rise" is the shoulder joint's height relative to the Neck joint, compared with rest. Frames are counted 1-6 from the left of each strip. For the dark gowns I also looked at the raw frames brightened 2.2-3x.

What is fixed across the board: the floor. Through the Walk the lower foot is now within 0-1.5 cm of the floor on all 13 figures (it was 2-12 cm in round 1). Every spine is now a smooth line, and every pair of shoulder joints is mirrored.

arcane_sorcerer_f_v2: FAIL   score 5
- L knee (hidden) [major]: it is caught on the gown, not the leg. In the front view it is 9.8 cm out to her L of the hip-ankle line (lat 20.4 cm against 10.3 at the hip and 11.0 at the ankle). In the side view it is 5.2 cm (3.0%) BEHIND the hip-ankle line, so the leg bends backwards at rest. The R knee is right (3.5 cm in front of the line). Mirror the L from the R: move it 9.8 cm in and 8.7 cm forward. (Rest front and side views, hips-and-knees close-up.)
- head in motion [major]: in the Walk her head nods 31-35° further down than rest, and 38-39° in the Run. She walks staring at the floor two steps ahead, which the bm reference never does. Her rest Neck-to-Head bone leans 12° back, the most in the group, and the retarget seems to set the neck to one fixed world angle, so a back-leaning neck gets the biggest nod (see systemic). (Walk side, every frame.)
- R foot in Bolt [major, known and still not handled]: the R foot hovers through the whole cast, heel 4.2 cm and ball 3.7 cm above the floor in every frame. (Bolt three-quarter, frames 1-6.)
- shoulders in Run [minor, systemic]: the shoulder joints rise 4-12 cm toward the ears. (Run frames 1-3 and 6.)
- arms [minor, can't fully judge]: the upper arm is 19.1 cm (0.109 of stature) and the forearm 20.6 cm. The mesh's arms are short, and the wrists do sit where the gloves come out of the cuffs.
- cloth (out of scope): in Run frames 1, 3, 5 and 6 the gown spreads into a flat horizontal sheet.
- round 1: I had no blockers or majors. The minors: the hidden feet in a stride are fixed (now mirrored, 2.1 cm behind the hips and 13.2 cm long). The unmirrored shoulders are fixed. The high hip joints are better (0.558, was 0.58).

arcane_sorcerer_m_v2: FAIL   score 5
- L knee (hidden) [major]: 13.9 cm (7.9%) in front of the hip-ankle line in the side view, against 3.5 cm for the R, and 3.4 cm out to his L in front. The L thigh and shin make a big ">" through the front of the robe. Mirror it from the R: about 10.4 cm back and 3.4 cm in. (Rest side view, hips-and-knees close-up, side.)
- wrists [major]: both sit at the elbow end of the gauntlet cuffs, not where the hands begin. The R is about 10 cm short (now lat -31.2 cm, height 117 cm; the glove leaves the cuff at about lat -41, height 112). The L is about 8.5 cm short (lat 27.0, height 114.8, against about 35 and 113). The hand would pivot in the middle of the cuff, which shows in the Bolt's wrist flick. Move each wrist out to the cuff's hand end and each elbow about 7 cm out to the middle of the shoulder-wrist line. As a result the forearms are only 11.4 cm (L) and 14.1 cm (R) long. I passed this in round 1 because I mistook the cuffs for gloves; the brightened render shows them clearly. (Rest front view, brightened; Bolt three-quarter frames 2-4.)
- R foot in Bolt [major, known and still not handled]: it hovers through the whole cast, heel 6.0 cm and ball 5.4 cm up, so the robe hem lifts on that side. (Bolt, all frames.)
- knees (hidden) [minor]: both are at 0.357 of stature, against 0.30-0.32 in the reference, about 7 cm high. The thigh is 38-41 cm and the shin 50-52 cm. Can't fully judge under the robe.
- head in motion [minor]: a 20-23° nod in the Walk and 27° in the Run. The tall collar hides most of it.
- round 1: the floating (blocker) is fixed; the Walk's lower foot is now 0-0.5 cm up, against 2-12 cm before. The crooked neck and upper spine (major) are fixed: Spine2, Neck and Head are all on the Hips line now, and he no longer walks looking at the sky. The minors: the hidden feet are fixed (mirrored), the shoulders are fixed (both 15.8 cm out).

barbarian_f_v2: PASS   score 7
- head in motion [minor, systemic]: a 21-24° nod in the Walk and 28° in the Run. You can see her face turned to the floor in the Walk side strip.
- L pauldron in Run [minor, systemic]: the shoulder joints rise 5-13 cm toward the ears, and in Run frames 2-3 the L pauldron rides up over her face. The cause is the shoulder rise, not the pauldron's weights.
- R foot in Swing [minor, known]: it hovers 2.2-2.6 cm through frames 2-6.
- elbows [minor]: the upper arm is 17.1 cm and the forearm 20.2 cm, and the bracer starts right at the elbow joint, so I would leave them.
- round 1: I had no blockers or majors. The spine kink is fixed (straight now). The shoulders are fixed (mirrored, 17.0 cm). The knees are better (1.5-1.6%, was 1.1-1.3%). The float is fixed.

barbarian_m_v2: PASS   score 8
- knees [minor]: only 1.0% (L) and 0.7% (R) in front of the hip-ankle line, still under the brief's 1.2% minimum. Nudge them about 1.5 cm forward. (Rest side view.)
- head in motion [minor, systemic]: a 15-18° nod in the Walk, the smallest in the group, and 22° in the Run.
- shoulders in Run [minor, systemic]: the fur mantle rides up over the back of his head in Run frames 2-3 because the shoulder joints rise up to 13.5 cm.
- R foot in Swing [minor, known]: it hovers 2.2-2.5 cm.
- round 1: I had no blockers or majors. The knees are better (was 0.1-0.6%). The shoulders are fine.

bard_f_v2: FAIL   score 6
- head in motion [major]: a 28-31° nod in the Walk and 35-36° in the Run. The hat brim tips down and she walks looking at her boots in every Walk frame, side and three-quarter. Her rest Neck-to-Head bone leans 9° back, the second most in the group. Straighten it (Head about 1.5 cm forward over the Neck), and fix the retarget (systemic). (Walk side and three-quarter, every frame.)
- knees [minor]: 1.0-1.1% in front of the line, just under 1.2%. Nudge them about 0.5 cm forward.
- shoulders in Run [minor, systemic]: they rise 5.5-13 cm.
- The rest fit is clean. The ankles sit in the heeled boots, the shoulders are mirrored at 17.6 cm, and the head pivot is at the back of the jaw.
- round 1: I had no blockers or majors. The neck is fixed (the Neck joint is no longer behind Spine2). The shoulders are fixed (mirrored). The knees are better (were 0.3-0.5% behind the line).

bard_m_v2: PASS   score 8
- head in motion [minor, systemic]: a 16-19° nod in the Walk and 23-24° in the Run.
- hip joints [minor, can't fully judge]: they are at 0.517 of stature, against 0.53-0.55, so maybe 2 cm low, but the tunic hides the crotch.
- feet [minor]: the R ankle is 1.0 cm further back than the L. Mirror them.
- round 1: I had no blockers or majors. The neck is fixed. The shoulders are fixed (17.9/18.0 cm). The knees are better (1.2-1.3%, were 0.3-0.5%).

boomerang_knight_f_v2: FAIL   score 6
- head in motion [major]: a 25-28° nod in the Walk and 32° in the Run. The helmet brim covers her face in every Walk frame of the three-quarter strip, so she walks blind. Her rest Neck-to-Head bone leans 5° back. (Walk three-quarter, frames 1-6.)
- feet in Throw [minor]: the L heel sinks 1.2-1.8 cm into the floor through the whole Throw.
- hip joints [minor]: they are at 0.560 of stature, about 1-1.5 cm high against 0.53-0.55.
- shoulders in Run [minor, systemic]: they rise 4-10 cm.
- round 1: the unmirrored shoulders (major) are fixed: both are 14.0 cm from the spine, inside the deltoid, and the arm chains match. The spine is fixed. The elbows are fine now (upper arm 17.0 cm, forearm 16.9 cm). The float is fixed.

boomerang_knight_m_v2: FAIL   score 3
- boot toes [blocker]: the toe of each boot stretches into a curved sickle-shaped spike 25-45 cm long whenever that foot rolls onto its toes. It is on the rear R boot in Walk frames 1, 2 and 6, and on one foot or the other in Run frames 1, 2, 3, 5 and 6; it is longest (about 45 cm) on the trailing foot in Run frame 1. From the game camera it reads like a scythe blade on his foot. It is the same failure as the known toe spikes on the bare-footed dead, but on a booted hero, so it is not handled yet. Check the toe-tip weights (they look tied to something that does not follow ToeBase). The ball sits 8.8 cm in front of the ankle, and the boot runs about another 9 cm past it. (Walk side frames 1-2; Run side and three-quarter, frames 1 and 3; the feet sheets show it plainly.)
- head in motion [minor, systemic]: a 19-23° nod in the Walk.
- The rest fit is the cleanest in the group: knees 1.4%, shoulders mirrored at 19.0 cm under the pauldron, ankles in the boot shafts, and the head pivot at the jaw hinge. The Throw deforms well.
- round 1: I had no blockers or majors. The elbows are better (upper arm 18.3 cm, forearm 19.2 cm). The knees are better (1.4%, was 0.5%). The float is fixed.

brakka_v2: FAIL   score 5
- elbows [major]: both sit outside the arm. In the side view each elbow is 10.9 cm behind the Hips line, while the shoulder (2.3 cm) and the wrist (-2.0 cm) are in the arm, so the elbow sits about 10 cm behind the back of the forearm, in the fur cloak. In front it sits on the inner edge of the forearm, about 7 cm below the top of the bracer. Move each elbow about 10 cm forward, 6-7 cm up and 3-4 cm out, to the middle of the arm at the top of the bracer. This is a regression: round 1's R elbow (134 cm up, 3.4 cm behind the line) was right, and mirroring kept the L (12.3 cm behind) instead. (Rest side view and shoulders-and-arms close-up, side; brightened side render.)
- head in motion [minor]: a 26-29° nod in the Walk. Her rest head is tipped back laughing, so she ends up looking about 10-15° down, which reads OK.
- shoulders in Run [minor, systemic]: they rise up to 17 cm, the most in the group, and the fur cloak covers her head in Run frame 3. In the Swing three-quarter frames 3-4 the R pauldron rises to her ear.
- R foot in Swing [minor, known]: the ball is 1.2-2.8 cm up.
- round 1: the floating (major) is fixed (the Walk is at 0-0.7 cm, and the Swing stands on the floor, sinking 1 cm at most). The L shoulder not mirrored in depth (major) is fixed (both 2.3 cm behind the line and 24.3 cm out). The arms: the upper arm is now 23.9 cm against a 23.5 cm forearm, but see the elbows above.

carrion_witch_f_v2: PASS   score 7
- head in motion [minor, systemic]: a 22-25° nod in the Walk and 29° in the Run. The hat brim hides most of it.
- balls of the feet [minor]: 4.9 cm (0.032) off the floor, against 0.013-0.024. Drop them about 1.5 cm.
- legs [minor]: the R ankle is 2.9 cm nearer the centre than the L, but that matches the mesh's boots, which I could see in a brightened render, so I would leave it.
- cloth (out of scope): in the Run the robe flares into flat sheets.
- round 1: the R shoulder at the collar (blocker) is fixed: both shoulders are 13.2 cm out, and in the Bolt the casting arm now leaves the shoulder cleanly. The spine through the belly (major) is fixed (straight, on the Hips line). The minors: the elbows are fixed (mirrored), and the R leg now follows the boot.

carrion_witch_m_v2: FAIL   score 5
- neck and head pivot [major]: the hunch is now one smooth curve, but its top runs along the front of the throat. The Neck joint is about 5 cm in front of the middle of the neck, at the front of the collar. The Head joint is at the mouth and chin, only 3.4 cm behind the face, against 6-12 cm on everyone else, and about 7 cm in front of the spot under the ear where it belongs. Any nod would swing the skull around the chin, which shows in the Bolt's head dip (frames 3-4). Move Head about 7 cm back and 1-2 cm up, under the ear, and Neck about 5 cm back into the neck. (Head close-up, side; brightened side render.)
- R leg [major]: still a zigzag in front. The R knee is 5.0 cm toward the centre of the R hip-ankle line (lat -5.0 cm against -10.3 at the hip and -9.8 at the ankle), and only 0.6% in front of it in the side view. The R ankle is mirrored from the L now but sits about 2.5-3 cm outside the R boot, which the brightened front render shows nearer the centre. Move the R ankle about 2.5 cm in, and the R knee about 3.5 cm out onto a straight line. (Rest front view, hips-and-knees close-up.)
- head in motion [minor]: the opposite of the others. The Walk straightens his rest hunch, and his head tilts 3-6° back.
- round 1: the shoulders at the neck (blocker) are fixed (14.4 cm out). The R foot outside its boot (blocker) is better: the ankle is mirrored and near the boot, but the knee is still pulled in (above). The zigzag spine (major) is fixed (one smooth curve), though the top of it is too far forward (above). The float is fixed.

death_knight_f_v2: PASS   score 8
- head end [minor]: unchanged. HeadTop_End still leans 24° to her L in front (7.6 cm across over 17 cm up) because it lands on a crown spike. Point it straight up, which matters if the retarget reads that bone's direction. (Head close-up, front.)
- head in motion [minor, systemic]: a 20-24° nod in the Walk; the crowned helm tips forward.
- R foot in Swing [minor, known]: it hovers 2.6-2.9 cm.
- arms [minor, can't fully judge]: the upper arm is short (17.3 cm, 0.093 of stature) against a 19.2 cm forearm. The elbow does sit at the lower edge of the pauldron, so the mesh's arms are short.
- round 1: I had no blockers or majors. The Neck joint that was too high is fixed (now 8.4 cm below the head joint, at the gorget). The L/R mismatches are fixed (mirrored).

death_knight_m_v2: PASS   score 8
- L knee [minor]: only 0.6% in front of the hip-ankle line (R 1.0%), and the L is 0.7 cm further back than the R. Nudge the L about 1.2 cm forward. (Rest side view.)
- R foot in Swing [minor, known]: the heel is 4.2 cm and the ball 2.4-2.6 cm up in frames 2-6. That reads as a raised heel, not a hovering boot, so I kept it minor. Say if you want the known issue failed outright.
- shoulders in Run [minor, systemic]: in Run frames 1 and 3 the pauldrons ride up against the helm.
- head in motion [minor, systemic]: a 19-22° nod in the Walk.
- round 1: the spine through the belly plate (major) is fixed (straight). The Walk no longer curls into a hunch with the backplate bulging. The elbows are fixed (mirrored; upper arm 19.8 cm, forearm 21.9 cm). The sinking feet are fixed.

## Systemic (ranked by how many figures they hit)
1. Shoulders shrug in motion (13 of 13). Compared with rest, the shoulder joints rise 2-5 cm toward the neck through the whole Walk and 4-17 cm in the Run, which puts them at ear height in Run frames 1-3 and 6 (brakka 17 cm, the others 10-14). Pauldrons, mantles and cloaks then ride over the face: barbarian_f, barbarian_m, brakka and death_knight_m in Run frames 2-3. It is the same on every figure, so it comes from the retarget, not the fits. The collarbones were moved to sit over the shoulder joints this round, so their rest direction no longer matches bm's while the clip's collarbone rotations are copied as they are. Retarget the collarbones relative to their own rest pose.
2. The Run reads as a bounding sprint, not bm's jog (13 of 13). Both feet are off the floor in 4 of the 5 sampled frames, with 22-27 cm of flight in frame 3. The trailing shin still kicks up 31-42 cm behind (frames 1 and 6), which is my round-1 complaint again. The hips drop 20-23 cm (11-12% of stature) into a deep crouch at the plant in frame 4. The torso leans 14-20°. The Walk, by contrast, is good: grounded heel-toe, a 3-6 cm hip bob, and close to the reference, apart from a slightly high swing-knee in frame 5 (13-16 cm toe clearance).
3. Heads nod down in the Walk and Run (12 of 13). The head pitches 15-35° further down than rest through the Walk and 22-39° in the Run, so figures walk looking at the floor; the bm reference walks with the head level. The nod follows the rest Neck-to-Head angle almost exactly: arcane_sorcerer_f (neck leaning 12° back) 31-35°, bard_f (9° back) 28-31°, brakka 26-29°, boomerang_knight_f 25-28°, barbarian_m (5° forward) 15-18°. carrion_witch_m (25° forward, hunched) goes the other way, tilting 3-6° back. So the retarget writes a fixed world direction for the neck and head instead of a rotation relative to each figure's rest. That needs one fix in the retarget, plus straightening the back-leaning necks.
4. The R foot rides high in standing attacks (8 of 13 at 2 cm or more; known, not handled). arcane_sorcerer_m 5.4-6.0 cm and arcane_sorcerer_f 3.7-4.2 cm in the Bolt (fails both), death_knight_m with the heel 4.2 cm up, and barbarian_f, barbarian_m, death_knight_f and brakka 2.2-2.9 cm in the Swing. boomerang_knight_f's L heel goes the other way, sinking 1.2-1.8 cm in the Throw.
5. Knees still under the 1.2% minimum (6 of 13): barbarian_m 0.7-1.0%, death_knight_m L 0.6%, carrion_witch_m R 0.6%, bard_f 1.0-1.1%, and death_knight_f and carrion_witch_f L at 1.1%. These are small; nudge them 0.5-1.5 cm.
6. Knees under gowns caught on a drape panel (3 of 13). On both arcane sorcerers the L knee follows a gown panel: 10 cm out and 5 cm behind the line on _f, 14 cm forward on _m. The R knee is fine on both. carrion_witch_m's R knee is pulled 5 cm in. When a leg is hidden, mirror the knee from the side that came out straight, the same rule as for the feet.
7. Arm joints fitted to the wrong thing (2 of 13). brakka's elbows sit about 10 cm behind the arm, because mirroring kept the worse side. arcane_sorcerer_m's wrists sit 8.5-10 cm short, at the top of the gauntlet cuffs. "The better side kept" needs a check that the kept joint is inside the mesh.
8. A booted toe spike (1 of 13, but blocker-grade): boomerang_knight_m's boot toes stretch 25-45 cm. It looks like the known bare-foot toe-spike bug, and it reaches booted heroes too, so check every figure's toe-tip weights, not only the dead's.
9. Rule-placed shoulders (13 of 13, a note rather than a fault). Every shoulder joint is at exactly 0.778 of stature and every collarbone at 0.788. They land inside the deltoid on all 13 meshes, but 1-1.5% below bm's 0.787-0.796, so watch for that on broad-shouldered or pauldron-heavy recruits.
