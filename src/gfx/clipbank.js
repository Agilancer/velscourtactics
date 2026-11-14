// bm's hero clip bank: 187 clips for the rig bm's heroes share (root, pelvis, spine_01..03, hand_r, thigh_l...), packed by
// bm into assets/models/clips/heroes.json + heroes.bin. A manifest entry with "bank": "heroes" takes its clips from here
// instead of from its own .glb, by the bank's clip names (README.md, "From bm"; tools/bm/heroes.py).
//
// The packing (bm's src/sim/anim.js): every joint's local rotation per frame as four Int16s over 32767, one frame for a
// joint that holds still; then the pelvis's place per frame as Float32 xyz, in the root's frame, which is z-up. Each body
// says in its scene's extras where its own pelvis sits (pelvisBase) and how much bigger it is than the clips' one
// (motionScale): pelvis = pelvisBase + (clip - pelvisRest) * motionScale. Clips are kept on the spot: the game walks the units.
import * as THREE from 'three';

//
// bm's townsfolk bank (assets/models/clips/folk.*, "bank": "folk") is packed the same way but was made on one girl's rig,
// which no other body shares: each body takes it across by the two rest poses, as bm's src/folk/rig.js does,
//     theirs(j) = A(j) * hers(j) * B(j),   A(j) = restWorld_theirs(parent)^-1 * restWorld_hers(her parent),
//                                          B(j) = restWorld_hers(j)^-1 * restWorld_theirs(j),
// and the hips' rise and fall is scaled by how much taller their hips stand than hers.
const banks = new Map();
function bank(name) {
  if (!banks.has(name)) banks.set(name, Promise.all([
    fetch(`assets/models/clips/${name}.json`).then((r) => r.json()),
    fetch(`assets/models/clips/${name}.bin`).then((r) => r.arrayBuffer()),
  ]).then(([meta, bin]) => {
    const split = meta.pelvisByteOffset ?? meta.hipsByteOffset;
    return { meta, rot: new Int16Array(bin, 0, split >> 1), pel: new Float32Array(bin, split), raw: new Map() };
  }));
  return banks.get(name);
}

// Int16 quaternions at `off`, n of them, as unit floats kept in one hemisphere frame to frame.
function quats(rot, off, n) {
  const q = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let x = rot[off + i * 4] / 32767, y = rot[off + i * 4 + 1] / 32767, z = rot[off + i * 4 + 2] / 32767, w = rot[off + i * 4 + 3] / 32767;
    const l = Math.hypot(x, y, z, w) || 1;
    x /= l; y /= l; z /= l; w /= l;
    if (i && x * q[i * 4 - 4] + y * q[i * 4 - 3] + z * q[i * 4 - 2] + w * q[i * 4 - 1] < 0) { x = -x; y = -y; z = -z; w = -w; }
    q[i * 4] = x; q[i * 4 + 1] = y; q[i * 4 + 2] = z; q[i * 4 + 3] = w;
  }
  return q;
}
const clean = (name) => THREE.PropertyBinding.sanitizeNodeName(name);   // 'mixamorig:Hips' is 'mixamorigHips' in three

// World rotations of a rest pose, parents first.
function restWorld(parent, local) {
  const w = [];
  local.forEach((q, j) => { w[j] = parent[j] < 0 ? q.clone() : w[parent[j]].clone().multiply(q); });
  return w;
}

