// The sixteen classes of VELSCOUR, turned from an action game's trees into a tactics kit, and the Ninja, this game's own.
// Names, descriptions, colours, attributes and weapons are VELSCOUR's (its src/data/classes.js);
// each class keeps four skills from its own trees (levels 1, 3, 6 and 10), and has four more that only the
// tactics game has (levels 2, 4, 8 and 13), built on the board: pushes, lines, traps, turn order.
//
// A skill: r = [min,max] range in tiles, aoe = radius of the blast, at = who it's aimed at (enemy | ally | self |
// tile | fallen), kind = phys | magic | heal | buff | debuff | summon | trap | cleanse | revive | tempo,
// pow = multiplier on ATK or MAG (for a revive, the share of life it comes back with).
// Optional: el (school), st / st2 ([status, turns, chance, strength]), self (a status on the user as well),
// hits, drain, dash (true, or 'behind'), blink (steps to the aimed tile first), shape ('line' | 'cone'),
// push / pull (tiles), chain (jumps on to that many more), execute (double on anyone under that share of life),
// delay (puts their turn back), tempo (brings an ally's forward), trap ({ kind, pow, el, aoe, st }), hpCost
// (a share of the user's own life), allyHeal, rage, summon.
// anim (optional) names the skill's own animation; a model without it plays 'cast' or 'attack'.

const S = (id, name, lvl, cost, r, aoe, at, kind, pow, x, desc) => ({ id, name, lvl, cost, r, aoe, at, kind, pow, ...x, desc });

export const SKILL_LEVELS = [1, 2, 3, 4, 6, 8, 10, 13];

