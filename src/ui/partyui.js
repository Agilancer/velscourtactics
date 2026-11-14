// The Party screen: everyone along the top, and for whoever is picked a paper doll (the hero's own body turning in
// the middle, what they wear in the slots either side), their numbers, and the bag as a grid of squares. Tap a thing in
// the bag and the slots it could go in light up; tap one (or Equip) and it's worn. What's new since the player last
// looked wears a red dot; what would be better than what's on wears a green arrow.
import * as THREE from 'three';
import { el, esc } from '../core/util.js';
import { CLASSES, SPELLS } from '../data/classes.js';
import { RARITY, TIERS, CONSUMABLES, STAT_NAMES, gemInfo, itemName, itemStats, itemLines, sellValue } from '../data/items.js';
import { PARTY_MAX, SLOTS, SLOT_NAMES, heroStats, canEquip, slotsFor, xpNeed, partyHeroes, itemWorth, upgradeSlot } from '../game/party.js';
import { STANCES, stanceOf } from '../game/doctrine.js';
import { fresh, itemIsNew, heroIsNew, newSkills, skillsOpen } from '../game/chronicle.js';
import { animate, sleep } from '../gfx/models.js';
import { heroModel } from '../game/explore.js';
import { sfx } from '../core/audio.js';
import { itemPic, slotPic, gemPic, consumablePic, skillPic, roleIcons, ic } from './art.js';

const STAT_ROWS = [['hp', 'Life'], ['mp', 'Mana'], ['atk', 'Attack'], ['mag', 'Magic'], ['def', 'Armor'], ['res', 'Ward'], ['spd', 'Speed'], ['crit', 'Crit'], ['move', 'Move'], ['jump', 'Jump']];
const DOLL_L = ['helm', 'weapon', 'ring1'], DOLL_R = ['amulet', 'armor', 'ring2'];
const first = (h) => h.name.split(' ')[0];
const dot = (n) => (n ? `<i class="dot">${n > 1 ? n : ''}</i>` : '');

