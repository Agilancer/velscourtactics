// What makes one fight unlike the last. Three things, all hung on Battle (b) from here:
//   - the fight's kind (b.goal): a plain rout, an ambush (the dead go first), a runner to stop before it gets clear,
//     a stray from the Hollow to get home alive, or ground to hold while more of them come
//   - a lord's own business (data/enemies.js LORD_KIT): a great blow wound up a turn ahead on marked ground, a court
//     called at two thirds, the ground itself turning at one third
//   - hazards: tiles that do something to whoever stands on them when their turn comes
// The AI reads all of it through Battle.badTiles and the marks on units (courier, ward): tactics.js.
import { manhattan, pick, esc } from '../core/util.js';
import { ZOMBIES, KIND, LORD_KIT } from '../data/enemies.js';
import { STATUS } from '../data/classes.js';
import { STRAYS, RUNNER } from '../data/cast.js';
import { makeItem, tierForLevel, itemName } from '../data/items.js';
import { foeGear } from '../data/gear.js';
import { makePerson, makeZombie, withOverride, shadowDisc, setAnim, sleep } from '../gfx/models.js';
import { setGear } from '../gfx/gear.js';
import { foeKey } from './explore.js';
import { lead, addToBag } from './party.js';
import { note } from './chronicle.js';
import { sfx } from '../core/audio.js';

const K = (x, z) => x + ',' + z;
export const GOALS = {
  rout: { title: '', text: '' },
  ambush: { title: 'Ambush', text: 'They saw you first.' },
  courier: { title: 'Stop the runner', text: 'It has the pack’s takings. Put it down before it reaches the trees.' },
  rescue: { title: 'Get them home', text: 'Somebody from the Hollow is in the middle of this. Keep them breathing.' },
  holdout: { title: 'Hold the ground', text: 'More are coming. Outlast them.' },
  gate: { title: 'The dead at the gate', text: 'They have come to the Hollow. Not one gets past.' },
};

/** What kind of fight this pack makes of it. Lords, the keeper and anything with a score to settle are fought plain. */
export function pickKind(st, foes) {
  if (foes.some((f) => f.z.lord || f.z.boss || f.rival) || (st.stats?.fights || 0) < 2) return 'rout';
  const r = Math.random();
  if (r < 0.1) return 'ambush';
  if (r < 0.21 && foes.length >= 2) return 'courier';
  if (r < 0.32) return 'rescue';
  if (r < 0.41 && lead(st).lvl >= 3 && foes.length <= 4) return 'holdout';
  return 'rout';
}

// One more of the dead walking into a fight already begun (a wave, a lord's court).
export function spawnFoe(b, kind, level, x, z) {
  const zd = ZOMBIES[kind], n = (b.extraN = (b.extraN || 0) + 1);
  const model = withOverride(foeKey(zd, n), () => makeZombie(zd));
  setGear(model, foeGear(zd.id, n));
  model.add(shadowDisc(0.34 * zd.scale));
  b.r.units.add(model);
  const u = b.addFoe({ id: `x${n}`, kind, z: zd, level, x, zz: z, model, extra: true });
  b.addBar(u);
  b.show.appear(u, { el: 'shadow', big: 0 });
  return u;
}
// free ground nearest a point (within the field), for whoever is arriving
function freeNear(b, x, z, n = 1, far = 6) {
  const out = [];
  for (let rad = 1; rad <= far && out.length < n; rad++) for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) {
    if (Math.abs(dx) + Math.abs(dz) !== rad || out.length >= n) continue;
    const X = x + dx, Z = z + dz;
    if (b.open(X, Z) && !b.unitAt(X, Z) && !b.trapAt(X, Z) && !out.some((o) => o.x === X && o.z === Z)) out.push({ x: X, z: Z });
  }
  return out;
}

