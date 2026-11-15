// What lies about on the ground: stones and pebbles in each land's own rock, grass in tufts, reeds at the Fen's pools,
// twigs, cones, ferns and toadstools under the pines, straw poking through the snow, ice shards, dry scrub in the
// Badlands, cinders and the odd coal still glowing in the Reach, ballast along the dead line, scree at the foot of
// every rise and pebbles at every bank. And a soft dark under each tree, stone and house, so nothing floats.
//
// All of it is decided by the tile as drawn (ground.js `vis`), from its own seed, so it lies in the same place every
// time. One instanced mesh per kind per 32-tile square of the map, so only the squares in view are drawn. Nothing
// here is solid and none of it is tall: a fight is fought straight over it. The plants lean in one wind (uTime).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { N, T, STEP } from './map.js';
import { FAM, faceOf, SUNK } from './ground.js';
import { rng32, vnoise } from '../core/util.js';

const CH = 32;
const DESERT = 'desert/Desert_Fantasy_Textures/';
// each land's loose stone (by REGIONS index), and the stone that falls off each kind of cliff face (ground.js SIDE)
const STONE = { granite: 'tex/granite_1_c.webp', snowrock: 'tex/snowrock_1_c.webp', redrock: DESERT + '09_red_canyon_rock.png', basalt: 'tex/basalt_1_c.webp' };
const LAND_STONE = ['granite', 'snowrock', 'redrock', 'granite', 'basalt'];
const FACE_STONE = { [T.ROCK]: 'granite', [T.SNOWROCK]: 'snowrock', [T.REDROCK]: 'redrock', [T.BASALT]: 'basalt' };

// The kind a tree is drawn as: its own, unless the ground it stands on (as drawn, borders ragged) says otherwise, so
// no green pine stands in the snow and no snow pine on grass.
export function treeKind(w, vis, t) {
  const fam = FAM[vis[w.I(t.x, t.z)]];
  if (fam === 'snow') return 'snowpine';
  if (t.kind === 'snowpine') return 'pine';
  if (fam === 'ash' && t.kind !== 'char') return 'char';
  if (t.kind === 'char' && fam !== 'ash' && fam !== 'rock') return 'dead';
  return t.kind;
}
// the green of a tuft on each kind of grass, and on the other grounds that grow any
const GREEN = { [T.GRASS1]: 0x6e9a34, [T.GRASS2]: 0x5f8a30, [T.GRASS3]: 0x4c6e2a, [T.OASIS]: 0x5c8e36, [T.MOSS]: 0x55663a,
  [T.DIRT]: 0x5d7a30, [T.ROAD]: 0x5d7a30, [T.FLAGS]: 0x56762e, [T.PINE]: 0x3a5226, [T.FEN]: 0x6c6c34, [T.GRAVE]: 0x4a5a2c };

