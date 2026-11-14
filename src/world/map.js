// The world: one square grid of tiles. Herrington Hollow in the middle, pines and oaks all round,
// three roads out to nowhere. Everything here is plain data; render.js draws it.
//
// Compass: -z is north (up-right on screen), +x east (down-right), +z south (down-left), -x west.
import { rng32, vnoise } from '../core/util.js';
import { ZOMBIES, KIND, WOODS, CRYPT_PACK } from '../data/enemies.js';

export const N = 128;
// CRYPT is the old crypt's flagstones, DAIS the raised floor in its middle, GRAVE the turned earth round it.
export const T = { GRASS1: 0, GRASS2: 1, GRASS3: 2, PINE: 3, DIRT: 4, ROAD: 5, FLAGS: 6, MOSS: 7, ROCK: 8, CRYPT: 9, DAIS: 10, GRAVE: 11 };
export const TOWN = { x0: 40, x1: 88, z0: 52, z1: 77, cx: 64, cz: 64 };

// Height is in half-steps: world y = h * 0.5. Walking takes one half-step up or down; a jump takes two up.
export const STEP = 0.5;

// Buildings sit in two rows with their doors on the south face, where the camera can see them.
// `id` ties a building to the merchant or folk who stand at its door (see data/cast.js).
const SLOTS_X = [42, 48, 54, 70, 76, 82];
const BUILDINGS = [
  // row A, north of the main street
  { id: 'weapons', name: 'Ironhand Arms', slot: 0, row: 0, wall: 'wall_12', roof: 'roof_2', door: 'door_2' },
  { id: 'forge', name: 'The Proud Anvil', slot: 1, row: 0, wall: 'wall_16', roof: 'roof_3', door: 'door_4' },
  { id: 'armor', name: 'Thicker Than Hope', slot: 2, row: 0, wall: 'wall_09', roof: 'roof_1', door: 'door_1' },
  { id: 'spells', name: "Vey's Scrolls", slot: 3, row: 0, wall: 'wall_14', roof: 'roof_4', door: 'door_3' },
  { id: 'gems', name: 'The Lapidary', slot: 4, row: 0, wall: 'wall_08', roof: 'roof_2', door: 'door_5' },
  { id: 'rings', name: "Fortunato's Wheel", slot: 5, row: 0, wall: 'wall_18', roof: 'roof_1', door: 'door_2' },
  // row B, south of the main street, fronting the back lane
  { id: 'bags', name: 'Reed Saddlery', slot: 0, row: 1, wall: 'wall_10', roof: 'roof_3', door: 'door_1' },
  { id: 'inn', name: 'The Last Toll', slot: 1, row: 1, wall: 'wall_20', roof: 'roof_4', door: 'door_4', wide: 2 },
  { id: 'enchant', name: 'The Veiled Kiln', slot: 3, row: 1, wall: 'wall_13', roof: 'roof_2', door: 'door_3' },
  { id: 'socket', name: "The Curator's Bench", slot: 4, row: 1, wall: 'wall_17', roof: 'roof_1', door: 'door_5' },
  { id: 'cottage', name: 'Moss Cottage', slot: 5, row: 1, wall: 'wall_11', roof: 'roof_3', door: 'door_2' },
];

