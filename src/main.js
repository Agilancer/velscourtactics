// VELSCOUR TACTICS. Boots the world, then hands over to whichever of walking, talking or fighting is going on.
import { buildWorld, TOWN } from './world/map.js';
import { Renderer } from './world/render.js';
import { FX } from './gfx/fx.js';
import { Touches } from './core/pinch.js';
import { Input } from './core/input.js';
import { UI } from './ui/ui.js';
import { Explore } from './game/explore.js';
import { Battle } from './game/battle.js';
import { Auto } from './game/auto.js';
import { Banter } from './game/banter.js';
import { pickKind } from './game/encounter.js';
import { ordersOf, offerBoons } from './game/doctrine.js';
import { loadManifest } from './gfx/models.js';
import { HEROES, OPENING, WELL_LINES, CHEST_LINE, CRYPT } from './data/cast.js';
import { QUESTS, ZOMBIES, KIND, RIVAL_NAMES } from './data/enemies.js';
import { CLASSES } from './data/classes.js';
import { WEAPONS, CONSUMABLES, makeItem, itemName, itemValue, enhanceCost, tierForLevel, RARITY } from './data/items.js';
import { PARTY_MAX, SLOTS, newState, load, save, recruit, restAll, startQuest, questReady, heroStats, gainXp, lead, partyHeroes, upgradeSlot, itemWorth, addToBag, setBoons } from './game/party.js';
import { note, fresh, unread } from './game/chronicle.js';
import { sound, sfx } from './core/audio.js';
import { music } from './core/music.js';
import { ambience } from './core/ambience.js';
import { title } from './ui/title.js';
import { pick } from './core/util.js';

// 'a sword', 'an ash staff'
const an = (name) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;

