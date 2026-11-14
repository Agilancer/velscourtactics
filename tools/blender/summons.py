# The five summons that are not people, each rigged and given its clips (creature.py does the work). exec'd inside
# Blender after creature.py; BUILD(key) returns the armature and its clip names. Turns are (axis, degrees) about the
# armature's axes: +X pitches a forward bone nose-down, tips an upright bone forward and swings a hanging leg back;
# +Z turns to the creature's left; +Y rolls it over to its left.
S = lambda f, n, ph=0: math.sin(2 * math.pi * f / n + ph)
C = lambda f, n, ph=0: math.cos(2 * math.pi * f / n + ph)


def loop(n, step, fn):
    return [(f, fn(f)) for f in range(0, n + 1, step)]


# ---------------------------------------------------------------- wolf: Wolf Pack
def wolf():
    feet = {'FL': (0.111, -0.30), 'FR': (-0.072, -0.314), 'HL': (0.108, 0.327), 'HR': (-0.142, 0.34)}
    B = [('Root', (0, 0.30, 0.58), (0, 0.08, 0.60), None), ('Spine', (0, 0.08, 0.60), (0, -0.14, 0.62), 'Root'),
         ('Chest', (0, -0.14, 0.62), (0, -0.33, 0.64), 'Spine'), ('Neck', (0, -0.33, 0.66), (0, -0.48, 0.79), 'Chest'),
         ('Head', (0, -0.48, 0.79), (0, -0.72, 0.75), 'Neck'),
         ('Tail1', (0, 0.42, 0.60), (-0.02, 0.54, 0.47), 'Root'), ('Tail2', (-0.02, 0.54, 0.47), (-0.04, 0.63, 0.33), 'Tail1'),
         ('Tail3', (-0.04, 0.63, 0.33), (-0.05, 0.72, 0.20), 'Tail2')]
    for leg, (fx, fy) in feet.items():
        xs = 0.085 if leg[1] == 'L' else -0.08; xm = (xs + fx) / 2
        if leg[0] == 'F':
            B += [(leg + '_up', (xs, -0.28, 0.50), (xm, -0.29, 0.27), 'Chest'), (leg + '_low', (xm, -0.29, 0.27), (fx, fy, 0.07), leg + '_up'),
                  (leg + '_paw', (fx, fy, 0.07), (fx, fy - 0.07, 0.02), leg + '_low')]
        else:
            B += [(leg + '_up', (xs, 0.28, 0.55), (xm, 0.22, 0.33), 'Root'), (leg + '_low', (xm, 0.22, 0.33), (fx, fy + 0.04, 0.15), leg + '_up'),
                  (leg + '_paw', (fx, fy + 0.04, 0.15), (fx, fy - 0.03, 0.02), leg + '_low')]
    arm = armature('wolf', B)

    def allowed(P):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]; m = {}
        for leg in feet:
            side = (x > 0.02) if leg == 'FL' else (x <= 0.02) if leg == 'FR' else (x > -0.017) if leg == 'HL' else (x <= -0.017)
            end = (y < -0.05) if leg[0] == 'F' else (y > 0.05)
            for b in ('_up', '_low', '_paw'): m[leg + b] = side & end & (z < 0.53)
        for b in ('Root', 'Spine', 'Chest'): m[b] = z > 0.25
        for b in ('Tail1', 'Tail2', 'Tail3'): m[b] = y > 0.38
        for b in ('Neck', 'Head'): m[b] = (y < -0.2) & (z > 0.4)
        return m
    skin('wolf', arm, allowed, r=0.07)

    def base(f=0, n=48):                                                    # standing, breathing, looking about, the tail slow
        s = S(f, n)
        return {'Root': [('loc', (0, 0, 0.004 * s))], 'Chest': [(X, 1.5 * s)], 'Neck': [(X, -3 * s)], 'Head': [(Z, 8 * S(f, n, 1))],
                'Tail1': [(Z, 8 * s)], 'Tail2': [(Z, 10 * S(f, n, -0.6))], 'Tail3': [(Z, 12 * S(f, n, -1.2))]}
    clip(arm, 'Idle', loop(48, 6, base))

    def trot(f, n=16):                                                      # the diagonal pairs together; a lifted foot folds up
        p = {'Root': [('loc', (0, 0, 0.012 * C(f, n / 2)))], 'Spine': [(X, 1.5 * C(f, n / 2))], 'Neck': [(X, -2 * C(f, n / 2))],
             'Tail1': [(Z, 6 * S(f, n)), (X, 8)], 'Tail2': [(Z, 8 * S(f, n, -0.6))], 'Tail3': [(Z, 10 * S(f, n, -1.2))]}
        for leg, ph in (('FL', 0), ('HR', 0), ('FR', math.pi), ('HL', math.pi)):
            a = 26 * S(f, n, ph); lift = max(0, C(f, n, ph))
            if leg[0] == 'F': p.update({leg + '_up': [(X, -a)], leg + '_low': [(X, 50 * lift)], leg + '_paw': [(X, 25 * lift)]})
            else: p.update({leg + '_up': [(X, -a)], leg + '_low': [(X, 40 * lift)], leg + '_paw': [(X, -30 * lift)]})
        return p
    clip(arm, 'Run', loop(16, 2, trot))
    R = base(0)
    back = merge(R, {'Root': [('loc', (0, 0.06, -0.04))], 'Chest': [(X, -6)], 'Neck': [(X, -16)], 'Head': [(X, -10)],
                     'HL_up': [(X, -15)], 'HR_up': [(X, -15)], 'HL_low': [(X, 25)], 'HR_low': [(X, 25)], 'FL_up': [(X, -8)], 'FR_up': [(X, -8)]})
    lunge = merge(R, {'Root': [('loc', (0, -0.14, 0.02))], 'Chest': [(X, 6)], 'Neck': [(X, 24)], 'Head': [(X, 14)],
                      'HL_up': [(X, 18)], 'HR_up': [(X, 18)], 'FL_up': [(X, -22)], 'FR_up': [(X, -22)]})
    clip(arm, 'Bite', [(0, R), (4, back), (7, lunge), (9, merge(lunge, {'Head': [(Z, 12)]})), (11, merge(lunge, {'Head': [(Z, -12)]})),
                       (13, lunge), (20, R)])
    hit = lambda k: merge(R, {'Root': [('loc', (0, 0.06 * k, 0))], 'Chest': [(X, -8 * k)], 'Neck': [(X, -12 * k)], 'Head': [(Z, 16 * k)],
                              'Tail1': [(X, -25 * k)], 'FL_up': [(X, -10 * k)], 'FR_up': [(X, -10 * k)]})
    clip(arm, 'Hit', [(0, R), (2, hit(1)), (5, hit(0.8)), (9, hit(0.3)), (14, R)])
    limp = {l + '_low': [(X, 25)] for l in feet}
    fall = lambda roll, dz, k: merge(R, limp if k else {}, {'Root': [(Y, roll), ('loc', (0, 0, dz))], 'Neck': [(X, 18 * k)], 'Head': [(X, -6 * k)],
                                                            'Tail1': [(X, -20 * k)]})
    clip(arm, 'Dead', [(0, R), (5, merge(R, {'Root': [(Y, 8), ('loc', (0, 0, -0.05))], 'FL_low': [(X, 30)], 'FR_low': [(X, 30)]})),
                       (10, fall(40, -0.17, 0.5)), (16, fall(90, -0.43, 1)), (20, fall(84, -0.41, 1)), (30, fall(86, -0.42, 1))])
    sit = lambda k, tr=0: merge(R, {'Root': [(X, -16 * k), ('loc', (0, 0.10 * k, -0.11 * k))], 'HL_up': [(X, -45 * k)], 'HR_up': [(X, -45 * k)],
                                    'HL_low': [(X, 60 * k)], 'HR_low': [(X, 60 * k)], 'HL_paw': [(X, -10 * k)], 'HR_paw': [(X, -10 * k)],
                                    'FL_up': [(X, 16 * k)], 'FR_up': [(X, 16 * k)], 'Neck': [(X, -34 * k)], 'Head': [(X, -26 * k), (Z, tr)],
                                    'Tail1': [(X, -15 * k)]})
    clip(arm, 'Howl', [(0, R), (8, sit(1)), (12, sit(1, 2)), (16, sit(1, -2)), (20, sit(1, 2)), (24, sit(1, -2)), (28, sit(1)), (36, R)])
    return arm, ['Idle', 'Run', 'Bite', 'Hit', 'Dead', 'Howl']


