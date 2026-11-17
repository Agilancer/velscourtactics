"""Mixamo clips onto the game's figures, inside Blender, on top of retarget.py.

The source clips are Mixamo downloads (docs/MODELS.md section 13): single files on Y Bot, and two packs on X Bot (the
axe pack, `axe:<clip>`, and the sword and shield pack, `sns:<clip>`). Each is imported as an armature named `MX:<clip>`
holding its action under the same name:

    exec(open(r"<repo>/tools/blender/retarget.py").read()); exec(open(r"<repo>/tools/blender/mixamo.py").read())
    load_mixamo(r"<folder of fbx>", {"axe": r"<unzipped axe pack>", "sns": r"<unzipped sword and shield pack>"})
    T = Target.attach("paladin_m_v2")
    T.take("Swing", "sns:sword and shield slash", 0.35, 1.2, contact=0.62)

How a pose crosses over. Both rigs have Mixamo's joints, but the figures stand differently at rest (Mixamo's in a
T, Meshy's in an A) and the bones point their own ways. So the figure is first put in the source's rest pose: every
segment turned, joint to joint, along the same direction as the source's (spine, neck, collarbones, arms, legs, feet),
the hands, head and toes kept as they are on their parents. Where both stand the same, the turn between each source
bone and the figure's is that bone's offset; after that a source pose is the source's turns times the offsets, in world
space, and the hips' travel scaled by how much taller the figure's hips stand.

Time. The single files run at 60 frames a second and Blender reads them at twice their length; the packs at 30. Every
time below is in real seconds from the clip's start (SPF). A take is timed so its blow lands at frame `at` (0.3 s at
24 frames a second): the wind-up is squeezed or stretched to fit, the rest plays at `post` times its own speed.
"""
import bpy, os, math
from mathutils import Vector, Quaternion, Matrix

MXH = 'mixamorig:Hips'
sc = bpy.context.scene


def spf(clip):
    """Real seconds per Blender frame of a source clip."""
    if clip.startswith('bm:'): return 1 / 30                    # bm's hero bank, one frame per bank frame (bmclips.py)
    return 1 / 24 if clip.startswith(('axe:', 'sns:')) else 1 / 48


def rot_of(M):
    return M.to_3x3().normalized().to_quaternion()


