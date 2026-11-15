"""Points each figure at its Mixamo bank (assets/models/clips/mx/<key>.json, written by tools/blender/moves.py) in
assets/models/manifest.json: "mx": "<key>". The game plays every take in the bank (its clips are named MX_<state>) as
that state, over whatever the figure had for it (gfx/models.js, clipsFor). A key whose bank is gone loses "mx" again.
bm's hero bodies need nothing here: any class may wear one, so the game picks hero_<class> as it dresses the hero.

python tools/mx_manifest.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "assets", "models", "manifest.json")
BANKS = os.path.join(ROOT, "assets", "models", "clips", "mx")


def main():
    with open(MANIFEST, encoding="utf-8") as f:
        man = json.load(f)
    banks = {os.path.splitext(n)[0] for n in os.listdir(BANKS) if n.endswith(".json")} if os.path.isdir(BANKS) else set()
    n = 0
    for key, d in man.items():
        anims = d.get("anims", {})
        for st in [s for s, c in anims.items() if c.startswith("MX_")]:     # what an older version of this put in
            del anims[st]
        if key in banks:
            d["mx"] = key
            n += 1
        else:
            d.pop("mx", None)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(man, f, indent=2, ensure_ascii=False)
        f.write("\n")
    heroes = sorted(b[len("hero_"):] for b in banks if b.startswith("hero_"))
    print(n, "figures with Mixamo takes; hero bodies for", ", ".join(heroes) or "no class")


if __name__ == "__main__":
    main()
