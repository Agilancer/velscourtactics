"""Brings bm's 44 hero bodies over (assets/models/heroes/) and writes their manifest entries: each as a recruit of its own,
and the most of them again as armour tiers for the classes they belong to.

python tools/bm/heroes.py            copies from ../bm (origin/main) what isn't here yet, paints the marks off, writes the entries
python tools/bm/heroes.py --no-copy  only writes the entries

hero_<body>: the body a recruit walks in (data/cast.js `model`). Each recruit wears it in colours of their own (`palette` in
cast.js, gfx/dye.js), so one that is also an armour tier never looks like the hero in that armour.

<class>_<g>_t<tier>: a body as armour, tier 1 (Rusted) to 5 (Mithril): the game shows the highest tier at or under the
armour worn, else the class's own model, else the lowest tier there is (explore.js, bodyKey). The Meshy models stay the
look of the first tiers; bm's take over from Steel. Every bm body shares one rig, so they all play bm's clip bank
(assets/models/clips/heroes.*, gfx/clipbank.js) under the bank's own clip names. Each also records, vertex by vertex,
which piece of the harness it is (helm, chest, shoulders, arms, legs, boots, mail) and what it is made of: gfx/dye.js
paints each piece in the colours of what is worn there.

The marks (the V and T rule: a cross is Tessariel's): the paladins, the lancers, dragoon_f3 and f4 and boomerang_f1 came
with crosses on their chests, tabards, belts and pauldrons. PAINT lists them, each with a mask in tools/bm/marks, and
they are painted off the colour and normal maps every time the body is copied (erase; tools/bm/marks/README.md). Each body
also gets <body>.dye.png beside it, which texels are dyed cloth, bare metal and gilt (dye_mask). Re-running replaces only
the keys below.
"""
import json
import os
import struct
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from foes import swap_pictures  # noqa: E402  (the same picture rewriter as the plague knight's)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BM = os.path.join(os.path.dirname(ROOT), "bm")
MANIFEST = os.path.join(ROOT, "assets", "models", "manifest.json")
OUT = os.path.join(ROOT, "assets", "models", "heroes")

ALL = ([f"archer_f{i}" for i in range(1, 7)] + [f"bard_{g}{i}" for g in "fm" for i in range(1, 4)]
       + [f"boomerang_{g}{i}" for g in "fm" for i in range(1, 4)] + [f"dragoon_{g}{i}" for g in "fm" for i in range(1, 5)]
       + [f"lancer_f{i}" for i in range(1, 4)] + [f"lancer_m{i}" for i in range(1, 5)] + [f"ninja_m{i}" for i in range(1, 4)]
       + ["paladin_f1", "paladin_f2", "paladin_m1", "paladin_m2"] + [f"rogue_m{i}" for i in range(1, 5)])

# bm's classes as this game's
CLASS_OF = {"archer": "ranger", "bard": "bard", "boomerang": "boomerang_knight", "dragoon": "dragoon", "lancer": "lancer",
            "paladin": "paladin", "rogue": "gunner", "ninja": "ninja"}

# armour key: bm body. The female ninja has no body of her own in bm: she wears three of the archers' leathers, dyed for the
# night (DYE below), till one is made.
BODIES = {
    "ranger_f_t3": "archer_f2", "ranger_f_t4": "archer_f4", "ranger_f_t5": "archer_f5",
    "bard_f_t3": "bard_f2", "bard_f_t4": "bard_f1", "bard_f_t5": "bard_f3",
    "bard_m_t3": "bard_m2", "bard_m_t4": "bard_m1", "bard_m_t5": "bard_m3",
    "boomerang_knight_f_t3": "boomerang_f2", "boomerang_knight_f_t4": "boomerang_f1", "boomerang_knight_f_t5": "boomerang_f3",
    "boomerang_knight_m_t3": "boomerang_m1", "boomerang_knight_m_t4": "boomerang_m3", "boomerang_knight_m_t5": "boomerang_m2",
    "dragoon_f_t3": "dragoon_f2", "dragoon_f_t4": "dragoon_f3", "dragoon_f_t5": "dragoon_f1",
    "dragoon_m_t3": "dragoon_m2", "dragoon_m_t4": "dragoon_m4", "dragoon_m_t5": "dragoon_m1",
    "gunner_m_t1": "rogue_m1", "gunner_m_t3": "rogue_m2", "gunner_m_t4": "rogue_m3", "gunner_m_t5": "rogue_m4",
    "paladin_f_t3": "paladin_f1", "paladin_f_t5": "paladin_f2",
    "paladin_m_t3": "paladin_m1", "paladin_m_t5": "paladin_m2",
    "lancer_f_t3": "lancer_f1", "lancer_f_t4": "lancer_f2", "lancer_f_t5": "lancer_f3",
    "lancer_m_t3": "lancer_m1", "lancer_m_t4": "lancer_m2", "lancer_m_t5": "lancer_m4",
    "ninja_m_t1": "ninja_m1", "ninja_m_t3": "ninja_m2", "ninja_m_t5": "ninja_m3",
    "ninja_f_t1": "archer_f6", "ninja_f_t3": "archer_f1", "ninja_f_t5": "archer_f3",
}
# a palette (gfx/dye.js PALETTES) an armour key is always dyed in
DYE = {"ninja_f_t1": "night", "ninja_f_t3": "night", "ninja_f_t5": "night"}

