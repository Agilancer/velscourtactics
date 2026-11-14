// The music (assets/audio/music, Bellmourn's, brought over whole).
//
//  - The title: "Frozen Hearts", from the instant the VELSCOUR logo begins to fade in, round and round
//    under the menu and on under the making of who came down the road. It's fetched and decoded
//    before the first card comes up (title.js waits for it) and booked on the audio clock at the
//    logo's moment, so it starts on the very sample however hard the loading holds the main thread.
//  - The opening: "Cursed Citadel", over Lisandra's welcome, fading as the walk begins.
//  - Then the music of wherever you are: the Hollow (the light tracks), the pines (the ambient ones),
//    the deep pines where the brutes are (the dark ones), a track at a time with a quiet between,
//    crossfading when you go somewhere else. A fight brings in the action tracks over it (the place's
//    own track waits, and picks up where it left off when the fight is done).
//  - Stingers (the pack's Fx): someone joins you (found), a fight lost (fell), a fight won or a bounty
//    paid (triumph).
//
// The tracks stream through <audio> players into the music's line (none is decoded whole); only the
// title's song is decoded, for its timing, and let go once the game has begun.
import { sound } from './audio.js';

const DIR = 'assets/audio/music/';
export const TITLE_SONG = DIR + 'title_frozen_hearts.mp3';
export const INTRO_SONG = DIR + 'intro_cursed_citadel.mp3';
const T = (k, n) => Array.from({ length: n }, (_, i) => `${k}_${i + 1}`);
// where each of the pack's tracks plays
export const SETS = {
  hollow: T('light', 5),        // Herrington Hollow
  pines: T('ambient', 10),      // the pines round it
  deep: T('dark', 5),           // far out, where the pines go black
};
const COMBAT = T('action', 5);
export const STINGERS = { found: 'fx_1', fell: 'fx_2', triumph: 'fx_3' };
const STING_LEN = { found: 11, fell: 3.5, triumph: 7 };
const LEVEL = { title: 0.62, intro: 0.85, track: 1, combat: 0.9, stinger: 0.9 };
const GAP = [6, 16];            // the quiet between one track and the next (s)

