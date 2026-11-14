// The game's sound. The recordings came over from Bellmourn (assets/audio): sfx for blades, blows,
// footsteps, doors, chests, spells, a crowd, a scream and the Last Toll's bells; music (music.js); amb
// for the world's beds and fires (ambience.js). A few are made here, for what the recordings have
// nothing for: the interface's tick, coins, a refusal, the dead's groan, a bowstring, a pistol, and
// the little glass bells (the title's sparkles, a level gained, a mending).
//
// One AudioContext, made at the first chance and let run on the first click or key (a browser plays
// nothing before that: title.js asks for the click). A master volume (the Sound button mutes it) and a
// gentle limiter, and under them three lines: effects, music and ambience. Every `sfx` call is safe
// before the context runs or the recordings are in: it plays its made-up stand-in, or nothing.

const DIR = 'assets/audio/sfx/';
// the effects, by name, and how many takes of each (name_1 .. name_n; 0: one file, `name`)
const TAKES = {
  sword_attack: 3, sword_blocked: 3, sword_impact_hit: 3, sword_parry: 3, sword_sheath: 2, sword_unsheath: 2, bow_impact_hit: 3,
  chop: 4, mine: 5, chest_open: 2, chest_close: 2, door_open: 2, door_close: 2, lock_unlock: 0,
  fireball: 3, firebuff: 2, firespray: 2, waterspray: 2, wave_attack: 2, rock_wall: 2, spell_impact: 3,
  ice_barrage: 2, ice_freeze: 2, ice_throw: 2, ice_wall: 2, rock_meteor_swarm: 2, rock_meteor_throw: 2, light_torch: 2, torch_attack_strike: 2,
  title_bells: 0, wilhelm_scream: 0, crowd_gasp: 0, crowd_panic: 0, water_jump: 0, water_land: 0,
};
for (const g of ['dirt', 'stone']) for (const c of ['', 'chain_']) {
  TAKES[`${g}_${c}walk`] = 5; TAKES[`${g}_${c}run`] = 5; TAKES[`${g}_${c}jump`] = 0; TAKES[`${g}_${c}land`] = 0;
}
// a small struck glass bell's partials: [ratio, level, decay s]; and the bells' scale, E major
// pentatonic, high (E6 .. F#7)
export const TING = [[1, 1, 1.5], [2.0, 0.38, 0.75], [3.0, 0.16, 0.45], [4.2, 0.1, 0.28], [5.4, 0.05, 0.18]];
export const SCALE = [1318.5, 1480, 1661.2, 1975.5, 2217.5, 2637, 2960];

const clamp1 = (x) => Math.max(-1, Math.min(1, x));
const rnd = (a, b) => a + Math.random() * (b - a);
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

/** Where a decoded effect's sound begins (past the file's own silence and the encoder's), seconds. */
export function onset(b) {
  const d = b.getChannelData(0), n = Math.min(d.length, Math.round(b.sampleRate * 0.25));
  for (let i = 0; i < n; i++) if (Math.abs(d[i]) > 0.0025) return Math.max(0, i - b.sampleRate * 0.004) / b.sampleRate;
  return 0;
}

/** A room's echo: a couple of seconds of decaying noise, a little different in each ear. */
function impulse(c, secs, decay) {
  const n = Math.round(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay) * Math.min(1, i / (c.sampleRate * 0.012));
  }
  return b;
}

class Sound {
  constructor() {
    this.ctx = null;
    this.volume = 0.85; this.musicVolume = 0.55; this.ambVolume = 0.7;
    this.muted = get('vt.muted') === '1';
    this.bank = {};          // name -> [{b: AudioBuffer, off: where its sound begins}]
    this.pick = {};          // name -> the take last played (never the same twice running)
    this.voices = 0;
    this.onStart = [];       // (music.js: its players are let play by the same click)
    this.where = null;       // (x, y, z) -> -1..1, how far left or right on the screen: the game sets it
  }

