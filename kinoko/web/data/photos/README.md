# 写真の置き場所

ここに採集写真などの画像を置きます。ファイルを置くと、サイト側のプレースホルダが
自動でその写真に差し替わります（読み込めない場合はプレースホルダのまま）。

## 使う場所とファイル名

| 用途 | 参照方法 | 推奨ファイル名 |
| --- | --- | --- |
| ヒーロー背景（任意） | `style.css` の `--hero-photo` で指定 | `hero.jpg` |
| 石原巖さんのプロフィール写真 | `index.html` の ABOUT 内 `data-photo` | `profile.jpg` |
| 各キノコの写真 | `records.json` の `"photo"` | 例 `nameko-2024.jpg` |
| コラムの写真 | `columns.json` の `"image"` | 例 `column-01.jpg` |

## 推奨
- 横向き・長辺 2000px 以上（書籍化で活きます）
- JPEG（写真）/ PNG（図）。1枚あたり 2MB 前後までに圧縮すると表示が軽い

## ヒーロー背景を設定するには
`style.css` の `:root` に次の1行を足します（`hero.jpg` をこのフォルダに置いた場合）：

```css
:root { --hero-photo: url("data/photos/hero.jpg"); }
```