async function folkClips(b, gltf, names) {
  const sk = b.meta.skeleton, fps = b.meta.fps;
  if (!b.her) {
    const parent = sk.map((j) => j.parent), local = sk.map((j) => new THREE.Quaternion(...j.r));
    b.her = { index: new Map(sk.map((j, i) => [clean(j.name), i])), parent, world: restWorld(parent, local), hips: sk.findIndex((j) => /Hips$/.test(j.name)) };
  }
  const her = b.her, bones = [];
  gltf.scene.traverse((o) => { if (o.isBone) bones.push(o); });
  const at = new Map(bones.map((o, i) => [o.name, i])), parent = bones.map((o) => (o.parent?.isBone ? at.get(o.parent.name) : -1));
  const world = restWorld(parent, bones.map((o) => o.quaternion));
  // which of her joints each of ours follows, and the fixed turns either side
  const src = new Int32Array(bones.length).fill(-1), A = [], B = [];
  bones.forEach((o, j) => {
    const s = her.index.get(o.name);
    if (s === undefined) return;
    const p = parent[j], sp = her.parent[s];
    if (p >= 0 ? src[p] !== sp : sp >= 0) return;        // her parent must be the one ours follows
    src[j] = s;
    A[j] = (p >= 0 ? world[p].clone().invert() : new THREE.Quaternion()).multiply(sp >= 0 ? her.world[sp] : new THREE.Quaternion());
    B[j] = her.world[s].clone().invert().multiply(world[j]);
  });
  const hips = bones.findIndex((o) => /Hips$/.test(o.name)), home = bones[hips].position, herHome = sk[her.hips].t;
  const k = home.y / herHome[1];
  const of = new Map([...src].map((s, j) => [s, j]).filter(([s]) => s >= 0));
  const out = [], q = new THREE.Quaternion();
  for (const name of new Set(names)) {
    const c = b.meta.clips[name];
    if (!c) { console.warn('clip bank folk has no clip named', name); continue; }
    const times = Float32Array.from({ length: c.frames }, (_, i) => i / fps), tracks = [];
    for (const [s, off, still] of c.tracks) {
      const j = of.get(s);
      if (j === undefined) continue;
      const n = still ? 1 : c.frames, h = quats(b.rot, off, n), v = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { q.fromArray(h, i * 4).premultiply(A[j]).multiply(B[j]); q.toArray(v, i * 4); }
      tracks.push(new THREE.QuaternionKeyframeTrack(bones[j].name + '.quaternion', still ? [0] : times, v));
    }
    const p = b.pel.subarray(c.hips, c.hips + c.frames * 3), v = new Float32Array(c.frames * 3);
    for (let i = 0; i < c.frames; i++) { v[i * 3] = home.x; v[i * 3 + 1] = home.y + (p[i * 3 + 1] - herHome[1]) * k; v[i * 3 + 2] = home.z; }
    tracks.push(new THREE.VectorKeyframeTrack(bones[hips].name + '.position', times, v));
    out.push(new THREE.AnimationClip(name, c.dur, tracks));
  }
  return out;
}

// A bm townsperson's file comes bare (bm painted them itself): skin: { map, normal } under assets/models/ dresses it.
const pictures = new Map();
const picture = (path, color) => {
  if (!pictures.has(path)) {
    const t = new THREE.TextureLoader().load('assets/models/' + path);
    t.flipY = false; if (color) t.colorSpace = THREE.SRGBColorSpace;
    pictures.set(path, t);
  }
  return pictures.get(path);
};
export function dress(gltf, skin) {
  const m = new THREE.MeshStandardMaterial({ map: picture(skin.map, true), normalMap: skin.normal ? picture(skin.normal) : null, roughness: 1, metalness: 0 });
  gltf.scene.traverse((o) => { if (o.isMesh) o.material = m; });
}

// One clip's rotations, decoded once per bank and shared by every body that plays it.
function rawClip(b, name) {
  if (b.raw.has(name)) return b.raw.get(name);
  const c = b.meta.clips[name];
  if (!c) return null;
  const fps = b.meta.fps, times = Float32Array.from({ length: c.frames }, (_, i) => i / fps), tracks = [];
  for (const [j, off, still] of c.tracks) {
    tracks.push(new THREE.QuaternionKeyframeTrack(b.meta.skeleton[j].name + '.quaternion', still ? [0] : times, quats(b.rot, off, still ? 1 : c.frames)));
  }
  const r = { c, times, tracks };
  b.raw.set(name, r);
  return r;
}

// The clips a body asks for (names: the bank's), fitted to that body. gltf: the body's loaded file.
export async function bankClips(bankName, gltf, names) {
  const b = await bank(bankName);
  if (b.meta.hipsByteOffset != null) return folkClips(b, gltf, names);
  const ex = gltf.scene.userData || {};
  const base = ex.pelvisBase || b.meta.pelvisRest, rest = ex.pelvisRest || b.meta.pelvisRest, s = ex.motionScale || 1;
  const out = [];
  for (const name of new Set(names)) {
    const r = rawClip(b, name);
    if (!r) { console.warn('clip bank', bankName, 'has no clip named', name); continue; }
    const p = b.pel.subarray(r.c.pelvis, r.c.pelvis + r.c.frames * 3), v = new Float32Array(r.c.frames * 3);
    for (let i = 0; i < r.c.frames; i++) {
      v[i * 3] = base[0]; v[i * 3 + 1] = base[1];                 // on the spot: only the height moves
      v[i * 3 + 2] = base[2] + (p[i * 3 + 2] - rest[2]) * s;
    }
    out.push(new THREE.AnimationClip(name, r.c.dur, [...r.tracks, new THREE.VectorKeyframeTrack('pelvis.position', r.times, v)]));
  }
  return out;
}
