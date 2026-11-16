"""Fingers closed in a body's rest mesh, for a body with no finger bones (Meshy's auto-rig gives the slime lords a
hand bone and nothing past it), so a hand that holds something reads as a fist and not an open palm beside the haft.

Inside Blender, with the figure's armature `<key>_v2` and its body `<key>_v2_mesh` loaded:

    exec(open(r"<repo>/tools/blender/handcurl.py").read())
    curl('slime_lord_m', 'Right')          # CURLS' settings: the palm's side, how far round, where the knuckles are
    uncurl('slime_lord_m')                 # the mesh as it was before any curl this session

Every vertex the hand bone carries past the knuckle line is bent round an axis across the knuckles, toward the palm,
the bend growing along the finger (a bend deformer: the finger's middle line goes onto an arc, each vertex kept at its
own distance off that line), so the fingers wrap a haft instead of folding at one joint. The thumb stays: it sits
below the knuckle line. Then export_figure as usual.

CURLS: per body and hand, (palm, deg, knuckle): palm is the hand bone's own axis the palm faces ('+z' or '-z': a
Meshy hand bone's roll is anyone's guess, so it is set by eye), deg how far round the fingertips go, knuckle where the
knuckles are, as a share of the hand's length from the wrist.
"""
import bpy, math
import numpy as np
from mathutils import Vector

CURLS = {
    'slime_lord_m': {'Right': ('+z', 150, 0.56), 'Left': ('+z', 130, 0.56)},
    'slime_lord_f': {'Right': ('-z', 150, 0.56), 'Left': ('-z', 130, 0.56)},
}
_D = bpy.app.driver_namespace


def _hand(key, side, floor=0.5):
    a = bpy.data.objects[key + '_v2']; m = bpy.data.objects[key + '_v2_mesh']
    b = a.data.bones['mixamorig:%sHand' % side]; gi = m.vertex_groups['mixamorig:%sHand' % side].index
    M = b.matrix_local.inverted() @ a.matrix_world.inverted() @ m.matrix_world
    idx = [v.index for v in m.data.vertices if any(g.group == gi and g.weight > floor for g in v.groups)]
    P = np.array([tuple(M @ m.data.vertices[i].co) for i in idx])
    return m, M, idx, P


def curl(key, side, palm=None, deg=None, knuckle=None):
    pa, dg, kn = CURLS.get(key, {}).get(side, ('+z', 150, 0.56))
    palm, deg, knuckle = palm or pa, deg if deg is not None else dg, knuckle if knuckle is not None else kn
    m, M, idx, P = _hand(key, side)
    keep = _D.setdefault('handco', {})
    if key not in keep:
        co = np.empty(len(m.data.vertices) * 3); m.data.vertices.foreach_get('co', co); keep[key] = co
    ym = P[:, 1].max(); yk = ym * knuckle; Lf = ym - yk
    ring = P[np.abs(P[:, 1] - yk) < 0.06 * ym]
    K = np.array([ring[:, 0].mean(), yk, ring[:, 2].mean()])
    e1 = np.array([0.0, 1.0, 0.0])
    fing = P[P[:, 1] > yk]; c = fing - fing.mean(0)
    w_, v_ = np.linalg.eigh(c.T @ c); n = v_[:, 0]; n = n - e1 * n.dot(e1); n /= np.linalg.norm(n)
    want = np.array([0.0, 0.0, 1.0 if palm == '+z' else -1.0])
    e2 = n if n.dot(want) >= 0 else -n                         # toward the palm
    ax = np.cross(e1, e2)
    th = math.radians(deg); R = Lf / th
    Mi = M.inverted(); moved = 0
    for i, p in zip(idx, P):
        d = p - K; u = d.dot(e1)
        if u <= 0: continue
        w = d.dot(e2); a = d.dot(ax); phi = u / R
        q = K + a * ax + (R - (R - w) * math.cos(phi)) * e2 + (R - w) * math.sin(phi) * e1
        m.data.vertices[i].co = Mi @ Vector(q.tolist()); moved += 1
    m.data.update()
    return {'moved': moved, 'hand': len(idx), 'len': round(float(ym), 2), 'knuckle': round(float(yk), 2), 'palm': palm, 'deg': deg}


def uncurl(key):
    co = _D.get('handco', {}).pop(key, None)
    if co is None: return False
    m = bpy.data.objects[key + '_v2_mesh']; m.data.vertices.foreach_set('co', co); m.data.update(); return True