/** The hero's own body on a little turntable: drag it round. One GL context, kept while the screen is open. */
export class Doll {
  constructor(canvas) {
    this.canvas = canvas; this.alive = true; this.model = null; this.sig = '';
    try { this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { this.gl = null; }
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    this.scene.add(new THREE.HemisphereLight(0xb8c4e8, 0x2a2018, 2.5));
    const sun = new THREE.DirectionalLight(0xffe0b0, 2.8); sun.position.set(3, 5, 4); this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8090ff, 1.2); rim.position.set(-4, 3, -3); this.scene.add(rim);
    this.spin = 0.5; this.vel = 0.006;
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); this.vel = 0; });
    canvas.addEventListener('pointermove', (e) => { if (drag == null) return; this.spin += (e.clientX - drag) * 0.012; drag = e.clientX; });
    const up = () => { drag = null; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    const loop = () => { if (!this.alive) return; this.frame(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  set(h) {
    const sig = `${h.id}|${h.equip?.weapon?.uid}|${h.equip?.armor?.uid}|${h.equip?.helm?.uid}`;
    if (sig === this.sig || !this.gl) return;
    this.sig = sig;
    if (this.model) { sleep(this.model); this.scene.remove(this.model); }
    this.model = heroModel(h);
    this.scene.add(this.model);
  }
  frame() {
    if (!this.gl) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    if (this.w !== w || this.h !== h) { this.w = w; this.h = h; this.gl.setPixelRatio(Math.min(2, devicePixelRatio || 1)); this.gl.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
    if (this.model) {
      const tall = this.model.userData.height || 1.7;
      this.cam.position.set(0, tall * 0.58, tall * 2.5 + 1.1 / Math.max(0.55, this.cam.aspect)); this.cam.lookAt(0, tall * 0.5, 0);
      this.spin += this.vel; this.model.rotation.y = this.spin;
      animate(this.model, 1 / 60);
    }
    this.gl.render(this.scene, this.cam);
  }
  dispose() {
    this.alive = false;
    if (this.model) { sleep(this.model); this.scene.remove(this.model); }
    if (this.gl) { this.gl.dispose(); this.gl.forceContextLoss(); }
  }
}

// what wearing `it` in `slot` would change, stat by stat
function deltas(h, it, slot) {
  const was = heroStats(h), old = h.equip[slot];
  h.equip[slot] = it; const now = heroStats(h); h.equip[slot] = old;
  const d = {}; for (const [k] of STAT_ROWS) if ((now[k] || 0) !== (was[k] || 0)) d[k] = (now[k] || 0) - (was[k] || 0);
  return d;
}

export function drawParty(ui, b) {
  const g = ui.g, st = g.st, P = (ui.pp ||= { sub: 'gear', filter: 'all', pick: null });
  if (!st.heroes[ui.sel]) ui.sel = st.party[0];
  const h = st.heroes[ui.sel], C = CLASSES[h.cls], s = heroStats(h), f = fresh(st);
  const inParty = st.party.includes(h.id);
  b.className = 'body party2';

  // ---- everyone, along the top: the line first, then whoever is waiting at the inn ----
  const rail = el('div', 'herorail');
  const chip = (id, i) => {
    const o = st.heroes[id], OC = CLASSES[o.cls], os = heroStats(o);
    const up = st.party.includes(id) && st.bag.some((it) => upgradeSlot(o, it));
    const c = el('button', 'hchip' + (id === ui.sel ? ' on' : '') + (i < 0 ? ' res' : '') + (o.hp <= 0 ? ' down' : ''),
      `<span class="medal" style="--c:${OC.color}">${roleIcons(OC)}</span><span class="hn"><b>${esc(first(o))}</b><small>Lv ${o.lvl} ${esc(OC.name)}</small><i class="hpbar"><u style="width:${100 * Math.max(0, o.hp) / os.hp}%"></u></i></span>${up ? '<i class="upmark" title="Something in the bag is better"></i>' : ''}${dot(heroIsNew(st, o) ? 1 : 0)}`);
    c.onclick = () => { sfx.ui(); ui.sel = id; P.pick = null; delete f.heroes[id]; ui.draw(); };
    return c;
  };
  st.party.forEach((id, i) => rail.append(chip(id, i)));
  if (st.reserve.length) {
    rail.append(el('span', 'raildiv', 'At the inn'));
    [...st.reserve].sort((a, c) => st.heroes[c].lvl - st.heroes[a].lvl).forEach((id) => rail.append(chip(id, -1)));
  }
  b.append(rail);
  // (kept where it was from draw to draw, and brought round to whoever is picked if they're out of sight)
  queueMicrotask(() => { rail.scrollLeft = ui.railX || 0; const on = rail.querySelector('.on'); if (on && (on.offsetLeft < rail.scrollLeft || on.offsetLeft + on.offsetWidth > rail.scrollLeft + rail.clientWidth)) rail.scrollLeft = on.offsetLeft - 20; rail.onscroll = () => { ui.railX = rail.scrollLeft; }; });

  // ---- the paper doll ----
  const pick = P.pick && P.pick.kind === 'bag' ? st.bag.find((x) => x.uid === P.pick.uid) : null;
  const pickSlots = pick && canEquip(h, pick) ? slotsFor(pick) : [];
  const left = el('div', 'dollcol');
  const head = el('div', 'dollhead', `<div><h3 style="color:${C.color}">${esc(h.name)}</h3><p>Level ${h.lvl} ${esc(C.name)} · ${esc(C.role)}</p>
    <i class="xpbar" title="${h.xp}/${xpNeed(h.lvl)} experience"><u style="width:${Math.min(100, 100 * h.xp / xpNeed(h.lvl))}%"></u></i></div><span class="roles">${roleIcons(C, true)}</span>`);
  left.append(head);
  const doll = el('div', 'doll');
  const col = (slots) => {
    const c = el('div', 'dslots');
    for (const slot of slots) {
      const it = h.equip[slot], lit = pickSlots.includes(slot), on = P.pick?.kind === 'worn' && P.pick.slot === slot;
      const x = el('button', 'dslot' + (lit ? ' lit' : '') + (on ? ' on' : '') + (it ? '' : ' empty'), `${it ? itemPic(it, slot) : slotPic(slot)}<small>${SLOT_NAMES[slot]}</small>${it?.plus ? `<em>+${it.plus}</em>` : ''}${it && it.sockets ? `<span class="gems">${Array.from({ length: it.sockets }, (_, i) => `<i class="${it.gems[i] ? 'full' : ''}" style="${it.gems[i] ? `background:${gemInfo(it.gems[i]).color}` : ''}"></i>`).join('')}</span>` : ''}`);
      x.onclick = () => {
        if (lit) return wear(ui, h, pick, slot);
        sfx.ui(); P.pick = it && !on ? { kind: 'worn', slot } : null; ui.draw();
      };
      c.append(x);
    }
    return c;
  };
  const stage = el('div', 'dstage', '<canvas></canvas>');
  doll.append(col(DOLL_L), stage, col(DOLL_R));
  left.append(doll);
  // (the canvas is kept from draw to draw, so the turntable doesn't start again each time something is tapped)
  if (!ui.doll || !ui.doll.alive) { ui.dollCanvas = stage.querySelector('canvas'); ui.doll = new Doll(ui.dollCanvas); } else stage.replaceChild(ui.dollCanvas, stage.firstChild);
  ui.doll.set(h);

  // the numbers, with what the picked thing would change
  const dl = pick && pickSlots.length ? deltas(h, pick, pickSlots.reduce((a, c) => (itemWorth(h, h.equip[a]) <= itemWorth(h, h.equip[c]) ? a : c))) : {};
  const stats = el('div', 'dstats');
  for (const [k, name] of STAT_ROWS) {
    const v = k === 'hp' ? `${Math.max(0, h.hp)}<small>/${s.hp}</small>` : k === 'mp' ? `${h.mp}<small>/${s.mp}</small>` : k === 'crit' ? s.crit + '%' : s[k];
    const d = dl[k];
    stats.append(el('div', 'dstat' + (d ? (d > 0 ? ' up' : ' dn') : ''), `<span>${k === 'mp' && C.resource === 'rage' ? 'Rage' : name}</span><b>${v}</b>${d ? `<em>${d > 0 ? '+' : ''}${d}</em>` : ''}`));
  }
  left.append(stats);

  // ---- the right-hand side: gear, skills, stance, the line ----
  const right = el('div', 'bagcol');
  const seg = el('div', 'seg subtabs');
  const nBag = st.bag.filter((it) => f.items[it.uid]).length;
  for (const [id, name, n] of [['gear', 'Bag', nBag], ['skills', 'Skills', newSkills(h)], ['stance', 'Stance', 0], ['line', 'The line', 0]]) {
    const x = el('button', P.sub === id ? 'on' : '', name + dot(n));
    x.onclick = () => { sfx.ui(); P.sub = id; P.pick = null; ui.draw(); };
    seg.append(x);
  }
  right.append(seg);
  if (P.sub === 'gear') gearTab(ui, right, h, pick);
  else if (P.sub === 'skills') skillsTab(ui, right, h);
  else if (P.sub === 'stance') stanceTab(ui, right, h);
  else lineTab(ui, right);
  b.append(left, right);
  if (!inParty && P.sub !== 'line') right.prepend(el('div', 'note', `${esc(first(h))} is waiting at The Last Toll. “The line” brings them along.`));
}

function wear(ui, h, it, slot) {
  const st = ui.g.st, old = h.equip[slot];
  st.bag.splice(st.bag.indexOf(it), 1);
  if (old) st.bag.push(old);
  h.equip[slot] = it; delete fresh(st).items[it.uid];
  ui.g.fixHp(h); sfx.equip(it);
  ui.pp.pick = { kind: 'worn', slot };
  ui.draw();
}

function gearTab(ui, right, h, pick) {
  const st = ui.g.st, P = ui.pp, f = fresh(st);
  const chips = el('div', 'chips');
  for (const [id, name] of [['all', 'All'], ['fits', `Fits ${first(h)}`], ['new', 'New']]) {
    const x = el('button', 'chip' + (P.filter === id ? ' on' : ''), esc(name));
    x.onclick = () => { sfx.ui(); P.filter = id; ui.draw(); };
    chips.append(x);
  }
  chips.append(el('span', 'count', `${st.bag.length}/${st.bagSize}`));
  right.append(chips);
  const order = { weapon: 0, armor: 1, helm: 2, ring: 3, amulet: 4 };
  const items = st.bag.filter((it) => (P.filter === 'fits' ? canEquip(h, it) : P.filter === 'new' ? f.items[it.uid] : true))
    .sort((a, c) => order[a.slot] - order[c.slot] || c.tier - a.tier || c.rarity - a.rarity);
  const grid = el('div', 'baggrid');
  for (const it of items) {
    const fits = canEquip(h, it), up = fits && upgradeSlot(h, it), on = pick === it;
    const c = el('button', 'cell' + (on ? ' on' : '') + (fits ? '' : ' unfit'), `${itemPic(it)}${up ? '<i class="upmark"></i>' : ''}${itemIsNew(st, it) ? '<i class="dot"></i>' : ''}${it.plus ? `<em>+${it.plus}</em>` : ''}`);
    c.title = itemName(it);
    c.onclick = () => { sfx.ui(); delete f.items[it.uid]; P.pick = on ? null : { kind: 'bag', uid: it.uid }; ui.draw(); };
    c.ondblclick = () => { const slot = fits && (upgradeSlot(h, it) || slotsFor(it)[0]); if (slot) wear(ui, h, it, slot); };
    grid.append(c);
  }
  const blanks = P.filter === 'all' ? st.bagSize - st.bag.length : Math.max(0, 6 - items.length);
  for (let i = 0; i < blanks; i++) grid.append(el('span', 'cell blank'));
  right.append(grid);
  if (!st.bag.length) right.append(el('div', 'note', 'Empty. The dead carry things, now and then.'));

  // the satchel: draughts and gems, each a square with how many
  const sat = el('div', 'baggrid satchel');
  for (const k in CONSUMABLES) {
    const n = st.consum[k] || 0, on = P.pick?.kind === 'consum' && P.pick.k === k;
    const c = el('button', 'cell' + (on ? ' on' : '') + (n ? '' : ' none'), `${consumablePic(k)}<b class="n">${n}</b>`);
    c.title = CONSUMABLES[k].name;
    c.onclick = () => { sfx.ui(); P.pick = on ? null : { kind: 'consum', k }; ui.draw(); };
    sat.append(c);
  }
  for (const k of Object.keys(st.gems).filter((k) => st.gems[k] > 0)) {
    const on = P.pick?.kind === 'gem' && P.pick.k === k;
    const c = el('button', 'cell' + (on ? ' on' : ''), `${gemPic(k)}<b class="n">${st.gems[k]}</b>`);
    c.title = gemInfo(k).full;
    c.onclick = () => { sfx.ui(); P.pick = on ? null : { kind: 'gem', k }; ui.draw(); };
    sat.append(c);
  }
  right.append(el('h4', '', 'Satchel'), sat);
  const card = itemCard(ui, h);
  if (card) right.append(card);
  else right.append(el('div', 'note hint', 'Tap a thing to see it. Tap a lit slot to wear it.'));
}

// The card for whatever is picked: what it is, what it would change, what can be done with it.
function itemCard(ui, h) {
  const st = ui.g.st, P = ui.pp, p = P.pick;
  if (!p) return null;
  const card = el('div', 'itemcard'), acts = el('div', 'acts');
  const btn = (label, fn, off, cls = '') => { const x = el('button', `btn sm ${cls}` + (off ? ' off' : ''), label); if (!off) x.onclick = () => { fn(); ui.draw?.(); }; acts.append(x); };
  const close = el('button', 'x', '<i class="ic ic-close"></i>'); close.onclick = () => { P.pick = null; ui.draw(); };
  if (p.kind === 'consum') {
    const D = CONSUMABLES[p.k], n = st.consum[p.k] || 0;
    card.innerHTML = `<div class="ichead">${consumablePic(p.k)}<div><b>${D.name}</b><small>You have ${n}</small></div></div><p>${D.desc}</p>`;
    btn('Use', () => ui.g.useOutside(p.k), p.k === 'tonic' || !n);
  } else if (p.kind === 'gem') {
    const G = gemInfo(p.k);
    card.innerHTML = `<div class="ichead">${gemPic(p.k)}<div><b style="color:${G.color}">${esc(G.full)}</b><small>You have ${st.gems[p.k]}</small></div></div><p>+${G.val} ${STAT_NAMES[G.stat]} once set. Pick something worn that has an empty socket, and set it there.</p>`;
  } else {
    const worn = p.kind === 'worn', it = worn ? h.equip[p.slot] : st.bag.find((x) => x.uid === p.uid);
    if (!it) { P.pick = null; return null; }
    const R = RARITY[it.rarity], fits = canEquip(h, it);
    const slot = worn ? p.slot : fits ? (upgradeSlot(h, it) || slotsFor(it).find((sl) => !h.equip[sl]) || slotsFor(it)[0]) : null;
    const d = !worn && slot ? deltas(h, it, slot) : {};
    const dl = Object.keys(d).map((k) => `<span class="${d[k] > 0 ? 'up' : 'dn'}">${d[k] > 0 ? '+' : ''}${d[k]} ${STAT_ROWS.find((r) => r[0] === k)[1]}</span>`).join('');
    const who = worn ? '' : partyHeroes(st).filter((o) => canEquip(o, it)).map(first).join(', ');
    card.innerHTML = `<div class="ichead">${itemPic(it, worn ? p.slot : undefined)}<div><b style="color:${R.color}">${esc(itemName(it))}</b><small>${TIERS[it.tier].name} · ${R.name}${worn ? ' · worn' : ''}</small></div></div>
      <ul class="iclines">${itemLines(it).map((l) => `<li>${l}</li>`).join('')}</ul>
      ${dl ? `<div class="icdelta"><small>On ${esc(first(h))}${h.equip[slot] ? ', instead of the ' + esc(itemName(h.equip[slot])) : ''}</small>${dl}</div>` : !worn && fits && slot ? `<div class="icdelta"><small>No better and no worse than what ${esc(first(h))} has on.</small></div>` : ''}
      ${!worn ? `<small class="fits">${fits ? '' : `<span class="dn">${esc(first(h))} can’t use this.</span> `}${who ? 'Fits ' + esc(who) : 'Fits nobody in the line'} · sells for ${sellValue(it)}</small>` : ''}`;
    if (it.sockets) {
      const sk = el('div', 'socks');
      for (let i = 0; i < it.sockets; i++) {
        const gm = it.gems[i], x = el('button', 'sock' + (gm ? ' full' : ''), gm ? `${gemPic(gm, true)}${esc(gemInfo(gm).full)}` : '<span class="pic round"></span>empty socket');
        if (gm) x.style.color = gemInfo(gm).color;
        else if (worn) x.onclick = () => { ui.socketing = ui.socketing?.it === it ? null : { it, i }; ui.draw(); };
        sk.append(x);
      }
      card.append(sk);
      if (worn && ui.socketing?.it === it) {
        const have = Object.keys(st.gems).filter((k) => st.gems[k] > 0);
        if (!have.length) card.append(el('div', 'note', 'You have no gems. Zafir sells them; the dead sometimes carry them.'));
        const gl = el('div', 'gempick');
        for (const k of have) { const x = el('button', 'sock', `${gemPic(k, true)}+${gemInfo(k).val} ${STAT_NAMES[gemInfo(k).stat]} <small>x${st.gems[k]}</small>`); x.style.color = gemInfo(k).color; x.onclick = () => { it.gems[ui.socketing.i] = k; st.gems[k]--; ui.socketing = null; ui.g.fixHp(h); sfx.forge(true); ui.draw(); }; gl.append(x); }
        card.append(gl);
      }
    }
    if (worn) btn('Take off', () => { if (ui.room()) { st.bag.push(it); h.equip[p.slot] = null; ui.g.fixHp(h); if (p.slot === 'weapon') sfx.sheath(); else sfx.ui(); P.pick = { kind: 'bag', uid: it.uid }; } });
    else {
      btn(slot && h.equip[slot] ? 'Swap in' : 'Wear', () => wear(ui, h, it, slot), !slot, 'go');
      btn('Drop', () => { st.bag.splice(st.bag.indexOf(it), 1); P.pick = null; sfx.ui(); });
    }
  }
  card.prepend(close); card.append(acts);
  return card;
}

function skillsTab(ui, right, h) {
  const C = CLASSES[h.cls], seenN = h.seenSkills ?? 0;
  const ul = el('ul', 'skl');
  C.skills.forEach((k, i) => {
    const open = h.lvl >= k.lvl, isNew = open && i >= seenN;
    ul.append(el('li', (open ? '' : 'locked') + (isNew ? ' new' : ''), `${skillPic(k, open)}<div><b>${esc(k.name)}</b>${isNew ? '<i class="newtag">new</i>' : ''} <small>${open ? k.cost + (C.resource === 'rage' ? ' rage' : ' mp') + ` · reach ${k.r[1]}${k.aoe ? ' · blast ' + k.aoe : ''}` : '<i class="ic ic-locked"></i>opens at level ' + k.lvl}</small><br>${esc(k.desc)}</div>`));
  });
  for (const id of h.spells) ul.append(el('li', '', `${skillPic(SPELLS[id])}<div><b>${esc(SPELLS[id].name)}</b> <small>scroll · ${SPELLS[id].cost} mp</small><br>${esc(SPELLS[id].desc)}</div>`));
  right.append(ul);
  h.seenSkills = skillsOpen(h);         // looked at: the dot goes the next time the screen is drawn
}

function stanceTab(ui, right, h) {
  const cur = stanceOf(h);
  right.append(el('div', 'note', `How ${esc(first(h))} fights when auto-play has the party. (Your own hand in a fight is always your own.)`));
  const list = el('div', 'cards');
  for (const id in STANCES) {
    const S = STANCES[id];
    const c = el('button', 'pickcard' + (cur === id ? ' on' : ''), `<span class="pic round${cur === id ? ' lit' : ''}"><img src="${ic(S.icon)}" alt=""></span><div><b>${S.name}</b><span>${S.desc}</span></div>`);
    c.onclick = () => { sfx.ui(); h.stance = id; ui.draw(); };
    list.append(c);
  }
  right.append(list);
  const all = el('button', 'btn sm', `Everyone fights ${STANCES[cur].name.toLowerCase()}`);
  all.onclick = () => { sfx.ui(); for (const o of Object.values(ui.g.st.heroes)) o.stance = cur; ui.toast(`Everyone: ${STANCES[cur].name}.`); ui.draw(); };
  right.append(all);
}

// Who walks, in what order, and who waits at the inn.
function lineTab(ui, right) {
  const st = ui.g.st;
  right.append(el('h4', '', `Marching order <small>${st.party.length}/${PARTY_MAX}</small>`));
  const row = (id, i) => {
    const o = st.heroes[id], OC = CLASSES[o.cls];
    const r = el('div', 'hrow2' + (ui.sel === id ? ' on' : ''), `<span class="medal" style="--c:${OC.color}">${roleIcons(OC)}</span><div><b style="color:${OC.color}">${i >= 0 ? i + 1 + '. ' : ''}${esc(o.name)}</b><small>Lv ${o.lvl} ${esc(OC.name)}${i === 0 ? ' · leads' : ''} · ${STANCES[stanceOf(o)].name}</small></div>`);
    r.onclick = () => { ui.sel = id; ui.draw(); };
    const a = el('span', 'acts');
    const mk = (t, fn, off, title) => { const x = el('button', 'btn sm' + (off ? ' off' : ''), t); x.title = title; if (!off) x.onclick = (e) => { e.stopPropagation(); sfx.ui(); fn(); ui.g.partyChanged(); ui.draw(); }; a.append(x); };
    if (i >= 0) {
      mk('▲', () => { [st.party[i - 1], st.party[i]] = [st.party[i], st.party[i - 1]]; }, i <= 1, 'Up the line');
      mk('▼', () => { [st.party[i + 1], st.party[i]] = [st.party[i], st.party[i + 1]]; }, i === 0 || i === st.party.length - 1, 'Down the line');
      mk('Rest', () => { st.party.splice(i, 1); st.reserve.push(id); }, i === 0, 'Send to the inn');
    } else mk('Join', () => { st.reserve.splice(st.reserve.indexOf(id), 1); st.party.push(id); }, st.party.length >= PARTY_MAX, 'Bring along');
    r.append(a);
    return r;
  };
  st.party.forEach((id, i) => right.append(row(id, i)));
  if (st.reserve.length) {
    right.append(el('h4', '', `Waiting at The Last Toll <small>${st.reserve.length}</small>`));
    [...st.reserve].sort((a, c) => st.heroes[c].lvl - st.heroes[a].lvl || st.heroes[a].name.localeCompare(st.heroes[c].name)).forEach((id) => right.append(row(id, -1)));
  } else right.append(el('div', 'note', 'Nobody is waiting at the inn. Past six, that is where they wait.'));
}

export { SLOTS };
