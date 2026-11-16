// Gear in the hands: the weapon and shield models of data/gear.js (assets/gear/<id>.glb) put on a body.
// On a stand-in they ride its arm groups; on a real model, its hand, forearm and chest bones. Both rigs in the game work:
// Meshy's (RightHand, RightForeArm, Spine2) and the one bm's heroes share (hand_r, lowerarm_r, spine_03).
//
// Each piece is placed once, with the body standing in the first frame of its idle: there a spear stands upright, a sword
// points ahead and a little down, a shield hangs on the outside of the forearm, whatever the rig's wrists do. After that
// it rides its bone, so every other clip swings it with the hand.
//
// A figure with Mixamo takes (gfx/clipbank.js, mxClips) also knows where a Mixamo fist holds things in its hands (the
// bank's grip: the fist's middle, the axis the fingers wrap, the way the knuckles face, in the hand bone's frame). Those
// takes were made with something in that fist, so while one plays the piece goes over to it: the long axis along the
// fist (a pistol's barrel along the knuckles instead), the bit or edge out the knuckles' side. The takes say how far over
// the hands are (the GripW node, eased in and out with the body), and holdGear moves each piece between the two places.
//
// The gear's own frame (tools/gear/bake.py): the grip at the origin, the long axis up +Y, the flat of a blade facing ±X,
// an axe's bit and a boomerang's elbow out along -Z, a shield's face to -Z, a lute's strings to +Z.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// the looks whose bit or curve is modelled out along +Z instead of -Z
const FLIP = new Set(['rust_axe', 'butcher_axe', 'scimitar']);
// how tall the people bm sized its gear for were
const BM_HEIGHT = 1.9;

// The gunner's flintlock, there being none in bm: walnut stock, iron barrel ahead along +Y, the butt down along -Z.
function flintlock() {
  const g = new THREE.Group(), m = (c) => new THREE.MeshLambertMaterial({ color: c });
  const walnut = m(0x5a3a22), iron = m(0x4a4c52), brass = m(0xb08a3e);
  const at = (mesh, x, y, z, rx = 0) => { mesh.position.set(x, y, z); mesh.rotation.x = rx; g.add(mesh); return mesh; };
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.34, 8), iron), 0, 0.2, 0.05);              // barrel
  at(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.05), walnut), 0, 0.12, 0.02);                      // fore-stock
  at(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.16), walnut), 0, -0.02, -0.05, -0.35);             // grip
  at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), brass), 0, -0.05, -0.13);                       // butt cap
  at(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.035), iron), 0, 0.02, 0.08);                       // lock
  at(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.025, 8), brass), 0, 0.36, 0.05);            // muzzle ring
  return g;
}

// Some of bm's swords (iron, copper, falchion, bluesteel, sawback) were baked the wrong way up: the point at the origin
// and the hilt at the far end, so a hand held them by the tip. A sword's crossguard is its widest part: one whose
// guard is in its upper half is turned end for end, its grip put back on the origin (as far from the guard as the
// grips of the swords baked the right way are, about 0.15 of bm's metres).
function hiltDown(scene) {
  scene.updateMatrixWorld(true);
  const V = new THREE.Vector3(), pts = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { V.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); pts.push(V.x, V.y, V.z); }
  });
  if (!pts.length) return;
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 1; i < pts.length; i += 3) { y0 = Math.min(y0, pts[i]); y1 = Math.max(y1, pts[i]); }
  const N = 20, w = new Array(N).fill(0);
  for (let i = 0; i < pts.length; i += 3) { const b = Math.min(N - 1, Math.floor((pts[i + 1] - y0) / (y1 - y0) * N)); w[b] = Math.max(w[b], Math.abs(pts[i]), Math.abs(pts[i + 2])); }
  let g = 1;
  for (let b = 1; b < N - 1; b++) if (w[b] > w[g]) g = b;
  if (g < N / 2) return;
  const guard = y0 + (g + 0.5) / N * (y1 - y0), grip = guard + 0.15;
  const turn = new THREE.Group();                        // the pieces under a turned and lifted group: x, -y, -z, grip to 0
  turn.rotation.x = Math.PI; turn.position.y = grip;
  for (const c of [...scene.children]) turn.add(c);
  scene.add(turn);
}

