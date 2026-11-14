// The world: one square grid of tiles. Herrington Hollow in the middle, pines and oaks all round,
// three roads out to nowhere. Everything here is plain data; render.js draws it.
//
// Compass: -z is north (up-right on screen), +x east (down-right), +z south (down-left), -x west.
import { rng32, vnoise } from '../core/util.js';

export const N = 128;
export const T = { GRASS1: 0, GRASS2: 1, GRASS3: 2, PINE: 3, DIRT: 4, ROAD: 5, FLAGS: 6, MOSS: 7, ROCK: 8 };
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

  // --- what you can reach on foot from the start ---
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

  // --- chests on the knoll tops ---
  const chests = [];
  for (const k of knolls) {
    if (!reach[I(k.x, k.z)] || h[I(k.x, k.z)] < 4) continue;
    chests.push({ id: 'chest' + chests.length, x: k.x, z: k.z });
    block[I(k.x, k.z)] = 1;
  }

  // --- the dead in the woods: packs of two to four, harder the farther out ---
  const packs = [];
  for (let tries = 0; tries < 6000 && packs.length < 20; tries++) {
    const x = 4 + Math.floor(r() * (N - 8)), z = 4 + Math.floor(r() * (N - 8));
    const i = I(x, z);
    if (!reach[i] || block[i] || h[i] !== 0 || inTown(x, z, 9) || road[i]) continue;
    if (Math.hypot(x - start.x, z - start.z) < 9) continue;
    if (packs.some((p) => Math.hypot(p.x - x, p.z - z) < 13)) continue;
    const dist = Math.hypot(x - TOWN.cx, z - TOWN.cz);
    const tier = Math.max(0, Math.min(4, Math.floor((dist - 22) / 9)));
    const count = 2 + Math.floor(r() * 3);
    const members = [];
    for (let k = 0, t2 = 0; k < count && t2 < 60; t2++) {
      const X = x + Math.floor(r() * 5) - 2, Z = z + Math.floor(r() * 5) - 2;
      if (!inMap(X, Z)) continue;
      const j = I(X, Z);
      if (!reach[j] || block[j] || members.some((m) => m.x === X && m.z === Z)) continue;
      // the pack's kind is mostly its tier's, with a neighbour mixed in
      const kind = Math.max(0, Math.min(4, tier + (r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0)));
      members.push({ x: X, z: Z, kind, level: 1 + tier * 2 + Math.floor(r() * 2) });
      k++;
    }
    if (members.length) packs.push({ x, z, tier, members });
  }
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

  return {
    N, seed, type, h, block, road, reach, trees, buildings, well, board, knolls, chests, packs, start, lisandraSpot,
    I, inMap, inTown,
    walkable(x, z) { return inMap(x, z) && !block[I(x, z)]; },
    height(x, z) { return inMap(x, z) ? h[I(x, z)] : 0; },
    y(x, z) { return (inMap(x, z) ? h[I(x, z)] : 0) * STEP; },
  };
}
