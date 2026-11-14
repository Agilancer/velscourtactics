// Draws the world: an orthographic camera looking down the (+x,+z) diagonal, Final Fantasy Tactics style.
// Screen: -z is up-right, +x is down-right, +z is down-left, -x is up-left.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { N, T, STEP } from './map.js';
import { rng32, vnoise, clamp } from '../core/util.js';
import { label, mat } from '../gfx/models.js';

const CAM = new THREE.Vector3(20, 16.5, 20);  // the camera's offset from what it looks at
const RISE = CAM.y / CAM.x;                    // how fast a ray toward the camera climbs per tile of x and z

const GROUND_TEX = {
  [T.GRASS1]: 'tex/grass_1_c.webp', [T.GRASS2]: 'tex/grass_2_c.webp', [T.GRASS3]: 'tex/grass_3_c.webp',
  [T.PINE]: 'tex/pinefloor_1_c.webp', [T.DIRT]: 'tex/dirt_1_c.webp', [T.ROAD]: 'tex/road_1_c.webp',
  [T.FLAGS]: 'tex/flags_c.webp', [T.MOSS]: 'tex/moss_1_c.webp', [T.ROCK]: 'tex/granite_1_c.webp',
};

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

    // Light: a cold bruise-coloured sky, one warm low sun.
    this.scene.add(new THREE.HemisphereLight(0x8fa0c8, 0x2a2018, 1.15));
    const sun = new THREE.DirectionalLight(0xffe0b0, 1.5);
    sun.position.set(8, 14, 3);
    this.scene.add(sun);

    this.buildGround();
    this.buildTrees();
    this.buildTown();
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
    const U = 1 / 7, V = 1 / 4; // the textures are 7:4, so this keeps them square on the ground
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const i = w.I(x, z), t = w.type[i], y = w.h[i] * STEP;
      const s = 0.86 + 0.14 * vnoise(x * 0.9, z * 0.9, 77) - (((x + z) & 1) ? 0.035 : 0);
      const x0 = x - 0.5, x1 = x + 0.5, z0 = z - 0.5, z1 = z + 0.5;
      const q = (a, b, c, d) => [a, b, c, a, c, d];
      push(t, q([x0, y, z0, x0 * U, z0 * V, 0, 1, 0], [x0, y, z1, x0 * U, z1 * V, 0, 1, 0], [x1, y, z1, x1 * U, z1 * V, 0, 1, 0], [x1, y, z0, x1 * U, z0 * V, 0, 1, 0]), s);
      const side = t === T.ROCK || t === T.MOSS ? T.ROCK : T.DIRT;
      const hx = x + 1 < N ? w.h[w.I(x + 1, z)] * STEP : y, hz = z + 1 < N ? w.h[w.I(x, z + 1)] * STEP : y;
      if (hx < y) push(side, q([x1, y, z1, z1 * V, y, 1, 0, 0], [x1, hx, z1, z1 * V, hx, 1, 0, 0], [x1, hx, z0, z0 * V, hx, 1, 0, 0], [x1, y, z0, z0 * V, y, 1, 0, 0]), s * 0.62);
      if (hz < y) push(side, q([x0, y, z1, x0 * U, y, 0, 0, 1], [x0, hz, z1, x0 * U, hz, 0, 0, 1], [x1, hz, z1, x1 * U, hz, 0, 0, 1], [x1, y, z1, x1 * U, y, 0, 0, 1]), s * 0.8);
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
    for (const p of [barkO, barkP, ...leaves, ...needles]) { M.solid[p] = solid(p); M.ghost[p] = ghost(p); }

    // a handful of shapes per kind and size, shared between trees
    const shapes = {};
    const shape = (kind, size, v) => {
      const key = kind + size + v;
      if (shapes[key]) return shapes[key];
      const R = [0, 0.62, 1.25, 1.95][size], H = [0, 3.0, 4.8, 7.0][size];
      const crown = [];
      let trunk;
      if (kind === 'pine') {
        trunk = new THREE.CylinderGeometry(R * 0.1, R * 0.2, H * 0.5, 7).translate(0, H * 0.25, 0);
        const tiers = 3 + size;
        for (let k = 0; k < tiers; k++) {
          const f = k / tiers, rad = R * (1 - f * 0.72), hh = H * 0.36;
          crown.push(new THREE.ConeGeometry(rad, hh, 9).translate(0, H * (0.3 + f * 0.62) + hh * 0.2, 0));
        }
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
    for (const t of this.world.trees) {
      const s = shape(t.kind, t.size, t.v % 3);
      const bark = t.kind === 'pine' ? barkP : barkO, leaf = (t.kind === 'pine' ? needles : leaves)[t.v];
      const m = new THREE.Mesh(s.geo, [M.solid[bark], M.solid[leaf]]);
      const c = (t.size - 1) / 2;
      m.position.set(t.x + c, 0, t.z + c);
      m.rotation.y = t.rot; m.scale.set(1, t.tall, 1);
      m.updateMatrix(); m.matrixAutoUpdate = false;
      this.scene.add(m);
      // hide(true) takes the crown away altogether: a fight has to be readable
      this.faders.push({ tree: true, x: t.x + c, z: t.z + c, r: s.R, h: s.H * t.tall, on: 0, show: () => { m.material = [M.solid[bark], M.solid[leaf]]; }, hide: (hard) => { m.material = [M.ghost[bark], hard ? none : M.ghost[leaf]]; } });
    }
  }

  // ---- Herrington Hollow: walls, roofs, doors and signs from bm's building textures ----
  buildTown() {
    const w = this.world;
    for (const b of w.buildings) {
      const H = 2.7, cx = b.x + (b.w - 1) / 2, cz = b.z + (b.d - 1) / 2;
      const mk = (path, o = {}) => new THREE.MeshLambertMaterial({ map: this.tex(path), ...o });
      const wallT = this.tex(`tex/${b.wall}_c.webp`).clone(); wallT.repeat.set(b.w / 6, 0.7); wallT.needsUpdate = true;
      const roofT = this.tex(`tex/${b.roof}_c.webp`).clone(); roofT.repeat.set(b.w / 5, 1); roofT.needsUpdate = true;
      const g = new THREE.Group();
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
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.9), mk(`tex/${b.door}_c.webp`, { transparent: true, alphaTest: 0.4 }));
      door.material.map = this.tex(`tex/${b.door}_c.webp`, false);
      door.position.set(b.doorX, 0.95, b.z + b.d - 0.59);
      const sign = label(b.name, { size: 40, color: '#ffe2a0' });
      sign.position.set(b.doorX, H + 2.3, b.z + b.d - 0.5);
      g.add(walls, roof, door);
      this.scene.add(g, sign);
      const meshes = [walls, roof, door];
      const solidM = meshes.map((m) => m.material);
      const ghostM = solidM.map((m) => { const c = m.clone(); c.transparent = true; c.opacity = 0.25; c.depthWrite = false; return c; });
      this.faders.push({ x: cx, z: cz, r: Math.max(b.w, b.d) / 2 + 0.3, rx: b.w / 2, rz: b.d / 2, h: H + rh, on: 0,
        show: () => meshes.forEach((m, i) => { m.material = solidM[i]; }), hide: () => meshes.forEach((m, i) => { m.material = ghostM[i]; }) });
    }
    // the well
    const stone = this.tex('tex/stone_c.webp');
    const well = new THREE.Group();
    well.add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.6, 12), new THREE.MeshLambertMaterial({ map: stone })).translateY(0.3));
    well.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 12), mat(0x0a1620)).translateY(0.56));
    for (const sx of [-0.44, 0.44]) well.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat(0x5a3c24)).translateX(sx).translateY(0.75));
    well.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.7), mat(0x3a2416)).translateY(1.55));
    well.position.set(w.well.x, 0, w.well.z);
    this.scene.add(well);
    // the bounty board
    const board = new THREE.Group();
    for (const sx of [-0.4, 0.4]) board.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat(0x5a3c24)).translateX(sx).translateY(0.75));
    board.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.06), new THREE.MeshLambertMaterial({ map: this.tex('tex/wood_c.webp') })).translateY(1.15));
    for (const [px, py] of [[-0.25, 1.25], [0.1, 1.1], [0.28, 1.3]]) board.add(new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.3), mat(0xd8c8a0)).translateX(px).translateY(py).translateZ(0.04));
    board.position.set(w.board.x, 0, w.board.z);
    const bl = label('Bounties', { size: 36, color: '#ffe2a0' }); bl.position.set(w.board.x, 2.1, w.board.z);
    this.scene.add(board, bl);
    // chests
    this.chests = {};
    for (const c of w.chests) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.42), mat(0x5a3c24)).translateY(0.18));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.46), mat(0xc9a24a)).translateY(0.42));
      g.position.set(c.x, w.y(c.x, c.z), c.z);
      this.scene.add(g); this.chests[c.id] = g;
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
    this.hl = this.hl.filter((h) => { if (layer && h.layer !== layer) return true; this.hlGroup.remove(h.mesh); return false; });
  }
  highlight(tiles, kind, layer = 'main') {
    for (const t of tiles) {
      const m = new THREE.Mesh(this.hlGeo, this.hlMats[kind]);
      m.position.set(t.x, this.world.y(t.x, t.z) + (kind === 'aoe' ? 0.06 : 0.04), t.z);
      m.renderOrder = kind === 'aoe' ? 3 : 2;
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
    this.gl.render(this.scene, this.cam);
  }
}
