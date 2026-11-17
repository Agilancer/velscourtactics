# Rig review r2, group G: critic 2 (up-and-comer), batch-9 recruits

How I measured: every rig and motion card in `r9/cards`, then the numbers in `r9/rest` and `r9/motion`. I worked out
joint heights from the floor mark, side-view depth, the knee's offset from the hip-ankle line, the left-right mirror
and 3D bone lengths (front x, side x, height). I redrew the skeleton over the brightened rest renders and zoomed in on
the arms, legs, feet and head. Motion frames are numbered 1-6 from left to right, as on the card (frame 6 = frame 1, the
clips loop). "Above rest" means the joint's height over its own height in the rest pose, so a planted foot reads about 0.
Heights are quoted as % of the whole model (hats, crests and hoods included) unless I say otherwise. These are recruits,
so there are no round-1 lines.

The headline: the rest fits are good. Knees sit on the knee (poleyns, kneecaps), ankles sit in the boot shaft over
the heel, balls sit at the sole bend and wrists sit at the cuff. Left and right match in height to 0.3 cm and the arms
are exact mirrors; leg spread differs by 1-2 cm on a few figures, following each mesh's stance. Every torso spine
runs straight up the middle. bm's walk lands well. Every figure heel-strikes with the toes up, the stance ball stays
within 1 cm of the rest floor, the toe-off is clean and the knees always bend forward. Three things break it:
1. Soraya's boots are welded together in the mesh.
2. The new Walk/Run retarget tips the head down by however much the mesh's neck leans back at rest, so five of these
   figures walk staring at their boots.
3. The Thrust clip hikes the right knee to hip height (the known right-foot issue, at its worst).

nell_v2: PASS   score 7
- knees [minor]: only 1.0-1.1 cm (0.6% of height) forward of the hip-ankle line in the side view, below the refit's
  own 1.2% floor. The leg reads ruler-straight at rest. Bring each knee forward about 1 cm. (In the walk they bend
  forward fine.)
- hip joints [minor]: 11.5 cm apart, each about 1.5-2 cm inside its thigh centre (front, hips-and-knees close-up).
  Move each out about 1.5 cm.
- shoulder joints [minor]: in the outer third of the puffed sleeve cap, about 2 cm outboard (front). The upper arm
  (0.108 of height) is shorter than the forearm (0.119). Move each in 1.5-2 cm and up about 1 cm.
- head in Walk/Run [minor]: pitched 18-21° down through the Walk and 25° in the Run (rest neck-head leans +1°). The
  eyes are on the floor in the 3/4 frames, but the face still reads.
- R foot in Strum [minor]: R ball 1.9-2.6 cm above rest for the whole clip (the known right-foot-high issue, small
  here).
- good: ankles in the heeled boot shaft, balls at the sole bend, and the hip drum rides the pelvis cleanly.

osric_v2: FAIL   score 5
- neck/head [major]: neck-to-head leans back 14° at rest. The head pivot sits about 2-3 cm from the back of the head
  inside the gorget, and the neck joint is forward of it (side view, head close-up). Because the new retarget
  direction-matches the neck, the head tips down 33-36° in every Walk frame and 40° in the Run. His chin is on the
  gorget, and the face is gone under the morion in all six 3/4 walk frames. A living recruit reads as one of the
  dead. Move the neck joint back about 3 cm, or the head pivot forward about 2 cm, so neck-to-head leans 5-10° forward
  like the rest of the group (see systemic 1).
- L knee [minor]: about 2 cm medial of the L poleyn's centre (front). The knees are also uneven in the side view: L is
  3.5 cm (1.8%) forward of the hip-ankle line, R only 1.8 cm (0.9%, under the 1.2% floor). Move the L knee out 2 cm and
  the R knee forward about 1 cm.
- R foot in Swing [minor]: R ball 2-3 cm and R heel 2-3.5 cm above rest through the clip (known).
- good: shoulder joints are inside the upper arm under both pauldrons and mirrored, elbows sit on the couters, wrists at
  the gauntlet cuffs, and ankles over the sabaton heels.

oswin_v2: FAIL   score 5
- R leg in Thrust [major, the known unhandled right foot]: frames 3-4 (f8-f12) hike the R knee to hip height, and the
  R foot hangs 30-32 cm off the floor (ball 26 cm above rest) while the L leg stands straight. In the 3/4 view it reads
  as a knee raise, not a lunge.
