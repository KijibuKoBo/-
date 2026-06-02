/**
 * 発注書 メール送信エンドポイント
 *
 * フロントエンド (web/app.js) から POST されるペイロード:
 * {
 *   to:         "kawasaki@example.co.jp",
 *   subject:    "【発注書】R8.6.2 MPラウンド1200（㈲松永工房）",
 *   orderDate:  "2026-06-02",
 *   dueDate:    "2026-06-26",
 *   productName:"MPダイニングテーブル ラウンドタイプ 1200",
 *   size:       "1210×1210× 9MDF",
 *   qty:        10,
 *   unit:       "枚",
 *   spec:       "片面オーク柾目45°\n裏面捨て貼り",
 *   note:       "9MDF 搬入のタイミングを連絡ください。",
 *   diagram:    "data:image/png;base64,..."  // または null
 *   html:       "<div class=\"paper\">...発注書HTML全体...</div>"
 * }
 *
 * デプロイ:
 *   公開 → デプロイ → 新しいデプロイ → 種類: ウェブアプリ
 *   実行するユーザー: 自分 (kijibu.kobo@gmail.com)
 *   アクセス権      : 全員
 */

const SENDER_NAME = "㈲松永工房 木地部 石原";
const BCC = ""; // 自分宛にも控えが欲しい場合: "kijibu.kobo@gmail.com"

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 必須チェック
    if (!data.to)          throw new Error("送信先メール (to) が未指定");
    if (!data.productName) throw new Error("製品名が未指定");
    if (!data.orderDate)   throw new Error("発注日が未指定");

    // PDF を生成
    const pdfBlob = buildPdfBlob(data);

    // 本文（プレーンテキスト）
    const body = buildBody(data);

    // 送信
    GmailApp.sendEmail(data.to, data.subject || buildSubject(data), body, {
      name: SENDER_NAME,
      attachments: [pdfBlob],
      bcc: BCC || undefined,
    });

    return json({ ok: true, to: data.to });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

// GET でアクセスされたとき用（動作確認）
function doGet() {
  return ContentService.createTextOutput(
    "発注書送信エンドポイント稼働中。POST してください。"
  );
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildSubject(d) {
  const date = new Date(d.orderDate + "T00:00:00");
  const r = date.getFullYear() - 2018;
  return `【発注書】R${r}.${date.getMonth()+1}.${date.getDate()} ${d.productName}（㈲松永工房）`;
}

function buildBody(d) {
  const wareki = (iso) => {
    if (!iso) return "";
    const x = new Date(iso + "T00:00:00");
    return `令和${x.getFullYear() - 2018}年${x.getMonth()+1}月${x.getDate()}日`;
  };
  return [
    "株式会社カワサキ",
    "ご担当者様",
    "",
    "いつもお世話になっております。",
    "㈲松永工房 木地部 石原です。",
    "",
    "下記のとおり発注いたします。詳細は添付の発注書をご確認ください。",
    "",
    `  発注日   : ${wareki(d.orderDate)}`,
    `  仕上り日 : ${wareki(d.dueDate)}`,
    `  品目     : ${d.productName}`,
    `  サイズ   : ${d.size || ""}`,
    `  数量     : ${d.qty}${d.unit || ""}`,
    d.spec ? `  仕上げ   : ${d.spec.replace(/\n/g, " / ")}` : "",
    d.note ? `  備考     : ${d.note}` : "",
    "",
    "何卒よろしくお願いいたします。",
    "",
    "―――――",
    "㈲松永工房",
    "担当 石原賢",
    "TEL 054-277-0510 / 080-8742-4443",
  ].filter(s => s !== "").join("\n");
}

/**
 * フロントから受け取った発注書HTMLを PDF Blob に変換。
 * Drive 一時ファイルとして書き、getAs("application/pdf") で取得。
 */
function buildPdfBlob(d) {
  const html = wrapPrintableHtml(d);
  const tempName = `発注書_${d.orderDate}_${d.productName}.html`;
  const htmlBlob = Utilities.newBlob(html, "text/html", tempName);

  // Drive 経由で PDF 化
  const file = DriveApp.createFile(htmlBlob);
  const pdfBlob = file.getAs("application/pdf")
    .setName(`発注書_${d.orderDate}_${d.productName}.pdf`);

  // 一時ファイルはゴミ箱へ
  file.setTrashed(true);

  return pdfBlob;
}

/**
 * Apps Script の HTML→PDF 変換は外部 CSS/画像を読まないので、
 * フロントが送ってきた HTML をスタンドアロンな HTML に包み直す。
 */
function wrapPrintableHtml(d) {
  const css = `
    @page { size: A4 portrait; margin: 14mm 18mm; }
    body { font-family: "Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif; color: #1a1a1a; }
    .paper { width: 174mm; }
    .doc-title { text-align: center; font-size: 26pt; font-weight: 700; letter-spacing: 0.4em; margin: 0 0 12pt; }
    .header-box, .body-box, .footer-box { border: 1.2pt solid #222; padding: 10pt 14pt; }
    .body-box, .footer-box { border-top: none; }
    .header-box { display: table; width: 100%; }
    .header-box .recipient, .header-box .dates { display: table-cell; vertical-align: middle; }
    .recipient .lg { font-size: 16pt; font-weight: 600; }
    .recipient { font-size: 13pt; }
    .dates { font-size: 11pt; text-align: right; line-height: 1.9; }
    .body-box { min-height: 380pt; font-size: 12pt; }
    .product-line { font-size: 14pt; margin-bottom: 10pt; }
    .spec-line { margin-bottom: 6pt; }
    .qty { font-size: 14pt; font-weight: 600; float: right; }
    .spec-item { margin-bottom: 4pt; }
    .note { margin-top: 10pt; white-space: pre-wrap; }
    .note:not(:empty)::before { content: "＊ "; }
    .diagram-area { margin-top: 12pt; text-align: center; }
    .diagram-area img { max-width: 70%; max-height: 200pt; }
    .footer-box { display: table; width: 100%; }
    .sender, .tels { display: table-cell; }
    .sender { font-size: 13pt; line-height: 1.8; }
    .tels { font-size: 12pt; text-align: right; line-height: 1.8; }
  `;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
    <title>発注書</title><style>${css}</style></head>
    <body>${d.html || ""}</body></html>`;
}