// ---- the shapes ----
// A low rock: an icosahedron (an octahedron for a pebble) with its corners pushed about and squashed, sunk a little.
function rockGeo(seed, base = new THREE.IcosahedronGeometry(1, 0)) {
  const r = rng32(seed), g = base, p = g.attributes.position, jit = new Map();
  for (let k = 0; k < p.count; k++) {
    const key = `${p.getX(k).toFixed(3)},${p.getY(k).toFixed(3)},${p.getZ(k).toFixed(3)}`;
    if (!jit.has(key)) jit.set(key, 0.72 + r() * 0.5);
    const s = jit.get(key);
    p.setXYZ(k, p.getX(k) * s, p.getY(k) * s * 0.58, p.getZ(k) * s);
  }
  g.translate(0, 0.28, 0);
  g.computeVertexNormals();
  return g;
}
// A plant from its parts: each part's triangles as [x, y, z] corners, a colour per corner, and whether the part takes
// the instance's colour (`tint`); `bend` is how far each corner moves in the wind (its height over the plant's).
function plantGeo(parts) {
  const P = [], C = [], Tn = [], B = [], Nn = [];
  let top = 0;
  for (const part of parts) for (const v of part.tris) top = Math.max(top, v[1]);
  for (const part of parts) part.tris.forEach((v, k) => {
    P.push(...v); C.push(...part.cols[k]); Tn.push(part.tint); B.push(part.stiff ? 0 : Math.max(0, v[1]) / top);
    Nn.push(...(part.normals ? part.normals[k] : [0, 1, 0]));
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('tint', new THREE.Float32BufferAttribute(Tn, 1));
  g.setAttribute('bend', new THREE.Float32BufferAttribute(B, 1));
  g.computeBoundingSphere();
  return g;
}
// blades fanning out of a clump: n of them, h0..h1 tall, leaning out by `lean`, `wid` wide at the foot
function blades(seed, n, h0, h1, lean, wid, spread, base = 0.32, tip = 0.88) {
  const r = rng32(seed), tris = [], cols = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + r() * 0.8, rb = spread * (0.3 + r() * 0.7), h = h0 + r() * (h1 - h0), l = lean * (0.5 + r());
    const bx = Math.cos(a) * rb, bz = Math.sin(a) * rb, f = a + Math.PI / 2 + (r() - 0.5) * 1.2, wx = Math.cos(f) * wid / 2, wz = Math.sin(f) * wid / 2;
    tris.push([bx - wx, 0, bz - wz], [bx + wx, 0, bz + wz], [bx + Math.cos(a) * l, h, bz + Math.sin(a) * l]);
    const lo = base * (0.85 + r() * 0.3);
    cols.push([lo, lo, lo], [lo, lo, lo], [tip, tip, tip]);
  }
  return { tris, cols, tint: 1 };
}
// a mesh's triangles as parts for plantGeo, all one colour
function solid(geo, col, tint, stiff = true) {
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal, tris = [], cols = [], normals = [];
  for (let k = 0; k < p.count; k++) { tris.push([p.getX(k), p.getY(k), p.getZ(k)]); cols.push(col); normals.push([n.getX(k), n.getY(k), n.getZ(k)]); }
  return { tris, cols, normals, tint, stiff };
}

// The plants' surface: Lambert lit like the ground (their normals point up, front and back alike), the instance's
// colour only on the parts that take it, and a sway from one wind that gusts across the map.
function plantMaterial(shared) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute float tint;\nattribute float bend;')
      .replace('#include <color_vertex>', `vColor = vec3(1.0);
#ifdef USE_COLOR
vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
vColor *= mix(vec3(1.0), instanceColor.rgb, tint);
#endif`)
      .replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
mvPosition = instanceMatrix * mvPosition;
vec3 ip = instanceMatrix[3].xyz;
float ph = uTime * 1.7 + dot(ip.xz, vec2(0.41, 0.27));
float gust = 0.5 + 0.5 * sin(uTime * 0.37 + ip.x * 0.045 - ip.z * 0.06);
float sw = (sin(ph) * 0.7 + sin(ph * 2.31 + 1.3) * 0.3) * (0.35 + 0.65 * gust);
mvPosition.xz += vec2(0.8, -0.45) * sw * 0.2 * bend * length(instanceMatrix[1].xyz);
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>',
      'float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\nvec3 normal = normalize(vNormal);\nvec3 nonPerturbedNormal = normal;');
  };
  return m;
}
// coals: unlit, each breathing at its own pace
function emberMaterial(shared) {
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vPulse;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
vec3 ip = instanceMatrix[3].xyz;
vPulse = 0.55 + 0.3 * sin(uTime * (1.3 + fract(ip.x * 7.13) * 2.2) + ip.z * 5.1) + 0.15 * sin(uTime * 7.0 + ip.x * 3.0);
#else
vPulse = 1.0;
#endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vPulse;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vPulse * 1.5;');
  };
  return m;
}

