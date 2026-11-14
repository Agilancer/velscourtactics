// Stand-in 3D models, built from boxes and cones until the Meshy ones arrive.
// Every model is a Group whose userData.parts names the limbs, so one animator drives them all.
//
// To swap in a real model: put the .glb in assets/models/ and name it in assets/models/manifest.json
// under the same key the stand-in uses (see docs/MODELS.md). Nothing else changes.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { CLASSES } from '../data/classes.js';

const mats = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, ...opts }));
  return mats.get(key);
}
const geos = new Map();
const G = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
const box = (w, h, d) => G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const cyl = (rt, rb, h, n = 8) => G(`c${rt},${rb},${h},${n}`, () => new THREE.CylinderGeometry(rt, rb, h, n));
const sph = (r, n = 10) => G(`s${r},${n}`, () => new THREE.SphereGeometry(r, n, Math.max(6, n - 2)));
const cone = (r, h, n = 8) => G(`k${r},${h},${n}`, () => new THREE.ConeGeometry(r, h, n));

function part(geo, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.position.set(x, y, z);
  return m;
}
const grp = (x = 0, y = 0, z = 0, ...kids) => { const g = new THREE.Group(); g.position.set(x, y, z); for (const k of kids) g.add(k); return g; };

const SKIN = [0xd8b89a, 0xb88a66, 0x8a5e40, 0xe6cbb0];
const STEEL = 0x8f98a6, DARK = 0x1a1220, WOOD = 0x5a3c24, GOLD = 0xc9a24a, BONE = 0xd8d0b8;

// How each class dresses. body/trim are cloth and metal; hat and held are the silhouette hooks.
const KIT = {
  paladin: { body: 0x8f98a6, trim: 0x2a3a6a, hat: 'helm', held: 'mace', shield: 0x2a3a6a, cape: 0x2a3a6a },
  ranger: { body: 0x3e5a34, trim: 0x6a4a2a, hat: 'hood', held: 'bow' },
  wizard: { body: 0x7a3a1c, trim: 0xc9a24a, hat: 'point', held: 'staff', robe: true },
  necromancer: { body: 0x2a1c3a, trim: 0xd8d0b8, hat: 'hood', held: 'wand', robe: true },
  barbarian: { body: 0x7a4a2a, trim: 0xb8c8d8, hat: 'horns', held: 'axe', bare: true },
  dragoon: { body: 0x3a5a8a, trim: 0x8f98a6, hat: 'spike', held: 'spear', cape: 0x1c2c4a },
  totem_master: { body: 0x2e6a56, trim: 0xb07a3a, hat: 'mask', held: 'staff' },
  death_knight: { body: 0x2a2e3a, trim: 0x7ad0ff, hat: 'helm', held: 'sword', cape: 0x12060a },
  arcane_sorcerer: { body: 0x1c2a5a, trim: 0xd8e8ff, hat: 'veil', held: 'wand', robe: true },
  carrion_witch: { body: 0x3a4a22, trim: 0x1a1220, hat: 'witch', held: 'staff', robe: true },
  bard: { body: 0x8a2a44, trim: 0xc9a24a, hat: 'feather', held: 'lute' },
  slime_lord: { body: 0x2a5aa8, trim: 0xc9a24a, hat: 'crown', held: 'mace', slime: true },
  boomerang_knight: { body: 0x2a7a6a, trim: 0x8f98a6, hat: 'cap', held: 'boomerang' },
  lancer: { body: 0xa0a4b0, trim: 0x5a5a6a, hat: 'helm', held: 'spear', shield: 0x8f98a6, tower: true },
  dragon_knight: { body: 0x8a2a1a, trim: 0x2a1a1a, hat: 'spike', held: 'sword', shield: 0x5a1a10 },
  gunner: { body: 0x6a5a3a, trim: 0x3a2a1a, hat: 'goggles', held: 'pistol' },
  doorkeeper: { body: 0x4a3a2a, trim: 0xe6c27a, hat: 'witch', held: 'staff', robe: true },
};

