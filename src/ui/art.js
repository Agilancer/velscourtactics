// The painted pictures the interface wears, from bm's art kit (its assets/ui/kit/, copied into assets/ui/ in the same
// layout): menu icons, goods, gems and spell pictures, asked for by name. The frames, buttons, tabs, bars and slots
// are the stylesheet's (css/style.css); this is what goes inside them.
import { iconFor } from '../data/gear.js';
import { RARITY } from '../data/items.js';

const U = 'assets/ui/';
export const ic = (n) => `${U}icons/${n}.webp`;
export const goods = (n) => `${U}goods/${n}.webp`;
export const spellArt = (n) => `${U}spells/${n}.webp`;

// ---- gear: the item's own picture when gear.js has one, else the picture of the place it's worn
const SLOT_IC = { weapon: 'slot_main', armor: 'slot_chest', helm: 'slot_head', ring: 'slot_ring', ring1: 'slot_ring', ring2: 'slot_ring', amulet: 'slot_neck' };
export const slotIcon = (slot) => ic(SLOT_IC[slot] || 'slot_main');
// pictures that came back missing, so a redraw goes straight to the fallback (filled by watchMissing)
const missing = new Set();
const img = (src, fb = '') => `<img src="${src}" alt="" draggable="false"${fb && fb !== src ? ` data-fb="${fb}"` : ''}>`;
/** A slot square with the item in it, ringed in its rarity's colour. */
export function itemPic(it, slot) {
  const fb = slotIcon(slot || it.slot);
  let src = null;
  try { src = iconFor(it); } catch { src = null; }
  if (!src || missing.has(src)) src = fb;
  return `<span class="pic${src === fb ? ' bare' : ''}" style="--rc:${RARITY[it.rarity]?.color || '#8a6a34'}">${img(src, fb)}</span>`;
}
/** An empty slot, showing what goes there. */
export const slotPic = (slot) => `<span class="pic empty">${img(slotIcon(slot))}</span>`;
/** A gem (id: kind + grade, e.g. 'ruby1'), in a square slot or (round) a socket. */
export const gemArt = (id) => goods(`gem_${id.slice(0, -1)}_${id.slice(-1)}`);
export const gemPic = (id, round = false) => `<span class="pic${round ? ' round' : ''}">${img(gemArt(id))}</span>`;
/** Any other picture in a square slot (extra classes tint it: see .pic.red / .pic.blue). */
export const goodsPic = (src, cls = '') => `<span class="pic ${cls}">${img(src)}</span>`;

// The draughts and what else the inn sells.
const CONSUMABLE_ART = { potion: [goods('oil'), 'red'], ether: [goods('oil'), 'blue'], tonic: [goods('wingbell'), ''] };
export const consumablePic = (k) => { const [src, cls] = CONSUMABLE_ART[k] || [goods('oil'), '']; return goodsPic(src, cls); };

// ---- skills: a picture of its own where one plainly fits, else its element's school, else what kind of thing it does
const SKILL_ART = {
  fire_bolt: 'firebolt', firebolt: 'firebolt', old_tricks: 'firebolt', meteor: 'meteor', grenade: 'bomb',
  dragon_breath: 'wyrm', fire_breath: 'firebeam', flame_slash: 'inferno', wave_of_candles: 'wallfire',
  frost_nova: 'nova', frost_shards: 'frost', frost_strike: 'rime', obliterate: 'shatter',
  chain_lightning: 'chain', spark: 'spark', the_snap: 'thunderclap',
  aegis: 'aegis', renew: 'renew', mend: 'mend', blessed_light: 'mend', hymn_of_mending: 'renew', lantern_light: 'wisp',
  stillness: 'stillness', lullaby: 'stasis', turn_the_dead: 'turn', consecration: 'sanctuary',
  stone_shard: 'stone', earthquake: 'quake', earth_shock: 'spikes',
  death_coil: 'drain', rot_bolt: 'plague', toxic_rain: 'plague', acid_splash: 'plague',
  star_missiles: 'missiles', falling_star: 'starfall', moonbeam: 'crescent', black_hole: 'well',
  ballad_of_valor: 'empower', dragon_scales: 'stoneskin', swirling_blades: 'blades',
  lance_jab: 'lance', lance_thrust: 'lance', lance_charge: 'lance',
  healing_totem: 'monolith', searing_totem: 'monolith', slime_ball: 'orb',
};
const SCHOOL = { fire: 'school_fire', cold: 'school_ice', storm: 'school_lightning', arcane: 'school_arcane', shadow: 'school_arcane', holy: 'school_utility', light: 'school_utility' };
const KIND_IC = { heal: 'role_heal', buff: 'guard', phys: 'role_dps' };
/** The picture for a skill or a scroll's spell. */
export function skillArt(sk) {
  if (SKILL_ART[sk.id]) return spellArt(SKILL_ART[sk.id]);
  if (sk.el === 'poison' || sk.el === 'acid') return spellArt('plague');
  if (SCHOOL[sk.el]) return ic(SCHOOL[sk.el]);
  return ic(KIND_IC[sk.kind] || 'cast');
}
/** A round skill slot with the skill's picture (lit when it's open to use). */
export const skillPic = (sk, open = true) => `<span class="pic round${open ? ' lit' : ' shut'}">${img(skillArt(sk))}</span>`;

// ---- what a class is for, read off its role line ('Front line, healer', 'The wall', 'Elemental artillery', ...)
export const ROLE_NAMES = { tank: 'Front line', heal: 'Healer', dps: 'Damage' };
export function rolesOf(C) {
  const t = (C.role || '').toLowerCase(), out = [];
  if (/front|wall|soak|guard|shield/.test(t)) out.push('tank');
  if (/heal|mend/.test(t)) out.push('heal');
  if (!out.length || /burn|fire|artillery|range|blade|brawl|curse|powder|leap|star|rot|hex/.test(t)) out.push('dps');
  return out;
}
export const roleIcons = (C, big = false) => rolesOf(C).map((r) => `<i class="role${big ? ' big' : ''}" title="${ROLE_NAMES[r]}"><img src="${ic('role_' + r)}" alt="${ROLE_NAMES[r]}" draggable="false"></i>`).join('');

/** Under `root`, a picture that fails to load falls back to its data-fb, and is remembered as missing. */
export function watchMissing(root) {
  root.addEventListener('error', (e) => {
    const t = e.target;
    if (t.tagName !== 'IMG' || !t.dataset.fb) return;
    missing.add(t.getAttribute('src'));
    const fb = t.dataset.fb; delete t.dataset.fb;
    t.src = fb; t.parentElement?.classList.add('bare');
  }, true);
}
