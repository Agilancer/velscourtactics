// Finding a body's marks in the model viewer, for tools/bm/marks/<body>.png (README.md beside this).
// Open viewer.html?m=<key> served by tools/serve.py, then in the console:
//   const P = await import('/tools/bm/marks/pick.js');
//   P.mark('<key>', [[x0, y0, x1, y1], ...])   // screen boxes (CSS pixels) round each mark seen from here; turn and repeat
//   await P.save('<key>', '<body>')            // -> tools/build/shots/mask_<body>.png, grown by 3 texels
// A box takes the texels of that body's skin under it, front faces only, so box a mark from each side it shows on.
const V = window.viewer, THREE = V.THREE;
const N = 1024;   // the colour map's size
let uvTex = null;
function tex() {
  if (uvTex) return uvTex;
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    d[i] = x & 255; d[i + 1] = y & 255; d[i + 2] = 0x80 | ((x >> 8) & 3) | (((y >> 8) & 3) << 2); d[i + 3] = 255;
  }
  uvTex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  uvTex.magFilter = uvTex.minFilter = THREE.NearestFilter; uvTex.generateMipmaps = false; uvTex.flipY = false;
  uvTex.needsUpdate = true;
  return uvTex;
}
// A mask per body, built up view by view: mark(key, boxes) adds the texels seen in those screen boxes on that body alone.
const masks = new Map();
export function mark(key, boxes) {
  const m = masks.get(key) || new Uint8Array(N * N);
  masks.set(key, m);
  const others = V.models.filter((s) => s.key !== key);
  for (const s of others) s.root.visible = false;
  const sets = texelSets(boxes);
  for (const s of others) s.root.visible = true;
  let n = 0;
  for (const set of sets) for (const v of set) { if (!m[v]) n++; m[v] = 1; }
  return n;
}
// Posts the mask, grown by r texels, as a PNG to tools/serve.py (tools/build/shots/mask_<body>.png).
export async function save(key, body, r = 3) {
  const m = masks.get(key), g = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!m[y * N + x]) continue;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < N && Y < N && dx * dx + dy * dy <= r * r) g[Y * N + X] = 1;
    }
  }
  const c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N);
  for (let i = 0; i < N * N; i++) { const v = g[i] ? 255 : 0; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  await fetch('/shot?name=mask_' + body, { method: 'POST', body: c.toDataURL('image/png') });
  let n = 0; for (const v of g) n += v; return n;
}
export const clear = (key) => masks.delete(key);
function texelSets(boxes) {
  const { gl, scene, camera } = V.internals();
  const W = gl.domElement.width, H = gl.domElement.height, k = W / gl.domElement.clientWidth;
  const rt = new THREE.WebGLRenderTarget(W, H);
  const swap = [], hidden = [];
  scene.traverse((o) => {
    if (o.isSkinnedMesh && !o.userData.hull) { swap.push([o, o.material]); o.material = new THREE.MeshBasicMaterial({ map: tex() }); }
    else if ((o.isMesh || o.isSprite) && o.visible) { hidden.push(o); o.visible = false; }
  });
  const bg = scene.background; scene.background = new THREE.Color(0, 0, 0);
  const cs = gl.outputColorSpace, tm = gl.toneMapping;
  gl.outputColorSpace = THREE.LinearSRGBColorSpace; gl.toneMapping = THREE.NoToneMapping;
  gl.setRenderTarget(rt); gl.render(scene, camera); gl.setRenderTarget(null);
  gl.outputColorSpace = cs; gl.toneMapping = tm; scene.background = bg;
  for (const [o, m] of swap) o.material = m;
  for (const o of hidden) o.visible = true;
  const out = [];
  for (const b of boxes) {
    const x0 = Math.round(b[0] * k), y0 = Math.round(b[1] * k), x1 = Math.round(b[2] * k), y1 = Math.round(b[3] * k);
    const w = x1 - x0, h = y1 - y0, px = new Uint8Array(w * h * 4);
    gl.readRenderTargetPixels(rt, x0, H - y1, w, h, px);
    const set = new Set();
    for (let i = 0; i < w * h; i++) {
      const B = px[i * 4 + 2];
      if (!(B & 0x80)) continue;
      set.add((px[i * 4 + 1] | (((B >> 2) & 3) << 8)) * N + (px[i * 4] | ((B & 3) << 8)));
    }
    out.push(set);
  }
  rt.dispose();
  return out;
}
