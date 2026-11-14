// The chronicle: a ledger of what happened, kept in the save, so somebody who left auto-play running can read what
// they missed. Every line has a kind (for its mark and its colour in the journal) and the day it happened.
// Also the red dots: what has arrived since the player last looked (`st.fresh`), and what counts as new where.
import { CLASSES } from '../data/classes.js';
import { QUESTS } from '../data/enemies.js';

const KEEP = 160;
// kinds: fight · loss · fall · find · quest · join · level · rival · dread · shop · boon · day · lord
export function note(st, kind, text) {
  const c = (st.chron ||= []);
  c.push({ d: st.day, k: kind, t: text });
  st.chronN = (st.chronN || 0) + 1;
  while (c.length > KEEP) c.shift();
}
/** How many lines have been written since the chronicle was last read. */
export const unread = (st) => Math.max(0, Math.min((st.chron || []).length, (st.chronN || 0) - (st.chronSeen || 0)));
export function readAll(st) { st.chronSeen = st.chronN || 0; }

// ---- what's new: st.fresh = { items: {uid: 1}, heroes: {id: 1}, quests: {id: 'new' | 'ready'}, rivals: {id: 1} } ----
export function fresh(st) {
  const f = (st.fresh ||= {});
  f.items ||= {}; f.heroes ||= {}; f.quests ||= {}; f.rivals ||= {};
  return f;
}
export const skillsOpen = (h) => CLASSES[h.cls].skills.filter((s) => h.lvl >= s.lvl).length;
export const newSkills = (h) => Math.max(0, skillsOpen(h) - (h.seenSkills ?? skillsOpen(h)));
export const heroIsNew = (st, h) => !!fresh(st).heroes[h.id] || newSkills(h) > 0;
export const itemIsNew = (st, it) => !!fresh(st).items[it.uid];
/** The dots on the HUD's buttons: how many new things are behind each. */
export function dotCounts(st) {
  const f = fresh(st);
  const bag = st.bag.filter((it) => f.items[it.uid]).length;
  const heroes = Object.values(st.heroes).filter((h) => heroIsNew(st, h)).length;
  const quests = QUESTS.filter((q) => f.quests[q.id] && st.quests[q.id]?.state === 'active').length;
  const rivals = Object.keys(f.rivals).filter((id) => st.rivals?.[id]).length;
  const chron = unread(st);
  return { bag, heroes, party: bag + heroes, quests, rivals, chron, journal: quests + rivals + chron, boon: st.boonDue ? 1 : 0 };
}
