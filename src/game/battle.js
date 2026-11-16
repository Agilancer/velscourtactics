// The fight. It happens where everyone is standing: the walk stops, the party is placed round the
// leader, and then it is turns, Final Fantasy Tactics style. Speed fills each unit's clock; a turn is
// a move and an act in either order; height, facing and reach all matter.
//
// What a turn does is decided here; how it looks (the circles, the cut-ins, the numbers) is show.js.
// Beyond the plain blows and spells a skill may: push or pull (`push`, `pull`: tiles; into a wall or a body
// hurts), chain from one body to the next (`chain`), run in a straight line or fan out in a cone (`shape`),
// leave a trap on a tile (kind 'trap'), step through the air to where it is aimed (`blink`), land behind its
// target (`dash: 'behind'`), finish the badly hurt (`execute`), put someone's turn back (`delay`) or bring an
// ally's forward (kind 'tempo'), clear what ails them (kind 'cleanse'), stand the fallen up (kind 'revive'),
// or cost life as well as mana (`hpCost`). A status may be a ward that soaks harm, a doom that falls when it
// runs out, a riposte, a taunt, or the wyrm.
import { el, esc, manhattan, clamp } from '../core/util.js';
import { CLASSES, STATUS, SUMMONS, comboFor } from '../data/classes.js';
import { CONSUMABLES, rollLoot, itemName, RARITY } from '../data/items.js';
import { zombieStats, ZOMBIES } from '../data/enemies.js';
import { HEROES } from '../data/cast.js';
import { heroStats, heroSkills, basicAttack, gainXp, noteKill, partyHeroes, addToBag } from './party.js';
import { plan as tacPlan, intent, threat } from './tactics.js';
import * as enc from './encounter.js';
import { note } from './chronicle.js';
import { heroModel, ground, clinks } from './explore.js';
import { withOverride, sleep, shadowDisc, setAnim, setRest, animate, canPlay, blowTimes } from '../gfx/models.js';
import { palOf } from '../gfx/fx.js';
import { setSide } from '../gfx/outline.js';
import { DPAD } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { music } from '../core/music.js';
import { Show } from './show.js';
import { CombatLog } from '../ui/combatlog.js';

const K = (x, z) => x + ',' + z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ITEM_SKILLS = {
  potion: { id: 'item_potion', item: 'potion', name: CONSUMABLES.potion.name, cost: 0, r: [0, 1], aoe: 0, at: 'ally', kind: 'item' },
  ether: { id: 'item_ether', item: 'ether', name: CONSUMABLES.ether.name, cost: 0, r: [0, 1], aoe: 0, at: 'ally', kind: 'item' },
  tonic: { id: 'item_tonic', item: 'tonic', name: CONSUMABLES.tonic.name, cost: 0, r: [1, 1], aoe: 0, at: 'fallen', kind: 'item' },
};
const tally = () => ({ dealt: 0, taken: 0, healed: 0, kills: 0, low: 1 });
const lifeCost = (u, sk) => (sk.hpCost ? Math.max(1, Math.round(u.maxhp * sk.hpCost)) : 0);

export class Battle {
  constructor(g, foes, alerted, opts = {}) {
    this.opts = opts; this.hazards = []; this.call = { cd: 0, left: 0, mode: null, focus: null };
    this.g = g; this.st = g.st; this.w = g.world; this.r = g.r;
    this.units = []; this.over = false; this.lock = false; this.xp = 0; this.slain = [];
    this.sel = { mode: 'place' }; this.active = null; this.cursor = null; this.hover = null;
    this.camAt = null;            // where a big skill wants the camera (show.js sets it)
    this.traps = [];              // { owner, side, x, z, sk }
    this.batch = false;           // a multi-hit skill is landing: its blows are summed in the log, not listed
    const L = g.explore.leader;
    this.origin = { x: L.x, z: L.z };
    // the field: a square round the leader, stretched to take in every foe
    let x0 = L.x - 8, x1 = L.x + 8, z0 = L.z - 8, z1 = L.z + 8;
    for (const f of foes) { x0 = Math.min(x0, f.x - 2); x1 = Math.max(x1, f.x + 2); z0 = Math.min(z0, f.zz - 2); z1 = Math.max(z1, f.zz + 2); }
    this.b = { x0: Math.max(0, x0), x1: Math.min(this.w.N - 1, x1), z0: Math.max(0, z0), z1: Math.min(this.w.N - 1, z1) };
    this.tiles = [];
    for (let z = this.b.z0; z <= this.b.z1; z++) for (let x = this.b.x0; x <= this.b.x1; x++) this.tiles.push({ x, z });

    for (const a of g.explore.actors) a.model.visible = false;
    for (const f of foes) this.addFoe(f);
    // where the party may be placed: a few steps round the leader (this.spots, and for each of them see setOut)
    this.setOut(partyHeroes(this.st).map((h) => this.addHero(h, L.x, L.z)), L);
    for (const u of this.units) if (u.side === 'party') this.faceTo(u, alerted.x, alerted.zz);

    enc.setup(this);
    this.threat = threat(this.units.filter((u) => u.hero).map((u) => u.s), this.units.filter((u) => u.side === 'foe').map((u) => u.s));
    this.buildHud();
    enc.begin(this);
    this.cursor = { x: L.x, z: L.z };
    if (this.st.auto || this.goal.kind === 'ambush') this.begin(); else this.showPlacement();
  }

