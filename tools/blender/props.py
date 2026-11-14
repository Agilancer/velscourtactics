# The scenery pieces: each Meshy mesh (<key>_p2) turned to face -Y (the game's south, +Z), set on the ground at the
# origin, sized in tiles (a tile is a metre), and exported to assets/props/<key>.glb. exec'd inside Blender.
import bpy, os, math
import numpy as np
from mathutils import Vector, Matrix

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(
    globals().get('__file__', r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics\tools\blender\props.py")))))
SHOTS = os.path.join(REPO, 'tools', 'build', 'shots', 'props')
sc = bpy.context.scene


def verts(m):
    return np.array([v.co[:] for v in m.data.vertices])


def place(key, turn=0, height=None, fit=None, length=None, stretch=(1, 1, 1)):
    """Turned (degrees about up), then sized: to a height, to fit a footprint (x, y) keeping its proportions, or to a
    length along x; its foot at the origin, the middle of its base under it."""
    m = bpy.data.objects[key + '_p2']; me = m.data
    m.location = (0, 0, 0); m.matrix_world = Matrix.Identity(4)
    if not m.get('turned') and turn:
        me.transform(Matrix.Rotation(math.radians(turn), 4, 'Z')); m['turned'] = turn
    co = verts(m); lo, hi = co.min(0), co.max(0); size = hi - lo
    s = height / size[2] if height else min(fit[0] / size[0], fit[1] / size[1]) if fit else length / size[0] if length else 1
    me.transform(Matrix.Scale(s, 4) @ Matrix.Translation(Vector((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))))
    me.transform(Matrix.Diagonal((*stretch, 1)))                           # a prop may be drawn out a little (a fence taller)
    me.update()
    co = verts(m); print(key, 'size', (co.max(0) - co.min(0)).round(3), 'tris', sum(len(p.vertices) - 2 for p in me.polygons))
    return m


def split(key, at):
    """A tree in two: the faces below `at` (of its height) the trunk, the rest the crown, as two materials on the one
    texture, so a fight can take the crown away and leave the stump."""
    m = bpy.data.objects[key + '_p2']; me = m.data
    if len(m.material_slots) < 2:
        crown = m.material_slots[0].material; trunk = crown.copy()
        trunk.name = key + '_trunk'; crown.name = key + '_crown'
        me.materials.clear(); me.materials.append(trunk); me.materials.append(crown)
    top = max(v.co.z for v in me.vertices); n = 0
    for p in me.polygons:
        up = p.center.z > at * top; p.material_index = 1 if up else 0; n += up
    me.update(); print(key, 'crown faces', n, 'of', len(me.polygons))


def shoot(key, views=(('front', (0, -1, 0.15)), ('three_quarter', (0.75, -1, 0.55)), ('side', (1, 0, 0.15)), ('top', (0, -0.01, 1))), px=360):
    m = bpy.data.objects[key + '_p2']; os.makedirs(SHOTS, exist_ok=True)
    cam = bpy.data.objects['ShotCam']; sc.camera = cam
    was = [(o, o.hide_render) for o in bpy.data.objects if o.type in ('MESH', 'ARMATURE')]
    for o, _ in was: o.hide_render = o is not m
    sc.render.engine = 'BLENDER_WORKBENCH'; sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_specular_highlight = False
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.4
    sc.render.film_transparent = True; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.file_format = 'PNG'
    sc.render.resolution_x = sc.render.resolution_y = px; sc.render.resolution_percentage = 100
    co = verts(m); c = (co.max(0) + co.min(0)) / 2; r = np.linalg.norm(co.max(0) - co.min(0))
    out = []
    for side, v in views:
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = r * 1.05; d = Vector(v).normalized()
        cam.location = Vector(c) + d * (r * 4); cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        p = os.path.join(SHOTS, '%s_%s.png' % (key, side)); sc.render.filepath = p; bpy.ops.render.render(write_still=True); out.append(p)
    for o, v in was: o.hide_render = v
    return out


def export(key, tex=1024):
    m = bpy.data.objects[key + '_p2']
    for slot in m.material_slots:
        for nd in slot.material.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image and nd.image.size[0] > tex: nd.image.scale(tex, tex)
    for p in m.data.polygons: p.use_smooth = True
    bpy.ops.object.select_all(action='DESELECT'); m.select_set(True); bpy.context.view_layer.objects.active = m
    path = os.path.join(REPO, 'assets', 'props', key + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_animations=False,
                              export_image_format='JPEG', export_jpeg_quality=88, export_yup=True)
    print(key, 'exported', round(os.path.getsize(path) / 1e6, 2), 'MB')


def decimate(key, ratio):
    m = bpy.data.objects[key + '_p2']
    if m.get('decimated'): return
    bpy.ops.object.select_all(action='DESELECT'); m.select_set(True); bpy.context.view_layer.objects.active = m
    md = m.modifiers.new('dec', 'DECIMATE'); md.ratio = ratio; md.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=md.name); m['decimated'] = ratio
    print(key, 'decimated to', sum(len(p.vertices) - 2 for p in m.data.polygons), 'tris')
