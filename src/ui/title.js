// The title screen, up from the first paint. Two cards first, Blastorama Gaming and then Jamie
// Herrington, each fading in with four-pointed glints flaring on the edges of its letters (found from
// the logo's own alpha), a sheen of light across them, gold dust rising, and a tinkle of little glass
// bells for every glint, panned to where its glint is; then out. A click, a tap or a key fades the one
// showing at once and brings on the next. Then the VELSCOUR TACTICS logo over the black, the title's
// song booked to start with it, and a couple of tinkles, while the game loads behind; once it's in, the
// black lifts to the Hollow drifting by through a dark veil and the menu comes up under the logo.
// (Bellmourn's title, title.js there, brought over.)
//
// The cards, their glints and the logo's fade are CSS animations of opacity and transform only, all
// set going at one moment with their delays, and every sound is booked on the audio clock at that same
// moment, so they keep time with each other however hard the loading holds the main thread. A browser
// plays no sound till it's been clicked, so where it won't, the title first asks for that click.
// `?nosplash` in the address goes straight to the logo.
import { sound } from '../core/audio.js';
import { music } from '../core/music.js';

const LOGOS = {
  blastorama: 'assets/title/blastorama.webp',
  herrington: 'assets/title/herrington.webp',
  velscour: 'assets/title/velscour.webp',
};
// (the shine's mask is a CSS url, read against the stylesheet's folder: so, the whole address)
const full = (src) => new URL(src, location.href).href;
const CARDS = [['blastorama', 1], ['herrington', 3]];   // the cards in turn (and the note each one's tinkles start from)
const CARD = 5.2, GAP = 0.45;                  // each card's time on screen, and the black between them
const CUT = 0.3;                               // a card cut short: how fast it fades, and the next comes up
const CARD_GLINTS = [0.85, 1.4, 1.95, 2.55, 3.1];
const SHINE_AT = 1.0;                          // the light sweeping across each card's letters
const MAIN_IN = 1.9;                           // the logo's fade
const MAIN_GLINTS = [1.25, 2.05];              // its couple of tinkles
// where on a logo each glint lands, in turn: its ends first, then between
const ZONES = [[0, 0.2], [0.8, 1], [0.24, 0.5], [0.5, 0.76], [0.02, 0.3], [0.7, 0.98]];
const MENU = [['new', 'New Game'], ['continue', 'Continue']];
const TOUCH = matchMedia?.('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
const MODS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn']);

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);

/** A four-pointed star of light, drawn once, for the glints. */
function starSprite(n = 160) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'), h = n / 2;
  g.globalCompositeOperation = 'lighter';
  const glow = g.createRadialGradient(h, h, 0, h, h, h * 0.55);
  glow.addColorStop(0, 'rgba(255,236,190,0.85)');
  glow.addColorStop(0.22, 'rgba(255,205,110,0.3)');
  glow.addColorStop(1, 'rgba(255,190,80,0)');
  g.fillStyle = glow; g.fillRect(0, 0, n, n);
  const ray = (ang, len, w, a) => {
    g.save(); g.translate(h, h); g.rotate(ang);
    const gr = g.createLinearGradient(-len, 0, len, 0);
    gr.addColorStop(0, 'rgba(255,225,150,0)');
    gr.addColorStop(0.5, `rgba(255,253,240,${a})`);
    gr.addColorStop(1, 'rgba(255,225,150,0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-len, 0); g.lineTo(0, -w); g.lineTo(len, 0); g.lineTo(0, w); g.closePath(); g.fill();
    g.restore();
  };
  ray(0, h, n * 0.03, 1); ray(Math.PI / 2, h, n * 0.03, 1);
  ray(Math.PI / 4, h * 0.42, n * 0.02, 0.6); ray(-Math.PI / 4, h * 0.42, n * 0.02, 0.6);
  const core = g.createRadialGradient(h, h, 0, h, h, n * 0.08);
  core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core; g.fillRect(0, 0, n, n);
  return c.toDataURL();
}

/** The upper edges of a logo's letters (where a gilded edge catches the light), as fractions of it. */
function edgesOf(img) {
  const w = 360, h = Math.max(1, Math.round(w * (img.naturalHeight || 1) / (img.naturalWidth || 1)));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  let d;
  try { g.drawImage(img, 0, 0, w, h); d = g.getImageData(0, 0, w, h).data; } catch { return []; }
  const pts = [];
  for (let y = 3; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] > 200 && d[((y - 3) * w + x) * 4 + 3] < 30) pts.push([x / w, y / h]);
  }
  return pts;
}

