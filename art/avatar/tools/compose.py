# -*- coding: utf-8 -*-
from PIL import Image
D = '../parts/'
def face(head, eye=0, mouth=0, glass=None, ear=None, beard=None, hat=None):
    im = Image.open(f'{D}head{head:02d}.webp').convert('RGBA')
    for p in [f'eye{eye}', f'mouth{mouth}',
              f'beard{beard}' if beard is not None else None,
              f'glass{glass}' if glass is not None else None,
              f'ear{ear}'   if ear   is not None else None,
              f'hat{hat}'   if hat   is not None else None]:
        if p is None: continue
        l = Image.open(f'{D}{p}.webp').convert('RGBA')
        im = Image.alpha_composite(im, l)
    return im