# state -> the bank's clip; what a state has no clip for falls back in setAnim (models.js)
COMMON = {
    "idle": "Idle_Loop", "walk": "Walk_Loop", "run": "Jog_Fwd_Loop", "jump": "NinjaJump_Start",
    "attack": "Sword_Attack", "cast": "Spell_Simple_Shoot", "hit": "Hit_Chest", "dead": "Death01", "revive": "LayToIdle",
    "cheer": "LP_cheer", "guard": "Idle_Shield_Loop", "wounded": "LP_depressed", "stunned": "LP_frightened",
    "talk": "Idle_Talking_Loop", "item": "Consume", "taunt": "LP_swagger", "point": "LP_Pointing_at_an_enemy",
}
CLASS = {
    "ranger": {"attack": "Spell_Simple_Shoot", "shoot": "Spell_Simple_Shoot", "volley": "Spell_Simple_Shoot", "call": "LP_Pointing_into_the_distance"},
    "bard": {"attack": "LP_sing_01", "strum": "LP_sing_01", "ballad": "LP_sing_03"},
    "boomerang_knight": {"attack": "OverhandThrow", "throw": "OverhandThrow", "twin": "OverhandThrow", "whirl": "Sword_Attack", "typhoon": "OverhandThrow"},
    "dragoon": {"attack": "Sword_Dash", "thrust": "Sword_Dash", "leap": "NinjaJump_Start", "breath": "Spell_Simple_Shoot"},
    "gunner": {"attack": "Spell_Simple_Shoot", "shoot": "Spell_Simple_Shoot", "fan": "Spell_Simple_Shoot", "lob": "OverhandThrow", "deploy": "Fixing_Kneeling"},
    "paladin": {"attack": "Sword_Attack", "swing": "Sword_Attack", "smite": "Sword_Regular_C", "bolt": "Spell_Simple_Shoot",
                "bless": "LP_cast_a_spell", "wave": "LP_2_handed_fancy_spell_casting", "bash": "Shield_OneShot"},
    "lancer": {"attack": "Sword_Dash", "thrust": "Sword_Dash", "guard_up": "Shield_OneShot", "rally": "LP_Pointing_into_the_distance",
               "charge": "Shield_Dash", "bash": "Shield_OneShot", "guard": "Idle_Shield_Loop"},
    "ninja": {"attack": "L_Slash", "slash": "L_Slash", "stars": "OverhandThrow", "step": "LP_flip", "smoke": "LP_jump_down",
              "cuts": "Sword_Regular_Combo", "taunt": "LP_warm_up", "cheer": "LP_bow"},
}
# seconds of the long library clips worth keeping
TRIM = {"point": [0, 2.6], "call": [0, 2.6], "rally": [0, 2.6], "attack@bard": [0, 2.4], "strum": [0, 2.4], "ballad": [0, 3.2],
        "bless": [0, 2.6], "wave": [0, 3.0], "step": [0, 1.6], "smoke": [0, 1.6], "taunt": [0, 2.4], "cheer@ninja": [0, 2.4]}
SPEED = {"walk": 1.5, "run": 1.2, "jump": 1.6, "attack": 1.2, "cast": 0.8, "dead": 1.2, "revive": 1.4, "cuts": 1.3, "step": 1.3}
HEIGHT = {"m": 1.86, "f": 1.8}   # head height, as the Meshy classes stand

