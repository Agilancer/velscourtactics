// The fight's AI: used by the dead, by summons, and by the party when Auto is on (Battle.plan calls plan() here).
// Every skill from every tile in reach, at every target it could take, scored; the best is done. What bends the scores:
// a hero's stance (doctrine.js STANCES), the player's call (Battle.call: focus, all out, hold), what the tile itself
// threatens (a lord's wind-up, a hazard, how many of the other side could reach it), and what the blow would set off
// (a combo, a body knocked into a wall or onto a trap, a runner stopped). intent() says the plan in words.
import { manhattan } from '../core/util.js';
import { STATUS, COMBOS, comboFor } from '../data/classes.js';
import { STANCES, stanceOf } from './doctrine.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const K = (x, z) => x + ',' + z;
const NEUTRAL = { dmg: 1, kill: 1, heal: 1, safe: 0, ward: 0, thrift: 1 };
const lifeCost = (u, sk) => (sk.hpCost ? Math.max(1, Math.round(u.maxhp * sk.hpCost)) : 0);
const hurts = (sk) => sk && (sk.kind === 'phys' || sk.kind === 'magic');
const first = (u) => u.name.split(' ')[0];

/** How the fight looks before it starts: the dead's weight against the party's, in a word. */
export function threat(heroes, foes) {
  const us = heroes.reduce((a, s) => a + s.hp / 10 + Math.max(s.atk, s.mag) * 2.2, 0);
  const them = foes.reduce((a, s) => a + s.hp / 10 + s.atk * 2.2, 0);
  const r = them / Math.max(1, us);
  const i = r < 0.45 ? 0 : r < 0.8 ? 1 : r < 1.15 ? 2 : r < 1.6 ? 3 : 4;
  return { ratio: r, i, word: ['A formality', 'In hand', 'Even', 'Ugly', 'Grave'][i] };
}

// The weights this unit fights by: its stance under auto-play, bent by the player's call if one stands.
function weights(b, u) {
  if (!u.hero || !b.st.auto) return NEUTRAL;
  let S = STANCES[stanceOf(u.hero)];
  const call = b.call?.left > 0 ? b.call.mode : null;
  if (call === 'allout') S = { ...S, dmg: S.dmg * 1.5, kill: 2, safe: 0, thrift: 0 };
  if (call === 'hold') S = { ...S, dmg: S.dmg * 0.8, heal: 1.8, safe: Math.max(3, S.safe), ward: Math.max(2, S.ward) };
  return S;
}
// Is this a fight to spend mana on? A lord or the keeper, a crowd, or the party already hurting.
function worthIt(b, u, foes, friends) {
  if (foes.some((f) => f.lord) || foes.length >= 5) return true;
  const heroes = friends.filter((f) => f.hero);
  return heroes.reduce((a, f) => a + f.hp / f.maxhp, 0) / Math.max(1, heroes.length) < 0.55;
}
// What knocking `o` n tiles along `dir` would be worth: into a wall or a body, or onto one of our traps.
function shoveGain(b, u, o, dir, n) {
  if (b.unmoved(o)) return 0;
  let x = o.x, z = o.z;
  for (let i = 0; i < n; i++) {
    const X = x + dir[0], Z = z + dir[1], blocker = b.unitAt(X, Z);
    if (!b.open(X, Z) || (blocker && blocker !== u) || b.w.height(X, Z) - b.w.height(x, z) > 1) return Math.min(o.hp, o.maxhp * 0.08 * (n - i)) + (blocker && blocker.side === o.side ? 3 : 0);
    x = X; z = Z;
    const trap = b.trapAt(x, z);
    if (trap && trap.side !== o.side) return 12.5;          // (the half marks it as a trap, for intent())
    const drop = b.w.height(x - dir[0], z - dir[1]) - b.w.height(x, z);
    if (drop >= 3) return Math.min(o.hp, o.maxhp * 0.05 * drop);
  }
  return 0;
}
function shoveDir(u, sk, o, c) {
  const aimed = sk.aoe && sk.at !== 'self';
  const O = !aimed || (o.x === c.x && o.z === c.z) ? u : c;
  const dx = o.x - O.x, dz = o.z - O.z;
  if (!dx && !dz) return null;
  return Math.abs(dx) >= Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
}

