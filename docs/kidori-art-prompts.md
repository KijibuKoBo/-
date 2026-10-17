# 「木取り」の絵 ── 生成プロンプト

画風は、工房のゲームとおなじ**水彩の絵本風**です。
いただいた「木の目利き」の工房・職人・板と、同じ世界の絵になるように書いてあります。

---

## 0. まず、共通の約束

どのプロンプトにも、この一文をそのまま頭に付けてください。
**これが画風のかなめ**です。

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
calm and quiet, Japanese craft workshop atmosphere
```

そして、**どの絵にも入れてはいけないもの**。

```
no text, no letters, no numbers, no logos, no watermark,
no UI, no buttons, no frames, no borders, no grid lines,
no people, no hands, no tools lying on top
```

> **なぜここまで書くか**
> 前にいただいた工房の絵は、板と職人が**絵に焼きこまれて**いたので、
> ゲームが自分で描く板や人と二重になりました。消そうとすると、にじみます。
> **ゲームが上に描くものは、絵に入れない**のが鉄則です。

---

## 1. 工房の背景　【必須】

### これは何か

盤のうしろに敷く一枚。**300×300 の正方形**いっぱいに広がります。

### ご提案

**「木の目利き」と同じ工房を、上から見たところ**にしませんか。
あちらは職人が作業台の前に立っている絵。こちらは**その作業台を、上からのぞきこんだ絵**。
同じ部屋・同じ光で、二つのゲームが地続きになります。

### サイズ

**1024 × 1024（正方形）**

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
calm and quiet, Japanese craft workshop atmosphere

--- 

looking straight down onto an empty wooden workbench in a small woodworking
workshop, soft morning light falling from the upper left, the worn bench top
fills the whole square, a few faint pencil marks and old tool dents on the
surface, a thin scattering of pale sawdust near the edges, the very edge of
a wooden ruler and a small plane peeking in from the far corners only,
everything soft and warm, top-down flat view, square composition

no text, no letters, no numbers, no logos, no watermark,
no UI, no buttons, no frames, no borders, no grid lines,
no people, no hands, no boards or planks on the bench, nothing in the centre
```

### 大事なところ

- **まん中は、ほぼ空けてください。**そこに板が乗ります（盤は 234×180 ぶん）
- 道具は**四隅のはしだけ**。中央に置かれると、板の下に隠れて無駄になります
- **板や木材は描かないでください**（ゲームが描きます）

---

## 2. 一枚板　【必須・いちばん大事】

### これは何か

**節のない、まっさらな板**。ここから部材を切り出します。
8×6 のマスに切って使いますが、**マスの線は描かないでください**（ゲームが引きます）。

### サイズ

**1152 × 864（きっかり 4:3）**

> 画面では 216×162 に縮みます。4:3 からずれると、マスがゆがみます。
> **多めに描いていただければ、こちらで 4:3 に切ります。**

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism

---

a single clean rectangular plank of pale honey oak seen flat from directly
above, filling the entire frame edge to edge, long straight wood grain running
horizontally across the whole board, the grain continuous and even from left
edge to right edge, a few soft darker grain lines, gentle warm colour
variation, smooth planed surface, evenly lit with no strong shadow,
flat top-down view, 4:3 rectangle

no knots, no holes, no cracks, no splits, no dark spots,
no text, no numbers, no grid lines, no cut marks, no borders, no frame,
no background, no table under it, the plank fills the whole image
```

### 大事なところ

- **節を一つも描かないでください。**節はゲームが、毎回ちがう場所に置きます
- 木目は**左のはしから右のはしまで、途切れずに**。真ん中で切れていると、
  マスの境目のように見えてしまいます
- 影や縁取りを付けないでください。板だけが、画面いっぱいに

---

## 3. 節　【必須】

### これは何か

板に散らす節。**1マス（27×27）**にぴったり収まります。
毎回ちがう場所に、2〜6個置かれます。

### サイズ

**512 × 512 の正方形を、3〜4種類**（形がちがうもの）
背景は**透明**（または**真っ白**。こちらで抜きます）

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, muted antique palette, soft edges, no photorealism

---

a single wood knot seen from directly above, a dark amber-brown oval whorl
with concentric rings swirling around it, the grain of the surrounding wood
bending gently around the knot, centred in the square, soft watercolour edges
fading out at the rim so it can sit on a wooden board,
four slightly different versions: round, oval, small and tight, large and swirling

transparent background, no shadow, no drop shadow, no outline ring,
no text, no numbers, no frame, no border
```

