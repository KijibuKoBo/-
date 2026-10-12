# -*- coding: utf-8 -*-
"""木材の絵を切り出す。丸太と、そえてある葉や実をひとまとまりで取る。"""
import io, base64, json
import numpy as np
from PIL import Image
from scipy import ndimage

BOX = 180           # 長いほうをこの大きさにそろえる
IDS = ['pine', 'beech', 'chestnut', 'oak', 'cherry', 'maple', 'walnut']

im = Image.open('../sheets/木材7種.webp')
a = np.asarray(im)
al = a[:, :, 3] > 40
lab, n = ndimage.label(ndimage.binary_closing(al, np.ones((5, 5), bool)))
objs = ndimage.find_objects(lab)

big = []
for i, sl in enumerate(objs, 1):
    if (lab[sl] == i).sum() < 20000: continue      # 丸太だけ。札や文字は小さい
    ys, xs = sl
    big.append({'i': i, 'box': (xs.start, ys.start, xs.stop, ys.stop)})
big.sort(key=lambda b: (0 if b['box'][1] < 400 else 1, b['box'][0]))
assert len(big) == 7, f'7つのはずが {len(big)} つ'

art = {}
total = 0
for wid, b in zip(IDS, big):
    x0, y0, x1, y1 = b['box']
    sub = np.asarray(im.crop((x0, y0, x1, y1))).copy()
    # そのかたまりだけを残す（となりの文字が角に入らないように）
    keep = lab[y0:y1, x0:x1] == b['i']
    keep = ndimage.binary_dilation(keep, np.ones((5, 5), bool))
    sub[:, :, 3] = np.where(keep, sub[:, :, 3], 0)
    img = Image.fromarray(sub, 'RGBA').crop(Image.fromarray(sub, 'RGBA').getbbox())
    s = BOX / max(img.width, img.height)
    img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    buf = io.BytesIO(); img.save(buf, 'WEBP', quality=80, method=6)
    d = buf.getvalue(); total += len(d)
    art[wid] = base64.b64encode(d).decode()
    img.save(f'../parts/{wid}.webp', lossless=True, method=6)
    print(f'  {wid:9s} {img.width:3d}x{img.height:3d}  {len(d)/1024:5.1f}KB')

print('合計', round(total/1024), 'KB')
lines = ['/* 木材の絵。松永工房さんが描いたもの */', 'const WOOD_ART = {']
for k, v in art.items(): lines.append(f'  {k}: "{v}",')
lines.append('};')
open('wood-art.js', 'w').write('\n'.join(lines))
print('wood-art.js', round(len('\n'.join(lines))/1024), 'KB')
