// Touch on the map: two fingers pinch the view in and out; one finger that goes down and comes up again without
// wandering is a tap. A mouse button is a tap the moment it goes down, as it always was.
//
//   new Touches(canvas, { zoom: () => r.zoom, setZoom: (z) => r.setZoom(z), tap: (x, y) => ..., hover: (x, y) => ... })
export class Touches {
  constructor(target, { zoom, setZoom, tap, hover }) {
    this.pts = new Map();          // pointer id -> {x, y, sx, sy}
    this.pinch = null;             // {d0, z0} while two fingers are down
    this.spoilt = false;           // this gesture pinched, so lifting a finger is not a tap
    const dist = () => { const [a, b] = [...this.pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
    target.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') { tap(e.clientX, e.clientY); return; }
      try { target.setPointerCapture?.(e.pointerId); } catch { /* a pointer that has already gone */ }
      this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      if (this.pts.size === 1) this.spoilt = false;
      if (this.pts.size === 2) { this.pinch = { d0: dist(), z0: zoom() }; this.spoilt = true; }
      else if (this.pts.size === 1) hover(e.clientX, e.clientY);
    });
    target.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') { hover(e.clientX, e.clientY); return; }
      const p = this.pts.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pinch && this.pts.size >= 2) setZoom(this.pinch.z0 * this.pinch.d0 / dist());
      else if (this.pts.size === 1 && !this.spoilt) hover(e.clientX, e.clientY);
    });
    const up = (e) => {
      const p = this.pts.get(e.pointerId);
      if (!p) return;
      this.pts.delete(e.pointerId);
      if (this.pts.size < 2) this.pinch = null;
      if (e.type === 'pointerup' && !this.spoilt && !this.pts.size && Math.hypot(p.x - p.sx, p.y - p.sy) < 14) tap(e.clientX, e.clientY);
    };
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
    // a trackpad's pinch arrives as a wheel with Ctrl held: zoom by how far it went, and keep the page itself still
    target.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(zoom() * Math.exp(e.deltaY * 0.01));
    }, { passive: false });
  }
  get busy() { return this.pts.size > 1; }
}
