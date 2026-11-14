// Stand-in sound: a few synthesised blips and groans, until there is real audio.
let ctx = null;
let muted = false;
const ac = () => {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
export const setMuted = (m) => { muted = m; };

function tone({ f = 440, f2 = f, dur = 0.15, type = 'sine', vol = 0.12, delay = 0 }) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise({ dur = 0.2, vol = 0.12, lp = 1200, delay = 0 }) {
  const c = ac(); if (!c || muted) return;
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = buf; f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + delay);
}

export const sfx = {
  step: () => noise({ dur: 0.05, vol: 0.025, lp: 500 }),
  jump: () => tone({ f: 260, f2: 520, dur: 0.14, type: 'triangle', vol: 0.07 }),
  ui: () => tone({ f: 660, dur: 0.05, type: 'triangle', vol: 0.05 }),
  deny: () => tone({ f: 160, f2: 110, dur: 0.14, type: 'square', vol: 0.05 }),
  coin: () => { tone({ f: 1200, dur: 0.07, type: 'triangle', vol: 0.06 }); tone({ f: 1600, dur: 0.1, type: 'triangle', vol: 0.06, delay: 0.06 }); },
  // the dead see you: a groan, then a sting
  alert: () => { tone({ f: 120, f2: 70, dur: 0.6, type: 'sawtooth', vol: 0.11 }); tone({ f: 880, f2: 1320, dur: 0.18, type: 'square', vol: 0.07, delay: 0.1 }); },
  hit: () => { noise({ dur: 0.12, vol: 0.16, lp: 1800 }); tone({ f: 180, f2: 70, dur: 0.12, type: 'square', vol: 0.07 }); },
  cast: () => tone({ f: 420, f2: 1100, dur: 0.3, type: 'sine', vol: 0.08 }),
  heal: () => { tone({ f: 520, dur: 0.14, vol: 0.07 }); tone({ f: 780, dur: 0.2, vol: 0.07, delay: 0.1 }); },
  die: () => tone({ f: 200, f2: 40, dur: 0.5, type: 'sawtooth', vol: 0.09 }),
  win: () => [392, 523, 659, 784].forEach((f, i) => tone({ f, dur: 0.22, type: 'triangle', vol: 0.08, delay: i * 0.12 })),
  lose: () => [330, 262, 196].forEach((f, i) => tone({ f, dur: 0.4, type: 'sawtooth', vol: 0.06, delay: i * 0.25 })),
  bell: () => { tone({ f: 196, dur: 1.6, vol: 0.1 }); tone({ f: 392.5, dur: 1.2, vol: 0.05 }); tone({ f: 588, dur: 0.8, vol: 0.03 }); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: 0.16, type: 'triangle', vol: 0.07, delay: i * 0.08 })),
};
