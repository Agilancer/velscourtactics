// Walking the world: the leader moves a tile at a time, the rest of the party follows in a chain,
// each copying what the one ahead did a step ago, jumps included. Townsfolk stand about; the dead watch.
import { TOWN, N } from '../world/map.js';
import { DPAD } from '../core/input.js';
import { makePerson, makeZombie, withOverride, shadowDisc, label, setAnim, animate } from '../gfx/models.js';
import { FOLK, HEROES, ROAD_END, LISANDRA_CHAT } from '../data/cast.js';
import { ZOMBIES } from '../data/enemies.js';
import { sfx } from '../core/audio.js';
import { pick } from '../core/util.js';

const WALK = 0.15, HOP = 0.3;
const key = (x, z) => z * N + x;

export function heroModel(h) {
  const d = h.heroId && HEROES[h.heroId];
  const m = makePerson({ cls: h.cls, g: h.g });
  return withOverride(d?.model || `${h.cls}_${h.g}`, m);
}

export class Explore {
  constructor(g) {
    this.g = g;
    this.actors = []; this.npcs = []; this.foes = [];
    this.npcAt = new Map(); this.foeAt = new Map();
    this.moves = []; this.step = null; this.face = [0, -1];
    this.busy = false; this.grace = 0; this.jumpQueued = false; this.chatT = 50; this.inTown = null;
    this.spawnFoes();
    this.spawnNpcs();
    this.rebuildParty();
  }