export function setup(b) {
  const kind = b.opts.kind || 'rout', o = (b.goal = { kind, ...GOALS[kind] });
  const foes = b.units.filter((u) => u.side === 'foe'), L = b.origin;
  for (const u of foes) if (LORD_KIT[u.zdef.id]) { u.kit = LORD_KIT[u.zdef.id]; u.lord = true; u.phase = 0; u.windT = 2; u.lordTurns = 0; }
  if (kind === 'ambush') for (const u of foes) u.ct = 100 + Math.random() * 20;
  if (kind === 'courier') {
    const c = [...foes].sort((a, c2) => c2.s.spd - a.s.spd)[0];
    c.courier = true; c.flee = true; c.name = 'The runner'; c.color = '#ffd27a';
    o.who = c;
  }
  if (kind === 'rescue') {
    const d = pick(STRAYS), lvl = lead(b.st).lvl;
    const cx = foes.reduce((a, f) => a + f.x, 0) / foes.length, cz = foes.reduce((a, f) => a + f.z, 0) / foes.length;
    // between the party and the dead, nearer the party
    const spot = b.flood(L.x, L.z, 5).filter((t) => t.d >= 3 && !b.unitAt(t.x, t.z)).sort((a, c2) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(c2.x - cx, c2.z - cz))[0] || freeNear(b, L.x, L.z)[0];
    if (!spot) { o.kind = 'rout'; o.title = ''; return; }
    const model = withOverride('folk_' + d.id, () => makePerson(d.look));
    model.add(shadowDisc()); b.r.units.add(model);
    const hp = 46 + 14 * lvl;
    const u = { id: 'ward', side: 'party', ward: true, flee: true, stray: d, name: d.name, lvl, x: spot.x, z: spot.z, hp, mp: 0, maxhp: hp, maxmp: 0,
      s: { hp, mp: 0, atk: 0, mag: 0, def: 2 + lvl, res: 2 + lvl, spd: 6, move: 3, jump: 1, crit: 0, leech: 0 },
      skills: [], basic: null, ct: 50, st: [], tally: { dealt: 0, taken: 0, healed: 0, kills: 0, low: 1 }, model, alive: true, ai: true, color: '#9fd6ff', face: [0, 1] };
    b.place(u); b.units.push(u);
    o.who = u;
  }
  if (kind === 'holdout' || kind === 'gate') { o.rounds = kind === 'gate' ? 4 : 5; o.round = 0; o.waves = kind === 'gate' ? [2, 3] : [2, 4]; }
}
/** After the HUD is up: the goal's plate, and whoever needs a bar. */
export function begin(b) {
  const o = b.goal;
  if (o.kind === 'rescue' && o.who) { b.addBar(o.who); b.later(() => b.g.ui.speak(o.who.name, o.who.stray.cry, { big: true }), 900); }
  drawGoal(b);
}
export function drawGoal(b) {
  const o = b.goal;
  if (!b.goalEl) return;
  let sub = o.text;
  if (o.kind === 'courier') sub = !o.who.alive ? (o.who.gone ? 'It got away.' : 'Stopped.') : o.text;
  if (o.kind === 'rescue') sub = o.who.alive ? `${o.who.name}: ${o.who.hp}/${o.who.maxhp}` : `${o.who.name} is dead.`;
  if (o.rounds) sub = o.round > o.rounds ? 'Held.' : `Round ${Math.max(1, o.round)} of ${o.rounds}${o.waves.some((w) => w > o.round) ? ' · more are coming' : ''}`;
  b.goalEl.innerHTML = o.title ? `<b>${esc(o.title)}</b><span>${esc(sub)}</span>` : '';
}