def load_mixamo(folder, packs=None):
    """Imports every .fbx (and each pack's, prefixed) as MX:<name>, armature and action only, into a collection MX."""
    col = bpy.data.collections.get('MX') or bpy.data.collections.new('MX')
    if col.name not in sc.collection.children: sc.collection.children.link(col)
    files = [(os.path.splitext(f)[0], os.path.join(folder, f)) for f in sorted(os.listdir(folder)) if f.lower().endswith('.fbx')]
    for pre, d in (packs or {}).items():
        files += [(pre + ':' + os.path.splitext(f)[0], os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.lower().endswith('.fbx') and f != 'X Bot.fbx']
    for name, path in files:
        if bpy.data.objects.get('MX:' + name): continue
        before = set(bpy.data.objects); acts = set(bpy.data.actions)
        bpy.ops.import_scene.fbx(filepath=path, ignore_leaf_bones=False)
        new = [o for o in bpy.data.objects if o not in before]; na = [a for a in bpy.data.actions if a not in acts]
        arm = next((o for o in new if o.type == 'ARMATURE'), None)
        for o in new:
            if o is not arm: bpy.data.objects.remove(o, do_unlink=True)
        if not arm or not na: continue
        arm.name = 'MX:' + name
        for c in arm.users_collection: c.objects.unlink(arm)
        col.objects.link(arm); arm.hide_viewport = True; arm.hide_render = True
        na[0].name = 'MX:' + name; na[0].use_fake_user = True
        for x in na[1:]: bpy.data.actions.remove(x)


def body_frame(head, hips, lup, rup, foot, toe):
    """A figure's left, forward and up as a rotation (columns), from its joints at rest."""
    U = (head - hips).normalized(); Lf = lup - rup; Lf = (Lf - U * Lf.dot(U)).normalized()
    F = U.cross(Lf).normalized()
    if F.dot(toe - foot) < 0: F = -F
    return Matrix((Lf, F, U)).transposed()


CANON = {}


def canon(arm):
    """The turn from a source rig's own armature space to the game's frame (Z up, facing -Y, left +X). The single
    files arrive turned upright and the packs lying in Mixamo's Y-up space, so it is read off the skeleton, not the object."""
    if arm.name in CANON: return CANON[arm.name]
    bl = arm.data.bones; J = lambda n: bl['mixamorig:' + n].head_local
    S = body_frame(J('Head'), J('Hips'), J('LeftUpLeg'), J('RightUpLeg'), J('LeftFoot'), J('LeftToeBase'))
    G = Matrix(((1, 0, 0), (0, -1, 0), (0, 0, 1))).transposed()          # left +X, forward -Y, up +Z
    CANON[arm.name] = (G @ S.inverted()).to_quaternion()
    return CANON[arm.name]


REST = {}


def swap(n):
    return n.replace('Left', '#').replace('Right', 'Left').replace('#', 'Right')


def src_pose(clip, t, mirror=False):
    """Every source bone's rotation and joint, in the game's frame (canon), t real seconds into the clip. mirror: the clip
    done the other way about, left for right: each bone takes its twin's turn away from its rest, reflected."""
    arm = bpy.data.objects['MX:' + clip]; a = bpy.data.actions['MX:' + clip]
    if arm.hide_viewport: arm.hide_viewport = False           # a hidden rig is never posed by the frame change
    if not arm.animation_data: arm.animation_data_create()
    if arm.animation_data.action != a:
        arm.animation_data.action = a
        try: arm.animation_data.action_slot = a.slots[0]
        except Exception: pass
    f = a.frame_range[0] + t / spf(clip)
    f = max(a.frame_range[0], min(a.frame_range[1], f))
    sc.frame_set(int(f), subframe=f - int(f)); bpy.context.view_layer.update()
    C = canon(arm)                                       # (in the rig's own units: the ratio in MxCal takes them to metres)
    raw = {pb.name: (C @ pb.matrix.to_quaternion(), C @ pb.head) for pb in arm.pose.bones}
    if not mirror: return raw
    if arm.name not in REST: REST[arm.name] = {b.name: C @ b.matrix_local.to_quaternion() for b in arm.data.bones}
    R = REST[arm.name]; out = {}
    for n in raw:
        m = swap(n) if swap(n) in raw else n; q, x = raw[m]
        D = q @ R[m].inverted(); D = Quaternion((D.w, D.x, -D.y, -D.z))       # the twin's turn, seen in a mirror across left-right
        out[n] = (D @ R[n], Vector((-x.x, x.y, x.z)))
    return out


def src_length(clip):
    a = bpy.data.actions['MX:' + clip]; return (a.frame_range[1] - a.frame_range[0]) * spf(clip)


# the joint each bone is aimed at, to stand the figure in the source's rest pose
AIM = [('Spine', 'Spine1'), ('Spine1', 'Spine2'), ('Spine2', 'Neck'), ('Neck', 'Head')]
for s in ('Left', 'Right'):
    AIM += [(s + 'Shoulder', s + 'Arm'), (s + 'Arm', s + 'ForeArm'), (s + 'ForeArm', s + 'Hand'),
            (s + 'UpLeg', s + 'Leg'), (s + 'Leg', s + 'Foot'), (s + 'Foot', s + 'ToeBase')]
    for f in ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky'):                 # fingers, on a figure that has them (bm's)
        AIM += [('%sHand%s%d' % (s, f, i), '%sHand%s%d' % (s, f, i + 1)) for i in (1, 2, 3)]


class MxCal:
    pass


