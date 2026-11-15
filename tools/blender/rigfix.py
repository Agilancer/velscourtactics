"""Rig audit and repair for the Meshy figures, inside Blender (the working file with every figure, `<key>_v2` and
`<key>_v2_mesh`, and the motion library's "Armature").

    exec(open(r"<repo>/tools/blender/rigfix.py").read())
    shoot_rig(["lisandra_v2"], "audit1")          # rest pose, front / side / three-quarter, joints exported beside
    then: python tools/rigsheet.py audit1         # draws the skeleton over the body, a grid, the labels

Everything here leaves the figure's file state as it found it (hidden objects, the action playing) unless it says it
changes the rig.
"""
import bpy, bmesh, math, os, json
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from bpy_extras.object_utils import world_to_camera_view

REPO = r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics"
RIGOUT = os.path.join(REPO, 'tools', 'build', 'rig')
sc = bpy.context.scene
MX = 'mixamorig:'
CHAIN = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'HeadTop_End',
         'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
         'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase']


def figures():
    """Every Meshy-rigged figure in the file (armature `<key>_v2` with a mesh `<key>_v2_mesh`)."""
    return sorted(o.name for o in bpy.data.objects if o.type == 'ARMATURE' and o.name.endswith('_v2')
                  and bpy.data.objects.get(o.name + '_mesh'))


def parts(key):
    """The objects that make up a figure: its armature, body and anything parented to it (a cloth layer)."""
    arm = bpy.data.objects[key]
    return [arm] + [o for o in bpy.data.objects if o.parent == arm and not o.get('prop')]


class Stage:
    """Shows only the given figures, in render and viewport, and puts everything back afterwards."""
    def __init__(self, keys):
        self.keys = keys

    def __enter__(self):
        keep = set()
        for k in self.keys: keep |= set(parts(k))
        self.saved = {o.name: (o.hide_render, o.hide_get()) for o in bpy.data.objects}
        for o in bpy.data.objects:
            on = o in keep
            o.hide_render = not on
            try: o.hide_set(not on)
            except RuntimeError: pass
        self.anim = {}
        for k in self.keys:
            a = bpy.data.objects[k]
            ad = a.animation_data
            self.anim[k] = (a.data.pose_position, ad.action if ad else None, [t.mute for t in ad.nla_tracks] if ad else [])
        self.frame = sc.frame_current
        return self

    def __exit__(self, *exc):
        for o in bpy.data.objects:
            if o.name in self.saved:
                r, h = self.saved[o.name]; o.hide_render = r
                try: o.hide_set(h)
                except RuntimeError: pass
        for k, (pp, act, mutes) in self.anim.items():
            a = bpy.data.objects[k]; a.data.pose_position = pp
            if a.animation_data:
                a.animation_data.action = act
                for t, m in zip(a.animation_data.nla_tracks, mutes): t.mute = m
        sc.frame_set(self.frame)


def play(key, clip, frame=0.0):
    """Puts a figure in one of its clips at a frame (subframes allowed). clip None: the rest pose."""
    arm = bpy.data.objects[key]
    if clip is None:
        arm.data.pose_position = 'REST'; bpy.context.view_layer.update(); return
    arm.data.pose_position = 'POSE'
    a = bpy.data.actions[key + ':' + clip]
    if not arm.animation_data: arm.animation_data_create()
    arm.animation_data.action = a
    try: arm.animation_data.action_slot = a.slots[0]
    except Exception: pass
    for t in arm.animation_data.nla_tracks: t.mute = True
    sc.frame_set(int(frame), subframe=frame - int(frame))
    bpy.context.view_layer.update()


def joints_world(key):
    """Each bone's joint (its head), in world space, as posed now; and the toes' tips worked out from the mesh."""
    arm = bpy.data.objects[key]; M = arm.matrix_world; out = {}
    for pb in arm.pose.bones:
        out[pb.name.replace(MX, '')] = M @ pb.head
    return out


def bbox_world(objs):
    dg = bpy.context.evaluated_depsgraph_get(); lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        if o.type != 'MESH': continue
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        Mw = np.array(o.matrix_world); co = co @ Mw[:3, :3].T + Mw[:3, 3]
        ev.to_mesh_clear()
        lo = Vector(np.minimum(lo, co.min(0))); hi = Vector(np.maximum(hi, co.max(0)))
    return lo, hi


VIEWS = {'front': Vector((0, -1, 0)), 'back': Vector((0, 1, 0)), 'left': Vector((1, 0, 0)), 'right': Vector((-1, 0, 0)),
         'three_quarter': Vector((0.7, -0.7, 0.28)), 'front_low': Vector((0, -1, -0.15)), 'top': Vector((0, -0.05, 1))}


def camera(direction, center, size, aspect):
    """An orthographic camera looking at center from direction (the eye's side), seeing size metres tall."""
    cam = bpy.data.objects.get('RIGCAM')
    if not cam:
        cam = bpy.data.objects.new('RIGCAM', bpy.data.cameras.new('RIGCAM')); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = size * max(1, aspect); cam.data.clip_start = 0.01; cam.data.clip_end = 100
    d = direction.normalized(); cam.location = center + d * 10
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam.hide_render = False
    sc.camera = cam; bpy.context.view_layer.update()
    return cam


def workbench(texture=True):
    try: sc.render.engine = 'BLENDER_WORKBENCH'
    except TypeError as e: print(e)
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'TEXTURE' if texture else 'MATERIAL'
    sh.show_cavity = False; sh.show_shadows = False; sh.show_xray = False; sh.show_backface_culling = False
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.render.resolution_percentage = 100
    try: sc.display.render_aa = '8'
    except Exception: pass


def render_to(path, w, h):
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def project(cam, pts, w, h):
    out = {}
    for n, p in pts.items():
        v = world_to_camera_view(sc, cam, p); out[n] = [round(v.x * w, 1), round((1 - v.y) * h, 1), round(v.z, 4)]
    return out


def shoot(key, folder, tag, views=('front', 'left', 'three_quarter'), w=440, h=720, clip=None, frame=0.0, fixed=None, proposed=None):
    """Renders the figure (as posed by clip/frame, or at rest) from each view, and writes beside each picture where its
    joints fall, the floor and the scale: tools/rigsheet.py draws the rest. fixed: (center, size) to keep one framing
    across frames."""
    os.makedirs(folder, exist_ok=True)
    play(key, clip, frame)
    objs = parts(key)
    lo, hi = bbox_world([o for o in objs if o.type == 'MESH'])
    if fixed: ctr, size = fixed
    else:
        ctr = (lo + hi) / 2; size = (hi.z - lo.z) * 1.08
    meta = {'key': key, 'clip': clip, 'frame': frame, 'views': {}, 'height': hi.z - lo.z, 'floor': lo.z}
    J = joints_world(key)
    for v in views:
        cam = camera(VIEWS[v], ctr, size, w / h)
        p = os.path.join(folder, f'{tag}_{v}.png'); render_to(p, w, h)
        fl = {'floor': Vector((ctr.x, ctr.y, 0.0)), 'top': Vector((ctr.x, ctr.y, hi.z))}
        meta['views'][v] = {'png': p, 'joints': project(cam, J, w, h), 'marks': project(cam, fl, w, h), 'px_per_m': h / size if w / h <= 1 else w / (size * max(1, w / h))}
        if proposed:
            PJ = dict(J); PJ.update({n: Vector(x) for n, x in proposed.items() if not n.startswith('_')})
            meta['views'][v]['proposed'] = project(cam, PJ, w, h)
    with open(os.path.join(folder, f'{tag}.json'), 'w') as f: json.dump(meta, f)
    return meta


def shoot_rig(keys, batch, views=('front', 'left', 'three_quarter'), propose=None, w=440, h=720):
    """The rest pose of each figure: the audit's pictures, into tools/build/rig/<batch>/. propose: key -> joints to draw
    over the rig's own (which are then drawn grey)."""
    folder = os.path.join(RIGOUT, batch); workbench()
    for k in keys:
        with Stage([k]): shoot(k, folder, k, views, w, h, proposed=(propose or {}).get(k))
    print('shot', len(keys), 'into', folder)


# ---------------------------------------------------------------------------------------------------------------------
# The legs refitted to the body. Meshy's auto-rig often drops a knee or an ankle into a gown's hem (Lisandra's left ankle
# sat 32 cm behind her, in the train), and its weights follow its joints, so a skirt walks like trousers. The joints are
# found again from the mesh: each boot by its shape on the floor, the ankle over its heel, the ball where the sole bends,
# the knee halfway down a straight leg and a little forward of it, as in bm's bodies (which this matches: hip 0.55 of the
# height, knee 0.30-0.32, ankle 0.07-0.08, the knee 2% of the height before the line from hip to ankle).

def body(key):
    """The rest mesh in world space, its welded neighbours and the rig's joints, for the fitting below."""
    m = bpy.data.objects[key + '_mesh']; me = m.data; n = len(me.vertices)
    co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    Mw = np.array(m.matrix_world); co = co @ Mw[:3, :3].T + Mw[:3, 3]
    a = bpy.data.objects[key]
    J = {b.name.replace(MX, ''): np.array(a.matrix_world @ b.head_local) for b in a.data.bones}
    return co, J


def stature(J):
    return J['Head'][2] / 0.875                            # the head joint stands at 0.875 of the height in bm's bodies


def meanshift(pts, c, r, it=25):
    for _ in range(it):
        d = np.linalg.norm(pts[:, :2] - c, axis=1); sel = pts[d < r]
        if len(sel) < 8: return c, sel
        c2 = np.median(sel[:, :2], axis=0)
        if np.linalg.norm(c2 - c) < 1e-4: c = c2; break
        c = c2
    d = np.linalg.norm(pts[:, :2] - c, axis=1)
    return c, pts[d < r]