function held(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'sword': g.add(part(box(0.07, 0.7, 0.03), STEEL, 0, 0.4, 0), part(box(0.24, 0.05, 0.06), GOLD, 0, 0.06, 0), part(box(0.05, 0.14, 0.05), WOOD, 0, -0.03, 0)); break;
    case 'axe': g.add(part(cyl(0.025, 0.025, 0.8, 6), WOOD, 0, 0.3, 0), part(box(0.3, 0.24, 0.04), STEEL, 0.1, 0.6, 0)); break;
    case 'mace': g.add(part(cyl(0.03, 0.03, 0.6, 6), WOOD, 0, 0.25, 0), part(box(0.2, 0.2, 0.2), STEEL, 0, 0.6, 0)); break;
    case 'spear': g.add(part(cyl(0.022, 0.022, 1.7, 6), WOOD, 0, 0.5, 0), part(cone(0.07, 0.28, 6), STEEL, 0, 1.47, 0)); break;
    case 'bow': { const b = new THREE.Mesh(G('bow', () => new THREE.TorusGeometry(0.42, 0.025, 6, 12, Math.PI)), mat(WOOD)); b.rotation.z = -Math.PI / 2; b.position.set(0, 0.25, 0); g.add(b, part(cyl(0.006, 0.006, 0.84, 4), BONE, 0, 0.25, 0)); break; }
    case 'pistol': g.add(part(box(0.07, 0.14, 0.07), WOOD, 0, 0.02, 0), part(cyl(0.035, 0.035, 0.34, 6), 0x3a3a3a, 0, 0.12, 0.14).rotateX(Math.PI / 2)); break;
    case 'boomerang': g.add(part(box(0.08, 0.4, 0.03), STEEL, 0, 0.3, 0), part(box(0.34, 0.08, 0.03), STEEL, 0.14, 0.5, 0)); break;
    case 'staff': g.add(part(cyl(0.03, 0.035, 1.5, 6), WOOD, 0, 0.45, 0), part(sph(0.1, 8), 0xff8a30, 0, 1.28, 0, { emissive: 0x7a3000 })); break;
    case 'wand': g.add(part(cyl(0.02, 0.028, 0.5, 6), BONE, 0, 0.22, 0), part(sph(0.06, 6), 0x9a70ff, 0, 0.5, 0, { emissive: 0x402080 })); break;
    case 'lute': g.add(part(sph(0.17, 8), 0x9a6a3a, 0, 0.1, 0).scale.set(1, 1.2, 0.5) && part(sph(0.17, 8), 0x9a6a3a, 0, 0.1, 0), part(box(0.05, 0.5, 0.04), WOOD, 0, 0.42, 0)); break;
  }
  return g;
}

function hat(kind, kit, g) {
  const o = new THREE.Group();
  switch (kind) {
    case 'helm': o.add(part(box(0.5, 0.3, 0.5), STEEL, 0, 0.1, 0), part(box(0.06, 0.2, 0.4), kit.trim, 0, 0.3, 0), part(box(0.3, 0.05, 0.04), DARK, 0, 0.06, 0.25)); break;
    case 'spike': o.add(part(box(0.5, 0.26, 0.5), kit.trim, 0, 0.1, 0), part(cone(0.07, 0.36, 6), STEEL, 0, 0.4, -0.05), part(box(0.3, 0.05, 0.04), DARK, 0, 0.06, 0.25)); break;
    case 'horns': o.add(part(box(0.48, 0.2, 0.48), 0x5a4a3a, 0, 0.14, 0), part(cone(0.06, 0.3, 6), BONE, 0.28, 0.28, 0).rotateZ(-0.5), part(cone(0.06, 0.3, 6), BONE, -0.28, 0.28, 0).rotateZ(0.5)); break;
    case 'hood': o.add(part(sph(0.28, 8), kit.body, 0, 0.04, -0.04), part(cone(0.16, 0.26, 6), kit.body, 0, 0.26, -0.12).rotateX(-0.5)); break;
    case 'point': o.add(part(cyl(0.38, 0.38, 0.03, 12), kit.body, 0, 0.14, 0), part(cone(0.24, 0.6, 8), kit.body, 0, 0.45, 0), part(cyl(0.245, 0.245, 0.06, 8), kit.trim, 0, 0.19, 0)); break;
    case 'witch': o.add(part(cyl(0.44, 0.44, 0.03, 12), DARK, 0, 0.13, 0), part(cone(0.23, 0.55, 8), DARK, 0, 0.42, -0.03).rotateX(-0.25), part(cyl(0.235, 0.235, 0.05, 8), kit.trim, 0, 0.18, 0)); break;
    case 'veil': o.add(part(sph(0.275, 8), kit.body, 0, 0.03, -0.03), part(box(0.34, 0.2, 0.02), kit.trim, 0, -0.1, 0.24, { transparent: true, opacity: 0.6 }), part(sph(0.05, 6), 0xd8e8ff, 0, 0.3, 0, { emissive: 0x4060a0 })); break;
    case 'mask': o.add(part(box(0.4, 0.46, 0.06), 0xb07a3a, 0, 0, 0.23), part(cone(0.05, 0.3, 5), 0xd04a2a, 0.1, 0.36, 0), part(cone(0.05, 0.34, 5), 0x4ac8a0, -0.08, 0.38, 0)); break;
    case 'feather': o.add(part(cyl(0.3, 0.32, 0.12, 10), kit.body, 0, 0.18, 0), part(cone(0.04, 0.4, 4), 0xe8e8e8, 0.2, 0.36, 0).rotateZ(-0.5)); break;
    case 'crown': o.add(part(cyl(0.2, 0.17, 0.14, 8), GOLD, 0, 0.26, 0, { emissive: 0x3a2a00 })); break;
    case 'cap': o.add(part(sph(0.265, 8), kit.trim, 0, 0.05, 0), part(cone(0.05, 0.2, 5), 0xe8e8e8, 0, 0.32, 0)); break;
    case 'goggles': o.add(part(box(0.5, 0.12, 0.5), 0x3a2a1a, 0, 0.14, 0), part(box(0.36, 0.1, 0.06), 0xc9a24a, 0, 0.04, 0.24)); break;
  }
  // hair under everything that leaves the head showing
  if (!['helm', 'spike', 'hood', 'veil'].includes(kind)) {
    const hc = kit.hair ?? 0x3a2416;
    o.add(part(sph(0.255, 8), hc, 0, 0.03, -0.04));
    if (g === 'f') o.add(part(box(0.36, 0.4, 0.1), hc, 0, -0.18, -0.2));
  }
  return o;
}

