// Everything drawn in HTML over the 3D view: title, character creation, the HUD, talk, and the panels.
import * as THREE from 'three';
import { el, esc, $ } from '../core/util.js';
import { CLASSES, CLASS_IDS, SPELLS, SKILL_LEVELS } from '../data/classes.js';
import { DPAD_HINT } from '../core/input.js';
import { RARITY, TIERS, WEAPONS, ARMORS, GEMS, GEM_GRADES, GEM_PRICE, CONSUMABLES, STAT_NAMES, gemInfo, makeItem, addAffix, itemName, itemLines, itemValue, sellValue, enhanceCost, enchantCost, socketCost, maxSockets, tierForLevel } from '../data/items.js';
import { QUESTS } from '../data/enemies.js';
import { PARTY_MAX, SLOTS, SLOT_NAMES, heroStats, heroSkills, canEquip, slotsFor, xpNeed, lead, partyHeroes, questProgress, questNeed, questReady, startQuest, save } from '../game/party.js';
import { makePerson } from '../gfx/models.js';
import { sound, sfx, setMuted } from '../core/audio.js';
import { itemPic, slotPic, gemPic, consumablePic, goodsPic, skillPic, roleIcons, rolesOf, ROLE_NAMES, ic, goods, watchMissing } from './art.js';

const itemHtml = (it, extra = '') => `<b style="color:${RARITY[it.rarity].color}">${esc(itemName(it))}</b><small>${TIERS[it.tier].name} ${RARITY[it.rarity].name}${extra}</small><span>${itemLines(it).join(' · ')}</span>`;
// a sum of gold, with the coins in front of it
const gp = (n) => `<i class="ic ic-gold"></i>${n}`;

