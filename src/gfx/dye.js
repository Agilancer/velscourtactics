// What a body is wearing, painted on it. bm's hero bodies (tools/bm/heroes.py) know, vertex by vertex, which piece of the
// harness they are (helm, chest, shoulders, arms, legs, boots, mail) and what it's made of (plate, cloth, mail); a picture
// beside each (<body>.dye.png) knows, texel by texel, what of it takes a dye: red the dyed cloth and enamel, green the
// bare steel and undyed cloth, blue the gilding. Skin, leather and hair are none of them and stay as they are.
//
// Each piece is painted in the colours of what is worn there: the helm in the helm's look, the rest in the armour's, as bm's
// player skins have them part by part (data/skins.js): the cloth in the skin's cloth, woven in its swatch where the piece
// is cloth, the enamel in the same colour plain, the gilding turned to its trim, the steel tinted by the armour's tier
// (rust to mithril). A piece with nothing worn over it is in the wearer's own colours (`palette`, below), or as it came.
import * as THREE from 'three';
import { SWATCH } from '../data/skins.js';
import { skinOf } from '../data/gear.js';

export const REGIONS = ['helm', 'chest', 'shoulders', 'arms', 'legs', 'boots', 'mail'];
const PART = { helm: 'head', chest: 'chest', shoulders: 'shoulders', arms: 'shoulders', legs: 'legs', boots: 'feet' };
const KIND = { plate: 0, leather: 0, cloth: 1, mail: 2 };
const N = REGIONS.length;

// The colours a recruit wears of their own (data/cast.js `palette`), after bm's hero palettes (tools/heroes/build.py):
// cloth for the dyed cloth and enamel, metal a tint over the steel.
export const PALETTES = {
  crimson: { cloth: '#7c1a24' }, royal: { cloth: '#23397a' }, verdant: { cloth: '#2f6a34' }, violet: { cloth: '#56307a' },
  ember: { cloth: '#94461c' }, frost: { cloth: '#6f9cb4', metal: [0.88, 0.94, 1.04] }, ash: { cloth: '#56544f', metal: [0.94, 0.94, 0.94] },
  bone: { cloth: '#b4a582', metal: [1.06, 1.02, 0.94] }, midnight: { cloth: '#1e2446', metal: [0.72, 0.76, 0.88] },
  teal: { cloth: '#1d6a66' }, rose: { cloth: '#a04a6c' }, moss: { cloth: '#4c6226', metal: [0.92, 0.96, 0.88] },
  plum: { cloth: '#5a2456' }, garnet: { cloth: '#6a1420' }, umber: { cloth: '#5a3c22' }, slate: { cloth: '#3a4652', metal: [0.86, 0.9, 0.96] },
  night: { cloth: '#191c26', metal: [0.6, 0.63, 0.72] },
};
// the steel of each armour tier, Rusted .. Mithril (data/items.js TIERS)
const TIER_METAL = [[0.86, 0.68, 0.54], [0.76, 0.78, 0.82], [1, 1, 1], [0.8, 0.86, 1.0], [1.1, 1.16, 1.26]];

/** What each piece of a hero's body wears: [{ cloth, trim, sw, sc, metal }] by REGIONS, from their armour and helm and
 * their own palette. */
export function dyeFor(h, palette) {
  const pal = PALETTES[palette] || null, armor = h?.equip?.armor, helm = h?.equip?.helm;
  return REGIONS.map((reg) => {
    const it = reg === 'helm' ? helm : armor, sk = skinOf(it), p = sk && PART[reg] && sk.parts[PART[reg]];
    const metal = it ? TIER_METAL[it.tier] || null : pal?.metal || null;
    if (reg === 'mail') return { metal };
    if (p) return { cloth: '#' + p[0], trim: p[1] ? '#' + p[1] : null, sw: p[2], sc: p[3], metal };
    return { cloth: pal?.cloth || null, metal };
  });
}
/** A short key for a dye, so a body is dressed again only when what it wears has changed. */
export const dyeSig = (d) => (d ? d.map((r) => `${r.cloth || ''}${r.trim || ''}${r.sw ?? ''}${r.metal || ''}`).join('|') : '');

