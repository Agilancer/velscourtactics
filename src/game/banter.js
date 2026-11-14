// What the party says to itself: a bubble over a head (ui/speech.js) and a line in the log, when something happens
// worth a word. The lines are data (data/cast.js BANTER); this picks who says which, and keeps them from talking over
// each other. On the road somebody says something every so often; in a fight, only when it's earned.
import { BANTER } from '../data/cast.js';
import { partyHeroes } from './party.js';
import { pick } from '../core/util.js';

// how long before the same kind of thing is remarked on again (seconds)
const GAP = { walk: 30, kill: 14, crit: 20, hurt: 20, low: 25, healed: 25, combo: 18, loot: 40, level: 10, dread: 120, seen: 6, won: 6, shop: 60, call: 5 };

export class Banter {
  constructor(g) { this.g = g; this.cool = 0; this.last = {}; this.walkT = 22; }
  update(dt) {
    const g = this.g;
    this.cool -= dt;
    for (const k in this.last) this.last[k] -= dt;
    if (g.mode !== 'explore' || !g.explore || g.explore.busy) return;
    this.walkT -= dt;
    if (this.walkT <= 0) { this.walkT = (g.st.auto ? 26 : 45) + Math.random() * 35; this.say('walk'); }
  }
  // ev: a key of BANTER. o: { who (a hero), not (a hero who won't say it), t, n, chance, force (past the general hush) }
  say(ev, o = {}) {
    const g = this.g, st = g.st;
    if (!st || st.opts.quiet || g.mode === 'talk' || g.mode === 'title') return false;
    if (!o.force && this.cool > 0) return false;
    if ((this.last[ev] || 0) > 0 && !o.force) return false;
    if (o.chance != null && Math.random() > o.chance) return false;
    const pool = BANTER[ev];
    if (!pool) return false;
    const able = (g.battle ? g.battle.units.filter((u) => u.hero && u.alive).map((u) => u.hero) : partyHeroes(st).filter((h) => h.hp > 0)).filter((h) => h !== o.not);
    const who = o.who && able.includes(o.who) ? o.who : pick(able.length ? able : [null]);
    if (!who) return false;
    let lines = pool;
    if (!Array.isArray(pool)) {
      const own = [...(pool[who.heroId] || []), ...(pool[who.cls] || [])];
      lines = own.length && Math.random() < 0.55 ? own : pool.any;
    }
    // (not the line this was last time)
    const fresh = lines.filter((l) => l !== this.said?.[ev]);
    const line = pick(fresh.length ? fresh : lines).replace('{t}', o.t ?? '').replace('{n}', o.n ?? '');
    (this.said ||= {})[ev] = line;
    g.ui.speak(who.name, line, { soft: ev === 'low' || ev === 'lost', big: ev === 'down' || ev === 'windup' });
    this.cool = 4.5; this.last[ev] = GAP[ev] ?? 15;
    return true;
  }
}
