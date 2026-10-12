# -*- coding: utf-8 -*-
"""部品を 300×300 の座標系にそろえ、WebP に詰めて JS の一行にする。"""
import io, json, base64, glob, os
import numpy as np
from PIL import Image

SRC_W, SRC_H = 280, 340
OUT = 300
DX, DY = 7, -8                     # ほおを (147,237) に置く
Q = 74

def place(im):
    c = Image.new('RGBA', (OUT, OUT), (0,0,0,0))
    c.paste(im, (DX, DY))
    return c

ORDER = (
    [('head', f'head{i:02d}') for i in range(20)] +
    [('eye', f'eye{i}') for i in range(5)] +
    [('mouth', f'mouth{i}') for i in range(5)] +
    [('glass', f'glass{i}') for i in range(3)] +
    [('ear', f'ear{i}') for i in range(3)] +
    [('beard', f'beard{i}') for i in range(3)] +
    [('hat', f'hat{i}') for i in range(9)]
)

art, total = {}, 0
for kind, name in ORDER:
    im = place(Image.open(f'../parts/{name}.webp').convert('RGBA'))
    bb = im.getbbox()
    assert bb, name
    assert bb[0] >= 0 and bb[1] >= 0 and bb[2] <= OUT and bb[3] <= OUT, (name, bb)
    sub = im.crop(bb)
    b = io.BytesIO(); sub.save(b, 'WEBP', quality=Q, method=6)
    data = b.getvalue(); total += len(data)
    art[name] = [bb[0], bb[1], base64.b64encode(data).decode()]

print('部品', len(art), '／ 合計', round(total/1024), 'KB')
lines = ['const AV_ART = {']
for k, (x, y, d) in art.items():
    lines.append(f'  {k}: [{x},{y},"{d}"],')
lines.append('};')
open('av-art.js', 'w').write('\n'.join(lines))
print('av-art.js', round(os.path.getsize('av-art.js')/1024), 'KB')
