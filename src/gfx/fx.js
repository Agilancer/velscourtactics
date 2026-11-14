// The show a fight puts on: particles, light, beams, rings and runes on the ground, and the camera's part in it
// (a shake, a punch of zoom, the world going dark for a big spell, a stopped frame on a heavy blow).
//
// Everything here is drawn on top of the field (no depth test), the way tactics games put their spells over the
// board. Two particle pools share one picture sheet: one adds light (fire, sparks, holy work), one lays colour over
// (smoke, dust, crows, blood). The rest are short-lived meshes: sprites for flares and slashes, flat plates for rings
// and runes, ribbons for beams and lightning, open cylinders for pillars of light.
//
// It reads the Renderer from outside and never needs it changed: r.scene, r.cam, r.target, r.zoom, r.gl, and the
// hemisphere and directional lights it finds in the scene (to dim the world for a big spell).
import * as THREE from 'three';

const VIEW = new THREE.Vector3(20, 16.5, 20).normalize();   // toward the camera (render.js CAM)
const SIDE = new THREE.Vector3(1, 0, -1).normalize();         // screen-right, flat on the ground
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const ease = (k) => 1 - (1 - k) * (1 - k);
const back = (k) => { const c = 2.2; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };   // overshoots, then settles

// Each school of magic, in four tones from the white-hot middle to the dark at its edge, and the picture its
// particles mostly use (see the sheet below).
export const PAL = {
  fire: { core: 0xfff1c0, mid: 0xff8a2a, edge: 0xd8341a, dark: 0x2a1410, cell: 10 },
  cold: { core: 0xf2fcff, mid: 0x8ad8ff, edge: 0x3a7ae0, dark: 0x1a2a40, cell: 3 },
  storm: { core: 0xffffff, mid: 0xbcdcff, edge: 0x7a6aff, dark: 0x1a1830, cell: 1 },
  holy: { core: 0xfffbe8, mid: 0xffe48a, edge: 0xffaa3a, dark: 0x3a2a10, cell: 1 },
  light: { core: 0xeafff6, mid: 0x8affd8, edge: 0x2ac8a0, dark: 0x103028, cell: 1 },
  shadow: { core: 0xecd0ff, mid: 0xa060ff, edge: 0x5a20b0, dark: 0x12061e, cell: 4 },
  poison: { core: 0xeaffa0, mid: 0xa8d84a, edge: 0x4a8a1a, dark: 0x1a2a08, cell: 8 },
  acid: { core: 0xf0ffb0, mid: 0x8ae040, edge: 0x3aa020, dark: 0x14300a, cell: 9 },
  arcane: { core: 0xeaf4ff, mid: 0x7ab8ff, edge: 0x8a5aff, dark: 0x101030, cell: 11 },
  blood: { core: 0xffd0d0, mid: 0xff4a4a, edge: 0xa01020, dark: 0x200406, cell: 9 },
  earth: { core: 0xffe8c0, mid: 0xc8a070, edge: 0x7a5a3a, dark: 0x2a2018, cell: 15 },
  wind: { core: 0xf0fffa, mid: 0xa0f0dc, edge: 0x4ac8a8, dark: 0x103028, cell: 14 },
  sound: { core: 0xfff0f6, mid: 0xff9ab8, edge: 0xff5a8a, dark: 0x301018, cell: 5 },
  phys: { core: 0xffffff, mid: 0xffe2a0, edge: 0xc89a5a, dark: 0x201810, cell: 1 },
};
export const palOf = (el) => PAL[el] || PAL.phys;