class Game {
  constructor() {
    this.world = buildWorld();
    this.canvas = document.getElementById('view');
    this.r = new Renderer(this.canvas, this.world);
    this.r.fx = new FX(this.r);    // the fight's sparks, flashes and shakes (src/gfx/fx.js)
    this.input = new Input();
    this.ui = new UI(this);
    this.mode = 'title';          // title | explore | alert | battle | talk | menu
    this.tweens = [];
    this.st = null; this.explore = null; this.battle = null;
    this.auto = new Auto(this);
    this.banter = new Banter(this);
    this.hudT = 0;
    // the fight's speed button: 2x is the pace the fights were built at, 1x half that (remembered, like Sound)
    this.fightSpeed = 1;
    try { if (localStorage.getItem('vt.pace') === '2') this.fightSpeed = 2; } catch { /* no storage: 1x */ }
    // a slow look round the Hollow behind the title
    this.r.follow(this.world.well.x, 0, this.world.well.z, 0, true);

    this.input.on('jump', () => { if (this.mode === 'explore') { if (this.explore.step) this.explore.jumpQueued = true; else if (!this.input.dir()) this.explore.hopInPlace(); else this.explore.jumpQueued = true; this.autoPause(); } else if (this.mode === 'battle') this.battle.back(); });
    this.input.on('act', () => { if (this.mode === 'talk') this.ui.onAct?.(); else if (this.mode === 'battle') this.battle.confirm(); else if (this.mode === 'explore') this.explore.interact(); });
    this.input.on('back', () => { if (this.mode === 'menu') this.ui.close(); else if (this.mode === 'battle') this.battle.back(); });
    this.input.on('menu', () => { if (this.mode === 'explore') this.ui.openPanel('party'); else if (this.mode === 'menu') this.ui.close(); });
    this.input.on('auto', () => this.toggleAuto());
    this.input.on('speed', () => { if (this.battle) this.toggleSpeed(); });
    this.input.on('call', () => { this.battle?.callKey(); });
    this.input.on('dir', (d) => { if (this.mode === 'battle') this.battle.dir(d); });
    // the map under a mouse or a finger: two fingers pinch the view in and out, one taps (src/core/pinch.js)
    this.touches = new Touches(this.canvas, {
      zoom: () => this.r.zoom, setZoom: (z) => this.r.setZoom(z),
      tap: (x, y) => { if (this.mode === 'battle') this.battle.pointer(x, y, true); },
      hover: (x, y) => { if (this.mode === 'battle') this.battle.pointer(x, y, false); },
    });
    window.addEventListener('wheel', (e) => { if (!e.ctrlKey && e.target === this.canvas && !this.ui.isOpen()) this.r.setZoom(this.r.zoom + Math.sign(e.deltaY) * 1.2); }, { passive: true });

    // the sounds sit where their makers are on screen
    sound.where = (x, y, z) => (this.r.project(x, y, z).x / window.innerWidth) * 2 - 1;
    // the title (title.js) has been up since the first paint: its menu comes up now the Hollow is built
    title.onMenu = (a) => {
      if (a === 'new') { title.hide(); this.ui.create(); }
      else if (a === 'continue' && load()) { title.hide(); this.continueGame(); }
    };
    title.ready({ continue: !!load() });
    // back from somewhere else: say how much went on (the chronicle has it all)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !this.st) return;
      const n = unread(this.st);
      if (n >= 3) this.ui.chat.line('system', '', `While you were away: ${n} things happened. Tap here to read them.`);
    });
    let last = performance.now();
    const frame = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.update(dt); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  tween(dur, fn) { return new Promise((res) => this.tweens.push({ t: 0, dur: dur / (this.st?.auto ? 1.6 : 1), fn, res })); }

  /** How fast a fight's clock runs against the real one: 1 at 2x, 0.5 at 1x, and 1 outside a fight. Every wait,
   * tween, animation and effect in a fight goes by it (Battle.wait and Battle.later for the timers). */
  get pace() { return this.battle ? this.fightSpeed / 2 : 1; }
  toggleSpeed() {
    this.fightSpeed = this.fightSpeed === 2 ? 1 : 2; sfx.ui();
    try { localStorage.setItem('vt.pace', String(this.fightSpeed)); } catch { /* no storage */ }
    this.ui.refresh();
  }

  update(dt) {
    const real = dt, pace = this.pace;
    dt *= this.r.fx.timeScale();      // a heavy blow holds the frame for a moment
    const fdt = dt * pace;            // the fight's clock
    for (const tw of this.tweens) { tw.t = Math.min(1, tw.t + fdt / tw.dur); tw.fn(tw.t); if (tw.t >= 1) tw.res(); }
    this.tweens = this.tweens.filter((tw) => tw.t < 1);
    if (this.mode === 'title') { const t = performance.now() / 9000; this.r.follow(this.world.well.x + Math.cos(t) * 9, 0, this.world.well.z + Math.sin(t) * 7, dt); }
    else if (this.battle) this.battle.update(fdt, dt);
    else if (this.explore) { this.auto.update(dt); this.explore.update(dt); if (this.mode === 'explore') this.cryptWatch(); }
    if (this.st) this.banter.update(dt);
    this.r.tick(dt);
    this.r.fx.pace = pace;
    this.r.fx.update(real * pace);
    this.r.fx.shaken(() => this.r.render());
    dt = real;
    const set = this.place(), fight = this.mode === 'battle' || this.mode === 'alert';
    music.update(dt, { set, fight });
    ambience.update(dt, { on: !!this.explore && !title.up, set, fight, ear: this.r.target, world: this.world });
    this.ui.tick(dt);
    if ((this.hudT -= dt) <= 0 && this.st) { this.hudT = 0.25; this.ui.refresh(); }
  }

  /** Where the party is, for the music and the world's sound: the Hollow, the pines round it, or far
   * out where the pines go black. */
  place() {
    const L = this.explore?.leader;
    if (!L) return null;
    if (this.world.inTown(L.x, L.z)) return 'hollow';
    const dx = Math.max(TOWN.x0 - L.x, 0, L.x - TOWN.x1), dz = Math.max(TOWN.z0 - L.z, 0, L.z - TOWN.z1);
    return Math.hypot(dx, dz) > 26 ? 'deep' : 'pines';
  }

  // ---- starting ----
  newGame(who) { this.begin(newState(who)); }
  continueGame() { this.begin(load()); }
  begin(st) {
    this.st = st; setBoons(st);
    this.explore = new Explore(this);
    this.mode = 'explore';
    this.r.setChests(st.opened);
    this.ui.showHud(true); this.ui.refresh();
    const L = this.explore.leader;
    this.r.follow(L.x, 0, L.z, 0, true);
    this.explore.inTown = this.world.inTown(L.x, L.z);
    this.inCrypt = this.nearCrypt(L.x, L.z);
    this.explore.updatePrompt();
    if (!st.flags.opened) this.opening();
    else music.play();
    if (st.flags.opened) this.ui.banner(this.explore.inTown ? 'Herrington Hollow' : this.world.regionAt(L.x, L.z).name, `Day ${st.day}`);
    this.ui.setAuto(st.auto ? 'Thinking' : null);
  }
  async opening() {
    const st = this.st;
    music.intro();
    await this.ui.dialog(OPENING);
    music.endIntro(5);
    st.flags.opened = true;
    recruit(st, 'lisandra');
    startQuest(st, 'first');
    this.partyChanged();
    this.ui.banner('What Walks in the Pines', 'Put down two of the dead, south of the road');
    save(st);
  }

  // ---- auto-play ----
  toggleAuto() {
    if (!this.st) return;
    this.st.auto = !this.st.auto; sfx.ui();
    this.auto.reset();
    this.ui.setAuto(this.st.auto ? 'Thinking' : null);
    this.ui.chat.line('auto', '', this.st.auto ? 'Auto-play has the party. Its orders are under Orders.' : 'Auto-play stands down.');
    this.ui.refresh(); save(this.st);
    if (this.st.auto) { if (this.mode === 'menu') this.ui.close(); if (this.battle) this.battle.takeOver(); if (this.mode === 'talk') this.ui.onAct?.(); }
    else this.battle?.drawCall();
  }
  autoPause() { if (this.st?.auto) this.auto.hold(); }
  // Wear whatever in the bag is plainly better.
  autoEquip() {
    const st = this.st;
    for (const h of partyHeroes(st)) for (const it of [...st.bag]) {
      const slot = upgradeSlot(h, it);
      if (!slot) continue;
      st.bag.splice(st.bag.indexOf(it), 1);
      if (h.equip[slot]) st.bag.push(h.equip[slot]);
      h.equip[slot] = it; this.fixHp(h);
      delete fresh(st).items[it.uid];
      this.ui.toast(`${h.name.split(' ')[0]} puts on the ${itemName(it)}.`);
      sfx.equip(it);
    }
  }
  fixHp(h) { const s = heroStats(h); h.hp = Math.min(h.hp, s.hp); if (CLASSES[h.cls].resource !== 'rage') h.mp = Math.min(h.mp, s.mp); }
  fixAll() { for (const h of Object.values(this.st.heroes)) this.fixHp(h); }

  // ---- the party ----
  partyChanged() { this.explore.rebuildParty(); this.explore.spawnNpcs(); this.ui.refresh(); this.checkStory(); }
  async recruitNpc(npc, quiet = false) {
    const d = HEROES[npc.hero], st = this.st;
    if (!quiet) {
      const ans = await this.ui.dialog([[d.name, d.ask]], [['Walk with me', 'yes'], ['Not yet', 'no']]);
      if (ans !== 'yes') return;
    }
    const h = recruit(st, npc.hero);
    if (!h) return;
    if (!music.stinger('found')) sfx.level();
    const where = st.party.includes(npc.hero) ? 'joins the party' : 'will wait at The Last Toll (your party is full)';
    this.ui.banner(d.name, `${CLASSES[d.cls].name} · ${where}`);
    note(st, 'join', `${d.name} the ${CLASSES[d.cls].name} ${where === 'joins the party' ? 'joined the line' : 'agreed to come, and waits at The Last Toll'}.`);
    this.partyChanged();
    await this.ui.dialog([[d.name, d.join]]);
    save(st);
  }
  rest() {
    const st = this.st;
    st.day++; restAll(st); st.stock = {};
    this.newDay();
    this.explore.spawnFoes();
    sfx.bell();
    this.ui.banner(`Day ${st.day}`, 'Everyone wakes whole. So does everything in the pines.');
    this.banter.say('rest', { chance: 0.6 });
    save(st);
    if (st.dread >= 100) this.gateFight();
  }
  // ---- the dead grow bolder (st.dread, 0..100): a little every day for each lord still standing, more for a fight
  // lost; less for a lord put down, a stray brought home, the gate held. It raises the level of the dead in the pines
  // (Explore.spawnFoes), and at a hundred they come to the Hollow. ----
  lordsLeft() { return ['warden', 'dryking', 'abbess', 'stoker'].filter((id) => !this.st.kills[id]).length; }
  newDay() {
    const st = this.st, was = st.dread, left = this.lordsLeft();
    if (lead(st).lvl >= 3) st.dread = Math.min(100, st.dread + left * 1.5);
    const band = (d) => Math.min(4, Math.floor(d / 25));
    if (band(st.dread) > band(was)) {
      const words = ['', 'The dead in the pines are restless. They stand nearer the road.', 'The dead are bolder. The Watch has doubled the gate.', 'The dead are at the treeline every dusk now. The Hollow sleeps in shifts.', 'The dead are coming to the Hollow.'][band(st.dread)];
      note(st, 'dread', words); this.ui.chat.line('dread', '', words);
      this.banter.say('dread', { force: true });
    }
  }
  // At a hundred: they come to the gate. A fight on the road out of town, the morning after a night's sleep.
  gateFight() {
    const st = this.st, ex = this.explore, w = this.world, lvl = lead(st).lvl, L = ex.leader;
    const kinds = ['shambler', 'gnawer', 'possessed', 'goblin', 'plague_knight'].slice(0, 2 + Math.min(3, Math.floor(lvl / 3)));
    const foes = [];
    for (let i = 0; i < 4; i++) {
      const spot = ex.nearestFree(L.x + 4 + (i % 2) * 2, L.z + 5 + Math.floor(i / 2) * 2);
      const f = ex.addFoe(`gate${st.day}_${i}`, KIND[pick(kinds)], Math.max(1, lvl - 1 + (i === 0 ? 1 : 0)), spot[0], spot[1]);
      foes.push(f);
    }
    note(st, 'dread', 'The dead came to the gate of the Hollow at first light.');
    this.ui.banner('The dead at the gate', 'They have come to the Hollow', true);
    sfx.alert(true);
    ex.busy = true; this.mode = 'alert';
    setTimeout(() => this.startBattle(foes, foes[0], { kind: 'gate' }), 1400);
  }
  useOutside(k) {
    const st = this.st, heroes = partyHeroes(st);
    const t = k === 'potion' ? heroes.filter((h) => h.hp > 0).sort((a, b) => a.hp / heroStats(a).hp - b.hp / heroStats(b).hp)[0] : heroes.filter((h) => CLASSES[h.cls].resource !== 'rage').sort((a, b) => a.mp / heroStats(a).mp - b.mp / heroStats(b).mp)[0];
    if (!t) return;
    const s = heroStats(t);
    if (k === 'potion') t.hp = Math.min(s.hp, t.hp + Math.round(s.hp * 0.45)); else t.mp = Math.min(s.mp, t.mp + Math.round(s.mp * 0.45));
    st.consum[k]--; sfx.drink();
    this.ui.toast(`${t.name.split(' ')[0]} drinks it.`);
  }

  // ---- quests ----
  claimQuest(q) {
    const st = this.st;
    if (!questReady(st, q)) return;
    st.quests[q.id].state = 'done';
    st.gold += q.gold;
    for (const h of partyHeroes(st)) if (gainXp(h, q.xp)) { this.ui.toast(`${h.name.split(' ')[0]} reaches level ${h.lvl}.`); note(st, 'level', `${h.name} reached level ${h.lvl}.`); }
    if (q.reward === 'potion3') st.consum.potion += 3;
    if (q.reward === 'rare') { const it = makeItem(CLASSES[lead(st).cls].weapon[0], tierForLevel(lead(st).lvl), 2); addToBag(st, it); this.ui.toast(`The Watch hands over a ${itemName(it)}.`); }
    sfx.coin(); if (!music.stinger('triumph')) sfx.level();
    this.ui.banner('Done: ' + q.name, `${q.gold} gold · ${q.xp} experience`);
    note(st, 'quest', `Done: ${q.name}. ${q.gold} gold.`);
    save(st);
  }
  takeQuest(q) { startQuest(this.st, q.id); delete fresh(this.st).quests[q.id]; note(this.st, 'quest', `Took the Watch’s paper: ${q.name}.`); }
  boardAuto() {
    const st = this.st;
    let took = 0;
    for (const q of QUESTS) if (q.from === 'board') { if (!st.quests[q.id]) { startQuest(st, q.id); delete fresh(st).quests[q.id]; took++; } if (questReady(st, q)) this.claimQuest(q); }
    if (took) note(st, 'quest', `Read the bounty board and took ${took === 1 ? 'the one paper' : 'all ' + took + ' papers'} the Watch had up.`);
    this.ui.toast('You read the bounty board.');
  }
  // Lisandra's own errands close themselves, wherever you are standing.
  async checkStory() {
    const st = this.st;
    if (this.mode !== 'explore' || this.storyBusy) return;
    for (const q of QUESTS) {
      if (q.from !== 'lisandra' || !questReady(st, q)) continue;
      this.storyBusy = true;
      this.claimQuest(q);
      await this.ui.dialog([['Lisandra', q.done]]);
      const nxt = QUESTS.find((n) => n.from === 'lisandra' && !st.quests[n.id]);
      if (nxt) { startQuest(st, nxt.id); await this.ui.dialog([['Lisandra', nxt.text], ['Lisandra', 'And read the bounty board in the square. The Watch pays by the head, and they are not fussy whose.']]); this.ui.banner(nxt.name, 'A new errand'); }
      else await this.ui.dialog([['Lisandra', 'Four roads out of the Hollow, and every one of them goes somewhere worse. White north, red east, wet south, burnt west. Keep the pines thin first. The board will tell you when the Watch wants you farther out.']]);
      this.storyBusy = false;
      save(st);
      return this.checkStory();
    }
  }

  // ---- the old crypt: its name as you come into the clearing, and its own say the first time ----
  nearCrypt(x, z) { const c = this.world.crypt; return !!c && Math.max(Math.abs(x - c.x), Math.abs(z - c.z)) <= c.r + 3; }
  cryptWatch() {
    const L = this.explore.leader, near = this.nearCrypt(L.x, L.z);
    if (near === this.inCrypt) return;
    this.inCrypt = near;
    if (!near) return;
    const kept = this.explore.foes.some((f) => f.z.boss);
    this.ui.banner(CRYPT.name, kept ? CRYPT.sub : CRYPT.quiet);
    if (this.st.flags.crypt) return;
    this.st.flags.crypt = true;
    this.ui.toast(CRYPT.first);
    if (this.st.party.includes('lisandra')) setTimeout(() => this.ui.toast(CRYPT.lisandra, 'Lisandra'), 2200);
  }

  // ---- talking to the world ----
  async interact(t) {
    const st = this.st;
    sfx.ui();
    if (t.kind === 'board') return this.ui.questPanel();
    if (t.kind === 'well') { sfx.well(); return this.ui.dialog([['', pick(WELL_LINES)]]); }
    if (t.kind === 'chest') {
      const c = t.chest;
      if (st.opened[c.id]) return;
      st.opened[c.id] = true;
      // the crypt's chest was somebody's grave goods: more gold, and better than the knolls give
      const gold = c.crypt ? 180 + Math.floor(Math.random() * 120) : 40 + Math.floor(Math.random() * 60);
      const it = makeItem(pick(Object.keys(WEAPONS)), tierForLevel(lead(st).lvl), c.crypt ? 2 + (Math.random() < 0.35 ? 1 : 0) : 1 + (Math.random() < 0.4 ? 1 : 0));
      st.gold += gold; addToBag(st, it);
      this.r.openChest(c.id);
      sfx.chest();
      note(st, 'find', `Opened a chest${c.crypt ? ' in the old crypt' : ''}: ${gold} gold and ${an(itemName(it))}.`);
      save(st);
      await this.ui.dialog([['', `${c.crypt ? CRYPT.chest : CHEST_LINE} Inside: ${gold} gold and a ${itemName(it)}.`]]);
      sfx.chestShut();
      this.banter.say('chest', { chance: 0.5 });
      this.explore.updatePrompt();
      return;
    }
    const n = t.npc;
    const line = n.lines[n.li++ % n.lines.length];
    if (!n.shop && !n.hero) return this.ui.dialog([[n.name, line]]);
    if (!n.shop) return this.recruitNpc(n);
    const opts = [[n.shop === 'inn' ? 'A bed, or a draught' : 'Trade', 'shop']];
    if (n.hero) opts.push(['Walk with me', 'join']);
    opts.push(['Leave', 'no']);
    const ans = await this.ui.dialog([[n.name, line]], opts);
    if (ans === 'shop') this.ui.shop(n.shop, n);
    else if (ans === 'join') this.recruitNpc(n, false);
  }

  // ---- fighting ----
  startBattle(foes, alerted, opts = {}) {
    this.ui.close();
    this.ui.setPrompt(null); this.ui.battleMode(true);
    this.mode = 'battle';
    this.bringRound(foes);
    this.battle = new Battle(this, foes, alerted, { kind: pickKind(this.st, foes), ...opts });
    this.ui.setAuto(null);
  }
  // The dead see through trees and walls, but a fight is held on a square round the leader, and one with no way
  // across it never ends. Whoever can't walk to the leader inside that square comes round first, to the nearest open
  // ground that can (the field is the leader's 8 tiles either way, stretched to take in the foes, as Battle makes it).
  bringRound(foes) {
    const w = this.world, ex = this.explore, L = ex.leader, N = w.N, K = (x, z) => z * N + x;
    for (let pass = 0; pass < 3; pass++) {
      let x0 = L.x - 8, x1 = L.x + 8, z0 = L.z - 8, z1 = L.z + 8;
      for (const f of foes) { x0 = Math.min(x0, f.x - 2); x1 = Math.max(x1, f.x + 2); z0 = Math.min(z0, f.zz - 2); z1 = Math.max(z1, f.zz + 2); }
      x0 = Math.max(0, x0); x1 = Math.min(N - 1, x1); z0 = Math.max(0, z0); z1 = Math.min(N - 1, z1);
      const open = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && w.walkable(x, z) && !ex.npcAt.has(K(x, z));
      const seen = new Set([K(L.x, L.z)]), q = [[L.x, L.z]];
      for (let i = 0; i < q.length; i++) {
        const [x, z] = q[i];
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Z = z + dz;
          if (seen.has(K(X, Z)) || !open(X, Z) || Math.abs(w.height(X, Z) - w.height(x, z)) > 2) continue;
          seen.add(K(X, Z)); q.push([X, Z]);
        }
      }
      const stuck = foes.filter((f) => !seen.has(K(f.x, f.zz)));
      if (!stuck.length) return;
      const taken = new Set(foes.map((f) => K(f.x, f.zz)));
      for (const f of stuck) {
        let best = null, bd = 1e9;
        // not on the few tiles round the leader where the party will be set out, unless there is nowhere else
        for (const room of [4, 2]) {
          for (const [x, z] of q) {
            if (Math.abs(x - L.x) > 8 || Math.abs(z - L.z) > 8 || taken.has(K(x, z)) || Math.abs(x - L.x) + Math.abs(z - L.z) < room) continue;
            const d = Math.abs(x - f.x) + Math.abs(z - f.zz);
            if (d < bd) { bd = d; best = [x, z]; }
          }
          if (best) break;
        }
        if (!best) continue;
        taken.delete(K(f.x, f.zz)); ex.foeAt.delete(K(f.x, f.zz));
        [f.x, f.zz] = best; f.tw = null;
        taken.add(K(f.x, f.zz)); ex.foeAt.set(K(f.x, f.zz), f);
        f.model.position.set(f.x, w.y(f.x, f.zz), f.zz);
      }
    }
  }
  // how: win | lose | flee | apart (a stalemate on Auto: nobody could get at anybody; see Battle.stalemate)
  endBattle(how, pos, slain, report = {}) {
    const st = this.st;
    if (how === 'apart') this.auto.noteApart(report.standing || []);
    this.battle = null; this.mode = 'explore';
    this.ui.battleMode(false);
    if (how === 'lose') {
      this.auto.noteLoss(pos.x, pos.z);
      restAll(st); st.day++;
      st.dread = Math.min(100, st.dread + 5);
      if (report.killer) this.makeRival(report.killer, report.where);
      this.newDay();
      const inn = this.world.buildings.find((b) => b.id === 'inn');
      this.explore.spawnFoes();
      this.explore.resume({ x: inn.front.x + 1, z: inn.front.z + 1 }, [], 2);
      this.ui.banner('Herrington Hollow', `Day ${st.day}`);
      sfx.gasp();
      setTimeout(() => this.banter.say('lost', { force: true }), 1500);
    } else {
      this.explore.resume(pos, slain, how === 'win' ? 2 : 6);
      if (how === 'win') setTimeout(() => this.banter.say(report.lords?.length ? 'lord' : report.close ? 'close' : 'won', { chance: report.lords?.length || report.close ? 1 : 0.5, force: true }), 900);
    }
    if (how === 'win') {
      for (const id of report.rivals || []) this.rivalDown(id);
      if (report.kind === 'gate') { st.dread = 40; note(st, 'dread', 'The gate held. The dead went back into the pines to think about it.'); }
      for (const id of report.lords || []) {
        st.dread = Math.max(0, st.dread - 30);
        st.boonDue = (st.boonDue || 0) + 1;
        if (!music.stinger('triumph')) sfx.level();
        void id;
      }
    }
    this.auto.reset();
    if (st.auto) this.autoEquip();
    const L = this.explore.leader;
    this.r.follow(L.x, this.world.y(L.x, L.z), L.z, 0, true);
    this.ui.refresh();
    save(st);
    this.checkStory().then(() => this.offerBoon());
  }
  // A lord's fall leaves a boon: three are offered, one is kept. Under auto-play the first is taken when the clock runs out.
  async offerBoon() {
    const st = this.st;
    while (st.boonDue > 0 && this.mode === 'explore') {
      const pickd = await this.ui.choose('A lord is down', 'What it was holding on to comes loose. Take one thing from it.', offerBoons(st).map((b) => ({ name: b.name, desc: b.desc, value: b })), 14);
      st.boonDue--;
      if (!pickd) continue;
      if (pickd.add) { st.boons.push(pickd.id); setBoons(st); this.fixAll(); }
      if (pickd.gold) st.gold += pickd.gold;
      if (pickd.consum) for (const k in pickd.consum) st.consum[k] = (st.consum[k] || 0) + pickd.consum[k];
      sfx.chime?.(); if (!music.stinger('found')) sfx.level();
      this.ui.banner(pickd.name, pickd.desc);
      note(st, 'boon', `Kept a boon: ${pickd.name}. ${pickd.desc}`);
      save(st);
    }
  }
  // ---- scores to settle: whichever of the dead did the most to put the party down gets a name, a level and a price ----
  makeRival(k, where) {
    const st = this.st;
    if (k.lord || String(k.id).startsWith('gate')) return;
    let r = st.rivals[k.id];
    const z = ZOMBIES[KIND[k.kind]];
    if (r) { r.wins++; r.lvl = Math.min(r.lvl + 1, k.lvl + 3); r.day = st.day; r.bounty = Math.round(r.bounty * 1.4); }
    else {
      const used = new Set(Object.values(st.rivals).map((o) => o.first));
      const first = pick(RIVAL_NAMES.filter((n) => !used.has(n)).concat(used.size >= RIVAL_NAMES.length ? RIVAL_NAMES : []));
      r = st.rivals[k.id] = { id: k.id, first, name: `${first}, the ${z.name.replace(/^The /, '')}`, kind: k.kind, lvl: k.lvl + 1, wins: 1, day: st.day, x: k.x, z: k.z, bounty: 120 + 45 * k.lvl, where: where ? `It walks ${where}.` : '' };
    }
    delete st.slain[k.id];                                  // it is out there tomorrow, whatever else is
    fresh(st).rivals[k.id] = 1;
    note(st, 'rival', `${r.name} has put you down ${r.wins === 1 ? 'once' : r.wins + ' times'}. The Watch has put ${r.bounty} gold on it.`);
    this.ui.chat.line('dread', '', `The Watch has a name for the one that did it: ${r.name}. ${r.bounty} gold on its head.`);
  }
  rivalDown(id) {
    const st = this.st, r = st.rivals[id];
    if (!r) return;
    st.gold += r.bounty; delete st.rivals[id]; delete fresh(st).rivals[id];
    st.dread = Math.max(0, st.dread - 6);
    sfx.coin(); if (!music.stinger('triumph')) sfx.level();
    this.ui.banner('A score settled', `${r.name} · ${r.bounty} gold from the Watch`);
    note(st, 'rival', `Settled the score with ${r.name}. ${r.bounty} gold from the Watch, paid without a word.`);
    this.auto.lost = this.auto.lost.filter((l) => Math.hypot(l.x - r.x, l.z - r.z) > 12);
  }

  // ---- auto-play spends the gold (Orders: what the purse is for). Each returns true if it bought something. ----
  // What would be bought next, and from whom: { npc, cost, why, buy } or null. Auto.goals asks; the errand's act does it.
  shopPlan() {
    const st = this.st, o = ordersOf(st), ex = this.explore, npc = (shop) => ex.npcs.find((n) => n.shop === shop);
    const keep = 30;                                         // a bed and a draught, always
    const afford = (c) => st.gold >= c + keep;
    // draughts first, whatever the purse is for (unless it is being saved)
    if (o.purse !== 'save') {
      for (const [k, want] of [['potion', 3], ['ether', 2]]) if ((st.consum[k] || 0) < want && afford(CONSUMABLES[k].price) && npc('inn'))
        return { npc: npc('inn'), why: `${CONSUMABLES[k].name}s are low`, buy: () => { let n = 0; while ((st.consum[k] || 0) < want && afford(CONSUMABLES[k].price)) { st.gold -= CONSUMABLES[k].price; st.consum[k] = (st.consum[k] || 0) + 1; n++; } return `Bought ${n} ${CONSUMABLES[k].name}${n > 1 ? 's' : ''} at The Last Toll.`; } };
    }
    if (o.purse === 'kit') {
      let best = null;
      for (const shop of ['weapons', 'armor', 'rings']) {
        if (!npc(shop)) continue;
        for (const it of this.ui.stock(shop)) {
          const cost = itemValue(it);
          if (!afford(cost) || st.bag.length >= st.bagSize) continue;
          for (const h of partyHeroes(st)) {
            const slot = upgradeSlot(h, it);
            if (!slot) continue;
            const gain = (itemWorth(h, it) - itemWorth(h, h.equip[slot])) / Math.max(20, cost);
            if (itemWorth(h, it) - itemWorth(h, h.equip[slot]) >= 3 && (!best || gain > best.gain)) best = { gain, shop, it, h, cost };
          }
        }
      }
      if (best) return { npc: npc(best.shop), why: `${an(itemName(best.it))} for ${best.h.name.split(' ')[0]}`, buy: () => { const L = this.ui.stock(best.shop); if (!L.includes(best.it) || st.gold < best.cost) return null; L.splice(L.indexOf(best.it), 1); st.gold -= best.cost; addToBag(st, best.it); this.autoEquip(); return `Bought ${an(itemName(best.it))} for ${best.h.name.split(' ')[0]}: ${best.cost} gold.`; } };
    }
    if (o.purse === 'forge' && npc('enhance')) {
      const cand = partyHeroes(st).map((h) => h.equip.weapon).filter((it) => it && it.plus < 10).sort((a, b) => a.plus - b.plus)[0];
      if (cand && afford(enhanceCost(cand))) return { npc: npc('enhance'), why: `the ${itemName(cand)} hammered`, buy: () => { const c = enhanceCost(cand); if (st.gold < c) return null; st.gold -= c; cand.plus++; this.fixAll(); sfx.forge(); return `Had the ${itemName(cand)} hammered to +${cand.plus}: ${c} gold.`; } };
    }
    return null;
  }
  autoShop() {
    const p = this.shopPlan();
    if (!p) return;
    const said = p.buy();
    if (!said) return;
    sfx.coin();
    this.ui.chat.line('auto', '', said); note(this.st, 'shop', said);
    this.banter.say('shop', { chance: 0.4 });
    save(this.st);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  title.status('Waking the Hollow…');
  await loadManifest();
  try { await document.fonts.load('700 40px Cinzel'); } catch { /* the fallback font will do */ }
  window.game = new Game();
});
export { PARTY_MAX, SLOTS, RARITY };
