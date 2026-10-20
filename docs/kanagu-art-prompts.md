# 「金具」の絵 ── 生成プロンプト

いまの ⑨金具 は、**ねじのまわりを指でなぞって、溝を印に合わせて締める**遊びです。
絵がいちばん素っ気ない山場なので、ここに絵が入ると見ちがえます。

> **遊びの中身は、まだ決めていません。**
> いただいた試作は「回る針を止める」別の遊びでした。
> 下の 1〜4 は、**いまの「合わせる」にそのまま使えて**、
> もし後から「止める」に変えても **1・3・4 はそのまま流用できます**。

---

## 0. 共通の約束

どのプロンプトにも、この一文を頭に付けてください。**画風のかなめ**です。

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
calm and quiet, Japanese craft workshop atmosphere
```

そして、**どの絵にも入れてはいけないもの**。

```
no text, no letters, no numbers, no logos, no watermark,
no UI, no buttons, no callout lines, no diagram arrows, no circles or insets,
no frames, no borders, nothing cropped at the edge of the image
```

> **前の2回と同じお願いです。**いただいた `brass_knob.png` は、
> 大きな一枚絵からの切り出しで、たんすの角・丸い囲み・引き出し線・
> 文字の切れはしが入っていて、四辺とも切れていました。
> **一枚ずつ、まるごと、何も載せずに**お願いします。

---

## 1. たんすの扉（背景）　【必須】

### これは何か

盤のうしろに敷く一枚。**300×300 の正方形**いっぱいに広がります。
ここにねじを立てて、締めていきます。

### サイズ

**1024 × 1024（正方形）**

### 画面の作り

```
 ┌──────────────────────────┐
 │  工房のおく（少しだけ）        │ ← 上 2割
 │ ┌──────────────────┐ │
 │ │                          │ │ ← 扉の鏡板
 │ │      （まん中は空に）      │ │   画面の 18%〜82% くらい
 │ │                          │ │
 │ └──────────────────┘ │
 │  作業台の手前               │ ← 下 1割
 └──────────────────────────┘
```

### プロンプト

```
（共通の約束）

---

a single cabinet door panel of warm honey oak lying flat on a workbench,
seen straight from directly above, the panel almost filling the square with
a little workshop visible around its edges, a simple raised centre panel with
a plain moulded frame, smooth and freshly sanded, soft morning light from the
upper left, calm and quiet, square composition

no screws, no nails, no hinges, no knobs, no handles, no metal, no holes,
no tools, no hands, no marks on the panel,
no text, no numbers, no UI, no frame, no border
```

### 大事なところ

- **まん中は、ほぼ空けてください。**そこにねじが立ちます（直径 124 ぶん）
- **金具は一つも描かないでください。**ゲームが乗せます

---

## 2. ねじの頭　【必須・いちばん大事】

### これは何か

まん中に立つ、**真上から見たねじの頭**。これを指で回します。

### サイズ

**512 × 512（正方形）**　背景は**透明**

### 大事なところ

- **まんまるに、絵のまん中に。**回すので、中心がずれると目が回ります
- **溝（すり割り）は、きっかり水平に。**斜めだと、ゲームの角度とずれます
- まわりに **6%ほどの余白**を空けてください
- 影は付けないでください（ゲームが敷きます）

### プロンプト

```
（共通の約束）

---

a single large flat-head screw seen from directly above, perfectly circular
and perfectly centred in the square, a straight slotted groove running exactly
horizontally across the middle of the head, warm aged brass with soft
grey-gold highlights and gentle patina, a little empty space all around it

transparent background, no shadow, no wood, no panel, no hand, no screwdriver,
no text, no numbers, no frame, no border,
the screw must not touch any edge of the image
```

---

## 3. 座金（ねじの下の飾り板）　【あると良い】

### これは何か

ねじの下に敷く、丸い真鍮の板。ねじが回っても、こちらは**止まったまま**です。
深みが出ます。

### サイズ

**512 × 512**　背景は**透明**

### プロンプト

```
（共通の約束）

---

a single round brass escutcheon plate seen from directly above, perfectly
circular and centred, a plain flat ring of aged brass with a small round hole
in the very centre, gently worn edges, soft patina, a little empty space around it

transparent background, no shadow, no screw, no wood, no text, no numbers,
no frame, no border, nothing touching the edges
```

---

## 4. 取り付いた引き手　【あると良い】

### これは何か

12本ぜんぶ締め終えたときに出る、**ごほうびの絵**。
「鋸引き」で切り出した木が出るのと同じ役どころです。

### サイズ

**512 × 512**　背景は**透明**

### プロンプト

```
（共通の約束）

---

a single small antique brass drawer pull seen straight from the front,
a rounded knob on a simple round base plate, warm aged brass, softly worn,
standing alone and centred with space around it

transparent background, no shadow, no drawer, no cabinet, no wood, no hand,
no text, no numbers, no frame, no border, nothing touching the edges
```

---

## 5. まとめ

| | 何 | サイズ | 背景 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | たんすの扉 | 1024×1024 | — | **まん中を空ける**・金具を描かない |
| 2 | ねじの頭 | 512×512 | 透明 | **まんまる・まん中・溝は水平** |
| 3 | 座金 | 512×512 | 透明 | まんまる・まん中・穴あき |
| 4 | 引き手 | 512×512 | 透明 | 影・たんす・手を描かない |

**1と2があれば、入れ替えられます。**3と4は無くても遊べます。

いただいたら、こちらで WebP にして HTML の中に入れます
（「鋸引き」と同じで、外から読みにいきません。合わせて 100KB ほどです）。

---

## 6. いまの金具の寸法（記録）

絵を当てはめるときに使う数字です。盤は 300×300。

```
扉の板   x 30 … 270   y 56 … 244
ねじ     まん中 (150,150)　外まわり r62　頭 r54
溝       長さ 80・太さ 10（真横を 0度として回る）
緑の印   ねじの上下、中心から 60〜78 のところ
許される狂い  第1波 20度 ／ 第2波 14度 ／ 第3波 9度（難度で割る）
```

1024の絵に直すと、扉は **x 102 … 922**、**y 191 … 833**。
ねじは **直径 423**（512の絵なら、まわりに 6% 余白でちょうど良い大きさです）。

---

## 7. 試作からいただく、絵以外のところ

いただいた試作には、いまの金具に無い良いところがありました。
**遊びを入れ替えなくても足せます。**

| 試作のしかけ | いまの金具 |
|---|---|
| 締まった瞬間の「カチッ」 | 音なし（`sfxClack()` はもう工房にあります） |
| 精密加工 COMBO | なし |
| 何度ずれたかの表示 | 外したときだけ出る |
| 終わりに「金具がはまりました」 | なし |

---

最終更新: 2026-10-20