const cache = new Map();
function load(id, kind) {
  if (id === 'flintlock' && !cache.has(id)) cache.set(id, Promise.resolve(flintlock()));
  if (!cache.has(id)) cache.set(id, new Promise((res, rej) => new GLTFLoader().load(`assets/gear/${id}.glb`, (g) => {
    if (kind === 'sword') hiltDown(g.scene);
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      // read as matte paint like the bodies, with a little of its own colour lit back so steel doesn't go black
      o.material.metalness = 0; o.material.roughness = 1;
      o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveMap = o.material.map; o.material.emissiveIntensity = 0.14;
    });
    res(g.scene);
  }, undefined, rej)));
  return cache.get(id);
}

const BONES = { handR: /(RightHand|hand_r)$/, armR: /(RightForeArm|lowerarm_r)$/, handL: /(LeftHand|hand_l)$/, armL: /(LeftForeArm|lowerarm_l)$/, chest: /(Spine2|spine_03)$/, hips: /(Hips|pelvis)$/,
  neck: /(Neck|neck_01)$/, upL: /(LeftArm|upperarm_l)$/, upR: /(RightArm|upperarm_r)$/ };
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);

// The rig of a real model. def: its manifest entry; idle: its idle clip, whose first frame it is posed in to measure.
export function fitGear(holder, obj, def = {}, idle = null, grip = null) {
  const b = {};
  obj.traverse((o) => { if (o.isBone) for (const [k, re] of Object.entries(BONES)) if (!b[k] && re.test(o.name)) b[k] = o; });
  const u = holder.userData;
  if (!b.handR || !b.armR || !b.handL || !b.armL) { u.rig = null; return; }
  const saved = [];
  for (const tr of idle?.tracks || []) {
    const i = tr.name.lastIndexOf('.'), prop = tr.name.slice(i + 1), bone = obj.getObjectByName(tr.name.slice(0, i));
    if (!bone || (prop !== 'quaternion' && prop !== 'position')) continue;
    saved.push([bone, prop, bone[prop].clone()]);
    bone[prop].fromArray(tr.values, 0);
  }
  holder.updateMatrixWorld(true);
  const inv = holder.matrixWorld.clone().invert();
  const inHolder = (bone) => new THREE.Matrix4().multiplyMatrices(inv, bone.matrixWorld);
  const at = (bone) => new THREE.Vector3().setFromMatrixPosition(inHolder(bone));
  const toLocal = (bone) => inHolder(bone).invert();
  // the body faces +Z, so its right hand is on -X
  const side = (hand, arm, x) => ({ h: at(hand), e: at(arm), out: new THREE.Vector3(x, 0, 0), hand, arm, toHand: toLocal(hand), toArm: toLocal(arm) });
  // a manifest's own held props (placed by tools/blender/retarget.py) keep their hands
  const busy = { R: false, L: false };
  for (const pr of def.props || []) { if (/Right|_r$/.test(pr.bone)) busy.R = true; if (/Left|_l$/.test(pr.bone)) busy.L = true; }
  u.rig = {
    k: (u.height || 1.6) / BM_HEIGHT, busy,
    R: side(b.handR, b.armR, -1), L: side(b.handL, b.armL, 1),
    chest: b.chest ? { bone: b.chest, at: at(b.chest), to: toLocal(b.chest) } : null,
    grip, hold: def.hold || null,
    stow: b.chest && b.hips ? measure(holder, obj, inv, at(b.chest), at(b.hips), u.height || 1.6) : null,
  };
  if (u.rig.stow) {
    Object.assign(u.rig.stow, { holder, chestBone: b.chest, hipsBone: b.hips, toChest: toLocal(b.chest), toHips: toLocal(b.hips) });
    // what's on the back rides the torso as a whole (hips to neck, shoulder to shoulder), not one spine bone: a take
    // can bend Spine2 a long way from the idle's while the torso it skins stands as it did (the lancer's walk)
    if (b.neck && b.upL && b.upR) u.rig.torso = { bones: [b.chest, b.hips, b.neck, b.upL, b.upR], F0inv: torsoFrame([b.chest, b.hips, b.neck, b.upL, b.upR], inv, new THREE.Matrix4()).invert() };
  }
  for (const [bone, prop, v] of saved) bone[prop].copy(v);
  holder.updateMatrixWorld(true);
  if (u.gear) setGear(holder, u.gear);
  stowProps(holder);
}

