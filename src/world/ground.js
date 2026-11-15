// The ground: a flat top for every tile in its own texture, the cliff faces the camera can see, and over the tops the
// layers that take the grid out of it.
//
// Every kind of ground is laid over the map as a field: at any point, how much of each kind lies round it, read off a
// map of the tiles (`uMap`, one texel a tile) through a smooth 2x2 blend, at a point pushed about by a slow, wide
// wander and a fine tear. Whichever kind has most there shows; near a tie the two run into each other, and where they
// are different stuff (grass and road, snow and stone) a band of grit runs along the join with a darker worn or wet
// rim. The wander reaches up to a tile, so a join meanders across tiles instead of running down a row of them; only
// near paving does it hold back, so the square keeps its edges. A tile draws its own top, then a layer for each other
// kind within two tiles on its own level, lowest kind first, so the field is worked out the same at every point and
// never breaks at a tile's edge. Water is a kind too: the land is cut back where water has most, so a shore wanders
// like any join, and the water under it is shallow and pale at the edge and dark in the middle.
//
// The shading is per corner: darker at the foot of a rise, with a slow tone over the whole of it, each texture graded
// to the game's palette (`GRADE`), and only the faint checker that lets you count tiles in a fight left per tile.
import * as THREE from 'three';
import { N, T, STEP, groundType } from './map.js';
import { rng32, vnoise } from '../core/util.js';

export const SUNK = 0.06;                       // how far water lies below its banks
const CRYPT_SIDE = 100;                         // (not a tile: the face of the crypt's dais where it steps down)
const DESERT = 'desert/Desert_Fantasy_Textures/', DESERT2 = 'desert/Desert_Fantasy_Textures_Vol_2/', OASIS = 'desert/Desert_Oasis_20_Textures/';
export const GROUND_TEX = {
  [T.GRASS1]: 'tex/grass_1_c.webp', [T.GRASS2]: 'tex/grass_2_c.webp', [T.GRASS3]: 'tex/grass_3_c.webp',
  [T.PINE]: 'tex/pinefloor_1_c.webp', [T.DIRT]: 'tex/dirt_1_c.webp', [T.ROAD]: 'tex/road_1_c.webp',
  [T.FLAGS]: 'tex/flags_c.webp', [T.MOSS]: 'tex/moss_1_c.webp', [T.ROCK]: 'tex/granite_1_c.webp',
  // the lands past the pines: bm's snow, frost, fen, ash and basalt, and its desert packs
  [T.SNOW]: 'tex/snow_1_c.webp', [T.ICE]: 'tex/frost_1_c.webp', [T.SNOWROCK]: 'tex/snowrock_1_c.webp',
  [T.SAND]: DESERT + '03_red_desert_sand.png', [T.CLAY]: DESERT + '06_cracked_clay.png', [T.REDROCK]: DESERT + '09_red_canyon_rock.png',
  [T.OASIS]: OASIS + '06_oasis_grass.png', [T.WATER]: OASIS + '17_deep_teal_water.png',
  [T.FEN]: 'tex/fen_1_c.webp', [T.ASH]: 'tex/ash_1_c.webp', [T.BASALT]: 'tex/basalt_1_c.webp', [T.RUST]: 'tex/rust_1_c.webp',
  [T.RUIN]: DESERT + '12_ruined_flagstones.png',
  [T.CRYPT]: 'tex/crypt/cata_floor_c.webp', [T.DAIS]: 'tex/crypt/cata_floor4_c.webp', [T.GRAVE]: 'tex/crypt/cata_earth_c.webp',
  [CRYPT_SIDE]: 'tex/crypt/cata_block_c.webp',
};
// How many tiles one repeat of a top's texture covers, down the z axis (across x it follows the picture's own shape).
// bm's catacomb textures are about three tiles across; the rest four.
const SQUARE = new Set([T.CRYPT, T.DAIS, T.GRAVE, CRYPT_SIDE]);
const SPAN = (t) => (SQUARE.has(t) ? 3 : 4);
// which rock a tile's cliff faces wear: its own if it is rock, else its land's
export const SIDE = { [T.ROCK]: T.ROCK, [T.SNOWROCK]: T.SNOWROCK, [T.REDROCK]: T.REDROCK, [T.BASALT]: T.BASALT, [T.DAIS]: CRYPT_SIDE };
const LAND_FACE = [T.ROCK, T.SNOWROCK, T.REDROCK, T.ROCK, T.BASALT];
export const faceOf = (t, reg) => SIDE[t] ?? LAND_FACE[reg] ?? T.ROCK;