def fit_legs(key, over=None):
    """Proposed leg joints (world space) for a figure, and notes on how each was found. over: per-figure corrections,
    {'LeftFoot': (dx, dy, dz) in metres, ...} added at the end, or {'foot_r': 0.06} to widen the boot search."""
    over = over or {}
    co, J = body(key); Hs = stature(J); P = {}; notes = []
    mid = (J['LeftUpLeg'][:2] + J['RightUpLeg'][:2]) / 2
    near = np.linalg.norm(co[:, :2] - mid, axis=1) < 0.3 * Hs
    floor = float(np.percentile(co[near, 2], 0.2)); co = co.copy(); co[:, 2] -= floor
    for s in ('Left', 'Right'):
        hip = J[s + 'UpLeg'] - np.array([0, 0, floor])
        out = np.sign(hip[0] - mid[0]) or (1 if s == 'Left' else -1)
        # the boot: where the low slab of the mesh is densest under this hip, tried from a few starting points
        band = co[(co[:, 2] > 0.012 * Hs) & (co[:, 2] < 0.065 * Hs)]
        band = band[np.sign(band[:, 0] - mid[0]) == out]
        r = over.get('foot_r', 0.055) * Hs; best = None
        for c0 in (np.array([hip[0] + out * 0.005 * Hs, hip[1] - 0.01 * Hs]), J[s + 'Foot'][:2].copy(),
                   np.array([hip[0] + out * 0.05 * Hs, hip[1] - 0.01 * Hs]), np.array([hip[0] + out * 0.09 * Hs, hip[1]])):
            c, sel = meanshift(band, c0, r)
            if np.linalg.norm(c - hip[:2]) > 0.16 * Hs: continue
            score = len(sel) - 400 * np.linalg.norm(c - hip[:2]) / Hs
            if best is None or score > best[0]: best = (score, c, sel)
        if best is None: c = np.array([hip[0] + out * 0.02 * Hs, hip[1]]); notes.append(s + ': no boot found')
        else: c = best[1]
        if 'boot_' + s in over: c = c + np.array(over['boot_' + s])
        sole = co[(co[:, 2] < 0.03 * Hs) & (np.linalg.norm(co[:, :2] - c, axis=1) < 0.13 * Hs)]
        fwd = np.array([0.0, -1.0])
        if len(sole) > 20:
            rel = sole[:, :2] - c
            lat = np.abs(rel @ np.array([1.0, 0.0]))
            sole = sole[lat < 0.045 * Hs]; rel = sole[:, :2] - c
            if len(sole) > 20:
                u, s_, vt = np.linalg.svd(rel - rel.mean(0), full_matrices=False); ax = vt[0]
                if ax @ fwd < 0: ax = -ax
                if ax @ fwd > math.cos(math.radians(35)): fwd = ax / np.linalg.norm(ax)
        latv = np.array([-fwd[1], fwd[0]])
        if len(sole) > 20:
            t = (sole[:, :2] - c) @ fwd; l = (sole[:, :2] - c) @ latv
            keep = np.abs(l) < 0.04 * Hs; t = t[keep]
            toe, heel = np.percentile(t, 99), np.percentile(t, 1)
        else:
            toe, heel = 0.08 * Hs, -0.04 * Hs; notes.append(s + ': no sole found')
        L = toe - heel
        if not (0.07 * Hs < L < 0.24 * Hs): notes.append('%s: sole %.0f%% of height' % (s, 100 * L / Hs))
        base = c + fwd * heel
        az = J[s + 'Foot'][2] - floor
        az = az if 0.055 * Hs < az < 0.095 * Hs else 0.075 * Hs
        ank = np.array([*(base + fwd * 0.27 * L), az])
        ball = np.array([*(base + fwd * 0.70 * L), 0.022 * Hs])
        # the knee: Meshy's height if it is a knee's, on the line from hip to ankle, a little forward
        kz = J[s + 'Leg'][2]; lo, hi = ank[2] + 0.42 * (hip[2] - ank[2]), ank[2] + 0.58 * (hip[2] - ank[2])
        if not (lo < kz < hi): notes.append('%s: knee height %.2f moved' % (s, kz / Hs)); kz = ank[2] + 0.5 * (hip[2] - ank[2])
        t = (hip[2] - kz) / (hip[2] - ank[2]); kn = hip + (ank - hip) * t
        kn[:2] += fwd * 0.02 * Hs
        up = np.array([0, 0, floor])
        P[s + 'UpLeg'] = hip + up; P[s + 'Leg'] = kn + up; P[s + 'Foot'] = ank + up; P[s + 'ToeBase'] = ball + up
        P['_' + s] = {'boot': c.tolist(), 'fwd': fwd.tolist(), 'len': float(L), 'heel': float(heel), 'floor': floor}
    for n, d in over.items():
        if n in P and not n.startswith('_'): P[n] = P[n] + np.array(d)
    return P, notes, Hs


def shoot_motion(key, batch, clips, views=('front', 'left', 'three_quarter'), n=6, w=300, h=420):
    """Frames across each clip from each view, with one framing per clip so the travel shows: tools/rigsheet.py --motion."""
    folder = os.path.join(RIGOUT, batch); workbench()
    with Stage([key]):
        for c in clips:
            a = bpy.data.actions.get(key + ':' + c)
            if not a: print(key, 'has no', c); continue
            f0, f1 = a.frame_range; fr = [f0 + (f1 - f0) * i / max(1, n - 1) for i in range(n)] if n > 1 else [f0]
            lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
            for f in fr:
                play(key, c, f); l, h_ = bbox_world([o for o in parts(key) if o.type == 'MESH']); lo = Vector(np.minimum(lo, l)); hi = Vector(np.maximum(hi, h_))
            ctr = (lo + hi) / 2; ctr.z = max(ctr.z, (hi.z) / 2); size = max(hi.z - min(lo.z, 0), (hi - lo).length * 0.75) * 1.08
            for i, f in enumerate(fr):
                shoot(key, folder, f'{key}__{c}__{i}', views, w, h, clip=c, frame=f, fixed=(ctr, size))
    print('motion', key, clips)


# ---------------------------------------------------------------------------------------------------------------------
# Putting the fitted joints in, and the legs' skin after them.

def apply_joints(key, P):
    """Moves rest joints to P (world space). Each bone keeps its orientation (its tail moves with its head), so every
    clip keeps turning the bones the same ways; only where they turn about changes."""
    arm = bpy.data.objects[key]; Minv = arm.matrix_world.inverted()
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    for o in bpy.context.selected_objects: o.select_set(False)
    arm.hide_set(False); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones; moved = {}
    for n, p in P.items():
        if n.startswith('_'): continue
        b = eb.get(MX + n) or eb.get(n); new = Minv @ Vector(p); d = new - b.head; roll = b.roll
        if d.length < 1e-6: continue
        tail = b.tail + d; b.head = new; b.tail = tail; b.roll = roll; moved[n] = d.length * arm.matrix_world.to_scale()[0]
    bpy.ops.object.mode_set(mode='OBJECT')
    return moved


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)


def welded_neighbours(me, co, tol=1e-4):
    """Each vertex's neighbours across UV seams (Meshy's meshes come split at every seam)."""
    q = np.round(co / tol).astype(np.int64); _, inv = np.unique(q, axis=0, return_inverse=True); inv = inv.ravel()
    ev = np.empty(len(me.edges) * 2, dtype=np.int64); me.edges.foreach_get('vertices', ev); ev = ev.reshape(-1, 2)
    groups = {}
    for i, g in enumerate(inv): groups.setdefault(g, []).append(i)
    nb = [set() for _ in range(len(co))]
    for a, b in ev:
        for x in groups[inv[a]]:
            for y in groups[inv[b]]:
                if x != y: nb[x].add(y); nb[y].add(x)
    for g in groups.values():
        for x in g: nb[x].update(y for y in g if y != x)
    return [list(s) for s in nb], inv


def get_weights(m):
    me = m.data; names = [g.name for g in m.vertex_groups]; W = np.zeros((len(me.vertices), len(names)))
    for v in me.vertices:
        for g in v.groups: W[v.index, g.group] = g.weight
    return W, names


def set_weights(m, W, rows=None, top=4):
    """Writes the weights back, the strongest `top` per vertex, normalised."""
    vgs = m.vertex_groups; rows = range(W.shape[0]) if rows is None else rows
    for i in rows:
        i = int(i); w = W[i]; idx = np.argsort(-w)[:top]; idx = idx[w[idx] > 1e-3]; s = w[idx].sum() or 1
        for g in m.data.vertices[i].groups: pass
        cur = [g.group for g in m.data.vertices[i].groups]
        for gi in cur: vgs[gi].remove([i])
        for gi in idx: vgs[int(gi)].add([int(i)], float(w[gi] / s), 'REPLACE')