class Title {
  constructor() {
    this.mode = 'boot';          // boot | gate | splash | main | hidden
    this.isReady = false; this.logoIn = false; this.menuOn = false;
    this.state = {};
    this.onMenu = null;          // (action): new, continue (main.js's)
    this.edges = {};
    this.build();
    this.boot();
  }

  // ------------------------------------------------------------------ the screen
  build() {
    const R = this.root = document.getElementById('title') || document.body.appendChild(el('div'));
    R.id = 'title';
    R.classList.toggle('is-touch', !!TOUCH);
    R.style.setProperty('--t-star', `url(${starSprite()})`);
    this.screen = R.appendChild(el('div', 't-screen'));
    this.screen.append(el('div', 't-veil'));
    this.cover = this.screen.appendChild(el('div', 't-cover'));
    this.cards = el('div', 't-cards');
    this.main = el('div', 't-main', `
      <div class="t-logo t-mainlogo"><img alt="Velscour Tactics" src="${LOGOS.velscour}" draggable="false">
        <div class="t-shine" style="--m:url(${full(LOGOS.velscour)})"><i></i></div><div class="t-glints"></div><div class="t-motes"></div></div>
      <p class="t-tag">A world built upon something that should have stayed dead.</p>
      <div class="t-under"><div class="t-status"><span></span></div><nav class="t-menu"></nav></div>
      <p class="t-keys">${TOUCH ? 'The d-pad to walk · A to act · B to jump' : 'Arrows / WASD or the d-pad to walk · Space to jump · Enter to act · P for auto-play · wheel to zoom'}</p>`);
    this.mainLogo = this.main.querySelector('.t-mainlogo');
    this.statusEl = this.main.querySelector('.t-status');
    this.menuEl = this.main.querySelector('.t-menu');
    MENU.forEach(([a, label], i) => {
      const b = el('button', 't-btn', `<span>${label}</span>`);
      b.dataset.a = a; b.style.setProperty('--i', i);
      b.onclick = (e) => { e.stopPropagation(); if (!this.menuOn || b.disabled) return; this.chime(); this.onMenu?.(a); };
      this.menuEl.append(b);
    });
    this.gate = el('div', 't-gate', `<b>${TOUCH ? 'Tap' : 'Click'} to begin</b>`);
    this.skipEl = el('div', 't-skip', TOUCH ? 'Tap to skip' : 'Click or press a key to skip');
    this.screen.append(this.cards, this.main, this.gate, this.skipEl);
    // a click or a tap while the cards are up: the one showing fades out and the next comes on
    this.screen.addEventListener('pointerdown', (e) => {
      sound.start();   // (any click lets the sound run, if it isn't already)
      if (this.mode !== 'splash' || e.button > 0) return;
      e.preventDefault();
      this.next();
    });
    // gold dust about the logo, drifting up while the title is up
    const motes = this.mainLogo.querySelector('.t-motes');
    for (let i = 0; i < 16; i++) motes.append(this.mote(rnd(0.02, 0.98), rnd(-0.1, 1.15), rnd(0, 7), true));
    // the menu's hover tick
    R.addEventListener('pointerover', (e) => { const b = e.target.closest?.('.t-btn'); if (b && b !== this.hovered && !b.disabled) { this.hovered = b; this.tick(); } });
    R.addEventListener('pointerout', (e) => { if (this.hovered && e.target.closest?.('.t-btn') === this.hovered && !this.hovered.contains(e.relatedTarget)) this.hovered = null; });
    addEventListener('keydown', (e) => this.key(e), true);
  }

  /** One mote of gold dust at (x, y) of a logo, `delay` seconds on (loop: forever). */
  mote(x, y, delay, loop = false) {
    const m = el('s', loop ? 't-mote loop' : 't-mote');
    m.style.cssText = `left:${(x * 100).toFixed(1)}%;top:${(y * 100).toFixed(1)}%;animation-delay:${delay.toFixed(2)}s;--dx:${rnd(-14, 14).toFixed(0)}px;--dy:${rnd(-70, -30).toFixed(0)}px;--z:${rnd(0.6, 1.3).toFixed(2)}`;
    return m;
  }