export function plan(b, u) {
  const foes = b.foesOf(u).filter((f) => !f.gone), friends = b.friendsOf(u);
  const S = weights(b, u), big = worthIt(b, u, foes, friends);
  const R = u.moved ? [{ x: u.x, z: u.z, d: 0, prev: null }] : [...b.reach(u).values()].filter((t) => !t.pass || (t.x === u.x && t.z === u.z));
  const skills = [];
  if (!u.acted) { if (u.basic) skills.push(u.basic); for (const sk of u.skills) if (u.side === 'foe' || u.summon || (sk.cost <= u.mp && (!sk.hpCost || u.hp > lifeCost(u, sk)))) skills.push(sk); }
  const nearFoe = (x, z) => foes.reduce((m, f) => Math.min(m, manhattan(x, z, f.x, f.z)), 99);
  const inRange = (sk, t, x, z) => { const d = manhattan(t.x, t.z, x, z); return d >= sk.r[0] && d <= sk.r[1]; };
  const freeTile = (c) => b.open(c.x, c.z) && !b.unitAt(c.x, c.z) && !b.trapAt(c.x, c.z);
  // how far each of the other side can reach (its walk and its longest arm), and the tiles to keep off
  const arm = new Map(foes.map((f) => [f, b.moveRange(f) + Math.max(1, ...[f.basic, ...f.skills].filter(hurts).map((s) => s.r[1]))]));
  const exposed = (x, z) => { let n = 0; for (const f of foes) if (manhattan(x, z, f.x, f.z) <= arm.get(f)) n++; return n; };
  const bad = b.badTiles(u);
  // the worst hurt friend (for a Shield to stand by), and whoever is at their throat
  const weak = S.ward ? friends.filter((f) => f !== u && !f.summon && f.hp < f.maxhp * 0.75).sort((a, c) => a.hp / a.maxhp - c.hp / c.maxhp)[0] : null;
  // which combos somebody else on this side could set off, if this blow left the mark for them
  const mates = friends.filter((f) => f !== u);
  const setups = COMBOS.filter((c) => mates.some((f) => [f.basic, ...f.skills].some((s) => hurts(s) && c.when(s))));
  const marks = (sk) => [sk.st?.[0], sk.st2?.[0], sk.el === 'cold' && hurts(sk) ? 'rime' : null].filter(Boolean);
  const focus = u.side === 'party' && b.call?.left > 0 ? b.call.focus : null;
  const costly = (sk) => (sk.cost || 0) > 0 && !u.rage && u.side === 'party' && !u.summon;
  let best = { score: 0 }, spared = false;
  const real = { x: u.x, z: u.z };
  const tileWorth = (t) => {
    let v = -t.d * 0.05;
    if (bad.has(K(t.x, t.z))) v -= bad.get(K(t.x, t.z));
    if (S.safe) v -= S.safe * exposed(t.x, t.z) * (u.hp < u.maxhp * 0.5 ? 1.8 : 1) * 0.9;
    if (weak && manhattan(t.x, t.z, weak.x, weak.z) <= 1) v += S.ward * 1.5;
    return v;
  };
  for (const t of R) {
    const gap = nearFoe(t.x, t.z), here = tileWorth(t);
    for (const sk of skills) {
      let centres;
      if (sk.at === 'self') centres = [t];
      else if (sk.kind === 'summon') {
        if (b.units.some((o) => o.alive && o.owner === u.id && o.kind === sk.summon) || !foes.length) continue;
        const c = b.rangeTiles(sk, t.x, t.z).filter((c) => freeTile(c) && !(c.x === t.x && c.z === t.z)).sort((a, c2) => nearFoe(a.x, a.z) - nearFoe(c2.x, c2.z))[0];
        if (c && 14 + here > best.score) best = { score: 14 + here, tile: t, sk, x: c.x, z: c.z };
        continue;
      } else if (sk.kind === 'trap') {
        // in the way: the free tile in reach nearest one of them, but not one they're already beside
        if (!foes.length) continue;
        const mine = b.traps.filter((p) => p.owner === u.id).length;
        const c = b.rangeTiles(sk, t.x, t.z).filter((c) => freeTile(c) && !(c.x === t.x && c.z === t.z) && nearFoe(c.x, c.z) >= 1).sort((a, c2) => nearFoe(a.x, a.z) - nearFoe(c2.x, c2.z))[0];
        const score = c ? 8 - mine * 3 - nearFoe(c.x, c.z) * 0.4 + here : 0;
        if (score > best.score) best = { score, tile: t, sk, x: c.x, z: c.z };
        continue;
      } else if (sk.blink) centres = b.rangeTiles(sk, t.x, t.z).filter(freeTile);
      else if (sk.shape === 'line' || sk.shape === 'cone') { const n = Math.max(1, sk.r[0]); centres = DIRS.map(([dx, dz]) => ({ x: t.x + dx * n, z: t.z + dz * n })).filter((c) => b.inBounds(c.x, c.z)); }
      else if (sk.at === 'fallen') centres = b.units.filter((o) => !o.alive && o.hero && o.side === u.side && !b.unitAt(o.x, o.z) && inRange(sk, t, o.x, o.z));
      else centres = (sk.at === 'ally' ? friends : foes).filter((o) => !(o === u && sk.kind === 'tempo') && inRange(sk, t, o === u ? t.x : o.x, o === u ? t.z : o.z)).map((o) => (o === u ? t : o));
      for (const c of centres) {
        u.x = t.x; u.z = t.z;                             // judge it as if already standing there
        let score = 0, need = false;                      // need: a kill, or a friend pulled back from the edge
        const hit = b.affected(u, sk, c.x, c.z);
        hit.forEach((o, i) => {
          if (hurts(sk)) {
            const d = b.damage(u, o, sk, true, u, b.falloff(hit, i)), n = d.n * (sk.hits || 1), kills = n >= o.hp;
            let v = Math.min(n, o.hp) * S.dmg + (kills ? 14 * S.kill : 0) + (sk.st ? 2 : 0) + (sk.st2 ? 3 : 0) + (sk.delay ? 3 : 0) + (b.has(o, 'taunt') ? 10 : 0);
            if (sk.push || sk.pull) { const dir = sk.push && shoveDir(u, sk, o, c); v += 3 + (dir ? shoveGain(b, u, o, dir, sk.push) : 0); }
            if (!kills) for (const m of marks(sk)) if (!b.has(o, m) && setups.some((cb) => cb.need === m)) v += 5;
            if (o === focus) v += 25;
            if (o.courier) v += 18;
            if (o.ward) v += 4;
            if (weak && manhattan(o.x, o.z, weak.x, weak.z) <= 1) v += S.ward * 2;
            if (kills) need = true;
            score += v;
          } else if (sk.kind === 'heal') { const miss = o.maxhp - o.hp; if (miss > o.maxhp * 0.25) { score += Math.min(miss, b.healing(u, sk)) * 1.1 * S.heal; if (o.hp < o.maxhp * 0.4) need = true; } }
          else if (sk.kind === 'cleanse') {
            score += o.st.filter((s) => STATUS[s.id]?.bad).length * 5;
            if (sk.pow) { const miss = o.maxhp - o.hp; if (miss > o.maxhp * 0.25) score += Math.min(miss, b.healing(u, sk)) * 0.8 * S.heal; }
          } else if (sk.kind === 'revive') { score += 40; need = true; }
          else if (sk.kind === 'tempo') { if (o.ct < 90 && foes.length) score += 8 + (90 - o.ct) * 0.04; }
          else {
            if (sk.st && !b.has(o, sk.st[0])) score += (sk.st[0] === 'stun' || sk.st[0] === 'root' ? 9 : STATUS[sk.st[0]]?.doom ? 10 : 6) * (foes.length ? 1 : 0) + (setups.some((cb) => cb.need === sk.st[0]) ? 4 : 0);
            if (sk.st2 && !b.has(o, sk.st2[0]) && foes.length) score += 3;
            if (sk.delay && foes.length) score += 5;
            if (o === focus) score += 8;
          }
        });
        if (sk.allyHeal) for (const a of b.aoeTiles(sk, c.x, c.z)) { const o = b.unitAt(a.x, a.z); if (o && o.side === u.side && o.hp < o.maxhp * 0.7) score += 4 * S.heal; }
        if (sk.self && !b.has(u, sk.self[0]) && score > 0) score += 3;
        u.x = real.x; u.z = real.z;
        if (score <= 0) continue;
        // mana is held dearly by the Sparing, unless the fight is worth it or the blow is needed
        if (costly(sk) && S.thrift >= 5 && !big && !need) { score *= 0.45; spared = true; }
        score += (sk.r[1] > 1 ? Math.min(gap, 4) * 0.4 : 0) + here - (sk.cost || 0) * 0.05 * Math.min(2, S.thrift) - (sk.hpCost ? u.maxhp * sk.hpCost * 0.3 : 0);
        if (score > best.score) best = { score, tile: t, sk, x: c.x, z: c.z };
      }
    }
  }
  if (best.sk) { best.spared = spared && !costly(best.sk); return best; }
  // nothing worth doing from anywhere in reach: close the distance (or get off bad ground, or stand by the hurt)
  let to = null, bv = -nearFoe(u.x, u.z) + tileWorth({ x: u.x, z: u.z, d: 0 }) * 0.5;
  for (const t of R) { const v = -nearFoe(t.x, t.z) + tileWorth(t) * 0.5; if (v > bv + 1e-6) { bv = v; to = t; } }
  return { tile: to };
}

