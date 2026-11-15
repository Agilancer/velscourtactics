"""bm's hero clips as a motion source for retarget.py and mixamo.py.

bm's heroes walk calmer than the Mixamo library: an upright body, a long easy stride, the back foot peeling off the floor
rather than kicked up behind. So the Meshy figures take their walk and run from bm's hero bank
(assets/models/clips/heroes.json + .bin, read as src/gfx/clipbank.js reads it) instead of the library's.

bm_load() makes each clip an armature MX:bm:<clip> in the MX collection, its 24 bones named as Mixamo's and standing
where bm's hero rig stands at rest, the clip keyed on it one Blender frame per bank frame (mixamo.spf: 1/30 s for 'bm:').
Then Target.mx_sample('bm:<clip>', t) poses any figure as bm's heroes move (mixamo.py calibrates each rig to it).

Run inside Blender after retarget.py and mixamo.py, into the same namespace:
    exec(open(ROOT + 'tools/blender/bmclips.py').read(), NS); NS['bm_load'](ROOT)
"""
import bpy, json, math, os
import numpy as np
from mathutils import Vector, Quaternion, Matrix

# bm's joint names to Mixamo's, the 24 bones a Meshy figure has
BM_CORE = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_02': 'Spine1', 'spine_03': 'Spine2', 'neck_01': 'Neck', 'Head': 'Head'}
for _s, _S in (('l', 'Left'), ('r', 'Right')):
    BM_CORE.update({'clavicle_' + _s: _S + 'Shoulder', 'upperarm_' + _s: _S + 'Arm', 'lowerarm_' + _s: _S + 'ForeArm',
                    'hand_' + _s: _S + 'Hand', 'thigh_' + _s: _S + 'UpLeg', 'calf_' + _s: _S + 'Leg', 'foot_' + _s: _S + 'Foot',
                    'ball_' + _s: _S + 'ToeBase'})
BM_CHILD = {'Hips': 'Spine', 'Spine': 'Spine1', 'Spine1': 'Spine2', 'Spine2': 'Neck', 'Neck': 'Head'}
for _S in ('Left', 'Right'):
    BM_CHILD.update({_S + 'Shoulder': _S + 'Arm', _S + 'Arm': _S + 'ForeArm', _S + 'ForeArm': _S + 'Hand',
                     _S + 'UpLeg': _S + 'Leg', _S + 'Leg': _S + 'Foot', _S + 'Foot': _S + 'ToeBase'})


