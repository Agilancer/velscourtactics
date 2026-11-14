// The model viewer (viewer.html): every model in assets/models/manifest.json, loaded the way the game loads it
// (withOverride: height, outline, lift, bone scales, glow), under the game's light, with a button per state.
// ?m=key1,key2 opens those side by side. In a pane where requestAnimationFrame does not fire,
// step it by hand: viewer.step(seconds), then viewer.shot('name') posts a PNG to tools/serve.py.
import * as THREE from 'three';
import { loadManifest, withOverride, setAnim, animate, shadowDisc } from './gfx/models.js';

const $ = (s) => document.querySelector(s);
const ORDER = ['idle', 'walk', 'run', 'jump', 'attack', 'cast', 'hit', 'dead', 'revive', 'wounded', 'stunned', 'guard', 'cheer', 'taunt', 'point', 'talk', 'item'];
const LOOP = new Set(['idle', 'walk', 'run', 'wounded', 'stunned', 'guard', 'talk', 'cheer']);

// ---- scene: the game's sky, sun and rim light ----
const canvas = $('#view');
const gl = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
gl.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07060a);
scene.add(new THREE.HemisphereLight(0x8fa0c8, 0x2a2018, 1.15));
const sun = new THREE.DirectionalLight(0xffe0b0, 1.5); sun.position.set(8, 14, 3); scene.add(sun);
const rim = new THREE.DirectionalLight(0x9fb4d4, 0.9); rim.position.set(-8, 7, -6); scene.add(rim);
const studio = new THREE.Group();
const fill = new THREE.DirectionalLight(0xffffff, 1.6); fill.position.set(0, 6, 10); studio.add(fill);
studio.add(new THREE.AmbientLight(0xffffff, 0.9));

// tiles, one world unit each, as in the game
const tiles = new THREE.Group();
{
  const a = new THREE.MeshLambertMaterial({ color: 0x2c2620 }), b = new THREE.MeshLambertMaterial({ color: 0x241f1a });
  const geo = new THREE.BoxGeometry(0.98, 0.5, 0.98);
  for (let x = -6; x <= 6; x++) for (let z = -3; z <= 3; z++) {
    const m = new THREE.Mesh(geo, (x + z) & 1 ? a : b); m.position.set(x, -0.25, z); tiles.add(m);
  }
}
scene.add(tiles);

const row = new THREE.Group(); scene.add(row);
const persp = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const view = { yaw: 0.35, pitch: 0.12, dist: 6, aim: new THREE.Vector3(0, 0.9, 0), game: false };

// ---- state ----
let manifest = {}, shown = [], state = 'idle', paused = false, speed = 1, repeat = true, spin = false, again = -1;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  gl.setSize(w, h, false);
  persp.aspect = w / h; persp.updateProjectionMatrix();
  const z = 11 * (w / h < 1 ? 1.25 : 1);   // the game's zoom: 11 world units of height
  ortho.left = -z * w / h / 2; ortho.right = z * w / h / 2; ortho.top = z / 2; ortho.bottom = -z / 2; ortho.updateProjectionMatrix();
  fit();                                   // a pane can open at no size at all and grow after the models are placed
}
// The part of the window the panels leave free; both cameras are shifted so the models sit in its middle.
function free() {
  const W = window.innerWidth, H = window.innerHeight, side = $('#side').getBoundingClientRect(), bar = $('#bar').getBoundingClientRect();
  const narrow = W <= 760;
  return { W, H, x0: narrow ? 0 : side.right + 8, y0: narrow ? side.bottom + 8 : 0, x1: W, y1: Math.max(bar.top - 8, H * 0.4) };
}
function frameView() {
  const f = free(), cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  for (const c of [persp, ortho]) c.setViewOffset(f.W, f.H, f.W / 2 - cx, f.H / 2 - cy, f.W, f.H);
}
// near enough that the row fills the free part of the window, top to bottom or side to side
function fit() {
  const f = free(), fw = Math.max(80, f.x1 - f.x0), fh = Math.max(80, f.y1 - f.y0), tanV = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2));
  if (!f.W || !f.H) return;
  const span = (shown.length - 1) * 1.6, tall = Math.max(1.7, ...shown.map((s) => manifest[s.key]?.height || 1.7));
  view.aim.set(0, tall * 0.5, 0);
  view.dist = 1.06 * Math.max((tall / 2 + 0.25) * f.H / (tanV * fh), (span / 2 + 0.7) * f.H / (tanV * fw));
  frameView();
}
function place() {
  if (view.game) {
    ortho.position.copy(view.aim).add(new THREE.Vector3(20, 16.5, 20)); ortho.lookAt(view.aim);
    return ortho;
  }
  const c = Math.cos(view.pitch);
  persp.position.set(view.aim.x + Math.sin(view.yaw) * c * view.dist, view.aim.y + Math.sin(view.pitch) * view.dist, view.aim.z + Math.cos(view.yaw) * c * view.dist);
  persp.lookAt(view.aim);
  return persp;
}