// What each kind of ground is made of, for the joins: two of the same stuff (grass and moss, road and dirt) only blend.
export const FAM = {};
for (const [f, ts] of Object.entries({
  grass: [T.GRASS1, T.GRASS2, T.GRASS3, T.OASIS, T.MOSS], needles: [T.PINE], dirt: [T.DIRT, T.ROAD, T.GRAVE],
  paved: [T.FLAGS, T.RUIN, T.CRYPT, T.DAIS], rock: [T.ROCK, T.SNOWROCK, T.REDROCK, T.BASALT], snow: [T.SNOW, T.ICE],
  sand: [T.SAND, T.CLAY], fen: [T.FEN], ash: [T.ASH], rail: [T.RUST], water: [T.WATER],
})) for (const t of ts) FAM[t] = f;
const PAVED = new Set([T.FLAGS, T.RUIN, T.CRYPT, T.DAIS, T.RUST]);
// how soft the line between two kinds is (the wider of the two's): snow and sand drift, paving keeps an edge
const SOFT = { [T.SNOW]: 0.2, [T.ICE]: 0.2, [T.SAND]: 0.3, [T.CLAY]: 0.28, [T.ASH]: 0.12, [T.BASALT]: 0.1, [T.FEN]: 0.1, [T.MOSS]: 0.1,
  [T.OASIS]: 0.3, [T.DIRT]: 0.14, [T.ROAD]: 0.12, [T.GRAVE]: 0.12, [T.FLAGS]: 0.025, [T.RUIN]: 0.03, [T.CRYPT]: 0.025, [T.DAIS]: 0.025, [T.RUST]: 0.04 };

// The grit along a join or a crumbling edge: [texture, tiles a repeat covers].
const GRIT = {
  pebbles: [OASIS + '09_wet_river_pebbles.png', 1.3],
  gravel: [DESERT + '05_desert_gravel.png', 1.8],
  stones: [DESERT2 + '04_dry_wadi_stones.png', 1.5],
  ochre: [DESERT2 + '03_coarse_ochre_grit.png', 1.6],
  soil: [OASIS + '10_fertile_oasis_soil.png', 2.2],
  dirt: ['tex/dirt_3_c.webp', 3],
  litter: [OASIS + '12_reed_litter_ground.png', 2.6],
  black: [DESERT2 + '02_black_volcanic_sand.png', 2.2],
  snowrock: ['tex/snowrock_1_c.webp', 3],
};
const GRIT_ID = Object.fromEntries(Object.keys(GRIT).map((g, k) => [g, k + 1]));
// what runs along the join of two kinds: [grit, how dark the rim is, how wide the band, how dense] (the first rule
// that fits)
function joinOf(a, b) {
  const fa = FAM[a], fb = FAM[b];
  const has = (f) => fa === f || fb === f, other = (f) => (fa === f ? fb : fa);
  if (fa === fb) return fa === 'sand' ? ['stones', 0, 0.8, 0.45] : fa === 'snow' ? [null, 0.06, 1, 1] : [null, 0, 1, 1];
  if (has('snow')) return ['snowrock', 0.1, 1, 1];
  if (has('ash') && has('rock')) return ['black', 0.1, 1.6, 1];
  if (has('ash') || has('rail')) return ['black', 0.12, 1.2, 1];
  if (has('fen')) return ['litter', 0.16, 1, 1];
  if (has('sand')) { const o = other('sand'); return o === 'grass' ? [null, 0, 1, 0] : ['stones', 0, 1, 0.5]; }
  if (has('rock')) return ['dirt', 0.12, 1, 1];
  if (has('needles')) return ['litter', 0.1, 1, 1];
  if (has('paved')) return ['pebbles', 0.15, 0.7, 1];
  return ['pebbles', 0.12, 1, 1];                    // grass and dirt
}
// each land's water as seen (sRGB): deep, then at the bed, then how much scum floats on it. The Hollow and the pines,
// the White Waste, the Red Badlands, the Drowned Fen, the Cinder Reach.
const WATER_COL = [
  [0.1, 0.17, 0.2, 0.3, 0.27, 0.2, 0], [0.16, 0.26, 0.34, 0.5, 0.56, 0.6, 0], [0.09, 0.2, 0.2, 0.4, 0.37, 0.3, 0],
  [0.11, 0.15, 0.11, 0.27, 0.22, 0.14, 1], [0.07, 0.07, 0.08, 0.2, 0.17, 0.15, 0],
];

