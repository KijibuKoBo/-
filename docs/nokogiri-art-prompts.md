# 「鋸引き」の絵 ── 生成プロンプト

いただいた試作（`sawing_minigame.zip`）、**遊びの作りはそのままで結構です。**
うちの ③鋸引き と、ほとんど同じものでした。

| | いただいた試作 | 工房の中の鋸引き |
|---|---|---|
| 切る回数 | 20 | **20**（6＋7＋7） |
| 波 | 3 | 3 |
| 判定 | 緑の帯。まん中ほど高得点 | 緑の帯。まん中ほど高得点 |
| 時間 | 60秒（仮） | **40秒** |

ですので、**入れ替えるのは絵だけ**です。
ところが、いただいた4枚は**そのままでは使えません**でした。

---

## 1. なぜ使えないか

4枚とも、**大きな一枚絵から切り出したもの**で、絵が縁で切れています。

| 絵 | 中身 |
|---|---|
| `handsaw.png` | **刃先と歯が、ありません。**柄と刃の付け根だけ。上に板のはしが写りこんでいます |
| `plank.png` | 板の**右と下が切れています**（板の下のふちが無い） |
| `shavings.png` | 削りくずの上下に、**鋸の柄と歯が混ざって**います |
| `cut_block.png` | ほとんど空。左上に鋸の歯、下に木のはしが少し |

とくに**鋸に歯がない**のが致命的です。鋸引きの絵で、歯のない鋸は使えません。

> 「木の目利き」のときと同じで、**消したり継いだりすると水彩がにじみます。**
> 一枚ずつ、**まるごと入った絵**をいただくのがいちばんきれいです。

---

## 2. 共通の約束

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
no UI, no buttons, no score, no timer, no frames, no borders,
nothing cropped at the edge of the image
```

最後の一行が、今回いちばん大事です。
**絵のどの部分も、画面のふちで切らないでください。**

---

## 3. 工房と、材の板　【必須】

### これは何か

盤のうしろに敷く一枚。**300×300 の正方形**いっぱいに広がります。
板は**ここに描きこんでいただいて結構です**（鋸と削りくずだけ、ゲームが動かします）。

### サイズ

**1024 × 1024（正方形）**

### 板の置き場所

```
 ┌──────────────────────────┐
 │  工房のおく（棚・窓・道具）      │ ← 上 半分
 │                              │
 │ ══════════════════════ │ ← 板（上から 50% 〜 82%）
 │                              │   左のはしから右のはしまで
 │  作業台の手前               │ ← 下
 └──────────────────────────┘
```

- 板は**左のはしから右のはしまで**、まっすぐ水平に渡してください
- 板の**上のふちも下のふちも、きちんと見える**ように
- 板の上には**何も置かないでください**（鋸も、線も、印も）

### プロンプト

```
（共通の約束）

---

inside a small woodworking workshop, a long clean plank of pale honey oak
lying flat and level across a sturdy workbench, seen straight from the front,
the plank spanning the full width of the picture from edge to edge,
its top and bottom edges both clearly visible, smooth and unmarked,
behind it the workshop wall with shelves, hand tools hanging, a window
with soft morning light, warm and quiet,
square composition, the plank sits across the middle of the square

no saw, no cut, no kerf, no pencil line, no marks on the plank,
no sawdust, no shavings, no hands, no people,
no text, no letters, no numbers, no UI, no frame, no border
```

---

## 4. 鋸　【必須・いちばん大事】

### これは何か

板の上を、左右に行き来します。**歯が、板の上のふちに触れる**ように置きます。

### サイズ

**1024 × 512**　背景は**透明**（または真っ白）

### 大事なところ

- **鋸ぜんぶが、絵の中に収まっていること。**柄のおしりも、刃先も
- **歯は、下のふちに沿って**。ここで木を挽きます
- まわりに**2〜3%の余白**を空けてください（ふちで切れないように）
- 影は付けないでください

### プロンプト

```
（共通の約束）

---

a complete traditional hand saw seen from the side, the whole tool inside
the frame with a little empty space all around it,
the wooden handle at the left, the steel blade extending to the right and
tapering to a rounded tip, a full row of sharp saw teeth running along the
entire bottom edge of the blade from the handle to the tip,
warm honey-brown handle with two brass screws, soft grey-blue steel blade,
lying level and horizontal

transparent background, no shadow, no motion lines, no sparks, no sawdust,
no hand, no arm, no wood, no plank, no workbench,
no text, no numbers, no frame, no border,
the saw must not touch or run off any edge of the image
```

> いただいた `handsaw.png` との違いは、**歯と刃先が入っていること**と、
> **まわりに余白があること**の二つだけです。

---

## 5. 削りくず　【あると良い】

挽いた瞬間に、挽き目から飛びます。

### サイズ

**512 × 512**　背景は**透明**

### プロンプト

```
（共通の約束）

---

four or five separate curled wood shavings and small sawdust chips,
pale cream and honey coloured, scattered loosely across the square
with clear space between them, each one whole and complete,
seen from the side, light and airy

transparent background, no shadow, no saw, no blade, no teeth,
no plank, no workbench, no tools, no text, no numbers,
nothing touching the edges of the image
```

---

## 6. まとめ

| | 何 | サイズ | 背景 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | 工房と材の板 | 1024×1024 | — | **板を端から端まで**・板の上に何も置かない |
| 2 | 鋸 | 1024×512 | 透明 | **歯と刃先を入れる**・まわりに余白 |
| 3 | 削りくず | 512×512 | 透明 | ばらばらに・ふちに触れない |

**1と2があれば、入れ替えられます。**3は無くても遊べます。

いただいたら、こちらで WebP にして HTML の中に入れます
（「釘打ち」と同じで、外から読みにいきません。合わせて 150KB ほどになります）。

---

## 7. 試作からいただく、絵以外のところ

試作には、いまの鋸引きに無い良いところがありました。
**絵を待たずに入れられます**ので、ご希望があれば先に入れます。

| 試作のしかけ | いまの鋸引き |
|---|---|
| 挽いた跡が板に残っていく | 挽き目が左から伸びるだけ |
| 挽いた瞬間に、くずが飛ぶ | なし |
| 挽き終わると、切り出した木が出る | なし |

採点・時間・波の組み立ては、いまのまま一行も変えません
（「釘打ち」のときと同じやりかたです）。

---

## 8. いまの鋸引きの寸法（記録）

絵を当てはめるときに使う数字です。盤は 300×300。

```
板    x 30 … 270（幅240）  y 150 … 246（高さ96）
帯    y は板と同じ。幅は 第1波 54 ／ 第2波 40 ／ 第3波 28
      置き場所は毎回ちがう（x 50 〜 250−幅）
鋸    x 32 … 268 を行き来する
挽き目 x 30 から右へ、20回で 240 まで伸びる
```

1024の絵に直すと、板は **y 512 … 840**、**x 102 … 922** にあたります。

---

最終更新: 2026-10-20
