// Heroes: what they are, what they wear, what they can do. Also the save.
import { CLASSES, SPELLS, findSkill } from '../data/classes.js';
import { WEAPONS, itemStats, makeItem } from '../data/items.js';
import { HEROES } from '../data/cast.js';
import { QUESTS } from '../data/enemies.js';

export const PARTY_MAX = 6;
export const SLOTS = ['weapon', 'armor', 'helm', 'ring1', 'ring2', 'amulet'];
export const SLOT_NAMES = { weapon: 'Weapon', armor: 'Armor', helm: 'Helm', ring1: 'Ring', ring2: 'Ring', amulet: 'Charm' };
const SAVE_KEY = 'velscour-tactics-save-1';

export const xpNeed = (lvl) => 40 + 25 * lvl * lvl;

export function newHero(id, { name, cls, g, heroId = null, lvl = 1 }) {
  const C = CLASSES[cls];
  const h = { id, heroId, name, cls, g, lvl, xp: 0, hp: 1, mp: 0, equip: {}, spells: [] };
  h.equip.weapon = makeItem(C.weapon[0], 0, 0);
  h.equip.armor = makeItem(C.armor, 0, 0);
  const s = heroStats(h);
  h.hp = s.hp; h.mp = s.mp;
  return h;
}
export function heroFromCast(heroId, lvl = 1) {
  const d = HEROES[heroId];
  return newHero(heroId, { name: d.name, cls: d.cls, g: d.g, heroId, lvl });
}

export function heroStats(h) {
  const C = CLASSES[h.cls], L = h.lvl - 1;
  const idx = { str: 0, dex: 1, vit: 2, int: 3 }[C.primary];
  const a = C.attrs.map((v, i) => v + L * (i === idx ? 2 : 0.8));
  const [str, dex, vit, int] = a;
  const phys = C.primary === 'dex' ? dex : Math.max(str, vit * 0.75);
  const s = {
    hp: Math.round(C.life[0] + C.life[1] * L), mp: Math.round(C.mana[0] + C.mana[1] * L),
    atk: Math.round(phys * 0.42), mag: Math.round(int * 0.42),
    def: Math.round(str * 0.1 + vit * 0.15), res: Math.round(int * 0.15 + vit * 0.08),
    spd: 5 + Math.round(dex * 0.15), crit: 5 + Math.round(dex * 0.1), leech: 0,
    move: C.move, jump: C.jump,
  };
  for (const slot of SLOTS) {
    const it = h.equip[slot];
    if (!it) continue;
    const st = itemStats(it);
    for (const k in st) s[k] = (s[k] || 0) + st[k];
  }
  if (C.resource === 'rage') s.mp = 100;
  return s;
}

export function canEquip(h, it) {
  const C = CLASSES[h.cls];
  if (it.slot === 'weapon') return C.weapon.includes(it.kind);
  if (it.slot === 'armor') return C.armor === it.kind;
  return true;
}
export const slotsFor = (it) => (it.slot === 'ring' ? ['ring1', 'ring2'] : [it.slot]);

// The plain attack, shaped like a skill so combat treats it the same.
export function basicAttack(h) {
  const w = h.equip.weapon, W = w ? WEAPONS[w.kind] : { stat: 'atk', r: [1, 1] };
  return { id: 'attack', name: 'Attack', cost: 0, r: W.r, aoe: 0, at: 'enemy', kind: W.stat === 'mag' ? 'magic' : 'phys', pow: 1, basic: true, rage: 25, anim: CLASSES[h.cls].basicAnim, desc: 'A plain blow with what you are holding.' };
}
export function heroSkills(h) {
  return [...CLASSES[h.cls].skills.filter((s) => h.lvl >= s.lvl), ...h.spells.map((id) => SPELLS[id]).filter(Boolean)];
}

// Returns the levels gained.
export function gainXp(h, n) {
  h.xp += n;
  let ups = 0;
  while (h.xp >= xpNeed(h.lvl) && h.lvl < 30) { h.xp -= xpNeed(h.lvl); h.lvl++; ups++; }
  if (ups) { const s = heroStats(h); h.hp = s.hp; h.mp = CLASSES[h.cls].resource === 'rage' ? 0 : s.mp; }
  return ups;
}

export function newState({ name, cls, g }) {
  const st = {
    v: 1, name, gold: 120, heroes: {}, party: ['lead'], reserve: [], bag: [], bagSize: 24,
    gems: {}, consum: { potion: 3, ether: 1, tonic: 1 }, quests: {}, kills: {}, slain: {}, opened: {}, met: {},
    pos: null, dpad: 'A', auto: false, day: 1, flags: {}, stock: {},
  };
  st.heroes.lead = newHero('lead', { name, cls, g });
  return st;
}
export const lead = (st) => st.heroes[st.party[0]];
export const partyHeroes = (st) => st.party.map((id) => st.heroes[id]);
export const hasHero = (st, heroId) => !!st.heroes[heroId];

export function recruit(st, heroId) {
  if (st.heroes[heroId]) return null;
  const h = heroFromCast(heroId, Math.max(1, lead(st).lvl - (heroId === 'lisandra' ? 0 : 1)));
  st.heroes[heroId] = h;
  (st.party.length < PARTY_MAX ? st.party : st.reserve).push(heroId);
  return h;
}

export function restAll(st) {
  for (const h of Object.values(st.heroes)) { const s = heroStats(h); h.hp = s.hp; h.mp = CLASSES[h.cls].resource === 'rage' ? 0 : s.mp; }
}

// ---- quests ----
export function startQuest(st, id) { if (!st.quests[id]) st.quests[id] = { state: 'active', n: 0 }; }
export function questProgress(st, q) {
  const s = st.quests[q.id];
  if (!s) return 0;
  if (q.recruit) return Math.min(q.recruit, st.party.length);
  return Math.min(q.need, s.n);
}
export const questNeed = (q) => q.recruit || q.need;
export const questReady = (st, q) => st.quests[q.id]?.state === 'active' && questProgress(st, q) >= questNeed(q);
export function noteKill(st, zombieId) {
  st.kills[zombieId] = (st.kills[zombieId] || 0) + 1;
  for (const q of QUESTS) {
    const s = st.quests[q.id];
    if (s && s.state === 'active' && q.kill && (q.kill === 'any' || q.kill === zombieId)) s.n++;
  }
}

// ---- save ----
export function save(st) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (e) { console.warn('save failed', e); }
}
export function load() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch { /* nothing to wipe */ } }
export { findSkill };