const PARTY = ['stevie', 'homunculus', 'lily', 'jamie', 'lisandra'];
const PLATE = ['paladin_m', 'paladin_f', 'death_knight_m', 'dragoon_m', 'barbarian_m', 'barbarian_f'];
function group(key) {
  if (/^zombie/.test(key)) return 'Zombies';
  if (PARTY.includes(key)) return 'Party';
  return 'Classes';
}
function buildList() {
  const want = $('#find').value.trim().toLowerCase(), groups = {};
  for (const k of Object.keys(manifest)) if (!want || k.includes(want)) (groups[group(k)] ||= []).push(k);
  const list = $('#list'); list.innerHTML = '';
  for (const g of ['Party', 'Classes', 'Zombies']) {
    if (!groups[g]) continue;
    const h = document.createElement('h2'); h.textContent = g; list.append(h);
    for (const k of groups[g].sort()) {
      const d = document.createElement('div'); d.className = 'item' + (shown.some((s) => s.key === k) ? ' on' : '');
      d.innerHTML = `<span>${k}</span><small>${Object.keys(manifest[k].anims || {}).length}</small>`;
      d.onclick = (e) => {
        const keys = shown.map((s) => s.key);
        if (e.shiftKey || e.ctrlKey || e.metaKey) show(keys.includes(k) ? keys.filter((x) => x !== k) : [...keys, k]);
        else show([k]);
      };
      list.append(d);
    }
  }
  const sets = $('#sets'); sets.innerHTML = '';
  const add = (name, keys) => { if (!keys.length) return; const b = document.createElement('button'); b.textContent = name; b.onclick = () => show(keys); sets.append(b); };
  const all = Object.keys(manifest);
  const has = (keys) => keys.filter((k) => manifest[k]);
  add('Party', has(PARTY));
  add('Plate', has(PLATE));
  add('Cloth', all.filter((k) => group(k) === 'Classes' && !PLATE.includes(k)));
  add('Zombies', all.filter((k) => group(k) === 'Zombies'));
}

function show(keys) {
  for (const s of shown) row.remove(s.root);
  shown = keys.filter((k) => manifest[k]).map((key) => {
    const stand = new THREE.Group(); stand.userData.height = manifest[key].height || 1.7;
    const model = withOverride(key, stand);
    const root = new THREE.Group(); root.add(model, shadowDisc(0.4));
    return { key, model, root };
  });
  const gap = 1.6, w = (shown.length - 1) * gap;
  shown.forEach((s, i) => { s.root.position.x = i * gap - w / 2; row.add(s.root); });
  history.replaceState(null, '', '?m=' + keys.join(','));
  state = 'idle'; again = -1;
  buildList(); buildClips(); info(); fit();
}