def _mx_calibrate(self, clip):
    """The offsets from a source rig (the one that clip was made on) to this figure, cached by the rig's build."""
    src = bpy.data.objects['MX:' + clip]; bl = src.data.bones
    sig = round(bl[MXH].head_local.length, 3)
    if not hasattr(self, 'mxcal'): self.mxcal = {}
    if sig in self.mxcal: return self.mxcal[sig]
    C = canon(src); Mt = self.arm.matrix_world; Rt = rot_of(Mt)
    J = lambda n: C @ bl['mixamorig:' + n].head_local
    p = {n: (Quaternion(), Vector((0, 0, 0))) for n in self.order}
    for a, b in AIM:
        A, B = 'mixamorig:' + a, 'mixamorig:' + b
        if A not in self.arm.data.bones or B not in self.arm.data.bones: continue
        p = self.aim(p, A, B, (Rt.inverted() @ (J(b) - J(a))).normalized())
    Q, X = self.fk(p)
    c = MxCal(); c.sig = sig; c.tpose = p; c.clip = clip
    c.off = {n: (C @ bl[n].matrix_local.to_quaternion()).inverted() @ (Rt @ Q[n]) for n in self.order if n in bl}
    # heights over each one's floor (the lowest ankle or toe joint at rest), so the hips' rise and fall and a foot's
    # height off the floor carry over in proportion, from the source's units to metres
    c.src_floor = min((C @ bl[n].head_local).z for n in bl.keys() if n.endswith(('Foot', 'ToeBase')))
    tb = self.arm.data.bones
    tfloor = min((Mt @ tb[n].head_local).z for n in tb.keys() if n.endswith(('Foot', 'ToeBase')))
    c.src_hips = J('Hips'); c.tgt_hips = Mt @ tb[MXH].head_local
    c.ratio = (c.tgt_hips.z - tfloor) / max(1e-6, c.src_hips.z - c.src_floor)
    # an arm's length in the figure's own units over the source's, for things measured off the hands
    reach = lambda P: sum((P(s + b) - P(s + a)).length for s in ('Left', 'Right') for a, b in (('Arm', 'ForeArm'), ('ForeArm', 'Hand')))
    c.arm = reach(lambda n: tb['mixamorig:' + n].head_local) / reach(J)
    self.mxcal[sig] = c
    return c


def fist(sp, side):
    """A source hand's grip, from its curled fingers: the middle of the four loops they make (knuckle, joints, tip), the
    axis they wrap round, pinky to index (where a held blade comes out past the thumb), and the way the knuckles face."""
    P = lambda n: sp['mixamorig:%sHand%s' % (side, n)][1]
    loops = [sum((P('%s%d' % (f, i)) for i in (1, 2, 3, 4)), Vector()) / 4 for f in ('Index', 'Middle', 'Ring', 'Pinky')]
    hand = sp['mixamorig:%sHand' % side][1]
    ax = ((loops[0] + loops[1]) - (loops[2] + loops[3])).normalized()
    kn = P('Middle1') - hand; kn = (kn - ax * kn.dot(ax)).normalized()
    return sum(loops, Vector()) / 4, ax, kn


def _mx_grip(self, clip, t, side):
    """Where a fist of that clip holds things, in this figure's hand bone (its own frame and units): the grip's middle,
    its axis and its knuckles' way. The figure's hand turns as the source's does, so this place rides it in every take."""
    c = self.mx_calibrate(clip); sp = src_pose(clip, t)
    ctr, ax, kn = fist(sp, side)
    h = 'mixamorig:%sHand' % side
    to = c.off[h].inverted() @ sp[h][0].inverted()
    return to @ (ctr - sp[h][1]) * c.arm, (to @ ax).normalized(), (to @ kn).normalized()


def _mx_convert(self, sp, c):
    """A source world pose as this figure's local pose (retarget.py's form: {bone: (rotation, location)})."""
    Mt = self.arm.matrix_world; Rti = rot_of(Mt).inverted(); bl = self.arm.data.bones; Qa = {}; out = {}
    for n in self.order:
        b = bl[n]
        if n in sp and n in c.off: Qa[n] = Rti @ sp[n][0] @ c.off[n]
        else: Qa[n] = (Qa[b.parent.name] @ self.restq[n]) if b.parent else self.restQ[n]
    for n in self.order:
        b = bl[n]
        if b.parent: out[n] = ((Qa[b.parent.name] @ self.restq[n]).inverted() @ Qa[n], Vector((0, 0, 0)))
        else:
            pw = c.tgt_hips + (sp[MXH][1] - c.src_hips) * c.ratio
            out[n] = (self.restq[n].inverted() @ Qa[n], self.resth.inverted() @ (Mt.inverted() @ pw))
    return out


