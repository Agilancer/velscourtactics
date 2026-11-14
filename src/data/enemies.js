// The dead, and what keeps their company. Five kinds in the pines, by how they come at you (bm's shambler, runner and
// lurker, VELSCOUR's Bloated Bonesack and Chained Brute); then two for each land past the pines and that land's lord;
// then the rest of the pines' company, down to the crypt's keeper. `kind` in map.js packs is the index here, map.js
// REGIONS names which indexes walk where, and WOODS below names the pines' by id: keep the order, add to the end.
// The stand-in for each is makeZombie in gfx/models.js; the real model's key is 'zombie_' + id (assets/models/manifest.json).
// living: not one of the dead, so holy work does it no more harm than anyone (Battle).
const S = (id, name, cost, r, aoe, at, kind, pow, x = {}) => ({ id, name, lvl: 1, cost, r, aoe, at, kind, pow, ...x });

export const ZOMBIES = [
  {
    id: 'shambler', name: 'Shambler', plural: 'Shamblers', hp: 1, atk: 1, def: 1, spd: 5, move: 3, jump: 1, sight: 5,
    color: 0x7a8a6a, scale: 1,
    blurb: 'Somebody’s neighbour, once. Slow, patient, and never alone.',
    skills: [S('rake', 'Rake', 0, [1, 1], 0, 'enemy', 'phys', 1)],
  },
  {
    id: 'gnawer', name: 'Gnawer', plural: 'Gnawers', hp: 0.75, atk: 0.95, def: 0.7, spd: 9, move: 5, jump: 2, sight: 6,
    color: 0x9a7a6a, scale: 0.92,
    blurb: 'A runner. It lopes, it hobbles, and then it is on you.',
    skills: [S('bite', 'Bite', 0, [1, 1], 0, 'enemy', 'phys', 1.05, { st: ['bleed', 2, 0.4] })],
  },
  {
    id: 'lurker', name: 'Lurker', plural: 'Lurkers', hp: 0.9, atk: 1.3, def: 0.9, spd: 7, move: 4, jump: 2, sight: 3, ambush: true,
    color: 0x5a6a5a, scale: 1,
    blurb: 'Lies in the needles and plays dead. Then it does not.',
    skills: [S('pounce', 'Pounce', 0, [2, 3], 0, 'enemy', 'phys', 1.2, { dash: true, anim: 'pounce' }), S('rake', 'Rake', 0, [1, 1], 0, 'enemy', 'phys', 1)],
  },
  {
    id: 'bonesack', name: 'Bloated Bonesack', plural: 'Bloated Bonesacks', hp: 1.5, atk: 0.85, def: 0.8, spd: 4, move: 2, jump: 1, sight: 5, burst: true,
    color: 0x8a9a4a, scale: 1.15,
    blurb: 'Full of something. Stand back when it goes.',
    skills: [S('retch', 'Retch', 0, [1, 3], 0, 'enemy', 'magic', 0.9, { el: 'poison', st: ['poison', 3, 0.7] }), S('rake', 'Rake', 0, [1, 1], 0, 'enemy', 'phys', 0.9)],
  },
  {
    id: 'brute', name: 'Chained Brute', plural: 'Chained Brutes', hp: 2.6, atk: 1.45, def: 1.4, spd: 4, move: 3, jump: 1, sight: 5,
    color: 0x6a6a7a, scale: 1.5,
    blurb: 'Too big for one grave. Whoever chained it did not chain it well.',
    skills: [S('chain_sweep', 'Chain Sweep', 0, [0, 0], 1, 'self', 'phys', 0.9, { anim: 'sweep' }), S('slam', 'Slam', 0, [1, 1], 0, 'enemy', 'phys', 1.25, { st: ['stun', 1, 0.3] })],
  },
  // ---- the White Waste ----
  {
    id: 'rimewalker', name: 'Rimewalker', plural: 'Rimewalkers', hp: 1.7, atk: 1.1, def: 1.5, spd: 4, move: 3, jump: 1, sight: 5,
    color: 0x9ab8c8, scale: 1.1,
    blurb: 'Froze on the march and kept marching. The ice is most of what holds it up.',
    skills: [S('frozen_grip', 'Frozen Grip', 0, [1, 1], 0, 'enemy', 'phys', 1.1, { el: 'cold', st: ['slow', 2, 0.6] })],
  },
  {
    id: 'driftling', name: 'Driftling', plural: 'Driftlings', hp: 0.9, atk: 1.35, def: 0.8, spd: 8, move: 5, jump: 2, sight: 3, ambush: true,
    color: 0xd8e4ea, scale: 0.95,
    blurb: 'A hump in the snow, until you are past it.',
    skills: [S('pounce', 'Pounce', 0, [2, 3], 0, 'enemy', 'phys', 1.2, { dash: true, anim: 'pounce' }), S('bite', 'Bite', 0, [1, 1], 0, 'enemy', 'phys', 1.05, { st: ['bleed', 2, 0.4] })],
  },
  // ---- the Red Badlands ----
  {
    id: 'husk', name: 'Dust Husk', plural: 'Dust Husks', hp: 0.7, atk: 0.9, def: 0.6, spd: 10, move: 5, jump: 2, sight: 6,
    color: 0xb89a6a, scale: 0.9,
    blurb: 'The sun took everything that weighed anything. What is left is quick.',
    skills: [S('flurry', 'Flurry', 0, [1, 1], 0, 'enemy', 'phys', 0.6, { hits: 2 })],
  },
  {
    id: 'slinger', name: 'Rib Slinger', plural: 'Rib Slingers', hp: 0.8, atk: 1.05, def: 0.7, spd: 6, move: 3, jump: 1, sight: 6,
    color: 0xd8c8a0, scale: 1,
    blurb: 'Throws what it has. It has ribs.',
    skills: [S('rib_throw', 'Rib Throw', 0, [2, 5], 0, 'enemy', 'phys', 0.95), S('rake', 'Rake', 0, [1, 1], 0, 'enemy', 'phys', 0.8)],
  },
  // ---- the Drowned Fen ----
  {
    id: 'drowner', name: 'Bog Drowner', plural: 'Bog Drowners', hp: 1.3, atk: 1.15, def: 1, spd: 5, move: 3, jump: 1, sight: 4,
    color: 0x4a6a5a, scale: 1.05,
    blurb: 'It went under once. It thinks you should see what it saw.',
    skills: [S('drag_under', 'Drag Under', 0, [1, 2], 0, 'enemy', 'phys', 1, { st: ['root', 1, 0.6] }), S('rake', 'Rake', 0, [1, 1], 0, 'enemy', 'phys', 1.1)],
  },
  {
    id: 'leechmother', name: 'Leech Mother', plural: 'Leech Mothers', hp: 1.4, atk: 1, def: 0.8, spd: 5, move: 2, jump: 1, sight: 5, burst: 'poison',
    color: 0x5a3a4a, scale: 1.15,
    blurb: 'Not one thing. A great many small things, agreeing.',
    skills: [S('leech', 'Leech', 0, [1, 3], 0, 'enemy', 'magic', 1, { el: 'shadow', drain: 0.5 }), S('retch', 'Retch', 0, [1, 3], 0, 'enemy', 'magic', 0.9, { el: 'poison', st: ['poison', 3, 0.7] })],
  },
  // ---- the Cinder Reach ----
  {
    id: 'cinder', name: 'Cinder Wretch', plural: 'Cinder Wretches', hp: 0.9, atk: 1.2, def: 0.8, spd: 8, move: 4, jump: 2, sight: 6, burst: 'burn',
    color: 0x3a2a26, scale: 1,
    blurb: 'Still burning. It has been burning a long while, and it would like company.',
    skills: [S('ember_claw', 'Ember Claw', 0, [1, 1], 0, 'enemy', 'phys', 1.1, { el: 'fire', st: ['burn', 2, 0.5] })],
  },
  {
    id: 'slagback', name: 'Slagback', plural: 'Slagbacks', hp: 2.4, atk: 1.3, def: 1.7, spd: 3, move: 2, jump: 1, sight: 5,
    color: 0x4a4650, scale: 1.4,
    blurb: 'The furnace cooled round it. Now it carries the furnace.',
    skills: [S('slag_spray', 'Slag Spray', 0, [1, 3], 1, 'enemy', 'magic', 0.9, { el: 'fire', st: ['burn', 2, 0.4] }), S('slam', 'Slam', 0, [1, 1], 0, 'enemy', 'phys', 1.25, { st: ['stun', 1, 0.3] })],
  },
  // ---- the lords: one each, at home in its land's ruin ----
  {
    id: 'warden', name: 'The Frozen Warden', plural: 'Frozen Wardens', lord: true, hp: 4.2, atk: 1.5, def: 1.6, spd: 5, move: 3, jump: 2, sight: 6,
    color: 0x7a9ab8, scale: 1.7,
    blurb: 'Nobody relieved it. It holds the fort against the living now, there being no one else.',
    skills: [S('winter_toll', 'Winter Toll', 0, [0, 0], 2, 'self', 'magic', 1, { el: 'cold', st: ['slow', 2, 0.8], anim: 'sweep' }), S('glaive', 'Glaive', 0, [1, 2], 0, 'enemy', 'phys', 1.4)],
  },
  {
    id: 'dryking', name: 'The Dry King', plural: 'Dry Kings', lord: true, hp: 3.6, atk: 1.55, def: 1.2, spd: 7, move: 4, jump: 2, sight: 6,
    color: 0xc8a060, scale: 1.55,
    blurb: 'A crown, a court, and not a drop between them.',
    skills: [S('sandstorm', 'Sandstorm', 0, [1, 4], 1, 'enemy', 'magic', 1, { st: ['weaken', 3, 0.7] }), S('flurry', 'Flurry', 0, [1, 1], 0, 'enemy', 'phys', 0.75, { hits: 2 })],
  },
  {
    id: 'abbess', name: 'The Drowned Abbess', plural: 'Drowned Abbesses', lord: true, hp: 3.4, atk: 1.6, def: 1.1, spd: 6, move: 3, jump: 1, sight: 6,
    color: 0x3a5a5a, scale: 1.5,
    blurb: 'She kept the office through the flood. She keeps it still, to a full house.',
    skills: [S('dirge', 'Dirge', 0, [1, 4], 1, 'enemy', 'magic', 1.05, { el: 'shadow', st: ['curse', 3, 0.7] }), S('drag_under', 'Drag Under', 0, [1, 2], 0, 'enemy', 'phys', 1.1, { st: ['root', 1, 0.7] })],
  },
  {
    id: 'stoker', name: 'The Stoker', plural: 'Stokers', lord: true, hp: 4.4, atk: 1.6, def: 1.5, spd: 5, move: 3, jump: 1, sight: 6, burst: 'burn',
    color: 0x5a3a2a, scale: 1.7,
    blurb: 'The train is gone. The fire is not, and somebody has to feed it.',
    skills: [S('firebox', 'Firebox', 0, [1, 3], 1, 'enemy', 'magic', 1.1, { el: 'fire', st: ['burn', 2, 0.6] }), S('shovel', 'Shovel', 0, [1, 1], 0, 'enemy', 'phys', 1.4, { st: ['stun', 1, 0.35] })],
  },
  // ---- the pines' other company, and the crypt's keeper ----
  {
    id: 'possessed', name: 'The Possessed', plural: 'The Possessed', hp: 0.9, atk: 1.05, def: 0.8, spd: 8, move: 4, jump: 2, sight: 5, living: true,
    color: 0x8a8090, scale: 1.17,
    blurb: 'Somebody you might have known, with something else looking out. It knows your name. It says it wrong.',
    skills: [S('claw', 'Raking Claw', 0, [1, 1], 0, 'enemy', 'phys', 1.05, { st: ['bleed', 2, 0.3] }),
      S('shriek', 'Shriek', 0, [1, 3], 1, 'enemy', 'debuff', 0, { st: ['weaken', 2, 0.75] })],
  },
  {
    id: 'spider', name: 'Grave Spider', plural: 'Grave Spiders', hp: 0.7, atk: 0.9, def: 0.75, spd: 10, move: 5, jump: 3, sight: 6, living: true,
    color: 0x3a3434, scale: 0.67,
    blurb: 'Too many legs and no manners at all. Look up before you look anywhere else.',
    skills: [S('venom_bite', 'Venom Bite', 0, [1, 1], 0, 'enemy', 'phys', 1, { el: 'poison', st: ['poison', 3, 0.6] }),
      S('web', 'Web', 0, [2, 3], 0, 'enemy', 'debuff', 0, { st: ['slow', 2, 0.8] })],
  },
  {
    id: 'goblin', name: 'Barrow Goblin', plural: 'Barrow Goblins', hp: 0.6, atk: 0.85, def: 0.7, spd: 8, move: 4, jump: 2, sight: 5, swarm: true, living: true,
    color: 0x6a7a3a, scale: 0.83,
    blurb: 'Grave-robbers, small and quick and never one at a time. Not dead. They just keep the company.',
    skills: [S('stab', 'Cheap Stab', 0, [1, 1], 0, 'enemy', 'phys', 0.95)],
  },
  {
    id: 'plague_knight', name: 'Plague Knight', plural: 'Plague Knights', hp: 1.9, atk: 1.35, def: 1.6, spd: 5, move: 3, jump: 1, sight: 5,
    color: 0x5a6450, scale: 1.3,
    blurb: 'Rusted shut in his harness, still keeping a watch nobody set him.',
    skills: [S('rot_blade', 'Rotten Blade', 0, [1, 1], 0, 'enemy', 'phys', 1.3, { st: ['poison', 3, 0.35] }),
      S('bash', 'Shield Bash', 0, [1, 1], 0, 'enemy', 'phys', 0.85, { st: ['stun', 1, 0.3], anim: 'slam' })],
  },
  {
    id: 'harpy', name: 'Carrion Harpy', plural: 'Carrion Harpies', hp: 0.85, atk: 1.1, def: 0.8, spd: 9, move: 5, jump: 4, sight: 7,
    color: 0x8a6a58, scale: 1.2,
    blurb: 'Comes down out of the grey like a dropped knife. Mind the washing.',
    skills: [S('dive', 'Diving Strike', 0, [2, 4], 0, 'enemy', 'phys', 1.15, { dash: true, anim: 'pounce' }),
      S('talons', 'Talons', 0, [1, 1], 0, 'enemy', 'phys', 0.95, { st: ['bleed', 2, 0.35] })],
  },
  {
    id: 'necromancer', name: 'Grave Caller', plural: 'Grave Callers', hp: 0.85, atk: 1.2, def: 0.8, spd: 6, move: 3, jump: 1, sight: 6,
    color: 0x3a2e4a, scale: 1.27,
    blurb: 'Calls the dead up by name. They come, mostly to complain.',
    skills: [S('shadow_bolt', 'Shadow Bolt', 0, [2, 5], 0, 'enemy', 'magic', 1.1),
      S('wither', 'Wither', 0, [2, 4], 1, 'enemy', 'debuff', 0, { st: ['weaken', 2, 0.8] })],
  },
  {
    id: 'werewolf', name: 'Werewolf', plural: 'Werewolves', hp: 1.3, atk: 1.3, def: 1, spd: 9, move: 5, jump: 2, sight: 6, living: true,
    color: 0x5a4a3a, scale: 1.53,
    blurb: 'All teeth and bad decisions. Bleeds you, then waits.',
    skills: [S('maul', 'Maul', 0, [1, 1], 0, 'enemy', 'phys', 1.15, { st: ['bleed', 3, 0.5] }),
      S('leap', 'Leap', 0, [2, 3], 0, 'enemy', 'phys', 1.2, { dash: true, anim: 'pounce' })],
  },
  {
    id: 'plague_giant', name: 'Plague Giant', plural: 'Plague Giants', hp: 3.2, atk: 1.6, def: 1.3, spd: 3, move: 3, jump: 1, sight: 5,
    color: 0x7a8a5a, scale: 2,
    blurb: 'A hill that got up and walked. It is still deciding where to put its feet.',
    skills: [S('quake', 'Ground Slam', 0, [1, 2], 1, 'enemy', 'phys', 1, { st: ['stun', 1, 0.35], anim: 'slam' }),
      S('crush', 'Crush', 0, [1, 1], 0, 'enemy', 'phys', 1.4)],
  },
  {
    id: 'bone_golem', name: 'Bone Golem', plural: 'Bone Golems', hp: 4.5, atk: 1.6, def: 1.6, spd: 4, move: 3, jump: 1, sight: 5, boss: true,
    color: 0xd8d0b8, scale: 2.27,
    blurb: 'Everyone who was buried in the yard, all at once, wanting out. It keeps the gate.',
    skills: [S('bone_sweep', 'Bone Sweep', 0, [0, 0], 1, 'self', 'phys', 1, { anim: 'sweep' }),
      S('crushing_blow', 'Crushing Blow', 0, [1, 1], 0, 'enemy', 'phys', 1.6, { st: ['stun', 1, 0.4], anim: 'slam' }),
      S('hurl_bones', 'Hurl Bones', 0, [2, 4], 0, 'enemy', 'phys', 0.85)],
  },
];
export const KIND = Object.fromEntries(ZOMBIES.map((z, i) => [z.id, i]));

