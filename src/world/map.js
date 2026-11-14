// The world: one square grid of tiles. Herrington Hollow in the middle with the pines round it, and past
// the pines four lands, one down each road: the White Waste north, the Red Badlands east, the Drowned Fen
// south, the Cinder Reach west. Everything here is plain data; render.js draws it.
//
// Compass: -z is north (up-right on screen), +x east (down-right), +z south (down-left), -x west.
import { rng32, vnoise } from '../core/util.js';
import { ZOMBIES, KIND, WOODS, CRYPT_PACK } from '../data/enemies.js';

export const N = 256;
const O = 64;   // the first map was 128 square: everything it placed by hand sits this far in from the new edge
export const T = {
  GRASS1: 0, GRASS2: 1, GRASS3: 2, PINE: 3, DIRT: 4, ROAD: 5, FLAGS: 6, MOSS: 7, ROCK: 8,
  SNOW: 9, ICE: 10, SNOWROCK: 11, SAND: 12, CLAY: 13, REDROCK: 14, OASIS: 15, FEN: 16, WATER: 17,
  ASH: 18, BASALT: 19, RUST: 20, RUIN: 21,
  // the old crypt in the pines: its flagstones, the raised floor in its middle, the turned earth round it
  CRYPT: 22, DAIS: 23, GRAVE: 24,
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
// `id` ties a building to the merchant or folk who stand at its door (see data/cast.js); `look` is the house it is
// drawn as (assets/props: a tall timbered townhouse or a low thatched cottage; the inn is two townhouses side by side).
const SLOTS_X = [42, 48, 54, 70, 76, 82].map((x) => x + O);
const BUILDINGS = [
  // row A, north of the main street
  { id: 'weapons', name: 'Ironhand Arms', slot: 0, row: 0, wall: 'wall_12', roof: 'roof_2', door: 'door_2', look: 'townhouse' },
  { id: 'forge', name: 'The Proud Anvil', slot: 1, row: 0, wall: 'wall_16', roof: 'roof_3', door: 'door_4', look: 'forge' },
  { id: 'armor', name: 'Thicker Than Hope', slot: 2, row: 0, wall: 'wall_09', roof: 'roof_1', door: 'door_1', look: 'townhouse' },
  { id: 'spells', name: "Vey's Scrolls", slot: 3, row: 0, wall: 'wall_14', roof: 'roof_4', door: 'door_3', look: 'townhouse' },
  { id: 'gems', name: 'The Lapidary', slot: 4, row: 0, wall: 'wall_08', roof: 'roof_2', door: 'door_5', look: 'cottage' },
  { id: 'rings', name: "Fortunato's Wheel", slot: 5, row: 0, wall: 'wall_18', roof: 'roof_1', door: 'door_2', look: 'townhouse' },
  // row B, south of the main street, fronting the back lane
  { id: 'bags', name: 'Reed Saddlery', slot: 0, row: 1, wall: 'wall_10', roof: 'roof_3', door: 'door_1', look: 'cottage' },
  { id: 'inn', name: 'The Last Toll', slot: 1, row: 1, wall: 'wall_20', roof: 'roof_4', door: 'door_4', wide: 2, look: 'inn' },
  { id: 'enchant', name: 'The Veiled Kiln', slot: 3, row: 1, wall: 'wall_13', roof: 'roof_2', door: 'door_3', look: 'townhouse' },
  { id: 'socket', name: "The Curator's Bench", slot: 4, row: 1, wall: 'wall_17', roof: 'roof_1', door: 'door_5', look: 'cottage' },
  { id: 'cottage', name: 'Moss Cottage', slot: 5, row: 1, wall: 'wall_11', roof: 'roof_3', door: 'door_2', look: 'cottage' },
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

  // --- the Hollow's furniture: stalls in the square, a signpost inside each road in, and round the edge a fence, with
  //     a dry-stone wall either side of the four roads. Nothing here draws on r(), so the rest of the map stays put. ---
  const decor = [];   // { kind, x, z, turn }: its middle, and quarter turns from facing south (+z)
  const put = (kind, x, z, turn, tiles) => {
    for (const [tx, tz] of tiles) block[I(tx, tz)] = 1;
    decor.push({ kind, x, z, turn });
  };
  for (const [x, z, turn] of [[60, 60, 0], [60, 68, 2], [67, 68, 2]]) put('market_stall', x + O + 0.5, z + O, turn, [[x + O, z + O], [x + O + 1, z + O]]);
  for (const [x, z, turn] of [[67, 53, 0], [60, 76, 0], [87, 60, 1], [41, 68, 1]]) put('signpost', x + O, z + O, turn, [[x + O, z + O]]);
  block[I(board.x - 1, board.z)] = block[I(board.x + 1, board.z)] = 1;     // the board is wider than its tile
  // the edge, side by side: runs of free tiles, wall within six of a road's middle, fence beyond, in two-tile lengths
  const edge = (fixed, along, a0, a1, mid, turn) => {
    let run = [], kind = null;
    const flush = () => {
      for (let k = 0; run.length > 1 && k < run.length; k += 2) {      // an odd last tile shares the length before it
        const two = k + 1 < run.length ? [run[k], run[k + 1]] : [run[k - 1], run[k]], m = (two[0] + two[1]) / 2;
        put(kind, along === 'x' ? m : fixed, along === 'x' ? fixed : m, turn, two.map((a) => (along === 'x' ? [a, fixed] : [fixed, a])));
      }
      run = [];
    };
    for (let a = a0; a <= a1; a++) {
      const [x, z] = along === 'x' ? [a, fixed] : [fixed, a], i = I(x, z), off = Math.abs(a - mid);
      const k = road[i] || block[i] || off <= 2 ? null : off <= 8 ? 'stone_wall' : 'fence';
      if (k !== kind) { if (run.length) flush(); kind = k; }
      if (k) run.push(a);
    }
    if (run.length) flush();
  };
  edge(TOWN.z0, 'x', TOWN.x0, TOWN.x1, TOWN.cx, 0); edge(TOWN.z1, 'x', TOWN.x0, TOWN.x1, TOWN.cx, 0);
  edge(TOWN.x0, 'z', TOWN.z0 + 1, TOWN.z1 - 1, TOWN.cz, 1); edge(TOWN.x1, 'z', TOWN.z0 + 1, TOWN.z1 - 1, TOWN.cz, 1);

  // --- the old crypt, out where the pines are oldest ---
  // A roofless walled yard, 13 tiles across inside, its gate in the south wall where the camera looks in. The wall
  // ring is at 7 tiles from the middle; a ring at 8 is pines (north, west) or fallen stone (south, east), so the only
  // way in is the gate. The pack stands on a raised dais (2 either way of the middle) and cannot wander off it, so
  // nothing in there sees through a wall: the nearest open ground outside is 7 tiles from the dais, past any sight.
  const CW = 7;
  function buildCrypt() {
    // where: deep in the pines (the farthest band out that has room), the spot with the most pine floor round it,
    // flat, off the roads, and every tile of it in the pines
    let best = null;
    for (const far of [60, 52, 44, 36]) {
      let most = -1;
      for (let cz = 12; cz <= N - 13; cz++) for (let cx = 12; cx <= N - 13; cx++) {
        if (region[I(cx, cz)] || Math.hypot(cx - TOWN.cx, cz - TOWN.cz) < far || Math.hypot(cx - start.x, cz - start.z) < 30) continue;
        let pine = 0, ok = true;
        for (let dz = -11; dz <= 11 && ok; dz++) for (let dx = -11; dx <= 11; dx++) {
          const i = I(cx + dx, cz + dz);
          if (h[i] || road[i] || block[i] === 1 || keep[i] || region[i]) { ok = false; break; }
          if (type[i] === T.PINE) pine++;
        }
        if (ok && pine > most) { most = pine; best = { x: cx, z: cz }; }
      }
      if (best) break;
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
  for (const k of knolls) {
    if (!reach[I(k.x, k.z)] || h[I(k.x, k.z)] < 4) continue;
    chests.push({ id: 'chest' + chests.length, x: k.x, z: k.z });
    block[I(k.x, k.z)] = 1;
  }
  // and one in the crypt, against its back wall
  chests.push(crypt.chest);

  // --- the dead: packs of two to four (goblins more), harder the farther out, and each land has its own ---
  // In the pines each tier has its list of kinds (WOODS in data/enemies.js): a pack takes the next kind on its tier's
  // list for its own, so every kind comes up, and now and then one of its neighbours from the same list.
  const tierKinds = WOODS.map((ids) => ids.map((id) => KIND[id]));
  const turn = tierKinds.map((l) => Math.floor(r() * l.length));
  const packs = [];
  const pinesTier = (x, z) => Math.max(0, Math.min(4, Math.floor((Math.hypot(x - TOWN.cx, z - TOWN.cz) - 24) / 11)));
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
    if (Math.max(Math.abs(x - crypt.x), Math.abs(z - crypt.z)) < 19) continue;   // the crypt keeps its own
    let count = 2 + Math.floor(r() * 3), tier, pickOne;
    const reg = region[i];
    if (reg === 0) {
      tier = pinesTier(x, z);
      // the pack's kind is the next on its tier's list, with a neighbour from the list mixed in
      const list = tierKinds[tier], main = list[turn[tier]++ % list.length];
      if (ZOMBIES[main].swarm) count += 2;
      pickOne = () => ({ kind: r() < 0.3 ? list[Math.floor(r() * list.length)] : main, level: 1 + tier * 2 + Math.floor(r() * 2) });
    } else {
      const deep = Math.max(0, Math.min(3, Math.floor(depthOf(x, z).d / 14)));
      tier = 5 + deep;
      pickOne = () => ({ kind: REGIONS[reg].kinds[r() < 0.6 ? 0 : 1], level: 10 + deep * 2 + Math.floor(r() * 2) });
    }
    const members = fill(x, z, count, pickOne);
    if (members.length) packs.push({ x, z, tier, region: reg, members });
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
      const tier = pinesTier(at.x, at.z), members = [];
      for (let t2 = 0; members.length < 4 + Math.floor(gr() * 2) && t2 < 60; t2++) {
        const X = at.x + Math.floor(gr() * 5) - 2, Z = at.z + Math.floor(gr() * 5) - 2, j = I(X, Z);
        if (inMap(X, Z) && reach[j] && !block[j] && !members.some((m) => m.x === X && m.z === Z)) members.push({ x: X, z: Z, kind: KIND.goblin, level: 1 + tier * 2 + Math.floor(gr() * 2) });
      }
      if (members.length) packs.push({ x: at.x, z: at.z, tier, region: 0, members });
    }
  }
  // A pines kind the draw left out takes one place in a pines pack whose tier lists it, from a kind there is more than one of.
  const count = new Map();
  for (const p of packs) for (const m of p.members) count.set(m.kind, (count.get(m.kind) || 0) + 1);
  ZOMBIES.forEach((zd, k) => {
    if (zd.boss || zd.lord || count.get(k)) return;
    for (const p of [...packs].sort((a, b) => b.members.length - a.members.length)) {
      if (p.region !== 0 || !tierKinds[p.tier]?.includes(k)) continue;
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
      packs.push({ x: best.x, z: best.z, tier: 0, region: 0, members });
    }
  }
  // the crypt's keeper and its company, on the dais (last, so the woods' packs keep their numbers)
  packs.push({ x: crypt.x, z: crypt.z, tier: 4, region: 0, crypt: true, members: CRYPT_PACK.map(([id, level], k) => ({ ...crypt.spots[k], kind: KIND[id], level })) });

  return {
    N, seed, type, h, block, road, reach, region, trees, buildings, well, board, decor, knolls, chests, packs, props, places, start, lisandraSpot, crypt,
    I, inMap, inTown,
    regionAt(x, z) { return REGIONS[inMap(x, z) ? region[I(x, z)] : 0]; },
    walkable(x, z) { return inMap(x, z) && !block[I(x, z)]; },
    height(x, z) { return inMap(x, z) ? h[I(x, z)] : 0; },
    y(x, z) { return (inMap(x, z) ? h[I(x, z)] : 0) * STEP; },
  };
}

// Where the recruits of a land (REGIONS index) stand, n of them: a short way off its road, well apart, and out of
// sight of the dead where the land has room. The same tiles every time for the same world; each pass asks a little
// less than the one before.
export function recruitSpots(w, reg, n) {
  const r = rng32(w.seed + 101 + reg * 7), out = [], members = w.packs.flatMap((p) => p.members);
  const roadGap = (x, z, far) => {
    for (let d = 1; d <= far; d++) for (let dz = -d; dz <= d; dz++) for (let dx = -d; dx <= d; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) === d && w.inMap(x + dx, z + dz) && w.road[w.I(x + dx, z + dz)]) return d;
    }
    return Infinity;
  };
  const tiles = [];
  for (let z = 3; z < N - 3; z++) for (let x = 3; x < N - 3; x++) {
    const i = w.I(x, z);
    if (w.region[i] !== reg || !w.reach[i] || w.block[i] || w.road[i] || w.h[i] !== 0 || w.inTown(x, z, reg ? 4 : 18)) continue;
    if (Math.hypot(x - w.start.x, z - w.start.z) < 8 || w.chests.some((c) => Math.hypot(c.x - x, c.z - z) < 3) || w.places.some((p) => x >= p.x - 3 && x <= p.x + p.w + 3 && z >= p.z - 3 && z <= p.z + p.d + 3)) continue;
    const road = roadGap(x, z, 12);
    if (road === Infinity) continue;
    const foe = members.reduce((m, o) => Math.min(m, Math.hypot(o.x - x, o.z - z)), Infinity);
    tiles.push({ x, z, road, foe, k: r() });
  }
  tiles.sort((p, q) => p.k - q.k);
  for (const [apart, foe, road] of [[12, 10, 4], [10, 9, 6], [8, 8, 8], [6, 7, 12]]) {
    for (const t of tiles) {
      if (out.length >= n) break;
      if (t.road > road || t.foe < foe || out.some(([a, b]) => Math.hypot(a - t.x, b - t.z) < apart)) continue;
      out.push([t.x, t.z]);
    }
  }
  return out;
}
