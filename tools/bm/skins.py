"""Brings bm's player skins over as the looks armour and helms come in (src/data/skins.js, assets/skins/swatches.png).

python tools/bm/skins.py

bm's player wears a skin: a recipe (art/player/skins/<id>/recipe.json) of what each part of the harness is made of, head,
shoulders, chest, legs and feet, each in cloth, trim and leather, a material being a colour or a tiling swatch. Here a skin
is what a piece of armour or a helm looks like: gfx/dye.js paints each piece of a body (helm, chest, shoulders, arms, legs,
boots) in the skin's colours for that part, the cloth woven in its swatch and the gilding turned to its trim.

Kept per part: the cloth's colour (its swatch's mean, at its brightness), the trim's, and the cloth swatch itself, shrunk to
32 pixels and laid in one sheet. The rarity is the id's ending (common .. mythic; mythic counts as legendary here, and the
few with none as rare). Left in bm: the decals and the overlaid patterns (crests and badges, some of them not ours to wear).
"""
import io
import json
import os
import re
import subprocess

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BM = os.path.join(os.path.dirname(ROOT), "bm")
SHEET = os.path.join(ROOT, "assets", "skins", "swatches.png")
DATA = os.path.join(ROOT, "src", "data", "skins.js")
TILE, COLS = 32, 32
PARTS = ["head", "shoulders", "chest", "legs", "feet"]
RARITY = {"common": 0, "uncommon": 1, "rare": 2, "epic": 3, "legendary": 4, "mythic": 4}


def git(*a, text=False):
    return subprocess.run(["git", "-C", BM, *a], check=True, capture_output=True, text=text,
                          encoding="utf-8" if text else None).stdout


def lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64) / 255


def tohex(c):
    return "%02x%02x%02x" % tuple(int(round(v * 255)) for v in np.clip(c, 0, 1))


def main():
    names = git("ls-tree", "-r", "--name-only", "origin/main", "art/player/skins/", text=True).split()
    recipes = sorted(p for p in names if p.endswith("/recipe.json"))
    tiles, index, pics = [], {}, {}

    def swatch(base, rel):
        """A swatch's mean colour (linear) and its place in the sheet."""
        path = base + "/" + rel
        if path not in pics:
            img = Image.open(io.BytesIO(git("show", "origin/main:" + path))).convert("RGB")
            a = np.asarray(img, dtype=np.float64) / 255
            index[path] = len(tiles)
            tiles.append(img.resize((TILE, TILE), Image.LANCZOS))
            pics[path] = lin(a).reshape(-1, 3).mean(0)
        return pics[path], index[path]

    def material(base, m):
        """(hex colour at its brightness, sheet index or -1, metres a tile covers)."""
        if not m:
            return None
        bright = m.get("bright", 1.0)
        if "swatch" in m:
            mean, i = swatch(base, m["swatch"])
            if "color" in m:                               # a swatch tinted to a colour: the colour leads
                mean = lin(hexrgb(m["color"])) * 0.5 + mean * 0.5
            return tohex(srgb(mean * bright)), i, m.get("scale", 0.1)
        if "color" in m:
            return tohex(srgb(lin(hexrgb(m["color"])) * bright)), -1, 0.1
        return None

    skins = []
    for p in recipes:
        base = p.rsplit("/", 1)[0]
        r = json.loads(git("show", "origin/main:" + p, text=True))
        tail = r["id"].rsplit("_", 1)[-1]
        d = r.get("defaults", {})
        parts = {}
        for part in PARTS:
            q = r.get("parts", {}).get(part, {})
            cloth = material(base, q.get("cloth") or d.get("cloth")) or material(base, q.get("leather") or d.get("leather"))
            trim = material(base, q.get("trim") or d.get("trim"))
            if not cloth:
                continue
            parts[part] = [cloth[0], trim[0] if trim else None, cloth[1], round(cloth[2], 3)]
        if parts:
            name = re.sub(r" (Common|Uncommon|Rare|Epic|Legendary|Mythic) Gear$", "", r["name"])
            skins.append({"id": r["id"], "name": name, "rarity": RARITY.get(tail, 2), "parts": parts})

    rows = (len(tiles) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * TILE, rows * TILE))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % COLS) * TILE, (i // COLS) * TILE))
    os.makedirs(os.path.dirname(SHEET), exist_ok=True)
    sheet.save(SHEET, optimize=True)

    lines = [
        "// bm's player skins, as the looks armour and helms come in (tools/bm/skins.py writes this; don't edit by hand).",
        "// parts: {head|shoulders|chest|legs|feet: [cloth, trim, swatch, metres per tile]}: the colours as hex, the swatch a",
        "// tile of assets/skins/swatches.png (-1 for none). rarity: 0 Common .. 4 Legendary (data/items.js RARITY).",
        f"export const SWATCH = {{ file: 'assets/skins/swatches.png', tile: {TILE}, cols: {COLS}, count: {len(tiles)} }};",
        "export const SKINS = [",
    ]
    for s in skins:
        lines.append("  " + json.dumps(s, ensure_ascii=False, separators=(", ", ": ")) + ",")
    lines.append("];")
    open(DATA, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    by = [sum(1 for s in skins if s["rarity"] == k) for k in range(5)]
    print(f"{len(skins)} skins (by rarity {by}), {len(tiles)} swatches in {os.path.relpath(SHEET, ROOT)} "
          f"({os.path.getsize(SHEET) // 1024} KB)")


if __name__ == "__main__":
    main()