export const CLASSES = {
  paladin: {
    name: 'Paladin', color: '#ffd860', primary: 'str', attrs: [24, 14, 24, 16], life: [70, 8], mana: [30, 2],
    weapon: ['mace', 'sword'], armor: 'plate', move: 3, jump: 1, role: 'Front line, healer', basicAnim: 'swing',
    desc: 'A holy warrior clad in blessed steel. Hammers of light, righteous auras and an unbreakable shield wall.',
    skills: [
      S('smite', 'Smite', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.35, { el: 'holy', anim: 'smite' }, 'A hammer blow with the Light behind it. The dead take half again as much.'),
      S('shield_bash', 'Shield Bash', 2, 6, [1, 1], 0, 'enemy', 'phys', 1.0, { el: 'holy', push: 1, st: ['stun', 1, 0.3], anim: 'bash' }, 'The flat of the shield, then the ground. They go back a step, if there is one.'),
      S('holy_bolt', 'Holy Bolt', 3, 8, [1, 4], 0, 'enemy', 'magic', 1.25, { el: 'holy', anim: 'bolt' }, 'A bolt of light thrown down the line.'),
      S('lay_on_hands', 'Lay on Hands', 4, 14, [1, 1], 0, 'fallen', 'revive', 0.5, { anim: 'bless' }, 'Kneels by a fallen friend and will not hear of it. They get up.'),
      S('blessed_light', 'Blessed Light', 6, 10, [0, 3], 0, 'ally', 'heal', 1.7, { anim: 'bless' }, 'Mends one friend, or himself.'),
      S('radiant_spark', 'Radiant Spark', 8, 12, [1, 4], 0, 'enemy', 'magic', 1.0, { el: 'holy', chain: 3, anim: 'bolt' }, 'Light that will not stay in one body. It jumps to three more close by.'),
      S('consecration', 'Consecration', 10, 16, [0, 0], 2, 'self', 'magic', 1.2, { el: 'holy', allyHeal: 0.6, anim: 'wave' }, 'Hallows the ground round him: it burns foes and mends friends.'),
      S('judgment_beam', 'Judgment', 13, 24, [1, 5], 0, 'enemy', 'magic', 1.6, { el: 'holy', shape: 'line', anim: 'smite' }, 'A line of light five tiles long. Everything standing in it is weighed, and found wanting.'),
    ],
  },
  ranger: {
    name: 'Ranger', color: '#7ccf5a', primary: 'dex', attrs: [16, 28, 18, 14], life: [55, 6], mana: [30, 2.5],
    weapon: ['bow'], armor: 'leather', move: 4, jump: 2, role: 'Long range, a wolf at heel', basicAnim: 'shoot',
    desc: 'A deadly archer of the wildwood. Volleys of arrows, beast companions and cunning traps.',
    skills: [
      S('quick_shot', 'Quick Shot', 1, 4, [2, 6], 0, 'enemy', 'phys', 1.25, { anim: 'shoot' }, 'One arrow, loosed before the thought is finished.'),
      S('piercing_arrow', 'Piercing Arrow', 2, 6, [1, 6], 0, 'enemy', 'phys', 1.0, { shape: 'line', anim: 'shoot' }, 'Drawn all the way back. It does not stop at the first one.'),
      S('multishot', 'Multishot', 3, 9, [2, 5], 1, 'enemy', 'phys', 0.9, { anim: 'shoot' }, 'A fan of arrows across a knot of foes.'),
      S('net_shot', 'Net Shot', 4, 7, [2, 5], 0, 'enemy', 'phys', 0.5, { st: ['root', 2, 0.9], anim: 'shoot' }, 'A weighted net. Hard to walk anywhere with your feet in it.'),
      S('wolf_pack', 'Wolf Pack', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'wolf', anim: 'call' }, 'Whistles up a wolf to fight beside her.'),
      S('spike_trap', 'Spike Trap', 8, 10, [1, 3], 0, 'tile', 'trap', 0, { trap: { kind: 'phys', pow: 1.3, st: ['bleed', 3, 1] }, anim: 'plant' }, 'Sharpened stakes under the leaves. Whoever of theirs steps there stops there.'),
      S('rain_of_arrows', 'Rain of Arrows', 10, 18, [2, 6], 2, 'enemy', 'phys', 1.2, { anim: 'volley' }, 'The sky comes down pointed.'),
      S('pinning_shot', 'Pinning Shot', 13, 16, [2, 6], 0, 'enemy', 'phys', 1.4, { delay: 40, st: ['slow', 2, 1], anim: 'shoot' }, 'Through the boot and into the ground. They will be a while getting loose.'),
    ],
  },
  wizard: {
    name: 'Wizard', color: '#ff8a30', primary: 'int', attrs: [12, 16, 16, 32], life: [45, 5], mana: [60, 4],
    weapon: ['staff', 'wand'], armor: 'cloth', move: 3, jump: 1, role: 'Elemental artillery', basicAnim: 'bolt',
    desc: 'Master of the classic elements. Meteors, blizzards and chain lightning at your fingertips.',
    skills: [
      S('fire_bolt', 'Fire Bolt', 1, 5, [1, 5], 0, 'enemy', 'magic', 1.4, { el: 'fire', st: ['burn', 2, 0.35], anim: 'bolt' }, 'A bolt of flame. It may leave them burning.'),
      S('ice_lance', 'Ice Lance', 2, 7, [1, 4], 0, 'enemy', 'magic', 1.1, { el: 'cold', shape: 'line', st: ['slow', 2, 0.6], anim: 'bolt' }, 'A spear of ice down a straight line, through as many of them as are standing in it.'),
      S('frost_nova', 'Frost Nova', 3, 10, [0, 0], 2, 'self', 'magic', 0.9, { el: 'cold', st: ['slow', 2, 1], anim: 'wave' }, 'A ring of frost that slows everything near.'),
      S('teleport', 'Teleport', 4, 10, [2, 4], 1, 'tile', 'magic', 0.9, { el: 'storm', blink: true, st: ['stun', 1, 0.2], anim: 'wave' }, 'Gone, and back four tiles off with a crack that knocks the nearest flat.'),
      S('chain_lightning', 'Chain Lightning', 6, 12, [1, 5], 1, 'enemy', 'magic', 1.2, { el: 'storm', st: ['stun', 1, 0.2] }, 'Lightning that jumps to whoever stands close.'),
      S('living_bomb', 'Living Bomb', 8, 14, [1, 5], 0, 'enemy', 'debuff', 0, { st: ['bomb', 2, 0.9, 1.8], anim: 'curse' }, 'Something lit inside them. In two turns it goes off, and takes the neighbours.'),
      S('meteor', 'Meteor', 10, 22, [2, 6], 2, 'enemy', 'magic', 1.9, { el: 'fire', st: ['burn', 2, 0.6], anim: 'meteor' }, 'A stone from the sky, on fire.'),
      S('blizzard', 'Blizzard', 13, 26, [2, 6], 2, 'enemy', 'magic', 1.3, { el: 'cold', st: ['slow', 2, 1], anim: 'meteor' }, 'Winter, all of it, on one patch of ground.'),
    ],
  },
  necromancer: {
    name: 'Necromancer', color: '#a070ff', primary: 'int', attrs: [14, 16, 18, 28], life: [48, 5], mana: [55, 4],
    weapon: ['wand', 'staff'], armor: 'cloth', move: 3, jump: 1, role: 'Summoner, curses', basicAnim: 'bolt',
    desc: 'Commander of the dead. Raise skeletal armies, hurl bone spears and detonate corpses.',
    skills: [
      S('bone_spike', 'Bone Spike', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.3, { el: 'shadow', anim: 'bolt' }, 'A splinter of somebody, thrown hard.'),
      S('blood_drain', 'Blood Drain', 2, 6, [1, 3], 0, 'enemy', 'magic', 1.0, { el: 'blood', drain: 0.6, anim: 'bolt' }, 'A red thread from them to you. Most of what comes along it stays.'),
      S('raise_skeleton', 'Raise Skeleton', 3, 12, [1, 2], 0, 'tile', 'summon', 0, { summon: 'skeleton', anim: 'raise' }, 'Stands a skeleton up to fight for you.'),
      S('doom', 'Doom', 4, 10, [1, 5], 0, 'enemy', 'debuff', 0, { st: ['doom', 3, 0.8, 2.2], anim: 'curse' }, 'A date is set. In three turns it falls on them, whatever else is happening.'),
      S('weaken', 'Weaken', 6, 8, [1, 4], 1, 'enemy', 'debuff', 0, { st: ['weaken', 3, 1], anim: 'curse' }, 'A curse that takes the strength out of their arms.'),
      S('bone_armor', 'Bone Armor', 8, 12, [0, 3], 0, 'ally', 'buff', 0, { st: ['ward', 3, 1, 1.6], anim: 'raise' }, 'Somebody else\'s ribs, worn on the outside. They take the blows first.'),
      S('corpse_explosion', 'Corpse Explosion', 10, 18, [1, 5], 2, 'enemy', 'magic', 1.7, { el: 'shadow' }, 'Whatever is buried here comes up all at once.'),
      S('bone_spear', 'Bone Spear', 13, 22, [1, 5], 0, 'enemy', 'magic', 1.6, { el: 'shadow', shape: 'line', anim: 'bolt' }, 'A long bone, thrown the long way. Everyone in the line feels it.'),
    ],
  },
  barbarian: {
    name: 'Barbarian', color: '#d8853a', primary: 'str', attrs: [30, 18, 26, 8], life: [80, 9], mana: [20, 1.5],
    weapon: ['axe'], armor: 'leather', move: 4, jump: 2, role: 'Brawler, runs on Rage', basicAnim: 'swing', resource: 'rage',
    desc: 'A savage berserker from the frozen north. Whirlwinds of steel, earth-splitting slams and battle cries.',
    skills: [
      S('bash', 'Bash', 1, 0, [1, 1], 0, 'enemy', 'phys', 1.3, { st: ['stun', 1, 0.25], rage: 15, anim: 'bash' }, 'Costs nothing and builds Rage. May stun.'),
      S('taunt', 'Taunt', 2, 0, [0, 0], 0, 'self', 'buff', 0, { st: ['taunt', 2, 1], st2: ['guard', 2, 1], rage: 20, anim: 'taunt' }, 'Something about their mothers. They come for the Barbarian, who is ready for them. Builds Rage.'),
      S('leap', 'Leap', 3, 20, [2, 4], 1, 'enemy', 'phys', 1.3, { dash: true, anim: 'leap' }, 'Jumps onto them, axes first.'),
      S('hurl', 'Hurl', 4, 15, [1, 1], 0, 'enemy', 'phys', 0.9, { push: 2, rage: 5, anim: 'bash' }, 'Picks them up and puts them somewhere else, hard.'),
      S('whirlwind', 'Whirlwind', 6, 30, [0, 0], 1, 'self', 'phys', 1.25, { anim: 'whirl' }, 'Spins. Everything next to her regrets it.'),
      S('executioner', 'Executioner', 8, 30, [1, 1], 0, 'enemy', 'phys', 1.3, { execute: 0.35, anim: 'smite' }, 'For the ones already on their knees. Twice as hard when they are low.'),
      S('earthquake', 'Earthquake', 10, 60, [0, 0], 2, 'self', 'phys', 1.6, { st: ['slow', 2, 1], anim: 'slam' }, 'Splits the ground under everyone near.'),
      S('wrath_of_the_berserker', 'Wrath of the Berserker', 13, 50, [0, 0], 0, 'self', 'buff', 0, { st: ['might', 3, 1], st2: ['haste', 3, 1], anim: 'taunt' }, 'Stops thinking. Hits harder and moves faster for three turns, and enjoys every one.'),
    ],
  },
  dragoon: {
    name: 'Dragoon', color: '#6aa8ff', primary: 'str', attrs: [24, 22, 22, 12], life: [65, 7], mana: [30, 2],
    weapon: ['spear'], armor: 'plate', move: 4, jump: 3, role: 'Leaps over the line', basicAnim: 'thrust',
    desc: 'A lance-wielding knight who leaps from the heavens. Dragon dives, lance flurries and wyrm breath.',
    skills: [
      S('lance_jab', 'Lance Jab', 1, 4, [1, 2], 0, 'enemy', 'phys', 1.3, { anim: 'thrust' }, 'A thrust from two tiles off.'),
      S('twin_thrust', 'Twin Thrust', 2, 6, [1, 2], 0, 'enemy', 'phys', 0.7, { hits: 2, anim: 'thrust' }, 'In, out, in again.'),
      S('jump', 'Jump', 3, 10, [2, 5], 0, 'enemy', 'phys', 1.7, { dash: true, anim: 'leap' }, 'Up, over, and down on one of them.'),
      S('skewer', 'Skewer', 4, 9, [1, 3], 0, 'enemy', 'phys', 1.2, { shape: 'line', anim: 'thrust' }, 'A lunge with the whole body behind it, through one and into the next.'),
      S('dragon_breath', 'Dragon Breath', 6, 12, [1, 2], 1, 'enemy', 'magic', 1.2, { el: 'fire', st: ['burn', 2, 0.5], anim: 'breath' }, 'The wyrm in the blood, breathed out.'),
      S('frost_breath', 'Frost Breath', 8, 14, [1, 3], 0, 'enemy', 'magic', 1.0, { el: 'cold', shape: 'cone', st: ['slow', 2, 0.8], anim: 'breath' }, 'The wyrm in the blood has a cold side. A widening cone of it.'),
      S('dragon_dive', 'Dragon Dive', 10, 20, [2, 6], 1, 'enemy', 'phys', 1.9, { dash: true, anim: 'leap' }, 'Falls on them like a dropped spire.'),
      S('comet_dive', 'Comet Dive', 13, 24, [2, 6], 1, 'enemy', 'phys', 1.8, { el: 'fire', dash: true, push: 1, st: ['burn', 2, 0.6], anim: 'leap' }, 'Up out of sight, and down like something on fire. Whoever is near gets thrown back.'),
    ],
  },
  totem_master: {
    name: 'Totem Master', color: '#5ac8a0', primary: 'int', attrs: [18, 16, 22, 24], life: [60, 7], mana: [45, 3],
    weapon: ['staff'], armor: 'leather', move: 3, jump: 2, role: 'Plants totems that heal and burn', basicAnim: 'bolt',
    desc: 'A shaman who plants spirit totems that burn, shock and heal while ancestors fight at their side.',
    skills: [
      S('spirit_strike', 'Spirit Strike', 1, 4, [1, 3], 0, 'enemy', 'magic', 1.25, { el: 'light', anim: 'bolt' }, 'An ancestor lends a hand, briefly and hard.'),
      S('spirit_chain', 'Spirit Chain', 2, 7, [1, 4], 0, 'enemy', 'magic', 0.9, { el: 'light', chain: 2, anim: 'bolt' }, 'An ancestor who goes from one to the next and the next, cuffing ears.'),
      S('healing_totem', 'Healing Totem', 3, 12, [1, 2], 0, 'tile', 'summon', 0, { summon: 'totem_heal', anim: 'plant' }, 'A carved post that mends whoever is hurt worst.'),
      S('hex', 'Hex', 4, 9, [1, 4], 0, 'enemy', 'debuff', 0, { st: ['weaken', 3, 0.9], st2: ['curse', 3, 0.7], anim: 'hex' }, 'A word in the old tongue. Their arms go weak and their guard goes thin.'),
      S('searing_totem', 'Searing Totem', 6, 12, [1, 3], 0, 'tile', 'summon', 0, { summon: 'totem_sear', anim: 'plant' }, 'A carved post that spits fire at the nearest foe.'),
      S('spirit_walk', 'Spirit Walk', 8, 12, [2, 5], 1, 'tile', 'heal', 0.9, { blink: true, anim: 'bless' }, 'Walks the way the spirits do, and arrives mending whoever is close.'),
      S('earth_shock', 'Earth Shock', 10, 16, [1, 4], 1, 'enemy', 'magic', 1.6, { el: 'storm', st: ['stun', 1, 0.3], anim: 'slam' }, 'The ground itself takes a swing.'),
      S('thunderhead_totem', 'Thunderhead Totem', 13, 20, [1, 3], 0, 'tile', 'summon', 0, { summon: 'totem_storm', anim: 'plant' }, 'A carved post with a storm shut up in it. The lightning jumps.'),
    ],
  },
  death_knight: {
    name: 'Death Knight', color: '#7ad0ff', primary: 'str', attrs: [26, 14, 26, 14], life: [75, 8], mana: [30, 2],
    weapon: ['sword', 'axe'], armor: 'plate', move: 3, jump: 1, role: 'Heavy blade, steals life', basicAnim: 'swing',
    desc: 'A fallen champion bound by runic frost. Obliterating strikes, plague and life-stealing blood magic.',
    skills: [
      S('frost_strike', 'Frost Strike', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.3, { el: 'cold', st: ['slow', 2, 0.5], anim: 'swing' }, 'A cut that leaves the cold in.'),
      S('death_grip', 'Death Grip', 2, 7, [2, 4], 0, 'enemy', 'magic', 0.6, { el: 'shadow', pull: 3, anim: 'cast' }, 'A cold hand on the collar from four tiles off. They come when called.'),
      S('death_coil', 'Death Coil', 3, 9, [1, 4], 0, 'enemy', 'magic', 1.3, { el: 'shadow', drain: 0.5, anim: 'bolt' }, 'Takes their life and keeps half.'),
      S('icebound_fortitude', 'Icebound Fortitude', 4, 9, [0, 0], 0, 'self', 'buff', 0, { st: ['ward', 3, 1, 1.4], st2: ['guard', 2, 1], anim: 'guard_up' }, 'Rime over the armour, then more armour. It takes a great deal to get through.'),
      S('raise_ghoul', 'Raise Ghoul', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'ghoul', anim: 'raise' }, 'Something hungry, on your side for now.'),
      S('blood_boil', 'Blood Boil', 8, 10, [0, 0], 1, 'self', 'magic', 1.1, { el: 'blood', drain: 0.3, hpCost: 0.06, anim: 'wave' }, 'Spends a little blood to boil everyone else\'s nearby, and drinks some back.'),
      S('obliterate', 'Obliterate', 10, 18, [1, 1], 0, 'enemy', 'phys', 2.2, { el: 'cold', anim: 'smite' }, 'One colossal cleave.'),
      S('remorseless_winter', 'Remorseless Winter', 13, 22, [0, 0], 2, 'self', 'magic', 1.3, { el: 'cold', st: ['slow', 2, 1], anim: 'wave' }, 'A winter that goes wherever the Death Knight goes. Nothing near keeps its pace.'),
    ],
  },
  arcane_sorcerer: {
    name: 'Astronomer', color: '#4aa8ff', primary: 'int', attrs: [12, 16, 16, 34], life: [44, 5], mana: [65, 4.5],
    weapon: ['wand', 'staff'], armor: 'cloth', move: 3, jump: 1, role: 'Star-fire and gravity', basicAnim: 'bolt',
    desc: 'A stargazer who wields the heavens. Swarms of star missiles, meteors, falling suns and black holes.',
    skills: [
      S('star_missiles', 'Star Missiles', 1, 6, [1, 5], 0, 'enemy', 'magic', 0.55, { el: 'arcane', hits: 3, anim: 'bolt' }, 'Three small stars, each with somewhere to be.'),
      S('starlight_step', 'Starlight Step', 2, 8, [2, 4], 1, 'tile', 'magic', 0.8, { el: 'arcane', blink: true, anim: 'wave' }, 'Out along a beam of starlight, and down among them, bright.'),
      S('moonbeam', 'Moonbeam', 3, 9, [1, 5], 0, 'enemy', 'magic', 1.3, { el: 'arcane', st: ['curse', 3, 1], anim: 'bless' }, 'Cold light that finds the gaps in their guard.'),
      S('repulse', 'Repulse', 4, 9, [0, 0], 1, 'self', 'magic', 0.7, { el: 'arcane', push: 2, anim: 'wave' }, 'The stars disagree with whoever is standing too close.'),
      S('falling_star', 'Falling Star', 6, 13, [2, 6], 1, 'enemy', 'magic', 1.4, { el: 'arcane', anim: 'meteor' }, 'She points. It falls.'),
      S('gravity_well', 'Gravity Well', 8, 14, [2, 5], 2, 'enemy', 'magic', 0.9, { el: 'arcane', pull: 1, st: ['slow', 2, 1], anim: 'wave' }, 'A small heaviness. Everyone round it is drawn in a step, and finds it hard to leave.'),
      S('black_hole', 'Black Hole', 10, 22, [2, 5], 2, 'enemy', 'magic', 1.5, { el: 'arcane', st: ['root', 2, 1], anim: 'wave' }, 'A hole in the night that will not let go.'),
      S('supernova', 'Supernova', 13, 28, [0, 0], 2, 'self', 'magic', 1.7, { el: 'arcane', anim: 'meteor' }, 'A star dies where the Astronomer stands. The Astronomer does not.'),
    ],
  },
  carrion_witch: {
    name: 'Carrion Witch', color: '#9ac84a', primary: 'int', attrs: [12, 18, 18, 30], life: [48, 5], mana: [55, 4],
    weapon: ['staff', 'wand'], armor: 'cloth', move: 3, jump: 1, role: 'Rot, crows and hexes', basicAnim: 'bolt',
    desc: 'A swamp hag who commands locusts and crows, and hexes her foes into rotting puppets.',
    skills: [
      S('rot_bolt', 'Rot Bolt', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.2, { el: 'poison', st: ['poison', 3, 0.7], anim: 'bolt' }, 'It keeps working after it lands.'),
      S('eye_gouge', 'Eye Gouge', 2, 6, [1, 4], 0, 'enemy', 'magic', 0.8, { el: 'shadow', st: ['weaken', 2, 0.8], anim: 'wave' }, 'One crow, with one idea. They fight half blind for a while.'),
      S('crow_swarm', 'Crow Swarm', 3, 9, [1, 5], 1, 'enemy', 'magic', 0.9, { st: ['bleed', 2, 0.8], anim: 'wave' }, 'A murder of crows, taking the name seriously.'),
      S('puppeteer', 'Puppeteer', 4, 10, [1, 5], 0, 'enemy', 'debuff', 0, { st: ['slow', 2, 1], delay: 60, anim: 'hex' }, 'Strings on the poppet. Their turn comes when the Witch allows it.'),
      S('voodoo_doll', 'Voodoo Doll', 6, 10, [1, 5], 0, 'enemy', 'magic', 1.0, { st: ['curse', 3, 1], anim: 'hex' }, 'A pin in the poppet. Their guard comes apart.'),
      S('pandemic', 'Pandemic', 8, 14, [1, 5], 2, 'enemy', 'debuff', 0, { st: ['poison', 3, 1], st2: ['weaken', 2, 0.5], anim: 'curse' }, 'One sneeze, and the whole field has it.'),
      S('toxic_rain', 'Toxic Rain', 10, 18, [2, 5], 2, 'enemy', 'magic', 1.2, { el: 'poison', st: ['poison', 3, 1] }, 'It rains, and it is not water.'),
      S('nevermore', 'Nevermore', 13, 24, [2, 5], 1, 'enemy', 'magic', 1.6, { el: 'shadow', st: ['bleed', 3, 1], anim: 'wave' }, 'Every crow in the county, all at once, all for them.'),
    ],
  },
  bard: {
    name: 'Bard', color: '#ff6a8a', primary: 'dex', attrs: [16, 26, 20, 18], life: [55, 6], mana: [40, 3],
    weapon: ['lute'], armor: 'leather', move: 4, jump: 2, role: 'Songs that mend and embolden', basicAnim: 'strum', basic: 'mag',
    desc: 'A roguish minstrel whose songs empower allies, whose chords shatter bone, and whose knives never miss.',
    skills: [
      S('plucked_note', 'Plucked Note', 1, 4, [1, 4], 0, 'enemy', 'magic', 1.25, { anim: 'strum' }, 'One note, sharpened.'),
      S('song_of_swiftness', 'Song of Swiftness', 2, 8, [0, 0], 2, 'self', 'buff', 0, { st: ['haste', 3, 1], anim: 'ballad' }, 'A quick tune. Everyone near keeps time with it, and finds they move faster.'),
      S('ballad_of_valor', 'Ballad of Valor', 3, 10, [0, 0], 2, 'self', 'buff', 0, { st: ['might', 3, 1], anim: 'ballad' }, 'Everyone near hits harder for three turns.'),
      S('sound_wave', 'Sound Wave', 4, 8, [1, 3], 0, 'enemy', 'magic', 0.9, { el: 'sound', shape: 'cone', push: 1, anim: 'strum' }, 'One chord, played very loud, in their direction.'),
      S('hymn_of_mending', 'Hymn of Mending', 6, 14, [0, 0], 2, 'self', 'heal', 1.2, { anim: 'bless' }, 'Mends everyone near, himself included.'),
      S('encore', 'Encore', 8, 14, [1, 4], 0, 'ally', 'tempo', 0, { tempo: 100, anim: 'ballad' }, 'That was good. They go again, straight away.'),
      S('lullaby', 'Lullaby', 10, 16, [1, 4], 1, 'enemy', 'debuff', 0, { st: ['stun', 1, 0.75], anim: 'ballad' }, 'Even the dead nod off.'),
      S('anthem_of_heroes', 'Anthem of Heroes', 13, 22, [0, 0], 2, 'self', 'cleanse', 0.8, { anim: 'ballad' }, 'The old song. Whatever ails them lets go, and the wounds close a little.'),
    ],
  },
  slime_lord: {
    name: 'Slime Lord', color: '#4aa8ff', primary: 'vit', attrs: [18, 14, 32, 16], life: [85, 9], mana: [35, 2.5],
    weapon: ['mace'], armor: 'plate', move: 3, jump: 2, role: 'Soaks blows, breeds slimelings', basic: 'atk', basicAnim: 'swing',
    desc: 'A crowned king of living ooze. Acid floods, endless slimeling broods and grotesque mutations.',
    skills: [
      S('slime_ball', 'Slime Ball', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.25, { el: 'acid', st: ['slow', 2, 0.6], anim: 'bolt' }, 'A royal handful, thrown.'),
      S('engulf', 'Engulf', 2, 6, [1, 1], 0, 'enemy', 'phys', 1.0, { el: 'acid', drain: 0.5, anim: 'slam' }, 'Takes them in for a moment. Gives most of them back.'),
      S('slimeling', 'Slimeling', 3, 10, [1, 2], 0, 'tile', 'summon', 0, { summon: 'slimeling', anim: 'split' }, 'A small loyal subject splits off.'),
      S('slime_armor', 'Slime Armor', 4, 9, [0, 0], 0, 'self', 'buff', 0, { st: ['ward', 3, 1, 1.4], st2: ['taunt', 2, 1], anim: 'scales' }, 'A coat of royal jelly. Blows sink in and stop, and the dead find it irresistible.'),
      S('body_slam', 'Body Slam', 6, 12, [1, 3], 1, 'enemy', 'phys', 1.5, { dash: true, anim: 'slam' }, 'The whole king, arriving at once.'),
      S('bounce', 'Bounce', 8, 12, [2, 4], 1, 'enemy', 'phys', 1.1, { el: 'acid', dash: true, push: 1, anim: 'leap' }, 'The whole king, airborne. Comes down on one of them and sends the rest flying.'),
      S('acid_splash', 'Acid Splash', 10, 16, [1, 4], 2, 'enemy', 'magic', 1.3, { el: 'acid', st: ['curse', 3, 1], anim: 'wave' }, 'Armour was a good idea until now.'),
      S('devour', 'Devour', 13, 20, [1, 1], 0, 'enemy', 'phys', 1.6, { el: 'acid', execute: 0.4, drain: 0.8, anim: 'slam' }, 'If they are weak enough, they are lunch. Most of it goes to the crown.'),
    ],
  },
  boomerang_knight: {
    name: 'Boomerang Knight', color: '#3ac8a8', primary: 'dex', attrs: [20, 28, 20, 12], life: [60, 7], mana: [30, 2],
    weapon: ['boomerang'], armor: 'leather', move: 4, jump: 2, role: 'Mid range, always comes back', basicAnim: 'throw',
    desc: 'A dashing knight whose blades always come back. Ricochets, swirling sword storms and gale cyclones.',
    skills: [
      S('boomerang', 'Boomerang', 1, 4, [1, 4], 0, 'enemy', 'phys', 1.25, { anim: 'throw' }, 'Out, through them, and home.'),
      S('ricochet', 'Ricochet', 2, 6, [1, 4], 0, 'enemy', 'phys', 0.9, { chain: 3, anim: 'throw' }, 'Off one head, off the next, off a third, and home.'),
      S('twin_rang', 'Twin Rang', 3, 7, [1, 4], 0, 'enemy', 'phys', 0.8, { hits: 2, anim: 'twin' }, 'Two blades, one after the other.'),
      S('riposte', 'Riposte', 4, 7, [0, 0], 0, 'self', 'buff', 0, { st: ['counter', 3, 1], st2: ['guard', 2, 1], anim: 'guard_up' }, 'Stands ready. Whoever comes in close to strike gets struck back.'),
      S('swirling_blades', 'Swirling Blades', 6, 11, [0, 0], 1, 'self', 'phys', 1.2, { st: ['bleed', 2, 0.8], anim: 'whirl' }, 'A ring of steel round him.'),
      S('gust', 'Gust', 8, 10, [0, 0], 1, 'self', 'phys', 0.6, { el: 'wind', push: 2, anim: 'whirl' }, 'Both blades spun at once. The wind off them throws everyone near two tiles back.'),
      S('typhoon', 'Typhoon', 10, 18, [1, 4], 2, 'enemy', 'phys', 1.4, { anim: 'typhoon' }, 'A gale with edges in it.'),
      S('thousand_cuts', 'Thousand Cuts', 13, 22, [1, 4], 0, 'enemy', 'phys', 0.55, { dash: 'behind', hits: 4, anim: 'twin' }, 'Behind them before they turn, and four cuts before they finish turning.'),
    ],
  },
  lancer: {
    name: 'Lancer', color: '#c0c0d0', primary: 'str', attrs: [26, 18, 30, 8], life: [88, 9], mana: [28, 1.6],
    weapon: ['spear'], armor: 'plate', move: 3, jump: 1, role: 'The wall', basicAnim: 'thrust',
    desc: 'An unbreakable knight-captain. Huge elemental energy lances, up to ten tower shields circling him, and an order of knights at his back.',
    skills: [
      S('lance_thrust', 'Lance Thrust', 1, 4, [1, 2], 0, 'enemy', 'phys', 1.3, { anim: 'thrust' }, 'A plain thrust, with reach.'),
      S('shield_slam', 'Shield Slam', 2, 6, [1, 1], 0, 'enemy', 'phys', 1.0, { push: 1, st: ['stun', 1, 0.25], anim: 'bash' }, 'A tower shield, used as a door. They are on the other side of it.'),
      S('tower_shield', 'Tower Shield', 3, 8, [0, 0], 1, 'self', 'buff', 0, { st: ['guard', 3, 1], anim: 'guard_up' }, 'Shields up: the Lancer and anyone beside take far less.'),
      S('hold_the_line', 'Hold the Line', 4, 8, [0, 0], 0, 'self', 'buff', 0, { st: ['taunt', 2, 1], st2: ['counter', 2, 1], anim: 'guard_up' }, 'Plants the lance and dares them. Anyone who takes the dare is answered.'),
      S('squire_knight', 'Squire Knight', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'squire', anim: 'rally' }, 'A knight of the order answers the banner.'),
      S('lance_of_light', 'Lance of Light', 8, 14, [1, 5], 0, 'enemy', 'magic', 1.4, { el: 'holy', shape: 'line', anim: 'thrust' }, 'The lance, made of light and five tiles long for a moment.'),
      S('lance_charge', 'Lance Charge', 10, 14, [2, 4], 0, 'enemy', 'phys', 1.8, { dash: true, st: ['stun', 1, 0.35], anim: 'charge' }, 'Runs them down.'),
      S('bastion_of_ten', 'Bastion of Ten', 13, 22, [0, 0], 2, 'self', 'buff', 0, { st: ['ward', 3, 1, 1.2], st2: ['guard', 2, 1], anim: 'rally' }, 'The ten shields come round: one for everyone near, and a few to spare.'),
    ],
  },
  dragon_knight: {
    name: 'Dragon Knight', color: '#ff5a2a', primary: 'str', attrs: [26, 18, 24, 12], life: [72, 8], mana: [30, 2],
    weapon: ['sword'], armor: 'plate', move: 3, jump: 2, role: 'Fire in the front rank', basicAnim: 'swing',
    desc: 'Blood of the wyrm runs hot. Fire breath, dragon-scale armor and the power to become a dragon.',
    skills: [
      S('flame_slash', 'Flame Slash', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.3, { el: 'fire', st: ['burn', 2, 0.5], anim: 'swing' }, 'A cut that catches.'),
      S('tail_swipe', 'Tail Swipe', 2, 6, [0, 0], 1, 'self', 'phys', 0.8, { el: 'fire', push: 1, anim: 'whirl' }, 'There is a tail, briefly, and then there is room.'),
      S('fire_breath', 'Fire Breath', 3, 10, [1, 2], 1, 'enemy', 'magic', 1.15, { el: 'fire', st: ['burn', 2, 0.6], anim: 'breath' }, 'A river of fire, short and wide.'),
      S('dragon_leap', 'Dragon Leap', 4, 10, [2, 4], 1, 'enemy', 'phys', 1.2, { el: 'fire', dash: true, anim: 'leap' }, 'Wings that are not quite there, then a landing that very much is.'),
      S('dragon_scales', 'Dragon Scales', 6, 8, [0, 0], 0, 'self', 'buff', 0, { st: ['guard', 3, 1], st2: ['regen', 3, 1], anim: 'scales' }, 'Scales over skin. Guards and mends.'),
      S('primal_roar', 'Primal Roar', 8, 12, [0, 0], 2, 'self', 'debuff', 0, { st: ['weaken', 2, 0.9], self: ['taunt', 2, 1], anim: 'breath' }, 'A sound from before there were words. Their arms go weak, and every one of them looks round.'),
      S('summon_whelp', 'Summon Whelp', 10, 16, [1, 2], 0, 'tile', 'summon', 0, { summon: 'whelp', anim: 'call' }, 'A small dragon with large opinions.'),
      S('dragon_form', 'Dragon Form', 13, 24, [0, 0], 0, 'self', 'buff', 0, { st: ['wyrm', 4, 1], anim: 'scales' }, 'Stops pretending. Bigger, harder to hurt and harder hitting, for four turns.'),
    ],
  },
  gunner: {
    name: 'Gunner', color: '#d0a060', primary: 'dex', attrs: [16, 30, 18, 16], life: [55, 6], mana: [35, 2.5],
    weapon: ['pistol'], armor: 'leather', move: 4, jump: 2, role: 'Powder, turrets and noise', basicAnim: 'shoot',
    desc: 'A powder-stained engineer. Bullet hell, rocket barrages, turrets, drones and a death laser.',
    skills: [
      S('pistol_shot', 'Pistol Shot', 1, 3, [2, 5], 0, 'enemy', 'phys', 1.25, { anim: 'shoot' }, 'A careful shot.'),
      S('buckshot', 'Buckshot', 2, 6, [1, 2], 0, 'enemy', 'phys', 0.9, { shape: 'cone', push: 1, anim: 'shoot' }, 'A fistful of shot at short range. The spread of it knocks them back.'),
      S('grenade', 'Grenade', 3, 9, [2, 4], 1, 'enemy', 'phys', 1.1, { el: 'fire', anim: 'lob' }, 'Thrown underarm. Arrives loudly.'),
      S('landmine', 'Landmine', 4, 9, [1, 3], 0, 'tile', 'trap', 0, { trap: { kind: 'phys', pow: 1.5, el: 'fire', aoe: 1, st: ['burn', 2, 0.6] }, anim: 'deploy' }, 'Buried, primed, and a little hopeful. Whoever of theirs treads on it finds out.'),
      S('gun_turret', 'Gun Turret', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'turret', anim: 'deploy' }, 'Brass, clockwork, and a grudge.'),
      S('rail_gun', 'Rail Gun', 8, 15, [1, 6], 0, 'enemy', 'phys', 1.5, { el: 'storm', shape: 'line', anim: 'shoot' }, 'Six tiles of straight line, and a noise the dead remember.'),
      S('bullet_hell', 'Bullet Hell', 10, 18, [2, 5], 0, 'enemy', 'phys', 0.6, { hits: 4, anim: 'fan' }, 'Four shots where one would do.'),
      S('orbital_strike', 'Orbital Strike', 13, 26, [2, 7], 1, 'enemy', 'phys', 2.0, { el: 'fire', st: ['burn', 2, 0.6], anim: 'point' }, 'A finger raised. Something very high up was waiting for exactly that.'),
    ],
  },
  // The tactics game's own: bm has three of them walking about and VELSCOUR none.
  ninja: {
    name: 'Ninja', color: '#9a8ac8', primary: 'dex', attrs: [18, 30, 16, 14], life: [52, 6], mana: [32, 2.5],
    weapon: ['dagger'], armor: 'leather', move: 5, jump: 3, role: 'Blade in the back, then gone', basicAnim: 'slash',
    desc: 'A quiet killer in dark cloth. Stars from the hand, smoke underfoot, a step through the shadows and a knife already moving.',
    skills: [
      S('throwing_stars', 'Throwing Stars', 1, 4, [1, 4], 0, 'enemy', 'phys', 0.5, { hits: 3, anim: 'stars' }, 'Three of them, thrown flat, one for each thing the ninja dislikes about you.'),
      S('shadow_step', 'Shadow Step', 2, 6, [2, 4], 0, 'enemy', 'phys', 1.15, { dash: 'behind', anim: 'step' }, 'Gone from here, and standing behind one of them, already cutting.'),
      S('smoke_bomb', 'Smoke Bomb', 3, 8, [1, 3], 1, 'enemy', 'debuff', 0, { st: ['weaken', 2, 0.9], st2: ['slow', 2, 0.6], anim: 'smoke' }, 'A clay ball and a cough. Nobody in it can see what they are hitting, or find the way out.'),
      S('caltrops', 'Caltrops', 4, 7, [1, 3], 0, 'tile', 'trap', 0, { trap: { kind: 'phys', pow: 1.1, aoe: 1, st: ['slow', 2, 1] }, anim: 'stars' }, 'A handful of iron jacks. Whoever of theirs walks through finds every one.'),
      S('venom_edge', 'Venom Edge', 6, 8, [1, 1], 0, 'enemy', 'phys', 1.1, { el: 'poison', st: ['poison', 3, 0.9], anim: 'slash' }, 'The knife was dipped in something first. It keeps working after the knife has gone.'),
      S('vanish', 'Vanish', 8, 10, [0, 0], 0, 'self', 'buff', 0, { st: ['haste', 2, 1], st2: ['guard', 2, 1], anim: 'smoke' }, 'Smoke, and no ninja in it. Harder to hit and quicker to the next thing, for two turns.'),
      S('hundred_cuts', 'Hundred Cuts', 10, 18, [1, 1], 0, 'enemy', 'phys', 0.45, { hits: 5, st: ['bleed', 2, 0.8], anim: 'cuts' }, 'Nobody has ever counted them. Nobody on the wrong end has ever asked.'),
      S('last_cut', 'The Last Cut', 13, 22, [1, 4], 0, 'enemy', 'phys', 1.6, { dash: 'behind', execute: 0.4, anim: 'cuts' }, 'Behind the weakest of them, once. Twice as hard if they were going anyway.'),
    ],
  },
  // Lisandra's own. Nobody else can be one.
  doorkeeper: {
    name: 'Doorkeeper', color: '#e6c27a', primary: 'int', attrs: [10, 18, 18, 32], life: [50, 5], mana: [60, 4.5],
    weapon: ['staff', 'wand'], armor: 'cloth', move: 3, jump: 1, role: 'Old tricks', hidden: true, basicAnim: 'cast_bolt',
    desc: 'Two hundred years keeping a door in a hill. A few old tricks left, and a snap of the fingers that has worked on forty-three people.',
    skills: [
      S('old_tricks', 'Old Tricks', 1, 4, [1, 5], 0, 'enemy', 'magic', 1.3, { el: 'fire', st: ['burn', 2, 0.4], anim: 'cast_bolt' }, 'A weak fire bolt, thrown with two hundred years of practice.'),
      S('the_snap', 'The Snap', 1, 9, [1, 4], 0, 'enemy', 'debuff', 0, { st: ['stun', 1, 0.85], anim: 'snap' }, 'She snaps her fingers. Whoever it touches believes they should stand still.'),
      S('the_lock', 'The Lock', 2, 7, [1, 4], 0, 'enemy', 'debuff', 0, { st: ['root', 2, 0.9], delay: 40, anim: 'snap' }, 'A key turned in the air. Whoever it was meant for finds the floor will not let go.'),
      S('candlelight', 'Candlelight', 4, 9, [0, 3], 1, 'ally', 'cleanse', 0.7, { anim: 'lantern' }, 'A candle held close. Poisons and curses do not care for it.'),
      S('lantern_light', 'Lantern Light', 6, 11, [0, 3], 1, 'ally', 'heal', 1.5, { anim: 'lantern' }, 'The light she carried in the war, held up a while.'),
      S('the_long_watch', 'The Long Watch', 8, 12, [1, 4], 0, 'ally', 'tempo', 0, { tempo: 60, anim: 'lantern' }, 'Two hundred years of knowing when to move. She lends a friend a little of it.'),
      S('wave_of_candles', 'Wave of Candles', 10, 20, [0, 0], 2, 'self', 'magic', 1.6, { el: 'fire', st: ['burn', 2, 0.8], anim: 'wave' }, 'The candles catch in a wave from her hand.'),
      S('open_the_door', 'Open the Door', 13, 26, [1, 6], 0, 'enemy', 'magic', 1.8, { el: 'holy', shape: 'line', anim: 'wave' }, 'She opens it a crack. What comes out goes in a straight line and does not come back.'),
    ],
  },
};

