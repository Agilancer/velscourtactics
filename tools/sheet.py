"""Tiles the screenshots tools/serve.py saved into one labelled contact sheet.
python tools/sheet.py <tag> [out.png]   (takes tools/build/shots/<tag>_*.png, crops the middle of each)"""
import glob, os, sys
from PIL import Image, ImageDraw
tag = sys.argv[1]; root = os.path.join(os.path.dirname(__file__), 'build', 'shots')
order = ['idle', 'walk', 'run', 'jump', 'attack', 'cast_bolt', 'snap', 'lantern', 'wave', 'thrust', 'charge', 'bash', 'guard_up', 'guard', 'rally', 'point', 'taunt',
         'cast', 'hit', 'wounded', 'stunned', 'talk', 'item', 'cheer', 'dead', 'revive']
files = [os.path.join(root, f'{tag}_{n}.png') for n in order if os.path.exists(os.path.join(root, f'{tag}_{n}.png'))]
cols = 8; tw, th = 230, 300
sheet = Image.new('RGB', (cols * tw, ((len(files) + cols - 1) // cols) * th), (20, 16, 14))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB'); w, h = im.size; cw = int(h * 0.62 * tw / th)
    im = im.crop(((w - cw) // 2, int(h * 0.16), (w + cw) // 2, int(h * 0.78))).resize((tw, th), Image.LANCZOS)
    sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
    ImageDraw.Draw(sheet).text(((i % cols) * tw + 6, (i // cols) * th + 4), os.path.basename(f)[len(tag) + 1:-4], fill=(255, 226, 160))
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, f'{tag}_sheet.png')
sheet.save(out); print(out, sheet.size)
