# Rigs for the summons that are not people (wolf, slime, whelp, turret, totem): an armature built here bone by bone,
# skinned by distance to the bones (Meshy's meshes are shells within shells, bone heat fails on them), and clips keyed
# by hand. exec'd inside Blender; front is -Y (glTF +Z), up +Z, the creature's left +X.
import bpy, os, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(
    globals().get('__file__', r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics\tools\blender\creature.py")))))
SHOTS = os.path.join(REPO, 'tools', 'build', 'shots', 'creatures')
sc = bpy.context.scene
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))


def prep(key, height, rotz=0):
    """The imported mesh <key>_s2 turned to face -Y, scaled to its height in metres, its feet on z=0 at the origin."""
    m = bpy.data.objects[key + '_s2']
    if m.get('prepped'): return m
    m.rotation_mode = 'XYZ'; m.location = (0, 0, 0); m.rotation_euler = (0, 0, math.radians(rotz)); m.scale = (1, 1, 1)   # the glTF import leaves it in quaternions
    bpy.context.view_layer.update()
    me = m.data; me.transform(m.matrix_world); m.matrix_world = Matrix.Identity(4)
    co = np.array([v.co[:] for v in me.vertices]); lo, hi = co.min(0), co.max(0)
    s = height / (hi[2] - lo[2])
    me.transform(Matrix.Scale(s, 4) @ Matrix.Translation(Vector((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))))
    me.update(); m['prepped'] = 1
    return m


def profile(key, axis=1, n=12):
    """The mesh in slices along an axis: each slice's span and its centre, for placing bones by eye."""
    m = bpy.data.objects[key + '_s2']; co = np.array([v.co[:] for v in m.data.vertices])
    lo, hi = co[:, axis].min(), co[:, axis].max(); out = []
    for i in range(n):
        a, b = lo + (hi - lo) * i / n, lo + (hi - lo) * (i + 1) / n; s = co[(co[:, axis] >= a) & (co[:, axis] <= b)]
        if len(s): out.append((round((a + b) / 2, 3), 'x', round(s[:, 0].min(), 3), round(s[:, 0].max(), 3), 'y', round(s[:, 1].min(), 3), round(s[:, 1].max(), 3),
                               'z', round(s[:, 2].min(), 3), round(s[:, 2].max(), 3), 'n', len(s)))
    return out


def armature(key, bones):
    """bones: [(name, head, tail, parent or None)], in metres. The rolls are left to Blender: every pose below is keyed as
    turns about the armature's own axes (rot), so a bone's own axes never matter."""
    name = key + '_rig'
    old = bpy.data.objects.get(name)
    if old: bpy.data.objects.remove(old, do_unlink=True)
    ad = bpy.data.armatures.new(name); arm = bpy.data.objects.new(name, ad)
    bpy.data.objects[key + '_s2'].users_collection[0].objects.link(arm)
    bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for nm, h, t, par in bones:
        e = ad.edit_bones.new(nm); e.head = Vector(h); e.tail = Vector(t); e.roll = 0
        if par: e.parent = ad.edit_bones[par]; e.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'
    return arm


def seg_dist(P, a, b):
    ab = b - a; t = np.clip(((P - a) @ ab) / max(ab @ ab, 1e-9), 0, 1)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)


def skin(key, arm, allowed=None, r=0.06, passes=3, rigid=None, squash=(1, 1, 1)):
    """Each vertex weighted to the bones by distance (a gaussian of radius r, metres), the four nearest kept.
    allowed(P) -> {bone: bool mask}: which vertices a bone may take at all (a leg keeps to its own side).
    rigid(P) -> bone index per vertex: a machine, each vertex wholly one bone's."""
    m = bpy.data.objects[key + '_s2']; me = m.data; P = np.array([v.co[:] for v in me.vertices])
    names = [b.name for b in arm.data.bones]
    if rigid:
        Wt = np.zeros((len(P), len(names))); Wt[np.arange(len(P)), rigid(P)] = 1
    else:
        k = np.array(squash)                                                    # distances measured in a squashed space (a post: height only)
        D = np.stack([seg_dist(P * k, np.array(arm.data.bones[n].head_local[:]) * k, np.array(arm.data.bones[n].tail_local[:]) * k) for n in names], 1)
        if allowed:
            masks = allowed(P)
            for j, n in enumerate(names):
                if n in masks: D[~masks[n], j] = 1e3
        Wt = np.exp(-(D / r) ** 2) + 1e-12 * (D == D.min(1, keepdims=True))   # the nearest bone always keeps a little
        nb = [[] for _ in range(len(P))]
        for e in me.edges: a, b = e.vertices; nb[a].append(b); nb[b].append(a)
        for _ in range(passes):                                                 # smoothed over the edges
            Wn = Wt / Wt.sum(1, keepdims=True); S = Wn.copy()
            for i, ns in enumerate(nb):
                if ns: S[i] = 0.5 * Wn[i] + 0.5 * Wn[ns].mean(0)
            Wt = S
            if allowed:
                for j, n in enumerate(names):
                    if n in masks: Wt[~masks[n], j] = 0
        top = np.argsort(-Wt, 1)[:, 4:]; np.put_along_axis(Wt, top, 0, 1)
    Wt = Wt / np.maximum(Wt.sum(1, keepdims=True), 1e-12)
    m.vertex_groups.clear()
    for j, n in enumerate(names):
        g = m.vertex_groups.new(name=n); idx = np.nonzero(Wt[:, j] > 1e-3)[0]
        for i in idx: g.add([int(i)], float(Wt[i, j]), 'REPLACE')
    for md in [md for md in m.modifiers if md.type == 'ARMATURE']: m.modifiers.remove(md)
    md = m.modifiers.new('Armature', 'ARMATURE'); md.object = arm
    m.parent = arm; m.matrix_parent_inverse = Matrix.Identity(4)
    print(key, 'skinned:', {n: int((Wt[:, j] > 0.5).sum()) for j, n in enumerate(names)})


