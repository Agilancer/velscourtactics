// The other three leaves of the book: the Journal (quests, the chronicle of what happened, the dead who have a score
// with you), the Orders (what auto-play is about: errands, where, how careful, what the gold is for) and the Settings.
import { el, esc } from '../core/util.js';
import { QUESTS, ZOMBIES, KIND } from '../data/enemies.js';
import { DPAD_HINT } from '../core/input.js';
import { questProgress, questNeed, questReady, lead } from '../game/party.js';
import { ERRANDS, DESTS, PURSES, NERVES, RETREATS, ordersOf, boonById } from '../game/doctrine.js';
import { fresh, unread, readAll } from '../game/chronicle.js';
import { sound, sfx, setMuted } from '../core/audio.js';
import { goodsPic, ic } from './art.js';

const gp = (n) => `<i class="ic ic-gold"></i>${n}`;
const dot = (n) => (n ? `<i class="dot">${n > 1 ? n : ''}</i>` : '');
const MARK = { fight: '⚔', loss: '☠', fall: '✝', find: '◆', quest: '✦', join: '☻', level: '▲', rival: '☠', dread: '♜', shop: '●', boon: '★', day: '☾', lord: '♛' };

// How bold the dead have grown, in words.
export function dreadWord(d) { return d >= 85 ? 'At the gate' : d >= 60 ? 'Bold' : d >= 35 ? 'Stirring' : d >= 12 ? 'Restless' : 'Quiet'; }

export function drawJournal(ui, b) {
  const st = ui.g.st, J = (ui.jj ||= { sub: 'quests' }), f = fresh(st);
  b.className = 'body journal';
  const seg = el('div', 'seg subtabs');
  const nQ = QUESTS.filter((q) => f.quests[q.id] && st.quests[q.id]?.state === 'active').length;
  const nR = Object.keys(f.rivals).filter((id) => st.rivals[id]).length;
  for (const [id, name, n] of [['quests', 'Quests', nQ], ['chron', 'Chronicle', unread(st)], ['rivals', 'Scores', nR]]) {
    const x = el('button', J.sub === id ? 'on' : '', name + dot(n));
    x.onclick = () => { sfx.ui(); J.sub = id; ui.draw(); };
    seg.append(x);
  }
  b.append(seg);
  if (J.sub === 'quests') {
    const list = QUESTS.filter((q) => st.quests[q.id]).sort((a, c) => (st.quests[a.id].state === 'done') - (st.quests[c.id].state === 'done') || questReady(st, c) - questReady(st, a));
    if (!list.length) b.append(el('div', 'note', 'Nothing yet. The bounty board in the square is where the Watch posts its wants.'));
    for (const q of list) b.append(questRow(ui, q, false));
    for (const id in f.quests) delete f.quests[id];
  } else if (J.sub === 'chron') {
    const from = (st.chronN || 0) - st.chron.length, seen = st.chronSeen || 0;
    if (!st.chron.length) b.append(el('div', 'note', 'Nothing has happened yet. It will.'));
    const list = el('div', 'chron');
    let day = null, cut = false;
    [...st.chron].reverse().forEach((e, i) => {
      const n = from + st.chron.length - 1 - i;
      if (!cut && n < seen && unread(st)) { list.append(el('div', 'chcut', 'You had read as far as this')); cut = true; }
      if (e.d !== day) { day = e.d; list.append(el('h4', '', `Day ${e.d}`)); }
      list.append(el('div', `chline k-${e.k}${n >= seen ? ' new' : ''}`, `<i>${MARK[e.k] || '·'}</i><span>${esc(e.t)}</span>`));
    });
    b.append(list);
    readAll(st);
  } else {
    b.append(el('div', 'dreadbox', `<div><b>The dead are: ${dreadWord(st.dread)}</b><span>Every day a lord still stands, the dead in the pines grow bolder and come closer to the Hollow. Put a lord down and they think again.</span></div><i class="meter"><u style="width:${Math.min(100, st.dread)}%"></u></i>`));
    const rivals = Object.values(st.rivals);
    if (!rivals.length) b.append(el('div', 'note', 'Nothing out there has a score with you. Lose a fight and something will.'));
    for (const r of rivals) {
      const z = ZOMBIES[KIND[r.kind]];
      const row = ui.row(`<b class="rivalname">${esc(r.name)}</b><small>${esc(z?.name || 'One of the dead')} · level ${r.lvl} · ${gp(r.bounty)} on its head</small><span>Put you down ${r.wins === 1 ? 'once' : r.wins + ' times'}, last on day ${r.day}. ${esc(r.where || '')} Auto-play goes back for it when the party is a match (Orders: “Settle a score”).</span>`, [], goodsPic(ic('quest_busy'), 'mark'));
      if (f.rivals[r.id]) row.classList.add('new');
      b.append(row);
    }
    for (const id in f.rivals) delete f.rivals[id];
    if (st.boons.length) {
      b.append(el('h4', '', 'Boons kept'));
      for (const id of st.boons) { const B = boonById(id); if (B) b.append(ui.row(`<b>${esc(B.name)}</b><span>${esc(B.desc)}</span>`, [], goodsPic(ic('quest'), 'mark'))); }
    }
  }
}

