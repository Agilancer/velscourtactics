import json, copy
P = r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics\assets\models\manifest.json"
raw = open(P, encoding='utf-8', newline='').read()
m = json.loads(raw)
tail = raw[len(raw.rstrip('\r\n')):]
assert json.dumps(m, indent=2, ensure_ascii=False).replace('\n', '\r\n') + tail == raw, 'round trip'
# the eight recruits wear their class body's clips; heights put each head where the class bodies' are
# (a hat, a crest or a crow on top makes the whole figure taller than its head would say)
FROM = {'wren': ('ranger_f', 1.7), 'ismene': ('wizard_f', 1.74), 'mortimer': ('necromancer_m', 1.89), 'brakka': ('barbarian_f', 1.96),
        'kestrel': ('dragoon_m', 1.94), 'maudlin': ('carrion_witch_f', 1.51), 'jasper': ('bard_m', 1.92), 'flint': ('gunner_m', 1.86)}
for key, (src, h) in FROM.items():
    e = copy.deepcopy(m[src]); e['file'] = key + '.glb'; e['height'] = h; m[key] = e
# the ninja: the shared set (as every v2 class body has it), then its own five
base = copy.deepcopy(m['gunner_m'])
an = {k: v for k, v in base['anims'].items() if k not in ('attack', 'shoot', 'fan', 'lob', 'deploy')}
an.update({'attack': 'Slash', 'slash': 'Slash', 'cuts': 'Cuts', 'stars': 'Stars', 'smoke': 'Smoke', 'step': 'Step'})
sp = {k: v for k, v in base['speed'].items() if k != 'shoot'}; sp.update({'cuts': 1.3, 'step': 1.3})
for key, h in (('ninja_m', 1.82), ('ninja_f', 1.72)):
    m[key] = {'file': key + '.glb', 'height': h, 'inPlace': True, 'anims': dict(an), 'speed': dict(sp)}
# the bm tier-1 bodies that stood in front of the class bodies: gone, so the Meshy ones show at tiers 1 and 2
for key in ('ninja_m_t1', 'ninja_f_t1', 'gunner_m_t1'): del m[key]
open(P, 'w', encoding='utf-8', newline='').write(json.dumps(m, indent=2, ensure_ascii=False).replace('\n', '\r\n') + tail)
print(len(m), 'entries'); print(json.dumps(m['ninja_m']))
