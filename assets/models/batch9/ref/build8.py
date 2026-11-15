# exec'd inside Blender with KEYS (a list) set: imports, eases the cloth, builds the clips, exports, renders a check
import time
REPO = r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics"
MESHY = r"F:\!   VELSCOUR TACTICS\CHARACTERS\meshy"
OUT = r"C:\Users\agila\AppData\Local\Temp\claude\0a76bbbf4f7da614\91efad97-0d06-49ff-b6da-bbcbce3079e8\scratchpad\b8\shots"
exec(open(REPO + r"\tools\blender\retarget.py").read())
CLS = {'ninja_m': 'ninja', 'ninja_f': 'ninja', 'wren': 'ranger', 'ismene': 'wizard', 'mortimer': 'necromancer', 'brakka': 'barbarian',
       'kestrel': 'dragoon', 'maudlin': 'carrion_witch', 'jasper': 'bard', 'flint': 'gunner'}
OWN = {'ninja': ['Slash', 'Cuts', 'Stars', 'Smoke', 'Step'], 'ranger': ['Shoot', 'Volley', 'Call'], 'wizard': ['Bolt', 'Wave', 'Meteor'],
       'necromancer': ['Bolt', 'Raise', 'Curse'], 'barbarian': ['Swing', 'Bash', 'Leap', 'Whirl', 'Slam'], 'dragoon': ['Thrust', 'Leap', 'Breath'],
       'carrion_witch': ['Bolt', 'Wave', 'Hex'], 'bard': ['Strum', 'Ballad', 'Bless'], 'gunner': ['Shoot', 'Fan', 'Lob', 'Deploy']}
LIGHT = globals().get('LIGHT', {})
t0 = time.time()
for key in KEYS:
    cls = CLS[key]
    T = Target.attach(key + '_v2') if key + '_v2' in bpy.data.objects else Target(key + '_v2', MESHY + '\\' + key + '_v2_walk.glb')
    m = T.mesh.data
    if not m.get('cloth') and globals().get('CLOTH', True): T.cloth(); m['cloth'] = 1
    if key in LIGHT: T.lighten(LIGHT[key])
    T.build(cls)
    bl = T.arm.data.bones; s = T.arm.matrix_world.to_scale()[0]
    head = (bl['mixamorig:Head'].head_local - bl['mixamorig:LeftFoot'].head_local).dot(T.U) * s
    top = max((T.mesh.matrix_world @ v.co).z for v in m.vertices) - min((T.mesh.matrix_world @ v.co).z for v in m.vertices)
    print(key, 'head at', round(head, 3), 'm; whole', round(top, 3), 'm; tris', sum(len(p.vertices) - 2 for p in m.polygons))
    if globals().get('EXPORT', True): T.export(REPO + '\\assets\\models\\' + key + '.glb')
    if globals().get('SHOOT', True):
        d = OUT + '\\' + key
        T.turn(d); T.tiles(globals().get('TILES', ['Idle', 'Walk', 'Hit', 'Dead_Fall']) + OWN[cls], d)
    print(key, 'done', round(time.time() - t0, 1), 's')