export function questRow(ui, q, board) {
  const st = ui.g.st, s = st.quests[q.id], ready = questReady(st, q), f = fresh(st);
  const state = !s ? 'Posted' : s.state === 'done' ? 'Done' : ready ? 'Ready to claim' : `${questProgress(st, q)}/${questNeed(q)}`;
  const mark = !s ? 'quest_offer' : s.state === 'done' ? 'quest' : ready ? 'quest_ready' : 'quest_busy';
  const btns = [];
  if (board && !s) btns.push(['Take it', () => { ui.g.takeQuest(q); sfx.ui(); }]);
  if (ready && (board || q.from !== 'board')) btns.push(['Claim', () => ui.g.claimQuest(q)]);
  const pct = s && s.state !== 'done' ? Math.round(100 * questProgress(st, q) / questNeed(q)) : 0;
  const r = ui.row(`<b>${esc(q.name)}</b>${f.quests[q.id] && !board ? '<i class="newtag">new</i>' : ''}<small>${state} · ${gp(q.gold)} · ${q.xp} xp${q.reward === 'rare' ? ' · a rare weapon' : ''}</small><span>${esc(s?.state === 'done' ? q.done : q.text)}</span>${s && s.state !== 'done' ? `<i class="qbar${ready ? ' ready' : ''}"><u style="width:${pct}%"></u></i>` : ''}`, btns, goodsPic(ic(mark), 'mark'));
  if (s?.state === 'done') r.classList.add('done');
  if (ready && q.from === 'board' && !board) r.append(el('div', 'note', 'Claim it at the bounty board in the square.'));
  return r;
}

// One choice out of a few: a row of tabs with what the picked one means under it.
function choice(ui, title, list, cur, set) {
  const box = el('div', 'obox'), seg = el('div', 'seg');
  box.append(el('h4', '', title));
  for (const o of list) {
    const x = el('button', o.id === cur ? 'on' : '', esc(o.name));
    x.onclick = () => { sfx.ui(); set(o.id); ui.draw(); };
    seg.append(x);
  }
  box.append(seg, el('p', 'odesc', esc(list.find((o) => o.id === cur)?.desc || '')));
  return box;
}

