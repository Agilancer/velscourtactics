"""Writes the manifest entries for the hero bodies brought over from bm (assets/models/heroes/), as armour tiers.

python tools/bm/heroes.py

A body is <class>_<g>_t<tier>, tier 1 (Rusted) to 5 (Mithril): the game shows the highest tier at or under the armour
worn, else the class's own model, else the lowest tier there is (explore.js, bodyKey). The Meshy models stay the look of
the first tiers; bm's take over from Steel. Every bm body shares one rig, so they all play bm's clip bank
(assets/models/clips/heroes.*, gfx/clipbank.js) under the bank's own clip names.

Left in bm: the paladin and lancer families (crosses on every chest and tabard, Tessariel's mark), dragoon_f3 and f4 (small crosses on
chest and tabard), boomerang_f1 (a star on the tabard, like the shields left behind in data/gear.js), the ninjas (no class), and the rest of the archers and
rogues. Re-running replaces only the keys below.
"""
import json
import os
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "assets", "models", "manifest.json")

# key: bm body (assets/models/heroes/<body>.glb)
BODIES = {
    "ranger_f_t3": "archer_f2", "ranger_f_t4": "archer_f4", "ranger_f_t5": "archer_f5",
    "bard_f_t3": "bard_f2", "bard_f_t4": "bard_f1", "bard_f_t5": "bard_f3",
    "bard_m_t3": "bard_m2", "bard_m_t4": "bard_m1", "bard_m_t5": "bard_m3",
    "boomerang_knight_f_t3": "boomerang_f2", "boomerang_knight_f_t5": "boomerang_f3",
    "boomerang_knight_m_t3": "boomerang_m1", "boomerang_knight_m_t4": "boomerang_m3", "boomerang_knight_m_t5": "boomerang_m2",
    "dragoon_f_t3": "dragoon_f2", "dragoon_f_t5": "dragoon_f1",
    "dragoon_m_t3": "dragoon_m2", "dragoon_m_t4": "dragoon_m4", "dragoon_m_t5": "dragoon_m1",
    "gunner_m_t1": "rogue_m1", "gunner_m_t3": "rogue_m2", "gunner_m_t5": "rogue_m4",
}

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
    "gunner": {"attack": "Spell_Simple_Shoot"},
}
# seconds of the long library clips worth keeping
TRIM = {"point": [0, 2.6], "call": [0, 2.6], "attack@bard": [0, 2.4], "strum": [0, 2.4], "ballad": [0, 3.2]}
SPEED = {"walk": 1.5, "run": 1.2, "jump": 1.6, "attack": 1.2, "cast": 0.8, "dead": 1.2, "revive": 1.4}
HEIGHT = {"m": 1.86, "f": 1.8}   # head height, as the Meshy classes stand


def head_room(path):
    """How much taller the file is than the person in it (crests, plumes, ears): its bounds over its own extras' height."""
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    prim = next(m["primitives"][0] for m in j["meshes"] if "JOINTS_0" in m["primitives"][0]["attributes"])
    acc = j["accessors"][prim["attributes"]["POSITION"]]
    tall = acc["max"][1] - acc["min"][1]
    return tall / j["scenes"][0].get("extras", {}).get("height", tall)


def main():
    raw = open(MANIFEST, "rb").read()
    nl = "\r\n" if b"\r\n" in raw else "\n"             # keep the file's own line endings
    man = json.loads(raw.decode("utf-8"))
    for key in [k for k, v in man.items() if v.get("bank") == "heroes" and k not in BODIES]:
        del man[key]                                     # a body taken out of the table leaves the manifest too
    for key, body in BODIES.items():
        cls, g = key.rsplit("_t", 1)[0].rsplit("_", 1)
        anims = {**COMMON, **CLASS.get(cls, {})}
        trim = {s: v for s, v in ((k.split("@")[0], v) for k, v in TRIM.items() if "@" not in k or k.endswith("@" + cls)) if s in anims}
        if cls != "bard":
            trim.pop("attack", None)
        path = os.path.join(ROOT, "assets", "models", "heroes", body + ".glb")
        man[key] = {
            "file": f"heroes/{body}.glb",
            "from": f"bm assets/game/heroes/{body}.glb",
            "height": round(HEIGHT[g] * head_room(path), 3),
            "bank": "heroes",
            "anims": anims,
            "speed": SPEED,
            "trim": trim,
        }
    out = json.dumps(man, indent=2, ensure_ascii=False) + "\n"
    open(MANIFEST, "w", encoding="utf-8", newline=nl).write(out)
    print(f"{len(BODIES)} bm bodies in the manifest")


if __name__ == "__main__":
    main()
