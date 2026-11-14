// What an item looks like: the model in the hand and the picture in the bag. Every model here came from bm (its Tripo
// weapon sheets and the decimated kit its heroes carry), baked for this camera by tools/gear/bake.py: the grip at the
// origin, the business end up +Y, about 2,000 triangles and one 512 texture each, in assets/gear/<id>.glb, with
// assets/gear/icons/<id>.webp beside it.
//
// An item rolls its look once, when it's made (`it.look`): any id from its kind's pool at its tier. Older items, and
// anything without a look, show the first of the pool.

import { SKINS } from './skins.js';

// kind -> tier (Rusted, Iron, Steel, Tempered, Mithril) -> the ids it may look like
export const GEAR = {
  sword: [['iron_sword', 'copper_sword', 'falchion'], ['scimitar', 'lionguard_sword'], ['spiked_longsword', 'bluesteel_sword', 'goldspur_sword', 'vinewrap_sword'],
    ['sawback_sword', 'icevein_sword', 'bloodfire_sword', 'azure_sword', 'wildroot_sword'], ['rimeshard_sword', 'dusk_sword', 'emberfang_sword', 'moonring_sword', 'sunguard_sword']],
  axe: [['rust_axe', 'hatchet', 'iron_hatchet'], ['bearded_axe', 'broad_axe', 'bone_axe'], ['horned_axe', 'butcher_axe', 'gilded_axe'],
    ['iron_greataxe', 'ember_axe', 'frost_axe'], ['black_greataxe', 'inferno_greataxe', 'glacier_greataxe']],
  mace: [['studded_mace', 'ribbed_mace'], ['flanged_mace', 'iron_maul'], ['war_hammer', 'great_morning_star'],
    ['bonecrown_mace', 'skull_mace', 'icecrystal_mace'], ['gilded_lion_mace', 'bluewheel_mace', 'frostspire_maul']],
  spear: [['iron_spear', 'pennon_spear'], ['winged_spear', 'red_pike'], ['blue_pike', 'whitegold_spear'], ['icefang_spear', 'frost_spear'], ['crimson_twist_spear']],
  bow: [['yew_bow'], ['recurve_bow'], ['ironbound_bow'], ['leafwing_bow', 'emerald_bow'], ['dragonwing_bow', 'blossom_bow']],
  boomerang: [['wooden_boomerang'], ['spiked_boomerang'], ['blue_boomerang', 'lion_boomerang'], ['verdant_boomerang'], ['fire_boomerang']],
  staff: [['driftwood_staff', 'gnarled_crook', 'old_crook'], ['oakroot_staff', 'greenwood_staff', 'hedgewitch_staff', 'ember_staff'],
    ['gravecaller', 'thornwood_staff', 'moonstone_staff', 'fire_staff', 'crystal_staff', 'frostlance_staff'],
    ['bonelantern_staff', 'emberheart_staff', 'grovekeeper', 'orrery_staff', 'ice_staff', 'wildroot_staff'],
    ['lichs_lantern', 'dragonheart_staff', 'death_staff', 'celestial_orrery', 'galaxy_coil', 'hourglass_of_ages', 'druids_reliquary', 'emerald_vigil']],
  // a wand is a short staff: the same heads, drawn at under half the length
  wand: [['wraith_staff'], ['skullhorn_staff'], ['bonecrystal_staff'], ['crystal_staff'], ['galaxy_coil']],
  lute: [['lute_rosewood'], ['lute_greenwood'], ['lute_amber'], ['lute_ebony'], ['lute_ivory']],
  // the ninja's: a knife in each hand (gfx/gear.js puts the off hand's twin in the left)
  dagger: [['crescent_dagger'], ['horned_dagger'], ['serpent_dagger'], ['venom_dagger'], ['rubyfang_dagger']],
  // bm has no guns: the gunner's is built in code (gfx/gear.js), one look at every tier
  pistol: [['flintlock'], ['flintlock'], ['flintlock'], ['flintlock'], ['flintlock']],
  // not items: what the lancer's spear looks like (a lance), and the shields on the arms of the plate classes
  lance: [['blue_tourney_lance', 'gold_tourney_lance'], ['green_jousting_lance', 'gold_jousting_lance'], ['silver_lance'], ['lion_lance'], ['violet_lance']],
  kite: [['kite_chevron'], ['kite_greenwood', 'kite_blue_fleur'], ['kite_griffin', 'kite_azure_wing'], ['kite_gilded_drake', 'kite_gold_lion'], ['kite_palewyrm']],
  tower: [['tower_ivy'], ['tower_blue_lion'], ['tower_griffin', 'tower_eagle'], ['tower_laurel'], ['tower_gold_lion']],
};
// The kinds of the cross-shaped shields (compass, eclipse, radiant, dawnstar, sunburst) were left in bm: by the V and T rule
// nothing here carries either side's marks.

