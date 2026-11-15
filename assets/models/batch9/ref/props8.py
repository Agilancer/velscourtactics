# exec'd inside Blender: batch 8's scenery, with b6/props.py's place/split/decimate/shoot/export
B = r"C:\Users\agila\AppData\Local\Temp\claude\0a76bbbf4f7da614\91efad97-0d06-49ff-b6da-bbcbce3079e8\scratchpad"
exec(open(B + r"\b6\props.py").read())
SHOTS = B + r"\b8\shots\props"


def lid(key, at):
    """The sarcophagus in two: the faces above `at` (of its height) the lid, the rest the chest, as two materials on
    the one texture, so the crypt can leave the lid off one of them (or lay it aside)."""
    m = bpy.data.objects[key + '_p2']; me = m.data
    if len(m.material_slots) < 2:
        body = m.material_slots[0].material; top = body.copy()
        body.name = key + '_body'; top.name = key + '_lid'
        me.materials.clear(); me.materials.append(body); me.materials.append(top)
    hi = max(v.co.z for v in me.vertices); n = 0
    for p in me.polygons:
        up = p.center.z > at * hi; p.material_index = 1 if up else 0; n += up
    me.update(); print(key, 'lid faces', n, 'of', len(me.polygons))
