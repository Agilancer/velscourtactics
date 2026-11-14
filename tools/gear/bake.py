"""Bakes bm's weapons for VELSCOUR TACTICS: grip to the origin, decimated, one 512 base-colour texture, and an icon.

blender -b --factory-startup -P tools/gear/bake.py -- SRC_DIR tools/gear/sources.txt assets/gear assets/gear/icons [ids...]
SRC_DIR: bm's sources, each as <id>.glb, taken from bm's origin/main with
    git -C ../bm show origin/main:assets/game/<bm folder>/<id>.glb > SRC_DIR/<id>.glb
sources.txt lines: "<id> <bm folder>" (weapons/<kind> sources have the butt at y=0; heroes/kit and items are already at the grip).
What each look is and how it is held is data/gear.js; what was left in bm and why is said there too.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, srcmap, out, icons = [os.path.abspath(a) for a in argv[:4]]
only = set(argv[4:])
os.makedirs(out, exist_ok=True)
os.makedirs(icons, exist_ok=True)
folders = dict(l.split() for l in open(srcmap) if l.strip())

# where the hand closes, in metres up from the butt, for sources that start at the butt
def grip_of(id_, folder, height):
    if not folder.startswith("weapons/"):
        return 0.0
    kind = folder.split("/")[1]
    if kind == "swords": return 0.10
    if kind == "axes": return 0.26 if "greataxe" in id_ else 0.09
    if kind == "maces": return 0.09
    if kind == "spears": return 0.85
    return 0.0  # bows are drawn about their middle already

TRIS = {"staff": 2600, "shield": 2400, "lute": 2600, "lance": 2600}
report = {}


def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for b in list(coll):
            if b.users == 0:
                coll.remove(b)


def setup_scene():
    sc = bpy.context.scene
    for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            sc.render.engine = eng
            break
        except TypeError:
            pass
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = 256
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.45, 0.43, 0.42, 1)
    bg.inputs[1].default_value = 1.0
    return sc


for id_, folder in folders.items():
    if only and id_ not in only:
        continue
    clear()
    sc = setup_scene()
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, id_ + ".glb"))
    meshes = [o for o in sc.objects if o.type == "MESH"]
    for o in sc.objects:
        o.select_set(o in meshes)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    # keep the mesh, lose any empties and parents, bake the transform in
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in list(sc.objects):
        if o is not ob:
            bpy.data.objects.remove(o, do_unlink=True)
    me = ob.data
    zs = [v.co.z for v in me.vertices]
    height = max(zs) - min(zs)
    g = grip_of(id_, folder, height)
    if g:
        for v in me.vertices:
            v.co.z -= g
    kind = "shield" if id_.startswith(("kite_", "tower_")) else "lute" if id_.startswith("lute_") else "lance" if id_.endswith("_lance") else "staff" if folder == "items" else "weapon"
    target = TRIS.get(kind, 2000)
    n0 = sum(len(p.vertices) - 2 for p in me.polygons)
    if n0 > target * 1.1:
        m = ob.modifiers.new("dec", "DECIMATE")
        m.decimate_type = "COLLAPSE"
        m.ratio = target / n0
        m.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=m.name)
    n1 = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    # one texture: base colour at 512, the rest unplugged (the game draws gear matte)
    for mat in ob.data.materials:
        if not mat or not mat.use_nodes:
            continue
        nt = mat.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf:
            continue
        for name in ("Metallic", "Roughness", "Normal", "Emission Color", "Alpha"):
            inp = bsdf.inputs.get(name)
            if inp:
                for l in list(inp.links):
                    nt.links.remove(l)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.85
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
        bc = bsdf.inputs["Base Color"]
        if bc.links:
            node = bc.links[0].from_node
            if node.type == "TEX_IMAGE" and node.image:
                img = node.image
                _ = img.pixels[0] if img.has_data or img.packed_file else None
                if max(img.size) > 512:
                    img.scale(512, 512)
                    img.pack()
    for n in list(bpy.data.images):
        if n.users == 0:
            bpy.data.images.remove(n)
    ob.name = id_
    for o in sc.objects:
        o.select_set(o is ob)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, id_ + ".glb"), export_format="GLB", use_selection=True,
                              export_image_format="JPEG", export_jpeg_quality=86, export_apply=True,
                              export_animations=False, export_skins=False, export_morph=False)
    # the icon: long things laid on the diagonal, viewed across their thinnest side
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(c.x for c in bb), min(c.y for c in bb), min(c.z for c in bb)))
    mx = Vector((max(c.x for c in bb), max(c.y for c in bb), max(c.z for c in bb)))
    size = mx - mn
    centre = (mn + mx) / 2
    for v in ob.data.vertices:
        v.co -= centre
    side_view = size.x < size.y * 0.8          # thin across x (a bow in profile): look along x
    long_ = size.z > 1.6 * max(size.x, size.y)
    ob.rotation_mode = "XYZ"
    if long_:
        if side_view:
            ob.rotation_euler = (math.radians(-45), 0, 0)
        else:
            ob.rotation_euler = (0, math.radians(45), 0)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.type = "ORTHO"
    bpy.context.view_layer.update()
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    span = max(max(c.x for c in bb) - min(c.x for c in bb), max(c.y for c in bb) - min(c.y for c in bb), max(c.z for c in bb) - min(c.z for c in bb))
    cam.data.ortho_scale = span * 1.08
    if side_view:
        cam.location = (4, 0, 0)
        cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    else:
        cam.location = (0, -4, 0)
        cam.rotation_euler = (math.radians(90), 0, 0)
    for rot, e in (((math.radians(50), math.radians(10), math.radians(-30)), 3.2), ((math.radians(70), 0, math.radians(150)), 1.2)):
        s = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        s.data.energy = e
        s.rotation_euler = rot
        sc.collection.objects.link(s)
    sc.render.filepath = os.path.join(icons, id_ + ".png")
    bpy.ops.render.render(write_still=True)
    report[id_] = {"kind": kind, "tris": [n0, n1], "grip": g, "size": [round(size.x, 3), round(size.z, 3), round(size.y, 3)]}
    print("BAKED", id_, n0, "->", n1, "grip", g)

json.dump(report, open(os.path.join(out, "_bake.json"), "w"), indent=1)