// A person. look: { cls, g: 'm'|'f', tint?, skin?, small? }
export function makePerson(look) {
  const kit = { ...(KIT[look.cls] || KIT.ranger) };
  if (look.tint != null) { kit.body = look.tint; kit.plain = true; }
  const f = look.g === 'f';
  const skin = look.skin ?? (kit.slime ? 0x4a8ae8 : SKIN[(look.cls.length + (f ? 1 : 0)) % SKIN.length]);
  const w = f ? 0.4 : 0.48;
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const legL = grp(-0.12, 0.45, 0, part(box(0.16, 0.45, 0.18), kit.robe ? kit.body : 0x2a221c, 0, -0.225, 0));
  const legR = grp(0.12, 0.45, 0, part(box(0.16, 0.45, 0.18), kit.robe ? kit.body : 0x2a221c, 0, -0.225, 0));
  const torso = new THREE.Group();
  if (kit.robe) torso.add(part(cyl(w * 0.42, w * 0.72, 0.92, 8), kit.body, 0, 0.5, 0), part(cyl(w * 0.74, w * 0.74, 0.05, 8), kit.trim, 0, 0.07, 0));
  else torso.add(part(box(w, 0.5, 0.3), kit.bare ? skin : kit.body, 0, 0.7, 0), part(box(w + 0.02, 0.1, 0.32), kit.trim, 0, 0.5, 0));
  if (kit.bare) torso.add(part(box(w + 0.02, 0.12, 0.32), kit.body, 0, 0.82, 0));
  if (!kit.robe && !kit.plain && !kit.bare && ['plate'].includes(CLASSES[look.cls]?.armor)) {
    torso.add(part(box(0.2, 0.14, 0.34), kit.trim, -w / 2 - 0.06, 0.93, 0), part(box(0.2, 0.14, 0.34), kit.trim, w / 2 + 0.06, 0.93, 0));
  }
  if (kit.cape && !kit.plain) torso.add(part(box(w + 0.06, 0.7, 0.04), kit.cape, 0, 0.6, -0.19));
  const head = grp(0, 1.2, 0, part(sph(0.24, 10), skin, 0, 0, 0), part(box(0.05, 0.05, 0.02), DARK, -0.09, 0.02, 0.23), part(box(0.05, 0.05, 0.02), DARK, 0.09, 0.02, 0.23));
  head.add(hat(kit.plain ? 'none' : kit.hat, kit, look.g));
  const sleeve = kit.bare ? skin : kit.body;
  const armL = grp(-w / 2 - 0.08, 0.92, 0, part(box(0.12, 0.42, 0.12), sleeve, 0, -0.2, 0), part(box(0.1, 0.1, 0.1), skin, 0, -0.44, 0));
  const armR = grp(w / 2 + 0.08, 0.92, 0, part(box(0.12, 0.42, 0.12), sleeve, 0, -0.2, 0), part(box(0.1, 0.1, 0.1), skin, 0, -0.44, 0));
  if (!kit.plain) {
    const h = held(kit.held); h.position.set(0, -0.44, 0.04); h.rotation.x = Math.PI / 2 - 0.5; armR.add(h);
    if (kit.shield != null) armL.add(part(kit.tower ? box(0.06, 0.8, 0.5) : box(0.06, 0.5, 0.4), kit.shield, -0.1, -0.3, 0.06), part(box(0.07, 0.12, 0.12), GOLD, -0.11, -0.3, 0.06));
  }
  body.add(legL, legR, torso, head, armL, armR);
  const s = look.small ? 0.68 : f ? 0.96 : 1;
  root.scale.setScalar(s * (look.scale || 1));
  root.userData.parts = { body, legL, legR, armL, armR, head, torso };
  root.userData.height = 1.6 * s * (look.scale || 1);
  return root;
}

