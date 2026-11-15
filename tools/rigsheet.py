"""Draws the skeleton over the pictures tools/blender/rigfix.py renders, as sheets to judge a rig by.

python tools/rigsheet.py <batch>                 one sheet per figure: its views side by side, the body see-through, the
                                                 joints and bones on top (centre yellow, left cyan, right orange), a line
                                                 every 5% of the height
python tools/rigsheet.py <batch> --motion        one sheet per figure and clip: a row per view, a column per frame
python tools/rigsheet.py <batch> --plain         the same without the skeleton (to judge the look alone)
python tools/rigsheet.py <batch> --cards         one review card per figure from rigfix.review(): <batch>/rest and <batch>/motion
python tools/rigsheet.py <batch> --detail        close-ups of a high-resolution rest shot (shoot_rig(..., w=880, h=1440)):
                                                 shoulders and arms, hips and knees, the feet, front and side
Sheets land in tools/build/rig/<batch>/sheets/.
"""
import glob, json, os, re, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build', 'rig')
PARENT = {'Spine': 'Hips', 'Spine1': 'Spine', 'Spine2': 'Spine1', 'Neck': 'Spine2', 'Head': 'Neck', 'HeadTop_End': 'Head'}
for s in ('Left', 'Right'):
    PARENT.update({s + 'Shoulder': 'Spine2', s + 'Arm': s + 'Shoulder', s + 'ForeArm': s + 'Arm', s + 'Hand': s + 'ForeArm',
                   s + 'UpLeg': 'Hips', s + 'Leg': s + 'UpLeg', s + 'Foot': s + 'Leg', s + 'ToeBase': s + 'Foot'})
SHORT = {'Hips': 'hips', 'Spine': 'sp', 'Spine1': 'sp1', 'Spine2': 'sp2', 'Neck': 'neck', 'Head': 'head', 'HeadTop_End': 'top',
         'Shoulder': 'clav', 'Arm': 'shldr', 'ForeArm': 'elbow', 'Hand': 'wrist', 'UpLeg': 'hip', 'Leg': 'knee', 'Foot': 'ankle', 'ToeBase': 'ball'}
BG = (58, 60, 66)


def font(n):
    for f in ('arial.ttf', 'DejaVuSans.ttf'):
        try: return ImageFont.truetype(f, n)
        except OSError: pass
    return ImageFont.load_default()


def colour(name):
    return (60, 215, 255) if name.startswith('Left') else (255, 130, 50) if name.startswith('Right') else (255, 225, 60)


def label(name):
    for k in sorted(SHORT, key=len, reverse=True):
        if name.endswith(k):
            side = 'L ' if name.startswith('Left') else 'R ' if name.startswith('Right') else ''
            return side + SHORT[k] if name.replace('Left', '').replace('Right', '') == k else SHORT.get(name, name)
    return name


def panel(view, skeleton=True, alpha=0.62, labels=True, grid=True):
    body = Image.open(view['png']).convert('RGBA'); w, h = body.size
    out = Image.new('RGBA', (w, h), BG + (255,)); d = ImageDraw.Draw(out)
    fy, ty = view['marks']['floor'][1], view['marks']['top'][1]
    if grid and ty < fy:
        f = font(11)
        for i in range(0, 21):
            y = fy - (fy - ty) * i / 20
            d.line([(0, y), (w, y)], fill=(90, 92, 100) if i % 2 else (115, 118, 128), width=1)
            if i % 2 == 0: d.text((3, y - 12), f'{i * 5}%', fill=(170, 172, 180), font=f)
        d.line([(0, fy), (w, fy)], fill=(200, 200, 210), width=2)
    if skeleton:
        a = body.split()[3].point(lambda v: int(v * alpha)); body.putalpha(a)
    out.alpha_composite(body)
    if skeleton and 'proposed' in view:
        d = ImageDraw.Draw(out); J = view['joints']
        for n, p in J.items():
            if n in PARENT and PARENT[n] in J:
                q = J[PARENT[n]]; d.line([(q[0], q[1]), (p[0], p[1])], fill=(150, 150, 150), width=1)
        for n, p in J.items():
            if n in PARENT: d.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], outline=(170, 170, 170))
        view = dict(view, joints=view['proposed'])
    if skeleton:
        d = ImageDraw.Draw(out); J = view['joints']; f = font(11)
        for n, p in J.items():
            if n in PARENT and PARENT[n] in J:
                q = J[PARENT[n]]; d.line([(q[0], q[1]), (p[0], p[1])], fill=(0, 0, 0), width=4); d.line([(q[0], q[1]), (p[0], p[1])], fill=colour(n), width=2)
        for n, p in J.items():
            if n not in PARENT and n != 'Hips': continue
            r = 4; d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=colour(n), outline=(0, 0, 0))
        if labels:
            for n, p in J.items():
                if n.endswith(('Leg', 'Foot', 'ToeBase', 'ForeArm', 'Hand', 'Arm')) or n in ('Hips', 'Neck', 'Head'):
                    t = label(n); x = p[0] + 6 if not n.startswith('Right') else p[0] - 7 - d.textlength(t, font=f)
                    d.text((x + 1, p[1] - 6), t, fill=(0, 0, 0), font=f); d.text((x, p[1] - 7), t, fill=colour(n), font=f)
    return out


