// Draws the world: an orthographic camera looking down the (+x,+z) diagonal, Final Fantasy Tactics style.
// Screen: -z is up-right, +x is down-right, +z is down-left, -x is up-left.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { N, T, STEP } from './map.js';
import { rng32, vnoise, clamp } from '../core/util.js';
import { label, mat } from '../gfx/models.js';
import { Edges } from '../gfx/outline.js';

const CAM = new THREE.Vector3(20, 16.5, 20);  // the camera's offset from what it looks at
const RISE = CAM.y / CAM.x;                    // how fast a ray toward the camera climbs per tile of x and z

const CRYPT_SIDE = 100;                         // (not a tile: the face of the crypt's dais where it steps down)
const DESERT = 'desert/Desert_Fantasy_Textures/';
const GROUND_TEX = {
  [T.GRASS1]: 'tex/grass_1_c.webp', [T.GRASS2]: 'tex/grass_2_c.webp', [T.GRASS3]: 'tex/grass_3_c.webp',
  [T.PINE]: 'tex/pinefloor_1_c.webp', [T.DIRT]: 'tex/dirt_1_c.webp', [T.ROAD]: 'tex/road_1_c.webp',
  [T.FLAGS]: 'tex/flags_c.webp', [T.MOSS]: 'tex/moss_1_c.webp', [T.ROCK]: 'tex/granite_1_c.webp',
  // the lands past the pines: bm's snow, frost, fen, ash and basalt, and its desert packs
  [T.SNOW]: 'tex/snow_1_c.webp', [T.ICE]: 'tex/frost_1_c.webp', [T.SNOWROCK]: 'tex/snowrock_1_c.webp',
  [T.SAND]: DESERT + '03_red_desert_sand.png', [T.CLAY]: DESERT + '06_cracked_clay.png', [T.REDROCK]: DESERT + '09_red_canyon_rock.png',
  [T.OASIS]: 'desert/Desert_Oasis_20_Textures/06_oasis_grass.png', [T.WATER]: 'desert/Desert_Oasis_20_Textures/17_deep_teal_water.png',
  [T.FEN]: 'tex/fen_1_c.webp', [T.ASH]: 'tex/ash_1_c.webp', [T.BASALT]: 'tex/basalt_1_c.webp', [T.RUST]: 'tex/rust_1_c.webp',
  [T.RUIN]: DESERT + '12_ruined_flagstones.png',
  [T.CRYPT]: 'tex/crypt/cata_floor_c.webp', [T.DAIS]: 'tex/crypt/cata_floor4_c.webp', [T.GRAVE]: 'tex/crypt/cata_earth_c.webp',
  [CRYPT_SIDE]: 'tex/crypt/cata_block_c.webp',
};
// bm's catacomb textures are square and about three tiles across; the rest are 7:4
const SQUARE = new Set([T.CRYPT, T.DAIS, T.GRAVE, CRYPT_SIDE]);

// The crypt's stone and bone (bm's catacomb textures, assets/tex/crypt), and how many tiles one repeat covers.
const CRYPT_MAT = {
  wall: ['cata_wall', 2.4], wall3: ['cata_wall3', 2.4], niches: ['niches', 2.4], skulls: ['skulls', 1.3], skulls2: ['skulls2', 1.2],
  femurs: ['femurs', 1.1], block: ['cata_block', 2.2], slab: ['cata_roof', 1.8], rubble: ['cata_rubble', 1.6], bones: ['cata_bones', 1.4],
};

// bm's props (assets/props) come as metal-and-roughness surfaces; here they are lit like everything else, a plain
// Lambert surface over their colour map, since metal needs reflections this scene hasn't got.
const matted = new Map();
function matte(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const src = o.material;
    if (!matted.has(src)) matted.set(src, new THREE.MeshLambertMaterial({ map: src.map, normalMap: src.normalMap, side: src.side }));
    o.material = matted.get(src);
  });
}
// The scenery's own models (assets/props/<key>.glb, docs/MODELS.md): each loaded once, as one geometry with a group
// per material (a tree's trunk, then its crown), on plain Lambert surfaces, with its size. Null if it can't be had.
const propCache = new Map();
function loadProp(key) {
  if (!propCache.has(key)) propCache.set(key, new GLTFLoader().loadAsync(`assets/props/${key}.glb`).then((gltf) => {
    const parts = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) parts.push(o); });
    parts.sort((a, b) => /trunk/.test(b.material.name) - /trunk/.test(a.material.name));
    const geos = parts.map((o) => o.geometry.clone().applyMatrix4(o.matrixWorld));
    const geo = geos.length > 1 ? mergeGeometries(geos, true) : geos[0];
    if (!geo.groups.length) geo.addGroup(0, (geo.index || geo.attributes.position).count, 0);
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    const mats = parts.map((o) => new THREE.MeshLambertMaterial({ map: o.material.map, name: o.material.name }));
    return { geo, mats, size: geo.boundingBox.getSize(new THREE.Vector3()) };
  }).catch((e) => { console.warn('no model for', key, e); return null; }));
  return propCache.get(key);
}
// which rock a tile's cliff faces wear
const SIDE = { [T.ROCK]: T.ROCK, [T.MOSS]: T.ROCK, [T.SNOW]: T.SNOWROCK, [T.SNOWROCK]: T.SNOWROCK, [T.ICE]: T.SNOWROCK,
  [T.SAND]: T.REDROCK, [T.CLAY]: T.REDROCK, [T.REDROCK]: T.REDROCK, [T.ASH]: T.BASALT, [T.BASALT]: T.BASALT, [T.DAIS]: CRYPT_SIDE };
const SUNK = 0.28;   // how far water lies below its banks

export class Renderer {
  constructor(canvas, world) {
    this.world = world;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07060a);
    this.zoom = 11; // world units of height on screen
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.target = new THREE.Vector3(world.start.x, 0, world.start.z);
    this.loader = new THREE.TextureLoader();
    this.texCache = new Map();
    this.faders = [];     // trees and buildings that go see-through when someone stands behind them
    this.units = new THREE.Group();
    this.scene.add(this.units);
    this.edges = new Edges(this);   // the party's and the dead's edge light, outline and ring (gfx/outline.js)