# Marks painted off as a body is copied. Each crossed body has a mask (tools/bm/marks/<body>.png, white over the texels of
# its crosses and a little round them, found by boxing each cross in the model viewer: tools/bm/marks/README.md). Inside it,
# the inlay (gold, unless the body says otherwise) is filled from the cloth or enamel round it, and the normal map
# flattened to match, so neither the colour nor the light shows where a cross was.
MARKS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "marks")
PAINT = {b: "gold" for b in ["paladin_m1", "paladin_m2", "paladin_f1", "paladin_f2", "lancer_m1", "lancer_m2", "lancer_m3",
                             "lancer_m4", "lancer_f1", "lancer_f2", "lancer_f3", "boomerang_f1"]}
PAINT.update({"dragoon_f3": "any", "dragoon_f4": "any"})   # their crosses are rose enamel and bone, not gold


def erase(pics, mask, ink="gold"):
    """The inlay inside the mask filled from what's round it, on the colour, normal and roughness maps alike."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    col = np.asarray(pics["color"], dtype=np.float32) / 255
    m = np.asarray(Image.open(mask).convert("L").resize(pics["color"].size, Image.NEAREST)) > 127
    m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=4)) | m   # the deep relief the viewer can't see into
    mx, mn = col.max(-1), col.min(-1)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = col[..., 0], col[..., 1], col[..., 2]
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    # whatever stands out from the field round it, lighter, darker (the relief's outline) or another colour; and gold,
    # which on the big crosses is wider than the field's window
    med = np.stack([ndimage.median_filter(col[..., c], size=21) for c in range(3)], -1)
    inlay = np.abs(col - med).max(-1) > (0.09 if ink == "any" else 0.12)
    if ink == "gold":
        inlay |= (h > 16) & (h < 64) & (s > 0.2) & (mx > 0.24)
    inlay |= mx < 0.03                      # a cross cut deep reads black
    if "rough" in pics:                     # and a cross the colour lost can still be there in the sheen
        ro = np.asarray(pics["rough"].resize(pics["color"].size), dtype=np.float32) / 255
        rmed = np.stack([ndimage.median_filter(ro[..., c], size=21) for c in range(3)], -1)
        inlay |= np.abs(ro - rmed).max(-1) > 0.1
    inlay &= m
    inlay = ndimage.binary_dilation(inlay, iterations=3) & m   # its shading with it
    gone = inlay | (mx < 0.03)              # nothing is filled from the atlas's black between islands
    _, (iy, ix) = ndimage.distance_transform_edt(gone, return_indices=True)
    out = {}
    for role, pic in pics.items():
        a = np.asarray(pic.resize(pics["color"].size), dtype=np.float32)
        fill = a[iy, ix]
        soft = np.stack([ndimage.gaussian_filter(fill[..., c], 2.5) for c in range(3)], -1)
        a[inlay] = soft[inlay]
        out[role] = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize(pic.size)
    return out


def colour_map(path):
    """A .glb's colour picture."""
    import io
    from PIL import Image
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    blob = b[28 + jl:]
    ref = j["materials"][0]["pbrMetallicRoughness"]["baseColorTexture"]
    bv = j["bufferViews"][j["images"][j["textures"][ref["index"]]["source"]]["bufferView"]]
    o = bv.get("byteOffset", 0)
    return Image.open(io.BytesIO(blob[o:o + bv["byteLength"]])).convert("RGB")