export class UI {
  constructor(g) {
    this.g = g;
    this.root = $('#ui');
    this.root.innerHTML = `
      <div id="hud" class="hide">
        <div id="party"></div>
        <div id="topright"><div id="gold" title="Gold"></div><div id="tracker"></div></div>
        <div id="bar">
          <button data-open="party"><i class="ic ic-party"></i>Party</button><button data-open="bag"><i class="ic ic-pack"></i>Bag</button><button data-open="quests"><i class="ic ic-journal"></i>Quests</button>
          <button id="b-auto" title="Auto-play (P)">Auto</button><button id="b-dpad" title="Which diagonal the d-pad's Left means"></button><button id="b-mute">Sound</button>
        </div>
        <div id="autostat" class="hide"></div>
        <div id="prompt" class="hide"></div>
        <div id="pad">
          <button data-dir="up" class="pu">▲</button><button data-dir="left" class="pl">◀</button>
          <button data-dir="right" class="pr">▶</button><button data-dir="down" class="pd">▼</button>
        </div>
        <div id="btns"><button data-btn="act" class="ba">A<small>act</small></button><button data-btn="jump" class="bj">B<small>jump</small></button></div>
      </div>
      <div id="banner"></div><div id="toasts"></div>
      <div id="dialog" class="hide"><div class="who"></div><div class="say"></div><div class="opts"></div></div>
      <div id="modal" class="hide"><div class="panel"><header><h2></h2><button class="x" title="Close (Esc)"><i class="ic ic-close"></i></button></header><div class="body"></div></div></div>
      <div id="screen" class="hide"></div>`;
    watchMissing(this.root);
    g.input.bindPad(this.root);
    for (const b of this.root.querySelectorAll('[data-open]')) b.onclick = () => this.openPanel(b.dataset.open);
    $('#b-auto').onclick = () => g.toggleAuto();
    $('#b-dpad').onclick = () => { g.st.dpad = g.st.dpad === 'A' ? 'B' : 'A'; this.toast(`D-pad: ${DPAD_HINT[g.st.dpad]}.`); this.refresh(); };
    $('#b-mute').onclick = () => { setMuted(!sound.muted); $('#b-mute').classList.toggle('muted', sound.muted); if (!sound.muted) sfx.ui(); };
    $('#b-mute').classList.toggle('muted', sound.muted);
    $('#modal .x').onclick = () => this.close();
    $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') this.close(); });
    this.sel = null; this.tab = null;
  }

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
    // a little turntable for the stand-in model
    const gl = new THREE.WebGLRenderer({ canvas: $('#c-prev'), antialias: true, alpha: true });
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 300 / 380, 0.1, 50);
    cam.position.set(0, 1.5, 5.2); cam.lookAt(0, 0.85, 0);
    scene.add(new THREE.HemisphereLight(0xaab8e0, 0x2a2018, 1.3)); const sun = new THREE.DirectionalLight(0xffe0b0, 1.6); sun.position.set(3, 5, 4); scene.add(sun);
    let model = null, alive = true;
    const spin = () => { if (!alive) return; if (model) model.rotation.y += 0.012; gl.render(scene, cam); requestAnimationFrame(spin); };
    const draw = () => {
      sfx.ui();
      for (const b of grid.children) b.classList.toggle('on', b.dataset.cls === pickd.cls);
      for (const b of s.querySelectorAll('#c-g button')) b.classList.toggle('on', b.dataset.g === pickd.g);
      if (model) scene.remove(model);
      model = makePerson(pickd); model.rotation.y = 0.5; scene.add(model);
      const C = CLASSES[pickd.cls];
      $('#c-info').innerHTML = `<h3 style="color:${C.color}">${esc(C.name)}</h3><p>${esc(C.desc)}</p>
        <div class="rolebox">${roleIcons(C, true)}<p class="role"><b>${rolesOf(C).map((r) => ROLE_NAMES[r]).join(' · ')}</b><br>${esc(C.role)}</p></div>
        <div class="stats"><span>Life ${C.life[0]}</span><span>${C.resource === 'rage' ? 'Rage 100' : 'Mana ' + C.mana[0]}</span><span>Move ${C.move}</span><span>Jump ${C.jump}</span><span>${C.weapon.join(' / ')}</span><span>${C.armor}</span></div>
        <ul class="skl">${C.skills.map((k) => `<li>${skillPic(k, k.lvl <= 1)}<div><b>${esc(k.name)}</b> <small>level ${k.lvl}</small><br>${esc(k.desc)}</div></li>`).join('')}</ul>`;
    };
    draw(); spin();
    $('#c-go').onclick = () => {
      const name = $('#c-name').value.trim() || 'Stranger';
      alive = false; gl.dispose(); s.className = 'hide'; s.innerHTML = '';
      this.g.newGame({ name, ...pickd });
    };
  }

  // ---------- HUD ----------
  showHud(on) { $('#hud').classList.toggle('hide', !on); }
  battleMode(on) { $('#hud').classList.toggle('fight', on); }
  refresh() {
    const st = this.g.st; if (!st) return;
    $('#party').innerHTML = partyHeroes(st).map((h, i) => {
      const s = heroStats(h), C = CLASSES[h.cls];
      return `<div class="pm${i === 0 ? ' lead' : ''}${h.hp <= 0 ? ' down' : ''}"><b style="color:${C.color}">${esc(h.name.split(' ')[0])}</b><small>Lv ${h.lvl} ${esc(C.name)}</small>
        <span class="bars"><i class="hp"><u style="width:${100 * Math.max(0, h.hp) / s.hp}%"></u></i><i class="mp${C.resource === 'rage' ? ' rage' : ''}"><u style="width:${100 * h.mp / s.mp}%"></u></i></span></div>`;
    }).join('');
    $('#gold').innerHTML = `${gp('')}<b>${st.gold}</b>`;
    const act = QUESTS.filter((q) => st.quests[q.id]?.state === 'active');
    $('#tracker').innerHTML = act.map((q) => { const r = questReady(st, q); return `<div class="${r ? 'ready' : ''}"><i class="ic ic-${r ? 'qready' : 'qbusy'}"></i>${esc(q.name)} <b>${questProgress(st, q)}/${questNeed(q)}</b></div>`; }).join('');
    $('#b-auto').classList.toggle('on', !!st.auto);
    $('#b-dpad').textContent = `D-pad ${st.dpad}`;
  }
  setPrompt(text) { const p = $('#prompt'); p.classList.toggle('hide', !text); if (text) p.innerHTML = `<kbd>A</kbd> ${esc(text)}`; }
  setAuto(text) { const p = $('#autostat'); p.classList.toggle('hide', !text); if (text) p.textContent = 'Auto: ' + text; }
  toast(text, who) {
    const t = el('div', 'toast', (who ? `<b>${esc(who)}</b> ` : '') + esc(text));
    $('#toasts').append(t); setTimeout(() => t.classList.add('out'), 5200); setTimeout(() => t.remove(), 5900);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  }
  banner(title, sub = '', red = false) {
    const b = $('#banner'); b.innerHTML = `<h2 class="${red ? 'red' : ''}">${esc(title)}</h2><p>${esc(sub)}</p>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }

  // ---------- talk ----------
  // lines: [[speaker, text], ...]; choices (on the last line): [[label, value], ...]. Resolves with the value chosen.
  dialog(lines, choices) {
    const g = this.g, d = $('#dialog');
    return new Promise((res) => {
      const prev = g.mode; g.mode = 'talk';
      let i = 0, timer = null;
      let spoke = null;
      const voice = (who) => { if (spoke) g.explore?.speak(spoke, false); spoke = who; if (who && prev === 'explore') g.explore?.speak(who, true); };
      const end = (v) => { voice(null); clearTimeout(timer); d.classList.add('hide'); this.onAct = null; if (g.mode === 'talk') g.mode = prev === 'talk' ? 'explore' : prev; res(v); };
      const show = () => {
        const [who, text] = lines[i], last = i === lines.length - 1;
        voice(who);
        d.classList.remove('hide');
        d.querySelector('.who').textContent = who; d.querySelector('.who').classList.toggle('hide', !who);
        d.querySelector('.say').textContent = text.replace('{name}', g.st?.name || '');
        const o = d.querySelector('.opts'); o.innerHTML = '';
        const opts = last && choices ? choices : [[last ? 'Close' : 'Next', '__next']];
        opts.forEach(([label, v], k) => { const b = el('button', 'btn' + (k === 0 ? ' first' : ''), esc(label)); b.onclick = () => { sfx.ui(); v === '__next' ? next() : end(v); }; o.append(b); });
        this.onAct = () => o.firstChild.click();
        clearTimeout(timer);
        if (g.st?.auto) timer = setTimeout(() => o.firstChild.click(), 1900 + text.length * 14);
      };
      const next = () => { if (++i >= lines.length) end(null); else show(); };
      show();
    });
  }

  // ---------- panels ----------
  open(title, draw) {
    const g = this.g;
    if (g.mode !== 'explore' && g.mode !== 'menu') return;
    this.inShop = false;
    g.mode = 'menu';
    $('#modal').classList.remove('hide');
    $('#modal h2').textContent = title;
    $('#modal .body').scrollTop = 0;   // a new panel starts at its top, not where the last one was left
    this.draw = () => { const b = $('#modal .body'), y = b.scrollTop; b.innerHTML = ''; draw(b); b.scrollTop = y; this.refresh(); };
    this.draw();
  }
  close() { if ($('#modal').classList.contains('hide')) return false; $('#modal').classList.add('hide'); if (this.inShop) { this.inShop = false; sfx.door(false); } this.draw = null; if (this.g.mode === 'menu') this.g.mode = 'explore'; save(this.g.st); return true; }
  isOpen() { return !$('#modal').classList.contains('hide'); }
  openPanel(which) { sfx.ui(); ({ party: () => this.partyPanel(), bag: () => this.bagPanel(), quests: () => this.questPanel() })[which](); }

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

  partyPanel() {
    const st = this.g.st;
    this.sel = this.sel && st.heroes[this.sel] ? this.sel : st.party[0]; this.resY = 0;
    this.open('Party', (b) => {
      const left = el('div', 'pp-l'), right = el('div', 'pp-r');
      left.append(el('h4', '', `Marching order <small>${st.party.length}/${PARTY_MAX}</small>`));
      st.party.forEach((id, i) => {
        const h = st.heroes[id], r = el('div', 'hrow' + (this.sel === id ? ' on' : ''), `<b style="color:${CLASSES[h.cls].color}">${i + 1}. ${esc(h.name)}</b><small>Lv ${h.lvl} ${esc(CLASSES[h.cls].name)}${i === 0 ? ' · leads' : ''}</small>`);
        r.onclick = () => { this.sel = id; this.draw(); };
        const a = el('span', 'mini');
        const mk = (t, fn, off) => { const x = el('button', off ? 'off' : '', t); if (!off) x.onclick = (e) => { e.stopPropagation(); fn(); this.g.partyChanged(); this.draw(); }; a.append(x); };
        mk('▲', () => { [st.party[i - 1], st.party[i]] = [st.party[i], st.party[i - 1]]; }, i <= 1);
        mk('▼', () => { [st.party[i + 1], st.party[i]] = [st.party[i], st.party[i + 1]]; }, i === 0 || i === st.party.length - 1);
        mk('rest', () => { st.party.splice(i, 1); st.reserve.push(id); }, i === 0);
        r.append(a); left.append(r);
      });
      // the rest, highest level first, in a list of its own that scrolls (there can be fifty of them)
      if (st.reserve.length) left.append(el('h4', '', `Waiting at The Last Toll <small>${st.reserve.length}</small>`));
      const res = el('div', 'pp-res');
      [...st.reserve].sort((a, b) => st.heroes[b].lvl - st.heroes[a].lvl || st.heroes[a].name.localeCompare(st.heroes[b].name)).forEach((id) => {
        const h = st.heroes[id], r = el('div', 'hrow' + (this.sel === id ? ' on' : ''), `<b style="color:${CLASSES[h.cls].color}">${esc(h.name)}</b><small>Lv ${h.lvl} ${esc(CLASSES[h.cls].name)}</small>`);
        r.onclick = () => { this.sel = id; this.draw(); };
        const a = el('span', 'mini'), x = el('button', st.party.length >= PARTY_MAX ? 'off' : '', 'join');
        if (st.party.length < PARTY_MAX) x.onclick = (e) => { e.stopPropagation(); st.reserve.splice(st.reserve.indexOf(id), 1); st.party.push(id); this.g.partyChanged(); this.draw(); };
        a.append(x); r.append(a); res.append(r);
      });
      if (st.reserve.length) {
        left.append(res);
        res.onscroll = () => { this.resY = res.scrollTop; };
        queueMicrotask(() => { res.scrollTop = this.resY || 0; });
      }
      // the sheet
      const h = st.heroes[this.sel], C = CLASSES[h.cls], s = heroStats(h);
      right.innerHTML = `<div class="sheethead"><div><h3 style="color:${C.color}">${esc(h.name)}</h3><p class="role">Level ${h.lvl} ${esc(C.name)} · ${h.xp}/${xpNeed(h.lvl)} xp · ${esc(C.role)}</p></div><div class="roles">${roleIcons(C, true)}</div></div>
        <div class="stats"><span>Life ${Math.max(0, h.hp)}/${s.hp}</span><span>${C.resource === 'rage' ? 'Rage' : 'Mana'} ${h.mp}/${s.mp}</span><span>Attack ${s.atk}</span><span>Magic ${s.mag}</span><span>Armor ${s.def}</span><span>Ward ${s.res}</span><span>Speed ${s.spd}</span><span>Crit ${s.crit}%</span><span>Move ${s.move}</span><span>Jump ${s.jump}</span></div><h4>Wearing</h4>`;
      for (const slot of SLOTS) {
        const it = h.equip[slot];
        const r = this.row(`<em>${SLOT_NAMES[slot]}</em> ${it ? itemHtml(it) : '<small>nothing</small>'}`, [
          ['Change', () => { this.picking = this.picking === slot ? null : slot; }],
          ...(it ? [['Take off', () => { if (this.room()) { st.bag.push(it); h.equip[slot] = null; this.g.fixHp(h); if (slot === 'weapon') sfx.sheath(); else sfx.ui(); } }]] : []),
        ], it ? itemPic(it, slot) : slotPic(slot));
        right.append(r);
        if (it && it.sockets) {
          const sk = el('div', 'socks');
          for (let i = 0; i < it.sockets; i++) {
            const gm = it.gems[i], x = el('button', 'sock' + (gm ? ' full' : ''), gm ? `${gemPic(gm, true)}${esc(gemInfo(gm).full)}` : '<span class="pic round"></span>empty socket');
            if (gm) x.style.color = gemInfo(gm).color;
            else x.onclick = () => { this.socketing = this.socketing?.it === it ? null : { it, i }; this.draw(); };
            sk.append(x);
          }
          right.append(sk);
          if (this.socketing?.it === it) {
            const have = Object.keys(st.gems).filter((k) => st.gems[k] > 0);
            if (!have.length) right.append(el('div', 'note', 'You have no gems. Zafir sells them; the dead sometimes carry them.'));
            for (const k of have) right.append(this.row(`<b style="color:${gemInfo(k).color}">${esc(gemInfo(k).full)}</b><small>x${st.gems[k]}</small><span>+${gemInfo(k).val} ${STAT_NAMES[gemInfo(k).stat]}</span>`, [['Set', () => { it.gems[this.socketing.i] = k; st.gems[k]--; this.socketing = null; this.g.fixHp(h); sfx.forge(true); }]], gemPic(k)));
          }
        }
        if (this.picking === slot) {
          const fits = st.bag.filter((x) => slotsFor(x).includes(slot) && canEquip(h, x));
          if (!fits.length) right.append(el('div', 'note', 'Nothing in the bag fits here.'));
          for (const x of fits) right.append(this.row(itemHtml(x), [['Wear', () => { st.bag.splice(st.bag.indexOf(x), 1); if (it) st.bag.push(it); h.equip[slot] = x; this.picking = null; this.g.fixHp(h); sfx.equip(x); }]], itemPic(x, slot)));
        }
      }
      right.append(el('h4', '', 'Skills'));
      const ul = el('ul', 'skl');
      for (const k of C.skills) { const open = h.lvl >= k.lvl; ul.append(el('li', open ? '' : 'locked', `${skillPic(k, open)}<div><b>${esc(k.name)}</b> <small>${open ? k.cost + (C.resource === 'rage' ? ' rage' : ' mp') : '<i class="ic ic-locked"></i>opens at level ' + k.lvl}</small><br>${esc(k.desc)}</div>`)); }
      for (const id of h.spells) ul.append(el('li', '', `${skillPic(SPELLS[id])}<div><b>${esc(SPELLS[id].name)}</b> <small>scroll · ${SPELLS[id].cost} mp</small><br>${esc(SPELLS[id].desc)}</div>`));
      right.append(ul);
      b.className = 'body pp'; b.append(left, right);
    });
  }

  bagPanel() {
    const st = this.g.st;
    this.open('Bag', (b) => {
      b.className = 'body';
      b.append(el('h4', '', `Gear <small>${st.bag.length}/${st.bagSize}</small>`));
      if (!st.bag.length) b.append(el('div', 'note', 'Empty. The dead carry things, now and then.'));
      for (const it of st.bag) {
        const who = partyHeroes(st).filter((h) => canEquip(h, it)).map((h) => h.name.split(' ')[0]).join(', ');
        b.append(this.row(itemHtml(it, who ? ' · fits ' + esc(who) : ''), [['Drop', () => { st.bag.splice(st.bag.indexOf(it), 1); }]], itemPic(it)));
      }
      b.append(el('h4', '', 'Draughts'));
      for (const k in CONSUMABLES) b.append(this.row(`<b>${CONSUMABLES[k].name}</b><small>x${st.consum[k] || 0}</small><span>${CONSUMABLES[k].desc}</span>`, [['Use', () => this.g.useOutside(k), k === 'tonic' || !(st.consum[k] > 0)]], consumablePic(k)));
      b.append(el('h4', '', 'Gems'));
      const have = Object.keys(st.gems).filter((k) => st.gems[k] > 0);
      if (!have.length) b.append(el('div', 'note', 'None. Set them into sockets from the Party screen.'));
      for (const k of have) b.append(this.row(`<b style="color:${gemInfo(k).color}">${esc(gemInfo(k).full)}</b><small>x${st.gems[k]}</small><span>+${gemInfo(k).val} ${STAT_NAMES[gemInfo(k).stat]}</span>`, [], gemPic(k)));
    });
  }

  questPanel(board = false) {
    const st = this.g.st;
    this.open(board ? 'The Bounty Board' : 'Quests', (b) => {
      b.className = 'body' + (board ? ' board' : '');
      const list = QUESTS.filter((q) => (board ? q.from === 'board' : st.quests[q.id]));
      if (!list.length) b.append(el('div', 'note', 'Nothing yet.'));
      for (const q of list) {
        const s = st.quests[q.id], ready = questReady(st, q);
        const state = !s ? 'Posted' : s.state === 'done' ? 'Done' : ready ? 'Ready to claim' : `${questProgress(st, q)}/${questNeed(q)}`;
        const mark = !s ? 'quest_offer' : s.state === 'done' ? 'quest' : ready ? 'quest_ready' : 'quest_busy';
        const btns = [];
        if (board && !s) btns.push(['Take it', () => { startQuest(st, q.id); sfx.ui(); }]);
        if (ready && (board || q.from !== 'board')) btns.push(['Claim', () => this.g.claimQuest(q)]);
        b.append(this.row(`<b>${esc(q.name)}</b><small>${state} · ${gp(q.gold)} · ${q.xp} xp${q.reward === 'rare' ? ' · a rare weapon' : ''}</small><span>${esc(s?.state === 'done' ? q.done : q.text)}</span>`, btns, goodsPic(ic(mark), 'mark')));
        if (s?.state === 'done') b.lastChild.classList.add('done');
        if (ready && q.from === 'board' && !board) b.lastChild.append(el('div', 'note', 'Claim it at the bounty board in the square.'));
      }
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
