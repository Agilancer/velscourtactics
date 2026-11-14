// The dead in the pines. Five kinds, by how they come at you (bm's shambler, runner and lurker,
// VELSCOUR's Bloated Bonesack and Chained Brute). `kind` in map.js packs is the index here.
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
];

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
];
