# 「布張り」の絵 ── 生成プロンプト

> **未。**絵をいただいたら入れ替えます。いまは、コードで描いた平らな四角です。
> 矢印とまるい印（はらう向きの目印）は**画面の部品なので、絵にはしません**。

布張りの画面は、布の上に**しわ**が出て、矢印の向きへ指をはらう遊びです。
絵にするのは次の二つです。

| 番号 | 絵 | 置き場 | いただく形 |
|---|---|---|---|
| 1 | 布（下じき） | 画面いっぱい | 1024×1024・正方形 |
| 2 | しわ（3種） | しわの場所に重ねる | 512×512・白地に一つずつ |

「しわ」は、切り出して入れるので**白地で一つずつ**いただくのがいちばんきれいです。
（布の上に直接描くと、切り出すときに水彩がにじみます。）

---

## 1. 共通の約束

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
no UI, no buttons, no arrows, no frames, no borders,
nothing cropped at the edge of the image
```

---

## 2. 布（下じき）── 1024×1024

布を張り台に張った、真上からの眺めです。**しわは描かない**（しわは別に重ねます）。

```
Top-down view of a cream-coloured linen fabric stretched smooth over a
wooden upholstery frame, the cloth filling the entire square image edge to
edge, only a very faint weave texture and no wrinkles, soft even daylight
from the upper left, a few tiny warm highlights, faint pencil strokes in the
weave, centred square composition,
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture, muted antique
palette, soft edges, no harsh outlines, no photorealism, calm and quiet,
Japanese craft workshop atmosphere,
no text, no letters, no numbers, no logos, no watermark, no UI, no buttons,
no arrows, no frames, no borders, nothing cropped at the edge of the image
```

**色について。**いまの下じきは淡い緑です。生成り（上のプロンプト）は、ほかの木の絵と
いちばん合います。緑がよければ、`cream-coloured linen` を
`sage-green linen` に替えてください。

---

## 3. しわ（3種）── 512×512・白地

しわの絵は、**同じ光（左上から）と同じ紙の質感**でそろえます。
3種とも、**白い一面の上に一つだけ**描いてもらいます。

### 3-1 短いしわ（一本の折り目）

```
A single short soft crease in cream linen fabric, seen from directly above,
a shallow diagonal fold with a slightly darker shadow side, gentle edges,
isolated on a pure white background, the crease centred with generous white
margin on all sides,
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture, muted antique
palette, soft edges, no harsh outlines, no photorealism,
no text, no letters, no numbers, no logos, no watermark, no UI, no arrows,
no frames, no borders, nothing else in the image
```

### 3-2 長いしわ（ゆるい波）

```
A single long gentle wave-like crease in cream linen fabric, seen from
directly above, a soft sag running across the cloth with a slightly darker
shadow on one side, gentle edges, isolated on a pure white background, the
crease centred with generous white margin on all sides,
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture, muted antique
palette, soft edges, no harsh outlines, no photorealism,
no text, no letters, no numbers, no logos, no watermark, no UI, no arrows,
no frames, no borders, nothing else in the image
```

### 3-3 交差するしわ（くしゃっとした寄り）

```
A small crumpled cluster of cream linen fabric creases, seen from directly
above, two or three crossing soft folds meeting at one point, darker shadow
in the hollows, gentle edges, isolated on a pure white background, the
cluster centred with generous white margin on all sides,
soft watercolour and coloured-pencil children's picture-book illustration,
warm honey-brown wood, pale cream light, gentle paper texture, muted antique
palette, soft edges, no harsh outlines, no photorealism,
no text, no letters, no numbers, no logos, no watermark, no UI, no arrows,
no frames, no borders, nothing else in the image
```

---

## 4. いただいたあとの作業

- しわの三枚は、白地から**切り抜いて**透過にします（鋸引きや金具と同じ手順）。
- 布は、そのまま下じきに使います（切り抜きはしません）。
- しわは、ゲームの中で**はらう印の下**に、印の大きさに合わせて小さく置きます。
- 絵が届くまでは、いまの四角と印のままで遊べます。
