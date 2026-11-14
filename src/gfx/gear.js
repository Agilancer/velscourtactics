// Gear in the hands: the weapon and shield models of data/gear.js (assets/gear/<id>.glb) put on a body.
// On a stand-in they ride its arm groups; on a real model, its hand, forearm and chest bones. Both rigs in the game work:
// Meshy's (RightHand, RightForeArm, Spine2) and the one bm's heroes share (hand_r, lowerarm_r, spine_03).
//
// Each piece is placed once, with the body standing in the first frame of its idle: there a spear stands upright, a sword
// points ahead and a little down, a shield hangs on the outside of the forearm, whatever the rig's wrists do. After that
// it rides its bone, so every other clip swings it with the hand.
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

const cache = new Map();
function load(id) {
  if (id === 'flintlock' && !cache.has(id)) cache.set(id, Promise.resolve(flintlock()));
  if (!cache.has(id)) cache.set(id, new Promise((res, rej) => new GLTFLoader().load(`assets/gear/${id}.glb`, (g) => {
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

const BONES = { handR: /(RightHand|hand_r)$/, armR: /(RightForeArm|lowerarm_r)$/, handL: /(LeftHand|hand_l)$/, armL: /(LeftForeArm|lowerarm_l)$/, chest: /(Spine2|spine_03)$/ };
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);

// The rig of a real model. def: its manifest entry; idle: its idle clip, whose first frame it is posed in to measure.
export function fitGear(holder, obj, def = {}, idle = null) {
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
  };
  for (const [bone, prop, v] of saved) bone[prop].copy(v);
  holder.updateMatrixWorld(true);
  if (u.gear) setGear(holder, u.gear);
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
    case 'haft': pos = grip(rig.R); q = basis(v3(0, 0.55, 1), edge); break;            // head up ahead, bit down
    default: pos = grip(rig.R); q = basis(v3(0, -0.36, 1), edge);                        // point ahead and a little down
  }
  const f = rig[side];
  const m = new THREE.Matrix4().compose(pos, q, v3(s, s, s));
  return { side, bone: onArm ? f.arm : f.hand, matrix: (onArm ? f.toArm : f.toHand).clone().multiply(m) };
}

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
  for (const look of [gear?.main, gear?.off]) {
    if (!look) continue;
    const p = place(rig, look);
    if (!p || rig.busy[p.side]) continue;
    load(look.id).then((scene) => {
      if (u.gearToken !== token) return;
      const o = scene.clone();
      p.matrix.decompose(o.position, o.quaternion, o.scale);
      o.traverse((c) => { if (c.isMesh) c.frustumCulled = false; });
      p.bone.add(o);
      u.gearObjs.push(o);
    }).catch((e) => console.warn('gear', look.id, 'failed to load', e));
  }
}