// ---- tiles to keep off: what the AI is told (key -> how much it's shunned) ----
export function badTiles(b, u) {
  const out = new Map();
  if (!u.lord) for (const h of b.hazards) out.set(K(h.x, h.z), 8);
  for (const o of b.units) if (o.alive && o.wind && o.side !== u.side) for (const t of o.wind.tiles) out.set(K(t.x, t.z), 40);
  return out;
}
function drawMarks(b) {
  b.r.clearHighlights('!haz'); b.r.clearHighlights('!wind');
  b.r.highlight(b.hazards, 'hazard', '!haz');
  for (const o of b.units) if (o.alive && o.wind) b.r.highlight(o.wind.tiles, 'danger', '!wind');
}
export function clearMarks(b) { b.r.clearHighlights('!haz'); b.r.clearHighlights('!wind'); }
function addHazards(b, lord, n) {
  const st = lord.kit.hazard, near = b.foesOf(lord).filter((o) => !o.ward);
  const pool = [];
  for (const o of near) for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = o.x + dx, Z = o.z + dz; if (b.open(X, Z) && !b.hazards.some((h) => h.x === X && h.z === Z) && !pool.some((p) => p.x === X && p.z === Z)) pool.push({ x: X, z: Z }); }
  for (let i = 0; i < n && pool.length; i++) { const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; b.hazards.push({ ...t, st, turns: 4, by: lord.id }); }
  drawMarks(b);
}

/** The start of anybody's turn: the ground under them, and the fight's own clock. Returns true if the fight ended. */
export async function turnStart(b, u) {
  const o = b.goal;
  const h = b.hazards.find((q) => q.x === u.x && q.z === u.z);
  if (h && !u.lord && u.alive) {
    b.say(`The ground has ${b.nm(u)}: ${esc(STATUS[h.st].name.toLowerCase())}.`, 'st');
    b.addStatus(u, [h.st, 2, 1]);
    b.hurt(u, Math.max(1, Math.round(u.maxhp * 0.04)), null, 'dot', 0, 'the ground');
  }
  if (o.rounds && u.hero && u === b.units.find((q) => q.hero && q.alive)) {
    o.round++;
    if (o.round > o.rounds) { drawGoal(b); b.held = true; b.say('<b>The dead think better of it</b> and go back into the trees.', 'sys'); b.finish('win'); return true; }
    if (o.waves.includes(o.round)) await wave(b);
    drawGoal(b);
  }
  if (o.kind === 'rescue' || o.kind === 'courier') drawGoal(b);
  return b.over;
}
async function wave(b) {
  const foes = b.units.filter((q) => q.side === 'foe' && !q.lord), base = foes.filter((q) => q.alive);
  const kinds = [...new Set(foes.map((q) => q.foe.kind))], lvl = Math.round(foes.reduce((a, q) => a + q.lvl, 0) / Math.max(1, foes.length)) || lead(b.st).lvl;
  // from the field's edge, on the side the dead came from
  const cx = base.length ? base[0].x : b.b.x0, cz = base.length ? base[0].z : b.b.z0;
  const edge = b.tiles.filter((t) => (t.x === b.b.x0 || t.x === b.b.x1 || t.z === b.b.z0 || t.z === b.b.z1) && b.open(t.x, t.z) && !b.unitAt(t.x, t.z))
    .sort((a, c) => manhattan(a.x, a.z, cx, cz) - manhattan(c.x, c.z, cx, cz));
  const n = Math.min(2, edge.length);
  if (!n || !kinds.length) return;
  b.say('<b>More of them</b> come out of the trees.', 'sys');
  b.g.ui.banner('More of them', 'Out of the trees', true);
  sfx.alert(false);
  for (let i = 0; i < n; i++) { const t = edge[i * 2] || edge[i]; const u = spawnFoe(b, pick(kinds), lvl, t.x, t.z); u.ct = 40; }
  b.drawOrder();
  await b.wait(700);
}

