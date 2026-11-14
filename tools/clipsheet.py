"""Lays out the pictures Target.tiles() and Target.turn() rendered (tools/blender/retarget.py) as one labelled sheet:
the body from four sides on top, then one row per clip, its frames left to right in time.
python tools/clipsheet.py <folder> [out.png] [title]      (rows in the order the clips were rendered)"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

folder = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else folder.rstrip('\\/') + '.png'
title = sys.argv[3] if len(sys.argv) > 3 else os.path.basename(folder.rstrip('\\/'))
BG, INK, DIM = (112, 106, 98), (255, 236, 196), (40, 34, 30)
try: font = ImageFont.truetype('arial.ttf', 15); big = ImageFont.truetype('arialbd.ttf', 22)
except OSError: font = big = ImageFont.load_default()


def on_bg(path, size=None):
    im = Image.open(path).convert('RGBA')
    if size: im = im.resize(size, Image.LANCZOS)
    bg = Image.new('RGBA', im.size, BG + (255,)); bg.alpha_composite(im); return bg.convert('RGB')


body = [p for s in ('front', 'three_quarter', 'side', 'back') for p in glob.glob(os.path.join(folder, 'body_%s.png' % s))]
firsts = sorted(glob.glob(os.path.join(folder, '*_0.png')), key=os.path.getmtime)
clips = [os.path.basename(p)[:-6] for p in firsts]
label = 120
tw, th = Image.open(firsts[0]).size if firsts else (160, 200)
n = len(glob.glob(os.path.join(folder, clips[0] + '_*.png'))) if clips else 0
bw, bh = 270, 360
W = max(label + n * tw, label + len(body) * bw); H = 40 + (bh + 24 if body else 0) + len(clips) * th
sheet = Image.new('RGB', (W, H), DIM); d = ImageDraw.Draw(sheet)
d.text((10, 8), title, fill=INK, font=big)
y = 40
if body:
    for i, p in enumerate(body):
        sheet.paste(on_bg(p, (bw, bh)), (label + i * bw, y))
        d.text((label + i * bw + 6, y + bh + 3), os.path.basename(p)[5:-4].replace('_', ' '), fill=INK, font=font)
    d.text((8, y + 6), 'body\n(idle,\nframe 0)', fill=INK, font=font)
    y += bh + 24
for c in clips:
    for i in range(n):
        p = os.path.join(folder, '%s_%d.png' % (c, i))
        if os.path.exists(p): sheet.paste(on_bg(p), (label + i * tw, y))
    d.text((8, y + th // 2 - 8), c, fill=INK, font=font)
    d.line([(label, y), (W, y)], fill=DIM, width=2)
    y += th
sheet.save(out); print(out, sheet.size, len(clips), 'clips')