// Each texture graded to the palette: [saturation, value, dry patches, slow tone, tint, sparkle, glowing cracks,
// how much a second turned look is mixed in to break the repeat].
const G = (sat = 1, val = 1, dry = 0, tone = 0.24, tint = [1, 1, 1], sparkle = 0, ember = 0, anti = 0.35) => ({ sat, val, dry, tone, tint, sparkle, ember, anti });
const GRADE = {
  'tex/grass_1_c.webp': G(0.58, 0.8, 0.5, 0.26, [1.05, 1, 0.84], 0, 0, 0.55),
  'tex/grass_2_c.webp': G(0.56, 0.8, 0.5, 0.26, [1.05, 1, 0.84], 0, 0, 0.55),
  'tex/grass_3_c.webp': G(0.6, 0.8, 0.4, 0.26, [1.04, 1, 0.86], 0, 0, 0.55),
  [OASIS + '06_oasis_grass.png']: G(0.7, 0.86, 0.35, 0.24, [1.08, 1.02, 0.8], 0, 0, 0.5),
  'tex/moss_1_c.webp': G(0.85, 0.95, 0.15),
  'tex/pinefloor_1_c.webp': G(0.8, 1.2, 0, 0.2),
  'tex/dirt_1_c.webp': G(0.85, 0.97, 0, 0.12), 'tex/road_1_c.webp': G(0.85, 1.06, 0, 0.12),
  [DESERT + '03_red_desert_sand.png']: G(0.66, 0.9, 0, 0.45, [1.07, 0.93, 0.8], 0, 0, 0.55),
  [DESERT + '06_cracked_clay.png']: G(0.75, 0.95, 0, 0.22),
  'tex/snow_1_c.webp': G(0.35, 1.45, 0, 0.06, [0.96, 1, 1.06], 1, 0, 0.3),
  'tex/frost_1_c.webp': G(1.25, 1.02, 0, 0.18, [0.82, 0.97, 1.14], 0.6),
  'tex/ash_1_c.webp': G(0.7, 1.55, 0, 0.3, [1.08, 1, 0.9], 0, 1, 0.6),
  'tex/basalt_1_c.webp': G(0.45, 1.4, 0, 0.3, [0.88, 0.96, 1.12], 0.3, 0),
  'tex/fen_1_c.webp': G(0.9, 0.95, 0, 0.26),
  [GRIT.litter[0]]: G(0.65, 0.68, 0, 0.2, [0.95, 1, 0.84]),
  [GRIT.pebbles[0]]: G(0.7, 0.85),
  [GRIT.stones[0]]: G(0.8, 0.85),
  [GRIT.soil[0]]: G(0.85, 0.8),
  [GRIT.ochre[0]]: G(0.7, 0.85, 0, 0.2, [1, 0.92, 0.9]),
};
const gradeOf = (path) => GRADE[path] || G();

// ---- the noise the shaders tear their lines with: four channels of tiling value noise, stretched to 0..1 ----
export function noiseTexture(size = 128) {
  const r = rng32(1234), data = new Uint8Array(size * size * 4), acc = new Float32Array(size * size);
  const sm = (f) => f * f * (3 - 2 * f);
  for (let ch = 0; ch < 4; ch++) {
    acc.fill(0);
    for (const [P, amp] of [[4, 1], [8, 0.5], [16, 0.25], [32, 0.12]]) {
      const lat = Float32Array.from({ length: P * P }, r);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const fx = x / size * P, fy = y / size * P, ix = Math.floor(fx), iy = Math.floor(fy), u = sm(fx - ix), v = sm(fy - iy);
        const a = lat[iy * P + ix], b = lat[iy * P + (ix + 1) % P], c = lat[((iy + 1) % P) * P + ix], d = lat[((iy + 1) % P) * P + (ix + 1) % P];
        acc[y * size + x] += amp * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
      }
    }
    let lo = Infinity, hi = -Infinity;
    for (const v of acc) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    for (let k = 0; k < size * size; k++) data[k * 4 + ch] = Math.round((acc[k] - lo) / (hi - lo) * 255);
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

// ---- the lands' borders, ragged: a tile still on its land's own ground takes the ground of whichever land a noisy
// step away from it falls in. Only what is drawn changes; the world's own types stay as they are. ----
export function feather(w) {
  const vis = Uint8Array.from(w.type);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const i = w.I(x, z), reg = w.region[i];
    const wx = Math.round(x + (vnoise(x * 0.16, z * 0.16, w.seed + 61) - 0.5) * 11 + (vnoise(x * 0.55, z * 0.55, w.seed + 62) - 0.5) * 3.5);
    const wz = Math.round(z + (vnoise(x * 0.16 + 17, z * 0.16, w.seed + 63) - 0.5) * 11 + (vnoise(x * 0.55 + 17, z * 0.55, w.seed + 64) - 0.5) * 3.5);
    if (!w.inMap(wx, wz)) continue;
    const other = w.region[w.I(wx, wz)];
    if (other === reg || w.h[i] || w.road[i] || w.type[i] !== groundType(reg, x, z, w.seed)) continue;
    vis[i] = groundType(other, x, z, w.seed);
  }
  return vis;
}

