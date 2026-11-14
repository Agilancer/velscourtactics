// How a fight looks: the staging round every blow, spell and song, the numbers that jump off whoever is hit,
// and the colour each of them wears while a status lasts. Battle decides what happens; this decides what it
// looks like (src/gfx/fx.js draws it).
//
// A skill's look comes from LOOK below where it has one, else from what it is: its school (`el`), its shape (a blast,
// a line, a cone, a chain), its reach, and the weapon behind a plain attack. `big` sets the size of the occasion:
// 0 a blow, 1 a spell worth a moment (the world dims, the view leans in), 2 a class's last skills (a cut-in across
// the screen first).
import * as THREE from 'three';
import { el, esc } from '../core/util.js';
import { palOf, CELL } from '../gfx/fx.js';
import { STATUS } from '../data/classes.js';
import { sound, sfx } from '../core/audio.js';

// The school a plain attack (or a skill with no `el`) is drawn in, by class.
const CLASS_EL = {
  paladin: 'holy', ranger: 'wind', wizard: 'fire', necromancer: 'shadow', barbarian: 'earth', dragoon: 'wind', totem_master: 'light',
  death_knight: 'cold', arcane_sorcerer: 'arcane', carrion_witch: 'poison', bard: 'sound', slime_lord: 'acid', boomerang_knight: 'wind',
  lancer: 'phys', dragon_knight: 'fire', gunner: 'fire', doorkeeper: 'fire', ninja: 'shadow',
};
// How a plain attack gets there, by weapon.
const WEAPON_GO = { bow: ['arrow'], pistol: ['bullet'], boomerang: ['rang'], staff: ['bolt', 'orb'], wand: ['bolt', 'orb'], lute: ['bolt', 'note'], spear: ['thrust'] };