// The torso's frame in the holder's: at the chest, up from the hips to the neck, across from the right shoulder to the left.
const TA = new THREE.Vector3(), TB = new THREE.Vector3(), TC = new THREE.Vector3(), TX = new THREE.Vector3(), TY = new THREE.Vector3(), TZ = new THREE.Vector3();
function torsoFrame([chest, hips, neck, upL, upR], inv, out) {
  const p = (b, v) => b.getWorldPosition(v).applyMatrix4(inv);
  p(neck, TY); p(hips, TA); TY.sub(TA).normalize();
  p(upL, TX); p(upR, TB); TX.sub(TB);
  TX.addScaledVector(TY, -TX.dot(TY)).normalize();
  TZ.crossVectors(TX, TY);
  return out.makeBasis(TX, TY, TZ).setPosition(p(chest, TC));
}
const TF = new THREE.Matrix4(), TK = new THREE.Matrix4(), TM = new THREE.Matrix4(), TI = new THREE.Matrix4();
// Each frame, on a figure with its gear stowed: what is on its back follows the torso (see fitGear).
export function carryStowed(holder) {
  const u = holder.userData, t = u.rig?.torso;
  if (!t) return;
  holder.updateWorldMatrix(true, false);
  TI.copy(holder.matrixWorld).invert();
  TK.multiplyMatrices(torsoFrame(t.bones, TI, TF), t.F0inv);
  for (const o of u.gearObjs || []) if (o.userData.carry) TM.multiplyMatrices(TK, o.userData.carry).decompose(o.position, o.quaternion, o.scale);
  for (const p of u.props || []) if (p.carry) TM.multiplyMatrices(TK, p.carry).decompose(p.obj.position, p.obj.quaternion, p.obj.scale);
}

// Where a body's back and hips are, off its skinned mesh as it stands (the holder's frame: it faces +Z, its left +X):
// back, the middle of its back a little below the chest bone; hip.L / hip.R, how far out each side of the hips is.
function measure(holder, obj, inv, chest, hips, H) {
  const V = new THREE.Vector3(), M = new THREE.Matrix4();
  let back = Infinity, hipL = -Infinity, hipR = Infinity;
  const by = chest.y - 0.04 * H;
  obj.traverse((o) => {
    if (!o.isSkinnedMesh || o.userData.hull || !o.geometry.attributes.position) return;
    M.multiplyMatrices(inv, o.matrixWorld);
    const n = o.geometry.attributes.position.count, step = Math.max(1, Math.floor(n / 6000));
    for (let i = 0; i < n; i += step) {
      o.getVertexPosition(i, V); V.applyMatrix4(M);
      if (Math.abs(V.y - by) < 0.05 * H && Math.abs(V.x - chest.x) < 0.08 * H && V.z < back) back = V.z;
      // (not as far out as the hands, which hang at the same height)
      if (Math.abs(V.y - hips.y) < 0.05 * H && Math.abs(V.z - hips.z) < 0.08 * H && Math.abs(V.x - hips.x) < 0.14 * H) { if (V.x > hipL) hipL = V.x; if (V.x < hipR) hipR = V.x; }
    }
  });
  if (!isFinite(back)) back = chest.z - 0.12 * H;
  if (!isFinite(hipL)) { hipL = hips.x + 0.11 * H; hipR = hips.x - 0.11 * H; }
  return { H, back: new THREE.Vector3(chest.x, by, back), hips, hip: { L: hipL, R: hipR } };
}

// A stand-in's rig: its arm groups hang straight down with the hand at the end.
function standInRig(parts) {
  const side = (arm) => ({ h: new THREE.Vector3(0, -0.44, 0), e: new THREE.Vector3(0, -0.2, 0), out: new THREE.Vector3(Math.sign(arm.position.x) || 1, 0, 0), hand: arm, arm, toHand: new THREE.Matrix4(), toArm: new THREE.Matrix4() });
  return { k: 1.6 / BM_HEIGHT, busy: { R: false, L: false }, standIn: true, R: side(parts.armR), L: side(parts.armL), chest: { bone: parts.torso, at: new THREE.Vector3(0, 0.75, 0.05), to: new THREE.Matrix4() } };
}

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const basis = (Y, Zh) => {
  Y = Y.clone().normalize();
  const X = new THREE.Vector3().crossVectors(Y, Zh).normalize(), Z = new THREE.Vector3().crossVectors(X, Y);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
};