export function buildScatter(r, vis, shared) {
  const w = r.world, rr = rng32(w.seed + 909);
  const plant = plantMaterial(shared);
  const rock = rockGeo(5), rock2 = rockGeo(11), peb = rockGeo(17, new THREE.OctahedronGeometry(1, 0));
  const K = {};
  for (const s in STONE) {
    const mat = new THREE.MeshLambertMaterial({ map: r.tex(STONE[s]), flatShading: true });
    K[s] = { geo: rock, mat }; K[s + '2'] = { geo: rock2, mat }; K[s + 'p'] = { geo: peb, mat };
  }
  K.tuft = { geo: plantGeo([blades(1, 8, 0.6, 1, 0.32, 0.26, 0.26)]), mat: plant };
  K.tuft2 = { geo: plantGeo([blades(2, 10, 0.45, 0.85, 0.42, 0.22, 0.32)]), mat: plant };
  K.reed = { geo: plantGeo([blades(3, 6, 0.75, 1, 0.12, 0.09, 0.14, 0.4)]), mat: plant };
  K.fern = { geo: plantGeo([blades(4, 8, 0.35, 0.5, 0.75, 0.3, 0.12, 0.45)]), mat: plant };
  {
    const stem = blades(5, 1, 0.75, 0.75, 0.05, 0.05, 0.01, 0.6);
    stem.tint = 0; stem.cols = [[0.2, 0.3, 0.12], [0.2, 0.3, 0.12], [0.34, 0.48, 0.2]];
    const head = solid(new THREE.OctahedronGeometry(0.11, 0).scale(1, 0.6, 1).translate(0.02, 0.76, 0.02), [1, 1, 1], 1, false);
    K.flower = { geo: plantGeo([stem, head]), mat: plant };
  }
  {
    const stem = solid(new THREE.CylinderGeometry(0.05, 0.07, 0.34, 6).translate(0, 0.17, 0), [0.84, 0.8, 0.7], 0);
    const cap = solid(new THREE.SphereGeometry(0.17, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.62, 1).translate(0, 0.31, 0), [1, 1, 1], 1);
    K.mushroom = { geo: plantGeo([stem, cap]), mat: plant };
  }
  K.twig = { geo: new THREE.BoxGeometry(1, 0.07, 0.07).translate(0, 0.02, 0), mat: new THREE.MeshLambertMaterial({ flatShading: true }) };
  K.shard = { geo: new THREE.ConeGeometry(0.2, 0.7, 5, 1).translate(0, 0.28, 0),
    mat: new THREE.MeshLambertMaterial({ color: 0xb4d8ee, emissive: 0x16303f, flatShading: true, transparent: true, opacity: 0.82 }) };
  K.ember = { geo: new THREE.IcosahedronGeometry(1, 0).scale(1, 0.55, 1), mat: emberMaterial(shared) };
  // a low bush: five faceted lumps of leaves that move with the grass, dark at the foot and lit on top
  {
    const lumps = [[0, 0.34, 0, 0.36], [0.28, 0.24, 0.1, 0.27], [-0.24, 0.22, -0.18, 0.28], [0.06, 0.2, -0.3, 0.24], [-0.14, 0.2, 0.26, 0.23]].map(([x, y, z, r], i) => {
      const g = new THREE.IcosahedronGeometry(r, 0); g.rotateY(i * 1.3).rotateX(i * 0.7).scale(1, 0.78, 1).translate(x, y, z);
      const sd = solid(g, [1, 1, 1], 1, false);
      sd.cols = sd.tris.map(([, ty]) => { const k = 0.42 + 0.7 * Math.min(Math.max(ty / 0.6, 0), 1); return [k, k, k * 0.92]; });
      return sd;
    });
    K.bush = { geo: plantGeo(lumps), mat: plant };
  }
  const bark = new THREE.MeshLambertMaterial({ map: r.tex('tex/bark_c.webp'), flatShading: true });
  K.log = { geo: new THREE.CylinderGeometry(0.09, 0.11, 1, 10).rotateZ(Math.PI / 2).translate(0, 0.08, 0), mat: new THREE.MeshLambertMaterial({ map: r.tex('tex/bark_c.webp') }) };
  K.stump = { geo: new THREE.CylinderGeometry(0.13, 0.18, 0.24, 8).translate(0, 0.1, 0), mat: bark };
  // bones: a long bone or two and a skull, bleached
  {
    const bone = new THREE.MeshLambertMaterial({ color: 0xd8d0bc, flatShading: true });
    const parts = [new THREE.CylinderGeometry(0.035, 0.035, 0.7, 5).rotateZ(Math.PI / 2).translate(0, 0.04, 0),
      new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5).rotateZ(Math.PI / 2).rotateY(0.9).translate(0.05, 0.035, 0.12),
      new THREE.IcosahedronGeometry(0.11, 1).scale(1, 0.85, 1.2).translate(-0.32, 0.09, -0.08)].map((g) => g.toNonIndexed());
    K.bones = { geo: mergeGeometries(parts), mat: bone };
  }
  // lily pads on the Fen's pools
  K.pad = { geo: new THREE.CircleGeometry(0.5, 10, 0.4, Math.PI * 2 - 0.8).rotateX(-Math.PI / 2), mat: new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }) };

  // ---- placing ----
  const bins = {};
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  const put = (kind, x, y, z, s, hex, o = {}) => {
    const key = kind + '|' + ((Math.floor(z / CH) * (N / CH)) + Math.floor(x / CH));
    const b = (bins[key] ||= { kind, m: [], c: [] });
    e.set((o.tilt || 0) * (rr() - 0.5), rr() * Math.PI * 2, (o.tilt || 0) * (rr() - 0.5));
    q.setFromEuler(e); v.set(x, y, z); sc.set(s * (o.sx || 1), s * (o.sy || 1), s * (o.sz || 1));
    m4.compose(v, q, sc);
    b.m.push(...m4.elements);
    col.setHex(hex).multiplyScalar(1 - (o.vary ?? 0.2) / 2 + rr() * (o.vary ?? 0.2));
    b.c.push(col.r, col.g, col.b);
  };
  const many = (n) => Math.floor(n + rr());
  const at = (x, z) => (w.inMap(x, z) ? w.I(x, z) : -1);
  const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  // plants grow in patches: thick in some places, bare in others
  const clumpAt = (x, z) => 0.25 + 1.6 * Math.max(0, vnoise(x * 0.19, z * 0.19, w.seed + 71) * 1.3 - 0.2);
  for (let z = 1; z < N - 1; z++) for (let x = 1; x < N - 1; x++) {
    const i = w.I(x, z), t = vis[i];
    if (w.block[i] === 1) continue;
    const fam = FAM[t], reg = w.region[i], y = w.h[i] * STEP, town = w.inTown(x, z), road = w.road[i], under = w.block[i] === 2;
    const any = (m = 0.46) => [x + (rr() - 0.5) * 2 * m, z + (rr() - 0.5) * 2 * m];
    // lily pads on the Fen's pools, out from the banks
    if (t === T.WATER) {
      if (reg === 3) for (let k = many(0.7); k-- > 0;) { const [px, pz] = any(0.4); put('pad', px, y - SUNK + 0.006, pz, 0.14 + rr() * 0.14, rr() < 0.5 ? 0x3a5a24 : 0x4e6a2a, { vary: 0.3 }); }
      continue;
    }
    const stone = LAND_STONE[reg], green = GREEN[t] ?? 0x5d7a30, clump = clumpAt(x, z);
    // out toward its rim (where nobody stands)
    const rim = () => { const a = rr() * Math.PI * 2, d = 0.28 + rr() * 0.18; return [x + Math.cos(a) * d, z + Math.sin(a) * d]; };
    // toward one edge (dx, dz), d0..d1 from the middle, spread along it
    const edge = (dx, dz, d0 = 0.3, d1 = 0.5) => { const d = d0 + rr() * (d1 - d0), s = (rr() - 0.5) * 0.9; return [x + dx * d + dz * s, z + dz * d + dx * s]; };
    const pebble = (n, kind = stone, hex = 0xffffff, where = any) => { for (let k = many(n); k-- > 0;) { const [px, pz] = where(); put(kind + 'p', px, y, pz, 0.035 + rr() * 0.045, hex, { tilt: 0.6, vary: 0.35 }); } };
    const stoneAt = (n, kind = stone, hex = 0xffffff, where = rim) => { for (let k = many(n); k-- > 0;) { const [px, pz] = where(); put(kind + (rr() < 0.5 ? '2' : ''), px, y, pz, 0.1 + rr() * 0.16, hex, { tilt: 0.3, vary: 0.25, sy: 0.8 + rr() * 0.5 }); } };
    const tuft = (n, hex, s = 1, where = any) => { for (let k = many(n * clump); k-- > 0;) { const [px, pz] = where(); put(rr() < 0.5 ? 'tuft' : 'tuft2', px, y, pz, (0.17 + rr() * 0.13) * s, hex, { vary: 0.3 }); } };
    const plants = (kind, n, hex, s0, s1, where = any) => { for (let k = many(n); k-- > 0;) { const [px, pz] = where(); put(kind, px, y, pz, s0 + rr() * (s1 - s0), hex, { vary: 0.25 }); } };
    const twigs = (n) => { for (let k = many(n); k-- > 0;) { const [px, pz] = any(); put('twig', px, y, pz, 0.2 + rr() * 0.22, 0x5a4230, { sy: 0.6, sz: 0.6, tilt: 0.15, vary: 0.4 }); } };
    const lone = (kind, p, hex, s0, s1, o = {}) => { if (rr() < p) { const [px, pz] = rim(); put(kind, px, y, pz, s0 + rr() * (s1 - s0), hex, { vary: 0.2, ...o }); } };
    let bank = [], foot = null, drops = [], nearTree = under, rimRoad = false;
    for (const [dx, dz] of D4) {
      const j = at(x + dx, z + dz);
      if (j < 0) continue;
      if (vis[j] === T.WATER && w.h[j] === w.h[i]) bank.push([dx, dz]);
      else if (w.h[j] > w.h[i]) foot = [dx, dz, j];
      else if (w.h[j] < w.h[i]) drops.push([dx, dz]);
      if (w.block[j] === 2) nearTree = true;
      if (road && FAM[vis[j]] !== fam) rimRoad = true;
    }

    switch (fam) {
      case 'grass': {
        const lush = t === T.GRASS3 || t === T.OASIS ? 1.25 : t === T.MOSS ? 0.6 : 1;
        tuft((town ? 0.9 : 2.2) * lush, reg === 3 ? 0x6a7034 : green);
        if ((t === T.GRASS1 || t === T.GRASS2) && rr() < (town ? 0.1 : 0.06) * clump) {
          const hue = [0xf0ece0, 0xf2cc50, 0x9a78c0, 0xe8e2ff, 0xc84a3a][Math.floor(rr() * rr() * 5)];
          plants('flower', 1 + rr() * 2, hue, 0.2, 0.28);
        }
        pebble(0.06);
        if (!town) {
          if (rr() < 0.015) stoneAt(1, stone, reg === 3 ? 0xb4c4a4 : 0xffffff);
          lone('bush', (nearTree ? 0.05 : 0.012) * clump, reg === 3 ? 0x56583a : t === T.OASIS ? 0x56682e : 0x4a5830, 0.35, 0.6);
          if (reg === 0) lone('stump', 0.004, 0xb0a090, 0.8, 1.2);
        }
        break;
      }
      case 'needles':
        twigs(0.35); pebble(0.2, 'granite', 0x7a5634);                 // cones, near enough
        plants('fern', 0.22 * clump, 0x46602e, 0.4, 0.6);
        plants('mushroom', nearTree ? 0.04 : 0.01, 0x8a5c3a, 0.22, 0.36);
        lone('log', 0.012, 0x9a8a78, 0.7, 1.2);
        lone('stump', 0.01, 0xb0a090, 0.8, 1.3);
        lone('bush', 0.03 * clump, 0x46522c, 0.32, 0.55);
        pebble(0.05); if (rr() < 0.025) stoneAt(1);
        break;
      case 'dirt':
        if (t === T.GRAVE) { pebble(0.45); tuft(0.3, green, 0.8); break; }
        pebble(road ? (rimRoad ? 0.8 : 0.12) : 0.35);
        if (!road) tuft(town ? 0.25 : 0.5, green, 0.9);
        else if (rimRoad && !town) tuft(0.35, green, 0.85, rim);
        if (!road && !town && rr() < 0.02) stoneAt(1);
        break;
      case 'paved':
        if (t === T.FLAGS) { tuft(0.05, green, 0.6); pebble(0.03); }
        else if (t === T.RUIN) { pebble(0.35); stoneAt(0.05); tuft(0.12, reg === 2 ? 0x9a8650 : reg === 1 ? 0xb8ac88 : reg === 4 ? 0x5a5048 : green, 0.8); }
        else pebble(0.08, 'granite');
        break;
      case 'snow':
        pebble(0.08, 'snowrock'); stoneAt(0.025, 'snowrock');
        if (t === T.SNOW) tuft(0.25, 0xb8a87c, 0.8);
        // ice shards stand in little clusters, leaning
        if (t === T.ICE && rr() < 0.05 * clump) { const [cx, cz] = rim(); for (let k = 2 + many(1.5); k-- > 0;) put('shard', cx + (rr() - 0.5) * 0.3, y, cz + (rr() - 0.5) * 0.3, 0.3 + rr() * 0.35, 0xffffff, { tilt: 0.7, vary: 0.15 }); }
        lone('bones', 0.003, 0xffffff, 0.6, 0.8);
        break;
      case 'sand':
        pebble(t === T.CLAY ? 0.25 : 0.12, 'redrock'); stoneAt(0.025, 'redrock');
        tuft(0.14, 0x9c8a52, 0.85);
        lone('bones', 0.008, 0xf0e6d0, 0.6, 0.9);
        lone('bush', 0.01 * clump, 0x7a6a4a, 0.28, 0.45);            // dry scrub
        break;
      case 'fen':
        tuft(1.1, 0x6c6c34);
        plants('reed', bank.length ? 0 : 0.2 * clump, 0x7a7a3a, 0.5, 0.75);
        plants('mushroom', 0.03, 0xc8b898, 0.2, 0.3);
        lone('bush', 0.02 * clump, 0x56583a, 0.32, 0.55);
        lone('log', 0.008, 0x6a6458, 0.7, 1.1);
        if (rr() < 0.015) stoneAt(1, 'granite', 0xa8b898);
        break;
      case 'ash':
        pebble(t === T.BASALT ? 0.4 : 0.3, 'basalt');
        // black rocks lie in heaps, not salted about
        if (rr() < (t === T.BASALT ? 0.12 : 0.05) * clump) stoneAt(2 + rr() * 2, 'basalt');
        lone('log', 0.012, 0x6a625a, 0.7, 1.2);
        lone('bones', 0.004, 0xb8b0a0, 0.6, 0.8);
        if (rr() < 0.008) plants('ember', 1 + rr() * 2, rr() < 0.5 ? 0xff5a14 : 0xff8a2a, 0.03, 0.05);
        tuft(0.05, 0x5a5048, 0.7);
        break;
      case 'rail':
        pebble(1.6, 'basalt', 0x9a7a66);
        break;
      case 'rock':
        stoneAt(0.22, FACE_STONE[t] || stone); pebble(0.4, FACE_STONE[t] || stone);
        break;
    }
    // a bank: pebbles short of the water (the shore is torn back into the tile), and reeds standing in its edge
    for (const [dx, dz] of bank) {
      pebble(0.45, stone, 0xffffff, () => edge(dx, dz, 0.05, 0.25));
      if (reg === 3 || t === T.OASIS || t === T.FEN) for (let k = many(reg === 3 ? 1.6 : 0.9); k-- > 0;) {
        const [px, pz] = edge(dx, dz, 0.35, 0.65);
        put('reed', px, y - SUNK, pz, 0.6 + rr() * 0.35, reg === 3 ? 0x7a7a3a : 0x6a8a3a, { vary: 0.25 });
      }
    }
    // the top of a drop: rocks along its edge break the line; the foot of a rise: scree off its face
    for (const [dx, dz] of drops) {
      const fs = FACE_STONE[faceOf(t, reg)] || 'granite';
      stoneAt(0.55, fs, 0xffffff, () => edge(dx, dz, 0.4, 0.52));
      pebble(0.9, fs, 0xffffff, () => edge(dx, dz, 0.36, 0.5));
    }
    if (foot) {
      const fs = FACE_STONE[faceOf(vis[foot[2]], w.region[foot[2]])] || 'granite';
      pebble(1.6, fs, 0xffffff, () => edge(foot[0], foot[1], 0.3, 0.5));
      stoneAt(0.5, fs, 0xffffff, () => edge(foot[0], foot[1], 0.3, 0.5));
    }
    // under a tree in the pines and the Hollow: twigs and the odd toadstool
    if (under && reg === 0) { twigs(0.3); plants('mushroom', 0.035, 0x9a6a44, 0.22, 0.34); }
  }

  // round each tree's foot, what its land would leave there: grass round a palm, moss and toadstools at a dead tree,
  // dark grass under an oak
  for (const t of w.trees) {
    const c = (t.size - 1) / 2, cx = t.x + c, cz = t.z + c, y = w.y(t.x, t.z), kind = treeKind(w, vis, t);
    const R = 0.14 + 0.06 * t.size;
    const ring = (n, f) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rr() * 0.9, d = R * (0.7 + rr() * 0.6); f(cx + Math.cos(a) * d, cz + Math.sin(a) * d); } };
    if (kind === 'palm') ring(4, (px, pz) => put(rr() < 0.5 ? 'tuft' : 'tuft2', px, y, pz, 0.24 + rr() * 0.1, 0x6a8a36, { vary: 0.25 }));
    else if (kind === 'dead') ring(3, (px, pz) => put(rr() < 0.7 ? 'tuft' : 'mushroom', px, y, pz, 0.2 + rr() * 0.08, w.region[w.I(t.x, t.z)] === 2 ? 0x8a7a4a : 0x5a6232, { vary: 0.25 }));
    else if (kind === 'oak') ring(3, (px, pz) => put('tuft2', px, y, pz, 0.22 + rr() * 0.08, 0x3e5226, { vary: 0.25 }));
  }

  for (const key in bins) {
    const b = bins[key], k = K[b.kind], n = b.c.length / 3;
    const im = new THREE.InstancedMesh(k.geo, k.mat, n);
    im.instanceMatrix.array.set(b.m);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(b.c), 3);
    im.computeBoundingSphere();
    im.matrixAutoUpdate = false;
    r.scene.add(im);
  }
}

