# Rig review brief

You are reviewing the rigs of characters for VELSCOUR TACTICS, an isometric turn-based game (three.js, the camera
looks down at roughly 35-45 degrees from a few metres away; figures stand about 1.7-2.3 m tall). The characters were
generated and auto-rigged by Meshy AI (a 24-bone Mixamo-style skeleton: Hips, Spine, Spine1, Spine2, Neck, Head, per side
Shoulder (collarbone), Arm (shoulder joint), ForeArm (elbow), Hand (wrist), UpLeg (hip joint), Leg (knee), Foot (ankle),
ToeBase (ball of the foot)). Meshy's auto-rig often put joints in the wrong places (ankles in a gown's hem, shoulders on
top of the pauldron, a spine in the belly, a head pivot at the face), so every skeleton has been refitted to its body
and every animation re-sent through a motion library. You are judging that refit.

## What a card shows

Each figure has one PNG card:
- Top left: the rest pose from the front and from the side (the figure faces LEFT in the side view). The body is drawn
  see-through, the skeleton on top: centre bones yellow, the figure's LEFT side cyan, its RIGHT side orange. Labels: hip
  = hip joint, knee, ankle, ball (of the foot), clav (collarbone), shldr (shoulder joint), elbow, wrist, head, neck. Grey
  lines every 5% of the height (the % is of the whole model including hats, horns and helmet crests).
- Top right: close-ups of the head, shoulders, hips and knees, and feet, each front | side.
- Below: strips of frames across the Walk, the Run and the class's own attack (or Cast), from the side and from
  three-quarter, with the skeleton drawn over. These show how the body deforms in motion.

A reference of how figures SHOULD move in this game is `tools/build/rig/ref_walk_hero_paladin_m1.png` and
`tools/build/rig/ref_walk_hero_archer_f1.png` (bm's hand-rigged heroes walking: rows side, front, three-quarter).
Their skeleton proportions (fractions of stature, measured to the top of the skull, not hats): hip joint 0.53-0.55,
knee 0.30-0.32, ankle 0.067-0.08, ball 0.013-0.024, shoulder joint 0.787-0.796, neck 0.83-0.84, head joint 0.875;
upper arm 0.133-0.153, forearm 0.127-0.137; the spine runs straight up the middle of the torso from pelvis to neck,
the knee 2-2.5% of the stature in front of the line from hip to ankle.

## Scope of THIS round: the rigging only

Judge the skeleton's fit and how the body deforms because of it: joints in the middle of the limb they turn, at the
right height (a knee at the knee, an ankle at the ankle over the heel, a ball where the sole bends, a shoulder joint
inside the shoulder not on top of the pauldron, an elbow at the elbow, a wrist where the hand begins, the head pivot at
the base of the skull, the spine up the middle), left and right matching, feet planted flat on the floor in the
rest pose and through the walk (no sliding through the floor, no floating), knees bending forward the right way, no
limbs twisting, no candy-wrapper collapse at elbows, knees, shoulders or wrists, no body parts tearing away or stretching.

OUT of scope this round (do not fail a figure for these, they are the next phase): long skirts, gowns, robes, coat
tails, capes, tabards and bell sleeves currently move with the legs or arms like they are part of them. They will be cut
loose into their own physics-driven cloth with collision against the legs. You may note the worst cases in one line, but
judge the rig underneath. Hidden legs under a gown are judged by where the boots are (the toes peeking out) and by the
hips.

## About the motion strips this round

The Walk and Run in these strips are still the Mixamo library's (a bouncy walk that kicks the shin up behind); they
are being replaced by bm's hero walk and jog (the reference sheets). Judge how the RIG deforms the body in them (knees,
hips, shoulders, elbows, feet on the floor); you may say in one line what you think of the gait itself.

## What to return

For EVERY figure on your list, in this exact shape (one block per figure):

```
<figure key>: PASS | FAIL   score <1-10>
- <joint or region> [<severity: blocker | major | minor>]: <what is wrong>, <which way and roughly how far, in cm or % of
  height>, <which view or frame shows it>
```

A figure passes when nothing major or blocker is left. Be concrete enough that someone can move a joint from what you
write ("R knee 3 cm too far back in the side view, behind the shin's middle"), and do not invent problems you cannot see;
say "can't judge: <why>" instead. End with a short list of problems you saw across many figures (systemic).