// Where a look goes and how it's turned, in the frame of the bone it rides: { side, bone, matrix }.
function place(rig, look) {
  const k = rig.k, s = k * (look.scale || 1), edge = FLIP.has(look.id) ? v3(0, -1, 0) : UP;
  const grip = (f) => f.h.clone().add(f.h.clone().sub(f.e).setLength(0.075 * k));   // the palm, a hand's width past the wrist
  let side = 'R', onArm = false, pos, q;
  switch (look.hold) {
    case 'pole': pos = grip(rig.R); q = basis(v3(0, 1, 0.15), FWD); break;              // upright, leaning a touch ahead
    case 'bow': side = 'L'; pos = grip(rig.L); q = basis(v3(0, 1, 0.1), v3(0, 0, -1)); break;   // upright, string to the back
    case 'kite': case 'tower': {
      side = 'L'; onArm = true; const f = rig.L;
      pos = f.e.clone().lerp(f.h, 0.5).addScaledVector(f.out, 0.08 * k);
      q = basis(UP, f.out.clone().negate());                                             // face out from the arm
      break;
    }
    case 'lute': {
      const c = rig.chest;
      if (!c) return null;
      pos = c.at.clone().add(v3(0, -0.1 * k, 0.2 * k));
      const m = new THREE.Matrix4().compose(pos, basis(v3(0.75, 0.65, 0), FWD), v3(s, s, s));   // neck up to the left shoulder
      return { side: 'chest', bone: c.bone, matrix: c.to.clone().multiply(m) };
    }
    case 'haft': {                                                                     // head up ahead, bit down
      // a body's manifest can say where the head points at its idle instead (hold.haft: [x, y, z], the body facing +Z,
      // its right hand on -X), where the fist is (hold.at: in the right hand bone's own frame and units, as a prop's
      // "at") and how far the pommel stands out of it (hold.pommel, metres): the slime lords hang the mace head down,
      // ahead and out, clear of the belly, through the middle of the fingers tools/blender/handcurl.py closed
      const h = rig.hold?.haft, at = rig.hold?.at, d = h ? v3(h[0], h[1], h[2]) : v3(0, 0.55, 1);
      q = basis(d, edge);
      pos = at ? v3(at[0], at[1], at[2]).applyMatrix4(rig.R.toHand.clone().invert()).addScaledVector(d.normalize(), -(rig.hold.pommel || 0) * k)
        : grip(rig.R);
      break;
    }
    default:                                                                              // point ahead and a little down
      if (look.left) side = 'L';                                                          // a second knife, in the other hand
      pos = grip(rig[side]); q = basis(v3(0, -0.36, 1), edge);
  }
  const f = rig[side];
  const m = new THREE.Matrix4().compose(pos, q, v3(s, s, s));
  const matrix = (onArm ? f.toArm : f.toHand).clone().multiply(m);
  return { side, bone: onArm ? f.arm : f.hand, matrix, fist: onArm ? null : inFist(rig, side, look, matrix) };
}

// The same look in a Mixamo fist (see the top of the file), in the hand bone's frame, the size kept; null without a grip.
function inFist(rig, side, look, matrix) {
  const g = rig.grip?.[side];
  if (!g) return null;
  const at = v3(g[0], g[1], g[2]), A = v3(g[3], g[4], g[5]), K = v3(g[6], g[7], g[8]);
  const q = look.kind === 'pistol' ? basis(K, A) : basis(A, FLIP.has(look.id) ? K : K.clone().negate());
  const s = new THREE.Vector3(); matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
  return new THREE.Matrix4().compose(at, q, s);
}

// Each frame, on a figure with Mixamo takes: every piece in a hand as far over to the fist as that hand is (w: GripW's
// position, x the right hand, y the left).
const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), Q0 = new THREE.Quaternion(), Q1 = new THREE.Quaternion(), S = new THREE.Vector3();
export function holdGear(model, w) {
  for (const o of model.userData.gearObjs || []) {
    const h = o.userData.held;
    if (!h?.fist) continue;
    const k = Math.min(1, Math.max(0, h.side === 'L' ? w.y : w.x));
    if (k === h.k) continue;
    h.k = k;
    h.matrix.decompose(P0, Q0, S); h.fist.decompose(P1, Q1, S);
    o.position.lerpVectors(P0, P1, k); o.quaternion.slerpQuaternions(Q0, Q1, k); o.scale.copy(S);
  }
}