    // Light: a cold bruise-coloured sky, one warm low sun.
    this.scene.add(new THREE.HemisphereLight(0x8fa0c8, 0x2a2018, 1.15));
    const sun = new THREE.DirectionalLight(0xffe0b0, 1.5);
    sun.position.set(8, 14, 3);
    this.scene.add(sun);
    // a cold light from behind and to the left, so figures get an edge against the dark ground
    const rim = new THREE.DirectionalLight(0x9fb4d4, 0.9);
    rim.position.set(-8, 7, -6);
    this.scene.add(rim);

    this.buildGround();
    this.buildTrees();
    this.buildTown();
    this.buildCrypt();
    this.buildChests();
    this.buildHighlights();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  tex(path, repeat = true) {
    if (!this.texCache.has(path)) {
      const t = this.loader.load('assets/' + path);
      t.colorSpace = THREE.SRGBColorSpace;
      if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
      this.texCache.set(path, t);
    }
    return this.texCache.get(path);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.gl.setSize(w, h, false);
    const a = w / h, z = this.zoom * (a < 1 ? 1.25 : 1);
    this.cam.left = -z * a / 2; this.cam.right = z * a / 2; this.cam.top = z / 2; this.cam.bottom = -z / 2;
    this.cam.updateProjectionMatrix();
  }
  setZoom(z) { this.zoom = clamp(z, 6, 22); this.resize(); }

