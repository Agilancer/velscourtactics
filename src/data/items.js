// Gear, gems and the small things in your pockets. Tier and rarity names and colours are VELSCOUR's.
import { uid, pick, rint } from '../core/util.js';

export const TIERS = [
  { name: 'Rusted', lvl: 1, mult: 1 },
  { name: 'Iron', lvl: 3, mult: 1.6 },
  { name: 'Steel', lvl: 5, mult: 2.3 },
  { name: 'Tempered', lvl: 8, mult: 3.2 },
  { name: 'Mithril', lvl: 11, mult: 4.3 },
];
export const RARITY = [
  { name: 'Common', color: '#e8e8e8', affixes: 0, sockets: 1 },
  { name: 'Uncommon', color: '#4fd65a', affixes: 1, sockets: 2 },
  { name: 'Rare', color: '#4f8dff', affixes: 2, sockets: 3 },
  { name: 'Epic', color: '#b45cff', affixes: 3, sockets: 4 },
  { name: 'Legendary', color: '#ff9a2a', affixes: 4, sockets: 4 },
];

// stat: which of the wielder's numbers a plain attack uses. r: reach in tiles.
export const WEAPONS = {
  sword: { stat: 'atk', r: [1, 1], pow: 6, names: ['Shortsword', 'Arming Sword', 'Longsword', 'Gallows Cleaver', 'Runeblade'] },
  axe: { stat: 'atk', r: [1, 1], pow: 7, names: ['Hatchet', 'Bearded Axe', 'War Axe', 'Headsman', 'Executioner'] },
  mace: { stat: 'atk', r: [1, 1], pow: 6, names: ['Club', 'Chapel Mace', 'Bell Hammer', 'Ossuary Mace', 'Reliquary Mace'] },
  spear: { stat: 'atk', r: [1, 2], pow: 5, names: ['Spear', 'Boar Spear', 'Partisan', 'Wyrm Pike', 'Dragon Lance'] },
  bow: { stat: 'atk', r: [2, 5], pow: 5, names: ['Short Bow', 'Hunting Bow', 'Longbow', 'Horn Bow', 'Matriarchal Bow'] },
  pistol: { stat: 'atk', r: [2, 4], pow: 6, names: ['Flintlock', 'Dragoon Pistol', 'Wheel-lock', 'Brass Repeater', 'Dragon Pistol'] },
  boomerang: { stat: 'atk', r: [1, 3], pow: 5, names: ['Throwing Stick', 'Hooked Rang', 'Steel Rang', 'Chakram', 'Moon Glaive'] },
  staff: { stat: 'mag', r: [1, 3], pow: 6, names: ['Quarterstaff', 'Ash Staff', 'Grave Iron Staff', 'Bone-Shod Staff', 'Elder Staff'] },
  wand: { stat: 'mag', r: [1, 4], pow: 5, names: ['Twig Wand', 'Yew Wand', 'Bone Wand', 'Candle Wand', 'Unearthed Wand'] },
  lute: { stat: 'mag', r: [1, 3], pow: 5, names: ['Lute', 'Travelling Lute', 'Gittern', 'Mourner’s Lute', 'Lute of Ages'] },
};
export const ARMORS = {
  cloth: { def: 2, res: 4, hp: 0, names: ['Robe', 'Shroud Silk Robe', 'Scholar’s Robe', 'Vigil Robe', 'Ancient Vestment'] },
  leather: { def: 3, res: 2.5, hp: 4, names: ['Leather Armor', 'Studded Leather', 'Hunter’s Coat', 'Brigandine', 'Wyrmhide'] },
  plate: { def: 5, res: 1, hp: 8, names: ['Chain Mail', 'Breastplate', 'Plate Armor', 'Templar Plate', 'Ancient Armor'] },
};
export const HELMS = { names: ['Cap', 'Coif', 'Kettle Helm', 'Barbute', 'Great Helm'] };
export const RING_NAMES = ['Tin Ring', 'Iron Band', 'Signet', 'Mourning Ring', 'Bellfounder’s Ring'];
export const AMULET_NAMES = ['Tooth on a String', 'Copper Charm', 'Saint’s Medal', 'Reliquary Locket', 'Wingbell'];