// The dead. v is the zombie's definition from data/enemies.js.
export function makeZombie(v) {
  const c = v.color, dark = new THREE.Color(c).multiplyScalar(0.55).getHex();
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  const legL = grp(-0.12, 0.45, 0, part(box(0.16, 0.45, 0.18), dark, 0, -0.225, 0));
  const legR = grp(0.12, 0.45, 0, part(box(0.16, 0.45, 0.18), dark, 0, -0.225, 0));
  const torso = grp(0, 0, 0, part(box(0.46, 0.5, 0.3), dark, 0, 0.7, 0));
  if (v.id === 'bonesack') torso.add(part(sph(0.36, 10), 0x9aa85a, 0, 0.66, 0.1), part(sph(0.1, 6), 0xc8d07a, 0.16, 0.8, 0.36), part(sph(0.08, 6), 0xc8d07a, -0.12, 0.56, 0.4));
  if (v.id === 'brute') torso.add(part(box(0.7, 0.3, 0.4), dark, 0, 0.9, 0), part(G('chain', () => new THREE.TorusGeometry(0.32, 0.04, 6, 12)), 0x3a3a3a, 0, 0.78, 0).rotateX(Math.PI / 2));
  const head = grp(0, 1.16, 0.06, part(sph(0.22, 8), c, 0, 0, 0), part(box(0.06, 0.05, 0.02), 0xe8e0a0, -0.08, 0.02, 0.21, { emissive: 0x6a6020 }), part(box(0.06, 0.05, 0.02), 0xe8e0a0, 0.08, 0.02, 0.21, { emissive: 0x6a6020 }), part(box(0.16, 0.05, 0.02), DARK, 0, -0.1, 0.2));
  const armL = grp(-0.31, 0.9, 0, part(box(0.11, 0.46, 0.11), c, 0, -0.22, 0));
  const armR = grp(0.31, 0.9, 0, part(box(0.11, 0.46, 0.11), c, 0, -0.22, 0));
  // the dead of the lands past the pines: one or two bits each, enough to tell them apart at a glance
  const ICE = { transparent: true, opacity: 0.8, emissive: 0x203848 }, HOT = { emissive: 0xc04810 };
  const spike = (col, x, y, z, hgt = 0.3, rz = 0, o) => part(cone(0.07, hgt, 5), col, x, y, z, o).rotateZ(rz);
  switch (v.id) {
    case 'rimewalker': torso.add(spike(0xcfeaff, -0.26, 1.08, 0, 0.34, 0.5, ICE), spike(0xcfeaff, 0.26, 1.08, 0, 0.34, -0.5, ICE), spike(0xcfeaff, 0, 1.02, -0.18, 0.4, 0, ICE)); head.add(spike(0xcfeaff, 0, -0.26, 0.14, 0.2, Math.PI, ICE)); break;
    case 'driftling': torso.add(part(box(0.56, 0.2, 0.44), 0xf2f6f8, 0, 0.98, -0.04), part(box(0.5, 0.5, 0.06), 0xf2f6f8, 0, 0.66, -0.19)); break;
    case 'husk': torso.add(part(box(0.5, 0.08, 0.32), 0x8a3a2a, 0, 0.62, 0), part(box(0.08, 0.6, 0.04), 0xd8c8a0, 0.16, 0.5, -0.2).rotateX(0.5), part(box(0.08, 0.5, 0.04), 0xd8c8a0, -0.14, 0.52, -0.2).rotateX(0.7)); break;
    case 'slinger': for (const y of [0.56, 0.68, 0.8]) torso.add(part(box(0.5, 0.05, 0.34), BONE, 0, y, 0)); head.add(part(box(0.46, 0.1, 0.46), 0x8a2a22, 0, 0.14, 0)); armR.add(part(box(0.05, 0.4, 0.05), BONE, 0, -0.5, 0.1).rotateX(0.9)); break;
    case 'drowner': for (const x of [-0.2, 0, 0.2]) torso.add(part(box(0.06, 0.5, 0.03), 0x2e5a2a, x, 0.72, 0.17)); head.add(part(box(0.4, 0.06, 0.4), 0x2e5a2a, 0, 0.18, 0)); armL.add(part(box(0.14, 0.12, 0.14), 0x1a1a16, 0, -0.5, 0)); armR.add(part(box(0.14, 0.12, 0.14), 0x1a1a16, 0, -0.5, 0)); break;
    case 'leechmother': torso.add(part(sph(0.34, 10), 0xc8b8b0, 0, 0.66, 0.08)); for (const [x, y, z] of [[0.2, 0.8, 0.3], [-0.18, 0.6, 0.34], [0.05, 0.46, 0.36], [-0.3, 0.84, 0.1], [0.32, 0.56, 0.12]]) torso.add(part(sph(0.09, 6), 0x120c10, x, y, z)); break;
    case 'cinder': torso.add(part(box(0.3, 0.06, 0.32), 0xff7a20, 0, 0.74, 0, HOT), part(box(0.06, 0.3, 0.32), 0xff7a20, 0.08, 0.66, 0, HOT)); head.add(part(box(0.2, 0.04, 0.02), 0xff7a20, 0, -0.1, 0.21, HOT)); break;
    case 'slagback': torso.add(part(sph(0.44, 7), 0x26242a, 0, 0.98, -0.2), part(box(0.2, 0.08, 0.2), 0xff7a20, 0.1, 1.24, -0.3, HOT), part(box(0.74, 0.3, 0.4), dark, 0, 0.9, 0)); armR.add(part(box(0.2, 0.5, 0.2), 0x26242a, 0, -0.24, 0)); break;
    case 'warden': torso.add(part(box(0.74, 0.3, 0.4), 0x8f98a6, 0, 0.9, 0), part(box(0.6, 0.8, 0.05), 0xe8eef2, 0, 0.6, -0.2)); for (const a of [-0.5, 0, 0.5]) head.add(spike(0xcfeaff, Math.sin(a) * 0.2, 0.3, 0, 0.36, -a, ICE)); armR.add(part(cyl(0.025, 0.025, 1.7, 5), WOOD, 0, -0.1, 0.3).rotateX(Math.PI / 2 - 0.4), part(box(0.04, 0.4, 0.16), 0xcfeaff, 0, 0.26, 1.04, ICE)); break;
    case 'dryking': head.add(part(cyl(0.2, 0.17, 0.2, 6), GOLD, 0, 0.26, 0), spike(BONE, 0, 0.44, 0, 0.2)); torso.add(part(box(0.5, 0.1, 0.34), GOLD, 0, 0.94, 0), part(box(0.5, 0.9, 0.04), 0xe0d4b8, 0, 0.5, -0.2)); break;
    case 'abbess': head.add(part(cone(0.3, 0.6, 8), 0x14141c, 0, 0.12, -0.04), part(box(0.3, 0.08, 0.04), 0xd8d8d0, 0, 0.12, 0.2)); torso.add(part(cyl(0.2, 0.42, 0.95, 8), 0x14141c, 0, 0.48, 0), part(box(0.05, 0.4, 0.03), 0x2e5a2a, 0.12, 0.5, 0.3)); break;
    case 'stoker': torso.add(part(box(0.56, 0.5, 0.08), 0x3a3a3e, 0, 0.72, 0.16), part(box(0.2, 0.14, 0.03), 0xff7a20, 0, 0.7, 0.21, HOT), part(box(0.74, 0.3, 0.4), dark, 0, 0.9, 0)); head.add(part(cyl(0.2, 0.24, 0.1, 8), 0x1a1a1a, 0, 0.2, 0)); armR.add(part(cyl(0.03, 0.03, 1.2, 5), WOOD, 0, -0.3, 0.3).rotateX(Math.PI / 2 - 0.4), part(box(0.3, 0.04, 0.34), 0x3a3a3e, 0, -0.06, 0.92)); break;
  }
  body.add(legL, legR, torso, head, armL, armR);
  body.rotation.x = v.id === 'gnawer' || v.id === 'husk' ? 0.5 : v.id === 'slagback' ? 0.4 : 0.16;
  root.scale.setScalar(v.scale);
  root.userData.parts = { body, legL, legR, armL, armR, head, torso };
  root.userData.zombie = true;
  root.userData.lean = body.rotation.x;
  root.userData.height = 1.5 * v.scale;
  return root;
}