def _mx_floor(self, p, sp, c):
    """The figure raised or lowered so its foot nearest the floor is as high off it as the source's, in proportion.
    Each ankle and ball is measured from its own height at rest, so a heel strike (the ankle down, the toes up) and a
    toe-off (the ball down, the heel up) both stand on the floor, and only a jump's flight leaves it."""
    if not hasattr(c, 'src_rest'):
        bl = bpy.data.objects['MX:' + c.clip].data.bones; C = canon(bpy.data.objects['MX:' + c.clip])
        c.src_rest = {n: (C @ bl[n].head_local).z for n in bl.keys() if n.endswith(('Foot', 'ToeBase')) and 'mixamorig:' in n}
    lo = min(sp[n][1].z - z for n, z in c.src_rest.items() if n in sp)
    rest = getattr(self, 'rest_z', None) or {n: self.arm.data.bones[n].head_local.dot(self.Z) for n in self.FEET}
    _, X = self.fk(p)
    tlo = min(X[n].dot(self.Z) - z for n, z in rest.items() if n in X)
    up = max(0.0, lo) * c.ratio / self.arm.matrix_world.to_scale()[0] - tlo
    q, l = p[MXH]; p = dict(p); p[MXH] = (q, l + self.restQ[MXH].inverted() @ (self.Z * up)); return p


def _mx_headrest(self, p, c):
    """The neck and head moved from this figure's own rest by as much as the source moves from its rest. The calibration
    lines every bone up with the source's rest, which tips forward a head that sits back on its shoulders (a slime
    lord's, behind its belly) in every take."""
    if not hasattr(c, 'nod'):
        r = {n: (Quaternion(), Vector((0, 0, 0))) for n in self.order}
        c.nod = {n: self.nod(r, n) - self.nod(c.tpose, n) for n in self.NECK}
    for n in self.NECK:
        if abs(c.nod[n]) > 0.5: p = self.tilt(p, [n], 'fwd', c.nod[n])
    return p


def _mx_sample(self, clip, t, mirror=False):
    c = self.mx_calibrate(clip); sp = src_pose(clip, t, mirror)
    p = self.mx_convert(sp, c)
    if hasattr(self, 'nod'): p = _mx_headrest(self, p, c)
    return self.mx_floor(p, sp, c)


def _travel(self, p, ref, k, rise=1.0):
    """The hips' sideways and forward travel since ref kept at k of itself, measured from the tile (0: on the tile). A
    stretch cut from after a run-up (the run jump starts a body height ahead of where its clip began) starts on the
    tile all the same, and the take never pops forward on its first frames or back on its last. rise: how much of any
    lift above the idle's hip height to keep (a leap made a bound; crouches below it are kept whole)."""
    q, l = p[MXH]; R = self.restQ[MXH]; d = R @ (l - ref); h = R @ (self.home - ref)
    flat = d - self.Z * d.dot(self.Z); hflat = h - self.Z * h.dot(self.Z)
    up = d.dot(self.Z); hz = h.dot(self.Z)
    if rise != 1.0 and up > hz: up = hz + (up - hz) * rise
    p = dict(p); p[MXH] = (q, ref + R.inverted() @ (self.Z * up + flat * k + hflat)); return p


def _face(self, p, q0, k):
    """The hips' turn about the tile's up since q0 (an earlier pose's) taken k of the way off: the figure keeps facing
    the way it did while the rest of the move plays (a blow that spins the body away, held to the foe)."""
    q, l = p[MXH]; R = self.restQ[MXH]
    D = (R @ q) @ (R @ q0).inverted()                                  # the turn since q0, in armature space
    v = Vector((D.x, D.y, D.z)); z = self.Z
    tw = Quaternion((D.w, *(z * v.dot(z)))); tw.normalize()             # its twist about the up
    off = Quaternion().slerp(tw, k)
    p = dict(p); p[MXH] = (R.inverted() @ (off.inverted() @ (R @ q)), l); return p