# ---- posing: a pose is {bone: [turns]} with ('loc', Vector) for a bone's shift and ('scale', Vector) for its size,
#      a turn being (axis, degrees) about the armature's own axes. A bone's turn is carried by what it hangs from.
def rot(bone, axis, deg):
    q = bone.matrix_local.to_quaternion()
    return q.inverted() @ Quaternion(Vector(axis).normalized(), math.radians(deg)) @ q


def key_pose(arm, f, pose):
    for pb in arm.pose.bones:
        b = pb.bone; q = Quaternion(); loc = Vector(); s = Vector((1, 1, 1))
        for t in pose.get(pb.name, []):
            if t[0] == 'loc': loc = loc + b.matrix_local.to_3x3().inverted() @ Vector(t[1])
            elif t[0] == 'scale': s = Vector(t[1])
            elif t[1]: q = q @ rot(b, t[0], t[1])
        pb.rotation_quaternion = q; pb.location = loc; pb.scale = s
        pb.keyframe_insert('rotation_quaternion', frame=f); pb.keyframe_insert('location', frame=f); pb.keyframe_insert('scale', frame=f)


def clip(arm, name, keys, loop=False):
    """keys: [(frame, pose)]. A looping clip gets its first pose again one step after its last key."""
    nm = arm.name + ':' + name
    old = bpy.data.actions.get(nm)
    if old: bpy.data.actions.remove(old)
    act = bpy.data.actions.new(nm)
    if not arm.animation_data: arm.animation_data_create()
    arm.animation_data.action = act
    for t in arm.animation_data.nla_tracks: t.mute = True
    for f, p in keys: key_pose(arm, f, p)
    act.use_fake_user = True
    for fc in getattr(act, 'fcurves', []):
        for k in fc.keyframe_points: k.interpolation = 'BEZIER'
    return act


def merge(*poses):
    out = {}
    for p in poses:
        for b, ts in p.items(): out[b] = out.get(b, []) + list(ts)
    return out


def export(key, arm, names, path, tex=1024):
    m = bpy.data.objects[key + '_s2']
    for slot in m.material_slots:
        for nd in slot.material.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image and nd.image.size[0] > tex: nd.image.scale(tex, tex)
    ad = arm.animation_data; ad.action = None
    for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
    for nm in names:
        a = bpy.data.actions[arm.name + ':' + nm]; t = ad.nla_tracks.new(); t.name = nm; t.strips.new(nm, int(a.frame_range[0]), a)
    bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); m.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                              export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_force_sampling=True, export_optimize_animation_size=True)
    print(key, 'exported', round(os.path.getsize(path) / 1e6, 2), 'MB,', len(names), 'clips')


def use(arm, name):
    a = bpy.data.actions[arm.name + ':' + name]; arm.animation_data.action = a
    try: arm.animation_data.action_slot = a.slots[0]
    except Exception: pass
    for t in arm.animation_data.nla_tracks: t.mute = True
    return a


def shoot(key, arm, names, n=7, w=160, h=200, view=(0.75, -1, 0.35), scale=1.6, aim=0.5):
    """Each clip as n frames (<SHOTS>/<key>/<clip>_<i>.png) and the body from four sides, for tools/clipsheet.py."""
    folder = os.path.join(SHOTS, key); os.makedirs(folder, exist_ok=True)
    m = bpy.data.objects[key + '_s2']; cam = bpy.data.objects['ShotCam']; sc.camera = cam
    was = [(o, o.hide_render) for o in bpy.data.objects if o.type in ('MESH', 'ARMATURE')]
    for o, _ in was: o.hide_render = o is not m
    sc.render.engine = 'BLENDER_WORKBENCH'; sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_specular_highlight = False
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.4
    sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.file_format = 'PNG'
    sc.render.resolution_percentage = 100

    def place(v, s, w_, h_):
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = s; d = Vector(v).normalized()
        cam.location = Vector((0, 0, aim)) + d * 8; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        sc.render.resolution_x = w_; sc.render.resolution_y = h_
    use(arm, names[0]); sc.frame_set(0)
    for side, v in (('front', (0, -1, 0.12)), ('three_quarter', (0.75, -1, 0.35)), ('side', (1, 0, 0.12)), ('back', (0, 1, 0.12))):
        place(v, scale * 0.9, 300, 400); sc.render.filepath = os.path.join(folder, 'body_%s.png' % side); bpy.ops.render.render(write_still=True)
    place(view, scale, w, h)
    for name in names:
        a = use(arm, name); f0, f1 = a.frame_range
        for i in range(n):
            f = f0 + (f1 - f0) * i / max(1, n - 1); sc.frame_set(int(f), subframe=f - int(f))
            sc.render.filepath = os.path.join(folder, '%s_%d.png' % (name, i)); bpy.ops.render.render(write_still=True)
    for o, v in was: o.hide_render = v