// ---- the pictures, shared by every dyed body ----
let sheet = null;
function swatches() {
  if (sheet) return sheet;
  const { tile, cols, count } = SWATCH;
  const data = new Uint8Array(tile * tile * 4 * Math.max(1, count));
  sheet = new THREE.DataArrayTexture(data, tile, tile, Math.max(1, count));
  sheet.colorSpace = THREE.SRGBColorSpace;
  sheet.wrapS = sheet.wrapT = THREE.RepeatWrapping;
  sheet.magFilter = THREE.LinearFilter; sheet.minFilter = THREE.LinearMipmapLinearFilter;
  sheet.generateMipmaps = true;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, img.width, img.height).data;
    for (let i = 0; i < count; i++) {
      const ox = (i % cols) * tile, oy = Math.floor(i / cols) * tile;
      for (let y = 0; y < tile; y++) data.set(px.subarray(((oy + y) * img.width + ox) * 4, ((oy + y) * img.width + ox + tile) * 4), (i * tile + y) * tile * 4);
    }
    sheet.needsUpdate = true;
  };
  img.src = SWATCH.file;
  return sheet;
}
const masks = new Map();
function maskFor(file) {
  if (!masks.has(file)) {
    const t = new THREE.TextureLoader().load('assets/models/' + file.replace(/\.glb$/, '.dye.png'));
    t.flipY = false; t.colorSpace = THREE.NoColorSpace;
    masks.set(file, t);
  }
  return masks.get(file);
}

// which piece each vertex is, worked out once per geometry from the file's piece table
function tagPieces(geo, pieces) {
  if (geo.attributes.dyeR) return;
  const n = geo.attributes.position.count, R = new Float32Array(n).fill(N), K = new Float32Array(n);
  for (const p of pieces) {
    const reg = REGIONS.indexOf(String(p.name).split('_')[0]), kind = KIND[p.kind] ?? 0;
    for (let v = p.vstart; v < p.vstart + p.vcount && v < n; v++) { R[v] = reg < 0 ? N : reg; K[v] = kind; }
  }
  geo.setAttribute('dyeR', new THREE.BufferAttribute(R, 1));
  geo.setAttribute('dyeK', new THREE.BufferAttribute(K, 1));
}

const VERT_HEAD = 'attribute float dyeR;\nattribute float dyeK;\nflat varying int vDyeR;\nflat varying int vDyeK;\nvarying vec3 vDyeP;\nvarying vec3 vDyeN;\nuniform float dyeUnit;\n';
const FRAG_HEAD = `flat varying int vDyeR;
flat varying int vDyeK;
varying vec3 vDyeP;
varying vec3 vDyeN;
uniform sampler2D dyeMask;
uniform highp sampler2DArray dyeSw;
uniform vec3 dyeCloth[${N}];
uniform vec3 dyeTrim[${N}];
uniform vec3 dyeMetal[${N}];
uniform vec4 dyeOn[${N}];
uniform vec4 dyeWeave[${N}];
vec3 dyeTo(vec3 c, vec3 t) {
  // the target's colour at most of the texel's own brightness: shading and detail kept, a dark cloth stays dark-ish
  float L = max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 1e-4), Lt = max(dot(t, vec3(0.2126, 0.7152, 0.0722)), 1e-4);
  return t * (pow(L, 0.72) * pow(Lt, 0.28) / Lt);
}
`;
const FRAG_BODY = `
  if (vDyeR < ${N}) {
    vec3 dm = texture2D(dyeMask, vMapUv).rgb, c = diffuseColor.rgb;
    vec4 on = dyeOn[vDyeR], wv = dyeWeave[vDyeR];
    float wd = vDyeK == 1 ? max(dm.r, dm.g) : dm.r, wp = vDyeK == 1 ? 0.0 : dm.g;
    if (on.x > 0.0 && wd > 0.0) {
      vec3 t = dyeCloth[vDyeR];
      if (vDyeK == 1 && wv.x >= 0.0) {
        vec3 n = abs(normalize(vDyeN)); n = n * n * n * n; n /= n.x + n.y + n.z;
        vec3 p = vDyeP * wv.y;
        vec3 sw = texture(dyeSw, vec3(p.zy, wv.x)).rgb * n.x + texture(dyeSw, vec3(p.xz, wv.x)).rgb * n.y + texture(dyeSw, vec3(p.xy, wv.x)).rgb * n.z;
        t = mix(t, sw * wv.z, wv.w);
      }
      c = mix(c, dyeTo(c, t), wd * on.x);
    }
    if (wp > 0.0) c = mix(c, c * dyeMetal[vDyeR], wp * on.z);
    if (on.y > 0.0 && dm.b > 0.0) c = mix(c, dyeTo(c, dyeTrim[vDyeR]), dm.b * on.y);
    diffuseColor.rgb = c;
  }
`;