// Who stands in the woods, by tier (0 by the Hollow, 4 where the pines go black). A pack takes one of its tier's
// kinds for its own and sometimes a neighbour; map.js goes round each list so every kind is out there somewhere.
// The Bone Golem is not in any of them: it keeps the crypt (CRYPT_PACK). Goblins also camp in the woods round the crypt.
export const WOODS = [
  ['shambler', 'goblin', 'possessed'],
  ['goblin', 'gnawer', 'possessed', 'spider', 'goblin', 'shambler', 'possessed'],
  ['lurker', 'harpy', 'plague_knight', 'gnawer', 'spider', 'possessed'],
  ['bonesack', 'necromancer', 'werewolf', 'plague_knight', 'lurker', 'harpy'],
  ['brute', 'plague_giant', 'werewolf', 'necromancer', 'bonesack'],
];
// The crypt's own: its keeper on the dais with its callers, and the goblins who came for the rings.
export const CRYPT_PACK = [['bone_golem', 11], ['necromancer', 10], ['necromancer', 10], ['goblin', 9], ['goblin', 9], ['goblin', 9]];


export function zombieStats(kind, level) {
  const z = ZOMBIES[kind];
  return {
    hp: Math.round((30 + 12 * level) * z.hp), mp: 0,
    atk: Math.round((10 + 3 * level) * z.atk), mag: Math.round((10 + 3 * level) * z.atk),
    def: Math.round((2 + 1.2 * level) * z.def), res: Math.round((1 + 0.9 * level) * z.def),
    spd: z.spd, move: z.move, jump: z.jump, crit: 3,
    xp: Math.round((10 + 6 * level) * (0.6 + z.hp * 0.4)),
  };
}

