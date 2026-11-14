// The fight. It happens where everyone is standing: the walk stops, the party is placed round the
// leader, and then it is turns, Final Fantasy Tactics style. Speed fills each unit's clock; a turn is
// a move and an act in either order; height, facing and reach all matter.
import { el, esc, manhattan, clamp } from '../core/util.js';
import { CLASSES, STATUS, SUMMONS } from '../data/classes.js';
import { CONSUMABLES, rollLoot, itemName, RARITY } from '../data/items.js';
import { zombieStats } from '../data/enemies.js';
import { HEROES } from '../data/cast.js';
import { heroStats, heroSkills, basicAttack, gainXp, noteKill, partyHeroes } from './party.js';
import { heroModel } from './explore.js';
import { makeSummon, shadowDisc, setAnim, setRest, animate } from '../gfx/models.js';
import { DPAD } from '../core/input.js';
import { sfx } from '../core/audio.js';

const K = (x, z) => x + ',' + z;
const ITEM_SKILLS = {
  potion: { id: 'item_potion', item: 'potion', name: CONSUMABLES.potion.name, cost: 0, r: [0, 1], aoe: 0, at: 'ally', kind: 'item' },
  ether: { id: 'item_ether', item: 'ether', name: CONSUMABLES.ether.name, cost: 0, r: [0, 1], aoe: 0, at: 'ally', kind: 'item' },
  tonic: { id: 'item_tonic', item: 'tonic', name: CONSUMABLES.tonic.name, cost: 0, r: [1, 1], aoe: 0, at: 'fallen', kind: 'item' },
};

export class Battle {
  constructor(g, foes, alerted) {
    this.g = g; this.st = g.st; this.w = g.world; this.r = g.r;
    this.units = []; this.over = false; this.lock = false; this.xp = 0; this.slain = []; this.log = [];
    this.sel = { mode: 'place' }; this.active = null; this.cursor = null; this.hover = null;
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
    // where the party may be placed: a few steps round the leader
    this.spots = this.flood(L.x, L.z, 3).filter((t) => !this.unitAt(t.x, t.z));
    partyHeroes(this.st).forEach((h, i) => { const s = this.spots[Math.min(i, this.spots.length - 1)]; this.addHero(h, s.x, s.z); });
    for (const u of this.units) if (u.side === 'party') this.faceTo(u, alerted.x, alerted.zz);

    this.buildHud();
    this.cursor = { x: L.x, z: L.z };
    if (this.st.auto) this.begin(); else this.showPlacement();
  }

