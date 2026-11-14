# Marks

The V and T rule: a cross is Tessariel's, so no body here may carry one. Fourteen of bm's hero bodies came with
crosses on their chests, tabards, belts and pauldrons: the four paladins, the seven lancers, dragoon_f3 and f4, and
boomerang_f1. Each has a mask here, `<body>.png`, the size of its colour map (1024), white over the texels of its
crosses and a little round them.

`tools/bm/heroes.py` (`PAINT`, `erase`) paints inside the mask as it copies a body. It finds the inlay there (whatever
stands out from the cloth or enamel round it, gold unless `PAINT` says `any`, and anything cut deep enough to read
black), fills it from the nearest texels that aren't inlay, and flattens the normal map to match, so neither the colour
nor the light shows where a cross was. Outside the mask nothing is touched.

## A new mask

Boxing each cross in the model viewer, from each side it shows on:

```bash
python tools/serve.py 8417
```

Open `http://localhost:8417/viewer.html?m=hero_<body>`, then in the console:

```js
const P = await import('/tools/bm/marks/pick.js');
P.mark('hero_<body>', [[x0, y0, x1, y1]]);   // screen boxes, CSS pixels, round each cross in view; turn, repeat
await P.save('hero_<body>', '<body>');       // tools/build/shots/mask_<body>.png
```

A box takes only the texels of that body's skin that show under it, so a cross on the back needs a box from behind.
Copy the saved mask here as `<body>.png`, add the body to `PAINT`, and re-run `python tools/bm/heroes.py`. Then look
at it in the viewer again: a cross that comes back faint means the box missed an edge.