// ---- the picture sheet: sixteen white shapes, tinted per particle ----
// 0 glow · 1 six-rayed glint · 2 ring · 3 shard · 4 smoke · 5 note · 6 crow · 7 sigil
// 8 bubble · 9 drop · 10 flame · 11 star · 12 skull · 13 bone · 14 leaf · 15 stone
export const CELL = { glow: 0, glint: 1, ring: 2, shard: 3, smoke: 4, note: 5, crow: 6, sigil: 7, bubble: 8, drop: 9, flame: 10, star: 11, skull: 12, bone: 13, leaf: 14, stone: 15 };
function makeSheet() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S * 4;
  const x = cv.getContext('2d');
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const glow = (R, a = 1) => { const g = x.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.3, `rgba(255,255,255,${a * 0.5})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill(); };
  const draw = [
    () => glow(31),
    () => { glow(14); x.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { const L = k % 2 ? 17 : 29; x.save(); x.rotate(k * Math.PI / 3); x.beginPath(); x.moveTo(0, -L); x.lineTo(2.4, -3); x.lineTo(0, 2); x.lineTo(-2.4, -3); x.closePath(); x.fill(); x.restore(); } },
    () => { x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 6; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 22, 0, TAU); x.stroke(); },
    () => { const g = x.createLinearGradient(0, -28, 0, 28); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,.55)'); x.fillStyle = g; x.shadowColor = '#fff'; x.shadowBlur = 5; x.beginPath(); x.moveTo(0, -28); x.lineTo(8, -2); x.lineTo(0, 28); x.lineTo(-8, -2); x.closePath(); x.fill(); },
    () => { for (let k = 0; k < 7; k++) { x.save(); x.translate((r() - 0.5) * 22, (r() - 0.5) * 22); const R = 12 + r() * 10, g = x.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill(); x.restore(); } },
    () => { x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 4; x.save(); x.translate(-7, 14); x.rotate(-0.45); x.beginPath(); x.ellipse(0, 0, 10, 7, 0, 0, TAU); x.fill(); x.restore(); x.fillRect(1, -22, 4, 37); x.beginPath(); x.moveTo(5, -22); x.quadraticCurveTo(20, -12, 14, 2); x.quadraticCurveTo(14, -8, 5, -10); x.fill(); },
    () => { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-28, -2); x.quadraticCurveTo(-14, -16, -2, 2); x.lineTo(0, 8); x.lineTo(2, 2); x.quadraticCurveTo(14, -16, 28, -2); x.quadraticCurveTo(12, -6, 3, 10); x.lineTo(-3, 10); x.quadraticCurveTo(-12, -6, -28, -2); x.fill(); },
    () => { x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 5; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 21, 0, TAU); x.stroke(); x.beginPath(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3; x.lineTo(Math.cos(a) * 21, Math.sin(a) * 21); } x.closePath(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill(); },
    () => { x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 20, 0, TAU); x.stroke(); glow(20, 0.25); x.fillStyle = '#fff'; x.beginPath(); x.arc(-7, -8, 4, 0, TAU); x.fill(); },
    () => { x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 4; x.beginPath(); x.moveTo(0, -26); x.bezierCurveTo(6, -12, 16, 2, 14, 12); x.arc(0, 12, 14, 0, Math.PI); x.bezierCurveTo(-16, 2, -6, -12, 0, -26); x.fill(); },
    () => { const g = x.createRadialGradient(0, 14, 2, 0, 6, 30); g.addColorStop(0, '#fff'); g.addColorStop(0.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, -30); x.bezierCurveTo(10, -10, 20, 6, 15, 18); x.arc(0, 18, 15, 0, Math.PI); x.bezierCurveTo(-20, 6, -10, -10, 0, -30); x.fill(); },
    () => { glow(16); x.fillStyle = '#fff'; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, R = k % 2 ? 9 : 24; x.lineTo(Math.cos(a) * R, Math.sin(a) * R); } x.closePath(); x.fill(); },
    () => { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -4, 19, 0, TAU); x.fill(); x.fillRect(-11, 8, 22, 14); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(-7, -3, 5, 6, 0, 0, TAU); x.ellipse(7, -3, 5, 6, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(0, 4); x.lineTo(3, 10); x.lineTo(-3, 10); x.fill(); for (const tx of [-6, 0, 6]) x.fillRect(tx - 1, 15, 2, 7); },
    () => { x.fillStyle = '#fff'; x.save(); x.rotate(0.7); x.fillRect(-4, -20, 8, 40); for (const [px, py] of [[-5, -21], [5, -21], [-5, 21], [5, 21]]) { x.beginPath(); x.arc(px, py, 6, 0, TAU); x.fill(); } x.restore(); },
    () => { x.fillStyle = '#fff'; x.save(); x.rotate(0.5); x.beginPath(); x.ellipse(0, 0, 9, 24, 0, 0, TAU); x.fill(); x.globalCompositeOperation = 'destination-out'; x.fillRect(-0.8, -20, 1.6, 40); x.restore(); },
    () => { x.fillStyle = '#fff'; x.beginPath(); for (let k = 0; k < 7; k++) { const a = k * TAU / 7, R = 14 + r() * 12; x.lineTo(Math.cos(a) * R, Math.sin(a) * R); } x.closePath(); x.fill(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-30, 2, 60, 30); },
  ];
  draw.forEach((d, i) => { x.save(); x.translate((i % 4) * S + S / 2, Math.floor(i / 4) * S + S / 2); d(); x.restore(); });
  const t = new THREE.CanvasTexture(cv);
  t.flipY = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- the other pictures: a soft glow, a shock ring, a beam's cross-section, a pillar, a crescent, a scorch, a rune circle
function canvasTex(w, h, paint, flip = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  paint(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.flipY = flip; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeTextures() {
  const T = {};
  T.glow = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.75)'); g.addColorStop(0.45, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  T.ring = canvasTex(256, 256, (x) => { const g = x.createRadialGradient(128, 128, 60, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.25)'); g.addColorStop(0.86, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); });
  T.beam = canvasTex(64, 64, (x) => { for (let v = 0; v < 64; v++) { const d = Math.abs(v - 31.5) / 32, a = Math.exp(-d * d * 9), c = 255; x.fillStyle = `rgba(${c},${c},${c},${a})`; x.fillRect(0, v, 64, 1); } x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 18; k++) { x.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.2})`; x.fillRect(Math.random() * 64, 0, 2 + Math.random() * 6, 64); } });
  T.beam.wrapS = THREE.RepeatWrapping;
  T.pillar = canvasTex(64, 128, (x) => { for (let y = 0; y < 128; y++) { const k = y / 127, a = Math.pow(k, 1.6); x.fillStyle = `rgba(255,255,255,${a})`; x.fillRect(0, y, 64, 1); } x.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 14; k++) { x.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.3})`; x.fillRect(Math.random() * 64, 0, 2 + Math.random() * 5, 128); } });
  T.pillar.wrapS = THREE.RepeatWrapping;
  T.crescent = canvasTex(128, 128, (x) => { x.translate(64, 64); x.shadowColor = '#fff'; x.shadowBlur = 8; x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 54, Math.PI * 0.95, Math.PI * 2.05); x.arc(0, 14, 46, Math.PI * 2.02, Math.PI * 0.98, true); x.closePath(); x.fill(); });
  T.scorch = canvasTex(128, 128, (x) => { for (let k = 0; k < 9; k++) { const cx = 64 + (Math.random() - 0.5) * 40, cy = 64 + (Math.random() - 0.5) * 40, R = 22 + Math.random() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(20,12,8,.5)'); g.addColorStop(1, 'rgba(20,12,8,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } });
  // a casting circle: rings, ticks, beads and a seven-pointed star; no letters, nothing of either side's marks
  T.circle = canvasTex(512, 512, (x) => {
    x.translate(256, 256); x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 6;
    const ring = (R, w) => { x.lineWidth = w; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke(); };
    ring(244, 7); ring(226, 2.5); ring(150, 3); ring(132, 1.5); ring(54, 3);
    for (let k = 0; k < 72; k++) { const a = k * TAU / 72, L = k % 6 ? 8 : 16; x.lineWidth = k % 6 ? 1.5 : 3; x.beginPath(); x.moveTo(Math.cos(a) * 226, Math.sin(a) * 226); x.lineTo(Math.cos(a) * (226 - L), Math.sin(a) * (226 - L)); x.stroke(); }
    for (let k = 0; k < 14; k++) { const a = k * TAU / 14 + 0.1; x.beginPath(); x.arc(Math.cos(a) * 190, Math.sin(a) * 190, k % 2 ? 6 : 11, 0, TAU); k % 2 ? x.fill() : x.stroke(); }
    x.lineWidth = 3; x.beginPath(); for (let k = 0; k <= 7; k++) { const a = -Math.PI / 2 + k * 3 * TAU / 7; x.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); } x.stroke();
    x.lineWidth = 2; x.beginPath(); for (let k = 0; k <= 7; k++) { const a = -Math.PI / 2 + k * TAU / 7; x.lineTo(Math.cos(a) * 132, Math.sin(a) * 132); } x.stroke();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + k * TAU / 7; x.beginPath(); x.arc(Math.cos(a) * 150, Math.sin(a) * 150, 9, 0, TAU); x.fill(); }
  });
  return T;
}

// ---- particle pools ----
const VERT = `
attribute vec3 tint; attribute float alpha; attribute float size; attribute float cell; attribute float angle;
uniform float uScale;
varying vec3 vC; varying float vA; varying float vCell; varying float vAng;
void main() {
  vC = tint; vA = alpha; vCell = cell; vAng = angle;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uScale;
}`;
const FRAG = `
uniform sampler2D map;
varying vec3 vC; varying float vA; varying float vCell; varying float vAng;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vAng), s = sin(vAng);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  if (abs(p.x) > 0.5 || abs(p.y) > 0.5) discard;
  vec2 uv = (vec2(mod(vCell, 4.0), floor(vCell / 4.0)) + p + 0.5) / 4.0;
  vec4 t = texture2D(map, uv);
  gl_FragColor = vec4(vC * t.rgb, t.a * vA);
}`;
const tmpC = new THREE.Color(), tmpD = new THREE.Color();

class Pool {
  constructor(cap, blending, map, order) {
    this.cap = cap;
    this.ps = Array.from({ length: cap }, () => ({ on: false }));
    this.free = []; for (let i = cap - 1; i >= 0; i--) this.free.push(i);
    const g = new THREE.BufferGeometry(), A = (n, name) => { const a = new THREE.BufferAttribute(new Float32Array(cap * n), n); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
    this.aPos = A(3, 'position'); this.aCol = A(3, 'tint'); this.aAlp = A(1, 'alpha'); this.aSiz = A(1, 'size'); this.aCel = A(1, 'cell'); this.aAng = A(1, 'angle');
    g.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: map }, uScale: { value: 60 } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false, blending });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = order;
  }
  get room() { return this.free.length; }
  // o: x y z, vx vy vz, g (fall), drag, life, size, size1, color, color1, alpha, cell, ang, spin, fade (in), flicker,
  //    orbit {x, z, r, w, vr} (circles a point while rising at vy), home {x, y, z} (ends there)
  add(o) {
    if (!this.free.length) return null;
    const i = this.free.pop(), p = this.ps[i];
    p.on = true; p.age = 0; p.life = o.life ?? 0.8;
    p.x = o.x; p.y = o.y; p.z = o.z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.g = o.g || 0; p.drag = o.drag || 0;
    p.s0 = o.size ?? 0.2; p.s1 = o.size1 ?? p.s0;
    tmpC.set(o.color ?? 0xffffff); tmpD.set(o.color1 ?? o.color ?? 0xffffff);
    p.r0 = tmpC.r; p.g0 = tmpC.g; p.b0 = tmpC.b; p.r1 = tmpD.r; p.g1 = tmpD.g; p.b1 = tmpD.b;
    p.a = o.alpha ?? 1; p.cell = o.cell ?? 0; p.ang = o.ang ?? (o.spin ? Math.random() * TAU : 0); p.spin = o.spin || 0;
    p.fi = o.fade ?? 0.08; p.fl = o.flicker || 0; p.seed = Math.random() * 100;
    p.orb = o.orbit ? { ...o.orbit, a: o.orbit.a ?? Math.random() * TAU } : null;
    p.home = o.home ? { sx: o.x, sy: o.y, sz: o.z, ...o.home } : null;
    return p;
  }
  update(dt, scale) {
    let n = 0;
    const P = this.aPos.array, C = this.aCol.array, AL = this.aAlp.array, SZ = this.aSiz.array, CE = this.aCel.array, AN = this.aAng.array;
    for (let i = 0; i < this.cap; i++) {
      const p = this.ps[i];
      if (!p.on) continue;
      p.age += dt;
      if (p.age >= p.life) { p.on = false; this.free.push(i); continue; }
      const k = p.age / p.life;
      if (p.home) {
        const e = k * k * (3 - 2 * k), sw = Math.sin(k * Math.PI) * (p.home.swirl || 0);
        p.x = p.home.sx + (p.home.x - p.home.sx) * e + Math.cos(p.seed + k * 6) * sw;
        p.y = p.home.sy + (p.home.y - p.home.sy) * e;
        p.z = p.home.sz + (p.home.z - p.home.sz) * e + Math.sin(p.seed + k * 6) * sw;
      } else if (p.orb) {
        const o = p.orb; o.a += o.w * dt; o.r = Math.max(0, o.r + (o.vr || 0) * dt);
        p.vy -= p.g * dt; p.y += p.vy * dt;
        p.x = o.x + Math.cos(o.a) * o.r; p.z = o.z + Math.sin(o.a) * o.r;
      } else {
        if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vz *= d; }
        p.vy -= p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      }
      p.ang += p.spin * dt;
      let a = p.a * Math.min(1, k / p.fi) * (1 - k);
      if (p.fl) a *= 1 - p.fl + p.fl * (0.5 + 0.5 * Math.sin(p.age * 38 + p.seed));
      P[n * 3] = p.x; P[n * 3 + 1] = p.y; P[n * 3 + 2] = p.z;
      C[n * 3] = p.r0 + (p.r1 - p.r0) * k; C[n * 3 + 1] = p.g0 + (p.g1 - p.g0) * k; C[n * 3 + 2] = p.b0 + (p.b1 - p.b0) * k;
      AL[n] = a; SZ[n] = p.s0 + (p.s1 - p.s0) * k; CE[n] = p.cell; AN[n] = p.ang;
      n++;
    }
    this.points.geometry.setDrawRange(0, n);
    for (const at of [this.aPos, this.aCol, this.aAlp, this.aSiz, this.aCel, this.aAng]) { at.clearUpdateRanges(); at.addUpdateRange(0, n * at.itemSize); at.needsUpdate = true; }
    this.mat.uniforms.uScale.value = scale;
  }
  clear() { for (let i = 0; i < this.cap; i++) if (this.ps[i].on) { this.ps[i].on = false; this.free.push(i); } }
}

// A strip of quads facing the camera along a run of points (beams, lightning, trails). The camera never turns,
// so "facing it" is the same sideways vector for the whole fight.
function ribbonGeo(pts, width) {
  const n = pts.length, pos = new Float32Array(n * 2 * 3), uv = new Float32Array(n * 2 * 2), idx = [];
  const d = new THREE.Vector3(), s = new THREE.Vector3();
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    d.set(b.x - a.x, b.y - a.y, b.z - a.z);
    s.crossVectors(d, VIEW); if (s.lengthSq() < 1e-6) s.copy(SIDE); s.normalize().multiplyScalar((Array.isArray(width) ? width[i] : width) / 2);
    const p = pts[i];
    pos.set([p.x + s.x, p.y + s.y, p.z + s.z, p.x - s.x, p.y - s.y, p.z - s.z], i * 6);
    if (i) len += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y, p.z - pts[i - 1].z);
    uv.set([len, 0, len, 1], i * 4);
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
// a jagged run from a to b, split and kicked sideways (and a little up and down)
function jag(a, b, rough = 0.35, depth = 5) {
  let pts = [a.clone(), b.clone()];
  let amp = rough * a.distanceTo(b);
  for (let d = 0; d < depth; d++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const m = pts[i].clone().lerp(pts[i + 1], 0.5);
      const dir = pts[i + 1].clone().sub(pts[i]), side = dir.clone().cross(VIEW).normalize();
      m.addScaledVector(side, (Math.random() - 0.5) * amp).y += (Math.random() - 0.5) * amp * 0.4;
      out.push(m, pts[i + 1]);
    }
    pts = out; amp *= 0.52;
  }
  return pts;
}

const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p.x, p.y, p.z));
// the turn a picture needs on screen to point along a direction in the world (its top toward d)
export function screenAngle(d) {
  const sx = (d.x - d.z) * Math.SQRT1_2, sy = d.y * 0.863 - (d.x + d.z) * Math.SQRT1_2 * 0.505;
  return Math.atan2(-sx, sy);
}

export class FX {
  constructor(r) {
    this.r = r;
    this.sheet = makeSheet();
    this.tex = makeTextures();
    this.add = new Pool(2600, THREE.AdditiveBlending, this.sheet, 41);
    this.mix = new Pool(900, THREE.NormalBlending, this.sheet, 40);
    this.group = new THREE.Group();
    r.scene.add(this.mix.points, this.add.points, this.group);
    this.live = [];          // meshes and movers, each { t, dur, step(k, dt), end() }
    // a few lights for flashes, in the scene from the start so nothing has to recompile when one goes off
    this.lights = Array.from({ length: 4 }, () => { const l = new THREE.PointLight(0xffffff, 0, 7, 1.4); r.scene.add(l); return { l, t: 0, dur: 1, i: 0 }; });
    this.world = null;       // the scene's own sun and sky while a big spell has them dimmed (found when it starts)
    this.dimTo = 0; this.dimNow = 0;
    this.zoomTo = 1; this.zoomNow = 1; this.zoomW = 6;
    this.shakeA = 0; this.shakeOff = new THREE.Vector3();
    this.stopT = 0;
    this.pace = 1;           // the fight's clock against the real one (Game.pace); update's dt already runs on it
    this.flashEl = document.createElement('div');
    this.flashEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen;z-index:1';
    (r.gl.domElement.nextSibling ? r.gl.domElement.parentNode.insertBefore(this.flashEl, r.gl.domElement.nextSibling) : document.body.append(this.flashEl));
    this.flashA = 0;
  }

  // ---- the frame ----
  // How fast the rest of the game should run this frame: a stopped frame on a heavy blow.
  timeScale() { return this.stopT > 0 ? 0.04 : this.slowT > 0 ? this.slowK : 1; }
  // the world at a fraction of its pace for a moment (the last of them going down)
  slow(k, secs) { this.slowK = k; this.slowT = Math.max(this.slowT || 0, secs); }
  update(dt) {
    const real = dt;
    if (this.stopT > 0) dt *= 0.08;           // a stopped frame holds the sparks in the air too
    this.stopT = Math.max(0, this.stopT - real);
    this.slowT = Math.max(0, (this.slowT || 0) - real);
    const r = this.r, scale = r.gl.domElement.height / Math.max(0.01, r.cam.top - r.cam.bottom);
    this.add.update(dt, scale); this.mix.update(dt, scale);
    for (const e of this.live) {
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      e.step?.(k, dt, e);
      if (k >= 1) { e.end?.(); e.dead = true; }
    }
    if (this.live.some((e) => e.dead)) this.live = this.live.filter((e) => !e.dead);
    for (const L of this.lights) {
      if (L.t >= L.dur) { L.l.intensity = 0; continue; }
      L.t += dt; const k = Math.min(1, L.t / L.dur);
      L.l.intensity = L.i * (1 - k) * (1 - k);
    }
    // the world's light, the camera's zoom and shake, the screen's flash
    if (this.world) {
      this.dimNow += (this.dimTo - this.dimNow) * (1 - Math.exp(-real * 8));
      if (!this.dimTo && this.dimNow < 0.003) { for (const w of this.world) w.l.intensity = w.i; this.world = null; this.dimNow = 0; }
      else for (const w of this.world) w.l.intensity = w.i * (1 - 0.72 * this.dimNow);
    }
    if (this.zoomNow !== this.zoomTo) {
      this.zoomNow += (this.zoomTo - this.zoomNow) * (1 - Math.exp(-real * this.zoomW));
      if (Math.abs(this.zoomNow - this.zoomTo) < 0.002) this.zoomNow = this.zoomTo;
      this.applyZoom();
    } else if (this.zoomNow !== 1) this.applyZoom();
    this.shakeA *= Math.exp(-real * 9);
    if (this.shakeA < 0.004) this.shakeOff.set(0, 0, 0);
    else this.shakeOff.copy(SIDE).multiplyScalar((Math.random() - 0.5) * 2 * this.shakeA).add(new THREE.Vector3(0, (Math.random() - 0.5) * 2 * this.shakeA * 0.8, 0));
    if (this.flashA > 0.002) { this.flashA *= Math.exp(-real * 7); this.flashEl.style.opacity = this.flashA.toFixed(3); } else if (this.flashEl.style.opacity !== '0') this.flashEl.style.opacity = '0';
  }
  // the zoom a spell asks for, on top of the player's own (as Renderer.resize sets the frustum)
  applyZoom() {
    const r = this.r, w = window.innerWidth, h = window.innerHeight, a = w / h, z = r.zoom * (a < 1 ? 1.25 : 1) * this.zoomNow;
    r.cam.left = -z * a / 2; r.cam.right = z * a / 2; r.cam.top = z / 2; r.cam.bottom = -z / 2;
    r.cam.updateProjectionMatrix();
  }
  // Moves the camera by the shake for one render; call with the render between.
  shaken(fn) { const o = this.shakeOff; this.r.target.add(o); fn(); this.r.target.sub(o); }
  clear() {
    this.add.clear(); this.mix.clear();
    for (const e of this.live) e.end?.();
    this.live = []; this.dimTo = 0; this.zoomTo = 1; this.shakeA = 0; this.flashA = 0;
    if (this.world) { for (const w of this.world) w.l.intensity = w.i; this.world = null; this.dimNow = 0; }
  }

  // ---- the camera and the screen ----
  shake(a) { this.shakeA = Math.min(0.5, Math.max(this.shakeA, a)); }
  stop(s) { this.stopT = Math.max(this.stopT, s); }
  flash(color = '#fff', a = 0.5) { this.flashEl.style.background = color; this.flashA = Math.max(this.flashA, a); this.flashEl.style.opacity = this.flashA; }
  dim(k) {
    this.dimTo = k;
    if (k && !this.world) { this.world = []; this.r.scene.traverse((o) => { if (o.isHemisphereLight || o.isDirectionalLight) this.world.push({ l: o, i: o.intensity }); }); }
  }
  zoom(k, speed = 6) { this.zoomTo = k; this.zoomW = speed; }
  light(at, color, i = 4, dur = 0.4, dist = 7) {
    const L = this.lights.reduce((a, b) => (a.t / a.dur >= b.t / b.dur ? a : b));
    L.l.color.set(color); L.l.position.set(at.x, at.y + 0.6, at.z); L.l.distance = dist; L.i = i; L.t = 0; L.dur = dur; L.l.intensity = i;
  }

  // ---- building blocks ----
  timed(dur, step, end) { const e = { t: 0, dur, step, end }; this.live.push(e); return e; }
  wait(s) { return new Promise((res) => this.timed(s, null, res)); }
  sprite(map, color, blending = THREE.AdditiveBlending) {
    const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, depthTest: false, blending });
    const s = new THREE.Sprite(m); s.renderOrder = 42; this.group.add(s); return s;
  }
  plate(map, color, blending = THREE.AdditiveBlending) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, depthTest: blending !== THREE.AdditiveBlending, blending, side: THREE.DoubleSide }));
    m.renderOrder = blending === THREE.AdditiveBlending ? 39 : 3; this.group.add(m); return m;
  }
  drop(o) { this.group.remove(o); o.geometry?.dispose?.(); o.material?.dispose?.(); }
  // a bright point that swells and goes
  flare(at, color = 0xffffff, size = 1.5, dur = 0.3) {
    const s = this.sprite(this.tex.glow, color); s.position.copy(V(at));
    this.timed(dur, (k) => { s.scale.setScalar(size * (0.4 + 0.8 * ease(k))); s.material.opacity = (1 - k) * (1 - k); }, () => this.drop(s));
  }
  // a ring that runs out along the ground
  ring(at, color, r0 = 0.2, r1 = 2, dur = 0.5, a = 1) {
    const m = this.plate(this.tex.ring, color); m.position.set(at.x, at.y + 0.06, at.z);
    this.timed(dur, (k) => { const s = (r0 + (r1 - r0) * ease(k)) * 2; m.scale.set(s, 1, s); m.material.opacity = a * (1 - k); }, () => this.drop(m));
  }
  // the burnt patch a fire leaves, fading over a few seconds
  scorch(at, size = 1.4, dur = 4) {
    const m = this.plate(this.tex.scorch, 0xffffff, THREE.NormalBlending); m.position.set(at.x, at.y + 0.03, at.z); m.rotation.y = Math.random() * TAU; m.scale.set(size * 2, 1, size * 2);
    this.timed(dur, (k) => { m.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; }, () => this.drop(m));
  }
  // a casting circle on the ground that turns while it lasts; end() lets it go
  circle(at, color, radius = 1, dur = 1.2) {
    const m = this.plate(this.tex.circle, color); m.position.set(at.x, at.y + 0.07, at.z);
    const inner = this.plate(this.tex.circle, color); inner.position.set(at.x, at.y + 0.08, at.z);
    const e = this.timed(dur, (k) => {
      const pop = back(Math.min(1, e.t / 0.28)), out = k > 0.82 ? 1 - (k - 0.82) / 0.18 : 1;
      m.scale.set(radius * 2 * pop, 1, radius * 2 * pop); m.rotation.y = e.t * 0.9; m.material.opacity = 0.9 * out;
      inner.scale.set(radius * 1.15 * pop, 1, radius * 1.15 * pop); inner.rotation.y = -e.t * 1.7; inner.material.opacity = 0.55 * out;
    }, () => { this.drop(m); this.drop(inner); });
    return e;
  }
  // a column of light standing on the ground
  pillar(at, color, h = 4, radius = 0.55, dur = 0.8) {
    const mk = (r, o) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 20, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: this.tex.pillar, color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: o })); m.renderOrder = 42; m.position.set(at.x, at.y, at.z); this.group.add(m); return m; };
    const a = mk(radius, 0.9), b = mk(radius * 0.45, 1);
    this.timed(dur, (k) => {
      const up = ease(Math.min(1, k * 4)), out = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1;
      a.scale.set(1 + k * 0.3, h * up, 1 + k * 0.3); b.scale.set(1 - k * 0.5, h * 1.1 * up, 1 - k * 0.5);
      a.material.opacity = 0.85 * out; b.material.opacity = out;
      a.rotation.y = k * 2;
    }, () => { this.drop(a); this.drop(b); });
  }
  // a beam from a to b: swells, holds, thins out
  beam(a, b, color, width = 0.45, dur = 0.5, core = 0xffffff) {
    a = V(a); b = V(b);
    const mk = (w, c, o) => { const m = new THREE.Mesh(ribbonGeo([a, b], w), new THREE.MeshBasicMaterial({ map: this.tex.beam, color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: o })); m.renderOrder = 43; this.group.add(m); return m; };
    const outer = mk(width * 2.4, color, 0.7), inner = mk(width, core, 1);
    this.timed(dur, (k) => {
      const w = k < 0.15 ? ease(k / 0.15) : k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1 + 0.08 * Math.sin(k * 60);
      outer.material.opacity = 0.7 * w; inner.material.opacity = w;
      // thin it about its own axis by rebuilding at the new width (cheap: four vertices)
      outer.geometry.dispose(); outer.geometry = ribbonGeo([a, b], width * 2.4 * w);
      inner.geometry.dispose(); inner.geometry = ribbonGeo([a, b], width * w);
    }, () => { this.drop(outer); this.drop(inner); });
    this.flare(a, color, width * 4, dur * 0.8); this.flare(b, color, width * 5, dur);
  }
  // a bolt of lightning from a to b, re-forked every few hundredths of a second while it lasts
  bolt(a, b, color = 0xbcdcff, dur = 0.32, width = 0.09) {
    a = V(a); b = V(b);
    const mk = (w, c) => { const m = new THREE.Mesh(ribbonGeo(jag(a, b), w), new THREE.MeshBasicMaterial({ map: this.tex.beam, color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.renderOrder = 44; this.group.add(m); return m; };
    const glow = mk(width * 5, color), core = mk(width, 0xffffff);
    let next = 0;
    this.timed(dur, (k, dt, e) => {
      if (e.t >= next) {
        next = e.t + 0.045;
        const pts = jag(a, b);
        glow.geometry.dispose(); glow.geometry = ribbonGeo(pts, width * 5);
        core.geometry.dispose(); core.geometry = ribbonGeo(pts, width);
      }
      const f = (1 - k) * (0.6 + 0.4 * Math.random());
      glow.material.opacity = 0.65 * f; core.material.opacity = f;
    }, () => { this.drop(glow); this.drop(core); });
    this.flare(b, color, 1.4, dur);
  }
  // a crescent cut across where a blow lands
  slash(at, color = 0xffffff, size = 1.6, rot = rnd(-0.9, 0.9), dur = 0.22) {
    const s = this.sprite(this.tex.crescent, color); s.position.copy(V(at)); s.material.rotation = rot;
    this.timed(dur, (k) => { const g = 0.5 + 0.7 * ease(k); s.scale.set(size * g, size * g * 0.75, 1); s.material.rotation = rot + k * 0.6; s.material.opacity = 1 - k * k; }, () => this.drop(s));
  }

  // ---- particles ----
  glow(o) { return this.add.add(o); }
  smoke(o) { return this.mix.add(o); }
  // n particles thrown out from a point
  spray(at, n, o) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, el = o.up == null ? rnd(-0.3, 1) : o.up, sp = rnd(o.speed * 0.4, o.speed), c = Math.cos(Math.asin(Math.max(-1, Math.min(1, el))));
      const p = { ...o, x: at.x + rnd(-1, 1) * (o.jitter || 0), y: at.y + rnd(-1, 1) * (o.jitter || 0) * 0.5, z: at.z + rnd(-1, 1) * (o.jitter || 0), vx: Math.cos(a) * c * sp, vy: el * sp + (o.lift || 0), vz: Math.sin(a) * c * sp, life: rnd(o.life * 0.6, o.life), size: o.size * rnd(0.7, 1.2) };
      (o.dark ? this.mix : this.add).add(p);
    }
  }
  // particles drawn in toward a point (a spell gathering)
  gather(at, color, n = 18, r = 1.4, dur = 0.5, cell = 0, size = 0.16) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, d = rnd(r * 0.6, r);
      this.add.add({ x: at.x + Math.cos(a) * d, y: at.y + rnd(-0.6, 0.8), z: at.z + Math.sin(a) * d, home: { x: at.x, y: at.y, z: at.z, swirl: 0.25 }, life: rnd(dur * 0.6, dur), size, size1: size * 0.4, color, alpha: 1, cell, fade: 0.3 });
    }
  }
  // particles that wind up round something standing at `at`
  swirl(at, color, n = 22, r = 0.6, h = 2, cell = 1, size = 0.14, life = 0.9) {
    for (let i = 0; i < n; i++) this.add.add({ x: at.x, y: at.y + rnd(0, 0.3), z: at.z, vy: rnd(h * 0.6, h * 1.2), orbit: { x: at.x, z: at.z, r: r * rnd(0.7, 1.1), w: rnd(4, 7) * (i % 2 ? 1 : -1), vr: -r * 0.4 }, life: rnd(life * 0.6, life), size, size1: size * 0.3, color, alpha: 1, cell, fade: 0.15 });
  }
  // a puff of dust where someone lands or something hits the ground
  dust(at, n = 8, s = 1, color = 0xa89878) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = rnd(0.6, 1.6) * s;
      this.mix.add({ x: at.x, y: at.y + 0.08, z: at.z, vx: Math.cos(a) * sp, vy: rnd(0.1, 0.5), vz: Math.sin(a) * sp, drag: 3.5, life: rnd(0.5, 0.9), size: 0.35 * s, size1: 0.8 * s, color, alpha: 0.45, cell: CELL.smoke, ang: Math.random() * TAU, spin: rnd(-1, 1) });
    }
  }
  sparks(at, n = 14, color = 0xffe2a0, speed = 5, g = 9) {
    this.spray(at, n, { speed, life: 0.45, size: 0.09, size1: 0.02, color: 0xffffff, color1: color, g, drag: 2, cell: CELL.glow });
  }

  // ---- projectiles: resolve when they land ----
  // kind: orb | arrow | bullet | shard | rock | bone | note | star | flame | rang | meteor | spear | skull | crow
  shoot(from, to, { el = 'phys', kind = 'orb', speed = 14, arc = 0, curve = 0, size = 0.32, color } = {}) {
    const P = palOf(el), a = V(from), b = V(to), d = a.distanceTo(b);
    const dur = Math.max(0.12, d / speed);
    const mid = a.clone().lerp(b, 0.5); mid.y += arc * d * 0.5; mid.addScaledVector(SIDE, curve * d * 0.4);
    const at = (k, o) => { const u = 1 - k; return o.set(u * u * a.x + 2 * u * k * mid.x + k * k * b.x, u * u * a.y + 2 * u * k * mid.y + k * k * b.y, u * u * a.z + 2 * u * k * mid.z + k * k * b.z); };
    const c = color ?? P.mid, cur = a.clone(), prev = a.clone();
    let core = null;
    if (kind === 'orb' || kind === 'meteor' || kind === 'flame') { core = this.sprite(this.tex.glow, c); core.scale.setScalar(size * (kind === 'meteor' ? 4 : 2.6)); }
    const solid = { rock: CELL.stone, bone: CELL.bone, skull: CELL.skull }[kind];
    return new Promise((res) => this.timed(dur, (k, dt) => {
      prev.copy(cur); at(k, cur);
      if (core) { core.position.copy(cur); core.material.opacity = 0.9 + 0.1 * Math.sin(k * 40); }
      const step = cur.distanceTo(prev), lead = cur.clone().sub(prev);
      if (kind === 'orb' || kind === 'flame') {
        for (let i = 0; i < 3; i++) this.add.add({ x: cur.x + rnd(-0.06, 0.06), y: cur.y + rnd(-0.06, 0.06), z: cur.z + rnd(-0.06, 0.06), vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.6), vz: rnd(-0.4, 0.4), life: rnd(0.25, 0.45), size: size * 0.9, size1: 0.02, color: P.core, color1: P.edge, cell: kind === 'flame' ? CELL.flame : P.cell === CELL.smoke ? CELL.glow : P.cell, spin: rnd(-4, 4) });
        if (Math.random() < 0.5) this.add.add({ x: cur.x, y: cur.y, z: cur.z, vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(-1, 1), drag: 3, life: 0.5, size: 0.07, color: P.core, cell: CELL.glint, flicker: 0.6 });
        if (el === 'shadow' || el === 'poison') this.mix.add({ x: cur.x, y: cur.y, z: cur.z, vy: 0.3, life: 0.6, size: size * 1.2, size1: size * 2.4, color: P.dark, alpha: 0.5, cell: CELL.smoke, spin: 1 });
      } else if (kind === 'arrow' || kind === 'bullet' || kind === 'spear') {
        const n = Math.max(2, Math.ceil(step / 0.06));
        for (let i = 0; i < n; i++) { const q = prev.clone().lerp(cur, i / n); this.add.add({ x: q.x, y: q.y, z: q.z, life: kind === 'bullet' ? 0.12 : 0.18, size: kind === 'spear' ? 0.16 : 0.08, size1: 0.01, color: 0xffffff, color1: c, cell: CELL.glow }); }
        if (kind !== 'bullet' && Math.random() < 0.6) this.add.add({ x: cur.x, y: cur.y, z: cur.z, vy: -0.3, life: 0.4, size: 0.05, color: c, cell: CELL.glint });
      } else if (kind === 'shard' || kind === 'star' || kind === 'note') {
        const cell = kind === 'shard' ? CELL.shard : kind === 'star' ? CELL.star : CELL.note;
        this.add.add({ x: cur.x, y: cur.y + (kind === 'note' ? Math.sin(k * 20) * 0.15 : 0), z: cur.z, life: 0.06, size: size * 1.4, color: P.core, cell, ang: kind === 'shard' ? screenAngle(lead) : k * 12 });
        for (let i = 0; i < 2; i++) this.add.add({ x: cur.x, y: cur.y, z: cur.z, vx: rnd(-0.5, 0.5), vy: rnd(-0.3, 0.5), vz: rnd(-0.5, 0.5), life: 0.35, size: size * 0.5, size1: 0.02, color: P.mid, color1: P.edge, cell: kind === 'note' ? CELL.glint : CELL.glow });
      } else if (solid != null) {
        this.mix.add({ x: cur.x, y: cur.y, z: cur.z, life: 0.05, size: size * 1.6, color: kind === 'rock' ? 0x8a7a68 : 0xe8e0c8, alpha: 1, cell: solid, ang: k * 18 });
        if (Math.random() < 0.5) this.mix.add({ x: cur.x, y: cur.y, z: cur.z, life: 0.4, size: 0.15, size1: 0.35, color: 0x8a7a68, alpha: 0.35, cell: CELL.smoke });
      } else if (kind === 'crow') {
        // a black bird, flapping (it bobs), shedding the odd feather
        this.mix.add({ x: cur.x, y: cur.y + Math.sin(k * 34) * 0.07, z: cur.z, life: 0.05, size: size * 1.6, color: 0x18121a, alpha: 1, cell: CELL.crow, ang: lead.x - lead.z < 0 ? Math.PI : 0 });
        if (Math.random() < 0.3) this.mix.add({ x: cur.x, y: cur.y, z: cur.z, vx: rnd(-0.4, 0.4), vy: -0.4, vz: rnd(-0.4, 0.4), g: 1.5, life: 0.7, size: 0.08, color: 0x2a2030, alpha: 0.9, cell: CELL.leaf, spin: rnd(-6, 6) });
        if (Math.random() < 0.5) this.add.add({ x: cur.x, y: cur.y, z: cur.z, life: 0.25, size: size * 0.6, size1: 0.02, color: P.mid, cell: CELL.glow });
      } else if (kind === 'rang') {
        this.add.add({ x: cur.x, y: cur.y, z: cur.z, life: 0.05, size: size * 1.8, color: P.core, cell: CELL.leaf, ang: k * 40 });
        for (let i = 0; i < 2; i++) this.add.add({ x: cur.x, y: cur.y, z: cur.z, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), vz: rnd(-0.3, 0.3), life: 0.3, size: 0.12, size1: 0.02, color: c, cell: CELL.glow });
      } else if (kind === 'meteor') {
        for (let i = 0; i < 6; i++) this.add.add({ x: cur.x + rnd(-0.15, 0.15), y: cur.y + rnd(-0.15, 0.15), z: cur.z + rnd(-0.15, 0.15), vx: rnd(-0.6, 0.6), vy: rnd(0.4, 1.4), vz: rnd(-0.6, 0.6), life: rnd(0.4, 0.7), size: size * 1.4, size1: 0.05, color: P.core, color1: P.edge, cell: CELL.flame, spin: rnd(-3, 3) });
        this.mix.add({ x: cur.x, y: cur.y, z: cur.z, vy: 0.4, life: 1.1, size: size * 1.5, size1: size * 4, color: 0x2a1a14, alpha: 0.55, cell: CELL.smoke, spin: 1 });
      }
    }, () => { if (core) this.drop(core); res(); }));
  }
  // something falling out of the sky onto a point (a meteor, a star, a spear of light)
  fall(to, { el = 'fire', kind = 'meteor', h = 9, size = 0.5, speed = 22 } = {}) {
    const b = V(to), a = b.clone().add(new THREE.Vector3(-2.4, h, -1.2));
    return this.shoot(a, b, { el, kind, size, speed });
  }

  // ---- what landing looks like, by school ----
  // at: where it lands (a body's middle); s: how big
  burst(el, at, s = 1) {
    const P = palOf(el), p = V(at);
    this.flare(p, P.core, 1.6 * s, 0.22);
    this.flare(p, P.mid, 2.6 * s, 0.4);
    this.light(p, P.mid, 3.2 * s, 0.45);
    switch (el) {
      case 'fire':
        this.spray(p, 34 * s, { speed: 3.2 * s, life: 0.8, size: 0.34 * s, size1: 0.04, color: P.core, color1: P.edge, g: -1.5, drag: 3, cell: CELL.flame, spin: 2 });
        this.sparks(p, 16 * s, P.mid, 6 * s, 7);
        this.spray(p, 8 * s, { speed: 0.8, life: 1.5, size: 0.45 * s, size1: 1.3 * s, color: P.dark, alpha: 0.6, g: -0.8, drag: 1.5, cell: CELL.smoke, spin: 0.8, dark: true, up: 0.8 });
        break;
      case 'cold':
        this.spray(p, 18 * s, { speed: 4 * s, life: 0.7, size: 0.24 * s, size1: 0.08, color: P.core, color1: P.mid, g: 6, drag: 1.5, cell: CELL.shard, spin: 6 });
        this.spray(p, 14 * s, { speed: 1.5, life: 1, size: 0.08, color: P.core, cell: CELL.glint, drag: 2, flicker: 0.7 });
        this.spray(p, 7 * s, { speed: 0.9, life: 1.2, size: 0.4 * s, size1: 1 * s, color: 0xd8f0ff, alpha: 0.35, cell: CELL.smoke, drag: 2, dark: true });
        break;
      case 'storm':
        this.flash('#bcd8ff', 0.18 * s);
        for (let i = 0; i < 3 + s * 2; i++) { const e = p.clone().add(new THREE.Vector3(rnd(-1, 1), rnd(-0.6, 0.9), rnd(-1, 1)).multiplyScalar(0.9 * s)); this.bolt(p, e, P.mid, 0.18, 0.05); }
        this.sparks(p, 24 * s, P.mid, 7 * s, 5);
        break;
      case 'holy': case 'light':
        this.pillar({ x: p.x, y: p.y - 0.8, z: p.z }, P.mid, 3.4 * s, 0.45 * s, 0.7);
        this.spray(p, 20 * s, { speed: 2 * s, life: 1, size: 0.16, size1: 0.03, color: P.core, color1: P.mid, g: -1.2, drag: 2, cell: CELL.glint, flicker: 0.5, spin: 2 });
        this.ring({ x: p.x, y: p.y - 0.8, z: p.z }, P.mid, 0.2, 1.2 * s, 0.5);
        break;
      case 'shadow':
        this.spray(p, 12 * s, { speed: 1.5 * s, life: 1.1, size: 0.5 * s, size1: 1.2 * s, color: P.dark, alpha: 0.75, drag: 2, cell: CELL.smoke, spin: 1, dark: true });
        this.spray(p, 18 * s, { speed: 2.6 * s, life: 0.8, size: 0.2, size1: 0.02, color: P.core, color1: P.edge, g: -1, drag: 2.5, cell: CELL.glow });
        this.spray(p, 3, { speed: 1, life: 1, size: 0.3, color: P.mid, cell: CELL.skull, g: -1.4, drag: 2, up: 0.9 });
        break;
      case 'poison': case 'acid':
        this.spray(p, 16 * s, { speed: 2.2 * s, life: 0.9, size: 0.16 * s, size1: 0.05, color: P.core, color1: P.mid, g: el === 'acid' ? 6 : -1, drag: 2, cell: el === 'acid' ? CELL.drop : CELL.bubble });
        this.spray(p, 8 * s, { speed: 1, life: 1.4, size: 0.5 * s, size1: 1.3 * s, color: P.edge, alpha: 0.4, drag: 2, cell: CELL.smoke, spin: 0.6, dark: true });
        break;
      case 'arcane':
        this.spray(p, 18 * s, { speed: 3.5 * s, life: 0.8, size: 0.2, size1: 0.03, color: P.core, color1: P.edge, drag: 3, cell: CELL.star, spin: 4 });
        this.spray(p, 4, { speed: 0.6, life: 0.7, size: 0.4 * s, size1: 1.2 * s, color: P.mid, cell: CELL.ring, drag: 2 });
        this.spray(p, 5, { speed: 1.4, life: 0.9, size: 0.24, color: P.mid, cell: CELL.sigil, spin: 2, drag: 2 });
        break;
      case 'blood':
        this.spray(p, 18 * s, { speed: 3, life: 0.7, size: 0.13, size1: 0.05, color: 0xb01020, color1: 0x500008, g: 9, cell: CELL.drop, dark: true, alpha: 0.9 });
        this.spray(p, 10, { speed: 2, life: 0.6, size: 0.18, size1: 0.02, color: P.mid, cell: CELL.glow, drag: 3 });
        break;
      case 'earth':
        this.spray(p, 16 * s, { speed: 4 * s, life: 0.9, size: 0.2 * s, size1: 0.12, color: 0x8a7a64, g: 12, cell: CELL.stone, spin: 6, dark: true, up: 0.8 });
        this.dust({ x: p.x, y: p.y - 0.7, z: p.z }, 10, s);
        break;
      case 'wind':
        this.swirl({ x: p.x, y: p.y - 0.8, z: p.z }, P.core, 18 * s, 0.9 * s, 2, CELL.leaf, 0.2, 0.8);
        this.spray(p, 12, { speed: 3, life: 0.5, size: 0.12, size1: 0.02, color: P.mid, cell: CELL.glow, drag: 3 });
        break;
      case 'sound':
        for (let i = 0; i < 3; i++) setTimeout(() => this.spray(p, 1, { speed: 0.01, life: 0.6, size: 0.4 + i * 0.5, size1: 1.6 + i * 0.6, color: P.mid, cell: CELL.ring }), i * 70 / this.pace);
        this.spray(p, 8 * s, { speed: 1.8, life: 1, size: 0.3, color: P.core, color1: P.edge, g: -1.2, drag: 2, cell: CELL.note, up: 0.7 });
        break;
      default:
        this.sparks(p, 14 * s, P.mid, 6 * s, 9);
    }
  }
  // the hit itself, smaller than a burst: a slash or a punch of sparks, by what landed it
  strike(at, { el = 'phys', s = 1, cut = true, crit = false } = {}) {
    const P = palOf(el), p = V(at);
    if (cut) this.slash(p, el === 'phys' ? 0xffffff : P.core, 1.5 * s * (crit ? 1.4 : 1));
    this.sparks(p, (crit ? 22 : 12) * s, el === 'phys' ? 0xffe2a0 : P.mid, 5.5 * s, 9);
    this.flare(p, el === 'phys' ? 0xfff0d0 : P.mid, (crit ? 2.4 : 1.3) * s, 0.18);
    if (el !== 'phys') this.burst(el, p, 0.55 * s);
  }
  // a shock along the ground: a ring out to the blast's edge, dust or the school's colour behind it
  blast(at, el, radius = 1.5, s = 1) {
    const P = palOf(el), p = V(at);
    this.ring(p, P.mid, 0.2, radius + 0.5, 0.55, 1);
    this.ring(p, P.core, 0.1, radius * 0.7 + 0.3, 0.35, 0.8);
    for (let i = 0; i < 24 * s; i++) {
      const a = (i / (24 * s)) * TAU, sp = rnd(2.5, 4) * (radius / 1.5);
      this.add.add({ x: p.x, y: p.y + 0.1, z: p.z, vx: Math.cos(a) * sp, vy: rnd(0.2, 1.2), vz: Math.sin(a) * sp, drag: 3, life: rnd(0.4, 0.7), size: 0.26, size1: 0.04, color: P.core, color1: P.edge, cell: el === 'fire' ? CELL.flame : CELL.glow });
    }
    if (el === 'fire' || el === 'earth' || el === 'phys') this.dust(p, 12, radius / 1.4);
    if (el === 'fire') this.scorch(p, radius * 0.9 + 0.4);
  }
}
