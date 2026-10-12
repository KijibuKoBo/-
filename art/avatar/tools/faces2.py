# -*- coding: utf-8 -*-
"""コマごとに「ほお・鼻・ほお」を見つけ、ほおを基準に同じ大きさで切り出す。
   切り出しは枠ではなく「ほおからの決まった窓」なので、見出しの札は入らない。"""
import numpy as np
from PIL import Image
from scipy import ndimage
import cells2, faces as F

CANVAS, CHEEK_D, CX, CY = F.CANVAS, F.CHEEK_D, F.CX, F.CY

def triple(a):
    """コマの中から、ほお2つを返す"""
    bl = F.pink_blobs(a)
    best, got = -1e9, None
    for i in range(len(bl)):
        for j in range(len(bl)):
            if i == j: continue
            L, R = bl[i], bl[j]
            dx = R[0] - L[0]
            if dx < 40: continue
            dy = abs(R[1] - L[1])
            if dy > 0.1 * dx: continue
            sim = min(L[2], R[2]) / max(L[2], R[2])
            if sim < 0.33: continue
            cy = min(L[1], R[1])
            for k, N in enumerate(bl):
                if k in (i, j): continue
                off = abs((L[0]+R[0])/2 - N[0])
                if off > 0.15 * dx: continue
                if not (cy - 0.36*dx < N[1] < cy + 0.06*dx): continue
                if N[2] > 0.95 * min(L[2], R[2]): continue
                sc = sim*100 - dy/dx*300 - off/dx*200 + dx*0.3
                if sc > best: best, got = sc, (L, R)
    if got: return got
    # メガネが鼻にかかると鼻の丸が消える。そのときは、
    # コマのまんなかに対して左右対称な組を、ほおとみなす
    W = a.shape[1]
    best, got = -1e9, None
    for i in range(len(bl)):
        for j in range(len(bl)):
            if i == j: continue
            L, R = bl[i], bl[j]
            dx = R[0] - L[0]
            if dx < 40: continue
            if abs(R[1] - L[1]) > 0.1 * dx: continue
            sim = min(L[2], R[2]) / max(L[2], R[2])
            if sim < 0.33: continue
            sc = sim*100 - abs((L[0]+R[0])/2 - W/2)/W*400 + dx*0.2
            if sc > best: best, got = sc, (L, R)
    return got

def cells(path):
    im, boxes = cells2.find_cells(path)
    boxes = [b for b in boxes if (b[2]-b[0]) >= 100 and (b[3]-b[1]) >= 100]
    rec = []
    for b in boxes:
        t = triple(np.asarray(im.crop(b)))
        if t is None: print('   ほお見つからず', b); continue
        L, R = t
        rec.append({'cx': b[0]+(L[0]+R[0])/2, 'cy': b[1]+(L[1]+R[1])/2, 'd': R[0]-L[0]})
    rec.sort(key=lambda r: (round(r['cy']/90), r['cx']))
    return [F.cutout(im, r) for r in rec], rec
