# -*- coding: utf-8 -*-
"""白地のシートから、丸太5本を切り出す。

   背景は 250〜254 のほぼ真っ白。
   ・白からの遠さで、ふちをなめらかに抜く（白いふちが残らない）
   ・「はっきり絵がある所」だけを数えて、大きなかたまり＝丸太を選ぶ
     （名前の文字・罫線・小さな葉の印は小さいので落ちる）
   ・丸太にくっついている葉・実・花は、ひとつながりなので一緒に取れる"""
import io, base64
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, BOX = '../sheets/木材5種-第二三章.webp', 180
IDS = ['mahogany', 'teak', 'rosewood', 'ebony', 'jindai']
NAMES = ['マホガニー', 'チーク', 'ローズウッド', '黒檀', '神代欅']

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
far = 255.0 - a.min(2)                      # 白からの遠さ
soft = np.clip((far - 4) / 36.0, 0, 1)      # ふちをなめらかに

core = far > 55                             # はっきり絵がある所
core = ndimage.binary_opening(core, np.ones((3, 3), bool))
lab, n = ndimage.label(core)
big = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    area = int((lab[sl] == i).sum())
    if area < 18000: continue
    ys, xs = sl
    big.append({'i': i, 'box': (xs.start, ys.start, xs.stop, ys.stop), 'area': area})
big.sort(key=lambda b: (0 if b['box'][1] < 500 else 1, b['box'][0]))
print('丸太', len(big), '本')
assert len(big) == 5, f'5本のはずが {len(big)} 本'

art, total = {}, 0
for wid, nm, b in zip(IDS, NAMES, big):
    m = ndimage.binary_dilation(lab == b['i'], np.ones((7, 7), bool))
    m = ndimage.binary_fill_holes(m)
    alpha = (soft * m).clip(0, 1)
    rgba = np.dstack([np.asarray(im), (alpha * 255).astype(np.uint8)])
    img = Image.fromarray(rgba, 'RGBA')
    img = img.crop(img.getbbox())
    s = BOX / max(img.width, img.height)
    img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    img.save(f'../parts/{wid}.webp', lossless=True, method=6)
    buf = io.BytesIO(); img.save(buf, 'WEBP', quality=80, method=6)
    d = buf.getvalue(); total += len(d)
    art[wid] = base64.b64encode(d).decode()
    print(f'  {wid:9s} {nm:7s} {img.width:3d}x{img.height:3d}  {len(d)/1024:5.1f}KB')

print('合計', round(total / 1024), 'KB')
open('wood-art2.js', 'w').write('\n'.join(f'  {k}: "{v}",' for k, v in art.items()))
