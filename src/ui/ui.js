// Everything drawn in HTML over the 3D view: character creation, the HUD, talk, the book (Party, Journal, Orders,
// Settings) and the shops. The title is title.js's; the fight's own HUD is battle.js's.
//
// The shape of it: the party down the top left (tap one for their sheet), the purse and the quests top right, a row of
// buttons (a rail down the right edge on a phone) that open the book at each of its leaves, and under them a line
// saying what auto-play is about. Words are said in bubbles over heads (speech.js) and kept in the chat log
// (chatlog.js); anything new since the player last looked wears a red dot (game/chronicle.js).
import * as THREE from 'three';
import { el, esc, $ } from '../core/util.js';
import { CLASSES, CLASS_IDS, SPELLS } from '../data/classes.js';
import { RARITY, TIERS, WEAPONS, ARMORS, GEMS, GEM_GRADES, GEM_PRICE, CONSUMABLES, STAT_NAMES, gemInfo, makeItem, addAffix, itemName, itemLines, itemValue, sellValue, enhanceCost, enchantCost, socketCost, maxSockets, tierForLevel } from '../data/items.js';
import { QUESTS } from '../data/enemies.js';
import { SLOTS, heroStats, canEquip, lead, partyHeroes, questProgress, questNeed, questReady, save, upgradeSlot } from '../game/party.js';
import { dotCounts, heroIsNew } from '../game/chronicle.js';
import { animate, sleep } from '../gfx/models.js';
import { heroModel } from '../game/explore.js';
import { sound, sfx } from '../core/audio.js';
import { itemPic, gemPic, consumablePic, goodsPic, skillPic, roleIcons, rolesOf, ROLE_NAMES, ic, goods, watchMissing } from './art.js';
import { Bubbles } from './speech.js';
import { ChatLog } from './chatlog.js';
import { drawParty } from './partyui.js';
import { drawJournal, drawOrders, drawSettings, questRow, dreadWord } from './journal.js';

const itemHtml = (it, extra = '') => `<b style="color:${RARITY[it.rarity].color}">${esc(itemName(it))}</b><small>${TIERS[it.tier].name} ${RARITY[it.rarity].name}${extra}</small><span>${itemLines(it).join(' · ')}</span>`;
// a sum of gold, with the coins in front of it
const gp = (n) => `<i class="ic ic-gold"></i>${n}`;
const dot = (n) => (n ? `<i class="dot">${n > 1 ? (n > 9 ? '9+' : n) : ''}</i>` : '');
// the buttons the kit has no picture for, drawn in its gilt
const SVG = {
  orders: '<svg viewBox="0 0 24 24"><path d="M5 21V3m0 1h11l-2.5 4L16 12H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>',
};
const LEAVES = [['party', 'Party'], ['journal', 'Journal'], ['orders', 'Orders'], ['settings', 'Settings']];
const leafIcon = (id) => (id === 'party' ? `<i class="ni" style="background-image:url(${ic('guard')})"></i>` : id === 'journal' ? `<i class="ni" style="background-image:url(${ic('journal')})"></i>` : `<i class="ni svg">${SVG[id === 'orders' ? 'orders' : 'gear']}</i>`);