export const STAT_NAMES = { hp: 'Life', mp: 'Mana', atk: 'Attack', mag: 'Magic', def: 'Armor', res: 'Ward', spd: 'Speed', crit: 'Crit %', leech: 'Leech %' };

// [name, isPrefix, stat, amount per tier (rounded up)]
export const AFFIXES = [
  ['Vicious', true, 'atk', 2], ['Sage’s', true, 'mag', 2], ['Stalwart', true, 'def', 1.5], ['Warding', true, 'res', 1.5],
  ['Swift', true, 'spd', 0.6], ['Keen', true, 'crit', 3], ['of the Bear', false, 'hp', 9], ['of the Well', false, 'mp', 6],
  ['of the Leech', false, 'leech', 3], ['of the Hollow', false, 'res', 2], ['of the Anvil', false, 'def', 2], ['of the Pines', false, 'spd', 0.5],
];

export const GEMS = {
  ruby: { name: 'Ruby', stat: 'atk', vals: [2, 4, 7], color: '#d83a3a' },
  sapphire: { name: 'Sapphire', stat: 'mag', vals: [2, 4, 7], color: '#3a6ad8' },
  emerald: { name: 'Emerald', stat: 'hp', vals: [12, 24, 40], color: '#3ab85a' },
  topaz: { name: 'Topaz', stat: 'spd', vals: [1, 2, 3], color: '#e8c040' },
  amethyst: { name: 'Amethyst', stat: 'res', vals: [2, 4, 7], color: '#a050d8' },
  diamond: { name: 'Diamond', stat: 'def', vals: [2, 4, 7], color: '#d8e8f0' },
};
export const GEM_GRADES = ['Chipped', 'Flawed', 'Flawless'];
export const GEM_PRICE = [45, 130, 340];
export const gemInfo = (id) => {
  const g = GEMS[id.slice(0, -1)], grade = +id.slice(-1);
  return { ...g, grade, id, full: `${GEM_GRADES[grade]} ${g.name}`, val: g.vals[grade], price: GEM_PRICE[grade] };
};

export const CONSUMABLES = {
  potion: { name: 'Red Draught', price: 25, desc: 'Mends 45% of one friend’s life. Red for blood.' },
  ether: { name: 'Blue Draught', price: 35, desc: 'Gives back 45% of mana. Blue for wits.' },
  tonic: { name: 'Bell Tonic', price: 90, desc: 'Gets a fallen friend back up with a third of their life.' },
};

// kind: a weapon type, an armor weight, 'helm', 'ring' or 'amulet'.
export function makeItem(kind, tier = 0, rarity = 0, r = Math.random) {
  const T = TIERS[tier], it = { uid: uid('i'), kind, tier, rarity, plus: 0, affixes: [], gems: [], sockets: 0, base: {} };
  const m = T.mult;
  if (WEAPONS[kind]) { it.slot = 'weapon'; it.base[WEAPONS[kind].stat] = Math.round(WEAPONS[kind].pow * m); it.baseName = WEAPONS[kind].names[tier]; }
  else if (ARMORS[kind]) {
    const a = ARMORS[kind]; it.slot = 'armor'; it.baseName = a.names[tier];
    it.base.def = Math.round(a.def * m); it.base.res = Math.round(a.res * m); if (a.hp) it.base.hp = Math.round(a.hp * m);
  } else if (kind === 'helm') { it.slot = 'helm'; it.baseName = HELMS.names[tier]; it.base.def = Math.round(1.6 * m); it.base.hp = Math.round(5 * m); }
  else if (kind === 'ring') {
    it.slot = 'ring'; it.baseName = RING_NAMES[tier];
    const s = pick(['atk', 'mag', 'def', 'res', 'spd', 'crit'], r);
    it.base[s] = Math.max(1, Math.round((s === 'spd' ? 0.7 : s === 'crit' ? 3 : 1.6) * m));
  } else if (kind === 'amulet') { it.slot = 'amulet'; it.baseName = AMULET_NAMES[tier]; it.base.hp = Math.round(8 * m); it.base.mp = Math.round(5 * m); }
  for (let k = 0; k < RARITY[rarity].affixes; k++) addAffix(it, r);
  if (it.slot !== 'ring' && it.slot !== 'amulet') it.sockets = r() < 0.35 + rarity * 0.15 ? 1 : 0;
  return it;
}