// ---- the shader the tops are drawn with: Lambert, with the texture pinned to the world, graded, and the field ----
// GND_MODE -1 is a tile's own top (opaque, kind GND_KIND), 0 a layer of kind GND_KIND, 1 grit GND_GRIT along joins,
// 2 grit along an edge that drops away or a shore, 3 water, 4 a cliff face. aGnd: the tile, its level, the edges of
// it that drop away (N E S W, bits 0-3).
const FIELD = 'GND_MODE <= 3';
const VERT_HEAD = /* glsl */`
uniform vec2 uRep;
varying vec2 vGP;
#if ${FIELD}
attribute vec4 aGnd;
flat varying vec4 vGnd;
#endif`;
const VERT_BODY = /* glsl */`
vGP = (modelMatrix * vec4(position, 1.0)).xz;
#if ${FIELD}
vGnd = aGnd;
#endif`;
const FRAG_HEAD = /* glsl */`
uniform sampler2D uNoise;
uniform vec2 uRep;
uniform float uTime;
uniform vec4 uGrade;   // saturation, value, dry patches, slow tone
uniform vec3 uTint;
uniform vec4 uFx;      // sparkle, glowing cracks, the second look
varying vec2 vGP;
#if ${FIELD}
uniform sampler2D uMap, uAmp, uPair, uWDeep, uWBed;
uniform float uSoft[32];
flat varying vec4 vGnd;
// the field at p on level h: the kind with most (a, wa), the next (b, wb), the water's share and the level's total
void gndField(vec2 p, int h, out int a, out float wa, out int b, out float wb, out float ww, out float wt) {
  vec2 c = floor(p), f = p - c;
  f = f * f * (3.0 - 2.0 * f);
  float w4[4] = float[4]((1.0 - f.x) * (1.0 - f.y), f.x * (1.0 - f.y), (1.0 - f.x) * f.y, f.x * f.y);
  int t4[4];
  ww = 0.0; wt = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 cc = clamp(ivec2(c) + ivec2(k & 1, k >> 1), ivec2(0), ivec2(MAPN - 1));
    vec4 tx = texelFetch(uMap, cc, 0);
    t4[k] = -1;
    if (int(tx.g * 255.0 + 0.5) != h) { w4[k] = 0.0; continue; }
    wt += w4[k];
    int t = int(tx.r * 255.0 + 0.5);
    if (t == WATER) ww += w4[k]; else t4[k] = t;
  }
  a = -1; b = -1; wa = 0.0; wb = 0.0;
  for (int k = 0; k < 4; k++) {
    int t = t4[k];
    if (t < 0 || t == a || t == b) continue;
    float s = 0.0;
    for (int j = 0; j < 4; j++) if (t4[j] == t) s += w4[j];
    if (s > wa) { b = a; wb = wa; a = t; wa = s; } else if (s > wb) { b = t; wb = s; }
  }
}
#endif`;
const FRAG_MAP = /* glsl */`
#if GND_MODE == 3
  vec4 gTex = mix(texture2D(map, vMapUv * uRep + uTime * vec2(0.011, 0.006)), texture2D(map, vMapUv * uRep * 1.31 - uTime * vec2(0.004, 0.009)), 0.5);
#else
  vec2 gUv = vMapUv * uRep;
  vec4 gTex = texture2D(map, gUv);
  // a second look at the same ground, turned and scaled, comes and goes, so the repeat doesn't show
  if (uFx.z > 0.0) gTex.rgb = mix(gTex.rgb, texture2D(map, mat2(0.8, -0.6, 0.6, 0.8) * gUv * 0.71 + 0.37).rgb, uFx.z * smoothstep(0.3, 0.7, texture2D(uNoise, vGP * 0.031).g));
#endif
vec3 gC = gTex.rgb;
float gLum = dot(gC, vec3(0.3, 0.59, 0.11));
gC = mix(vec3(gLum), gC, uGrade.x) * uGrade.y * uTint;
vec4 gN = texture2D(uNoise, vGP * 0.043);
gC *= (1.0 + uGrade.w * (gN.b - 0.5)) * mix(vec3(0.97, 0.99, 1.03), vec3(1.03, 1.0, 0.95), gN.a);
// dry, yellowed patches in the grass
if (uGrade.z > 0.0) gC = mix(gC, vec3(gLum) * vec3(1.32, 1.12, 0.62) * uGrade.y, uGrade.z * smoothstep(0.52, 0.8, texture2D(uNoise, vGP * 0.021 + 0.5).r));
#if ${FIELD}
  float gAm = texture2D(uAmp, (vGP + 0.5) / float(MAPN)).r;
  vec2 gW = ((texture2D(uNoise, vGP * 0.071 + 0.21).rg - 0.5) * 2.6 + (texture2D(uNoise, vGP * 0.12 + 0.47).rg - 0.5) * 3.2) * gAm
          + (texture2D(uNoise, vGP * 0.41 + 0.6).rg - 0.5) * 0.8 + (texture2D(uNoise, vGP * 0.9 + 0.31).rg - 0.5) * 0.3;
  int gH = int(vGnd.z + 0.5), ga, gb;
  float wa, wb, ww, wt;
  gndField(vGP + clamp(gW, -1.35, 1.35), gH, ga, wa, gb, wb, ww, wt);
  float gTear = texture2D(uNoise, vGP * 1.93 + 0.13).a - 0.5;
  float gSea = wt > 0.0 ? ww / wt + (texture2D(uNoise, vGP * 1.37).g - 0.5) * 0.14 : 0.0;   // the water's share
  // how far ga leads gb (torn the same way from either side), and the pair's rim and grit
  float gD = 1.0, gE = 0.06;
  vec4 gPr = vec4(0.0);
  if (gb >= 0) {
    gD = (wa - wb) / max(wt - ww, 0.001) + (ga > gb ? 1.0 : -1.0) * gTear * 0.34;
    gE = max(uSoft[ga], uSoft[gb]);
    gPr = texelFetch(uPair, ivec2(min(ga, gb), max(ga, gb)), 0);
  }
  #if GND_MODE == 3
    // water: pale and shallow at the edge where the bed shows, dark in the middle, a sky in it, a wet line at the
    // shore, scum on the Fen's. Unlit, its colours picked as seen (sRGB) and taken to linear.
    // each land's water its own colours, eased from one to the next across the pool they share (WATER_COL)
    vec2 gWuv = (vGP + 0.5) / float(MAPN);
    vec4 gDp = texture2D(uWDeep, gWuv), gBd = texture2D(uWBed, gWuv);
    float gDeep = smoothstep(0.5, 0.9, gSea);
    vec3 gWc = mix(gBd.rgb, gDp.rgb, gDeep);
    gWc = mix(gWc, vec3(0.4, 0.44, 0.58), 0.05 + 0.1 * texture2D(uNoise, vGP * 0.05 + uTime * 0.003).b);
    gWc = mix(gWc, vec3(0.22, 0.26, 0.12), 0.6 * smoothstep(0.6, 0.76, texture2D(uNoise, vGP * 0.19 + 0.4).b) * gDeep * gDp.a);
    float gFoam = (1.0 - smoothstep(0.5, 0.6, gSea)) * smoothstep(0.35, 0.65, texture2D(uNoise, vGP * 0.6 + 0.9).g) * (0.5 + 0.5 * texture2D(uNoise, vGP * 2.1 + uTime * 0.05).r);
    gWc = mix(gWc, gBd.rgb * 0.5, gFoam * 0.45);
    gWc = pow(gWc, vec3(2.2)) * (0.78 + 0.22 * clamp(gLum / 0.06, 0.4, 1.8));
    float gGl = texture2D(uNoise, vGP * 0.9 + uTime * vec2(0.031, 0.017)).a * texture2D(uNoise, vGP * 1.3 - uTime * vec2(0.019, 0.034)).r;
    diffuseColor.rgb = vec3(0.0);
    totalEmissiveRadiance += gWc + vec3(0.035, 0.042, 0.045) * smoothstep(0.62, 0.72, gGl) * gDeep * (1.0 - 0.7 * gDp.a);
  #else
    if (gSea > 0.5) discard;
    gC *= mix(1.0, 0.55, smoothstep(0.18, 0.5, gSea));                  // wet toward the water
    gC *= 1.0 - gPr.g * (1.0 - smoothstep(0.0, 0.5, abs(gD)));           // a faint worn or wet shade along the join
    #if GND_MODE == 0
      float gA = 0.0;
      if (wt > 0.0) {
        if (gb < 0) gA = ga == GND_KIND ? 1.0 : 0.0;
        else {
          int lo = min(ga, gb), hi = max(ga, gb);
          gA = GND_KIND == lo ? 1.0 : GND_KIND == hi ? smoothstep(-gE, gE, hi == ga ? gD : -gD) : 0.0;
        }
      }
      if (gA < 0.004) discard;
      diffuseColor.a = gA;
    #elif GND_MODE == 1
      if (gb < 0 || int(gPr.r * 255.0 + 0.5) != GND_GRIT) discard;
      float gBand = (1.0 - smoothstep(0.0, 0.4 * (0.4 + gPr.b * 2.0), abs(gD))) * (0.15 + 0.85 * smoothstep(0.32, 0.68, texture2D(uNoise, vGP * 0.37 + 0.7).g)) * gPr.a;
    #elif GND_MODE == 2
      vec2 lp = vGP - vGnd.xy + 0.5;
      int e = int(vGnd.w + 0.5);
      float d = 9.0;
      if ((e & 1) != 0) d = min(d, lp.y);
      if ((e & 2) != 0) d = min(d, 1.0 - lp.x);
      if ((e & 4) != 0) d = min(d, 1.0 - lp.y);
      if ((e & 8) != 0) d = min(d, lp.x);
      float gBand = max(1.0 - smoothstep(0.02, 0.24 + 0.34 * texture2D(uNoise, vGP * 0.41).r, d), smoothstep(0.12, 0.42, gSea) * smoothstep(0.42, 0.7, texture2D(uNoise, vGP * 0.33 + 0.2).b));
    #endif
    #if GND_MODE == 1 || GND_MODE == 2
      float gG = texture2D(uNoise, vGP * 1.93 + 0.13).a - 0.5;
      diffuseColor.a = smoothstep(0.28, 0.52, gBand * 0.9 + (gLum - 0.45) * 0.55 + gG * 0.7) * smoothstep(0.04, 0.3, gBand);
      if (diffuseColor.a < 0.004) discard;
    #endif
  #endif
#endif
#if GND_MODE != 3
  #if GND_MODE == 4
  vec4 uFx2 = vec4(0.0);                                            // (a cliff face neither glitters nor burns)
  #else
  vec4 uFx2 = uFx;
  #endif
  // snow and ice glitter; the Reach's ash is split by cracks with the fire still in them
  if (uFx2.x > 0.0) totalEmissiveRadiance += vec3(0.9, 0.95, 1.0) * uFx2.x * smoothstep(0.9, 0.97, texture2D(uNoise, vGP * 3.7).a * 0.6 + texture2D(uNoise, vGP * 2.9 + uTime * 0.02).r * 0.5);
  if (uFx2.y > 0.0) {
    float gK = 1.0 - smoothstep(0.0, 0.022, abs(texture2D(uNoise, vGP * 0.23 + 0.17).g - 0.5));
    float gP = smoothstep(0.7, 0.86, texture2D(uNoise, vGP * 0.047 + 0.8).b) * uFx2.y;
    gC *= 1.0 - 0.6 * smoothstep(0.0, 0.06, 0.06 - abs(texture2D(uNoise, vGP * 0.23 + 0.17).g - 0.5)) * gP;   // scorched round it
    totalEmissiveRadiance += vec3(0.8, 0.22, 0.04) * gK * gP * (0.55 + 0.45 * sin(uTime * 1.4 + vGP.x * 0.7 + vGP.y * 0.4));
  }
  diffuseColor.rgb *= gC;
#endif`;

