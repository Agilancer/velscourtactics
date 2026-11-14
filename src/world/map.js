// The world: one square grid of tiles. Herrington Hollow in the middle with the pines round it, and past
// the pines four lands, one down each road: the White Waste north, the Red Badlands east, the Drowned Fen
// south, the Cinder Reach west. Everything here is plain data; render.js draws it.
//
// Compass: -z is north (up-right on screen), +x east (down-right), +z south (down-left), -x west.
import { rng32, vnoise } from '../core/util.js';

export const N = 256;
const O = 64;   // the first map was 128 square: everything it placed by hand sits this far in from the new edge
export const T = {
  GRASS1: 0, GRASS2: 1, GRASS3: 2, PINE: 3, DIRT: 4, ROAD: 5, FLAGS: 6, MOSS: 7, ROCK: 8,
  SNOW: 9, ICE: 10, SNOWROCK: 11, SAND: 12, CLAY: 13, REDROCK: 14, OASIS: 15, FEN: 16, WATER: 17,
  ASH: 18, BASALT: 19, RUST: 20, RUIN: 21,
};
export const TOWN = { x0: 40 + O, x1: 88 + O, z0: 52 + O, z1: 77 + O, cx: 64 + O, cz: 64 + O };
const CORE = 62;   // how far the pines run from the square before the other lands begin

// The lands. `kinds` index data/enemies.js (two that walk it, then its lord); `rock`/`low` are a knoll's top and skirt.
export const REGIONS = [
  { id: 'pines', name: 'The Pines', sub: 'The dead are in there' },
  { id: 'waste', name: 'The White Waste', sub: 'Nothing rots here. That is the trouble', kinds: [5, 6, 13], rock: T.SNOWROCK, low: T.SNOW,
    place: 'The Frozen Border Fort', wall: 'tex/ashlar_c.webp', spire: 'tex/frost_1_c.webp' },
  { id: 'badlands', name: 'The Red Badlands', sub: 'Dry bones keep', kinds: [7, 8, 14], rock: T.REDROCK, low: T.CLAY,
    place: 'The Dry Court', wall: 'desert/Desert_Fantasy_Textures_Vol_2/11_mudbrick_wall.png', spire: 'desert/Desert_Fantasy_Textures/09_red_canyon_rock.png' },
  { id: 'fen', name: 'The Drowned Fen', sub: 'Mind where the ground stops', kinds: [9, 10, 15], rock: T.ROCK, low: T.MOSS,
    place: 'The Swamp Abbey', wall: 'tex/course_c.webp', spire: null },
  { id: 'ash', name: 'The Cinder Reach', sub: 'The line ran through here once', kinds: [11, 12, 16], rock: T.BASALT, low: T.ASH,
    place: 'Cinder Halt', wall: 'tex/block_c.webp', spire: 'tex/basalt_1_c.webp' },
];

// Height is in half-steps: world y = h * 0.5. Walking takes one half-step up or down; a jump takes two up.
export const STEP = 0.5;

