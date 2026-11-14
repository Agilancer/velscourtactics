"""Shrinks the pictures inside .glb files: each image wider than MAX is resized and re-encoded as JPEG (PNG if it has alpha
that is used). Optionally drops images no material uses. Geometry, skins and animations are copied byte for byte.

python tools/gear/shrink.py MAX in.glb out.glb [--drop TEXTURE_SLOTS]   e.g. --drop normal,mr,occlusion,emissive
"""
import io
import json
import struct
import sys

from PIL import Image

MAX = int(sys.argv[1])
src, dst = sys.argv[2], sys.argv[3]
drop = set(sys.argv[sys.argv.index("--drop") + 1].split(",")) if "--drop" in sys.argv else set()

b = open(src, "rb").read()
jl = struct.unpack("<I", b[12:16])[0]
j = json.loads(b[20:20 + jl])
o = 20 + jl
bl = struct.unpack("<I", b[o:o + 4])[0]
binc = b[o + 8:o + 8 + bl]

# texture slots to drop: unplug them from every material
SLOT = {"normal": ("normalTexture",), "mr": ("pbrMetallicRoughness", "metallicRoughnessTexture"), "occlusion": ("occlusionTexture",), "emissive": ("emissiveTexture",)}
for m in j.get("materials", []):
    for d in drop:
        path = SLOT[d]
        host = m
        for k in path[:-1]:
            host = host.get(k, {})
        host.pop(path[-1], None)
    pbr = m.get("pbrMetallicRoughness")
    if pbr and "mr" in drop:
        pbr["metallicFactor"] = 0
        pbr["roughnessFactor"] = 1
    for k in ("KHR_materials_specular",):
        m.get("extensions", {}).pop(k, None)

# which images are still used
used_tex = set()
for m in j.get("materials", []):
    def walk(x):
        if isinstance(x, dict):
            if "index" in x and len(x) <= 3 and ("texCoord" in x or "scale" in x or "strength" in x or len(x) == 1):
                used_tex.add(x["index"])
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(m)
used_img = {j["textures"][t]["source"] for t in used_tex if t < len(j.get("textures", []))}

views = j["bufferViews"]
img_view = {im["bufferView"]: i for i, im in enumerate(j.get("images", [])) if "bufferView" in im}
new_data = {}
for vi, ii in img_view.items():
    v = views[vi]
    data = binc[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
    if ii not in used_img:
        new_data[vi] = b"\xff\xd8\xff\xd9"  # unused: an empty jpeg stub keeps indices valid
        j["images"][ii]["mimeType"] = "image/jpeg"
        continue
    im = Image.open(io.BytesIO(data))
    if max(im.size) > MAX or im.format not in ("JPEG", "PNG"):
        s = MAX / max(im.size)
        if s < 1:
            im = im.resize((max(1, round(im.size[0] * s)), max(1, round(im.size[1] * s))), Image.LANCZOS)
        out = io.BytesIO()
        alpha = im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] < 250
        if alpha:
            im.save(out, "PNG", optimize=True)
            j["images"][ii]["mimeType"] = "image/png"
        else:
            im.convert("RGB").save(out, "JPEG", quality=85, optimize=True)
            j["images"][ii]["mimeType"] = "image/jpeg"
        data = out.getvalue()
    new_data[vi] = data

# rebuild the binary chunk, every view 4-aligned
out = bytearray()
for vi, v in enumerate(views):
    data = new_data.get(vi)
    if data is None:
        data = binc[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
    while len(out) % 4:
        out.append(0)
    v["byteOffset"] = len(out)
    v["byteLength"] = len(data)
    out += data
while len(out) % 4:
    out.append(0)
j["buffers"] = [{"byteLength": len(out)}]
js = json.dumps(j, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack("<II", len(js), 0x4E4F534A) + js + struct.pack("<II", len(out), 0x004E4942) + bytes(out)
open(dst, "wb").write(glb)
print(f"{src.split('/')[-1]}: {len(b) // 1024} KB -> {len(glb) // 1024} KB")