// Quests. `kill` counts one kind (or 'any'); `recruit` counts heads in the party.
export const QUESTS = [
  { id: 'first', from: 'lisandra', name: 'What Walks in the Pines', kill: 'any', need: 2, gold: 60, xp: 40, reward: 'potion3',
    text: 'Two of the dead are standing in the trees south of the road. Put them back down.',
    done: 'Two down. They stayed down, which is more than I expected of them.' },
  { id: 'six', from: 'lisandra', name: 'Nobody Follows a Prophecy', recruit: 4, gold: 120, xp: 60,
    text: 'Find three people in the Hollow willing to walk into the pines with you.',
    done: 'Four of you. Nobody follows a prophecy. They follow whoever mended their roof.' },
  { id: 'b_shambler', from: 'board', name: 'Bounty: Shamblers', kill: 'shambler', need: 6, gold: 90, xp: 70,
    text: 'SIX SHAMBLERS. They stand in the south pines and they are somebody’s. Do it kindly. — the Watch',
    done: 'Six shamblers put to bed.' },
  { id: 'b_gnawer', from: 'board', name: 'Bounty: Gnawers', kill: 'gnawer', need: 5, gold: 140, xp: 110,
    text: 'FIVE GNAWERS. The fast ones. One took a goat off Hob’s line in daylight. — the Watch',
    done: 'Five gnawers that will not run again.' },
  { id: 'b_lurker', from: 'board', name: 'Bounty: Lurkers', kill: 'lurker', need: 5, gold: 200, xp: 160,
    text: 'FIVE LURKERS. If it is lying down in the needles, it is not resting. Poke it first. — the Watch',
    done: 'Five lurkers found before they found anyone.' },
  { id: 'b_bonesack', from: 'board', name: 'Bounty: Bloated Bonesacks', kill: 'bonesack', need: 4, gold: 280, xp: 220,
    text: 'FOUR BONESACKS. Do NOT burst them near the well road. Sabine is out of salve. — the Watch',
    done: 'Four bonesacks burst somewhere it did not matter.' },
  { id: 'b_brute', from: 'board', name: 'Bounty: Chained Brutes', kill: 'brute', need: 3, gold: 420, xp: 340, reward: 'rare',
    text: 'THREE CHAINED BRUTES. Far out, where the pines go black. Bring friends. Bring all of them. — the Watch',
    done: 'Three brutes, and the chains to prove it.' },
  { id: 'b_goblin', from: 'board', name: 'Bounty: Barrow Goblins', kill: 'goblin', need: 8, gold: 120, xp: 100,
    text: 'EIGHT BARROW GOBLINS. They dig up the dead and sell the rings back to the widows. The widows want them gone more than we do. — the Watch',
    done: 'Eight goblins. The widows have sent round a pie.' },
  { id: 'b_spider', from: 'board', name: 'Bounty: Grave Spiders', kill: 'spider', need: 6, gold: 140, xp: 110,
    text: 'SIX GRAVE SPIDERS. Big as a dog and fond of branches. Look up. Keep looking up. — the Watch',
    done: 'Six spiders. Hob says he’ll believe it when he’s seen the legs.' },
  { id: 'b_possessed', from: 'board', name: 'Bounty: The Possessed', kill: 'possessed', need: 5, gold: 160, xp: 130,
    text: 'FIVE OF THE POSSESSED. They wear faces from the Hollow. If one calls you by name, do not answer it. Answer with something heavy. — the Watch',
    done: 'Five put to rest. Somebody’s aunt, somebody’s boy. Light a candle if you like.' },
  { id: 'b_harpy', from: 'board', name: 'Bounty: Carrion Harpies', kill: 'harpy', need: 4, gold: 240, xp: 190,
    text: 'FOUR CARRION HARPIES. They have had the hens, the washing and Jory’s good hat. Jory would like the hat back. — the Watch',
    done: 'Four harpies down. No sign of the hat.' },
  { id: 'b_plague_knight', from: 'board', name: 'Bounty: Plague Knights', kill: 'plague_knight', need: 4, gold: 320, xp: 260,
    text: 'FOUR PLAGUE KNIGHTS. Rusted shut and still marching. Go for the joints. Do not keep the armour. — the Watch',
    done: 'Four knights unmade. Nobody kept the armour. Nobody wanted to.' },
  { id: 'b_necromancer', from: 'board', name: 'Bounty: Grave Callers', kill: 'necromancer', need: 3, gold: 340, xp: 280,
    text: 'THREE GRAVE CALLERS. Somebody out there is calling the dead up by name, and they are answering. Make the callers stop talking. — the Watch',
    done: 'Three callers quiet. The pines are quieter for it.' },
  { id: 'b_werewolf', from: 'board', name: 'Bounty: Werewolves', kill: 'werewolf', need: 3, gold: 360, xp: 300,
    text: 'THREE WEREWOLVES. If it walks on two legs and then on four, it is yours. Silver optional. Speed is not. — the Watch',
    done: 'Three wolves that were men, or men that were wolves. Either way, done.' },
  { id: 'b_plague_giant', from: 'board', name: 'Bounty: Plague Giants', kill: 'plague_giant', need: 2, gold: 480, xp: 400, reward: 'rare',
    text: 'TWO PLAGUE GIANTS. Out where the ground shakes of a night. We will not be coming with you. We will be very proud of you. — the Watch',
    done: 'Two giants down. The ground has stopped shaking. Mostly.' },
  { id: 'b_bone_golem', from: 'board', name: 'Bounty: The Keeper of the Crypt', kill: 'bone_golem', need: 1, gold: 600, xp: 500, reward: 'rare',
    text: 'THE OLD CRYPT, where the pines are oldest. Something stands on the dais made of everyone they buried there. Bring back a bone. Any bone. — the Watch',
    done: 'The crypt’s keeper is down in pieces. We counted them. We stopped counting.' },
  { id: 'b_rimewalker', from: 'board', name: 'Bounty: Rimewalkers', kill: 'rimewalker', need: 5, gold: 520, xp: 420,
    text: 'FIVE RIMEWALKERS. North, where the road goes white. Break them, do not thaw them. — the Watch',
    done: 'Five rimewalkers in pieces, and the pieces staying put.' },
  { id: 'b_driftling', from: 'board', name: 'Bounty: Driftlings', kill: 'driftling', need: 4, gold: 560, xp: 450,
    text: 'FOUR DRIFTLINGS. If the snow has a shape, the shape is not snow. — the Watch',
    done: 'Four driftlings dug out before they dug anyone in.' },
  { id: 'b_husk', from: 'board', name: 'Bounty: Dust Husks', kill: 'husk', need: 6, gold: 540, xp: 430,
    text: 'SIX DUST HUSKS. East, past the last green thing. They are quicker than you. Plan on it. — the Watch',
    done: 'Six husks, and the wind has them now.' },
  { id: 'b_slinger', from: 'board', name: 'Bounty: Rib Slingers', kill: 'slinger', need: 4, gold: 560, xp: 450,
    text: 'FOUR RIB SLINGERS. They will run out of ribs eventually. Do not wait. — the Watch',
    done: 'Four slingers with nothing left to throw.' },
  { id: 'b_drowner', from: 'board', name: 'Bounty: Bog Drowners', kill: 'drowner', need: 5, gold: 540, xp: 430,
    text: 'FIVE BOG DROWNERS. South, where the road gets soft. Keep off the black water. — the Watch',
    done: 'Five drowners put under for good.' },
  { id: 'b_leechmother', from: 'board', name: 'Bounty: Leech Mothers', kill: 'leechmother', need: 3, gold: 600, xp: 480,
    text: 'THREE LEECH MOTHERS. Burn what is left. Then burn that. — the Watch',
    done: 'Three leech mothers, and a smell that will not come out.' },
  { id: 'b_cinder', from: 'board', name: 'Bounty: Cinder Wretches', kill: 'cinder', need: 5, gold: 560, xp: 450,
    text: 'FIVE CINDER WRETCHES. West, in the ash. Do NOT lead them back through the wheat. — the Watch',
    done: 'Five cinders out. Properly out.' },
  { id: 'b_slagback', from: 'board', name: 'Bounty: Slagbacks', kill: 'slagback', need: 3, gold: 640, xp: 520,
    text: 'THREE SLAGBACKS. Slow. That is the only kind thing to be said of them. — the Watch',
    done: 'Three slagbacks cooled.' },
  { id: 'b_warden', from: 'board', name: 'Writ: The Frozen Warden', kill: 'warden', need: 1, gold: 1200, xp: 900, reward: 'rare',
    text: 'THE WARDEN OF THE BORDER FORT. It was one of ours. Relieve it of its post. — the Watch',
    done: 'The Warden is relieved. Somebody should have done it years ago.' },
  { id: 'b_dryking', from: 'board', name: 'Writ: The Dry King', kill: 'dryking', need: 1, gold: 1200, xp: 900, reward: 'rare',
    text: 'THE DRY KING, holding court in the Badlands. No tribute. No audience. Just end it. — the Watch',
    done: 'The Dry King is deposed. The court did not object.' },
  { id: 'b_abbess', from: 'board', name: 'Writ: The Drowned Abbess', kill: 'abbess', need: 1, gold: 1200, xp: 900, reward: 'rare',
    text: 'THE ABBESS OF THE SWAMP ABBEY. She still rings for evensong. Nobody living should answer. — the Watch',
    done: 'The Abbess has sung her last office.' },
  { id: 'b_stoker', from: 'board', name: 'Writ: The Stoker', kill: 'stoker', need: 1, gold: 1200, xp: 900, reward: 'rare',
    text: 'THE STOKER AT CINDER HALT. No train has stopped there in forty years. He does not know. — the Watch',
    done: 'The Stoker has banked his last fire.' },
];
