// The chat log, brought over from bm (its src/ui/chatlog.js): low on the left as an MMO's would be, what's said near
// you, what the party says to itself, and what happens in the land. Each line fades on its own; the last few come back
// while the log is held open (a tap on it opens the journal, where the whole account is kept: game/chronicle.js).
import { el, esc } from '../core/util.js';

// The channels, as the log shows them: label and colour.
export const CHANNEL = {
  say: ['', '#efe6d2'],            // somebody in the world, to you
  party: ['Party', '#9cc3ff'],     // one of yours, on the walk or in a fight
  story: ['', '#f4ead3'],          // the story's own voice
  system: ['', '#f1d68a'],         // what happened: found, bought, levelled
  auto: ['Auto', '#86dc95'],       // what auto-play has decided, and why
  dread: ['', '#ff8a6a'],          // the dead, getting bolder
};

export class ChatLog {
  constructor(parent, { onOpen } = {}) {
    this.lines = [];
    this.el = el('div', 'chatlog'); this.el.id = 'chatlog';
    parent.append(this.el);
    this.el.onclick = () => onOpen?.();
    this.shown = '';
  }
  // channel (CHANNEL), who said it (none for the system's), the words. opts.soft: under the breath.
  line(channel, who, text, opts = {}) {
    const [label, colour] = CHANNEL[channel] || CHANNEL.say;
    // (the same thing twice running is said once)
    const last = this.lines[this.lines.length - 1];
    if (last && !last.gone && last.raw === channel + who + text) { last.t = Math.max(last.t, 8); return; }
    const e = el('div', `cl ${channel}${opts.soft ? ' soft' : ''}`);
    e.style.color = colour;
    const tag = label ? `<span class="c">${label}</span> ` : '';
    e.innerHTML = `${tag}${who ? `<span class="n">${esc(who)}:</span> ` : ''}${esc(text)}`;
    this.el.appendChild(e);
    this.lines.push({ el: e, raw: channel + who + text, t: channel === 'system' || channel === 'auto' ? 9 : channel === 'story' ? 16 : 12 });
    const most = innerWidth < 760 || innerHeight < 520 ? 4 : 7;
    while (this.lines.length > most) this.lines.shift().el.remove();
  }
  system(text) { this.line('system', '', text); }
  // where it is on the screen, while there's anything in it to see; else null
  box() {
    if (this.shown !== '' || !this.lines.some((e) => !e.gone)) return null;
    const r = this.el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }
  update(dt, active) {
    const show = active ? '' : 'none';
    if (this.shown !== show) { this.shown = show; this.el.style.display = show; }
    for (const e of this.lines) { e.t -= dt; if (e.t < 0 && !e.gone) { e.gone = true; e.el.style.opacity = 0; } if (e.t < -1.4) e.el.remove(); }
    if (this.lines.length && this.lines[0].t < -1.4) this.lines = this.lines.filter((e) => e.t >= -1.4);
  }
}