// go: melee | thrust | bolt | arrow | arrows | bullet | lob | beam | chain | fall | rain | swarm | rang | nova | ground |
//     erupt | grace | aura | self | summon | cone | skybeam | vortex | tornado | snap | trap | line | pierce | spread
// kind: what flies (orb, flame, shard, star, note, bone, rock, crow, spear, bullet, arrow, skull)
export const LOOK = {
  // the Paladin
  smite: { go: 'melee', el: 'holy', post: 'pillar' }, holy_bolt: { go: 'bolt', kind: 'spear', el: 'holy', speed: 18 }, blessed_light: { go: 'grace', el: 'holy' },
  consecration: { go: 'nova', el: 'holy', glyph: true },
  // the Ranger
  quick_shot: { go: 'arrow' }, multishot: { go: 'arrows' }, rain_of_arrows: { go: 'rain', kind: 'arrow', el: 'wind' }, wolf_pack: { go: 'summon', el: 'wind' },
  // the Wizard
  fire_bolt: { go: 'bolt', kind: 'flame', el: 'fire' }, frost_nova: { go: 'nova', el: 'cold' }, chain_lightning: { go: 'chain', el: 'storm' },
  meteor: { go: 'fall', kind: 'meteor', el: 'fire', size: 0.7 },
  // the Necromancer
  bone_spike: { go: 'bolt', kind: 'bone', el: 'shadow', speed: 16 }, raise_skeleton: { go: 'summon', el: 'shadow' }, weaken: { go: 'grace', el: 'shadow' },
  corpse_explosion: { go: 'erupt', el: 'shadow', bones: true },
  // the Barbarian
  bash: { go: 'melee', el: 'earth' }, leap: { go: 'melee', el: 'earth', slam: true }, whirlwind: { go: 'nova', el: 'phys', spin: true }, earthquake: { go: 'ground', el: 'earth' },
  // the Dragoon
  lance_jab: { go: 'thrust' }, jump: { go: 'melee', slam: true, el: 'wind' }, dragon_breath: { go: 'cone', el: 'fire' }, dragon_dive: { go: 'melee', slam: true, el: 'fire' },
  // the Totem Master
  spirit_strike: { go: 'bolt', kind: 'orb', el: 'light' }, healing_totem: { go: 'summon', el: 'light' }, searing_totem: { go: 'summon', el: 'fire' }, earth_shock: { go: 'ground', el: 'storm' },
  // the Death Knight
  frost_strike: { go: 'melee', el: 'cold' }, death_coil: { go: 'bolt', kind: 'orb', el: 'shadow', curve: 0.6 }, raise_ghoul: { go: 'summon', el: 'shadow' }, obliterate: { go: 'melee', el: 'cold', shatter: true },
  // the Astronomer
  star_missiles: { go: 'bolt', kind: 'star', el: 'arcane', curve: 0.9, speed: 15 }, moonbeam: { go: 'skybeam', el: 'arcane' }, falling_star: { go: 'fall', kind: 'orb', el: 'arcane', size: 0.6 },
  black_hole: { go: 'vortex', el: 'shadow' },
  // the Carrion Witch
  rot_bolt: { go: 'bolt', kind: 'orb', el: 'poison' }, crow_swarm: { go: 'swarm', kind: 'crow', el: 'shadow' }, voodoo_doll: { go: 'grace', el: 'shadow', hex: true }, toxic_rain: { go: 'rain', kind: 'drop', el: 'poison' },
  // the Bard
  plucked_note: { go: 'bolt', kind: 'note', el: 'sound' }, ballad_of_valor: { go: 'aura', el: 'sound' }, hymn_of_mending: { go: 'aura', el: 'light' }, lullaby: { go: 'swarm', kind: 'note', el: 'sound' },
  // the Slime Lord
  slime_ball: { go: 'lob', kind: 'orb', el: 'acid' }, slimeling: { go: 'summon', el: 'acid' }, body_slam: { go: 'melee', slam: true, el: 'acid' }, acid_splash: { go: 'lob', kind: 'orb', el: 'acid', size: 0.55 },
  // the Boomerang Knight
  boomerang: { go: 'rang' }, twin_rang: { go: 'rang' }, swirling_blades: { go: 'nova', el: 'wind', spin: true }, typhoon: { go: 'tornado', el: 'wind' },
  // the Lancer
  lance_thrust: { go: 'thrust' }, tower_shield: { go: 'aura', el: 'phys' }, squire_knight: { go: 'summon', el: 'holy' }, lance_charge: { go: 'melee', slam: true, el: 'phys' },
  // the Dragon Knight
  flame_slash: { go: 'melee', el: 'fire' }, fire_breath: { go: 'cone', el: 'fire' }, dragon_scales: { go: 'self', el: 'fire' }, summon_whelp: { go: 'summon', el: 'fire' },
  // the Gunner
  pistol_shot: { go: 'bullet' }, grenade: { go: 'lob', kind: 'rock', el: 'fire', boom: true }, gun_turret: { go: 'summon', el: 'phys' }, bullet_hell: { go: 'bullet' },
  // the Ninja
  throwing_stars: { go: 'bolt', kind: 'star', el: 'phys', speed: 22 }, shadow_step: { go: 'melee', el: 'shadow', slashes: true },
  smoke_bomb: { go: 'lob', kind: 'orb', el: 'shadow', size: 0.5 }, venom_edge: { go: 'melee', el: 'poison' }, vanish: { go: 'self', el: 'shadow' },
  hundred_cuts: { go: 'melee', el: 'phys', slashes: true }, last_cut: { go: 'melee', el: 'shadow', shatter: true },
  // Lisandra
  old_tricks: { go: 'bolt', kind: 'flame', el: 'fire' }, the_snap: { go: 'snap', el: 'holy' }, lantern_light: { go: 'grace', el: 'holy' }, wave_of_candles: { go: 'nova', el: 'fire', glyph: true },
  // scrolls
  mend: { go: 'grace', el: 'light' }, firebolt: { go: 'bolt', kind: 'flame', el: 'fire' }, frost_shards: { go: 'bolt', kind: 'shard', el: 'cold' }, stone_shard: { go: 'lob', kind: 'rock', el: 'earth' },
  spark: { go: 'bolt', kind: 'orb', el: 'storm' }, aegis: { go: 'grace', el: 'holy' }, renew: { go: 'grace', el: 'light' }, turn_the_dead: { go: 'skybeam', el: 'holy' }, stillness: { go: 'grace', el: 'shadow' },
  // the dead and their company
  retch: { go: 'lob', kind: 'orb', el: 'poison' }, chain_sweep: { go: 'nova', el: 'phys', spin: true }, bone_sweep: { go: 'nova', el: 'phys', spin: true },
  slam: { go: 'melee', el: 'earth', slam: true }, quake: { go: 'ground', el: 'earth' }, crushing_blow: { go: 'melee', el: 'earth', slam: true }, crush: { go: 'melee', el: 'earth' },
  shriek: { go: 'nova', el: 'sound' }, web: { go: 'lob', kind: 'orb', el: 'phys', color: 0xe8e8e0 }, venom_bite: { go: 'melee', el: 'poison' }, rot_blade: { go: 'melee', el: 'poison' },
  shadow_bolt: { go: 'bolt', kind: 'orb', el: 'shadow' }, wither: { go: 'grace', el: 'shadow' }, hurl_bones: { go: 'lob', kind: 'bone', el: 'phys' },
  bite: { go: 'melee', el: 'blood' }, maul: { go: 'melee', el: 'blood' }, claw: { go: 'melee', el: 'blood' }, talons: { go: 'melee', el: 'blood' },
  rake: { go: 'melee', el: 'blood' }, pounce: { go: 'melee', el: 'blood', slam: true }, dive: { go: 'melee', el: 'wind', slam: true },
  frozen_grip: { go: 'melee', el: 'cold' }, flurry: { go: 'melee', el: 'blood', slashes: true }, rib_throw: { go: 'lob', kind: 'bone', el: 'phys' },
  drag_under: { go: 'beam', el: 'shadow' }, leech: { go: 'beam', el: 'blood' }, ember_claw: { go: 'melee', el: 'fire' },
  slag_spray: { go: 'lob', kind: 'orb', el: 'fire', size: 0.5 }, winter_toll: { go: 'nova', el: 'cold', glyph: true }, glaive: { go: 'thrust', el: 'phys' },
  sandstorm: { go: 'tornado', el: 'earth' }, dirge: { go: 'swarm', kind: 'note', el: 'shadow' }, firebox: { go: 'lob', kind: 'rock', el: 'fire', boom: true },
  shovel: { go: 'melee', el: 'earth', slam: true },

  // ---- the skills only the tactics game has (levels 2, 4, 8 and 13) ----
  shield_bash: { go: 'melee', el: 'holy', slam: true }, lay_on_hands: { go: 'grace', el: 'holy' }, radiant_spark: { go: 'chain', el: 'holy' }, judgment_beam: { go: 'line', el: 'holy' },
  piercing_arrow: { go: 'pierce', kind: 'arrow', el: 'wind' }, net_shot: { go: 'arrow', el: 'phys', color: 0xd8d0b8 }, spike_trap: { go: 'trap', el: 'phys' }, pinning_shot: { go: 'arrow', el: 'wind' },
  ice_lance: { go: 'pierce', kind: 'shard', el: 'cold', size: 0.55 }, teleport: { go: 'nova', el: 'storm' }, living_bomb: { go: 'grace', el: 'fire', hex: true }, blizzard: { go: 'rain', kind: 'shard', el: 'cold' },
  blood_drain: { go: 'beam', el: 'blood' }, doom: { go: 'grace', el: 'shadow', hex: true }, bone_armor: { go: 'grace', el: 'shadow' }, bone_spear: { go: 'pierce', kind: 'bone', el: 'shadow', size: 0.6 },
  taunt: { go: 'self', el: 'blood' }, hurl: { go: 'melee', el: 'earth' }, executioner: { go: 'melee', el: 'blood', slam: true }, wrath_of_the_berserker: { go: 'self', el: 'blood' },
  twin_thrust: { go: 'thrust' }, skewer: { go: 'pierce', kind: 'spear', el: 'wind' }, frost_breath: { go: 'cone', el: 'cold' }, comet_dive: { go: 'melee', slam: true, el: 'fire' },
  spirit_chain: { go: 'chain', el: 'light' }, hex: { go: 'grace', el: 'shadow', hex: true }, spirit_walk: { go: 'aura', el: 'light' }, thunderhead_totem: { go: 'summon', el: 'storm' },
  death_grip: { go: 'beam', el: 'shadow' }, icebound_fortitude: { go: 'self', el: 'cold' }, blood_boil: { go: 'nova', el: 'blood' }, remorseless_winter: { go: 'nova', el: 'cold', glyph: true },
  starlight_step: { go: 'nova', el: 'arcane' }, repulse: { go: 'nova', el: 'arcane' }, gravity_well: { go: 'vortex', el: 'arcane' }, supernova: { go: 'nova', el: 'arcane', glyph: true },
  eye_gouge: { go: 'swarm', kind: 'crow', el: 'shadow' }, puppeteer: { go: 'grace', el: 'shadow', hex: true }, pandemic: { go: 'lob', kind: 'orb', el: 'poison', size: 0.5 }, nevermore: { go: 'swarm', kind: 'crow', el: 'shadow' },
  song_of_swiftness: { go: 'aura', el: 'sound' }, sound_wave: { go: 'cone', el: 'sound' }, encore: { go: 'grace', el: 'sound' }, anthem_of_heroes: { go: 'aura', el: 'sound' },
  engulf: { go: 'melee', el: 'acid' }, slime_armor: { go: 'self', el: 'acid' }, bounce: { go: 'melee', el: 'acid', slam: true }, devour: { go: 'melee', el: 'acid', slam: true },
  ricochet: { go: 'rang' }, riposte: { go: 'self', el: 'phys' }, gust: { go: 'tornado', el: 'wind' }, thousand_cuts: { go: 'melee', el: 'wind', slashes: true },
  shield_slam: { go: 'melee', el: 'phys', slam: true }, hold_the_line: { go: 'self', el: 'holy' }, lance_of_light: { go: 'line', el: 'holy' }, bastion_of_ten: { go: 'aura', el: 'holy' },
  tail_swipe: { go: 'nova', el: 'fire', spin: true }, dragon_leap: { go: 'melee', slam: true, el: 'fire' }, primal_roar: { go: 'nova', el: 'sound' }, dragon_form: { go: 'self', el: 'fire' },
  buckshot: { go: 'spread' }, landmine: { go: 'trap', el: 'fire' }, rail_gun: { go: 'line', el: 'storm' }, orbital_strike: { go: 'skybeam', el: 'fire' },
  the_lock: { go: 'grace', el: 'holy', hex: true }, candlelight: { go: 'grace', el: 'fire' }, the_long_watch: { go: 'grace', el: 'light' }, open_the_door: { go: 'line', el: 'holy' },
};
export const lookFor = (id, l) => { LOOK[id] = { ...(LOOK[id] || {}), ...l }; };   // for data files that bring their own

// A summon's plain attack, by what it is.
const SUMMON_LOOK = {
  wolf: { go: 'melee', el: 'blood' }, ghoul: { go: 'melee', el: 'blood' }, skeleton: { go: 'melee', el: 'shadow' }, slimeling: { go: 'melee', el: 'acid' },
  squire: { go: 'thrust', el: 'holy' }, whelp: { go: 'bolt', kind: 'flame', el: 'fire' }, turret: { go: 'bullet' },
  totem_sear: { go: 'bolt', kind: 'flame', el: 'fire' }, totem_heal: { go: 'grace', el: 'light' }, totem_storm: { go: 'chain', el: 'storm' },
};

// The extra layer of sound the staging adds (Battle already plays each cast, blow and landing): the gathering,
// the cut-in, things in flight, beams, chains, booms. Each falls back quietly when its recording isn't in.
const SND = {
  charge: (at) => { sound.play('firebuff', { at, vol: 0.3, rate: 0.85 }); sfx.chime(); },
  cutin: () => { sfx.unsheath(); sound.play('wave_attack', { vol: 0.6, rate: 0.8, delay: 0.08 }); },
  boom: (at) => { if (!sound.play('rock_meteor_swarm', { at, vol: 0.65 })) sound.play('rock_wall', { at, vol: 0.8 }); },
  zap: (at) => sfx.burst({ el: 'storm' }, at),
  whoosh: (at) => sound.play('wave_attack', { at, vol: 0.32, rate: 1.6 }),
  flutter: (at) => sound.play('wave_attack', { at, vol: 0.28, rate: 2.3 }),
  beam: (at) => sound.play('light_torch', { at, vol: 0.6, rate: 0.8 }),
  fall: (at) => sound.play('rock_meteor_throw', { at, vol: 0.7 }),
  thud: (at) => { sound.play('dirt_land', { at, vol: 0.7 }); sound.play('chop', { at, vol: 0.4, rate: 0.7 }); },
  snap: (at) => sound.play('sword_parry', { at, vol: 0.6, rate: 1.4 }),
  shatter: (at) => sound.play('ice_freeze', { at, vol: 0.7, rate: 1.15 }),
  chime: () => sfx.chime(),
};
const say = (name, at = null) => { try { SND[name]?.(at); } catch { /* a missing take is no reason to stop a fight */ } };

