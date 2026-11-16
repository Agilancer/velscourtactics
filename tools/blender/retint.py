"""Recolours of a body's texture that the critics asked for, by colour, in numpy (no Blender needed for the maths).

    rgb, glow = retint(rgb, RECIPES[key])      # rgb: float array (h, w, 3) in 0..1, sRGB; glow: (h, w, 3) or None

In Blender, `retint_image(img, key)` recolours an image datablock in place and returns the glow as a new image (or
None), which the body's material takes as its emission before export_figure. Out of Blender, tools/build scripts can
run the same function on a .glb's embedded texture to preview a recipe in the viewer.

A recipe is a list of steps. Each step picks pixels by hue (degrees; 'soft': the hue edge's width, 8 by default),
saturation and value with soft edges, and within a mask if it names one (masks/<name>.npz: the texels of one part of
the body, top row first, found in the viewer by tools/build/pauldron.js's kind of pass), and moves them: toward a hue, saturation and value scaled, or a glow taken from them.
"""
import os
import numpy as np

# The batch-9 class bodies after the critics' first round (tools/build/review/b9crit):
# - the lancers' plate to one true midnight blue (the m's olive panels too), the gold lifted and warmed, so the pair
#   reads as blue and gold at the game's size; after the second round, the f's maroon gusset to the plate's shadow;
# - the slime lords' slime less saturated and darker, a deep cobalt, with only its wet highlights (the belly's swirls,
#   the drips' shine) lit from inside and a breath of light through the rest, and the m's gold brought to the f's.
BLUE = 222
RECIPES = {
    'lancer_m': [
        # olive panels: a hard edge at the low end, or the leather's browns just under it went the short way round to
        # blue, through magenta (round 2's pink smears on the greaves and the skirt)
        {'pick': {'hue': (32, 85), 'soft': 1.5, 'val': (0, 0.34), 'sat': (0, 0.7)}, 'hue': BLUE, 'sat': ('set', 0.5), 'val': ('mul', 1.25)},
        {'pick': {'hue': (185, 285)}, 'hue': BLUE, 'sat': ('set', 0.5), 'val': ('mul', 1.25)},                                   # the blue
        {'pick': {'hue': (30, 62), 'val': (0.34, 1)}, 'hue': 40, 'sat': ('mul', 1.15), 'val': ('mul', 1.25)},                      # gold
        {'pick': {'hue': (280, 352), 'sat': (0.2, 1)}, 'sat': ('mul', 0.3)},          # the texture's own purple smudges, greyed
        # the pauldrons' paired spirals and the bar between them, brighter after the first round, read as a face (or a
        # plus at the game's size): their gold sunk into the plate's blue, a shade lighter than it, so the scrolls are
        # only a sheen; the red stone between them to the blue too; the rim and the band above kept bright, but the
        # ridge down the top of each dome sunk with them (with the band it made a T, a plus, at the game's size)
        {'pick': {'hue': (25, 65), 'sat': (0.25, 1), 'val': (0.3, 1), 'mask': 'lancer_m_pauldrons'}, 'hue': BLUE, 'sat': ('set', 0.42), 'val': ('mul', 0.62)},
        {'pick': {'hue': (290, 375), 'sat': (0.2, 1), 'mask': 'lancer_m_pauldrons'}, 'hue': BLUE, 'sat': ('set', 0.5), 'val': ('mul', 0.8)},
    ],
    'lancer_f': [
        {'pick': {'hue': (185, 285)}, 'hue': BLUE, 'sat': ('set', 0.5), 'val': ('mul', 0.9)},
        {'pick': {'hue': (30, 62), 'val': (0.3, 1)}, 'hue': 40, 'sat': ('mul', 1.2), 'val': ('mul', 1.2)},
        {'pick': {'hue': (330, 368), 'soft': 4, 'sat': (0.3, 1)}, 'hue': BLUE, 'sat': ('mul', 0.7), 'val': ('mul', 0.8)},   # the maroon gusset to shadow blue
    ],
    'slime_lord_m': [
        {'pick': {'hue': (190, 265), 'sat': (0.35, 1)}, 'sat': ('mul', 0.75), 'val': ('mul', 0.72),
         'glow': {'from': (0.62, 0.9), 'color': (0.45, 0.85, 1.0), 'base': 0.03, 'peak': 0.5}},
        {'pick': {'hue': (28, 62), 'val': (0.2, 1)}, 'hue': 42, 'sat': ('mul', 1.1), 'val': ('mul', 0.85)},
    ],
    'slime_lord_f': [
        {'pick': {'hue': (190, 265), 'sat': (0.35, 1)}, 'sat': ('mul', 0.75), 'val': ('mul', 0.72),
         'glow': {'from': (0.62, 0.9), 'color': (0.45, 0.85, 1.0), 'base': 0.03, 'peak': 0.5}},
        {'pick': {'hue': (28, 62), 'val': (0.15, 1)}, 'hue': 42, 'sat': ('mul', 1.05), 'val': ('mul', 1.25)},
    ],
}