  glint(x, y, delay, s = 1) {
    const g = el('i', 't-glint');
    g.style.cssText = `left:${(x * 100).toFixed(2)}%;top:${(y * 100).toFixed(2)}%;animation-delay:${delay.toFixed(3)}s;--s:${s.toFixed(2)}`;
    return g;
  }

  /** A spot on a logo's edges within the zone [x0, x1], not too near one already taken. */
  spot(name, [x0, x1], taken) {
    const pts = (this.edges[name] || []).filter(([x]) => x >= x0 && x <= x1);
    for (let k = 0; k < 24 && pts.length; k++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      if (taken.every(([x, y]) => Math.hypot((x - p[0]) * 4, y - p[1]) > 0.35)) { taken.push(p); return p; }
    }
    const p = pts.length ? pts[Math.floor(Math.random() * pts.length)] : [rnd(x0, x1), rnd(0.25, 0.6)];
    taken.push(p);
    return p;
  }

  // ------------------------------------------------------------------ the start
  async boot() {
    const skip = /[?&]nosplash\b/.test(location.search);
    // the pictures in hand (and their edges found), and the title's song fetched and decoded, before
    // anything fades in: the song is booked to start the instant the logo does
    sound.start();
    const song = music.preloadTitle();
    const imgs = Object.entries(LOGOS).map(([k, src]) => { const i = new Image(); i.src = src; return [k, i]; });
    await Promise.race([Promise.all([...imgs.map(([, i]) => i.decode().catch(() => {})), song]), wait(20000)]);
    // (a song slower than that is booked when it comes, from then; then the effects come in)
    song.then((ok) => { if (ok && this.mainAt != null && !music.titleSong && this.mode !== 'hidden') music.bookTitle(Math.max(this.mainAt, sound.now)); })
      .finally(() => sound.loadBank());
    for (const [k, i] of imgs) this.edges[k] = edgesOf(i);
    // a browser plays no sound till it's been clicked (or a key pressed), unless it trusts the site
    const c = sound.start();
    if (c && c.state !== 'running') await Promise.race([new Promise((r) => c.addEventListener('statechange', r, { once: true })), wait(250)]);
    if (this.mode === 'hidden') return;
    if (skip || !c || c.state === 'running') { this.run(skip); return; }
    this.mode = 'gate';
    this.gate.classList.add('on');
    // (a click, not a press: on a phone only the lifted finger counts as the go-ahead for sound)
    const go = (e) => {
      if (this.mode !== 'gate' || (e.type === 'keydown' && MODS.has(e.key))) return;
      e.preventDefault?.();
      this.gate.removeEventListener('click', go);
      this.gate.classList.remove('on');
      this.mode = 'boot';
      sound.start();
      Promise.race([c.resume(), wait(400)]).catch(() => {}).then(() => this.run(false));
    };
    this.gate.addEventListener('click', go);
    this.gateKey = go;
  }

  /** The cards, then the logo (straight to it when `skip`). */
  run(skip) {
    if (this.mode === 'hidden') return;
    this.mode = skip ? 'main' : 'splash';
    if (!skip) { this.skipEl.classList.add('on'); this.splash(0, 0); return; }
    this.bus = sound.newBus();
    this.beginMain(0, sound.ok ? sound.now + 0.08 : 0);
  }

  /** The cards from the `from`th on, the first of them `at` seconds from now, then the logo. */
  splash(from, at) {
    const lead = 0.08, at0 = sound.ok ? sound.now + lead : 0;
    this.bus = sound.newBus();
    this.cardFrom = from;
    this.t0 = performance.now() + (lead + at) * 1000;   // (when the first of these comes up)
    this.cardEls = CARDS.slice(from).map(([name, note], k) => this.card(name, at + k * (CARD + GAP), at0, note));
    this.cards.append(...this.cardEls);
    const main = at + this.cardEls.length * (CARD + GAP);
    clearTimeout(this.splashT);
    this.splashT = setTimeout(() => this.skip(true), main * 1000);
    this.beginMain(main, at0);
  }

