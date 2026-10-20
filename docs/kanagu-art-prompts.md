# 「金具」の絵 ── 生成プロンプト

いただいた設計シート（1024×1536・6画面＋金具の一覧）を**仕様として採用**します。
文字盤・針・赤い目標・三つの金属・完成の家具、どれも良い出来です。

> **大事なこと：この絵は、どちらの遊びでも使えます。**
> 「文字盤＋針＋赤い目標」は、いまの ⑨金具（指でなぞって合わせる）にも
> そのまま使えます。ですので**絵を先に揃えても、遊びの中身は後から決められます。**

---

## 0. シートのままでは使えないところ

| | |
|---|---|
| **大きさ** | 文字盤は 110〜230px。画面では**直径 400px ぶん**要ります |
| **針が文字盤に描きこまれている** | 針はゲームが回します。**別の絵**でください |
| **赤い矢印が描きこまれている** | 目標はゲームが置きます。**別**か、**描かない**でください |
| **光（PERFECT の輝き）** | ゲームが出します |
| **上の帯（残り時間・調整回数・スコア・COMBO）** | **工房の画面がすでに出しています。**二重になります |

> 釘打ち・鋸引きのときと同じです。
> **ゲームが動かすものは、絵に入れない。**これだけ守っていただければ、あとは全部使えます。

---

## 1. 共通の約束

どのプロンプトにも、この一文を頭に付けてください。

```
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture,
muted antique palette, soft edges, no harsh outlines, no photorealism,
calm and quiet, Japanese craft workshop atmosphere
```

そして、**どの絵にも入れてはいけないもの**。

```
no text, no letters, no numbers, no logos, no watermark,
no UI, no HUD, no buttons, no score, no timer, no combo bar,
no needle, no pointer, no hand, no red arrow, no glow, no sparkles,
no callout lines, no insets, no frames, no borders,
nothing cropped at the edge of the image
```

---

## 2. 文字盤　三枚　【必須・いちばん大事】

### これは何か

まん中に据わる円い金具。ここに針が重なって回ります。
**シートの「真鍮／鉄／黒い金属」を、そのまま三枚**でお願いします。

> 波ごとに金属が変わるようにします。
> **第1波 真鍮 → 第2波 鉄 → 第3波 黒い金属。**
> 許される狂いが小さくなっていくのと、手ざわりが揃います。

### サイズ

**1024 × 1024（正方形）**　背景は**透明**　を 三枚

### 大事なところ

- **まんまるに、絵のまん中に。**中心がずれると、回したとき目が回ります
- **針を描かないでください。**赤い矢印も、光も
- まわりに **5%ほどの余白**
- 影は付けないでください（ゲームが敷きます）

### プロンプト（真鍮）

```
（共通の約束）

---

a single round antique brass hardware plate seen from directly above,
perfectly circular and perfectly centred in the square,
a raised domed centre boss, a flat outer rim with eight small rivets
evenly spaced around it, fine concentric tooling marks, warm aged brass
with soft gold highlights and gentle patina, a little empty space all around

transparent background, no needle, no pointer, no arrow, no glow,
no shadow, no text, no numbers, no frame, no border,
the plate must not touch any edge of the image
```

**鉄**は `warm aged brass with soft gold highlights` を
`cool grey steel with soft silver highlights, lightly worn` に。

**黒い金属**は
`dark blackened iron with a faint blue-grey sheen, deeply aged` に差し替えてください。

**三枚とも、同じ大きさ・同じ形**でお願いします（金属の色だけが違う三枚）。

---

## 3. 針　【必須】

### これは何か

文字盤のうえで回る針。シートに描いてある、あの真鍮の針です。

### サイズ

**1024 × 1024（正方形）**　背景は**透明**

### 大事なところ

- **まっすぐ真上（12時）を向いた状態**で描いてください。ゲームが回します
- **回る中心が、絵のまん中**に来るように。
  針のおしりが短く、先が長い形なので、**中心＝軸のところ**です
- 文字盤は描かないでください。針だけ

### プロンプト