// What the classes call up.
export function makeCreature(kind) {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  let parts = { body }, height = 0.9;
  const legs = (c, y, sx, sz) => {
    const mk = (x, z) => grp(x, y, z, part(box(0.1, y, 0.1), c, 0, -y / 2, 0));
    const a = mk(-sx, sz), b = mk(sx, sz), d = mk(-sx, -sz), e = mk(sx, -sz);
    body.add(a, b, d, e);
    parts.legL = a; parts.legR = b; parts.armL = e; parts.armR = d;
  };
  if (kind === 'wolf') {
    body.add(part(box(0.34, 0.3, 0.8), 0x6a6a72, 0, 0.5, 0), part(box(0.26, 0.26, 0.3), 0x7a7a84, 0, 0.66, 0.48), part(box(0.12, 0.1, 0.2), 0x4a4a52, 0, 0.6, 0.7), part(box(0.08, 0.08, 0.4), 0x5a5a62, 0, 0.56, -0.56));
    legs(0x5a5a62, 0.36, 0.13, 0.28);
  } else if (kind === 'slime') {
    const s = part(sph(0.4, 12), 0x4a8ae8, 0, 0.3, 0, { transparent: true, opacity: 0.85 }); s.scale.y = 0.75;
    body.add(s, part(sph(0.05, 6), DARK, -0.12, 0.38, 0.33), part(sph(0.05, 6), DARK, 0.12, 0.38, 0.33)); height = 0.7;
  } else if (kind === 'whelp') {
    body.add(part(sph(0.26, 8), 0xc8482a, 0, 0.8, 0), part(sph(0.17, 8), 0xd85a3a, 0, 1.0, 0.24), part(box(0.5, 0.04, 0.3), 0x8a2a1a, -0.4, 0.9, 0).rotateZ(0.4), part(box(0.5, 0.04, 0.3), 0x8a2a1a, 0.4, 0.9, 0).rotateZ(-0.4), part(cone(0.07, 0.4, 5), 0xc8482a, 0, 0.66, -0.36).rotateX(-1.3));
    parts.fly = true; height = 1.3;
  } else if (kind === 'turret') {
    body.add(part(cyl(0.05, 0.3, 0.5, 3), 0x5a4a3a, 0, 0.25, 0), part(box(0.34, 0.26, 0.34), 0xb08a4a, 0, 0.62, 0), part(cyl(0.05, 0.05, 0.5, 6), 0x3a3a3a, 0, 0.64, 0.38).rotateX(Math.PI / 2)); height = 0.9;
  } else if (kind === 'totem') {
    body.add(part(cyl(0.2, 0.24, 0.5, 8), 0x7a4a2a, 0, 0.25, 0), part(cyl(0.2, 0.2, 0.45, 8), 0x2e8a6a, 0, 0.72, 0), part(cyl(0.16, 0.2, 0.4, 8), 0xb04a2a, 0, 1.14, 0), part(box(0.6, 0.06, 0.08), 0x7a4a2a, 0, 1.05, 0), part(sph(0.06, 6), 0xffe2a0, 0, 0.74, 0.2, { emissive: 0x806020 })); height = 1.4;
  }
  root.userData.parts = parts;
  root.userData.height = height;
  return root;
}

export function makeSummon(model) {
  if (model === 'skeleton') return makePerson({ cls: 'necromancer', g: 'm', tint: 0xd8d0b8, skin: 0xe8e0c8, scale: 0.9 });
  if (model === 'ghoul') return makeZombie({ id: 'gnawer', color: 0x7a6a8a, scale: 0.95 });
  if (model === 'squire') return makePerson({ cls: 'lancer', g: 'm', scale: 0.85 });
  return makeCreature(model);
}

