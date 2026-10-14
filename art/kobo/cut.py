# -*- coding: utf-8 -*-
"""KoBoさんの四面図を、一体ずつ切り出す。

 背景は暗い緑〜茶のぼかしで、人物のまわりには明るいかさが出ている。
 一色で抜こうとすると、かさの明るさに引きずられて白いひげまで食う。
 そこで「ふちから、となりと色が近いうちだけ広がる」やり方で抜く。
 ぼかしはとなり同士が似ているので通りぬけ、絵の輪郭で止まる。

 使いかた:  python3 -I cut.py [tol]
"""
import sys
import numpy as np
from collections import deque
from PIL import Image
from scipy import ndimage

TOL = int(sys.argv[1]) if len(sys.argv) > 1 else 4
SRC = 'sheet.png'
H   = 300                       # そろえる背たけ
NAMES = ['front', 'back', 'sideL', 'sideR']    # シートの左から順

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.int16)
h, w, _ = a.shape

bg = np.zeros((h, w), np.uint8)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if not bg[y, x]: bg[y, x] = 1; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if not bg[y, x]: bg[y, x] = 1; q.append((y, x))
t2 = TOL * TOL
while q:
    y, x = q.popleft(); c = a[y, x]
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        yy, xx = y + dy, x + dx
        if yy < 0 or xx < 0 or yy >= h or xx >= w or bg[yy, xx]: continue
        d = a[yy, xx] - c
        if int(d[0])**2 + int(d[1])**2 + int(d[2])**2 <= t2:
            bg[yy, xx] = 1; q.append((yy, xx))

fg = ndimage.binary_fill_holes(bg == 0)
lab, n = ndimage.label(fg)
sz = ndimage.sum(fg, lab, range(1, n + 1))
keep = [i + 1 for i in np.argsort(sz)[::-1][:4]]          # 大きい4つ＝4体
mask = np.isin(lab, keep)
soft = ndimage.uniform_filter(mask.astype(np.float32), size=3)
alpha = np.clip(np.where(mask, 1.0, soft * .9), 0, 1)
cut = Image.fromarray(np.dstack([a.astype(np.uint8), (alpha * 255).astype(np.uint8)]), 'RGBA')

boxes = []
for i in keep:
    ys, xs = np.where(lab == i)
    boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
boxes.sort(key=lambda b: b[0])
for nm, (x0, y0, x1, y1) in zip(NAMES, boxes):
    p = 4
    c = cut.crop((max(0, x0 - p), max(0, y0 - p), min(w, x1 + 1 + p), min(h, y1 + 1 + p)))
    c = c.resize((max(1, round(c.width * H / c.height)), H), Image.LANCZOS)
    c.save('%s.png' % nm)
    print("  %-6s %dx%d" % (nm, c.width, c.height))
print("tol=%d で切り出した" % TOL)