// ---- whoever runs rather than fights: the stray makes for the party, the runner for the trees ----
export async function fleeTurn(b, u) {
  const foes = b.foesOf(u), R = [...b.reach(u).values()].filter((t) => !t.pass || (t.x === u.x && t.z === u.z));
  const nearFoe = (t) => foes.reduce((m, f) => Math.min(m, manhattan(t.x, t.z, f.x, f.z)), 99);
  const edge = (t) => Math.min(t.x - b.b.x0, b.b.x1 - t.x, t.z - b.b.z0, b.b.z1 - t.z);
  let best = null, bv = -1e9;
  for (const t of R) {
    let v;
    if (u.courier) v = -edge(t) * 2 + Math.min(4, nearFoe(t)) * 0.6;
    else {
      const friends = b.friendsOf(u).filter((f) => f.hero);
      v = Math.min(5, nearFoe(t)) * 1.2 - friends.reduce((m, f) => Math.min(m, manhattan(t.x, t.z, f.x, f.z)), 99) * 0.7;
    }
    if (b.hazards.some((h) => h.x === t.x && h.z === t.z)) v -= 6;
    if (v > bv) { bv = v; best = t; }
  }
  b.setIntent(u, u.courier ? 'making for the trees' : 'keeping behind you');
  if (best && (best.x !== u.x || best.z !== u.z)) await b.moveTo(u, best);
  u.moved = u.acted = true;
  if (u.courier && u.alive && edge(u) === 0) {
    u.alive = false; u.gone = true; u.model.visible = false; if (u.bar) u.bar.style.display = 'none';
    b.float(u, 'Gone', 'bad');
    b.say(`<b>${esc(RUNNER.away)}</b>`, 'sys');
    drawGoal(b);
    b.checkOver();
  }
  await b.wait(160);
}

// ---- a lord's turn: its court, the ground, the great blow. Returns true when the turn is spent. ----
export async function lordTurn(b, u) {
  const kit = u.kit, frac = u.hp / u.maxhp;
  u.lordTurns++;
  // the ground it has turned goes back, in time
  for (const h of b.hazards) if (h.by === u.id) h.turns--;
  if (b.hazards.some((h) => h.turns <= 0)) { b.hazards = b.hazards.filter((h) => h.turns > 0); drawMarks(b); }
  if (u.phase < 1 && frac <= 0.66) {
    u.phase = 1;
    b.say(`<b>${esc(kit.cry[1])}</b>`, 'sys'); b.g.ui.banner(u.name, kit.cry[1], true);
    setAnim(u.model, 'taunt', 0.6, 'cast'); sfx.alert(false);
    await b.wait(500);
    const spots = freeNear(b, u.x, u.z, kit.adds.length, 4);
    kit.adds.forEach((id, i) => { if (spots[i] && KIND[id] != null) { const a = spawnFoe(b, KIND[id], Math.max(1, u.lvl - 2), spots[i].x, spots[i].z); a.ct = 60; } });
    b.addStatus(u, ['might', 3, 1], u);
    b.drawOrder();
    await b.wait(500);
  }
  if (u.phase < 2 && frac <= 0.33) {
    u.phase = 2;
    b.say(`<b>${esc(kit.cry[2])}</b>`, 'sys'); b.g.ui.banner(u.name, kit.cry[2], true);
    setAnim(u.model, 'taunt', 0.6, 'cast');
    b.r.fx.shake(0.3); b.r.fx.flash('#ff6a4a', 0.25);
    addHazards(b, u, 5);
    b.addStatus(u, ['haste', 4, 1], u);
    await b.wait(600);
  } else if (u.phase >= 2 && u.lordTurns % 3 === 0) addHazards(b, u, 2);
  if (u.wind) { await strike(b, u); return true; }
  if (--u.windT <= 0) {
    const foes = b.foesOf(u).filter((o) => manhattan(o.x, o.z, u.x, u.z) <= kit.big.r[1] + 1);
    if (foes.length) {
      // where it would catch the most of them
      let best = null, bn = 0;
      for (const c of foes) { const n = foes.filter((o) => manhattan(o.x, o.z, c.x, c.z) <= kit.big.aoe).length; if (n > bn) { bn = n; best = c; } }
      u.wind = { x: best.x, z: best.z, tiles: b.aoeTiles(kit.big, best.x, best.z) };
      b.faceTo(u, best.x, best.z);
      setAnim(u.model, 'cast', 0.8, 'attack');
      b.setIntent(u, `winding up ${kit.big.name}`);
      b.float(u, kit.big.name + '…', 'bad');
      b.say(`<b>${esc(kit.cry[0])}</b> The marked ground is where it lands.`, 'sys');
      b.g.ui.banner(kit.big.name, 'Get off the marked ground', true);
      b.r.fx.shake(0.16); sfx.alert(false);
      drawMarks(b);
      b.direct(u.model.position, 0.8, 900);
      b.g.banter.say('windup', { chance: 0.8 });
      await b.wait(900);
      u.moved = u.acted = true;
      return true;
    }
    u.windT = 1;
  }
  return false;
}
async function strike(b, u) {
  const sk = u.kit.big, w = u.wind;
  u.wind = null; u.windT = 3;
  b.faceTo(u, w.x, w.z);
  b.say(`${b.nm(u)} · <b class="sk">${esc(sk.name)}</b>`, 'act');
  const L = b.show.look(u, sk);
  try { b.show.banner(u, sk, L); } catch { /* the name is in the log either way */ }
  setAnim(u.model, 'attack', 0.6, 'attack');
  b.camAt = b.show.ground(w.x, w.z);
  await b.wait(380);
  try { b.show.land(u, sk, L, w.x, w.z); } catch { /* no picture for it: the numbers still land */ }
  b.r.fx.shake(0.4); b.r.fx.flash('#ffd0a0', 0.3); b.r.fx.stop(0.08);
  sfx.burst(sk, b.show.ground(w.x, w.z), true);
  let n = 0;
  for (const t of w.tiles) {
    const o = b.unitAt(t.x, t.z);
    if (!o || o.side === u.side) continue;
    n++;
    const d = b.damage(u, o, sk, false, u);
    b.hurt(o, d.n, u, d.crit ? 'crit' : '');
    b.addStatus(o, sk.st, u);
  }
  if (!n) b.say('It lands on nobody.', 'st');
  clearMarks(b); drawMarks(b);
  u.moved = u.acted = true;
  await b.wait(500);
  b.show.end();
  b.checkOver();
}