export function drawOrders(ui, b) {
  const g = ui.g, st = g.st, o = ordersOf(st);
  b.className = 'body orders';
  const top = el('div', 'autobox' + (st.auto ? ' on' : ''), `<div><b>Auto-play is ${st.auto ? 'on' : 'off'}</b><span>${st.auto ? 'The party walks, shops and fights by these orders. Touch the d-pad and it waits for you.' : 'Turn it on and the party sees to itself: these are its orders.'}</span></div>`);
  const tg = el('button', 'btn' + (st.auto ? ' go' : ''), st.auto ? 'Stop' : 'Start');
  tg.onclick = () => { g.toggleAuto(); if (!st.auto) ui.draw(); };
  top.append(tg); b.append(top);

  const cols = el('div', 'ocols'), a = el('div'), c = el('div');
  a.append(el('h4', '', 'Errands, first to last'));
  o.prio.forEach((k, i) => {
    const E = ERRANDS[k], off = o.off?.[k];
    const r = el('div', 'errand' + (off ? ' off2' : ''), `<i class="num">${i + 1}</i><div><b>${E.name}</b><span>${E.desc}</span></div>`);
    const acts = el('span', 'acts');
    const mk = (t, fn, dis, title) => { const x = el('button', 'btn sm' + (dis ? ' off' : ''), t); x.title = title; if (!dis) x.onclick = () => { sfx.ui(); fn(); g.auto.reset(); ui.draw(); }; acts.append(x); };
    mk('▲', () => { [o.prio[i - 1], o.prio[i]] = [o.prio[i], o.prio[i - 1]]; }, i === 0, 'Sooner');
    mk('▼', () => { [o.prio[i + 1], o.prio[i]] = [o.prio[i], o.prio[i + 1]]; }, i === o.prio.length - 1, 'Later');
    mk(off ? 'Off' : 'On', () => { (o.off ||= {})[k] = !off; }, k === 'hunt', off ? 'Not doing this' : 'Doing this');
    r.append(acts); a.append(r);
  });
  c.append(choice(ui, 'Where the hunt goes', DESTS, o.dest, (v) => { o.dest = v; g.auto.reset(); }));
  c.append(choice(ui, 'How bold', NERVES, o.nerve, (v) => { o.nerve = v; g.auto.reset(); }));
  c.append(choice(ui, 'When to turn back', RETREATS, o.retreat, (v) => { o.retreat = v; g.auto.reset(); }));
  c.append(choice(ui, 'What the gold is for', PURSES, o.purse, (v) => { o.purse = v; g.auto.reset(); }));
  c.append(el('div', 'note', `In a fight under auto-play you have one call to make: <b>Call it</b> (focus one of the dead, go all out, or hold the line), and it comes back after a while. How each of yours fights is their Stance, on the Party screen. ${esc(lead(st).name.split(' ')[0])} leads.`));
  cols.append(a, c); b.append(cols);
}

export function drawSettings(ui, b) {
  const g = ui.g, st = g.st, opts = st.opts;
  b.className = 'body settings';
  const row = (name, desc, label, fn, on) => {
    const r = el('div', 'setrow', `<div><b>${name}</b><span>${desc}</span></div>`);
    const x = el('button', 'btn sm' + (on ? ' go' : ''), label);
    x.onclick = () => { fn(); sfx.ui(); ui.refresh(); ui.draw(); };
    r.append(x); return r;
  };
  b.append(row('Sound', 'Music, the world and everything in it.', sound.muted ? 'Off' : 'On', () => setMuted(!sound.muted), !sound.muted));
  b.append(row('Speech bubbles', 'What the party says to itself on the road and in a fight, over their heads.', opts.quiet ? 'Off' : 'On', () => { opts.quiet = !opts.quiet; ui.bubbles.on = !opts.quiet; }, !opts.quiet));
  b.append(row('The camera in a fight', 'Leans in on a killing blow, a crit, a body through a wall. Always under auto-play; your own fights too if you like.', opts.director === 'off' ? 'Never' : opts.director === 'all' ? 'Always' : 'Auto-play', () => { opts.director = opts.director === 'off' ? 'auto' : opts.director === 'all' ? 'off' : 'all'; }, opts.director !== 'off'));
  b.append(row('Fight speed', 'How fast a fight plays out (F).', `${g.fightSpeed}x`, () => g.toggleSpeed(), g.fightSpeed === 2));
  b.append(row('D-pad', `The grid’s four ways are the screen’s four diagonals. ${st.dpad}: ${DPAD_HINT[st.dpad]}.`, `D-pad ${st.dpad}`, () => { st.dpad = st.dpad === 'A' ? 'B' : 'A'; }));
  b.append(el('h4', '', 'Keys'));
  b.append(el('div', 'keys', [['Arrows / WASD', 'Walk'], ['Space', 'Jump'], ['Enter / E', 'Talk, open, confirm'], ['Tab', 'Party'], ['P', 'Auto-play'], ['F', 'Fight speed'], ['C', 'Call it (in a fight under auto-play)'], ['Esc', 'Back']].map(([k, v]) => `<span><kbd>${k}</kbd>${v}</span>`).join('')));
}