### 大事なところ

- **ふちを、ふわっと溶かしてください。**板の上に重ねるので、
  四角い切り口が見えると浮きます
- **影を付けないでください。**前の板の絵では、影が白いふちになって残りました

---

## 4. 切り出した部材　【必須】

### これは何か

板から取った部材。ゲームには**六つの形**があります。

| 部材 | マス | 画面の大きさ | **縦横比** |
|---|---|---|---|
| 扉板 | 2×3 | 54×81 | **2 : 3** |
| 側板 | 1×4 | 27×108 | **1 : 4** |
| 天板 | 3×1 | 81×27 | **3 : 1** |
| 棚板 | 3×2 | 81×54 | **3 : 2** |
| 鏡板 | 2×2 | 54×54 | **1 : 1** |
| 台輪 | 4×1 | 108×27 | **4 : 1** |

### おすすめは「六つ描く」より「一枚のタイル」

比がずれると、ゲームの中で引き伸ばされて**木目がゆがみます**。
六つ別々に描くと、六回ずれる機会があります。

そこで **正方形の「切り立ての木肌」を一枚**だけ作って、
ゲーム側で六つの形に切り出すほうが、確実で、見た目もそろいます。

### サイズ

**1024 × 1024（正方形）** を一枚

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no photorealism

---

a seamless square swatch of freshly cut oak, seen flat from directly above,
slightly paler and warmer than an old weathered board, as if just sawn,
fine straight grain running horizontally, a soft golden sheen,
even lighting, no shadow, the texture fills the whole square and tiles
seamlessly left to right and top to bottom

no knots, no edges, no borders, no frame, no text, no numbers,
no background, no object, just the wood surface
```

### 六つ別々に描きたい場合

そのときは、**それぞれの比をプロンプトに書いて**ください。たとえば扉板なら：

```
（共通の約束）
---
a single rectangular piece of freshly cut oak seen flat from directly above,
tall portrait rectangle exactly 2 units wide by 3 units tall,
clean sawn edges, fine horizontal grain, warm golden tone,
isolated on pure white, no shadow
---
no knots, no text, no numbers, no border, no shadow, no background
```

比のところを **1:4 / 3:1 / 3:2 / 1:1 / 4:1** に差し替えて、六枚。
**白地・影なし**でお願いします（影があると、抜いたときに白いふちが残ります）。

---

## 5. 組み上がった家具　【あると良い】

### これは何か

三波ぶん9枚を取りきったときに出る、**ごほうびの絵**。
いまは取った部材が飛んでいって、家具の形に組み上がります。
その**組み上がった姿**を一枚絵にすると、もっと気持ちよく終われます。

### サイズ

**1024 × 1024（正方形）**　背景は**透明**か**真っ白**

### プロンプト

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no photorealism

---

a small finished wooden cabinet seen from the front, made of pale honey oak,
a flat top board, two side panels, one wide panel across the upper front,
two shelves, two small doors below with tiny round brass knobs,
a low plinth at the base, simple and sturdy, handmade, slightly worn,
standing alone, centred, full view with a little space around it

transparent background, no shadow, no floor, no room,
no text, no numbers, no border, no frame, no people
```

---

## 6. まとめ

| | 何 | サイズ | 背景 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | 工房の背景 | 1024×1024 | — | **まん中を空ける**・板を描かない |
| 2 | 一枚板 | 1152×864（4:3） | — | **節を描かない**・木目を端まで通す |
| 3 | 節 | 512×512 ×3〜4 | 透明 | **ふちを溶かす**・影なし |
| 4 | 切り立ての木肌 | 1024×1024 | — | **継ぎ目なく**つながる |
| 5 | 組み上がった家具 | 1024×1024 | 透明 | 影・床・部屋を描かない |

**1〜4があれば、入れ替えられます。**5は無くても遊べます。

いただいたら、こちらで切り出して埋めこみます
（「木の目利き」のときと同じで、**WebPにしてHTMLの中に入れる**ので、
外から読みにいきません）。

---

最終更新: 2026-10-17