  /** The context made (or woken): from a click or a key, it may run. */
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      for (const f of this.onStart) f();
      return this.ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { this.ctx = new AC(); } catch { return null; }
    const c = this.ctx;
    // master volume, then a limiter so music, the world and a fight together never crackle
    this.out = c.createGain();
    this.out.gain.value = this.muted ? 0 : this.volume;
    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 4; lim.ratio.value = 10; lim.attack.value = 0.003; lim.release.value = 0.2;
    this.out.connect(lim); lim.connect(c.destination);
    this.fx = c.createGain(); this.fx.connect(this.out);
    this.music = c.createGain(); this.music.gain.value = this.musicVolume; this.music.connect(this.out);
    this.amb = c.createGain(); this.amb.gain.value = this.ambVolume; this.amb.connect(this.out);
    const n = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, n, n);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    for (const f of this.onStart) f();
    return c;
  }

  get ok() { return !!this.ctx && this.ctx.state === 'running'; }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('vt.muted', m ? '1' : '0'); } catch { /* no storage */ }
    if (this.out) this.out.gain.setTargetAtTime(m ? 0 : this.volume, this.now, 0.05);
  }

  /** A file fetched and decoded (null if it can't be). */
  async decode(url) {
    const c = this.ctx || this.start();
    if (!c) return null;
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const ab = await r.arrayBuffer();
      return await new Promise((res, rej) => { const p = c.decodeAudioData(ab, res, rej); p?.catch?.(rej); });
    } catch (e) { console.warn('sound', url, e?.message || e); return null; }
  }

  /** The effects, fetched and decoded a few at a time (each plays as soon as it's in). */
  loadBank() {
    if (this.banking) return this.banking;
    const files = [];
    for (const [name, k] of Object.entries(TAKES)) for (let i = 1; i <= Math.max(1, k); i++) files.push([name, k ? `${name}_${i}` : name]);
    let next = 0;
    const one = async () => {
      while (next < files.length) {
        const [name, f] = files[next++];
        const b = await this.decode(DIR + f + '.mp3');
        if (b) (this.bank[name] ||= []).push({ b, off: onset(b) });
      }
    };
    this.banking = Promise.all([one(), one(), one(), one()]).then(() => this.bank);
    return this.banking;
  }
  has(name) { return !!this.bank[name]?.length; }

  /** -1..1: where on the screen a place {x, y, z} is, left to right (0 when the game hasn't said). */
  panAt(at) {
    if (!at || !this.where) return 0;
    try { return clamp1(this.where(at.x, at.y || 0, at.z)) * 0.75; } catch { return 0; }
  }

  /** One take of a recorded effect: false if it isn't in (the caller makes do). o: {vol, rate, vary
   * (pitch wander), pan, at (a place: panned to where it is on screen), delay, to (a line out)} */
  play(name, { vol = 1, rate = 1, vary = 0.05, pan = 0, at = null, delay = 0, to = null } = {}) {
    const takes = this.bank[name];
    if (!this.ok || !takes?.length) return false;
    if (this.voices > 40) return true;
    let i = Math.floor(Math.random() * takes.length);
    if (takes.length > 1 && i === this.pick[name]) i = (i + 1) % takes.length;
    this.pick[name] = i;
    const s = takes[i], c = this.ctx, t = c.currentTime + delay, p = at ? this.panAt(at) : pan;
    const src = c.createBufferSource();
    src.buffer = s.b;
    src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(g);
    let last = g;
    if (p && c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = clamp1(p); g.connect(pn); last = pn; }
    last.connect(to || this.fx);
    src.start(t, s.off);
    this.voices++;
    src.onended = () => { this.voices--; last.disconnect(); };
    return true;
  }

  // ---- the made-up ones
  tone(t0, dur, { type = 'sine', f0 = 440, f1 = f0, gain = 0.1, attack = 0.008, pan = 0, to = null } = {}) {
    if (!this.ok) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); this.panned(g, pan, to);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noise(t0, dur, { type = 'lowpass', f0 = 1200, f1 = f0, q = 0.8, gain = 0.1, attack = 0.005, pan = 0, to = null } = {}) {
    if (!this.ok) return;
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); this.panned(g, pan, to);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }
  panned(node, pan, to) {
    if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp1(pan); node.connect(p); p.connect(to || this.fx); }
    else node.connect(to || this.fx);
  }

  /** A line out with a room's echo on it (the glass bells ring through it). */
  newBus(wet = 0.42) {
    if (!this.ok) return null;
    const c = this.ctx;
    if (!this.verb) {
      this.verb = c.createConvolver();
      this.verb.buffer = impulse(c, 2.8, 2.6);
      this.wet = c.createGain();
      this.verb.connect(this.wet); this.wet.connect(this.fx);
    }
    this.wet.gain.value = wet;
    const g = c.createGain();
    g.connect(this.fx); g.connect(this.verb);
    return g;
  }
  get sparkle() { return (this._sparkle ||= this.newBus()); }

  /** One small bell struck at `when`. */
  bell(bus, when, f, gain, pan = 0, len = 1, partials = TING) {
    const c = bus.context;
    let to = bus;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp1(pan); p.connect(bus); to = p; }
    for (const [r, a, d] of partials) {
      if (f * r > c.sampleRate * 0.45) continue;   // (above what the ear, or the sample rate, can carry)
      const o = c.createOscillator(), e = c.createGain(), end = when + d * len;
      o.frequency.value = f * r * (1 + (Math.random() - 0.5) * 0.004);
      e.gain.setValueAtTime(0.0001, when);
      e.gain.exponentialRampToValueAtTime(gain * a, when + 0.004);
      e.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(e); e.connect(to);
      o.start(when); o.stop(end + 0.05);
    }
  }

  /** A tinkle: a bell on note `i` of the scale, two smaller after it, and a breath of shimmer. */
  tinkle(bus, when, i, pan = 0, vol = 1) {
    if (!bus) return;
    const n = (k) => SCALE[Math.min(SCALE.length - 1, k)];
    this.bell(bus, when, n(i), 0.11 * vol, pan, 1);
    this.bell(bus, when + rnd(0.06, 0.085), n(i + 2), 0.05 * vol, pan * 0.8, 0.8);
    this.bell(bus, when + rnd(0.13, 0.17), n(i + 4) * (i + 4 >= SCALE.length ? 1.5 : 1), 0.025 * vol, pan * 0.6, 0.6);
    const c = bus.context, s = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; hp.type = 'highpass'; hp.frequency.value = 7000;
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.02 * vol, when + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.3);
    s.connect(hp); hp.connect(g); g.connect(bus);
    s.start(when, Math.random() * 0.5); s.stop(when + 0.35);
  }

  /** The Last Toll's bells (a recording): ringing out `hold` seconds, then trailing away over `trail`. */
  peal({ vol = 0.75, hold = 3.2, trail = 7, down = 40 } = {}) {
    const b = this.bank.title_bells?.[0];
    if (!this.ok || !b) return false;
    const c = this.ctx, when = c.currentTime + 0.02, fall = when + hold, end = fall + trail;
    const src = c.createBufferSource(), lp = c.createBiquadFilter(), env = c.createGain();
    src.buffer = b.b;
    const curve = new Float32Array(64);
    for (let i = 0; i < 64; i++) curve[i] = vol * Math.pow(10, -down * Math.pow(i / 63, 1.6) / 20);
    curve[63] = 0;
    env.gain.setValueAtTime(vol, when);
    env.gain.setValueCurveAtTime(curve, fall, trail);
    const top = Math.min(18000, c.sampleRate * 0.45);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(top, fall); lp.frequency.exponentialRampToValueAtTime(1200, end);
    src.connect(lp); lp.connect(env); env.connect(this.fx);
    src.start(when, b.off); src.stop(end + 0.05);
    src.onended = () => env.disconnect();
    return true;
  }
}

