// Who's who at a glance: the party and the dead each lit at their edges in a colour of their own, and drawn round with a
// thin line of it, with a ring round the shadow at their feet, so a dark figure still reads on dark ground.
//
// The edge light is a rim the camera sees: the more a surface turns away from the view, the more of the side's colour it
// takes, and that is where a figure meets what's behind it. Under it the figure's darks are lifted a little (`lift`) and
// it is lit a little more (`gain`); the shading and the pictures are still the models' own.
//
// The line is drawn over the world: the figures go into a mask (the party red, the dead green), and a pass over the part of
// the screen they're in colours what lies a pixel or two outside it. Nothing in front hides it, so someone behind a wall
// or a ledge still shows as their outline. A figure that is down (dead, or lying in wait in the needles) loses its rim and
// line; the lift stays.
//
// Each figure gets its own copies of whatever it shares with others (its gear, a stand-in's paints), so one of them
// going down dims only that one.
import * as THREE from 'three';

// rim: the edge light's colour; line: the outline's and the ring's; layer: the camera layer the mask is drawn from
export const SIDES = {
  party: { rim: 0x9fc4ff, line: 0xbfdcff, layer: 1 },
  foe: { rim: 0xc8ff7a, line: 0xe0ff8a, layer: 2 },
};
// read every frame, so they can be tried out from the console: (await import('./src/gfx/outline.js')).LOOK.rim = 0.7
export const LOOK = {
  rim: 0.5,      // how strong the edge light is
  pow: 3.5,      // how tight to the edge it keeps
  gain: 1.15,    // how much more light a figure takes than the ground
  lift: 0.85,    // the figure's own colours to this power (under 1 lifts the darks)
  width: 1.5,    // the line, in CSS pixels
};
const NEAR = 4;  // figures further than the zoom twice over plus this many tiles from the view's middle are let be

/** Puts a figure on a side ('party' or 'foe'); anything else in the world is left as it is. */
export function setSide(model, side) { model.userData.side = side; return model; }

const LIT = (m) => m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial);
const whose = new WeakMap();    // material -> the figure it belongs to
const edges = new WeakMap();    // material -> { fn, u }: its edge light, and the onBeforeCompile that put it there
const copies = new WeakMap();   // figure -> Map(shared material -> the figure's own copy)

// the figure's own material for m: a body's own (models.js marks them) is taken as it is, the rest copied once
function own(fig, m) {
  if (whose.get(m) === fig) return m;
  if (m.userData.own && !whose.has(m)) { whose.set(m, fig); return m; }
  let mine = copies.get(fig);
  if (!mine) copies.set(fig, (mine = new Map()));
  let c = mine.get(m);
  if (!c) { c = m.clone(); whose.set(c, fig); mine.set(m, c); }
  return c;
}

// the edge light, written into a material's shader on top of whatever is already there (gfx/dye.js puts the dyes in)
function edgeOf(m) {
  const e = edges.get(m);
  if (e && m.onBeforeCompile === e.fn) return e.u;
  const u = { edgeRim: { value: new THREE.Color(0, 0, 0) }, edgePow: { value: LOOK.pow }, edgeGain: { value: 1 }, edgeLift: { value: 1 } };
  const before = m.onBeforeCompile, key = m.customProgramCacheKey();
  const fn = (sh, gl) => {
    before.call(m, sh, gl);
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = 'uniform vec3 edgeRim;\nuniform float edgePow, edgeGain, edgeLift;\n' + sh.fragmentShader
      .replace('#include <emissivemap_fragment>', 'diffuseColor.rgb = pow(max(diffuseColor.rgb, 0.0), vec3(edgeLift));\n#include <emissivemap_fragment>')
      // the camera looks straight down the view's z, so a normal with little z is one turned side-on to it
      .replace('#include <opaque_fragment>', 'outgoingLight = outgoingLight * edgeGain + edgeRim * pow(1.0 - abs(normalize(normal).z), edgePow);\n#include <opaque_fragment>');
  };
  m.onBeforeCompile = fn;
  m.customProgramCacheKey = () => key + '|edge';
  m.needsUpdate = true;
  edges.set(m, { fn, u });
  return u;
}

const VERT = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
// Outside the mask, the strongest of the side colours found a line's width away (twelve ways round) and half of it
// (six), the outer ones a little softer. Inside it, nothing: the figure is already drawn.
const FRAG = `
uniform sampler2D mask;
uniform vec2 texel;
uniform float width;
uniform vec3 party, foe;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(mask, vUv);
  if (c.r + c.g > 0.5) discard;
  float p = 0.0, f = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    vec2 d = vec2(cos(a), sin(a)) * texel * width;
    vec4 s = texture2D(mask, vUv + d);
    p = max(p, s.r * 0.8); f = max(f, s.g * 0.8);
    if (i - (i / 2) * 2 == 0) { s = texture2D(mask, vUv + d * 0.5); p = max(p, s.r); f = max(f, s.g); }
  }
  float a = max(p, f);
  if (a < 0.02) discard;
  gl_FragColor = vec4(p >= f ? party : foe, a * 0.95);
  #include <colorspace_fragment>
}`;