# ---------------------------------------------------------------- whelp: Summon Whelp (it never lands)
def whelp():
    B = [('Root', (0, 0.12, 0.38), (0, -0.05, 0.42), None), ('Chest', (0, -0.05, 0.42), (0, -0.25, 0.47), 'Root'),
         ('Neck', (0, -0.25, 0.47), (0, -0.42, 0.50), 'Chest'), ('Head', (0, -0.42, 0.50), (0, -0.644, 0.45), 'Neck'),
         ('Tail1', (0, 0.15, 0.36), (0.06, 0.32, 0.22), 'Root'), ('Tail2', (0.06, 0.32, 0.22), (0.2, 0.45, 0.17), 'Tail1'),
         ('Tail3', (0.2, 0.45, 0.17), (0.3, 0.6, 0.3), 'Tail2')]
    for s, k in (('L', 1), ('R', -1)):
        B += [('Wing%s1' % s, (0.12 * k, -0.08, 0.6), (0.35 * k, 0.0, 0.8), 'Chest'), ('Wing%s2' % s, (0.35 * k, 0.0, 0.8), (0.64 * k, 0.15, 0.85), 'Wing%s1' % s),
              ('Arm%s' % s, (0.11 * k, -0.28, 0.36), (0.12 * k, -0.3, 0.02), 'Chest'), ('Leg%s' % s, (0.13 * k, 0.08, 0.34), (0.13 * k, 0.05, 0.02), 'Root')]
    arm = armature('whelp', B)

    def allowed(P):
        x, y, z = P[:, 0], P[:, 1], P[:, 2]; m = {}
        for s, sg in (('L', 1), ('R', -1)):
            m['Wing%s1' % s] = (sg * x > 0.13) & (z > 0.45); m['Wing%s2' % s] = (sg * x > 0.3) & (z > 0.5)
            m['Arm%s' % s] = (sg * x > 0.02) & (y < -0.12) & (z < 0.36); m['Leg%s' % s] = (sg * x > 0.02) & (y > -0.12) & (y < 0.2) & (z < 0.34)
        for b in ('Tail1', 'Tail2', 'Tail3'): m[b] = y > 0.12
        for b in ('Neck', 'Head'): m[b] = y < -0.2
        return m
    skin('whelp', arm, allowed, r=0.06)
    H0 = 0.3                                                                # how high it hovers

    def flap(f, n=24, pitch=0, tuck=0, beat=32):
        a, b = beat * S(f, n), 0.65 * beat * S(f, n, -0.8)
        return {'Root': [(X, pitch), ('loc', (0, 0, H0 + 0.035 * S(f, n, -math.pi / 2)))], 'Neck': [(X, -3 * S(f, n))],
                'WingL1': [(Y, a)], 'WingL2': [(Y, b)], 'WingR1': [(Y, -a)], 'WingR2': [(Y, -b)],
                'ArmL': [(X, 15 + tuck)], 'ArmR': [(X, 15 + tuck)], 'LegL': [(X, 25 + tuck)], 'LegR': [(X, 25 + tuck)],
                'Tail1': [(Z, 6 * S(f, n)), (X, 4 * S(f, n))], 'Tail2': [(Z, 8 * S(f, n, -0.6))], 'Tail3': [(Z, 10 * S(f, n, -1.2))]}
    clip(arm, 'Hover', loop(24, 3, flap))
    clip(arm, 'Fly', loop(16, 2, lambda f: flap(f, 16, pitch=10, tuck=30, beat=38)))
    R = flap(0)
    pose = lambda root, z, neck, head, w1, w2=0, extra={}: merge(R, {'Root': [(X, root), ('loc', (0, 0, z - (H0 - 0.035)))], 'Neck': [(X, neck)], 'Head': [(X, head)],
                                                                     'WingL1': [(Y, w1)], 'WingR1': [(Y, -w1)], 'WingL2': [(Y, w2)], 'WingR2': [(Y, -w2)]}, extra)
    rear = pose(-14, 0.36, -20, -14, -28, -12); spit = pose(12, 0.28, 26, 10, 34, 20)
    clip(arm, 'Spit', [(0, R), (5, rear), (9, spit), (13, spit), (22, R)])
    hit = lambda k: pose(-18 * k, H0 + 0.02 * k, -14 * k, -8 * k, -40 * k, -20 * k, {'Root': [('loc', (0, 0.08 * k, 0))]})
    clip(arm, 'Hit', [(0, R), (2, hit(1)), (6, hit(0.6)), (14, R)])
    limp = {'WingL1': [(Y, 45)], 'WingR1': [(Y, -45)], 'WingL2': [(Y, 30)], 'WingR2': [(Y, -30)]}
    drop = lambda roll, z, k: merge(R, {'Root': [(Y, roll), (X, -10 * (1 - k)), ('loc', (0, 0, z - (H0 - 0.035)))], 'Neck': [(X, 20 * k)], 'Head': [(X, 10 * k)]},
                                    limp if k > 0.5 else {})
    clip(arm, 'Dead', [(0, R), (4, pose(-20, 0.36, -18, -10, -35, -15)), (10, drop(30, 0.12, 0.4)), (16, drop(78, -0.2, 1)), (20, drop(72, -0.18, 1)),
                       (30, drop(75, -0.19, 1))])
    roar = lambda tr: pose(-6, 0.34, -30, -18 + tr, -32, -15)
    clip(arm, 'Roar', [(0, R), (7, roar(0)), (11, roar(3)), (15, roar(-3)), (19, roar(3)), (23, roar(0)), (30, R)])
    return arm, ['Hover', 'Fly', 'Spit', 'Hit', 'Dead', 'Roar']


