// The sixteen classes of VELSCOUR, turned from an action game's trees into a tactics kit.
// Names, descriptions, colours, attributes and weapons are VELSCOUR's (its src/data/classes.js);
// each class keeps four skills from its own trees, opening at levels 1, 3, 6 and 10.
//
// A skill: r = [min,max] range in tiles, aoe = radius of the blast, at = who it's aimed at,
// kind = phys | magic | heal | buff | debuff | summon, pow = multiplier on ATK or MAG.
// anim (optional) names the skill's own animation; a model without it plays 'cast' or 'attack'.

const S = (id, name, lvl, cost, r, aoe, at, kind, pow, x, desc) => ({ id, name, lvl, cost, r, aoe, at, kind, pow, ...x, desc });

export const SKILL_LEVELS = [1, 3, 6, 10];

export const CLASSES = {
  paladin: {
    name: 'Paladin', color: '#ffd860', primary: 'str', attrs: [24, 14, 24, 16], life: [70, 8], mana: [30, 2],
    weapon: ['mace', 'sword'], armor: 'plate', move: 3, jump: 1, role: 'Front line, healer', basicAnim: 'swing',
    desc: 'A holy warrior clad in blessed steel. Hammers of light, righteous auras and an unbreakable shield wall.',
    skills: [
      S('smite', 'Smite', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.35, { el: 'holy', anim: 'smite' }, 'A hammer blow with the Light behind it. The dead take half again as much.'),
      S('holy_bolt', 'Holy Bolt', 3, 8, [1, 4], 0, 'enemy', 'magic', 1.25, { el: 'holy', anim: 'bolt' }, 'A bolt of light thrown down the line.'),
      S('blessed_light', 'Blessed Light', 6, 10, [0, 3], 0, 'ally', 'heal', 1.7, { anim: 'bless' }, 'Mends one friend, or himself.'),
      S('consecration', 'Consecration', 10, 16, [0, 0], 2, 'self', 'magic', 1.2, { el: 'holy', allyHeal: 0.6, anim: 'wave' }, 'Hallows the ground round him: it burns foes and mends friends.'),
    ],
  },
  ranger: {
    name: 'Ranger', color: '#7ccf5a', primary: 'dex', attrs: [16, 28, 18, 14], life: [55, 6], mana: [30, 2.5],
    weapon: ['bow'], armor: 'leather', move: 4, jump: 2, role: 'Long range, a wolf at heel', basicAnim: 'shoot',
    desc: 'A deadly archer of the wildwood. Volleys of arrows, beast companions and cunning traps.',
    skills: [
      S('quick_shot', 'Quick Shot', 1, 4, [2, 6], 0, 'enemy', 'phys', 1.25, { anim: 'shoot' }, 'One arrow, loosed before the thought is finished.'),
      S('multishot', 'Multishot', 3, 9, [2, 5], 1, 'enemy', 'phys', 0.9, { anim: 'shoot' }, 'A fan of arrows across a knot of foes.'),
      S('wolf_pack', 'Wolf Pack', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'wolf', anim: 'call' }, 'Whistles up a wolf to fight beside her.'),
      S('rain_of_arrows', 'Rain of Arrows', 10, 18, [2, 6], 2, 'enemy', 'phys', 1.2, { anim: 'volley' }, 'The sky comes down pointed.'),
    ],
  },
  wizard: {
    name: 'Wizard', color: '#ff8a30', primary: 'int', attrs: [12, 16, 16, 32], life: [45, 5], mana: [60, 4],
    weapon: ['staff', 'wand'], armor: 'cloth', move: 3, jump: 1, role: 'Elemental artillery', basicAnim: 'bolt',
    desc: 'Master of the classic elements. Meteors, blizzards and chain lightning at your fingertips.',
    skills: [
      S('fire_bolt', 'Fire Bolt', 1, 5, [1, 5], 0, 'enemy', 'magic', 1.4, { el: 'fire', st: ['burn', 2, 0.35], anim: 'bolt' }, 'A bolt of flame. It may leave them burning.'),
      S('frost_nova', 'Frost Nova', 3, 10, [0, 0], 2, 'self', 'magic', 0.9, { el: 'cold', st: ['slow', 2, 1], anim: 'wave' }, 'A ring of frost that slows everything near.'),
      S('chain_lightning', 'Chain Lightning', 6, 12, [1, 5], 1, 'enemy', 'magic', 1.2, { el: 'storm', st: ['stun', 1, 0.2] }, 'Lightning that jumps to whoever stands close.'),
      S('meteor', 'Meteor', 10, 22, [2, 6], 2, 'enemy', 'magic', 1.9, { el: 'fire', st: ['burn', 2, 0.6], anim: 'meteor' }, 'A stone from the sky, on fire.'),
    ],
  },
  necromancer: {
    name: 'Necromancer', color: '#a070ff', primary: 'int', attrs: [14, 16, 18, 28], life: [48, 5], mana: [55, 4],
    weapon: ['wand', 'staff'], armor: 'cloth', move: 3, jump: 1, role: 'Summoner, curses', basicAnim: 'bolt',
    desc: 'Commander of the dead. Raise skeletal armies, hurl bone spears and detonate corpses.',
    skills: [
      S('bone_spike', 'Bone Spike', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.3, { el: 'shadow', anim: 'bolt' }, 'A splinter of somebody, thrown hard.'),
      S('raise_skeleton', 'Raise Skeleton', 3, 12, [1, 2], 0, 'tile', 'summon', 0, { summon: 'skeleton', anim: 'raise' }, 'Stands a skeleton up to fight for you.'),
      S('weaken', 'Weaken', 6, 8, [1, 4], 1, 'enemy', 'debuff', 0, { st: ['weaken', 3, 1], anim: 'curse' }, 'A curse that takes the strength out of their arms.'),
      S('corpse_explosion', 'Corpse Explosion', 10, 18, [1, 5], 2, 'enemy', 'magic', 1.7, { el: 'shadow' }, 'Whatever is buried here comes up all at once.'),
    ],
  },
  barbarian: {
    name: 'Barbarian', color: '#d8853a', primary: 'str', attrs: [30, 18, 26, 8], life: [80, 9], mana: [20, 1.5],
    weapon: ['axe'], armor: 'leather', move: 4, jump: 2, role: 'Brawler, runs on Rage', basicAnim: 'swing', resource: 'rage',
    desc: 'A savage berserker from the frozen north. Whirlwinds of steel, earth-splitting slams and battle cries.',
    skills: [
      S('bash', 'Bash', 1, 0, [1, 1], 0, 'enemy', 'phys', 1.3, { st: ['stun', 1, 0.25], rage: 15, anim: 'bash' }, 'Costs nothing and builds Rage. May stun.'),
      S('leap', 'Leap', 3, 20, [2, 4], 1, 'enemy', 'phys', 1.3, { dash: true, anim: 'leap' }, 'Jumps onto them, axes first.'),
      S('whirlwind', 'Whirlwind', 6, 30, [0, 0], 1, 'self', 'phys', 1.25, { anim: 'whirl' }, 'Spins. Everything next to her regrets it.'),
      S('earthquake', 'Earthquake', 10, 60, [0, 0], 2, 'self', 'phys', 1.6, { st: ['slow', 2, 1], anim: 'slam' }, 'Splits the ground under everyone near.'),
    ],
  },
  dragoon: {
    name: 'Dragoon', color: '#6aa8ff', primary: 'str', attrs: [24, 22, 22, 12], life: [65, 7], mana: [30, 2],
    weapon: ['spear'], armor: 'plate', move: 4, jump: 3, role: 'Leaps over the line', basicAnim: 'thrust',
    desc: 'A lance-wielding knight who leaps from the heavens. Dragon dives, lance flurries and wyrm breath.',
    skills: [
      S('lance_jab', 'Lance Jab', 1, 4, [1, 2], 0, 'enemy', 'phys', 1.3, { anim: 'thrust' }, 'A thrust from two tiles off.'),
      S('jump', 'Jump', 3, 10, [2, 5], 0, 'enemy', 'phys', 1.7, { dash: true, anim: 'leap' }, 'Up, over, and down on one of them.'),
      S('dragon_breath', 'Dragon Breath', 6, 12, [1, 2], 1, 'enemy', 'magic', 1.2, { el: 'fire', st: ['burn', 2, 0.5], anim: 'breath' }, 'The wyrm in the blood, breathed out.'),
      S('dragon_dive', 'Dragon Dive', 10, 20, [2, 6], 1, 'enemy', 'phys', 1.9, { dash: true, anim: 'leap' }, 'Falls on them like a dropped spire.'),
    ],
  },
  totem_master: {
    name: 'Totem Master', color: '#5ac8a0', primary: 'int', attrs: [18, 16, 22, 24], life: [60, 7], mana: [45, 3],
    weapon: ['staff'], armor: 'leather', move: 3, jump: 2, role: 'Plants totems that heal and burn',
    desc: 'A shaman who plants spirit totems that burn, shock and heal while ancestors fight at their side.',
    skills: [
      S('spirit_strike', 'Spirit Strike', 1, 4, [1, 3], 0, 'enemy', 'magic', 1.25, { el: 'light' }, 'An ancestor lends a hand, briefly and hard.'),
      S('healing_totem', 'Healing Totem', 3, 12, [1, 2], 0, 'tile', 'summon', 0, { summon: 'totem_heal' }, 'A carved post that mends whoever is hurt worst.'),
      S('searing_totem', 'Searing Totem', 6, 12, [1, 3], 0, 'tile', 'summon', 0, { summon: 'totem_sear' }, 'A carved post that spits fire at the nearest foe.'),
      S('earth_shock', 'Earth Shock', 10, 16, [1, 4], 1, 'enemy', 'magic', 1.6, { el: 'storm', st: ['stun', 1, 0.3] }, 'The ground itself takes a swing.'),
    ],
  },
  death_knight: {
    name: 'Death Knight', color: '#7ad0ff', primary: 'str', attrs: [26, 14, 26, 14], life: [75, 8], mana: [30, 2],
    weapon: ['sword', 'axe'], armor: 'plate', move: 3, jump: 1, role: 'Heavy blade, steals life', basicAnim: 'swing',
    desc: 'A fallen champion bound by runic frost. Obliterating strikes, plague and life-stealing blood magic.',
    skills: [
      S('frost_strike', 'Frost Strike', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.3, { el: 'cold', st: ['slow', 2, 0.5], anim: 'swing' }, 'A cut that leaves the cold in.'),
      S('death_coil', 'Death Coil', 3, 9, [1, 4], 0, 'enemy', 'magic', 1.3, { el: 'shadow', drain: 0.5, anim: 'bolt' }, 'Takes their life and keeps half.'),
      S('raise_ghoul', 'Raise Ghoul', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'ghoul', anim: 'raise' }, 'Something hungry, on your side for now.'),
      S('obliterate', 'Obliterate', 10, 18, [1, 1], 0, 'enemy', 'phys', 2.2, { el: 'cold', anim: 'smite' }, 'One colossal cleave.'),
    ],
  },
  arcane_sorcerer: {
    name: 'Astronomer', color: '#4aa8ff', primary: 'int', attrs: [12, 16, 16, 34], life: [44, 5], mana: [65, 4.5],
    weapon: ['wand', 'staff'], armor: 'cloth', move: 3, jump: 1, role: 'Star-fire and gravity',
    desc: 'A stargazer who wields the heavens. Swarms of star missiles, meteors, falling suns and black holes.',
    skills: [
      S('star_missiles', 'Star Missiles', 1, 6, [1, 5], 0, 'enemy', 'magic', 0.55, { el: 'arcane', hits: 3 }, 'Three small stars, each with somewhere to be.'),
      S('moonbeam', 'Moonbeam', 3, 9, [1, 5], 0, 'enemy', 'magic', 1.3, { el: 'arcane', st: ['curse', 3, 1] }, 'Cold light that finds the gaps in their guard.'),
      S('falling_star', 'Falling Star', 6, 13, [2, 6], 1, 'enemy', 'magic', 1.4, { el: 'arcane' }, 'She points. It falls.'),
      S('black_hole', 'Black Hole', 10, 22, [2, 5], 2, 'enemy', 'magic', 1.5, { el: 'arcane', st: ['root', 2, 1] }, 'A hole in the night that will not let go.'),
    ],
  },
  carrion_witch: {
    name: 'Carrion Witch', color: '#9ac84a', primary: 'int', attrs: [12, 18, 18, 30], life: [48, 5], mana: [55, 4],
    weapon: ['staff', 'wand'], armor: 'cloth', move: 3, jump: 1, role: 'Rot, crows and hexes', basicAnim: 'bolt',
    desc: 'A swamp hag who commands locusts and crows, and hexes her foes into rotting puppets.',
    skills: [
      S('rot_bolt', 'Rot Bolt', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.2, { el: 'poison', st: ['poison', 3, 0.7], anim: 'bolt' }, 'It keeps working after it lands.'),
      S('crow_swarm', 'Crow Swarm', 3, 9, [1, 5], 1, 'enemy', 'magic', 0.9, { st: ['bleed', 2, 0.8], anim: 'wave' }, 'A murder of crows, taking the name seriously.'),
      S('voodoo_doll', 'Voodoo Doll', 6, 10, [1, 5], 0, 'enemy', 'magic', 1.0, { st: ['curse', 3, 1], anim: 'hex' }, 'A pin in the poppet. Their guard comes apart.'),
      S('toxic_rain', 'Toxic Rain', 10, 18, [2, 5], 2, 'enemy', 'magic', 1.2, { el: 'poison', st: ['poison', 3, 1] }, 'It rains, and it is not water.'),
    ],
  },
  bard: {
    name: 'Bard', color: '#ff6a8a', primary: 'dex', attrs: [16, 26, 20, 18], life: [55, 6], mana: [40, 3],
    weapon: ['lute'], armor: 'leather', move: 4, jump: 2, role: 'Songs that mend and embolden', basicAnim: 'strum', basic: 'mag',
    desc: 'A roguish minstrel whose songs empower allies, whose chords shatter bone, and whose knives never miss.',
    skills: [
      S('plucked_note', 'Plucked Note', 1, 4, [1, 4], 0, 'enemy', 'magic', 1.25, { anim: 'strum' }, 'One note, sharpened.'),
      S('ballad_of_valor', 'Ballad of Valor', 3, 10, [0, 0], 2, 'self', 'buff', 0, { st: ['might', 3, 1], anim: 'ballad' }, 'Everyone near hits harder for three turns.'),
      S('hymn_of_mending', 'Hymn of Mending', 6, 14, [0, 0], 2, 'self', 'heal', 1.2, { anim: 'bless' }, 'Mends everyone near, himself included.'),
      S('lullaby', 'Lullaby', 10, 16, [1, 4], 1, 'enemy', 'debuff', 0, { st: ['stun', 1, 0.75], anim: 'ballad' }, 'Even the dead nod off.'),
    ],
  },
  slime_lord: {
    name: 'Slime Lord', color: '#4aa8ff', primary: 'vit', attrs: [18, 14, 32, 16], life: [85, 9], mana: [35, 2.5],
    weapon: ['mace'], armor: 'plate', move: 3, jump: 2, role: 'Soaks blows, breeds slimelings', basic: 'atk',
    desc: 'A crowned king of living ooze. Acid floods, endless slimeling broods and grotesque mutations.',
    skills: [
      S('slime_ball', 'Slime Ball', 1, 5, [1, 4], 0, 'enemy', 'magic', 1.25, { el: 'acid', st: ['slow', 2, 0.6] }, 'A royal handful, thrown.'),
      S('slimeling', 'Slimeling', 3, 10, [1, 2], 0, 'tile', 'summon', 0, { summon: 'slimeling' }, 'A small loyal subject splits off.'),
      S('body_slam', 'Body Slam', 6, 12, [1, 3], 1, 'enemy', 'phys', 1.5, { dash: true }, 'The whole king, arriving at once.'),
      S('acid_splash', 'Acid Splash', 10, 16, [1, 4], 2, 'enemy', 'magic', 1.3, { el: 'acid', st: ['curse', 3, 1] }, 'Armour was a good idea until now.'),
    ],
  },
  boomerang_knight: {
    name: 'Boomerang Knight', color: '#3ac8a8', primary: 'dex', attrs: [20, 28, 20, 12], life: [60, 7], mana: [30, 2],
    weapon: ['boomerang'], armor: 'leather', move: 4, jump: 2, role: 'Mid range, always comes back',
    desc: 'A dashing knight whose blades always come back. Ricochets, swirling sword storms and gale cyclones.',
    skills: [
      S('boomerang', 'Boomerang', 1, 4, [1, 4], 0, 'enemy', 'phys', 1.25, {}, 'Out, through them, and home.'),
      S('twin_rang', 'Twin Rang', 3, 7, [1, 4], 0, 'enemy', 'phys', 0.8, { hits: 2 }, 'Two blades, one after the other.'),
      S('swirling_blades', 'Swirling Blades', 6, 11, [0, 0], 1, 'self', 'phys', 1.2, { st: ['bleed', 2, 0.8] }, 'A ring of steel round him.'),
      S('typhoon', 'Typhoon', 10, 18, [1, 4], 2, 'enemy', 'phys', 1.4, {}, 'A gale with edges in it.'),
    ],
  },
  lancer: {
    name: 'Lancer', color: '#c0c0d0', primary: 'str', attrs: [26, 18, 30, 8], life: [88, 9], mana: [28, 1.6],
    weapon: ['spear'], armor: 'plate', move: 3, jump: 1, role: 'The wall', basicAnim: 'thrust',
    desc: 'An unbreakable knight-captain. Huge elemental energy lances, up to ten tower shields circling him, and an order of knights at his back.',
    skills: [
      S('lance_thrust', 'Lance Thrust', 1, 4, [1, 2], 0, 'enemy', 'phys', 1.3, { anim: 'thrust' }, 'A plain thrust, with reach.'),
      S('tower_shield', 'Tower Shield', 3, 8, [0, 0], 1, 'self', 'buff', 0, { st: ['guard', 3, 1], anim: 'guard_up' }, 'Shields up: the Lancer and anyone beside take far less.'),
      S('squire_knight', 'Squire Knight', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'squire', anim: 'rally' }, 'A knight of the order answers the banner.'),
      S('lance_charge', 'Lance Charge', 10, 14, [2, 4], 0, 'enemy', 'phys', 1.8, { dash: true, st: ['stun', 1, 0.35], anim: 'charge' }, 'Runs them down.'),
    ],
  },
  dragon_knight: {
    name: 'Dragon Knight', color: '#ff5a2a', primary: 'str', attrs: [26, 18, 24, 12], life: [72, 8], mana: [30, 2],
    weapon: ['sword'], armor: 'plate', move: 3, jump: 2, role: 'Fire in the front rank',
    desc: 'Blood of the wyrm runs hot. Fire breath, dragon-scale armor and the power to become a dragon.',
    skills: [
      S('flame_slash', 'Flame Slash', 1, 5, [1, 1], 0, 'enemy', 'phys', 1.3, { el: 'fire', st: ['burn', 2, 0.5] }, 'A cut that catches.'),
      S('fire_breath', 'Fire Breath', 3, 10, [1, 2], 1, 'enemy', 'magic', 1.15, { el: 'fire', st: ['burn', 2, 0.6] }, 'A river of fire, short and wide.'),
      S('dragon_scales', 'Dragon Scales', 6, 8, [0, 0], 0, 'self', 'buff', 0, { st: ['guard', 3, 1], st2: ['regen', 3, 1] }, 'Scales over skin. Guards and mends.'),
      S('summon_whelp', 'Summon Whelp', 10, 16, [1, 2], 0, 'tile', 'summon', 0, { summon: 'whelp' }, 'A small dragon with large opinions.'),
    ],
  },
  gunner: {
    name: 'Gunner', color: '#d0a060', primary: 'dex', attrs: [16, 30, 18, 16], life: [55, 6], mana: [35, 2.5],
    weapon: ['pistol'], armor: 'leather', move: 4, jump: 2, role: 'Powder, turrets and noise',
    desc: 'A powder-stained engineer. Bullet hell, rocket barrages, turrets, drones and a death laser.',
    skills: [
      S('pistol_shot', 'Pistol Shot', 1, 3, [2, 5], 0, 'enemy', 'phys', 1.25, {}, 'A careful shot.'),
      S('grenade', 'Grenade', 3, 9, [2, 4], 1, 'enemy', 'phys', 1.1, { el: 'fire' }, 'Thrown underarm. Arrives loudly.'),
      S('gun_turret', 'Gun Turret', 6, 14, [1, 2], 0, 'tile', 'summon', 0, { summon: 'turret' }, 'Brass, clockwork, and a grudge.'),
      S('bullet_hell', 'Bullet Hell', 10, 18, [2, 5], 0, 'enemy', 'phys', 0.6, { hits: 4 }, 'Four shots where one would do.'),
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
      S('lantern_light', 'Lantern Light', 6, 11, [0, 3], 1, 'ally', 'heal', 1.5, { anim: 'lantern' }, 'The light she carried in the war, held up a while.'),
      S('wave_of_candles', 'Wave of Candles', 10, 20, [0, 0], 2, 'self', 'magic', 1.6, { el: 'fire', st: ['burn', 2, 0.8], anim: 'wave' }, 'The candles catch in a wave from her hand.'),
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
};

// What a class's summons are. Stats are a share of the caster's.
export const SUMMONS = {
  wolf: { name: 'Wolf', model: 'wolf', hp: 0.6, atk: 0.8, move: 5, jump: 2, r: [1, 1], kind: 'phys' },
  skeleton: { name: 'Skeleton', model: 'skeleton', hp: 0.6, atk: 0.75, move: 3, jump: 1, r: [1, 1], kind: 'magic' },
  ghoul: { name: 'Ghoul', model: 'ghoul', hp: 0.7, atk: 0.9, move: 4, jump: 2, r: [1, 1], kind: 'phys' },
  slimeling: { name: 'Slimeling', model: 'slime', hp: 0.8, atk: 0.6, move: 3, jump: 2, r: [1, 1], kind: 'magic' },
  squire: { name: 'Squire Knight', model: 'squire', hp: 0.9, atk: 0.7, move: 3, jump: 1, r: [1, 2], kind: 'phys' },
  whelp: { name: 'Whelp', model: 'whelp', hp: 0.6, atk: 0.9, move: 4, jump: 3, r: [1, 3], kind: 'magic' },
  turret: { name: 'Gun Turret', model: 'turret', hp: 0.6, atk: 0.8, move: 0, jump: 0, r: [1, 5], kind: 'phys' },
  totem_sear: { name: 'Searing Totem', model: 'totem', hp: 0.5, atk: 0.75, move: 0, jump: 0, r: [1, 4], kind: 'magic' },
  totem_heal: { name: 'Healing Totem', model: 'totem', hp: 0.5, atk: 0.7, move: 0, jump: 0, r: [0, 3], kind: 'heal' },
};

export function findSkill(id) {
  if (SPELLS[id]) return SPELLS[id];
  for (const c of Object.values(CLASSES)) for (const s of c.skills) if (s.id === id) return s;
  return null;
}