def rgb2hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx, mn = c.max(-1), c.min(-1); d = mx - mn
    h = np.zeros_like(mx); nz = d > 1e-6
    rr = nz & (mx == r); gg = nz & (mx == g) & ~rr; bb = nz & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = (b - r)[gg] / d[gg] + 2; h[bb] = (r - g)[bb] / d[bb] + 4
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return np.stack([h * 60.0, s, mx], -1)


def hsv2rgb(x):
    h, s, v = x[..., 0] / 60.0 % 6, x[..., 1], x[..., 2]
    i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.zeros(x.shape[:-1] + (3,))
    for k, (a, b, c) in enumerate(((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))):
        m = i == k; out[..., 0][m] = a[m]; out[..., 1][m] = b[m]; out[..., 2][m] = c[m]
    return out


def _band(x, lo, hi, soft):
    return np.clip((x - (lo - soft)) / soft, 0, 1) * np.clip(((hi + soft) - x) / soft, 0, 1)


def _hue_band(h, lo, hi, soft=8.0):
    return np.maximum(_band(h, lo, hi, soft), _band(h + 360, lo, hi, soft))


def _mask(name, shape, flip):
    base = globals().get('REPO')
    base = os.path.join(base, 'tools', 'blender') if base else os.path.dirname(os.path.abspath(__file__))
    z = np.load(os.path.join(base, 'masks', name + '.npz')); sh = tuple(z['shape'])
    m = np.unpackbits(z['mask'])[:sh[0] * sh[1]].reshape(sh).astype(np.float64)
    if sh != shape[:2]:                                    # nearest texel, for a texture of another size
        m = m[(np.arange(shape[0]) * sh[0] // shape[0])[:, None], (np.arange(shape[1]) * sh[1] // shape[1])[None, :]]
    return m[::-1] if flip else m


def retint(rgb, recipe, flip=False):
    """flip: the rows are bottom first (Blender's pixels), so a mask is turned over to match."""
    hsv = rgb2hsv(rgb); out = hsv.copy(); glow = None
    for st in recipe:
        p = st['pick']; w = _hue_band(hsv[..., 0], *p.get('hue', (0, 360)), p.get('soft', 8.0))
        if 'mask' in p: w = w * _mask(p['mask'], hsv.shape, flip)
        if 'sat' in p: w = w * _band(hsv[..., 1], *p['sat'], 0.05)
        if 'val' in p: w = w * _band(hsv[..., 2], *p['val'], 0.04)
        w = w * (hsv[..., 2] > 0.02)                      # not the atlas's black gaps
        new = out.copy()
        if 'hue' in st:                                    # the shortest way round to the new hue
            dh = (st['hue'] - out[..., 0] + 180) % 360 - 180; new[..., 0] = (out[..., 0] + dh) % 360
        for ch, i in (('sat', 1), ('val', 2)):
            if ch in st:
                how, k = st[ch]; new[..., i] = np.clip(k if how == 'set' else out[..., i] * k, 0, 1)
        if 'glow' in st:
            g = st['glow']; lo, hi = g['from']
            t = np.clip((hsv[..., 2] - lo) / (hi - lo), 0, 1); t = t * t * (3 - 2 * t)
            amt = (g['base'] + (g['peak'] - g['base']) * t) * w
            add = amt[..., None] * np.array(g['color'])[None, None, :]
            glow = add if glow is None else np.maximum(glow, add)
        # hue blended on the circle, sat and val linearly, by the pick's weight
        dh = (new[..., 0] - out[..., 0] + 180) % 360 - 180
        out[..., 0] = (out[..., 0] + dh * w) % 360
        out[..., 1] = out[..., 1] + (new[..., 1] - out[..., 1]) * w
        out[..., 2] = out[..., 2] + (new[..., 2] - out[..., 2]) * w
    return np.clip(hsv2rgb(out), 0, 1), glow


def retint_image(img, key):
    """Blender: the image recoloured in place (its pixels are linear floats when it is float, else sRGB bytes as 0..1:
    packed JPEGs and PNGs are the latter), and the glow as a new image named <img>_glow, or None."""
    import bpy
    w, h = img.size; px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
    a = px.reshape(h, w, 4); rgb, glow = retint(a[..., :3].astype(np.float64), RECIPES[key], flip=True)
    a[..., :3] = rgb; img.pixels.foreach_set(a.ravel()); img.update()
    if glow is None: return None
    name = img.name + '_glow'
    if bpy.data.images.get(name): bpy.data.images.remove(bpy.data.images[name])
    gi = bpy.data.images.new(name, w, h, alpha=False)
    g = np.ones((h, w, 4), dtype=np.float32); g[..., :3] = glow; gi.pixels.foreach_set(g.ravel()); gi.update(); gi.pack()
    return gi
