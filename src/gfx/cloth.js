// Cloth that hangs from a figure: a gown's skirt, a robe, coat tails, a cape, a tabard. In the file each piece is a row
// of bone chains, Cloth_<piece>_<column>_<link> (tools/blender/rigfix.py makes them and skins the cloth to them), that no
// clip moves. After the clips have posed the body, this swings them: a point at every joint of every chain, falling
// under gravity, pulled back a little towards where the body would carry it (more near the waist, hardly at the hem),
// kept its length from the point above, kept near its neighbours across the row, pushed out of a capsule round each
// leg (and the back, for a cape) and off the floor. Then each bone is turned to point at the next point down.
//
// The manifest's "cloth" for a figure (all lengths in the file's metres; rigfix.py measures them):
//   { pieces: { <piece>: { ring: true if it closes round the body (a skirt), stiff: [at the waist, at the hem],
//                          damp, drag } },
//     capsules: [[boneA, boneB, radiusA, radiusB, from], ...],  floor: true, sink: 0.03 }   (from: where the capsule
//     starts, a fraction of the way from boneA to boneB; a thigh's starts below the pelvis. sink: how far below the
//     ground the floor the cloth stops at lies)
import * as THREE from 'three';

const STEP = 1 / 120, MAXSTEPS = 6, G = 9.8;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _s = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3();
const _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3();

// The closest point to p on the segment a-b, into out; returns its parameter (0 at a, 1 at b).
function nearest(p, a, b, out) {
  _n1.subVectors(b, a); const l2 = _n1.lengthSq();
  const t = l2 > 1e-12 ? Math.max(0, Math.min(1, _n2.subVectors(p, a).dot(_n1) / l2)) : 0;
  out.copy(a).addScaledVector(_n1, t); return t;
}