# ---------------------------------------------------------------- slime: Slimeling
def slime():
    arm = armature('slime', [('Base', (0, 0, 0), (0, 0, 0.25), None), ('Body', (0, 0, 0.25), (0, 0, 0.5), 'Base'), ('Top', (0, 0, 0.5), (0, 0, 0.7), 'Body')])
    skin('slime', arm, r=0.12, squash=(0.15, 0.15, 1))
    sq = lambda w, h, z=0, extra={}: merge({'Base': [('scale', (w, h, w)), ('loc', (0, 0, z))]}, extra)
    clip(arm, 'Idle', loop(36, 6, lambda f: sq(1 + 0.03 * S(f, 36), 1 - 0.04 * S(f, 36), 0, {'Top': [(Y, 3 * S(f, 36, 1))], 'Body': [(X, 2 * C(f, 36))]})))
    R = sq(1, 1)
    hop = [(0, sq(1.15, 0.8)), (4, sq(0.88, 1.2, 0.08)), (8, sq(0.95, 1.08, 0.2, {'Body': [(X, -5)]})), (12, sq(0.9, 1.15, 0.06)), (14, sq(1.2, 0.75)), (16, sq(1.15, 0.8))]
    clip(arm, 'Hop', hop)
    clip(arm, 'Lunge', [(0, R), (4, sq(1.15, 0.8, 0, {'Body': [(X, -12)]})), (8, sq(0.85, 1.2, 0.03, {'Body': [(X, 25)], 'Top': [(X, 15)], 'Base': [('loc', (0, -0.12, 0.03))]})),
                        (11, sq(0.9, 1.12, 0.02, {'Body': [(X, 22)], 'Top': [(X, 12)], 'Base': [('loc', (0, -0.1, 0.02))]})), (20, R)])
    clip(arm, 'Hit', [(0, R), (2, sq(1.25, 0.7, 0, {'Body': [(X, -10)]})), (5, sq(0.9, 1.15)), (8, sq(1.08, 0.92)), (14, R)])
    clip(arm, 'Dead', [(0, R), (6, sq(1.2, 0.8)), (14, sq(1.45, 0.4)), (22, sq(1.6, 0.15)), (30, sq(1.62, 0.13))])
    return arm, ['Idle', 'Hop', 'Lunge', 'Hit', 'Dead']


