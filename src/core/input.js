// Keys, the on-screen d-pad, and the two ways the d-pad can map onto an isometric grid.
//
// On screen the grid's four directions are the four diagonals. Each d-pad press has to pick one:
//   mode A: Left = down-left,  Down = down-right, Right = up-right,  Up = up-left
//   mode B: Left = up-left,    Up = up-right,     Right = down-right, Down = down-left
// (tile deltas: down-left is +z, down-right +x, up-right -z, up-left -x)
export const DPAD = {
  A: { left: [0, 1], down: [1, 0], right: [0, -1], up: [-1, 0] },
  B: { left: [-1, 0], up: [0, -1], right: [1, 0], down: [0, 1] },
};
export const DPAD_HINT = { A: 'Left goes down-left', B: 'Left goes up-left' };

const KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down',
};

export class Input {
  constructor() {
    this.held = [];          // directions held, most recent last
    this.handlers = {};
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      const d = KEYS[e.key];
      if (d) { this.press(d); e.preventDefault(); return; }
      if (e.repeat) return;
      if (e.key === ' ') { this.emit('jump'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') this.emit('act');
      else if (e.key === 'Escape' || e.key === 'Backspace') this.emit('back');
      else if (e.key === 'p' || e.key === 'P') this.emit('auto');
      else if (e.key === 'f' || e.key === 'F') this.emit('speed');
      else if (e.key === 'Tab') { this.emit('menu'); e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => { const d = KEYS[e.key]; if (d) this.release(d); });
    window.addEventListener('blur', () => { this.held.length = 0; });
  }
  on(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, arg) { for (const fn of this.handlers[name] || []) fn(arg); }
  press(d) { if (!this.held.includes(d)) { this.held.push(d); this.emit('dir', d); } }
  release(d) { const i = this.held.indexOf(d); if (i >= 0) this.held.splice(i, 1); }
  dir() { return this.held[this.held.length - 1] || null; }

  // Wire up touch/mouse buttons: data-dir="left" etc., data-btn="jump" | "act" | "back".
  bindPad(root) {
    for (const b of root.querySelectorAll('[data-dir]')) {
      const d = b.dataset.dir;
      const down = (e) => { e.preventDefault(); this.press(d); b.classList.add('on'); };
      const up = (e) => { e.preventDefault(); this.release(d); b.classList.remove('on'); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    }
    for (const b of root.querySelectorAll('[data-btn]')) {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.emit(b.dataset.btn); });
    }
  }
}