// The cloth of one loaded figure (obj: the glTF scene as cloned for it), or null when it has none.
export function makeCloth(obj, def) {
  if (!def || !def.pieces) return null;
  const bones = {};
  obj.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const pieces = [];
  for (const [name, opt] of Object.entries(def.pieces)) {
    const cols = new Map();
    for (const [n, b] of Object.entries(bones)) {
      const m = n.match(new RegExp('^Cloth_' + name + '_(\\d+)_(\\d+)$'));
      if (!m) continue;
      const c = +m[1], k = +m[2];
      if (!cols.has(c)) cols.set(c, []);
      cols.get(c)[k] = b;
    }
    const chains = [...cols.entries()].sort((x, y) => x[0] - y[0]).map(([, ch]) => ch.filter(Boolean)).filter((ch) => ch.length > 1);
    if (!chains.length) continue;
    const K = Math.min(...chains.map((c) => c.length));
    const stiff = opt.stiff || [0.35, 0.03];
    const chain = chains.map((ch) => {
      ch = ch.slice(0, K);
      return {
        bones: ch,
        rest: ch.map((b) => b.quaternion.clone()),          // each bone's turn on its parent at rest
        local: ch.map((b) => new THREE.Matrix4().compose(b.position, b.quaternion, b.scale)),   // its whole place on its parent at rest
        len: ch.map(() => 0),                                // filled at the first update, from the rest
        p: ch.map(() => new THREE.Vector3()), q: ch.map(() => new THREE.Vector3()), t: ch.map(() => new THREE.Vector3()),
        k: ch.map((b, k) => k ? stiff[0] + (stiff[1] - stiff[0]) * (k - 1) / Math.max(1, K - 2) : 1),
      };
    });
    // across the row: how far apart neighbouring points are at rest (filled at the first update)
    pieces.push({ name, ring: !!opt.ring, damp: opt.damp ?? 0.08, drag: opt.drag ?? 0.0, chain, K, across: null });
  }
  if (!pieces.length) return null;
  const caps = (def.capsules || []).map(([a, b, ra, rb, from]) => ({ a: bones[a] || findEnd(bones, a), b: bones[b] || findEnd(bones, b), ra, rb: rb ?? ra,
    from: from || 0, pa: new THREE.Vector3(), pb: new THREE.Vector3() })).filter((c) => c.a && c.b);
  let fresh = true, scale = 1, floorY = 0, last = new THREE.Vector3();

  // where the body would hold every point this frame (each chain hung rigidly from its parent bone, as at rest)
  function targets() {
    for (const pc of pieces) for (const ch of pc.chain) {
      const parent = ch.bones[0].parent;
      parent.updateWorldMatrix(true, false);
      _m.copy(parent.matrixWorld);
      for (let k = 0; k < pc.K; k++) { _m.multiply(ch.local[k]); ch.t[k].setFromMatrixPosition(_m); }
    }
  }
  function reset() {
    for (const pc of pieces) for (const ch of pc.chain) for (let k = 0; k < pc.K; k++) { ch.p[k].copy(ch.t[k]); ch.q[k].copy(ch.t[k]); }
  }
  function collide(p, r0) {
    for (const c of caps) {
      const t = nearest(p, c.pa, c.pb, _c), r = (c.ra + (c.rb - c.ra) * t) * scale + r0;
      _a.subVectors(p, _c); const d = _a.length();
      if (d < r) { if (d < 1e-6) _a.set(0, 0, 1); else _a.multiplyScalar(1 / d); p.copy(_c).addScaledVector(_a, r); }
    }
    // the floor a little below the ground: a hem that sweeps the ground dips into it unseen, where one pushed up off it
    // would kick out and flare at every step (the hips sit lower in a stride than standing)
    const fl = floorY - (def.sink ?? 0.03) * scale;
    if (def.floor !== false && p.y < fl) p.y = fl;
  }
  function solve(h) {
    const g = G * h * h;
    for (const pc of pieces) {
      for (const ch of pc.chain) {
        ch.p[0].copy(ch.t[0]); ch.q[0].copy(ch.t[0]);
        for (let k = 1; k < pc.K; k++) {
          const p = ch.p[k], q = ch.q[k];
          _a.subVectors(p, q).multiplyScalar(1 - pc.damp);
          q.copy(p); p.add(_a); p.y -= g;
          p.lerp(ch.t[k], ch.k[k]);                                  // back towards where the body holds it
        }
      }
      for (let it = 0; it < 2; it++) {
        // down each chain: every point its own length below the one above (the top one is the body's)
        for (const ch of pc.chain) for (let k = 1; k < pc.K; k++) {
          _a.subVectors(ch.p[k], ch.p[k - 1]); const d = _a.length() || 1e-6;
          ch.p[k].copy(ch.p[k - 1]).addScaledVector(_a, ch.len[k] * scale / d);
        }
        // across the row: neighbours neither drift apart nor bunch up
        const n = pc.chain.length, m = pc.ring ? n : n - 1;
        for (let i = 0; i < m; i++) {
          const A = pc.chain[i], B = pc.chain[(i + 1) % n], rest = pc.across[i];
          for (let k = 1; k < pc.K; k++) {
            _a.subVectors(B.p[k], A.p[k]); const d = _a.length() || 1e-6, r = rest[k] * scale;
            const want = d > 1.15 * r ? 1.15 * r : d < 0.6 * r ? 0.6 * r : d;
            if (want === d) continue;
            _a.multiplyScalar((d - want) / d * 0.5); A.p[k].add(_a); B.p[k].sub(_a);
          }
        }
        for (const ch of pc.chain) for (let k = 1; k < pc.K; k++) collide(ch.p[k], 0);
        // the cloth between two chains too: a leg must not slip through the gap between neighbouring points
        for (let i = 0; i < m; i++) {
          const A = pc.chain[i], B = pc.chain[(i + 1) % n];
          for (let k = 1; k < pc.K; k++) {
            _b.addVectors(A.p[k], B.p[k]).multiplyScalar(0.5); _d.copy(_b); collide(_d, 0);
            _d.sub(_b); if (_d.lengthSq() > 0) { A.p[k].add(_d); B.p[k].add(_d); }
          }
        }
      }
    }
  }
  // each bone turned so it points at the next point down, from the top of the chain
  function pose() {
    for (const pc of pieces) for (const ch of pc.chain) {
      ch.bones[0].parent.getWorldQuaternion(_q2);                    // the parent's turn in the world, as posed
      _b.copy(ch.t[0]);                                              // the top joint stays where the body holds it
      for (let k = 0; k < pc.K - 1; k++) {
        _q.copy(_q2).multiply(ch.rest[k]);                           // the bone hung rigidly from its (turned) parent
        _c.copy(ch.bones[k + 1].position).applyQuaternion(_q).normalize();   // where it would point so
        _d.subVectors(ch.p[k + 1], _b).normalize();                  // where it should
        _q3.setFromUnitVectors(_c, _d).multiply(_q);                 // its turn in the world
        ch.bones[k].quaternion.copy(_q2).invert().multiply(_q3);     // and on its parent
        _q2.copy(_q3);
        _b.addScaledVector(_d, ch.len[k + 1] * scale);               // where the next joint now is
      }
    }
  }

  return {
    update(dt) {
      if (!dt) return;
      for (const pc of pieces) for (const ch of pc.chain) for (let k = 0; k < pc.K; k++) ch.bones[k].quaternion.copy(ch.rest[k]);
      obj.updateWorldMatrix(true, false);
      scale = obj.getWorldScale(_s).x;
      floorY = obj.parent ? obj.parent.getWorldPosition(_a).y : 0;
      targets();
      for (const c of caps) { c.a.getWorldPosition(c.pa); c.b.getWorldPosition(c.pb); if (c.from) c.pa.lerp(c.pb, c.from); }
      if (!pieces[0].across) {                                       // lengths in the file's metres, from the rest
        for (const pc of pieces) {
          const n = pc.chain.length;
          for (const ch of pc.chain) for (let k = 1; k < pc.K; k++) ch.len[k] = ch.t[k].distanceTo(ch.t[k - 1]) / scale;
          pc.across = pc.chain.map((A, i) => A.t.map((v, k) => v.distanceTo(pc.chain[(i + 1) % n].t[k]) / scale));
        }
      }
      // a jump (a new tile, waking up) starts the cloth hanging still where the body holds it
      const root = pieces[0].chain[0].t[0];
      if (fresh || root.distanceTo(last) > 0.6 * scale || dt > 0.3) { reset(); fresh = false; }
      last.copy(root);
      const n = Math.min(MAXSTEPS, Math.max(1, Math.round(dt / STEP))), h = dt / n;
      for (let i = 0; i < n; i++) solve(h);
      pose();
    },
    reset() { fresh = true; },
  };
}

function findEnd(bones, end) {
  const n = Object.keys(bones).find((k) => k.endsWith(end));
  return n ? bones[n] : null;
}
