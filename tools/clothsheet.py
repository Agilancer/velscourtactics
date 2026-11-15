"""Tiles the model viewer's cloth-review frames (tools/build/rig/film.js) into one sheet per figure and state: a row per
view, a column per frame, every frame cropped to the same box round the figure.
python tools/clothsheet.py <tag> [key ...]   (takes tools/build/shots/<tag>__<key>__<state>__<view>__<i>.png)"""
import glob, os, re, sys
from PIL import Image, ImageDraw, ImageChops

tag = sys.argv[1]; only = set(sys.argv[2:])
root = os.path.join(os.path.dirname(__file__), 'build', 'shots')
out = os.path.join(os.path.dirname(__file__), 'build', 'rig', 'cloth_' + tag); os.makedirs(out, exist_ok=True)
pat = re.compile(re.escape(tag) + r'__(.+?)__(.+?)__(.+?)__(\d+)\.png$')
shots = {}
for f in glob.glob(os.path.join(root, tag + '__*.png')):
    m = pat.search(os.path.basename(f))
    if not m: continue
    k, st, vw, i = m.groups()
    if only and k not in only: continue
    shots.setdefault((k, st), {}).setdefault(vw, {})[int(i)] = f
for (k, st), views in sorted(shots.items()):
    names = [v for v in ('side', 'front', 'three') if v in views] + [v for v in views if v not in ('side', 'front', 'three')]
    ims = {v: {i: Image.open(f).convert('RGB') for i, f in views[v].items()} for v in names}
    # one box round the figure in every frame: where it differs from the corner's colour
    box = None
    for v in names:
        for im in ims[v].values():
            bg = Image.new('RGB', im.size, im.getpixel((2, 2)))
            b = ImageChops.difference(im, bg).convert('L').point(lambda x: 255 if x > 18 else 0).getbbox()
            if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    if box is None: continue
    pad = 12; box = (max(0, box[0] - pad), max(0, box[1] - pad), box[2] + pad, box[3] + pad)
    cw, ch = box[2] - box[0], box[3] - box[1]
    s = min(1.0, 420 / ch); tw, th = int(cw * s), int(ch * s)
    n = max(len(x) for x in ims.values())
    sheet = Image.new('RGB', (tw * n, (th + 18) * len(names) + 22), (24, 22, 26)); d = ImageDraw.Draw(sheet)
    d.text((6, 4), f'{k}  {st}  (rows: {", ".join(names)}; {n} frames across one cycle)', fill=(255, 226, 160))
    for r, v in enumerate(names):
        y = 22 + r * (th + 18); d.text((6, y + 2), v, fill=(200, 200, 210))
        for i, im in sorted(ims[v].items()):
            sheet.paste(im.crop(box).resize((tw, th), Image.LANCZOS), (i * tw, y + 16))
    p = os.path.join(out, f'{k}__{st}.png'); sheet.save(p); print(p, sheet.size)