/** A short silence, to let a player play from inside a click (an iPhone wants each one let). */
function silence() {
  const n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const s = (o, t) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

class Music {
  constructor() {
    this.phase = 'title';   // title | intro | game
    this.slots = [];        // the players: {el, g (its gain), url, use: what it's playing for, ended}
    this.queue = {}; this.last = {};
    this.set = null; this.want = null; this.wantT = 0;
    this.area = null; this.fight = null; this.inFight = false;
    this.gapUntil = 0; this.duckK = 1;
    sound.onStart.push(() => this.unlock());
  }

  get ctx() { return sound.ctx; }
  get now() { return sound.now; }
  get on() { return sound.ok && sound.musicVolume > 0.01; }

  /** The music's own line (ducked under a stinger). */
  get bus() {
    if (!this._bus && sound.music) { this._bus = this.ctx.createGain(); this._bus.connect(sound.music); }
    return this._bus;
  }

  /** A player (made the first time: five in all, the last kept for the stingers). */
  player(i) {
    if (this.slots[i]) return this.slots[i];
    if (!this.bus) return null;
    const el = new Audio();
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    const g = this.ctx.createGain();
    g.gain.value = 0;
    this.ctx.createMediaElementSource(el).connect(g);
    g.connect(i === 4 ? sound.music : this.bus);
    const s = { i, el, g, url: null, use: null, ended: false };
    el.addEventListener('ended', () => { s.ended = true; });
    el.addEventListener('error', () => { if (s.use) console.warn('music: could not play', s.url); s.ended = true; });
    return (this.slots[i] = s);
  }

  /** Inside a click: every idle player let play (an iPhone won't start one later otherwise). */
  unlock() {
    if (!this.ctx || this.ctx.state === 'closed') return;
    this.silent ||= silence();
    for (let i = 0; i < 5; i++) {
      const s = this.player(i);
      if (!s || s.unlocked || s.use) continue;
      if (!s.url) s.el.src = this.silent;
      s.el.play().then(() => { s.unlocked = true; if (!s.use) s.el.pause(); }).catch(() => {});
    }
  }

  /** A free player (not the stingers'). */
  free() {
    for (let i = 0; i < 4; i++) { const s = this.player(i); if (s && !s.use) return s; }
    return this.slots.filter((s) => s.i < 4).sort((a, b) => (a.fadeAt || 0) - (b.fadeAt || 0))[0] || null;
  }

  /** Start `url` on player s, fading up to vol over `fade` s. */
  begin(s, url, use, { loop = false, vol = 1, fade = 2 } = {}) {
    if (!s) return null;
    clearTimeout(s.stopT);
    s.use = use; s.ended = false; s.fadeAt = 0; s.vol = vol;
    s.el.loop = loop;
    if (s.url !== url) { s.el.src = url; s.url = url; }
    try { s.el.currentTime = 0; } catch { /* not seekable yet */ }
    const g = s.g.gain, n = this.now;
    g.cancelScheduledValues(n); g.setValueAtTime(fade > 0 ? 0 : vol, n);
    if (fade > 0) g.linearRampToValueAtTime(vol, n + fade);
    s.el.play()?.catch?.((e) => { console.warn('music:', e?.message || e); });
    return s;
  }

  /** Fade player s out over `secs`; stopped there (or only paused, kept where it was: `park`). */
  fade(s, secs = 2, park = false) {
    if (!s || !s.use) return;
    const g = s.g.gain, n = this.now;
    g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(0, n + secs);
    s.fadeAt = n;
    clearTimeout(s.stopT);
    s.stopT = setTimeout(() => { s.el.pause(); if (!park) { s.use = null; s.ended = false; } }, secs * 1000 + 60);
  }

  // ------------------------------------------------------------------ the title's song
  /** Fetched and decoded (title.js waits on this before the first card). */
  async preloadTitle() {
    if (!this.titleBuf) this.titleBuf = await sound.decode(TITLE_SONG);
    return !!this.titleBuf;
  }

  /** The song booked to start at `when` (the audio clock's), round and round. A booking already made
   * is let go first (the cards skipped: the logo comes up sooner). */
  bookTitle(when) {
    const c = this.ctx;
    if (!c || !this.titleBuf || this.phase !== 'title' || !this.bus) return false;
    const old = this.titleSong;
    if (old) { try { old.src.stop(); } catch { /* not started */ } old.g.disconnect(); }
    const src = c.createBufferSource();
    src.buffer = this.titleBuf; src.loop = true;
    const g = c.createGain();
    g.gain.value = LEVEL.title;
    src.connect(g); g.connect(this.bus);
    src.start(Math.max(when, c.currentTime));
    this.titleSong = { src, g, when };
    return true;
  }

  /** The title's song away (and let go of: the title never comes back). */
  leaveTitle(fade = 2) {
    const S = this.titleSong;
    this.titleSong = null;
    if (S) {
      const n = this.now, g = S.g.gain;
      g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(0, n + fade);
      try { S.src.stop(n + fade + 0.05); } catch { /* never started */ }
      S.src.onended = () => S.g.disconnect();
    }
    this.titleBuf = null;
  }

  // ------------------------------------------------------------------ the opening's song
  /** The opening begins: its song, the title's fading under it. */
  intro() {
    if (this.phase !== 'title') return;
    this.leaveTitle(1.4);
    this.phase = 'intro';
    this.introSlot = this.begin(this.free(), INTRO_SONG, 'intro', { loop: true, vol: LEVEL.intro, fade: 1.2 });
  }

  /** The opening done: its song fades, and the place's music follows it. */
  endIntro(fade = 6) {
    if (this.phase !== 'intro') return;
    this.phase = 'game';
    this.fade(this.introSlot, fade);
    this.introSlot = null;
    this.gapUntil = this.now + fade * 0.7;
  }

  /** The game begun from the title (continued): the place's music after the song fades. */
  play() {
    if (this.phase === 'game') return;
    if (this.phase === 'intro') { this.endIntro(2.5); return; }
    this.leaveTitle(2.5);
    this.phase = 'game';
    this.gapUntil = this.now + 2;
  }

  // ------------------------------------------------------------------ the place's music, and a fight's
  /** Each frame in the game. o: {set (SETS's), fight (a fight on, or the dead have just seen you)} */
  update(dt, o) {
    if (!this.ctx || this.phase !== 'game' || !this.bus) return;
    const n = this.now;
    // the place: a change holds a few seconds before the music follows it (a step out and back is nothing)
    if (o.set !== this.want) { this.want = o.set; this.wantT = 0; }
    this.wantT += dt;
    if (this.want && this.want !== this.set && (this.wantT > 3.5 || !this.set)) {
      const was = this.set;
      this.set = this.want;
      if (this.area && !this.inFight) { this.fade(this.area, 3); this.area = null; this.gapUntil = n + (was ? 2.2 : 0); }
      else if (this.area) { this.fade(this.area, 0.5); this.area = null; }   // (parked under the fight: let go)
    }
    if (o.fight && !this.inFight && this.on) this.startFight();
    else if (!o.fight && this.inFight) this.endFight();
    if (this.inFight) {
      if (this.fight?.ended) this.fight = this.begin(this.fight, DIR + this.pick('combat', COMBAT) + '.mp3', 'fight', { vol: LEVEL.combat, fade: 0.3 });
      return;
    }
    // a track done: the quiet, then the next
    if (this.area?.ended) { this.area.use = null; this.area = null; this.gapUntil = n + GAP[0] + Math.random() * (GAP[1] - GAP[0]); }
    if (!this.area && this.set && n > this.gapUntil && this.on) {
      this.area = this.begin(this.free(), DIR + this.pick(this.set, SETS[this.set]) + '.mp3', 'area', { vol: LEVEL.track, fade: 3 });
    }
  }

  /** The next of a set's tracks: all of them in turn, shuffled, never the same twice running. */
  pick(set, list) {
    let q = this.queue[set];
    if (!q?.length) {
      q = this.queue[set] = shuffle([...list]);
      if (q.length > 1 && q[0] === this.last[set]) q.push(q.shift());
    }
    return (this.last[set] = q.shift());
  }

  startFight() {
    this.inFight = true;
    if (this.area) this.fade(this.area, 1.2, true);   // (parked: it picks up where it was)
    this.fight = this.begin(this.free(), DIR + this.pick('combat', COMBAT) + '.mp3', 'fight', { vol: LEVEL.combat, fade: 0.6 });
  }

  endFight() {
    this.inFight = false;
    this.fade(this.fight, 2.5);
    this.fight = null;
    const a = this.area;
    if (a && a.use === 'area' && !a.ended) {   // the place's own track, back where it was
      clearTimeout(a.stopT);
      setTimeout(() => {
        if (this.area !== a || this.inFight) return;
        const g = a.g.gain, n = this.now;
        g.cancelScheduledValues(n); g.setValueAtTime(0, n); g.linearRampToValueAtTime(a.vol, n + 3.5);
        a.el.play()?.catch?.(() => {});
      }, 2500);
    } else { this.area = null; this.gapUntil = this.now + 5; }
  }

  /** A stinger over the music (which drops under it): found, fell or triumph. */
  stinger(kind) {
    const f = STINGERS[kind], s = this.player(4);
    if (!f || !s || !this.on) return false;
    // (the same one again while it still plays, a bounty paid on the heels of a fight won: let it be)
    if (this.sting?.kind === kind && this.now - this.sting.t < STING_LEN[kind] * 0.7) return true;
    this.sting = { kind, t: this.now };
    this.begin(s, DIR + f + '.mp3', 'stinger', { vol: LEVEL.stinger, fade: 0.05 });
    const bus = this.bus.gain, n = this.now, dur = STING_LEN[kind];
    this.duckK = 0.3;
    bus.cancelScheduledValues(n); bus.setTargetAtTime(this.duckK, n, 0.2);
    clearTimeout(this.duckT);
    this.duckT = setTimeout(() => { this.duckK = 1; this.bus.gain.setTargetAtTime(1, this.now, 1.2); }, dur * 1000);
    clearTimeout(s.stopT);
    s.stopT = setTimeout(() => { s.use = null; }, (dur + 4) * 1000);
    return true;
  }
}

export const music = new Music();