  /** A click, a tap or a key while the cards are up: the one showing fades out at once and the next
   * comes up (after the last, the logo). */
  next() {
    if (this.mode !== 'splash') return;
    const into = (performance.now() - this.t0) / 1000;
    if (into < 0) return;   // (the next isn't up yet: a quick second click doesn't skip it unseen)
    const k = Math.min(this.cardEls.length - 1, Math.floor(into / (CARD + GAP))), n = this.cardFrom + k + 1;
    if (n >= CARDS.length) { this.skip(); return; }
    this.fadeCards();
    this.hush(0.08);
    this.splash(n, CUT);
  }

  /** The cards up fading out from wherever they are, and then gone. */
  fadeCards() {
    for (const c of this.cardEls || []) {
      const s = getComputedStyle(c), o = s.opacity, t = s.transform;
      c.style.animation = 'none'; c.style.opacity = o; c.style.transform = t;
      void c.offsetWidth;
      c.style.transition = `opacity ${CUT}s ease-out`; c.style.opacity = '0';
      setTimeout(() => c.remove(), CUT * 1000 + 120);
    }
    this.cardEls = [];
  }

  /** One splash card: its logo fading in and out at `at` seconds, its glints and their tinkles. */
  card(name, at, at0, from) {
    const src = LOGOS[name], c = el('div', 't-card');
    c.style.animationDelay = `${at}s`;
    c.innerHTML = `<div class="t-logo"><img src="${src}" alt="" draggable="false"><div class="t-shine" style="--m:url(${full(src)})"><i style="animation-delay:${at + SHINE_AT}s"></i></div><div class="t-glints"></div><div class="t-motes"></div></div>`;
    const glints = c.querySelector('.t-glints'), motes = c.querySelector('.t-motes'), taken = [];
    let note = from;
    CARD_GLINTS.forEach((d, i) => {
      const [x, y] = this.spot(name, ZONES[i % ZONES.length], taken), t = at + d + rnd(-0.08, 0.08);
      glints.append(this.glint(x, y, t, rnd(0.75, 1.2)));
      // each its own little bell, wandering up and down the scale (no two alike in a row)
      if (this.bus) sound.tinkle(this.bus, at0 + t + 0.07, note, (x - 0.5) * 1.3, 1);
      note = Math.max(0, Math.min(4, note + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]));
    });
    for (let i = 0; i < 14; i++) motes.append(this.mote(rnd(0, 1), rnd(-0.15, 1.1), at + rnd(0.5, 3.4)));
    return c;
  }

  /** The logo coming up `at` seconds on: the title's song from that moment, and a couple of tinkles. */
  beginMain(at, at0) {
    const L = this.mainLogo, taken = [], shine = L.querySelector('.t-shine i');
    // (cleared and set again, so they start over from now: a new delay alone would count from before)
    for (const e of [L, this.statusEl, shine]) e.style.animation = 'none';
    void L.offsetWidth;
    L.style.animation = `t-main ${MAIN_IN}s cubic-bezier(.25,.6,.3,1) ${at}s both`;
    this.statusEl.style.animation = `t-fade 1.2s ease ${at + 1.2}s both`;
    shine.style.animation = `t-shine 1.7s ease-in-out ${at + 0.9}s both`;
    const glints = L.querySelector('.t-glints');
    glints.querySelectorAll('.t-glint').forEach((g) => g.remove());
    this.mainAt = at0 + at;
    if (sound.ctx) music.bookTitle(this.mainAt);
    MAIN_GLINTS.forEach((d, i) => {
      const [x, y] = this.spot('velscour', ZONES[i], taken);
      glints.append(this.glint(x, y, at + d, 1.15));
      if (this.bus) sound.tinkle(this.bus, at0 + at + d + 0.07, [2, 4][i], (x - 0.5) * 1.3, 0.9);
    });
    clearTimeout(this.inT);
    this.inT = setTimeout(() => { this.logoIn = true; this.maybeMenu(); }, (at + MAIN_IN * 0.75) * 1000);
  }

  /** Past the cards (their end, or the last cut short): on to the logo. */
  skip(ended = false) {
    if (this.mode !== 'splash') return;
    this.mode = 'main';
    clearTimeout(this.splashT);
    this.skipEl.classList.remove('on');
    if (ended) { for (const c of this.cardEls || []) c.remove(); this.cardEls = []; return; }
    // cut short: the cards fade from where they are, their booked bells are hushed, and the logo
    // comes up now
    this.fadeCards();
    this.hush(0.08);
    this.bus = sound.newBus();
    this.beginMain(CUT, sound.ok ? sound.now : 0);
  }

  /** The booked bells hushed (a card cut short, or the title put away). */
  hush(tc = 0.06) {
    const old = this.bus;
    this.bus = null;
    if (old && sound.ok) { old.gain.setTargetAtTime(0, sound.now, tc); setTimeout(() => old.disconnect(), 600); }
  }

  // ------------------------------------------------------------------ what the game tells it
  /** The game is loaded: the menu comes up once the logo is in. state: {continue} */
  ready(state = {}) {
    this.state = state;
    this.isReady = true;
    this.status('');
    this.maybeMenu();
  }

  maybeMenu() {
    if (!this.isReady || !this.logoIn || this.mode !== 'main' || this.menuOn) return;
    this.menuOn = true;
    for (const b of this.menuEl.children) b.disabled = b.dataset.a === 'continue' && !this.state.continue;
    this.main.classList.add('menu-on');
    this.cover.classList.add('reveal');      // the black lifts: the Hollow, dim, behind the logo
    this.idle();
  }

  /** The line under the logo while the game loads. */
  status(text) { this.statusEl.querySelector('span').textContent = text; }

  /** The title away (a new game's making, or one continued). */
  hide() {
    if (this.mode === 'hidden') return;
    if (this.mode === 'splash') { this.skip(true); this.hush(); }
    this.mode = 'hidden';
    this.menuOn = false;
    clearTimeout(this.idleT); clearTimeout(this.inT); clearTimeout(this.splashT);
    this.gate.classList.remove('on'); this.skipEl.classList.remove('on');
    this.screen.classList.add('out');
    setTimeout(() => this.screen.classList.add('gone'), 900);
  }

  get up() { return this.mode !== 'hidden'; }

  /** Now and then a glint on the logo while the menu waits (no sound: once was enough). */
  idle() {
    clearTimeout(this.idleT);
    this.idleT = setTimeout(() => {
      if (!this.menuOn || this.mode !== 'main') return;
      const [x, y] = this.spot('velscour', [0, 1], []);
      const g = this.glint(x, y, 0, rnd(0.7, 1.05));
      this.mainLogo.querySelector('.t-glints').append(g);
      setTimeout(() => g.remove(), 1400);
      this.idle();
    }, rnd(2800, 6500));
  }

  /** Keys: any brings on the next card (as a click does); the arrows walk the menu. The game's own
   * keys (input.js) don't hear what's used here. */
  key(e) {
    if (this.mode === 'hidden') return;
    if (this.mode === 'gate') { this.gateKey?.(e); e.stopPropagation(); return; }
    if (this.mode === 'splash') {
      if (!MODS.has(e.key)) { e.preventDefault(); if (!e.repeat) this.next(); }
      e.stopPropagation();
      return;
    }
    if (!this.menuOn) { e.stopPropagation(); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
      const list = [...this.menuEl.children].filter((b) => !b.disabled);
      if (list.length) {
        const i = list.indexOf(document.activeElement), d = ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA'].includes(e.code) ? -1 : 1;
        list[i < 0 ? (d > 0 ? 0 : list.length - 1) : (i + d + list.length) % list.length].focus();
        this.tick();
      }
      e.preventDefault(); e.stopPropagation();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
      e.stopPropagation(); e.preventDefault();
      if (e.repeat) return;
      const f = document.activeElement?.closest?.('.t-menu .t-btn') || [...this.menuEl.children].find((b) => !b.disabled);
      f?.click();
      return;
    }
    e.stopPropagation();
  }

  // ------------------------------------------------------------------ the sounds
  /** The hover tick, and the click's chime. */
  tick(k = 1) {
    if (!sound.ok) return;
    this.ui ||= sound.newBus();
    if (this.ui) sound.bell(this.ui, sound.now + 0.005, 3520 * k * rnd(0.98, 1.02), 0.022, 0, 0.16);
  }

  chime() {
    sound.start();
    if (!sound.ok) return;
    this.ui ||= sound.newBus();
    if (this.ui) sound.tinkle(this.ui, sound.now + 0.005, 1 + Math.floor(Math.random() * 3), 0, 0.5);
  }
}

export const title = new Title();
window.vtTitle = title;
