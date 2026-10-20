# 「金具」の絵 ── 生成プロンプト（揃えるゲーム）

遊びは**いまのまま**です。

> **ねじのまわりを指でなぞって、溝を印に合わせ、指を離して締める。**
> 12回（4＋4＋4）・45秒・3波。許される狂いは 20度 → 14度 → 9度。

採点も時間も波も、一行も変えません。**変わるのは絵だけ**です。

---

## 0. いちばん大事な二つ

### ① 絵柄を、ほかの山場に揃える

いただいた設計シートは、**工房のほかの絵より少し濃く、金属がつやつや**しています。
木の目利き・釘打ち・鋸引きと並べると、そこだけ浮きます。

```
    ほかの山場        やわらかい水彩　／　色えんぴつの線
                     紙の目が見える　／　影はうすい
                     金属もつや消し　／　輪郭線は引かない

    設計シート        厚い塗り　／　強いふち光　／　つやのある金属
```

下のプロンプトは、**ほかの山場のほうへ寄せて**書いてあります。

### ② ゲームが動かすものは、絵に入れない

釘打ち・鋸引きと同じ一行です。

| 絵に入れないもの | なぜ |
|---|---|
| 針・赤い矢印 | **目標の印はゲームが置きます**（毎回ちがう向きに） |
| 光・きらきら | 締まった瞬間にゲームが出します |
| 上の帯（残り時間・調整回数・スコア・COMBO） | **工房の画面がすでに出しています** |
| 引き出し線・丸い囲み・文字 | 説明図のしるしは要りません |

---

## 1. 共通の約束

**どのプロンプトにも、この一文を頭に付けてください。これが画風のかなめです。**

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
matte metal with gentle patina, no gloss, no rim light, no strong shadow,
calm and quiet, Japanese craft workshop atmosphere
```

そして、**どの絵にも入れてはいけないもの**。

```
no text, no letters, no numbers, no logos, no watermark,
no UI, no HUD, no buttons, no score, no timer, no combo bar,
no needle, no pointer, no arrow, no glow, no sparkles, no light rays,
no callout lines, no insets, no diagrams, no hands, no tools,
no frames, no borders, nothing cropped at the edge of the image
```

---

## 2. 扉の鏡板（背景）　【必須】

### これは何か

盤のうしろに敷く一枚。**300×300 の正方形**いっぱいに広がります。
この板に金具を取り付けていきます。

### サイズ

**1024 × 1024（正方形）**

### 画面の作り

```
 ┌──────────────────────────┐
 │  作業台のへり（少しだけ）      │ ← 上 1.5割
 │ ┌──────────────────┐ │
 │ │                          │ │
 │ │      ここは空に          │ │ ← 扉の鏡板
 │ │   （直径 420 ぶん）       │ │   画面の 18%〜82%
 │ │                          │ │
 │ └──────────────────┘ │
 │  作業台のへり               │ ← 下 1.5割
 └──────────────────────────┘
```

### プロンプト

```
（共通の約束）

---

a single cabinet door panel of warm honey oak lying flat on a workbench,
seen straight from directly above, the panel nearly filling the square with
a little of the worn workbench visible around its edges,
a plain raised centre panel inside a simple moulded frame,
freshly sanded and unmarked, soft morning light from the upper left,
quiet and still, square composition

no screws, no nails, no hinges, no knobs, no handles, no metal, no holes,
no marks on the panel, nothing in the centre of the panel,
no text, no numbers, no UI, no frame, no border
```

### 大事なところ

- **まん中は、きれいに空けてください。**そこに金具が据わります
- **金具は一つも描かないでください**（ゲームが乗せます）

---

## 3. 座金（下に敷く円い板）　三枚　【必須】

### これは何か

ねじの下に敷く、円い金具の台。**回りません。じっとしています。**

> シートの「真鍮・鉄・黒い金属」を、そのまま三枚でお願いします。
> **第1波 真鍮 → 第2波 鉄 → 第3波 黒い金属。**
> 許される狂いが 20度 → 14度 → 9度 と狭くなるのに合わせて、
> 金具も硬くなっていきます。シートを見て思いついた、良い並びです。

### サイズ

**1024 × 1024（正方形）**　背景は**透明**　を 三枚

### 大事なところ

- **まんまるに、絵のまん中に**
- **まん中に、ねじが据わる窪み**を。そこにねじの頭が重なります
- まわりに **5%ほどの余白**
- **影を付けないでください**（ゲームが敷きます）
- 三枚は**同じ形・同じ大きさ**。金属の色だけがちがう三枚に

### プロンプト（真鍮）

```
（共通の約束）

---

a single round antique brass backing plate seen from directly above,
perfectly circular and perfectly centred in the square,
a plain flat rim with eight tiny rivets evenly spaced around it,
a shallow round recess in the very centre where a screw would sit,
matte aged brass with soft warm patina, gently worn edges,
painted in soft watercolour with a visible paper grain,
a little empty space all around it