  // ---- units ----
  addHero(h, x, z) {
    const s = heroStats(h), C = CLASSES[h.cls], rage = C.resource === 'rage';
    const model = heroModel(h); model.add(shadowDisc()); this.r.units.add(model);
    const u = { id: h.id, side: 'party', hero: h, name: h.name, lvl: h.lvl, x, z, s, hp: Math.max(1, Math.min(h.hp, s.hp)), mp: rage ? 0 : Math.min(h.mp, s.mp), maxhp: s.hp, maxmp: s.mp,
      skills: heroSkills(h), basic: basicAttack(h), ct: Math.random() * 30, st: [], model, alive: true, ai: false, rage, color: C.color, face: [0, -1] };
    this.place(u); this.units.push(u); return u;
  }
  addFoe(f) {
    const s = zombieStats(f.kind, f.level);
    const u = { id: f.id, side: 'foe', foe: f, zdef: f.z, name: f.z.name, lvl: f.level, x: f.x, z: f.zz, s, hp: s.hp, mp: 0, maxhp: s.hp, maxmp: 0,
      skills: f.z.skills, basic: null, ct: f.z.ambush ? 100 : Math.random() * 25, st: [], model: f.model, alive: true, ai: true, undead: true, color: '#9aa88a', face: [0, 1] };
    this.place(u); this.units.push(u); return u;
  }
  addSummon(caster, kind, x, z) {
    const d = SUMMONS[kind];
    for (const o of this.units) if (o.alive && o.owner === caster.id && o.kind === kind) this.kill(o, null, true);   // one of each at a time
    const pow = Math.max(caster.s.atk, caster.s.mag);
    const s = { hp: Math.round(caster.maxhp * d.hp), mp: 0, atk: Math.round(pow * d.atk), mag: Math.round(pow * d.atk), def: Math.round(caster.s.def * 0.7), res: Math.round(caster.s.res * 0.7), spd: caster.s.spd, move: d.move, jump: d.jump, crit: 3, leech: 0 };
    const model = makeSummon(d.model); model.add(shadowDisc(0.3)); this.r.units.add(model);
    const basic = { id: 'attack', name: d.kind === 'heal' ? 'Mend' : 'Attack', cost: 0, r: d.r, aoe: 0, at: d.kind === 'heal' ? 'ally' : 'enemy', kind: d.kind, pow: 1, basic: true };
    const u = { id: caster.id + '_' + kind, side: caster.side, owner: caster.id, kind, summon: true, name: d.name, lvl: caster.lvl, x, z, s, hp: s.hp, mp: 0, maxhp: s.hp, maxmp: 0,
      skills: [], basic, ct: 40, st: [], model, alive: true, ai: true, undead: kind === 'skeleton' || kind === 'ghoul', color: caster.color, face: caster.face };
    this.place(u); this.units.push(u); this.addBar(u); return u;
  }
  place(u) { u.model.visible = true; u.model.position.set(u.x, this.w.y(u.x, u.z), u.z); }
  faceTo(u, x, z) { const dx = x - u.x, dz = z - u.z; if (!dx && !dz) return; u.face = Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)]; u.model.rotation.y = Math.atan2(dx, dz); }
  unitAt(x, z) { return this.units.find((u) => u.alive && u.x === x && u.z === z); }
  inBounds(x, z) { return x >= this.b.x0 && x <= this.b.x1 && z >= this.b.z0 && z <= this.b.z1; }
  open(x, z) { return this.inBounds(x, z) && this.w.walkable(x, z) && !this.g.explore.npcAt.has(z * this.w.N + x); }
  has(u, id) { return u.st.some((s) => s.id === id); }
  foesOf(u) { return this.units.filter((o) => o.alive && o.side !== u.side); }
  friendsOf(u) { return this.units.filter((o) => o.alive && o.side === u.side); }

  // tiles within n steps of a point, ignoring units (for placement)
  flood(x, z, n) {
    const seen = new Map([[K(x, z), { x, z, d: 0 }]]), q = [{ x, z, d: 0 }];
    for (let i = 0; i < q.length; i++) {
      const c = q[i]; if (c.d >= n) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
    const out = [];
    for (let dz = -sk.r[1]; dz <= sk.r[1]; dz++) for (let dx = -sk.r[1]; dx <= sk.r[1]; dx++) {
      const d = Math.abs(dx) + Math.abs(dz);
      if (d < sk.r[0] || d > sk.r[1] || !this.inBounds(x + dx, z + dz)) continue;
      out.push({ x: x + dx, z: z + dz });
    }
    return out;
  }
  aoeTiles(sk, x, z) {
    const out = [];
    for (let dz = -sk.aoe; dz <= sk.aoe; dz++) for (let dx = -sk.aoe; dx <= sk.aoe; dx++) if (Math.abs(dx) + Math.abs(dz) <= sk.aoe && this.inBounds(x + dx, z + dz)) out.push({ x: x + dx, z: z + dz });
    return out;
  }
  // who a skill aimed at (x,z) would touch
  affected(u, sk, x, z) {
    const good = sk.kind === 'heal' || sk.kind === 'buff' || (sk.kind === 'item' && sk.at !== 'fallen');
    if (sk.at === 'fallen') return this.units.filter((o) => !o.alive && o.hero && o.x === x && o.z === z && !this.unitAt(x, z));
    const out = [];
    for (const t of this.aoeTiles(sk, x, z)) { const o = this.unitAt(t.x, t.z); if (o && (o.side === u.side) === good) out.push(o); }
    return out;
  }
  validTarget(u, sk, x, z) {
    if (sk.kind === 'summon') return this.open(x, z) && !this.unitAt(x, z);
    return this.affected(u, sk, x, z).length > 0;
  }

  // ---- numbers ----
  // What a blow would do. `sure` leaves out luck (for forecasts and the AI).
  damage(a, t, sk, sure = false, from = a) {
    const magic = sk.kind === 'magic';
    let v = (magic ? a.s.mag : a.s.atk) * sk.pow * 100 / (100 + (magic ? t.s.res : t.s.def) * 4);
    if (this.has(a, 'might')) v *= 1.3;
    if (this.has(a, 'weaken')) v *= 0.7;
    if (this.has(t, 'guard')) v *= 0.6;
    if (this.has(t, 'curse')) v *= 1.3;
    if (sk.el === 'holy' && t.undead) v *= 1.5;
    const dx = from.x - t.x, dz = from.z - t.z, dot = Math.sign(dx) * t.face[0] + Math.sign(dz) * t.face[1];
    let side = '';
    if (!sk.aoe) { if (dot < 0) { v *= 1.25; side = 'back'; } else if (dot === 0) { v *= 1.1; side = 'side'; } }
    const dh = this.w.height(from.x, from.z) - this.w.height(t.x, t.z);
    if (dh >= 2) v *= 1.15; else if (dh <= -2) v *= 0.9;
    let crit = false;
    if (!sure) { v *= 0.92 + Math.random() * 0.16; if (Math.random() * 100 < (a.s.crit || 0)) { v *= 1.5; crit = true; } }
    return { n: Math.max(1, Math.round(v)), crit, side };
  }
  healing(a, sk) { return Math.round(a.s.mag * sk.pow + 4 + a.lvl); }

  // ---- doing things ----
  wait(ms) { return new Promise((r) => setTimeout(r, ms / (this.st.auto ? 1.7 : 1))); }
  say(text) { this.log.push(text); if (this.log.length > 4) this.log.shift(); this.logEl.innerHTML = this.log.map((l) => `<div>${l}</div>`).join(''); }
  float(u, text, cls = '') {
    const p = this.r.project(u.model.position.x, u.model.position.y + (u.model.userData.height || 1.5) + 0.2, u.model.position.z);
    const e = el('div', 'float ' + cls, esc(text));
    e.style.left = p.x + 'px'; e.style.top = p.y + 'px';
    this.floats.append(e); setTimeout(() => e.remove(), 1100);
  }
  addStatus(t, st) {
    if (!st || !t.alive || Math.random() > st[2]) return;
    const cur = t.st.find((s) => s.id === st[0]);
    if (cur) cur.turns = Math.max(cur.turns, st[1]); else t.st.push({ id: st[0], turns: st[1] });
    this.float(t, STATUS[st[0]].name, STATUS[st[0]].bad ? 'bad' : 'good');
  }
  hurt(t, n, by, cls = '') {
    t.hp = Math.max(0, t.hp - n);
    this.float(t, '-' + n, 'dmg ' + cls);
    setAnim(t.model, 'hit', 0.3);
    if (t.rage) t.mp = Math.min(100, t.mp + 10);
    if (t.hp <= 0) this.kill(t, by);
  }
  mend(t, n) { const v = Math.min(n, t.maxhp - t.hp); t.hp += v; this.float(t, '+' + v, 'heal'); }
  kill(u, by, quiet = false) {
    if (!u.alive) return;
    u.alive = false; u.hp = 0; u.st = [];
    setAnim(u.model, 'dead');
    if (!quiet) { sfx.die(); this.say(`<b>${esc(u.name)}</b> ${u.side === 'foe' ? 'goes down and stays down.' : u.summon ? 'is gone.' : 'has fallen.'}`); }
    if (u.summon) setTimeout(() => { this.r.units.remove(u.model); }, 700);
    if (u.side === 'foe') {
      this.xp += u.s.xp; this.slain.push(u); this.st.slain[u.id] = this.st.day; noteKill(this.st, u.zdef.id);
      if (u.zdef.burst) {
        this.say('The bonesack bursts.');
        for (const o of this.units) if (o.alive && o.side !== 'foe' && manhattan(o.x, o.z, u.x, u.z) <= 1) { this.hurt(o, Math.max(1, Math.round(u.s.atk * 0.5)), null); this.addStatus(o, ['poison', 3, 1]); }
      }
    }
    if (u.hero) u.hero.hp = 0;
  }

  async moveTo(u, tile) {
    const path = []; for (let t = tile; t && t.prev; t = t.prev) path.unshift(t);
    setAnim(u.model, 'walk');
    for (const t of path) {
      const fx = u.model.position.x, fy = u.model.position.y, fz = u.model.position.z, ty = this.w.y(t.x, t.z), hop = Math.abs(ty - fy) > 0.3 ? 0.5 : 0;
      u.model.rotation.y = Math.atan2(t.x - fx, t.z - fz); u.face = [Math.sign(Math.round(t.x - fx)), Math.sign(Math.round(t.z - fz))];
      await this.g.tween(hop ? 0.22 : 0.12, (k) => u.model.position.set(fx + (t.x - fx) * k, fy + (ty - fy) * k + Math.sin(Math.PI * k) * hop, fz + (t.z - fz) * k));
      u.x = t.x; u.z = t.z;
    }
    setAnim(u.model, 'idle');
    u.moved = true;
  }

  async act(u, sk, tx, tz) {
    this.faceTo(u, tx, tz);
    if (sk.item) this.st.consum[sk.item]--;
    else if (u.side === 'party' && !u.summon) u.mp = Math.max(0, u.mp - sk.cost);
    this.say(`<b style="color:${u.color}">${esc(u.name)}</b>: ${esc(sk.name)}`);
    if (u.hero && HEROES[u.hero.heroId] && Math.random() < 0.16) this.g.ui.toast(HEROES[u.hero.heroId].barks[Math.floor(Math.random() * HEROES[u.hero.heroId].barks.length)], u.name);
    const from = { x: u.x, z: u.z };
    if (sk.dash) {                                        // land beside the target
      let best = null;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = tx + dx, Z = tz + dz;
        if (!this.open(X, Z) || (this.unitAt(X, Z) && this.unitAt(X, Z) !== u)) continue;
        const d = manhattan(X, Z, u.x, u.z);
        if (!best || d < best.d) best = { x: X, z: Z, d };
      }
      if (best && (best.x !== u.x || best.z !== u.z)) {
        const fx = u.x, fz = u.z, fy = u.model.position.y, ty = this.w.y(best.x, best.z);
        sfx.jump();
        await this.g.tween(0.36, (k) => u.model.position.set(fx + (best.x - fx) * k, fy + (ty - fy) * k + Math.sin(Math.PI * k) * 2.2, fz + (best.z - fz) * k));
        u.x = best.x; u.z = best.z; from.x = u.x; from.z = u.z; this.faceTo(u, tx, tz);
      }
    }
    const spell = sk.kind !== 'phys';
    setAnim(u.model, sk.item ? 'item' : sk.anim || (spell ? 'cast' : 'attack'), 0.5, spell ? 'cast' : 'attack');
    (sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'item' ? sfx.heal : spell ? sfx.cast : sfx.ui)();
    await this.wait(260);
    if (sk.kind === 'summon') { const s = this.addSummon(u, sk.summon, tx, tz); this.faceTo(s, tx + u.face[0], tz + u.face[1]); this.float(s, s.name, 'good'); }
    else if (sk.kind === 'item') {
      for (const t of this.affected(u, sk, tx, tz)) {
        if (sk.item === 'potion') this.mend(t, Math.round(t.maxhp * 0.45));
        else if (sk.item === 'ether') { t.mp = Math.min(t.maxmp, t.mp + Math.round(t.maxmp * 0.45)); this.float(t, 'Mana', 'good'); }
        else { t.alive = true; t.hp = Math.round(t.maxhp / 3); t.hero.hp = t.hp; t.ct = 0; setAnim(t.model, 'revive'); this.float(t, 'Up!', 'heal'); }
      }
    } else {
      for (let h = 0; h < (sk.hits || 1); h++) {
        const targets = this.affected(u, sk, tx, tz);
        if (h && !targets.length) break;
        if (sk.kind === 'phys' || sk.kind === 'magic') sfx.hit();
        for (const t of targets) {
          if (sk.kind === 'heal') this.mend(t, this.healing(u, sk));
          else if (sk.kind === 'buff') { this.addStatus(t, sk.st); this.addStatus(t, sk.st2); }
          else if (sk.kind === 'debuff') this.addStatus(t, sk.st);
          else {
            const d = this.damage(u, t, sk, false, from);
            this.hurt(t, d.n, u, d.crit ? 'crit' : d.side);
            const take = (sk.drain || 0) + (u.s.leech || 0) / 100;
            if (take && u.alive) this.mend(u, Math.max(1, Math.round(d.n * take)));
            this.addStatus(t, sk.st);
          }
        }
        if (sk.allyHeal) for (const t of this.aoeTiles(sk, tx, tz)) { const o = this.unitAt(t.x, t.z); if (o && o.side === u.side && o.hp < o.maxhp) this.mend(o, Math.round(u.s.mag * sk.allyHeal)); }
        if (h < (sk.hits || 1) - 1) await this.wait(170);
      }
    }
    if (u.rage && sk.rage) u.mp = Math.min(100, u.mp + sk.rage);
    u.acted = true;
    await this.wait(380);
    this.checkOver();
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
    this.g.ui.banner('Battle', `${this.foesOf({ side: 'party' }).length} of the dead`);
    this.run();
  }
  async run() {
    await this.wait(500);
    while (!this.over) {
      const u = this.nextUp();
      this.active = u; u.moved = false; u.acted = false;
      this.drawOrder();
      // what was done to them last turn comes due
      let skip = false;
      for (const s of [...u.st]) {
        const S = STATUS[s.id];
        if (S.dot) this.hurt(u, Math.max(1, Math.ceil(u.maxhp * S.dot)), null, 'dot');
        if (S.hot && u.alive) this.mend(u, Math.ceil(u.maxhp * S.hot));
        if (s.id === 'stun') skip = true;
        if (--s.turns <= 0) u.st = u.st.filter((o) => o !== s);
      }
      this.checkOver();
      if (this.over) break;
      if (!u.alive) continue;
      if (skip) { this.float(u, 'Stunned', 'bad'); u.ct -= 100; await this.wait(500); continue; }
      if (u.ai || this.st.auto) await this.aiTurn(u); else await this.playerTurn(u);
      u.ct -= u.moved && u.acted ? 100 : u.moved || u.acted ? 80 : 60;
      this.r.clearHighlights(); this.menuEl.innerHTML = '';
    }
  }
  checkOver() {
    if (this.over) return;
    const foes = this.units.some((u) => u.alive && u.side === 'foe'), us = this.units.some((u) => u.alive && u.hero);
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
    for (const sk of u.skills) btn(sk.name, () => this.cmdSkill(sk), u.acted || sk.cost > u.mp, sk.cost ? `${sk.cost} ${u.rage ? 'rage' : 'mp'}` : 'free').title = sk.desc || '';
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
    this.r.highlight(this.sel.tiles, sk.kind === 'heal' || sk.kind === 'buff' || sk.kind === 'item' || sk.kind === 'summon' ? 'heal' : 'attack');
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
    this.r.highlight(this.aoeTiles(s.sk, x, z), 'aoe', 'aoe');
    const hit = this.affected(u, s.sk, x, z);
    const lines = hit.map((t) => {
      if (s.sk.kind === 'phys' || s.sk.kind === 'magic') { const d = this.damage(u, t, s.sk, true); const n = d.n * (s.sk.hits || 1); return `${esc(t.name)}: <b class="dmg">-${n}</b>${d.side ? ' (' + d.side + ')' : ''}${n >= t.hp ? ' <b>kills</b>' : ''}`; }
      if (s.sk.kind === 'heal') return `${esc(t.name)}: <b class="heal">+${Math.min(this.healing(u, s.sk), t.maxhp - t.hp)}</b>`;
      return `${esc(t.name)}${s.sk.st ? ': ' + STATUS[s.sk.st[0]].name + ' ' + Math.round(s.sk.st[2] * 100) + '%' : ''}`;
    });
    if (lines.length) this.infoEl.innerHTML = lines.join('<br>');
  }
  // a tile was chosen (by click, tap, or the d-pad and A)
  async tile(x, z) {
    if (this.lock || this.over) return;
    const s = this.sel, u = this.active;
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
    const st = o.st.map((s) => `<span style="color:${STATUS[s.id].color}">${STATUS[s.id].name} ${s.turns}</span>`).join(' ');
    this.infoEl.innerHTML = `<b>${esc(o.name)}</b> Lv ${o.lvl}<br>Life ${o.hp}/${o.maxhp}${o.maxmp ? ` · ${o.rage ? 'Rage' : 'Mana'} ${o.mp}/${o.maxmp}` : ''}<br>Atk ${o.s.atk} · Mag ${o.s.mag} · Arm ${o.s.def} · Ward ${o.s.res} · Spd ${o.s.spd}<br>Move ${o.s.move} · Jump ${o.s.jump}${st ? '<br>' + st : ''}${o.zdef ? `<br><i>${esc(o.zdef.blurb)}</i>` : ''}`;
  }

  // ---- placing the party before it starts ----
  showPlacement() {
    this.sel = { mode: 'place', pick: this.units.find((u) => u.side === 'party') };
    this.drawPlacement();
    this.g.ui.banner('Place your party', 'Tap one of yours, then a green tile');
  }
  drawPlacement() {
    const m = this.menuEl, s = this.sel;
    this.r.clearHighlights(); this.r.highlight(this.spots, 'place');
    m.innerHTML = '';
    m.append(el('div', 'bt-hint', 'The dead have seen you. Set your line: choose one of yours, then a green tile.'));
    for (const u of this.units.filter((u) => u.side === 'party')) {
      const b = el('button', 'bt-btn' + (s.pick === u ? ' sel' : ''), `${esc(u.name)}<small>${esc(CLASSES[u.hero.cls].name)}</small>`);
      b.onclick = () => { s.pick = u; this.cursor = { x: u.x, z: u.z }; this.drawPlacement(); };
      m.append(b);
    }
    const go = el('button', 'bt-btn go', 'Begin'); go.onclick = () => { sfx.ui(); this.begin(); }; m.append(go);
    if (s.pick) this.r.setTurnRing(s.pick.x, s.pick.z);
  }
  placeAt(x, z) {
    const s = this.sel, o = this.unitAt(x, z);
    if (o && o.side === 'party' && o !== s.pick && !this.spots.some((t) => t.x === x && t.z === z && s.pick)) { s.pick = o; return this.drawPlacement(); }
    if (!this.spots.some((t) => t.x === x && t.z === z)) { if (o && o.side === 'party') { s.pick = o; this.drawPlacement(); } return; }
    if (!s.pick) return;
    if (o && o.side === 'party' && o !== s.pick) { o.x = s.pick.x; o.z = s.pick.z; this.place(o); }
    else if (o && o !== s.pick) return sfx.deny();
    s.pick.x = x; s.pick.z = z; this.place(s.pick);
    sfx.ui(); this.drawPlacement();
  }

  // ---- the AI: used by the dead, by summons, and by the party when Auto is on ----
  plan(u) {
    const foes = this.foesOf(u), friends = this.friendsOf(u);
    const R = u.moved ? [{ x: u.x, z: u.z, d: 0, prev: null }] : [...this.reach(u).values()].filter((t) => !t.pass || (t.x === u.x && t.z === u.z));
    const skills = [];
    if (!u.acted) { if (u.basic) skills.push(u.basic); for (const sk of u.skills) if (u.side === 'foe' || u.summon || sk.cost <= u.mp) skills.push(sk); }
    const nearFoe = (x, z) => foes.reduce((m, f) => Math.min(m, manhattan(x, z, f.x, f.z)), 99);
    let best = { score: 0 };
    const real = { x: u.x, z: u.z };
    for (const t of R) {
      const gap = nearFoe(t.x, t.z);
      for (const sk of skills) {
        let centres;
        if (sk.at === 'self') centres = [t];
        else if (sk.kind === 'summon') {
          if (this.units.some((o) => o.alive && o.owner === u.id && o.kind === sk.summon) || !foes.length) continue;
          const c = this.rangeTiles(sk, t.x, t.z).filter((c) => this.open(c.x, c.z) && !this.unitAt(c.x, c.z) && !(c.x === t.x && c.z === t.z)).sort((a, b) => nearFoe(a.x, a.z) - nearFoe(b.x, b.z))[0];
          if (c && 14 - t.d * 0.05 > best.score) best = { score: 14 - t.d * 0.05, tile: t, sk, x: c.x, z: c.z };
          continue;
        } else centres = (sk.at === 'ally' ? friends : foes).filter((o) => { const d = manhattan(t.x, t.z, o === u ? t.x : o.x, o === u ? t.z : o.z); return d >= sk.r[0] && d <= sk.r[1]; }).map((o) => (o === u ? t : o));
        for (const c of centres) {
          u.x = t.x; u.z = t.z;                             // judge it as if already standing there
          let score = 0;
          for (const o of this.affected(u, sk, c.x, c.z)) {
            if (sk.kind === 'phys' || sk.kind === 'magic') { const n = this.damage(u, o, sk, true).n * (sk.hits || 1); score += Math.min(n, o.hp) + (n >= o.hp ? 14 : 0) + (sk.st ? 2 : 0); }
            else if (sk.kind === 'heal') { const miss = o.maxhp - o.hp; if (miss > o.maxhp * 0.25) score += Math.min(miss, this.healing(u, sk)) * 1.1; }
            else if (sk.st && !this.has(o, sk.st[0])) score += (sk.st[0] === 'stun' || sk.st[0] === 'root' ? 9 : 6) * (foes.length ? 1 : 0);
          }
          if (sk.allyHeal) for (const a of this.aoeTiles(sk, c.x, c.z)) { const o = this.unitAt(a.x, a.z); if (o && o.side === u.side && o.hp < o.maxhp * 0.7) score += 4; }
          u.x = real.x; u.z = real.z;
          if (score <= 0) continue;
          score += (sk.r[1] > 1 ? Math.min(gap, 4) * 0.4 : 0) - t.d * 0.05 - (sk.cost || 0) * 0.05;
          if (score > best.score) best = { score, tile: t, sk, x: c.x, z: c.z };
        }
      }
    }
    if (best.sk) return best;
    // nothing worth doing from anywhere in reach: close the distance
    let to = null, bd = nearFoe(u.x, u.z);
    for (const t of R) { const d = nearFoe(t.x, t.z); if (d < bd || (d === bd && to && t.d < to.d)) { bd = d; to = t; } }
    return { tile: to };
  }
  async aiTurn(u) {
    this.r.setTurnRing(u.x, u.z);
    await this.wait(240);
    const p = this.plan(u);
    if (p.tile && (p.tile.x !== u.x || p.tile.z !== u.z) && !u.moved) { this.r.setTurnRing(null); await this.moveTo(u, p.tile); }
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
    this.menuEl.innerHTML = ''; this.infoEl.innerHTML = '';
    const st = this.st, lines = [];
    const heroes = this.units.filter((u) => u.hero);
    for (const u of heroes) { u.hero.hp = u.alive ? u.hp : 0; if (!u.rage) u.hero.mp = u.mp; }
    let title, sub;
    if (how === 'win') {
      sfx.win(); title = 'The dead lie still'; sub = `${this.slain.length} put down`;
      for (const u of heroes) if (u.alive) { setRest(u.model, 'idle'); setAnim(u.model, 'cheer'); }
      let gold = 0; const got = [];
      for (const f of this.slain) {
        const loot = rollLoot(f.lvl); gold += loot.gold;
        for (const it of loot.items) { if (st.bag.length < st.bagSize) { st.bag.push(it); got.push(`<span style="color:${RARITY[it.rarity].color}">${esc(itemName(it))}</span>`); } else got.push('<i>a find you had no room for</i>'); }
        for (const gm of loot.gems) { st.gems[gm] = (st.gems[gm] || 0) + 1; got.push('a gem'); }
      }
      st.gold += gold;
      lines.push(`Each of you earns <b>${this.xp}</b> experience. You find <b>${gold}</b> gold.`);
      if (got.length) lines.push('Found: ' + got.join(', '));
      for (const u of heroes) {
        const ups = gainXp(u.hero, u.alive ? this.xp : Math.round(this.xp / 2));
        if (ups) { lines.push(`<b style="color:${u.color}">${esc(u.name)}</b> reaches level ${u.hero.lvl}.`); sfx.level(); }
        if (u.hero.hp <= 0) u.hero.hp = Math.max(1, Math.round(heroStats(u.hero).hp * 0.25));
      }
      const who = heroes.find((u) => u.alive && HEROES[u.hero.heroId]);
      if (who) { const w = HEROES[who.hero.heroId].win; lines.push(`<i>“${esc(w[Math.floor(Math.random() * w.length)])}”</i> — ${esc(who.name)}`); }
    } else if (how === 'lose') {
      sfx.lose(); title = 'The pines keep what they take'; sub = 'You wake at The Last Toll';
      const lost = Math.round(st.gold * 0.2); st.gold -= lost;
      lines.push(`Somebody carried you back to the Hollow. It cost you <b>${lost}</b> gold and most of your pride.`);
    } else { title = 'You run'; sub = 'The dead do not hurry'; lines.push('You get clear. They are still standing where you left them.'); }
    this.resultEl.innerHTML = `<h2>${title}</h2><p class="sub">${sub}</p>${lines.map((l) => `<p>${l}</p>`).join('')}`;
    const b = el('button', 'btn', 'Continue');
    const done = () => { if (this.closed) return; this.closed = true; this.close(how); };
    b.onclick = done; this.resultEl.append(b); this.resultEl.classList.add('show');
    if (st.auto) setTimeout(done, 2200);
  }
  close(how) {
    for (const u of this.units) if (u.side === 'party') this.r.units.remove(u.model);
    this.hud.remove();
    const L = this.units.find((u) => u.id === this.st.party[0]);
    this.g.endBattle(how, how === 'win' ? { x: L.x, z: L.z } : this.origin, this.slain.map((f) => f.id));
  }

  // ---- HUD ----
  buildHud() {
    this.hud = el('div', 'bt-hud');
    this.orderEl = el('div', 'bt-order'); this.menuEl = el('div', 'bt-menu'); this.infoEl = el('div', 'bt-info');
    this.logEl = el('div', 'bt-log'); this.bars = el('div', 'bt-bars'); this.floats = el('div', 'bt-floats'); this.resultEl = el('div', 'bt-result panel');
    this.hud.append(this.bars, this.floats, this.orderEl, this.logEl, this.infoEl, this.menuEl, this.resultEl);
    document.getElementById('ui').append(this.hud);
    for (const u of this.units) this.addBar(u);
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

  update(dt) {
    for (const u of this.units) {
      animate(u.model, dt);
      if (!u.bar) continue;
      if (!u.alive) { u.bar.style.display = 'none'; continue; }
      const p = this.r.project(u.model.position.x, u.model.position.y + (u.model.userData.height || 1.5) + 0.12, u.model.position.z);
      u.bar.style.display = ''; u.bar.style.transform = `translate(${p.x}px,${p.y}px)`;
      u.bar.firstChild.style.width = (100 * u.hp / u.maxhp) + '%';
      u.bar.lastChild.style.width = u.maxmp ? (100 * u.mp / u.maxmp) + '%' : '0';
    }
    // how each of them stands while waiting: reeling if stunned, bent double if nearly done for
    if (!this.over) for (const u of this.units) if (u.alive) setRest(u.model, this.has(u, 'stun') ? 'stunned' : u.hp < u.maxhp * 0.3 ? 'wounded' : 'idle');
    const a = this.active, mode = this.sel.mode;
    const focus = (mode === 'target' || mode === 'move' || mode === 'place' || mode === 'menu') && this.cursor ? { x: this.cursor.x, y: this.w.y(this.cursor.x, this.cursor.z), z: this.cursor.z } : a ? a.model.position : this.origin;
    this.r.follow(focus.x, focus.y || 0, focus.z, dt * 0.6);
    if (this.cursor && mode !== 'wait' && mode !== 'over') this.r.setCursor(this.cursor.x, this.cursor.z); else this.r.setCursor(null);
    if (a && a.alive && mode !== 'place' && mode !== 'over') this.r.setTurnRing(Math.round(a.model.position.x), Math.round(a.model.position.z));
    this.r.updateFade(this.units.filter((u) => u.alive).map((u) => ({ x: u.model.position.x, z: u.model.position.z, y: u.model.position.y })), this.b);
  }
}