// ---- a soft dark under the trees, the standing stones, the ruins' walls and the houses, a little away from the sun.
// On snow it is lighter and blue, as shade on snow is. ----
export function buildShadows(r) {
  const w = r.world, vis = r.ground.vis, list = [];
  const SIZE_R = [0, 0.62, 1.25, 1.95];
  const snowy = (x, z) => FAM[vis[w.I(Math.round(x), Math.round(z))]] === 'snow';
  for (const t of w.trees) {
    const c = (t.size - 1) / 2, kind = treeKind(w, vis, t), snow = snowy(t.x, t.z);
    const R = SIZE_R[t.size] * (kind === 'dead' || kind === 'char' ? 0.55 : kind === 'palm' ? 0.75 : 1.1);
    list.push([t.x + c - 0.1 * R, w.y(t.x, t.z), t.z + c - 0.04 * R, (snow ? 1.4 : 1.7) * R, (snow ? 1.4 : 1.7) * R, snow ? 0.11 : 0.4, snow]);
  }
  for (const p of w.props) list.push([p.x - 0.08, w.y(p.x, p.z), p.z - 0.04, p.kind === 'wall' ? 1.5 : 1.15, p.kind === 'wall' ? 1.5 : 1.15, 0.4, snowy(p.x, p.z)]);
  for (const b of w.buildings) list.push([b.x + (b.w - 1) / 2 - 0.15, 0, b.z + (b.d - 1) / 2 - 0.1, b.w + 1.2, b.d + 1.2, 0.4, false]);
  for (const c of w.chests) list.push([c.x, w.y(c.x, c.z), c.z, 0.9, 0.9, 0.38, snowy(c.x, c.z)]);
  for (const d of w.decor || []) list.push([d.x, w.y(Math.round(d.x), Math.round(d.z)), d.z, d.kind === 'market_stall' ? 2.4 : 1.2, d.kind === 'market_stall' ? 1.8 : 1.2, 0.3, false]);
  list.push([w.well.x, 0, w.well.z, 1.5, 1.5, 0.4, false]);

  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.3, 'rgba(0,0,0,0.72)'); gr.addColorStop(0.65, 'rgba(0,0,0,0.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(cv);
  const mat = new THREE.MeshBasicMaterial({ map, color: 0x000000, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -6 });
  mat.onBeforeCompile = (sh) => {
    // each blob's own strength rides in its instance colour's red, and blue if it lies on snow
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
#ifdef USE_INSTANCING_COLOR
diffuseColor.a *= vColor.r;
diffuseColor.rgb = mix(vec3(0.0), vec3(0.03, 0.04, 0.12), vColor.b);
#endif`);
  };
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat, list.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const set = (k, a, s) => { const [px, py, pz, sx, sz, , snow] = list[k]; m4.makeScale(sx * s, 1, sz * s).setPosition(px, py + 0.01, pz); im.setMatrixAt(k, m4); im.setColorAt(k, col.setRGB(a, 0, snow ? 1 : 0)); };
  list.forEach((e, k) => set(k, e[5], 1));
  im.frustumCulled = false; im.renderOrder = -20;
  r.scene.add(im);
  // a tree's dark (by its index in w.trees) at a share of its strength and size: a fight's stump keeps a small one
  return (k, f, s = 1) => { set(k, list[k][5] * f, s); im.instanceColor.needsUpdate = true; im.instanceMatrix.needsUpdate = true; };
}