  // ---- ground: one mesh per texture, tops plus the two cliff faces the camera can see ----
  buildGround() {
    const w = this.world, buckets = {};
    const push = (t, verts, shade) => {
      const b = (buckets[t] ||= { p: [], u: [], c: [], n: [] });
      for (const v of verts) { b.p.push(v[0], v[1], v[2]); b.u.push(v[3], v[4]); b.c.push(shade, shade, shade); b.n.push(v[5], v[6], v[7]); }
    };
    const top = (x, z) => { const i = w.I(x, z); return w.h[i] * STEP - (w.type[i] === T.WATER ? SUNK : 0); };
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const i = w.I(x, z), t = w.type[i], y = top(x, z);
      // the 7:4 textures are kept square on the ground; the crypt's square ones span three tiles
      const U = SQUARE.has(t) ? 1 / 3 : 1 / 7, V = SQUARE.has(t) ? 1 / 3 : 1 / 4;
      const s = 0.86 + 0.14 * vnoise(x * 0.9, z * 0.9, 77) - (((x + z) & 1) ? 0.035 : 0);
      const x0 = x - 0.5, x1 = x + 0.5, z0 = z - 0.5, z1 = z + 0.5;
      const q = (a, b, c, d) => [a, b, c, a, c, d];
      push(t, q([x0, y, z0, x0 * U, z0 * V, 0, 1, 0], [x0, y, z1, x0 * U, z1 * V, 0, 1, 0], [x1, y, z1, x1 * U, z1 * V, 0, 1, 0], [x1, y, z0, x1 * U, z0 * V, 0, 1, 0]), s);
      const side = SIDE[t] ?? T.DIRT;
      const sq = SQUARE.has(side), su = sq ? 0.5 : 1 / 4, sx = sq ? 0.5 : 1 / 7, sy = sq ? 0.5 : 1;
      const hx = x + 1 < N ? top(x + 1, z) : y, hz = z + 1 < N ? top(x, z + 1) : y;
      if (hx < y) push(side, q([x1, y, z1, z1 * su, y * sy, 1, 0, 0], [x1, hx, z1, z1 * su, hx * sy, 1, 0, 0], [x1, hx, z0, z0 * su, hx * sy, 1, 0, 0], [x1, y, z0, z0 * su, y * sy, 1, 0, 0]), s * 0.62);
      if (hz < y) push(side, q([x0, y, z1, x0 * sx, y * sy, 0, 0, 1], [x0, hz, z1, x0 * sx, hz * sy, 0, 0, 1], [x1, hz, z1, x1 * sx, hz * sy, 0, 0, 1], [x1, y, z1, x1 * sx, y * sy, 0, 0, 1]), s * 0.8);
    }
    for (const t in buckets) {
      const b = buckets[t], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: this.tex(GROUND_TEX[t]), vertexColors: true }));
      m.frustumCulled = false; m.matrixAutoUpdate = false;
      this.scene.add(m);
    }
    // the dark beyond the map's edge
    const skirt = new THREE.Mesh(new THREE.PlaneGeometry(N * 3, N * 3), new THREE.MeshBasicMaterial({ color: 0x07060a }));
    skirt.rotation.x = -Math.PI / 2; skirt.position.set(N / 2, -0.05, N / 2);
    this.scene.add(skirt);
  }

  // ---- trees: a trunk and a crown, wearing bm's bark, oak leaf and pine needle textures ----
  buildTrees() {
    const r = rng32(99);
    const solid = (path) => new THREE.MeshLambertMaterial({ map: this.tex(path) });
    const ghost = (path) => new THREE.MeshLambertMaterial({ map: this.tex(path), transparent: true, opacity: 0.2 });
    const barkO = 'tex/bark_c.webp', barkP = 'tex/pine_bark_c.webp';
    const leaves = ['trees/oak_leaves_1.webp', 'trees/oak_leaves_2.webp', 'trees/oak_leaves_3.webp', 'trees/oak_leaves_4.webp'];
    const needles = ['tex/pine_c.webp', 'trees/pine_needles_2.webp', 'tex/pine_3_c.webp', 'trees/pine_needles_4.webp'];
    const M = { solid: {}, ghost: {} };
    const none = new THREE.MeshBasicMaterial({ visible: false });
    // the trees of the other lands: [shape, bark, crown]. A bare tree's crown is its own boughs.
    const OASIS = 'desert/Desert_Oasis_20_Textures/';
    const KIND = {
      pine: ['pine', barkP, null], oak: ['oak', barkO, null],
      snowpine: ['pine', 'tex/pine_bark_3_c.webp', 'tex/snow_1_c.webp'],
      dead: ['bare', 'tex/bark_3_c.webp', 'tex/bark_3_c.webp'],
      char: ['bare', 'tex/basalt_1_c.webp', 'tex/ash_1_c.webp'],
      palm: ['palm', OASIS + '01_date_palm_bark.png', OASIS + '03_palm_leaf_green.png'],
    };
    for (const p of [barkO, barkP, ...leaves, ...needles, ...Object.values(KIND).flatMap((k) => k.slice(1)).filter(Boolean)]) { M.solid[p] ||= solid(p); M.ghost[p] ||= ghost(p); }

    // a handful of shapes per kind and size, shared between trees
    const shapes = {}, SIZE_R = [0, 0.62, 1.25, 1.95], SIZE_H = [0, 3.0, 4.8, 7.0];
    const shape = (kind, size, v) => {
      const key = kind + size + v;
      if (shapes[key]) return shapes[key];
      const R = SIZE_R[size], H = SIZE_H[size];
      const crown = [];
      let trunk;
      if (kind === 'pine') {
        trunk = new THREE.CylinderGeometry(R * 0.1, R * 0.2, H * 0.5, 7).translate(0, H * 0.25, 0);
        const tiers = 3 + size;
        for (let k = 0; k < tiers; k++) {
          const f = k / tiers, rad = R * (1 - f * 0.72), hh = H * 0.36;
          crown.push(new THREE.ConeGeometry(rad, hh, 9).translate(0, H * (0.3 + f * 0.62) + hh * 0.2, 0));
        }
      } else if (kind === 'bare') {
        trunk = new THREE.CylinderGeometry(R * 0.07, R * 0.22, H * 0.7, 6).translate(0, H * 0.35, 0);
        for (let k = 0; k < 2 + size; k++) {
          const a = (k / (2 + size)) * 6.28 + r(), len = H * (0.22 + r() * 0.14);
          crown.push(new THREE.CylinderGeometry(R * 0.02, R * 0.07, len, 5).translate(0, len / 2, 0).rotateZ(0.7 + r() * 0.5).rotateY(a).translate(0, H * (0.36 + r() * 0.26), 0));
        }
      } else if (kind === 'palm') {
        const PH = H * 1.25;
        trunk = new THREE.CylinderGeometry(R * 0.1, R * 0.16, PH, 6).translate(0, PH / 2, 0);
        for (let k = 0; k < 7; k++) crown.push(new THREE.ConeGeometry(R * 0.3, R * 1.9, 4).scale(1, 1, 0.25).translate(0, R * 0.95, 0).rotateZ(1.25 + r() * 0.3).rotateY((k / 7) * 6.28).translate(0, PH, 0));
      } else {
        trunk = new THREE.CylinderGeometry(R * 0.14, R * 0.26, H * 0.55, 7).translate(0, H * 0.275, 0);
        const blobs = 3 + size * 2;
        for (let k = 0; k < blobs; k++) {
          const a = (k / blobs) * 6.28 + r(), d = k === 0 ? 0 : R * (0.35 + r() * 0.3), rad = R * (0.55 + r() * 0.3);
          const gm = new THREE.IcosahedronGeometry(rad, 1);
          gm.scale(1, 0.8, 1).translate(Math.cos(a) * d, H * (0.62 + r() * 0.22), Math.sin(a) * d);
          crown.push(gm);
        }
      }
      const flat = (g) => (g.index ? g.toNonIndexed() : g);
      const geo = mergeGeometries([flat(trunk), mergeGeometries(crown.map(flat))], true);
      return (shapes[key] = { geo, R, H });
    };
    const live = { pine: [], oak: [], snowpine: [], dead: [], char: [], palm: [] };   // the trees that take their models when those come
    for (const t of this.world.trees) {
      const K = KIND[t.kind] || KIND.oak;
      const s = shape(K[0], t.size, t.v % 3);
      const bark = K[1], leaf = K[2] || (K[0] === 'pine' ? needles : leaves)[t.v];
      const wear = { solid: [M.solid[bark], M.solid[leaf]], ghost: [M.ghost[bark], M.ghost[leaf]] };
      const m = new THREE.Mesh(s.geo, wear.solid);
      const c = (t.size - 1) / 2;
      m.position.set(t.x + c, 0, t.z + c);
      m.rotation.y = t.rot; m.scale.set(1, t.tall, 1);
      m.updateMatrix(); m.matrixAutoUpdate = false;
      this.scene.add(m);
      // hide(true) takes the crown away altogether: a fight has to be readable
      const f = { tree: true, x: t.x + c, z: t.z + c, r: K[0] === 'bare' ? s.R * 0.3 : s.R, h: s.H * t.tall, on: 0,
        show: () => { m.material = wear.solid; }, hide: (hard) => { m.material = [wear.ghost[0], hard ? none : wear.ghost[1]]; } };
      this.faders.push(f);
      if (live[t.kind]) live[t.kind].push({ t, m, f, wear });
    }
    // the tree models: as tall as the shapes they stand in for (an oak or a bare tree a little less, being broad; a
    // palm more), each tree's crown one of four greens (the pine's needles are frosted at the tips; these take the
    // frost off), the snow, the bare boughs and the ash only a shade warmer or cooler. A bare tree hides only its trunk.
    const GREENS = { oak: [0xffffff, 0xe2ead4, 0xd2e0da, 0xf0e6cc], pine: [0xb8d4a0, 0xaccaa8, 0xc4d6a4, 0xa8c49c],
      snowpine: [0xffffff, 0xeef2f6, 0xe4eaf0, 0xf4f4ee], dead: [0xffffff, 0xece6dc, 0xe2e2e2, 0xf0ece4],
      char: [0xffffff, 0xe8e0dc, 0xdcdcdc, 0xf0e8e0], palm: [0xffffff, 0xe6eed8, 0xf0ecd4, 0xdce6d6] };
    const PROP = { dead: 'dead_tree', char: 'char_tree' }, UP = { oak: 0.8, dead: 0.85, char: 0.85, palm: 1.2 };
    for (const kind in live) if (live[kind].length) loadProp(PROP[kind] || kind).then((p) => {
      if (!p) return;
      const up = UP[kind] || 1, wide = Math.max(p.size.x, p.size.z) / 2 * (KIND[kind][0] === 'bare' ? 0.4 : 1);
      const wears = GREENS[kind].map((hex) => {
        const solid = p.mats.map((x, k) => { const n = x.clone(); if (k) n.color.setHex(hex); return n; });
        return { solid, ghost: solid.map((x) => { const n = x.clone(); n.transparent = true; n.opacity = 0.2; return n; }) };
      });
      for (const { t, m, f, wear } of live[kind]) {
        const k = SIZE_H[t.size] * up * t.tall / p.size.y;
        Object.assign(wear, wears[t.v % 4]);
        m.geometry = p.geo; m.scale.setScalar(k); m.updateMatrix();
        f.r = wide * k * 0.9; f.h = p.size.y * k;
        if (f.on) f.hide(f.on === 2); else f.show();
      }
    });
  }

  // ---- Herrington Hollow: a cottage or a townhouse for each building (its `look`), the inn and the forge their own;
  // a wide plot of townhouses takes two with their doors toward the middle; without the models, walls, roofs and
  // doors from bm's building textures ----
  buildTown() {
    const w = this.world;
    const DOOR_AT = { townhouse: -0.95, cottage: 0.44, shophouse: 0, cottage_2: -0.32, inn: 0, forge: 0 };   // each model's door, from its middle along x
    const TINTS = [0xffffff, 0xf2e6d6, 0xe2e6ee, 0xeee2cc, 0xe6eadc, 0xf6ece6];
    const ghostOf = (m) => { const c = m.clone(); c.transparent = true; c.opacity = 0.25; c.depthWrite = false; return c; };
    w.buildings.forEach((b, n) => {
      const H = 2.7, cx = b.x + (b.w - 1) / 2, cz = b.z + (b.d - 1) / 2;
      const sign = label(b.name, { size: 40, color: '#ffe2a0' });
      sign.position.set(b.doorX, H + 2.3, b.z + b.d - 0.5);
      const g = new THREE.Group(), meshes = [], solidM = [], ghostM = [];
      this.scene.add(g, sign);
      const fd = { x: cx, z: cz, r: Math.max(b.w, b.d) / 2 + 0.3, rx: b.w / 2, rz: b.d / 2, h: H + 1.7, on: 0,
        show: () => meshes.forEach((m, i) => { m.material = solidM[i]; }), hide: () => meshes.forEach((m, i) => { m.material = ghostM[i]; }) };
      this.faders.push(fd);
      const wear = (m, solid) => { g.add(m); meshes.push(m); solidM.push(solid); ghostM.push(Array.isArray(solid) ? solid.map(ghostOf) : ghostOf(solid)); };
      const model = (p) => {
        const tint = new THREE.Color(TINTS[n % TINTS.length]);
        const solid = p.mats.map((x) => { const c = x.clone(); c.color.copy(tint); return c; });
        // a house is turned over (mirrored) every other slot, and slid along so its door comes near the front tile
        const pair = b.w > 6 && p.size.x < b.w / 2;
        const homes = pair ? [[cx - 2.5, -1], [cx + 2.5, 1]] : [[cx, n % 2 ? -1 : 1]];
        for (const [hx, s] of homes) {
          const m = new THREE.Mesh(p.geo, solid);
          m.position.set(hx + (pair ? 0 : clamp(-(DOOR_AT[b.look] || 0) * s, -0.4, 0.4)), 0, cz); m.scale.set(s, 1, 1);
          wear(m, solid);
        }
        sign.position.set(b.doorX, p.size.y + 0.5, cz); fd.h = p.size.y;    // over the ridge, not off by a neighbour's
        if (fd.on) fd.hide();
      };
      if (b.look) loadProp(b.look).then((p) => (p ? model(p) : this.oldHouse(b, wear)));
      else this.oldHouse(b, wear);
    });
    // the well and the bounty board, or the old posts and stone
    const lone = (key, x, z, turn, old) => loadProp(key).then((p) => {
      if (!p) { this.scene.add(old()); return; }
      const m = new THREE.Mesh(p.geo, p.mats);
      m.position.set(x, w.y(x, z), z); m.rotation.y = turn * Math.PI / 2;
      m.updateMatrix(); m.matrixAutoUpdate = false;
      this.scene.add(m);
    });
    lone('well', w.well.x, w.well.z, 0, () => {
      const stone = this.tex('tex/stone_c.webp'), well = new THREE.Group();
      well.add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.6, 12), new THREE.MeshLambertMaterial({ map: stone })).translateY(0.3));
      well.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 12), mat(0x0a1620)).translateY(0.56));
      for (const sx of [-0.44, 0.44]) well.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat(0x5a3c24)).translateX(sx).translateY(0.75));
      well.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.7), mat(0x3a2416)).translateY(1.55));
      well.position.set(w.well.x, 0, w.well.z);
      return well;
    });
    lone('bounty_board', w.board.x, w.board.z, 0, () => {
      const board = new THREE.Group();
      for (const sx of [-0.4, 0.4]) board.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat(0x5a3c24)).translateX(sx).translateY(0.75));
      board.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.06), new THREE.MeshLambertMaterial({ map: this.tex('tex/wood_c.webp') })).translateY(1.15));
      for (const [px, py] of [[-0.25, 1.25], [0.1, 1.1], [0.28, 1.3]]) board.add(new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), mat(0xd8c8a0)).translateX(px).translateY(py).translateZ(0.04));
      board.position.set(w.board.x, 0, w.board.z);
      return board;
    });
    const bl = label('Bounties', { size: 36, color: '#ffe2a0' }); bl.position.set(w.board.x, 2.6, w.board.z);
    this.scene.add(bl);
    // the market stalls, signposts, fences and stone walls (w.decor): one instanced mesh a kind
    const kinds = {}, at = new THREE.Matrix4();
    for (const d of w.decor || []) (kinds[d.kind] ||= []).push(d);
    for (const kind in kinds) loadProp(kind).then((p) => {
      if (!p) return;
      const list = kinds[kind], im = new THREE.InstancedMesh(p.geo, p.mats, list.length);
      list.forEach((d, k) => {
        at.makeRotationY(d.turn * Math.PI / 2).setPosition(d.x, w.y(Math.round(d.x), Math.round(d.z)), d.z);
        im.setMatrixAt(k, at);
      });
      im.computeBoundingSphere();
      this.scene.add(im);
    });
    this.buildRuins();
  }

  // The old house: a box of walls, a gable roof and a door, from bm's building textures, worn through `wear`.
  oldHouse(b, wear) {
    const H = 2.7, cx = b.x + (b.w - 1) / 2, cz = b.z + (b.d - 1) / 2;
    const wallT = this.tex(`tex/${b.wall}_c.webp`).clone(); wallT.repeat.set(b.w / 6, 0.7); wallT.needsUpdate = true;
    const roofT = this.tex(`tex/${b.roof}_c.webp`).clone(); roofT.repeat.set(b.w / 5, 1); roofT.needsUpdate = true;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.2, H, b.d - 0.2), new THREE.MeshLambertMaterial({ map: wallT }));
    walls.position.set(cx, H / 2, cz);
    // a gable roof: a triangular prism along x
    const hw = b.d / 2 + 0.25, hl = b.w / 2 + 0.2, rh = 1.7;
    const P = [-hl, 0, hw, hl, 0, hw, hl, rh, 0, -hl, 0, hw, hl, rh, 0, -hl, rh, 0,   // south slope
      hl, 0, -hw, -hl, 0, -hw, -hl, rh, 0, hl, 0, -hw, -hl, rh, 0, hl, rh, 0,          // north slope
      hl, 0, hw, hl, 0, -hw, hl, rh, 0, -hl, 0, -hw, -hl, 0, hw, -hl, rh, 0];          // gable ends
    const UV = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1];
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    rg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    rg.computeVertexNormals();
    const roof = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ map: roofT, side: THREE.DoubleSide }));
    roof.position.set(cx, H, cz);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), new THREE.MeshLambertMaterial({ map: this.tex(`tex/${b.door}_c.webp`, false), transparent: true, alphaTest: 0.4 }));
    door.position.set(b.doorX, 0.95, b.z + b.d - 0.59);
    for (const m of [walls, roof, door]) wear(m, m.material);
  }

  // the ruins' walls and the standing stones (w.props), one instanced mesh per land: its own broken block or stone
  // (`look`, assets/props), a block filling its tile and turned a quarter at a time, a stone as tall as it stands and
  // narrower the shorter it is; a box or a cone in the land's texture while there's no model. And the places' names.
  buildRuins() {
    const w = this.world, by = {};
    for (const p of w.props) (by[`${p.kind}|${p.tex}|${p.look || ''}`] ||= []).push(p);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), at = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (const k in by) {
      const [kind, tex, look] = k.split('|'), list = by[k], rr = rng32(7 + list.length);
      const turns = list.map(() => (kind === 'wall' ? Math.floor(rr() * 4) * Math.PI / 2 : rr() * 6.28));
      const lay = (geo, mats, size) => {
        const im = new THREE.InstancedMesh(geo, mats, list.length);
        list.forEach((p, n) => {
          size(p, sc); q.setFromAxisAngle(Y, turns[n]); at.set(p.x, w.y(p.x, p.z), p.z);
          im.setMatrixAt(n, m4.compose(at, q, sc));
        });
        im.frustumCulled = false;
        this.scene.add(im);
      };
      const old = () => lay(kind === 'wall' ? new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0) : new THREE.CylinderGeometry(0.1, 0.46, 1, 6).translate(0, 0.5, 0),
        new THREE.MeshLambertMaterial({ map: this.tex(tex) }), (p, s) => s.set(1, p.h, 1));
      if (!look) { old(); continue; }
      loadProp(look).then((m) => {
        if (!m) return old();
        const z = m.size, side = Math.max(z.x, z.z);
        lay(m.geo, m.mats, kind === 'wall' ? (p, s) => s.set(1 / z.x, p.h / z.y, 1 / z.z)
          : (p, s) => { const t = 0.92 * (0.55 + 0.45 * clamp((p.h - 1.2) / 2.4, 0, 1)) / side; s.set(t, p.h / z.y, t); });
      });
    }
    for (const p of w.places) { const l = label(p.name, { size: 40, color: '#ffe2a0' }); l.position.set(p.cx, 4.6, p.cz); this.scene.add(l); }
  }

  // ---- the old crypt: catacomb stone and bone from bm, built in simple shapes ----
  // Walls are short toward the camera (south, east) and tall at the back, where they can't stand in front of anyone.
  buildCrypt() {
    const c = this.world.crypt;
    if (!c) return;
    const r = rng32(c.x * 131 + c.z);
    const buckets = {};
    const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
    // Pours a shape into the buckets, a material per face chosen by `pick(normal)`, textured by where it stands.
    const add = (geo, m, pick, base = 0, into = buckets) => {
      const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, Nn = g.attributes.normal;
      nm.getNormalMatrix(m);
      for (let i = 0; i < P.count; i += 3) {
        n.fromBufferAttribute(Nn, i).applyMatrix3(nm).normalize();
        if (n.y < -0.7) continue;                                   // nobody sees the bottoms
        const key = typeof pick === 'string' ? pick : pick(n);
        const b = (into[key] ||= { p: [], n: [], u: [], c: [] }), S = CRYPT_MAT[key] ? CRYPT_MAT[key][1] : 1;
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        for (let k = 0; k < 3; k++) {
          v.fromBufferAttribute(P, i + k).applyMatrix4(m);
          const nk = new THREE.Vector3().fromBufferAttribute(Nn, i + k).applyMatrix3(nm).normalize();
          b.p.push(v.x, v.y, v.z); b.n.push(nk.x, nk.y, nk.z);
          if (ay >= ax && ay >= az) b.u.push(v.x / S, v.z / S); else if (ax >= az) b.u.push(v.z / S, v.y / S); else b.u.push(v.x / S, v.y / S);
          const sh = 0.6 + 0.4 * clamp((v.y - base) / 1.1, 0, 1);  // darker where it meets the ground
          b.c.push(sh, sh, sh);
        }
      }
    };
    const M = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
    const BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);   // a unit box standing on its base
    const MOUND = new THREE.IcosahedronGeometry(0.5, 1).translate(0, 0.08, 0);

    // the wall ring: tall at the back (north and west), down to knee height at the front
    for (const p of c.walls) {
      const { x, z, dx, dz } = p, R = c.r;
      const front = dz === R || dx === R, nz = vnoise(x * 0.9, z * 0.9, 31);
      let h;
      if (front) h = nz < 0.18 ? 0.18 : 0.3 + 0.5 * nz;
      else { const t = clamp((R - Math.max(dx, dz)) / 6, 0, 1); h = (0.75 + 1.25 * t) * (0.85 + 0.3 * nz); if (nz > 0.82) h *= 0.55; }
      const ew = Math.abs(dx) === R && Math.abs(dz) !== R;           // a stretch of the east or west wall
      const sx = Math.abs(dx) === R && Math.abs(dz) === R ? 0.86 : ew ? 0.8 : 1, sz = Math.abs(dx) === R && Math.abs(dz) === R ? 0.86 : ew ? 1 : 0.8;
      // the inner face of the back walls is the ossuary: niches along the north, skulls and femurs down the west
      const inner = dz === -R && !ew ? (Math.abs(dx) <= 3 ? 'niches' : 'skulls') : dx === -R ? (Math.abs(dz) % 3 === 0 ? 'femurs' : 'skulls2') : 'wall3';
      add(BOX, M(x, 0, z, 0, sx, h, sz), (nn) => {
        if (nn.y > 0.5) return h < 0.6 ? 'rubble' : 'block';
        const toward = nn.x * -Math.sign(dx || 0.0001) * (Math.abs(dx) === R ? 1 : 0) + nn.z * -Math.sign(dz || 0.0001) * (Math.abs(dz) === R ? 1 : 0);
        return toward > 0.5 ? inner : front ? 'wall3' : 'wall';
      });
      // a broken top: a block or two left lying where it fell
      if (front && nz < 0.35) add(BOX, M(x + (r() - 0.5) * 0.3, h, z + (r() - 0.5) * 0.3, r() * 3, 0.42, 0.22, 0.5), 'block', 0);
    }
    // fallen stone and turned earth round the outside, where the wall came down
    for (const p of c.rubble) {
      const bone = vnoise(p.x * 0.7, p.z * 0.7, 41) > 0.68;
      add(MOUND, M(p.x + (r() - 0.5) * 0.2, 0, p.z + (r() - 0.5) * 0.2, r() * 6, 1.5, 0.45 + r() * 0.5, 1.5), bone ? 'bones' : 'rubble');
      if (r() < 0.45) add(BOX, M(p.x + (r() - 0.5) * 0.5, 0, p.z + (r() - 0.5) * 0.5, r() * 3, 0.5, 0.3, 0.7), 'block');
    }
    // sarcophagi down the side walls; the one nearest the gate on the east has lost its lid. Boxes and slabs until the
    // model (assets/props/sarcophagus: a chest and a lid) comes, which is turned so its old wax is under the candles.
    const candles = [], sarcB = {};
    for (const s of c.sarcophagi) {
      const cz = s.z + (s.len - 1) / 2, ajar = s.x > c.x && s.z > c.z;
      add(BOX, M(s.x, 0, cz, 0, 0.82, 0.62, s.len - 0.12), (nn) => (nn.y > 0.5 ? 'void' : 'block'), 0, sarcB);
      if (ajar) add(BOX, M(s.x + 0.14, 0.62, cz + 0.22, 0.34, 0.94, 0.13, s.len - 0.02), 'slab', 0.5, sarcB);   // pushed aside from within
      else add(BOX, M(s.x, 0.62, cz, 0, 0.94, 0.13, s.len - 0.02), 'slab', 0.5, sarcB);
      candles.push([s.x, 0.75, s.z - 0.1 + (s.z < c.z ? 0 : s.len - 0.8)]);
    }
    // bones stacked the old way against the back wall: femur ends out, skulls on top
    for (const s of c.bones) {
      add(BOX, M(s.x, 0, s.z - 0.04, 0, 0.9, 0.62, 0.86), (nn) => (nn.y > 0.5 ? 'skulls2' : 'femurs'));
      add(MOUND, M(s.x, 0.6, s.z - 0.04, r() * 6, 0.82, 0.32, 0.8), 'skulls', 0.6);
      candles.push([s.x + (s.x < c.x ? 0.25 : -0.25), 0.82, s.z + 0.22]);
    }
    // the gateposts, tall and kept apart, so they can go see-through when someone stands behind them
    const postB = {};
    for (const p of c.posts) {
      add(BOX, M(p.x, 0, p.z, 0, 0.9, 2.5, 0.9), 'block', 0, postB);
      add(BOX, M(p.x, 2.5, p.z, 0, 1.06, 0.16, 1.06), 'slab', 2.0, postB);
      candles.push([p.x, 2.66, p.z]);
    }

    const crypt = new THREE.Group();
    const mats = {};
    const matFor = (key) => (mats[key] ||= key === 'void' ? new THREE.MeshLambertMaterial({ color: 0x0b0907 })
      : key === 'wax' ? new THREE.MeshLambertMaterial({ color: 0xe8dcc0, emissive: 0x4a3218 })
      : new THREE.MeshLambertMaterial({ map: this.tex(`tex/crypt/${CRYPT_MAT[key][0]}_c.webp`), vertexColors: true }));
    const meshes = (bk, into) => {
      const out = [];
      for (const key in bk) {
        const b = bk[key], g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
        g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
        const m = new THREE.Mesh(g, matFor(key));
        m.matrixAutoUpdate = false; into.add(m); out.push(m);
      }
      return out;
    };
    meshes(buckets, crypt);
    const gateG = new THREE.Group();
    const gateMeshes = meshes(postB, gateG);
    crypt.add(gateG);
    const sarcG = new THREE.Group();
    meshes(sarcB, sarcG);
    crypt.add(sarcG);
    loadProp('sarcophagus').then((p) => {
      if (!p) return;
      crypt.remove(sarcG);
      sarcG.traverse((o) => o.geometry?.dispose());
      const none = new THREE.MeshBasicMaterial({ visible: false }), lidAt = p.mats.findIndex((x) => /lid/.test(x.name));
      const chestM = p.mats.map((x, k) => (k === lidAt ? none : x)), lidM = p.mats.map((x, k) => (k === lidAt ? x : none));
      for (const s of c.sarcophagi) {
        const cz = s.z + (s.len - 1) / 2, ajar = s.x > c.x && s.z > c.z, turn = s.z < c.z ? 0 : Math.PI;
        const chest = new THREE.Mesh(p.geo, chestM), lid = new THREE.Mesh(p.geo, lidM);
        for (const m of [chest, lid]) { m.position.set(s.x, 0, cz); m.rotation.y = turn; m.scale.set(0.94 / p.size.x, 0.75 / p.size.y, (s.len - 0.1) / p.size.z); }
        if (ajar) {
          lid.position.x += 0.14; lid.position.z += 0.22; lid.rotation.y += 0.34;          // pushed aside from within
          const dark = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, (s.len - 0.1) * 0.77).translate(0, 0.34, 0), matFor('void'));
          dark.position.set(s.x, 0, cz); crypt.add(dark);                                  // and nothing to see inside but the dark
        }
        for (const m of [chest, lid]) { m.updateMatrix(); m.matrixAutoUpdate = false; crypt.add(m); }
      }
    });

    // candles: wax, a flame, and a soft glow round each cluster, and two warm lights that breathe
    const wax = [], flames = [];
    const flameM = new THREE.MeshBasicMaterial({ color: 0xffc463 });
    const glowT = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,200,120,0.9)'); gr.addColorStop(0.35, 'rgba(255,150,60,0.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    this.glows = [];
    for (const [x, y, z] of candles) {
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + r(), d = k ? 0.09 + r() * 0.05 : 0, hgt = 0.1 + r() * 0.16, rad = 0.03 + r() * 0.018;
        const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
        wax.push(new THREE.CylinderGeometry(rad, rad * 1.1, hgt, 7).translate(px, y + hgt / 2, pz));
        flames.push(new THREE.SphereGeometry(0.03, 6, 5).scale(0.8, 1.7, 0.8).translate(px, y + hgt + 0.05, pz));
      }
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.set(x, y + 0.24, z); s.scale.setScalar(0.85);
      crypt.add(s); this.glows.push({ s, ph: r() * 6.28 });
    }
    const flat = (g) => (g.index ? g.toNonIndexed() : g);
    crypt.add(new THREE.Mesh(mergeGeometries(wax.map(flat)), matFor('wax')), new THREE.Mesh(mergeGeometries(flames.map(flat)), flameM));
    this.cryptLights = [[c.x, 1.7, c.z - 4.6, 5.5], [c.x, 2.6, c.z + 0.5, 6.5]].map(([x, y, z, i]) => {
      const l = new THREE.PointLight(0xff9a4a, i, 8.5, 1.6); l.position.set(x, y, z); crypt.add(l); return { l, i, ph: r() * 6.28 };
    });
    this.flick = 0;
    this.scene.add(crypt);

    // the gate: two of bm's iron-bound doors, standing open against the outside of the wall
    const ghost = (m) => { const g2 = m.clone(); g2.transparent = true; g2.opacity = 0.25; g2.depthWrite = false; return g2; };
    const fade = { meshes: [...gateMeshes], solid: gateMeshes.map((m) => m.material) };
    fade.ghost = fade.solid.map(ghost);
    this.faders.push({ x: c.gate.x, z: c.gate.z, r: 2.6, h: 2.7, on: 0,
      show: () => fade.meshes.forEach((m, k) => { m.material = fade.solid[k]; }), hide: () => fade.meshes.forEach((m, k) => { m.material = fade.ghost[k]; }) });
    new GLTFLoader().load('assets/props/doors.glb', (gltf) => {
      const s = 1.5 / 1.54, a = 0.32;
      for (const [name, hx, ry] of [['door_iron2', c.gate.x - 1.5, Math.PI + a], ['door_iron2_r', c.gate.x + 1.5, Math.PI - a]]) {
        const src = gltf.scene.getObjectByName(name);
        if (!src) continue;
        const leaf = src.clone(); matte(leaf);
        leaf.position.set(hx, 0, c.gate.z + 0.5); leaf.rotation.y = ry; leaf.scale.setScalar(s);
        gateG.add(leaf);
        fade.meshes.push(leaf); fade.solid.push(leaf.material); fade.ghost.push(ghost(leaf.material));
      }
    });
  }

  // ---- chests: bm's chest, its lid swinging up on its hinge when opened ----
  buildChests() {
    const w = this.world;
    this.chests = {};
    for (const c of w.chests) {
      const g = new THREE.Group();
      g.position.set(c.x, w.y(c.x, c.z), c.z);
      g.rotation.y = c.crypt ? 0 : Math.PI / 4;                   // facing the camera, or the crypt's gate
      this.scene.add(g);
      this.chests[c.id] = { g, open: false, mixer: null, act: null };
    }
    new GLTFLoader().load('assets/props/chest.glb', (gltf) => {
      matte(gltf.scene);
      const clip = gltf.animations.find((a) => /lid/i.test(a.name)) || gltf.animations[0];
      for (const id in this.chests) {
        const ch = this.chests[id], obj = gltf.scene.clone(true);
        obj.scale.setScalar(0.82);
        ch.g.add(obj);
        ch.mixer = new THREE.AnimationMixer(obj);
        ch.act = ch.mixer.clipAction(clip);
        ch.act.setLoop(THREE.LoopOnce, 1); ch.act.clampWhenFinished = true; ch.act.timeScale = 1.25;
        if (ch.open) this.openChest(id, true);
      }
    }, undefined, () => {
      // no model: the old box, its lid a separate piece that tips back
      for (const id in this.chests) {
        const ch = this.chests[id];
        ch.g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.42), mat(0x5a3c24)).translateY(0.18));
        ch.lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.46), mat(0xc9a24a)).translateY(0.42);
        ch.g.add(ch.lid);
        if (ch.open) ch.lid.rotation.x = -0.9;
      }
    });
  }
  // Opens a chest's lid; `instant` leaves it standing open (a chest opened before the save was loaded).
  openChest(id, instant = false) {
    const ch = this.chests[id];
    if (!ch) return;
    ch.open = true;
    if (ch.lid) ch.lid.rotation.x = -0.9;
    if (!ch.act) return;
    ch.act.reset().play();
    if (instant) ch.mixer.update(10);
  }
  // Every chest as the save has it: open if it was opened, shut if not.
  setChests(opened = {}) {
    for (const id in this.chests) {
      const ch = this.chests[id];
      if (opened[id]) { if (!ch.open) this.openChest(id, true); continue; }
      ch.open = false;
      if (ch.lid) ch.lid.rotation.x = 0;
      if (ch.act) { ch.act.stop(); ch.mixer.update(0); }
    }
  }
  // Each frame: lids that are swinging, and the crypt's candles.
  tick(dt) {
    for (const id in this.chests) { const ch = this.chests[id]; if (ch.mixer && ch.act.isRunning()) ch.mixer.update(dt); }
    if (this.glows) {
      const t = (this.flick += dt);
      for (const g of this.glows) g.s.scale.setScalar(0.8 + 0.08 * Math.sin(t * 9 + g.ph) + 0.05 * Math.sin(t * 23 + g.ph * 2));
      for (const L of this.cryptLights) L.l.intensity = L.i * (0.88 + 0.08 * Math.sin(t * 7 + L.ph) + 0.05 * Math.sin(t * 17.3 + L.ph));
    }
  }

  // ---- tile highlights for placement, movement and aiming ----
  buildHighlights() {
    this.hl = [];
    this.hlGroup = new THREE.Group();
    this.scene.add(this.hlGroup);
    this.hlMats = {
      move: new THREE.MeshBasicMaterial({ color: 0x4f8dff, transparent: true, opacity: 0.38, depthWrite: false }),
      attack: new THREE.MeshBasicMaterial({ color: 0xd83a3a, transparent: true, opacity: 0.42, depthWrite: false }),
      place: new THREE.MeshBasicMaterial({ color: 0x4fd65a, transparent: true, opacity: 0.38, depthWrite: false }),
      aoe: new THREE.MeshBasicMaterial({ color: 0xff9a2a, transparent: true, opacity: 0.6, depthWrite: false }),
      heal: new THREE.MeshBasicMaterial({ color: 0x4fd6a0, transparent: true, opacity: 0.42, depthWrite: false }),
      bounds: new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.1, depthWrite: false }),
      danger: new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.62, depthWrite: false }),
      hazard: new THREE.MeshBasicMaterial({ color: 0xb04aff, transparent: true, opacity: 0.4, depthWrite: false }),
    };
    this.hlGeo = new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
    const ring = new THREE.RingGeometry(0.4, 0.5, 4, 1, Math.PI / 4).rotateX(-Math.PI / 2);
    this.cursor = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0xffe2a0, depthTest: false, transparent: true }));
    this.cursor.renderOrder = 10; this.cursor.visible = false;
    this.scene.add(this.cursor);
    this.turnRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd860, transparent: true, opacity: 0.9, depthWrite: false }));
    this.turnRing.visible = false;
    this.scene.add(this.turnRing);
  }
  clearHighlights(layer) {
    // (a layer whose name starts with '!' stays until it is cleared by name: a lord's marked ground, a hazard)
    this.hl = this.hl.filter((h) => { if (layer ? h.layer !== layer : h.layer[0] === '!') return true; this.hlGroup.remove(h.mesh); return false; });
  }
  highlight(tiles, kind, layer = 'main') {
    for (const t of tiles) {
      const m = new THREE.Mesh(this.hlGeo, this.hlMats[kind]);
      m.position.set(t.x, this.world.y(t.x, t.z) + (kind === 'aoe' ? 0.06 : 0.04), t.z);
      m.renderOrder = kind === 'aoe' || kind === 'danger' ? 3 : 2;
      this.hlGroup.add(m);
      this.hl.push({ mesh: m, layer });
    }
  }
  setCursor(x, z) {
    if (x == null) { this.cursor.visible = false; return; }
    this.cursor.visible = true;
    this.cursor.position.set(x, this.world.y(x, z) + 0.08, z);
  }
  setTurnRing(x, z) {
    if (x == null) { this.turnRing.visible = false; return; }
    this.turnRing.visible = true;
    this.turnRing.position.set(x, this.world.y(x, z) + 0.05, z);
  }

  // world point -> pixels
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.cam);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }
  // pixels -> the tile under them, chosen from `tiles` (or everything near the camera's target)
  pick(px, py, tiles) {
    let best = null, bd = 34 * 34 * (11 / this.zoom) * (11 / this.zoom);
    if (!tiles) {
      tiles = [];
      const cx = Math.round(this.target.x), cz = Math.round(this.target.z);
      for (let z = cz - 16; z <= cz + 16; z++) for (let x = cx - 16; x <= cx + 16; x++) if (this.world.inMap(x, z)) tiles.push({ x, z });
    }
    for (const t of tiles) {
      const p = this.project(t.x, this.world.y(t.x, t.z), t.z), d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  // Anything standing between a watched point and the camera goes see-through.
  // `field` is a battle's bounds: every tree on it loses its crown for as long as the fight lasts.
  updateFade(points, field) {
    const tx = this.target.x, tz = this.target.z;
    for (const f of this.faders) {
      let want = 0;
      if (Math.abs(f.x - tx) <= 26 && Math.abs(f.z - tz) <= 26) {
        if (field && f.tree && f.x >= field.x0 - 1 && f.x <= field.x1 + 2 && f.z >= field.z0 - 1 && f.z <= field.z1 + 2) want = 2;
        else for (const p of points) {
          const dx = f.x - p.x, dz = f.z - p.z;
          const along = (dx + dz) / 2;                    // how far toward the camera the thing is
          if (along < 0.3) continue;
          const side = Math.abs(dx - dz) / 2;             // how far off the line of sight
          if (side > f.r + 0.35) continue;
          if (along * RISE - (p.y || 0) < f.h + 0.4 && along < f.h / RISE + f.r + 1) { want = field && f.tree ? 2 : 1; break; }
        }
      }
      if (want !== f.on) { f.on = want; want ? f.hide(want === 2) : f.show(); }
    }
  }

  follow(x, y, z, dt, snap = false) {
    const k = snap ? 1 : 1 - Math.exp(-dt * 7);
    this.target.x += (x - this.target.x) * k; this.target.y += (y - this.target.y) * k; this.target.z += (z - this.target.z) * k;
  }
  render() {
    this.cam.position.copy(this.target).add(CAM);
    this.cam.lookAt(this.target);
    this.cam.updateMatrixWorld();
    this.edges.update();
    this.gl.render(this.scene, this.cam);
    this.edges.draw();
  }
}