def _take(self, name, clip, t0, t1, contact=None, at=7, post=1.0, blend_in=3, blend_out=8, travel=0.0, end=None,
          keep=None, hold=0, write=True, base=None, after=None, sides='RL', mirror=False, face=0, then=None, skip=None,
          first=None, rise=1.0, face_from='first'):
    """A stretch of a source clip, t0 to t1 real seconds, as a clip of this figure. Its first `blend_in` frames ease in
    from the idle, its blow (contact) lands at frame `at`, then it plays at `post` times its speed and eases back into the
    idle over `blend_out` frames. travel: how much of the hips' travel to keep (0 pins it to the tile; anything kept is
    eased off again by the end). rise: how much of a leap's lift above the idle's hips to keep. keep: bones left as the
    idle has them (the hand with the shield, say). hold: frames to hold the last sampled pose before easing out. after(f, p): a last word on each pose. face: how much of the hips'
    turn about the up to take off (1: the figure faces the foe all through), measured from the stretch's first pose, or
    from the idle's (face_from='idle': for a stretch cut from a wind-up already turned away). skip: (from, to) a still stretch of the
    source cut out (a long hold at full draw). first: (clip, from, to, speed, mirror) a stretch played before, at its own
    pace, crossfaded into the main one (a charge, then the throw); the blow still lands at `at`. then: (clip, from, to,
    speed, mirror, hold, blow) a stretch played straight after, crossfaded into over 8 frames, its last pose held `hold`
    frames, a blow of its own if given (a second arrow), before the ease out. Returns the keys and the frame each source
    second went to (`self.tmap`)."""
    B0 = base(0) if base else self.B0
    BI = base or self.BI
    more = []
    if isinstance(contact, (list, tuple)): contact, more = contact[0], list(contact[1:])     # a combo: every blow after the first
    cut = (skip[1] - skip[0]) if skip else 0.0
    virt = lambda s: s if not skip or s <= skip[0] else max(skip[0], s - cut)               # source seconds, the cut taken out
    real = lambda v: v if not skip or v <= skip[0] else v + cut
    tc = contact if contact is not None else t0 + (t1 - t0) * 0.35
    t1v, tcv = virt(t1), virt(tc)
    n1 = 0; lead = []
    if first:
        c1, a1, b1, sp1, mir1 = (tuple(first) + (1.0, False)[len(first) - 3:])[:5]
        n1 = max(2, round((b1 - a1) * 24 / sp1))
        lead = [(blend_in + i, (c1, a1 + (b1 - a1) * i / n1, mir1)) for i in range(n1)]
    m0 = blend_in + n1                                                # the frame the main stretch starts on
    pre = max(1, at - m0)                                             # frames from there to the blow
    spd_pre = (tcv - t0) / pre                                        # source seconds per frame before the blow
    n_post = max(1, round((t1v - tcv) * 24 / post))
    times = [(m0 + i, t0 + spd_pre * i) for i in range(pre)] + [(at + j, tcv + (t1v - tcv) * j / n_post) for j in range(n_post + 1)]
    self.tmap = lambda s: (m0 + (virt(s) - t0) / spd_pre) if virt(s) <= tcv else at + (virt(s) - tcv) / max(1e-6, t1v - tcv) * n_post
    keys = []; ref = None; q0 = None
    firstp = None
    def fix(p):
        nonlocal ref, q0
        if ref is None: ref = p[MXH][1].copy(); q0 = (B0 if face_from == 'idle' else p)[MXH][0].copy()
        p = self.travel(p, ref, travel, rise)
        if face: p = self.face(p, q0, face)
        if keep: p = self.mix(p, B0, keep[1], keep[0]) if isinstance(keep, tuple) else self.mix(p, B0, 1.0, keep)
        return p
    for f, (c1, s, mir1) in lead:
        p = fix(self.mx_sample(c1, s, mir1))
        if firstp is None: firstp = p
        keys.append((f, p))
    xf0 = 6 if lead else 0; pl0 = keys[-1][1] if lead else None
    for i, (f, s) in enumerate(times):
        p = fix(self.mx_sample(clip, real(s), mirror))
        if firstp is None: firstp = p
        if i < xf0: w = (i + 1) / xf0; p = self.mix(pl0, p, w * w * (3 - 2 * w))
        keys.append((f, p))
    # travel kept is taken off again over the last half of what follows the blow
    if travel:
        last = len(keys) - 1; mid = next(i for i, (f, _) in enumerate(keys) if f >= at)
        for i in range(mid, last + 1):
            w = min(1, (i - mid) / max(1, (last - mid))); w = w * w * (3 - 2 * w)
            f, p = keys[i]; q, l = p[MXH]
            keys[i] = (f, self.travel(p, ref, 1 - w))
    later = []
    if then:                    # the second stretch: its own pace, held to the tile, crossfaded into, its end held
        c2, s0, s1, sp2, mir2, hold2, bl2 = (tuple(then) + (1.0, False, 0, None)[len(then) - 3:])[:7]
        fl, pl = keys[-1]; xf = 8; n2r = max(1, round((s1 - s0) * 24 / sp2)); n2 = max(xf, n2r)
        for j in range(1, n2 + 1):
            p = self.mx_sample(c2, s0 + (s1 - s0) * min(1.0, j / n2r), mir2)
            p = self.travel(p, ref, 0)
            if face: p = self.face(p, q0, face)
            if keep: p = self.mix(p, B0, keep[1], keep[0]) if isinstance(keep, tuple) else self.mix(p, B0, 1.0, keep)
            if j < xf: w = j / xf; p = self.mix(pl, p, w * w * (3 - 2 * w))
            keys.append((fl + j, p))
        if bl2 is not None: later.append(round(fl + (bl2 - s0) / (s1 - s0) * n2r, 2))
        if hold2: keys.append((fl + n2 + hold2, keys[-1][1]))
    out = [(0, B0)]
    for i in range(1, blend_in):
        w = i / blend_in; w = w * w * (3 - 2 * w)
        out.append((i, self.mix(B0, firstp, w)))
    out += keys
    fl, pl = keys[-1]
    if hold: out.append((fl + hold, pl)); fl += hold
    for i in range(1, blend_out + 1):
        w = i / blend_out; w = w * w * (3 - 2 * w)
        out.append((fl + i, self.mix(pl, BI(fl + i), w)))
    self.ease = (blend_in, fl, fl + blend_out); self.blow = at                # for after's hooks
    if after: out = [(f, after(f, p)) for f, p in out]
    if write: self.write(name, out)
    if not hasattr(self, 'takes'): self.takes = {}
    self.takes[name] = {'keys': out, 'hits': [at] + [round(self.tmap(s), 2) for s in more] + later, 'ease': [blend_in, fl, fl + blend_out],
                        'travel': bool(travel), 'sides': sides}
    return out