export const sound = new Sound();
export const setMuted = (m) => sound.setMuted(m);

// ---------------------------------------------------------------------------------------------------
// What the game calls. `at` is a place {x, y, z} (a model's position): the sound sits where it is on
// screen. Weapon kinds are items.js's, plus the dead's: claw, bite, chain, slam.

const S = sound;
const T0 = () => S.now + 0.005;
// (every weapon kind, items.js's: put in hand, it's a blade's ring)
const WEAPON_KINDS = { sword: 1, axe: 1, mace: 1, spear: 1, bow: 1, pistol: 1, boomerang: 1, staff: 1, wand: 1, lute: 1, dagger: 1 };
const BLADE = new Set(['sword', 'spear']), BLUNT = new Set(['mace', 'slam', 'chain', 'staff', 'lute']);

/** A blow through the air. */
function swing(kind, at, el) {
  const p = { at };
  if (el === 'fire') S.play('torch_attack_strike', { ...p, vol: 0.9 });
  if (kind === 'bow') {   // the string let go, and the arrow's hiss
    const t = T0(), pan = S.panAt(at);
    S.tone(t, 0.16, { type: 'triangle', f0: 190, f1: 120, gain: 0.08, pan });
    S.noise(t + 0.02, 0.24, { type: 'bandpass', f0: 2600, f1: 900, q: 1.4, gain: 0.07, pan });
    return;
  }
  if (kind === 'pistol') {   // a crack and its boom
    const t = T0(), pan = S.panAt(at);
    S.noise(t, 0.09, { type: 'highpass', f0: 2400, f1: 1200, gain: 0.3, attack: 0.001, pan });
    S.noise(t, 0.5, { type: 'lowpass', f0: 900, f1: 80, gain: 0.32, attack: 0.002, pan });
    S.tone(t, 0.25, { type: 'sine', f0: 110, f1: 45, gain: 0.18, attack: 0.002, pan });
    return;
  }
  if (kind === 'chain') { S.play('stone_chain_run', { ...p, vol: 1.3, rate: 0.85 }); S.play('torch_attack_strike', { ...p, vol: 1.1, rate: 0.7, delay: 0.05 }); return; }
  if (kind === 'claw' || kind === 'bite') { S.play('sword_attack', { ...p, vol: 0.55, rate: 0.72 }); growl(at, 0.6); return; }
  const done = BLUNT.has(kind) ? S.play('torch_attack_strike', { ...p, vol: kind === 'slam' ? 1.15 : 0.9, rate: kind === 'slam' ? 0.62 : 0.85 })
    : kind === 'boomerang' ? S.play('sword_attack', { ...p, vol: 0.8, rate: 0.66 })
    : kind === 'dagger' ? S.play('sword_attack', { ...p, vol: 0.6, rate: 1.35 })   // short and quick, a knife's
    : S.play('sword_attack', { ...p, vol: kind === 'axe' ? 1 : 0.9, rate: kind === 'axe' ? 0.85 : 1 });
  if (!done) S.noise(T0(), 0.26, { type: 'bandpass', f0: 500, f1: 2400, q: 1.6, gain: 0.12, attack: 0.07, pan: S.panAt(at) });
}

