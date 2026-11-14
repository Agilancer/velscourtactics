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
import { loadManifest } from './gfx/models.js';
import { HEROES, OPENING, WELL_LINES, CHEST_LINE, CRYPT } from './data/cast.js';
import { QUESTS } from './data/enemies.js';
import { CLASSES } from './data/classes.js';
import { WEAPONS, makeItem, itemStats, itemName, tierForLevel, RARITY } from './data/items.js';
import { PARTY_MAX, SLOTS, newState, load, save, recruit, restAll, startQuest, questReady, heroStats, canEquip, slotsFor, gainXp, lead, partyHeroes } from './game/party.js';
import { sound, sfx } from './core/audio.js';
import { music } from './core/music.js';
import { ambience } from './core/ambience.js';
import { title } from './ui/title.js';
import { pick } from './core/util.js';

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
    this.r.tick(dt);
    this.r.fx.pace = pace;
    this.r.fx.update(real * pace);
    this.r.fx.shaken(() => this.r.render());
    dt = real;
    const set = this.place(), fight = this.mode === 'battle' || this.mode === 'alert';
    music.update(dt, { set, fight });
    ambience.update(dt, { on: !!this.explore && !title.up, set, fight, ear: this.r.target, world: this.world });
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
    this.st = st;
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
    this.ui.refresh(); save(this.st);
    if (this.st.auto) { if (this.mode === 'menu') this.ui.close(); if (this.battle) this.battle.takeOver(); if (this.mode === 'talk') this.ui.onAct?.(); }
  }
  autoPause() { if (this.st?.auto) this.auto.hold(); }
  // Wear whatever in the bag is plainly better.
  autoEquip() {
    const st = this.st;
    const worth = (h, it) => {
      if (!it) return 0;
      const C = CLASSES[h.cls], w = h.equip.weapon, usesMag = (w && WEAPONS[w.kind].stat === 'mag') || C.primary === 'int';
      const s = itemStats(it), W = { atk: usesMag ? 0.3 : 2, mag: usesMag ? 2 : 0.3, def: 1, res: 1, hp: 0.25, mp: 0.15, spd: 3, crit: 0.5, leech: 0.5 };
      let v = 0; for (const k in s) v += s[k] * (W[k] || 0); return v;
    };
    for (const h of partyHeroes(st)) for (const it of [...st.bag]) {
      if (!canEquip(h, it)) continue;
      const slot = slotsFor(it).reduce((a, b) => (worth(h, h.equip[a]) <= worth(h, h.equip[b]) ? a : b));
      if (worth(h, it) > worth(h, h.equip[slot]) + 0.01) {
        st.bag.splice(st.bag.indexOf(it), 1);
        if (h.equip[slot]) st.bag.push(h.equip[slot]);
        h.equip[slot] = it; this.fixHp(h);
        this.ui.toast(`${h.name.split(' ')[0]} puts on the ${itemName(it)}.`);
        sfx.equip(it);
      }
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
    this.partyChanged();
    await this.ui.dialog([[d.name, d.join]]);
    save(st);
  }
  rest() {
    const st = this.st;
    st.day++; restAll(st); st.stock = {};
    this.explore.spawnFoes();
    sfx.bell();
    this.ui.banner(`Day ${st.day}`, 'Everyone wakes whole. So does everything in the pines.');
    save(st);
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
    for (const h of partyHeroes(st)) if (gainXp(h, q.xp)) this.ui.toast(`${h.name.split(' ')[0]} reaches level ${h.lvl}.`);
    if (q.reward === 'potion3') st.consum.potion += 3;
    if (q.reward === 'rare') { const it = makeItem(CLASSES[lead(st).cls].weapon[0], tierForLevel(lead(st).lvl), 2); if (st.bag.length < st.bagSize) st.bag.push(it); this.ui.toast(`The Watch hands over a ${itemName(it)}.`); }
    sfx.coin(); if (!music.stinger('triumph')) sfx.level();
    this.ui.banner('Done: ' + q.name, `${q.gold} gold · ${q.xp} experience`);
    save(st);
  }
  boardAuto() {
    const st = this.st;
    for (const q of QUESTS) if (q.from === 'board') { if (!st.quests[q.id]) startQuest(st, q.id); if (questReady(st, q)) this.claimQuest(q); }
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
    if (t.kind === 'board') return this.ui.questPanel(true);
    if (t.kind === 'well') { sfx.well(); return this.ui.dialog([['', pick(WELL_LINES)]]); }
    if (t.kind === 'chest') {
      const c = t.chest;
      if (st.opened[c.id]) return;
      st.opened[c.id] = true;
      // the crypt's chest was somebody's grave goods: more gold, and better than the knolls give
      const gold = c.crypt ? 180 + Math.floor(Math.random() * 120) : 40 + Math.floor(Math.random() * 60);
      const it = makeItem(pick(Object.keys(WEAPONS)), tierForLevel(lead(st).lvl), c.crypt ? 2 + (Math.random() < 0.35 ? 1 : 0) : 1 + (Math.random() < 0.4 ? 1 : 0));
      st.gold += gold; if (st.bag.length < st.bagSize) st.bag.push(it);
      this.r.openChest(c.id);
      sfx.chest();
      save(st);
      await this.ui.dialog([['', `${c.crypt ? CRYPT.chest : CHEST_LINE} Inside: ${gold} gold and a ${itemName(it)}.`]]);
      sfx.chestShut();
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
  startBattle(foes, alerted) {
    this.ui.close();
    this.ui.setPrompt(null); this.ui.battleMode(true);
    this.mode = 'battle';
    this.bringRound(foes);
    this.battle = new Battle(this, foes, alerted);
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
  endBattle(how, pos, slain) {
    const st = this.st;
    this.battle = null; this.mode = 'explore';
    this.ui.battleMode(false);
    if (how === 'lose') {
      this.auto.noteLoss(pos.x, pos.z);
      restAll(st); st.day++;
      const inn = this.world.buildings.find((b) => b.id === 'inn');
      this.explore.spawnFoes();
      this.explore.resume({ x: inn.front.x + 1, z: inn.front.z + 1 }, [], 2);
      this.ui.banner('Herrington Hollow', `Day ${st.day}`);
      sfx.gasp();
    } else this.explore.resume(pos, slain, how === 'flee' ? 6 : 2);
    this.auto.reset();
    if (st.auto) this.autoEquip();
    const L = this.explore.leader;
    this.r.follow(L.x, this.world.y(L.x, L.z), L.z, 0, true);
    this.ui.refresh();
    save(st);
    this.checkStory();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  title.status('Waking the Hollow…');
  await loadManifest();
  try { await document.fonts.load('700 40px Cinzel'); } catch { /* the fallback font will do */ }
  window.game = new Game();
});
export { PARTY_MAX, SLOTS, RARITY };
