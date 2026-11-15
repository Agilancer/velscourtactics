// Draws the world: an orthographic camera looking down the (+x,+z) diagonal, Final Fantasy Tactics style.
// Screen: -z is up-right, +x is down-right, +z is down-left, -x is up-left.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { rng32, vnoise, clamp } from '../core/util.js';
import { label, mat } from '../gfx/models.js';
import { Ambient } from '../gfx/ambient.js';
import { Edges } from '../gfx/outline.js';
import { buildGround, settleRepeats, noiseTexture } from './ground.js';
import { buildScatter, buildShadows, treeKind } from './scatter.js';

const CAM = new THREE.Vector3(20, 16.5, 20);  // the camera's offset from what it looks at
const RISE = CAM.y / CAM.x;                    // how fast a ray toward the camera climbs per tile of x and z

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
const LID_OPEN = 1.85;                                            // how far back an open chest's lid stands (radians)
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

// ---- how the trees are lit: one light model for every kind, each with its own strengths ----
// For the trunk and the crown: [gain, saturation, calm (the texture's light and dark pulled together), the brightest
// a texel may be]; the foot [how dark, up to what share of the height]; a sky light on what faces up and a cold rim
// on the edges, so a crown has a top and a side and parts from the one behind it; the top lighter; the wind; embers
// in the charred wood. Each kind's crowns come in four tints.
const TREE_LOOK = {
  pine: { crown: [1.0, 0.72, 0.62, 0.17], trunk: [1, 0.8, 0, 1], foot: [0.6, 0.1], sky: 0.24, rim: 0.3, top: 0.25, wind: 0.012, hi: [0.5, 0.95, 0.85, 0.9],
    round: 0.2, ao: 0.35, bark: 0xc8a07c, tints: [0xbcc690, 0x98ac90, 0xc4c48e, 0x90a684] },
  oak: { crown: [1.35, 0.62, 0.4, 0.3], trunk: [1.0, 0.8, 0.2, 0.3], foot: [0.6, 0.1], sky: 0.26, rim: 0.26, top: 0.45, wind: 0.009,
    round: 0.75, ao: 0.5, wood: [1.25, 0.75, 0.35, 0.085], tints: [0xd0d4a8, 0x98a890, 0xc4c8a0, 0xa8b894],
    fen: [0x9c9478, 0x908a72, 0xa4987a, 0x94805e] },
  snowpine: { crown: [1, 1, 0, 1], trunk: [1, 0.3, 0, 1], foot: [0.92, 0.1], sky: 0.15, rim: 0.2, top: 0.1, wind: 0.007, bark: 0xd8e0ec,
    sink: 0.1, tallK: 1.1, mound: [0x868589, 0.13, 0.4, 0, 1], tints: [0xffffff, 0xeef2f6, 0xe4eaf0, 0xf4f4ee] },
  dead: { crown: [0.62, 0.5, 0.5, 0.42], trunk: [0.62, 0.5, 0.5, 0.42], foot: [0.3, 0.2], sky: 0.1, rim: 0.22, top: 0.1, wind: 0.007,
    tints: [0xc4ccc0, 0xb4c0b4, 0xccd0c2, 0xb0bab0] },
  char: { crown: [1, 0.15, 0, 0.06], trunk: [1, 0.15, 0, 0.06], foot: [0.3, 0.2], sky: 0.06, rim: 0.45, rimC: [0.9, 0.86, 0.8], top: 0, wind: 0.003,
    ember: 1, sink: 0.24, cut: [0.1, 0.34], wide: 0.75, tallK: 1.4, mound: [0x1e1c1b, 0.21, 0.42, 0x161413], tints: [0xffffff, 0xe8e0dc, 0xdcdcdc, 0xf0e8e0] },
  palm: { crown: [0.8, 0.95, 0.2, 0.34], trunk: [1.4, 0.7, 0.2, 0.45], foot: [0.45, 0.12], sink: 0.05, dates: 0.75, sky: 0.3, rim: 0.25, top: 0.3, wind: 0.02, bark: 0xe6caa4,
    tints: [0xe0ecb0, 0xd4e4a4, 0xe8e8a8, 0xd0dca8] },
};
const TREE_VERT = /* glsl */`
uniform float uTime, uWind, uH, uY0;
uniform vec4 uC;
uniform vec2 uRnd;
uniform vec4 uCut;
varying float vTY, vAO;`;
// a crown lit as one mass: its normals bent out from its middle, its heart and underside in shade
const TREE_ROUND = /* glsl */`
{
  vec3 tq = (position - uC.xyz) / vec3(uC.w, uC.w * 0.8, uC.w);
  objectNormal = normalize(mix(objectNormal, normalize(tq + vec3(0.0, 0.001, 0.0)), uRnd.x));
  vAO = 1.0 - uRnd.y * (1.0 - smoothstep(0.2, 1.0, length(tq))) - uRnd.y * 0.6 * (1.0 - smoothstep(-0.7, 0.3, tq.y));
}`;
const TREE_SWAY = /* glsl */`
vTY = (position.y - uY0) / uH;
#ifdef TREE_CUT
{
  // the low, wide skirt (the charred tree's spread of roots) drawn in to the trunk, so it rises straight from the ground
  vec2 cd = transformed.xz - uCut.xy;
  float cr = length(cd) / uH, cl = mix(uCut.z, uCut.z + 0.03, clamp(vTY / uCut.w, 0.0, 1.0));
  float rc = cr > cl ? cl + (cr - cl) * 0.12 : cr;
  rc = mix(rc, cr, smoothstep(uCut.w * 0.7, uCut.w, vTY));
  transformed.xz = uCut.xy + cd * (rc / max(cr, 1e-4));
}
#endif
{
  // the crown leans in the same gusts the grass does, the foot still
  vec3 ip = modelMatrix[3].xyz;
  float ph = uTime * 1.3 + dot(ip.xz, vec2(0.41, 0.27));
  float gust = 0.5 + 0.5 * sin(uTime * 0.37 + ip.x * 0.045 - ip.z * 0.06);
  float sw = (sin(ph) * 0.7 + sin(ph * 2.31 + 1.3) * 0.3) * (0.35 + 0.65 * gust);
  vec3 wo = vec3(0.8, 0.0, -0.45) * sw * uWind * uH * length(modelMatrix[1].xyz) * vTY * vTY;
  transformed += inverse(mat3(modelMatrix)) * wo;
}`;
const TREE_FRAG = /* glsl */`
uniform float uTime;
uniform vec4 uPart, uFoot, uMore, uHi, uWood;
uniform vec3 uRimC, uWoodC;
float tWood = 0.0;
uniform vec4 uHoles[4];
varying float vTY, vAO;
vec4 tTex = vec4(1.0);`;
const TREE_MAP = /* glsl */`
#ifdef USE_MAP
  tTex = texture2D(map, vMapUv);
  float tl = dot(tTex.rgb, vec3(0.3, 0.59, 0.11));
  vec4 tP = uPart;
  #ifdef TREE_WOOD
  // the boughs inside a crown (texels dark and not green) take the bark's colour and light, not the leaves'; pale grey
  // slivers at the leaves' edges take the leaves' middle
  float tGr = smoothstep(1.06, 1.18, tTex.g / max(tTex.r, 1e-4));
  tWood = (1.0 - tGr) * (1.0 - smoothstep(0.035, 0.06, tl));
  float tFleck = (1.0 - tGr) * smoothstep(0.045, 0.075, tl);
  tP = mix(uPart, uWood, tWood);
  diffuseColor.rgb = mix(diffuseColor.rgb, uWoodC, tWood);
  #else
  tWood = smoothstep(0.0, 0.05, tTex.r - tTex.g);
  #endif
  vec3 tc = mix(vec3(tl), tTex.rgb, tP.y);
  float nl = min(mix(tl, 0.14, tP.z), tP.w);       // calmer, and nothing brighter than it should be
  tc *= nl / max(tl, 0.001);
  tc = mix(tc, vec3(nl) * uHi.rgb, uHi.a * smoothstep(0.04, 0.16, tl));   // the bright tips turned to the kind's own colour
  #ifdef TREE_WOOD
  tc = mix(tc, vec3(0.05, 0.08, 0.022), tFleck);
  #endif
  tc = mix(tc, vec3(nl) * vec3(1.15, 0.9, 0.72), uMore.y * smoothstep(1.2, 1.5, tTex.r / max(tTex.g, 1e-4)));   // the dates toward rust
  #ifdef TREE_EMBER
  tc = mix(tc, vec3(nl * 0.3), smoothstep(0.05, 0.16, min(tTex.r, tTex.g) - tTex.b) * step(0.2, tTex.g));   // no yellow flecks
  #endif
  diffuseColor.rgb *= tc * tP.x;
#endif
diffuseColor.rgb *= mix(uFoot.x, 1.0, smoothstep(0.0, uFoot.y, vTY)) * (1.0 + uMore.x * clamp(vTY, 0.0, 1.0) * (1.0 - tWood)) * clamp(mix(vAO, max(vAO, 0.8), tWood * (1.0 - smoothstep(0.5, 0.7, vTY))), 0.3, 1.0);
#if defined(TREE_EMBER) && defined(USE_MAP)
{
  // ash blown up round the foot, its top edge broken by the bark
  float tDust = 1.0 - smoothstep(0.26, 0.42, vTY + (tl - 0.06) * 0.3);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.022, 0.02, 0.019), tDust * 0.85);   // soot
}
#endif`;
const TREE_LIGHT = /* glsl */`
{
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float sky = 0.5 + 0.5 * dot(normal, upV), rimT = pow(1.0 - abs(normal.z), 2.0);
  totalEmissiveRadiance += diffuseColor.rgb * (uFoot.z * sky + uFoot.w * rimT * uRimC);
  #ifdef TREE_EMBER
  totalEmissiveRadiance += vec3(0.034, 0.032, 0.03) * rimT * smoothstep(0.26, 0.4, vTY);   // an ash-grey edge, so it parts from dark ash
  float tEm = tTex.r - max(tTex.g, tTex.b);
  totalEmissiveRadiance += vec3(1.0, 0.32, 0.06) * (smoothstep(0.04, 0.14, tEm) * 0.5 + smoothstep(0.12, 0.24, tEm) * 1.2) * (0.6 + 0.4 * sin(uTime * 0.9 + vTY * 7.0));
  #endif
}`;
// see-through: a round hole in the tree where someone stands behind it, clear in the middle and thinning out through a
// fine pattern at its rim, so the rest of the tree stays whole and nothing needs sorting (uHoles: on screen, in pixels)
const TREE_GHOST = /* glsl */`
{
  float th = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 hh = uHoles[i];
    if (hh.z > 0.0) th = max(th, 1.0 - smoothstep(0.92, 1.0, length(gl_FragCoord.xy - hh.xy) / hh.z));
  }
  ivec2 bp = ivec2(gl_FragCoord.xy) & 3;
  float bay[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  if (bay[bp.y * 4 + bp.x] < th * 16.0 - 0.5) discard;
}`;
function treeMaterial(src, look, part, tint, height, y0, crown, shared, ghost) {
  const m = new THREE.MeshLambertMaterial({ map: src.map, name: src.name, color: tint });
  const p = look[part], cr = part === 'crown';
  const u = { uWind: { value: look.wind }, uH: { value: height }, uY0: { value: y0 }, uC: { value: crown },
    uCut: { value: new THREE.Vector4(...(look.cutAt || [0, 0]), ...(look.cut || [9, 0])) },
    uWood: { value: new THREE.Vector4(...(look.wood || look.trunk)) }, uWoodC: { value: new THREE.Color(look.bark || 0xffffff) },
    uRnd: { value: new THREE.Vector2(cr ? look.round || 0 : 0, cr ? look.ao || 0 : 0) }, uRimC: { value: new THREE.Vector3(...(look.rimC || [0.75, 0.85, 1.0])) }, uHi: { value: new THREE.Vector4(...(look.hi || [1, 1, 1, 0])) }, uPart: { value: new THREE.Vector4(...p) },
    uFoot: { value: new THREE.Vector4(look.foot[0], look.foot[1], look.sky, look.rim) }, uMore: { value: new THREE.Vector4(cr ? look.top : 0, cr ? look.dates || 0 : 0, 0, 0) } };
  m.defines = {};
  if (look.ember) m.defines.TREE_EMBER = 1;
  if (look.cut) m.defines.TREE_CUT = 1;
  if (look.wood && cr) m.defines.TREE_WOOD = 1;
  if (ghost) m.defines.TREE_GHOST = 1;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uTime: shared.uTime, uHoles: shared.uHoles });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + TREE_VERT).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + TREE_SWAY)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + TREE_ROUND);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + TREE_FRAG)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n#ifdef TREE_GHOST\n' + TREE_GHOST + '\n#endif')
      .replace('#include <map_fragment>', TREE_MAP).replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + TREE_LIGHT);
  };
  m.customProgramCacheKey = () => `tree3|${look.ember ? 1 : 0}|${look.cut ? 1 : 0}|${look.wood && cr ? 1 : 0}|${ghost ? 1 : 0}`;
  return m;
}