function groundMaterial(map, mode, shared, rep, grade, extra = {}) {
  const m = new THREE.MeshLambertMaterial({ map, vertexColors: true });
  m.defines = { GND_MODE: mode, MAPN: N, WATER: T.WATER, GND_KIND: extra.kind ?? -1, GND_GRIT: extra.grit ?? 0 };
  if (mode >= 0 && mode <= 2) Object.assign(m, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const u = { uRep: rep, uGrade: { value: new THREE.Vector4(grade.sat, grade.val, grade.dry, grade.tone) }, uTint: { value: new THREE.Vector3(...grade.tint) },
    uFx: { value: new THREE.Vector4(grade.sparkle, grade.ember, grade.anti, 0) } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_HEAD).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_BODY);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_HEAD).replace('#include <map_fragment>', FRAG_MAP);
  };
  m.customProgramCacheKey = () => `gnd${mode}|${extra.kind ?? -1}|${extra.grit ?? 0}`;
  return m;
}

// A heap of triangles going into one mesh: quads of four corners [x, y, z, u, v], a shade per corner, and aGnd.
class Heap {
  constructor(field = true) { this.p = []; this.u = []; this.c = []; this.g = field ? [] : null; this.n = []; }
  quad(vs, sh, nrm, gnd) {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const v = vs[k];
      this.p.push(v[0], v[1], v[2]); this.u.push(v[3], v[4]); this.n.push(nrm[0], nrm[1], nrm[2]);
      this.c.push(sh[k], sh[k], sh[k]);
      if (this.g) this.g.push(gnd[0], gnd[1], gnd[2], gnd[3]);
    }
  }
  mesh(material, order = 0) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.g) g.setAttribute('aGnd', new THREE.Float32BufferAttribute(this.g, 4));
    const m = new THREE.Mesh(g, material);
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.renderOrder = order;
    return m;
  }
}