/** What a plan means to do, in a few words, for the line under the turn order: 'finishing the Gnawer'. */
export function intent(b, u, p) {
  const sk = p.sk;
  if (!sk) {
    if (!p.tile) return 'holding';
    const f = b.foesOf(u).sort((a, c) => manhattan(p.tile.x, p.tile.z, a.x, a.z) - manhattan(p.tile.x, p.tile.z, c.x, c.z))[0];
    return b.badTiles(u).has(K(u.x, u.z)) ? 'getting off bad ground' : f ? `closing on ${f.name}` : 'holding';
  }
  if (sk.kind === 'summon') return `calling a ${sk.name.toLowerCase()}`;
  if (sk.kind === 'trap') return 'laying a trap in their way';
  const was = { x: u.x, z: u.z };
  if (p.tile) { u.x = p.tile.x; u.z = p.tile.z; }
  const hit = b.affected(u, sk, p.x, p.z), t = b.unitAt(p.x, p.z) || hit[0];
  let out = `using ${sk.name}`;
  if (t) {
    const who = t === u ? 'themself' : t.name;
    if (sk.kind === 'heal' || (sk.kind === 'item' && sk.item === 'potion')) out = `mending ${who}`;
    else if (sk.kind === 'revive' || sk.at === 'fallen') out = `getting ${who} back up`;
    else if (sk.kind === 'cleanse') out = `clearing what ails ${who}`;
    else if (sk.kind === 'buff') out = `${sk.name} for ${who}`;
    else if (sk.kind === 'tempo') out = `hurrying ${who} along`;
    else if (sk.kind === 'debuff') out = `${sk.name} on ${who}`;
    else if (hurts(sk)) {
      const d = b.damage(u, t, sk, true, u), kills = d.n * (sk.hits || 1) >= t.hp;
      const dir = sk.push && shoveDir(u, sk, t, p), slam = dir && shoveGain(b, u, t, dir, sk.push);
      const S = weights(b, u);
      if (t.courier) out = 'stopping the runner';
      else if (kills) out = `finishing ${who}`;
      else if (d.combo) out = `${d.combo.name}: ${who}`;
      else if (b.call?.left > 0 && b.call.focus === t && u.side === 'party') out = `on your call: ${who}`;
      else if (slam === 12.5) out = `knocking ${who} onto a trap`;
      else if (slam > 0) out = `driving ${who} into the wall`;
      else if (hit.length >= 3) out = `catching ${hit.length} of them at once`;
      else if (d.side === 'back') out = `taking ${who} from behind`;
      else if (d.side === 'side') out = `flanking ${who}`;
      else if (S.ward && b.friendsOf(u).some((f) => f !== u && f.hp < f.maxhp * 0.75 && manhattan(f.x, f.z, t.x, t.z) <= 1)) out = `pulling ${who} off a friend`;
      else {
        const mates = b.friendsOf(u).filter((f) => f !== u);
        const set = COMBOS.find((c) => !b.has(t, c.need) && [sk.st?.[0], sk.el === 'cold' ? 'rime' : null].includes(c.need) && mates.some((f) => [f.basic, ...f.skills].some((s) => hurts(s) && c.when(s))));
        out = set ? `setting up a ${set.name} on ${who}` : `${sk.basic ? 'striking' : sk.name + ' on'} ${who}`;
      }
      if (p.spared) out += ', saving mana';
    }
  }
  u.x = was.x; u.z = was.z;
  return out;
}
export { comboFor, first };
