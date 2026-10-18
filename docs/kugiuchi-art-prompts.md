# 「釘打ち」の絵 ── 生成プロンプト

いただいた絵は、画風も世界も、そのまま使えます。
ひとつだけ、**ゲームが動かすものが絵に焼きこまれている**ので、そこを抜いた
「**何も載っていない工房**」を一枚いただければ、すぐ入れ替えられます。

---

## 0. なぜ「何も載っていない」絵が要るか

いただいた絵には、これが描いてあります。

| 絵の中にあるもの | ゲームでは |
|---|---|
| 残り時間 60.0秒／釘 0/26／スコア | **上の帯が出す**（二重になる） |
| ふきだし「よく見て、…」 | **KoBoさんの行が出す** |
| COMBO × 3 | **ゲームが数える** |
| 釘 4本 | **ゲームが降らせる**（26本） |
| PERFECT! | **当たった瞬間に出す** |
| 金づち | **叩いた瞬間に振る** |
| 左を打つ／中央を打つ／右を打つ | **板を直接たたく**（ボタンは要らない） |
| 「左のレーン」などの札 | 要らない（3本見れば分かる） |

絵に残っていると、ゲームの出すものと**重なって二つ見えます**。
消そうとすると水彩がにじむので（「木の目利き」のときに一度やって、だめでした）、
**最初から載せない**のがいちばんきれいです。

---

## 1. 工房と作業台　【これ一枚でいけます】

### サイズ

**1024 × 1024（正方形）**

> ゲームの盤は正方形です。いただいた絵は 1312×1199（横長）なので、
> そのままだと左右が切れます。正方形でお願いします。

### 画面の作り

```
 ┌──────────────────────────┐
 │  工房のおく（棚・窓・ランプ）      │ ← 上 1/4
 │                              │
 │   職人      ▓▓  ▓▓  ▓▓      │ ← 三枚の板が、おくへ伸びる
 │   （左端）   ▓▓  ▓▓  ▓▓      │
 │             ▓▓  ▓▓  ▓▓      │
 │  ──────────────────────  │ ← 作業台の手前のふち
 └──────────────────────────┘
```

- **三枚の板**は、いただいた絵とまったく同じ置きかたで結構です
- **職人は左のはしに、胸から上だけ**。いただいた絵のままで完璧です
- 板の上には**何も置かないでください**（釘も、光も、字も）

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
calm and quiet, Japanese craft workshop atmosphere

---

inside a small woodworking workshop, a sturdy workbench seen from the front,
three long clean oak planks lying side by side on the bench and receding away
from the viewer in gentle perspective, the planks completely bare and smooth,
an elderly craftsman with round glasses, white beard, green cap and green vest
leaning in from the left edge, visible from the chest up, smiling quietly,
behind them shelves of jars and tools, a window with green leaves on the far
left, a hanging lamp above, warm morning light,
square composition, the three planks fill the middle of the square

no nails, no hammer, no tools on the planks, no sparks, no glow, no highlight band,
no text, no letters, no numbers, no labels, no signs, no speech bubble,
no score, no timer, no combo banner, no buttons, no UI, no frame, no border
```

### いちばん大事なところ

- **釘も金づちも、描かないでください。**ゲームが動かします
- **板の上に光る帯を描かないでください。**判定の帯はゲームが引きます
- **字は一文字も入れないでください**（札も、ボタンも、ふきだしも）

---

## 2. 金づち　【あると嬉しい】

叩いた瞬間に、画面のすみで振らせます。

### サイズ

**512 × 512** 背景は**透明**（または真っ白）

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, muted antique palette, soft edges, no photorealism

---

a single carpenter's claw hammer seen from the side, grey steel head,
warm honey-brown wooden handle, handle pointing down to the lower right,
centred in the square, simple and sturdy, handmade feeling

transparent background, no shadow, no motion lines, no swoosh, no sparks,
no text, no numbers, no frame, no border, no hand, no arm
```

> いただいた絵の金づちは、**うしろに振りの弧が描いてあります**。
> 弧はゲームが動かすので、金づち単体でお願いします。

---

## 3. 釘　【あると嬉しい】

26本、降ってきます。

### サイズ

**256 × 256** 背景は**透明**

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
muted antique palette, soft edges, no photorealism

---

a single iron nail seen from the side, flat round head at the top,
tapering shaft pointing straight down, grey-blue steel with a warm highlight,
standing upright, centred in the square

transparent background, no shadow, no wood, no board, no sparks,
no text, no numbers, no frame, no border
```

---

## 4. まとめ

| | 何 | サイズ | 背景 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | 工房と作業台 | 1024×1024 | — | **板の上に何も載せない**・字を入れない |
| 2 | 金づち | 512×512 | 透明 | 振りの弧を描かない |
| 3 | 釘 | 256×256 | 透明 | 影を付けない |

**1だけでも入れ替えられます。**2と3は、こちらで描いても足ります。

いただいたら、こちらで WebP にして HTML の中に入れます
（「木の目利き」と同じで、外から読みにいきません。3.8MB の PNG は
150KB ほどになるので、重くなりません）。

---

## 5. ゲームのほうは、もう出来ています

いただいた絵のゲームと、工房の中の「釘打ち」は、**作りがほとんど同じ**です。

| | いただいた絵のゲーム | 工房の中の釘打ち |
|---|---|---|
| 列 | 3 | 3 |
| 釘 | 26本 | 26本（8＋9＋9） |
| 波 | 3 | 3 |
| 時間 | 60秒 | 60秒 |
| 判定 | 帯に重なった瞬間 | 線に重なった瞬間 |
| 近いほど高得点 | ○ | ○ |

ちがうのは**絵だけ**です。だから、絵が来れば入れ替わります。
腕前の★（難度）や、家具の品質への効きかたは、いまのまま変わりません。

---

最終更新: 2026-10-18
