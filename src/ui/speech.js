// Speech bubbles, brought over from bm (its src/ui/speech.js): words over the head of whoever says them, paper and ink,
// with a tail to the speaker, placed each frame by the camera the frame was drawn with. Over the head when there's room;
// beside the face when there isn't; and with no tail, low in the middle with the speaker's name on it, when they're out
// of sight or nobody in the world is saying it (the story's own voice). Never under the bars, never off the screen, and
// never over another bubble: each keeps clear of those placed before it and of the chat log.
//
// bm had one bubble, for one woman. Here anybody may speak, so `Bubbles` keeps a set of them: say() puts one up for a
// while (banter, barks), hold() puts one up until it's let go (a conversation's line).
import { clamp, el, esc } from '../core/util.js';

const EDGE = 10;                        // px kept clear of the screen's edges and the bars
const TAIL = 16;                        // px from the bubble to the tip of its tail, at most
const ABOVE = 0.1;                      // world units over the top of the head, where a bubble over it points
const FACE = 0.3;                       // world units: half a head's width, where a bubble beside it points
const NARROWEST = 150;                  // px: as narrow as a bubble beside a face is made to fit
const lerpTo = (a, b, k) => a + (b - a) * k;

export class SpeechBubble {
  constructor(parent) {
    this.el = el('div', 'sp-bubble', '<div class="sp-bub"><b></b><p></p><i class="sp-more"></i></div>');   // (the box inside, so it can pop without moving the bubble)
    this.who = this.el.querySelector('b'); this.text = this.el.querySelector('p');
    this.tail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.tail.setAttribute('class', 'sp-tail');
    this.tail.innerHTML = '<polygon/><polyline/>';
    this.fill = this.tail.firstChild; this.ink = this.tail.lastChild;
    parent.append(this.el, this.tail);   // (the tail over the bubble's edge, so no border shows across its root)
    this.shown = false; this.key = null; this.w = 0; this.h = 0; this.box = null;
    this.hide();
  }

  // What's said: id (the line, so a new one pops in), html, who (named over the words when there's no tail to say whose
  // they are), and its manner: big (shouted), soft (under the breath), inside (nobody's mouth: the story's voice, no
  // tail ever), more (a mark that there is more to come: a tap goes on).
  set(id, html, who, style = {}) {
    const key = `${id}|${who}|${html}`;
    if (key === this.key) return;
    const fresh = id !== this.id;
    this.key = key; this.id = id;
    this.who.textContent = who || '';
    this.text.innerHTML = html;
    this.inside = !!style.inside;
    const cls = { big: !!style.big, soft: !!style.soft, inside: this.inside, more: !!style.more, foe: !!style.foe };
    for (const [k, on] of Object.entries(cls)) this.el.classList.toggle(k, on);
    this.tail.classList.toggle('soft', cls.soft); this.tail.classList.toggle('foe', cls.foe);
    if (fresh) { this.el.classList.remove('pop'); void this.el.offsetWidth; this.el.classList.add('pop'); }
    this.named = null;
    this.measure();
  }
  measure() {
    this.el.style.display = ''; this.el.style.width = '';
    this.w = this.el.offsetWidth; this.h = this.el.offsetHeight;
    this.heights = new Map();
  }
  hide() {
    this.shown = false; this.key = null; this.id = null; this.box = null;
    this.el.style.display = 'none'; this.tail.style.display = 'none';
  }
  remove() { this.el.remove(); this.tail.remove(); }

