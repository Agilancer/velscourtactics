// What the player decides while auto-play does the walking and the fighting: how each hero fights (a stance, read by
// Battle.plan), what the party is about on the road (marching orders, read by Auto.goals), what the gold is for, and
// the boons a lord's fall leaves behind. All of it is data here; the Orders screen (ui/journal.js) sets it.
import { REGIONS } from '../world/map.js';

// A hero's stance: weights on Battle.plan's scores.
//   dmg: on harm done · kill: on a finishing blow · heal: on mending · safe: how much a tile in the dead's reach is
//   shunned · ward: how much standing by the worst hurt friend is worth · thrift: how dearly mana is held
export const STANCES = {
  steady: { name: 'Steady', icon: 'role_dps', dmg: 1, kill: 1, heal: 1, safe: 0.6, ward: 0, thrift: 1,
    desc: 'Takes the best blow on offer and minds the odds.' },
  reckless: { name: 'Reckless', icon: 'school_fire', dmg: 1.3, kill: 1.6, heal: 0.6, safe: 0, ward: 0, thrift: 0.4,
    desc: 'Goes for the kill and does not count who is standing next to it.' },
  guarded: { name: 'Guarded', icon: 'guard', dmg: 0.9, kill: 1, heal: 1.2, safe: 2.2, ward: 0, thrift: 1,
    desc: 'Keeps out of reach where it can, strikes from where it is safe.' },
  shield: { name: 'Shield', icon: 'role_tank', dmg: 0.9, kill: 1, heal: 1.5, safe: 0.3, ward: 3, thrift: 1,
    desc: 'Stands by whoever is worst hurt and goes for whatever is hurting them.' },
  sparing: { name: 'Sparing', icon: 'school_utility', dmg: 1, kill: 1, heal: 1, safe: 0.8, ward: 0, thrift: 7,
    desc: 'Plain blows, and the mana kept for a lord, a crowd or a bad turn.' },
};
export const stanceOf = (h) => STANCES[h?.stance] ? h.stance : 'steady';

// The errands auto-play knows, in the order it takes them up unless told otherwise.
export const ERRANDS = {
  rest: { name: 'Rest when hurt', desc: 'Back to The Last Toll when the party is under the line below.' },
  board: { name: 'Read the bounty board', desc: 'Take what is posted, claim what is done.' },
  recruit: { name: 'Fill the line', desc: 'Ask whoever will walk with you, till there are six.' },
  shop: { name: 'Spend the gold', desc: 'Whatever the purse is for (below), when there is enough of it.' },
  rival: { name: 'Settle a score', desc: 'Go back for whichever of the dead put you down, once you are a match for it.' },
  chests: { name: 'Go for chests', desc: 'The knolls’ and the ruins’, when what guards them is a fair fight.' },
  hunt: { name: 'Hunt the dead', desc: 'Bounties first, then whatever is nearest.' },
};
export const ERRAND_ORDER = ['rest', 'board', 'recruit', 'shop', 'rival', 'chests', 'hunt'];

// Where the hunt goes.
export const DESTS = [
  { id: 'fair', name: 'Wherever is fair', desc: 'The nearest fight the party can win.' },
  { id: 'pines', name: 'The Pines', desc: 'Keep the pines thin. Slow, safe, steady.' },
  ...REGIONS.slice(1).map((R) => ({ id: R.id, name: R.name, desc: R.sub + '.' })),
  { id: 'lords', name: 'The lords', desc: 'Straight for whichever lord is nearest the party’s level.' },
];
// What the purse is for.
export const PURSES = [
  { id: 'kit', name: 'Better kit', desc: 'Buys whatever in the shops is plainly better than what somebody is wearing.' },
  { id: 'forge', name: 'The forge', desc: 'Has the weapons hammered: a + at a time, the leader’s first.' },
  { id: 'draughts', name: 'Draughts', desc: 'Keeps three red and two blue in the bag. Nothing else.' },
  { id: 'save', name: 'Save it', desc: 'Spends nothing. A bed is still four copper.' },
];
// How far above the party's level a fight may be before auto-play walks round it.
export const NERVES = [{ id: 0, name: 'Careful', desc: 'Nothing above the party’s level.' }, { id: 2, name: 'Fair', desc: 'Up to two levels above.' }, { id: 4, name: 'Bold', desc: 'Up to four. It will lose some.' }];
export const RETREATS = [{ id: 0.3, name: 'On their knees', desc: 'Rests under a third of their life.' }, { id: 0.5, name: 'Half spent', desc: 'Rests under half.' }, { id: 0.7, name: 'Scratched', desc: 'Rests under seven tenths. Slow, and nobody dies.' }];

