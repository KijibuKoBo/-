# -*- coding: utf-8 -*-
"""市松模様の背景を抜く。
   市松は「中間の明るさ・無彩色・細かく明暗が交互する」。
   絵の白い部分（サンタ帽のふち、ウサ耳）は交互しないので、そこで見分ける。"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage

def key_out(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    mx, mn = a.max(2), a.min(2)
    neutral = (mx - mn) < 12
    bright  = mn > 205
    cand = neutral & bright

    g = a.mean(2)
    lo = ndimage.minimum_filter(g, 13)
    hi = ndimage.maximum_filter(g, 13)
    textured = (hi - lo) > 9          # 市松だけが細かく交互する
    seed = cand & textured

    # 市松のマスの中心（平らな所）まで、種から少しだけ広げる
    grown = ndimage.binary_dilation(seed, np.ones((13,13), bool)) & cand

    # 外枠につながっているかたまりだけを背景とみなす
    lab, n = ndimage.label(grown)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:,0].tolist()) | set(lab[:,-1].tolist())
    border.discard(0)
    bg = np.isin(lab, list(border))
    return im, bg

if __name__ == '__main__':
    for p in sys.argv[1:]:
        im, bg = key_out(p)
        out = np.dstack([np.asarray(im), np.where(bg, 0, 255).astype(np.uint8)])
        name = p.split('/')[-1].replace('.png','')
        Image.fromarray(out, 'RGBA').save(f'{name}-cut.webp')
        print(name, '背景', round(bg.mean()*100,1), '%')
