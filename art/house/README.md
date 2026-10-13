# ドールハウスの写真

松永工房さんのドールハウスの写真です。
ゲーム本体（`game/index.html`）には、できあがった絵が `ROOM_ART` として
WebP で埋めこまれています。**ここにあるのは、作り直すときのための控えです。**

---

## 中身

| | |
|---|---|
| `room-frosted.jpg` | **ゲームで使っているもの。**空の部屋を正面から。扉はすりガラス |
| `room-workshop.jpg` | 同じ部屋。扉の向こうに工房の中が写っている |
| `dollhouse.jpg` | 二階建てのドールハウス全体。上の階にお人形と椅子 |

`room-frosted.jpg` を選んだのは、**扉の向こうに機械やホースが写らない**からです。
部屋そのものに目が行きます。

`dollhouse.jpg` は背景の部屋には向きませんが、
**会社へのご提案や「本物の Petit.Continue」の紹介**に使えます。

---

## どうやって切り出したか

もとの写真は、背景を抜いた上で**市松（透過）のふち**がついた JPEG でした。
JPEG には透過が無いので、市松は本物の画素として入っています。

1. **市松のふちを落とす** ── 無彩色（R≒G≒B、差4以内）の画素が
   8割以上ならその行・列は市松、として外側から詰めます。
   部屋の壁は暖色（R>B）なので、巻きこみません。
2. **長辺1100pxにして WebP（画質84）** ── **33KB**です。
   部屋はなめらかなので、よく縮みます。

```python
from PIL import Image
import numpy as np
im = Image.open('room-frosted.jpg').convert('RGB')
a = np.asarray(im).astype(np.int16)
grey = (np.abs(a[:,:,0]-a[:,:,2]) <= 4) & (np.abs(a[:,:,0]-a[:,:,1]) <= 4)
def edge(p, thr=0.8):
    i = 0
    while i < len(p) and p[i] >= thr: i += 1
    j = len(p)-1
    while j >= 0 and p[j] >= thr: j -= 1
    return i, j
x0, x1 = edge(grey.mean(axis=0))
y0, y1 = edge(grey.mean(axis=1))
cr = im.crop((x0, y0, x1+1, y1+1))          # → 1369×698
W = 1100
cr.resize((W, round(W*cr.size[1]/cr.size[0])), Image.LANCZOS) \
  .save('petit.webp', 'WEBP', quality=84, method=6)
```

できた WebP を base64 にして、`game/index.html` の
`const ROOM_ART = { petit: "data:image/webp;base64,…" }` と入れかえます。

---

## 部屋を足すとき

`ROOM_ART` にキーを1つ、`ROOMS` に1行足すだけです。

```js
{ id: "petit2", name: "二階のお部屋", ar: "1100/561",
  floor: 0.86, dh: 0.30, img: "petit2" }
```

| | |
|---|---|
| `ar` | 写真の縦横比。舞台の形がこれに合います |
| `floor` | 床の高さ（0〜1）。置いたときに足もとが来る所 |
| `dh` | 120mm の家具を置いたときの大きさ（部屋の高さに対する割合） |

`floor` と `dh` は、写真に目盛りを引いて読むのが早いです。

```python
from PIL import Image, ImageDraw
g = Image.open('petit.webp').convert('RGB')
d = ImageDraw.Draw(g)
for i in range(1, 20):
    y = g.size[1]*i/20
    d.line([(0,y),(g.size[0],y)], fill=(255,0,0))
    d.text((4, y+1), "%.2f" % (i/20), fill=(255,0,0))
g.save('grid.png')
```

この部屋は、奥の壁と床の境目が **0.73**、床の手前のふちが **0.93** でした。
そのあいだの **0.86** を `floor` にしています。

---

## 次に撮るなら

- 部屋の中は**空のまま**
- カメラは**床の高さに近づけて、正面から**。見下ろさない
- 部屋が分かれているなら、**一部屋ずつ**
- 明るい所で。影が強いと、置いた家具が浮きます
- 背景は抜いても抜かなくてもかまいません（市松は落とせます）