def reweight_legs(key, P, Hs=None):
    """The legs' skin from the fitted joints: what lies in a leg (within a capsule round its bones) is that leg's, thigh,
    shin, foot and toes split by height and by the ball; what lies further out keeps how much of each leg it had, split
    the same way. The top of the thigh keeps its share of the hips. Then smoothed across the welded mesh."""
    m = bpy.data.objects[key + '_mesh']; me = m.data
    co, J = body(key); Hs = Hs or stature(J)
    W, names = get_weights(m); gi = {n.replace(MX, ''): i for i, n in enumerate(names)}
    S = ('Left', 'Right'); legs = {s: [gi[s + b] for b in ('UpLeg', 'Leg', 'Foot', 'ToeBase')] for s in S}
    floor = P['_Left']['floor']
    def seg_d(p, a, b):
        ab = b - a; t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1); return np.linalg.norm(p - (a + np.outer(t, ab)), axis=1)
    D = {}; NEW = {}
    for s in S:
        hip, kn, an, ba = (np.array(P[s + n]) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase'))
        info = P['_' + s]; fwd = np.array([*info['fwd'], 0.0]); tip = ba + fwd * 0.35 * info['len']; tip[2] = floor + 0.012 * Hs
        heel = an - fwd * 0.3 * info['len']; heel[2] = floor + 0.02 * Hs
        d = np.minimum.reduce([seg_d(co, hip, kn) - 0.068 * Hs, seg_d(co, kn, an) - 0.055 * Hs,
                               seg_d(co, an, ba) - 0.06 * Hs, seg_d(co, ba, tip) - 0.05 * Hs, seg_d(co, heel, ba) - 0.05 * Hs])
        D[s] = d                                                  # < 0: inside the leg
        z = co[:, 2]
        a = smoothstep(an[2] + 0.018 * Hs, an[2] - 0.018 * Hs, z)            # 1 in the foot
        sh = smoothstep(kn[2] + 0.03 * Hs, kn[2] - 0.03 * Hs, z)             # 1 below the knee
        t = (co[:, :2] - ba[:2]) @ fwd[:2]
        toe = smoothstep(-0.012 * Hs, 0.018 * Hs, t)                         # 1 past the ball
        NEW[s] = np.stack([(1 - a) * (1 - sh), (1 - a) * sh, a * (1 - toe), a * toe], 1)
    W2 = W.copy(); changed = []
    hipz = np.array(P['LeftUpLeg'])[2]
    fade = 1 - smoothstep(hipz - 0.07 * Hs, hipz, co[:, 2])              # near the hip joint the old weights stay
    for i in range(len(co)):
        tot = {s: W[i, legs[s]].sum() for s in S}
        dmin = min(D['Left'][i], D['Right'][i])
        if tot['Left'] + tot['Right'] < 1e-3 and (dmin > 0 or fade[i] == 0): continue
        row = W2[i]
        for s in S:                                                       # what it had of each leg, split anew
            if tot[s] > 0: row[legs[s]] = NEW[s][i] * tot[s]
        if dmin < 0 and fade[i] > 0:                                      # in a leg: that leg's, the deeper the more
            s = 'Left' if D['Left'][i] < D['Right'][i] else 'Right'
            k = float(smoothstep(0.0, -0.02 * Hs, D[s][i])) * fade[i]
            one = np.zeros_like(row); one[legs[s]] = NEW[s][i]
            row[:] = (1 - k) * row + k * one
        changed.append(i)
    # smoothing over the welded mesh, only where it changed
    nb, _ = welded_neighbours(me, co)
    ch = set(changed); region = set(changed)
    for i in changed: region.update(nb[i])
    region = sorted(region)
    for _ in range(3):
        W3 = W2.copy()
        for i in region:
            n = nb[i]
            if not n: continue
            W3[i] = 0.5 * W2[i] + 0.5 * W2[n].mean(0)
        W2 = W3
    set_weights(m, W2, region)
    return len(changed), len(region)


# ---------------------------------------------------------------------------------------------------------------------
# Meshy's rig kept on disk before anything here changes it, so a figure can always start again from what Meshy gave.

def _orig(key):
    return os.path.join(RIGOUT, 'orig', key + '.npz')


def backup(key):
    """Meshy's rest joints (head, tail, roll of every bone) and skin of a figure, once."""
    p = _orig(key)
    if os.path.exists(p): return p
    os.makedirs(os.path.dirname(p), exist_ok=True)
    arm = bpy.data.objects[key]; m = bpy.data.objects[key + '_mesh']
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    for o in bpy.context.selected_objects: o.select_set(False)
    arm.hide_set(False); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    names = [b.name for b in arm.data.edit_bones]
    ht = np.array([[*b.head, *b.tail, b.roll] for b in arm.data.edit_bones])
    bpy.ops.object.mode_set(mode='OBJECT')
    W, vg = get_weights(m)
    np.savez_compressed(p, names=np.array(names), ht=ht, W=W.astype(np.float32), vg=np.array(vg))
    return p


def restore(key):
    """Back to Meshy's rest joints and skin (the clips are not touched: send the figure through retarget again)."""
    d = np.load(_orig(key)); arm = bpy.data.objects[key]; m = bpy.data.objects[key + '_mesh']
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    for o in bpy.context.selected_objects: o.select_set(False)
    arm.hide_set(False); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones
    for n, r in zip(d['names'], d['ht']):
        b = eb[str(n)]; b.head = Vector(r[:3]); b.tail = Vector(r[3:6]); b.roll = float(r[6])
    bpy.ops.object.mode_set(mode='OBJECT')
    vg = [str(x) for x in d['vg']]; assert vg == [g.name for g in m.vertex_groups], key + ': vertex groups changed'
    set_weights(m, d['W'].astype(np.float64))


# Which build() class each figure is (the key without _v2 and its sex, or its own name).
KLASS = {'wren': 'ranger', 'ismene': 'wizard', 'mortimer': 'necromancer', 'brakka': 'barbarian', 'kestrel': 'dragoon',
         'maudlin': 'carrion_witch', 'jasper': 'bard', 'flint': 'gunner', 'lisandra': 'doorkeeper', 'homunculus': 'paladin',
         'lily': 'arcane_sorcerer', 'jamie': 'boomerang_knight', 'stevie': 'lancer'}


def klass(key):
    k = key[:-3] if key.endswith('_v2') else key
    if k in KLASS: return KLASS[k]
    if k.startswith('zombie_'): return k
    for sfx in ('_m', '_f'):
        if k.endswith(sfx): return k[:-2]
    return k


# ---------------------------------------------------------------------------------------------------------------------
# The rest of the skeleton centred in the body. A joint sits in the middle of its limb's cross-section, the spine in the
# middle of the torso (as in bm's bodies, whose spine runs straight up the middle from pelvis to neck), the head in the
# middle of the skull. "The middle" is the centre of the largest circle that fits in the cross-section through the joint
# (found from the mesh's own surface, with a ray test for inside), not the average of the vertices, which a dense
# buckle or a braid would pull. Where the cross-section is too big for a limb (a bell sleeve, a gown) the joint stays.
from mathutils.bvhtree import BVHTree

_SOLID = {}
_DIRS = [Vector(d).normalized() for d in ((0.013, 0.021, 1), (1, 0.017, 0.023), (0.019, -1, 0.011), (-0.7, 0.71, -0.05), (0.02, 0.03, -1))]


def solid(key, fresh=False):
    if key in _SOLID and not fresh: return _SOLID[key]
    m = bpy.data.objects[key + '_mesh']; Mw = m.matrix_world
    bvh = BVHTree.FromPolygons([Mw @ v.co for v in m.data.vertices], [tuple(p.vertices) for p in m.data.polygons], epsilon=0.0)
    _SOLID[key] = bvh; return bvh


def inside(bvh, p):
    votes = 0
    for d in _DIRS:
        n = 0; o = Vector(p)
        for _ in range(64):
            hit = bvh.ray_cast(o, d)[0]
            if hit is None: break
            n += 1; o = hit + d * 1e-4
        votes += n % 2
    return votes * 2 > len(_DIRS)


def clearance(bvh, p):
    r = bvh.find_nearest(Vector(p)); return r[3] if r[0] is not None else 0.0


def centre(bvh, p, normal, R, lam=0.25, n=15):
    """The point of the plane through p (normal) within R of p, inside the body, farthest from its surface, less lam per
    metre it moves. Returns (point, clearance) or None."""
    p = Vector(p); normal = Vector(normal).normalized(); u = normal.orthogonal().normalized(); v = normal.cross(u)
    best = None
    for rad, cnt in ((R, n), (R / 5, 9)):
        c0 = p if best is None else best[0]; cands = []
        for i in range(cnt):
            for j in range(cnt):
                a = (i / (cnt - 1) * 2 - 1) * rad; b = (j / (cnt - 1) * 2 - 1) * rad
                if a * a + b * b > rad * rad * 1.0001: continue
                c = c0 + u * a + v * b
                if (c - p).length > R: continue
                d = clearance(bvh, c); cands.append((d - lam * (c - p).length, c, d))
        cands.sort(key=lambda x: -x[0])
        for _, c, d in cands[:60]:
            if inside(bvh, c): best = (c, d); break
    return best


def fit_core(key, P=None, over=None):
    """Spine, neck, head and arms centred in the body, the shoulders brought down to where an arm turns (Meshy puts them
    at the top of the shoulder, 0.817 of the stature where bm's bodies have 0.79), and the knees and ankles of legs that
    show (not under a gown) centred in them. P: joints already fitted (fit_legs), added to and returned; over: per-figure
    offsets in metres, {'LeftArm': (dx, dy, dz)}, or switches {'keep': ['Head'], 'shoulder_z': 0.81}. Returns P, notes."""
    over = over or {}; keep = set(over.get('keep', ()))
    bvh = solid(key, fresh=True); _, J0 = body(key); Hs = stature(J0)
    J = {n: Vector(x) for n, x in J0.items()}
    P = dict(P or {}); notes = []
    cur = lambda n: Vector(P[n]) if n in P else J[n]

    def put(n, x, why=''):
        if n in keep: return
        d = (Vector(x) - cur(n)).length
        if d > 0.0005: P[n] = Vector(x); notes.append('%s %.1f cm %s' % (n, d * 100, why))
    up = Vector((0, 0, 1)); Y = Vector((0, 1, 0))
    mid = (J['LeftUpLeg'].x + J['RightUpLeg'].x) / 2               # the body's midline, between the hips

    def depth(n, R, lam=0.2):
        """Along the line front to back through n on the midline: (best point, its clearance, Meshy's point on the
        midline, its clearance or -1 if outside, the most clearance there is along the line)."""
        p = J[n].copy(); p.x = mid
        best = None; top = 0.0
        for i in range(-30, 31):
            c = p + Y * (R * Hs * i / 30)
            d = clearance(bvh, c)
            if d <= top and (best is not None and d - lam * abs(c.y - p.y) <= best[0]): continue
            if not inside(bvh, c): continue
            top = max(top, d)
            if best is None or d - lam * abs(c.y - p.y) > best[0]: best = (d - lam * abs(c.y - p.y), c, d)
        here = clearance(bvh, p) if inside(bvh, p) else -1.0
        return (best[1], best[2], p, here, top) if best else (None, 0.0, p, here, top)
    # The spine, the neck and the head go onto the midline. Front to back, Meshy's place is kept while it is well inside
    # (at least 0.6 of the most room there is at that height): a cape, a quiver, a hood or a high collar on the back
    # would pull a centre backwards. Only a joint at the skin or outside it (Lisandra's spine in her belly, her head at
    # her face) is centred.
    for n, R, keep_k in (('Hips', 0.08, 0.6), ('Spine', 0.08, 0.6), ('Spine1', 0.08, 0.6), ('Spine2', 0.08, 0.6), ('Neck', 0.04, 0.5), ('Head', 0.05, 0.4)):
        c, d, p, here, top = depth(n, R, 0.2 if n.startswith(('Hips', 'Spine')) else 0.6)
        if here >= keep_k * top and here > 0.01 * Hs: put(n, p, 'onto the midline (%.1f of %.1f cm room)' % (here * 100, top * 100))
        elif c is not None and d > 0.012 * Hs: put(n, c, 'from the skin to the middle (%.1f -> %.1f cm room)' % (max(here, 0) * 100, d * 100))
        else: put(n, p, 'onto the midline (nowhere better)')
    d = cur('Head') - J['Head']
    for n in ('HeadTop_End', 'headfront'):
        if n in J and d.length > 0: P[n] = J[n] + d
    # the arms
    lim = lambda r, big, small=0.012: r is not None and small * Hs < r[1] < big * Hs
    for s in ('Left', 'Right'):
        A, E, Wr, C = J[s + 'Arm'], J[s + 'ForeArm'], J[s + 'Hand'], J[s + 'Shoulder']
        # the upper arm's axis from two sections below the shoulder, where it is a plain tube
        ax = (E - A).normalized()
        c1 = centre(bvh, A + (E - A) * 0.5, ax, 0.05 * Hs, 0.3); c2 = centre(bvh, A + (E - A) * 0.78, ax, 0.05 * Hs, 0.3)
        e = centre(bvh, E, (Wr - A).normalized(), 0.04 * Hs, 0.3)
        if lim(e, 0.045, 0.014): put(s + 'ForeArm', e[0], 'centred (r %.1f cm)' % (e[1] * 100)); E = cur(s + 'ForeArm')
        else: notes.append(s + ' elbow: in a sleeve or thin, kept')
        w = centre(bvh, Wr, (Wr - E).normalized(), 0.03 * Hs, 0.35)
        if lim(w, 0.035, 0.01): put(s + 'Hand', w[0], 'centred (r %.1f cm)' % (w[1] * 100))
        else: notes.append(s + ' wrist: in a sleeve or a cuff, kept')
        zt = min(A.z, over.get('shoulder_z', 0.79) * Hs)
        if lim(c1, 0.05) and lim(c2, 0.05) and (c1[0] - c2[0]).length > 0.01 * Hs:
            a = (c1[0] - c2[0]).normalized()                                # up the arm, towards the shoulder
            if a.z > 0.2:
                t = (zt - c1[0].z) / a.z; na = c1[0] + a * t
                # never further from the elbow than a forearm and a third
                fore = (cur(s + 'Hand') - E).length
                if (na - E).length > 1.35 * fore: na = E + (na - E).normalized() * 1.35 * fore
                put(s + 'Arm', na, "on the arm's axis at %.3f" % (na.z / Hs))
            else: notes.append(s + ' upper arm too level to read, kept')
        else:
            if A.z > zt + 0.003 * Hs:                                      # no tube to read: lowered along the bone
                na = A + (E - A).normalized() * ((A.z - zt) / max(0.2, (A - E).normalized().z))
                put(s + 'Arm', na, 'lowered along the bone (no tube to read)')
            notes.append(s + ' upper arm: no clean tube')
        if s + 'Arm' in P:                                                  # the collarbone at the shoulder's height
            put(s + 'Shoulder', Vector((C.x, C.y, P[s + 'Arm'].z)), "to the shoulder's height")
    # legs that show: the knee and the ankle in the middle of the leg
    shaft = {}
    for s in ('Left', 'Right'):
        # the ankle in the middle of the boot's shaft, looked for from the fitted ankle and from Meshy's (the boot's own
        # centre lies forward of the shaft on a big foot); under a gown there is no shaft to find
        a = cur(s + 'Foot'); r = None
        for seed in (a, Vector((J[s + 'Foot'].x, J[s + 'Foot'].y, a.z))):
            q = centre(bvh, seed, up, 0.03 * Hs, 0.3)
            if lim(q, 0.05, 0.01) and (r is None or q[1] > r[1]): r = q
        shaft[s] = r is not None
        if r is not None:
            d = r[0] - a; d.z = 0; put(s + 'Foot', a + d, 'centred in the boot (r %.1f cm)' % (r[1] * 100))
            if s + 'ToeBase' in P: P[s + 'ToeBase'] = cur(s + 'ToeBase') + d
    # A foot no boot shows for (a gown to the floor): what the floor showed of it is the hem, so it is put where a foot
    # stands, the ankle under the hip and the foot straight ahead (bm's bodies), or mirroring the other foot if that one
    # showed.
    floor = P['_Left']['floor'] if '_Left' in P else 0.0
    for s in ('Left', 'Right'):
        if shaft[s] or over.get('feet') == 'keep': continue
        o = 'Right' if s == 'Left' else 'Left'; hip = cur(s + 'UpLeg')
        if shaft[o]:
            m = lambda v: Vector((2 * mid - v.x, v.y, v.z))
            an, ba = m(cur(o + 'Foot')), m(cur(o + 'ToeBase')); why = 'mirrors the other foot (under cloth)'
        else:
            out = 1 if hip.x > mid else -1
            an = Vector((hip.x + out * 0.005 * Hs, hip.y, floor + 0.075 * Hs))
            ba = Vector((an.x, an.y - 0.065 * Hs, floor + 0.022 * Hs)); why = 'under the hip (under cloth)'
        put(s + 'Foot', an, why); put(s + 'ToeBase', ba, why)
        if '_' + s in P:
            f2 = (ba - an); f2.z = 0; f2.normalize()
            P['_' + s] = dict(P['_' + s], fwd=[f2.x, f2.y], len=0.15 * Hs)
    for s in ('Left', 'Right'):
        h, k, a = cur(s + 'UpLeg'), cur(s + 'Leg'), cur(s + 'Foot')
        r = centre(bvh, k, (a - h).normalized(), 0.04 * Hs, 0.3)
        if lim(r, 0.06, 0.018): put(s + 'Leg', r[0], 'centred in the leg (r %.1f cm)' % (r[1] * 100))
        else:
            # on the line from hip to ankle at its height, 2% of the height forward of it
            t = (h.z - k.z) / max(1e-6, h.z - a.z); kn = h + (a - h) * t
            fw = Vector((*P.get('_' + s, {}).get('fwd', (0.0, -1.0)), 0.0)); kn += fw * 0.02 * Hs
            put(s + 'Leg', kn, 'on the line from hip to ankle (under cloth)')
    for n, d in over.items():
        if n in J: P[n] = cur(n) + Vector(d)
    return P, notes


# ---------------------------------------------------------------------------------------------------------------------
# The second pass, from the critics' first round. The mesh cut level gives its loops exactly (a leg inside a gown, a neck
# inside a collar: the inside-or-out test by counting crossings is fooled by a shell in a shell, and put Lisandra's and
# the necromancers' knees out in the robe). Then the knees and ankles go into their legs, the neck and the head onto the
# neck's column, the spine straight from the hips to the neck, both sides made to match, and the arms given bm's
# proportions where a sleeve hides the bend. bm's hero, as fractions of the stature: shoulder joint 0.107 out from the
# middle, upper arm 0.153 and forearm 0.152, the hand 0.13 to the fingertip, neck 0.83, head 0.875, ankle 0.058, the
# knee 2% before the line from hip to ankle, the spine dead straight.
BM = {'arm_x': 0.107, 'upper': 0.153, 'fore': 0.152, 'hand': 0.1295, 'neck': 0.830, 'head': 0.875, 'ankle': 0.058}
_MESHC = {}


def mesh_cache(key, fresh=False):
    """The rest mesh in world space, each vertex's welded id (Meshy splits vertices along its seams) and its triangles."""
    if key in _MESHC and not fresh: return _MESHC[key]
    m = bpy.data.objects[key + '_mesh']; me = m.data; n = len(me.vertices)
    co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    Mw = np.array(m.matrix_world); co = co @ Mw[:3, :3].T + Mw[:3, 3]
    _, wid = np.unique(np.round(co / 1e-5).astype(np.int64), axis=0, return_inverse=True)
    me.calc_loop_triangles(); T = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get('vertices', T)
    _MESHC[key] = (co, wid.ravel(), T.reshape(-1, 3)); return _MESHC[key]


def section_loops(key, z):
    """The mesh cut by the level plane at height z: each closed (or broken-off) curve of the cut as its points (xy),
    joined by the triangles that cross the plane, so a curve inside another stays its own."""
    co, wid, T = mesh_cache(key)
    zc = co[:, 2] - z; zc = np.where(np.abs(zc) < 1e-7, 1e-7, zc)
    E = ((0, 1), (1, 2), (2, 0))
    cr = np.stack([zc[T[:, a]] * zc[T[:, b]] < 0 for a, b in E], 1)
    sel = cr.sum(1) == 2
    if not sel.any(): return []
    Ts, Cs = T[sel], cr[sel]; N = int(wid.max()) + 1
    pts, eid = [], []
    for k, (a, b) in enumerate(E):
        va, vb = Ts[:, a], Ts[:, b]; t = zc[va] / (zc[va] - zc[vb])
        pts.append(co[va, :2] + (co[vb, :2] - co[va, :2]) * t[:, None])
        wa, wb = wid[va], wid[vb]; eid.append(np.minimum(wa, wb) * N + np.maximum(wa, wb))
    pts = np.stack(pts, 1); eid = np.stack(eid, 1)                   # (F, 3, 2), (F, 3)
    # each triangle's two crossing edges
    first = np.argmax(Cs, 1); last = 2 - np.argmax(Cs[:, ::-1], 1)
    r = np.arange(len(Ts)); e1, e2 = eid[r, first], eid[r, last]
    u, inv = np.unique(np.concatenate([e1, e2]), return_inverse=True); n = len(u)
    P = np.zeros((n, 2)); P[inv[:len(e1)]] = pts[r, first]; P[inv[len(e1):]] = pts[r, last]
    par = list(range(n))

    def find(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for a, b in zip(inv[:len(e1)], inv[len(e1):]):
        ra, rb = find(int(a)), find(int(b))
        if ra != rb: par[ra] = rb
    roots = np.array([find(i) for i in range(n)])
    return [P[roots == g] for g in np.unique(roots) if (roots == g).sum() >= 6]


def loop_info(L):
    """A loop's middle, its typical radius and its widest reach from the middle."""
    c = L.mean(0); d = np.linalg.norm(L - c, axis=1); return c, float(np.median(d)), float(d.max())


def surrounds(L, p):
    """True when the loop goes all the way round p (its points fall in every eighth of the turn about p)."""
    a = np.arctan2(L[:, 1] - p[1], L[:, 0] - p[0]); b = np.floor((a + math.pi) / (math.pi / 4)).astype(int) % 8
    return len(set(b.tolist())) == 8


def limb_loop(key, z, p, Hs, rmin, rmax, side=None, mid=0.0, reach=0.07):
    """The loop round a limb at height z nearest p (xy): a leg in its trouser or inside a gown, a boot, a neck in a
    collar. side: +1 or -1, the side of the middle it must be on. Returns (centre, radius, surrounds p) or None."""
    best = None
    for L in section_loops(key, z):
        c, r, ext = loop_info(L)
        if not (rmin * Hs < r < rmax * Hs and ext < 1.6 * rmax * Hs): continue
        if side and np.sign(c[0] - mid) != side and abs(c[0] - mid) > 0.012 * Hs: continue
        d = float(np.linalg.norm(c - p[:2])); s = surrounds(L, p[:2])
        if not s and d > reach * Hs: continue
        score = d - (0.05 * Hs if s else 0.0)
        if best is None or score < best[0]: best = (score, c, r, s)
    return None if best is None else (best[1], best[2], best[3])


def polish(key, P, notes0=(), over=None):
    """The critics' fixes on the fitted joints P (fit_legs then fit_core). over: {'keep': [...], 'feet': 'keep',
    'shoulder_z': 0.778, 'mirror': False, <joint>: (dx, dy, dz)}. Returns P, notes."""
    over = over or {}; keep = set(over.get('keep', ()))
    mesh_cache(key, fresh=True)
    _, J0 = body(key); Hs = stature(J0); notes = []
    cur = lambda n: Vector(P[n]) if n in P else Vector(J0[n])

    def put(n, x, why=''):
        if n in keep: return
        d = (Vector(x) - cur(n)).length
        if d > 0.0005: P[n] = Vector(x); notes.append('%s %.1f cm %s' % (n, d * 100, why))
    mid = (cur('LeftUpLeg').x + cur('RightUpLeg').x) / 2
    M = lambda v: Vector((2 * mid - v.x, v.y, v.z))                   # across the middle
    side = {s: (1.0 if cur(s + 'UpLeg').x > mid else -1.0) for s in ('Left', 'Right')}
    floor = P['_Left']['floor'] if '_Left' in P else 0.0
    S = ('Left', 'Right')
    # -- the legs: the knees and the ankles into their own leg's loop
    found = {}; kfound = {}
    for s in S:
        h, k, a = cur(s + 'UpLeg'), cur(s + 'Leg'), cur(s + 'Foot')
        fw = Vector((*P.get('_' + s, {}).get('fwd', (0.0, -1.0)), 0.0))
        kl = limb_loop(key, k.z, np.array(k), Hs, 0.014, 0.07, side[s], mid)
        kfound[s] = kl is not None
        if kl is not None:
            c = Vector((kl[0][0], kl[0][1], k.z))
            t = (h.z - k.z) / max(1e-6, h.z - a.z); line = h + (a - h) * t
            ahead = (c - line).dot(fw)
            if ahead < 0.012 * Hs: c += fw * min(0.012 * Hs - ahead, 0.6 * kl[1])   # bent a little, as bm's are
            put(s + 'Leg', c, 'in its leg (r %.1f cm)' % (kl[1] * 100))
        al = None
        for dz in (0.0, 0.015, 0.03):
            al = limb_loop(key, a.z + dz * Hs, np.array(a), Hs, 0.012, 0.055, side[s], mid, 0.06)
            if al is not None: break
        # lower down, a shoe that peeks out under a hem shows the foot is there (its middle is forward of the ankle)
        found[s] = al is not None or any(limb_loop(key, floor + f * Hs, np.array(a), Hs, 0.012, 0.06, side[s], mid, 0.08) is not None for f in (0.03, 0.045))
        if al is not None:
            d = Vector((al[0][0] - a.x, al[0][1] - a.y, 0))
            put(s + 'Foot', a + d, 'in the boot shaft (r %.1f cm)' % (al[1] * 100))
            P[s + 'ToeBase'] = cur(s + 'ToeBase') + d
    if over.get('feet') != 'keep':
        for s in S:
            o = 'Right' if s == 'Left' else 'Left'
            if found[s]: continue
            if found[o]:                                               # a hidden foot mirrors the one that shows
                put(s + 'Foot', M(cur(o + 'Foot')), 'mirrors the other (hidden)'); put(s + 'ToeBase', M(cur(o + 'ToeBase')), 'mirrors the other')
            else:                                                      # neither shows: under the hips, as bm's stand
                h = cur(s + 'UpLeg')
                an = Vector((h.x + side[s] * 0.004 * Hs, h.y + 0.012 * Hs, floor + 0.07 * Hs))
                put(s + 'Foot', an, 'under the hip (hidden)')
                put(s + 'ToeBase', Vector((an.x, an.y - 0.075 * Hs, floor + 0.022 * Hs)), 'under the hip (hidden)')
            if '_' + s in P:
                f2 = cur(s + 'ToeBase') - cur(s + 'Foot'); f2.z = 0
                if f2.length > 1e-4: f2.normalize(); P['_' + s] = dict(P['_' + s], fwd=[f2.x, f2.y])
    for n, tol in (('Leg', 0.035), ('Foot', 0.03)):                    # level pairs: the same height both sides
        l, r = cur('Left' + n), cur('Right' + n)
        if abs(l.z - r.z) < tol * Hs:
            z = (l.z + r.z) / 2; put('Left' + n, Vector((l.x, l.y, z)), 'levelled'); put('Right' + n, Vector((r.x, r.y, z)), 'levelled')
    for s in S:                                                        # a hidden knee: on the line, 2% forward
        h, k, a = cur(s + 'UpLeg'), cur(s + 'Leg'), cur(s + 'Foot')
        if kfound[s]: continue
        fw =Vector((*P.get('_' + s, {}).get('fwd', (0.0, -1.0)), 0.0))
        t = (h.z - k.z) / max(1e-6, h.z - a.z); put(s + 'Leg', h + (a - h) * t + fw * 0.02 * Hs, 'on the line, 2% forward (hidden)')
    # -- the hips between the hip joints
    hy = (cur('LeftUpLeg').y + cur('RightUpLeg').y) / 2; hz = (cur('LeftUpLeg').z + cur('RightUpLeg').z) / 2
    h = cur('Hips')
    put('Hips', Vector((mid, min(max(h.y, hy - 0.005 * Hs), hy + 0.012 * Hs), min(max(h.z, hz - 0.01 * Hs), hz + 0.035 * Hs))), 'between the hip joints')
    # -- the head where fit_core put it, moved by the critics' measures (over), then the spine and the neck on one smooth
    # line from the hips to it: straight up a body that stands straight, bending forward only at the top where the head
    # is carried ahead (a quadratic from the hips, leaving them straight up, with its bend at the neck's height). A neck
    # pulled back into the nape or a collar, a Spine2 back at the shoulder blades or a Spine forward in the belly all
    # come onto it. The joints' heights stay Meshy's, spaced as bm's where they bunch.
    if 'Head' in over and 'Head' not in keep:
        P['Head'] = cur('Head') + Vector(over['Head'])
    hd = cur('Head')
    if hd.z - cur('Neck').z < 0.035 * Hs:
        put('Neck', Vector((mid, cur('Neck').y, hd.z - 0.045 * Hs)), 'a neck long enough')
    if 'Neck' in over and 'Neck' not in keep: P['Neck'] = cur('Neck') + Vector(over['Neck'])
    d = cur('Head') - Vector(J0['Head'])
    for n in ('HeadTop_End', 'headfront'):
        if n in J0 and d.length > 0: P[n] = Vector(J0[n]) + d
    hp, nk = cur('Hips'), cur('Neck')
    zs = [cur(n).z for n in ('Spine', 'Spine1', 'Spine2')]
    span = nk.z - hp.z
    if not (hp.z < zs[0] < zs[1] < zs[2] < nk.z) or min(zs[0] - hp.z, zs[1] - zs[0], zs[2] - zs[1], nk.z - zs[2]) < 0.03 * Hs:
        zs = [hp.z + f * span for f in (0.235, 0.451, 0.696)]; notes.append('spine re-spaced as bm')
    y0, z0, y2, z2, zc = hp.y, hp.z, hd.y, hd.z, nk.z

    def y_at(z):                                                       # the quadratic hips -> (hips.y, neck.z) -> head
        a = z0 - 2 * zc + z2; b = 2 * (zc - z0); c = z0 - z
        if abs(a) < 1e-9: t = -c / b
        else: t = (-b + math.sqrt(max(0.0, b * b - 4 * a * c))) / (2 * a)
        t = min(max(t, 0.0), 1.0)
        return (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y0 + t * t * y2
    for n, z in zip(('Spine', 'Spine1', 'Spine2', 'Neck'), zs + [nk.z]):
        put(n, Vector((mid, y_at(z), z)), 'on the line from the hips to the head')
    # -- the arms
    zt = over.get('shoulder_z', 0.778) * Hs
    cy = cur('Spine2').y                                               # the chest's depth (a hunched body's shoulders are forward of its hips)
    plaus = lambda A: 0.075 * Hs <= abs(A.x - mid) <= 0.14 * Hs and abs(A.y - cy) < 0.08 * Hs
    for s in S:
        A, E, W = cur(s + 'Arm'), cur(s + 'ForeArm'), cur(s + 'Hand')
        if not plaus(A):                                               # from the elbow, an upper arm's length in
            L = max((W - E).length, 0.13 * Hs); dz = max(0.0, min(zt, A.z) - E.z)
            dx = math.sqrt(max(0.0, L * L - dz * dz)); x = E.x - side[s] * dx
            x = mid + side[s] * min(max(abs(x - mid), 0.085 * Hs), 0.13 * Hs)
            put(s + 'Arm', Vector((x, E.y, min(zt, A.z))), 'from the elbow (was off the shoulder)')
        elif A.z > zt + 0.004 * Hs:                                    # down the arm's own line to the arm root
            u = (A - E).normalized(); na = A - u * ((A.z - zt) / max(0.3, u.z)); put(s + 'Arm', na, 'down to the arm root')
        A, E = cur(s + 'Arm'), cur(s + 'ForeArm')
        if abs(A.y - E.y) > 0.012 * Hs:                                # an arm hangs to the side: the shoulder over the elbow
            put(s + 'Arm', Vector((A.x, E.y + math.copysign(0.012 * Hs, A.y - E.y), A.z)), 'over the elbow front to back')
        if 'wrist_out' in over:                                        # a wrist up in its cuff (the critics measured it)
            W, E = cur(s + 'Hand'), cur(s + 'ForeArm'); put(s + 'Hand', W + (W - E).normalized() * over['wrist_out'], 'out to the cuff')
        A, E, W = cur(s + 'Arm'), cur(s + 'ForeArm'), cur(s + 'Hand')
        up, fo = (E - A).length, (W - E).length
        hidden = any(x.startswith(s + ' elbow: in a sleeve') for x in notes0)
        if hidden or up < 0.78 * fo:                                   # the bend (nearly) halfway, as bm's arms
            ax = W - A; t0 = (E - A).dot(ax) / ax.dot(ax); perp = E - (A + ax * t0)
            put(s + 'ForeArm', A + ax * (0.5 if hidden else 0.474) + perp, 'down the arm (%s)' % ('in a sleeve' if hidden else 'upper arm short'))
            E = cur(s + 'ForeArm')
        fo = (W - E).length
        if fo < 0.75 * (E - A).length:                                  # a wrist up in a cuff: a hand's length from the tip
            co = mesh_cache(key)[0]; u = (W - E).normalized()
            rel = co - np.array(E); t = rel @ np.array(u); rad = np.linalg.norm(rel - np.outer(t, np.array(u)), axis=1)
            near = (t > (W - E).length * 0.8) & (t < (W - E).length + 0.25 * Hs) & (rad < 0.05 * Hs)
            if near.sum() > 20:
                tip = float(np.percentile(t[near], 98)); nw = E + u * (tip - 0.12 * Hs)
                if (nw - E).length > (W - E).length + 0.02 * Hs: put(s + 'Hand', nw, 'out to the cuff (a hand from the fingertip)')
    if over.get('mirror', True):
        for n, tol in (('Arm', 0.02), ('ForeArm', 0.03), ('Hand', 0.03), ('Shoulder', 0.02)):
            l, r = cur('Left' + n), cur('Right' + n)
            if (l - M(r)).length < tol * Hs:                           # near enough: both to their mean
                m = (l + M(r)) / 2; put('Left' + n, m, 'mirrored'); put('Right' + n, M(m), 'mirrored')
            elif n != 'Hand':                                          # far apart: the better side, mirrored (a wrist
                def bad(s):                                            # found in its cuff is left: a held thing may turn it)
                    A, E, W = cur(s + 'Arm'), cur(s + 'ForeArm'), cur(s + 'Hand')
                    return abs(math.log(max(1e-4, (E - A).length) / max(1e-4, (W - E).length))) + 3 * abs(abs(A.x - mid) / Hs - 0.1) + 2 * abs(A.y - cy) / Hs
                b = 'Left' if bad('Left') <= bad('Right') else 'Right'; o = 'Right' if b == 'Left' else 'Left'
                put(o + n, M(cur(b + n)), 'mirrors the %s (%.1f cm apart)' % (b, (l - M(r)).length * 100))
    for s in S:                                                        # the collarbone inside the shoulder, at its height
        C, A = cur(s + 'Shoulder'), cur(s + 'Arm')
        x = mid + side[s] * min(max(abs(C.x - mid), 0.012 * Hs), abs(A.x - mid) - 0.045 * Hs)
        put(s + 'Shoulder', Vector((x, (C.y + A.y) / 2 if abs(C.y - A.y) > 0.04 * Hs else C.y, A.z + 0.01 * Hs)), 'over the shoulder')
    for n, d in over.items():
        if n in J0 and n not in ('Head', 'Neck'): P[n] = cur(n) + Vector(d)
    return P, notes


def refit(key, over=None, build=True):
    """The whole rig fitted again from Meshy's: back to its joints and skin, the legs found from the boots, the rest
    centred, the critics' fixes (polish), the skin of the legs redone, and every clip sent through again (retarget.py)
    for its class."""
    over = over or {}
    uncloth(key); backup(key); restore(key)
    P, n1, Hs = fit_legs(key, over.get('legs'))
    P, n2 = fit_core(key, P, over.get('core'))
    P, n3 = polish(key, P, n1 + n2, over.get('polish'))
    P = {n: (np.array(x) if not n.startswith('_') else x) for n, x in P.items()}
    moved = apply_joints(key, P)
    reweight_legs(key, P, Hs)
    T = None
    if build:
        T = Target.rebuild(key); T.build(klass(key))
    return T, P, n1 + n2 + n3, moved


# Per-figure corrections, found by looking (rigsheet.py --detail) and by the critics: {'legs': fit_legs' over,
# 'core': fit_core's over, 'polish': polish's over}. In metres, world space: x is the figure's left, -y its front, z up.
# The heads are the critics' round-one measures (where the head turns: under the ear, at the jaw's angle, behind it).
_H = lambda dy=0.0, dz=0.0: {'Head': (0.0, dy, dz)}
OVER = {
    'ghoul_v2': {'polish': _H(-0.16)},                     # in the hump, 17 cm behind the skull
    'lily_v2': {'polish': _H(0.055, 0.01)},                # at the front of her face
    'lisandra_v2': {'polish': _H(0.075)},                  # on her nose
    'jasper_v2': {'polish': _H(0.01, 0.03)},
    'zombie_brute_v2': {'polish': _H(-0.10)},              # at the back of the hood
    'zombie_leechmother_v2': {'polish': dict(_H(0.0, 0.05), Neck=(0.0, 0.0, 0.03))},
    'zombie_husk_v2': {'polish': _H(0.0, 0.03)},
    'zombie_gnawer_v2': {'polish': _H(0.0, 0.02)},
    'zombie_rimewalker_v2': {'polish': _H(0.0, 0.03)},
    'zombie_shambler_v2': {'polish': _H(0.0, 0.04)},
    'zombie_driftling_v2': {'polish': _H(0.035)},
    'stevie_v2': {'polish': _H(-0.035, 0.085)},            # down in the gorget, under her chin
    'ranger_f_v2': {'polish': _H(0.0, 0.06)},              # in the hood's collar
    'ninja_f_v2': {'polish': _H(0.045, 0.02)},             # behind the mask
    'paladin_f_v2': {'polish': _H(-0.03)},
    'wizard_f_v2': {'polish': _H(0.03)},
    # the skeleton's bones show: the shoulders into the humeral heads, the collarbones to the top of the sternum
    'skeleton_v2': {'polish': dict(_H(0.0, 0.025), LeftArm=(-0.015, 0.0, 0.06), RightArm=(0.015, 0.0, 0.06),
                                   LeftShoulder=(0.0, 0.0, 0.07), RightShoulder=(0.0, 0.0, 0.07))},
    # the slagback: its skull hangs 20 cm before the head joint (up in the hump); its shoulders at the pauldrons' lower edge
    'zombie_slagback_v2': {'polish': dict(_H(-0.20), LeftArm=(-0.05, 0.0, 0.06), RightArm=(0.05, 0.0, 0.06))},
    'zombie_slinger_v2': {'polish': {'LeftArm': (0.0, 0.0, 0.05), 'RightArm': (0.0, 0.0, 0.05)}},
    # Maudlin: her hips and knees high under the gown, her wrists up in the cuffs
    'maudlin_v2': {'polish': {'LeftUpLeg': (0.0, 0.0, -0.04), 'RightUpLeg': (0.0, 0.0, -0.04), 'LeftLeg': (0.0, 0.0, -0.055),
                              'RightLeg': (0.0, 0.0, -0.055), 'wrist_out': 0.05}},
}


def run(keys, batch, build=True):
    """refit() each figure, the notes into tools/build/rig/<batch>/notes.json (added to, figure by figure)."""
    import time
    folder = os.path.join(RIGOUT, batch); os.makedirs(folder, exist_ok=True); path = os.path.join(folder, 'notes.json')
    allnotes = json.load(open(path)) if os.path.exists(path) else {}
    done = {}
    for k in keys:
        t = time.time()
        T, P, notes, moved = refit(k, OVER.get(k), build)
        allnotes[k] = {'notes': notes, 'moved_cm': {n: round(v * 100, 1) for n, v in moved.items()}, 'secs': round(time.time() - t, 1)}
        done[k] = T
        with open(path, 'w') as f: json.dump(allnotes, f, indent=1)
    return done


# ---------------------------------------------------------------------------------------------------------------------
# What the critics look at: per figure, its rest rig from the front and the side (close enough to judge a joint), and
# frames across its walk, its run and its class's own blow, from the side and three-quarter. tools/rigsheet.py --cards
# lays each figure's out on one sheet.
COMMON = {'Idle', 'Walk', 'Run', 'Hop', 'Cast', 'Hit', 'Stunned', 'Wounded', 'Dead_Fall', 'Revive', 'Victory', 'Talk', 'Drink',
          'Guard', 'Point', 'Flex', 'Walk_Bent', 'Run_Bent', 'Wave'}


def blow(key):
    """The figure's first clip of its own (its class's blow), or Cast."""
    tr = [t.name for t in bpy.data.objects[key].animation_data.nla_tracks] if bpy.data.objects[key].animation_data else []
    acts = [a.name.split(':', 1)[1] for a in bpy.data.actions if a.name.startswith(key + ':') and not a.name.split(':', 1)[1].startswith(('M_', 'own_'))]
    names = tr or acts
    own = [n for n in names if n not in COMMON]
    return own[0] if own else 'Cast'


def review(keys, batch):
    """Rest shots into <batch>/rest, motion into <batch>/motion."""
    for k in keys:
        shoot_rig([k], os.path.join(batch, 'rest'), views=('front', 'left'), w=600, h=980)
        shoot_motion(k, os.path.join(batch, 'motion'), ['Walk', 'Run', blow(k)], views=('left', 'three_quarter'), n=6, w=260, h=380)


# ---------------------------------------------------------------------------------------------------------------------
# Cloth cut loose from the legs. Meshy skins a gown's skirt, a robe, coat tails, a tabard and a cape's fall to the thighs
# and shins, so they stride with the legs like trousers. Here whatever hangs below the hips clear of the legs is taken
# off them and given to rows of bone chains, Cloth_<piece>_<column>_<link>, hung from the hips, that no clip turns:
# src/gfx/cloth.js swings them in the game (gravity, a pull back towards where the body holds them, collisions with
# capsules round the legs). A row that goes all the way round (a skirt) is one ring; a front and a back flap with legs
# showing between are two rows.
CLOTH_N, CLOTH_K = 16, 5
PIECES = 'abcdefgh'


def seg_dist(p, a, b, ra, rb):
    """Distance from each point to the surface of the tapered capsule a-b (radii ra at a, rb at b); < 0 inside."""
    ab = b - a; t = np.clip(((p - a) @ ab) / max(1e-12, ab @ ab), 0, 1)
    return np.linalg.norm(p - (a + np.outer(t, ab)), axis=1) - (ra + (rb - ra) * t)


def leg_radii(key, J, Hs):
    """Each leg's radius at the thigh, the knee and the ankle, from the mesh where the leg shows (the largest circle
    that fits its cross-section) and a slim leg's where cloth hides it."""
    bvh = solid(key); out = {}
    for s in ('Left', 'Right'):
        h, k, a = (Vector(J[s + n]) for n in ('UpLeg', 'Leg', 'Foot'))

        def meas(p, nrm, dflt, big):
            r = centre(bvh, p, nrm, 0.03 * Hs, 0.4)
            return r[1] if r and r[1] < big * Hs else dflt * Hs
        rk = meas(k, (a - h).normalized(), 0.042, 0.06)
        rt = meas(h + (k - h) * 0.35, (k - h).normalized(), 0.055, 0.075)
        ra = meas(a + (k - a) * 0.15, (k - a).normalized(), 0.032, 0.05)
        out[s] = (max(rt, rk), rk, ra)
    return out


def leg_free(co, J, Hs, R):
    """How clear of both legs each point lies: 0 in a leg (or its boot), 1 a few centimetres out."""
    d = []
    for s in ('Left', 'Right'):
        hip, kn, an, ba = (np.array(J[s + n]) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase'))
        rt, rk, ra = R[s]
        d.append(np.minimum.reduce([seg_dist(co, hip, kn, rt, rk), seg_dist(co, kn, an, rk, ra),
                                    seg_dist(co, an, ba, 0.05 * Hs, 0.045 * Hs)]))
    return smoothstep(0.006 * Hs, 0.028 * Hs, np.minimum(*d))


def leg_tubes(key, n_leg=24, n_foot=6):
    """Where each leg is really there in the mesh (a trouser, a bare leg, a boot) and how thick, down its bones (hip,
    knee, ankle, ball, toe): {side: [(point, radius or 0 where it is hollow cloth), ...]}. A leg is there where rays
    from its bone meet the mesh close by all round, and always on the inner side, towards the other leg (an inner
    thigh, a boot's inside); inside a gown the inner rays cross the empty skirt and meet nothing near. A short hollow
    stretch between two solid ones (a knee the fit left at its edge) is filled in, and so is the top of the thigh, up in
    the pelvis, where nothing is ever met."""
    co, J = body(key); Hs = stature(J); bvh = solid(key); out = {}
    for s, o in (('Left', 'Right'), ('Right', 'Left')):
        ch = [np.array(J[s + n], dtype=np.float64) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase')]
        ot = [np.array(J[o + n], dtype=np.float64) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase')]
        ch.append(ch[3] + (ch[3] - ch[2]) * 0.6); ot.append(ot[3] + (ot[3] - ot[2]) * 0.6)
        segs = [(0, 1, n_leg // 2), (1, 2, n_leg // 2), (2, 3, n_foot // 2), (3, 4, n_foot // 2)]
        S = []
        for si, (i, j, n) in enumerate(segs):
            for u in np.linspace(0, 1, n, endpoint=(si == len(segs) - 1)):
                p = ch[i] + (ch[j] - ch[i]) * u; q = ot[i] + (ot[j] - ot[i]) * u
                inw = q - p; inw[2] = 0; L = np.linalg.norm(inw)
                inw = inw / L if L > 1e-6 else np.array([-1.0 if s == 'Left' else 1.0, 0, 0])
                hits = []; inner = 0
                for ang in (0, 45, -45, 90, -90, 135, -135, 180):
                    c, sn = math.cos(math.radians(ang)), math.sin(math.radians(ang))
                    h = bvh.ray_cast(Vector(p), Vector((inw[0] * c - inw[1] * sn, inw[0] * sn + inw[1] * c, 0)), 0.085 * Hs)
                    if h[0] is not None: hits.append(h[3]); inner += abs(ang) <= 45
                S.append([p, float(np.median(hits)) if (inner == 3 and len(hits) >= 6) else 0.0])
        n = len(S); r = [x[1] for x in S]
        solid_ = [i for i in range(n) if r[i] > 0]
        if solid_:
            f = solid_[0]
            if f <= n_leg // 2 * 0.45:                                  # up into the pelvis
                for i in range(f): r[i] = r[f]
            for a, b in zip(solid_, solid_[1:]):                          # short gaps
                if 1 < b - a <= 6:
                    for i in range(a + 1, b): r[i] = r[a] + (r[b] - r[a]) * (i - a) / (b - a)
            if r[n - 1] == 0 and r[n - 2] > 0: r[n - 1] = r[n - 2]       # the toe's end, past the mesh
        out[s] = [(S[i][0], r[i]) for i in range(n)]
    return out, Hs


def leg_free2(co, T, Hs):
    """How clear of both legs each point lies, by leg_tubes: 0 in a leg that is there (its own surface, a boot), 1 a
    couple of centimetres out from it, and 1 all through where the leg is hollow inside cloth."""
    free = np.ones(len(co))
    for s, S in T.items():
        P = np.array([p for p, _ in S]); R = np.array([r for _, r in S])
        best = np.full(len(co), np.inf); rad = np.zeros(len(co))
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]; ab = b - a; L2 = max(1e-12, ab @ ab)
            t = np.clip(((co - a) @ ab) / L2, 0, 1); d = np.linalg.norm(co - (a + np.outer(t, ab)), axis=1)
            w = d < best; best[w] = d[w]
            ra, rb = R[i], R[i + 1]
            rr = np.where((ra > 0) & (rb > 0), ra + (rb - ra) * t, np.where(t < 0.5, ra, rb))
            rad[w] = rr[w]
        r1 = rad * 1.12 + 0.004 * Hs
        f = np.where(rad > 0, smoothstep(r1, r1 + 0.018 * Hs, best), 1.0)
        free = np.minimum(free, f)
    return free


def uncloth(key):
    """Takes a figure's cloth chains out again (bones and their skin): before a refit, which restores Meshy's skin."""
    arm = bpy.data.objects[key]; m = bpy.data.objects[key + '_mesh']
    for g in [g for g in m.vertex_groups if g.name.startswith('Cloth_')]: m.vertex_groups.remove(g)
    if any(b.name.startswith('Cloth_') for b in arm.data.bones):
        if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
        for o in bpy.context.selected_objects: o.select_set(False)
        arm.hide_set(False); arm.select_set(True); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='EDIT')
        for b in [b for b in arm.data.edit_bones if b.name.startswith('Cloth_')]: arm.data.edit_bones.remove(b)
        bpy.ops.object.mode_set(mode='OBJECT')


def cloth_plan(key, over=None):
    """Where a figure's loose cloth is and the chains to swing it, or None when nothing hangs loose (trousers, a short
    tunic). over: {'top': fraction of the height where the cloth starts swinging, 'min_drop': how far below the hips
    the cloth must reach to count (fraction of the height), 'off': True for none}."""
    over = over or {}
    if over.get('off'): return None
    co, J = body(key); Hs = stature(J)
    floor = min(J['LeftToeBase'][2], J['RightToeBase'][2]) - 0.022 * Hs
    hz = (J['LeftUpLeg'][2] + J['RightUpLeg'][2]) / 2
    top = floor + over['top'] * Hs if 'top' in over else hz + 0.02 * Hs
    T, _ = leg_tubes(key)
    free = leg_free2(co, T, Hs)
    # the legs' capsules for the game: a leg that is there by its own thickness, a hollow one by bm's (thigh, knee, ankle)
    R = {}
    for s, S_ in T.items():
        n = len(S_); q = (n - 6) // 2                                    # the thigh's samples, then the shin's
        th = [r for _, r in S_[:q] if r > 0]; sh = [r for _, r in S_[q:n - 6] if r > 0]
        rt = float(np.median(th)) if th else 0.06 * Hs; rk = float(np.median(sh)) if sh else 0.045 * Hs
        ra = float(np.median(sh[-3:])) if len(sh) >= 3 else 0.035 * Hs
        R[s] = (min(max(rt, 0.035 * Hs), 0.075 * Hs), min(max(rk, 0.028 * Hs), 0.06 * Hs), min(max(ra, 0.022 * Hs), 0.045 * Hs))
    hang = smoothstep(top, top - 0.08 * Hs, co[:, 2])                       # 0 above where it starts swinging
    f = free * hang
    # smoothed over the welded mesh, so a fold that dips into a leg's capsule does not tear off it
    me = bpy.data.objects[key + '_mesh'].data
    nb, _ = welded_neighbours(me, co)
    cand = np.nonzero(f > 0.01)[0]
    region = set(cand.tolist())
    for i in cand: region.update(nb[i])
    region = np.array(sorted(region), dtype=np.int64)
    for _ in range(4):
        f2 = f.copy()
        for i in region:
            if nb[i]: f2[i] = 0.5 * f[i] + 0.5 * f[nb[i]].mean()
        f = f2 * (hang > 0)
    cl = f > 0.5
    if cl.sum() < 60: return None
    drop = hz - np.percentile(co[cl, 2], 2)
    if drop < over.get('min_drop', 0.14) * Hs: return None
    # the columns: sectors round the hips' middle (the front is -y)
    c0 = (np.array(J['LeftUpLeg'][:2]) + np.array(J['RightUpLeg'][:2])) / 2
    rel = co[:, :2] - c0; th = np.arctan2(rel[:, 1], rel[:, 0])
    cols = []
    for c in range(CLOTH_N):
        a = -math.pi + (c + 0.5) * 2 * math.pi / CLOTH_N
        da = np.abs((th - a + math.pi) % (2 * math.pi) - math.pi)
        sector = da < math.pi / CLOTH_N
        sel = cl & sector
        if sel.sum() < 6 or (top - np.percentile(co[sel, 2], 3)) < 0.1 * Hs: cols.append(None); continue
        hem = float(np.percentile(co[sel, 2], 1.5))
        zs = [top + (hem - top) * k / CLOTH_K for k in range(CLOTH_K + 1)]
        band = (top - hem) / CLOTH_K * 0.6; pts = []
        for k, z in enumerate(zs):
            near = (sel if k else sector) & (np.abs(co[:, 2] - z) < band)
            if near.sum() >= 3:
                q = np.median(co[near, :2], axis=0)
                if k == 0: q = c0 + (q - c0) * 0.85                      # the top just inside the body's surface
            else:
                q = pts[-1][:2] if pts else c0 + np.array([math.cos(a), math.sin(a)]) * 0.1 * Hs
            pts.append(np.array([q[0], q[1], z]))
        cols.append({'angle': a, 'joints': pts, 'hem': hem})
    # runs of neighbouring columns make the pieces; all of them round, a ring
    have = [c is not None for c in cols]
    if not any(have): return None
    pieces = []
    if all(have): pieces.append({'ring': True, 'cols': list(range(CLOTH_N))})
    else:
        start = have.index(False); run = []
        for i in range(1, CLOTH_N + 1):
            c = (start + i) % CLOTH_N
            if have[c]: run.append(c)
            elif run: pieces.append({'ring': False, 'cols': run}); run = []
        if run: pieces.append({'ring': False, 'cols': run})
    for i, p in enumerate(pieces): p['name'] = PIECES[i]
    return {'key': key, 'Hs': Hs, 'top': top, 'floor': floor, 'f': f, 'cols': cols, 'pieces': pieces, 'R': R,
            'centre': c0.tolist(), 'drop': float(drop / Hs), 'count': int(cl.sum())}


def cloth_build(key, plan):
    """Puts the plan's chains in the rig and gives them the loose cloth's skin, blended into the body's where it starts."""
    arm = bpy.data.objects[key]; m = bpy.data.objects[key + '_mesh']; Minv = arm.matrix_world.inverted()
    uncloth(key)
    Hs = plan['Hs']; cols = plan['cols']
    if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
    for o in bpy.context.selected_objects: o.select_set(False)
    arm.hide_set(False); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones; hips = eb[MX + 'Hips']
    names = {}
    for p in plan['pieces']:
        for c in p['cols']:
            js = cols[c]['joints']; prev = hips
            for k, j in enumerate(js):
                n = 'Cloth_%s_%d_%d' % (p['name'], c, k); b = eb.new(n)
                b.head = Minv @ Vector(j)
                nxt = Vector(js[k + 1]) if k + 1 < len(js) else Vector(j) + Vector((0, 0, -0.03 * Hs))
                b.tail = Minv @ nxt
                if (b.tail - b.head).length < 1e-4: b.tail = b.head + Vector((0, 0, -1))
                b.parent = prev; b.use_connect = False; b.use_deform = True; prev = b
                names[(c, k)] = n
    bpy.ops.object.mode_set(mode='OBJECT')
    # the skin: each loose point between its two nearest columns of its piece and its two nearest links down them
    co, J = body(key); f = plan['f']
    W, gnames = get_weights(m)
    for n in names.values():
        if n not in gnames: m.vertex_groups.new(name=n); gnames.append(n)
    W = np.hstack([W, np.zeros((W.shape[0], len(gnames) - W.shape[1]))])
    gi = {n: i for i, n in enumerate(gnames)}
    c0 = np.array(plan['centre']); rel = co[:, :2] - c0; th = np.arctan2(rel[:, 1], rel[:, 0])
    step = 2 * math.pi / CLOTH_N
    rows = np.nonzero(f > 0.01)[0]
    for i in rows:
        best = None
        for p in plan['pieces']:
            for j, c in enumerate(p['cols']):
                d = abs((th[i] - cols[c]['angle'] + math.pi) % (2 * math.pi) - math.pi)
                if best is None or d < best[0]: best = (d, p, j)
        _, p, j = best; cs = p['cols']; n = len(cs)
        sd = (th[i] - cols[cs[j]]['angle'] + math.pi) % (2 * math.pi) - math.pi
        j2 = j + (1 if sd > 0 else -1)
        if p['ring']: j2 %= n
        if 0 <= j2 < n and j2 != j:
            u = min(1.0, abs(sd) / step); pair = [(cs[j], 1 - u), (cs[j2], u)]
        else: pair = [(cs[j], 1.0)]
        row = np.zeros(W.shape[1])
        for c, wc in pair:
            zs = [x[2] for x in cols[c]['joints']]; K = len(zs) - 1
            s = (zs[0] - co[i, 2]) / max(1e-6, zs[0] - zs[-1]) * K          # 0 at the top joint, K at the hem
            s = min(max(s - 0.5, 0.0), K - 1.0)                              # each bone's pull centred on its middle
            k0 = int(math.floor(s)); u = s - k0; k1 = min(k0 + 1, K - 1)
            row[gi[names[(c, k0)]]] += wc * (1 - u); row[gi[names[(c, k1)]]] += wc * u
        W[i] = (1 - f[i]) * W[i] + f[i] * row
    set_weights(m, W, rows)
    return names


def cloth_def(plan):
    """The manifest's "cloth" for a figure (src/gfx/cloth.js), lengths in the file's metres. The legs' capsules start a
    quarter of the way down the thigh (higher, they would sit in the pelvis and shove the skirt's top out every frame)
    and are thinned until no point of the cloth at rest is inside one: at rest nothing pushes, only a leg that moves
    into the cloth does."""
    R = {s: tuple(float(x) for x in r) for s, r in plan['R'].items()}; Hs = float(plan['Hs'])
    co, J = body(plan['key'])
    pts = np.array([j for c in plan['cols'] if c for j in c['joints'][1:]])
    # both legs alike (the cloth at rest is seldom even, and a thin leg on one side would slip through it): the thinner
    # of the two at each part, thinned again until no point of the cloth at rest is inside
    caps = {}
    for s in ('Left', 'Right'):
        hip, kn, an, ba = (np.array(J[s + n], dtype=np.float64) for n in ('UpLeg', 'Leg', 'Foot', 'ToeBase'))
        rt, rk, ra = (min(R['Left'][i], R['Right'][i]) for i in range(3))
        for part, (a, b, r0, r1, na, nb) in enumerate(((hip + (kn - hip) * 0.25, kn, rt, rk, 'UpLeg', 'Leg'), (kn, an, rk, ra, 'Leg', 'Foot'),
                                                     (an, ba, 0.04 * Hs, 0.035 * Hs, 'Foot', 'ToeBase'))):
            ab = b - a; t = np.clip(((pts - a) @ ab) / (ab @ ab), 0, 1)
            d = np.linalg.norm(pts - (a + np.outer(t, ab)), axis=1) - 0.008 * Hs
            k = min(1.0, float(np.min(d / (r0 + (r1 - r0) * t)))) if len(pts) else 1.0
            f0 = 0.25 if na == 'UpLeg' else 0.0                        # a fraction of the way from boneA to boneB
            caps[(s, part)] = [s + na, s + nb, r0, r1, f0, k]
    out = []
    for (s, part), c in sorted(caps.items(), key=lambda x: (x[0][0], x[0][1])):
        k = min(caps[('Left', part)][5], caps[('Right', part)][5])
        k = max(k, 0.025 * Hs / max(c[2], c[3]))
        out.append([c[0], c[1], round(c[2] * k, 4), round(c[3] * k, 4), c[4]])
    caps = out
    pieces = {p['name']: {'ring': p['ring'], 'stiff': [0.45, 0.06], 'damp': 0.08} for p in plan['pieces']}
    return {'pieces': pieces, 'capsules': caps, 'floor': True}


def cloth(key, over=None, save=True):
    """Plans and builds one figure's cloth and writes its manifest entry to tools/build/rig/cloth/<key>.json."""
    plan = cloth_plan(key, over)
    out = os.path.join(RIGOUT, 'cloth'); os.makedirs(out, exist_ok=True)
    if not plan:
        uncloth(key)
        if save: json.dump({'key': key, 'cloth': None}, open(os.path.join(out, key + '.json'), 'w'))
        return None
    names = cloth_build(key, plan)
    info = {'key': key, 'cloth': cloth_def(plan), 'bones': len(names),
            'pieces': {p['name']: {'ring': p['ring'], 'cols': p['cols']} for p in plan['pieces']},
            'drop': plan['drop'], 'count': plan['count'], 'top': (plan['top'] - plan['floor']) / plan['Hs']}
    if save: json.dump(info, open(os.path.join(out, key + '.json'), 'w'), indent=1, default=float)
    return info


def export_figure(key, path, T=None):
    """Builds (if no Target is given) and exports one figure to a .glb at 24 frames a second, its body and armature
    shown first: the exporter leaves out what is hidden, and a .glb with no body sizes to nothing in the game."""
    sc.render.fps = 24; sc.render.fps_base = 1.0
    arm = bpy.data.objects[key]; m = bpy.data.objects[key + '_mesh']
    for o in (arm, m):
        o.hide_viewport = False; o.hide_render = False
        try: o.hide_set(False)
        except RuntimeError: pass
    if T is None: T = Target.rebuild(key); T.build(klass(key))
    T.export(path)
    return T