// How each look is held. hold: blade | haft (axe, mace) | pole (spear, lance, staff) | bow | rang | lute | kite | tower | dagger.
// scale: drawn larger or smaller than the model (a wand). Two-handed looks ride the right hand like the rest.
const HOLD = { sword: 'blade', axe: 'haft', mace: 'haft', spear: 'pole', lance: 'pole', staff: 'pole', wand: 'pole', bow: 'bow', boomerang: 'rang', lute: 'lute', kite: 'kite', tower: 'tower', pistol: 'blade', dagger: 'dagger' };
export const LOOKS = {};
for (const [kind, tiers] of Object.entries(GEAR)) for (const ids of tiers) for (const id of ids) LOOKS[id] ||= { id, kind, hold: HOLD[kind], scale: kind === 'wand' ? 0.42 : 1 };
// a wand drawn from a staff's model keeps its own entry under a key of its own
for (const ids of GEAR.wand) for (const id of ids) LOOKS['wand:' + id] = { id, kind: 'wand', hold: 'pole', scale: 0.42 };

// Which class carries what on the off arm.
export const SHIELDS = { paladin: 'kite', dragon_knight: 'kite', death_knight: null, lancer: 'tower', slime_lord: 'kite' };

// The pool an item draws from: the lancer's spear is a lance.
const poolKind = (kind, cls) => (kind === 'spear' && cls === 'lancer' ? 'lance' : kind);

// Picks an item's look when it's made. r: a random function.
export function rollLook(kind, tier, r = Math.random) {
  const row = GEAR[kind]?.[Math.min(4, tier || 0)];
  return row ? row[Math.floor(r() * row.length)] : null;
}

// The look an item shows (in the hand of `cls`, if given): its own if it rolled one that fits, else its pool's first.
export function gearId(it, cls) {
  if (!it) return null;
  const k = poolKind(it.kind, cls), row = GEAR[k]?.[Math.min(4, it.tier || 0)];
  if (!row) return null;
  return it.look && GEAR[k].some((r) => r.includes(it.look)) ? it.look : row[0];
}

// The entry for drawing an item's look in a hand: { id, kind, hold, scale }.
export function lookFor(it, cls) {
  const id = gearId(it, cls);
  if (!id) return null;
  return it.kind === 'wand' ? LOOKS['wand:' + id] : LOOKS[id];
}

// A shield for a hero of this class wearing armour of this tier; `seed` picks among the tier's looks so each hero keeps theirs.
export function shieldFor(cls, tier = 0, seed = 0) {
  const kind = SHIELDS[cls];
  if (!kind) return null;
  const row = GEAR[kind][Math.min(4, tier)];
  return LOOKS[row[Math.abs(seed) % row.length]];
}

// What bm's monsters carry (their bodies come without: tools/bm/foes.py), by kind of foe: [right hand, left arm], each a row
// of looks that `seed` picks from, so a pack doesn't come all alike.
export const FOE_GEAR = {
  goblin: [['crescent_dagger', 'rust_axe', 'venom_dagger', 'hatchet']],
  plague_knight: [['spiked_longsword', 'sawback_sword'], ['kite_palewyrm']],
  necromancer: [['bonelantern_staff', 'death_staff']],
  bone_golem: [['iron_greataxe']],
};
export function foeGear(id, seed = 0) {
  const g = FOE_GEAR[id];
  if (!g) return null;
  const pick = (row) => (row ? LOOKS[row[Math.abs(seed) % row.length]] : null);
  return { main: pick(g[0]), off: pick(g[1]) };
}

// What armour and helms look like on a body: one of bm's player skins (data/skins.js), rolled by rarity when the item is
// made (`it.skin`), and worn part by part (gfx/dye.js). An item made before looks were rolled shows one its uid picks.
const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]));
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const skinPool = (rarity) => { const p = SKINS.filter((s) => s.rarity === rarity); return p.length ? p : SKINS; };
export function rollSkin(rarity, r = Math.random) {
  const pool = skinPool(rarity);
  return pool[Math.floor(r() * pool.length)].id;
}
export function skinOf(it) {
  if (!it || (it.slot !== 'armor' && it.slot !== 'helm')) return null;
  if (it.skin && SKIN_BY_ID.has(it.skin)) return SKIN_BY_ID.get(it.skin);
  const pool = skinPool(it.rarity || 0);
  return pool[hash(it.uid) % pool.length];
}

// The picture for an item in the bag, a shop or the party screen; null if it has none (rings, amulets, armour, draughts).
export function iconFor(it) {
  if (!it) return null;
  const id = gearId(it);
  return id && id !== 'flintlock' ? `assets/gear/icons/${id}.webp` : null;
}
