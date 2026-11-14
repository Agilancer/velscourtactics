// The world's own sound under the music (assets/audio/amb, Bellmourn's nature pack and its fires).
//
// Beds, everywhere about you, mixed by where you are: in the Hollow a calm wind and its birds; in the
// pines the wind in the trees and fewer birds; far out where the pines go black the wind and the
// night's insects, and no birds at all. A fight hushes them a little.
//
// And sounds from a place, heard from where they are (louder near, to the side they're on on screen):
// the Proud Anvil's forge, the Last Toll's hearth, Moss Cottage's chimney, the lantern by the bounty
// board.
//
// Every loop is played as two overlapping copies crossfaded at the seam (equal power), each booked a
// whole loop ahead on the audio clock, so none clicks or gaps even when the game is busy.
import { sound } from './audio.js';

const DIR = 'assets/audio/amb/';
const XF = 2.5;   // the crossfade at a loop's seam (s)
const IN = new Float32Array(64).map((_, i) => Math.sin((i / 63) * Math.PI / 2));
const OUT = new Float32Array(64).map((_, i) => Math.cos((i / 63) * Math.PI / 2));
// each place's beds: [loop, level]
const BEDS = {
  hollow: [['wind_calm', 0.4], ['birds', 0.55], ['wind_forest', 0.12]],
  pines: [['wind_forest', 0.7], ['birds', 0.42], ['wind_calm', 0.12]],
  deep: [['wind_forest', 0.8], ['night', 0.7], ['wind_calm', 0.2]],
};
// the fires about the Hollow: [loop, level, how far it's heard (tiles)], by building (or 'board')
const FIRES = { forge: ['fire_big', 0.85, 13], inn: ['fire_medium', 0.8, 10], cottage: ['fire_small', 0.7, 8], board: ['torch', 0.55, 7] };

class Ambience {
  constructor() {
    this.bufs = {};          // name -> AudioBuffer (or a promise of one)
    this.loops = new Map();  // key -> a running loop
    this.level = 0;
  }

  get ctx() { return sound.ctx; }

  buf(name) {
    const b = this.bufs[name];
    if (b && !b.then) return b;
    if (!b) this.bufs[name] = sound.decode(DIR + name + '.mp3').then((x) => { this.bufs[name] = x || null; return x; });
    return null;
  }

  /** A loop (key: which one, of name's sound) brought toward `level` (0..1), heard from `at` {x, z}
   * if given (and `far` tiles off at most). */
  want(key, name, level, at = null, far = 10, ear = null) {
    let L = this.loops.get(key);
    if (level < 0.003 && !L) return;
    const c = this.ctx, now = c.currentTime;
    if (!L) {
      const b = this.buf(name);
      if (!b) return;
      const g = c.createGain(); g.gain.value = 0;
      const pan = at && c.createStereoPanner ? c.createStereoPanner() : null;
      if (pan) { g.connect(pan); pan.connect(sound.amb); } else g.connect(sound.amb);
      L = { key, name, b, g, pan, voices: [], next: now + 0.05, level: 0, quietT: 0, first: true };
      this.loops.set(key, L);
    }
    let k = level;
    if (at && ear) {
      const d = Math.hypot(at.x - ear.x, at.z - ear.z);
      k *= Math.max(0, 1 - d / far) ** 1.6;
      if (L.pan) L.pan.pan.setTargetAtTime(sound.panAt(at), now, 0.15);
    }
    L.target = k;
  }

  /** Each loop's copies booked a whole loop ahead; its level eased; a silent one let go. */
  run(dt) {
    const c = this.ctx, now = c.currentTime;
    for (const [key, L] of this.loops) {
      const t = L.target ?? 0;
      L.target = 0;   // (wanted again next frame, or it fades)
      L.g.gain.setTargetAtTime(t, now, t > L.level ? 0.6 : 0.9);
      L.level += (t - L.level) * Math.min(1, dt * 1.5);
      L.quietT = t < 0.003 ? L.quietT + dt : 0;
      if (L.quietT > 6) {
        for (const v of L.voices) { try { v.stop(); } catch { /* done */ } }
        L.g.disconnect(); L.pan?.disconnect();
        this.loops.delete(key);
        continue;
      }
      const D = L.b.duration, x = Math.min(XF, D * 0.25);
      while (L.next < now + D) {
        const src = c.createBufferSource(), e = c.createGain();
        src.buffer = L.b;
        src.connect(e); e.connect(L.g);
        const off = L.first ? Math.random() * (D - x * 2) : 0, len = D - off;
        const at = Math.max(L.next, now + 0.02);
        if (!L.first) e.gain.setValueCurveAtTime(IN, at, x);   // (a curve can't share its start with another event)
        e.gain.setValueCurveAtTime(OUT, at + len - x, x);
        src.start(at, off); src.stop(at + len + 0.05);
        src.onended = () => { e.disconnect(); const i = L.voices.indexOf(src); if (i >= 0) L.voices.splice(i, 1); };
        L.voices.push(src);
        L.next = at + len - x;
        L.first = false;
      }
    }
  }

  /** Each frame. s: {on (in the game), set (the music's place), fight, ear {x, z} (where the camera
   * looks), world} */
  update(dt, s) {
    if (!sound.ok || !sound.amb) return;
    const m = s.on ? (s.fight ? 0.55 : 1) : 0;
    if (m !== this.level) { this.level = m; sound.amb.gain.setTargetAtTime(sound.ambVolume * m, this.ctx.currentTime, m ? 1.5 : 0.4); }
    if (s.on) {
      for (const [name, v] of BEDS[s.set] || []) this.want(name, name, v);
      const w = s.world, E = s.ear;
      if (w && E && w.inTown(Math.round(E.x), Math.round(E.z), 14)) {
        for (const b of w.buildings) {
          const f = FIRES[b.id];
          if (f) this.want('fire_' + b.id, f[0], f[1], { x: b.x + b.w / 2, y: 1.5, z: b.z + b.d / 2 }, f[2], E);
        }
        const f = FIRES.board;
        this.want('fire_board', f[0], f[1], { x: w.board.x, y: 1, z: w.board.z }, f[2], E);
      }
    }
    this.run(dt);
  }
}

export const ambience = new Ambience();
