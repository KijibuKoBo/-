# -*- coding: utf-8 -*-
"""似顔絵の部品をつくる。

  頭      シート1の20コマ（髪＋顔＋既定の目口）。これが土台
  目/口   シート2。行の中で見くらべて違う所をさがし、肌ごと四角で貼りかえる
  メガネ・ピアス・ひげ   シート3。既定の顔との差＝その部品
  被り物  シート4。「なし」のコマとの差＝帽子そのもの
"""
import numpy as np, os, json
from PIL import Image
from scipy import ndimage
import faces as F, faces2

W, H = F.CANVAS
CX, CY = int(F.CX), int(F.CY)
S1, S2, S3, S4 = ('../sheets/1-髪型20種.webp', '../sheets/2-髪型10種-目5種-口5種.webp',
                  '../sheets/3-メガネ-ピアス-ひげ.webp', '../sheets/4-被り物10種.webp')

def declutter(img, keep_below=84):
    """顔とつながっていない塊（見出しの札）を落とす"""
    a = np.asarray(img).copy()
    m = a[:, :, 3] > 40
    lab, n = ndimage.label(m)
    if not n: return img
    main = lab[CY, CX]
    grown = ndimage.binary_dilation(lab == main, np.ones((11, 11), bool))
    keep = np.zeros_like(m)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        c = (lab == i)
        if i == main or (c & grown).any():
            ys, xs = np.where(c)
            if i != main and ys.mean() > CY + keep_below: continue   # あごより下は札
            keep |= c
    a[:, :, 3] = np.where(keep, a[:, :, 3], 0)
    return Image.fromarray(a, 'RGBA')

def cells(p):
    cs, _ = faces2.cells(p)
    return [declutter(c) for c in cs]

def diff(base, var, tol=30, minblob=70):
    a, b = np.asarray(base).astype(int), np.asarray(var).astype(int)
    col = np.abs(a[:, :, :3] - b[:, :, :3]).max(2)
    m = ((col > tol) | (np.abs(a[:, :, 3] - b[:, :, 3]) > 70)) & (b[:, :, 3] > 40)
    m = ndimage.binary_opening(m, np.ones((3, 3), bool))
    m = ndimage.binary_closing(m, np.ones((7, 7), bool))
    lab, n = ndimage.label(m)
    if n:
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= minblob])
    return m

def soft_cut(var, mask, grow=2, blur=1.2):
    mm = ndimage.binary_dilation(mask, np.ones((grow*2+1,)*2, bool)) if grow else mask
    al = np.clip((ndimage.gaussian_filter(mm.astype(np.float32), blur) - .35) / .4, 0, 1)
    a = np.asarray(var).copy()
    a[:, :, 3] = (a[:, :, 3] * al).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def rect_cut(var, rect, feather=3.5):
    x0, y0, x1, y1 = rect
    m = np.zeros((H, W), np.float32); m[y0:y1, x0:x1] = 1
    m = ndimage.gaussian_filter(m, feather)
    a = np.asarray(var).copy()
    a[:, :, 3] = (a[:, :, 3] * m).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def bbox(m, pad=0):
    ys, xs = np.where(m)
    return (max(0, int(xs.min())-pad), max(0, int(ys.min())-pad),
            min(W, int(xs.max())+1+pad), min(H, int(ys.max())+1+pad))

if __name__ == '__main__':
    os.makedirs('out', exist_ok=True)
    meta = {}

    print('■ 頭（20種）')
    heads = cells(S1)
    for i, h in enumerate(heads): h.save(f'out/head{i:02d}.webp')

    print('■ 目・口（行の中で見くらべる）')
    s2 = cells(S2)
    eyes, mouths = s2[11:16], s2[16:21]

    def row_rect(row, pad):
        """同じ行のコマどうしを見くらべて、変わる所の四角を出す"""
        acc = np.zeros((H, W), bool)
        for i in range(len(row)):
            for j in range(i+1, len(row)):
                acc |= diff(row[i], row[j], tol=34, minblob=60)
        return bbox(acc, pad)

    er = row_rect(eyes, 9);  print('   目の四角', er)
    mr = row_rect(mouths, 9); print('   口の四角', mr)
    for i, c in enumerate(eyes):   rect_cut(c, er).save(f'out/eye{i}.webp')
    for i, c in enumerate(mouths): rect_cut(c, mr).save(f'out/mouth{i}.webp')
    meta['eye_rect'], meta['mouth_rect'] = list(er), list(mr)

    print('■ メガネ・ピアス・ひげ')
    s3 = cells(S3)
    base3, rest = s3[0], s3[1:]
    kinds = ['glass']*3 + ['ear']*3 + ['beard']*3
    for i, c in enumerate(rest):
        soft_cut(c, diff(base3, c)).save(f'out/{kinds[i]}{i%3}.webp')

    print('■ 被り物')
    s4 = cells(S4)
    base4, hats = s4[0], s4[1:]
    for i, c in enumerate(hats):
        soft_cut(c, diff(base4, c)).save(f'out/hat{i}.webp')

    meta['canvas'] = [W, H]
    json.dump(meta, open('out/meta.json', 'w'), ensure_ascii=False)
    print('\n完了', len(os.listdir('out')), '点')