  // ---- who is standing where ----
  spawnNpcs() {
    const { world, r, st } = this.g;
    for (const n of this.npcs) r.units.remove(n.model);
    this.npcs = []; this.npcAt.clear();
    for (const f of FOLK) {
      const hero = f.hero && HEROES[f.hero];
      const gone = f.hero && st.heroes[f.hero];
      if (gone && !f.sub) continue;                       // a recruit who has joined is no longer standing about
      const who = gone ? f.sub : f;
      const name = who.name || hero.name, title = who.title || hero.title;
      const look = who.look || { cls: hero.cls, g: hero.g };
      let x, z;
      if (typeof f.at === 'string') { const b = world.buildings.find((b) => b.id === f.at); x = b.front.x; z = b.front.z; } else [x, z] = f.at;
      [x, z] = this.nearestFree(x, z);
      const model = gone || !f.hero ? makePerson({ ...look, small: f.small }) : withOverride(hero.model || `${hero.cls}_${hero.g}`, makePerson(look));
      model.position.set(x, world.y(x, z), z);
      model.rotation.y = typeof f.at === 'string' ? 0 : Math.PI / 4;
      model.add(shadowDisc());
      const canJoin = f.hero && !gone;
      const tag = label(name, { size: 34, color: f.shop ? '#ffe2a0' : canJoin ? '#9fd6ff' : '#e9dcc4' });
      tag.position.y = (model.userData.height || 1.6) / model.scale.y + 0.45;
      model.add(tag);
      r.units.add(model);
      const npc = { f, id: f.id, name, title, x, z, model, shop: f.shop, hero: canJoin ? f.hero : null, lines: who.lines || [hero?.ask], li: 0 };
      this.npcs.push(npc); this.npcAt.set(key(x, z), npc);
    }
  }
  nearestFree(x, z) {
    const w = this.g.world;
    for (let rad = 0; rad < 6; rad++) for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
      if (w.walkable(x + dx, z + dz) && !this.npcAt.has(key(x + dx, z + dz))) return [x + dx, z + dz];
    }
    return [x, z];
  }

  spawnFoes() {
    const { world, r, st } = this.g;
    for (const f of this.foes) r.units.remove(f.model);
    this.foes = []; this.foeAt.clear();
    world.packs.forEach((p, pi) => p.members.forEach((m, mi) => {
      const id = `p${pi}m${mi}`;
      if (st.slain[id] != null && st.day <= st.slain[id]) return;
      const z = ZOMBIES[m.kind];
      const model = withOverride('zombie_' + z.id, makeZombie(z));
      model.position.set(m.x, world.y(m.x, m.z), m.z);
      model.rotation.y = Math.random() * 6.28;
      model.add(shadowDisc(0.34 * z.scale));
      if (z.ambush) setAnim(model, 'dead');             // lurkers lie in the needles
      r.units.add(model);
      const foe = { id, kind: m.kind, z, level: m.level, x: m.x, z0: m.z, zt: m.z, hx: m.x, hz: m.z, model, t: 1 + Math.random() * 4, alive: true };
      foe.zz = m.z;
      this.foes.push(foe); this.foeAt.set(key(m.x, m.z), foe);
    }));
  }

  rebuildParty() {
    const { r, st, world } = this.g;
    for (const a of this.actors) r.units.remove(a.model);
    this.actors = []; this.moves = []; this.step = null;
    const p = st.pos || world.start;
    st.party.forEach((id, i) => {
      const hero = st.heroes[id], model = heroModel(hero);
      model.add(shadowDisc());
      model.position.set(p.x, world.y(p.x, p.z), p.z);
      model.visible = i === 0;
      r.units.add(model);
      this.actors.push({ hero, model, x: p.x, z: p.z });
    });
    st.pos = { x: p.x, z: p.z };
  }
  get leader() { return this.actors[0]; }
  // Whoever in the party is speaking gestures while they do.
  speak(name, on) {
    for (const a of this.actors) if (a.model.visible && a.hero.name.split(' ')[0] === name.split(' ')[0]) setAnim(a.model, on ? 'talk' : 'idle');
  }

  free(x, z) {
    const w = this.g.world;
    return w.walkable(x, z) && !this.npcAt.has(key(x, z)) && !this.foeAt.has(key(x, z));
  }
  // Can the party go from a to the next tile b? Returns false, 'walk' or 'jump'.
  way(ax, az, bx, bz) {
    if (!this.free(bx, bz)) return false;
    const dh = this.g.world.height(bx, bz) - this.g.world.height(ax, az);
    if (dh >= -1 && dh <= 1) return 'walk';
    if (dh >= -4 && dh <= 2) return 'jump';
    return false;
  }

  // ---- moving ----
  tryMove(dx, dz, jump) {
    const L = this.leader, tx = L.x + dx, tz = L.z + dz;
    this.face = [dx, dz];
    L.model.rotation.y = Math.atan2(dx, dz);
    const way = this.way(L.x, L.z, tx, tz);
    if (way === 'walk' || (way === 'jump' && jump)) return this.startStep(tx, tz, jump || false);
    if (jump) return this.startStep(L.x, L.z, true);     // nowhere to go: hop on the spot
    if (way === 'jump' && !this.hinted) { this.hinted = true; this.g.ui.toast('Too steep to walk. Jump it.'); }
    return false;
  }
  startStep(tx, tz, jump) {
    const w = this.g.world;
    // A hop on the spot is copied by everyone at once; a step is copied one tile later by each in turn.
    const spot = tx === this.leader.x && tz === this.leader.z;
    if (!spot) { this.moves.push({ x: tx, z: tz, jump }); if (this.moves.length > 16) this.moves.shift(); }
    this.actors.forEach((a, k) => {
      const mv = spot ? null : this.moves[this.moves.length - 1 - k];
      a.from = { x: a.x, y: w.y(a.x, a.z), z: a.z };
      if (spot) { a.to = a.from; a.hop = a.model.visible; }
      else if (mv) { a.to = { x: mv.x, y: w.y(mv.x, mv.z), z: mv.z }; a.hop = mv.jump; a.model.visible = true; }
      else { a.to = a.from; a.hop = false; }
      const dx = a.to.x - a.x, dz = a.to.z - a.z;
      if (dx || dz) a.model.rotation.y = Math.atan2(dx, dz);
      if (a.hop) setAnim(a.model, 'jump'); else if (dx || dz) setAnim(a.model, 'walk');
    });
    this.step = { t: 0, dur: jump ? HOP : WALK };
    if (jump) sfx.jump(); else sfx.step();
    return true;
  }
  hopInPlace() { if (!this.step && !this.busy) this.startStep(this.leader.x, this.leader.z, true); }

  update(dt) {
    const g = this.g, st = g.st;
    for (const a of this.actors) animate(a.model, dt);
    const L = this.leader;
    for (const n of this.npcs) if (Math.abs(n.x - L.x) < 22 && Math.abs(n.z - L.z) < 22) animate(n.model, dt);
    this.updateFoes(dt);
    if (this.grace > 0) this.grace -= dt;

    if (this.step) {
      const s = this.step;
      s.t = Math.min(1, s.t + dt / s.dur);
      for (const a of this.actors) {
        const t = s.t, hop = a.hop ? Math.sin(Math.PI * t) * 0.75 : 0;
        a.model.position.set(a.from.x + (a.to.x - a.from.x) * t, a.from.y + (a.to.y - a.from.y) * t + hop, a.from.z + (a.to.z - a.from.z) * t);
      }
      if (s.t >= 1) {
        for (const a of this.actors) { a.x = a.to.x; a.z = a.to.z; }
        this.step = null;
        this.arrive();
      }
    }
    if (!this.step && !this.busy && g.mode === 'explore') {
      let d = null, jump = this.jumpQueued;
      const held = g.input.dir();
      if (held) { d = DPAD[st.dpad][held]; g.autoPause(); }
      else if (st.auto) { const a = g.auto.next(); if (a) { d = a.d; jump = jump || a.jump; } }
      this.jumpQueued = false;
      let moved = false;
      if (d) moved = this.tryMove(d[0], d[1], jump);
      else if (jump) moved = this.startStep(L.x, L.z, true);
      if (!moved) for (const a of this.actors) if (a.model.userData.anim?.state === 'walk') setAnim(a.model, 'idle');
    }
    // Lisandra has opinions about the walk
    if (g.mode === 'explore' && st.heroes.lisandra && st.party.includes('lisandra')) {
      this.chatT -= dt;
      if (this.chatT <= 0) { this.chatT = 55 + Math.random() * 40; g.ui.toast(LISANDRA_CHAT[(st.flags.chat = ((st.flags.chat || 0) + 1)) % LISANDRA_CHAT.length], 'Lisandra'); }
    }
    g.r.follow(L.model.position.x, g.world.y(L.x, L.z), L.model.position.z, dt);
    g.r.updateFade(this.actors.filter((a) => a.model.visible).map((a) => ({ x: a.model.position.x, z: a.model.position.z, y: a.model.position.y })));
  }

  arrive() {
    const g = this.g, L = this.leader, w = g.world;
    g.st.pos = { x: L.x, z: L.z };
    const town = w.inTown(L.x, L.z);
    if (this.inTown !== null && town !== this.inTown) g.ui.banner(town ? 'Herrington Hollow' : 'The Pines', town ? 'Forty roofs, one well' : 'The dead are in there');
    this.inTown = town;
    if ((L.x <= 1 || L.z <= 1 || L.x >= N - 2 || L.z >= N - 2) && !this.endSaid) { this.endSaid = true; g.ui.toast(ROAD_END); setTimeout(() => { this.endSaid = false; }, 9000); }
    this.updatePrompt();
    this.look();
  }

  // ---- talking to things ----
  thingAt(x, z) {
    const w = this.g.world, n = this.npcAt.get(key(x, z));
    if (n) return { kind: 'npc', npc: n, text: `Talk to ${n.name}` };
    if (x === w.board.x && z === w.board.z) return { kind: 'board', text: 'Read the bounty board' };
    if (x === w.well.x && z === w.well.z) return { kind: 'well', text: 'Look down the well' };
    const c = w.chests.find((c) => c.x === x && c.z === z);
    if (c && !this.g.st.opened[c.id]) return { kind: 'chest', chest: c, text: 'Open the chest' };
    return null;
  }
  nearThing() {
    const L = this.leader;
    const front = this.thingAt(L.x + this.face[0], L.z + this.face[1]);
    if (front) return front;
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const t = this.thingAt(L.x + dx, L.z + dz); if (t) return t; }
    return null;
  }
  updatePrompt() { const t = this.nearThing(); this.g.ui.setPrompt(t ? t.text : null); }
  interact() {
    if (this.step || this.busy || this.g.mode !== 'explore') return;
    const t = this.nearThing();
    if (!t) return;
    if (t.kind === 'npc') { const n = t.npc, L = this.leader; n.model.rotation.y = Math.atan2(L.x - n.x, L.z - n.z); }
    this.g.interact(t);
  }

  // ---- the dead ----
  updateFoes(dt) {
    const g = this.g, L = this.leader, w = g.world;
    for (const f of this.foes) {
      if (Math.abs(f.x - L.x) > 24 || Math.abs(f.zz - L.z) > 24) continue;
      animate(f.model, dt);
      if (f.tw) {
        f.tw.t = Math.min(1, f.tw.t + dt / 0.6);
        const t = f.tw.t;
        f.model.position.set(f.tw.x0 + (f.x - f.tw.x0) * t, w.y(f.x, f.zz), f.tw.z0 + (f.zz - f.tw.z0) * t);
        if (t >= 1) { f.tw = null; setAnim(f.model, 'idle'); if (g.mode === 'explore') this.look(); }
        continue;
      }
      if (g.mode !== 'explore' || this.busy || f.z.ambush) continue;
      f.t -= dt;
      if (f.t > 0) continue;
      f.t = 1.5 + Math.random() * 4;
      const [dx, dz] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      const nx = f.x + dx, nz = f.zz + dz;
      if (Math.abs(nx - f.hx) > 3 || Math.abs(nz - f.hz) > 3 || !this.free(nx, nz) || w.height(nx, nz) !== w.height(f.x, f.zz)) continue;
      if (this.actors.some((a) => a.x === nx && a.z === nz)) continue;
      this.foeAt.delete(key(f.x, f.zz));
      f.tw = { t: 0, x0: f.x, z0: f.zz };
      f.x = nx; f.zz = nz;
      this.foeAt.set(key(nx, nz), f);
      f.model.rotation.y = Math.atan2(dx, dz);
      setAnim(f.model, 'walk');
    }
  }
  // Does anything dead see the leader?
  look() {
    if (this.busy || this.grace > 0 || this.g.mode !== 'explore') return;
    const L = this.leader;
    if (this.g.world.inTown(L.x, L.z)) return;           // nothing from the woods follows you into town
    for (const f of this.foes) {
      const d = Math.hypot(f.x - L.x, f.zz - L.z);
      if (d <= f.z.sight) { this.alert(f); return; }
    }
  }
  alert(f) {
    const g = this.g, L = this.leader;
    this.busy = true; g.mode = 'alert';
    g.ui.setPrompt(null);
    for (const a of this.actors) setAnim(a.model, 'idle');
    f.model.rotation.y = Math.atan2(L.x - f.x, L.z - f.zz);
    setAnim(f.model, 'idle');
    const bang = label('!', { size: 90, color: '#ff3a2a', bg: null, scale: 2.2 });
    bang.position.y = 2.1;
    f.model.add(bang);
    sfx.alert();
    g.ui.banner('Seen!', `${f.z.name} · level ${f.level}`, true);
    setTimeout(() => {
      f.model.remove(bang);
      const near = this.foes.filter((o) => Math.hypot(o.x - f.x, o.zz - f.zz) <= 7.5 || Math.hypot(o.x - L.x, o.zz - L.z) <= 6.5);
      for (const o of near) setAnim(o.model, 'idle');
      g.startBattle(near, f);
    }, 1100);
  }

  // After a fight: clear away the fallen, stand the party back up in a chain.
  resume(pos, slainIds, graceSecs = 2) {
    const { r } = this.g;
    this.foes = this.foes.filter((f) => {
      if (!slainIds.includes(f.id)) { f.model.visible = true; f.model.position.set(f.x, this.g.world.y(f.x, f.zz), f.zz); return true; }
      r.units.remove(f.model); this.foeAt.delete(key(f.x, f.zz)); return false;
    });
    this.g.st.pos = { x: pos.x, z: pos.z };
    this.rebuildParty();
    this.busy = false; this.grace = graceSecs;
    this.inTown = this.g.world.inTown(pos.x, pos.z);
    this.updatePrompt();
  }
  teleport(x, z) { this.g.st.pos = { x, z }; this.rebuildParty(); this.inTown = this.g.world.inTown(x, z); this.g.r.follow(x, this.g.world.y(x, z), z, 0, true); this.updatePrompt(); }
}

export { TOWN };
