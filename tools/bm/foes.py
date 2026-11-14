"""Brings bm's monsters over for the new kinds of foe (src/data/enemies.js) and writes their manifest entries.

python tools/bm/foes.py            copies from ../bm (origin/main) what isn't here yet, then writes the entries
python tools/bm/foes.py --no-copy  only writes the entries

bm's Tripo monsters (assets/monsters/tripo/) come rigged with their clips in the file: a family's set from Lisandra's library,
cut and slowed for each body by bm's tools/monsters/roster.py (idle, walk, run, atk1..atk5, hit, death, roar, jump; the
knights' block and bash, the harpies' fly and land). A kind's first body is zombie_<kind>; the others are looks of the same
kind, zombie_<kind>_2, _3, which a pack hands out member by member (explore.js, foeKey). Their weapons are dropped by the
3D step, so the knight, the casters, the goblins and the golem are handed bm's own from assets/gear (data/gear.js, FOE_GEAR).

Left in bm: Velscour's knights and lancers, the possessed knights (his armour), the red plague knight (his colour, on a
knight), the goat men in gold (one each side's), the necromancer lords, the kobolds, dragons, demons, worms and the dead
children (no kind here wants them yet). Re-running replaces only the keys below.
"""
import io
import json
import os
import struct
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BM = os.path.join(os.path.dirname(ROOT), "bm")
MANIFEST = os.path.join(ROOT, "assets", "models", "manifest.json")
OUT = os.path.join(ROOT, "assets", "models", "foes")

# kind: (family, height of its first body in metres, [bm bodies]); a later body's height is scaled by bm's own heights
FOES = {
    "possessed": ("shambler", 1.75, ["possessed_man_1", "possessed_woman_1", "possessed_man_2"]),
    "spider": ("spider", 1.0, ["spider_black", "spider_red"]),
    "goblin": ("feral", 1.25, ["goblin_green_1", "goblin_red_1", "goblin_green_armored_1"]),
    "plague_knight": ("knight", 1.95, ["plague_knight_black"]),
    "harpy": ("flyer", 1.8, ["harpy_undead_1", "harpy_warrior"]),
    "necromancer": ("caster", 1.9, ["necromancer_2"]),     # necromancer_f1 wears a cross at her throat: left in bm
    "werewolf": ("wolf", 2.3, ["werewolf_brown"]),
    "plague_giant": ("brute", 3.0, ["plague_giant_1", "plague_giant_2"]),
    "bone_golem": ("brute", 3.4, ["bone_golem"]),
}

# the game's states (and the skills' own anims: pounce, sweep, slam) -> the file's clips
BASE = {"idle": "idle", "walk": "walk", "run": "run", "attack": "atk1", "cast": "roar", "hit": "hit", "dead": "death",
        "cheer": "roar", "jump": "jump", "pounce": "atk5", "sweep": "atk2", "slam": "atk2"}
FAMILY = {
    "shambler": {"attack": "atk2", "pounce": "atk3", "sweep": "atk1", "slam": "atk4"},          # a scratch, a dive
    "feral": {"attack": "atk1", "sweep": "atk2", "slam": "atk2"},                               # a slash, a pounce
    "wolf": {"idle": "idle3", "attack": "atk4", "sweep": "atk1", "slam": "atk2"},               # stands up; the scratch is its maul
    "knight": {"attack": "atk1", "pounce": "atk4", "sweep": "atk3", "slam": "bash", "guard": "block"},
    "flyer": {"attack": "atk2", "pounce": "atk1", "sweep": "atk3", "slam": "atk4"},             # the dive is the strike
    "caster": {"attack": "atk4", "cast": "atk1", "pounce": "atk3", "sweep": "atk5", "slam": "atk5", "cheer": "roar"},
    "brute": {"attack": "atk1", "pounce": "atk4", "sweep": "atk3", "slam": "atk2"},
    "spider": {"attack": "atk1", "pounce": "atk5", "sweep": "atk2", "slam": "atk3"},
}
# how fast each state plays: bm's clips are cut for a real-time fight, a turn here wants them brisk
SPEED = {"walk": 1.6, "run": 1.2, "attack": 1.5, "cast": 1.5, "hit": 1.6, "dead": 1.4, "pounce": 1.4, "sweep": 1.4, "slam": 1.4}
SLOW = {"brute": 1.25, "spider": 0.8}   # the giants are slowed in bm already; the spiders' clips are short


# Marks painted off a body's colour and normal maps as it's copied (the V and T rule: a cross is Tessariel's), in pixels of
# a 1024 map. disc: x, y, r, blurred to a plain stud; box: x0, y0, x1, y1, its fine lines smoothed away.
PAINT = {
    "plague_knight_black": [   # crosses in the four shoulder and belt roundels, a long one down the tabard, a small one behind,
        ("disc", 306, 55, 15), ("disc", 33, 77, 13), ("disc", 17, 155, 13), ("disc", 340, 209, 14),   # and a saltire
        ("box", 418, 398, 497, 522), ("box", 942, 452, 970, 496), ("box", 984, 480, 1006, 502),       # knotted on the chest
        ("box", 372, 300, 488, 362),
    ],
}


