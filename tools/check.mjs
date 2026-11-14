// Sanity checks that need no browser: the world builds, every class and item is well formed.
import { buildWorld, TOWN, N } from '../src/world/map.js';
import { CLASSES, CLASS_IDS, SPELLS, SUMMONS } from '../src/data/classes.js';
import { WEAPONS, ARMORS, makeItem, itemName, itemStats } from '../src/data/items.js';
import { ZOMBIES, QUESTS, zombieStats } from '../src/data/enemies.js';
import { FOLK, HEROES } from '../src/data/cast.js';
import { newState, heroStats, recruit, heroSkills } from '../src/game/party.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.error('FAIL', m); } };
const w = buildWorld();
console.log('trees', w.trees.length, 'packs', w.packs.length, 'foes', w.packs.reduce((a, p) => a + p.members.length, 0), 'chests', w.chests.length, 'start', w.start);
const kinds = new Set(w.packs.flatMap((p) => p.members.map((m) => m.kind)));
ok(kinds.size === ZOMBIES.length, 'every kind of the dead is out there: ' + [...kinds].sort((a, b) => a - b));
ok(w.places.length === 5, 'four ruins and the oasis: ' + w.places.map((p) => p.name));
for (const p of w.packs) for (const m of p.members) ok(ZOMBIES[m.kind] && w.reach[w.I(m.x, m.z)], 'pack member on reachable ground');
for (const c of w.chests) { let near = false; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.reach[w.I(c.x + dx, c.z + dz)]) near = true; ok(near || !c.id.startsWith('place'), 'chest can be opened: ' + c.id); }
ok(w.reach[w.I(TOWN.cx, TOWN.cz + 1)], 'the square can be reached from the start');
for (const edge of [[w.start.x, N - 2], [TOWN.cx, 1], [N - 2, TOWN.cz], [1, TOWN.cz]]) { let hit = false; for (let d = -8; d <= 8; d++) { if (w.reach[w.I(edge[0] + (edge[1] === N - 2 || edge[1] === 1 ? d : 0), edge[1] + (edge[0] === N - 2 || edge[0] === 1 ? d : 0))]) hit = true; } ok(hit, 'road reaches edge ' + edge); }
ok(CLASS_IDS.length === 16, 'sixteen classes');
for (const id in CLASSES) { const C = CLASSES[id]; ok(C.skills.length === 4, id + ' has four skills'); for (const wk of C.weapon) ok(WEAPONS[wk], id + ' weapon ' + wk); ok(ARMORS[C.armor], id + ' armor'); for (const s of C.skills) if (s.summon) ok(SUMMONS[s.summon], 'summon ' + s.summon); }
for (const f of FOLK) { if (f.hero) ok(HEROES[f.hero], 'hero ' + f.hero); if (typeof f.at === 'string') ok(w.buildings.find((b) => b.id === f.at), 'building ' + f.at); else ok(w.walkable(f.at[0], f.at[1]), `${f.id} stands on a free tile ${f.at}`); }
for (const q of QUESTS) if (q.kill && q.kill !== 'any') ok(ZOMBIES.find((z) => z.id === q.kill), 'quest kind ' + q.kill);
const st = newState({ name: 'Test', cls: 'paladin', g: 'm' });
for (const h in HEROES) recruit(st, h);
for (const h of Object.values(st.heroes)) { const s = heroStats(h); ok(s.hp > 0 && s.atk > 0 && heroSkills(h).length >= 1, h.name + ' stats'); }
console.log('paladin L1', heroStats(st.heroes.lead), 'shambler L1', zombieStats(0, 1), 'brute L9', zombieStats(4, 9));
console.log(itemName(makeItem('sword', 2, 3)), itemStats(makeItem('plate', 1, 1)));
console.log(bad ? bad + ' FAILED' : 'all good'); process.exit(bad ? 1 : 0);
