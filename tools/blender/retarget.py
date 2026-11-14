"""Gives a freshly rigged Meshy character the game's animation set, inside Blender.

Run inside a Blender that has the motion library open: `LISANDRA OLD - tactics.blend`, which holds Lisandra's
armature ("Armature") and the Mixamo-style source clips (Idle_02, Walking, Running, Attack, Thrust_Slash,
Charged_Spell_Cast, Hit_Reaction, Dead, ...). Then, from Blender's Python (or the Blender MCP):

    exec(open(r"<repo>/tools/blender/retarget.py").read())
    T = Target("paladin_m", r"<path>/paladin_m_walk.glb")     # Meshy's "Animation_Walking_withSkin.glb"
    T.build("paladin")                                         # the common set plus that class's own clips
    T.sheet(["Idle", "Swing", "Smite"], "paladin_check")       # contact sheet into tools/build/shots/
    T.export(r"<repo>/assets/models/paladin_m.glb")
    T.props()                                                  # a class that holds things (the lancer): the manifest's "props"

How it works. Meshy's rig has the library's 24 bones under other names and with another bind pose, so local
rotations cannot be copied. Every library pose is carried over in armature space through an offset measured
where both figures are known to be in the same pose: frame 0 of the walk, which every Meshy rig comes with
and which is the same clip as the library's "Walking". The clips are then composed from those poses (arms
from one, legs from another, blended, retimed), all starting and ending in one idle and kept on their tile.
"""
import bpy, os, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

H = 'mixamorig:Hips'
# Meshy's bone names -> the library's
RENAME = {'Hips': 'Hips', 'Spine02': 'Spine', 'Spine01': 'Spine1', 'Spine': 'Spine2', 'neck': 'Neck', 'Head': 'Head', 'head_end': 'HeadTop_End'}
SRC = ['Idle_02', 'Attack', 'Axe_Spin_Attack', 'Charged_Slash', 'Left_Slash', 'Right_Hand_Sword_Slash', 'Thrust_Slash', 'Hit_Reaction', 'Dead',
       'Charged_Spell_Cast', 'mage_soell_cast_1', 'mage_soell_cast_6', 'Running', 'Walking']