# ---------------------------------------------------------------- turret: Gun Turret (clockwork on claws; it never moves)
def turret():
    m = bpy.data.objects['turret_s2']
    if not m.get('turned'):                                                 # the barrel came out along -X
        m.data.transform(Matrix.Rotation(math.radians(90), 4, 'Z')); m.data.update(); m['turned'] = 1
    CUT = 0.29                                                              # the narrow column between the claws and the turntable
    arm = armature('turret', [('Base', (0, 0, 0), (0, 0, CUT), None), ('Head', (0, 0, CUT), (0, 0, 0.6), 'Base')])
    skin('turret', arm, rigid=lambda P: (P[:, 2] > CUT).astype(int))
    clip(arm, 'Idle', loop(60, 6, lambda f: {'Head': [(Z, 10 * S(f, 60)), ('loc', (0, 0, 0.003 * S(f, 20)))]}))
    R = {}
    kick = lambda k: {'Head': [(X, -6 * k), ('loc', (0, 0.05 * k, 0))], 'Base': [(X, -2 * k)]}
    clip(arm, 'Fire', [(0, R), (2, kick(1)), (5, kick(0.4)), (9, R), (16, R)])
    clip(arm, 'Hit', [(0, R), (2, {'Head': [(Z, 12), (Y, 6)], 'Base': [(Y, -4)]}), (5, {'Head': [(Z, -8)]}), (8, {'Head': [(Z, 4)]}), (14, R)])
    brk = lambda k, yaw: {'Head': [(Z, yaw), (X, 40 * k), (Y, 20 * k), ('loc', (0, 0, -0.1 * k))], 'Base': [(Y, 12 * k)]}
    clip(arm, 'Break', [(0, R), (4, {'Head': [(Z, 15), (X, 10)]}), (10, brk(0.7, 15)), (18, brk(1, 18)), (22, brk(0.95, 18)), (30, brk(1, 18))])
    return arm, ['Idle', 'Fire', 'Hit', 'Break']