// ---- animation: one state machine for every stand-in ----
// The seven every model has: idle | walk | attack | cast | hit | dead | cheer.
// A real model may have more (jump, run, wounded, stunned, guard, revive, talk, item, taunt, point, and one per skill);
// where it has none, or on a stand-in, the state falls back along this table (null: carry on as you were).
const FALLBACK = { jump: null, run: 'walk', wounded: 'idle', stunned: 'idle', guard: 'idle', revive: 'idle', talk: 'idle', item: 'cast', taunt: null, point: null };
const LOOPS = new Set(['idle', 'walk', 'run', 'wounded', 'stunned', 'guard', 'talk', 'cheer']);
const STANDIN = new Set(['idle', 'walk', 'attack', 'cast', 'hit', 'dead', 'cheer']);
export function setAnim(model, state, hold = 0, fallback) {
  const a = (model.userData.anim ||= { state: 'idle', t: 0, hold: 0 });
  if (a.state === 'dead' && state !== 'idle' && state !== 'revive') return;
  const clips = model.userData.clips;
  // find something this model can actually play
  for (let n = 0; n < 4 && !(clips ? clips[state] : STANDIN.has(state)); n++) {
    const next = state in FALLBACK ? FALLBACK[state] : (fallback || 'idle');
    if (next === null) return;
    state = next; fallback = null;
  }
  if (state === 'idle' && clips && model.userData.rest && clips[model.userData.rest]) state = model.userData.rest;
  if (a.state === state && LOOPS.has(state)) return;
  a.state = state; a.t = 0; a.hold = clips ? 0 : hold;
  if (model.userData.mixer) playClip(model, state);
}
// What a model does when it has nothing else to do: 'idle', or 'wounded' or 'stunned' while that lasts.
export function setRest(model, state) {
  const was = model.userData.rest || 'idle';
  if (was === state) return;
  model.userData.rest = state === 'idle' ? null : state;
  const a = model.userData.anim;
  if (a && (a.state === 'idle' || a.state === was)) { a.state = ''; setAnim(model, 'idle'); }
}

export function animate(model, dt) {
  const a = (model.userData.anim ||= { state: 'idle', t: Math.random() * 6, hold: 0 });
  a.t += dt;
  if (model.userData.mixer) { model.userData.mixer.update(dt); model.userData.post?.(a.state); return; }
  const p = model.userData.parts;
  if (!p) return;
  const lean = model.userData.lean || 0, zomb = model.userData.zombie;
  let lx = 0, rx = 0, ax = zomb ? -1.2 : 0, bx = zomb ? -1.1 : 0, by = 0, brx = lean, brz = 0;
  const t = a.t;
  switch (a.state) {
    case 'walk': { const s = Math.sin(t * 10) * 0.7; lx = s; rx = -s; if (!zomb) { ax = -s * 0.7; bx = s * 0.7; } else { ax += s * 0.2; bx -= s * 0.2; brz = Math.sin(t * 5) * 0.08; } by = Math.abs(Math.sin(t * 10)) * 0.04; break; }
    case 'attack': { const k = Math.min(1, t / 0.32); bx = -2.4 * Math.sin(k * Math.PI) - 0.2; if (zomb) ax = bx; brx = lean + 0.3 * Math.sin(k * Math.PI); break; }
    case 'cast': { const k = Math.min(1, t / 0.5); ax = bx = -2.7 * Math.sin(k * Math.PI * 0.5 + 0.2); by = 0.05 * Math.sin(t * 20); break; }
    case 'hit': { brx = lean - 0.35 * Math.max(0, 1 - t / 0.25); brz = Math.sin(t * 50) * 0.08 * Math.max(0, 1 - t / 0.25); break; }
    case 'cheer': { ax = bx = -2.8; by = Math.abs(Math.sin(t * 8)) * 0.15; break; }
    case 'dead': { const k = Math.min(1, t / 0.5); brx = -Math.PI / 2 * k; by = 0.1 * k; break; }
    default: by = Math.sin(t * 2) * 0.012; if (!zomb) { ax = Math.sin(t * 2) * 0.05; bx = -ax; } else brz = Math.sin(t * 1.3) * 0.05;
  }
  if (p.fly) by += 0.1 * Math.sin(t * 5);
  if (p.legL) p.legL.rotation.x = lx;
  if (p.legR) p.legR.rotation.x = rx;
  if (p.armL) p.armL.rotation.x = ax;
  if (p.armR) p.armR.rotation.x = bx;
  p.body.position.y = by; p.body.rotation.x = brx; p.body.rotation.z = brz;
  if (a.hold && a.t > a.hold && a.state !== 'dead') { a.state = 'idle'; a.t = 0; a.hold = 0; }
}