// where a model's trunk stands: the middle of what it has between a quarter and two-fifths of its height
function trunkOf(geo) {
  const P = geo.attributes.position, bb = geo.boundingBox, H = bb.max.y - bb.min.y, xs = [], zs = [];
  for (let i = 0; i < P.count; i++) {
    const ty = (P.getY(i) - bb.min.y) / H;
    if (ty > 0.25 && ty < 0.4) { xs.push(P.getX(i)); zs.push(P.getZ(i)); }
  }
  const mid = (a) => (a.length ? a.sort((x, y) => x - y)[a.length >> 1] : 0);
  return [mid(xs), mid(zs)];
}

// a low mound, highest in the middle and running out to nothing at a ragged edge, where it fades into the ground
function moundGeo() {
  const pos = [], col = [], idx = [], RING = 5, SEG = 16;
  pos.push(0, 1, 0); col.push(1, 1, 1, 1);
  for (let k = 1; k <= RING; k++) for (let j = 0; j < SEG; j++) {
    const a = (j / SEG) * Math.PI * 2, r = k / RING, e = r * (0.82 + 0.36 * vnoise(Math.cos(a) * 1.7 + 3, Math.sin(a) * 1.7, 41));
    const y = (1 - r * r) ** 2 * (0.85 + 0.3 * vnoise(Math.cos(a) * 3 * r + 7, Math.sin(a) * 3 * r, 43));
    pos.push(Math.cos(a) * e, y, Math.sin(a) * e); col.push(1, 1, 1, 1 - Math.max(0, (r - 0.55) / 0.45) ** 1.5);
  }
  for (let j = 0; j < SEG; j++) idx.push(0, 1 + ((j + 1) % SEG), 1 + j);
  for (let k = 1; k < RING; k++) for (let j = 0; j < SEG; j++) {
    const a = 1 + (k - 1) * SEG + j, b = 1 + (k - 1) * SEG + ((j + 1) % SEG), c = a + SEG, d = b + SEG;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// the middle and reach of a model's crown (its second part), for lighting it as one mass
function crownOf(geo) {
  const g = geo.groups[1] || { start: 0, count: Infinity }, P = geo.attributes.position, I = geo.index;
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().negate(), v = new THREE.Vector3();
  const end = Math.min(g.start + g.count, I ? I.count : P.count);
  for (let i = g.start; i < end; i++) { v.fromBufferAttribute(P, I ? I.getX(i) : i); lo.min(v); hi.max(v); }
  const c = lo.clone().add(hi).multiplyScalar(0.5), r = Math.max(hi.x - lo.x, hi.z - lo.z) / 2;
  return new THREE.Vector4(c.x, c.y, c.z, Math.max(r, 1e-3));
}

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

    // the clock and the noise the ground's blends, the swaying grass and the air all share
    this.shared = { uTime: { value: 0 }, uNoise: { value: noiseTexture() }, uHoles: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) } };
    this.holePts = [];
    this.ground = buildGround(this, this.shared);
    buildScatter(this, this.ground.vis, this.shared);
    this.treeShade = buildShadows(this);
    this.ambient = new Ambient(this, this.shared);
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

  // ---- the ground, what lies on it and the air over it: src/world/ground.js, src/world/scatter.js, src/gfx/ambient.js ----

  // ---- trees: a trunk and a crown, wearing bm's bark, oak leaf and pine needle textures; the models when they come ----
  buildTrees() {
    const r = rng32(99), w = this.world, vis = this.ground.vis;
    const solid = (path) => new THREE.MeshLambertMaterial({ map: this.tex(path) });
    const ghost = (path) => new THREE.MeshLambertMaterial({ map: this.tex(path), transparent: true, opacity: 0.2 });
    const barkO = 'tex/bark_c.webp', barkP = 'tex/pine_bark_c.webp';
    const leaves = ['trees/oak_leaves_1.webp', 'trees/oak_leaves_2.webp', 'trees/oak_leaves_3.webp', 'trees/oak_leaves_4.webp'];
    const needles = ['tex/pine_c.webp', 'trees/pine_needles_2.webp', 'tex/pine_3_c.webp', 'trees/pine_needles_4.webp'];
    const M = { solid: {}, ghost: {} };
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

    // a handful of shapes per kind and size, shared between trees (the stand-ins until a kind's model is in)
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

    // A fight takes a tree down to a stump, so the board shows which tiles a tree holds: one instanced bark side (wider
    // at its roots) and one cut top (rings darker to the bark) for every tree, each kept at nothing until it is felled.
    const n = w.trees.length;
    const stumpSide = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.8, 1.35, 1, 9, 2, true).translate(0, 0.5, 0),
      new THREE.MeshLambertMaterial({ map: this.tex('tex/bark_c.webp') }), n);
    const cut = new THREE.CircleGeometry(0.8, 9).rotateX(-Math.PI / 2).translate(0, 1, 0);
    cut.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: cut.attributes.position.count }, (_, k) => (k ? [0.55, 0.52, 0.5] : [1, 1, 1])).flat(), 3));
    const stumpTop = new THREE.InstancedMesh(cut, new THREE.MeshLambertMaterial({ color: 0x625852, vertexColors: true }), n);
    const STUMP_COL = { pine: [0x8a6a50, 0xffffff], oak: [0x7a6250, 0xffffff], snowpine: [0x7a6a60, 0xf4f4f4], dead: [0xb0aa9c, 0xd8d0c0], char: [0x4a4440, 0x9a8070], palm: [0x9a8468, 0xe8dcc0] };
    const zero = new THREE.Matrix4().makeScale(0, 0, 0), sm = new THREE.Matrix4(), sc = new THREE.Color();
    const sp = new THREE.Vector3(), sq = new THREE.Quaternion(), ss = new THREE.Vector3(), sa = new THREE.Vector3();
    const KF = { oak: 1.5, pine: 1, snowpine: 1, palm: 0.75, dead: 0.95, char: 1.1 };
    for (let k = 0; k < n; k++) { stumpSide.setMatrixAt(k, zero); stumpTop.setMatrixAt(k, zero); }
    stumpSide.frustumCulled = stumpTop.frustumCulled = false;
    this.scene.add(stumpSide, stumpTop);
    // a stub: what is left of a tree off the field's edge, cut near the ground
    const stump = (t, kind, on, stub) => {
      const c = (t.size - 1) / 2, rad = (0.1 + 0.045 * t.size) * (KF[kind] || 1), j = (k) => (t.id * k) % 1;
      if (on) {
        const a = j(0.371) * 6.28, tilt = 0.09 + 0.12 * j(0.733);
        sq.setFromAxisAngle(sa.set(Math.cos(a), 0, Math.sin(a)), tilt);
        sp.set(t.x + c + (j(0.211) - 0.5) * 0.12, w.y(t.x, t.z) - 0.02, t.z + c + (j(0.457) - 0.5) * 0.12);
        sm.compose(sp, sq, ss.set(rad, (0.12 + 0.04 * t.size) * (0.75 + 0.5 * j(0.618)) * (stub ? 0.35 : 1), rad));
      } else sm.copy(zero);
      stumpSide.setMatrixAt(t.id, sm); stumpTop.setMatrixAt(t.id, sm);
      stumpSide.setColorAt(t.id, sc.setHex(STUMP_COL[kind][0])); stumpTop.setColorAt(t.id, sc.setHex(STUMP_COL[kind][1]));
      stumpSide.instanceMatrix.needsUpdate = stumpTop.instanceMatrix.needsUpdate = true;
      stumpSide.instanceColor.needsUpdate = stumpTop.instanceColor.needsUpdate = true;
    };

    const live = { pine: [], oak: [], snowpine: [], dead: [], char: [], palm: [] };   // the trees that take their models when those come
    const palms = w.trees.filter((t) => treeKind(w, vis, t) === 'palm');
    const pool = palms.length ? palms.reduce((a, t) => ({ x: a.x + t.x / palms.length, z: a.z + t.z / palms.length }), { x: 0, z: 0 }) : null;
    const q = new THREE.Quaternion(), qy = new THREE.Quaternion(), axis = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
    for (const t of w.trees) {
      const kind = treeKind(w, vis, t), K = KIND[kind] || KIND.oak;
      const s = shape(K[0], t.size, t.v % 3);
      const bark = K[1], leaf = K[2] || (K[0] === 'pine' ? needles : leaves)[t.v];
      const wear = { solid: [M.solid[bark], M.solid[leaf]], ghost: [M.ghost[bark], M.ghost[leaf]] };
      const m = new THREE.Mesh(s.geo, wear.solid);
      const c = (t.size - 1) / 2, rt = rng32(t.id * 7 + 3);
      // no two alike: a little taller or shorter than the map says, the biggest a little less, each leaning a few
      // degrees its own way (a palm out from its pool)
      const jit = (t.size === 1 ? 0.76 + rt() * 0.48 : 0.86 + rt() * 0.28) * (t.size === 3 ? 0.88 : 1), tall = t.tall * jit;
      let lx = rt() - 0.5, lz = rt() - 0.5, lean = 0.02 + rt() * 0.05;
      if (kind === 'palm' && pool) { lx = t.x - pool.x; lz = t.z - pool.z; lean = 0.08 + rt() * 0.08; }
      axis.set(lz, 0, -lx); if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0);
      q.setFromAxisAngle(axis.normalize(), lean).multiply(qy.setFromAxisAngle(UPV, t.rot));
      m.position.set(t.x + c, 0, t.z + c);
      m.quaternion.copy(q); m.scale.set(1, tall, 1);
      m.updateMatrix(); m.matrixAutoUpdate = false;
      this.scene.add(m);
      // hide(true) fells it to a stump for a fight; hide(false) lets you see through it
      const f = { tree: true, x: t.x + c, z: t.z + c, r: K[0] === 'bare' ? s.R * 0.3 : s.R, h: s.H * tall, on: 0,
        show: () => { m.visible = true; m.material = wear.solid; this.treeShade(t.id, 1); stump(t, kind, false); },
        hide: (hard, stub) => {
          if (hard) { m.visible = false; this.treeShade(t.id, 0.6, 0.22); stump(t, kind, true, stub); }
          else { m.visible = true; m.material = wear.ghost; this.treeShade(t.id, 1); stump(t, kind, false); }
        } };
      this.faders.push(f);
      if (live[kind]) live[kind].push({ t, m, f, wear, tall });
    }
    // the tree models: as tall as the shapes they stand in for (an oak or a bare tree a little less, being broad; a
    // palm more), each tree's crown one of four tints, lit by one light model for all (`treeMaterial`). A bare tree
    // hides only its trunk.
    const PROP = { dead: 'dead_tree', char: 'char_tree' }, UP = { oak: 0.8, dead: 0.85, char: 0.85, palm: 1.2 };
    for (const kind in live) if (live[kind].length) loadProp(PROP[kind] || kind).then((p) => {
      if (!p) return;
      const up = UP[kind] || 1, wide = Math.max(p.size.x, p.size.z) / 2 * (KIND[kind][0] === 'bare' ? 0.4 : 1);
      const look = TREE_LOOK[kind], crown = crownOf(p.geo);
      if (look.cut || look.mound) look.cutAt = trunkOf(p.geo);
      const wears = [...look.tints, ...(look.fen || [])].map((hex) => {
        const make = (ghost) => p.mats.map((x, k) => treeMaterial(x, look, k && p.mats.length > 1 ? 'crown' : 'trunk', k ? hex : look.bark || 0xffffff,
          p.size.y, p.geo.boundingBox.min.y, crown, this.shared, ghost));
        return { solid: make(false), ghost: make(true) };
      });
      for (const { t, m, f, wear, tall } of live[kind]) {
        const k = SIZE_H[t.size] * up * tall / p.size.y, fen = look.fen && w.region[w.I(t.x, t.z)] === 3;
        Object.assign(wear, wears[(fen ? 4 : 0) + t.v % 4]);
        const kw = k * (look.wide || 1), kh = k * (look.tallK || 1);
        m.geometry = p.geo; m.scale.set(kw, kh, kw); m.position.y = -(look.sink || 0) * p.size.y * kh; m.updateMatrix();
        f.r = wide * kw * 0.9; f.h = p.size.y * kh;
        if (f.on) f.hide(f.on >= 2, f.on === 3); else f.show();
      }
      if (look.mound) this.footMounds(live[kind], look, p);
    });
  }

  // A mound at each tree's foot (ash under a charred tree, snow under a snow pine) hides where the trunk meets the
  // ground, with a few chunks of char lying round it; in a fight it sinks low round the stump.
  footMounds(L, look, p) {
    const w = this.world, [col, rk, hk, chunk, flat] = look.mound, UPV = new THREE.Vector3(0, 1, 0);
    const mat = flat ? new THREE.MeshBasicMaterial({ color: col, vertexColors: true, transparent: true, opacity: 0.75 })    // as the ground looks on screen
      : new THREE.MeshLambertMaterial({ color: col, vertexColors: true, transparent: true });
    const mound = new THREE.InstancedMesh(moundGeo(), mat, L.length);
    const bits = chunk ? new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: chunk, flatShading: true }), L.length * 3) : null;
    const v = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), mm = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    mound.renderOrder = -1;
    L.forEach(({ t, m, f }, i) => {
      const rt = rng32(t.id * 13 + 5), y = w.y(t.x, t.z);
      v.set(look.cutAt[0], p.geo.boundingBox.min.y + (look.sink || 0) * p.size.y, look.cutAt[1]).applyMatrix4(m.matrix);
      const R = rk * p.size.y * m.scale.x * (0.85 + 0.3 * rt()), h = R * hk * (0.8 + 0.4 * rt()), x = v.x, z = v.z;
      q.setFromAxisAngle(UPV, rt() * 6.28);
      const put = (low) => { mm.compose(v.set(x, y - 0.01, z), q, sv.set(R, h * (low ? 0.3 : 1), R)); mound.setMatrixAt(i, mm); mound.instanceMatrix.needsUpdate = true; };
      put(f.on >= 2);
      const show = f.show, hide = f.hide;
      f.show = () => { show(); put(false); };
      f.hide = (hard, stub) => { hide(hard, stub); put(hard); };
      if (bits) for (let k = 0; k < 3; k++) {
        const a = rt() * 6.28, d = R * (0.75 + 0.6 * rt()), s = R * (0.07 + 0.08 * rt());
        q.setFromAxisAngle(sv.set(rt() - 0.5, rt() - 0.5, rt() - 0.5).normalize(), rt() * 3);
        mm.compose(v.set(x + Math.cos(a) * d, y + s * 0.3, z + Math.sin(a) * d), q, sv.set(s, s * 0.6, s * 1.3));
        bits.setMatrixAt(i * 3 + k, rt() < 0.8 ? mm : zero);
      }
    });
    mound.frustumCulled = false; this.scene.add(mound);
    if (bits) { bits.frustumCulled = false; this.scene.add(bits); }
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
    // the gateposts, tall and kept apart, so they can go see-through when someone stands behind them. Boxes until the
    // model (assets/props/crypt_gate: a post, skulls in its niche, the gate's hinge pins down its inner side) comes.
    const postB = {};
    for (const p of c.posts) {
      add(BOX, M(p.x, 0, p.z, 0, 0.9, 2.5, 0.9), 'block', 0, postB);
      add(BOX, M(p.x, 2.5, p.z, 0, 1.06, 0.16, 1.06), 'slab', 2.0, postB);
      candles.push([p.x + (p.x > c.gate.x ? -0.22 : 0.22), 2.66, p.z + 0.28]);   // on the model's old wax, gate side, front
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
    loadProp('crypt_gate').then((p) => {
      if (!p) return;
      for (const m of gateMeshes) {
        const k = fade.meshes.indexOf(m);
        gateG.remove(m); m.geometry.dispose();
        fade.meshes.splice(k, 1); fade.solid.splice(k, 1); fade.ghost.splice(k, 1);
      }
      for (const q of c.posts) {
        const m = new THREE.Mesh(p.geo, p.mats);
        m.position.set(q.x, 0, q.z);
        if (q.x > c.gate.x) m.scale.x = -1;                             // the pins on the side the gate hangs from
        m.updateMatrix(); m.matrixAutoUpdate = false; gateG.add(m);
        fade.meshes.push(m); fade.solid.push(p.mats); fade.ghost.push(p.mats.map(ghost));
      }
    });
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

  // ---- chests: the chest (assets/props/chest: a box and its lid, two materials), the lid swinging up on its back edge ----
  buildChests() {
    const w = this.world;
    this.chests = {};
    for (const c of w.chests) {
      const g = new THREE.Group();
      g.position.set(c.x, w.y(c.x, c.z), c.z);
      g.rotation.y = c.crypt ? 0 : Math.PI / 4;                   // facing the camera, or the crypt's gate
      this.scene.add(g);
      this.chests[c.id] = { g, open: false, hinge: null, t: 1 };
    }
    loadProp('chest').then((p) => {
      const lidAt = p ? p.mats.findIndex((x) => /lid/.test(x.name)) : -1;
      if (lidAt < 0) {
        // no model: the old box, its lid a separate piece that tips back
        for (const id in this.chests) {
          const ch = this.chests[id];
          ch.g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.42), mat(0x5a3c24)).translateY(0.18));
          ch.lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.12, 0.46), mat(0xc9a24a)).translateY(0.42);
          ch.g.add(ch.lid);
          if (ch.open) ch.lid.rotation.x = -0.9;
        }
        return;
      }
      const none = new THREE.MeshBasicMaterial({ visible: false });
      const boxM = p.mats.map((x, k) => (k === lidAt ? none : x)), lidM = p.mats.map((x, k) => (k === lidAt ? x : none));
      // the hinge runs along the lid's back edge, at its foot: where most of the back ends, not the hinge straps and
      // corner plates hanging lower, nor the hasp at the front
      const P = p.geo.attributes.position, ix = p.geo.index, gr = p.geo.groups.find((q) => q.materialIndex === lidAt);
      const lidV = [];
      for (let i = gr.start; i < gr.start + gr.count; i++) lidV.push(ix ? ix.getX(i) : i);
      let hz = Infinity;
      for (const v of lidV) hz = Math.min(hz, P.getZ(v));
      const backY = lidV.filter((v) => P.getZ(v) < hz + 0.06).map((v) => P.getY(v)).sort((a, b) => a - b);
      const hy = backY[Math.floor(backY.length * 0.05)];
      for (const id in this.chests) {
        const ch = this.chests[id];
        ch.g.add(new THREE.Mesh(p.geo, boxM));
        ch.hinge = new THREE.Group(); ch.hinge.position.set(0, hy, hz); ch.g.add(ch.hinge);
        ch.hinge.add(new THREE.Mesh(p.geo, lidM).translateY(-hy).translateZ(-hz));
        if (ch.open) this.openChest(id, true);
      }
    });
  }
  // Opens a chest's lid; `instant` leaves it standing open (a chest opened before the save was loaded).
  openChest(id, instant = false) {
    const ch = this.chests[id];
    if (!ch) return;
    ch.open = true; ch.t = instant ? 1 : 0;
    if (ch.lid) ch.lid.rotation.x = -0.9;
    if (ch.hinge) ch.hinge.rotation.x = instant ? -LID_OPEN : 0;
  }
  // Every chest as the save has it: open if it was opened, shut if not.
  setChests(opened = {}) {
    for (const id in this.chests) {
      const ch = this.chests[id];
      if (opened[id]) { if (!ch.open) this.openChest(id, true); continue; }
      ch.open = false; ch.t = 1;
      if (ch.lid) ch.lid.rotation.x = 0;
      if (ch.hinge) ch.hinge.rotation.x = 0;
    }
  }
  // Each frame: the wind and the water, the air, lids that are swinging, and the crypt's candles.
  tick(dt) {
    this.shared.uTime.value += dt;
    if (this.ground.pending.length) settleRepeats(this.ground.pending);
    this.ambient.update(dt);
    for (const id in this.chests) {
      const ch = this.chests[id];
      if (!ch.hinge || !ch.open || ch.t >= 1) continue;
      ch.t = Math.min(1, ch.t + dt / 0.75);                       // thrown up, past where it rests, and back
      const u = ch.t - 1; ch.hinge.rotation.x = -LID_OPEN * (1 + 2.4 * u * u * u + 1.4 * u * u);
    }
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
    // a lit tile: an even wash with a brighter rim, so a range reads as one colour over any ground
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const cx = cv.getContext('2d');
    cx.fillStyle = 'rgba(255,255,255,0.95)'; cx.fillRect(1, 1, 62, 62);
    cx.clearRect(5, 5, 54, 54); cx.fillStyle = 'rgba(255,255,255,0.5)'; cx.fillRect(5, 5, 54, 54);
    const tile = new THREE.CanvasTexture(cv);
    const hm = (color, opacity) => new THREE.MeshBasicMaterial({ color, map: tile, transparent: true, opacity, depthWrite: false });
    this.hlMats = {
      move: hm(0x5a94ff, 0.85), attack: hm(0xe04040, 0.9), place: hm(0x5ad664, 0.85), aoe: hm(0xff9a2a, 1),
      heal: hm(0x4fd6a0, 0.88), bounds: new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.1, depthWrite: false }),
      danger: hm(0xff2a1a, 1), hazard: hm(0xb04aff, 0.8),
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
    this.fight = !!field;
    this.holePts = points;
    for (const f of this.faders) {
      let want = 0;
      if (Math.abs(f.x - tx) <= 26 && Math.abs(f.z - tz) <= 26) {
        // a fight fells the trees on its field, and those just off it on the camera's side, so nobody on its near edge
        // is lost behind one
        if (field && f.tree && f.x >= field.x0 - 1 && f.x <= field.x1 + 6 && f.z >= field.z0 - 1 && f.z <= field.z1 + 6) {
          want = f.x <= field.x1 + 2 && f.z <= field.z1 + 2 ? 2 : 3;   // on the field a stump, off it a stub
        }
        else for (const p of points) {
          const dx = f.x - p.x, dz = f.z - p.z;
          const along = (dx + dz) / 2;                    // how far toward the camera the thing is
          if (along < 0.3) continue;
          const side = Math.abs(dx - dz) / 2;             // how far off the line of sight
          if (side > f.r + 0.9) continue;
          if (along * RISE - (p.y || 0) < f.h + 0.4 && along < f.h / RISE + f.r + 1) { want = field && f.tree ? 2 : 1; break; }
        }
      }
      if (want !== f.on) { f.on = want; want ? f.hide(want >= 2, want === 3) : f.show(); }
    }
  }

  // where the see-through holes fall on screen: one round each of the first four the camera follows, as wide as about
  // one and a half of them are tall
  placeHoles() {
    const v = (this._hv ||= [new THREE.Vector2(), new THREE.Vector3(), new THREE.Vector3()]);
    const H = this.shared.uHoles.value, size = this.gl.getDrawingBufferSize(v[0]), a = v[1], b = v[2];
    for (let k = 0; k < 4; k++) {
      const p = this.holePts[k];
      if (!p) { H[k].set(0, 0, 0, 0); continue; }
      a.set(p.x, (p.y || 0) + 1.0, p.z).project(this.cam); b.set(p.x, (p.y || 0) + 1.9, p.z).project(this.cam);
      H[k].set((a.x * 0.5 + 0.5) * size.x, (a.y * 0.5 + 0.5) * size.y, Math.abs(b.y - a.y) * 0.5 * size.y * 2.1, 0);
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
    this.placeHoles();
    this.gl.render(this.scene, this.cam);
    this.edges.draw();
  }
}
