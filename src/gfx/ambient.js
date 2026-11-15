// The air: what drifts through each land round wherever the camera looks. Motes, falling leaves and fireflies in the
// pines and the Hollow, fireflies thick in the Fen, snow over the White Waste, dust streaming across the Badlands,
// embers rising and ash falling in the Cinder Reach, and low mist that takes each land's colour.
//
// Each kind is one instanced quad that the GPU moves: a particle's place is its seed plus its drift times the clock,
// wrapped into a box round the camera's target, so nothing is spawned or kept on the CPU and the box follows the view
// for free. Which kinds show, and how many of each, follows the land under the camera (sampled a little round it, so
// crossing a border fades one into the next).
import * as THREE from 'three';

// want: how much of it in [the pines, the Waste, the Badlands, the Fen, the Reach, the Hollow]
// shape: 0 soft dot, 1 glow (a bright core in a halo), 2 leaf, 3 flake, 4 puff of mist
const KINDS = {
  motes: { n: 150, shape: 0, add: true, size: [0.03, 0.06], cols: [0xffe2a8, 0xfff2d8], alpha: 0.45, vel: [0.05, 0.03, -0.06], sway: 0.45, y: [0.2, 3.2], want: [0.55, 0.1, 0, 0.4, 0, 1] },
  fireflies: { n: 70, shape: 1, add: true, size: [0.22, 0.3], cols: [0xd8ff7a, 0xffe27a], alpha: 0.9, vel: [0.02, 0, 0.01], sway: 0.9, y: [0.25, 2.2], blink: 1, want: [0.7, 0, 0, 1, 0, 0.3] },
  leaves: { n: 110, shape: 2, size: [0.12, 0.18], cols: [0x8a5426, 0x6a6a26], alpha: 0.95, vel: [0.22, -0.42, 0.08], sway: 0.6, spin: 2.2, y: [0, 5], want: [0.7, 0, 0, 0.35, 0, 0.5] },
  snow: { n: 900, shape: 3, size: [0.04, 0.085], cols: [0xffffff, 0xdfe8f4], alpha: 0.85, vel: [0.3, -0.85, 0.12], sway: 0.35, y: [0, 7], want: [0, 1, 0, 0, 0, 0] },
  dust: { n: 700, shape: 0, size: [0.04, 0.08], cols: [0xc8925a, 0xe0b880], alpha: 0.7, vel: [1.9, 0.05, -1.0], sway: 0.3, y: [0.05, 2.6], want: [0, 0, 1, 0, 0.15, 0] },
  embers: { n: 260, shape: 1, add: true, size: [0.1, 0.17], cols: [0xff6a1a, 0xffb040], alpha: 0.9, vel: [0.12, 0.55, -0.05], sway: 0.35, y: [0, 4.5], blink: 2, want: [0, 0, 0, 0, 1, 0] },
  ash: { n: 520, shape: 3, size: [0.05, 0.1], cols: [0x6a6662, 0xb0aaa4], alpha: 0.85, vel: [0.18, -0.32, 0.06], sway: 0.55, spin: 1.5, y: [0, 6], want: [0, 0, 0, 0, 1, 0] },
  mist: { n: 56, shape: 4, size: [3.5, 6.5], cols: [0x9aa6b4, 0xb4bcc8], alpha: 0.17, vel: [0.16, 0, -0.06], sway: 0.6, spin: 0.04, y: [0.06, 0.4], want: [0.3, 0.6, 0.35, 1, 0.45, 0.12] },
};
// the mist's colour in each land, in the same order as `want`
const MIST = [0x8e9cac, 0xdfe6ee, 0xc49a6a, 0x8ea494, 0x6e6866, 0xa0a8b4];