/** A blow landing: o {kind (the weapon's), el, crit, blocked, at}. */
function impact({ kind = 'sword', el = null, crit = false, blocked = false, at = null } = {}) {
  const p = { at }, k = crit ? 1.25 : 1;
  let done;
  if (blocked) done = S.play('sword_blocked', { ...p, vol: 1 });
  else if (kind === 'bow' || kind === 'boomerang') done = S.play('bow_impact_hit', { ...p, vol: k });
  else if (kind === 'pistol') done = S.play('bow_impact_hit', { ...p, vol: k, rate: 0.8 });
  else if (kind === 'axe') { done = S.play('chop', { ...p, vol: 0.9 * k }); S.play('sword_impact_hit', { ...p, vol: 0.6 * k, delay: 0.01 }); }
  else if (BLUNT.has(kind)) { done = S.play('sword_impact_hit', { ...p, vol: 1.05 * k, rate: 0.68 }); S.play('dirt_land', { ...p, vol: 0.8 * k, rate: 0.7 }); }
  else if (kind === 'claw' || kind === 'bite') { done = S.play('sword_impact_hit', { ...p, vol: 0.8, rate: 0.82 }); S.play('chop', { ...p, vol: 0.35, rate: 1.35, delay: 0.02 }); }
  else done = S.play('sword_impact_hit', { ...p, vol: k, rate: BLADE.has(kind) ? 1 : 0.9 });
  if (crit) { S.play('sword_parry', { ...p, vol: 0.55, rate: 1.1, delay: 0.015 }); S.noise(T0(), 0.3, { f0: 700, f1: 90, gain: 0.18, pan: S.panAt(at) }); }
  if (!done) { const t = T0(), pan = S.panAt(at); S.noise(t, 0.12, { f0: 1800, f1: 300, gain: 0.18, pan }); S.tone(t, 0.12, { type: 'square', f0: 180, f1: 70, gain: 0.06, pan }); }
  if (el && !blocked) accent(el, at, 0.45);
}