// Buildings sit in two rows with their doors on the south face, where the camera can see them.
// `id` ties a building to the merchant or folk who stand at its door (see data/cast.js).
const SLOTS_X = [42, 48, 54, 70, 76, 82].map((x) => x + O);
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
  const region = new Uint8Array(N * N);
  const keep = new Uint8Array(N * N);  // 1 = set by hand: no tree, knoll or spire lands here
  const I = (x, z) => z * N + x;
  const inMap = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  const inTown = (x, z, m = 0) => x >= TOWN.x0 - m && x <= TOWN.x1 + m && z >= TOWN.z0 - m && z <= TOWN.z1 + m;

  // --- which land a tile is in: the pines in a ragged square, then one land per compass point ---
  const depthOf = (x, z) => {
    const dx = x - TOWN.cx + (vnoise(x * 0.045, z * 0.045, seed + 21) - 0.5) * 24;
    const dz = z - TOWN.cz + (vnoise(x * 0.045 + 9, z * 0.045, seed + 22) - 0.5) * 24;
    return { dx, dz, d: Math.max(Math.abs(dx), Math.abs(dz)) - CORE };
  };
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const { dx, dz, d } = depthOf(x, z);
    region[I(x, z)] = d < 0 ? 0 : Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 2 : 4) : (dz < 0 ? 1 : 3);
  }

  // --- ground ---
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const n = vnoise(x * 0.07, z * 0.07, seed);
    const m = vnoise(x * 0.11 + 40, z * 0.11, seed + 3);
    let t;
    switch (region[I(x, z)]) {
      case 1: t = m > 0.74 ? T.ICE : T.SNOW; break;
      case 2: t = n > 0.56 ? T.CLAY : T.SAND; break;
      case 3: t = n > 0.55 ? T.MOSS : m > 0.7 ? T.GRASS3 : T.FEN; break;
      case 4: t = n > 0.6 ? T.BASALT : T.ASH; break;
      default:
        t = n > 0.6 ? T.PINE : n > 0.47 ? T.GRASS3 : n > 0.3 ? T.GRASS2 : T.GRASS1;
        if (m > 0.8) t = T.MOSS;
    }
    type[I(x, z)] = t;
  }

  // --- roads ---
  const paint = (x, z) => {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const X = x + dx, Z = z + dz;
      if (!inMap(X, Z)) continue;
      const far = Math.max(Math.abs(dx), Math.abs(dz));
      if (far <= 1) { type[I(X, Z)] = T.ROAD; road[I(X, Z)] = 1; }
      else if (type[I(X, Z)] !== T.ROAD && region[I(X, Z)] === 0 && r() < 0.6) type[I(X, Z)] = T.DIRT;
    }
  };
  const ease = (t) => Math.min(1, t / 12);
  const roadN = (z) => { const t = TOWN.z0 - z; return TOWN.cx + Math.round(Math.sin(t * 0.13) * 4 * ease(t)); };
  const roadS = (z) => { const t = z - TOWN.z1; return TOWN.cx + Math.round(Math.sin(t * 0.11 + 1) * 5 * ease(t)); };
  const roadE = (x) => { const t = x - TOWN.x1; return TOWN.cz + Math.round(Math.sin(t * 0.12 + 2) * 4 * ease(t)); };
  const roadW = (x) => { const t = TOWN.x0 - x; return TOWN.cz + Math.round(Math.sin(t * 0.1 + 4) * 5 * ease(t)); };
  for (let z = TOWN.z0; z >= 0; z--) paint(roadN(z), z);
  for (let z = TOWN.z1; z < N; z++) paint(roadS(z), z);
  for (let x = TOWN.x1; x < N; x++) paint(x, roadE(x));
  for (let x = TOWN.x0; x >= 0; x--) paint(x, roadW(x));

  // --- the town ---
  for (let z = TOWN.z0; z <= TOWN.z1; z++) for (let x = TOWN.x0; x <= TOWN.x1; x++) {
    let t = vnoise(x * 0.3, z * 0.3, seed + 5) > 0.55 ? T.GRASS2 : T.GRASS1;
    if (z >= 62 + O && z <= 66 + O) t = (z === 62 + O || z === 66 + O) ? T.DIRT : T.ROAD;   // main street
    if (x >= 63 + O && x <= 65 + O) t = T.ROAD;                                           // north-south street
    if (z >= 73 + O && z <= 74 + O) t = T.DIRT;                                           // back lane
    if (x >= 60 + O && x <= 68 + O && z >= 60 + O && z <= 68 + O) t = T.FLAGS;            // the square
    type[I(x, z)] = t;
    if (t === T.ROAD || t === T.FLAGS || t === T.DIRT) road[I(x, z)] = 1;
  }
  const buildings = BUILDINGS.map((b) => {
    const w = b.wide ? 11 : 5, d = 5;
    const x = SLOTS_X[b.slot], z = (b.row === 0 ? 57 : 68) + O;
    for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) { block[I(x + dx, z + dz)] = 1; type[I(x + dx, z + dz)] = T.DIRT; }
    const doorX = x + Math.floor(w / 2);
    return { ...b, x, z, w, d, doorX, front: { x: doorX, z: z + d } };
  });
  // the well in the square, the bounty board beside it
  const well = { x: 64 + O, z: 64 + O };
  const board = { x: 67 + O, z: 61 + O };
  block[I(well.x, well.z)] = 1;
  block[I(board.x, board.z)] = 1;

  // --- where the story starts: on the south road, just outside the Hollow ---
  const start = { x: roadS(86 + O), z: 86 + O };
  const lisandraSpot = { x: roadS(83 + O) + 2, z: 83 + O };

  // --- a place in each land: broken walls round a paved floor, a chest in the middle, and its lord at home ---
  const props = [];    // { kind: 'wall' | 'spire', x, z, tex, h }
  const places = [];   // { name, region, x, z, w, d }
  const chests = [];
  const flatFree = (x0, z0, x1, z1, reg) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!inMap(x, z) || x < 3 || z < 3 || x > N - 4 || z > N - 4) return false;
      const i = I(x, z);
      if (road[i] || block[i] || keep[i] || region[i] !== reg) return false;
    }
    return true;
  };
  for (let reg = 1; reg <= 4; reg++) {
    const R = REGIONS[reg], w = 13, d = 11;
    for (let tries = 0; tries < 4000; tries++) {
      const x = Math.floor(r() * N), z = Math.floor(r() * N);
      if (depthOf(x + 6, z + 5).d < 22 || !flatFree(x - 3, z - 3, x + w + 2, z + d + 2, reg)) continue;
      const gate = x + 6;
      for (let dz = -2; dz < d + 2; dz++) for (let dx = -2; dx < w + 2; dx++) keep[I(x + dx, z + dz)] = 1;
      for (let dz = 0; dz < d; dz++) for (let dx = 0; dx < w; dx++) {
        const X = x + dx, Z = z + dz, i = I(X, Z), edge = dx === 0 || dz === 0 || dx === w - 1 || dz === d - 1;
        type[i] = T.RUIN;
        const open = (dz === d - 1 && Math.abs(X - gate) <= 1) || (dx === 0 && dz === 5);   // the gate south, a breach west
        if (edge && !open && r() < 0.78) { block[i] = 1; props.push({ kind: 'wall', x: X, z: Z, tex: R.wall, h: 1.1 + r() * 1.5 }); }
      }
      // two stubs of an inner wall, so the fight inside has something to stand behind
      for (const [dx, dz] of [[3, 3], [3, 4], [9, 6], [9, 7]]) { block[I(x + dx, z + dz)] = 1; props.push({ kind: 'wall', x: x + dx, z: z + dz, tex: R.wall, h: 0.9 + r() * 0.8 }); }
      const c = { id: 'place' + reg, x: x + 6, z: z + 3 };
      chests.push(c); block[I(c.x, c.z)] = 1;
      places.push({ name: R.place, region: reg, x, z, w, d, cx: x + 6, cz: z + 5 });
      break;
    }
  }
  // the Badlands' one water: a pool, a ring of green, palms (planted below with the trees)
  let oasis = null;
  for (let tries = 0; tries < 4000 && !oasis; tries++) {
    const x = Math.floor(r() * N), z = Math.floor(r() * N);
    if (depthOf(x, z).d < 12 || !flatFree(x - 9, z - 9, x + 9, z + 9, 2)) continue;
    oasis = { name: 'Last Water', region: 2, x: x - 4, z: z - 4, w: 9, d: 9, cx: x, cz: z };
    for (let dz = -8; dz <= 8; dz++) for (let dx = -8; dx <= 8; dx++) {
      const dd = Math.hypot(dx, dz) + (vnoise((x + dx) * 0.5, (z + dz) * 0.5, seed + 31) - 0.5) * 2, i = I(x + dx, z + dz);
      if (dd < 3.4) { type[i] = T.WATER; block[i] = 1; keep[i] = 1; } else if (dd < 7) { type[i] = T.OASIS; if (dd < 4.6) keep[i] = 1; }
    }
    places.push(oasis);
  }
  // the dead line across the Cinder Reach: a rail bed running north to south, rusted through
  for (let z = 2, x = 0; z < N - 2; z++) {
    x = 22 + Math.round(Math.sin(z * 0.035) * 9);
    for (let dx = 0; dx <= 1; dx++) { const i = I(x + dx, z); if (region[i] === 4 && !road[i] && !block[i] && type[i] !== T.RUIN) { type[i] = T.RUST; keep[i] = 1; } }
  }
  // pools in the Fen: black water you walk round
  for (let z = 2; z < N - 2; z++) for (let x = 2; x < N - 2; x++) {
    const i = I(x, z);
    if (region[i] !== 3 || keep[i] || block[i] || vnoise(x * 0.13, z * 0.13, seed + 13) < 0.7) continue;
    let nr = false;
    for (let dz = -2; dz <= 2 && !nr; dz++) for (let dx = -2; dx <= 2; dx++) if (road[I(x + dx, z + dz)]) { nr = true; break; }
    if (nr) continue;
    type[i] = T.WATER; block[i] = 1; keep[i] = 1;
  }

  // --- knolls: rocky rises you have to jump to climb ---
  const knolls = [];
  for (let tries = 0; tries < 3000 && knolls.length < 46; tries++) {
    const cx = 10 + Math.floor(r() * (N - 20)), cz = 10 + Math.floor(r() * (N - 20)), rad = 3 + Math.floor(r() * 3);
    if (inTown(cx, cz, rad + 12)) continue;
    let bad = false;
    for (let dz = -rad - 2; dz <= rad + 2 && !bad; dz++) for (let dx = -rad - 2; dx <= rad + 2; dx++) { const i = I(cx + dx, cz + dz); if (road[i] || keep[i] || block[i]) { bad = true; break; } }
    if (bad || knolls.some((k) => Math.hypot(k.x - cx, k.z - cz) < 16)) continue;
    const R = REGIONS[region[I(cx, cz)]];
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      const dd = Math.hypot(dx, dz) + (vnoise((cx + dx) * 0.6, (cz + dz) * 0.6, seed + 7) - 0.5) * 1.6;
      if (dd > rad) continue;
      const i = I(cx + dx, cz + dz);
      h[i] = dd < rad - 3.2 ? 5 : dd < rad - 1.6 ? 4 : 2;
      type[i] = h[i] >= 4 ? (R.rock ?? T.ROCK) : (R.low ?? T.MOSS);
    }
    knolls.push({ x: cx, z: cz, rad });
  }

  // --- standing stones: ice in the Waste, hoodoos in the Badlands, basalt in the Reach ---
  const nearRoad = (x, z) => {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inMap(x + dx, z + dz) && road[I(x + dx, z + dz)]) return true;
    return false;
  };
  for (let k = 0; k < 2600; k++) {
    const x = 2 + Math.floor(r() * (N - 4)), z = 2 + Math.floor(r() * (N - 4)), i = I(x, z), R = REGIONS[region[i]];
    if (!R.spire || block[i] || keep[i] || h[i] !== 0 || nearRoad(x, z) || r() > (region[i] === 4 ? 0.3 : 0.14)) continue;
    block[i] = 1;
    props.push({ kind: 'spire', x, z, tex: R.spire, h: 1.2 + r() * 2.4 });
  }

  // --- trees: pines and oaks at home, snow pines north, palms at the water, bare trunks in the Fen and the Reach ---
  const trees = [];
  const canTree = (x, z, s) => {
    for (let dz = 0; dz < s; dz++) for (let dx = 0; dx < s; dx++) {
      const X = x + dx, Z = z + dz;
      if (!inMap(X, Z) || X < 1 || Z < 1 || X > N - 2 || Z > N - 2) return false;
      const i = I(X, Z);
      if (block[i] || keep[i] || h[i] !== 0 || nearRoad(X, Z) || inTown(X, Z)) return false;
      if (Math.abs(X - start.x) + Math.abs(Z - start.z) < 4) return false;
      if (X === lisandraSpot.x && Z === lisandraSpot.z) return false;
    }
    return true;
  };
  const kindOf = (x, z) => {
    const i = I(x, z);
    switch (region[i]) {
      case 1: return 'snowpine';
      case 2: return type[i] === T.OASIS ? 'palm' : 'dead';
      case 3: return r() < 0.55 ? 'dead' : 'oak';
      case 4: return 'char';
      default: return type[i] === T.PINE || vnoise(x * 0.04, z * 0.04, seed + 11) > 0.52 ? 'pine' : 'oak';
    }
  };
  const addTree = (x, z, s) => {
    const id = trees.length;
    trees.push({ id, x, z, size: s, kind: kindOf(x, z), v: Math.floor(r() * 4), rot: r() * 6.28, tall: 0.85 + r() * 0.35 });
    for (let dz = 0; dz < s; dz++) for (let dx = 0; dx < s; dx++) block[I(x + dx, z + dz)] = 2;
  };
  const want = (x, z) => {
    if (inTown(x, z, 5)) return 0.95;
    const i = I(x, z), f = vnoise(x * 0.05, z * 0.05, seed + 9);
    switch (region[i]) {
      case 1: return 0.03 + 0.2 * f;
      case 2: return type[i] === T.OASIS ? 0.5 : 0.012;
      case 3: return 0.08 + 0.3 * f;
      case 4: return 0.02 + 0.12 * f;
      default: return 0.16 + 0.5 * f;
    }
  };
  for (const [s, tries] of [[3, 6000], [2, 20800], [1, 36000]]) {
    for (let k = 0; k < tries; k++) {
      const x = Math.floor(r() * N), z = Math.floor(r() * N);
      if (r() > want(x, z) || !canTree(x, z, region[I(x, z)] === 2 ? 1 : s)) continue;
      addTree(x, z, region[I(x, z)] === 2 ? 1 : s);
    }
  }
  // close the ring round the town so the only ways in are the four roads
  for (let z = TOWN.z0 - 4; z <= TOWN.z1 + 4; z++) for (let x = TOWN.x0 - 4; x <= TOWN.x1 + 4; x++) {
    if (inTown(x, z) || !inMap(x, z)) continue;
    if (canTree(x, z, 1) && r() < 0.8) addTree(x, z, 1);
  }
  // a few big oaks inside the Hollow
  for (const [ox, oz] of [[44, 54], [58, 53], [72, 53], [85, 54], [50, 75], [78, 76]]) {
    const x = ox + O, z = oz + O;
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
  for (const k of knolls) {
    if (!reach[I(k.x, k.z)] || h[I(k.x, k.z)] < 4) continue;
    chests.push({ id: 'chest' + chests.length, x: k.x, z: k.z });
    block[I(k.x, k.z)] = 1;
  }

  // --- the dead: packs of two to four, harder the farther out, and each land has its own ---
  const packs = [];
  const fill = (x, z, count, pickOne) => {
    const members = [];
    for (let k = 0, t2 = 0; k < count && t2 < 60; t2++) {
      const X = x + Math.floor(r() * 5) - 2, Z = z + Math.floor(r() * 5) - 2;
      if (!inMap(X, Z)) continue;
      const j = I(X, Z);
      if (!reach[j] || block[j] || members.some((m) => m.x === X && m.z === Z)) continue;
      members.push({ x: X, z: Z, ...pickOne() });
      k++;
    }
    return members;
  };
  // the lords first, each standing in its own place with two of its land's dead
  for (const p of places) {
    const R = REGIONS[p.region];
    if (p === oasis || !reach[I(p.cx, p.cz)]) continue;
    const members = [{ x: p.cx, z: p.cz, kind: R.kinds[2], level: 18 }];
    members.push(...fill(p.cx, p.cz + 2, 2, () => ({ kind: R.kinds[r() < 0.5 ? 0 : 1], level: 15 + Math.floor(r() * 2) })).filter((m) => m.x !== p.cx || m.z !== p.cz));
    packs.push({ x: p.cx, z: p.cz, tier: 9, region: p.region, lord: true, members });
  }
  // the pines get theirs first (the early game lives there), then the lands beyond
  const lords = packs.length;
  for (let tries = 0; tries < 60000 && packs.length < lords + 74; tries++) {
    const x = 4 + Math.floor(r() * (N - 8)), z = 4 + Math.floor(r() * (N - 8));
    const i = I(x, z), home = packs.length < lords + 21 && tries < 30000;
    if (home !== (region[i] === 0)) continue;
    if (!reach[i] || block[i] || h[i] !== 0 || inTown(x, z, 9) || road[i] || type[i] === T.RUIN) continue;
    if (Math.hypot(x - start.x, z - start.z) < 9) continue;
    if (packs.some((p) => Math.hypot(p.x - x, p.z - z) < (home ? 12 : 14))) continue;
    const count = 2 + Math.floor(r() * 3), reg = region[i];
    let tier, pickOne;
    if (reg === 0) {
      const dist = Math.hypot(x - TOWN.cx, z - TOWN.cz);
      tier = Math.max(0, Math.min(4, Math.floor((dist - 24) / 11)));
      // the pack's kind is mostly its tier's, with a neighbour mixed in
      pickOne = () => ({ kind: Math.max(0, Math.min(4, tier + (r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0))), level: 1 + tier * 2 + Math.floor(r() * 2) });
    } else {
      const deep = Math.max(0, Math.min(3, Math.floor(depthOf(x, z).d / 14)));
      tier = 5 + deep;
      pickOne = () => ({ kind: REGIONS[reg].kinds[r() < 0.6 ? 0 : 1], level: 10 + deep * 2 + Math.floor(r() * 2) });
    }
    const members = fill(x, z, count, pickOne);
    if (members.length) packs.push({ x, z, tier, region: reg, members });
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
      packs.push({ x: best.x, z: best.z, tier: 0, region: 0, members });
    }
  }

  return {
    N, seed, type, h, block, road, reach, region, trees, buildings, well, board, knolls, chests, packs, props, places, start, lisandraSpot,
    I, inMap, inTown,
    regionAt(x, z) { return REGIONS[inMap(x, z) ? region[I(x, z)] : 0]; },
    walkable(x, z) { return inMap(x, z) && !block[I(x, z)]; },
    height(x, z) { return inMap(x, z) ? h[I(x, z)] : 0; },
    y(x, z) { return (inMap(x, z) ? h[I(x, z)] : 0) * STEP; },
  };
}