// ---- stowed: out of a fight the gear is put away ----
// A shield, a polearm, a bow, a lute and anything too long for a belt go across the back; a sword, an axe, a mace, a
// knife, a wand, a boomerang or a pistol hangs at the hip. Where is measured on the body itself, in the first frame of
// its idle (fitGear: the back of the chest and the sides of the hips, off the skinned mesh), so plate and cloth both
// carry it on their own surface. A blade hangs hilt up (cross-drawn: the right hand's on the left hip); a haft, head up.
const STOW_BACK = new Set(['pole', 'bow', 'lute', 'kite', 'tower']);
const BELT = 1.15;                                  // a blade or haft longer than this (bm's metres) goes on the back
const LANCE = 2.6;                                  // a pole longer than this stays in the hand
const boxes = new Map();
function boxOf(id, scene) {
  if (!boxes.has(id)) { scene.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(scene); boxes.set(id, { c: b.getCenter(v3(0, 0, 0)), s: b.getSize(v3(0, 0, 0)) }); }
  return boxes.get(id);
}
// The stowed place of a piece of the gear's frame (long +Y, flat ±X, face -Z), in the frame of the bone it rides.
// slot: 'back' | 'L' | 'R' (the hips); tip: where its +Y goes; flat: where its -Z goes; over: on top of a stowed shield.
function stowAt(rig, box, s, slot, tip, flat, over) {
  const st = rig.stow, H = st.H;
  tip = tip.clone().normalize(); flat = flat.clone().addScaledVector(tip, -flat.dot(tip)).normalize();
  // the piece's -Z to `flat`, +Y to `tip`
  const Y = tip, Z = flat.clone().negate(), X = new THREE.Vector3().crossVectors(Y, Z);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  const c = box.c.clone().multiplyScalar(s).applyQuaternion(q);           // from its grip to its middle, turned
  let mid;
  if (slot === 'back') {
    const thick = Math.min(box.s.x, box.s.z) * s, half = box.s.y * s / 2;
    // a shield's top at the shoulders; anything long with its foot well off the ground
    const y = flat.z < -0.9 && tip.y > 0.99 ? st.back.y + 0.12 * H - half : Math.max(st.back.y, 0.27 * H + half * Math.abs(tip.y));
    mid = v3(st.back.x, y, st.back.z - thick / 2 - 0.02 * H - (over ? 0.07 * H : 0));
  } else {
    mid = v3(st.hip[slot], st.hips.y - 0.02 * H, st.hips.z - 0.02 * H).addScaledVector(v3(slot === 'L' ? 1 : -1, 0, 0), Math.min(box.s.x, box.s.z) * s / 2 + 0.01 * H);
    if (tip.y < 0) mid.addScaledVector(tip, box.s.y * s * 0.32);          // a blade hangs from its hilt at the belt
  }
  const pos = mid.sub(c), m = new THREE.Matrix4().compose(pos, q, v3(s, s, s));
  if (slot === 'back' && rig.torso) return { side: slot, bone: st.holder, matrix: m, carry: m };   // carried by carryStowed
  const b = slot === 'back' ? st.chestBone : st.hipsBone, to = slot === 'back' ? st.toChest : st.toHips;
  return { side: slot, bone: b, matrix: to.clone().multiply(m) };
}
function stowed(rig, look, scene, over) {
  if (!rig.stow) return null;
  const box = boxOf(look.id, scene), s = rig.k * (look.scale || 1), H = rig.stow.H;
  const long = box.s.y > BELT;
  const flip = FLIP.has(look.id) ? -1 : 1;
  switch (look.hold) {
    case 'kite': case 'tower': return stowAt(rig, box, s, 'back', v3(0, 1, 0), v3(0, 0, -1), false);
    case 'pole':
      if ((look.scale || 1) < 0.6) return stowAt(rig, box, s, 'L', v3(0.08, 1, 0.25), v3(0, 0, -1));   // a wand
      if (box.s.y > LANCE) return null;              // a lance is too long for any back: carried upright, as at the idle
    // falls through: a staff, a spear or a lance across the back, head up over the right shoulder
    case 'bow': return stowAt(rig, box, s, 'back', v3(-0.42, 1, 0), v3(0, 0, -1), over);
    case 'lute': return stowAt(rig, box, s, 'back', v3(0.5, 1, 0), v3(0, 0, -1), over);
    case 'haft':
      if (long) return stowAt(rig, box, s, 'back', v3(-0.42, 1, 0), v3(0, 0, flip), over);
      return stowAt(rig, box, s, 'L', v3(0.06, 1, 0.12), v3(0, 0, flip));       // head up at the left hip, bit back
    case 'rang': return stowAt(rig, box, s, 'R', v3(0, 1, 0.2), v3(-1, 0, 0));
    default: {
      if (look.kind === 'pistol') return stowAt(rig, box, s, 'R', v3(-0.05, -1, 0.35), v3(0, 0, 1));   // holstered, butt back
      if (long) return stowAt(rig, box, s, 'back', v3(0.42, -1, 0), v3(0, 0, -1), over);   // hilt over the right shoulder
      const slot = look.left ? 'R' : 'L';
      return stowAt(rig, box, s, slot, v3(slot === 'L' ? 0.1 : -0.1, -1, -0.5), v3(0, 0, -1));
    }
  }
}
// A manifest's own held props (a lancer's lance and tower shield) go away the same way: models.js lists them in
// userData.props as { obj, bone, home: [at, rot, scale], file }.
const propBoxes = new Map();
function stowProps(holder) {
  const u = holder.userData, rig = u.rig;
  if (!rig) return;
  const shield = (u.props || []).some((p) => /shield/i.test(p.file));
  for (const p of u.props || []) {
    let at = null;
    if (u.stowed && rig.stow) {
      if (!propBoxes.has(p.file)) { const o = p.obj.clone(); o.position.set(0, 0, 0); o.quaternion.identity(); o.scale.set(1, 1, 1); o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o); propBoxes.set(p.file, { c: b.getCenter(v3(0, 0, 0)), s: b.getSize(v3(0, 0, 0)) }); }
      // its size in the holder's frame: its scale on the hand times the hand's own
      const box = propBoxes.get(p.file), s = p.home[2] * (p.bone.getWorldScale(v3(0, 0, 0)).x / (holder.getWorldScale(v3(0, 0, 0)).x || 1));
      at = /shield/i.test(p.file) ? stowAt(rig, box, s, 'back', v3(0, 1, 0), v3(0, 0, -1), false)
        : box.s.y > LANCE ? null : stowAt(rig, box, s, 'back', v3(-0.42, 1, 0), v3(0, 0, -1), shield);
    }
    p.carry = at?.carry || null;
    if (at) { at.bone.add(p.obj); at.matrix.decompose(p.obj.position, p.obj.quaternion, p.obj.scale); }
    else { p.bone.add(p.obj); p.obj.position.fromArray(p.home[0]); p.obj.quaternion.fromArray(p.home[1]); p.obj.scale.setScalar(p.home[2]); }
  }
}
// Out of a fight (on) or into one: puts the gear and props away or back in the hands.
export function stowGear(model, on) {
  const u = model.userData;
  on = !!on;
  if (u.stowed === on) return;
  u.stowed = on;
  if (u.gear !== undefined) setGear(model, u.gear);
  stowProps(model);
}
export { stowProps };