export class Show {
  constructor(b) {
    this.b = b; this.r = b.r; this.fx = b.r.fx;
    this.floats = [];          // the numbers and words in the air: { e, u, born, life, dy }
    this.marks = new Map();    // trap runes on the ground, by tile key
    this.t = 0;
  }

  // ---- where things are ----
  height(u) { return u.model.userData.height || 1.5; }
  at(u, f = 0.55) { const p = u.model.position; return new THREE.Vector3(p.x, p.y + this.height(u) * f, p.z); }
  feet(u) { const p = u.model.position; return new THREE.Vector3(p.x, p.y + 0.02, p.z); }
  hand(u) { const p = this.at(u, 0.6), a = u.model.rotation.y; return p.add(new THREE.Vector3(Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35)); }
  ground(x, z) { return new THREE.Vector3(x, this.b.w.y(x, z) + 0.02, z); }
  tileMid(x, z) { const u = this.b.unitAt(x, z); return u ? this.at(u) : this.ground(x, z).add(new THREE.Vector3(0, 0.7, 0)); }

  // What a skill looks like when this unit uses it.
  look(u, sk) {
    const L = { ...(LOOK[sk.id] || {}), ...(u.summon && sk.basic ? SUMMON_LOOK[u.kind] : null) };
    const cls = u.hero?.cls, wk = u.hero?.equip?.weapon?.kind;
    if (!L.go) {
      if (sk.kind === 'summon') L.go = 'summon';
      else if (sk.kind === 'trap') L.go = 'trap';
      else if (sk.shape === 'line') L.go = 'line';
      else if (sk.shape === 'cone') L.go = 'cone';
      else if (sk.chain) L.go = 'chain';
      else if (sk.at === 'self' && sk.aoe) L.go = ['heal', 'buff', 'cleanse'].includes(sk.kind) ? 'aura' : 'nova';
      else if (sk.at === 'self') L.go = 'self';
      else if (['heal', 'buff', 'debuff', 'revive', 'cleanse', 'item', 'tempo'].includes(sk.kind)) L.go = 'grace';
      else if (sk.dash) L.go = 'melee';
      else if (sk.basic && WEAPON_GO[wk]) [L.go, L.kind] = WEAPON_GO[wk];
      else if (sk.r[1] <= 1) L.go = 'melee';
      else if (sk.kind === 'phys') L.go = u.hero ? 'arrow' : 'lob';
      else L.go = 'bolt';
    }
    if (L.go === 'thrust' && sk.r[1] <= 1) L.go = 'melee';
    L.el ||= sk.el || (sk.kind === 'heal' ? 'light' : sk.kind === 'buff' ? 'holy' : sk.kind === 'debuff' ? 'shadow' : sk.kind === 'magic' ? (CLASS_EL[cls] || (u.side === 'foe' ? 'shadow' : 'arcane')) : sk.basic && CLASS_EL[cls] && sk.kind !== 'phys' ? CLASS_EL[cls] : 'phys');
    if (L.go === 'lob' && !L.kind) L.kind = u.side === 'foe' ? 'rock' : 'orb';
    L.big = L.big ?? (u.hero && !sk.basic && !sk.item && sk.lvl >= 10 ? 2 : !sk.basic && !sk.item && (sk.aoe >= 2 || sk.pow >= 1.6 || (u.zdef?.boss && sk.aoe)) ? 1 : 0);
    L.spell = !['phys'].includes(sk.kind) || L.go === 'nova' || L.go === 'ground';
    return L;
  }

  // ---- before: the name, the cut-in, the circle and the gathering ----
  async begin(u, sk, L, tx, tz) {
    const fx = this.fx, P = palOf(L.el), feet = this.feet(u);
    // an ultimate's band says the name first; the box along the top follows it
    if (L.big >= 2) { fx.dim(0.62); this.b.camAt = this.at(u, 0.5); fx.zoom(0.8, 5); say('cutin'); await this.cutin(u, sk, L); }
    else if (L.big) { fx.dim(0.38); fx.zoom(0.9, 5); }
    this.banner(u, sk, L);
    if (sk.item) { fx.swirl(feet, 0xffe2a0, 10, 0.4, 1.2, CELL.glint, 0.1, 0.6); return this.b.wait(120); }
    if (L.spell && L.go !== 'melee') {
      const R = L.big >= 2 ? 1.5 : L.big ? 1.1 : 0.75, dur = L.big >= 2 ? 0.75 : L.big ? 0.55 : 0.32;
      fx.circle(feet, P.mid, R, dur + 0.55);
      fx.gather(this.hand(u), P.core, 10 + L.big * 14, 1.2 + L.big * 0.4, dur, P.cell === CELL.smoke ? CELL.glow : P.cell, 0.16);
      fx.swirl(feet, P.mid, 8 + L.big * 10, R * 0.7, 1.6, CELL.glow, 0.12, dur + 0.2);
      if (L.big) fx.pillar(feet, P.mid, 2.2 + L.big, R * 0.55, dur + 0.4);
      fx.light(feet, P.mid, 2 + L.big * 2, dur + 0.4);
      say('charge', feet);
      await this.b.wait(dur * 1000);
    } else {
      // a blade catches the light before it moves
      fx.flare(this.hand(u), 0xfff4d8, 0.9 + L.big * 0.4, 0.25);
      if (L.big) { fx.ring(feet, P.mid, 0.2, 1.4, 0.4); fx.dust(feet, 8, 0.8); }
      await this.b.wait(L.big ? 280 : 90);
    }
    if (tx != null && L.big) this.b.camAt = this.tileMid(tx, tz).add(this.at(u, 0.5)).multiplyScalar(0.5);
  }
  // after: let the world have its light back
  end() { this.fx.dim(0); this.fx.zoom(1, 4); this.b.camAt = null; }

  // The skill's name, Final Fantasy Tactics fashion, along the top.
  banner(u, sk, L) {
    const hud = this.b.hud;
    hud.querySelector('.sk-ban')?.remove();
    const P = palOf(L.el), hex = '#' + P.mid.toString(16).padStart(6, '0');
    const b = el('div', 'sk-ban ' + (u.side === 'foe' ? 'foe' : 'ally') + (L.big >= 2 ? ' ult' : ''), `<small style="color:${u.color}">${esc(u.name)}</small><b>${esc(sk.name)}</b>`);
    b.style.setProperty('--el', hex);
    hud.append(b);
    setTimeout(() => b.classList.add('out'), 1500);
    setTimeout(() => b.remove(), 2100);
  }
  // A class's last skills: a band across the screen with the name, before anything else happens.
  cutin(u, sk, L) {
    const P = palOf(L.el), hex = '#' + P.mid.toString(16).padStart(6, '0');
    const c = el('div', 'cutin', `<div class="ci-band"><i class="ci-lines"></i><div class="ci-text"><small style="color:${u.color}">${esc(u.name)}</small><b>${esc(sk.name)}</b></div></div>`);
    c.style.setProperty('--el', hex); c.style.setProperty('--who', u.color || '#ffe2a0');
    this.b.hud.append(c);
    this.fx.flash(hex, 0.25);
    setTimeout(() => c.remove(), 1500);
    return this.b.wait(900);
  }
  // Big words across the middle: the fight starting, the fight won.
  splash(title, sub = '', cls = '') {
    const s = el('div', 'splash ' + cls, `<b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`);
    this.b.hud.append(s);
    setTimeout(() => s.remove(), 2600);
  }

