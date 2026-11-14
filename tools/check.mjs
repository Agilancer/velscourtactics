// Sanity checks that need no browser: the world builds, every class and item is well formed.
import { buildWorld, recruitSpots, REGIONS, TOWN, N } from '../src/world/map.js';
import { CLASSES, CLASS_IDS, SPELLS, SUMMONS, STATUS, SKILL_LEVELS, COMBOS } from '../src/data/classes.js';
import { WEAPONS, ARMORS, makeItem, itemName, itemStats } from '../src/data/items.js';
import { ZOMBIES, QUESTS, zombieStats, LORD_KIT, KIND, RIVAL_NAMES } from '../src/data/enemies.js';
import * as CAST from '../src/data/cast.js';
import { STANCES, ERRANDS, ERRAND_ORDER, DESTS, PURSES, BOONS, GOALS, ordersOf } from '../src/game/doctrine.js';
const { FOLK, HEROES, BANTER, STRAYS } = CAST;
import { newState, heroStats, recruit, heroSkills } from '../src/game/party.js';
import { readFileSync } from 'fs';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.error('FAIL', m); } };
const w = buildWorld();
console.log('trees', w.trees.length, 'packs', w.packs.length, 'foes', w.packs.reduce((a, p) => a + p.members.length, 0), 'chests', w.chests.length, 'start', w.start);
const kinds = new Set(w.packs.flatMap((p) => p.members.map((m) => m.kind)));
ok(kinds.size === ZOMBIES.length, 'every kind of the dead is out there: ' + [...kinds].sort((a, b) => a - b));
ok(w.places.length === 5, 'four ruins and the oasis: ' + w.places.map((p) => p.name));
for (const p of w.packs) for (const m of p.members) ok(ZOMBIES[m.kind] && w.reach[w.I(m.x, m.z)] && w.walkable(m.x, m.z), `pack member at ${m.x},${m.z} stands where it can be reached`);
for (const c of w.chests) { let near = false; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.reach[w.I(c.x + dx, c.z + dz)]) near = true; ok(near || !c.id.startsWith('place'), 'chest can be opened: ' + c.id); }
const woods = w.packs.filter((p) => !p.crypt);
const woodKinds = new Set(woods.flatMap((p) => p.members.map((m) => m.kind)));
console.log('kinds in the woods', ZOMBIES.map((z, k) => `${z.id} ${woods.reduce((a, p) => a + p.members.filter((m) => m.kind === k).length, 0)}`).join(', '));
ZOMBIES.forEach((z, k) => ok(z.boss ? !woodKinds.has(k) : woodKinds.has(k), z.boss ? `${z.id} keeps to the crypt` : `${z.id} is in the woods`));
for (const z of ZOMBIES) for (const s of z.skills) ok(['phys', 'magic', 'debuff'].includes(s.kind) && (s.kind !== 'debuff' || s.st), `${z.id} ${s.id} is something Battle knows how to do`);
// the crypt: walkable to, in by the gate, its keeper on the dais, nothing in it seeing out through a wall
const c = w.crypt;
console.log('crypt at', c.x, c.z, 'gate', c.gate, 'chest', c.chest.x, c.chest.z);
ok(Math.hypot(c.x - TOWN.cx, c.z - TOWN.cz) > 45, 'the crypt is far from the Hollow');
for (const [x, z, what] of [[c.gate.x, c.gate.z + 3, 'the way to the gate'], [c.gate.x, c.gate.z, 'the gate'], [c.x, c.z + 4, 'the yard'], [c.x, c.z, 'the dais'], [c.chest.x, c.chest.z + 1, 'the chest']]) ok(w.reach[w.I(x, z)], `${what} can be reached on foot`);
ok(w.chests.some((ch) => ch.id === c.chest.id) && !w.walkable(c.chest.x, c.chest.z), 'the crypt has its chest');
const cp = w.packs.find((p) => p.crypt);
ok(cp && cp.members.some((m) => ZOMBIES[m.kind].boss), 'the Bone Golem keeps the crypt');
for (let z = 0; z < w.N; z++) for (let x = 0; x < w.N; x++) {
  if (!w.reach[w.I(x, z)] || Math.max(Math.abs(x - c.x), Math.abs(z - c.z)) <= c.r || (Math.abs(x - c.gate.x) <= 1 && z - c.gate.z >= 0 && z - c.gate.z <= 1)) continue;
  // a crypt member can stand anywhere on the dais (it can't step down off it to wander)
  for (const m of cp.members) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (Math.hypot(c.x + dx - x, c.z + dz - z) <= ZOMBIES[m.kind].sight) { ok(false, `${x},${z} outside the crypt is in sight of the dais`); dz = dx = 9; }
  }
}
// one walk in: the gate's tiles are open, the wall either side is not
ok(w.walkable(c.gate.x - 1, c.gate.z) && w.walkable(c.gate.x + 1, c.gate.z) && !w.walkable(c.gate.x - 2, c.gate.z) && !w.walkable(c.gate.x + 2, c.gate.z), 'the gate is three tiles wide in a wall');
ok(w.reach[w.I(TOWN.cx, TOWN.cz + 1)], 'the square can be reached from the start');
for (const edge of [[w.start.x, N - 2], [TOWN.cx, 1], [N - 2, TOWN.cz], [1, TOWN.cz]]) { let hit = false; for (let d = -8; d <= 8; d++) { if (w.reach[w.I(edge[0] + (edge[1] === N - 2 || edge[1] === 1 ? d : 0), edge[1] + (edge[0] === N - 2 || edge[0] === 1 ? d : 0))]) hit = true; } ok(hit, 'road reaches edge ' + edge); }
ok(CLASS_IDS.length === 17, 'seventeen classes');
for (const id in CLASSES) {
  const C = CLASSES[id];
  ok(C.skills.length === 8, id + ' has eight skills');
  if (!C.hidden) ok(C.skills.map((s) => s.lvl).join() === SKILL_LEVELS.join(), `${id} opens a skill at each of ${SKILL_LEVELS}`);
  for (const wk of C.weapon) ok(WEAPONS[wk], id + ' weapon ' + wk); ok(ARMORS[C.armor], id + ' armor');
}
// every skill is something Battle knows how to do, and everything it names exists
const seen = new Set();
for (const s of [...Object.values(CLASSES).flatMap((C) => C.skills), ...Object.values(SPELLS)]) {
  const t = 'skill ' + s.id;
  ok(!seen.has(s.id), t + ' has an id of its own'); seen.add(s.id);
  ok(['phys', 'magic', 'heal', 'buff', 'debuff', 'summon', 'trap', 'cleanse', 'revive', 'tempo'].includes(s.kind), t + ' kind ' + s.kind);
  ok(['enemy', 'ally', 'self', 'tile', 'fallen'].includes(s.at), t + ' aimed at ' + s.at);
  ok(Array.isArray(s.r) && s.r[0] <= s.r[1] && s.aoe >= 0, t + ' range and blast');
  for (const st of [s.st, s.st2, s.self]) if (st) ok(STATUS[st[0]] && st[1] > 0 && st[2] > 0 && st[2] <= 1, `${t} status ${st}`);
  if (s.kind === 'debuff') ok(s.st || s.delay, t + ' does something to them');
  if (s.kind === 'buff') ok(s.st, t + ' does something for them');
  if (s.kind === 'summon') ok(SUMMONS[s.summon] && s.at === 'tile', t + ' summons ' + s.summon);
  if (s.kind === 'trap') ok(s.trap && s.trap.pow > 0 && s.at === 'tile' && (!s.trap.st || STATUS[s.trap.st[0]]), t + ' trap');
  if (s.kind === 'revive') ok(s.at === 'fallen' && s.pow > 0, t + ' stands up the fallen');
  if (s.kind === 'tempo') ok(s.at === 'ally' && s.tempo > 0, t + ' brings a turn forward');
  if (s.blink) ok(s.at === 'tile' && s.r[0] >= 1, t + ' steps to a tile');
  if (s.shape) ok(['line', 'cone'].includes(s.shape) && !s.aoe && s.at === 'enemy', t + ' shape ' + s.shape);
  if (s.push || s.pull) ok(!(s.push && s.pull) && ['phys', 'magic'].includes(s.kind), t + ' pushes or pulls');
  if (s.chain) ok(s.chain > 0 && !s.aoe, t + ' chains');
  if (s.dash) ok(s.dash === true || s.dash === 'behind', t + ' dash');
  if (s.hpCost) ok(s.hpCost > 0 && s.hpCost < 0.5, t + ' life cost');
}
for (const k in SUMMONS) { const d = SUMMONS[k]; ok(['phys', 'magic', 'heal'].includes(d.kind) && d.r[0] <= d.r[1], 'summon ' + k); }
for (const f of FOLK) {
  if (f.hero) ok(HEROES[f.hero], 'hero ' + f.hero);
  if (f.land) ok(REGIONS.some((R) => R.id === f.land), `${f.id} stands in a land there is (${f.land})`);
  else if (typeof f.at === 'string') ok(w.buildings.find((b) => b.id === f.at), 'building ' + f.at);
  else ok(w.walkable(f.at[0], f.at[1]), `${f.id} stands on a free tile ${f.at}`);
}
// the recruits out in the lands each have a tile of their own, on ground the start can reach
REGIONS.forEach((R, reg) => {
  const n = FOLK.filter((f) => f.land === R.id).length;
  if (!n) return;
  const spots = recruitSpots(w, reg, n);
  ok(spots.length === n, `${R.id} has room for its ${n} recruits (${spots.length})`);
  for (const [x, z] of spots) ok(w.walkable(x, z) && w.reach[w.I(x, z)], `${R.id} recruit at ${x},${z} can be walked to`);
});
// a recruit's body is one the manifest has
const MANIFEST = JSON.parse(readFileSync(new URL('../assets/models/manifest.json', import.meta.url), 'utf8'));
for (const id in HEROES) if (HEROES[id].model) ok(MANIFEST[HEROES[id].model], `${id} wears ${HEROES[id].model}`);
for (const q of QUESTS) if (q.kill && q.kill !== 'any') ok(ZOMBIES.find((z) => z.id === q.kill), 'quest kind ' + q.kill);
const st = newState({ name: 'Test', cls: 'paladin', g: 'm' });
for (const h in HEROES) recruit(st, h);
for (const h of Object.values(st.heroes)) { const s = heroStats(h); ok(s.hp > 0 && s.atk > 0 && heroSkills(h).length >= 1, h.name + ' stats'); }
console.log('paladin L1', heroStats(st.heroes.lead), 'shambler L1', zombieStats(0, 1), 'brute L9', zombieStats(4, 9), 'bone golem L11', zombieStats(ZOMBIES.findIndex((z) => z.boss), 11));
console.log(itemName(makeItem('sword', 2, 3)), itemStats(makeItem('plate', 1, 1)));
// ---- what auto-play and the fights are told by: combos, lords' kits, stances, orders, boons, banter ----
for (const c of COMBOS) ok(STATUS[c.need] && c.mult > 1 && typeof c.when === 'function' && (!c.st || STATUS[c.st[0]]) && (!c.spread || STATUS[c.spread[0]]), 'combo ' + c.id);
for (const z of ZOMBIES) if (z.lord || z.boss) ok(LORD_KIT[z.id], z.id + ' has a lord\'s kit');
for (const id in LORD_KIT) {
  const k = LORD_KIT[id];
  ok(KIND[id] != null && k.big.pow > 1 && k.big.aoe >= 1 && k.cry.length === 3 && STATUS[k.hazard] && (!k.big.st || STATUS[k.big.st[0]]), 'lord kit ' + id);
  for (const a of k.adds) ok(KIND[a] != null && !ZOMBIES[KIND[a]].lord, `${id} calls ${a}`);
}
ok(new Set(RIVAL_NAMES).size === RIVAL_NAMES.length && RIVAL_NAMES.length >= 12, 'rival names');
for (const id in STANCES) ok(['dmg', 'kill', 'heal', 'safe', 'ward', 'thrift'].every((k) => typeof STANCES[id][k] === 'number') && STANCES[id].desc, 'stance ' + id);
ok(ERRAND_ORDER.length === Object.keys(ERRANDS).length && ERRAND_ORDER.every((k) => ERRANDS[k]), 'every errand has its place in the order');
ok(DESTS.length === REGIONS.length + 2 && PURSES.length >= 3, 'somewhere to go and something to spend on');
{ const o = ordersOf({ orders: { prio: ['hunt', 'nonsense'], dest: 'nowhere' } }); ok(o.prio.length === ERRAND_ORDER.length && o.prio[0] === 'hunt' && o.dest === 'fair', 'orders mend themselves'); }
ok(new Set(BOONS.map((b) => b.id)).size === BOONS.length && BOONS.every((b) => b.add || b.gold || b.consum), 'boons');
for (const k of ['rout', 'ambush', 'courier', 'rescue', 'holdout', 'gate']) ok(GOALS[k], 'fight kind ' + k);
for (const ev of ['walk', 'seen', 'grave', 'easy', 'kill', 'crit', 'low', 'down', 'healed', 'combo', 'windup', 'call', 'won', 'close', 'lost', 'rival', 'rivalDown', 'chest', 'rest', 'shop', 'dread', 'lord', ...REGIONS.map((R) => R.id)])
  ok(BANTER[ev] && (Array.isArray(BANTER[ev]) ? BANTER[ev].length : BANTER[ev].any?.length), 'banter for ' + ev);
for (const k in BANTER.walk) ok(k === 'any' || HEROES[k] || CLASSES[k], 'banter.walk.' + k + ' is somebody');
ok(STRAYS.length >= 3 && STRAYS.every((d) => d.name && d.cry && d.thanks && CLASSES[d.look.cls]), 'strays');
// the V and T rule: nothing said anywhere names both of them
(function both(v, where) {
  if (typeof v === 'string') ok(!(/velscour/i.test(v) && /tessariel/i.test(v)), 'a line names both V and T: ' + where);
  else if (v && typeof v === 'object') for (const k in v) both(v[k], where + '.' + k);
})({ ...CAST, QUESTS, LORD_KIT }, 'data');
console.log(bad ? bad + ' FAILED' : 'all good'); process.exit(bad ? 1 : 0);