def sheet(meta, title, skeleton=True):
    views = list(meta['views'].values()); ims = [panel(v, skeleton) for v in views]
    w = sum(i.size[0] for i in ims) + 8 * (len(ims) - 1); h = max(i.size[1] for i in ims) + 30
    s = Image.new('RGB', (w, h), (24, 22, 26)); d = ImageDraw.Draw(s); x = 0
    d.text((8, 6), title, fill=(255, 226, 160), font=font(16))
    for name, im in zip(meta['views'], ims):
        s.paste(im.convert('RGB'), (x, 30)); d.text((x + 6, 34), name, fill=(240, 240, 240), font=font(13)); x += im.size[0] + 8
    return s


def strip(metas, view, n=6):
    """One row of frames of a clip from one view, cropped to the figure."""
    fr = sorted(metas, key=lambda m: m[0]); ims = [panel(m[1]['views'][view], True, alpha=0.6, labels=False, grid=False) for m in fr]
    return ims


def cards(batch):
    """Two sheets per figure: <key>_rig.png (the rest rig, whole and in close-up) and <key>_motion.png (walk, run, blow)."""
    base = os.path.join(ROOT, batch); outd = os.path.join(base, 'cards'); os.makedirs(outd, exist_ok=True)
    rest = {os.path.basename(p)[:-5]: json.load(open(p)) for p in glob.glob(os.path.join(base, 'rest', '*.json'))}
    mot = {}
    for p in glob.glob(os.path.join(base, 'motion', '*.json')):
        k, c, i = os.path.basename(p)[:-5].split('__'); mot.setdefault(k, {}).setdefault(c, []).append((int(i), json.load(open(p))))
    f15, f13 = font(18), font(15); BGc = (24, 22, 26); W = 1400
    only = [a for a in sys.argv[3:] if not a.startswith('--')]
    for k, m in sorted(rest.items()):
        if only and k not in only: continue
        vs = m['views']
        full = [panel(vs[v], True, alpha=0.55) for v in ('front', 'left')]
        sc = 860 / full[0].size[1]; full = [im.resize((int(im.size[0] * sc), 860)) for im in full]
        bands = [('head', 0.74, 1.01), ('shoulders and arms', 0.5, 0.88), ('hips and knees', 0.2, 0.6), ('feet', -0.02, 0.16)]
        cells = []
        for name, b, t in bands:
            pair = []
            for v in ('front', 'left'):
                im = panel(vs[v], True, alpha=0.45); fy, ty = vs[v]['marks']['floor'][1], vs[v]['marks']['top'][1]; H = fy - ty
                y0, y1 = max(0, int(fy - t * H)), min(im.size[1], int(fy - b * H))
                xs = [q[0] for q in vs[v]['joints'].values() if y0 <= q[1] <= y1] or [im.size[0] / 2]
                mx = 0.1 * im.size[0]; x0, x1 = min(xs) - mx, max(xs) + mx
                if x1 - x0 < 0.36 * im.size[0]: c_ = (x0 + x1) / 2; x0, x1 = c_ - 0.18 * im.size[0], c_ + 0.18 * im.size[0]
                pair.append(im.crop((max(0, int(x0)), y0, min(im.size[0], int(x1)), y1)).convert('RGB'))
            cw = W // 2 - 6; s2 = cw / (pair[0].size[0] + pair[1].size[0] + 4)
            s2 = min(s2, 420 / max(p.size[1] for p in pair)); hh = int(max(p.size[1] for p in pair) * s2)
            c = Image.new('RGB', (cw, hh + 20), BGc); d = ImageDraw.Draw(c)
            c.paste(pair[0].resize((int(pair[0].size[0] * s2), int(pair[0].size[1] * s2))), (0, 20))
            c.paste(pair[1].resize((int(pair[1].size[0] * s2), int(pair[1].size[1] * s2))), (int(pair[0].size[0] * s2) + 4, 20))
            d.text((4, 1), f'{name}   (front | side, facing left)', fill=(255, 226, 160), font=f13); cells.append(c)
        rows = [(cells[0], cells[1]), (cells[2], cells[3])]
        H = 34 + 860 + 8 + sum(max(a.size[1], b2.size[1]) + 6 for a, b2 in rows)
        out = Image.new('RGB', (W, H), BGc); d = ImageDraw.Draw(out)
        d.text((8, 6), f'{k}   rest rig: front, side (facing left)   height {m["height"]:.2f} m   (L = cyan, R = orange)', fill=(255, 226, 160), font=f15)
        x = (W - sum(i.size[0] for i in full) - 10) // 2
        for im in full: out.paste(im.convert('RGB'), (x, 34)); x += im.size[0] + 10
        y = 34 + 860 + 8
        for a, b2 in rows:
            out.paste(a, (0, y)); out.paste(b2, (W // 2 + 6, y)); y += max(a.size[1], b2.size[1]) + 6
        p = os.path.join(outd, f'{k}_rig.png'); out.save(p, optimize=True); print(p)
        # the motion
        strips = []
        clips = sorted(mot.get(k, {}), key=lambda c: ('Walk', 'Run').index(c) if c in ('Walk', 'Run') else 2)
        plan = [(c, v) for c in clips for v in (('left', 'three_quarter') if c == 'Walk' else ('left',) if c == 'Run' else ('three_quarter',))]
        for c, v in plan:
            fr = sorted(mot[k][c]); ims = [panel(mm['views'][v], True, alpha=0.6, labels=False, grid=False) for _, mm in fr]
            cw = W // len(ims); s4 = cw / ims[0].size[0]; ch = int(ims[0].size[1] * s4)
            row = Image.new('RGB', (W, ch + 22), BGc); d = ImageDraw.Draw(row)
            d.text((8, 2), f'{k}  {c}  ({"side, facing left" if v == "left" else "three-quarter"}, {len(ims)} frames across the clip)', fill=(255, 226, 160), font=f13)
            for i, im in enumerate(ims): row.paste(im.convert('RGB').resize((cw, ch)), (i * cw, 22))
            strips.append(row)
        if strips:
            out = Image.new('RGB', (W, sum(r.size[1] for r in strips)), BGc); y = 0
            for r in strips: out.paste(r, (0, y)); y += r.size[1]
            p = os.path.join(outd, f'{k}_motion.png'); out.save(p, optimize=True); print(p)

def main():
    batch = sys.argv[1]; folder = os.path.join(ROOT, batch)
    if '--cards' in sys.argv:
        cards(batch); return
    outd = os.path.join(folder, 'sheets'); os.makedirs(outd, exist_ok=True)
    skel = '--plain' not in sys.argv
    metas = {os.path.basename(p)[:-5]: json.load(open(p)) for p in glob.glob(os.path.join(folder, '*.json'))}
    if '--cards' in sys.argv:
        cards(batch); return
    if '--detail' in sys.argv:
        # bands of the height: (name, bottom, top, which views)
        BANDS = [('head', 0.72, 1.01), ('shoulders', 0.52, 0.92), ('legs', 0.18, 0.62), ('feet', -0.02, 0.2)]
        for tag, m in sorted(metas.items()):
            vs = m['views']; ims = {v: panel(vs[v], skel, alpha=0.5) for v in vs}
            rows = []
            for name, b, t in BANDS:
                cells = []
                for v, im in ims.items():
                    fy, ty = vs[v]['marks']['floor'][1], vs[v]['marks']['top'][1]; H = fy - ty
                    y0, y1 = int(fy - t * H), int(fy - b * H)
                    cells.append(im.crop((0, max(0, y0), im.size[0], min(im.size[1], y1))))
                w = sum(c.size[0] for c in cells) + 8 * (len(cells) - 1); h = max(c.size[1] for c in cells)
                row = Image.new('RGB', (w, h + 22), (24, 22, 26)); d = ImageDraw.Draw(row); x = 0
                d.text((8, 3), f'{tag}  {name}  ({", ".join(ims)})', fill=(255, 226, 160), font=font(15))
                for c in cells: row.paste(c.convert('RGB'), (x, 22)); x += c.size[0] + 8
                p = os.path.join(outd, f'{tag}__{name}.png'); row.save(p); print(p)
    elif '--motion' in sys.argv:
        groups = {}
        for tag, m in metas.items():
            k, c, i = tag.split('__'); groups.setdefault((k, c), []).append((int(i), m))
        for (k, c), fr in sorted(groups.items()):
            fr.sort(); views = list(fr[0][1]['views'])
            cells = [[panel(m['views'][v], skel, alpha=0.55, labels=False, grid=False) for _, m in fr] for v in views]
            cw, ch = cells[0][0].size; s = Image.new('RGB', (cw * len(fr), ch * len(views) + 28), (24, 22, 26)); d = ImageDraw.Draw(s)
            d.text((8, 5), f'{k}  {c}  ({len(fr)} frames across the clip; rows: {", ".join(views)})', fill=(255, 226, 160), font=font(15))
            for r, row in enumerate(cells):
                for col, im in enumerate(row): s.paste(im.convert('RGB'), (col * cw, 28 + r * ch))
            p = os.path.join(outd, f'{k}__{c}{"" if skel else "__plain"}.png'); s.save(p); print(p)
    else:
        for tag, m in sorted(metas.items()):
            p = os.path.join(outd, f'{tag}{"" if skel else "__plain"}.png'); sheet(m, f'{tag}   rest pose   height {m["height"]:.2f} m', skel).save(p); print(p)


if __name__ == '__main__':
    main()