def dye_mask(path, out, size=512):
    """What of a body's colour map takes a dye (gfx/dye.js), as a picture the size of a 512 map: red where it is dyed cloth
    or enamel, green where it is bare steel, ivory or undyed cloth, blue where it is gilt. Skin, leather and hair are none
    of them, and stay as they are. bm's own rule (tools/heroes/build.py, recolour): strong colour outside the warm band of
    leather and gold is dyed, and a doubtful texel goes with what's round it."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    a = np.asarray(colour_map(path), dtype=np.float32) / 255
    mx, mn = a.max(-1), a.min(-1)
    v, d = mx, np.maximum(mx - mn, 1e-6)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    h = np.where(mx - mn < 1e-5, 0, h)
    hr = (h + 180) % 360 - 180
    warm = (h > 12) & (h < 55)
    dyed = (s > 0.28) & (v > 0.12) & ~warm
    inside = v > 0.04
    rad = max(2.0, a.shape[1] / 170)
    near = ndimage.gaussian_filter((dyed & inside).astype(np.float32), rad) / np.maximum(ndimage.gaussian_filter(inside.astype(np.float32), rad), 1e-3)
    maybe = ~dyed & inside & (((hr > 12) & (hr < 30) & (s > 0.2) & (v > 0.06)) | (~warm & (s > 0.15) & (v > 0.05)))
    doubt = dyed & (((hr > -8) & (hr <= 12) & (s < 0.5)) | (s < 0.36) | (v < 0.16) | (warm & (v < 0.45)))
    dyed = (dyed | (maybe & (near > 0.6))) & ~(doubt & (near < 0.25))
    plain = ~dyed & (s < 0.2) & (v > 0.15)
    gilt = ~dyed & warm & (s > 0.4) & (v > 0.3)
    m = np.stack([dyed, plain, gilt], -1).astype(np.float32) * 255
    Image.fromarray(m.astype(np.uint8)).resize((size, size), Image.BOX).save(out, optimize=True)


def head_room(path):
    """How much taller the file is than the person in it (crests, plumes, ears): its bounds over its own extras' height."""
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    prim = next(m["primitives"][0] for m in j["meshes"] if "JOINTS_0" in m["primitives"][0]["attributes"])
    acc = j["accessors"][prim["attributes"]["POSITION"]]
    tall = acc["max"][1] - acc["min"][1]
    return tall / j["scenes"][0].get("extras", {}).get("height", tall)


def bm_show(path):
    return subprocess.run(["git", "-C", BM, "show", "origin/main:" + path], check=True, capture_output=True).stdout


def entry(body, cls, g):
    anims = {**COMMON, **CLASS.get(cls, {})}
    trim = {}
    for k, v in TRIM.items():
        state, _, only = k.partition("@")
        if state in anims and (not only or only == cls):
            trim[state] = v
    if cls != "bard" and "attack" in trim and not any(k == "attack@" + cls for k in TRIM):
        trim.pop("attack")
    path = os.path.join(OUT, body + ".glb")
    return {
        "file": f"heroes/{body}.glb",
        "from": f"bm assets/game/heroes/{body}.glb",
        "height": round(HEIGHT[g] * head_room(path), 3),
        "bank": "heroes",
        "anims": anims,
        "speed": SPEED,
        "trim": trim,
    }


def main():
    copy = "--no-copy" not in sys.argv
    os.makedirs(OUT, exist_ok=True)
    if copy:
        for body in ALL:
            dest = os.path.join(OUT, body + ".glb")
            mask = os.path.join(MARKS, body + ".png")
            marked = body in PAINT and os.path.exists(mask)
            if marked or not os.path.exists(dest):
                open(dest, "wb").write(bm_show(f"assets/game/heroes/{body}.glb"))
                if marked:
                    swap_pictures(dest, lambda pics: erase(pics, mask, PAINT[body]))
            elif body in PAINT:
                print(f"{body}: no mask yet in tools/bm/marks: copied with its marks on")
            dye = os.path.join(OUT, body + ".dye.png")
            if marked or not os.path.exists(dye):
                dye_mask(dest, dye)
    raw = open(MANIFEST, "rb").read()
    nl = "\r\n" if b"\r\n" in raw else "\n"             # keep the file's own line endings
    man = json.loads(raw.decode("utf-8"))
    keys = set(BODIES) | {"hero_" + b for b in ALL}
    for key in [k for k, v in man.items() if v.get("bank") == "heroes" and k not in keys]:
        del man[key]                                     # a body taken out of the tables leaves the manifest too
    for key, body in BODIES.items():
        cls, g = key.rsplit("_t", 1)[0].rsplit("_", 1)
        man[key] = entry(body, cls, g)
        if key in DYE:
            man[key]["dye"] = DYE[key]
    for body in ALL:
        fam, g = body.split("_")[0], body.split("_")[1][0]
        man["hero_" + body] = entry(body, CLASS_OF[fam], g)
    out = json.dumps(man, indent=2, ensure_ascii=False) + "\n"
    open(MANIFEST, "w", encoding="utf-8", newline=nl).write(out)
    print(f"{len(ALL)} bm bodies: {len(BODIES)} armour tiers, {len(ALL)} recruits")


if __name__ == "__main__":
    main()
