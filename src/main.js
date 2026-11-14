// VELSCOUR TACTICS. Boots the world, then hands over to whichever of walking, talking or fighting is going on.
import { buildWorld } from './world/map.js';
import { Renderer } from './world/render.js';
import { Input } from './core/input.js';
import { UI } from './ui/ui.js';
import { Explore } from './game/explore.js';
import { Battle } from './game/battle.js';
import { Auto } from './game/auto.js';
import { loadManifest } from './gfx/models.js';
import { HEROES, OPENING, WELL_LINES, CHEST_LINE } from './data/cast.js';
import { QUESTS } from './data/enemies.js';
import { CLASSES } from './data/classes.js';
import { WEAPONS, makeItem, itemStats, itemName, tierForLevel, RARITY } from './data/items.js';
import { PARTY_MAX, SLOTS, newState, load, save, recruit, restAll, startQuest, questReady, heroStats, canEquip, slotsFor, gainXp, lead, partyHeroes } from './game/party.js';
import { sfx } from './core/audio.js';
import { pick } from './core/util.js';

class Game {
  constructor() {
    this.world = buildWorld();
    this.canvas = document.getElementById('view');
    this.r = new Renderer(this.canvas, this.world);
    this.input = new Input();
    this.ui = new UI(this);
    this.mode = 'title';          // title | explore | alert | battle | talk | menu
    this.tweens = [];
    this.st = null; this.explore = null; this.battle = null;
    this.auto = new Auto(this);
    this.hudT = 0;
    // a slow look round the Hollow behind the title
    this.r.follow(this.world.well.x, 0, this.world.well.z, 0, true);

    this.input.on('jump', () => { if (this.mode === 'explore') { if (this.explore.step) this.explore.jumpQueued = true; else if (!this.input.dir()) this.explore.hopInPlace(); else this.explore.jumpQueued = true; this.autoPause(); } else if (this.mode === 'battle') this.battle.back(); });
    this.input.on('act', () => { if (this.mode === 'talk') this.ui.onAct?.(); else if (this.mode === 'battle') this.battle.confirm(); else if (this.mode === 'explore') this.explore.interact(); });
    this.input.on('back', () => { if (this.mode === 'menu') this.ui.close(); else if (this.mode === 'battle') this.battle.back(); });
    this.input.on('menu', () => { if (this.mode === 'explore') this.ui.openPanel('party'); else if (this.mode === 'menu') this.ui.close(); });
    this.input.on('auto', () => this.toggleAuto());
    this.input.on('dir', (d) => { if (this.mode === 'battle') this.battle.dir(d); });
    this.canvas.addEventListener('pointermove', (e) => { if (this.mode === 'battle') this.battle.pointer(e.clientX, e.clientY, false); });
    this.canvas.addEventListener('pointerdown', (e) => { if (this.mode === 'battle') this.battle.pointer(e.clientX, e.clientY, true); });
    window.addEventListener('wheel', (e) => { if (!this.ui.isOpen()) this.r.setZoom(this.r.zoom + Math.sign(e.deltaY) * 1.2); }, { passive: true });

    this.ui.title(!!load());
    let last = performance.now();
    const frame = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.update(dt); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  tween(dur, fn) { return new Promise((res) => this.tweens.push({ t: 0, dur: dur / (this.st?.auto ? 1.6 : 1), fn, res })); }

  update(dt) {
    for (const tw of this.tweens) { tw.t = Math.min(1, tw.t + dt / tw.dur); tw.fn(tw.t); if (tw.t >= 1) tw.res(); }
    this.tweens = this.tweens.filter((tw) => tw.t < 1);
    if (this.mode === 'title') { const t = performance.now() / 9000; this.r.follow(this.world.well.x + Math.cos(t) * 9, 0, this.world.well.z + Math.sin(t) * 7, dt); }
    else if (this.battle) this.battle.update(dt);
    else if (this.explore) { this.auto.update(dt); this.explore.update(dt); }
    this.r.render();
    if ((this.hudT -= dt) <= 0 && this.st) { this.hudT = 0.25; this.ui.refresh(); }
  }

  // ---- starting ----
  newGame(who) { this.begin(newState(who)); }
  continueGame() { this.begin(load()); }
  begin(st) {
    this.st = st;
    this.explore = new Explore(this);
    this.mode = 'explore';
    this.ui.showHud(true); this.ui.refresh();
    const L = this.explore.leader;
    this.r.follow(L.x, 0, L.z, 0, true);
    this.explore.inTown = this.world.inTown(L.x, L.z);
    this.explore.updatePrompt();
    if (!st.flags.opened) this.opening();
    else this.ui.banner(this.explore.inTown ? 'Herrington Hollow' : 'The Pines', `Day ${st.day}`);
    this.ui.setAuto(st.auto ? 'Thinking' : null);
  }
  async opening() {
    const st = this.st;
    await this.ui.dialog(OPENING);
    st.flags.opened = true;
    recruit(st, 'lisandra');
    startQuest(st, 'first');
    this.partyChanged();
    this.ui.banner('What Walks in the Pines', 'Put down two of the dead, south of the road');
    this.ui.toast('Remember: the stand-in figures are placeholders until the Meshy models arrive.');
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
    sfx.level();
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
    st.consum[k]--; sfx.heal();
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
    sfx.coin(); sfx.level();
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
      else await this.ui.dialog([['Lisandra', 'Three roads out of the Hollow, and every one of them goes nowhere. Yet. Keep the pines thin while we wait to see where they lead.']]);
      this.storyBusy = false;
      save(st);
      return this.checkStory();
    }
  }

  // ---- talking to the world ----
  async interact(t) {
    const st = this.st;
    sfx.ui();
    if (t.kind === 'board') return this.ui.questPanel(true);
    if (t.kind === 'well') return this.ui.dialog([['', pick(WELL_LINES)]]);
    if (t.kind === 'chest') {
      st.opened[t.chest.id] = true;
      const gold = 40 + Math.floor(Math.random() * 60), it = makeItem(pick(Object.keys(WEAPONS)), tierForLevel(lead(st).lvl), 1 + (Math.random() < 0.4 ? 1 : 0));
      st.gold += gold; if (st.bag.length < st.bagSize) st.bag.push(it);
      this.r.chests[t.chest.id].children[1].rotation.x = -0.9;
      sfx.coin();
      await this.ui.dialog([['', `${CHEST_LINE} Inside: ${gold} gold and a ${itemName(it)}.`]]);
      this.explore.updatePrompt(); save(st);
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
    this.battle = new Battle(this, foes, alerted);
  }
  endBattle(how, pos, slain) {
    const st = this.st;
    this.battle = null; this.mode = 'explore';
    this.ui.battleMode(false);
    if (how === 'lose') {
      restAll(st); st.day++;
      const inn = this.world.buildings.find((b) => b.id === 'inn');
      this.explore.spawnFoes();
      this.explore.resume({ x: inn.front.x + 1, z: inn.front.z + 1 }, [], 2);
      this.ui.banner('Herrington Hollow', `Day ${st.day}`);
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
  await loadManifest();
  try { await document.fonts.load('700 40px Cinzel'); } catch { /* the fallback font will do */ }
  window.game = new Game();
});
export { PARTY_MAX, SLOTS, RARITY };