def bm_bank(root, bank='assets/models/clips/heroes'):
    meta = json.load(open(os.path.join(root, bank + '.json')))
    raw = open(os.path.join(root, bank + '.bin'), 'rb').read(); split = meta['pelvisByteOffset']
    rot = np.frombuffer(raw, dtype=np.int16, count=split // 2).astype(np.float64) / 32767
    pel = np.frombuffer(raw, dtype=np.float32, offset=split).astype(np.float64)
    return meta, rot, pel


def bm_world(sk, qs, pelvis):
    """Every joint's turn and place in Blender's world (z up) for local turns qs and the pelvis's place in the root."""
    up = Quaternion((1, 0, 0), math.radians(90))                  # the file's y-up to Blender's z-up (the root undoes it)
    W = []
    for j, J in enumerate(sk):
        t = Vector(pelvis if j == 1 else J['t']); q = qs[j]
        if J['parent'] < 0: W.append((up @ q, up @ t))
        else:
            pq, pt = W[J['parent']]; W.append((pq @ q, pt + pq @ t))
    return W


def bm_load(root, clips=('Walk_Loop', 'Jog_Fwd_Loop'), bank='assets/models/clips/heroes'):
    meta, rot, pel = bm_bank(root, bank)
    sk = meta['skeleton']
    Q = lambda r: Quaternion((r[3], r[0], r[1], r[2])).normalized()
    rest = bm_world(sk, [Q(j['r']) for j in sk], sk[1]['t'])
    idx = {CORE: j for j, J in enumerate(sk) for k, CORE in BM_CORE.items() if J['name'] == k}
    # each bone's parent among the 24: its nearest ancestor that is one of them
    par = {}
    for n, j in idx.items():
        p = sk[j]['parent']
        while p >= 0 and sk[p]['name'] not in BM_CORE: p = sk[p]['parent']
        par[n] = BM_CORE[sk[p]['name']] if p >= 0 else None
    order = []

    def walk(n):
        order.append(n)
        for c in [c for c in idx if par[c] == n]: walk(c)
    walk('Hips')
    sc = bpy.context.scene
    col = bpy.data.collections.get('MX') or bpy.data.collections.new('MX')
    if col.name not in sc.collection.children: sc.collection.children.link(col)
    col.hide_viewport = False
    made = []
    for clip in clips:
        nm = 'MX:bm:' + clip; c = meta['clips'][clip]
        for o in [bpy.data.objects.get(nm)]:
            if o: bpy.data.objects.remove(o, do_unlink=True)
        if bpy.data.actions.get(nm): bpy.data.actions.remove(bpy.data.actions[nm])
        ad = bpy.data.armatures.new(nm); arm = bpy.data.objects.new(nm, ad); col.objects.link(arm)
        arm.hide_viewport = False
        for o in bpy.context.selected_objects: o.select_set(False)
        bpy.context.view_layer.objects.active = arm; arm.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        for n in order:
            eb = ad.edit_bones.new('mixamorig:' + n); eb.head = rest[idx[n]][1]
            ch = BM_CHILD.get(n)
            if ch: eb.tail = rest[idx[ch]][1]
            elif n == 'Head': eb.tail = eb.head + Vector((0, 0, 0.18))
            else:                                                  # a hand or a toe: on along the bone before it
                a = rest[idx[par[n]]][1]; d = (eb.head - a); eb.tail = eb.head + d.normalized() * max(0.05, d.length * 0.4)
            if (eb.tail - eb.head).length < 1e-3: eb.tail = eb.head + Vector((0, 0, 0.05))
        for n in order:
            if par[n]: ad.edit_bones['mixamorig:' + n].parent = ad.edit_bones['mixamorig:' + par[n]]
        bpy.ops.object.mode_set(mode='OBJECT')
        bl = ad.bones; RB = {n: bl['mixamorig:' + n].matrix_local.to_quaternion() for n in order}
        RM = {n: bl['mixamorig:' + n].matrix_local for n in order}
        arm.animation_data_create(); act = bpy.data.actions.new(nm); act.use_fake_user = True
        arm.animation_data.action = act
        prev = {}
        tr = {j: (off, still) for j, off, still in c['tracks']}
        for i in range(c['frames']):
            qs = []
            for j, J in enumerate(sk):
                if j in tr:
                    off, still = tr[j]; o = off + (0 if still else i * 4)
                    qs.append(Quaternion((rot[o + 3], rot[o], rot[o + 1], rot[o + 2])).normalized())
                else: qs.append(Q(J['r']))
            pv = pel[c['pelvis'] + i * 3: c['pelvis'] + i * 3 + 3]
            W = bm_world(sk, qs, pv)
            M = {}
            for n in order:
                j = idx[n]; q = W[j][0] @ rest[j][0].inverted() @ RB[n]
                M[n] = Matrix.LocRotScale(W[j][1], q, Vector((1, 1, 1)))
                basis = (RM[n].inverted() @ M[n]) if not par[n] else ((RM[par[n]].inverted() @ RM[n]).inverted() @ M[par[n]].inverted() @ M[n])
                loc, bq, _ = basis.decompose()
                if n in prev and prev[n].dot(bq) < 0: bq = -bq
                prev[n] = bq
                pb = arm.pose.bones['mixamorig:' + n]; pb.rotation_mode = 'QUATERNION'
                pb.rotation_quaternion = bq; pb.keyframe_insert('rotation_quaternion', frame=i, group=pb.name)
                if not par[n]: pb.location = loc; pb.keyframe_insert('location', frame=i, group=pb.name)
        arm.hide_viewport = True; arm.hide_render = True
        made.append((nm, c['frames'], round(c['dur'], 3)))
    return made
