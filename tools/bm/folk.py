"""Writes the manifest entries for the townsfolk brought over from bm (assets/models/folk/), as folk_<id> for the people of
FOLK in src/data/cast.js who aren't heroes.

python tools/bm/folk.py

bm keeps its townsfolk bare: a .glb with no material, and its pictures beside it (<body>_n.webp, and <person>_c.webp, a
recolour of a body: bm's folk.json "swaps"). The entry's "skin" dresses it (gfx/clipbank.js, dress). Their clips are bm's
folk bank (assets/models/clips/folk.*), made on one girl's rig and carried over to each body by its rest pose.

The people bm's town shares with this one wear what bm gave them: Jory, Hob, Kit, Tamsin, Orrin and Garrick. Left in bm:
the lords, ladies, dames, youths and knight in red or blue (Velscour's red, Tessariel's blue and gold), and every body no one
here needs yet. Re-running replaces only the keys below.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "assets", "models", "manifest.json")

# person: (body, colour picture, height in metres, as bm measured the body)
FOLK = {
    "garrick": ("wes", "garrick", 1.81),      # bm's Hew Garrick: the tanner's body in cold blue-grey
    "orrin": ("sage", "sage", 1.70),          # bm's Orrin Vey
    "zafir": ("elder", "elder", 1.76),
    "fortunato": ("worker", "osric", 1.83),   # the hunter's body in hedge green
    "tamsin": ("redhead", "redhead", 1.57),   # bm's Tamsin Reed
    "aggie": ("wife_jolly", "dorcas", 1.60),  # an innkeeper's body in slate blue, her hair gone grey
    "kit": ("boy_1", "kit", 1.32),            # bm's Kit Kettle
    "jory": ("worker_2", "jory", 1.77),       # bm's Jory Pell
    "hob": ("dude", "dude", 1.79),            # bm's Hob Fenwick
    "agnes": ("crone", "crone", 1.55),
}

ANIMS = {
    "idle": "idle", "walk": "walk", "run": "jog", "jump": "jump", "talk": "talk", "point": "point", "cheer": "cheer",
    "hit": "hit", "dead": "fall", "revive": "get_up", "wounded": "depressed", "stunned": "scared", "guard": "fold_arms",
    "item": "eat", "taunt": "swagger", "attack": "throw",
}
TRIM = {"point": [0, 2.6], "cheer": [0, 3.5], "attack": [0, 2.2]}


def main():
    raw = open(MANIFEST, "rb").read()
    nl = "\r\n" if b"\r\n" in raw else "\n"
    man = json.loads(raw.decode("utf-8"))
    for key in [k for k, v in man.items() if v.get("bank") == "folk" and k[5:] not in FOLK]:
        del man[key]
    for person, (body, colour, height) in FOLK.items():
        man["folk_" + person] = {
            "file": f"folk/{body}.glb",
            "from": f"bm assets/game/folk/{body}.glb, {colour}_c.webp",
            "height": height,
            "bank": "folk",
            "skin": {"map": f"folk/{colour}_c.webp", "normal": f"folk/{body}_n.webp"},
            "anims": ANIMS,
            "trim": TRIM,
        }
    open(MANIFEST, "w", encoding="utf-8", newline=nl).write(json.dumps(man, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(FOLK)} townsfolk in the manifest")


if __name__ == "__main__":
    main()
