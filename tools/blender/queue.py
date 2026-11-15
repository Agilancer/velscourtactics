"""The rig refit, figure after figure, on a Blender timer (an MCP call times out at about a minute; one figure takes ~40 s).

In Blender, with the working file open (docs/RIG_CLOTH_HANDOFF.md says which):
    D = bpy.app.driver_namespace; NS = D.setdefault('NS', {}); NS['ROOT'] = r'<this repo>' + os.sep
    exec(open(NS['ROOT'] + 'tools/blender/queue.py', encoding='utf-8').read(), NS)
    NS['q3_start'](['maudlin_v2', ...], 'r3', 'refit3')       # shots to tools/build/rig/r3, notes to tools/build/rig/refit3
D['Q3'] is what is left, D['Q3DONE'] what is done, D['Q3ERR'] the tracebacks. retarget.py, rigfix.py, mixamo.py (when it
is there: bm's walk and the floor fix of the Mixamo takes need it) and bmclips.py are run into NS first.
"""
import bpy, os, json, time, traceback
D = bpy.app.driver_namespace; NS = D.setdefault('NS', {})
ROOT = NS.get('ROOT') or (r"C:\Users\agila\.codex\.chatgpt-projects\g-p-6acb04ed5a908191836d71a249b8135a\work\velscourtactics" + os.sep)
for f in ('retarget.py', 'rigfix.py', 'mixamo.py', 'bmclips.py'):
    if os.path.exists(ROOT + 'tools/blender/' + f):
        exec(open(ROOT + 'tools/blender/' + f, encoding='utf-8').read(), NS)


def q3_start(keys, batch, notes_batch, shoot=True):
    D['Q3'] = list(keys); D['Q3ERR'] = {}; D['Q3DONE'] = []; D['Q3B'] = (batch, notes_batch, shoot)
    if 'bm_load' in NS and 'MX:bm:Walk_Loop' not in bpy.data.objects: print(NS['bm_load'](ROOT))
    bpy.app.timers.register(q3_tick, first_interval=1.0)


def q3_tick():
    q = D['Q3']
    if not q: print('Q3 done'); return None
    batch, nb, shoot = D['Q3B']; k = q.pop(0); t0 = time.time()
    folder = os.path.join(NS['RIGOUT'], nb); os.makedirs(folder, exist_ok=True); path = os.path.join(folder, 'notes.json')
    alln = json.load(open(path)) if os.path.exists(path) else {}
    try:
        T, P, notes, moved = NS['refit'](k, NS['OVER'].get(k))
        if shoot: NS['review']([k], batch)
        alln[k] = {'notes': notes, 'moved_cm': {n: round(v * 100, 1) for n, v in moved.items()}, 'secs': round(time.time() - t0, 1)}
    except Exception:
        D['Q3ERR'][k] = traceback.format_exc(); alln[k] = {'error': D['Q3ERR'][k][-600:]}
    with open(path, 'w') as f: json.dump(alln, f, indent=1)
    D['Q3DONE'].append(k)
    return 0.3


NS['q3_start'] = q3_start; NS['q3_tick'] = q3_tick
