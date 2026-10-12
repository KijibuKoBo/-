# -*- coding: utf-8 -*-
"""似顔絵の部品をつくる（仕上げ）。

   どの絵も同じ大きさ・同じ位置にそろえてあるので、
   「顔のどのあたりか」で部品を取り分けられる。輪郭の1画素ずれに振り回されない。
"""
import numpy as np, os, json
from PIL import Image
from scipy import ndimage
import faces as F, faces2, build as B

LL = dict(lossless=True, method=6)      # 控えなので、縮めても絵は変えない

W, H = F.CANVAS
S1, S2, S3, S4 = B.S1, B.S2, B.S3, B.S4

EYE_ZONE   = (78, 182, 202, 248)      # 目とまゆが入りうる範囲 x0,y0,x1,y1
EYE_ERASE  = (94, 204, 186, 241)      # 既定の目を消す四角
MOUTH_ZONE = (92, 240, 188, 288)
MOUTH_ERASE= (100, 243, 180, 279)

def zone(x0, y0, x1, y1):
    m = np.zeros((H, W), bool); m[y0:y1, x0:x1] = True; return m

def dark(img, th=125):
    a = np.asarray(img)
    return (a[:, :, :3].mean(2) < th) & (a[:, :, 3] > 60)

def skin(img):
    a = np.asarray(img).astype(int)
    r, g, b = a[:,:,0], a[:,:,1], a[:,:,2]
    return (a[:,:,3] > 60) & (r >= 243) & (g > 190) & (g < 242) & (b > 145) & (b < 205) & (r-b > 60)

def inked(img, th=215):
    """肌より暗い＝線や色がのっている所（口の赤、メガネの茶色なども拾う）"""
    a = np.asarray(img)
    return (a[:, :, :3].min(2) < th) & (a[:, :, 3] > 60)

def alpha_from(img, mask, grow=2, blur=1.1, hard=None):
    m = ndimage.binary_dilation(mask, np.ones((grow*2+1,)*2, bool)) if grow else mask.copy()
    if hard is not None: m |= hard
    al = np.clip((ndimage.gaussian_filter(m.astype(np.float32), blur) - .35) / .4, 0, 1)
    a = np.asarray(img).copy()
    a[:, :, 3] = (a[:, :, 3] * al).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def soft_rect(x0, y0, x1, y1, feather=3.0):
    m = np.zeros((H, W), np.float32); m[y0:y1, x0:x1] = 1
    return ndimage.gaussian_filter(m, feather)

def not_hair(img):
    """髪をよけたところを返す。
       髪は頭のてっぺんから続く大きなかたまりなので、
       顔のまんなかにぽつんとある目やまゆの黒とは切り離せる。
       目の部品にもみあげが入りこむと、髪の色を変えたときに
       そこだけ黒く残ってしまうため。"""
    d = dark(img, 152)
    lab, n = ndimage.label(d)
    hair = np.zeros((H, W), bool)
    for i in range(1, n + 1):
        c = (lab == i)
        ys, _ = np.where(c)
        if ys.min() < 165 and c.sum() > 500:
            hair |= c
    soft = ndimage.gaussian_filter(
        ndimage.binary_dilation(hair, np.ones((7, 7), bool)).astype(np.float32), 2.0)
    return np.clip(1.0 - soft * 1.6, 0, 1)

def cut_rect_and_mask(img, rect, mask, grow=2, blur=1.1):
    """四角（肌ごと貼りかえ）と、はみ出す部分（まゆなど）を合わせて抜く"""
    rm = soft_rect(*rect)
    mm = ndimage.binary_dilation(mask, np.ones((grow*2+1,)*2, bool))
    mm = np.clip((ndimage.gaussian_filter(mm.astype(np.float32), blur) - .35) / .4, 0, 1)
    al = np.maximum(rm, mm) * not_hair(img)      # 髪は持ちこまない
    a = np.asarray(img).copy()
    a[:, :, 3] = (a[:, :, 3] * al).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def big_only(m, op=5, minblob=160):
    m = ndimage.binary_opening(m, np.ones((op, op), bool))
    lab, n = ndimage.label(m)
    if not n: return m
    sz = ndimage.sum(m, lab, range(1, n+1))
    return np.isin(lab, [i+1 for i, s in enumerate(sz) if s >= minblob])