transparent background, no screw, no slot, no needle, no pointer, no arrow,
no glow, no shadow, no wood, no text, no numbers, no frame, no border,
the plate must not touch any edge of the image
```

**鉄**は `matte aged brass with soft warm patina` を
`matte grey steel with a soft cool sheen, lightly rusted at the edges` に。

**黒い金属**は
`matte blackened iron with a faint blue-grey bloom, deeply aged` に差し替えてください。

---

## 4. ねじの頭　【必須・いちばん大事】

### これは何か

**指でなぞって回す、そのもの**です。溝（すり割り）を、緑の印に合わせます。

### サイズ

**1024 × 1024（正方形）**　背景は**透明**

### 大事なところ（ここだけは、どうかお願いします）

- **まんまるに、絵のまん中に。**中心がずれると、回したとき目が回ります
- **溝は、きっかり水平に。**斜めだと、ゲームの角度とずれます
- **溝は、頭のはしからはしまで**まっすぐ通してください
- 上下をひっくり返しても同じ形に見えること（**溝は左右対称**）
- まわりに **8%ほどの余白**
- 影は付けないでください

### プロンプト

```
（共通の約束）

---

a single large flat-head slotted screw seen from directly above,
perfectly circular and perfectly centred in the square,
one straight slotted groove running exactly horizontally right across
the middle of the head from edge to edge, the groove the same at both ends,
matte aged brass with a soft warm patina and fine turning marks,
painted in soft watercolour with a visible paper grain,
a generous empty margin all around it

transparent background, no shadow, no plate, no wood, no screwdriver,
no hand, no needle, no arrow, no glow, no text, no numbers,
no frame, no border, the screw must not touch any edge of the image
```

---

## 5. 取り付いたたんす　【あると良い】

### これは何か

12本ぜんぶ締め終えたときに出る、ごほうびの絵。
シートの「完成！」に描いてあった、あのたんすです。
（鋸引きの「切り出した木」と同じ役どころです）

### サイズ

**1024 × 1024**　背景は**透明**か**真っ白**

### プロンプト

```
（共通の約束）

---

a small antique wooden nightstand seen from the front at a slight angle,
warm honey-brown oak, one drawer above and one door below,
a round brass knob on the drawer, a small brass keyhole plate on the door,
two brass hinges at the side, simple and sturdy, handmade, slightly worn,
standing alone and centred with space around it,
painted in soft watercolour with a visible paper grain

transparent background, no shadow, no floor, no room, no sparkles,
no glow, no text, no numbers, no frame, no border
```

---

## 6. 丁番・引き手・鍵穴座　【あると嬉しい】

シートの一覧にあった三つです。図鑑や結果の画面で使えます。

### サイズ

**512 × 512** 各一枚　背景は**透明**

```
（共通の約束）

---

a single antique brass [ door hinge / ring drawer pull / keyhole escutcheon ]
seen from directly above, centred with space around it,
matte aged brass with soft patina, simple and sturdy,
painted in soft watercolour with a visible paper grain

transparent background, no shadow, no wood, no screws, no glow,
no text, no numbers, no frame, no border, nothing touching the edges
```

---

## 7. まとめ

| | 何 | サイズ | 枚数 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | 扉の鏡板 | 1024×1024 | 1 | **まん中を空ける**・金具を描かない |
| 2 | 座金 | 1024×1024・透明 | **3**（真鍮・鉄・黒） | まんまる・まん中・三枚そろえる |
| 3 | ねじの頭 | 1024×1024・透明 | 1 | **溝はきっかり水平**・まんまる・まん中 |
| 4 | 取り付いたたんす | 1024×1024 | 1 | 影・床・きらきらを描かない |
| 5 | 丁番・引き手・鍵穴座 | 512×512・透明 | 3 | ふちに触れない |

**1・2・3 があれば、入れ替えられます。**4と5は無くても遊べます。
（座金は、まず真鍮の一枚だけでも始められます）

いただいたら、こちらで WebP にして HTML の中に入れます
（鋸引きと同じで、外から読みにいきません。合わせて 120KB ほどになります）。

---

## 8. 絵を当てはめる寸法（記録）

盤は 300×300。

```
扉の板   x 30 … 270   y 56 … 244
座金     まん中 (150,150)　直径 124
ねじの頭 まん中 (150,150)　直径 108
溝       長さ 80・太さ 10（真横を 0度として、180度で一周ぶん）
緑の印   中心から 60〜78 のところに、上下ひと組
許される狂い  第1波 20度 ／ 第2波 14度 ／ 第3波 9度（難度で割る）
```

1024の絵に直すと、座金は**直径 423**、ねじの頭は**直径 369**。
どちらも、まわりに余白を取った 1024 の絵でちょうど良い大きさです。

---

## 9. 絵を待たずに入れられるもの

シートにあって、いまの金具に無いもの。**先に入れられます。**

| | いまの金具 |
|---|---|
| 締まった瞬間の「カチッ」 | 音なし（`sfxClack()` はもう工房にあります） |
| COMBO の帯 | なし |
| 「少しずれた…」のような、やさしい言いかた | 「⚠️ 12度ずれておる」とだけ |
| 波ごとに金具が変わる | なし |
| 終わりに、取り付いた家具が出る | なし |

---

最終更新: 2026-10-20