/** When it's won: what the fight's kind adds to the spoils. Returns lines for the result. */
export function spoils(b) {
  const o = b.goal, st = b.st, lines = [], lvl = lead(st).lvl;
  if (o.kind === 'courier' && o.who && !o.who.gone) {
    const gold = 60 + 30 * lvl, it = makeItem(pick(['ring', 'amulet', 'ring']), tierForLevel(lvl), 2);
    st.gold += gold; const kept = addToBag(st, it);
    lines.push(`${RUNNER.caught} <b>${gold}</b> gold${kept ? ` and a <b>${esc(itemName(it))}</b>` : ''}.`);
    note(st, 'find', `Stopped a runner with the pack’s takings: ${gold} gold${kept ? ' and a ' + itemName(it) : ''}.`);
  } else if (o.kind === 'courier') note(st, 'fight', 'A runner got clear with whatever it was carrying.');
  if (o.kind === 'rescue' && o.who) {
    if (o.who.alive) {
      const gold = 80 + 35 * lvl; st.gold += gold;
      lines.push(`<i>“${esc(o.who.stray.thanks)}”</i> — ${esc(o.who.name)}. <b>${gold}</b> gold.`);
      note(st, 'join', `Got ${o.who.name} home to the Hollow alive. ${gold} gold, pressed on you.`);
      st.dread = Math.max(0, st.dread - 3);
    } else { lines.push(`${esc(o.who.name)} did not come home.`); note(st, 'fall', `${o.who.name} of the Hollow died in the pines, in the middle of your fight.`); st.dread = Math.min(100, st.dread + 4); }
  }
  if (o.rounds && b.held) { const gold = 50 + 25 * lvl; st.gold += gold; lines.push(`You held. <b>${gold}</b> gold from the Watch, for the ground.`); }
  return lines;
}
export function cleanup(b) {
  clearMarks(b);
  for (const u of b.units) if (u.foe?.extra) { sleep(u.model); b.r.units.remove(u.model); }
}