export function buildWorld(seed = 4013) {
  const r = rng32(seed);
  const type = new Uint8Array(N * N);
  const h = new Int8Array(N * N);
  const block = new Uint8Array(N * N); // 1 = something solid stands here
  const road = new Uint8Array(N * N);
  const I = (x, z) => z * N + x;
  const inMap = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  const inTown = (x, z, m = 0) => x >= TOWN.x0 - m && x <= TOWN.x1 + m && z >= TOWN.z0 - m && z <= TOWN.z1 + m;

  // --- ground ---
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const n = vnoise(x * 0.07, z * 0.07, seed);
    const m = vnoise(x * 0.11 + 40, z * 0.11, seed + 3);
    let t = n > 0.6 ? T.PINE : n > 0.47 ? T.GRASS3 : n > 0.3 ? T.GRASS2 : T.GRASS1;
    if (m > 0.8) t = T.MOSS;
    type[I(x, z)] = t;
  }

  // --- roads ---
  const paint = (x, z) => {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const X = x + dx, Z = z + dz;
      if (!inMap(X, Z)) continue;
      const far = Math.max(Math.abs(dx), Math.abs(dz));
      if (far <= 1) { type[I(X, Z)] = T.ROAD; road[I(X, Z)] = 1; }
      else if (type[I(X, Z)] !== T.ROAD && r() < 0.6) type[I(X, Z)] = T.DIRT;
    }
  };
  const roadN = (z) => { const t = TOWN.z0 - z; return TOWN.cx + Math.round(Math.sin(t * 0.13) * 4 * Math.min(1, t / 12)); };
  const roadS = (z) => { const t = z - TOWN.z1; return TOWN.cx + Math.round(Math.sin(t * 0.11 + 1) * 5 * Math.min(1, t / 12)); };
  const roadE = (x) => { const t = x - TOWN.x1; return TOWN.cz + Math.round(Math.sin(t * 0.12 + 2) * 4 * Math.min(1, t / 12)); };
  for (let z = TOWN.z0; z >= 0; z--) paint(roadN(z), z);
  for (let z = TOWN.z1; z < N; z++) paint(roadS(z), z);
  for (let x = TOWN.x1; x < N; x++) paint(x, roadE(x));

  // --- the town ---
  for (let z = TOWN.z0; z <= TOWN.z1; z++) for (let x = TOWN.x0; x <= TOWN.x1; x++) {
    let t = vnoise(x * 0.3, z * 0.3, seed + 5) > 0.55 ? T.GRASS2 : T.GRASS1;
    if (z >= 62 && z <= 66) t = (z === 62 || z === 66) ? T.DIRT : T.ROAD;           // main street
    if (x >= 63 && x <= 65) t = T.ROAD;                                           // north-south street
    if (z >= 73 && z <= 74) t = T.DIRT;                                           // back lane
    if (x >= 60 && x <= 68 && z >= 60 && z <= 68) t = T.FLAGS;                    // the square
    type[I(x, z)] = t;
    if (t === T.ROAD || t === T.FLAGS || t === T.DIRT) road[I(x, z)] = 1;
  }
  const buildings = BUILDINGS.map((b) => {
    const w = b.wide ? 11 : 5, d = 5;
    const x = SLOTS_X[b.slot], z = b.row === 0 ? 57 : 68;
    for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) { block[I(x + dx, z + dz)] = 1; type[I(x + dx, z + dz)] = T.DIRT; }
    const doorX = x + Math.floor(w / 2);
    return { ...b, x, z, w, d, doorX, front: { x: doorX, z: z + d } };
  });
  // the well in the square, the bounty board beside it
  const well = { x: 64, z: 64 };
  const board = { x: 67, z: 61 };
  block[I(well.x, well.z)] = 1;
  block[I(board.x, board.z)] = 1;

  // --- knolls: rocky rises you have to jump to climb ---
  const knolls = [];
  for (let tries = 0; tries < 400 && knolls.length < 12; tries++) {
    const cx = 10 + Math.floor(r() * (N - 20)), cz = 10 + Math.floor(r() * (N - 20)), rad = 3 + Math.floor(r() * 3);
    if (inTown(cx, cz, rad + 12)) continue;
    let bad = false;
    for (let dz = -rad - 2; dz <= rad + 2 && !bad; dz++) for (let dx = -rad - 2; dx <= rad + 2; dx++) if (road[I(cx + dx, cz + dz)]) { bad = true; break; }
    if (bad || knolls.some((k) => Math.hypot(k.x - cx, k.z - cz) < 16)) continue;
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      const dd = Math.hypot(dx, dz) + (vnoise((cx + dx) * 0.6, (cz + dz) * 0.6, seed + 7) - 0.5) * 1.6;
      if (dd > rad) continue;
      const i = I(cx + dx, cz + dz);
      h[i] = dd < rad - 3.2 ? 5 : dd < rad - 1.6 ? 4 : 2;
      type[i] = h[i] >= 4 ? T.ROCK : T.MOSS;
    }
    knolls.push({ x: cx, z: cz, rad });
  }

  // --- where the story starts: on the south road, just outside the Hollow ---
  const start = { x: roadS(86), z: 86 };
  const lisandraSpot = { x: roadS(83) + 2, z: 83 };

  // --- trees ---
  const trees = [];
  const nearRoad = (x, z) => {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inMap(x + dx, z + dz) && road[I(x + dx, z + dz)]) return true;
    return false;
  };
  const canTree = (x, z, s) => {
    for (let dz = 0; dz < s; dz++) for (let dx = 0; dx < s; dx++) {
      const X = x + dx, Z = z + dz;
      if (!inMap(X, Z) || X < 1 || Z < 1 || X > N - 2 || Z > N - 2) return false;
      const i = I(X, Z);
      if (block[i] || h[i] !== 0 || nearRoad(X, Z) || inTown(X, Z)) return false;
      if (Math.abs(X - start.x) + Math.abs(Z - start.z) < 4) return false;
      if (X === lisandraSpot.x && Z === lisandraSpot.z) return false;
    }
    return true;
  };
  const addTree = (x, z, s) => {
    const pine = type[I(x, z)] === T.PINE || vnoise(x * 0.04, z * 0.04, seed + 11) > 0.52;
    const id = trees.length;
    trees.push({ id, x, z, size: s, kind: pine ? 'pine' : 'oak', v: Math.floor(r() * 4), rot: r() * 6.28, tall: 0.85 + r() * 0.35 });
    for (let dz = 0; dz < s; dz++) for (let dx = 0; dx < s; dx++) block[I(x + dx, z + dz)] = 2;
  };
  const want = (x, z) => (inTown(x, z, 5) ? 0.95 : 0.16 + 0.5 * vnoise(x * 0.05, z * 0.05, seed + 9));
  for (const [s, tries] of [[3, 1500], [2, 5200], [1, 9000]]) {
    for (let k = 0; k < tries; k++) {
      const x = Math.floor(r() * N), z = Math.floor(r() * N);
      if (r() > want(x, z) || !canTree(x, z, s)) continue;
      addTree(x, z, s);
    }
  }
  // close the ring round the town so the only ways in are the three roads
  for (let z = TOWN.z0 - 4; z <= TOWN.z1 + 4; z++) for (let x = TOWN.x0 - 4; x <= TOWN.x1 + 4; x++) {
    if (inTown(x, z) || !inMap(x, z)) continue;
    if (canTree(x, z, 1) && r() < 0.8) addTree(x, z, 1);
  }
  // a few big oaks inside the Hollow
  for (const [x, z] of [[44, 54], [58, 53], [72, 53], [85, 54], [50, 75], [78, 76]]) {
    let ok = true;
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) if (block[I(x + dx, z + dz)] || road[I(x + dx, z + dz)]) ok = false;
    if (!ok) continue;
    trees.push({ id: trees.length, x, z, size: 2, kind: 'oak', v: Math.floor(r() * 4), rot: r() * 6.28, tall: 1 });
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) block[I(x + dx, z + dz)] = 2;
  }

  // --- the old crypt, out where the pines are oldest ---
  // A roofless walled yard, 13 tiles across inside, its gate in the south wall where the camera looks in. The wall
  // ring is at 7 tiles from the middle; a ring at 8 is pines (north, west) or fallen stone (south, east), so the only
  // way in is the gate. The pack stands on a raised dais (2 either way of the middle) and cannot wander off it, so
  // nothing in there sees through a wall: the nearest open ground outside is 7 tiles from the dais, past any sight.
  const CW = 7;
  function buildCrypt() {
    // where: the spot far from the Hollow with the most pine floor round it, flat, off the roads
    let best = null, most = -1;
    for (let cz = 12; cz <= N - 13; cz++) for (let cx = 12; cx <= N - 13; cx++) {
      if (Math.hypot(cx - TOWN.cx, cz - TOWN.cz) < 48 || Math.hypot(cx - start.x, cz - start.z) < 30) continue;
      let pine = 0, ok = true;
      for (let dz = -11; dz <= 11 && ok; dz++) for (let dx = -11; dx <= 11; dx++) {
        const i = I(cx + dx, cz + dz);
        if (h[i] || road[i] || block[i] === 1) { ok = false; break; }
        if (type[i] === T.PINE) pine++;
      }
      if (ok && pine > most) { most = pine; best = { x: cx, z: cz }; }
    }
    const { x: cx, z: cz } = best, cr = rng32(seed + 77);
    // the clearing: every tree that touches it is felled
    for (const t of trees) if (t.x + t.size - 1 >= cx - 10 && t.x <= cx + 10 && t.z + t.size - 1 >= cz - 10 && t.z <= cz + 10) {
      t.felled = true;
      for (let dz = 0; dz < t.size; dz++) for (let dx = 0; dx < t.size; dx++) block[I(t.x + dx, t.z + dz)] = 0;
    }
    const c = { x: cx, z: cz, r: CW, walls: [], posts: [], rubble: [], sarcophagi: [], bones: [], spots: [] };
    const gate = (dx, dz) => (dz === CW || dz === CW + 1) && Math.abs(dx) <= 1;
    const pine = (x, z) => {
      trees.push({ id: trees.length, x, z, size: 1, kind: 'pine', v: Math.floor(cr() * 4), rot: cr() * 6.28, tall: 0.9 + cr() * 0.4 });
      block[I(x, z)] = 2;
    };
    for (let dz = -10; dz <= 10; dz++) for (let dx = -10; dx <= 10; dx++) {
      const x = cx + dx, z = cz + dz, i = I(x, z), ring = Math.max(Math.abs(dx), Math.abs(dz));
      block[i] = 0;
      if (ring <= CW) type[i] = ring <= 2 ? T.DAIS : T.CRYPT;
      else type[i] = ring === CW + 1 || vnoise(x * 0.4, z * 0.4, seed + 13) > 0.62 ? T.GRAVE : T.PINE;
      if (ring <= 2) h[i] = 1;
      if (gate(dx, dz)) continue;
      if (ring === CW) { block[i] = 1; (dz === CW && Math.abs(dx) === 2 ? c.posts : c.walls).push({ x, z, dx, dz }); }
      else if (ring === CW + 1) {
        if (dx < -CW || dz < -CW) pine(x, z);
        else { block[i] = 1; c.rubble.push({ x, z }); }
      } else if (ring > CW + 1 && (dx < -CW || dz < -CW) && cr() < 0.5) pine(x, z);
    }
    // the needles and turned earth run out raggedly into the woods round the clearing, not in a square
    for (let dz = -14; dz <= 14; dz++) for (let dx = -14; dx <= 14; dx++) {
      const x = cx + dx, z = cz + dz, ring = Math.max(Math.abs(dx), Math.abs(dz));
      if (ring <= 10 || !inMap(x, z) || h[I(x, z)] || road[I(x, z)]) continue;
      if (ring + (vnoise(x * 0.35, z * 0.35, seed + 17) - 0.5) * 6 < 12.5) type[I(x, z)] = vnoise(x * 0.4, z * 0.4, seed + 13) > 0.62 ? T.GRAVE : T.PINE;
    }
    // inside: four sarcophagi along the side walls, bones stacked against the back, the chest between them
    for (const [dx, dz] of [[-5, -4], [-5, 2], [5, -4], [5, 2]]) {
      c.sarcophagi.push({ x: cx + dx, z: cz + dz, len: 2 });
      block[I(cx + dx, cz + dz)] = block[I(cx + dx, cz + dz + 1)] = 1;
    }
    for (const dx of [-6, -3, 3, 6]) { c.bones.push({ x: cx + dx, z: cz - 6 }); block[I(cx + dx, cz - 6)] = 1; }
    c.chest = { id: 'crypt', x: cx, z: cz - 6, crypt: true };
    block[I(cx, cz - 6)] = 1;
    for (const [dx, dz] of [[0, -1], [-2, -2], [2, -2], [-1, 1], [1, 1], [0, 2]]) c.spots.push({ x: cx + dx, z: cz + dz });
    c.gate = { x: cx, z: cz + CW };
    return c;
  }
  // If the clearing can't be walked to, an old path is cut to it: the cheapest way from the gate to ground the start
  // can reach, open ground costing a step and a tree six (it is felled, and the path is dirt).
  function cryptPath(reach) {
    const from = I(crypt.x, crypt.z + CW + 2);
    if (reach[from]) return false;
    const treeAt = new Map();
    for (const t of trees) if (!t.felled) for (let dz = 0; dz < t.size; dz++) for (let dx = 0; dx < t.size; dx++) treeAt.set(I(t.x + dx, t.z + dz), t);
    const cost = new Float64Array(N * N).fill(Infinity), prev = new Int32Array(N * N).fill(-1), heap = [];
    const push = (e) => { heap.push(e); for (let k = heap.length - 1; k > 0;) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let k = 0; ;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; }
      }
      return top;
    };
    cost[from] = 0; push([0, from]);
    let end = -1;
    while (heap.length) {
      const [d, i] = pop();
      if (d > cost[i]) continue;
      if (reach[i]) { end = i; break; }
      const x = i % N, z = (i / N) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Z = z + dz, j = I(X, Z);
        if (!inMap(X, Z) || X < 1 || Z < 1 || X > N - 2 || Z > N - 2) continue;
        if (Math.max(Math.abs(X - crypt.x), Math.abs(Z - crypt.z)) <= CW + 1 || block[j] === 1 || Math.abs(h[j] - h[i]) > 1) continue;
        const nd = d + (block[j] === 2 ? 6 : 1);
        if (nd < cost[j]) { cost[j] = nd; prev[j] = i; push([nd, j]); }
      }
    }
    if (end < 0) return false;
    for (let i = prev[end]; i >= 0; i = prev[i]) {
      const t = treeAt.get(i);
      if (t && !t.felled) { t.felled = true; for (let dz = 0; dz < t.size; dz++) for (let dx = 0; dx < t.size; dx++) block[I(t.x + dx, t.z + dz)] = 0; }
      if (!road[i]) type[i] = T.DIRT;
    }
    return true;
  }
  const crypt = buildCrypt();

  // --- what you can reach on foot from the start ---
  const flood = () => {
    const reach = new Uint8Array(N * N);
    const q = [I(start.x, start.z)];
    reach[q[0]] = 1;
    while (q.length) {
      const i = q.pop(), x = i % N, z = (i / N) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Z = z + dz;
        if (!inMap(X, Z)) continue;
        const j = I(X, Z);
        if (reach[j] || block[j] || h[j] - h[i] > 2) continue;
        reach[j] = 1; q.push(j);
      }
    }
    return reach;
  };
  let reach = flood();
  if (cryptPath(reach)) reach = flood();
  // the trees felled for the crypt and its path go; the rest keep their places
  for (let k = trees.length - 1; k >= 0; k--) if (trees[k].felled) trees.splice(k, 1);
  trees.forEach((t, k) => { t.id = k; });

  // --- chests on the knoll tops ---
  const chests = [];
  for (const k of knolls) {
    if (!reach[I(k.x, k.z)] || h[I(k.x, k.z)] < 4) continue;
    chests.push({ id: 'chest' + chests.length, x: k.x, z: k.z });
    block[I(k.x, k.z)] = 1;
  }
  // and one in the crypt, against its back wall
  chests.push(crypt.chest);

  // --- the dead in the woods: packs of two to four (goblins more), harder the farther out ---
  // Each tier has its list of kinds (WOODS in data/enemies.js). A pack takes the next kind on its tier's list for its
  // own, so every kind comes up, and now and then one of its neighbours from the same list.
  const tierKinds = WOODS.map((ids) => ids.map((id) => KIND[id]));
  const turn = tierKinds.map((l) => Math.floor(r() * l.length));
  const packs = [];
  for (let tries = 0; tries < 6000 && packs.length < 22; tries++) {
    const x = 4 + Math.floor(r() * (N - 8)), z = 4 + Math.floor(r() * (N - 8));
    const i = I(x, z);
    if (!reach[i] || block[i] || h[i] !== 0 || inTown(x, z, 9) || road[i]) continue;
    if (Math.hypot(x - start.x, z - start.z) < 9) continue;
    if (packs.some((p) => Math.hypot(p.x - x, p.z - z) < 13)) continue;
    if (Math.max(Math.abs(x - crypt.x), Math.abs(z - crypt.z)) < 19) continue;   // the crypt keeps its own
    const dist = Math.hypot(x - TOWN.cx, z - TOWN.cz);
    const tier = Math.max(0, Math.min(4, Math.floor((dist - 22) / 9)));
    const list = tierKinds[tier], main = list[turn[tier]++ % list.length];
    const count = 2 + Math.floor(r() * 3) + (ZOMBIES[main].swarm ? 2 : 0);
    const members = [];
    for (let k = 0, t2 = 0; k < count && t2 < 60; t2++) {
      const X = x + Math.floor(r() * 5) - 2, Z = z + Math.floor(r() * 5) - 2;
      if (!inMap(X, Z)) continue;
      const j = I(X, Z);
      if (!reach[j] || block[j] || members.some((m) => m.x === X && m.z === Z)) continue;
      const kind = r() < 0.3 ? list[Math.floor(r() * list.length)] : main;
      members.push({ x: X, z: Z, kind, level: 1 + tier * 2 + Math.floor(r() * 2) });
      k++;
    }
    if (members.length) packs.push({ x, z, tier, members });
  }
  // goblins camped in the woods outside the crypt, waiting for whatever is on the dais to wander off
  {
    const gr = rng32(seed + 91), spots = [];
    for (let dz = -17; dz <= 17; dz++) for (let dx = -17; dx <= 17; dx++) {
      const x = crypt.x + dx, z = crypt.z + dz, ring = Math.max(Math.abs(dx), Math.abs(dz));
      if (ring < 12 || !inMap(x, z) || x < 3 || z < 3 || x > N - 4 || z > N - 4) continue;
      const i = I(x, z);
      if (reach[i] && !block[i] && !h[i] && !road[i] && !packs.some((p) => Math.hypot(p.x - x, p.z - z) < 11)) spots.push({ x, z, k: gr() });
    }
    spots.sort((a, b) => a.k - b.k);
    const at = spots[0];
    if (at) {
      const tier = Math.max(0, Math.min(4, Math.floor((Math.hypot(at.x - TOWN.cx, at.z - TOWN.cz) - 22) / 9))), members = [];
      for (let t2 = 0; members.length < 4 + Math.floor(gr() * 2) && t2 < 60; t2++) {
        const X = at.x + Math.floor(gr() * 5) - 2, Z = at.z + Math.floor(gr() * 5) - 2, j = I(X, Z);
        if (inMap(X, Z) && reach[j] && !block[j] && !members.some((m) => m.x === X && m.z === Z)) members.push({ x: X, z: Z, kind: KIND.goblin, level: 1 + tier * 2 + Math.floor(gr() * 2) });
      }
      if (members.length) packs.push({ x: at.x, z: at.z, tier, members });
    }
  }
  // A kind the draw left out takes one place in a pack whose tier lists it, from a kind there is more than one of.
  const count = new Map();
  for (const p of packs) for (const m of p.members) count.set(m.kind, (count.get(m.kind) || 0) + 1);
  ZOMBIES.forEach((zd, k) => {
    if (zd.boss || count.get(k)) return;
    for (const p of [...packs].sort((a, b) => b.members.length - a.members.length)) {
      if (!tierKinds[p.tier].includes(k)) continue;
      const m = p.members.find((o) => count.get(o.kind) > 1);
      if (!m) continue;
      count.set(m.kind, count.get(m.kind) - 1); m.kind = k; count.set(k, 1);
      return;
    }
  });
  // one easy pack close to the road, so the first fight is a short walk
  {
    let best = null;
    for (let tries = 0; tries < 400; tries++) {
      const x = start.x + Math.floor(r() * 21) - 10, z = start.z + 6 + Math.floor(r() * 8);
      if (!inMap(x, z)) continue;
      const i = I(x, z);
      if (!reach[i] || block[i] || road[i] || h[i] !== 0) continue;
      if (packs.some((p) => Math.hypot(p.x - x, p.z - z) < 8)) continue;
      best = { x, z }; break;
    }
    if (best) {
      const members = [];
      for (const [dx, dz] of [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0]]) {
        const j = I(best.x + dx, best.z + dz);
        if (members.length < 2 && reach[j] && !block[j]) members.push({ x: best.x + dx, z: best.z + dz, kind: 0, level: 1 });
      }
      packs.push({ x: best.x, z: best.z, tier: 0, members });
    }
  }
  // the crypt's keeper and its company, on the dais (last, so the woods' packs keep their numbers)
  packs.push({ x: crypt.x, z: crypt.z, tier: 4, crypt: true, members: CRYPT_PACK.map(([id, level], k) => ({ ...crypt.spots[k], kind: KIND[id], level })) });

  return {
    N, seed, type, h, block, road, reach, trees, buildings, well, board, knolls, chests, packs, start, lisandraSpot, crypt,
    I, inMap, inTown,
    walkable(x, z) { return inMap(x, z) && !block[I(x, z)]; },
    height(x, z) { return inMap(x, z) ? h[I(x, z)] : 0; },
    y(x, z) { return (inMap(x, z) ? h[I(x, z)] : 0) * STEP; },
  };
}