// Puts gear on a model, replacing what it had. gear: { main, off } looks from data/gear.js (lookFor, shieldFor), or null.
// On a model still waiting for its .glb it goes on the stand-in, and again on the real thing when that arrives.
export function setGear(model, gear) {
  const u = model.userData;
  u.gear = gear;
  const token = (u.gearToken = (u.gearToken || 0) + 1);
  for (const o of u.gearObjs || []) o.removeFromParent();
  u.gearObjs = [];
  const rig = u.rig || (u.parts && u.parts.armR && u.parts.armL && standInRig(u.parts));
  if (!rig) return;
  if (rig.standIn) {                                   // the stand-in's box weapon and shield make way
    const hide = (arm, name, on) => arm.children.forEach((c) => { if (c.name === name) c.visible = !on; });
    hide(u.parts.armR, 'held', !!gear?.main); hide(u.parts.armL, 'shield', !!gear?.off);
  }
  const backed = !!gear?.off && STOW_BACK.has(gear.off.hold);     // a shield on the back: a long piece goes over it
  for (const look of [gear?.main, gear?.off]) {
    if (!look) continue;
    const p0 = place(rig, look);
    if (!p0 || rig.busy[p0.side]) continue;
    load(look.id, look.kind).then((scene) => {
      if (u.gearToken !== token) return;
      const p = (u.stowed && stowed(rig, look, scene, backed && look !== gear.off)) || p0;
      const o = scene.clone();
      p.matrix.decompose(o.position, o.quaternion, o.scale);
      o.userData.held = { side: p.side, matrix: p.matrix, fist: p.fist || null, k: 0 };
      o.userData.carry = p.carry || null;
      o.traverse((c) => { if (c.isMesh) c.frustumCulled = false; });
      p.bone.add(o);
      u.gearObjs.push(o);
    }).catch((e) => console.warn('gear', look.id, 'failed to load', e));
  }
}