- L foot in Thrust [minor]: the L ball sinks 2.1-2.5 cm through the floor at frames 2 and 5 (f4, f16).
- knees [minor]: 1.1 cm (0.6%) forward of the hip-ankle line, under the 1.2% floor. Bring them forward about 1 cm.
- head [minor]: 22-25° down in the Walk, 29° in the Run.
- good: knees on the knee plates, ankles centred in the boots, shoulder and elbow joints inside the armour.

paloma_v2: FAIL   score 6
- head [major]: 24-28° down in the Walk and 31-32° in the Run (rest neck-to-head leans back 5°). In the side view the
  face points at the floor about a metre ahead and the crest tips forward. In the 3/4 view the face drops under the
  helmet rim. Move the neck joint back about 1.5 cm, or fix the head retarget (systemic 1).
- knees [minor]: 1.2-1.3 cm (0.7%) forward of the hip-ankle line, under the 1.2% floor.
- R foot in Throw [minor]: R ball 1.7-2.2 cm above rest (known).
- good: the R shoulder is at the arm's top, the L shoulder inside the pauldron, the elbows at the top of the bracers,
  the wrists at the glove, and the knees on the greave tops. The upper arm is shorter than the forearm (0.095 vs
  0.110), but the elbow is on the mesh's elbow, so that is the mesh's proportion.
- out of scope: the tunic skirt moves with the thighs.