export function addAffix(it, r = Math.random) {
  const have = new Set(it.affixes.map((a) => a[0]));
  const pool = AFFIXES.filter((a) => !have.has(a[0]) && !(it.slot === 'weapon' && (a[2] === 'def' || a[2] === 'res')));
  if (!pool.length) return false;
  const a = pick(pool, r);
  it.affixes.push([a[0], a[1], a[2], Math.max(1, Math.ceil(a[3] * (1 + it.tier) * (0.8 + r() * 0.4)))]);
  return true;
}

export function itemName(it) {
  const pre = it.affixes.find((a) => a[1]), suf = it.affixes.find((a) => !a[1]);
  return `${pre ? pre[0] + ' ' : ''}${it.baseName}${suf ? ' ' + suf[0] : ''}${it.plus ? ' +' + it.plus : ''}`;
}

export function itemStats(it) {
  const s = {};
  const mul = 1 + 0.1 * it.plus;
  for (const k in it.base) s[k] = Math.round(it.base[k] * mul);
  for (const a of it.affixes) s[a[2]] = (s[a[2]] || 0) + a[3];
  for (const g of it.gems) if (g) { const gi = gemInfo(g); s[gi.stat] = (s[gi.stat] || 0) + gi.val; }
  return s;
}

export function itemValue(it) {
  const base = it.slot === 'weapon' ? 40 : it.slot === 'armor' ? 36 : it.slot === 'helm' ? 24 : 55;
  return Math.round(base * TIERS[it.tier].mult * (1 + it.rarity * 0.7) * (1 + it.plus * 0.25) + it.sockets * 30);
}
export const sellValue = (it) => Math.round(itemValue(it) * 0.4);
export const enhanceCost = (it) => Math.round(itemValue(it) * 0.35 * (1 + it.plus * 0.5)) + 20;
export const enchantCost = (it) => Math.round(itemValue(it) * 0.5) + 60;
export const socketCost = (it) => 120 * (it.sockets + 1) * (it.sockets + 1);
export const maxSockets = (it) => (it.slot === 'ring' || it.slot === 'amulet' ? 1 : RARITY[it.rarity].sockets);

export function itemLines(it) {
  const s = itemStats(it), out = [];
  for (const k in s) out.push(`+${s[k]} ${STAT_NAMES[k]}`);
  if (it.sockets) out.push('Sockets: ' + Array.from({ length: it.sockets }, (_, i) => (it.gems[i] ? gemInfo(it.gems[i]).full : 'empty')).join(', '));
  return out;
}

export const tierForLevel = (lvl) => { let t = 0; for (let i = 0; i < TIERS.length; i++) if (lvl >= TIERS[i].lvl) t = i; return t; };

// What a dead thing leaves behind.
export function rollLoot(level, r = Math.random) {
  const out = { gold: rint(4, 9, r) + level * rint(2, 4, r), items: [], gems: [] };
  if (r() < 0.2) {
    const tier = Math.max(0, tierForLevel(level) - (r() < 0.5 ? 1 : 0));
    const rr = r(), rarity = rr < 0.5 ? 0 : rr < 0.82 ? 1 : rr < 0.96 ? 2 : 3;
    const kinds = [...Object.keys(WEAPONS), ...Object.keys(ARMORS), 'helm', 'helm', 'ring', 'amulet'];
    out.items.push(makeItem(pick(kinds, r), tier, rarity, r));
  }
  if (r() < 0.14) out.gems.push(pick(Object.keys(GEMS), r) + (r() < 0.8 ? 0 : 1));
  return out;
}