const lin = (hex) => new THREE.Color(hex);   // three keeps colours linear: a hex given is read as sRGB
function fill(u, d, weave) {
  for (let i = 0; i < N; i++) {
    const r = d?.[i] || {};
    u.dyeCloth.value[i].copy(r.cloth ? lin(r.cloth) : new THREE.Color(1, 1, 1));
    u.dyeTrim.value[i].copy(r.trim ? lin(r.trim) : new THREE.Color(1, 1, 1));
    u.dyeMetal.value[i].fromArray(r.metal || [1, 1, 1]);
    u.dyeOn.value[i].set(r.cloth ? 1 : 0, r.trim ? 0.85 : 0, r.metal ? 1 : 0, 0);
    // the weave: a swatch tile every `sc` metres, at the cloth's own brightness, laid over its colour
    u.dyeWeave.value[i].set(r.sw ?? -1, 1 / (r.sc || 0.1), 1, r.sw >= 0 ? weave : 0);
  }
}

/** Gets a freshly loaded bm body ready to wear a dye (models.js, withOverride): obj is the clone, def its manifest entry. */
export function dyeBody(holder, obj, def) {
  const pieces = obj.userData?.pieces;
  if (!pieces) return;
  const unit = 1.8 / (obj.userData.height || 1.8), mats = [];
  obj.traverse((o) => {
    if (!o.isSkinnedMesh || o.userData.hull || !o.material.map) return;
    tagPieces(o.geometry, pieces);
    const m = o.material, u = {
      dyeMask: { value: maskFor(def.file) }, dyeSw: { value: swatches() }, dyeUnit: { value: unit },
      dyeCloth: { value: Array.from({ length: N }, () => new THREE.Color()) }, dyeTrim: { value: Array.from({ length: N }, () => new THREE.Color()) },
      dyeMetal: { value: Array.from({ length: N }, () => new THREE.Vector3(1, 1, 1)) },
      dyeOn: { value: Array.from({ length: N }, () => new THREE.Vector4()) }, dyeWeave: { value: Array.from({ length: N }, () => new THREE.Vector4(-1, 1, 1, 0)) },
    };
    m.userData.dye = u;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vDyeR = int(dyeR + 0.5); vDyeK = int(dyeK + 0.5); vDyeP = position * dyeUnit; vDyeN = normal;');
      sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>' + FRAG_BODY);
    };
    m.customProgramCacheKey = () => 'dye';
    m.needsUpdate = true;
    mats.push(m);
  });
  holder.userData.dyeMats = mats;
  holder.userData.dyeBase = def.dye || null;            // a body always dyed (the female ninja's archer leathers)
  const w = holder.userData.wear;
  setDye(holder, w?.h, w?.palette);
}

/** Dresses a body in what a hero wears (h: their equip; palette: their own colours, data/cast.js), now if it has loaded,
 * else as soon as it does. With no hero, only the palette; with neither, as it came. */
export function setDye(holder, h = null, palette = null) {
  holder.userData.wear = { h, palette };
  if (!holder.userData.dyeMats) return;
  const base = palette || holder.userData.dyeBase, d = h || base ? dyeFor(h, base) : null;
  for (const m of holder.userData.dyeMats) fill(m.userData.dye, d, 0.55);
}