// The maps the field is read from: the tiles (kind, level, land), how far the wander may reach (held back near
// paving), and for each pair of kinds the grit, rim and band along their join.
function fieldMaps(w, vis) {
  const map = new Uint8Array(N * N * 4), amp = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) { map[i * 4] = vis[i]; map[i * 4 + 1] = w.h[i]; map[i * 4 + 2] = w.region[i]; }
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    let near = false;
    for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1; dx++) if (w.inMap(x + dx, z + dz) && PAVED.has(vis[w.I(x + dx, z + dz)])) { near = true; break; }
    amp[w.I(x, z)] = near ? 70 : 255;
  }
  const tex = (data, fmt, filter) => {
    const t = new THREE.DataTexture(data, N, N, fmt);
    t.magFilter = t.minFilter = filter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  };
  // the water's colours, deep and at the bed, by land: each tile takes those of the water within three tiles, so a
  // pool that crosses from one land to the next changes colour across it, not at a tile's edge
  const deep = new Uint8Array(N * N * 4), bed = new Uint8Array(N * N * 4);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const sum = [0, 0, 0, 0, 0, 0, 0];
    let tot = 0;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      if (!w.inMap(x + dx, z + dz)) continue;
      const j = w.I(x + dx, z + dz), c = WATER_COL[Math.min(w.region[j], 4)], k = (vis[j] === T.WATER ? 1 : 0.02) / (1 + dx * dx + dz * dz);
      for (let q = 0; q < 7; q++) sum[q] += c[q] * k;
      tot += k;
    }
    const i = w.I(x, z), byte = (v) => Math.round(Math.min(Math.max(v / tot, 0), 1) * 255);
    for (let q = 0; q < 3; q++) { deep[i * 4 + q] = byte(sum[q]); bed[i * 4 + q] = byte(sum[q + 3]); }
    deep[i * 4 + 3] = byte(sum[6]); bed[i * 4 + 3] = 255;
  }
  const pair = new Uint8Array(32 * 32 * 4);
  for (let a = 0; a < 32; a++) for (let b = a + 1; b < 32; b++) {
    if (FAM[a] == null || FAM[b] == null) continue;
    const [g, rim, wide, dense] = joinOf(a, b), k = (b * 32 + a) * 4;     // texel (min, max): x the lower kind, y the higher
    pair[k] = g ? GRIT_ID[g] : 0; pair[k + 1] = Math.round(rim * 255); pair[k + 2] = Math.round(Math.min(wide / 2, 1) * 255);
    pair[k + 3] = Math.round(dense * 255);
  }
  const pt = new THREE.DataTexture(pair, 32, 32, THREE.RGBAFormat);
  pt.magFilter = pt.minFilter = THREE.NearestFilter; pt.generateMipmaps = false; pt.needsUpdate = true;
  const soft = new Float32Array(32).fill(0.06);
  for (const t in SOFT) soft[t] = SOFT[t];
  return { uMap: { value: tex(map, THREE.RGBAFormat, THREE.NearestFilter) }, uAmp: { value: tex(amp, THREE.RedFormat, THREE.LinearFilter) },
    uPair: { value: pt }, uSoft: { value: soft },
    uWDeep: { value: tex(deep, THREE.RGBAFormat, THREE.LinearFilter) }, uWBed: { value: tex(bed, THREE.RGBAFormat, THREE.LinearFilter) } };
}