perkin_v2: PASS   score 8
- knees [minor]: L 1.5 cm (0.8%), R 2.0 cm (1.1%) forward of the hip-ankle line, just under the 1.2% floor.
- shoulder joints [minor]: right on the coat's shoulder seam, about 1.5 cm outboard. Move each in about 1.5 cm.
- L leg [minor, can't judge fully]: it splays about 2 cm wider than the R at the knee and ankle (front). The L boot is
  centred on its joints, so I think the mesh stands that way. Leave it unless the mirror pass says otherwise.
- head [minor]: 16-20° down in the Walk, 23-24° in the Run. This is fine and close to the reference.
- R foot in Slash [minor]: R ball 1.3-1.8 cm above rest (known).
- good: the coat swings cleanly over the walk and the twist in the Slash holds the torso together.

prudence_v2: PASS   score 8
- head [minor]: 18-22° down in the Walk, 25-26° in the Run.
- R foot in Swing [minor]: R ball 1.5-2.1 cm above rest (known).
- good: knees on the poleyns at 1.4-1.6% forward of the line, ankles centred in the sabatons, shoulder joints inside
  the pauldrons, and wrists at the gauntlets. The feet stand 4.7 cm behind the hip line in the side view, but the
  boots are there too, so that is the mesh. The cleanest armour deformation in the group, in both the Walk and the
  Swing.

ragna_v2: FAIL   score 4
- R leg in Thrust [major, the known unhandled right foot]: same knee hike as oswin. In frames 3-4 the R foot is 31-33 cm
  off the floor (ball 27 cm above rest) with the knee at hip height.
- head [major]: 24-27° down in the Walk and 31° in the Run (rest neck-to-head leans back 4°). With the kettle-hat brim,
  the face is invisible in every 3/4 walk frame. From the game camera this is a hat on legs.
- L foot in Thrust [minor]: the L ball sinks 2.3-2.7 cm through the floor at frames 2 and 5.
- knees [minor]: 5.0-5.3 cm (2.6-2.8%) forward of the hip-ankle line, a touch more than bm's 2-2.5%. They are centred
  on the poleyns, so leave them.
- good: textbook rest fit. The knees are on the poleyns, the ankles are centred in the greaves front and side, the
  shoulders are under the pauldrons and the elbows on the couters.

rodrigo_v2: FAIL   score 4
- R leg in Thrust [major, the known unhandled right foot]: in frames 3-4 the R foot is 31-33 cm off the floor (ball
  26 cm above rest) with the knee at hip height.
- head [major]: 26-30° down in the Walk and 33-34° in the Run (rest neck-to-head leans back 7°). The visor points at
  the floor and the face is hidden in the 3/4 view. Move the neck joint back about 2 cm, or fix the head retarget.
- L foot in Thrust [minor]: the L ball sinks 2.2-2.5 cm through the floor at frames 2 and 5.
- knees [minor]: 1.4-1.6 cm (0.7-0.8%) forward of the hip-ankle line, under the 1.2% floor.
- good: shoulders under the spiked pauldrons, the elbow rondel stays on the forearm, and the ankles sit over the
  sabaton heels.

sigrun_v2: PASS   score 7
- shoulder joints [minor]: at the lower outer edge of the pauldrons, about 2-3 cm low and 1.5 cm out (front, arms
  zoom). The upper arm is 16 cm against a 21 cm forearm. Raise each about 2 cm and move it in about 1 cm. The elbow
  itself is right, on the fur ring.
- Shoot [minor, clip]: at full draw (frames 3-4) the draw arm is straight, with the elbow at 162-170° in both views,
  and flung out behind with the palm open. There is no draw to the jaw, so it reads as arms flung wide. I can't tell
  whether the source clip or the retarget straightened it, because the elbows bend fine in the other clips.
- R foot in Shoot [minor]: R ball 1.6-2.4 cm above rest (known).
- head [minor]: 16-19° down in the Walk, 22-23° in the Run. This is fine.
- out of scope: the fur-hemmed coat flaps move with the legs.

silas_v2: PASS   score 7
- knees [minor]: 1.6 cm (0.9%) forward of the hip-ankle line, under the 1.2% floor.
- head [minor]: 23-26° down in the Walk and 30° in the Run. This is borderline, but the face still reads under the
  goggles.
- R foot in Shoot [minor]: R ball 1.8-2.6 cm above rest (known).
- good: the hip-hung disc stays with the pelvis while the gloved hand swings past it, the ankles are centred in the
  cuffed boots, and the wrists sit at the glove cuffs.

soraya_v2: FAIL   score 2
- boots [blocker]: the two boots are one welded piece of mesh. In the rest pose the inner cuffs and soles touch and
  share geometry (front view, feet zoom). As soon as the legs part, a sheet of boot leather stretches along the floor
  from one foot to the other: in all six Walk frames, in the Run (a slab the length of the stride at frames 1, 3, 5
  and 6), and
  as one clog-shaped block under her in the Strum. The boots have to be split in the mesh (or the bridging faces
  deleted or given to one foot) before any joint fix matters.
- hip joints [major]: 8.1 cm apart, about 4 cm inside each thigh centre (front, legs zoom). The legs pivot from the
  crotch, so the bloomers will shear when she strides. Move each out about 4 cm, to about 16 cm apart.
- R knee [major]: in the side view it sits on the front surface of the rear leg, about 3.5-4 cm forward of the leg's
  centre (4.8 cm, 2.7%, forward of the hip-ankle line, against 3.2 cm on the L). Move it back about 3.5 cm.
- R ankle and ball [minor]: the R ankle is about 3 cm medial of the R boot's centre and the R ball about 5 cm medial
  of the R toe (front; ball mirror error 6.3 cm). The R shin is 1.8 cm longer than the L; every other figure here
  matches to 0.6 cm.
- mesh note: she was generated in a staggered, knock-kneed stance (R foot 15 cm back, knees nearly touching). The rig
  follows it faithfully, but a neutral A-pose regeneration would remove this whole class of problems.
- head [minor]: 16-19° down in the Walk. This is fine.

sorrel_v2: FAIL   score 6
- head [major]: 27-30° down in the Walk and 34-35° in the Run (rest neck-to-head leans back 8°). In both the side and
  3/4 views she is watching her own boots for the whole cycle. Move the neck joint back about 2 cm, or fix the head
  retarget.
- Shoot [minor, clip]: same as sigrun. At full draw the draw arm is straight and flung behind with the palm open.
- R foot in Shoot [minor]: R ball 1.7-2.6 cm above rest (known).
- good: the rest fit is clean. In the side view both legs run dead centre through the leggings, the knees are on the
  kneecap bulge at 1.3-1.5% forward, the ankles are centred in the boot shaft and the balls sit at the sole bend.

thordis_v2: FAIL   score 5
- R leg in Thrust [major, the known unhandled right foot]: in frames 3-4 the R foot is 30-32 cm off the floor (ball
  26 cm above rest) with the knee at hip height.
- L foot in Thrust [minor]: the L ball sinks 2.1-2.5 cm through the floor at frames 2 and 5.
- head [minor]: 23-26° down in the Walk and 30° in the Run. The face is still visible under the winged helmet.
- good: knees at the centre of the knee cops, ankles over the sabaton heels, shoulders inside both pauldrons
  (including the winged L one). The faulds ride the hips cleanly in the walk.

ximena_v2: PASS   score 8
- head [minor]: 18-21° down in the Walk, 25° in the Run.
- Shoot [minor, clip]: same straight, flung draw arm as sigrun and sorrel.
- R foot in Shoot [minor]: R ball 1.6-2.5 cm above rest (known).
- good: knees centred at 1.8-1.9% forward, ankles centred in the boots, shoulders inside the pauldrons. The armour and
  hood hold their shape through the walk.

Gait, in one line each: bm's Walk reads right on every figure (heel strike, planted stance, clean toe-off, a 3-4.5 cm
hip bob) apart from the head. The Run is not a jog (see systemic 3).

