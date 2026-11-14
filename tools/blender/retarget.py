"""Gives a freshly rigged Meshy character the game's animation set, inside Blender.

Run inside a Blender that has the motion library open: `LISANDRA OLD - tactics.blend`, which holds Lisandra's
armature ("Armature") and the Mixamo-style source clips (Idle_02, Walking, Running, Attack, Thrust_Slash,
Charged_Spell_Cast, Hit_Reaction, Dead, ...). Then, from Blender's Python (or the Blender MCP):

    exec(open(r"<repo>/tools/blender/retarget.py").read())
    T = Target("paladin_m", r"<path>/paladin_m_walk.glb")     # Meshy's "Animation_Walking_withSkin.glb"
    T.build("paladin")                                         # the common set plus that class's own clips
    T.sheet(["Idle", "Swing", "Smite"], "paladin_check")       # contact sheet into tools/build/shots/
    T.export(r"<repo>/assets/models/paladin_m.glb")

How it works. Meshy's rig has the library's 24 bones under other names and with another bind pose, so local
rotations cannot be copied. Every library pose is carried over in armature space through an offset measured
where both figures are known to be in the same pose: frame 0 of the walk, which every Meshy rig comes with
and which is the same clip as the library's "Walking". The clips are then composed from those poses (arms
from one, legs from another, blended, retimed), all starting and ending in one idle and kept on their tile.
"""
import bpy, os, math
import numpy as np
from mathutils import Vector

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
        for s in SRC: self.retarget(s)
        # how close is the library's walk, sent through, to this figure's own walk?
        worst = 0
        for f in (0, 6, 12, 18):
            a = arm_pose(self.arm, self.n('M_Walking'), f); b = arm_pose(self.arm, self.walk.name, f + self.w0)
            for n in self.order:
                d = math.degrees(a[n][0].rotation_difference(b[n][0]).angle); worst = max(worst, min(d, 360 - d))
        print(key, 'retarget check: worst bone', round(worst, 1), 'deg off its own walk; size ratio', round(self.ratio, 3))
        self.I0 = self.grab('M_Idle_02', 0); self.home = self.I0[H][1].copy()

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
        """On its tile: the root keeps its height, its sideways and forward travel pinned to the idle's."""
        q, l = p[H]; p = dict(p); p[H] = (q, Vector((self.home.x, l.y, self.home.z))); return p

    def aligner(self, action, f0):
        c = self.I0[H][0] @ self.grab(action, f0)[H][0].inverted()
        def al(p):
            p = dict(p); q, l = p[H]; p[H] = (c @ q, l); return p
        return al

    def build(self, cls):
        g, mix, L, W = self.grab, self.mix, self.lock, self.write
        UP, RARM, LARM, ARMS, HEAD, SPINE, LEGS = self.UP, self.RARM, self.LARM, self.ARMS, self.HEAD, self.SPINE, self.LEGS
        idle = lambda f: g('M_Idle_02', f % 44.8)
        ARMDOWN = mix(g('M_Walking', 0), g('M_Walking', 12.4), 0.5)
        BI = lambda f=0: L(mix(idle(f), ARMDOWN, 0.6, ARMS)); B0 = BI(0)
        alD = self.aligner('M_Dead', 30); WND = alD(g('M_Dead', 34))
        RAISE = g('M_mage_soell_cast_6', 27); UPBOTH = g('M_Charged_Spell_Cast', 46); CROUCH = g('M_Charged_Spell_Cast', 24)
        HR = g('M_Hit_Reaction', 20); CLASP = g('M_Attack', 2)
        back = mix(B0, HR, 0.7, RARM)
        thrust = mix(mix(B0, CROUCH, 1.0, RARM), CROUCH, 0.5, SPINE + HEAD)

        def blow(name, src, s0, s1, n, legs=0.7, df=2, tail=8):
            # the upper body from the source, the legs partly, the hips never turning
            keys = [(0, B0)]
            for i in range(n):
                p = g(src, s0 + (s1 - s0) * i / (n - 1)); keys.append((2 + i * df, L(mix(mix(B0, p, 1.0, UP), p, legs, LEGS))))
            keys.append((2 + (n - 1) * df + tail, BI(2 + (n - 1) * df + tail))); W(name, keys)

        # ---- what every figure has ----
        W('Idle', [(f, BI(f)) for f in (0, 9, 18, 27, 36, 45)])
        W('Walk', [(i * 2, L(g('own_walk', self.w0 + i * 24.8 / 12))) for i in range(13)])
        W('Run', [(i, L(g('M_Running', i * 15.2 / 15))) for i in range(16)])
        dip = mix(B0, CROUCH, 0.45, LEGS + SPINE)
        W('Hop', [(0, B0), (3, L(dip)), (8, L(mix(B0, UPBOTH, 0.15, ARMS))), (12, L(mix(B0, CROUCH, 0.2, LEGS))), (16, B0)])
        W('Cast', [(0, B0)] + [(4 + i * 3, L(mix(BI(4 + i * 3), g('M_Charged_Spell_Cast', 34 + i * 24 / 8), 0.7, ARMS))) for i in range(9)] + [(34, BI(34))])
        alH = self.aligner('M_Hit_Reaction', 0)
        hk = lambda s: L(mix(B0, alH(g('M_Hit_Reaction', s)), 0.5, [n for n in UP if n not in RARM]))
        W('Hit', [(0, B0), (3, hk(8)), (6, hk(14)), (10, BI(10))])
        s1 = alH(g('M_Hit_Reaction', 14)); s2 = alH(g('M_Hit_Reaction', 19)); s3 = mix(s1, WND, 0.5, HEAD)
        W('Stunned', [(0, L(s1)), (10, L(s2)), (20, L(s3)), (30, L(s1))])
        alW = self.aligner('M_Dead', 34)
        w1 = mix(alW(g('M_Dead', 34)), B0, 0.5, HEAD); w2 = mix(alW(g('M_Dead', 35.5)), B0, 0.5, HEAD)
        W('Wounded', [(0, L(w1)), (18, L(w2)), (36, L(w1))])
        W('Dead_Fall', [(0, B0)] + [(3 + i * 2, L(alD(g('M_Dead', 30 + i * 41 / 19)))) for i in range(20)])
        W('Revive', [(i * 2, L(alD(g('M_Dead', 71 - i * 41 / 19)))) for i in range(20)] + [(46, B0)])
        W('Victory', [(f, L(mix(B0, RAISE, w, RARM))) for f, w in ((0, 0.6), (8, 0.95), (16, 0.6), (24, 0.95), (32, 0.6))])
        t1 = mix(B0, RAISE, 0.24, RARM); t2 = mix(BI(20), WND, 0.25, HEAD); t3 = mix(mix(BI(30), UPBOTH, 0.2, LARM), RAISE, 0.12, RARM)
        W('Talk', [(0, B0), (8, L(t1)), (18, L(t2)), (28, L(t3)), (38, L(t2)), (46, B0)])
        d1 = mix(mix(B0, CROUCH, 1.0, RARM), RAISE, 0.45, RARM); d2 = mix(d1, alD(g('M_Dead', 12)), 0.4, HEAD + ['mixamorig:Spine2'])
        W('Drink', [(0, B0), (6, L(d1)), (10, L(d2)), (24, L(d2)), (34, BI(34))])
        alA = self.aligner('M_Attack', 2); brace = alA(g('M_Attack', 2)); brace2 = alA(g('M_Attack', 5))
        W('Guard', [(0, L(brace)), (18, L(brace2)), (36, L(brace))])
        W('Point', [(0, B0), (6, L(mix(B0, CROUCH, 1.0, RARM))), (20, L(mix(B0, CROUCH, 1.0, RARM))), (30, BI(30))])
        fl = mix(B0, UPBOTH, 0.8, ARMS); fl2 = mix(mix(B0, UPBOTH, 0.62, ARMS), CROUCH, 0.25, LEGS)
        W('Flex', [(0, B0), (6, L(fl2)), (11, L(fl)), (17, L(fl2)), (23, L(fl)), (34, BI(34))])
        names = ['Idle', 'Walk', 'Run', 'Hop', 'Cast', 'Hit', 'Stunned', 'Wounded', 'Dead_Fall', 'Revive', 'Victory', 'Talk', 'Drink', 'Guard', 'Point', 'Flex']

        # the arm thrown forward: a bolt, for anyone who throws one
        def bolt(name='Bolt'):
            W(name, [(0, B0), (3, L(back)), (7, L(thrust)), (10, L(thrust)), (19, BI(19))])
        # arms wide, turning: something that spreads all round
        def wave(name='Wave'):
            def key(f, s):
                src = g('M_mage_soell_cast_1', s); return L(mix(mix(BI(f), src, 1.0, ARMS), src, 0.5, SPINE))
            W(name, [(0, B0)] + [(4 + i * 3, key(4 + i * 3, 10 + i * 64 / 11)) for i in range(12)] + [(42, BI(42))])
        # one arm held high: a blessing, a call
        def raised(name, arm, hold=16):
            a = mix(mix(B0, UPBOTH, 1.0, arm), UPBOTH, 0.3, HEAD); a2 = mix(a, g('M_Charged_Spell_Cast', 50), 1.0, arm)
            W(name, [(0, B0), (8, L(a)), (8 + hold // 2, L(a2)), (8 + hold, L(a)), (16 + hold, L(mix(B0, a, 0.5, arm))), (26 + hold, BI(26 + hold))])
        # both arms up, then everything pulled down out of the sky
        def meteor(name='Meteor'):
            upb = mix(mix(B0, UPBOTH, 0.9, ARMS), UPBOTH, 0.3, HEAD)
            down = mix(mix(B0, CROUCH, 0.7, LEGS + SPINE), ARMDOWN, 1.0, ARMS)
            W(name, [(0, B0), (8, L(upb)), (20, L(mix(upb, UPBOTH, 1.0, ARMS))), (25, L(down)), (33, L(down)), (44, BI(44))])

        # ---- what each class has besides ----
        if cls == 'paladin':                      # mace and shield
            blow('Swing', 'M_Right_Hand_Sword_Slash', 4, 32, 8)                 # plain attack
            blow('Smite', 'M_Charged_Slash', 8, 48, 10, legs=0.8)               # Smite: the hammer from overhead
            bolt()                                                                # Holy Bolt
            raised('Bless', LARM)                                                 # Blessed Light
            wave()                                                                # Consecration
            blow('Shield_Bash', 'M_Left_Slash', 14, 56, 9, legs=0.4)
            names += ['Swing', 'Smite', 'Bolt', 'Bless', 'Wave', 'Shield_Bash']
        elif cls == 'ranger':                     # bow: the right arm holds it out, the left draws to the chest
            aim = mix(mix(mix(B0, CROUCH, 1.0, RARM), CLASP, 1.0, LARM), CROUCH, 0.3, SPINE)
            loose = mix(aim, ARMDOWN, 0.7, LARM)
            W('Shoot', [(0, B0), (4, L(mix(B0, aim, 0.6))), (8, L(aim)), (11, L(aim)), (13, L(loose)), (18, L(loose)), (28, BI(28))])   # Quick Shot, Multishot, plain attack
            up = mix(mix(mix(B0, RAISE, 0.75, RARM), CLASP, 1.0, LARM), RAISE, 0.3, HEAD)
            upl = mix(up, ARMDOWN, 0.7, LARM)
            W('Volley', [(0, B0), (6, L(up)), (10, L(upl)), (14, L(up)), (18, L(upl)), (22, L(up)), (26, L(upl)), (36, BI(36))])       # Rain of Arrows
            call = mix(mix(B0, HR, 1.0, RARM), RAISE, 0.3, [n for n in RARM if n.endswith('RightArm')])
            W('Call', [(0, B0), (6, L(call)), (20, L(mix(call, RAISE, 0.2, HEAD))), (30, BI(30))])                                    # Wolf Pack: a whistle
            names += ['Shoot', 'Volley', 'Call']
        elif cls == 'wizard':                     # staff
            bolt()                                                                # Fire Bolt and plain attack
            wave()                                                                # Frost Nova
            meteor()                                                              # Meteor
            names += ['Bolt', 'Wave', 'Meteor']
        # something lifted out of the ground: down on a knee with a hand low, then up with it
        def raise_(name='Raise'):
            low = mix(mix(B0, CROUCH, 0.8, LEGS + SPINE), ARMDOWN, 1.0, ARMS)
            high = mix(mix(B0, UPBOTH, 0.9, RARM), UPBOTH, 0.3, HEAD)
            W(name, [(0, B0), (7, L(low)), (13, L(low)), (22, L(high)), (30, L(high)), (40, BI(40))])
        # a spin with the arms out, the whole body turning
        def spin(name='Whirl'):
            al = self.aligner('M_Axe_Spin_Attack', 8)
            W(name, [(0, B0)] + [(2 + i * 2, L(al(g('M_Axe_Spin_Attack', 8 + i * 44 / 12)))) for i in range(13)] + [(34, BI(34))])
        # overhead, then down into a low lunge: a leap's landing, a charge
        def leap(name='Leap'):
            al = self.aligner('M_Attack', 6)
            W(name, [(0, B0)] + [(2 + i * 2, L(al(g('M_Attack', 6 + i * 54 / 11)))) for i in range(12)] + [(32, BI(32))])

        if cls == 'barbarian':                    # two axes
            blow('Swing', 'M_Right_Hand_Sword_Slash', 4, 32, 8)                 # plain attack
            blow('Bash', 'M_Left_Slash', 14, 56, 9, legs=0.5)                   # Bash: the other axe
            leap()                                                                # Leap
            spin()                                                                # Whirlwind
            blow('Slam', 'M_Charged_Slash', 8, 48, 10, legs=0.8)                # Earthquake
            names += ['Swing', 'Bash', 'Leap', 'Whirl', 'Slam']
        elif cls == 'necromancer':                # wand
            bolt()                                                                # Bone Spike, plain attack
            raise_()                                                              # Raise Skeleton
            hexp = mix(mix(mix(B0, CROUCH, 1.0, LARM + RARM), WND, 0.3, HEAD), CROUCH, 0.25, SPINE)
            W('Curse', [(0, B0), (10, L(hexp)), (26, L(hexp)), (38, BI(38))])                                                         # Weaken: a slow point with both hands
            names += ['Bolt', 'Raise', 'Curse']
        elif cls == 'dragoon':                    # spear
            blow('Thrust', 'M_Thrust_Slash', 24, 58, 9)                          # Lance Jab, plain attack
            leap()                                                                # Jump and Dragon Dive: the landing
            lean = mix(mix(mix(B0, CROUCH, 0.7, SPINE + LEGS), HR, 0.6, ARMS), CROUCH, 0.5, HEAD)
            W('Breath', [(0, B0), (5, L(mix(B0, UPBOTH, 0.3, SPINE + HEAD))), (10, L(lean)), (24, L(lean)), (34, BI(34))])              # Dragon Breath: head and chest thrown forward
            names += ['Thrust', 'Leap', 'Breath']
        elif cls == 'death_knight':               # sword
            blow('Swing', 'M_Right_Hand_Sword_Slash', 4, 32, 8)                 # Frost Strike, plain attack
            blow('Smite', 'M_Charged_Slash', 8, 48, 10, legs=0.8)               # Obliterate
            bolt()                                                                # Death Coil
            raise_()                                                              # Raise Ghoul
            names += ['Swing', 'Smite', 'Bolt', 'Raise']
        elif cls == 'carrion_witch':              # staff
            bolt()                                                                # Rot Bolt, plain attack
            wave()                                                                # Crow Swarm: the cloak thrown open
            pin = mix(mix(B0, CLASP, 1.0, ARMS), WND, 0.4, HEAD); jab = mix(pin, ARMDOWN, 0.25, RARM)
            W('Hex', [(0, B0), (7, L(pin)), (11, L(jab)), (14, L(pin)), (18, L(jab)), (22, L(pin)), (32, BI(32))])                      # Voodoo Doll: a pin in the poppet
            names += ['Bolt', 'Wave', 'Hex']
        elif cls == 'bard':                       # lute: hands at the chest, the right one strumming
            hold = mix(B0, CLASP, 1.0, ARMS); st = mix(hold, ARMDOWN, 0.35, RARM)
            W('Strum', [(0, B0), (5, L(hold)), (8, L(st)), (11, L(hold)), (14, L(st)), (17, L(hold)), (26, BI(26))])                    # Plucked Note, plain attack
            sway = lambda p, f: mix(p, idle(f), 0.6, SPINE)
            W('Ballad', [(0, B0), (5, L(hold))] + [(8 + i * 3, L(sway(st if i % 2 == 0 else hold, 8 + i * 3))) for i in range(10)] + [(46, BI(46))])   # Ballad of Valor, Lullaby
            raised('Bless', RARM)                                                 # Hymn of Mending
            names += ['Strum', 'Ballad', 'Bless']
        elif cls == 'lancer':                     # spear and tower shield
            blow('Thrust', 'M_Thrust_Slash', 24, 58, 9)                          # Lance Thrust, plain attack
            wall = mix(mix(mix(B0, CLASP, 1.0, LARM), CROUCH, 0.35, LEGS + SPINE), UPBOTH, 0.25, LARM)
            W('Guard_Up', [(0, B0), (6, L(wall)), (24, L(wall)), (34, BI(34))])                                                       # Tower Shield: the shield brought up and set
            raised('Rally', RARM)                                                 # Squire Knight: the banner arm up
            leap('Charge')                                                        # Lance Charge
            blow('Shield_Bash', 'M_Left_Slash', 14, 56, 9, legs=0.4)
            names += ['Thrust', 'Guard_Up', 'Rally', 'Charge', 'Shield_Bash']
        elif cls == 'arcane_sorcerer':            # wand: star-fire and gravity
            bolt()                                                                # Star Missiles, plain attack
            raised('Bless', RARM)                                                 # Moonbeam: a hand held up to the moon
            meteor()                                                              # Falling Star
            wave()                                                                # Black Hole
            names += ['Bolt', 'Bless', 'Meteor', 'Wave']
        elif cls == 'boomerang_knight':           # two crescent blades: thrown, and caught again
            follow = mix(thrust, ARMDOWN, 0.5, RARM); catch = mix(B0, CROUCH, 0.8, RARM)
            W('Throw', [(0, B0), (4, L(back)), (8, L(thrust)), (12, L(follow)), (22, L(catch)), (30, BI(30))])                          # Boomerang, plain attack
            both = mix(B0, HR, 0.7, ARMS); r = mix(both, CROUCH, 1.0, RARM); lr = mix(r, CROUCH, 1.0, LARM)
            W('Twin', [(0, B0), (4, L(both)), (8, L(r)), (13, L(lr)), (24, L(mix(B0, CROUCH, 0.8, ARMS))), (32, BI(32))])               # Twin Rang: one, then the other
            spin()                                                                # Swirling Blades
            wave('Typhoon')                                                       # Typhoon
            names += ['Throw', 'Twin', 'Whirl', 'Typhoon']
        elif cls == 'doorkeeper':                 # Lisandra: her own seventeen clips, which live in the library, carried over as they are
            own = ['Idle', 'Walk_Bent', 'Run_Bent', 'Hop', 'Bolt', 'Cast', 'Snap', 'Lantern_Up', 'Wave', 'Hit', 'Dead_Fall',
                   'Revive', 'Wounded', 'Stunned', 'Victory', 'Talk', 'Drink']
            for s in own: self.retarget(s, name=s)                                # replaces the common clip of the same name
            names += [s for s in own if s not in names]
        self.names = names
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