// Builds the ground into r.scene. `shared` holds uNoise and uTime. Returns what the frame loop needs: the textures still
// waiting for their size (`pending`), and the types as drawn (`vis`, for the scatter).
export function buildGround(r, shared) {
  const w = r.world, vis = feather(w), H = w.h;
  const wet = (i) => vis[i] === T.WATER;
  const top = (i) => H[i] * STEP - (wet(i) ? SUNK : 0);
  const at = (x, z) => (w.inMap(x, z) ? w.I(x, z) : -1);
  const fshared = { ...shared, ...fieldMaps(w, vis) };

  // each texture's repeat, set once its picture is in and its shape known
  const reps = new Map(), pending = [];
  const repOf = (path, span) => {
    const key = path + '@' + span;
    if (!reps.has(key)) {
      const rep = { value: new THREE.Vector2(1 / span, 1 / span) }, tex = r.tex(path);
      reps.set(key, rep);
      pending.push({ tex, rep, span });
    }
    return reps.get(key);
  };
  const mats = {};
  const matFor = (key, path, span, mode, extra) => (mats[key] ||= groundMaterial(r.tex(path), mode, fshared, repOf(path, span), gradeOf(path), extra));

  // a corner's shade: darker under anything that rises over it
  const corner = (x, z, cx, cz) => {
    const i = w.I(x, z), y = top(i);
    let k = 1;
    for (const [dx, dz] of [[cx, 0], [0, cz], [cx, cz]]) {
      const j = at(x + dx, z + dz);
      if (j < 0) continue;
      const dh = top(j) - y;
      if (dh > 0.1) k = Math.min(k, 1 - Math.min(dh, 1.6) * 0.2);
    }
    return k;
  };

  const tops = {}, waters = new Heap(), sides = {}, blends = {}, grits = {}, lips = {};
  const heap = (set, key, field = true) => (set[key] ||= new Heap(field));
  const NRM_UP = [0, 1, 0];
  const flat = (x, z, y) => [[x - 0.5, y, z - 0.5, x - 0.5, z - 0.5], [x - 0.5, y, z + 0.5, x - 0.5, z + 0.5], [x + 0.5, y, z + 0.5, x + 0.5, z + 0.5], [x + 0.5, y, z - 0.5, x + 0.5, z - 0.5]];
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const i = w.I(x, z), t = vis[i], y = top(i), lvl = H[i], reg = w.region[i];
    const x0 = x - 0.5, x1 = x + 0.5, z0 = z - 0.5, z1 = z + 0.5;
    // the faint checker that lets you count tiles, and raised ground a shade lighter so its height reads
    const s = 0.93 * (((x + z) & 1) ? 0.965 : 1) * (1 + 0.05 * Math.min(lvl, 4));
    const sh = [s * corner(x, z, -1, -1), s * corner(x, z, -1, 1), s * corner(x, z, 1, 1), s * corner(x, z, 1, -1)];
    // the kinds of land within two tiles on this level (the field's wander reaches that far), and the water
    const land = new Map();
    let water = false;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const j = at(x + dx, z + dz);
      if (j < 0 || H[j] !== lvl) continue;
      if (wet(j)) { water = true; continue; }
      land.set(vis[j], (land.get(vis[j]) || 0) + (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 ? 3 : 1));
    }
    // drop edges (N E S W) for the crumbling lip
    let edge = 0;
    for (const [bit, dx, dz] of [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]]) {
      const j = at(x + dx, z + dz);
      if (j >= 0 && H[j] < lvl) edge |= bit;
    }
    const gnd = [x, z, lvl, edge];

    // the top: on water the water, with the land reaching out over it where there's land near; on land its own kind,
    // with the water carried under it where a shore may cut into it
    let base = t;
    if (wet(i)) {
      waters.quad(flat(x, z, y), [1, 1, 1, 1], NRM_UP, gnd);
      if (!land.size) base = null;
      else base = [...land].sort((a, b) => b[1] - a[1])[0][0];
      if (base != null) heap(tops, base).quad(flat(x, z, lvl * STEP), [s, s, s, s], NRM_UP, gnd);
    } else {
      heap(tops, t).quad(flat(x, z, y), sh, NRM_UP, gnd);
      if (water) waters.quad(flat(x, z, y - SUNK), [1, 1, 1, 1], NRM_UP, gnd);
    }

    // the cliff faces the camera sees: rock, darker toward their feet, with a lit edge along the top
    const side = faceOf(t, reg);
    const jx = at(x + 1, z), jz = at(x, z + 1);
    const lower = (j) => (j >= 0 && !(wet(j) && H[j] === lvl) ? Math.min(top(j), y) : y);   // no wall down to a pool on the level
    const hx = lower(jx), hz = lower(jz);
    const foot = (hh) => (y - hh > 0.6 ? 0.62 : 0.76), fk = side === T.BASALT ? 0.7 : 1;   // basalt's faces a step under its tops
    const face = (hh, k, vs) => {
      const yb = Math.max(hh, y - 0.11);
      // the top's own ground turned down over the edge (turf, sand, snow), then the face proper
      heap(sides, t, false).quad(vs(y, yb), [s * k * 1.05, s * k * 0.85, s * k * 0.85, s * k * 1.05], k > 0.7 ? [0, 0, 1] : [1, 0, 0]);
      if (yb > hh) heap(sides, side, false).quad(vs(yb, hh), [s * k, s * k * foot(hh), s * k * foot(hh), s * k], k > 0.7 ? [0, 0, 1] : [1, 0, 0]);
    };
    if (!wet(i) && hx < y - 0.01) face(hx, 0.62 * fk, (ya, yb) => [[x1, ya, z1, z1, ya], [x1, yb, z1, z1, yb], [x1, yb, z0, z0, yb], [x1, ya, z0, z0, ya]]);
    if (!wet(i) && hz < y - 0.01) face(hz, 0.8 * fk, (ya, yb) => [[x0, ya, z1, x0, ya], [x0, yb, z1, x0, yb], [x1, yb, z1, x1, yb], [x1, ya, z1, x1, ya]]);

    if (base == null) continue;
    // a layer for each other kind near, in kind order; this tile's own kind again only if a lower kind is near
    const kinds = [...land.keys()], lowest = Math.min(...kinds);
    for (const k of kinds) if (k !== base || lowest < base) heap(blends, k).quad(flat(x, z, lvl * STEP), sh, NRM_UP, gnd);
    // grit for every pair of kinds near that has one along its join
    const gs = new Set();
    for (let a = 0; a < kinds.length; a++) for (let b = a + 1; b < kinds.length; b++) { const g = joinOf(kinds[a], kinds[b])[0]; if (g) gs.add(g); }
    for (const g of gs) heap(grits, g).quad(flat(x, z, lvl * STEP), sh, NRM_UP, gnd);
    // a shore takes pebbles, or reed litter in the Fen (a drop's edge keeps the top's own ground, with the scatter's
    // rocks along it)
    if (water) heap(lips, reg === 3 ? 'litter' : 'pebbles').quad(flat(x, z, lvl * STEP), sh, NRM_UP, [x, z, lvl, 0]);
  }

  for (const t in tops) r.scene.add(tops[t].mesh(matFor('top' + t, GROUND_TEX[t], SPAN(+t), -1, { kind: +t })));
  r.scene.add(waters.mesh(matFor('water', GROUND_TEX[T.WATER], SPAN(T.WATER), 3)));
  for (const t in sides) r.scene.add(sides[t].mesh(matFor('side' + t, GROUND_TEX[t], 2.5, 4)));
  // the layers go down after everything solid, the kinds in their order, then the grit, then the crumbling edges
  for (const t in blends) r.scene.add(blends[t].mesh(matFor('blend' + t, GROUND_TEX[t], SPAN(+t), 0, { kind: +t }), -60 + +t));
  for (const g in grits) r.scene.add(grits[g].mesh(matFor('grit' + g, GRIT[g][0], GRIT[g][1], 1, { grit: GRIT_ID[g] }), -30));
  for (const g in lips) r.scene.add(lips[g].mesh(matFor('lip' + g, GRIT[g][0], GRIT[g][1], 2), -28));

  // the dark beyond the map's edge
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(N * 3, N * 3), new THREE.MeshBasicMaterial({ color: 0x07060a }));
  skirt.rotation.x = -Math.PI / 2; skirt.position.set(N / 2, -1, N / 2);   // below the pools
  r.scene.add(skirt);
  return { vis, pending };
}

// Each frame until they're all in: a texture whose picture has come gets its repeat from its shape.
export function settleRepeats(pending) {
  for (let k = pending.length - 1; k >= 0; k--) {
    const { tex, rep, span } = pending[k], im = tex.image;
    if (!im || !im.width) continue;
    rep.value.set(im.height / im.width / span, 1 / span);
    pending.splice(k, 1);
  }
}