export const CLASS_IDS = Object.keys(CLASSES).filter((k) => !CLASSES[k].hidden);

// Scrolls anyone can learn from Orrin Vey. A character holds three at most.
export const SPELLS = {
  mend: S('mend', 'Mend', 1, 7, [0, 3], 0, 'ally', 'heal', 1.3, { price: 60 }, 'Closes a wound.'),
  firebolt: S('firebolt', 'Firebolt', 1, 5, [1, 5], 0, 'enemy', 'magic', 1.2, { el: 'fire', price: 60 }, 'The first spell anyone learns, and the last they forget.'),
  frost_shards: S('frost_shards', 'Frost Shards', 1, 6, [1, 4], 0, 'enemy', 'magic', 1.05, { el: 'cold', st: ['slow', 2, 0.8], price: 80 }, 'Slows what it cuts.'),
  stone_shard: S('stone_shard', 'Stone Shard', 2, 6, [1, 4], 0, 'enemy', 'phys', 1.3, { price: 80 }, 'A thrown stone that does not need an arm.'),
  spark: S('spark', 'Spark', 2, 7, [1, 4], 1, 'enemy', 'magic', 0.85, { el: 'storm', price: 110 }, 'Jumps between those standing close.'),
  aegis: S('aegis', 'Aegis', 3, 8, [0, 3], 0, 'ally', 'buff', 0, { st: ['guard', 3, 1], price: 140 }, 'A shell of pale light round one friend.'),
  renew: S('renew', 'Renew', 4, 9, [0, 3], 0, 'ally', 'buff', 0, { st: ['regen', 4, 1], price: 160 }, 'Mends a little, every turn, for four turns.'),
  turn_the_dead: S('turn_the_dead', 'Turn the Dead', 5, 14, [1, 4], 1, 'enemy', 'magic', 1.3, { el: 'holy', price: 260 }, 'The dead take half again as much, and they know it.'),
  stillness: S('stillness', 'Stillness', 6, 12, [1, 5], 1, 'enemy', 'debuff', 0, { st: ['root', 2, 1], price: 300 }, 'Nothing in the circle takes a step.'),
};