/** An element's touch on a blow that carries one (a smite's light, a frost strike's cold). */
function accent(el, at, vol) {
  const p = { at, vol };
  if (el === 'fire') S.play('firebuff', { ...p, rate: 1.2 });
  else if (el === 'cold') S.play('ice_freeze', p);
  else if (el === 'holy' || el === 'light') { S.play('light_torch', { ...p, rate: 1.2 }); S.tinkle(S.sparkle, T0(), 3, S.panAt(at), vol); }
  else if (el === 'storm') crackle(at, vol);
  else if (el === 'poison' || el === 'acid') S.play('waterspray', { ...p, rate: 0.7 });
  else S.play('spell_impact', { ...p, rate: 1.2 });
}

/** Lightning's crackle (there's no recording of it). */
function crackle(at, vol = 1) {
  if (!S.ok) return;
  const t = T0(), pan = S.panAt(at);
  for (let i = 0; i < 6; i++) S.noise(t + i * rnd(0.02, 0.05), rnd(0.03, 0.08), { type: 'highpass', f0: rnd(2500, 5000), gain: 0.12 * vol, attack: 0.001, pan });
  S.noise(t, 0.4, { f0: 1200, f1: 100, gain: 0.15 * vol, pan });
}

/** One of the dead, wanting. */
function growl(at, vol = 1) {
  if (!S.ok) return;
  const t = T0(), pan = S.panAt(at), f = rnd(85, 120);
  S.tone(t, 0.45, { type: 'sawtooth', f0: f, f1: f * 0.7, gain: 0.05 * vol, attack: 0.05, pan });
  S.noise(t, 0.4, { type: 'bandpass', f0: 420, f1: 260, q: 3, gain: 0.06 * vol, attack: 0.06, pan });
}

// what a spell sounds like as it leaves the hand, by its element (and how it goes: a bolt, a wave
// round the caster, something from the sky, a spray); and as it lands
const CAST = {
  fire: { bolt: ['fireball', 1], wave: ['firespray', 1], sky: ['firebuff', 0.9, 0.8], spray: ['firespray', 1.05] },
  cold: { bolt: ['ice_throw', 1], wave: ['ice_wall', 1], sky: ['ice_barrage', 1], spray: ['ice_barrage', 0.9] },
  storm: { bolt: ['wave_attack', 0.8, 1.35], wave: ['rock_wall', 1], sky: ['wave_attack', 0.9, 1.2], spray: ['wave_attack', 0.8, 1.35] },
  holy: { bolt: ['light_torch', 1, 1.1], wave: ['light_torch', 1, 0.9], sky: ['light_torch', 1], spray: ['light_torch', 1] },
  light: { bolt: ['light_torch', 1, 1.2], wave: ['light_torch', 1], sky: ['light_torch', 1], spray: ['light_torch', 1] },
  shadow: { bolt: ['rock_meteor_throw', 0.9, 0.78], wave: ['wave_attack', 0.9, 0.7], sky: ['rock_meteor_throw', 1, 0.7], spray: ['rock_meteor_throw', 0.9, 0.78] },
  arcane: { bolt: ['wave_attack', 0.9, 1.15], wave: ['wave_attack', 1, 0.6], sky: ['rock_meteor_throw', 1, 1.1], spray: ['wave_attack', 0.9, 1.15] },
  poison: { bolt: ['waterspray', 0.9, 0.8], wave: ['waterspray', 1, 0.7], sky: ['waterspray', 1, 0.75], spray: ['waterspray', 1, 0.8] },
  acid: { bolt: ['waterspray', 0.9, 0.95], wave: ['waterspray', 1, 0.85], sky: ['waterspray', 1, 0.9], spray: ['waterspray', 1, 0.95] },
};
const howGoes = (sk) => (sk.anim === 'meteor' ? 'sky' : sk.anim === 'wave' || sk.at === 'self' ? 'wave' : sk.anim === 'breath' || sk.aoe ? 'spray' : 'bolt');

