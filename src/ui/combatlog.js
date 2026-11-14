// The fight's running account: a framed window that keeps the whole fight, scrolls, and can be resized by its corner.
// The gear on its title bar opens the reader's own settings (letter size, how dark the window is, its size), kept
// in this browser only (one set for a phone-sized screen, one for the rest) since they are a reader's taste, not the save.
import { el } from '../core/util.js';

const KEY = 'velscour-tactics-log';
const KEEP = 240;
const narrow = () => window.matchMedia('(max-width: 760px)').matches;
const DEFAULTS = { desk: { w: 470, h: 210, font: 15, shade: 0.82, min: false }, mob: { w: 0, h: 92, font: 13, shade: 0.82, min: true } };
const GEAR = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>';

function loadPrefs() {
  let all = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { all = {}; }
  return { desk: { ...DEFAULTS.desk, ...(all.desk || {}) }, mob: { ...DEFAULTS.mob, ...(all.mob || {}) } };
}

export class CombatLog {
  constructor(parent) {
    this.prefs = loadPrefs();
    this.el = el('div', 'bt-log');
    this.el.innerHTML = `<div class="lg-head"><span class="lg-title">The fight so far</span><button class="lg-btn lg-min" title="Fold the log away"></button><button class="lg-btn lg-gear" title="Log settings">${GEAR}</button></div>
      <div class="lg-body"></div><div class="lg-grip" title="Drag to resize"></div>
      <div class="lg-set hide">
        <label>Letter size <b class="lg-fv"></b></label>
        <div class="lg-row"><button class="lg-btn lg-fdn">A−</button><input class="lg-font" type="range" min="11" max="30" step="1"><button class="lg-btn lg-fup">A+</button></div>
        <label>Window shade <b class="lg-sv"></b></label>
        <div class="lg-row"><input class="lg-shade" type="range" min="0.2" max="1" step="0.05"></div>
        <label>Size</label>
        <div class="lg-row lg-sizes"><button class="lg-btn" data-sz="s">Small</button><button class="lg-btn" data-sz="m">Medium</button><button class="lg-btn" data-sz="l">Large</button></div>
        <div class="lg-row"><button class="lg-btn lg-reset">Reset</button><button class="lg-btn lg-close">Done</button></div>
      </div>`;
    parent.append(this.el);
    const $ = (s) => this.el.querySelector(s);
    this.body = $('.lg-body'); this.set = $('.lg-set');
    $('.lg-gear').onclick = (e) => { e.stopPropagation(); this.set.classList.toggle('hide'); this.syncInputs(); };
    $('.lg-close').onclick = () => this.set.classList.add('hide');
    $('.lg-min').onclick = () => { this.p.min = !this.p.min; this.apply(); this.save(); };
    $('.lg-head').addEventListener('dblclick', () => { this.p.min = !this.p.min; this.apply(); this.save(); });
    const font = $('.lg-font'), shade = $('.lg-shade');
    font.oninput = () => { this.p.font = +font.value; this.apply(); };
    font.onchange = () => this.save();
    shade.oninput = () => { this.p.shade = +shade.value; this.apply(); };
    shade.onchange = () => this.save();
    $('.lg-fdn').onclick = () => { this.p.font = Math.max(11, this.p.font - 1); this.apply(); this.save(); };
    $('.lg-fup').onclick = () => { this.p.font = Math.min(30, this.p.font + 1); this.apply(); this.save(); };
    for (const b of this.el.querySelectorAll('[data-sz]')) b.onclick = () => {
      const m = narrow(), S = { s: m ? [0, 70] : [340, 130], m: m ? [0, 120] : [470, 210], l: m ? [0, 220] : [Math.min(720, innerWidth * 0.6), Math.min(420, innerHeight * 0.55)] }[b.dataset.sz];
      this.p.w = S[0]; this.p.h = S[1]; this.p.min = false; this.apply(); this.save();
    };
    $('.lg-reset').onclick = () => { this.prefs[this.mode] = { ...DEFAULTS[this.mode] }; this.apply(); this.save(); this.syncInputs(); };
    this.grip($('.lg-grip'));
    this.el.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
    this.onResize = () => this.apply();
    window.addEventListener('resize', this.onResize);
    this.apply();
  }
  get mode() { return narrow() ? 'mob' : 'desk'; }
  get p() { return this.prefs[this.mode]; }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.prefs)); } catch { /* the settings just won't outlast the page */ } }
  syncInputs() {
    const $ = (s) => this.el.querySelector(s);
    $('.lg-font').value = this.p.font; $('.lg-shade').value = this.p.shade;
    $('.lg-fv').textContent = this.p.font + ' px'; $('.lg-sv').textContent = Math.round(this.p.shade * 100) + '%';
  }
  apply() {
    const p = this.p, m = narrow(), s = this.el.style;
    s.setProperty('--lg-font', p.font + 'px');
    s.setProperty('--lg-shade', p.shade);
    // on a phone it runs across the top under the turn order and grows downward; elsewhere it sits bottom left
    s.width = m ? '' : Math.round(Math.max(240, Math.min(p.w, innerWidth - 24))) + 'px';
    // a short screen (a phone on its side) keeps more of the field in view
    this.body.style.height = Math.round(Math.max(54, Math.min(p.h, innerHeight * (m ? 0.5 : innerHeight < 560 ? 0.36 : 0.8)))) + 'px';
    this.el.classList.toggle('min', !!p.min);
    this.el.querySelector('.lg-min').textContent = p.min ? '▴' : '▾';
    this.el.querySelector('.lg-min').title = p.min ? 'Open the log' : 'Fold the log away';
    this.el.querySelector('.lg-title').innerHTML = p.min && this.last ? this.last : 'The fight so far';
    if (!this.set.classList.contains('hide')) this.syncInputs();
    this.stick();
  }
  // the corner handle: drag it to make the window bigger or smaller (works with a finger too)
  grip(h) {
    let sx = 0, sy = 0, w0 = 0, h0 = 0, id = null;
    h.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      id = e.pointerId; h.setPointerCapture(id);
      sx = e.clientX; sy = e.clientY; w0 = this.el.offsetWidth; h0 = this.body.offsetHeight;
      this.p.min = false; this.el.classList.remove('min');
    });
    h.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const top = narrow();                      // anchored at the top on a phone, at the bottom elsewhere
      if (!top) this.p.w = w0 + (e.clientX - sx);
      this.p.h = h0 + (top ? 1 : -1) * (e.clientY - sy);
      this.apply();
    });
    const up = (e) => { if (e.pointerId !== id) return; id = null; this.save(); };
    h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
  }
  // keep the newest line in view, unless the reader has scrolled back to look at something
  stick(force) { const b = this.body; if (force || b.scrollHeight - b.scrollTop - b.clientHeight < 60) b.scrollTop = b.scrollHeight; }
  add(html, cls = '') {
    const near = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 60;
    this.body.append(el('div', 'lg-line ' + cls, html));
    while (this.body.children.length > KEEP) this.body.firstChild.remove();
    if (near) this.body.scrollTop = this.body.scrollHeight;
    this.last = html;
    if (this.p.min) this.el.querySelector('.lg-title').innerHTML = html;
  }
  remove() { window.removeEventListener('resize', this.onResize); this.el.remove(); }
}