def _mx_frames(self, keys):
    """A take's keys, one pose per frame: what falls between two keys is eased across, a turn at a time."""
    keys = sorted(keys, key=lambda k: k[0]); out = []
    for f in range(int(round(keys[-1][0])) + 1):
        j = next((i for i, (g, _) in enumerate(keys) if g >= f), len(keys) - 1)
        g1, p1 = keys[j]
        if g1 == f or j == 0: out.append(p1); continue
        g0, p0 = keys[j - 1]; w = (f - g0) / (g1 - g0)
        out.append({n: (p0[n][0].slerp(p1[n][0], w), p0[n][1].lerp(p1[n][1], w)) for n in p1})
    return out


def _mx_bank(self, path, takes, grip=None, fps=24, names=None, extra=None):
    """Writes this figure's takes as a clip bank beside its .glb (gfx/clipbank.js, mxClips): <path>.json and <path>.bin.

    takes: {name: {keys, hits: [frame], ease: [in, out from, out to], travel}}. Each bone's turn is kept as Blender keys
    it, against its rest (the pose's own turn, four Int16s over 32767 a frame); the game puts it on the bone's rest from
    the .glb, which is the same rest. The hips' place the same way, as Float32 xyz. grip: {side: (at, axis, knuckles)}.
    names: each bone's name in the file, from its name here (bm's for a hero body); extra: more for the .json."""
    import json, struct, array
    bones = list(self.order); rot = array.array('h'); loc = array.array('f'); clips = {}
    for name, tk in takes.items():
        frames = self.mx_frames(tk['keys']); n = len(frames)
        r0 = len(rot) // 4; l0 = len(loc) // 3
        for b in bones:
            prev = None
            for p in frames:
                q = p[b][0].normalized()
                if prev is not None and prev.dot(q) < 0: q = -q
                rot.extend(max(-32767, min(32767, int(round(v * 32767)))) for v in (q.x, q.y, q.z, q.w)); prev = q
        for p in frames: loc.extend(p[MXH][1])
        clips[name] = {'frames': n, 'dur': round((n - 1) / fps, 4), 'rot': r0, 'loc': l0,
                       'hits': [round(h / fps, 3) for h in tk.get('hits', [])], 'ease': [round(e / fps, 3) for e in tk.get('ease', [])],
                       'travel': bool(tk.get('travel')), 'sides': tk.get('sides', 'RL')}
    nm = names or (lambda n: n)
    meta = {'fps': fps, 'bones': [nm(b) for b in bones], 'hips': nm(MXH), 'rotBytes': len(rot) * 2, 'clips': clips, **(extra or {})}
    if grip: meta['grip'] = {s: [round(v, 4) for v in (*at, *ax, *kn)] for s, (at, ax, kn) in grip.items()}
    with open(path + '.bin', 'wb') as f: f.write(rot.tobytes()); f.write(loc.tobytes())
    with open(path + '.json', 'w') as f: json.dump(meta, f, separators=(',', ':'))
    print('bank', path, len(clips), 'clips', (len(rot) * 2 + len(loc) * 4) // 1024, 'KB')


# ---- bm's heroes: one rig (root, pelvis, spine_01..03, hand_r, index_01_r...) under every body, one bank for them all ----
UE = {'pelvis': 'Hips', 'spine_01': 'Spine', 'spine_02': 'Spine1', 'spine_03': 'Spine2', 'neck_01': 'Neck', 'Head': 'Head'}
for _s, _S in (('l', 'Left'), ('r', 'Right')):
    UE.update({'clavicle_' + _s: _S + 'Shoulder', 'upperarm_' + _s: _S + 'Arm', 'lowerarm_' + _s: _S + 'ForeArm', 'hand_' + _s: _S + 'Hand',
               'thigh_' + _s: _S + 'UpLeg', 'calf_' + _s: _S + 'Leg', 'foot_' + _s: _S + 'Foot', 'ball_' + _s: _S + 'ToeBase',
               'ball_leaf_' + _s: _S + 'Toe_End'})
    for _f in ('index', 'middle', 'ring', 'pinky', 'thumb'):
        for _i in (1, 2, 3): UE['%s_0%d_%s' % (_f, _i, _s)] = '%sHand%s%d' % (_S, _f.title(), _i)
        UE['%s_04_leaf_%s' % (_f, _s)] = '%sHand%s4' % (_S, _f.title())
UE_BACK = {'mixamorig:' + v: k for k, v in UE.items()}


def hero_target(glb, bank, key='bm_hero'):
    """A bm hero body as a Target for takes (no library sent through): its bones named as Mixamo's, the pelvis freed
    of the root above it (a bone's turn against its own rest is the same either way), and its idle the bank's Idle_Loop
    (bank: assets/models/clips/heroes without the extension), 24 frames a second."""
    import json, numpy as np
    before = set(bpy.data.objects); acts = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=glb)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == 'ARMATURE')
    meshes = [o for o in new if o.type == 'MESH']
    for a in [a for a in bpy.data.actions if a not in acts]: bpy.data.actions.remove(a)
    for b in arm.data.bones:
        if b.name in UE: b.name = 'mixamorig:' + UE[b.name]
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    arm.data.edit_bones[MXH].parent = None
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.name = key
    T = Target.__new__(Target); T.key = key; T.arm = arm
    T.mesh = max(meshes, key=lambda o: len(o.data.vertices)); T.meshes = meshes
    if not arm.animation_data: arm.animation_data_create()
    T.order = []

    def walk(b):
        T.order.append(b.name)
        for c in b.children: walk(c)
    walk(arm.data.bones[MXH])
    T.B = list(T.order)
    g = lambda *ks: [n for n in T.B if any(k in n for k in ks)]
    T.UP = g('Spine', 'Neck', 'Head', 'Shoulder', 'Arm', 'Hand'); T.RARM = [n for n in g('Shoulder', 'Arm', 'Hand') if 'Right' in n]
    T.LARM = [n for n in g('Shoulder', 'Arm', 'Hand') if 'Left' in n]; T.ARMS = T.RARM + T.LARM
    T.HEAD = g('Neck', 'Head'); T.SPINE = g('Spine'); T.LEGS = g('UpLeg', 'Leg', 'Foot', 'Toe')
    bl = arm.data.bones
    T.restq = {n: (bl[n].matrix_local if not bl[n].parent else bl[n].parent.matrix_local.inverted() @ bl[n].matrix_local).to_quaternion() for n in T.order}
    T.resth = bl[MXH].matrix_local.copy()
    # the idle, from the bank: each joint's turn in its parent (its rest times its key), the pelvis's place in the root's
    meta = json.load(open(bank + '.json')); raw = open(bank + '.bin', 'rb').read()
    rot = np.frombuffer(raw, dtype=np.int16, count=meta['pelvisByteOffset'] // 2).astype(np.float64) / 32767
    pel = np.frombuffer(raw, dtype=np.float32, offset=meta['pelvisByteOffset'])
    c = meta['clips']['Idle_Loop']; sk = meta['skeleton']; fr = c['frames']; fps = meta['fps']
    names = ['mixamorig:' + UE[j['name']] if j['name'] in UE else j['name'] for j in sk]
    Mi = arm.matrix_world.inverted()

    import struct
    head = open(glb, 'rb').read(); n = struct.unpack_from('<I', head, 12)[0]
    ext = json.loads(head[20:20 + n])['scenes'][0].get('extras', {})
    base, prest, ms = ext.get('pelvisBase', meta['pelvisRest']), meta['pelvisRest'], ext.get('motionScale', 1)
    T.motion = ms
    Q = lambda off: Quaternion((rot[off + 3], rot[off], rot[off + 1], rot[off + 2])).normalized()
    R0 = Quaternion((sk[0]['r'][3], sk[0]['r'][0], sk[0]['r'][1], sk[0]['r'][2]))       # the root's turn, y-up to z-up
    toW = Quaternion((1, 0, 0), math.radians(90)) @ R0                                    # the root's frame in Blender's world
    toA = rot_of(arm.matrix_world).inverted() @ toW

    def idle(f):
        x = (f / 24 * fps) % (fr - 1); i = int(x); w = x - i
        p = {n: (Quaternion(), Vector((0, 0, 0))) for n in T.order}
        for j, off, still in c['tracks']:
            n = names[j]
            if n not in p: continue
            qa, qb = (Q(off), Q(off)) if still else (Q(off + i * 4), Q(off + (i + 1) * 4))
            if qa.dot(qb) < 0: qb = -qb
            q = qa.slerp(qb, w)
            if n == MXH: p[n] = (T.resth.to_quaternion().inverted() @ toA @ q, p[n][1])
            else: p[n] = (T.restq[n].inverted() @ q, p[n][1])
        z = pel[c['pelvis'] + i * 3 + 2] * (1 - w) + pel[c['pelvis'] + (i + 1) * 3 + 2] * w
        at = Mi @ (toW @ Vector((base[0], base[1], base[2] + (z - prest[2]) * ms)))       # on the spot, the height kept
        p[MXH] = (p[MXH][0], T.resth.inverted() @ at)
        return p
    T.BI = lambda f=0: idle(f); T.B0 = idle(0); T.I0 = T.B0; T.home = T.B0[MXH][1].copy()
    T.body()
    return T


Target.mx_calibrate = _mx_calibrate
Target.mx_grip = _mx_grip
Target.mx_frames = _mx_frames
Target.mx_bank = _mx_bank
Target.mx_convert = _mx_convert
Target.mx_floor = _mx_floor
Target.mx_sample = _mx_sample
Target.travel = _travel
Target.face = _face
Target.take = _take