def fill_small_holes(m, maxhole=2500):
    """細かな抜けだけをふさぐ。フードの内側（顔のぶん）は open のままにする"""
    filled = ndimage.binary_fill_holes(m)
    holes = filled & ~m
    lab, n = ndimage.label(holes)
    if not n: return m
    sz = ndimage.sum(holes, lab, range(1, n+1))
    small = np.isin(lab, [i+1 for i, s in enumerate(sz) if s <= maxhole])
    return m | small

os.makedirs('../parts', exist_ok=True)
print('■ 頭 20種')
import numpy as _np
def only_face(img):
    """顔とひとつながりの所だけを残す。
       見出しの札は髪と細い線でくっついていることがあるので、
       いったん細らせて縁を切ってから、顔の側だけを拾う。"""
    a = _np.asarray(img).copy()
    m = a[:, :, 3] > 40
    core = ndimage.binary_erosion(m, _np.ones((7, 7), bool))
    lab, n = ndimage.label(core)
    main = lab[int(F.CY), int(F.CX)]
    if main == 0:                                  # 細らせすぎたら元のまま
        lab, n = ndimage.label(m); main = lab[int(F.CY), int(F.CX)]
        keep = (lab == main)
    else:
        keep = ndimage.binary_dilation(lab == main, _np.ones((11, 11), bool)) & m
    a[:, :, 3] = _np.where(keep, a[:, :, 3], 0)
    return Image.fromarray(a, 'RGBA')

heads = [only_face(h) for h in B.cells(S1)]
for i, h in enumerate(heads): h.save(f'../parts/head{i:02d}.webp', **LL)

print('■ 目 5種 ・ 口 5種')
s2 = B.cells(S2)
for i, c in enumerate(s2[11:16]):
    m = inked(c) & zone(*EYE_ZONE) & (not_hair(c) > 0.5)
    cut_rect_and_mask(c, EYE_ERASE, m).save(f'../parts/eye{i}.webp', **LL)
for i, c in enumerate(s2[16:21]):
    m = inked(c) & zone(*MOUTH_ZONE) & (not_hair(c) > 0.5)
    cut_rect_and_mask(c, MOUTH_ERASE, m).save(f'../parts/mouth{i}.webp', **LL)

print('■ メガネ 3種 ・ ピアス 3種 ・ ひげ 3種')
s3 = B.cells(S3)
base3, rest = s3[0], s3[1:]
bh = dark(base3, 135)                       # 土台の髪。ここの差は無視する
bh = ndimage.binary_dilation(bh, np.ones((7,7), bool))
for i, c in enumerate(rest):
    d = B.diff(base3, c, tol=30, minblob=50) & ~bh
    if i < 3:   d &= zone(30, 190, 250, 258)        # メガネ
    elif i < 6: d &= (zone(20, 215, 72, 285) | zone(208, 215, 260, 285))   # 両耳
    else:       d &= zone(70, 240, 210, 300)        # ひげ
    lab, n = ndimage.label(d)
    if n:
        sz = ndimage.sum(d, lab, range(1, n+1))
        d = np.isin(lab, [j+1 for j, s in enumerate(sz) if s >= 40])
    alpha_from(c, d, grow=2).save(f"../parts/{['glass','glass','glass','ear','ear','ear','beard','beard','beard'][i]}{i%3}.webp", **LL)

print('■ 被り物 9種')
s4 = B.cells(S4)
base4, hats = s4[0], s4[1:]
for i, c in enumerate(hats):
    d = big_only(B.diff(base4, c, tol=30, minblob=100), op=5, minblob=250)
    d = fill_small_holes(d)
    alpha_from(c, d, grow=3, blur=1.3).save(f'../parts/hat{i}.webp', **LL)

json.dump({'canvas': [W, H], 'eye_zone': EYE_ZONE, 'mouth_zone': MOUTH_ZONE},
          open('../parts/meta.json', 'w'))
print('\n完了', len([f for f in os.listdir('../parts') if f.endswith('.webp')]), '点')