const VERT = /* glsl */`
attribute vec4 aSeed;    // xyz: where in the box, w: how fast
attribute vec4 aSeed2;   // x: size, y: colour, z: phase, w: its turn to show
uniform float uTime, uAmount, uAlpha, uSway, uSpin, uBlink, uZoom;
uniform vec3 uCenter, uVel;
uniform vec2 uBox, uY, uSize;
uniform vec3 uColA, uColB;
varying vec2 vUv;
varying vec4 vCol;
varying float vPh;
void main() {
  if (aSeed2.w > uAmount) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float ph = aSeed2.z * 6.2832, sp = 0.6 + 0.8 * aSeed.w;
  vec3 sz = vec3(uBox.x, uY.y - uY.x, uBox.y);
  vec3 p = aSeed.xyz * sz + uVel * sp * uTime;
  p += vec3(sin(uTime * 0.71 + ph), sin(uTime * 0.93 + ph * 0.7) * 0.4, cos(uTime * 0.53 + ph * 1.3)) * uSway;
  vec3 lo = vec3(uCenter.x - sz.x * 0.5, uCenter.y + uY.x, uCenter.z - sz.z * 0.5);
  vec3 q = mod(p - lo, sz);
  vec3 wp = lo + q;
  // fade out toward the box's sides, top and bottom, so nothing pops where it wraps
  vec3 ed = min(q, sz - q) / vec3(2.5, min(0.6, sz.y * 0.25), 2.5);
  float a = clamp(min(min(ed.x, ed.y), ed.z), 0.0, 1.0);
  if (uBlink > 1.5) a *= 0.55 + 0.45 * sin(uTime * (6.0 + aSeed.w * 9.0) + ph);                         // embers flicker
  else if (uBlink > 0.5) a *= smoothstep(0.15, 1.0, sin(uTime * (0.7 + aSeed.w * 0.8) + ph) * 0.5 + 0.5);   // fireflies come and go
  float s = mix(uSize.x, uSize.y, aSeed2.x) * uZoom, ang = uSpin * (uTime * (0.4 + aSeed.w) + ph);
  mat2 R = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));
#if SHAPE == 4
  vec2 o = R * position.xy * s;                        // mist lies flat, a sheet over the ground
  vec4 mv = viewMatrix * vec4(wp + vec3(o.x, 0.0, o.y), 1.0);
#else
  vec4 mv = viewMatrix * vec4(wp, 1.0);                // the rest face the camera
  mv.xy += R * position.xy * s;
#endif
  gl_Position = projectionMatrix * mv;
  vUv = position.xy + 0.5;
  vPh = aSeed2.z;
  vCol = vec4(mix(uColA, uColB, aSeed2.y), a * uAlpha);
}`;
const FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform float uTime;
varying vec2 vUv;
varying vec4 vCol;
varying float vPh;
void main() {
  vec2 c = vUv - 0.5;
  float d = length(c), a;
#if SHAPE == 0
  a = pow(smoothstep(0.5, 0.0, d), 1.6);
#elif SHAPE == 1
  a = smoothstep(0.5, 0.0, d) * 0.35 + smoothstep(0.12, 0.03, d);
#elif SHAPE == 2
  float e = length(c * vec2(2.2, 4.4));
  a = smoothstep(1.0, 0.85, e) * (1.0 - 0.35 * smoothstep(0.03, 0.0, abs(c.y)));
#elif SHAPE == 3
  a = smoothstep(0.5, 0.28, d);
#else
  float n = texture2D(uNoise, vUv * 0.6 + vPh * 7.3 + uTime * 0.004).b;
  a = smoothstep(0.5, 0.05, d) * smoothstep(0.25, 0.75, n);
#endif
  gl_FragColor = vec4(vCol.rgb, a * vCol.a);
  if (gl_FragColor.a < 0.004) discard;
}`;

export class Ambient {
  constructor(r, shared) {
    this.r = r; this.shared = shared;
    this.kinds = {};
    const quad = new THREE.PlaneGeometry(1, 1);
    let seed = 2027;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const name in KINDS) {
      const k = KINDS[name], g = new THREE.InstancedBufferGeometry();
      g.index = quad.index; g.setAttribute('position', quad.attributes.position);
      const s1 = new Float32Array(k.n * 4), s2 = new Float32Array(k.n * 4);
      for (let j = 0; j < k.n; j++) {
        for (let c = 0; c < 4; c++) s1[j * 4 + c] = rnd();
        s2[j * 4] = rnd(); s2[j * 4 + 1] = rnd(); s2[j * 4 + 2] = rnd(); s2[j * 4 + 3] = (j + 0.5) / k.n;
      }
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(s1, 4));
      g.setAttribute('aSeed2', new THREE.InstancedBufferAttribute(s2, 4));
      g.instanceCount = k.n;
      const u = {
        uTime: shared.uTime, uNoise: shared.uNoise, uAmount: { value: 0 }, uAlpha: { value: k.alpha }, uSway: { value: k.sway },
        uSpin: { value: k.spin || 0 }, uBlink: { value: k.blink || 0 }, uZoom: { value: 1 }, uCenter: { value: new THREE.Vector3() },
        uVel: { value: new THREE.Vector3(...k.vel) }, uBox: { value: new THREE.Vector2(30, 30) }, uY: { value: new THREE.Vector2(...k.y) },
        uSize: { value: new THREE.Vector2(...k.size) }, uColA: { value: new THREE.Color(k.cols[0]) }, uColB: { value: new THREE.Color(k.cols[1]) },
      };
      const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, defines: { SHAPE: k.shape },
        transparent: true, depthWrite: false, blending: k.add ? THREE.AdditiveBlending : THREE.NormalBlending });
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false; mesh.renderOrder = k.shape === 4 ? -10 : 8; mesh.visible = false;
      r.scene.add(mesh);
      this.kinds[name] = { k, u, mesh, now: 0 };
    }
    this.first = true;
  }

  // the land's share round (x, z): [pines, Waste, Badlands, Fen, Reach, Hollow]
  lands(x, z) {
    const w = this.r.world, out = [0, 0, 0, 0, 0, 0];
    let n = 0;
    for (const [dx, dz] of [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7]]) {
      const X = Math.round(x + dx), Z = Math.round(z + dz);
      if (!w.inMap(X, Z)) continue;
      out[w.inTown(X, Z, 3) ? 5 : w.region[w.I(X, Z)]] += 1; n++;
    }
    return out.map((v) => v / Math.max(n, 1));
  }

  update(dt) {
    const r = this.r, t = r.target, share = this.lands(t.x, t.z);
    const box = r.zoom * 2.5 + 6, k = this.first ? 1 : 1 - Math.exp(-dt * 0.8);
    this.first = false;
    for (const name in this.kinds) {
      const s = this.kinds[name];
      // in a fight the air thins, so the board reads
      const want = s.k.want.reduce((a, v, j) => a + v * share[j], 0) * (r.fight ? 0.4 : 1);
      s.now += (want - s.now) * k;
      s.mesh.visible = s.now > 0.01;
      if (!s.mesh.visible) continue;
      s.u.uAmount.value = s.now;
      s.u.uCenter.value.copy(t);
      s.u.uBox.value.set(name === 'mist' ? box * 1.3 : box, name === 'mist' ? box * 1.3 : box);
      s.u.uZoom.value = name === 'mist' ? 1 : Math.sqrt(r.zoom / 11);
    }
    // the mist takes on the colour of where it is
    const mc = this.kinds.mist.u.uColA.value.setRGB(0, 0, 0), tmp = new THREE.Color();
    let sum = 0;
    share.forEach((v, j) => { if (v) { mc.add(tmp.setHex(MIST[j]).multiplyScalar(v)); sum += v; } });
    if (sum) mc.multiplyScalar(1 / sum);
    this.kinds.mist.u.uColB.value.copy(mc).offsetHSL(0, 0, 0.06);
  }
}