export function ordersOf(st) {
  const o = (st.orders ||= {});
  const known = (o.prio || []).filter((k) => ERRANDS[k]);
  o.prio = [...known, ...ERRAND_ORDER.filter((k) => !known.includes(k))];
  if (!DESTS.some((d) => d.id === o.dest)) o.dest = 'fair';
  if (!PURSES.some((d) => d.id === o.purse)) o.purse = 'kit';
  if (!NERVES.some((d) => d.id === o.nerve)) o.nerve = 2;
  if (!RETREATS.some((d) => d.id === o.retreat)) o.retreat = 0.5;
  return o;
}

// ---- boons: what a lord's fall (or the crypt's keeper's) leaves the party. Three are offered; one is kept. ----
// `add` goes onto every hero's numbers (heroStats, through setBoons): hpPct/atkPct/magPct are percent, the rest flat.
export const BOONS = [
  { id: 'hale', name: 'Hale', desc: 'Everyone has a tenth more life.', add: { hpPct: 10 } },
  { id: 'keen', name: 'Keen', desc: 'A tenth more Attack and Magic.', add: { atkPct: 10, magPct: 10 } },
  { id: 'fleet', name: 'Fleet', desc: 'Two more Speed: turns come round sooner.', add: { spd: 2 } },
  { id: 'lucky', name: 'Lucky', desc: 'Eight more Crit, for everyone.', add: { crit: 8 } },
  { id: 'thick', name: 'Thick-skinned', desc: 'Four more Armor and Ward.', add: { def: 4, res: 4 } },
  { id: 'deep', name: 'Deep wells', desc: 'A fifth more mana.', add: { mpPct: 20 } },
  { id: 'thirst', name: 'Red thirst', desc: 'Every blow gives back a twentieth of what it takes.', add: { leech: 5 } },
  { id: 'purse', name: 'A lord’s purse', desc: 'Six hundred gold, now.', gold: 600 },
  { id: 'cellar', name: 'A lord’s cellar', desc: 'Four red draughts, three blue and two bell tonics.', consum: { potion: 4, ether: 3, tonic: 2 } },
];
export const boonById = (id) => BOONS.find((b) => b.id === id);
/** Three to choose from: ones not yet held first (the one-offs may come round again). */
export function offerBoons(st, r = Math.random) {
  const held = new Set(st.boons || []);
  const pool = BOONS.filter((b) => !b.add || !held.has(b.id)).map((b) => [r(), b]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return pool.slice(0, 3);
}
export function boonSum(st) {
  const sum = {};
  for (const id of st.boons || []) { const b = boonById(id); if (b?.add) for (const k in b.add) sum[k] = (sum[k] || 0) + b.add[k]; }
  return sum;
}

// ---- the kinds a fight can be (game/encounter.js makes each of them happen): the plate's title and what it asks ----
export const GOALS = {
  rout: { title: '', text: '' },
  ambush: { title: 'Ambush', text: 'They saw you first.' },
  courier: { title: 'Stop the runner', text: 'It has the pack’s takings. Put it down before it reaches the trees.' },
  rescue: { title: 'Get them home', text: 'Somebody from the Hollow is in the middle of this. Keep them breathing.' },
  holdout: { title: 'Hold the ground', text: 'More are coming. Outlast them.' },
  gate: { title: 'The dead at the gate', text: 'They have come to the Hollow. Not one gets past.' },
};