  // ---- on the way: resolves when the blow lands ----
  async travel(u, sk, L, tx, tz, targets, h = 0) {
    const fx = this.fx, P = palOf(L.el), b = this.b;
    const from = this.hand(u), first = targets[0], to = first ? this.at(first) : this.tileMid(tx, tz), centre = this.ground(tx, tz);
    const o = { el: L.el, kind: L.kind || 'orb', speed: L.speed || 13, size: L.size || 0.32, color: L.color };
    switch (L.go) {
      case 'melee': return b.wait(sk.dash ? 60 : 170);
      case 'self': {
        // gathering into themselves: a ring at the feet, a column for the big ones
        const f = this.feet(u);
        fx.ring(f, P.mid, 0.1, 1.3, 0.45); fx.swirl(f, P.mid, 14 + L.big * 14, 0.5, 2.2, L.el === 'fire' ? CELL.flame : CELL.glint, 0.16, 0.9);
        if (L.big) { fx.pillar(f, P.mid, 4 + L.big * 2, 0.6, 0.8); fx.flash('#' + P.mid.toString(16).padStart(6, '0'), 0.2); fx.shake(0.12 * L.big); say('boom', f); }
        return b.wait(220);
      }
      case 'thrust': fx.shoot(from, to, { ...o, kind: 'spear', speed: 30 }); return b.wait(110);
      case 'bolt': if (L.el === 'storm') say('zap', from); return fx.shoot(from, to, { ...o, arc: L.arc ?? 0.12, curve: (L.curve || 0) * (h % 2 ? -1 : 1) });
      case 'arrow': say('whoosh', from); return fx.shoot(from, to, { ...o, kind: 'arrow', speed: 24, arc: 0.18, color: L.color ?? 0xfff2d0 });
      case 'bullet': fx.flare(from, 0xffd27a, 0.9, 0.12); fx.sparks(from, 6, 0xffb040, 3, 4); return fx.shoot(from, to, { ...o, kind: 'bullet', speed: 44, color: 0xffd890 });
      case 'arrows': say('whoosh', from); return Promise.all((targets.length ? targets : [null]).map((t, i) => b.wait(i * 60).then(() => fx.shoot(from, t ? this.at(t) : to, { ...o, kind: 'arrow', speed: 22, arc: 0.25 + i * 0.05, color: 0xfff2d0 }))));
      case 'lob': say('whoosh', from); return fx.shoot(from, L.splat ? centre : to, { ...o, arc: 1.1, speed: 9 });
      case 'pierce': {
        // one missile that goes the whole length, through everyone on the way
        const end = this.lineEnd(u, sk, tx, tz);
        say('whoosh', from); fx.flare(from, P.core, 1.1, 0.15);
        await fx.shoot(from, end, { ...o, kind: L.kind || 'arrow', speed: 34, size: L.size || 0.4, color: L.kind === 'arrow' ? 0xfff2d0 : undefined });
        fx.spray(end, 10, { speed: 2.5, life: 0.4, size: 0.1, size1: 0.02, color: P.core, cell: CELL.glow, drag: 2 });
        return;
      }
      case 'spread': {
        // a handful of shot across the cone
        fx.flare(from, 0xffd27a, 1.6, 0.16); fx.sparks(from, 14, 0xffb040, 4, 4); fx.shake(0.12);
        const tiles = b.shapeTiles(u, sk, tx, tz);
        for (let i = 0; i < 7; i++) { const t = tiles[i % Math.max(1, tiles.length)] || { x: tx, z: tz }; fx.shoot(from, this.ground(t.x, t.z).add(new THREE.Vector3(Math.random() - 0.5, 0.5 + Math.random() * 0.5, Math.random() - 0.5)), { el: 'fire', kind: 'bullet', speed: 40, color: 0xffd890 }); }
        return b.wait(140);
      }
      case 'trap': fx.shoot(from, centre.clone().add(new THREE.Vector3(0, 0.1, 0)), { el: L.el, kind: L.el === 'fire' ? 'rock' : 'bone', arc: 1, speed: 10, size: 0.2 }); return b.wait(320);
      case 'rang': {
        say('whoosh', from);
        const out = fx.shoot(from, to, { ...o, kind: 'rang', speed: 14, curve: h % 2 ? -0.9 : 0.9, color: L.color ?? 0xd8fff0 });
        out.then(() => fx.shoot(to, this.hand(u), { ...o, kind: 'rang', speed: 14, curve: h % 2 ? -0.9 : 0.9, color: L.color ?? 0xd8fff0 }));
        return out;
      }
      case 'beam': case 'line': {
        const end = L.go === 'line' ? this.lineEnd(u, sk, tx, tz) : to;
        say('beam', from); fx.beam(from, end, P.mid, L.big ? 0.55 : 0.36, 0.55 + L.big * 0.2, P.core); fx.shake(0.06 + L.big * 0.06);
        if (L.big) { fx.flash('#' + P.core.toString(16).padStart(6, '0'), 0.2 + L.big * 0.08); fx.stop(0.05 * L.big); }
        return b.wait(140);
      }
      case 'chain': {
        if (L.kind === 'rang' || !['storm', 'holy', 'light', 'arcane'].includes(L.el)) return fx.shoot(from, to, { ...o, kind: L.kind || 'orb', speed: 16 });
        say('zap', from); fx.bolt(from, to, P.mid, 0.3, 0.1); fx.flash('#' + P.core.toString(16).padStart(6, '0'), 0.15); return b.wait(70);
      }
      case 'fall': say('fall', centre); await fx.fall(sk.aoe ? centre.clone().add(new THREE.Vector3(0, 0.3, 0)) : to, { el: L.el, kind: L.kind || 'meteor', size: L.size || 0.5, speed: L.speed || 20 }); return;
      case 'rain': {
        say('whoosh', centre);
        const tiles = b.aoeTiles(sk, tx, tz), kind = L.kind === 'drop' ? 'orb' : L.kind || 'arrow';
        for (let i = 0; i < 10 + tiles.length * 2; i++) {
          const t = tiles[i % tiles.length], dst = this.ground(t.x, t.z).add(new THREE.Vector3(Math.random() - 0.5, 0.1, Math.random() - 0.5));
          setTimeout(() => fx.shoot(dst.clone().add(new THREE.Vector3(-1.6, 7, -0.8)), dst, { el: L.el, kind, speed: 26, size: kind === 'shard' ? 0.3 : 0.14, color: kind === 'arrow' ? 0xfff2d0 : kind === 'orb' ? P.mid : undefined }).then(() => fx.spray(dst, 4, { speed: 1.4, life: 0.4, size: 0.08, color: P.mid, cell: kind === 'shard' ? CELL.shard : CELL.glow, g: 6 })), i * 28);
        }
        return b.wait(380);
      }
      case 'swarm': {
        say(L.kind === 'note' ? 'chime' : 'flutter', from);
        const n = L.kind === 'crow' ? 9 : 7, all = [];
        for (let i = 0; i < n; i++) all.push(b.wait(i * 45).then(() => fx.shoot(from, to.clone().add(new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.5, Math.random() - 0.5)), { el: L.el, kind: L.kind, speed: 9 + Math.random() * 4, curve: (Math.random() - 0.5) * 2.4, arc: Math.random() * 0.5, size: 0.3 })));
        return Promise.race(all);
      }
      case 'nova': {
        const p = this.feet(u), R = (sk.aoe || 1) + 0.6;
        if (L.glyph) fx.circle(p, P.mid, R, 0.9);
        if (L.spin) for (let i = 0; i < 3; i++) setTimeout(() => fx.slash(this.at(u, 0.45), 0xffffff, 2.6, i * 2.1, 0.22), i * 70);
        fx.blast(p, L.el, R, 1 + L.big * 0.5); fx.shake(0.08 + L.big * 0.08);
        if (L.big) { fx.flash('#' + P.core.toString(16).padStart(6, '0'), 0.2 + L.big * 0.1); fx.stop(0.05 * L.big); }
        say(L.spin ? 'whoosh' : L.el === 'cold' ? 'shatter' : L.big || (sk.aoe || 0) >= 2 ? 'boom' : null, p);
        return b.wait(140);
      }
      case 'aura': {
        const p = this.feet(u), R = (sk.aoe || 1) + 0.5;
        fx.ring(p, P.mid, 0.2, R, 0.7); fx.ring(p, P.core, 0.1, R * 0.7, 0.5); fx.swirl(p, P.mid, 26, R * 0.6, 2.2, L.el === 'sound' ? CELL.note : CELL.glint, 0.2, 1.1);
        if (L.big) { fx.circle(p, P.mid, R, 1); fx.pillar(p, P.mid, 5, R * 0.5, 0.8); }
        if (L.el === 'sound') say('chime');
        return b.wait(200);
      }
      case 'ground': {
        const p = this.feet(u);
        fx.ring(p, P.mid, 0.2, (sk.aoe || 1) + 1, 0.6); fx.dust(p, 16, 1.3); fx.shake(0.22 + L.big * 0.1); say('boom', p);
        for (const t of b.aoeTiles(sk, tx, tz)) setTimeout(() => { const g = this.ground(t.x, t.z); fx.spray(g, 5, { speed: 4, life: 0.8, size: 0.18, size1: 0.1, color: 0x8a7a64, g: 12, cell: CELL.stone, spin: 6, dark: true, up: 0.9 }); if (L.el === 'storm') fx.bolt(g.clone().add(new THREE.Vector3(0, 3, 0)), g, P.mid, 0.2, 0.06); }, Math.abs(t.x - u.x) * 40 + Math.abs(t.z - u.z) * 40);
        return b.wait(160);
      }
      case 'erupt': {
        say('boom', centre);
        for (const t of b.aoeTiles(sk, tx, tz)) { const g = this.ground(t.x, t.z); setTimeout(() => { fx.spray(g, 6, { speed: 3.5, life: 0.8, size: 0.24, color: 0xe8e0c8, g: 9, cell: CELL.bone, spin: 8, dark: true, up: 0.95 }); fx.spray(g, 4, { speed: 1, life: 1, size: 0.5, size1: 1.1, color: P.dark, alpha: 0.7, cell: CELL.smoke, dark: true, up: 0.9 }); }, Math.random() * 160); }
        fx.ring(centre, P.mid, 0.2, (sk.aoe || 1) + 0.8, 0.6); fx.shake(0.2);
        return b.wait(200);
      }
      case 'skybeam': {
        const g = sk.aoe ? centre : this.feet(first || { model: { position: centre, userData: {} } });
        say('beam', g); fx.pillar(g, P.mid, 9, 0.35 + (sk.aoe || 0) * 0.4, 0.8); fx.pillar(g, P.core, 9, 0.15, 0.6); fx.ring(g, P.mid, 0.2, 1 + (sk.aoe || 0), 0.6); fx.flash('#' + P.mid.toString(16).padStart(6, '0'), 0.15);
        return b.wait(180);
      }
      case 'vortex': {
        const c = centre.clone().add(new THREE.Vector3(0, 0.9, 0)), core = fx.sprite(fx.tex.glow, 0x000000, THREE.NormalBlending);
        core.position.copy(c);
        fx.timed(1.2, (k) => { core.scale.setScalar(2.2 * Math.sin(Math.min(1, k * 1.3) * Math.PI) + 0.01); core.material.opacity = 0.95; }, () => fx.drop(core));
        fx.circle(centre, P.mid, (sk.aoe || 1) + 0.6, 1.3);
        for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, d = 1.5 + Math.random() * 2; fx.glow({ x: c.x + Math.cos(a) * d, y: c.y + (Math.random() - 0.5) * 1.6, z: c.z + Math.sin(a) * d, home: { x: c.x, y: c.y, z: c.z, swirl: 0.6 }, life: 0.5 + Math.random() * 0.6, size: 0.14, size1: 0.02, color: i % 3 ? P.mid : P.core, cell: CELL.star, spin: 6, fade: 0.2 }); }
        say('fall', c); fx.shake(0.12);
        return b.wait(650);
      }
      case 'tornado': {
        const g = centre;
        for (let i = 0; i < 5; i++) setTimeout(() => fx.swirl(g, i % 2 ? P.core : P.mid, 26, 0.6 + i * 0.25, 2.6 + i * 0.3, CELL.leaf, 0.22, 1), i * 80);
        fx.ring(g, P.mid, 0.3, (sk.aoe || 1) + 0.8, 0.8); fx.dust(g, 14, 1.4); say('whoosh', g);
        return b.wait(360);
      }
      case 'cone': {
        say(L.el === 'cold' ? 'shatter' : 'whoosh', from);
        const dx = Math.sign(tx - u.x), dz = Math.sign(tz - u.z), dir = new THREE.Vector3(dx, -0.12, dz).normalize();
        fx.timed(0.55, () => { for (let i = 0; i < 6; i++) { const sp = 6 + Math.random() * 3, sd = new THREE.Vector3(-dz, 0, dx).multiplyScalar((Math.random() - 0.5) * 0.9); fx.glow({ x: from.x, y: from.y, z: from.z, vx: (dir.x + sd.x) * sp, vy: dir.y * sp + Math.random() * 0.6, vz: (dir.z + sd.z) * sp, drag: 2.2, life: 0.5 + Math.random() * 0.2, size: 0.18, size1: 0.6, color: P.core, color1: P.edge, cell: L.el === 'fire' ? CELL.flame : P.cell, spin: 3 }); } });
        if (L.el === 'fire') fx.timed(0.6, (k, dt, e) => { if (Math.random() < 0.3) fx.smoke({ x: from.x + dir.x * 2, y: from.y + 0.3, z: from.z + dir.z * 2, vy: 0.6, life: 1.2, size: 0.5, size1: 1.4, color: 0x2a1a14, alpha: 0.4, cell: CELL.smoke, spin: 1 }); });
        return b.wait(260);
      }
      case 'snap': {
        fx.flare(from, 0xfff4c0, 1.4, 0.2); fx.sparks(from, 10, 0xffe2a0, 3, 0); say('snap', from);
        await b.wait(80);
        fx.ring(this.feet(first || u), 0xffe48a, 0.1, 1.2, 0.4); fx.flare(to, 0xffe48a, 2, 0.3);
        return;
      }
      case 'grace': case 'summon': default: {
        if (L.go === 'grace' && first && first !== u) fx.shoot(from, to, { el: L.el, kind: 'orb', speed: 16, size: 0.18, arc: 0.3 });
        return b.wait(L.go === 'grace' ? 160 : 60);
      }
    }
  }
  // the far end of a line skill: as far as it reaches along the chosen direction
  lineEnd(u, sk, tx, tz) {
    const dx = Math.sign(tx - u.x), dz = Math.sign(tz - u.z), n = sk.r[1];
    return this.ground(u.x + dx * n, u.z + dz * n).add(new THREE.Vector3(0, this.height(u) * 0.55, 0));
  }
  // where a blast lands, once per hit: the shock on the ground, the light
  land(u, sk, L, tx, tz) {
    const fx = this.fx, c = this.ground(tx, tz);
    if (L.go === 'summon') { this.summonCircle(tx, tz, L); return; }
    if (L.go === 'trap') return;
    if (sk.aoe && !['nova', 'aura', 'ground', 'erupt', 'tornado', 'rain', 'skybeam'].includes(L.go) && sk.at !== 'self') {
      fx.blast(c, L.el, sk.aoe + 0.4, 1 + L.big * 0.6);
      fx.burst(L.el, c.clone().add(new THREE.Vector3(0, 0.5, 0)), 0.8 + L.big * 0.5);
      fx.shake(0.1 + L.big * 0.12);
      if (L.big >= 1) { fx.flash('#' + palOf(L.el).core.toString(16).padStart(6, '0'), 0.25 + L.big * 0.1); fx.stop(0.05 * L.big); }
      if (L.big || sk.aoe >= 2) say(L.el === 'cold' ? 'shatter' : 'boom', c);
      if (L.big) fx.scorch(c, (sk.aoe + 0.5) * 1.6, 3);
    }
    if (L.boom) { fx.burst('fire', c.clone().add(new THREE.Vector3(0, 0.4, 0)), 1.2); fx.shake(0.18); fx.scorch(c, 1.6, 3); say('boom', c); }
    if (L.go === 'fall' && !sk.aoe) { fx.blast(c, L.el, 1, 1); fx.shake(0.16); }
  }
  // the next link of a chain, from one body to another
  hop(a, b2, L) {
    const P = palOf(L.el);
    if (L.go === 'rang') { this.fx.shoot(this.at(a), this.at(b2), { el: L.el, kind: 'rang', speed: 18, curve: 0.6, color: 0xd8fff0 }); say('whoosh', this.at(b2)); return; }
    if (!['storm', 'holy', 'light', 'arcane'].includes(L.el)) { this.fx.shoot(this.at(a), this.at(b2), { el: L.el, kind: L.kind || 'orb', speed: 18, size: 0.26 }); return; }
    this.fx.bolt(this.at(a), this.at(b2), P.mid, 0.3, 0.09); say('zap', this.at(b2));
  }

  // ---- on whoever it reaches ----
  // A blow landing: what it looks like and how hard the screen takes it (Battle.hurt puts up the number).
  hit(u, t, sk, L, d, h = 0) {
    const fx = this.fx, p = this.at(t), frac = Math.min(1, d.n / Math.max(1, t.maxhp));
    if (L.go === 'melee' || L.go === 'thrust' || L.go === 'self' || (sk.kind === 'phys' && sk.r[1] <= 1)) {
      fx.strike(p, { el: L.el, s: 1 + L.big * 0.4, crit: d.crit });
      // a run of cuts lean the same way, so two of them never cross
      if (L.slashes) fx.slash(p, palOf(L.el).core, 2.3, 0.55 + (h % 3) * 0.12, 0.2);
      if (L.slam) { fx.blast(this.feet(t), L.el === 'phys' ? 'earth' : L.el, 1.2, 1); fx.dust(this.feet(t), 10, 1.2); say('thud', p); }
      if (L.shatter) { fx.spray(p, 26, { speed: 5, life: 0.9, size: 0.26, size1: 0.06, color: 0xf2fcff, color1: 0x8ad8ff, g: 8, cell: CELL.shard, spin: 8 }); say('shatter', p); }
      if (L.post === 'pillar') fx.pillar(this.feet(t), palOf(L.el).mid, 4, 0.5, 0.6);
    } else if (L.go === 'arrow' || L.go === 'arrows' || L.go === 'bullet' || L.go === 'rang' || L.go === 'rain' || L.go === 'spread' || (L.go === 'pierce' && L.kind === 'arrow')) {
      fx.strike(p, { el: L.el === 'wind' ? 'phys' : L.el, s: 0.8, cut: false, crit: d.crit });
    } else {
      fx.burst(L.el, p, (sk.aoe ? 0.6 : 0.9) + L.big * 0.3 + (d.crit ? 0.3 : 0));
    }
    if (L.el === 'blood' || (sk.kind === 'phys' && t.side !== 'party' && !t.undead && Math.random() < 0.6)) fx.burst('blood', p, 0.5);
    fx.shake(0.04 + frac * 0.3 + (d.crit ? 0.12 : 0) + L.big * 0.05);
    if (d.crit || frac > 0.35) fx.stop(d.crit ? 0.09 : 0.05);
    if (d.crit) fx.flash('#ffe2a0', 0.18);
  }
  // a status's slow harm, as it comes due: a little of its colour
  dot(t) { const s = t.st.find((s) => STATUS[s.id]?.dot); this.fx.burst(s?.id === 'burn' ? 'fire' : s?.id === 'bleed' ? 'blood' : 'poison', this.at(t), 0.35); }
  heal(t, n, L) {
    const fx = this.fx, P = palOf(L?.el === 'holy' ? 'holy' : 'light'), f = this.feet(t);
    fx.swirl(f, P.mid, 18, 0.5, 2, CELL.glint, 0.16, 1);
    fx.pillar(f, P.mid, 2.6, 0.42, 0.7);
    fx.spray(this.at(t, 0.3), 10, { speed: 0.6, life: 1.2, size: 0.12, size1: 0.02, color: P.core, g: -1.4, cell: CELL.glow, up: 1 });
    fx.light(f, P.mid, 2.4, 0.6);
    if (n > 0) this.num(t, n, 'heal');
  }
  mana(t, n) { this.fx.swirl(this.feet(t), 0x7ab8ff, 14, 0.45, 1.8, CELL.glint, 0.14, 0.9); this.num(t, n, 'mana'); }
  // a status taking hold (or failing to)
  status(t, id, took = true) {
    const S = STATUS[id], fx = this.fx, c = new THREE.Color(S?.color || '#ffffff').getHex();
    if (!took) { this.word(t, 'Resisted', 'resist'); return; }
    if (S?.bad) { fx.spray(this.at(t, 1.05), 12, { speed: 1.2, life: 0.8, size: 0.16, size1: 0.03, color: c, g: 2.5, cell: CELL.glow }); fx.ring(this.feet(t), c, 0.6, 0.15, 0.5, 0.8); }
    else { fx.swirl(this.feet(t), c, 16, 0.5, 2.2, CELL.glint, 0.14, 0.9); fx.ring(this.feet(t), c, 0.15, 0.9, 0.5, 0.8); }
    this.word(t, S?.name || id, S?.bad ? 'bad' : 'good', S?.color);
  }
  // someone going down
  death(u) {
    const fx = this.fx, p = this.at(u, 0.5), f = this.feet(u);
    fx.flare(p, 0xffffff, 2.2, 0.3);
    fx.spray(p, 14, { speed: 1, life: 1.6, size: 0.5, size1: 1.4, color: u.side === 'foe' ? 0x1a1420 : 0x2a1010, alpha: 0.7, g: -0.6, cell: CELL.smoke, spin: 1, dark: true, up: 0.8 });
    fx.spray(p, 18, { speed: 1.4, life: 1.6, size: 0.2, size1: 0.02, color: u.side === 'foe' ? 0xc8e8d8 : 0xffc0b0, g: -1.8, cell: CELL.glow, drag: 1.5, up: 0.9 });
    if (u.side === 'foe' && !u.summon) fx.glow({ x: p.x, y: p.y + 0.4, z: p.z, vy: 1.1, life: 1.4, size: 0.5, size1: 0.3, color: 0xd8f0e0, alpha: 0.85, cell: CELL.skull, fade: 0.2 });
    fx.ring(f, u.side === 'foe' ? 0x8affd8 : 0xff6a5a, 0.2, 1.4, 0.6);
    fx.dust(f, 10, 1);
    fx.shake(0.14);
    if (!u.summon) this.word(u, u.side === 'foe' ? 'Down' : 'Fallen', 'down');
  }
  revive(t) {
    const fx = this.fx, f = this.feet(t);
    fx.pillar(f, 0xffe48a, 6, 0.6, 1.1); fx.ring(f, 0xffe48a, 0.2, 1.6, 0.8);
    fx.swirl(f, 0xfffbe8, 30, 0.6, 2.6, CELL.glint, 0.18, 1.2); fx.flash('#ffe48a', 0.2);
  }
  // all that ailed them, lifted off
  cleanse(t) {
    const fx = this.fx, f = this.feet(t), p = this.at(t, 0.6);
    fx.flare(p, 0xffffff, 1.5, 0.25); fx.ring(f, 0xe8fbff, 0.1, 1.3, 0.5);
    fx.spray(p, 18, { speed: 2.2, life: 0.7, size: 0.12, size1: 0.02, color: 0xd8f4ff, g: -1.5, cell: CELL.glint, drag: 1.5 });
    say('chime');
  }
  // a turn brought forward (gold, rising) or put back (violet, sinking)
  tempo(t, up) {
    const fx = this.fx, f = this.feet(t), c = up ? 0xffe27a : 0x9a8aff;
    fx.circle(f, c, 0.85, 0.9);
    fx.swirl(f, c, 18, 0.5, up ? 2.6 : 0.6, up ? CELL.glint : CELL.sigil, 0.14, 0.9);
    fx.ring(f, c, up ? 0.1 : 1.1, up ? 1.1 : 0.1, 0.5);
    fx.spray(this.at(t, up ? 0.3 : 1.1), 12, { speed: 0.4, life: 0.8, size: 0.11, size1: 0.02, color: c, g: up ? -5 : 4, cell: CELL.glow });
    this.word(t, up ? 'Quickened' : 'Delayed', up ? 'good' : 'bad', up ? '#ffe27a' : '#b0a4ff');
    say(up ? 'chime' : 'snap', f);
  }
  // one of the bursting dead going off
  burstOpen(u, what) {
    const el = what === 'burn' ? 'fire' : 'poison', f = this.feet(u);
    this.fx.burst(el, this.at(u, 0.4), 1.3); this.fx.blast(f, el, 1.6, 1); this.fx.shake(0.2);
  }
  // a doom coming due: a column and a skull falling on them, or (primed) a fireball where they stand
  doomFall(u, blast) {
    const fx = this.fx, f = this.feet(u), p = this.at(u, 0.5);
    if (blast) { fx.flash('#ffb060', 0.32); fx.blast(f, 'fire', 2, 1.4); fx.burst('fire', p, 1.5); fx.scorch(f, 2.6, 4); fx.shake(0.32); fx.stop(0.08); say('boom', f); return; }
    fx.flash('#b48aff', 0.25); fx.pillar(f, 0x6a3aa8, 7, 0.6, 0.9); fx.pillar(f, 0xd8b8ff, 7, 0.22, 0.7);
    fx.glow({ x: p.x, y: p.y + 2.6, z: p.z, vy: -7, life: 0.36, size: 0.9, size1: 0.6, color: 0xd8b8ff, cell: CELL.skull, fade: 0.1 });
    fx.ring(f, 0xb48aff, 1.6, 0.1, 0.5); fx.burst('shadow', p, 1.2); fx.shake(0.24); fx.stop(0.07); say('fall', f);
  }
  // stepping out of one place and into another
  vanish(u, L) {
    const fx = this.fx, P = palOf(L.el), p = this.at(u, 0.5);
    fx.flare(p, P.core, 2, 0.25); fx.ring(this.feet(u), P.mid, 0.9, 0.1, 0.3);
    fx.spray(p, 22, { speed: 2.4, life: 0.5, size: 0.14, size1: 0.02, color: P.mid, cell: CELL.glint, drag: 2 });
    say('whoosh', p);
  }
  appear(u, L) {
    const fx = this.fx, P = palOf(L.el), f = this.feet(u), p = this.at(u, 0.5);
    fx.gather(p, P.core, 18, 1.2, 0.2, CELL.glint, 0.14); fx.pillar(f, P.mid, 3, 0.45, 0.4);
    fx.ring(f, P.mid, 0.1, 1.2, 0.4); fx.flare(p, P.core, 1.8, 0.3); fx.light(f, P.mid, 3, 0.4);
  }
  // a new summon arriving: its circle, then a puff and a column of its colour
  summonCircle(x, z, L) {
    const fx = this.fx, g = this.ground(x, z), P = palOf(L.el);
    fx.circle(g, P.mid, 0.9, 1.1); fx.pillar(g, P.mid, 3.5, 0.55, 0.8);
    fx.spray(g.clone().add(new THREE.Vector3(0, 0.4, 0)), 12, { speed: 1.4, life: 1, size: 0.5, size1: 1.1, color: P.dark, alpha: 0.7, cell: CELL.smoke, dark: true, up: 0.6 });
    fx.light(g, P.mid, 3, 0.6);
  }
  // a rune left on the ground, waiting for a foot (kept until it goes off)
  trapMark(x, z, color) {
    const fx = this.fx, g = this.ground(x, z), m = fx.plate(fx.tex.circle, color);
    m.position.set(g.x, g.y + 0.05, g.z); m.scale.set(0.95, 1, 0.95);
    const e = fx.timed(1e9, (k, dt, e2) => { m.rotation.y = e2.t * 0.8; m.material.opacity = 0.45 + 0.2 * Math.sin(e2.t * 3); });
    e.end = () => fx.drop(m);
    fx.ring(g, color, 0.1, 0.9, 0.5);
    this.marks.set(x + ',' + z, e);
  }
  // the rune going: sprung (a blast), or quietly taken up when a newer one is set
  trapGone(x, z, el = 'arcane', quiet = false) {
    const e = this.marks.get(x + ',' + z); if (!e) return;
    const end = e.end; e.end = null; e.dur = 0; end?.(); this.marks.delete(x + ',' + z);
    const g = this.ground(x, z);
    if (quiet) { this.fx.ring(g, 0xd8d0c0, 0.9, 0.1, 0.3, 0.6); return; }
    this.fx.blast(g, el, 1, 1); this.fx.burst(el, g.clone().add(new THREE.Vector3(0, 0.5, 0)), 0.9); this.fx.shake(0.15); this.fx.flash('#ffe2a0', 0.12);
    if (el === 'phys') this.fx.spray(g.clone().add(new THREE.Vector3(0, 0.2, 0)), 12, { speed: 4, life: 0.6, size: 0.2, size1: 0.05, color: 0xd8d0c0, g: 9, cell: CELL.shard, spin: 6, up: 0.9 });
    say(el === 'fire' ? 'boom' : 'snap', g);
  }
  // shoved across the ground: a line of dust behind them
  shove(u) { this.fx.dust(this.feet(u), 3, 0.7); }
  // ... and into something that doesn't give
  thump(u, other) {
    const p = this.at(u, 0.4);
    this.fx.strike(p, { el: 'earth', s: 0.9, cut: false }); this.fx.dust(this.feet(u), 8, 1);
    if (other) this.fx.strike(this.at(other, 0.4), { el: 'earth', s: 0.6, cut: false });
    this.fx.shake(0.22); this.fx.stop(0.05); say('thud', p);
  }
  // a hop or a dash: a smear of their colour where they were
  streak(u) { const p = this.at(u, 0.5), c = new THREE.Color(u.color || '#ffe2a0').getHex(); this.fx.glow({ x: p.x, y: p.y, z: p.z, life: 0.35, size: 0.7, size1: 0.3, color: c, alpha: 0.45, cell: CELL.glow }); }
  step(u) { this.fx.dust(this.feet(u), 2, 0.5); }
  land2(u, L = null) {
    const f = this.feet(u);
    this.fx.dust(f, 10, 1.1); this.fx.ring(f, 0xd8c8a8, 0.1, 0.9, 0.35, 0.6); this.fx.shake(0.08);
    if (L?.big) { this.fx.blast(f, L.el === 'phys' ? 'earth' : L.el, 1.5, 1.1); this.fx.scorch(f, 2, 3); this.fx.shake(0.24); say('thud', f); }
  }
  // whose turn it is: a ring of their colour at their feet
  turn(u) {
    const f = this.feet(u), c = new THREE.Color(u.color || '#ffe2a0').getHex();
    this.fx.ring(f, c, 0.1, 0.8, 0.45, 0.9); this.fx.swirl(f, c, 10, 0.45, 1.6, CELL.glint, 0.1, 0.7);
  }
  levelUp(u) {
    const f = this.feet(u);
    this.fx.pillar(f, 0xffe48a, 6, 0.55, 1.4); this.fx.swirl(f, 0xfffbe8, 40, 0.6, 3, CELL.star, 0.18, 1.4); this.fx.ring(f, 0xffe48a, 0.2, 1.8, 0.8);
    this.word(u, 'Level up', 'lvl');
  }
  cheer(u) { this.fx.spray(this.at(u, 1.1), 10, { speed: 1.4, life: 1.4, size: 0.12, size1: 0.03, color: 0xffe48a, g: -0.6, cell: CELL.glint, flicker: 0.6, up: 0.8 }); }

  // ---- the numbers ----
  // n: how much; kind: dmg | crit | heal | mana | dot; side: back | side | wall (a word above it)
  num(u, n, kind = 'dmg', side = '', h = 0) {
    const sign = kind === 'heal' || kind === 'mana' ? '+' : '', s = sign + Math.round(n);
    const digits = [...s].map((c, i) => `<i data-c="${c}" style="--i:${i}">${c}</i>`).join('');
    const tag = kind === 'crit' ? '<em>Critical!</em>' : side === 'back' ? '<em class="back">From behind</em>' : side === 'side' ? '<em class="sd">Flank</em>' : side === 'wall' ? '<em class="sd">Slammed</em>' : kind === 'mana' ? '<em class="mn">Mana</em>' : '';
    this.addFloat(u, `${tag}<span class="dg">${digits}</span>`, 'dn ' + kind, kind === 'crit' ? 1.7 : 1.35, h);
  }
  word(u, text, cls = '', color) {
    const e = this.addFloat(u, `<span class="wd">${esc(text)}</span>`, 'dw ' + cls, 1.3);
    if (color) e.style.setProperty('--wc', color);
  }
  // Several hits from one skill: the sum of them, once they're done.
  total(u, n, hits) { if (hits > 1 && n > 0) this.addFloat(u, `<em>${hits} hits</em><span class="dg">${[...String(n)].map((c, i) => `<i data-c="${c}" style="--i:${i}">${c}</i>`).join('')}</span>`, 'dn total', 1.8); }
  addFloat(u, html, cls, life, h = 0) {
    const e = el('div', 'float2 ' + cls, html);
    // whatever else is already in the air over them, this goes above it
    const busy = this.floats.filter((f) => f.u === u && this.t - f.born < 0.45).length;
    const f = { e, u, born: this.t, life, dy: busy * 38 + (h ? 8 : 0), dx: h ? (h % 2 ? 22 : -22) : 0 };
    this.floats.push(f); this.b.floats.append(e); this.place(f);
    return e;
  }
  place(f) {
    const m = f.u.model.position, p = this.r.project(m.x, m.y + this.height(f.u) + 0.25, m.z);
    f.e.style.transform = `translate(${p.x + f.dx}px, ${p.y - f.dy}px)`;
  }

  // ---- every frame ----
  tick(dt) {
    this.t += dt;
    for (const f of this.floats) { if (this.t - f.born > f.life) f.e.remove(); else this.place(f); }
    this.floats = this.floats.filter((f) => this.t - f.born <= f.life);
    const ring = this.r.turnRing;
    if (ring?.visible) { const k = 1 + 0.1 * Math.sin(this.t * 5); ring.scale.set(k, 1, k); ring.material.opacity = 0.65 + 0.3 * Math.sin(this.t * 5); }
    for (const u of this.b.units) if (u.alive && u.st.length) this.aura(u, dt);
  }
  // the look of whatever they are under, a few particles a second each
  aura(u, dt) {
    const fx = this.fx, acc = (u.fxAcc ||= {}), p = u.model.position, H = this.height(u);
    const every = (id, rate, fn) => { acc[id] = (acc[id] || 0) + dt * rate; while (acc[id] >= 1) { acc[id]--; fn(); } };
    const rr = (s) => (Math.random() - 0.5) * s;
    for (const s of u.st) {
      switch (s.id) {
        case 'burn': every('burn', 16, () => fx.glow({ x: p.x + rr(0.5), y: p.y + Math.random() * H * 0.8, z: p.z + rr(0.5), vy: 1.2, life: 0.5, size: 0.24, size1: 0.04, color: 0xfff1c0, color1: 0xd8341a, cell: CELL.flame, spin: 2 })); break;
        case 'poison': every('poison', 6, () => fx.glow({ x: p.x + rr(0.5), y: p.y + Math.random() * H * 0.7, z: p.z + rr(0.5), vy: 0.6, life: 0.9, size: 0.14, color: 0xa8d84a, cell: CELL.bubble })); break;
        case 'bleed': every('bleed', 5, () => fx.smoke({ x: p.x + rr(0.3), y: p.y + H * (0.4 + Math.random() * 0.4), z: p.z + rr(0.3), g: 5, life: 0.5, size: 0.1, color: 0xa01020, alpha: 0.9, cell: CELL.drop })); break;
        case 'stun': every('stun', 7, () => fx.glow({ x: p.x, y: p.y + H + 0.15, z: p.z, orbit: { x: p.x, z: p.z, r: 0.32, w: 5 }, life: 0.6, size: 0.16, color: 0xffe2a0, cell: CELL.star, spin: 4, fade: 0.2 })); break;
        case 'slow': every('slow', 5, () => fx.smoke({ x: p.x + rr(0.6), y: p.y + 0.1, z: p.z + rr(0.6), vy: 0.15, life: 1, size: 0.3, size1: 0.6, color: 0x8ad8ff, alpha: 0.35, cell: CELL.smoke })); break;
        case 'root': every('root', 4, () => fx.glow({ x: p.x, y: p.y + 0.08, z: p.z, orbit: { x: p.x, z: p.z, r: 0.45, w: 1.5 }, life: 0.9, size: 0.16, color: 0xa070ff, cell: CELL.sigil, fade: 0.3 })); break;
        case 'weaken': every('weaken', 4, () => fx.smoke({ x: p.x + rr(0.5), y: p.y + H * 0.9, z: p.z + rr(0.5), vy: -0.5, life: 0.9, size: 0.14, color: 0x8a8070, alpha: 0.6, cell: CELL.glow })); break;
        case 'curse': every('curse', 3, () => fx.glow({ x: p.x + rr(0.4), y: p.y + H * 0.9, z: p.z + rr(0.4), vy: 0.5, life: 1, size: 0.22, color: 0xb45cff, cell: CELL.skull, fade: 0.3 })); break;
        case 'haste': every('haste', 8, () => fx.glow({ x: p.x + rr(0.6), y: p.y + 0.1, z: p.z + rr(0.6), vy: 2.4, life: 0.4, size: 0.1, size1: 0.02, color: 0xffd860, cell: CELL.glow })); break;
        case 'guard': every('guard', 5, () => fx.glow({ x: p.x + rr(0.7), y: p.y + Math.random() * H, z: p.z + rr(0.7), life: 0.5, size: 0.14, color: 0xd0d9e6, cell: CELL.glint, flicker: 0.6 })); break;
        case 'might': every('might', 7, () => fx.glow({ x: p.x + rr(0.5), y: p.y + 0.1, z: p.z + rr(0.5), vy: 1.6, life: 0.6, size: 0.16, size1: 0.03, color: 0xff6a5a, cell: CELL.flame })); break;
        case 'regen': every('regen', 5, () => fx.glow({ x: p.x + rr(0.6), y: p.y + 0.1, z: p.z + rr(0.6), vy: 1.1, life: 0.8, size: 0.12, color: 0x6fe67a, cell: CELL.glint })); break;
        case 'doom': every('doom', 2.5, () => fx.glow({ x: p.x, y: p.y + H + 0.45, z: p.z, life: 0.45, size: 0.42, color: 0xd8b8ff, cell: CELL.skull, fade: 0.25 })); break;
        case 'counter': every('counter', 3, () => fx.glow({ x: p.x + rr(0.5), y: p.y + H * 0.6, z: p.z + rr(0.5), life: 0.4, size: 0.18, color: 0xffb040, cell: CELL.glint })); break;
        case 'taunt': every('taunt', 1.4, () => fx.ring(this.feet(u), 0xff4a3a, 0.2, 0.75, 0.6, 0.7)); break;
        case 'ward': every('ward', 6, () => fx.glow({ x: p.x, y: p.y + H * 0.55, z: p.z, orbit: { x: p.x, z: p.z, r: 0.55, w: 2.4 }, vy: rr(0.6), life: 0.8, size: 0.12, color: 0x9ad8ff, cell: CELL.glint, fade: 0.2 })); break;
        case 'wyrm': every('wyrm', 10, () => fx.glow({ x: p.x + rr(0.7), y: p.y + Math.random() * H, z: p.z + rr(0.7), vy: 1, life: 0.6, size: 0.2, size1: 0.04, color: 0xffb060, color1: 0xd8341a, cell: CELL.flame })); break;
        default: if (STATUS[s.id]) every(s.id, 3, () => fx.glow({ x: p.x + rr(0.5), y: p.y + Math.random() * H, z: p.z + rr(0.5), vy: 0.6, life: 0.7, size: 0.12, color: new THREE.Color(STATUS[s.id].color).getHex(), cell: CELL.glint }));
      }
    }
  }
  clear() {
    for (const f of this.floats) f.e.remove();
    this.floats = [];
    for (const e of this.marks.values()) { const end = e.end; e.end = null; e.dur = 0; end?.(); }
    this.marks.clear(); this.fx.clear();
    this.b.hud.querySelectorAll('.sk-ban, .cutin, .splash').forEach((e) => e.remove());
  }
}
