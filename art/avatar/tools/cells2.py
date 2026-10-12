# -*- coding: utf-8 -*-
"""顔のコマだけを拾う。見出しの札には肌色が無いので、それで見分ける。"""
import numpy as np
from PIL import Image
from scipy import ndimage

def skin_mask(rgb):
    r, g, b = rgb[:,:,0].astype(int), rgb[:,:,1].astype(int), rgb[:,:,2].astype(int)
    return (r > 235) & (g > 195) & (g < 245) & (b > 155) & (b < 220) & (r - b > 28)

def find_cells(path, min_skin=900):
    im = Image.open(path)
    a = np.asarray(im)
    al = a[:,:,3] > 40
    sk = skin_mask(a[:,:,:3]) & al
    # 肌のかたまり＝顔。ここを種にして、つながる絵を全部ひろう
    lab, n = ndimage.label(ndimage.binary_closing(al, np.ones((3,3), bool)))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        comp = (lab[sl] == i)
        if (sk[sl] & comp).sum() < min_skin: continue
        ys, xs = sl
        out.append([xs.start, ys.start, xs.stop, ys.stop])
    out.sort(key=lambda b: (round(b[1]/60), b[0]))
    return im, out

if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        im, cs = find_cells(p)
        print('\n==', p.split('/')[-1], len(cs), 'コマ')
        for b in cs: print('   ', b, f'{b[2]-b[0]}x{b[3]-b[1]}')