export class Edges {
  constructor(r) {
    this.r = r;
    this.t = performance.now();
    this.live = 0;
    this.lo = new THREE.Vector2(); this.hi = new THREE.Vector2();
    this.rimCol = {};
    for (const k in SIDES) this.rimCol[k] = new THREE.Color(SIDES[k].rim);
    this.mask = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.paint = {
      party: new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }),
      foe: new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }),
    };
    this.line = new THREE.ShaderMaterial({
      uniforms: { mask: { value: this.mask.texture }, texel: { value: new THREE.Vector2() }, width: { value: LOOK.width },
        party: { value: new THREE.Color(SIDES.party.line) }, foe: { value: new THREE.Color(SIDES.foe.line) } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.line);
    quad.frustumCulled = false;
    this.pass = new THREE.Scene(); this.pass.add(quad);
    this.flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.size = new THREE.Vector2(); this.css = new THREE.Vector2(); this.clear = new THREE.Color(); this.v = new THREE.Vector3();
  }

  // Before the world is drawn (the camera placed): each figure on a side near the view gets its edge light, and its
  // meshes the mask's layer if it's up; and where on the screen they all are, for the line.
  update() {
    const r = this.r, cam = r.cam, T = r.target, now = performance.now(), R = r.zoom * 2 + NEAR;
    const k1 = 1 - Math.exp(-Math.min(0.1, (now - this.t) / 1000) * 6);
    this.t = now; this.live = 0;
    this.lo.set(Infinity, Infinity); this.hi.set(-Infinity, -Infinity);
    const v = this.v;
    for (const fig of r.units.children) {
      const side = SIDES[fig.userData.side];
      if (!side || !fig.visible) continue;
      const p = fig.position;
      if (Math.abs(p.x - T.x) > R || Math.abs(p.z - T.z) > R) continue;
      const up = fig.userData.anim?.state === 'dead' ? 0 : 1, u = fig.userData;
      u.edge = u.edge == null ? up : u.edge + (up - u.edge) * k1;
      const k = u.edge, lined = k > 0.5, rim = this.rimCol[fig.userData.side];
      fig.traverse((o) => {
        if (!o.isMesh || o.userData.hull) return;
        if (lined) o.layers.enable(side.layer); else o.layers.disable(side.layer);
        if (o.userData.disc) return;                    // the shadow: in the mask (the ring), but not lit
        if (Array.isArray(o.material)) { for (let i = 0; i < o.material.length; i++) o.material[i] = this.dress(fig, o.material[i], rim, k); }
        else o.material = this.dress(fig, o.material, rim, k);
      });
      if (!lined) continue;
      this.live++;
      const h = (u.height || 1.8) * fig.scale.y + 0.3;
      for (const y of [0, h]) {
        v.set(p.x, p.y + y, p.z).project(cam);
        this.lo.min(v); this.hi.max(v);
      }
    }
  }
  dress(fig, m, rim, k) {
    if (!LIT(m)) return m;
    const c = own(fig, m), u = edgeOf(c);
    u.edgeRim.value.copy(rim).multiplyScalar(LOOK.rim * k);
    u.edgePow.value = LOOK.pow; u.edgeGain.value = LOOK.gain; u.edgeLift.value = LOOK.lift;
    return c;
  }

  // After the world is drawn: the mask, then the line over the part of the screen the figures are in.
  draw() {
    if (!this.live) return;
    const r = this.r, gl = r.gl, scene = r.scene, cam = r.cam;
    gl.getDrawingBufferSize(this.size);
    if (this.mask.width !== this.size.x || this.mask.height !== this.size.y) this.mask.setSize(this.size.x, this.size.y);
    const kids = scene.children, bg = scene.background, layers = cam.layers.mask, auto = gl.autoClear, alpha = gl.getClearAlpha();
    gl.getClearColor(this.clear);
    try {
      // only the figures, and no background: a background colour has three.js clear before every render
      scene.children = [r.units]; scene.background = null; gl.autoClear = false;
      gl.setRenderTarget(this.mask); gl.setClearColor(0x000000, 0); gl.clear();
      for (const k in SIDES) { cam.layers.set(SIDES[k].layer); scene.overrideMaterial = this.paint[k]; gl.render(scene, cam); }
    } finally {
      scene.children = kids; scene.background = bg; scene.overrideMaterial = null; cam.layers.mask = layers;
      gl.setRenderTarget(null); gl.setClearColor(this.clear, alpha);
    }
    // where they are, a tile round them, in CSS pixels from the bottom left
    gl.getSize(this.css);
    const W = this.css.x, H = this.css.y, mx = 2 / (cam.right - cam.left), my = 2 / (cam.top - cam.bottom);
    const x0 = Math.max(0, Math.floor((this.lo.x - mx + 1) / 2 * W)), x1 = Math.min(W, Math.ceil((this.hi.x + mx + 1) / 2 * W));
    const y0 = Math.max(0, Math.floor((this.lo.y - my + 1) / 2 * H)), y1 = Math.min(H, Math.ceil((this.hi.y + my + 1) / 2 * H));
    if (x1 > x0 && y1 > y0) {
      this.line.uniforms.texel.value.set(1 / this.size.x, 1 / this.size.y);
      this.line.uniforms.width.value = LOOK.width * gl.getPixelRatio();
      gl.setScissor(x0, y0, x1 - x0, y1 - y0); gl.setScissorTest(true);
      gl.render(this.pass, this.flat);
      gl.setScissorTest(false); gl.setScissor(0, 0, W, H);
    }
    gl.autoClear = auto;
  }
}
