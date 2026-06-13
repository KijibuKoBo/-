/* =========================================================
   管理ページ  —  記録の追加・編集 → GitHubへ直接公開
   依存ライブラリなし。トークンはこの端末のブラウザのみに保存。
   ========================================================= */

const CFG_KEY = "kinoko_admin_cfg";
const RECORDS_PATH = "kinoko/web/data/records.json";
const PHOTO_DIR = "kinoko/web/data/photos";

const DEFAULT_CFG = { token: "", owner: "KijibuKoBo", repo: "-", branch: "main", pin: "" };

let cfg = loadCfg();
let records = [];          // 現在のローカル表示用
let pendingPhotoB64 = null; // 圧縮済み写真（base64・プレフィックス無し）

const $ = (s) => document.querySelector(s);

/* ---------------- 起動 ---------------- */
boot();

function boot() {
  fillSettingsForm();
  bindUI();
  loadRecordsLocal();

  if (cfg.pin) {
    showLock();
  } else {
    unlock();
  }
}

function showLock() {
  $("#lock").hidden = false;
  $("#pinInput").focus();
}
function unlock() {
  $("#lock").hidden = true;
  $("#adminMain").hidden = false;
}

/* ---------------- 設定 ---------------- */
function loadCfg() {
  try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY) || "{}") }; }
  catch { return { ...DEFAULT_CFG }; }
}
function saveCfg() { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

function fillSettingsForm() {
  $("#cfgToken").value = cfg.token || "";
  $("#cfgOwner").value = cfg.owner || "";
  $("#cfgRepo").value = cfg.repo || "";
  $("#cfgBranch").value = cfg.branch || "";
  $("#cfgPin").value = cfg.pin || "";
}

/* ---------------- UIバインド ---------------- */
function bindUI() {
  $("#gearBtn").addEventListener("click", () => {
    const p = $("#settingsPanel");
    p.hidden = !p.hidden;
  });

  $("#saveCfgBtn").addEventListener("click", () => {
    cfg.token = $("#cfgToken").value.trim();
    cfg.owner = $("#cfgOwner").value.trim() || DEFAULT_CFG.owner;
    cfg.repo = $("#cfgRepo").value.trim() || DEFAULT_CFG.repo;
    cfg.branch = $("#cfgBranch").value.trim() || DEFAULT_CFG.branch;
    cfg.pin = $("#cfgPin").value.trim();
    saveCfg();
    status("#cfgStatus", "✓ 設定を保存しました", "ok");
  });

  $("#testBtn").addEventListener("click", testConnection);

  // PINロック
  $("#pinBtn").addEventListener("click", checkPin);
  $("#pinInput").addEventListener("keydown", (e) => { if (e.key === "Enter") checkPin(); });

  // 編集対象の切替
  $("#editSelect").addEventListener("change", (e) => {
    const id = e.target.value;
    if (!id) { clearForm(); return; }
    const r = records.find((x) => x.id === id);
    if (r) fillForm(r);
  });
  $("#resetBtn").addEventListener("click", () => { $("#editSelect").value = ""; clearForm(); });

  // 写真選択 → 圧縮 & プレビュー
  $("#f_photo").addEventListener("change", onPhotoSelected);

  $("#previewBtn").addEventListener("click", showPreview);
  $("#publishBtn").addEventListener("click", publish);

  // モーダル
  $("#modal").addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

function checkPin() {
  if ($("#pinInput").value === cfg.pin) { unlock(); }
  else { $("#pinErr").hidden = false; }
}

/* ---------------- ローカル記録読み込み（編集候補・ID採番用） ---------------- */
async function loadRecordsLocal() {
  try {
    const res = await fetch("data/records.json", { cache: "no-store" });
    const data = await res.json();
    records = data.records || [];
  } catch { records = []; }
  const sel = $("#editSelect");
  records
    .slice()
    .sort((a, b) => (a.kana || a.wamei).localeCompare(b.kana || b.wamei, "ja"))
    .forEach((r) => {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = `${r.wamei}（${r.date}）`;
      sel.appendChild(o);
    });
}

/* ---------------- フォーム入出力 ---------------- */
function fillForm(r) {
  $("#f_wamei").value = r.wamei || "";
  $("#f_kana").value = r.kana || "";
  $("#f_gakumei").value = r.gakumei || "";
  $("#f_family").value = r.family || "";
  $("#f_edibility").value = r.edibility || "食用";
  $("#f_date").value = r.date || "";
  $("#f_area").value = r.area || "";
  $("#f_elevation").value = r.elevation || "";
  $("#f_season").value = r.season || "";
  $("#f_weather").value = r.weather || "";
  $("#f_habitat").value = r.habitat || "";
  $("#f_host").value = r.host || "";
  $("#f_quantity").value = r.quantity || "";
  $("#f_aka").value = (r.aka || []).join(", ");
  $("#f_lookalikes").value = (r.lookalikes || []).join(", ");
  $("#f_rating").value = r.rating ?? "";
  $("#f_taste").value = r.taste || "";
  $("#f_notes").value = r.notes || "";
  $("#f_caution").value = r.caution || "";
  // 既存写真があればプレビュー（差し替えなければそのまま使う）
  pendingPhotoB64 = null;
  $("#f_photo").value = "";
  const ph = $("#photoPreview");
  if (r.photo) {
    ph.innerHTML = `<img src="${r.photo}" alt="" />`;
  } else {
    ph.innerHTML = `<div class="ph" data-label="写真未選択"></div>`;
  }
}

function clearForm() {
  ["f_wamei","f_kana","f_gakumei","f_family","f_area","f_elevation","f_season",
   "f_weather","f_habitat","f_host","f_quantity","f_aka","f_lookalikes","f_rating",
   "f_taste","f_notes","f_caution","f_date","f_photo"].forEach((id) => { $("#"+id).value = ""; });
  $("#f_edibility").value = "食用";
  pendingPhotoB64 = null;
  $("#photoPreview").innerHTML = `<div class="ph" data-label="写真未選択"></div>`;
  status("#publishStatus", "");
}

function readForm() {
  const csv = (v) => v.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    wamei: $("#f_wamei").value.trim(),
    kana: $("#f_kana").value.trim(),
    gakumei: $("#f_gakumei").value.trim(),
    family: $("#f_family").value.trim(),
    aka: csv($("#f_aka").value),
    edibility: $("#f_edibility").value,
    date: $("#f_date").value,
    area: $("#f_area").value.trim(),
    elevation: $("#f_elevation").value ? Number($("#f_elevation").value) : "",
    habitat: $("#f_habitat").value.trim(),
    host: $("#f_host").value.trim(),
    season: $("#f_season").value.trim(),
    weather: $("#f_weather").value.trim(),
    quantity: $("#f_quantity").value.trim(),
    taste: $("#f_taste").value.trim(),
    notes: $("#f_notes").value.trim(),
    caution: $("#f_caution").value.trim(),
    lookalikes: csv($("#f_lookalikes").value),
    rating: $("#f_rating").value ? Number($("#f_rating").value) : 0,
  };
}

/* ---------------- 写真圧縮 ---------------- */
function onPhotoSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  status("#publishStatus", "写真を処理中…");
  compressImage(file).then((b64) => {
    pendingPhotoB64 = b64;
    $("#photoPreview").innerHTML = `<img src="data:image/jpeg;base64,${b64}" alt="" />`;
    status("#publishStatus", "");
  }).catch((err) => status("#publishStatus", "写真の読み込みに失敗：" + err, "err"));
}

