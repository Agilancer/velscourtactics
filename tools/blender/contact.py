import bpy, math, json, os
import numpy as np
D = bpy.app.driver_namespace; NS = D['NS']
FEET = ('LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase')


def contact(key, clips=None, n=12):
    """Per clip: the lowest foot joint's height over its own rest height, per sampled frame (cm), and the toes' largest
    bend from rest (degrees). A standing clip should sit at 0 throughout; a walk should come back to 0 every step."""
    arm = bpy.data.objects[key]
    NS['play'](key, None); R = NS['joints_world'](key); rest = {f: R[f].z for f in FEET}
    acts = [a.name.split(':', 1)[1] for a in bpy.data.actions if a.name.startswith(key + ':')]
    clips = clips or [c for c in acts if not c.startswith(('M_', 'own_'))]
    out = {}
    for c in clips:
        a = bpy.data.actions.get(key + ':' + c)
        if not a: continue
        f0, f1 = a.frame_range; lows = []; toe = 0.0
        for i in range(n):
            fr = f0 + (f1 - f0) * i / max(1, n - 1)
            NS['play'](key, c, fr); J = NS['joints_world'](key)
            lows.append(min(J[f].z - rest[f] for f in FEET) * 100)
            for s in ('Left', 'Right'):
                pb = arm.pose.bones.get('mixamorig:' + s + 'ToeBase')
                if pb: toe = max(toe, math.degrees(pb.matrix_basis.to_quaternion().angle))
        out[c] = {'min': round(min(lows), 1), 'max': round(max(lows), 1), 'mean': round(sum(lows) / len(lows), 1), 'toe': round(toe)}
    NS['play'](key, None)
    return out


NS['contact'] = contact