export class UI {
  constructor(g) {
    this.g = g;
    this.root = $('#ui');
    this.root.innerHTML = `
      <div id="hud" class="hide">
        <div id="roster"></div>
        <div id="status"><div id="purse"><span id="day" title="The day"></span><button id="dread" title="How bold the dead have grown"></button><span id="gold" title="Gold"></span></div><div id="tracker"></div></div>
        <nav id="nav">
          ${LEAVES.slice(0, 3).map(([id, name]) => `<button data-open="${id}" title="${name}">${leafIcon(id)}<span>${name}</span><b class="dotbox"></b></button>`).join('')}
          <button id="b-auto" title="Auto-play (P)"><i class="ni svg"></i><span>Auto</span></button>
          <button id="b-pace" title="Fight speed (F)"><i class="ni txt"></i><span>Speed</span></button>
          <button data-open="settings" title="Settings">${leafIcon('settings')}<span>Settings</span></button>
        </nav>
        <button id="autobar" class="hide" title="What auto-play is about. Tap for its orders."></button>
        <div id="prompt" class="hide"></div>
        <div id="pad">
          <button data-dir="up" class="pu">▲</button><button data-dir="left" class="pl">◀</button>
          <button data-dir="right" class="pr">▶</button><button data-dir="down" class="pd">▼</button>
        </div>
        <div id="btns"><button data-btn="act" class="ba">A<small>act</small></button><button data-btn="jump" class="bj">B<small>jump</small></button></div>
      </div>
      <div id="banner"></div><div id="toasts"></div>
      <div id="reply" class="hide"></div>
      <div id="choose" class="hide"></div>
      <div id="modal" class="hide"><div class="panel book"><header><div class="leaves"></div><h2></h2><button class="x" title="Close (Esc)"><i class="ic ic-close"></i></button></header><div class="body"></div></div></div>
      <div id="screen" class="hide"></div>`;
    watchMissing(this.root);
    g.input.bindPad(this.root);
    for (const b of this.root.querySelectorAll('#nav [data-open]')) b.onclick = () => this.openPanel(b.dataset.open);
    $('#b-auto').onclick = () => g.toggleAuto();
    $('#b-pace').onclick = () => g.toggleSpeed();
    $('#autobar').onclick = () => this.openPanel('orders');
    $('#dread').onclick = () => { this.jj = { sub: 'rivals' }; this.openPanel('journal'); };
    $('#tracker').onclick = () => { this.jj = { sub: 'quests' }; this.openPanel('journal'); };
    $('#roster').onclick = (e) => { const c = e.target.closest('[data-hero]'); if (c && g.mode === 'explore') { this.sel = c.dataset.hero; this.openPanel('party'); } };
    $('#modal .x').onclick = () => this.close();
    $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.close(); });
    // a tap on the world goes on to the next line of a conversation
    $('#view').addEventListener('pointerdown', () => { if (g.mode === 'talk') this.onTap?.(); });
    // the chat log (bm's), and over it the speech bubbles (bm's): the log first, so a bubble can keep clear of it
    this.chat = new ChatLog(this.root, { onOpen: () => { this.jj = { sub: 'chron' }; this.openPanel('journal'); } });
    this.bubbles = new Bubbles(this.root, {
      project: (x, y, z) => g.r.project(x, y, z),
      ppu: () => window.innerHeight / (g.r.cam.top - g.r.cam.bottom),
      bars: () => [this.narrow() ? 46 : 56, g.mode === 'talk' ? 86 : 10],
      avoid: () => [this.chat.box()].filter(Boolean),
    });
    this.sel = null; this.leaf = 'party';
  }
  narrow() { return window.matchMedia('(max-width: 760px), (max-height: 520px)').matches; }

  // ---------- character creation (the title is title.js's) ----------
  create() {
    const s = $('#screen'); s.className = 'create';
    const pickd = { cls: 'paladin', g: 'm' };
    s.innerHTML = `<div class="panel wide"><header><h2>Who came down the road?</h2></header><div class="body cr">
      <div class="cr-l"><label>Name <input id="c-name" maxlength="16" value="Jamie" autocomplete="off"></label>
        <div class="seg" id="c-g"><button data-g="m" class="on">Male</button><button data-g="f">Female</button></div>
        <div id="c-classes"></div></div>
      <div class="cr-m"><canvas id="c-prev" width="300" height="380"></canvas></div>
      <div class="cr-r"><div id="c-info"></div><button class="btn big" id="c-go">Walk down to the Hollow</button></div></div></div>`;
    const grid = $('#c-classes');
    for (const id of CLASS_IDS) { const b = el('button', 'cls', `<span>${esc(CLASSES[id].name)}</span><span class="roles">${roleIcons(CLASSES[id])}</span>`); b.style.setProperty('--c', CLASSES[id].color); b.dataset.cls = id; b.onclick = () => { pickd.cls = id; draw(); }; grid.append(b); }
    for (const b of s.querySelectorAll('#c-g button')) b.onclick = () => { pickd.g = b.dataset.g; draw(); };
    // a little turntable for whoever is picked: the class's own body, its plainest weapon in hand
    // (a narrow screen has no room for it and hides it: there, nothing is drawn or loaded for it)
    const seen = $('#c-prev').offsetParent !== null;
    const gl = seen ? new THREE.WebGLRenderer({ canvas: $('#c-prev'), antialias: true, alpha: true }) : null;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 300 / 380, 0.1, 50);
    cam.position.set(0, 1.5, 5.2); cam.lookAt(0, 0.85, 0);
    scene.add(new THREE.HemisphereLight(0xaab8e0, 0x2a2018, 2.4)); const sun = new THREE.DirectionalLight(0xffe0b0, 2.6); sun.position.set(3, 5, 4); scene.add(sun);
    let model = null, alive = true;
    const spin = () => { if (!alive || !gl) return; if (model) { model.rotation.y += 0.012; animate(model, 1 / 60); } gl.render(scene, cam); requestAnimationFrame(spin); };
    const draw = () => {
      sfx.ui();
      for (const b of grid.children) b.classList.toggle('on', b.dataset.cls === pickd.cls);
      for (const b of s.querySelectorAll('#c-g button')) b.classList.toggle('on', b.dataset.g === pickd.g);
      const C = CLASSES[pickd.cls];
      if (model) { sleep(model); scene.remove(model); }
      if (gl) model = heroModel({ ...pickd, name: '', equip: { weapon: { kind: C.weapon[0], tier: 0 }, armor: { kind: C.armor, tier: 0 } } });
      if (model) { model.rotation.y = 0.5; scene.add(model); }
      $('#c-info').innerHTML = `<h3 style="color:${C.color}">${esc(C.name)}</h3><p>${esc(C.desc)}</p>
        <div class="rolebox">${roleIcons(C, true)}<p class="role"><b>${rolesOf(C).map((r) => ROLE_NAMES[r]).join(' · ')}</b><br>${esc(C.role)}</p></div>
        <div class="stats"><span>Life ${C.life[0]}</span><span>${C.resource === 'rage' ? 'Rage 100' : 'Mana ' + C.mana[0]}</span><span>Move ${C.move}</span><span>Jump ${C.jump}</span><span>${C.weapon.join(' / ')}</span><span>${C.armor}</span></div>
        <ul class="skl">${C.skills.map((k) => `<li>${skillPic(k, k.lvl <= 1)}<div><b>${esc(k.name)}</b> <small>level ${k.lvl}</small><br>${esc(k.desc)}</div></li>`).join('')}</ul>`;
    };
    draw(); spin();
    $('#c-go').onclick = () => {
      const name = $('#c-name').value.trim() || 'Stranger';
      alive = false;
      if (gl) { sleep(model); scene.remove(model); gl.dispose(); gl.forceContextLoss(); }   // give the context back now, not whenever
      s.className = 'hide'; s.innerHTML = '';
      this.g.newGame({ name, ...pickd });
    };
  }

  // ---------- HUD ----------
  showHud(on) { $('#hud').classList.toggle('hide', !on); if (on) this.bubbles.on = !this.g.st?.opts?.quiet; }
  battleMode(on) { $('#hud').classList.toggle('fight', on); this.bubbles.clear(); }
  refresh() {
    const g = this.g, st = g.st; if (!st) return;
    const roster = partyHeroes(st).map((h, i) => {
      const s = heroStats(h), C = CLASSES[h.cls];
      const up = st.bag.some((it) => upgradeSlot(h, it));
      return `<button class="pm${i === 0 ? ' lead' : ''}${h.hp <= 0 ? ' down' : ''}" data-hero="${h.id}"><span class="medal" style="--c:${C.color}">${roleIcons(C)}</span><span class="pmn"><b style="color:${C.color}">${esc(h.name.split(' ')[0])}</b><small>Lv ${h.lvl} ${esc(C.name)}</small>
        <span class="bars"><i class="hp"><u style="width:${100 * Math.max(0, h.hp) / s.hp}%"></u></i><i class="mp${C.resource === 'rage' ? ' rage' : ''}"><u style="width:${100 * h.mp / s.mp}%"></u></i></span></span>${up ? '<i class="upmark"></i>' : ''}${dot(heroIsNew(st, h) ? 1 : 0)}</button>`;
    }).join('');
    // (refresh runs four times a second: only touch the DOM when something has changed, or a tap can go astray)
    if (roster !== this.rosterHtml) { this.rosterHtml = roster; $('#roster').innerHTML = roster; }
    const purse = `${st.day}|${st.gold}|${dreadWord(st.dread)}`;
    if (purse !== this.purseKey) {
      this.purseKey = purse;
      $('#day').textContent = `Day ${st.day}`;
      $('#gold').innerHTML = `${gp('')}<b>${st.gold}</b>`;
      const d = $('#dread'); d.innerHTML = `<i></i>${dreadWord(st.dread)}`; d.className = 'd' + Math.min(4, Math.floor(st.dread / 25));
    }
    const act = QUESTS.filter((q) => st.quests[q.id]?.state === 'active').sort((a, b) => questReady(st, b) - questReady(st, a)).slice(0, 4);
    const lines = act.map((q) => { const r = questReady(st, q); return `<div class="${r ? 'ready' : ''}"><i class="ic ic-${r ? 'qready' : 'qbusy'}"></i>${esc(q.name)} <b>${questProgress(st, q)}/${questNeed(q)}</b></div>`; }).join('');
    if (lines !== this.lines) { this.lines = lines; $('#tracker').innerHTML = lines; }
    // the red dots: what's new behind each button
    const n = dotCounts(st), dots = { party: n.party, journal: n.journal, orders: n.boon };
    const key = JSON.stringify(dots) + st.auto + g.fightSpeed;
    if (key !== this.navKey) {
      this.navKey = key;
      for (const b of this.root.querySelectorAll('#nav [data-open]')) { const box = b.querySelector('.dotbox'); if (box) box.innerHTML = dot(dots[b.dataset.open] || 0); }
      $('#b-auto').classList.toggle('on', !!st.auto);
      $('#b-auto .ni').innerHTML = st.auto ? SVG.pause : SVG.play;
      $('#b-pace .ni').textContent = `${g.fightSpeed}x`;
      $('#b-pace').classList.toggle('on', g.fightSpeed === 2);
      if (this.isOpen() && this.leafEls) this.drawLeaves();
    }
  }
  setPrompt(text) { const p = $('#prompt'); p.classList.toggle('hide', !text); if (text) p.innerHTML = `<kbd>A</kbd> ${esc(text)}`; }
  // What auto-play is about: the errand, and (smaller) why. In a fight, whose turn it is and what they mean to do.
  setAuto(text, why = '') {
    const p = $('#autobar'), html = text ? `<i>${SVG.play}</i><b>${esc(text)}</b>${why ? `<span>${esc(why)}</span>` : ''}` : '';
    if (html === this.autoHtml) return;
    this.autoHtml = html; p.classList.toggle('hide', !text); p.innerHTML = html;
  }
  // Where somebody's head is, by name: one of the party (walking or in a fight), or someone standing in the world.
  headOf(who) {
    if (!who) return null;
    const g = this.g, key = who.split(' ')[0];
    const at = (m, lift = 0) => () => (m.visible !== false && m.parent ? { x: m.position.x, y: m.position.y + (m.userData.height || 1.6) + lift, z: m.position.z } : null);
    const u = g.battle?.units.find((o) => o.alive && o.name.split(' ')[0] === key);
    if (u) return at(u.model);
    if (g.battle) return null;
    const a = g.explore?.actors.find((o) => o.model.visible && o.hero.name.split(' ')[0] === key);
    if (a) return at(a.model);
    const n = g.explore?.npcs.find((o) => o.name === who || o.name.split(' ')[0] === key);
    return n ? at(n.model, 0.5) : null;
  }
  // Somebody says something: a bubble over their head for a while, and a line in the log.
  speak(who, text, style = {}) {
    const mine = !!this.g.st && Object.values(this.g.st.heroes).some((h) => h.name === who || h.name.split(' ')[0] === who.split(' ')[0]);
    this.chat.line(style.channel || (mine ? 'party' : 'say'), who.split(' ')[0], text, style);
    if (this.isOpen()) return;
    this.bubbles.say(this.headOf(who), text, who.split(' ')[0], style);
  }
  // A notice. With a speaker it's said (speak); without, it goes in the log, and up as a toast if a panel covers the log.
  toast(text, who) {
    if (who) return this.speak(who, text);
    this.chat.system(text);
    if (!this.isOpen() && !this.g.battle && $('#screen').classList.contains('hide')) return;
    const t = el('div', 'toast', esc(text));
    $('#toasts').append(t); setTimeout(() => t.classList.add('out'), 4200); setTimeout(() => t.remove(), 4900);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  }
  banner(title, sub = '', red = false) {
    const b = $('#banner'); b.innerHTML = `<h2 class="${red ? 'red' : ''}">${esc(title)}</h2><p>${esc(sub)}</p>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  // each frame: the bubbles follow their heads, the log's lines fade
  tick(dt) {
    const g = this.g;
    this.chat.update(dt, !!g.st && !this.isOpen() && !g.battle && g.mode !== 'talk' && $('#screen').classList.contains('hide'));
    this.bubbles.update(dt);
  }

  // ---------- talk ----------
  // lines: [[speaker, text], ...]; choices (on the last line): [[label, value], ...]. Resolves with the value chosen.
  // Each line is a bubble over its speaker's head (the story's own voice, with no speaker, sits low in the middle);
  // a tap anywhere goes on, and what can be answered is a row of buttons at the foot.
  dialog(lines, choices) {
    const g = this.g, bar = $('#reply');
    return new Promise((res) => {
      const prev = g.mode; g.mode = 'talk';
      let i = 0, timer = null, spoke = null, held = null;
      const voice = (who) => { if (spoke) g.explore?.speak(spoke, false); spoke = who; if (who && prev === 'explore') g.explore?.speak(who, true); };
      const end = (v) => { voice(null); clearTimeout(timer); this.bubbles.drop(held); bar.classList.add('hide'); this.onAct = this.onTap = null; if (g.mode === 'talk') g.mode = prev === 'talk' ? 'explore' : prev; res(v); };
      const show = () => {
        const [who, raw] = lines[i], last = i === lines.length - 1, text = raw.replace('{name}', g.st?.name || '');
        voice(who);
        const opts = last && choices ? choices : null;
        this.chat.line(who ? 'say' : 'story', who.split(' ')[0], text);
        this.bubbles.drop(held);
        held = this.bubbles.hold(this.headOf(who), text, who, { inside: !who, more: !opts, key: 'talk', onTap: opts ? null : () => next() });
        bar.innerHTML = ''; bar.classList.remove('hide');
        if (opts) opts.forEach(([label, v], k) => { const b = el('button', 'btn' + (k === 0 ? ' go' : ''), esc(label)); b.onclick = () => { sfx.ui(); end(v); }; bar.append(b); });
        else { const b = el('button', 'btn next', `${last ? 'Close' : 'Next'} <kbd>A</kbd>`); b.onclick = () => { sfx.ui(); next(); }; bar.append(b); }
        this.onAct = () => bar.firstChild.click();
        this.onTap = opts ? null : () => { sfx.ui(); next(); };
        clearTimeout(timer);
        if (g.st?.auto) timer = setTimeout(() => bar.firstChild?.click(), 1900 + text.length * 14);
      };
      const next = () => { if (++i >= lines.length) end(null); else show(); };
      show();
    });
  }
  // A fork: a few cards to choose from. Under auto-play it chooses the first for itself when the time is up
  // (`secs`), unless the player has chosen by then. Resolves with the option's value.
  choose(title, sub, options, secs = 12) {
    const g = this.g, box = $('#choose');
    return new Promise((res) => {
      const prev = g.mode; g.mode = 'talk';
      let timer = null;
      const end = (v) => { clearTimeout(timer); box.classList.add('hide'); box.innerHTML = ''; this.onAct = null; if (g.mode === 'talk') g.mode = prev === 'talk' ? 'explore' : prev; res(v); };
      box.innerHTML = `<div class="panel fork"><h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p><div class="forks"></div><i class="clock"><u></u></i></div>`;
      const row = box.querySelector('.forks');
      options.forEach((o, k) => {
        const c = el('button', 'pickcard' + (k === 0 ? ' first' : ''), `${o.pic || `<span class="pic round lit"><img src="${ic('quest')}" alt=""></span>`}<div><b>${esc(o.name)}</b><span>${esc(o.desc)}</span></div>`);
        c.onclick = () => { sfx.ui(); end(o.value ?? o); };
        row.append(c);
      });
      box.classList.remove('hide');
      this.onAct = () => row.firstChild.click();
      const clock = box.querySelector('.clock');
      if (g.st?.auto) { clock.firstChild.style.animationDuration = secs + 's'; clock.classList.add('run'); timer = setTimeout(() => row.firstChild.click(), secs * 1000); }
      else clock.remove();
    });
  }

  // ---------- panels ----------
  // A window: the book's leaves along its top (tabs: true), or a shop's or the board's own name.
  open(title, draw, tabs = false) {
    const g = this.g;
    if (g.mode !== 'explore' && g.mode !== 'menu') return;
    this.inShop = false;
    g.mode = 'menu';
    this.bubbles.clear();
    $('#modal').classList.remove('hide');
    $('#modal .panel').classList.toggle('book', tabs);
    $('#modal h2').textContent = title;
    this.leafEls = tabs;
    if (tabs) this.drawLeaves();
    $('#modal .body').scrollTop = 0;   // a new panel starts at its top, not where the last one was left
    this.draw = () => { const b = $('#modal .body'), y = b.scrollTop; b.innerHTML = ''; draw(b); b.scrollTop = y; this.refresh(); };
    this.draw();
  }
  drawLeaves() {
    const n = dotCounts(this.g.st), dots = { party: n.party, journal: n.journal, orders: n.boon };
    const box = $('#modal .leaves'); box.innerHTML = '';
    for (const [id, name] of LEAVES) {
      const b = el('button', 'leaf' + (this.leaf === id ? ' on' : ''), `${leafIcon(id)}<span>${name}</span>${dot(dots[id] || 0)}`);
      b.onclick = () => { if (this.leaf !== id) this.openPanel(id); };
      box.append(b);
    }
  }
  close() {
    if ($('#modal').classList.contains('hide')) return false;
    $('#modal').classList.add('hide');
    if (this.inShop) { this.inShop = false; sfx.door(false); }
    this.draw = null; this.leafEls = false;
    if (this.doll) { this.doll.dispose(); this.doll = null; }
    if (this.pp) this.pp.pick = null;
    if (this.g.mode === 'menu') this.g.mode = 'explore';
    save(this.g.st); this.refresh();
    return true;
  }
  isOpen() { return !$('#modal').classList.contains('hide'); }
  openPanel(which) {
    if (which === 'bag') { which = 'party'; this.pp = { sub: 'gear', filter: 'all', pick: null }; }
    if (which === 'quests') { which = 'journal'; this.jj = { sub: 'quests' }; }
    const draws = { party: drawParty, journal: drawJournal, orders: drawOrders, settings: drawSettings };
    if (!draws[which]) return;
    sfx.ui();
    if (this.doll && which !== 'party') { this.doll.dispose(); this.doll = null; }
    this.leaf = which;
    this.open('', (b) => draws[which](this, b), true);
  }

  // One line of a panel: a picture in its slot (pic: markup from art.js), the words, and buttons [label, fn, off].
  row(html, buttons = [], pic = '') {
    const r = el('div', 'row', `${pic}<div class="info">${html}</div>`), b = el('div', 'acts');
    for (const [label, fn, off] of buttons) { const x = el('button', 'btn sm' + (off ? ' off' : ''), label); if (!off) x.onclick = () => { fn(); this.draw?.(); }; b.append(x); }
    r.append(b); return r;
  }
  pay(n) { const st = this.g.st; if (st.gold < n) { sfx.deny(); this.toast('Not enough gold.'); return false; } st.gold -= n; sfx.coin(); return true; }
  room() { const st = this.g.st; if (st.bag.length >= st.bagSize) { sfx.deny(); this.toast('Your bag is full.'); return false; } return true; }
  // every piece of gear the party owns, and where it is
  allItems() {
    const st = this.g.st, out = st.bag.map((it) => ({ it, where: 'bag' }));
    for (const h of Object.values(st.heroes)) for (const s of SLOTS) if (h.equip[s]) out.push({ it: h.equip[s], where: h.name.split(' ')[0] });
    return out;
  }

  // The bounty board in the square: what the Watch wants, on paper.
  questPanel() {
    const st = this.g.st;
    this.open('The Bounty Board', (b) => {
      b.className = 'body board';
      for (const q of QUESTS.filter((q) => q.from === 'board')) b.append(questRow(this, q, true));
    });
  }

  // ---------- shops ----------
  stock(shop) {
    const st = this.g.st, tier = tierForLevel(lead(st).lvl), key = st.day + '-' + tier;
    if (st.stock[shop]?.key === key) return st.stock[shop].items;
    const items = [], tiers = tier ? [tier - 1, tier] : [0];
    const add = (kind, t, rar = 0) => items.push(makeItem(kind, t, rar));
    if (shop === 'weapons') { for (const k in WEAPONS) for (const t of tiers) add(k, t); for (let i = 0; i < 3; i++) add(Object.keys(WEAPONS)[Math.floor(Math.random() * 10)], tier, 1); }
    if (shop === 'armor') { for (const k of [...Object.keys(ARMORS), 'helm']) for (const t of tiers) add(k, t); for (let i = 0; i < 2; i++) add(Object.keys(ARMORS)[Math.floor(Math.random() * 3)], tier, 1); }
    if (shop === 'rings') { for (let i = 0; i < 5; i++) add('ring', tier, Math.random() < 0.4 ? 1 : 0); add('amulet', tier); add('amulet', tier, 1); }
    st.stock[shop] = { key, items };
    return items;
  }
  shop(kind, npc) {
    const st = this.g.st, g = this.g;
    const buySell = (b, shopId) => {
      b.append(el('h4', '', 'For sale'));
      for (const it of this.stock(shopId)) {
        const who = partyHeroes(st).filter((h) => canEquip(h, it)).map((h) => h.name.split(' ')[0]).join(', ');
        b.append(this.row(itemHtml(it, who ? ' · fits ' + esc(who) : ''), [[`Buy ${gp(itemValue(it))}`, () => { if (this.room() && this.pay(itemValue(it))) { const L = this.stock(shopId); L.splice(L.indexOf(it), 1); st.bag.push(it); } }]], itemPic(it)));
      }
      b.append(el('h4', '', 'Your bag'));
      if (!st.bag.length) b.append(el('div', 'note', 'Nothing to sell.'));
      for (const it of st.bag) b.append(this.row(itemHtml(it), [[`Sell ${gp(sellValue(it))}`, () => { st.bag.splice(st.bag.indexOf(it), 1); st.gold += sellValue(it); sfx.coin(); }]], itemPic(it)));
    };
    const gearList = (b, fn) => { const all = this.allItems(); if (!all.length) b.append(el('div', 'note', 'You have nothing to work on.')); for (const { it, where } of all) b.append(this.row(itemHtml(it, ' · ' + esc(where)), fn(it), itemPic(it))); };
    const draws = {
      weapons: (b) => buySell(b, 'weapons'), armor: (b) => buySell(b, 'armor'), rings: (b) => buySell(b, 'rings'),
      spells: (b) => {
        b.append(el('div', 'note', 'A scroll teaches one person one spell. Three to a head.'));
        const seg = el('div', 'seg');
        this.sel = this.sel && st.party.includes(this.sel) ? this.sel : st.party[0];
        for (const h of partyHeroes(st)) { const x = el('button', this.sel === h.id ? 'on' : '', esc(h.name.split(' ')[0])); x.onclick = () => { this.sel = h.id; this.draw(); }; seg.append(x); }
        b.append(seg);
        const h = st.heroes[this.sel];
        for (const sp of Object.values(SPELLS)) {
          const known = h.spells.includes(sp.id), low = h.lvl < sp.lvl, full = h.spells.length >= 3;
          b.append(this.row(`<b>${esc(sp.name)}</b><small>${sp.cost} mp · reach ${sp.r[1]}${sp.aoe ? ' · blast ' + sp.aoe : ''} · needs level ${sp.lvl}</small><span>${esc(sp.desc)}</span>`,
            [[known ? 'Known' : low ? `Level ${sp.lvl}` : full ? 'Full' : `Learn ${gp(sp.price)}`, () => { if (this.pay(sp.price)) { h.spells.push(sp.id); sfx.chime(); } }, known || low || full]], skillPic(sp, known || !low)));
        }
      },
      gems: (b) => { for (const k in GEMS) for (let gr = 0; gr < 3; gr++) { if (gr > tierForLevel(lead(st).lvl)) continue; const id = k + gr, gi = gemInfo(id); b.append(this.row(`<b style="color:${gi.color}">${GEM_GRADES[gr]} ${gi.name}</b><small>you have ${st.gems[id] || 0}</small><span>+${gi.val} ${STAT_NAMES[gi.stat]}</span>`, [[`Buy ${gp(GEM_PRICE[gr])}`, () => { if (this.pay(GEM_PRICE[gr])) st.gems[id] = (st.gems[id] || 0) + 1; }]], gemPic(id))); } },
      bags: (b) => {
        const n = (st.bagSize - 24) / 6, price = 150 * (n + 1), max = st.bagSize >= 60;
        b.append(this.row(`<b>More room</b><small>your bag holds ${st.bagSize}</small><span>Tamsin lets out the seams: six more places.</span>`, [[max ? 'No more seams' : `Sew ${gp(price)}`, () => { if (this.pay(price)) st.bagSize += 6; }, max]], goodsPic(ic('pack'))));
      },
      inn: (b) => {
        b.append(this.row('<b>A bed</b><small>four copper, paid before</small><span>Everyone wakes whole. So does everything in the pines.</span>', [[`Rest ${gp(4)}`, () => { if (this.pay(4)) { this.close(); g.rest(); } }]], goodsPic(goods('bed'))));
        for (const k in CONSUMABLES) b.append(this.row(`<b>${CONSUMABLES[k].name}</b><small>you have ${st.consum[k] || 0}</small><span>${CONSUMABLES[k].desc}</span>`, [[`Buy ${gp(CONSUMABLES[k].price)}`, () => { if (this.pay(CONSUMABLES[k].price)) st.consum[k] = (st.consum[k] || 0) + 1; }]], consumablePic(k)));
      },
      enhance: (b) => { b.append(el('div', 'note', 'Hammer and faith: each + adds a tenth to what the piece does. Ten at most.')); gearList(b, (it) => [[it.plus >= 10 ? 'Finished' : `+${it.plus + 1} for ${gp(enhanceCost(it))}`, () => { if (this.pay(enhanceCost(it))) { it.plus++; g.fixAll(); sfx.forge(); } }, it.plus >= 10]]); },
      enchant: (b) => { b.append(el('div', 'note', 'Adds a new property, or renegotiates the ones already there.')); gearList(b, (it) => [
        [it.affixes.length >= 4 ? 'Full' : `Add ${gp(enchantCost(it))}`, () => { if (this.pay(enchantCost(it))) { addAffix(it); it.rarity = Math.max(it.rarity, Math.min(4, it.affixes.length)); g.fixAll(); sfx.enchant(); } }, it.affixes.length >= 4],
        [`Reroll ${gp(Math.round(enchantCost(it) * 0.6))}`, () => { if (this.pay(Math.round(enchantCost(it) * 0.6))) { const n = it.affixes.length; it.affixes = []; for (let i = 0; i < n; i++) addAffix(it); g.fixAll(); sfx.enchant(); } }, !it.affixes.length]]); },
      socket: (b) => { b.append(el('div', 'note', 'A socket is a promise. Better gear takes more of them.')); gearList(b, (it) => [
        [it.sockets >= maxSockets(it) ? 'No room' : `Drill ${gp(socketCost(it))}`, () => { if (this.pay(socketCost(it))) { it.sockets++; sfx.forge(true); } }, it.sockets >= maxSockets(it)],
        [`Pry out ${gp(30)}`, () => { if (this.pay(30)) { for (const gm of it.gems) if (gm) st.gems[gm] = (st.gems[gm] || 0) + 1; it.gems = []; g.fixAll(); sfx.forge(true); } }, !it.gems.some(Boolean)]]); },
    };
    this.open(`${npc.name} · ${npc.title}`, (b) => { b.className = 'body shop-' + kind; draws[kind](b); });
    if (this.isOpen()) { this.inShop = true; sfx.door(true); }
  }
}