export const sfx = {
  // ---- the interface
  ui: () => { const b = S.sparkle; if (b) S.bell(b, T0(), 3520 * rnd(0.98, 1.02), 0.022, 0, 0.16); },
  deny: () => S.tone(T0(), 0.14, { type: 'square', f0: 160, f1: 110, gain: 0.05 }),
  coin: () => { const t = T0(); for (const [f, d] of [[2400, 0], [3150, 0.055], [2800, 0.11]]) S.tone(t + d, 0.16, { type: 'triangle', f0: f * rnd(0.98, 1.02), gain: 0.045 }); },
  chime: () => { const b = S.sparkle; if (b) S.tinkle(b, T0(), 1 + Math.floor(Math.random() * 3), 0, 0.5); },

  // ---- walking: surface 'dirt' or 'stone'; chain: in mail or plate
  step: (surface = 'dirt', chain = false, run = false, vol = 0.5) => {
    if (!S.play(`${surface}_${chain ? 'chain_' : ''}${run ? 'run' : 'walk'}`, { vol, vary: 0.04 })) S.noise(T0(), 0.06, { f0: surface === 'stone' ? 800 : 500, f1: 150, gain: 0.03 });
  },
  jump: (surface = 'dirt', chain = false) => {
    if (!S.play(`${surface}_${chain ? 'chain_' : ''}jump`, { vol: 0.8 })) S.tone(T0(), 0.14, { type: 'triangle', f0: 260, f1: 520, gain: 0.05 });
  },
  land: (surface = 'dirt', chain = false) => { S.play(`${surface}_${chain ? 'chain_' : ''}land`, { vol: 0.75 }); },
  // a footstep in a fight, where it is
  tread: (surface, chain, at) => { S.play(`${surface}_${chain ? 'chain_' : ''}walk`, { vol: 0.55, at, vary: 0.04 }); },

  // ---- the dead see you: a groan, a sting, and blades drawn (and, near the Hollow, its folk scream)
  alert: (nearTown = false) => {
    const t = T0();
    S.tone(t, 0.6, { type: 'sawtooth', f0: 120, f1: 70, gain: 0.09 });
    S.tone(t + 0.1, 0.18, { type: 'square', f0: 880, f1: 1320, gain: 0.05 });
    S.play('sword_unsheath', { vol: 0.8, delay: 0.35 });
    if (nearTown) S.play('crowd_panic', { vol: 0.35, delay: 0.5 });
  },
  growl,
  unsheath: () => S.play('sword_unsheath', { vol: 0.8 }),
  sheath: () => S.play('sword_sheath', { vol: 0.75 }),

  // ---- a fight
  swing,
  hit: impact,
  /** A spell let go. sk: the skill (its el and anim); kind: the weapon, for a plain magic attack. */
  cast: (sk = {}, at = null, kind = null) => {
    if (!sk.el) {   // a plain blow of magic from a staff, a wand, a lute, a skeleton's bony hand
      if (kind === 'lute') { const t = T0(), pan = S.panAt(at); [196, 247, 294, 392].forEach((f, i) => S.tone(t + i * 0.035, 0.7, { type: 'triangle', f0: f, gain: 0.05, pan })); return; }
      if (S.play('spell_impact', { at, vol: 0.5, rate: 0.7 })) return;
    }
    const c = CAST[sk.el]?.[howGoes(sk)];
    if (c && S.play(c[0], { at, vol: c[1], rate: c[2] || 1 })) { if (sk.el === 'holy') S.tinkle(S.sparkle, T0() + 0.1, 2, S.panAt(at), 0.6); return; }
    const t = T0(), pan = S.panAt(at);
    S.tone(t, 0.3, { f0: 420, f1: 1100, gain: 0.08, pan });
    S.noise(t, 0.3, { type: 'bandpass', f0: 800, f1: 2400, q: 2, gain: 0.1, attack: 0.03, pan });
  },
  /** A spell landing (big: from the sky, or its round is wide). */
  burst: (sk = {}, at = null, crit = false) => {
    const big = sk.anim === 'meteor' || sk.aoe >= 2, v = crit ? 1.2 : 1, p = { at };
    if (big && (sk.el === 'fire' || sk.el === 'arcane' || sk.el === 'shadow')) S.play('rock_meteor_swarm', { ...p, vol: 0.9 * v, rate: sk.el === 'shadow' ? 0.8 : 1 });
    if (sk.el === 'cold') S.play('ice_freeze', { ...p, vol: 0.9 * v });
    else if (sk.el === 'storm') { crackle(at, v); if (sk.aoe) S.play('rock_wall', { ...p, vol: 0.7 * v }); }
    else if (sk.el === 'poison' || sk.el === 'acid') { S.play('waterspray', { ...p, vol: 0.7 * v, rate: 0.65 }); S.play('spell_impact', { ...p, vol: 0.5, rate: 0.8 }); }
    else if (sk.el === 'holy' || sk.el === 'light') { S.play('spell_impact', { ...p, vol: 0.8 * v, rate: 1.25 }); S.tinkle(S.sparkle, T0() + 0.05, 4, S.panAt(at), 0.7); }
    else if (!S.play('spell_impact', { ...p, vol: (big ? 1 : 0.8) * v, rate: sk.el === 'shadow' ? 0.75 : big ? 0.9 : 1.05 })) {
      const t = T0(); S.noise(t, 0.35, { f0: 1800, f1: 120, gain: 0.16 * v, pan: S.panAt(at) });
    }
  },
  heal: (at = null) => { const b = S.sparkle; if (b) { const t = T0(); S.tinkle(b, t, 1, S.panAt(at), 0.7); S.tinkle(b, t + 0.14, 3, S.panAt(at), 0.5); } S.play('light_torch', { at, vol: 0.35, rate: 1.3 }); },
  buff: (at = null) => { S.play('firebuff', { at, vol: 0.55, rate: 1.25 }); const b = S.sparkle; if (b) S.tinkle(b, T0() + 0.1, 2, S.panAt(at), 0.6); },
  debuff: (at = null) => { if (!S.play('rock_meteor_throw', { at, vol: 0.6, rate: 1.3 })) S.tone(T0(), 0.4, { type: 'sawtooth', f0: 300, f1: 120, gain: 0.05 }); },
  summon: (at = null) => { S.play('rock_wall', { at, vol: 0.9, rate: 0.9 }); S.play('spell_impact', { at, vol: 0.6, rate: 0.75, delay: 0.15 }); },
  revive: (at = null) => { const b = S.sparkle; if (b) [0, 2, 4, 5].forEach((n, i) => S.tinkle(b, T0() + i * 0.11, n, S.panAt(at), 0.7)); S.play('light_torch', { at, vol: 0.5 }); },
  drink: (at = null) => { S.play('waterspray', { at, vol: 0.28, rate: 1.7 }); sfx.heal(at); },
  /** A bonesack bursting. */
  squelch: (at = null) => { S.play('waterspray', { at, vol: 1, rate: 0.55 }); S.play('chop', { at, vol: 0.6, rate: 0.6, delay: 0.03 }); },
  /** Somebody going down: one of the dead (it falls), one of yours (and, now and then, that scream), a
   * summoned thing (gone). */
  die: (who = 'foe', at = null, chain = false) => {
    if (who === 'summon') { S.play('spell_impact', { at, vol: 0.5, rate: 1.4 }); return; }
    if (who === 'foe') { growl(at, 1.2); if (!S.play('dirt_land', { at, vol: 1, rate: 0.7, delay: 0.3 })) S.tone(T0(), 0.5, { type: 'sawtooth', f0: 200, f1: 40, gain: 0.08 }); return; }
    S.play(chain ? 'dirt_chain_land' : 'dirt_land', { at, vol: 1, rate: 0.8, delay: 0.2 });
    if (Math.random() < 0.08) S.play('wilhelm_scream', { at, vol: 0.7 });
    else S.tone(T0(), 0.5, { type: 'sawtooth', f0: 200, f1: 60, gain: 0.05 });
  },

  // ---- the end of a fight (the stingers are music.js's: main.js plays them)
  win: () => S.play('sword_sheath', { vol: 0.75, delay: 1.1 }),
  lose: () => { S.play('dirt_chain_land', { vol: 0.7, rate: 0.7 }); },
  gasp: () => S.play('crowd_gasp', { vol: 0.55 }),

  // ---- about the Hollow
  /** The Last Toll's bells (a night's sleep). */
  bell: () => { if (S.peal()) return; const t = T0(); S.tone(t, 1.6, { f0: 196, gain: 0.1 }); S.tone(t, 1.2, { f0: 392.5, gain: 0.05 }); S.tone(t, 0.8, { f0: 588, gain: 0.03 }); },
  /** A level gained: the glass bells, up the scale. */
  level: () => { const b = S.sparkle; if (!b) return; const t = T0(); [0, 1, 3, 4, 5].forEach((n, i) => S.tinkle(b, t + i * 0.09, n, (i - 2) * 0.2, 0.8)); },
  chest: () => { S.play('lock_unlock', { vol: 1 }); if (!S.play('chest_open', { vol: 1, delay: 0.4 })) sfx.coin(); },
  chestShut: () => S.play('chest_close', { vol: 0.8 }),
  door: (open = true) => S.play(open ? 'door_open' : 'door_close', { vol: 0.7 }),
  /** The smith's hammer (enhancing), the lapidary's (a gem set or prised out). */
  forge: (light = false) => {
    if (!S.play('mine', { vol: light ? 0.6 : 0.9, rate: light ? 1.35 : 1 })) { sfx.coin(); return; }
    S.play('mine', { vol: light ? 0.45 : 0.75, rate: light ? 1.45 : 1.05, delay: 0.32 });
    if (light) { const b = S.sparkle; if (b) S.tinkle(b, T0() + 0.5, 3, 0, 0.5); }
  },
  enchant: () => { S.play('firebuff', { vol: 0.7, rate: 0.9 }); const b = S.sparkle; if (b) S.tinkle(b, T0() + 0.25, 2, 0, 0.7); },
  /** Something put on: a blade drawn, mail shrugged into, leather buckled. */
  equip: (it) => {
    if (!it) return sfx.ui();
    if (it.kind in WEAPON_KINDS) return S.play('sword_unsheath', { vol: 0.6 }) || sfx.ui();
    if (it.kind === 'plate' || it.kind === 'helm') return S.play('stone_chain_land', { vol: 0.5, rate: 1.2 }) || sfx.ui();
    if (it.kind === 'leather' || it.kind === 'cloth') return S.play('sword_sheath', { vol: 0.35, rate: 1.3 }) || sfx.ui();
    return sfx.coin();
  },
  /** A stone dropped down the well, a long way. */
  well: () => S.play('water_land', { vol: 0.45, rate: 0.8, delay: 1.1 }),
};