function compressImage(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
        const c = document.createElement("canvas");
        c.width = width; c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------- ID採番 ---------------- */
function nextId() {
  let max = 0;
  records.forEach((r) => {
    const m = /^k(\d+)$/.exec(r.id || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "k" + String(max + 1).padStart(3, "0");
}

/* ---------------- プレビュー ---------------- */
function showPreview() {
  const r = readForm();
  if (!r.wamei) { status("#publishStatus", "和名を入力してください", "err"); return; }
  const photoSrc = pendingPhotoB64
    ? `data:image/jpeg;base64,${pendingPhotoB64}`
    : (currentEditingPhoto() || "");
  renderPreview(r, photoSrc);
}

function currentEditingPhoto() {
  const id = $("#editSelect").value;
  const r = records.find((x) => x.id === id);
  return r ? r.photo : "";
}

function renderPreview(r, photoSrc) {
  const edClass = r.edibility === "食用" ? "edible" : r.edibility === "毒" ? "poison" : "unfit";
  const heroPhoto = photoSrc ? `<img src="${photoSrc}" alt="" />` : `<div class="ph" data-label="${esc(r.wamei)}"></div>`;
  const dl = [
    ["採集日", fmtDate(r.date)], ["科", r.family], ["別名", (r.aka||[]).join("・")],
    ["採集地", r.area], ["標高", r.elevation ? r.elevation+" m" : ""], ["発生環境", r.habitat],
    ["共生・宿主", r.host], ["季節", r.season], ["天候", r.weather], ["採集量", r.quantity],
  ].filter(([,v]) => v).map(([k,v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  const secs = [];
  if (r.taste) secs.push(`<div class="modal__section"><h3>味・食べ方</h3><p>${esc(r.taste)}</p></div>`);
  if (r.notes) secs.push(`<div class="modal__section"><h3>覚え書き</h3><p>${esc(r.notes)}</p></div>`);
  if (r.caution || (r.lookalikes||[]).length) {
    const look = (r.lookalikes||[]).length ? `<div class="lookalikes">${r.lookalikes.map(l=>`<span class="lookalike">${esc(l)}</span>`).join("")}</div>` : "";
    secs.push(`<div class="modal__section"><h3>注意・似たキノコ</h3><div class="caution-box"><strong>⚠</strong> ${esc(r.caution||"判別に注意。")}</div>${look}</div>`);
  }
  $("#modalBody").innerHTML = `
    <div class="modal__hero">${heroPhoto}</div>
    <div class="modal__content">
      <h2 class="modal__wamei">${esc(r.wamei)} <span class="modal__kana">（${esc(r.kana)}）</span></h2>
      <p class="modal__gakumei">${esc(r.gakumei)}</p>
      <div class="modal__tags"><span class="tag tag--${edClass}">${esc(r.edibility)}</span>${r.family?`<span class="tag">${esc(r.family)}</span>`:""}${r.season?`<span class="tag">${esc(r.season)}</span>`:""}</div>
      <dl class="dl">${dl}</dl>
      ${secs.join("")}
    </div>`;
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }

/* ---------------- GitHub API ---------------- */
function ghHeaders() {
  return { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" };
}
function ghUrl(path) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}
async function ghGet(path) {
  const res = await fetch(ghUrl(path) + "?ref=" + encodeURIComponent(cfg.branch), { headers: ghHeaders(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`取得失敗 (${res.status}) ${await res.text()}`);
  return res.json();
}
async function ghPut(path, contentB64, message, sha) {
  const body = { message, content: contentB64, branch: cfg.branch };
  if (sha) body.sha = sha;
  const res = await fetch(ghUrl(path), { method: "PUT", headers: ghHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`保存失敗 (${res.status}) ${await res.text()}`);
  return res.json();
}

async function testConnection() {
  if (!cfg.token) { cfg.token = $("#cfgToken").value.trim(); }
  cfg.owner = $("#cfgOwner").value.trim() || DEFAULT_CFG.owner;
  cfg.repo = $("#cfgRepo").value.trim() || DEFAULT_CFG.repo;
  cfg.branch = $("#cfgBranch").value.trim() || DEFAULT_CFG.branch;
  status("#cfgStatus", "接続テスト中…");
  try {
    const f = await ghGet(RECORDS_PATH);
    if (!f) throw new Error("records.json が見つかりません（ブランチ/パスを確認）");
    status("#cfgStatus", "✓ 接続OK。records.json を確認できました。", "ok");
  } catch (e) {
    status("#cfgStatus", "✗ " + e.message, "err");
  }
}

/* ---------------- 公開 ---------------- */
async function publish() {
  const r = readForm();
  if (!cfg.token) { openSettings(); status("#publishStatus", "先に⚙設定でGitHubトークンを登録してください", "err"); return; }
  if (!r.wamei) { status("#publishStatus", "和名は必須です", "err"); return; }
  if (!r.date) { status("#publishStatus", "採集日は必須です", "err"); return; }

  const editingId = $("#editSelect").value;
  const id = editingId || nextId();
  setBusy(true);

  try {
    // 1) 最新の records.json を取得（権威データ）
    progress("最新データを取得中…");
    const file = await ghGet(RECORDS_PATH);
    if (!file) throw new Error("records.json が見つかりません。⚙設定のブランチ/リポジトリを確認してください。");
    const json = JSON.parse(b64decode(file.content));
    json.records = json.records || [];

    // 既存の写真パスを引き継ぐ
    const existing = json.records.find((x) => x.id === id);
    let photoPath = existing ? existing.photo : "";

    // 2) 写真があればアップロード
    if (pendingPhotoB64) {
      progress("写真をアップロード中…");
      const fname = `${id}.jpg`;
      const ppath = `${PHOTO_DIR}/${fname}`;
      const prev = await ghGet(ppath);   // 既存なら上書き用sha
      await ghPut(ppath, pendingPhotoB64, `写真: ${r.wamei} (${id})`, prev ? prev.sha : undefined);
      photoPath = `data/photos/${fname}`;
    }

    // 3) レコードを組み立て
    const record = { id, ...r, photo: photoPath || "" };
    if (existing) {
      Object.assign(existing, record);
    } else {
      json.records.push(record);
    }

    // 4) records.json を保存
    progress("記録を保存中…");
    const newContent = JSON.stringify(json, null, 2) + "\n";
    await ghPut(RECORDS_PATH, b64encode(newContent), `記録: ${r.wamei} (${id}) を${existing ? "更新" : "追加"}`, file.sha);

    // ローカルにも反映
    records = json.records;

    setBusy(false);
    status("#publishStatus",
      `✅ 「${r.wamei}」を公開しました（${existing ? "更新" : "追加"}）。HPに反映されるまで1〜2分ほどお待ちください。`, "ok");
    refreshEditSelect();
    if (!editingId) { $("#editSelect").value = ""; clearForm(); }
  } catch (e) {
    setBusy(false);
    status("#publishStatus", "✗ 公開に失敗：" + e.message, "err");
  }
}

function refreshEditSelect() {
  const sel = $("#editSelect");
  const cur = sel.value;
  sel.innerHTML = `<option value="">＋ 新しいキノコを追加</option>`;
  records.slice().sort((a, b) => (a.kana||a.wamei).localeCompare(b.kana||b.wamei, "ja")).forEach((r) => {
    const o = document.createElement("option");
    o.value = r.id; o.textContent = `${r.wamei}（${r.date}）`;
    sel.appendChild(o);
  });
  sel.value = cur;
}

/* ---------------- ヘルパ ---------------- */
function openSettings() { $("#settingsPanel").hidden = false; }
function setBusy(b) {
  $("#publishBtn").disabled = b;
  $("#previewBtn").disabled = b;
  $("#progress").hidden = !b;
  if (!b) $("#progress").textContent = "";
}
function progress(msg) { $("#progress").hidden = false; $("#progress").textContent = "⏳ " + msg; }
function status(sel, msg, kind) {
  const el = $(sel);
  el.textContent = msg || "";
  el.className = "adm-status" + (sel === "#publishStatus" ? " adm-status--big" : "") + (kind ? " is-" + kind : "");
}

// UTF-8 ⇔ base64
function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(b64) { return decodeURIComponent(escape(atob((b64 || "").replace(/\n/g, "")))); }

function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? iso : `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