function buildClips() {
  const names = {};
  for (const s of shown) for (const [st, clip] of Object.entries(manifest[s.key].anims || {})) (names[st] ||= new Set()).add(clip);
  const states = Object.keys(names).sort((a, b) => {
    const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const box = $('#clips'); box.innerHTML = '';
  for (const st of states) {
    const b = document.createElement('button'); b.dataset.state = st;
    const clip = [...names[st]].join(' / ');
    b.innerHTML = clip.toLowerCase() === st ? st : `${st}<small>${clip}</small>`;
    b.onclick = () => play(st);
    box.append(b);
  }
  mark();
}
function mark() {
  for (const b of document.querySelectorAll('#clips button')) b.classList.toggle('on', b.dataset.state === state);
  $('#now').textContent = state;
}

function play(st) {
  state = st; again = -1;
  for (const s of shown) {
    const a = s.model.userData.anim; if (a) a.state = '';
    setAnim(s.model, st);
  }
  mark();
}

function info() {
  const el = $('#info');
  el.innerHTML = shown.map((s) => {
    const d = manifest[s.key]; let tris = 0, ready = !!s.model.userData.mixer;
    s.model.traverse((o) => { if (o.isMesh && !o.userData.hull && !o.isSprite) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    return `<div><b>${s.key}</b><br><span>file</span> ${d.file}<br><span>height</span> ${d.height || '-'} tiles<br>` +
      `<span>triangles</span> ${ready ? Math.round(tris).toLocaleString() : 'loading'}<br><span>states</span> ${Object.keys(d.anims || {}).length}` +
      `${d.bones ? '<br><span>bone scales</span> ' + Object.keys(d.bones).length : ''}</div>`;
  }).join('') || '<span>Nothing shown.</span>';
}

// ---- the loop ----
function update(dt) {
  const t = paused ? 0 : dt * speed;
  for (const s of shown) {
    animate(s.model, t);
    if (spin) s.root.rotation.y += t * 0.6;
  }
  // a one-shot that has finished goes back to idle on its own (the game does that); with Repeat on, play it again
  if (repeat && !LOOP.has(state) && state !== 'dead' && shown.length) {
    const back = shown.every((s) => !s.model.userData.mixer || s.model.userData.anim?.state !== state);
    if (back && again < 0) again = 0.6;
    if (again >= 0 && (again -= t) < 0) { const st = state; play(st); }
  }
  if (repeat && state === 'dead' && shown.length) {
    // stay down a while, then fall again
    if (again < 0) again = 0; again += t;
    const dur = Math.max(...shown.map((s) => s.model.userData.clips?.dead?.duration || 1.5));
    if (again > dur / ((manifest[shown[0].key].speed || {}).dead || 1) + 1.2) play('dead');
  }
}
function render() { gl.render(scene, place()); }

let last = performance.now(), loaded = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); render();
  const n = shown.filter((s) => s.model.userData.mixer).length;
  if (n !== loaded) { loaded = n; info(); if (state !== 'idle') play(state); }
  requestAnimationFrame(frame);
}

// ---- input ----
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  view.yaw -= (e.clientX - drag.x) * 0.008; view.pitch = Math.max(-0.4, Math.min(1.3, view.pitch + (e.clientY - drag.y) * 0.006));
  drag = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => { e.preventDefault(); view.dist = Math.max(1.2, Math.min(40, view.dist * Math.exp(e.deltaY * 0.001))); }, { passive: false });
canvas.addEventListener('dblclick', () => show(shown.map((s) => s.key)));
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ') { e.preventDefault(); $('#pause').click(); }
  const btns = [...document.querySelectorAll('#clips button')], i = btns.findIndex((b) => b.dataset.state === state);
  if (e.key === 'ArrowRight' && btns.length) btns[(i + 1) % btns.length].click();
  if (e.key === 'ArrowLeft' && btns.length) btns[(i - 1 + btns.length) % btns.length].click();
});
const toggle = (id, fn) => $(id).addEventListener('click', (e) => { const on = !e.currentTarget.classList.contains('on'); e.currentTarget.classList.toggle('on', on); fn(on); });
$('#pause').addEventListener('click', (e) => { paused = !paused; e.currentTarget.classList.toggle('on', paused); e.currentTarget.textContent = paused ? 'Play' : 'Pause'; });
$('#stepf').addEventListener('click', () => { const p = paused; paused = false; update(1 / 30); paused = p; });
$('#speed').addEventListener('input', (e) => { speed = +e.target.value; $('#speedv').textContent = speed.toFixed(2) + '×'; });
toggle('#repeat', (on) => { repeat = on; again = -1; });
toggle('#spin', (on) => { spin = on; if (!on) for (const s of shown) s.root.rotation.y = 0; });
toggle('#game', (on) => { view.game = on; });
toggle('#bright', (on) => { if (on) scene.add(studio); else scene.remove(studio); });
toggle('#grid', (on) => { tiles.visible = on; });
$('#find').addEventListener('input', buildList);
window.addEventListener('resize', resize);

// ---- start ----
await loadManifest();
try { manifest = await (await fetch('assets/models/manifest.json')).json(); } catch { manifest = {}; }
resize();
const asked = new URLSearchParams(location.search).get('m');
const first = asked ? asked.split(',') : PARTY.filter((k) => manifest[k]);
show(first.length ? first : Object.keys(manifest).slice(0, 1));
requestAnimationFrame(frame);

// for a pane without requestAnimationFrame
window.viewer = {
  get shown() { return shown.map((s) => s.key); },
  get models() { return shown; },
  THREE,
  show, play,
  view,
  step(sec = 1 / 30) { const n = Math.max(1, Math.round(sec * 30)); for (let i = 0; i < n; i++) update(1 / 30); render(); info(); },
  async shot(name) { render(); await fetch('/shot?name=' + encodeURIComponent(name), { method: 'POST', body: gl.domElement.toDataURL('image/png') }); },
};