```
（共通の約束）

---

a single antique brass clock-style pointer needle seen from directly above,
pointing straight up, a short rounded tail below and a long tapering blade
above, a round pivot boss at the centre of the image where it turns,
warm aged brass with soft highlights, simple and sturdy

transparent background, no dial, no plate, no numbers, no text, no arrow,
no glow, no shadow, no hand, no frame, no border,
the pivot must sit exactly at the centre of the square
```

---

## 4. 取り付いた家具　【あると良い】

### これは何か

12回ぜんぶ締め終えたときに出る、ごほうびの絵。
シートの「完成！」の画面に描いてある、あのたんすです。

### サイズ

**1024 × 1024**　背景は**透明**か**真っ白**

### プロンプト

```
（共通の約束）

---

a small antique wooden nightstand seen from the front at a slight angle,
warm honey-brown oak, one drawer above and one door below,
a round brass knob on the drawer, a brass keyhole escutcheon on the door,
two brass hinges on the side, simple and sturdy, handmade, slightly worn,
standing alone and centred with space around it

transparent background, no shadow, no floor, no room, no sparkles,
no text, no numbers, no frame, no border
```

---

## 5. 丁番・引き手・鍵穴座　【あると嬉しい】

シートの一覧にあった三つです。**図鑑や結果の画面**で使えます。

### サイズ

**512 × 512** 各一枚　背景は**透明**

```
（共通の約束）

---

a single antique brass [ hinge / ring drawer pull / keyhole escutcheon ]
seen from directly above, centred with space around it,
warm aged brass with soft patina, simple and sturdy

transparent background, no shadow, no wood, no screws, no text, no numbers,
no frame, no border, nothing touching the edges
```

---

## 6. まとめ

| | 何 | サイズ | 枚数 | いちばん大事なこと |
|---|---|---|---|---|
| 1 | 文字盤 | 1024×1024・透明 | **3**（真鍮・鉄・黒） | **針と赤い矢印を描かない**・まんまる・まん中 |
| 2 | 針 | 1024×1024・透明 | 1 | **真上を向く**・軸が絵のまん中 |
| 3 | 取り付いた家具 | 1024×1024 | 1 | 影・床・きらきらを描かない |
| 4 | 丁番・引き手・鍵穴座 | 512×512・透明 | 3 | ふちに触れない |

**1と2があれば、入れ替えられます。**3と4は無くても遊べます。

---

## 7. 遊びの中身は、まだ決めていません

| | いまの ⑨金具 | いただいた試作・シート |
|---|---|---|
| やること | 指でなぞって、針を目標に**合わせる** | ひとりでに回る針を、目標で**止める** |
| 種類 | 合わせる（狙い） | 止める（間合い） |
| 回数・時間・波 | 12回・45秒・3波 | 12回・45秒・3波 |

**どちらでも、上の絵がそのまま使えます。**

ひとつだけお伝えしておくと、③鋸引き・④釘打ちがすでに「止める」遊びなので、
⑨も「止める」にすると**三つ目**になります。⑨⑩はわざと静かに終わる並びにして
あったので、そこだけ気になります。絵が届いてから、一緒に決めましょう。

---

## 8. 絵を待たずに入れられるもの

シートにあって、いまの金具に無いもの。**遊びをどちらに決めても入ります。**

| | いまの金具 |
|---|---|
| 締まった瞬間の「カチッ」 | 音なし（`sfxClack()` はもう工房にあります） |
| COMBO の帯 | なし |
| 「少しずれた…」のような、やさしい言いかた | 「⚠️ 12度ずれておる」とだけ |
| 波ごとに金属が変わる | なし |
| 終わりに、取り付いた家具が出る | なし |

---

## 9. いまの金具の寸法（記録）

盤は 300×300。

```
扉の板   x 30 … 270   y 56 … 244
文字盤   まん中 (150,150)　直径 124（外まわり r62）
針       長さ 80 ぶん（真横を 0度として回る）
緑の印   文字盤の上下、中心から 60〜78 のところ
許される狂い  第1波 20度 ／ 第2波 14度 ／ 第3波 9度（難度で割る）
```

1024の絵に直すと、文字盤は**直径 423**。
512の絵なら、まわりに 5% 余白でちょうど良い大きさです。

---

最終更新: 2026-10-20
