// =========================================================
// 発注書作成アプリ — フロントエンド
// =========================================================

const $ = (id) => document.getElementById(id);

// ---------- 設定（Apps Script URL）----------
const LS_ENDPOINT = "kawasaki_hatchu.endpoint";
const LS_TO_EMAIL = "kawasaki_hatchu.toEmail";

function loadSettings() {
  $("endpoint").value = localStorage.getItem(LS_ENDPOINT) || "";
  $("toEmail").value = localStorage.getItem(LS_TO_EMAIL) || "";
}
$("btn-save-endpoint").addEventListener("click", () => {
  localStorage.setItem(LS_ENDPOINT, $("endpoint").value.trim());
  setStatus("Apps Script URL を保存しました", "ok");
});
$("toEmail").addEventListener("change", () => {
  localStorage.setItem(LS_TO_EMAIL, $("toEmail").value.trim());
});

// ---------- 日付ヘルパー ----------
function toWareki(isoDate) {
  if (!isoDate) return "　年　月　日";
  const d = new Date(isoDate + "T00:00:00");
  // 令和は 2019-05-01 開始 → 令和年 = 西暦 - 2018
  const reiwa = d.getFullYear() - 2018;
  return `${reiwa}年 ${d.getMonth() + 1}月 ${d.getDate()}日`;
}
function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ---------- 製品テンプレート読込 ----------
let products = [];
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    products = await res.json();
    const sel = $("tpl");
    products.forEach((p, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.warn("products.json 読込失敗", e);
  }
}
$("tpl-apply").addEventListener("click", () => {
  const idx = $("tpl").value;
  if (idx === "") return;
  const p = products[idx];
  if (p.productName) $("productName").value = p.productName;
  if (p.size) $("size").value = p.size;
  if (p.unit) $("unit").value = p.unit;
  if (p.spec) $("spec").value = p.spec;
  if (p.note != null) $("note").value = p.note;
  updatePreview();
});

// ---------- プレビュー更新 ----------
function updatePreview() {
  $("pv-orderDate").textContent = toWareki($("orderDate").value);
  $("pv-dueDate").textContent = toWareki($("dueDate").value);
  $("pv-productName").textContent = $("productName").value || "（製品名）";
  $("pv-size").textContent = $("size").value || "（サイズ・材質）";
  $("pv-qty").textContent = $("qty").value || "";
  $("pv-unit").textContent = $("unit").value || "";

  // 仕上げ仕様：行ごとに＊
  const specBox = $("pv-spec");
  specBox.innerHTML = "";
  const lines = $("spec").value.split(/\r?\n/).filter((s) => s.trim() !== "");
  lines.forEach((line) => {
    const row = document.createElement("div");
    row.className = "spec-item";
    const b = document.createElement("span");
    b.className = "bullet"; b.textContent = "＊";
    const t = document.createElement("span"); t.textContent = line;
    row.append(b, t);
    specBox.append(row);
  });

  // 備考
  $("pv-note").textContent = $("note").value || "";

  // 件名自動生成（未編集の場合のみ）
  if (!subjectEditedByUser) {
    $("subject").value = makeSubject();
  }
}

function makeSubject() {
  const date = $("orderDate").value || todayISO();
  const d = new Date(date + "T00:00:00");
  const r = d.getFullYear() - 2018;
  const name = $("productName").value || "発注";
  return `【発注書】R${r}.${d.getMonth() + 1}.${d.getDate()} ${name}（㈲松永工房）`;
}
let subjectEditedByUser = false;
$("subject").addEventListener("input", () => { subjectEditedByUser = true; });

// 入力 → プレビュー リアルタイム反映
["orderDate", "dueDate", "productName", "size", "qty", "unit", "spec", "note"]
  .forEach((id) => $(id).addEventListener("input", updatePreview));
$("btn-preview").addEventListener("click", updatePreview);

// ---------- 図解画像 ----------
let diagramDataUrl = null;
$("diagram").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    diagramDataUrl = null;
    $("pv-diagram").innerHTML = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    diagramDataUrl = reader.result;
    $("pv-diagram").innerHTML = `<img src="${diagramDataUrl}" alt="図解">`;
  };
  reader.readAsDataURL(file);
});

// ---------- 印刷 / PDF保存 ----------
$("btn-print").addEventListener("click", () => {
  updatePreview();
  window.print();
});

// ---------- メール送信 ----------
$("btn-send").addEventListener("click", async () => {
  const endpoint = localStorage.getItem(LS_ENDPOINT);
  if (!endpoint) {
    setStatus("先に ⚙設定 で Apps Script URL を保存してください", "err");
    return;
  }
  if (!$("toEmail").value) {
    setStatus("送信先メールを入力してください", "err");
    return;
  }
  if (!$("productName").value || !$("orderDate").value) {
    setStatus("製品名と発注日は必須です", "err");
    return;
  }

  updatePreview();
  const payload = {
    to: $("toEmail").value,
    subject: $("subject").value || makeSubject(),
    orderDate: $("orderDate").value,
    dueDate: $("dueDate").value,
    productName: $("productName").value,
    size: $("size").value,
    qty: Number($("qty").value),
    unit: $("unit").value,
    spec: $("spec").value,
    note: $("note").value,
    diagram: diagramDataUrl,   // data: URL or null
    html: $("paper").outerHTML, // 発注書HTML全体（Apps Script 側でPDF化）
  };

  setStatus("送信中...", "");
  try {
    // CORS 回避のため text/plain で送る（Apps Script 側で JSON.parse）
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (out.ok) {
      setStatus(`✅ 送信しました（${out.to}）`, "ok");
    } else {
      setStatus(`❌ 失敗: ${out.error || "不明なエラー"}`, "err");
    }
  } catch (e) {
    setStatus(`❌ 通信エラー: ${e.message}`, "err");
  }
});

function setStatus(msg, cls) {
  const el = $("status");
  el.textContent = msg;
  el.className = cls || "";
}

// ---------- 初期化 ----------
(function init() {
  loadSettings();
  $("orderDate").value = todayISO();
  $("dueDate").value = todayISO(14);  // 仮の仕上り日：2週間後
  loadProducts().then(updatePreview);
})();