SHOTS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(
    globals().get('__file__', r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics\tools\blender\retarget.py"))))), 'tools', 'build', 'shots')

sc = bpy.context.scene
LIB = bpy.data.objects['Armature']


def use(arm, name):
    a = bpy.data.actions[name]
    if not arm.animation_data: arm.animation_data_create()
    arm.animation_data.action = a
    try: arm.animation_data.action_slot = a.slots[0]
    except Exception: pass
    for t in arm.animation_data.nla_tracks: t.mute = True
    return a


def arm_pose(arm, action, f):
    """Armature-space rotation and position of every bone at a frame."""
    use(arm, action); sc.frame_set(int(f), subframe=f - int(f)); bpy.context.view_layer.update()
    return {pb.name: (pb.matrix.to_quaternion(), pb.matrix.translation.copy()) for pb in arm.pose.bones}


class Target:
    def __init__(self, key, glb):
        self.key = key
        before = set(bpy.data.objects); acts = set(bpy.data.actions)
        bpy.ops.import_scene.gltf(filepath=glb)
        new = [o for o in bpy.data.objects if o not in before]
        self.arm = next(o for o in new if o.type == 'ARMATURE')
        self.mesh = next(o for o in new if o.type == 'MESH' and o.parent == self.arm)
        for o in new:
            if o not in (self.arm, self.mesh): bpy.data.objects.remove(o, do_unlink=True)
        self.arm.name = key; self.mesh.name = key + '_mesh'
        for b in self.arm.data.bones:
            if b.name.startswith('mixamorig:') or b.name == 'headfront': continue
            b.name = 'mixamorig:' + RENAME.get(b.name, b.name)
        self.walk = next(a for a in bpy.data.actions if a not in acts)
        self.walk.name = key + ':own_walk'
        self.setup(fresh=True)

    @classmethod
    def attach(cls, key):
        """A figure imported earlier and still in the file: picked up as it is, without importing or sending the library through again."""
        self = cls.__new__(cls)
        self.key = key; self.arm = bpy.data.objects[key]; self.mesh = bpy.data.objects[key + '_mesh']
        self.walk = bpy.data.actions[key + ':own_walk']
        self.setup(fresh=False)
        return self

    def setup(self, fresh):
        key = self.key
        self.order = []
        def walk(b):
            self.order.append(b.name)
            for c in b.children: walk(c)
        walk(self.arm.data.bones[H])
        self.B = list(self.order)
        g = lambda *ks: [n for n in self.B if any(k in n for k in ks)]
        self.UP = g('Spine', 'Neck', 'Head', 'head', 'Shoulder', 'Arm', 'Hand')
        self.RARM = [n for n in g('Shoulder', 'Arm', 'Hand') if 'Right' in n]
        self.LARM = [n for n in g('Shoulder', 'Arm', 'Hand') if 'Left' in n]
        self.ARMS = self.RARM + self.LARM
        self.HEAD = g('Neck', 'Head', 'head'); self.SPINE = g('Spine'); self.LEGS = g('UpLeg', 'Leg', 'Foot', 'Toe')
        # the calibration: both figures at frame 0 of the same walk
        self.w0 = self.walk.frame_range[0]                # Meshy's walk does not always start on frame 0
        self.Lref = arm_pose(LIB, 'Walking', 0); self.Sref = arm_pose(self.arm, self.walk.name, self.w0)
        self.off = {n: self.Lref[n][0].inverted() @ self.Sref[n][0] for n in self.order}
        self.ratio = self.arm.data.bones[H].head_local.length / LIB.data.bones[H].head_local.length
        self.restq = {}
        for n in self.order:
            b = self.arm.data.bones[n]
            self.restq[n] = (b.matrix_local if not b.parent else b.parent.matrix_local.inverted() @ b.matrix_local).to_quaternion()
        self.resth = self.arm.data.bones[H].matrix_local.copy()
        if not fresh:
            self.I0 = self.grab('M_Idle_02', 0); self.home = self.I0[H][1].copy(); self.body(); return
        for s in SRC: self.retarget(s)
        # how close is the library's walk, sent through, to this figure's own walk?
        worst = 0
        for f in (0, 6, 12, 18):
            a = arm_pose(self.arm, self.n('M_Walking'), f); b = arm_pose(self.arm, self.walk.name, f + self.w0)
            for n in self.order:
                d = math.degrees(a[n][0].rotation_difference(b[n][0]).angle); worst = max(worst, min(d, 360 - d))
        print(key, 'retarget check: worst bone', round(worst, 1), 'deg off its own walk; size ratio', round(self.ratio, 3))
        self.I0 = self.grab('M_Idle_02', 0); self.home = self.I0[H][1].copy(); self.body()

    n = lambda self, name: self.key + ':' + name

    def convert(self, Lp):
        qS = {n: Lp[n][0] @ self.off[n] for n in self.order}; out = {}
        for n in self.order:
            b = self.arm.data.bones[n]
            if b.parent: out[n] = ((qS[b.parent.name] @ self.restq[n]).inverted() @ qS[n], Vector((0, 0, 0)))
            else:
                p = self.Sref[n][1] + (Lp[n][1] - self.Lref[n][1]) * self.ratio
                out[n] = (self.restq[n].inverted() @ qS[n], self.resth.inverted() @ p)
        return out

    def write(self, name, keys):
        held = getattr(self, 'held', None)                   # the hands turned to point what they hold (see hold)
        if held and not name.startswith('M_'): keys = [(f, held(name, i, len(keys), p)) for i, (f, p) in enumerate(keys)]
        name = self.n(name)
        old = bpy.data.actions.get(name)
        if old: bpy.data.actions.remove(old)
        act = bpy.data.actions.new(name); self.arm.animation_data.action = act
        for t in self.arm.animation_data.nla_tracks: t.mute = True
        prev = {}
        for f, pose in keys:
            for pb in self.arm.pose.bones:
                if pb.name not in pose: continue
                q, l = pose[pb.name]; q = q.copy()
                if pb.name in prev and prev[pb.name].dot(q) < 0: q.negate()
                prev[pb.name] = q
                pb.rotation_quaternion = q; pb.keyframe_insert('rotation_quaternion', frame=f)
                if pb.name == H: pb.location = l; pb.keyframe_insert('location', frame=f)
        act.use_fake_user = True
        return act

    def retarget(self, src, step=2, name=None):
        """A library clip sent through whole: as M_<src> (a source to compose from), or under a name of its own."""
        a = bpy.data.actions[src]; f0, f1 = a.frame_range; k = max(1, round((f1 - f0) / step))
        return self.write(name or 'M_' + src, [(round(i * (f1 - f0) / k, 2), self.convert(arm_pose(LIB, src, f0 + i * (f1 - f0) / k))) for i in range(k + 1)])

    # ---- composing ----
    def grab(self, action, f):
        use(self.arm, self.n(action)); sc.frame_set(int(f), subframe=f - int(f))
        return {pb.name: (pb.rotation_quaternion.copy(), pb.location.copy()) for pb in self.arm.pose.bones}

    def mix(self, a, b, w, bones=None):
        out = dict(a)
        for n in (bones or self.B):
            qa, la = a[n]; qb, lb = b[n]
            out[n] = (qa.slerp(qb, w), la.lerp(lb, w) if bones is None else la)
        return out

    def lock(self, p):
        """On its tile: the root keeps its height, its sideways and forward travel pinned to the idle's. Taken in the
        armature's own vertical, as the hips bone of a hunched rig (the brute's) leans and its local y is not up."""
        q, l = p[H]; R = self.restQ[H]; d = R @ (l - self.home)
        p = dict(p); p[H] = (q, self.home + R.inverted() @ (self.Z * d.dot(self.Z))); return p

    def aligner(self, action, f0):
        c = self.I0[H][0] @ self.grab(action, f0)[H][0].inverted()
        def al(p):
            p = dict(p); q, l = p[H]; p[H] = (c @ q, l); return p
        return al

    # ---- posing in the body's own terms, on top of any pose ----
    # Meshy's bone tails point anywhere, so a limb's direction is taken from joint to joint, never from a bone's axis.
    def body(self):
        bl = self.arm.data.bones; P = lambda n: bl['mixamorig:' + n].head_local
        self.U = (P('Head') - P('Hips')).normalized()
        self.Z = Vector((0, 0, 1))                         # the tile's up, in armature space; U leans with a hunched body
        lf = P('LeftUpLeg') - P('RightUpLeg'); self.Lf = (lf - self.U * lf.dot(self.U)).normalized()
        self.F = self.U.cross(self.Lf).normalized()
        if self.F.dot(P('LeftToeBase') - P('LeftFoot')) < 0: self.F = -self.F
        self.restQ = {n: bl[n].matrix_local.to_quaternion() for n in self.order}
        self.reloff = {n: (bl[n].parent.matrix_local.inverted() @ bl[n].matrix_local).translation for n in self.order if bl[n].parent}
        self.FEET = ['mixamorig:%s%s' % (s, b) for s in ('Left', 'Right') for b in ('Foot', 'ToeBase')]
        self.NECK = ['mixamorig:Neck', 'mixamorig:Head']
        self.tall = (P('Head') - P('LeftFoot')).dot(self.U)
        self.floor = self.lowest(self.I0)

    def fk(self, p):
        """Armature-space rotation and joint position of every bone, for a pose of local rotations."""
        Q, X = {}, {}
        for n in self.order:
            b = self.arm.data.bones[n]
            if b.parent:
                Q[n] = Q[b.parent.name] @ self.restq[n] @ p[n][0]; X[n] = X[b.parent.name] + Q[b.parent.name] @ self.reloff[n]
            else:
                Q[n] = self.restq[n] @ p[n][0]; X[n] = b.head_local + self.restQ[n] @ p[n][1]
        return Q, X

    def lowest(self, p):
        return min(x.dot(self.Z) for n, x in self.fk(p)[1].items() if n in self.FEET)

    def ground(self, p):
        """The root raised or lowered so the lowest foot is on the floor again (after bending the knees)."""
        q, l = p[H]; p = dict(p); p[H] = (q, l + self.restQ[H].inverted() @ (self.Z * (self.floor - self.lowest(p)))); return p

    def spin(self, p, n, R):
        """Bone n turned by R in armature space; what hangs from it follows."""
        Q, _ = self.fk(p); b = self.arm.data.bones[n]
        base = Q[b.parent.name] @ self.restq[n] if b.parent else self.restq[n]
        p = dict(p); p[n] = (base.inverted() @ R @ Q[n], p[n][1]); return p

    def frame(self, p, n):
        """The body's up, left and forward, as bone n carries them in this pose."""
        R = self.fk(p)[0][n] @ self.restQ[n].inverted()
        return R @ self.U, R @ self.Lf, R @ self.F

    def aim(self, p, n, child, d):
        _, X = self.fk(p)
        return self.spin(p, n, (X[child] - X[n]).normalized().rotation_difference(d))

    def dirn(self, fr, side, th, ph):
        """th: degrees from straight down (90 level, 180 straight up); ph: heading, 0 out to that side, 90 forward,
        180 across the body, -90 back."""
        U, Lf, F = fr; S = Lf if side == 'Left' else -Lf; t, f = math.radians(th), math.radians(ph)
        return (-U * math.cos(t) + (S * math.cos(f) + F * math.sin(f)) * math.sin(t)).normalized()

    def limb(self, p, side, up=None, low=None, leg=False):
        """A whole arm (or leg) set by direction in the chest's (hips') frame: up and low are (th, ph) as in dirn,
        or low a number: degrees bent from the upper part, an elbow forward or a knee back."""
        a, b, c = [('mixamorig:' + x % side) for x in (('%sUpLeg', '%sLeg', '%sFoot') if leg else ('%sArm', '%sForeArm', '%sHand'))]
        fr = self.frame(p, H if leg else 'mixamorig:Spine2')
        if up is not None: p = self.aim(p, a, b, self.dirn(fr, side, *up))
        if low is not None:
            if isinstance(low, (int, float)):
                _, X = self.fk(p); u = (X[b] - X[a]).normalized(); to = -fr[2] if leg else fr[2]
                ax = u.cross(to); ax = ax if ax.length > 1e-3 else u.cross(fr[0])
                d = Quaternion(ax.normalized(), math.radians(low)) @ u
            else: d = self.dirn(fr, side, *low)
            p = self.aim(p, b, c, d)
        return p

    def tilt(self, p, bones, how, deg):
        """Each bone turned in its parent's frame: 'fwd' pitches forward (negative: back), 'left' leans to its left,
        'yaw' turns to its left."""
        for n in bones:
            b = self.arm.data.bones[n]; U, Lf, F = self.frame(p, b.parent.name if b.parent else n)
            ax = {'fwd': U.cross(F), 'left': U.cross(Lf), 'yaw': F.cross(Lf)}[how].normalized()
            p = self.spin(p, n, Quaternion(ax, math.radians(deg)))
        return p

    def turned(self, p, deg):
        """The whole figure turned about the up axis (a spin), on its tile."""
        return self.spin(p, H, Quaternion(self.Z, math.radians(deg)))

    # ---- held things ----
    # A weapon is a model of its own (MODELS.md section 4: upright along +Z, grip at the origin) which the game hangs on a
    # hand bone, at a place and turn in that bone's frame (the manifest's "props"). The place is fixed once, on the idle
    # (calibrate); after that each clip turns the hand so the thing points where that clip wants it (hold).
    @staticmethod
    def basis(z, y):
        """The turn that takes a model's +Z to z and its +Y as near to y as it will go."""
        z = z.normalized(); y = (y - z * y.dot(z)).normalized(); x = y.cross(z)
        return Matrix((x, y, z)).transposed().to_quaternion()

    def calibrate(self, p, side, model, z, y, at):
        """In pose p the model held in that hand has its +Z along z, its +Y toward y and its grip at `at` (armature space)."""
        Q, X = self.fk(p); h = 'mixamorig:%sHand' % side
        if not hasattr(self, 'grip'): self.grip = {}
        self.grip[side] = {'model': model, 'rot': Q[h].inverted() @ self.basis(z, y), 'pos': Q[h].inverted() @ (at - X[h])}

    def hold(self, p, side, z, y):
        """The hand turned so what it holds has its +Z along z and its +Y toward y."""
        h = 'mixamorig:%sHand' % side; Q, _ = self.fk(p)
        return self.spin(p, h, self.basis(z, y) @ self.grip[side]['rot'].inverted() @ Q[h].inverted())

    def knuckles(self, p, side, d):
        """Where a fist round a shaft along d points its knuckles: along the forearm as near as it can; with the forearm
        along the shaft, forward (an upright shaft) or down and out (a level one)."""
        _, X = self.fk(p); A = (X['mixamorig:%sHand' % side] - X['mixamorig:%sForeArm' % side]).normalized()
        U, Lf, F = self.frame(p, 'mixamorig:Spine2'); S = Lf if side == 'Left' else -Lf
        perp = lambda v: v - d * v.dot(d)
        R = perp(F) if perp(F).length > 0.5 else perp(S - U)
        return perp(A) + 0.25 * R.normalized()

    def props(self):
        """The manifest's "props": each held model's place in its hand bone's own frame (the glTF keeps the bones' frames),
        turned from the model file's y-up axes to Blender's, scaled from metres to the armature's units."""
        s = 1 / self.arm.matrix_world.to_scale()[0]; out = []
        for side, g in self.grip.items():
            r = g['rot'] @ Quaternion((1, 0, 0), math.radians(90))
            out.append({'file': g['model'] + '.glb', 'bone': side + 'Hand', 'at': [round(v, 3) for v in g['pos']],
                        'rot': [round(v, 5) for v in (r.x, r.y, r.z, r.w)], 'scale': round(s, 3)})
        return out

    def dress(self):
        """Copies of the held models on the hands, for the renders here (the export leaves them out)."""
        s = 1 / self.arm.matrix_world.to_scale()[0]
        use(self.arm, self.n('Idle')); sc.frame_set(0); bpy.context.view_layer.update()
        for side, g in self.grip.items():
            nm = self.key + ':' + g['model']
            o = bpy.data.objects.get(nm) or bpy.data.objects.new(nm, bpy.data.objects[g['model']].data)
            if not o.users_collection: self.mesh.users_collection[0].objects.link(o)
            o['prop'] = 1; o.parent = self.arm; o.parent_type = 'BONE'; o.parent_bone = 'mixamorig:%sHand' % side
            o.matrix_parent_inverse = Matrix.Identity(4); bpy.context.view_layer.update()
            pb = self.arm.pose.bones[o.parent_bone]
            o.matrix_world = self.arm.matrix_world @ pb.matrix @ Matrix.LocRotScale(g['pos'], g['rot'], Vector((s, s, s)))

    # ---- the mesh ----
    def cloth(self, passes=4):
        """Loose cloth off the legs. Meshy weights capes, robes and sashes to the thighs and calves, so they swing out like
        fins in a walk and stand up off a corpse. A vertex well behind the legs goes wholly to the hips; one far out from
        them (a robe's hem) keeps at most 30% of its leg weight. The moved region is then smoothed."""
        me = self.mesh.data; vgs = self.mesh.vertex_groups; gi = {g.name: g.index for g in vgs}
        legs = {gi[n] for n in self.LEGS if n in gi}; hip = gi[H]
        M = self.arm.matrix_world.inverted() @ self.mesh.matrix_world; bl = self.arm.data.bones; Pj = lambda n: bl['mixamorig:' + n].head_local
        r0, r1, rb = 0.07 * self.tall, 0.17 * self.tall, 0.05 * self.tall
        segs = {s: [(Pj(s + 'UpLeg'), Pj(s + 'Leg')), (Pj(s + 'Leg'), Pj(s + 'Foot'))] for s in ('Left', 'Right')}
        sm = lambda x: 0.0 if x <= 0 else 1.0 if x >= 1 else x * x * (3 - 2 * x)
        W = [{g.group: g.weight for g in v.groups} for v in me.vertices]; moved = []
        for i, v in enumerate(me.vertices):
            w = W[i]
            if sum(w.get(k, 0) for k in legs) < 0.01: continue
            co = M @ v.co; side = 'Left' if (co - Pj('Hips')).dot(self.Lf) > 0 else 'Right'; best = None
            for a, b in segs[side]:
                ab = b - a; t = max(0, min(1, (co - a).dot(ab) / ab.length_squared)); d = co - (a + ab * t)
                if best is None or d.length < best[0]: best = (d.length, d.dot(self.F))
            k = max(0.7 * sm((best[0] - r0) / (r1 - r0)), sm((-best[1] - r0) / rb))
            if k < 0.02: continue
            for g in [g for g in w if g in legs]: take = w[g] * k; w[g] -= take; w[hip] = w.get(hip, 0) + take
            moved.append(i)
        nb = [[] for _ in me.vertices]
        for e in me.edges: a, b = e.vertices; nb[a].append(b); nb[b].append(a)
        for _ in range(passes):
            new = {}
            for i in moved:
                acc = {}
                for j in nb[i] + [i]:
                    for g, x in W[j].items(): acc[g] = acc.get(g, 0) + x / (len(nb[i]) + 1)
                mixw = {g: 0.5 * W[i].get(g, 0) + 0.5 * acc.get(g, 0) for g in set(W[i]) | set(acc)}
                top = sorted(mixw.items(), key=lambda kv: -kv[1])[:4]; s = sum(x for _, x in top) or 1
                new[i] = {g: x / s for g, x in top if x > 1e-4}
            W = [new.get(i, w) for i, w in enumerate(W)]
        for i in moved:
            for g in [g.group for g in me.vertices[i].groups]: vgs[g].remove([i])
            for g, x in W[i].items(): vgs[g].add([i], x, 'REPLACE')
        print(self.key, 'cloth:', len(moved), 'vertices eased off the legs')

    def uncap(self, radius=0.18):
        """Deletes the bag Meshy sometimes closes a long skirt with: faces below the knees, near the body's axis and
        clear of the legs (a dark dome between the boots)."""
        import bmesh
        bl = self.arm.data.bones; Pj = lambda n: bl['mixamorig:' + n].head_local
        M = self.arm.matrix_world.inverted() @ self.mesh.matrix_world; ctr = (Pj('LeftFoot') + Pj('RightFoot')) / 2
        segs = [(Pj(s + a), Pj(s + b)) for s in ('Left', 'Right') for a, b in (('UpLeg', 'Leg'), ('Leg', 'Foot'), ('Foot', 'ToeBase'))]
        def dseg(c):
            return min((c - (a + (b - a) * max(0, min(1, (c - a).dot(b - a) / (b - a).length_squared)))).length for a, b in segs)
        knee = Pj('LeftLeg').dot(self.U); r = radius * self.tall
        bm = bmesh.new(); bm.from_mesh(self.mesh.data); kill = []
        for f in bm.faces:
            c = M @ f.calc_center_median(); h = c - ctr; h = h - self.U * h.dot(self.U)
            if c.dot(self.U) < knee - 0.035 * self.tall and h.length < r and dseg(c) > 0.055 * self.tall: kill.append(f)
        bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(self.mesh.data); bm.free()
        print(self.key, 'uncap:', len(kill), 'faces gone')

    def lighten(self, k):
        """Lifts the texture's darks and mids (a gamma of 1/k), once."""
        for slot in self.mesh.material_slots:
            for nd in slot.material.node_tree.nodes:
                if nd.type == 'TEX_IMAGE' and nd.image and not nd.image.get('lit') and nd.image.colorspace_settings.name == 'sRGB':
                    px = np.array(nd.image.pixels[:]).reshape(-1, 4); px[:, :3] = px[:, :3] ** (1 / k)
                    nd.image.pixels = px.ravel().tolist(); nd.image['lit'] = k; nd.image.update()

    def build(self, cls, arms=None):
        g, mix, L, W = self.grab, self.mix, self.lock, self.write
        UP, RARM, LARM, ARMS, HEAD, SPINE, LEGS = self.UP, self.RARM, self.LARM, self.ARMS, self.HEAD, self.SPINE, self.LEGS
        NECK, SIDES, arm, tilt, G = self.NECK, ('Left', 'Right'), self.limb, self.tilt, self.ground
        leg = lambda p, s, up, low: self.limb(p, s, up, low, leg=True)
        idle = lambda f: g('M_Idle_02', f % 44.8)
        # the arms hang 10 degrees off the body (15 on the bulky ones, to clear pauldrons and hip plates), elbows a little bent
        AR = arms or (15 if self.key.startswith(('homunculus', 'paladin', 'barbarian', 'death_knight', 'lancer', 'dragon_knight', 'totem_master', 'zombie_brute',
                                                 'zombie_slagback', 'zombie_stoker', 'zombie_warden', 'brakka', 'flint')) else
                      22 if self.key.startswith(('slime_lord', 'zombie_bonesack', 'zombie_leechmother')) else 10)   # the slime lords, the bonesack, the leech mother: round as a cask
        self.held = None

        def both(p, up, low):
            for s in SIDES: p = arm(p, s, up, low)
            return p
        ARMDOWN = mix(g('M_Walking', 0), g('M_Walking', 12.4), 0.5)
        BI = lambda f=0: L(both(idle(f), (AR, 20), 14)); B0 = BI(0)
        alD = self.aligner('M_Dead', 30); WND = alD(g('M_Dead', 34))
        RAISE = g('M_mage_soell_cast_6', 27); UPBOTH = g('M_Charged_Spell_Cast', 46); CROUCH = g('M_Charged_Spell_Cast', 24)
        HR = g('M_Hit_Reaction', 20)
        back = mix(B0, HR, 0.7, RARM)
        thrust = mix(mix(B0, CROUCH, 1.0, RARM), CROUCH, 0.5, SPINE + HEAD)
        crouch = lambda p, w: G(mix(p, CROUCH, w, LEGS))                       # knees bent, the feet kept on the floor

        if cls == 'lancer':
            # The lance (w_lance, 3 m) stands upright in the right fist, the forearm level before the hip; the tower shield
            # (w_shield_tower) hangs from the left fist at the side, its face out. From here on every key the clips write
            # goes through `held`, which turns the hands: the lance up, or level at the foe in the thick of Thrust and
            # Charge, tilted forward to Point; the shield's face out to the left, or to the front in Guard_Up and Shield_Bash.
            carry = lambda p: arm(p, 'Right', (AR, 45), 40)
            BI = lambda f=0: L(carry(both(idle(f), (AR, 20), 14))); B0 = BI(0)

            def fr(p):                     # the tile's up, left and forward; the hips' instead as the body goes over (Dead_Fall)
                R = self.fk(p)[0][H] @ self.restQ[H].inverted(); k = min(1, max(0, (1 - (R @ self.U).dot(self.U)) / 0.3))
                R = Quaternion().slerp(R, k); return R @ self.U, R @ self.Lf, R @ self.F
            aim = lambda p, th, ph: self.dirn(fr(p), 'Right', th, ph)          # the lance: th from straight down, ph 90 forward
            face = lambda p, ph: self.dirn(fr(p), 'Left', 90, ph)              # the shield's face: 0 out to the left, 90 to the front
            Q0, X0 = self.fk(B0); hand = lambda s: X0['mixamorig:%sHand' % s]
            palm = lambda s: hand(s) + (hand(s) - X0['mixamorig:%sForeArm' % s]).normalized() * 0.045 * self.tall
            self.calibrate(B0, 'Right', 'w_lance', aim(B0, 174, 75), self.knuckles(B0, 'Right', aim(B0, 174, 75)), palm('Right'))
            # the shield gripped above its middle, so at the idle its foot is 7 cm off the floor, whatever the figure's height
            at = palm('Left') + face(B0, 30) * 0.03 * self.tall
            foot = -min(v.co.z for v in bpy.data.objects['w_shield_tower'].data.vertices) + 0.07   # metres, grip to floor
            at += self.Z * (self.floor + foot / self.arm.matrix_world.to_scale()[0] - at.dot(self.Z))
            self.calibrate(B0, 'Left', 'w_shield_tower', fr(B0)[0], -face(B0, 30), at)
            STEADY = {'Walk', 'Run', 'Hop', 'Hit', 'Stunned', 'Wounded', 'Talk', 'Shield_Bash'}    # the lance arm kept still

            def held(name, i, n, p):
                mid = 0 < i < n - 1                                            # the first and last keys are the idle
                if name in STEADY: p = carry(p)
                d = aim(p, *((93, 90) if name in ('Thrust', 'Charge') and mid else (130, 90) if name == 'Point' and mid else (174, 75)))
                p = self.hold(p, 'Right', d, self.knuckles(p, 'Right', d))
                return self.hold(p, 'Left', fr(p)[0], -face(p, 90 if name in ('Guard_Up', 'Shield_Bash') and mid else 30))
            self.held = held

        if cls.startswith('zombie_'):
            # The dead stand as they died, each kind in a slump of its own. It goes on the idle, so every clip starts and
            # ends in it. Per kind: the spine's pitch and the neck's (each bone; negative: back), the head's droop to its
            # left, each arm (th, ph, elbow; left, then right), and how far the knees are bent.
            kind = cls[len('zombie_'):]
            SP, NK, DROOP, ZA, KN = {
                'shambler': (4, 8, 12, ((40, 75, 30), (28, 65, 20)), 0.25),        # the head lolled over, the arms hanging forward, one lower
                'gnawer': (8, -10, 0, ((42, 80, 32), (42, 80, 32)), 0.45),       # stooped, the head up, long arms out before it
                'lurker': (10, -13, 0, ((58, 75, 55), (58, 75, 55)), 0.8),       # low on its haunches, the claws forward
                'bonesack': (-3, -7, 0, ((38, 12, 18), (38, 12, 18)), 0.25),     # leaning back off the belly, the head tipped back, arms out round it
                'brute': (5, -6, 0, ((30, 40, 30), (30, 40, 30)), 0.35),         # hunched, the head jutting, the arms hanging heavy
                # past the pines: two of each land, and its lord
                'rimewalker': (2, 3, 5, ((35, 70, 10), (30, 65, 10)), 0.12),     # froze on the march: upright, the arms locked out before it
                'driftling': (10, -12, 0, ((55, 75, 50), (55, 75, 50)), 0.7),    # low in the snow like the lurker, the claws forward
                'husk': (7, -8, 4, ((40, 80, 30), (44, 80, 34)), 0.4),           # light and stooped like the gnawer, the head up
                'slinger': (3, 5, 8, ((25, 40, 20), (30, 55, 25)), 0.2),         # loose on its bones, the arms hanging open
                'drowner': (6, 7, 10, ((45, 80, 35), (38, 72, 28)), 0.3),        # bowed, the head over, the arms out and dripping
                'leechmother': (-3, -5, 0, ((38, 12, 18), (38, 12, 18)), 0.25),  # back off the belly like the bonesack
                'cinder': (5, -6, 6, ((40, 70, 35), (36, 70, 30)), 0.35),        # crouched over its own heat, the claws up
                'slagback': (9, -9, 0, ((30, 40, 30), (30, 40, 30)), 0.4),       # bent under the furnace on its back
                'warden': (1, 2, 0, ((22, 30, 18), (22, 30, 18)), 0.1),          # the lords keep their bearing: still at its post
                'dryking': (3, -3, 0, ((35, 30, 25), (35, 30, 25)), 0.12),       # tall, the chin up, the hands held open to the court
                'abbess': (2, 12, 4, ((28, 50, 45), (28, 50, 45)), 0.08),        # upright, the head bowed, the hands before her
                'stoker': (5, -6, 0, ((30, 40, 30), (30, 40, 30)), 0.35)}[kind]  # the brute's hunch, the shovel arms
            tl = lambda p, bones, how, d: tilt(p, bones, how, d) if d else p
            # Their knees bend both alike, down onto the haunches with the soles kept flat (the library's crouch is a
            # stance, one foot forward), and every clip below, the common ones too, crouches this way.
            SQ = idle(0); _, X = self.fk(SQ)
            for s in SIDES:
                ft, toe = 'mixamorig:%sFoot' % s, 'mixamorig:%sToeBase' % s
                SQ = self.aim(leg(SQ, s, (70, 80), 120), ft, toe, (X[toe] - X[ft]).normalized())
            crouch = lambda p, w: G(mix(p, SQ, w, LEGS))

            def slump(p, sway=0, yaw=0, swing=0, knees=KN):
                p = tl(tl(tl(p, SPINE, 'fwd', SP), SPINE, 'left', sway), SPINE, 'yaw', yaw)
                p = tl(tl(p, NECK, 'fwd', NK), NECK, 'left', DROOP + sway)
                for s, (th, ph, el), k in zip(SIDES, ZA, (1, -1)): p = arm(p, s, (th + swing * k, ph), el)
                return crouch(p, knees)
            BI = lambda f=0: L(slump(idle(f), 1.2 * math.sin(f * 2 * math.pi / 45))); B0 = BI(0)

            def fling(p, k, up=25, back=60, bend=18):                          # the arms thrown out and back from where they hang
                for s, (th, ph, el) in zip(SIDES, ZA): p = arm(p, s, (th + up * k, ph - back * k), el + bend * k)
                return p

            def aloft(p, h):                                                   # the lowest foot h of the height off the floor
                p = G(p); q, l = p[H]; p[H] = (q, l + self.restQ[H].inverted() @ (self.Z * h * self.tall)); return p

        def blow(name, src, s0, s1, n, legs=0.7, df=2, tail=8):
            # the upper body from the source, the legs partly, the hips never turning
            keys = [(0, B0)]
            for i in range(n):
                p = g(src, s0 + (s1 - s0) * i / (n - 1)); keys.append((2 + i * df, L(mix(mix(B0, p, 1.0, UP), p, legs, LEGS))))
            keys.append((2 + (n - 1) * df + tail, BI(2 + (n - 1) * df + tail))); W(name, keys)

        # ---- what every figure has (24 frames a second; a blow or a cast lands about 0.3 s in, frame 7) ----
        W('Idle', [(f, BI(f)) for f in (0, 9, 18, 27, 36, 45)])
        W('Walk', [(i * 2, L(g('own_walk', self.w0 + i * 24.8 / 12))) for i in range(13)])
        W('Run', [(i, L(g('M_Running', i * 15.2 / 15))) for i in range(16)])

        def tuck(k):                                                           # in the air: knees up, arms up
            p = B0
            for s in SIDES: p = leg(p, s, (40 * k, 90), 70 * k)
            return L(both(p, (40, 60), 20))
        W('Hop', [(0, B0), (3, L(crouch(B0, 0.5))), (6, tuck(1)), (10, tuck(0.8)), (13, L(crouch(B0, 0.35))), (16, B0)])
        W('Cast', [(0, B0)] + [(4 + i * 3, L(mix(BI(4 + i * 3), g('M_Charged_Spell_Cast', 34 + i * 24 / 8), 0.7, ARMS))) for i in range(9)] + [(34, BI(34))])
        alH = self.aligner('M_Hit_Reaction', 0)

        def hit(s, k):                                                         # thrown back: chest, head and arms
            p = mix(B0, alH(g('M_Hit_Reaction', s)), 1.0, SPINE + HEAD)
            p = tilt(tilt(p, SPINE, 'fwd', -6 * k), NECK, 'fwd', -6 * k)
            return L(crouch(both(p, (AR + 18 * k, -10), 25 * k), 0.3 * k))
        W('Hit', [(0, B0), (2, hit(8, 1)), (5, hit(11, 0.85)), (9, hit(16, 0.4)), (15, BI(15))])

        def daze(lean, fwd):                                                   # arms limp, the head lolling, a slow circle
            p = tilt(tilt(B0, SPINE, 'left', lean), SPINE, 'fwd', fwd)
            p = tilt(tilt(p, NECK, 'fwd', 9), NECK, 'left', 2.5 * lean)
            return L(crouch(both(p, (5, 10), 8), 0.2))
        W('Stunned', [(0, daze(3, 0)), (10, daze(0, 3)), (20, daze(-3, 0)), (30, daze(0, -1)), (40, daze(3, 0))])

        def hurt(k):                                                           # bent over a hand on the gut, breathing
            p = tilt(tilt(B0, SPINE, 'fwd', 8 + 1.5 * k), NECK, 'fwd', 5)
            p = arm(arm(p, 'Right', (25, 120), (85, 175)), 'Left', (AR + 6, 30), 20)
            return L(crouch(p, 0.22))
        W('Wounded', [(0, hurt(0)), (18, hurt(1)), (36, hurt(0))])
        W('Dead_Fall', [(0, B0)] + [(3 + i * 2, L(alD(g('M_Dead', 30 + i * 41 / 19)))) for i in range(20)])
        rv = [71, 66, 61, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30]                # slow through the kneel
        W('Revive', [(i * 3, L(alD(g('M_Dead', s)))) for i, s in enumerate(rv)] + [(len(rv) * 3 + 8, B0)])
        W('Victory', [(f, L(mix(B0, RAISE, w, RARM))) for f, w in ((0, 0.6), (8, 0.95), (16, 0.6), (24, 0.95), (32, 0.6))])
        t1 = mix(B0, RAISE, 0.24, RARM); t2 = mix(BI(20), WND, 0.25, HEAD); t3 = mix(mix(BI(30), UPBOTH, 0.2, LARM), RAISE, 0.12, RARM)
        W('Talk', [(0, B0), (8, L(t1)), (18, L(t2)), (28, L(t3)), (38, L(t2)), (46, B0)])

        def sip(k):                                                            # the hand at the chin, the head back
            return L(tilt(tilt(arm(B0, 'Right', (60, 95), (150, 170)), NECK, 'fwd', -10 * k), ['mixamorig:Spine2'], 'fwd', -6 * k))
        W('Drink', [(0, B0), (6, L(arm(B0, 'Right', (45, 95), (100, 150)))), (10, sip(1)), (22, sip(1.15)), (28, sip(0.3)), (36, BI(36))])

        def ward(k):                                                           # upright, forearms crossed before the chest
            p = arm(arm(B0, 'Left', (40, 95), (95 + 3 * k, 165)), 'Right', (40, 95), (105 + 3 * k, 165))
            return L(crouch(tilt(p, SPINE, 'fwd', 1 + k), 0.18))
        W('Guard', [(0, ward(0)), (18, ward(1)), (36, ward(0))])
        W('Point', [(0, B0), (6, L(mix(B0, CROUCH, 1.0, RARM))), (20, L(mix(B0, CROUCH, 1.0, RARM))), (30, BI(30))])
        fl = mix(B0, UPBOTH, 0.8, ARMS); fl2 = mix(mix(B0, UPBOTH, 0.62, ARMS), CROUCH, 0.25, LEGS)
        W('Flex', [(0, B0), (6, L(fl2)), (11, L(fl)), (17, L(fl2)), (23, L(fl)), (34, BI(34))])
        names = ['Idle', 'Walk', 'Run', 'Hop', 'Cast', 'Hit', 'Stunned', 'Wounded', 'Dead_Fall', 'Revive', 'Victory', 'Talk', 'Drink', 'Guard', 'Point', 'Flex']

        # ---- the moves the classes share ----
        def bolt(name='Bolt'):                                                 # the arm thrown forward
            W(name, [(0, B0), (3, L(back)), (7, L(thrust)), (10, L(thrust)), (19, BI(19))])

        def wave(name='Wave'):                                                 # gathered in, then burst out all round
            gat = L(crouch(tilt(both(B0, (35, 140), (80, 175)), SPINE, 'fwd', 5), 0.4))
            burst = lambda yaw: L(tilt(tilt(both(B0, (105, 15), 10), SPINE, 'fwd', -3), SPINE, 'yaw', yaw))
            W(name, [(0, B0), (3, gat), (7, burst(0)), (12, burst(4)), (19, burst(-4)), (25, burst(0)), (35, BI(35))])

        def raised(name, arm_, hold=16):                                       # one arm held high: a blessing, a call
            a = mix(mix(B0, UPBOTH, 1.0, arm_), UPBOTH, 0.3, HEAD); a2 = mix(a, g('M_Charged_Spell_Cast', 50), 1.0, arm_)
            W(name, [(0, B0), (8, L(a)), (8 + hold // 2, L(a2)), (8 + hold, L(a)), (16 + hold, L(mix(B0, a, 0.5, arm_))), (26 + hold, BI(26 + hold))])

        def meteor(name='Meteor'):                                             # both arms up, then everything pulled down
            upb = mix(mix(B0, UPBOTH, 0.9, ARMS), UPBOTH, 0.3, HEAD)
            down = L(both(crouch(tilt(B0, SPINE, 'fwd', 7), 1.0), (40, 90), 15))
            W(name, [(0, B0), (8, L(upb)), (18, L(mix(upb, UPBOTH, 1.0, ARMS))), (23, down), (31, down), (42, BI(42))])

        def swing(name='Swing'):                                               # one hand: cocked back overhead, across, through
            wind = L(crouch(tilt(arm(B0, 'Right', (115, -40), (165, -100)), SPINE, 'yaw', -7), 0.15))
            hit_ = L(crouch(tilt(tilt(arm(B0, 'Right', (75, 105), 25), SPINE, 'yaw', 6), SPINE, 'fwd', 3), 0.3))
            foll = L(crouch(tilt(arm(B0, 'Right', (40, 150), 15), SPINE, 'yaw', 9), 0.25))
            W(name, [(0, B0), (3, wind), (7, hit_), (10, foll), (13, foll), (22, BI(22))])

        def smite(name='Smite', deep=0):                                       # both hands overhead, then down (deep: to the ground)
            over = L(tilt(both(B0, (160, 85), (172, 150)), SPINE, 'fwd', -3))
            down = L(crouch(tilt(both(B0, (55 - 15 * deep, 90), 20 + 10 * deep), SPINE, 'fwd', 7 + 5 * deep), 0.6 + 0.3 * deep))
            W(name, [(0, B0), (4, over), (7, down), (12, down), (24, BI(24))])

        def jab(name='Thrust'):                                                # drawn back at the hip, out at shoulder height
            wind = L(crouch(arm(arm(B0, 'Right', (40, -90), (95, 90)), 'Left', (40, 60), 30), 0.3))
            out = mix(B0, g('M_Attack', 37), 0.6, LEGS)
            out = L(G(tilt(arm(arm(out, 'Right', (85, 85), (87, 88)), 'Left', (70, 70), 20), SPINE, 'fwd', 4)))
            W(name, [(0, B0), (3, wind), (7, out), (10, out), (20, BI(20))])

        def charge(name='Charge'):                                             # running into it, the point leading
            wind = L(crouch(arm(B0, 'Right', (40, -90), (95, 90)), 0.35))
            go = mix(B0, g('M_Running', 4), 1.0, LEGS)
            go = L(G(tilt(arm(arm(go, 'Right', (85, 85), (87, 88)), 'Left', (60, 70), 25), SPINE, 'fwd', 8)))
            W(name, [(0, B0), (3, wind), (7, go), (11, go), (22, BI(22))])

        def leap(name='Leap'):                                                 # gathered, arms up, then down hard in a crouch
            prep = L(crouch(both(B0, (30, -60), 15), 0.5))
            up_ = L(tilt(both(B0, (160, 85), (170, 120)), SPINE, 'fwd', -3))
            land = L(both(crouch(tilt(B0, SPINE, 'fwd', 10), 1.0), (45, 95), 10))
            W(name, [(0, B0), (2, prep), (5, up_), (8, land), (13, land), (24, BI(24))])

        def whirl(name='Whirl', turns=1, up=85):                               # upright, arms out, the whole figure spinning
            pose = L(crouch(tilt(both(B0, (up, 5), 8), SPINE, 'fwd', -1), 0.2))
            keys = [(0, B0), (3, L(crouch(tilt(both(B0, (50, 120), 20), SPINE, 'yaw', -8), 0.3)))]
            steps = 6 * turns
            keys += [(5 + i * 2, self.turned(pose, 60 * i)) for i in range(steps + 1)]
            W(name, keys + [(5 + steps * 2 + 4, pose), (5 + steps * 2 + 12, BI(5 + steps * 2 + 12))])

        def breath(name='Breath'):                                             # hands cupped at the mouth, then thrown out with it
            cup = L(tilt(tilt(both(B0, (55, 100), (150, 175)), SPINE, 'fwd', -3), NECK, 'fwd', -4))
            fire = L(crouch(tilt(tilt(both(B0, (82, 85), (85, 88)), SPINE, 'fwd', 7), NECK, 'fwd', 10), 0.3))
            W(name, [(0, B0), (5, cup), (8, fire), (22, fire), (32, BI(32))])

        def raise_(name='Raise'):                                              # a hand down to the ground, then up with it
            low = L(both(crouch(tilt(B0, SPINE, 'fwd', 8), 0.4), (35, 90), 15))
            high = mix(mix(B0, UPBOTH, 0.9, RARM), UPBOTH, 0.3, HEAD)
            W(name, [(0, B0), (7, low), (13, low), (22, L(high)), (30, L(high)), (40, BI(40))])

        # ---- what each class has besides ----
        if cls == 'paladin':                      # mace and shield
            swing(); smite(); bolt(); raised('Bless', LARM); wave()          # plain attack, Smite, Holy Bolt, Blessed Light, Consecration
            blow('Shield_Bash', 'M_Left_Slash', 14, 56, 9, legs=0.4)
            names += ['Swing', 'Smite', 'Bolt', 'Bless', 'Wave', 'Shield_Bash']
        elif cls == 'ranger':                     # bow: the left arm holds it out, the right draws to the jaw
            def bow(draw, up=0, lean=0):
                p = tilt(tilt(B0, SPINE, 'yaw', -10), SPINE, 'fwd', -lean)     # turned side-on to the target
                p = arm(p, 'Left', (88 + up, 55), (88 + up, 50))
                p = arm(p, 'Right', *{'nock': ((85 + up, 35), (90 + up, 60)), 'full': ((85 + up, -55), (95 + up, 175)),
                                      'loose': ((85 + up, -70), (80 + up, -100))}[draw])
                return L(crouch(p, 0.15))
            W('Shoot', [(0, B0), (3, bow('nock')), (6, bow('full')), (8, bow('loose')), (13, bow('loose')), (24, BI(24))])       # Quick Shot, Multishot, plain attack
            W('Volley', [(0, B0), (4, bow('nock', 45, 5)), (7, bow('full', 45, 5)), (9, bow('loose', 45, 5)), (13, bow('full', 45, 5)),
                         (15, bow('loose', 45, 5)), (19, bow('full', 45, 5)), (21, bow('loose', 45, 5)), (32, BI(32))])            # Rain of Arrows: up into the sky
            whistle = L(tilt(arm(arm(B0, 'Right', (60, 95), (150, 170)), 'Left', (AR + 10, 20), 30), NECK, 'fwd', -8))
            W('Call', [(0, B0), (6, whistle), (22, whistle), (32, BI(32))])                                                     # Wolf Pack: fingers to the mouth
            names += ['Shoot', 'Volley', 'Call']
        elif cls == 'wizard':                     # staff
            bolt(); wave(); meteor()                                          # Fire Bolt and plain attack, Frost Nova, Meteor
            names += ['Bolt', 'Wave', 'Meteor']
        elif cls == 'barbarian':                  # two axes
            swing()                                                           # plain attack
            blow('Bash', 'M_Left_Slash', 14, 56, 9, legs=0.5)                 # Bash: the other axe
            leap(); whirl()                                                   # Leap, Whirlwind
            smite('Slam', deep=1)                                             # Earthquake: both axes into the ground
            names += ['Swing', 'Bash', 'Leap', 'Whirl', 'Slam']
        elif cls == 'necromancer':                # wand
            bolt(); raise_()                                                  # Bone Spike and plain attack, Raise Skeleton
            def curse(k):                                                     # Weaken: both hands clawing forward and down, hunched
                return L(crouch(tilt(tilt(both(B0, (55 - 5 * k, 80), (50 - 5 * k, 90)), SPINE, 'fwd', 7), NECK, 'fwd', 6), 0.2))
            W('Curse', [(0, B0), (6, curse(0)), (12, curse(1)), (18, curse(0)), (26, curse(1)), (36, BI(36))])
            names += ['Bolt', 'Raise', 'Curse']
        elif cls == 'dragoon':                    # spear
            jab(); leap(); breath()                                           # Lance Jab and plain attack; Jump and Dragon Dive land; Dragon Breath
            names += ['Thrust', 'Leap', 'Breath']
        elif cls == 'death_knight':               # sword
            swing(); smite(); bolt(); raise_()                                # Frost Strike and plain attack, Obliterate, Death Coil, Raise Ghoul
            names += ['Swing', 'Smite', 'Bolt', 'Raise']
        elif cls == 'carrion_witch':              # staff
            bolt(); wave()                                                    # Rot Bolt and plain attack, Crow Swarm
            doll = lambda p: arm(p, 'Left', (30, 80), (95, 150))              # Voodoo Doll: the poppet held before the chest,
            lift = L(tilt(arm(doll(B0), 'Right', (140, 60), (165, 100)), NECK, 'fwd', 6))
            stab = L(crouch(tilt(tilt(arm(doll(B0), 'Right', (60, 100), (40, 170)), SPINE, 'fwd', 5), NECK, 'fwd', 8), 0.2))
            W('Hex', [(0, B0), (4, lift), (7, stab), (10, lift), (13, stab), (24, BI(24))])                                     # the pin raised high and stabbed down
            names += ['Bolt', 'Wave', 'Hex']
        elif cls == 'bard':                       # lute: the neck held out to its left, the right hand strumming
            def lute(p, k=0, dip=0.1):
                p = arm(arm(p, 'Left', (40, 60), (100, 25)), 'Right', (25 + 10 * k, 80), (85 - 15 * k, 170))
                return L(crouch(p, dip))
            W('Strum', [(0, B0), (4, lute(B0, -1)), (7, lute(B0, 1, 0.25)), (10, lute(B0, -1)), (13, lute(B0, 1, 0.25)), (16, lute(B0, -1)), (26, BI(26))])   # Plucked Note
            sing = lambda k, sway: L(tilt(lute(tilt(tilt(B0, SPINE, 'fwd', -4), NECK, 'fwd', -7), k), SPINE, 'left', sway))
            sweep = L(tilt(tilt(arm(arm(B0, 'Left', (40, 60), (100, 25)), 'Right', (95, 10), 10), SPINE, 'fwd', -4), NECK, 'fwd', -8))
            W('Ballad', [(0, B0), (4, sing(-1, 0)), (8, sweep), (14, sweep), (20, sing(1, 3)), (28, sing(-1, -3)), (36, sing(1, 3)), (46, BI(46))])   # Ballad of Valor, Lullaby
            raised('Bless', RARM)                                             # Hymn of Mending
            names += ['Strum', 'Ballad', 'Bless']
        elif cls == 'lancer':                     # lance and tower shield
            jab()                                                             # Lance Thrust, plain attack
            wall = L(crouch(arm(B0, 'Left', (30, 100), 35), 0.35))
            W('Guard_Up', [(0, B0), (6, wall), (24, wall), (34, BI(34))])     # Tower Shield: set low before the body, the lance upright behind it
            raised('Rally', RARM)                                             # Squire Knight: the banner arm up
            charge()                                                          # Lance Charge
            blow('Shield_Bash', 'M_Left_Slash', 14, 56, 9, legs=0.4)
            names += ['Thrust', 'Guard_Up', 'Rally', 'Charge', 'Shield_Bash']
        elif cls == 'arcane_sorcerer':            # wand: star-fire and gravity
            bolt(); raised('Bless', RARM); meteor(); wave()                   # Star Missiles and plain attack, Moonbeam, Falling Star, Black Hole
            names += ['Bolt', 'Bless', 'Meteor', 'Wave']
        elif cls == 'boomerang_knight':           # two crescent blades: thrown, and caught again
            TP = {'cock': ((150, -60), (172, -120)), 'loose': ((95, 85), (90, 88)), 'follow': ((45, 115), 15), 'catch': ((135, 70), (165, 110))}
            t = lambda p, s, ph: arm(p, s, *TP[ph])
            at = lambda p, yaw, k=0.15: L(crouch(tilt(p, SPINE, 'yaw', yaw), k))
            W('Throw', [(0, B0), (4, at(t(B0, 'Right', 'cock'), -7)), (7, at(t(B0, 'Right', 'loose'), 5, 0.25)), (10, at(t(B0, 'Right', 'follow'), 8, 0.25)),
                        (17, at(t(B0, 'Right', 'catch'), 0)), (22, at(t(B0, 'Right', 'catch'), 0)), (30, BI(30))])       # Boomerang, plain attack: thrown, then caught
            W('Twin', [(0, B0), (3, at(t(B0, 'Right', 'cock'), -10)), (6, at(t(t(B0, 'Right', 'loose'), 'Left', 'cock'), 8, 0.25)),
                       (9, at(t(t(B0, 'Right', 'follow'), 'Left', 'loose'), -10, 0.25)), (12, at(t(t(B0, 'Right', 'follow'), 'Left', 'follow'), -6, 0.2)),
                       (20, at(t(t(B0, 'Right', 'catch'), 'Left', 'catch'), 0)), (24, at(t(t(B0, 'Right', 'catch'), 'Left', 'catch'), 0)), (32, BI(32))])   # Twin Rang: one, then the other
            whirl()                                                           # Swirling Blades
            whirl('Typhoon', turns=2, up=125)                                 # Typhoon: twice round, the arms high
            names += ['Throw', 'Twin', 'Whirl', 'Typhoon']
        elif cls == 'totem_master':               # staff: an ancestor's blow, posts driven into the ground
            bolt(); smite('Slam', deep=1)                                     # Spirit Strike and plain attack; Earth Shock: both fists into the ground
            post = L(both(B0, (70, 90), (110, 160)))                          # Healing and Searing Totem: the post lifted before the chest,
            over = L(tilt(both(B0, (155, 88), (170, 150)), SPINE, 'fwd', -3))  # raised overhead,
            drive = L(crouch(tilt(both(B0, (30, 90), 10), SPINE, 'fwd', 14), 1.0))   # and driven down into the ground, held there
            W('Plant', [(0, B0), (6, post), (11, over), (15, drive), (26, drive), (38, BI(38))])
            names += ['Bolt', 'Slam', 'Plant']
        elif cls == 'slime_lord':                 # mace, and the whole body
            swing(); bolt(); leap('Slam'); wave()                             # plain attack, Slime Ball (thrown), Body Slam, Acid Splash
            def wobble(k, s):                                                 # Slimeling: shaken all over, then a lump let go at the side
                p = tilt(tilt(B0, SPINE, 'left', 5 * s), SPINE, 'fwd', 4 * k)
                return L(crouch(both(p, (AR + 25 * k, 0), 20 + 20 * k), 0.4 * k))
            drop = L(crouch(arm(B0, 'Left', (50, -10), 10), 0.2))
            W('Split', [(0, B0), (4, wobble(1, 1)), (8, wobble(1, -1)), (12, wobble(1, 1)), (16, wobble(0.6, -1)), (20, drop), (32, BI(32))])
            names += ['Swing', 'Bolt', 'Slam', 'Split', 'Wave']
        elif cls == 'dragon_knight':              # sword, and the wyrm in the blood
            swing(); breath()                                                 # Flame Slash and plain attack; Fire Breath
            W('Scales', [(0, B0), (6, ward(1)), (14, ward(1)), (19, L(fl)), (28, L(fl)), (38, BI(38))])   # Dragon Scales: arms crossed, then thrown wide
            raised('Call', RARM)                                              # Summon Whelp: the arm up for it to come down to
            names += ['Swing', 'Breath', 'Scales', 'Call']
        elif cls == 'gunner':                     # a pistol in the right hand
            # The pistol is gear.js's flintlock, put in the hand once on the idle, pointing ahead and a little down. Raising the
            # arm to aim would point it at the sky, so in the thick of Shoot and Fan the hand is turned to lay it along the forearm.
            self.calibrate(B0, 'Right', 'flintlock', (self.F - 0.36 * self.U).normalized(), self.U, self.fk(B0)[1]['mixamorig:RightHand'])

            def held(name, i, n, p):
                if name not in ('Shoot', 'Fan') or not 0 < i < n - 1: return p
                _, X = self.fk(p)
                return self.hold(p, 'Right', (X['mixamorig:RightHand'] - X['mixamorig:RightForeArm']).normalized(), self.U)
            self.held = held

            def aimed(p, yaw=-8, kick=0):                                     # side-on, the arm out level at the foe; kick: the muzzle thrown up
                p = tilt(p, SPINE, 'yaw', yaw)
                return L(crouch(arm(p, 'Right', (88 + 12 * kick, 88), (88 + 25 * kick, 88)), 0.15))
            W('Shoot', [(0, B0), (4, aimed(B0)), (7, aimed(B0)), (8, aimed(B0, kick=1)), (11, aimed(B0)), (21, BI(21))])   # Pistol Shot, plain attack
            fan = lambda yaw, kick: aimed(arm(B0, 'Left', (55, 110), (95, 170)), yaw, kick)   # Bullet Hell: the left hand fanning the hammer,
            keys = [(0, B0), (4, fan(-22, 0))]                                                 # four shots swept across
            for i, y in enumerate((-22, -8, 6, 20)): keys += [(6 + i * 5, fan(y, 0)), (7 + i * 5, fan(y, 1))]
            W('Fan', keys + [(27, fan(20, 0)), (37, BI(37))])
            low = L(crouch(tilt(arm(B0, 'Right', (40, -75), 15), SPINE, 'fwd', 6), 0.4))       # Grenade: swung back low, and underarm up and out
            rel = L(crouch(tilt(arm(B0, 'Right', (115, 88), 12), SPINE, 'fwd', -2), 0.15))
            fol = L(tilt(arm(B0, 'Right', (140, 92), 18), SPINE, 'fwd', -4))
            W('Lob', [(0, B0), (4, low), (8, rel), (11, fol), (14, fol), (24, BI(24))])
            set_ = L(both(crouch(tilt(B0, SPINE, 'fwd', 18), 1.0), (40, 92), 25))             # Gun Turret: down on the knees, set before the feet
            W('Deploy', [(0, B0), (6, L(both(crouch(B0, 0.5), (60, 90), 60))), (12, set_), (24, set_), (36, BI(36))])
            names += ['Shoot', 'Fan', 'Lob', 'Deploy']
        elif cls == 'ninja':                      # a short hooked knife in each hand: cuts, stars, smoke
            # Each hand by name: 'wind' high across the body (the knife over the far shoulder), 'cut' out low at its own side,
            # 'thru' carried on down and back, 'jab' straight out at the foe, 'cock' level across the chest, 'fling' thrown flat out.
            POS = {'wind': ((125, 165), 125), 'cut': ((70, 35), (60, 15)), 'thru': ((45, -25), 20), 'jab': ((85, 88), (87, 88)),
                   'cock': ((90, 170), 135), 'fling': ((90, 60), (90, 50))}

            def nj(yaw=0, k=0.3, R=None, Lh=None):                            # the chest turned (to its left), the knees bent k
                p = B0
                if R: p = arm(p, 'Right', *POS[R])
                if Lh: p = arm(p, 'Left', *POS[Lh])
                return L(crouch(tilt(p, SPINE, 'yaw', yaw), k))
            W('Slash', [(0, B0), (3, nj(10, 0.2, R='wind')), (6, nj(-10, 0.35, R='cut')), (9, nj(-12, 0.35, R='thru')),
                        (12, nj(-12, 0.3, R='thru')), (21, BI(21))])                                    # plain attack, Venom Edge: backhand, high to low
            W('Cuts', [(0, B0), (2, nj(10, 0.3, R='wind')), (4, nj(-10, 0.35, R='cut', Lh='wind')), (6, nj(10, 0.35, R='wind', Lh='cut')),
                       (8, nj(-10, 0.35, R='cut', Lh='wind')), (10, nj(10, 0.35, R='wind', Lh='cut')), (13, nj(0, 0.4, R='jab', Lh='thru')),
                       (17, nj(0, 0.4, R='jab', Lh='thru')), (27, BI(27))])                             # Hundred Cuts, the Last Cut: hand over hand, then home
            W('Stars', [(0, B0), (3, nj(12, 0.2, R='cock')), (5, nj(-8, 0.25, R='fling')), (7, nj(10, 0.2, R='cock')), (9, nj(-8, 0.25, R='fling')),
                        (11, nj(10, 0.2, R='cock')), (13, nj(-8, 0.25, R='fling')), (16, nj(-8, 0.25, R='fling')), (25, BI(25))])   # Throwing Stars (three), Caltrops
            raise_ball = L(crouch(arm(B0, 'Right', (140, 85), (150, 95)), 0.1))                         # Smoke Bomb, Vanish: the ball up,
            dash = L(crouch(tilt(arm(B0, 'Right', (25, 95), 10), SPINE, 'fwd', 14), 0.8))               # dashed down at the feet,
            cover = L(crouch(tilt(arm(arm(B0, 'Left', (95, 150), (150, 175)), 'Right', (40, -40), 30), SPINE, 'fwd', 10), 0.9))   # low in it, an arm over the face
            W('Smoke', [(0, B0), (4, raise_ball), (7, dash), (10, cover), (22, cover), (32, BI(32))])
            low = L(crouch(tilt(both(B0, (55, -80), 20), SPINE, 'fwd', 22), 0.7))                      # Shadow Step: pitched forward, the arms trailing,
            W('Step', [(0, B0), (3, low), (9, low), (12, nj(10, 0.45, R='wind')), (15, nj(-12, 0.45, R='cut')), (18, nj(-12, 0.4, R='thru')),
                       (28, BI(28))])                                                                    # and out of it already cutting
            names += ['Slash', 'Cuts', 'Stars', 'Smoke', 'Step']
        # ---- the summons: the common set and a blow of their own ----
        elif cls == 'skeleton':                   # Raise Skeleton: an old guard, still swinging
            swing(); names += ['Swing']
        elif cls == 'ghoul':                      # Raise Ghoul: both hands up, then raking down
            up_ = L(crouch(tilt(both(B0, (135, 80), (160, 120)), SPINE, 'fwd', -2), 0.25))
            down = L(crouch(tilt(tilt(both(B0, (50, 95), 20), SPINE, 'fwd', 14), NECK, 'fwd', -6), 0.5))
            W('Rake', [(0, B0), (4, up_), (7, down), (10, down), (20, BI(20))])
            names += ['Rake']
        elif cls == 'squire':                     # Squire Knight: a thrust, as the order teaches
            jab(); names += ['Thrust']
        # ---- the dead in the pines: the slump above, a gait and blows of their own ----
        elif cls.startswith('zombie_'):
            # The gait: the stride (the gnawer's a run) under the slump, the knees a little less bent than standing, the
            # body rocking (sway), turning (yaw) and the arms swinging, each by kind.
            gnaw = kind in ('gnawer', 'husk')
            src, n, ln, f0 = ('M_Running', 16, 15.2, 0) if gnaw else ('own_walk', 13, 24.8, self.w0)
            sw, yw, am = {'shambler': (3, 0, 6), 'gnawer': (0, 0, 16), 'lurker': (0, 3, 8), 'bonesack': (5, 0, 4), 'brute': (2, 5, 8),
                          'rimewalker': (1, 4, 3), 'driftling': (0, 3, 8), 'husk': (0, 0, 16), 'slinger': (3, 0, 7), 'drowner': (3, 2, 6),
                          'leechmother': (5, 0, 4), 'cinder': (2, 0, 10), 'slagback': (2, 5, 7), 'warden': (1, 4, 5), 'dryking': (2, 3, 6),
                          'abbess': (1, 0, 2), 'stoker': (2, 5, 8)}[kind]

            def stride(i):
                s = math.sin(2 * math.pi * i / (n - 1))
                return L(slump(g(src, f0 + ln * i / (n - 1)), sw * s, yw * s, am * s, KN * 0.5))
            W('Walk', [(i * (1 if gnaw else 2), stride(i)) for i in range(n)])

            def jolt(k):                                                       # Hit: thrown back from the slump
                return L(crouch(fling(tilt(tilt(B0, SPINE, 'fwd', -5 * k), NECK, 'fwd', -7 * k), 0.8 * k), 0.15 * k))
            W('Hit', [(0, B0), (2, jolt(1)), (5, jolt(0.85)), (9, jolt(0.4)), (15, BI(15))])

            def roar(k):                                                       # the chest thrown out, the head back, the arms flung wide
                return L(crouch(fling(tilt(tilt(B0, SPINE, 'fwd', -4 * k), NECK, 'fwd', -12 * k), k, 50, 75, 25), 0.2 * k))
            W('Roar', [(0, B0), (5, roar(0.6)), (9, roar(1)), (13, roar(0.9)), (17, roar(1)), (21, roar(0.9)), (25, roar(1)), (36, BI(36))])
            own = ['Roar']
            if kind in ('shambler', 'lurker', 'bonesack', 'rimewalker', 'husk', 'slinger', 'drowner', 'leechmother', 'cinder', 'dryking', 'abbess'):
                # Rake: both hands up, then raking down (the ghoul's)
                up_ = L(crouch(tilt(both(B0, (135, 80), (160, 120)), SPINE, 'fwd', -2), 0.15))
                down = L(crouch(tilt(tilt(both(B0, (50, 95), 20), SPINE, 'fwd', 8), NECK, 'fwd', -4), 0.35))
                W('Rake', [(0, B0), (4, up_), (7, down), (10, down), (20, BI(20))]); own.append('Rake')
            if kind in ('gnawer', 'driftling'):                                # Bite: both hands out to seize, pulled in, the head down into it, a tear
                reach = L(crouch(tilt(both(B0, (85, 80), (95, 85)), SPINE, 'fwd', 3), 0.3))
                bite = L(crouch(tilt(tilt(both(B0, (70, 88), (60, 150)), SPINE, 'fwd', 7), NECK, 'fwd', 14), 0.45))
                W('Bite', [(0, B0), (3, reach), (6, bite), (9, bite), (11, L(tilt(bite, NECK, 'yaw', 12))), (13, L(tilt(bite, NECK, 'yaw', -12))),
                           (16, bite), (26, BI(26))]); own.append('Bite')
            if kind in ('lurker', 'driftling'):                                # Pounce: down on its haunches, then through the air claws first
                coil = L(crouch(tilt(both(B0, (25, -40), 35), SPINE, 'fwd', 5), 0.6))
                push = B0                                                      # off the ground: legs driven out behind, claws reaching
                for s in SIDES: push = leg(push, s, (25, -90), 15)
                push = L(aloft(tilt(tilt(both(push, (125, 85), 15), SPINE, 'fwd', 8), NECK, 'fwd', -8), 0.06))
                tuck = B0                                                      # in the air: knees drawn up, claws out to strike
                for s in SIDES: tuck = leg(tuck, s, (75, 85), 110)
                tuck = L(aloft(tilt(both(tuck, (100, 85), 30), SPINE, 'fwd', 4), 0.16))
                land = L(crouch(tilt(tilt(both(B0, (55, 88), 25), SPINE, 'fwd', 6), NECK, 'fwd', -3), 0.6))
                W('Pounce', [(0, B0), (4, coil), (7, push), (10, tuck), (14, land), (20, land), (30, BI(30))]); own.append('Pounce')
            if kind in ('bonesack', 'leechmother'):                            # Retch: hands clutched at the belly, heaving, the head thrust out

                def heave(k):
                    p = tilt(tilt(tilt(B0, SPINE, 'fwd', 4 + 6 * k), ['mixamorig:Neck'], 'fwd', 16 * k), ['mixamorig:Head'], 'fwd', -12 * k)
                    return L(crouch(both(p, (25, 120), (80, 175)), 0.15 + 0.2 * k))
                W('Retch', [(0, B0), (4, heave(0.3)), (8, heave(1)), (12, heave(0.4)), (16, heave(1.1)), (20, heave(0.5)), (24, heave(1.2)),
                            (30, heave(1.2)), (40, BI(40))]); own.append('Retch')
            if kind in ('brute', 'slagback', 'stoker', 'warden'):              # Slam: both fists into the ground; Chain Sweep: round once, the arms out
                smite('Slam', deep=1); whirl('Sweep', turns=1, up=80); own += ['Slam', 'Sweep']
            if kind == 'slinger':                                              # Rib Throw: a rib wrenched out over the shoulder and slung
                TP = {'cock': ((150, -60), (172, -120)), 'loose': ((95, 85), (90, 88)), 'follow': ((45, 115), 15)}
                sling = lambda ph, yaw, k=0.2: L(crouch(tilt(arm(B0, 'Right', *TP[ph]), SPINE, 'yaw', yaw), k))
                W('Throw', [(0, B0), (4, sling('cock', -9)), (7, sling('loose', 6, 0.3)), (10, sling('follow', 9, 0.3)), (14, sling('follow', 9, 0.3)),
                            (24, BI(24))]); own.append('Throw')
            if kind in ('drowner', 'abbess'):                                  # Drag Under: both hands out to seize, then hauled back and down
                reach = L(crouch(tilt(both(B0, (88, 82), (92, 85)), SPINE, 'fwd', 6), 0.35))
                haul = L(crouch(tilt(tilt(both(B0, (55, 70), (125, 150)), SPINE, 'fwd', -5), NECK, 'fwd', 6), 0.55))
                W('Drag', [(0, B0), (4, reach), (7, reach), (11, haul), (16, haul), (26, BI(26))]); own.append('Drag')
            # nothing of the living's: no running upright, no cheering with a fist, no talk, no potions
            names = [x for x in names if x not in ('Run', 'Victory', 'Talk', 'Drink', 'Point', 'Flex')] + own
        elif cls == 'doorkeeper':                 # Lisandra: her own seventeen clips, which live in the library, carried over as they are
            own = ['Idle', 'Walk_Bent', 'Run_Bent', 'Hop', 'Bolt', 'Cast', 'Snap', 'Lantern_Up', 'Wave', 'Hit', 'Dead_Fall',
                   'Revive', 'Wounded', 'Stunned', 'Victory', 'Talk', 'Drink']
            for s in own: self.retarget(s, name=s)                                # replaces the common clip of the same name
            # Victory: the lantern held up at its highest, with a cackle in the shoulders
            f0, f1 = bpy.data.actions[self.n('Lantern_Up')].frame_range
            hi = max((self.fk(g('Lantern_Up', f0 + (f1 - f0) * i / 16))[1]['mixamorig:LeftHand'].dot(self.U), f0 + (f1 - f0) * i / 16) for i in range(17))[1]
            top = g('Lantern_Up', hi); bob = lambda k: tilt(tilt(top, SPINE, 'fwd', 3 * k), NECK, 'fwd', -3 * k)
            W('Victory', [(0, bob(-1)), (6, bob(1)), (12, bob(-1)), (18, bob(1)), (24, bob(-1))])
            names += [s for s in own if s not in names]
        self.names = names; self.held = None
        return names

    def sheet(self, names, tag, n=7, w=190, h=235, view=(0.75, -1, 0.35)):
        cam = bpy.data.objects['ShotCam']; sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 2.6
        d = Vector(view).normalized(); cam.location = Vector((0, 0, 0.9)) + d * 8; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'TEXTURE'
        sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100; sc.render.image_settings.file_format = 'PNG'
        others = [o for o in bpy.data.objects if o.type in ('MESH', 'ARMATURE') and o not in (self.arm, self.mesh)]
        was = [(o, o.hide_render) for o in others]
        for o in others: o.hide_render = True
        self.mesh.hide_render = False
        os.makedirs(SHOTS, exist_ok=True); rows = []
        for name in names:
            a = use(self.arm, self.n(name)); f0, f1 = a.frame_range; tiles = []
            for i in range(n):
                f = f0 + (f1 - f0) * i / max(1, n - 1); sc.frame_set(int(f), subframe=f - int(f))
                p = os.path.join(SHOTS, '_t.png'); sc.render.filepath = p; bpy.ops.render.render(write_still=True)
                im = bpy.data.images.load(p); tiles.append(np.array(im.pixels[:]).reshape(h, w, 4).copy()); bpy.data.images.remove(im)
            rows.append(np.concatenate(tiles, axis=1))
        big = np.concatenate(rows[::-1], axis=0)
        out = bpy.data.images.new('sheet', w * n, h * len(names)); out.pixels = big.ravel().tolist()
        path = os.path.join(SHOTS, tag + '.png'); out.filepath_raw = path; out.file_format = 'PNG'; out.save(); bpy.data.images.remove(out)
        for o, v in was: o.hide_render = v
        return path

    def _shoot(self, view, scale, w, h, aim=0.9):
        cam = bpy.data.objects['ShotCam']; sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale
        d = Vector(view).normalized(); cam.location = Vector((0, 0, aim)) + d * 8; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        sc.render.engine = 'BLENDER_WORKBENCH'; sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_specular_highlight = False
        sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.4      # AgX greys the colours out
        sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA'
        sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100; sc.render.image_settings.file_format = 'PNG'
        was = [(o, o.hide_render) for o in bpy.data.objects if o.type in ('MESH', 'ARMATURE')]
        for o, _ in was: o.hide_render = not (o is self.mesh or (o.get('prop') and o.parent is self.arm))
        return was

    def tiles(self, names, folder, n=7, w=160, h=200, view=(0.75, -1, 0.35), scale=2.6):
        """Each clip as n frames, one picture per frame: <folder>/<clip>_<i>.png, for tools/clipsheet.py to lay out with labels."""
        os.makedirs(folder, exist_ok=True); was = self._shoot(view, scale, w, h)
        for name in names:
            low = name.startswith(('Dead', 'Revive'))           # lying down: a wider frame, aimed lower
            self._shoot(view, scale * (1.45 if low else 1), w, h, aim=0.55 if low else 0.9)
            a = use(self.arm, self.n(name)); f0, f1 = a.frame_range
            for i in range(n):
                f = f0 + (f1 - f0) * i / max(1, n - 1); sc.frame_set(int(f), subframe=f - int(f))
                sc.render.filepath = os.path.join(folder, '%s_%d.png' % (name, i)); bpy.ops.render.render(write_still=True)
        for o, v in was: o.hide_render = v

    def turn(self, folder, w=300, h=400, scale=2.3, views=(('front', (0, -1, 0.12)), ('three_quarter', (0.75, -1, 0.35)), ('side', (1, 0, 0.12)), ('back', (0, 1, 0.12)))):
        """The figure in its idle, from several sides: <folder>/body_<side>.png."""
        os.makedirs(folder, exist_ok=True); use(self.arm, self.n('Idle')); sc.frame_set(0)
        for side, view in views:
            was = self._shoot(view, scale, w, h, aim=1.0)
            sc.render.filepath = os.path.join(folder, 'body_%s.png' % side); bpy.ops.render.render(write_still=True)
            for o, v in was: o.hide_render = v

    def export(self, path, tex=1024):
        for slot in self.mesh.material_slots:
            for nd in slot.material.node_tree.nodes:
                if nd.type == 'TEX_IMAGE' and nd.image and nd.image.size[0] > tex: nd.image.scale(tex, tex)
        for p in self.mesh.data.polygons: p.use_smooth = True
        ad = self.arm.animation_data; ad.action = None
        for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
        for nm in self.names:                                # the track's name is the clip's name in the file
            a = bpy.data.actions[self.n(nm)]; t = ad.nla_tracks.new(); t.name = nm; t.strips.new(nm, int(a.frame_range[0]), a)
        bpy.ops.object.select_all(action='DESELECT'); self.arm.select_set(True); self.mesh.select_set(True)
        bpy.context.view_layer.objects.active = self.arm
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                                  export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_force_sampling=True, export_optimize_animation_size=True)
        print(self.key, 'exported', round(os.path.getsize(path) / 1e6, 2), 'MB,', len(self.names), 'clips')