// ---- real models, when there are any ----
let manifest = null;
const loaded = new Map();
export async function loadManifest() {
  try { const r = await fetch('assets/models/manifest.json'); manifest = r.ok ? await r.json() : {}; } catch { manifest = {}; }
}
function playClip(model, state) {
  const u = model.userData, clip = u.clips[state] || u.clips.idle;
  if (!clip) return;
  const act = u.mixer.clipAction(clip), once = !LOOPS.has(state);
  act.reset(); act.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); act.clampWhenFinished = once;
  act.timeScale = (u.speed && u.speed[state]) || 1;
  if (u.playing && u.playing !== act) act.crossFadeFrom(u.playing, 0.12, false);
  act.play(); u.playing = act;
}
// The same geometry with every vertex's normal averaged over all vertices at its position.
function smoothed(geo) {
  const g = geo.clone(), pos = g.attributes.position, nor = g.attributes.normal.clone(), sum = new Map();
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) { const k = key(i), a = sum.get(k) || [0, 0, 0]; a[0] += nor.getX(i); a[1] += nor.getY(i); a[2] += nor.getZ(i); sum.set(k, a); }
  for (let i = 0; i < pos.count; i++) { const a = sum.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; nor.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
  g.setAttribute('normal', nor);
  return g;
}
// Keeps a clip on its tile: the root bone's sideways and forward travel is flattened, its height kept.
function inPlace(clip, home) {
  for (const tr of clip.tracks) {
    if (!/Hips\.position$/.test(tr.name)) continue;
    const v = tr.values, h = home || [v[0], v[1], v[2]];
    for (let i = 0; i < v.length; i += 3) { v[i] = h[0]; v[i + 2] = h[2]; }
    return h;
  }
  return home;
}
// Wraps a stand-in: if the manifest names a .glb for this key, the stand-in is replaced once it loads.
// Manifest entry: { file, height, turn, anims: {state: clipName}, speed: {state: n}, inPlace, matte, lift,
//   trim: {state: [from, to]}        seconds of the clip to keep for that state
//   bones: {boneNameEnding: scale}   proportions, nearer the compact tactics look (legs shorter, head bigger)
//   outline: thickness               a dark hull round the figure so it reads against the ground
//   normal: strength                 how hard the baked normal map bites
//   glow: { bone, at: [x,y,z], color, size, light, held: {state: bone} }   a lit thing she carries
//   props: [{ file, bone, at: [x,y,z], rot: [x,y,z,w], scale }]   held models (a lance, a shield) hung on a bone, placed in
//          its frame; tools/blender/retarget.py works the numbers out (Target.props) and turns the hands in every clip }
const glb = (file) => {
  if (!loaded.has(file)) loaded.set(file, new Promise((res, rej) => new GLTFLoader().load('assets/models/' + file, res, undefined, rej)));
  return loaded.get(file);
};
export function withOverride(key, standIn) {
  const def = manifest && manifest[key];
  if (!def) return standIn;
  const holder = new THREE.Group();
  holder.add(standIn);
  holder.userData = { ...standIn.userData };
  const paint = (obj) => obj.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;                             // a skinned mesh's bounds are its rest pose's
    o.material = o.material.clone();
    // exports often arrive marked as blended; a body is solid unless the manifest says otherwise
    if (!def.blend) { o.material.transparent = false; o.material.depthWrite = true; o.material.opacity = 1; o.material.alphaTest = 0; }
    // There is no environment to reflect, so metal would go black: Meshy's bakes are read as matte paint.
    if (def.matte !== false) { o.material.metalness = 0; o.material.metalnessMap = null; o.material.roughness = 1; o.material.roughnessMap = null; }
    // lift: how much of the model's own colour glows back, so dark costumes still read at this distance
    if (def.lift) { o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveMap = o.material.map; o.material.emissiveIntensity = def.lift; }
  });
  const use = (gltf) => {
    const obj = cloneSkinned(gltf.scene);
    obj.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(obj), h = bb.max.y - bb.min.y || 1;
    const want = def.height || standIn.userData.height || 1.6;
    obj.scale.setScalar(want / h); obj.position.y = -bb.min.y * (want / h);
    obj.rotation.y = def.turn || 0;
    paint(obj);
    const bones = {};
    obj.traverse((o) => { if (o.isBone) bones[o.name] = o; });
    const find = (end) => Object.keys(bones).filter((n) => n.endsWith(end)).map((n) => bones[n]);
    for (const pr of def.props || []) {                  // held models, each on its bone (added after the height is measured)
      const b = find(pr.bone)[0];
      if (!b) { console.warn('model', key, 'has no bone', pr.bone, 'for', pr.file); continue; }
      glb(pr.file).then((g) => {
        const m = g.scene.clone(true);
        m.position.fromArray(pr.at); m.quaternion.fromArray(pr.rot); m.scale.setScalar(pr.scale || 1);
        paint(m); b.add(m);
      }).catch((e) => console.warn('model', key, 'could not load', pr.file, e));
    }
    // proportions: scale some bones every frame (the clips don't key scale), and put the feet back on the ground
    const scaled = [];
    for (const [end, k] of Object.entries(def.bones || {})) for (const b of find(end)) scaled.push([b, k]);
    const leg = (def.bones && (def.bones.LeftUpLeg || def.bones.UpLeg)) || 1;
    if (leg !== 1) { const up = find('LeftUpLeg')[0]; if (up) obj.position.y -= up.getWorldPosition(new THREE.Vector3()).y * (1 - leg); }
    obj.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      if (def.normal != null && o.material.normalScale) o.material.normalScale.setScalar(def.normal);
      if (def.outline && !o.userData.hull) {
        const m = new THREE.MeshBasicMaterial({ color: def.outlineColor || 0x14121f, side: THREE.BackSide });
        m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${def.outline.toFixed(4)};`); };
        const hull = new THREE.SkinnedMesh(smoothed(o.geometry), m);
        hull.bind(o.skeleton, o.bindMatrix); hull.frustumCulled = false; hull.userData.hull = true;
        hull.position.copy(o.position); hull.quaternion.copy(o.quaternion); hull.scale.copy(o.scale);
        o.parent.add(hull);
      }
    });
    let glow = null;
    if (def.glow) {
      const g = def.glow, c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: g.color || '#ffb347', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: g.opacity ?? 0.55 }));
      glow.scale.setScalar(g.size || 0.5); glow.renderOrder = 5;
      const lamp = g.light ? new THREE.PointLight(g.color || '#ffb347', g.light, 3.2, 1.4) : null;
      if (lamp) glow.add(lamp);
      holder.add(glow);
      glow.userData = { home: find(g.bone || 'Hips')[0], at: new THREE.Vector3(...(g.at || [0, 0, 0])), held: Object.fromEntries(Object.entries(g.held || {}).map(([st, b]) => [st, find(b)[0]])), size: g.size || 0.5, opacity: g.opacity ?? 0.55, lamp, light: g.light || 0 };
    }
    const v = new THREE.Vector3();
    holder.userData.post = (state) => {
      for (const [b, k] of scaled) { if (k.length) b.scale.set(k[0], k[1], k[2]); else b.scale.setScalar(k); }
      if (!glow) return;
      const u = glow.userData, hand = u.held[state], b = hand || u.home;
      if (!b) return;
      b.updateWorldMatrix(true, false);
      v.copy(hand ? v.set(0, 0, 0) : u.at); b.localToWorld(v); holder.worldToLocal(v);
      glow.position.lerp(v, hand || glow.userData.was ? 0.35 : 1); glow.userData.was = !!hand;
      const want = u.size * (hand ? 2.2 : 1) * (1 + 0.06 * Math.sin(performance.now() / 130));
      glow.scale.setScalar(glow.scale.x + (want - glow.scale.x) * 0.2);
      const lit = state === 'dead' ? 0.2 : 1;                      // the lantern gutters when she falls
      glow.material.opacity += (u.opacity * lit - glow.material.opacity) * 0.1;
      if (u.lamp) u.lamp.intensity += (u.light * lit - u.lamp.intensity) * 0.1;
    };
    holder.remove(standIn); holder.add(obj);
    holder.userData.parts = null;
    holder.userData.height = want;
    holder.userData.mixer = new THREE.AnimationMixer(obj);
    holder.userData.speed = def.speed || {};
    const clips = {};
    let home = null;
    const prep = (c) => { if (def.inPlace) { const k = c.clone(); home = inPlace(k, home); return k; } return c; };
    const order = Object.entries(def.anims || {}).sort((a, b) => (a[0] === 'idle' ? -1 : b[0] === 'idle' ? 1 : 0));
    for (const [state, name] of order) {
      let c = gltf.animations.find((c) => c.name === name);
      if (!c) { console.warn('model', key, 'has no clip named', name); continue; }
      const cut = def.trim && def.trim[state];             // [from, to] in seconds: library clips come with long wind-ups
      if (cut) c = THREE.AnimationUtils.subclip(c, name + ':' + state, Math.round(cut[0] * 30), Math.round(cut[1] * 30), 30);
      clips[state] = prep(c);
    }
    if (!clips.idle && gltf.animations[0]) clips.idle = gltf.animations[0];
    holder.userData.clips = clips;
    holder.userData.mixer.addEventListener('finished', () => {
      const a = holder.userData.anim;
      if (a && a.state !== 'dead' && !LOOPS.has(a.state)) { a.state = ''; setAnim(holder, 'idle'); }
    });
    // start whatever it was doing (idle if nothing has animated it yet: setAnim would take that for already playing)
    const a = (holder.userData.anim ||= { state: 'idle', t: 0, hold: 0 }), st = a.state || 'idle';
    a.state = '';
    setAnim(holder, st);
    holder.userData.mixer.update(0);                     // posed now, not in the file's A-pose until something animates it
  };
  glb(def.file).then(use).catch((e) => console.warn('model', key, 'failed to load; keeping the stand-in', e));
  return holder;
}

// One blob of dark under each unit, instead of real shadows.
export function shadowDisc(r = 0.34) {
  const m = new THREE.Mesh(G('disc' + r, () => new THREE.CircleGeometry(r, 16)), mat(0x000000, { transparent: true, opacity: 0.32, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.renderOrder = 1;
  return m;
}

// Text on a sprite: name tags, signs, the red "!".
export function label(text, { color = '#e9dcc4', size = 44, bg = 'rgba(8,5,4,.72)', scale = 1, bold = true } = {}) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  const font = `${bold ? '700 ' : ''}${size}px Cinzel, Georgia, serif`;
  x.font = font;
  const w = Math.ceil(x.measureText(text).width) + 28, h = size + 22;
  c.width = w; c.height = h;
  if (bg) { x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, w, h, 10); x.fill(); }
  x.font = font; x.fillStyle = color; x.textBaseline = 'middle'; x.textAlign = 'center';
  x.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set((w / h) * 0.34 * scale, 0.34 * scale, 1);
  s.renderOrder = 20;
  return s;
}