export const STATUS = {
  poison: { name: 'Poisoned', bad: true, dot: 0.08, color: '#9ac84a' },
  burn: { name: 'Burning', bad: true, dot: 0.1, color: '#ff8a30' },
  bleed: { name: 'Bleeding', bad: true, dot: 0.07, color: '#c04848' },
  stun: { name: 'Stunned', bad: true, color: '#ffe2a0' },
  slow: { name: 'Slowed', bad: true, color: '#7ad0ff' },
  root: { name: 'Held', bad: true, color: '#a070ff' },
  weaken: { name: 'Weakened', bad: true, color: '#a8977c' },
  curse: { name: 'Cursed', bad: true, color: '#b45cff' },
  haste: { name: 'Hastened', color: '#ffd860' },
  guard: { name: 'Guarded', color: '#d0d9e6' },
  might: { name: 'Emboldened', color: '#ff6a8a' },
  regen: { name: 'Mending', hot: 0.1, color: '#4fd65a' },
  // the tactics game's own: a doom falls when it runs out (a primed one takes the neighbours), a ward soaks harm
  // until its strength is spent, a riposte answers a blow from close by, a taunt draws the dead's eye
  doom: { name: 'Doomed', bad: true, doom: true, color: '#d8b8ff' },
  bomb: { name: 'Primed', bad: true, doom: true, blast: 1, color: '#ff8a30' },
  ward: { name: 'Warded', color: '#9ad8ff' },
  counter: { name: 'Riposte', color: '#ffb040' },
  taunt: { name: 'Taunting', color: '#ff4a3a' },
  wyrm: { name: 'Wyrm Form', color: '#ff7a3a' },
};