def paint(pic, marks):
    import numpy as np
    from scipy import ndimage
    a = np.asarray(pic.convert("RGB"), dtype=np.float32)
    k = a.shape[1] / 1024
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    out = a.copy()
    soft = np.stack([ndimage.gaussian_filter(a[..., c], 7 * k) for c in range(3)], -1)
    flat = np.stack([ndimage.gaussian_filter(ndimage.median_filter(a[..., c], size=max(3, int(11 * k))), 1.5 * k) for c in range(3)], -1)
    for m in marks:
        if m[0] == "disc":
            _, x, y, r = (v * k if i else v for i, v in enumerate(m))
            d = np.hypot(xx - x, yy - y)
            w = np.clip((r + 3 * k - d) / (3 * k), 0, 1)[..., None]
            src = soft
        else:
            _, x0, y0, x1, y1 = (v * k if i else v for i, v in enumerate(m))
            e = np.minimum.reduce([xx - x0, x1 - xx, yy - y0, y1 - yy])
            w = np.clip(e / (4 * k), 0, 1)[..., None]
            src = flat
        out = out * (1 - w) + src * w
    from PIL import Image
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def repaint(path, marks):
    """Paints marks off the colour and normal pictures inside a .glb, rewriting its binary chunk."""
    from PIL import Image
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bl = struct.unpack("<I", b[20 + jl:24 + jl])[0]
    blob = b[28 + jl:28 + jl + bl]
    m = j["materials"][0]
    new = {}
    for ref in (m["pbrMetallicRoughness"].get("baseColorTexture"), m.get("normalTexture")):
        if not ref:
            continue
        img = j["images"][j["textures"][ref["index"]]["source"]]
        bv = j["bufferViews"][img["bufferView"]]
        o = bv.get("byteOffset", 0)
        buf = io.BytesIO()
        paint(Image.open(io.BytesIO(blob[o:o + bv["byteLength"]])), marks).save(buf, "JPEG", quality=92)
        new[img["bufferView"]] = buf.getvalue()
        img["mimeType"] = "image/jpeg"
    out = bytearray()
    for i, bv in enumerate(j["bufferViews"]):
        o = bv.get("byteOffset", 0)
        data = new.get(i) or blob[o:o + bv["byteLength"]]
        out += b"\0" * (-len(out) % 4)
        bv["byteOffset"], bv["byteLength"] = len(out), len(data)
        out += data
    out += b"\0" * (-len(out) % 4)
    j["buffers"][0]["byteLength"] = len(out)
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(out)
    open(path, "wb").write(struct.pack("<III", 0x46546C67, 2, total) + struct.pack("<II", len(js), 0x4E4F534A) + js
                           + struct.pack("<II", len(out), 0x004E4942) + bytes(out))


def bm_show(path):
    return subprocess.run(["git", "-C", BM, "show", "origin/main:" + path], check=True, capture_output=True).stdout


def main():
    copy = "--no-copy" not in sys.argv
    roster = json.loads(bm_show("assets/monsters/tripo/roster.json")) if os.path.isdir(BM) else {}
    os.makedirs(OUT, exist_ok=True)
    raw = open(MANIFEST, "rb").read()
    nl = "\r\n" if b"\r\n" in raw else "\n"
    man = json.loads(raw.decode("utf-8"))
    keys = set()
    for kind, (fam, height, bodies) in FOES.items():
        anims = {**BASE, **FAMILY[fam]}
        have = set((roster.get(bodies[0]) or {}).get("clips") or {}) or None
        first = (roster.get(bodies[0]) or {}).get("height") or height
        for i, body in enumerate(bodies):
            dest = os.path.join(OUT, body + ".glb")
            if copy and not os.path.exists(dest):
                open(dest, "wb").write(bm_show(f"assets/monsters/tripo/{body}.glb"))
                if body in PAINT:
                    repaint(dest, PAINT[body])
            key = "zombie_" + kind + ("" if i == 0 else f"_{i + 1}")
            keys.add(key)
            mine = set((roster.get(body) or {}).get("clips") or {}) or have
            k = (roster.get(body) or {}).get("height", first) / first
            man[key] = {
                "file": f"foes/{body}.glb",
                "from": f"bm assets/monsters/tripo/{body}.glb",
                "height": round(height * k, 3),
                "inPlace": True,
                "lift": 0.12,
                "anims": {s: c for s, c in anims.items() if not mine or c in mine},
                "speed": {s: round(v * SLOW.get(fam, 1), 2) for s, v in SPEED.items()},
            }
    for key in [k for k, v in man.items() if str(v.get("from", "")).startswith("bm assets/monsters/") and k not in keys]:
        del man[key]
    open(MANIFEST, "w", encoding="utf-8", newline=nl).write(json.dumps(man, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(keys)} bm monsters in the manifest")


if __name__ == "__main__":
    main()