# ---------------------------------------------------------------- totem: Healing and Searing Totem (a carved post)
def totem():
    arm = armature('totem', [('Base', (0, 0, 0), (0, 0, 0.12), None), ('Post', (0, 0, 0.12), (0, 0, 0.7), 'Base'),
                             ('Mid', (0, 0, 0.7), (0, 0, 1.05), 'Post'), ('Top', (0, 0, 1.05), (0, 0, 1.4), 'Mid')])
    skin('totem', arm, r=0.1, squash=(0.1, 0.1, 1))
    clip(arm, 'Idle', loop(48, 6, lambda f: {'Top': [(Z, 3 * S(f, 48))], 'Mid': [(Y, 1 * S(f, 48, 1))]}))
    R = {}
    swell = lambda s, back=0: {'Top': [('scale', (s, s, s)), (X, -back)], 'Mid': [(X, -back / 2)]}
    clip(arm, 'Pulse', [(0, R), (4, swell(1.08, 3)), (8, swell(1.16, 6)), (12, swell(1.0)), (16, swell(1.07, 2)), (24, R)])
    clip(arm, 'Hit', [(0, R), (2, {'Post': [(Y, 4)], 'Mid': [(Y, 3)]}), (5, {'Post': [(Y, -3)], 'Mid': [(Y, -2)]}), (8, {'Post': [(Y, 1.5)]}), (14, R)])
    over = lambda a, crack=0: {'Base': [(X, -a)], 'Mid': [(X, -crack)], 'Top': [(X, -crack)]}
    clip(arm, 'Break', [(0, R), (4, over(5)), (8, over(-6)), (14, over(30, 4)), (20, over(80, 8)), (24, over(74, 10)), (30, over(78, 9))])
    return arm, ['Idle', 'Pulse', 'Hit', 'Break']


BUILD = {'wolf': wolf, 'whelp': whelp, 'slime': slime, 'turret': turret, 'totem': totem}