  // Each frame, after it's drawn. spot: [x, y, ppu] where the top of the speaker's head is on the screen and how many
  // pixels a world unit is there, or null if they aren't in the shot. bars: px taken at the top and the bottom.
  // avoid: boxes on the screen to keep clear of, if there's a way to.
  place(spot, bars = [0, 0], avoid = []) {
    if (!this.key) return;
    const W = innerWidth, H = innerHeight;
    const top = bars[0] + EDGE, bottom = H - bars[1] - EDGE;
    if (this.inside) spot = null;
    if (spot && (spot[0] < -40 || spot[0] > W + 40 || spot[1] < -40 || spot[1] > H + 60)) spot = null;
    const named = !spot;
    if (named !== this.named) { this.named = named; this.el.classList.toggle('named', named && !!this.who.textContent); this.measure(); }
    const w = this.w, h = this.h;
    this.el.style.display = ''; this.shown = true;
    const inX = (x, cw = w) => clamp(x, EDGE, Math.max(EDGE, W - EDGE - cw)), inY = (y, ch = h) => clamp(y, top, Math.max(top, bottom - ch));
    const clear = (c) => !avoid.some((o) => c.x < o.right + 6 && o.left - 6 < c.x + c.w && c.y < o.bottom + 6 && o.top - 6 < c.y + c.h);
    const alongX = (x, cw = w) => [x, ...avoid.flatMap((o) => [inX(o.right + 8, cw), inX(o.left - 8 - cw, cw)])];
    const alongY = (y, ch = h) => [y, ...avoid.flatMap((o) => [inY(o.bottom + 8, ch), inY(o.top - 8 - ch, ch)])];
    const ways = [];
    if (!spot) {
      // low in the middle, where a caption would be
      // (and over whatever is in the way there, rather than under it: the foot of the screen is the thumbs')
      const y0 = inY(H * 0.7 - h), x0 = inX(W / 2 - w / 2);
      for (const y of [y0, ...avoid.map((o) => inY(o.top - 8 - h)), ...avoid.map((o) => inY(o.bottom + 8))]) ways.push({ x: x0, y, w, h, tail: null });
    } else {
      const [sx, sy, ppu] = spot;
      const crown = sy - ABOVE * ppu, face = FACE * ppu, mouth = sy + 0.28 * ppu;
      // over the head, if it fits under the top bar (and not so far along that its tail can't reach)
      const y = crown - TAIL - h;
      if (y >= top && crown <= bottom) {
        for (const x of alongX(inX(sx - w / 2))) {
          if (Math.abs(x + w / 2 - sx) > w / 2 + 40) continue;
          const bx = clamp(sx, x + 14, x + w - 14);
          ways.push({ x, y, w, h, tail: { base: [[bx - 7, y + h - 2], [bx + 7, y + h - 2]], tip: [lerpTo(bx, sx, 0.7), Math.max(y + h + 4, crown - 2)] } });
        }
        // or higher, over whatever is in the way (another bubble), on a longer tail
        for (const o of avoid) {
          const yy = o.top - 8 - h;
          if (yy < top || yy > y) continue;
          const x = inX(sx - w / 2), bx = clamp(sx, x + 14, x + w - 14);
          ways.push({ x, y: yy, w, h, tail: { base: [[bx - 7, yy + h - 2], [bx + 7, yy + h - 2]], tip: [lerpTo(bx, sx, 0.5), yy + h + TAIL] } });
        }
      }
      // beside the face, level with the mouth: the roomier side first, narrowed to the room there if it must be
      const roomL = sx - face - TAIL - EDGE, roomR = W - EDGE - (sx + face + TAIL);
      for (const left of roomL > roomR ? [true, false] : [false, true]) {
        const room = left ? roomL : roomR;
        const cw = room >= w ? w : room >= NARROWEST ? Math.floor(room / 8) * 8 : 0;
        if (!cw) continue;
        const ch = cw === w ? h : this.heightAt(cw);
        const x = left ? sx - face - TAIL - cw : sx + face + TAIL;
        for (const yy of alongY(inY(mouth - ch * 0.6, ch), ch)) {
          if (mouth < yy - 24 || mouth > yy + ch + 24) continue;
          ways.push(this.beside(left, x, yy, sx, mouth, face, cw, ch));
        }
      }
      if (!ways.length) {
        const left = roomL > roomR;
        ways.push(this.beside(left, inX(left ? sx - face - TAIL - w : sx + face + TAIL), inY(mouth - h * 0.6), sx, mouth, face, w, h));
      }
    }
    const c = ways.find(clear) || ways[0];
    const width = c.w === w ? '' : `${c.w}px`;
    if (this.el.style.width !== width) this.el.style.width = width;
    this.box = { left: c.x, top: c.y, right: c.x + c.w, bottom: c.y + c.h };
    this.put(c.x, c.y, c.tail);
  }
  heightAt(cw) {
    let ch = this.heights.get(cw);
    if (ch === undefined) {
      const was = this.el.style.width;
      this.el.style.width = `${cw}px`;
      ch = this.el.offsetHeight;
      this.el.style.width = was;
      this.heights.set(cw, ch);
    }
    return ch;
  }
  beside(left, x, y, sx, sy, face, cw, ch) {
    const edge = left ? x + cw - 2 : x + 2, by = clamp(sy, y + 12, y + ch - 12);
    const tipX = left ? Math.min(sx - face, edge + TAIL) : Math.max(sx + face, edge - TAIL);
    const ok = left ? tipX > edge + 3 : tipX < edge - 3;
    return { x, y, w: cw, h: ch, tail: ok ? { base: [[edge, by - 7], [edge, by + 7]], tip: [tipX, clamp(sy, by - 10, by + 10)] } : null };
  }
  put(x, y, tail) {
    this.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    if (!tail) { this.tail.style.display = 'none'; return; }
    this.tail.style.display = '';
    const [a, b] = tail.base, t = tail.tip, pt = (q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    this.fill.setAttribute('points', `${pt(a)} ${pt(t)} ${pt(b)}`);
    this.ink.setAttribute('points', `${pt(a)} ${pt(t)} ${pt(b)}`);
  }
}

/** Everyone's bubbles. `head(who)` finds where a speaker's head is in the world ({x, y, z}) or null; `project` is the
 * renderer's; `ppu` says how many pixels a world unit is; `avoid` gives the boxes to keep clear of (the chat log). */
export class Bubbles {
  constructor(parent, { project, ppu, bars, avoid }) {
    this.root = el('div', 'sp-layer'); parent.append(this.root);
    this.project = project; this.ppu = ppu; this.bars = bars || (() => [0, 0]); this.avoid = avoid || (() => []);
    this.list = []; this.n = 0; this.on = true;
  }
  // Up for a while, then gone. at: a function giving the head's world position (or null: no tail, named).
  say(at, text, who = '', style = {}) {
    if (!this.on && !style.held) return null;
    // one bubble to a mouth: a new line takes the old one's place
    let b = this.list.find((o) => o.key === (style.key || who) && who && !o.held === !style.held);
    if (!b) {
      if (this.list.filter((o) => !o.held).length >= 4 && !style.held) this.drop(this.list.find((o) => !o.held));
      b = { bub: new SpeechBubble(this.root), key: style.key || who };
      this.list.push(b);
    }
    b.at = at; b.held = !!style.held; b.t = style.secs || Math.min(8, 2.4 + text.length * 0.055); b.fade = 1;
    b.bub.set(++this.n, esc(text), who, style);
    b.bub.el.style.opacity = '';
    b.bub.el.onclick = style.onTap || null;
    b.bub.el.classList.toggle('tap', !!style.onTap);
    return b;
  }
  hold(at, text, who, style = {}) { return this.say(at, text, who, { ...style, held: true }); }
  drop(b) { if (!b) return; b.bub.remove(); this.list = this.list.filter((o) => o !== b); }
  clear(held = false) { for (const b of [...this.list]) if (held || !b.held) this.drop(b); }
  update(dt) {
    const taken = [...this.avoid()], bars = this.bars(), ppu = this.ppu();
    // the held line first (the conversation), then the rest, oldest first: later ones go round earlier ones
    for (const b of [...this.list].sort((x, y) => (y.held ? 1 : 0) - (x.held ? 1 : 0))) {
      if (!b.held) { b.t -= dt; if (b.t <= 0) { this.drop(b); continue; } if (b.t < 0.4) b.bub.el.style.opacity = (b.t / 0.4).toFixed(2); }
      const p = b.at ? b.at() : null;
      let spot = null;
      if (p) { const s = this.project(p.x, p.y, p.z); spot = [s.x, s.y, ppu]; }
      b.bub.place(spot, bars, taken);
      b.bub.tail.style.opacity = b.bub.el.style.opacity;
      if (b.bub.box) taken.push(b.bub.box);
    }
  }
}