## Systemic, ranked by how many figures they hit

1. **Head drop in the new Walk/Run [major on 5, minor on 9]: 14 of 14.** The Walk/Run retarget puts the
   Spine2-to-Neck and Neck-to-Head directions at the same world angles on every figure (10-13° and 14-16°, identical
   frame by frame across figures). Each mesh's own head tilt relative to its neck is then added on top. The more the neck leans back at rest,
   the further the head drops:

   | Figure | Rest neck-to-head lean | Head down, Walk | Head down, Run |
   |---|---|---|---|
   | osric | -14° | 33-36° | 40° |
   | sorrel | -8° | 27-30° | 34-35° |
   | rodrigo | -7° | 26-30° | 33-34° |
   | paloma | -5° | 24-28° | 31-32° |
   | ragna | -4° | 24-27° | 31° |
   | sigrun | +4° | 16-19° | 22-23° |
   | soraya | +4° | 16-19° | 22-23° |
   | perkin | +3° | 16-20° | 23-24° |

   The old-library attack clips do not have this problem: every figure starts them at the same 18° head pitch. From a
   camera 35-45° above, anything past about 25° hides the face under a hat or helmet. Fix: direction-match the head
   too (Head to HeadTop, or the face-forward vector) to the source's world orientation, as the attack path already
   does. Alternatively, move each backward-leaning neck joint back so neck-to-head leans 5-10° forward at rest.
2. **Right foot high in the attack clips: 14 of 14 (known, not handled).** Thrust (oswin, ragna, rodrigo, thordis) is
   the worst case: in frames 3-4 the R knee is hiked to hip height and the R foot is 30-33 cm off the floor (ball about
   26 cm above rest) while the L leg stands straight. It reads as a knee raise, not a lunge. In the same clip the
   planted L ball sinks 2.1-2.7 cm through the floor at frames 2 and 5. Every other attack (Strum, Swing, Slash,
   Throw, Shoot) carries the R ball 0.4-2.9 cm above rest (mostly 1.5-2.6 cm) for the whole clip. That is barely visible at game scale,
   but it is the same bug.
3. **The Run is a bound, not a jog [major, clip-level, not counted against any figure]: 14 of 14.** In three of the
   six sampled frames (frames 1, 3 and 5, i.e. f0, f8.8 and f17.6) the lowest foot joint is 21-31 cm above the floor,
   so the soles are about 17-27 cm up. The rear shin kicks up to horizontal and the hips drop 19-22 cm into the single
   contact frame (frame 4). From the iso camera
   this will read as hopping between tiles, and the head is 22-40° down on top of that. The side-view Run frames on
   the cards also crop the leading and trailing foot at frames 1 and 6.
4. **Knees under the refit's own 1.2% forward floor [minor]: 7 of 14.** nell 0.6%, oswin 0.6%, paloma 0.7%, rodrigo
   0.7-0.8%, perkin 0.8-1.1%, silas 0.9%, and osric's R knee 0.9%. The refit's rule did not land on these. The walk
   still bends the right way, but the rest legs are ruler-straight.
5. **Shoulder joints on the outer edge or seam [minor]: about 4 of 14** (nell, perkin, sigrun, and the general short
   upper arm). The upper arm is shorter than the forearm on 11 of 14 (0.093-0.117 vs 0.104-0.127 of model height). Where
   I could see the elbow on the mesh (paloma's bracer top, sigrun's fur ring) the elbow is right, so most of this is
   the meshes' short upper arms. The rest is shoulder joints sitting 1.5-3 cm out or low on a pauldron edge or seam.
6. **Shoot draws with a straight arm [minor, clip]: 3 of 14** (sigrun, sorrel, ximena). At full draw both elbows are
   162-170° and the draw hand is flung out behind, palm open. A bow draw needs the draw elbow folded and the hand at
   the jaw. silas's Shoot is a different, one-armed clip.
7. **Feet welded together in the mesh [blocker]: 1 of 14** (soraya). This is low on count but the worst single
   problem in the group. It is worth a mesh-prep check on any future figure generated with its feet together or
   crossed: look for a gap between the boots in the front rest render before rigging.