// What a class's summons are. Stats are a share of the caster's.
export const SUMMONS = {
  wolf: { name: 'Wolf', model: 'wolf', hp: 0.6, atk: 0.8, move: 5, jump: 2, r: [1, 1], kind: 'phys' },
  skeleton: { name: 'Skeleton', model: 'skeleton', hp: 0.6, atk: 0.75, move: 3, jump: 1, r: [1, 1], kind: 'magic', el: 'shadow' },
  ghoul: { name: 'Ghoul', model: 'ghoul', hp: 0.7, atk: 0.9, move: 4, jump: 2, r: [1, 1], kind: 'phys' },
  slimeling: { name: 'Slimeling', model: 'slime', hp: 0.8, atk: 0.6, move: 3, jump: 2, r: [1, 1], kind: 'magic', el: 'acid' },
  squire: { name: 'Squire Knight', model: 'squire', hp: 0.9, atk: 0.7, move: 3, jump: 1, r: [1, 2], kind: 'phys' },
  whelp: { name: 'Whelp', model: 'whelp', hp: 0.6, atk: 0.9, move: 4, jump: 3, r: [1, 3], kind: 'magic', el: 'fire' },
  turret: { name: 'Gun Turret', model: 'turret', hp: 0.6, atk: 0.8, move: 0, jump: 0, r: [1, 5], kind: 'phys' },
  totem_sear: { name: 'Searing Totem', model: 'totem', hp: 0.5, atk: 0.75, move: 0, jump: 0, r: [1, 4], kind: 'magic', el: 'fire' },
  totem_heal: { name: 'Healing Totem', model: 'totem', hp: 0.5, atk: 0.7, move: 0, jump: 0, r: [0, 3], kind: 'heal' },
  // its lightning jumps to two more close by
  totem_storm: { name: 'Thunderhead Totem', model: 'totem', hp: 0.5, atk: 0.85, move: 0, jump: 0, r: [1, 4], kind: 'magic', el: 'storm', chain: 2 },
};

export function findSkill(id) {
  if (SPELLS[id]) return SPELLS[id];
  for (const c of Object.values(CLASSES)) for (const s of c.skills) if (s.id === id) return s;
  return null;
}
