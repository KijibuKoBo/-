# カワサキ宛 発注書アプリ

㈲松永工房（木地部）から株式会社カワサキへの発注書をブラウザで作成し、
Gmailから自動送信するWebアプリです。

## 使い方（公開後）

1. ブラウザで公開URLを開く
2. 製品テンプレートを選択（または手入力）
3. 数量・日付・備考を入力。必要なら図解画像をアップロード
4. プレビュー確認 → 「送信」ボタン
5. カワサキ宛にPDF添付メールが届く

## 開発者向け

- 詳細は [CLAUDE.md](./CLAUDE.md) を参照
- フロントエンド: `web/`（GitHub Pages で公開）
- バックエンド: `apps-script/`（Google Apps Script に貼り付け）
- デプロイ手順: [docs/deploy-apps-script.md](./docs/deploy-apps-script.md)

---

## 🎣 おまけ：用宗シラス漁ものがたり（ゲーム）

用宗漁港を舞台にしたシラス漁の経営シミュレーションゲームを `game/` に追加しました。
ブラウザで `game/index.html` を開くだけで遊べます。詳細は [game/README.md](./game/README.md) を参照。
