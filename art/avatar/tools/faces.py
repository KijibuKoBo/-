# -*- coding: utf-8 -*-
"""シートから顔を見つける。

   顔には「ほお・鼻・ほお」の桃色の丸が三つ、きまった形でならぶ。
   それを手がかりにすれば、見出しの札も、ウサ耳の耳の内側も、まぎれこまない。
   見つけた三点組から、ほおを基準にした同じ大きさの絵を切り出す。"""
import numpy as np
from PIL import Image
from scipy import ndimage

CANVAS = (280, 340)       # 横, 縦
CHEEK_D = 100.0           # ほお〜ほおを、この幅にそろえる
CX, CY  = 140.0, 245.0    # ほおの中点を、ここに置く

def pink_blobs(a):
    r, g, b = [a[:, :, i].astype(int) for i in range(3)]
    al = a[:, :, 3] > 40
    pink = al & (r > 228) & (g < 205) & (r - g > 42) & (b < 200)
    lab, n = ndimage.label(pink)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = (lab[sl] == i)
        area = int(m.sum())
        if area < 70: continue
        ys, xs = sl
        w, h = xs.stop-xs.start, ys.stop-ys.start
        if max(w, h) > 2.6 * min(w, h): continue          # 丸いものだけ
        out.append(((xs.start+xs.stop)/2, (ys.start+ys.stop)/2, area))
    return out

def find_faces(path, dmin=40, dmax=250):
    """ほお・鼻・ほお の三点組をさがす。
       ひとつの丸を二つの顔が使うことはないので、点を取り合わせない形で割り当てる。"""
    im = Image.open(path)
    bl = pink_blobs(np.asarray(im))
    cand = []
    for i in range(len(bl)):
        for j in range(len(bl)):
            if i == j: continue
            L, R = bl[i], bl[j]
            dx = R[0] - L[0]
            if not (dmin <= dx <= dmax): continue
            dy = abs(R[1] - L[1])
            if dy > 0.09 * dx: continue
            sim = min(L[2], R[2]) / max(L[2], R[2])
            if sim < 0.6: continue
            cy = min(L[1], R[1])
            for k, N in enumerate(bl):
                if k in (i, j): continue
                off = abs((L[0]+R[0])/2 - N[0])
                if off > 0.13 * dx: continue
                if not (cy - 0.34*dx < N[1] < cy + 0.04*dx): continue
                if N[2] > 0.92 * min(L[2], R[2]): continue
                score = sim*100 - dy/dx*300 - off/dx*200
                cand.append((score, i, j, k, L, R, dx))
    cand.sort(key=lambda c: -c[0])
    used, keep = set(), []
    for score, i, j, k, L, R, dx in cand:
        if i in used or j in used or k in used: continue
        used |= {i, j, k}
        keep.append({'lx': L[0], 'ly': L[1], 'rx': R[0], 'ry': R[1],
                     'cx': (L[0]+R[0])/2, 'cy': (L[1]+R[1])/2, 'd': dx})
    keep.sort(key=lambda f: (round(f['cy'] / 90), f['cx']))
    return im, keep

def cutout(im, f):
    """ほおを基準に、きまった窓で切ってそろえる"""
    s = CHEEK_D / f['d']
    w, h = CANVAS[0]/s, CANVAS[1]/s
    x0, y0 = f['cx'] - CX/s, f['cy'] - CY/s
    win = im.crop((round(x0), round(y0), round(x0+w), round(y0+h)))
    return win.resize(CANVAS, Image.LANCZOS)

def cells(path):
    im, fs = find_faces(path)
    return [cutout(im, f) for f in fs], fs