  // ---- units ----
  addHero(h, x, z) {
    const s = heroStats(h), C = CLASSES[h.cls], rage = C.resource === 'rage';
    const model = heroModel(h); model.add(shadowDisc()); this.r.units.add(model);
    const u = { id: h.id, side: 'party', hero: h, name: h.name, lvl: h.lvl, x, z, s, hp: Math.max(1, Math.min(h.hp, s.hp)), mp: rage ? 0 : Math.min(h.mp, s.mp), maxhp: s.hp, maxmp: s.mp,
      skills: heroSkills(h), basic: basicAttack(h), ct: Math.random() * 30, st: [], tally: tally(), model, alive: true, ai: false, rage, color: C.color, face: [0, -1] };
    this.place(u); this.units.push(u); return u;
  }
  addFoe(f) {
    const s = zombieStats(f.kind, f.level);
    const u = { id: f.id, side: 'foe', foe: f, zdef: f.z, name: f.z.name, lvl: f.level, x: f.x, z: f.zz, s, hp: s.hp, mp: 0, maxhp: s.hp, maxmp: 0,
      skills: f.z.skills, basic: null, rival: !!f.rival, ct: f.z.ambush ? 100 : Math.random() * 25, st: [], tally: tally(), model: f.model, alive: true, ai: true, undead: !f.z.living, color: '#9aa88a', face: [0, 1] };
    this.place(u); this.units.push(u); return u;
  }
  addSummon(caster, kind, x, z) {
    const d = SUMMONS[kind];
    for (const o of this.units) if (o.alive && o.owner === caster.id && o.kind === kind) this.kill(o, null, true);   // one of each at a time
    const pow = Math.max(caster.s.atk, caster.s.mag);
    const s = { hp: Math.round(caster.maxhp * d.hp), mp: 0, atk: Math.round(pow * d.atk), mag: Math.round(pow * d.atk), def: Math.round(caster.s.def * 0.7), res: Math.round(caster.s.res * 0.7), spd: caster.s.spd, move: d.move, jump: d.jump, crit: 3, leech: 0 };
    const model = setSide(withOverride(d.model), caster.side); model.add(shadowDisc(0.3)); this.r.units.add(model);
    const basic = { id: 'attack', name: d.kind === 'heal' ? 'Mend' : 'Attack', cost: 0, r: d.r, aoe: 0, at: d.kind === 'heal' ? 'ally' : 'enemy', kind: d.kind, pow: 1, basic: true, el: d.el, chain: d.chain };
    const u = { id: caster.id + '_' + kind, side: caster.side, owner: caster.id, kind, summon: true, name: d.name, lvl: caster.lvl, x, z, s, hp: s.hp, mp: 0, maxhp: s.hp, maxmp: 0,
      skills: [], basic, ct: 40, st: [], tally: tally(), model, alive: true, ai: true, undead: kind === 'skeleton' || kind === 'ghoul', color: caster.color, face: caster.face };
    this.place(u); this.units.push(u); this.addBar(u); return u;
  }
  // for the sounds: what a unit strikes with (its weapon, or the dead's own claws, teeth and chains),
  // and whether it clinks as it moves (mail or plate on, or chains)
  weaponOf(u, sk) {
    if (u.hero) return u.hero.equip.weapon?.kind || 'sword';
    if (u.summon) return { wolf: 'bite', ghoul: 'bite', squire: 'sword', turret: 'pistol' }[u.kind] || 'claw';
    return { chain_sweep: 'chain', slam: 'slam', bite: 'bite' }[sk.id] || 'claw';
  }
  clinks(u) { return u.hero ? clinks(u.hero) : u.zdef?.id === 'brute'; }
  place(u) { u.model.visible = true; u.model.position.set(u.x, this.w.y(u.x, u.z), u.z); }
  faceTo(u, x, z) { const dx = x - u.x, dz = z - u.z; if (!dx && !dz) return; u.face = Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)]; u.model.rotation.y = Math.atan2(dx, dz); }
  unitAt(x, z) { return this.units.find((u) => u.alive && u.x === x && u.z === z); }
  trapAt(x, z) { return this.traps.find((p) => p.x === x && p.z === z); }
  inBounds(x, z) { return x >= this.b.x0 && x <= this.b.x1 && z >= this.b.z0 && z <= this.b.z1; }
  open(x, z) { return this.inBounds(x, z) && this.w.walkable(x, z) && !this.g.explore.npcAt.has(z * this.w.N + x); }
  has(u, id) { return u.st.some((s) => s.id === id); }
  foesOf(u) { return this.units.filter((o) => o.alive && o.side !== u.side); }
  friendsOf(u) { return this.units.filter((o) => o.alive && o.side === u.side); }
  unmoved(u) { return !!(u.zdef?.boss || u.zdef?.lord); }
  // a skill aimed at friends rather than foes
  good(sk) { return ['heal', 'buff', 'cleanse', 'revive', 'tempo'].includes(sk.kind) || (sk.kind === 'item' && sk.at !== 'fallen'); }
  // the log's way of naming someone
  nm(u) { return `<b class="${u.side}" style="color:${u.color}">${esc(u.name)}</b>`; }

  // tiles within n steps of a point, ignoring units (for placement)
  flood(x, z, n) {
    const seen = new Map([[K(x, z), { x, z, d: 0 }]]), q = [{ x, z, d: 0 }];
    for (let i = 0; i < q.length; i++) {
      const c = q[i]; if (c.d >= n) continue;
      for (const [dx, dz] of DIRS) {
        const X = c.x + dx, Z = c.z + dz;
        if (seen.has(K(X, Z)) || !this.open(X, Z) || Math.abs(this.w.height(X, Z) - this.w.height(c.x, c.z)) > 2) continue;
        const t = { x: X, z: Z, d: c.d + 1 }; seen.set(K(X, Z), t); q.push(t);
      }
    }
    return q;
  }
  moveRange(u) { return this.has(u, 'root') ? 0 : this.has(u, 'slow') ? Math.ceil(u.s.move / 2) : u.s.move; }
  // where a unit can walk this turn: Map of key -> {x, z, d, prev}
  reach(u) {
    const start = { x: u.x, z: u.z, d: 0, prev: null }, seen = new Map([[K(u.x, u.z), start]]), q = [start], n = this.moveRange(u);
    for (let i = 0; i < q.length; i++) {
      const c = q[i]; if (c.d >= n) continue;
      for (const [dx, dz] of DIRS) {
        const X = c.x + dx, Z = c.z + dz;
        if (seen.has(K(X, Z)) || !this.open(X, Z)) continue;
        const dh = this.w.height(X, Z) - this.w.height(c.x, c.z);
        if (dh > u.s.jump || dh < -u.s.jump - 2) continue;
        const o = this.unitAt(X, Z);
        if (o && o.side !== u.side) continue;
        const t = { x: X, z: Z, d: c.d + 1, prev: c, taken: !!o }; seen.set(K(X, Z), t); q.push(t);
      }
    }
    for (const [k, t] of seen) if (t.taken) seen.set(k, { ...t, pass: true });
    return seen;
  }
  rangeTiles(sk, x, z) {
    const out = [], straight = sk.shape === 'line' || sk.shape === 'cone';
    for (let dz = -sk.r[1]; dz <= sk.r[1]; dz++) for (let dx = -sk.r[1]; dx <= sk.r[1]; dx++) {
      const d = Math.abs(dx) + Math.abs(dz);
      if (d < sk.r[0] || d > sk.r[1] || !this.inBounds(x + dx, z + dz) || (straight && dx && dz)) continue;
      out.push({ x: x + dx, z: z + dz });
    }
    return out;
  }
  aoeTiles(sk, x, z) {
    const out = [], a = sk.aoe || 0;
    for (let dz = -a; dz <= a; dz++) for (let dx = -a; dx <= a; dx++) if (Math.abs(dx) + Math.abs(dz) <= a && this.inBounds(x + dx, z + dz)) out.push({ x: x + dx, z: z + dz });
    return out;
  }
  // the tiles a skill aimed at (x,z) covers: its blast, or a line out from the caster, or a widening cone
  shapeTiles(u, sk, x, z) {
    if (sk.shape !== 'line' && sk.shape !== 'cone') return this.aoeTiles(sk, x, z);
    const dx = Math.sign(x - u.x), dz = Math.sign(z - u.z), out = [];
    if (!dx && !dz) return out;
    if (sk.shape === 'line') {
      for (let i = Math.max(1, sk.r[0]); i <= sk.r[1]; i++) {
        const X = u.x + dx * i, Z = u.z + dz * i;
        if (!this.inBounds(X, Z) || !this.w.walkable(X, Z)) break;   // a trunk or a wall stops it
        out.push({ x: X, z: Z });
      }
    } else {
      for (let i = 1; i <= sk.r[1]; i++) for (let j = 1 - i; j <= i - 1; j++) {
        const X = u.x + dx * i + dz * j, Z = u.z + dz * i + dx * j;
        if (this.inBounds(X, Z)) out.push({ x: X, z: Z });
      }
    }
    return out;
  }
  // who a skill aimed at (x,z) would touch. A chain's extra links come after the rest (out.links says where).
  affected(u, sk, x, z) {
    if (sk.at === 'fallen') return this.units.filter((o) => !o.alive && o.hero && o.side === u.side && o.x === x && o.z === z && !this.unitAt(x, z));
    if (sk.kind === 'summon' || sk.kind === 'trap') return [];
    const good = this.good(sk), out = [];
    for (const t of this.shapeTiles(u, sk, x, z)) {
      const o = this.unitAt(t.x, t.z);
      if (!o || (o.side === u.side) !== good || (o === u && sk.kind === 'tempo')) continue;
      out.push(o);
    }
    out.links = out.length;
    if (sk.chain && out.length) {
      let last = out[out.length - 1];
      for (let i = 0; i < sk.chain; i++) {
        const next = this.units.filter((o) => o.alive && (o.side === u.side) === good && !out.includes(o) && manhattan(o.x, o.z, last.x, last.z) <= 2)
          .sort((a, b) => manhattan(a.x, a.z, last.x, last.z) - manhattan(b.x, b.z, last.x, last.z))[0];
        if (!next) break;
        out.push(next); last = next;
      }
    }
    return out;
  }
  // how hard the i-th one is struck: a chain loses a quarter at each jump
  falloff(list, i) { return i >= list.links ? 0.75 ** (i - list.links + 1) : 1; }
  validTarget(u, sk, x, z) {
    if (sk.kind === 'summon' || sk.kind === 'trap' || sk.blink) return this.open(x, z) && !this.unitAt(x, z) && !this.trapAt(x, z);
    return this.affected(u, sk, x, z).length > 0;
  }

  // ---- numbers ----
  // What a blow would do. `sure` leaves out luck (for forecasts and the AI).
  damage(a, t, sk, sure = false, from = a, mult = 1) {
    const magic = sk.kind === 'magic';
    let v = (magic ? a.s.mag : a.s.atk) * sk.pow * mult * 100 / (100 + (magic ? t.s.res : t.s.def) * 4);
    if (this.has(a, 'might')) v *= 1.3;
    if (this.has(a, 'wyrm')) v *= 1.3;
    if (this.has(a, 'weaken')) v *= 0.7;
    if (this.has(t, 'guard')) v *= 0.6;
    if (this.has(t, 'wyrm')) v *= 0.75;
    if (this.has(t, 'curse')) v *= 1.3;
    if (sk.el === 'holy' && t.undead) v *= 1.5;
    if (sk.execute && t.hp <= t.maxhp * sk.execute) v *= 2;
    const combo = comboFor(sk, (id) => this.has(t, id));
    if (combo) v *= combo.mult;
    const dx = from.x - t.x, dz = from.z - t.z, dot = Math.sign(dx) * t.face[0] + Math.sign(dz) * t.face[1];
    let side = '';
    if (!sk.aoe && !sk.shape) { if (dot < 0) { v *= 1.25; side = 'back'; } else if (dot === 0) { v *= 1.1; side = 'side'; } }
    const dh = this.w.height(from.x, from.z) - this.w.height(t.x, t.z);
    if (dh >= 2) v *= 1.15; else if (dh <= -2) v *= 0.9;
    let crit = false;
    if (!sure) { v *= 0.92 + Math.random() * 0.16; if (Math.random() * 100 < (a.s.crit || 0)) { v *= 1.5; crit = true; } }
    return { n: Math.max(1, Math.round(v)), crit, side, combo };
  }
  healing(a, sk) { return Math.round(a.s.mag * sk.pow + 4 + a.lvl); }

  // ---- doing things ----
  // A pause in the fight, on its clock: shorter under auto-play, twice as long at 1x as at 2x (Game.pace).
  wait(ms) { return new Promise((r) => setTimeout(r, ms / ((this.st.auto ? 1.7 : 1) * this.g.pace))); }
  // Something a moment from now, on the fight's clock.
  later(fn, ms) { return setTimeout(fn, ms / this.g.pace); }
  // A pause that keeps time with the clips (they run on the fight's clock, auto-play or not): to the moment a blow lands.
  clipWait(ms) { return new Promise((r) => setTimeout(r, ms / this.g.pace)); }
  say(text, cls = '') { this.chron.add(text, cls); }
  float(u, text, cls = '') { this.show.word(u, text, cls); }
  // A status taking hold. st: [id, turns, chance, strength]; `loud` says so when it fails (for a curse that was the point).
  addStatus(t, st, by = null, loud = false) {
    if (!st || !t.alive || !STATUS[st[0]]) return false;
    const S = STATUS[st[0]];
    if (Math.random() > st[2]) { if (loud) { this.show.status(t, st[0], false); this.say(`${this.nm(t)} shrugs off ${esc(S.name.toLowerCase())}.`, 'st'); } return false; }
    let s = t.st.find((o) => o.id === st[0]);
    if (s) s.turns = Math.max(s.turns, st[1]); else { s = { id: st[0], turns: st[1] }; t.st.push(s); }
    const pow = by ? Math.max(by.s.mag, by.s.atk) : 12;
    if (S.doom) { s.amt = Math.round(pow * (st[3] || 2)); s.by = by?.id; }
    if (st[0] === 'ward') s.amt = Math.round(pow * (st[3] || 1.5) + t.maxhp * 0.1);
    this.show.status(t, st[0], true);
    this.say(`${this.nm(t)}: <span style="color:${S.color}">${esc(S.name)}</span>${s.amt && st[0] === 'ward' ? ` (${s.amt})` : ''}`, 'st');
    return true;
  }
  // Harm landing. cls: crit | back | side | wall | dot. Returns what got through a ward.
  hurt(t, n, by, cls = '', h = 0, note = '') {
    if (!t.alive) return 0;
    const ward = t.st.find((s) => s.id === 'ward');
    if (ward && n > 0) {
      const soak = Math.min(n, ward.amt || 0);
      ward.amt -= soak; n -= soak;
      if (soak) this.show.word(t, `Ward −${soak}`, 'good', STATUS.ward.color);
      if (ward.amt <= 0) { t.st = t.st.filter((s) => s !== ward); this.show.word(t, 'Ward breaks', 'bad'); }
      if (n <= 0) return 0;
    }
    t.hp = Math.max(0, t.hp - n);
    t.tally.taken += n; if (by?.tally) by.tally.dealt += n;
    if (t.hp > 0) t.tally.low = Math.min(t.tally.low, t.hp / t.maxhp);
    if (cls === 'crit' || cls === 'wall') this.direct(t.model.position, 0.8, 560);
    if (t.hero && t.hp > 0 && t.hp < t.maxhp * 0.25 && !t.saidLow) { t.saidLow = true; this.g.banter.say('low', { who: t.hero, chance: 0.7 }); }
    else if (cls === 'crit' && by?.hero) this.g.banter.say('crit', { who: by.hero, chance: 0.3 });
    this.show.num(t, n, cls === 'crit' ? 'crit' : cls === 'dot' ? 'dot' : 'dmg', ['back', 'side', 'wall'].includes(cls) ? cls : '', h);
    if (cls === 'dot') this.show.dot(t);
    if (!this.batch) this.say(`${this.nm(t)} takes <b class="dmg">${n}</b>${cls === 'crit' ? ' <i>critical</i>' : cls === 'back' ? ' <i>from behind</i>' : ''}${note ? ` <i>${esc(note)}</i>` : ''}`, cls === 'dot' ? 'dot' : 'hit');
    setAnim(t.model, 'hit', 0.3);
    if (t.rage) t.mp = Math.min(100, t.mp + 10);
    if (t.hp <= 0) this.kill(t, by);
    return n;
  }
  mend(t, n, L = null, by = null) {
    if (!t.alive) return 0;
    const v = Math.max(0, Math.min(n, t.maxhp - t.hp));
    t.hp += v;
    if (by?.tally) by.tally.healed += v;
    if (t.hp > t.maxhp * 0.4) t.saidLow = false;
    this.show.heal(t, v, L);
    if (v && !this.batch) this.say(`${this.nm(t)} recovers <b class="heal">${v}</b>`, 'heal');
    return v;
  }
  // a turn brought forward (n > 0) or put back (n < 0)
  tempo(t, n) {
    if (!t.alive || !n) return;
    if (n > 0) t.ct = Math.min(160, n >= 100 ? Math.max(100, t.ct + n) : t.ct + n);
    else t.ct = Math.max(-60, t.ct + n);
    this.show.tempo(t, n > 0);
    this.say(`${this.nm(t)} ${n > 0 ? 'moves up the order' : 'loses time'}.`, 'st');
    this.drawOrder();
  }
  cleanse(t) {
    const bad = t.st.filter((s) => STATUS[s.id]?.bad);
    if (!bad.length) return 0;
    t.st = t.st.filter((s) => !STATUS[s.id]?.bad);
    this.show.cleanse(t);
    this.say(`${this.nm(t)} is clear of it.`, 'heal');
    return bad.length;
  }
  revive(t, frac) {
    t.alive = true; t.st = []; t.ct = 0;
    t.hp = Math.max(1, Math.round(t.maxhp * frac)); if (t.hero) t.hero.hp = t.hp;
    setAnim(t.model, 'revive');
    this.show.revive(t); this.float(t, 'Up!', 'good');
    this.direct(t.model.position, 0.8, 700);
    sfx.revive(t.model.position);
    this.say(`${this.nm(t)} gets back up.`, 'heal');
  }
  kill(u, by, quiet = false) {
    if (!u.alive) return;
    u.alive = false; u.hp = 0; u.st = [];
    setAnim(u.model, 'dead');
    if (by?.tally && by !== u) by.tally.kills++;
    if (u.wind) { u.wind = null; enc.clearMarks(this); }
    if (!quiet && !u.summon) {
      const last = u.side === 'foe' && !this.units.some((o) => o.alive && o.side === 'foe');
      this.direct(u.model.position, last ? 0.66 : 0.78, last ? 1200 : 620);
      if (last) this.r.fx.slow(0.22, 0.9);
      if (u.hero) this.g.banter.say('down', { t: u.name.split(' ')[0], not: u.hero, force: true });
      else if (u.ward) this.g.banter.say('down', { t: u.name, force: true });
      else if (u.side === 'foe' && by?.hero) this.g.banter.say(u.rival ? 'rivalDown' : 'kill', { who: by.hero, t: u.name, chance: u.rival || u.lord ? 1 : 0.3, force: !!u.rival });
    }
    if (!quiet) { sfx.die(u.side === 'foe' ? 'foe' : u.summon ? 'summon' : 'hero', u.model.position, this.clinks(u)); this.show.death(u); this.say(`${this.nm(u)} ${u.side === 'foe' ? 'goes down and stays down.' : u.summon ? 'is gone.' : 'has fallen.'}`, 'kill'); }
    if (u.summon) this.later(() => { sleep(u.model); this.r.units.remove(u.model); }, 700);
    if (u.side === 'foe' && by && by.hero && by.alive) this.later(() => { if (by.alive && !this.over) setAnim(by.model, 'taunt'); }, 520);
    if (u.side === 'foe') {
      this.xp += u.s.xp; this.slain.push(u); if (!u.foe.extra) this.st.slain[u.id] = this.st.day; noteKill(this.st, u.zdef.id);
      if (u.zdef.burst) {
        const what = u.zdef.burst === true ? 'poison' : u.zdef.burst;
        this.say(`${this.nm(u)} bursts.`, 'kill');
        sfx.squelch(u.model.position);
        this.show.burstOpen(u, what);
        for (const o of this.units) if (o.alive && o.side !== 'foe' && manhattan(o.x, o.z, u.x, u.z) <= 1) { this.hurt(o, this.burstHarm(u), null); this.addStatus(o, [what, 3, 1]); }
      }
    }
    if (u.hero) u.hero.hp = 0;
  }
  // a doom running out: it falls on them (and, primed, on whoever of theirs stands close)
  async doomFalls(u, s) {
    const S = STATUS[s.id], by = this.units.find((o) => o.id === s.by) || null, amt = s.amt || 20;
    const through = (t) => Math.max(1, Math.round(amt * 100 / (100 + t.s.res * 4)));
    this.say(`${S.blast ? 'It goes off' : 'The doom falls'} on ${this.nm(u)}.`, 'kill');
    this.show.doomFall(u, !!S.blast);
    await this.wait(320);
    this.hurt(u, through(u), by, 'crit');
    if (S.blast) for (const o of this.units) if (o !== u && o.alive && o.side === u.side && manhattan(o.x, o.z, u.x, u.z) <= S.blast) this.hurt(o, Math.max(1, Math.round(through(o) * 0.6)), by);
    await this.wait(260);
  }

  async moveTo(u, tile) {
    const path = []; for (let t = tile; t && t.prev; t = t.prev) path.unshift(t);
    setAnim(u.model, 'walk');
    for (const t of path) {
      const fx = u.model.position.x, fy = u.model.position.y, fz = u.model.position.z, ty = this.w.y(t.x, t.z), hop = Math.abs(ty - fy) > 0.3 ? 0.5 : 0;
      u.model.rotation.y = Math.atan2(t.x - fx, t.z - fz); u.face = [Math.sign(Math.round(t.x - fx)), Math.sign(Math.round(t.z - fz))];
      if (hop) sfx.jump(ground(this.w, t.x, t.z), this.clinks(u)); else sfx.tread(ground(this.w, t.x, t.z), this.clinks(u), u.model.position);
      await this.g.tween(hop ? 0.22 : 0.12, (k) => u.model.position.set(fx + (t.x - fx) * k, fy + (ty - fy) * k + Math.sin(Math.PI * k) * hop, fz + (t.z - fz) * k));
      u.x = t.x; u.z = t.z;
      if (hop) this.show.step(u);
      if (this.traps.length && await this.springTrap(u)) break;     // a trap stops the walk where it is
    }
    if (u.alive) setAnim(u.model, 'idle');
    u.moved = true;
  }

  async act(u, sk, tx, tz) {
    this.faceTo(u, tx, tz);
    if (sk.item) this.st.consum[sk.item]--;
    else if (u.side === 'party' && !u.summon) u.mp = Math.max(0, u.mp - (sk.cost || 0));
    const blood = lifeCost(u, sk);
    if (blood) { u.hp = Math.max(1, u.hp - blood); this.show.num(u, blood, 'dot'); }
    this.say(`${this.nm(u)} · <b class="sk">${esc(sk.name)}</b>`, 'act');
    if (u.hero && HEROES[u.hero.heroId] && Math.random() < 0.16) this.g.ui.toast(HEROES[u.hero.heroId].barks[Math.floor(Math.random() * HEROES[u.hero.heroId].barks.length)], u.name);
    const L = this.show.look(u, sk);
    await this.show.begin(u, sk, L, tx, tz);
    const from = { x: u.x, z: u.z };
    if (sk.blink) { await this.blinkTo(u, tx, tz, L); from.x = u.x; from.z = u.z; }
    else if (sk.dash) {                                   // land beside the target (or behind it)
      let best = null;
      const tgt = this.unitAt(tx, tz);
      if (sk.dash === 'behind' && tgt) {
        const X = tgt.x - tgt.face[0], Z = tgt.z - tgt.face[1];
        if (this.open(X, Z) && (!this.unitAt(X, Z) || this.unitAt(X, Z) === u)) best = { x: X, z: Z };
      }
      if (!best) for (const [dx, dz] of DIRS) {
        const X = tx + dx, Z = tz + dz;
        if (!this.open(X, Z) || (this.unitAt(X, Z) && this.unitAt(X, Z) !== u)) continue;
        const d = manhattan(X, Z, u.x, u.z);
        if (!best || d < best.d) best = { x: X, z: Z, d };
      }
      if (best && (best.x !== u.x || best.z !== u.z)) {
        const fx = u.x, fz = u.z, fy = u.model.position.y, ty = this.w.y(best.x, best.z), up = L.big ? 3.8 : 2.2;
        sfx.jump(ground(this.w, u.x, u.z), this.clinks(u));
        let n = 0;
        await this.g.tween(L.big ? 0.5 : 0.36, (k) => {
          u.model.position.set(fx + (best.x - fx) * k, fy + (ty - fy) * k + Math.sin(Math.PI * k) * up, fz + (best.z - fz) * k);
          if (n++ % 2 === 0) this.show.streak(u);
        });
        u.x = best.x; u.z = best.z; from.x = u.x; from.z = u.z; this.faceTo(u, tx, tz);
        sfx.land(ground(this.w, u.x, u.z), this.clinks(u));
        this.show.land2(u, L);
      }
    }
    const spell = sk.kind !== 'phys', fall = spell ? 'cast' : 'attack';
    // the skill's own move if the figure has it (a Mixamo take), else the shared one it had before, else cast or attack
    setAnim(u.model, sk.item ? 'item' : [sk.move || 'sk_' + sk.id, sk.anim].find((s) => canPlay(u.model, s)) || sk.anim || fall, 0.5, fall);
    // the blow lands when the clip says it does: the wait below and the swing's own reach (show.travel) come to that
    // (the reach is a wait() of show.travel's, which auto-play shortens; the clip it is timed against plays on regardless)
    const blows = sk.item ? null : blowTimes(u.model), reach = (L.go === 'melee' ? (sk.dash ? 60 : 170) : L.go === 'thrust' ? 110 : 0) / (this.st.auto ? 1.7 : 1);
    const at = u.model.position, kind = this.weaponOf(u, sk);
    const sound = () => {
      if (sk.item) { if (sk.item !== 'tonic') sfx.drink(at); }
      else if (sk.kind === 'heal' || sk.kind === 'cleanse' || sk.kind === 'revive') sfx.heal(at);
      else if (sk.kind === 'buff' || sk.kind === 'tempo') sfx.buff(at);
      else if (sk.kind === 'debuff') sfx.debuff(at);
      else if (sk.kind === 'summon') sfx.summon(at);
      else if (spell) sfx.cast(sk, at, kind);
      else sfx.swing(kind, at, sk.el);
    };
    // a long wind-up swishes as the blade comes down, not as the arm goes back
    if (blows && blows[0] > 0.35) setTimeout(sound, (blows[0] - 0.2) * 1000 / this.g.pace); else sound();
    if (blows) await this.clipWait(Math.max(0, blows[0] * 1000 - reach)); else await this.wait(200);
    if (sk.kind === 'summon') {
      await this.show.travel(u, sk, L, tx, tz, []);
      this.show.land(u, sk, L, tx, tz);
      await this.wait(260);
      const s = this.addSummon(u, sk.summon, tx, tz); this.faceTo(s, tx + u.face[0], tz + u.face[1]);
      this.float(s, s.name, 'good'); this.say(`${this.nm(s)} answers.`, 'st');
    } else if (sk.kind === 'trap') {
      await this.show.travel(u, sk, L, tx, tz, []);
      this.placeTrap(u, sk, tx, tz);
    } else if (sk.kind === 'item') {
      const ts = this.affected(u, sk, tx, tz);
      if (ts[0] && ts[0] !== u) await this.show.travel(u, sk, L, tx, tz, ts);
      for (const t of ts) {
        if (sk.item === 'potion') this.mend(t, Math.round(t.maxhp * 0.45), L);
        else if (sk.item === 'ether') { const v = Math.min(t.maxmp - t.mp, Math.round(t.maxmp * 0.45)); t.mp += v; this.show.mana(t, v); this.say(`${this.nm(t)} gets <b class="mana">${v}</b> mana back`, 'heal'); }
        else this.revive(t, 1 / 3);
      }
    } else {
      const hits = sk.hits || 1, tally = new Map();
      let last = [];
      this.batch = hits > 1;
      for (let h = 0; h < hits; h++) {
        const targets = this.affected(u, sk, tx, tz);
        if (h && !targets.length) break;
        last = targets;
        await this.show.travel(u, sk, L, tx, tz, targets, h);
        this.show.land(u, sk, L, tx, tz);
        let crit = false, blocked = false;
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i], mult = this.falloff(targets, i);
          if (!t.alive && sk.at !== 'fallen') continue;
          if (i >= targets.links) { this.show.hop(targets[i - 1], t, L); await this.wait(110); }
          if (sk.kind === 'heal') { const was = t.hp; this.mend(t, Math.round(this.healing(u, sk) * mult), L, u); if (t.hero && t !== u && was < t.maxhp * 0.4) this.g.banter.say('healed', { who: t.hero, chance: 0.5 }); }
          else if (sk.kind === 'buff') { this.addStatus(t, sk.st, u); this.addStatus(t, sk.st2, u); }
          else if (sk.kind === 'debuff') { this.addStatus(t, sk.st, u, true); this.addStatus(t, sk.st2, u, true); if (sk.delay) this.tempo(t, -sk.delay); }
          else if (sk.kind === 'cleanse') { const n = this.cleanse(t); if (sk.pow) this.mend(t, Math.round(this.healing(u, sk) * mult), L); else if (!n) this.float(t, 'Clear', 'good'); }
          else if (sk.kind === 'revive') this.revive(t, sk.pow || 0.4);
          else if (sk.kind === 'tempo') this.tempo(t, sk.tempo || 60);
          else {
            const d = this.damage(u, t, sk, false, from, mult);
            crit ||= d.crit;
            if (sk.kind === 'phys' && !d.crit && !d.side && this.clinks(t) && Math.random() < 0.6) blocked = true;   // (met head on, on mail)
            this.show.hit(u, t, sk, L, d, h);
            const got = this.hurt(t, d.n, u, d.crit ? 'crit' : d.side, h);
            tally.set(t, (tally.get(t) || 0) + got);
            const take = (sk.drain || 0) + (u.s.leech || 0) / 100;
            if (take && u.alive && got) this.mend(u, Math.max(1, Math.round(got * take)), { el: 'blood' });
            this.addStatus(t, sk.st, u);
            this.addStatus(t, sk.st2, u);
            if (sk.delay && t.alive) this.tempo(t, -sk.delay);
            if (d.combo) this.comboLands(u, t, d.combo);
            else if (sk.el === 'cold' && t.alive) this.addStatus(t, ['rime', 2, 0.7], u);
          }
        }
        if (targets.length && (sk.kind === 'phys' || sk.kind === 'magic')) {
          const where = targets[0].model.position;
          if (sk.kind === 'magic') sfx.burst(sk, where, crit); else sfx.hit({ kind, el: sk.el, crit, blocked, at: where });
        }
        if (sk.allyHeal) for (const t of this.aoeTiles(sk, tx, tz)) { const o = this.unitAt(t.x, t.z); if (o && o.side === u.side && o.hp < o.maxhp) this.mend(o, Math.round(u.s.mag * sk.allyHeal), L); }
        if (h < hits - 1) { if (blows?.[h + 1] != null) await this.clipWait(Math.max(40, (blows[h + 1] - blows[h]) * 1000 - reach)); else await this.wait(170); }
      }
      this.batch = false;
      if (hits > 1) for (const [t, n] of tally) if (n > 0) { this.show.total(t, n, hits); this.say(`${this.nm(t)} takes <b class="dmg">${n}</b> in ${hits} blows`, 'hit'); }
      // pushed, pulled, and anyone with a riposte ready
      if ((sk.push || sk.pull) && !this.over) { await this.wait(120); await this.shoveAll(u, sk, last.filter((t) => t.alive), tx, tz); }
      if (sk.kind === 'phys' && !sk.aoe && !sk.shape && last.length === 1) {
        const t = last[0];
        if (t.alive && u.alive && this.has(t, 'counter') && manhattan(t.x, t.z, u.x, u.z) <= 1) await this.counterBlow(t, u);
      }
    }
    if (sk.self && u.alive) this.addStatus(u, sk.self, u);
    if (u.rage && sk.rage) u.mp = Math.min(100, u.mp + sk.rage);
    u.acted = true;
    await this.wait(240);
    this.show.end();
    await this.wait(220);
    this.checkOver();
  }
  // A combo set off (data/classes.js COMBOS): the mark is spent, and what it leaves is left.
  comboLands(u, t, c) {
    this.show.word(t, c.name + '!', 'combo', c.color);
    this.say(`<b style="color:${c.color}">${esc(c.name)}!</b> ${this.nm(u)} sets it off on ${this.nm(t)}.`, 'hit');
    this.r.fx.flash(c.color, 0.22); this.r.fx.shake(0.2);
    this.direct(t.model.position, 0.8, 620);
    if (c.eats) t.st = t.st.filter((s) => s.id !== c.need);
    if (c.st && t.alive) this.addStatus(t, c.st, u);
    if (c.spread) for (const o of this.units) if (o.alive && o !== t && o.side === t.side && manhattan(o.x, o.z, t.x, t.z) <= 1) this.addStatus(o, c.spread, u);
    this.combos = (this.combos || 0) + 1;
    if (u.hero) this.g.banter.say('combo', { chance: 0.6 });
  }
  // The camera leans in on something worth seeing (a crit, a kill, a body through a wall), then lets go. Under
  // auto-play by default; `opts.director` in the save says always or never.
  direct(pos, zoom = 0.78, ms = 650) {
    const o = this.st.opts.director || 'auto';
    if (o === 'off' || (o === 'auto' && !this.st.auto) || this.over) return;
    this.camAt = { x: pos.x, y: pos.y, z: pos.z }; this.r.fx.zoom(zoom, 9);
    clearTimeout(this.dirT);
    this.dirT = this.later(() => { if (!this.over) { this.r.fx.zoom(1, 4); this.camAt = null; } }, ms);
  }
  badTiles(u) { return enc.badTiles(this, u); }
  // what whoever is up means to do, under the turn order
  setIntent(u, text) { this.intentEl.innerHTML = text ? `<b style="color:${u.color}">${esc(u.hero ? u.name.split(' ')[0] : u.name)}</b> · ${esc(text)}` : ''; }

  // ---- the player's one call under auto-play: focus one of the dead, go all out, or hold the line ----
  drawCall() {
    const c = this.call, e = this.callEl;
    e.innerHTML = '';
    if (!this.st.auto || this.over || this.sel.mode === 'place') return;
    const btn = (label, fn, cls = '') => { const x = el('button', 'btn ' + cls, label); x.onclick = () => { sfx.ui(); fn(); }; e.append(x); return x; };
    if (c.open) {
      btn('Focus one', () => { c.open = false; c.picking = true; this.drawCall(); });
      btn('All out', () => this.makeCall('allout'));
      btn('Hold the line', () => this.makeCall('hold'));
      btn('✕', () => { c.open = false; this.drawCall(); });
    } else if (c.picking) { e.append(el('small', '', 'Tap one of the dead')); btn('✕', () => { c.picking = false; this.drawCall(); }); }
    else if (c.left > 0) btn(`${c.mode === 'focus' ? 'Focus: ' + esc(c.focus?.name || '') : c.mode === 'allout' ? 'All out' : 'Holding'} · ${c.left}`, () => {}, 'spent');
    else if (c.cd > 0) btn(`Call it · ${c.cd}`, () => {}, 'spent').title = 'Comes back after a few of your turns';
    else btn('Call it', () => { c.open = true; this.drawCall(); }, 'main').title = 'Your one call (C)';
  }
  makeCall(mode, focus = null) {
    const c = this.call, n = Math.max(2, this.units.filter((u) => u.hero && u.alive).length);
    Object.assign(c, { open: false, picking: false, mode, focus, left: n, cd: n + 5 });
    const words = mode === 'focus' ? `Everyone on ${focus.name}!` : mode === 'allout' ? 'All out! Spend it!' : 'Hold the line! Close up!';
    this.say(`<b>You call it:</b> ${esc(words)}`, 'sys');
    this.g.ui.banner(mode === 'focus' ? 'Focus' : mode === 'allout' ? 'All out' : 'Hold the line', words);
    if (focus) this.show.word(focus, 'Marked', 'bad');
    this.g.banter.say('call', { chance: 0.8, force: true });
    this.drawCall();
  }
  callKey() { const c = this.call; if (!this.st.auto || this.over || c.left > 0 || c.cd > 0) return; c.open = !c.open; c.picking = false; this.drawCall(); }

  // a riposte: struck in the open by someone standing close, they strike back
  async counterBlow(t, u) {
    const sk = { id: 'riposte', name: 'Riposte', kind: 'phys', pow: 0.9, r: [1, 1], aoe: 0 };
    await this.wait(200);
    this.faceTo(t, u.x, u.z);
    this.float(t, 'Riposte', 'good');
    this.say(`${this.nm(t)} answers in kind.`, 'act');
    setAnim(t.model, 'attack', 0.5, 'attack');
    const kind = this.weaponOf(t, sk), blows = blowTimes(t.model);
    sfx.swing(kind, t.model.position);
    if (blows) await this.clipWait(blows[0] * 1000); else await this.wait(180);
    const d = this.damage(t, u, sk, false, t);
    this.show.hit(t, u, sk, this.show.look(t, sk), d);
    sfx.hit({ kind, crit: d.crit, at: u.model.position });
    this.hurt(u, d.n, t, d.crit ? 'crit' : d.side);
    await this.wait(200);
  }
  // a trap on a tile: two each at most, the oldest goes when a third is set
  placeTrap(u, sk, x, z) {
    const mine = this.traps.filter((p) => p.owner === u.id);
    if (mine.length >= 2) { const old = mine[0]; this.traps = this.traps.filter((p) => p !== old); this.show.trapGone(old.x, old.z, null, true); }
    this.traps.push({ owner: u.id, side: u.side, x, z, sk });
    this.show.trapMark(x, z, palOf(sk.trap?.el || 'phys').mid);
    this.say(`${this.nm(u)} leaves a ${esc(sk.name.toLowerCase())} in the grass.`, 'st');
  }
  // someone walking (or knocked) onto the other side's trap: it goes off, and they stop there
  async springTrap(u) {
    const p = this.traps.find((q) => q.x === u.x && q.z === u.z && q.side !== u.side);
    if (!p) return false;
    this.traps = this.traps.filter((q) => q !== p);
    const T = p.sk.trap || {}, by = this.units.find((o) => o.id === p.owner);
    const sk = { id: p.sk.id, name: p.sk.name, kind: T.kind || 'phys', pow: T.pow || 1, el: T.el, aoe: T.aoe || 0, shape: 'trap', r: [0, 0] };
    setAnim(u.model, 'idle');
    this.show.trapGone(p.x, p.z, T.el || 'phys');
    this.say(`${this.nm(u)} finds the ${esc(p.sk.name.toLowerCase())}.`, 'kill');
    await this.wait(140);
    const hit = T.aoe ? this.aoeTiles(sk, p.x, p.z).map((t) => this.unitAt(t.x, t.z)).filter((o) => o && o.side !== p.side) : [u];
    for (const o of hit) {
      const d = this.damage(by || u, o, sk, false, o);
      this.hurt(o, d.n, by, d.crit ? 'crit' : '');
      this.addStatus(o, T.st, by);
    }
    await this.wait(260);
    return true;
  }
  // stepping through the air to the aimed tile
  async blinkTo(u, x, z, L) {
    this.show.vanish(u, L);
    u.model.visible = false;
    await this.wait(220);
    u.x = x; u.z = z; this.place(u);
    this.show.appear(u, L);
    await this.wait(180);
  }
  // Everyone a pushing (or pulling) skill reached, moved in turn: the farthest first, so nobody blocks a friend.
  async shoveAll(u, sk, targets, tx, tz) {
    const pull = !!sk.pull, n = sk.pull || sk.push, aimed = sk.aoe && sk.at !== 'self';
    const moves = targets.map((t) => {
      const O = pull ? (aimed ? { x: tx, z: tz } : u) : (!aimed || (t.x === tx && t.z === tz) ? u : { x: tx, z: tz });
      const dx = t.x - O.x, dz = t.z - O.z, d = Math.abs(dx) + Math.abs(dz);
      if (!d) return null;
      let dir = Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
      if (pull) dir = [-dir[0], -dir[1]];
      return { t, dir, d, n: pull ? Math.min(n, d - 1) : n };
    }).filter((m) => m && m.n > 0).sort((a, b) => (pull ? a.d - b.d : b.d - a.d));
    for (const m of moves) await this.shove(m.t, m.dir, m.n, u, pull);
  }
  // One body knocked n tiles. Into a wall, a rise or another body, it hurts (the other body too); off a drop, the fall does.
  async shove(t, [dx, dz], n, by, pull = false) {
    if (!t.alive) return;
    if (this.unmoved(t)) { this.float(t, 'Unmoved', 'resist'); return; }
    let went = 0;
    for (let i = 0; i < n && t.alive; i++) {
      const X = t.x + dx, Z = t.z + dz, blocker = this.unitAt(X, Z), h0 = this.w.height(t.x, t.z);
      if (!this.open(X, Z) || blocker || this.w.height(X, Z) - h0 > 1) {
        if (!pull) {
          const hard = Math.max(1, Math.round(t.maxhp * 0.08 * (n - i)));
          this.show.thump(t, blocker);
          this.say(`${this.nm(t)} is slammed into ${blocker ? this.nm(blocker) : 'the ground'}.`, 'hit');
          this.hurt(t, hard, by, 'wall');
          if (blocker) this.hurt(blocker, Math.max(1, Math.round(hard * 0.6)), by, 'wall');
        }
        break;
      }
      const drop = h0 - this.w.height(X, Z), p0 = t.model.position.clone(), ty = this.w.y(X, Z);
      this.show.shove(t);
      await this.g.tween(drop > 0 ? 0.16 : 0.09, (k) => t.model.position.set(p0.x + dx * k, p0.y + (ty - p0.y) * k * k + (drop > 0 ? Math.sin(Math.PI * k) * 0.25 : 0), p0.z + dz * k));
      t.x = X; t.z = Z; went++;
      if (drop >= 3) { this.show.land2(t); this.hurt(t, Math.max(1, Math.round(t.maxhp * 0.05 * drop)), by, 'wall', 0, 'from the fall'); }
      if (this.traps.length && await this.springTrap(t)) break;
    }
    if (went && t.alive) this.place(t);
  }

  // ---- the clock ----
  speed(u) { return u.s.spd * (this.has(u, 'slow') ? 0.7 : 1) * (this.has(u, 'haste') ? 1.3 : 1); }
  nextUp() {
    for (;;) {
      let best = null;
      for (const u of this.units) if (u.alive && u.ct >= 100 && (!best || u.ct > best.ct)) best = u;
      if (best) return best;
      for (const u of this.units) if (u.alive) u.ct += this.speed(u);
    }
  }
  order(n = 9) {
    const cts = new Map(this.units.filter((u) => u.alive).map((u) => [u, u.ct])), out = [];
    if (this.active && this.active.alive) { out.push(this.active); cts.set(this.active, cts.get(this.active) - 100); }
    for (let guard = 0; out.length < n && guard < 4000; guard++) {
      let best = null;
      for (const [u, c] of cts) if (c >= 100 && (!best || c > cts.get(best))) best = u;
      if (best) { out.push(best); cts.set(best, cts.get(best) - 100); } else for (const [u, c] of cts) cts.set(u, c + this.speed(u));
    }
    return out;
  }

  begin() {
    this.sel = { mode: 'wait' };
    this.r.clearHighlights();
    this.menuEl.innerHTML = '';
    const n = this.foesOf({ side: 'party' }).length, T = this.threat, G = this.goal;
    this.show.splash(G.title || 'Battle', `${n} of the dead · ${T.word}`, 'start');
    this.say(`<b>The fight begins.</b> ${n} of the dead. It looks: <span class="threat t${T.i}">${T.word}</span>${G.title ? ` <b>${esc(G.title)}.</b> ${esc(G.text)}` : ''}`, 'sys');
    this.g.banter.say(T.i >= 4 ? 'grave' : T.i <= 0 ? 'easy' : 'seen', { chance: T.i >= 4 ? 1 : 0.6 });
    this.drawCall();
    this.run();
  }
  async run() {
    await this.wait(900);
    while (!this.over) {
      const u = this.nextUp();
      this.active = u; u.moved = false; u.acted = false;
      this.drawOrder();
      this.show.turn(u);
      // what was done to them last turn comes due
      let skip = false;
      for (const s of [...u.st]) {
        const S = STATUS[s.id];
        if (!S) { u.st = u.st.filter((o) => o !== s); continue; }
        if (S.dot) this.hurt(u, Math.max(1, Math.ceil(u.maxhp * S.dot)), null, 'dot', 0, S.name.toLowerCase());
        if (S.hot && u.alive) this.mend(u, Math.ceil(u.maxhp * S.hot), { el: 'light' });
        if (s.id === 'stun') skip = true;
        if (--s.turns <= 0) { u.st = u.st.filter((o) => o !== s); if (S.doom && u.alive) await this.doomFalls(u, s); }
      }
      this.checkOver();
      if (this.over) break;
      if (!u.alive) continue;
      if (await enc.turnStart(this, u)) break;
      if (!u.alive) continue;
      if (skip) { this.float(u, 'Stunned', 'bad'); this.say(`${this.nm(u)} is too stunned to move.`, 'st'); u.ct -= 100; await this.wait(500); continue; }
      if (u.flee) await enc.fleeTurn(this, u);
      else if (u.kit && await enc.lordTurn(this, u)) { /* its turn went on its own business */ }
      else if (u.ai || this.st.auto) await this.aiTurn(u); else await this.playerTurn(u);
      this.setIntent(u, '');
      u.ct -= u.moved && u.acted ? 100 : u.moved || u.acted ? 80 : 60;
      if (u.hero) { const c = this.call; if (c.left > 0 && --c.left === 0) { c.mode = null; c.focus = null; } if (c.cd > 0) c.cd--; this.drawCall(); }
      this.r.clearHighlights(); this.menuEl.innerHTML = '';
      if (this.stalemate()) this.finish('apart');
    }
  }
  // A fight nobody can win, once every side is the AI's (the party on Auto). Over when, with nothing changed since,
  // every one of them has had a turn and found no way to get at anybody; or when nobody has been hurt or mended for
  // a long while; or, at the very last, after more turns than any real fight takes.
  stalemate() {
    const live = this.units.filter((o) => o.alive), hp = live.map((o) => o.id + ':' + o.hp).join();
    const all = hp + '|' + live.map((o) => o.x + ',' + o.z).join();
    if (all !== this.sig) { this.sig = all; for (const o of this.units) o.stuck = false; }
    if (hp !== this.hpSig) { this.hpSig = hp; this.quiet = 0; } else this.quiet = (this.quiet || 0) + 1;
    this.turns = (this.turns || 0) + 1;
    if (!this.st.auto || this.over) return false;
    return live.every((o) => o.stuck) || this.quiet > 25 * live.length || this.turns > 1500;
  }
  checkOver() {
    if (this.over) return;
    const foes = this.units.some((u) => u.alive && u.side === 'foe'), us = this.units.some((u) => u.alive && u.hero);
    if (this.call.focus && !this.call.focus.alive) { this.call.focus = null; if (this.call.mode === 'focus') this.call.left = 0; }
    if (!foes) this.finish('win'); else if (!us) this.finish('lose');
  }

  // ---- the player's turn ----
  playerTurn(u) {
    return new Promise((res) => { this.turnDone = res; this.showMenu(); });
  }
  afterAction() {
    this.lock = false;
    const u = this.active;
    if (this.over || !u.alive || (u.moved && u.acted)) { this.sel = { mode: 'wait' }; this.r.clearHighlights(); this.turnDone?.(); this.turnDone = null; } else this.showMenu();
  }
  // Auto was switched on while the menu was up: let the AI finish this turn.
  async takeOver() {
    this.drawCall();
    if (this.sel.mode === 'place') { this.begin(); return; }
    if (!this.turnDone || this.lock) return;
    this.lock = true; this.menuEl.innerHTML = ''; this.r.clearHighlights();
    await this.aiTurn(this.active);
    this.active.moved = this.active.acted = true;
    this.afterAction();
  }
  showMenu() {
    const u = this.active, m = this.menuEl;
    this.sel = { mode: 'menu' };
    this.r.clearHighlights(); this.infoEl.innerHTML = '';
    this.cursor = { x: u.x, z: u.z };
    m.innerHTML = '';
    const btn = (text, fn, off, sub) => { const b = el('button', 'bt-btn' + (off ? ' off' : ''), esc(text) + (sub ? `<small>${esc(sub)}</small>` : '')); if (!off) b.onclick = () => { sfx.ui(); fn(); }; m.append(b); return b; };
    m.append(el('div', 'bt-who', `<b style="color:${u.color}">${esc(u.name)}</b><span>Lv ${u.lvl} ${esc(CLASSES[u.hero.cls].name)}</span>`));
    btn('Move', () => this.cmdMove(), u.moved || this.moveRange(u) === 0, u.moved ? 'done' : `${this.moveRange(u)} tiles`);
    btn('Attack', () => this.cmdSkill(u.basic), u.acted);
    for (const sk of u.skills) {
      const blood = lifeCost(u, sk), price = [sk.cost ? `${sk.cost} ${u.rage ? 'rage' : 'mp'}` : '', blood ? `${blood} life` : ''].filter(Boolean).join(' · ') || 'free';
      btn(sk.name, () => this.cmdSkill(sk), u.acted || sk.cost > u.mp || (blood && u.hp <= blood), price).title = sk.desc || '';
    }
    for (const id in ITEM_SKILLS) if (this.st.consum[id] > 0) btn(CONSUMABLES[id].name, () => this.cmdSkill(ITEM_SKILLS[id]), u.acted, 'x' + this.st.consum[id]).title = CONSUMABLES[id].desc;
    btn('Wait', () => this.afterActionForce());
    btn('Flee', () => this.finish('flee')).classList.add('dim');
  }
  afterActionForce() { const u = this.active; u.moved = u.moved || false; this.sel = { mode: 'wait' }; this.r.clearHighlights(); this.turnDone?.(); this.turnDone = null; }
  cmdMove() {
    const u = this.active;
    const R = [...this.reach(u).values()].filter((t) => t.d > 0 && !t.pass);
    this.sel = { mode: 'move', tiles: R };
    this.r.clearHighlights(); this.r.highlight(R, 'move');
    this.backButton('Choose where to stand.');
  }
  cmdSkill(sk) {
    const u = this.active;
    if (sk.at === 'self') { this.sel = { mode: 'target', sk, tiles: [{ x: u.x, z: u.z }] }; this.cursor = { x: u.x, z: u.z }; }
    else this.sel = { mode: 'target', sk, tiles: this.rangeTiles(sk, u.x, u.z) };
    this.r.clearHighlights();
    this.r.highlight(this.sel.tiles, this.good(sk) || sk.kind === 'summon' || sk.kind === 'trap' || sk.kind === 'revive' || sk.blink || sk.at === 'fallen' ? 'heal' : 'attack');
    this.backButton(`${sk.name}: ${sk.desc || 'choose a target.'}`);
    this.preview(this.cursor.x, this.cursor.z);
  }
  backButton(text) {
    this.menuEl.innerHTML = '';
    this.menuEl.append(el('div', 'bt-hint', esc(text)));
    const b = el('button', 'bt-btn', 'Back'); b.onclick = () => this.back(); this.menuEl.append(b);
    if (this.sel.mode === 'target' && this.sel.sk.at === 'self') { const c = el('button', 'bt-btn', 'Confirm'); c.onclick = () => this.tile(this.active.x, this.active.z); this.menuEl.prepend(c); }
  }
  back() { if (this.lock) return; if (this.sel.mode === 'move' || this.sel.mode === 'target') { sfx.ui(); this.showMenu(); } }
  // show what aiming here would do
  preview(x, z) {
    this.r.clearHighlights('aoe');
    this.infoEl.innerHTML = '';
    const u = this.active, s = this.sel;
    if (s.mode !== 'target' || !s.tiles.some((t) => t.x === x && t.z === z)) return;
    const sk = s.sk;
    this.r.highlight(this.shapeTiles(u, sk, x, z), 'aoe', 'aoe');
    const hit = this.affected(u, sk, x, z);
    const lines = hit.map((t, i) => {
      const mult = this.falloff(hit, i);
      if (sk.kind === 'phys' || sk.kind === 'magic') {
        const d = this.damage(u, t, sk, true, u, mult), n = d.n * (sk.hits || 1);
        return `${esc(t.name)}: <b class="dmg">-${n}</b>${d.side ? ' (' + d.side + ')' : ''}${n >= t.hp ? ' <b>kills</b>' : ''}${sk.push ? ` · knocked ${sk.push}` : sk.pull ? ' · dragged' : ''}${sk.delay ? ' · delayed' : ''}`;
      }
      if (sk.kind === 'heal') return `${esc(t.name)}: <b class="heal">+${Math.min(Math.round(this.healing(u, sk) * mult), t.maxhp - t.hp)}</b>`;
      if (sk.kind === 'revive' || sk.at === 'fallen') return `${esc(t.name)}: <b class="heal">back on their feet</b>`;
      if (sk.kind === 'cleanse') return `${esc(t.name)}: cleared${sk.pow ? ` <b class="heal">+${Math.min(this.healing(u, sk), t.maxhp - t.hp)}</b>` : ''}`;
      if (sk.kind === 'tempo') return `${esc(t.name)}: acts sooner`;
      return `${esc(t.name)}${sk.st ? ': ' + STATUS[sk.st[0]].name + ' ' + Math.round(sk.st[2] * 100) + '%' : ''}${sk.delay ? ' · delayed' : ''}`;
    });
    if (sk.kind === 'trap') lines.push('A trap goes here.');
    if (sk.blink && this.validTarget(u, sk, x, z)) lines.unshift(`${esc(u.name)} steps here.`);
    if (lines.length) this.infoEl.innerHTML = lines.join('<br>');
  }
  // a tile was chosen (by click, tap, or the d-pad and A)
  async tile(x, z) {
    if (this.lock || this.over) return;
    const s = this.sel, u = this.active;
    if (this.call.picking) { const o = this.unitAt(x, z); if (o && o.side === 'foe') this.makeCall('focus', o); else sfx.deny(); return; }
    if (s.mode === 'place') return this.placeAt(x, z);
    if (s.mode === 'menu') { const o = this.unitAt(x, z); if (o) this.inspect(o); return; }
    if (s.mode === 'move') {
      const t = s.tiles.find((t) => t.x === x && t.z === z);
      if (!t) return sfx.deny();
      this.lock = true; this.r.clearHighlights();
      await this.moveTo(u, t);
      this.afterAction();
    } else if (s.mode === 'target') {
      if (!s.tiles.some((t) => t.x === x && t.z === z) || !this.validTarget(u, s.sk, x, z)) return sfx.deny();
      this.lock = true; this.r.clearHighlights(); this.infoEl.innerHTML = ''; this.menuEl.innerHTML = '';
      await this.act(u, s.sk, x, z);
      this.afterAction();
    }
  }
  inspect(o) {
    const st = o.st.map((s) => `<span style="color:${STATUS[s.id].color}">${STATUS[s.id].name} ${s.turns}${s.amt ? ' (' + s.amt + ')' : ''}</span>`).join(' ');
    this.infoEl.innerHTML = `<b>${esc(o.name)}</b> Lv ${o.lvl}<br>Life ${o.hp}/${o.maxhp}${o.maxmp ? ` · ${o.rage ? 'Rage' : 'Mana'} ${o.mp}/${o.maxmp}` : ''}<br>Atk ${o.s.atk} · Mag ${o.s.mag} · Arm ${o.s.def} · Ward ${o.s.res} · Spd ${o.s.spd}<br>Move ${o.s.move} · Jump ${o.s.jump}${st ? '<br>' + st : ''}${o.zdef ? `<br><i>${esc(o.zdef.blurb)}</i>` : ''}`;
  }

  // ---- placing the party before it starts ----
  // The spots round the leader, and the ones each hero may start on: those they could walk from to strike one of the
  // dead. (The spots are found climbing two, and someone who jumps one shouldn't be set down in a hollow they can't
  // get out of.) Fewest choices first, each to the nearest spot left that will do; the spots reach three steps out,
  // or as far as six if that's what it takes to give everyone who could have one a spot that will do.
  setOut(heroes, L) {
    const at = (t) => K(t.x, t.z), steps = new Map();
    for (const u of heroes) u.alive = false;            // (out of each other's way while it's worked out)
    for (const u of heroes) steps.set(u, this.strikeSteps(u, this.usable(u), this.foesOf(u)));
    const far = this.flood(L.x, L.z, 6).filter((t) => !this.unitAt(t.x, t.z)), some = heroes.filter((u) => far.some((t) => steps.get(u).has(at(t))));
    let spots, fits, where;
    for (let n = 3; n <= 6; n++) {
      spots = this.flood(L.x, L.z, n).filter((t) => !this.unitAt(t.x, t.z));
      fits = new Map(heroes.map((u) => { const ok = spots.filter((t) => steps.get(u).has(at(t))); return [u, new Set((ok.length ? ok : spots).map(at))]; }));
      const taken = new Set();
      where = new Map();
      for (const u of [...heroes].sort((a, b) => fits.get(a).size - fits.get(b).size)) {
        const s = spots.find((t) => !taken.has(at(t)) && fits.get(u).has(at(t))) || spots.find((t) => !taken.has(at(t))) || spots[spots.length - 1];
        taken.add(at(s)); where.set(u, s);
      }
      if (some.every((u) => steps.get(u).has(at(where.get(u))))) break;
    }
    for (const u of heroes) { const s = where.get(u); u.alive = true; u.x = s.x; u.z = s.z; this.place(u); }
    this.spots = spots; this.fits = fits;
  }
  fitsAt(u, x, z) { return !this.fits?.has(u) || this.fits.get(u).has(K(x, z)); }
  showPlacement() {
    this.sel = { mode: 'place', pick: this.units.find((u) => u.hero) };
    setAnim(this.sel.pick.model, 'point');            // the leader sets the line
    this.drawPlacement();
    this.g.ui.banner('Place your party', 'Tap one of yours, then a green tile');
  }
  drawPlacement() {
    const m = this.menuEl, s = this.sel;
    this.r.clearHighlights(); this.r.highlight(this.spots.filter((t) => !s.pick || this.fitsAt(s.pick, t.x, t.z)), 'place');
    m.innerHTML = '';
    m.append(el('div', 'bt-hint', 'The dead have seen you. Set your line: choose one of yours, then a green tile.'));
    for (const u of this.units.filter((u) => u.hero)) {
      const b = el('button', 'bt-btn' + (s.pick === u ? ' sel' : ''), `${esc(u.name)}<small>${esc(CLASSES[u.hero.cls].name)}</small>`);
      b.onclick = () => { s.pick = u; this.cursor = { x: u.x, z: u.z }; this.drawPlacement(); };
      m.append(b);
    }
    const go = el('button', 'bt-btn go', 'Begin'); go.onclick = () => { sfx.ui(); this.begin(); }; m.append(go);
    if (s.pick) this.r.setTurnRing(s.pick.x, s.pick.z);
  }
  placeAt(x, z) {
    const s = this.sel, o = this.unitAt(x, z);
    if (o && o.hero && o !== s.pick && !this.spots.some((t) => t.x === x && t.z === z && s.pick)) { s.pick = o; return this.drawPlacement(); }
    if (!this.spots.some((t) => t.x === x && t.z === z)) { if (o && o.hero) { s.pick = o; this.drawPlacement(); } return; }
    if (!s.pick) return;
    // not into a hollow they couldn't get out of (nor, swapping, the other one)
    if (!this.fitsAt(s.pick, x, z) || (o && o.hero && o !== s.pick && !this.fitsAt(o, s.pick.x, s.pick.z))) return sfx.deny();
    if (o && o.hero && o !== s.pick) { o.x = s.pick.x; o.z = s.pick.z; this.place(o); }
    else if (o && o !== s.pick) return sfx.deny();
    s.pick.x = x; s.pick.z = z; this.place(s.pick);
    sfx.ui(); this.drawPlacement();
  }

  // ---- the AI: used by the dead, by summons, and by the party when Auto is on ----
  // what u could use now (the party's skills cost mana or rage, some life too; the plain blow costs nothing)
  usable(u) { return [u.basic, ...u.skills].filter((sk) => sk && (u.side === 'foe' || u.summon || sk.basic || (sk.cost <= u.mp && (!sk.hpCost || u.hp > lifeCost(u, sk))))); }
  // Every skill from every tile in reach, at every target it could take, scored; the best is done.
  // (the scoring is game/tactics.js: stances, the player's call, bad ground, combos, shoves)
  plan(u) { return tacPlan(this, u); }
  // How many steps each tile of the field is from the nearest place u could strike one of them from with one of
  // `skills`, walking as u walks (up no more than its jump, past friends but never through foes). Map key -> steps;
  // a tile that isn't in it has no way there. One that can't move only counts where it already stands.
  strikeSteps(u, skills, foes) {
    const out = new Map(), q = [], jump = u.s.jump;
    const free = (x, z) => this.open(x, z) && (!this.unitAt(x, z) || this.unitAt(x, z) === u);
    const clear = (x, z, f, from) => {                    // a line from (x,z) to f with nothing in the way
      const sx = Math.sign(f.x - x), sz = Math.sign(f.z - z), d = manhattan(x, z, f.x, f.z);
      for (let i = from; i < d; i++) if (!this.w.walkable(x + sx * i, z + sz * i)) return false;
      return true;
    };
    for (const sk of skills) {
      if ((sk.kind !== 'phys' && sk.kind !== 'magic') || sk.blink || !(sk.at === 'enemy' || (sk.at === 'self' && sk.aoe))) continue;
      const far = sk.at === 'self' ? sk.aoe : sk.r[1], near = sk.at === 'self' ? 1 : Math.max(1, sk.r[0]);
      for (const f of foes) for (let dz = -far; dz <= far; dz++) for (let dx = -far; dx <= far; dx++) {
        const x = f.x - dx, z = f.z - dz, k = K(x, z), a = Math.abs(dx), b = Math.abs(dz);   // (dx,dz): from the tile to f
        if (out.has(k) || !free(x, z)) continue;
        if (sk.shape === 'cone') { if (!(Math.max(a, b) <= far && Math.min(a, b) < Math.max(a, b))) continue; }
        else if (a + b < near || a + b > far || (sk.shape === 'line' && ((a && b) || !clear(x, z, f, near)))) continue;
        if (u.s.move <= 0 && (x !== u.x || z !== u.z)) continue;
        out.set(k, 0); q.push({ x, z });
      }
    }
    if (u.s.move <= 0) return out;
    for (let i = 0; i < q.length; i++) {
      const c = q[i], n = out.get(K(c.x, c.z)) + 1, h = this.w.height(c.x, c.z);
      for (const [dx, dz] of DIRS) {
        const X = c.x + dx, Z = c.z + dz, k = K(X, Z);
        if (out.has(k) || !this.open(X, Z)) continue;
        const o = this.unitAt(X, Z);
        if (o && o.side !== u.side) continue;
        const up = h - this.w.height(X, Z);              // what the step from there to here climbs
        if (up > jump || up < -jump - 2) continue;
        out.set(k, n); q.push({ x: X, z: Z });
      }
    }
    return out;
  }
  // what one of the bursting dead going off does to whoever stands next to it (the dead's own are spared)
  burstHarm(o) { return Math.max(1, Math.round(o.s.atk * 0.5)); }
  // What putting o down is worth over the blow itself. One that bursts is worth less put down from beside it (or by
  // landing beside it), so from further off is better; and not at all if the burst would finish u, unless o is the last.
  killWorth(u, sk, o, foes) {
    if (!o.zdef?.burst || (!sk.dash && manhattan(u.x, u.z, o.x, o.z) > 1) || foes.length === 1) return 14;
    return this.burstHarm(o) >= u.hp ? -Infinity : 4;
  }
  async aiTurn(u) {
    this.r.setTurnRing(u.x, u.z);
    await this.wait(240);
    let p = this.plan(u);
    this.setIntent(u, intent(this, u, p));
    u.stuck = !!p.stuck;                                  // (forgotten as soon as anything changes: see stalemate)
    if (p.tile && (p.tile.x !== u.x || p.tile.z !== u.z) && !u.moved) {
      this.r.setTurnRing(null);
      await this.moveTo(u, p.tile);
      if (u.x !== p.tile.x || u.z !== p.tile.z) p = u.alive && !this.over ? this.plan(u) : {};   // a trap stopped them short
    }
    if (!u.alive) return;
    if (p.sk && !this.over) await this.act(u, p.sk, p.x, p.z);
    else if (!p.sk && !u.acted && !u.moved) await this.wait(120);
    // a second look: having acted first, there may still be a move worth making (and the other way round)
    if (!this.over && u.alive && !u.acted) { const q = this.plan(u); if (q.sk && (!q.tile || (q.tile.x === u.x && q.tile.z === u.z))) await this.act(u, q.sk, q.x, q.z); }
  }

  // ---- the end ----
  finish(how) {
    if (this.over) return;
    this.over = true; this.sel = { mode: 'over' };
    this.r.clearHighlights(); this.r.setCursor(null); this.r.setTurnRing(null);
    this.menuEl.innerHTML = ''; this.infoEl.innerHTML = ''; this.callEl.innerHTML = ''; this.setIntent(null, '');
    clearTimeout(this.dirT);
    const st = this.st, lines = [];
    const heroes = this.units.filter((u) => u.hero);
    const where = this.w.inTown(this.origin.x, this.origin.z, 6) ? 'at the edge of the Hollow' : 'in ' + this.w.regionAt(this.origin.x, this.origin.z).name;
    const names = (list) => { const m = new Map(); for (const u of list) m.set(u.zdef.name, (m.get(u.zdef.name) || 0) + 1); return [...m].map(([k, n]) => (n > 1 ? `${n} ${ZOMBIES.find((z) => z.name === k)?.plural || k}` : /^The |,/.test(k) ? k : `a ${k}`)).join(', '); };
    const mvp = [...heroes].sort((a, b) => (b.tally.dealt + b.tally.healed) - (a.tally.dealt + a.tally.healed))[0];
    const fell = heroes.filter((u) => !u.alive), closest = [...heroes].filter((u) => u.alive).sort((a, b) => a.tally.low - b.tally.low)[0];
    st.stats.fights++;
    this.report = { how, kind: this.goal.kind, lords: this.slain.filter((u) => u.lord).map((u) => u.zdef.id), rivals: this.slain.filter((u) => u.rival).map((u) => u.id), where };
    for (const u of heroes) { u.hero.hp = u.alive ? u.hp : 0; if (!u.rage) u.hero.mp = u.mp; }
    let sub, hold = 0;
    if (how === 'win' || how === 'apart') {
      if (how === 'win') {
        sfx.win(); music.stinger('triumph'); sub = `Won · ${this.slain.length} put down`;
        this.r.fx.stop(0.18); this.r.fx.flash('#fff3d0', 0.45); this.show.end();
        this.show.splash('Victory', `${this.slain.length} put down`, 'win'); hold = 1300;
        for (const u of heroes) if (u.alive) { setRest(u.model, 'idle'); setAnim(u.model, 'cheer'); this.show.cheer(u); }
      } else {
        // a stalemate (see stalemate): what was put down still counts, and nobody is stood back up for free
        sfx.sheath(); this.show.end(); sub = 'No way across';
        lines.push('Neither side could get at the other. You leave them standing where they are. They were not going anywhere.');
      }
      let gold = 0; const got = [];
      for (const f of this.slain) {
        const loot = rollLoot(f.lvl); gold += loot.gold;
        for (const it of loot.items) { if (addToBag(st, it)) { got.push(`<span style="color:${RARITY[it.rarity].color}">${esc(itemName(it))}</span>`); } else got.push('<i>a find you had no room for</i>'); }
        for (const gm of loot.gems) { st.gems[gm] = (st.gems[gm] || 0) + 1; got.push('a gem'); }
      }
      st.gold += gold; if (how === 'win') st.stats.won++;
      if (this.slain.length) lines.push(`Each of you earns <b>${this.xp}</b> experience. You find <b>${gold}</b> gold.`);
      if (got.length) lines.push('Found: ' + got.join(', '));
      if (how === 'win') {
        lines.push(...enc.spoils(this));
        // who did the work, and how near it came
        const chips = [];
        if (mvp && mvp.tally.dealt + mvp.tally.healed > 0) chips.push(`<span>Did the most: <b style="color:${mvp.color}">${esc(mvp.name.split(' ')[0])}</b> ${mvp.tally.dealt ? mvp.tally.dealt + ' dealt' : ''}${mvp.tally.healed ? ' ' + mvp.tally.healed + ' mended' : ''}</span>`);
        if (closest && closest.tally.low < 0.35) chips.push(`<span>Closest call: <b style="color:${closest.color}">${esc(closest.name.split(' ')[0])}</b> at ${Math.max(1, Math.round(closest.tally.low * closest.maxhp))} life</span>`);
        if (this.combos) chips.push(`<span>Combos: <b>${this.combos}</b></span>`);
        if (chips.length) lines.push(`<span class="mvp">${chips.join('')}</span>`);
        note(st, this.slain.some((u) => u.lord) ? 'lord' : 'fight', `${this.slain.some((u) => u.lord) ? 'Brought down' : 'Put down'} ${names(this.slain) || 'nothing, but held the ground'} ${where}.${fell.length ? ` ${fell.map((u) => u.name.split(' ')[0]).join(' and ')} fell and ${fell.length > 1 ? 'were' : 'was'} carried.` : ''}${mvp ? ` ${mvp.name.split(' ')[0]} did the most of it.` : ''}${closest && closest.tally.low < 0.2 ? ` ${closest.name.split(' ')[0]} finished on ${Math.max(1, Math.round(closest.tally.low * closest.maxhp))} life.` : ''}`);
        if (got.length) note(st, 'find', `Found on them: ${got.map((g) => g.replace(/<[^>]+>/g, '')).join(', ')}.`);
        this.report.close = !!fell.length || (closest && closest.tally.low < 0.2);
      } else note(st, 'fight', `Neither side could get at the other ${where}. Left them standing.`);
      for (const u of heroes) {
        const ups = this.xp ? gainXp(u.hero, u.alive ? this.xp : Math.round(this.xp / 2)) : 0;
        if (ups) { lines.push(`<b style="color:${u.color}">${esc(u.name)}</b> reaches level ${u.hero.lvl}.`); note(st, 'level', `${u.name} reached level ${u.hero.lvl}.`); sfx.level(); setTimeout(() => this.show.levelUp(u), 700); }
        if (how === 'win' && u.hero.hp <= 0) u.hero.hp = Math.max(1, Math.round(heroStats(u.hero).hp * 0.25));
      }
      const who = how === 'win' && heroes.find((u) => u.alive && HEROES[u.hero.heroId]);
      if (who) { const w = HEROES[who.hero.heroId].win; lines.push(`<i>“${esc(w[Math.floor(Math.random() * w.length)])}”</i> — ${esc(who.name)}`); }
      this.say(how === 'win' ? `<b>The dead lie still.</b> ${this.xp} experience, ${gold} gold.` : '<b>Nobody can get at anybody.</b> You leave them to it.', 'sys');
    } else if (how === 'lose') {
      sfx.lose(); music.stinger('fell'); sub = 'Lost · you wake at The Last Toll';
      this.show.end();
      const lost = Math.round(st.gold * 0.2); st.gold -= lost; st.stats.lost++;
      // whichever of them did the most of it has a score with the party now (main.js makes it a rival)
      const killer = this.units.filter((u) => u.side === 'foe' && !u.foe.extra && !u.gone).sort((a, b) => (b.alive - a.alive) || b.tally.dealt - a.tally.dealt)[0];
      if (killer) this.report.killer = { id: killer.id, kind: killer.zdef.id, lvl: killer.lvl, x: killer.foe.hx ?? killer.x, z: killer.foe.hz ?? killer.z, rival: killer.rival, lord: !!killer.lord };
      note(st, 'loss', `Lost to ${names(this.units.filter((u) => u.side === 'foe' && u.alive)) || 'the dead'} ${where}. Carried back to The Last Toll, ${lost} gold the lighter.`);
      lines.push(`Somebody carried you back to the Hollow. It cost you <b>${lost}</b> gold and most of your pride.`);
    } else { sfx.sheath(); this.show.end(); note(st, 'fight', `Ran from a fight ${where}.`); sub = 'You run'; lines.push('You get clear. They are still standing where you left them.'); }
    // a small window with what happened, not a title card
    this.resultEl.innerHTML = `<h3>${esc(sub)}</h3>${lines.map((l) => `<p>${l}</p>`).join('')}`;
    const b = el('button', 'btn', 'Continue');
    const done = () => { if (this.closed) return; this.closed = true; this.close(how); };
    b.onclick = done; this.resultEl.append(b);
    setTimeout(() => this.resultEl.classList.add('show'), hold);
    if (st.auto) setTimeout(done, 2200 + hold);
  }
  close(how) {
    this.r.shift = 0;
    this.show.clear();
    for (const u of this.units) if (u.model.userData.wyrmBase) u.model.scale.setScalar(u.model.userData.wyrmBase);
    for (const u of this.units) if (u.side === 'party') { sleep(u.model); this.r.units.remove(u.model); }
    enc.cleanup(this);
    this.chron.remove();
    this.hud.remove();
    const L = this.units.find((u) => u.id === this.st.party[0]);
    const standing = this.units.filter((u) => u.side === 'foe' && u.alive && u.foe).map((u) => u.id);
    this.g.endBattle(how, how === 'win' ? { x: L.x, z: L.z } : this.origin, this.slain.map((f) => f.id), { ...this.report, standing });
  }

  // ---- HUD ----
  buildHud() {
    this.hud = el('div', 'bt-hud');
    this.orderEl = el('div', 'bt-order'); this.menuEl = el('div', 'bt-menu'); this.infoEl = el('div', 'bt-info');
    this.bars = el('div', 'bt-bars'); this.floats = el('div', 'bt-floats'); this.resultEl = el('div', 'bt-result panel');
    this.hud.append(this.bars, this.floats, this.orderEl);
    this.chron = new CombatLog(this.hud);
    this.intentEl = el('div', 'bt-intent'); this.goalEl = el('div', 'bt-goal'); this.callEl = el('div', 'bt-call');
    this.hud.append(this.intentEl, this.goalEl, this.infoEl, this.menuEl, this.callEl, this.resultEl);
    document.getElementById('ui').append(this.hud);
    for (const u of this.units) this.addBar(u);
    this.show = new Show(this);
  }
  // The numbers, skill names and bands over the field are CSS animations timed for 2x: at 1x they play at half.
  paceWords() {
    const rate = this.g.pace;
    if (rate === 1 && this.wordPace === 1) return;
    this.wordPace = rate;
    for (const e of [this.floats, ...this.hud.querySelectorAll(':scope > .sk-ban, :scope > .cutin, :scope > .splash')])
      for (const a of e.getAnimations?.({ subtree: true }) || []) if (a.playbackRate !== rate) a.playbackRate = rate;
  }
  addBar(u) { u.bar = el('div', 'ubar ' + u.side, '<i></i><b></b>'); this.bars.append(u.bar); }
  drawOrder() {
    this.orderEl.innerHTML = '';
    this.order().forEach((u, i) => this.orderEl.append(el('div', 'ord ' + u.side + (i === 0 ? ' now' : ''), `<span style="border-color:${u.color}">${esc(u.name.split(' ')[0])}</span>`)));
  }
  pointer(px, py, click) {
    if (this.over) return;
    const t = this.r.pick(px, py, this.tiles);
    if (!t) return;
    if (!this.hover || this.hover.x !== t.x || this.hover.z !== t.z) { this.hover = t; this.cursor = { x: t.x, z: t.z }; this.preview(t.x, t.z); }
    if (click) this.tile(t.x, t.z);
  }
  dir(d) {
    if (this.over || !this.cursor) return;
    const [dx, dz] = DPAD[this.st.dpad][d];
    const x = clamp(this.cursor.x + dx, this.b.x0, this.b.x1), z = clamp(this.cursor.z + dz, this.b.z0, this.b.z1);
    this.cursor = { x, z }; this.preview(x, z);
    const o = this.unitAt(x, z); if (o && this.sel.mode !== 'target') this.inspect(o);
  }
  confirm() { if (this.cursor) this.tile(this.cursor.x, this.cursor.z); }

  // dt is the fight's clock (slowed at 1x); cam is the frame's own, so the camera keeps up with the player's cursor
  update(dt, cam = dt) {
    this.show.tick(dt);
    this.paceWords();
    for (const u of this.units) {
      animate(u.model, dt);
      // the wyrm: a quarter as big again while it lasts
      if (u.alive) {
        const m = u.model, ud = m.userData;
        if (this.has(u, 'wyrm') && !ud.wyrmBase) ud.wyrmBase = m.scale.x;
        if (ud.wyrmBase) {
          const want = ud.wyrmBase * (this.has(u, 'wyrm') ? 1.25 : 1);
          m.scale.setScalar(m.scale.x + (want - m.scale.x) * Math.min(1, dt * 6));
          if (!this.has(u, 'wyrm') && Math.abs(m.scale.x - want) < 0.002) { m.scale.setScalar(want); ud.wyrmBase = 0; }
        }
      }
      if (!u.bar) continue;
      if (!u.alive) { u.bar.style.display = 'none'; continue; }
      const p = this.r.project(u.model.position.x, u.model.position.y + (u.model.userData.height || 1.5) + 0.12, u.model.position.z);
      u.bar.style.display = ''; u.bar.style.transform = `translate(${p.x}px,${p.y}px)`;
      u.bar.firstChild.style.width = (100 * u.hp / u.maxhp) + '%';
      u.bar.lastChild.style.width = u.maxmp ? (100 * u.mp / u.maxmp) + '%' : '0';
    }
    // how each of them stands while waiting: reeling if stunned, bent double if nearly done for, braced if guarding
    if (!this.over) for (const u of this.units) if (u.alive) setRest(u.model, this.has(u, 'stun') ? 'stunned' : u.hp < u.maxhp * 0.3 ? 'wounded' : this.has(u, 'guard') ? 'guard' : 'idle');
    const a = this.active, mode = this.sel.mode;
    const focus = this.camAt ? this.camAt : (mode === 'target' || mode === 'move' || mode === 'place' || mode === 'menu') && this.cursor ? { x: this.cursor.x, y: this.w.y(this.cursor.x, this.cursor.z), z: this.cursor.z } : a ? a.model.position : this.origin;
    this.r.follow(focus.x, focus.y || 0, focus.z, cam * (this.camAt ? 1.4 : 0.6));
    // whoever is moving or swinging sits a quarter of the screen down, under their skill's name
    const low = !this.camAt && focus === a?.model.position && mode !== 'over' ? 0.25 : 0;
    this.r.shift += (low - this.r.shift) * (1 - Math.exp(-cam * 4));
    const ban = this.show.ban;
    if (ban?.b.isConnected) { const m = ban.u.model, p = this.r.project(m.position.x, m.position.y + (m.userData.height || 1.5) + 0.12, m.position.z); ban.b.style.left = p.x + 'px'; ban.b.style.top = p.y + 'px'; }
    if (this.cursor && mode !== 'wait' && mode !== 'over') this.r.setCursor(this.cursor.x, this.cursor.z); else this.r.setCursor(null);
    if (a && a.alive && mode !== 'place' && mode !== 'over') this.r.setTurnRing(Math.round(a.model.position.x), Math.round(a.model.position.z));
    this.r.updateFade(this.units.filter((u) => u.alive).map((u) => ({ x: u.model.position.x, z: u.model.position.z, y: u.model.position.y })), this.b);
  }
}
