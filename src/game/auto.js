// Auto-play for the walking half of the game (the fighting half is Battle.plan).
// It rests when hurt, reads the bounty board, gathers a full party, then goes looking for the dead.
// Teach it anything new you add to the world: a new kind of errand is one more entry in goals().
import { N } from '../world/map.js';
import { QUESTS } from '../data/enemies.js';
import { PARTY_MAX, heroStats, partyHeroes, questReady, lead } from './party.js';

export class Auto {
  constructor(g) { this.g = g; this.path = []; this.goal = null; this.holdT = 0; this.failT = 0; }
  reset() { this.path = []; this.goal = null; }
  hold(secs = 1.2) { this.holdT = secs; this.reset(); }

  // What to do next, most pressing first. Each: { why, targets: [{x,z}], act }.
  goals() {
    const g = this.g, st = g.st, ex = g.explore, w = g.world, out = [];
    const heroes = partyHeroes(st);
    const hurt = heroes.some((h) => h.hp <= 0) || heroes.reduce((a, h) => a + h.hp / heroStats(h).hp, 0) / heroes.length < 0.5;
    const npc = (id) => ex.npcs.find((n) => n.id === id);
    if (hurt && npc('aggie')) out.push({ why: 'Heading to The Last Toll to rest', targets: [npc('aggie')], act: () => g.rest() });
    const board = QUESTS.filter((q) => q.from === 'board');
    if (board.some((q) => !st.quests[q.id] || questReady(st, q))) out.push({ why: 'Reading the bounty board', targets: [w.board], act: () => g.boardAuto() });
    if (st.party.length < PARTY_MAX) {
      const free = ex.npcs.filter((n) => n.hero);
      if (free.length) out.push({ why: 'Looking for someone to walk with', targets: free, act: (t) => g.recruitNpc(t, true) });
    }
    // the dead: the kinds a bounty wants first, and nothing far above the party's level
    const lvl = lead(st).lvl;
    const wanted = new Set(QUESTS.filter((q) => st.quests[q.id]?.state === 'active' && q.kill && !questReady(st, q)).map((q) => q.kill));
    const fair = ex.foes.filter((f) => f.level <= lvl + 2);
    const pool = fair.filter((f) => wanted.has('any') || wanted.has(f.z.id));
    const foes = (pool.length ? pool : fair.length ? fair : ex.foes).map((f) => ({ x: f.x, z: f.zz }));
    if (foes.length) out.push({ why: 'Hunting the dead in the pines', targets: foes, act: null, near: 3 });
    return out;
  }

  // Breadth-first from the leader to the nearest tile beside (or within `near` of) any target.
  route(targets, near = 1) {
    const ex = this.g.explore, L = ex.leader, w = this.g.world;
    const want = new Map();
    for (const t of targets) for (let dz = -near; dz <= near; dz++) for (let dx = -near; dx <= near; dx++) {
      if (Math.abs(dx) + Math.abs(dz) > near || (!dx && !dz)) continue;
      const X = t.x + dx, Z = t.z + dz;
      if (w.inMap(X, Z)) want.set(Z * N + X, t);
    }
    const prev = new Int32Array(N * N).fill(-2), start = L.z * N + L.x, q = [start];
    prev[start] = -1;
    for (let i = 0; i < q.length; i++) {
      const c = q[i], x = c % N, z = (c / N) | 0;
      if (want.has(c)) {
        const path = []; for (let k = c; k !== start; k = prev[k]) path.unshift({ x: k % N, z: (k / N) | 0 });
        return { path, target: want.get(c) };
      }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Z = z + dz, k = Z * N + X;
        if (!w.inMap(X, Z) || prev[k] !== -2 || !ex.way(x, z, X, Z)) continue;
        prev[k] = c; q.push(k);
      }
    }
    return null;
  }

  // Called by Explore each time the leader is free to step. Returns { d: [dx,dz], jump } or null.
  next() {
    const g = this.g, ex = g.explore, L = ex.leader;
    if (this.holdT > 0 || this.failT > 0) return null;
    if (!this.goal) {
      for (const goal of this.goals()) {
        const r = this.route(goal.targets, goal.near || 1);
        if (!r) continue;
        this.goal = { ...goal, target: r.target }; this.path = r.path;
        break;
      }
      if (!this.goal) { g.ui.setAuto('Nothing left to do'); this.failT = 3; return null; }
      g.ui.setAuto(this.goal.why);
      g.autoEquip();
    }
    if (!this.path.length) {
      const goal = this.goal; this.goal = null;
      if (goal.act) goal.act(goal.target); else this.failT = 0.6;   // beside the dead and not yet seen: look again shortly
      return null;
    }
    const t = this.path[0], way = ex.way(L.x, L.z, t.x, t.z);
    if (!way || Math.abs(t.x - L.x) + Math.abs(t.z - L.z) !== 1) { this.reset(); return null; }   // something moved into the way
    this.path.shift();
    return { d: [t.x - L.x, t.z - L.z], jump: way === 'jump' };
  }
  update(dt) { if (this.holdT > 0) this.holdT -= dt; if (this.failT > 0) this.failT -= dt; }
}
