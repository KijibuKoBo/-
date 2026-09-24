/* =========================================================
   管理ページ  —  記録の追加・写真の追加/並び替え/詳細編集 → GitHubへ公開
   依存ライブラリなし。GitHubトークンはこの端末のブラウザのみに保存。
   ========================================================= */

/* ---- ログインパスワードと、できることの範囲 ----
   100 … グッズ以外をぜんぶ編集できる
   314 … グッズもふくめて ぜんぶ編集できる
   Apps Script（スプレッドシート）へ送る鍵は、どちらでログインしても
   これまでどおり "100" のまま。だから再デプロイは要りません。      */
const PW_BASIC = "100";
const PW_FULL  = "314";
const ADMIN_PW = "100";               // Apps Script に送る鍵（サーバー側の ADMIN_KEY と同じ）
let level = null;                     // "basic" | "full"
const canGoods = () => level === "full";
const CFG_KEY = "kinoko_admin_cfg";
const RECORDS_PATH = "kinoko/web/data/records.json";
const COLUMNS_PATH = "kinoko/web/data/columns.json";
const GOODS_PATH   = "kinoko/web/data/goods.json";
const GOODS_DIR    = "kinoko/web/data/goods";
const DIARY_PATH   = "kinoko/web/data/diary.json";
const PHOTO_DIR = "kinoko/web/data/photos";

const DEFAULT_CFG = { token: "", owner: "KijibuKoBo", repo: "-", branch: "main" };

let cfg = loadCfg();
let records = [];            // 現在のローカル表示用
let photoItems = [];         // 編集中レコードの写真: {kind:'existing',path} | {kind:'new',b64}
let columns = [];            // コラム
let diary = [];              // 日誌
let colPhoto = null;         // コラム写真 {kind:'existing',path} | {kind:'new',b64} | null

const $ = (s) => document.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------- 起動 ---------------- */
boot();

function boot() {
  fillSettingsForm();
  bindUI();
  loadRecordsLocal();
  showLock();                // 常にパスワードで保護
}

function showLock() {
  level = null;
  $("#lock").hidden = false;
  $("#adminMain").hidden = true;
  $("#pinInput").value = "";
  $("#pinErr").hidden = true;
  setTimeout(() => $("#pinInput").focus(), 50);
}
function unlock(lv) {
  level = lv;
  $("#lock").hidden = true;
  $("#adminMain").hidden = false;
  applyLevel();
}
function checkPin() {
  const v = $("#pinInput").value.trim();
  if (v === PW_FULL)       { $("#pinErr").hidden = true; unlock("full"); }
  else if (v === PW_BASIC) { $("#pinErr").hidden = true; unlock("basic"); }
  else { $("#pinErr").hidden = false; $("#pinInput").select(); }
}
function logout() {
  switchTab("records");
  showLock();
}

/* できることの範囲を画面に反映する */
function applyLevel() {
  const full = canGoods();
  const tab = $('.adm-tab[data-tab="goods"]');
  const panel = $('[data-panel="goods"]');
  if (tab) tab.hidden = !full;
  if (panel && !full) panel.hidden = true;
  if (!full && $('.adm-tab[data-tab="goods"]')?.getAttribute("aria-pressed") === "true") switchTab("records");
  const badge = $("#lvBadge");
  if (badge) {
    badge.textContent = full ? "すべて編集できます" : "グッズ以外を編集できます";
    badge.className = "adm-badge" + (full ? " is-full" : "");
  }
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
    saveCfg();
    status("#cfgStatus", "✓ 設定を保存しました", "ok");
  });

  $("#testBtn").addEventListener("click", testConnection);

  // パスワード
  $("#pinBtn").addEventListener("click", checkPin);
  $("#logoutBtn")?.addEventListener("click", logout);
  $("#pinInput").addEventListener("keydown", (e) => { if (e.key === "Enter") checkPin(); });

  // 編集対象の切替
  $("#editSelect").addEventListener("change", (e) => {
    const id = e.target.value;
    if (!id) { clearForm(); return; }
    const r = records.find((x) => x.id === id);
    if (r) fillForm(r);
  });
  $("#resetBtn").addEventListener("click", () => { $("#editSelect").value = ""; clearForm(); });

  // 写真の追加（複数）
  $("#f_photo").addEventListener("change", onPhotoSelected);
  // 写真リストの操作（並び替え・削除）
  $("#photoList").addEventListener("click", onPhotoListClick);

  $("#previewBtn").addEventListener("click", showPreview);
  $("#publishBtn").addEventListener("click", publish);

  // モーダル
  $("#modal").addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  clearForm();
  bindExtras();
}

/* ---------------- ローカル記録読み込み ---------------- */
async function loadRecordsLocal() {
  try {
    const res = await fetch("data/records.json", { cache: "no-store" });
    const data = await res.json();
    records = data.records || [];
  } catch { records = []; }
  refreshEditSelect();
}

function refreshEditSelect() {
  const sel = $("#editSelect");
  const cur = sel.value;
  sel.innerHTML = `<option value="">＋ 新しいキノコを追加</option>`;
  records.slice()
    .sort((a, b) => (a.kana || a.wamei).localeCompare(b.kana || b.wamei, "ja"))
    .forEach((r) => {
      const o = document.createElement("option");
      o.value = r.id;
      o.textContent = `${r.wamei}（${r.date || "日付なし"}）`;
      sel.appendChild(o);
    });
  sel.value = cur;
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
  $("#f_rating").value = r.rating || "";
  $("#f_taste").value = r.taste || "";
  $("#f_notes").value = r.notes || "";
  $("#f_caution").value = r.caution || "";

  const paths = (r.photos && r.photos.length) ? r.photos : (r.photo ? [r.photo] : []);
  photoItems = paths.map((p) => ({ kind: "existing", path: p }));
  renderPhotoList();
  status("#publishStatus", "");
}

function clearForm() {
  ["f_wamei","f_kana","f_gakumei","f_family","f_area","f_elevation","f_season",
   "f_weather","f_habitat","f_host","f_quantity","f_aka","f_lookalikes","f_rating",
   "f_taste","f_notes","f_caution","f_date"].forEach((id) => { const el = $("#"+id); if (el) el.value = ""; });
  $("#f_edibility").value = "食用";
  photoItems = [];
  renderPhotoList();
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
    elevation: $("#f_elevation").value ? Number($("#f_elevation").value) : null,
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

/* ---------------- 写真リスト ---------------- */
function photoSrc(it) { return it.kind === "new" ? `data:image/jpeg;base64,${it.b64}` : it.path; }

function renderPhotoList() {
  const box = $("#photoList");
  if (!photoItems.length) {
    box.innerHTML = `<p class="adm-note adm-photolist__empty">写真がありません。「＋ 写真を追加」から選んでください。</p>`;
    return;
  }
  box.innerHTML = photoItems.map((it, i) => `
    <div class="adm-pcard${i === 0 ? " is-main" : ""}">
      <div class="adm-pcard__img" style="background-image:url('${photoSrc(it)}')"></div>
      ${i === 0 ? `<span class="adm-pcard__badge">メイン</span>` : ""}
      ${it.kind === "new" ? `<span class="adm-pcard__new">新規</span>` : ""}
      <div class="adm-pcard__ctrl">
        <button type="button" data-act="left" data-i="${i}" ${i === 0 ? "disabled" : ""} title="左へ">◀</button>
        <button type="button" data-act="main" data-i="${i}" ${i === 0 ? "disabled" : ""} title="メインにする">★</button>
        <button type="button" data-act="right" data-i="${i}" ${i === photoItems.length - 1 ? "disabled" : ""} title="右へ">▶</button>
        <button type="button" data-act="del" data-i="${i}" title="削除">🗑</button>
      </div>
    </div>`).join("");
}

function onPhotoListClick(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const act = btn.dataset.act;
  if (act === "left" && i > 0) swapPhoto(i, i - 1);
  else if (act === "right" && i < photoItems.length - 1) swapPhoto(i, i + 1);
  else if (act === "main" && i > 0) { const [it] = photoItems.splice(i, 1); photoItems.unshift(it); renderPhotoList(); }
  else if (act === "del") { photoItems.splice(i, 1); renderPhotoList(); }
}
function swapPhoto(i, j) { [photoItems[i], photoItems[j]] = [photoItems[j], photoItems[i]]; renderPhotoList(); }

async function onPhotoSelected(e) {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  status("#publishStatus", "写真を処理中…");
  for (const f of files) {
    try { const b64 = await compressImage(f); photoItems.push({ kind: "new", b64 }); }
    catch (err) { console.warn("写真処理失敗", err); }
  }
  renderPhotoList();
  status("#publishStatus", `写真を${files.length}枚追加しました。並び替え後に「公開する」を押してください。`, "ok");
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
    const m = /(\d+)$/.exec(r.id || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "c" + String(max + 1).padStart(3, "0");
}

/* ---------------- プレビュー ---------------- */
function showPreview() {
  const r = readForm();
  if (!r.wamei) { status("#publishStatus", "和名を入力してください", "err"); return; }
  const src = photoItems.length ? photoSrc(photoItems[0]) : "";
  renderPreview(r, src);
}

function renderPreview(r, src) {
  const edClass = r.edibility === "食用" ? "edible" : r.edibility === "毒" ? "poison" : "unfit";
  const hero = src ? `<img src="${src}" alt="" />` : `<div class="ph" data-label="${esc(r.wamei)}"></div>`;
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
    <div class="modal__hero">${hero}</div>
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
function ghHeaders() { return { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" }; }
function ghUrl(path) { return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`; }
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
  cfg.token = $("#cfgToken").value.trim() || cfg.token;
  cfg.owner = $("#cfgOwner").value.trim() || DEFAULT_CFG.owner;
  cfg.repo = $("#cfgRepo").value.trim() || DEFAULT_CFG.repo;
  cfg.branch = $("#cfgBranch").value.trim() || DEFAULT_CFG.branch;
  status("#cfgStatus", "接続テスト中…");
  try {
    const f = await ghGet(RECORDS_PATH);
    if (!f) throw new Error("records.json が見つかりません（ブランチ/パスを確認）");
    status("#cfgStatus", "✓ 接続OK。records.json を確認できました。", "ok");
  } catch (e) { status("#cfgStatus", "✗ " + e.message, "err"); }
}

/* ---------------- 公開 ---------------- */
async function publish() {
  const r = readForm();
  if (!cfg.token) { openSettings(); status("#publishStatus", "先に ⚙設定 で GitHub トークンを登録してください", "err"); return; }
  if (!r.wamei) { status("#publishStatus", "和名は必須です", "err"); return; }
  if (!r.date) { status("#publishStatus", "採集日は必須です", "err"); return; }
  if (!photoItems.length) { status("#publishStatus", "写真を1枚以上追加してください", "err"); return; }

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

    // 2) 新規写真をアップロードし、写真パスを順番どおりに組み立て
    const finalPhotos = [];
    for (let i = 0; i < photoItems.length; i++) {
      const it = photoItems[i];
      if (it.kind === "existing") { finalPhotos.push(it.path); continue; }
      progress(`写真をアップロード中… (${i + 1}/${photoItems.length})`);
      const fname = `${id}-u${Date.now()}-${i}.jpg`;
      await ghPut(`${PHOTO_DIR}/${fname}`, it.b64, `写真: ${r.wamei} (${id})`);
      finalPhotos.push(`data/photos/${fname}`);
    }

    // 3) レコードを組み立て
    const existing = json.records.find((x) => x.id === id);
    const record = { id, ...r, photo: finalPhotos[0] || "", photos: finalPhotos };
    if (existing) Object.assign(existing, record);
    else json.records.push(record);

    // 4) records.json を保存
    progress("記録を保存中…");
    const newContent = JSON.stringify(json, null, 2) + "\n";
    await ghPut(RECORDS_PATH, b64encode(newContent), `記録: ${r.wamei} (${id}) を${existing ? "更新" : "追加"}`, file.sha);

    records = json.records;   // ローカル反映
    setBusy(false);
    status("#publishStatus",
      `✅ 「${r.wamei}」を公開しました（${existing ? "更新" : "追加"}）。HPに反映されるまで1〜2分ほどお待ちください。`, "ok");
    refreshEditSelect();
    if (editingId) { const cur = records.find((x) => x.id === id); if (cur) fillForm(cur); }
    else { $("#editSelect").value = ""; clearForm(); }
  } catch (e) {
    setBusy(false);
    status("#publishStatus", "✗ 公開に失敗：" + e.message, "err");
  }
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
  if (!el) return;
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

/* =========================================================
   タブ（キノコ / コラム / 日誌）
   ========================================================= */

function bindExtras() {
  $$(".adm-tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#visReload")?.addEventListener("click", () => loadVisits(true));
  $("#pstReload")?.addEventListener("click", () => loadPosts(true));
  $("#goodsSelect")?.addEventListener("change", (e) => {
    const it = (goodsCfg?.items || []).find((x) => x.id === e.target.value);
    it ? fillGoodsForm(it) : clearGoodsForm();
  });
  $("#goodsReset")?.addEventListener("click", () => { $("#goodsSelect").value = ""; clearGoodsForm(); });
  $("#g_photo")?.addEventListener("change", onGoodsPhotoSelected);
  $("#goodsPhotoBox")?.addEventListener("click", (e) => {
    if (e.target.dataset.act === "del") { goodsPhoto = null; renderGoodsPhoto(); }
  });
  $("#goodsPublish")?.addEventListener("click", publishGoods);
  $("#goodsDelete")?.addEventListener("click", () => deleteGoods());
  $("#goodsListBody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.closest(".adm-grow")?.dataset.id;
    if (!id) return;
    if (btn.dataset.act === "del") { deleteGoods(id); return; }
    const it = (goodsCfg?.items || []).find((x) => x.id === id);
    if (!it) return;
    $("#goodsSelect").value = id;
    fillGoodsForm(it);
    $("#g_name").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#goodsFetch")?.addEventListener("click", fetchGoodsMeta);

  // コラム
  $("#colSelect").addEventListener("change", (e) => {
    const id = e.target.value;
    if (!id) { clearColForm(); return; }
    const c = columns.find((x) => x.id === id);
    if (c) fillColForm(c);
  });
  $("#colReset").addEventListener("click", () => { $("#colSelect").value = ""; clearColForm(); });
  $("#c_photo").addEventListener("change", onColPhotoSelected);
  $("#colPhotoBox").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act='del']");
    if (b) { colPhoto = null; renderColPhoto(); }
  });
  $("#colPublish").addEventListener("click", publishColumn);
  $("#colDelete").addEventListener("click", deleteColumn);

  // 日誌
  $("#diaryPublish").addEventListener("click", publishDiary);
  $("#diaryList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-del]");
    if (b) deleteDiary(Number(b.dataset.del));
  });
  $("#d_date").value = today();

  clearColForm();
  loadColumnsLocal();
  loadDiaryLocal();
}

function switchTab(tab) {
  if (tab === "goods" && !canGoods()) return;     // グッズは 314 でログインしたときだけ
  $$(".adm-tab").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tab === tab));
  $$("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  if (tab === "visits") loadVisits();
  if (tab === "posts") loadPosts();
  if (tab === "goods") loadGoods();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------------- みんなの記録（訪問数・ランキング） ---------------- */
const RANK_GAMES = [{ id: "match", n: "きのこマッチパズル" }, { id: "tsumu", n: "きのこつみ" }];
let visLoaded = false;

function bars(box, rows, max) {
  box.innerHTML = "";
  if (!rows.length) { box.textContent = "まだ記録がありません。"; return; }
  rows.forEach((r) => {
    const line = document.createElement("div"); line.className = "adm-bar";
    const k = document.createElement("span"); k.className = "adm-bar__k"; k.textContent = r.k;
    const v = document.createElement("span"); v.className = "adm-bar__v";
    const i = document.createElement("i"); i.style.width = Math.round((r.n / max) * 100) + "%";
    v.appendChild(i);
    const n = document.createElement("span"); n.className = "adm-bar__n"; n.textContent = r.n;
    line.appendChild(k); line.appendChild(v); line.appendChild(n);
    box.appendChild(line);
  });
}

async function loadVisits(force) {
  if (!window.Kinoko) return;
  const on = await window.Kinoko.enabled();
  $("#visOff").hidden = on;
  $("#visBox").hidden = !on;
  if (!on) return;
  if (visLoaded && !force) return;
  visLoaded = true;

  const d = await window.Kinoko.stats(ADMIN_PW);
  if (!d || !d.ok) { $("#visOff").hidden = false; $("#visOff").textContent = "集計を読み込めませんでした。"; return; }

  $("#visTotal").textContent = d.total.toLocaleString();
  $("#visPeople").textContent = d.people.toLocaleString();
  const today = new Date().toISOString().slice(0, 10);
  const days = d.days || [];
  const t = days.find((x) => x.d === today);
  $("#visToday").textContent = t ? t.n : 0;
  $("#visWeek").textContent = days.slice(-7).reduce((a, x) => a + x.n, 0);

  const dmax = Math.max(1, ...days.map((x) => x.n));
  bars($("#visDays"), days.map((x) => ({ k: x.d.slice(5), n: x.n })), dmax);
  const pages = d.pages || [];
  const pmax = Math.max(1, ...pages.map((x) => x.n));
  bars($("#visPages"), pages.map((x) => ({ k: x.p, n: x.n })), pmax);

  const box = $("#rankAdmin"); box.innerHTML = "";
  for (const g of RANK_GAMES) {
    const wrap = document.createElement("div"); wrap.className = "adm-rk";
    const h = document.createElement("h4"); h.textContent = g.n; wrap.appendChild(h);
    const ol = document.createElement("ol"); wrap.appendChild(ol);
    box.appendChild(wrap);
    const top = await window.Kinoko.top(g.id);
    drawAdminRank(ol, g, top || []);
  }
}

function drawAdminRank(ol, g, top) {
  ol.innerHTML = "";
  if (!top.length) { const li = document.createElement("li"); li.textContent = "まだ登録がありません。"; ol.appendChild(li); return; }
  top.forEach((r, i) => {
    const li = document.createElement("li");
    const n = document.createElement("span"); n.className = "n"; n.textContent = i + 1;
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = r.name;
    const sc = document.createElement("span"); sc.className = "sc"; sc.textContent = r.score;
    const bt = document.createElement("button"); bt.type = "button"; bt.textContent = "消す";
    bt.addEventListener("click", async () => {
      if (!confirm(`「${r.name}（${r.score}点）」を消しますか？`)) return;
      bt.disabled = true;
      const d = await window.Kinoko.remove(ADMIN_PW, g.id, r.name, r.score);
      if (d && d.ok) drawAdminRank(ol, g, d.top || []); else bt.disabled = false;
    });
    li.appendChild(n); li.appendChild(nm); li.appendChild(sc); li.appendChild(bt);
    ol.appendChild(li);
  });
}
function today() { return new Date().toISOString().slice(0, 10); }

/* ---------------- コラム ---------------- */
async function loadColumnsLocal() {
  try {
    const res = await fetch("data/columns.json", { cache: "no-store" });
    columns = (await res.json()).columns || [];
  } catch { columns = []; }
  refreshColSelect();
}
function refreshColSelect() {
  const sel = $("#colSelect");
  const cur = sel.value;
  sel.innerHTML = `<option value="">＋ 新しいコラムを書く</option>`;
  columns.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).forEach((c) => {
    const o = document.createElement("option");
    o.value = c.id; o.textContent = `${c.title}（${c.date || ""}）`;
    sel.appendChild(o);
  });
  sel.value = cur;
}
function fillColForm(c) {
  $("#c_title").value = c.title || "";
  $("#c_tag").value = c.tag || "";
  $("#c_date").value = c.date || "";
  $("#c_excerpt").value = c.excerpt || "";
  $("#c_body").value = c.body || "";
  colPhoto = c.image ? { kind: "existing", path: c.image } : null;
  renderColPhoto();
  $("#colDelete").hidden = false;
  status("#colStatus", "");
}
function clearColForm() {
  ["c_title", "c_tag", "c_excerpt", "c_body"].forEach((id) => { $("#" + id).value = ""; });
  $("#c_date").value = today();
  colPhoto = null; renderColPhoto();
  $("#colDelete").hidden = true;
  status("#colStatus", "");
}
function renderColPhoto() {
  const box = $("#colPhotoBox");
  if (!colPhoto) { box.innerHTML = `<p class="adm-note adm-photolist__empty">写真はまだありません（無くてもOK）。</p>`; return; }
  const src = colPhoto.kind === "new" ? `data:image/jpeg;base64,${colPhoto.b64}` : colPhoto.path;
  box.innerHTML = `<div class="adm-pcard is-main">
      <div class="adm-pcard__img" style="background-image:url('${src}')"></div>
      <div class="adm-pcard__ctrl"><button type="button" data-act="del">🗑 消す</button></div>
    </div>`;
}
async function onColPhotoSelected(e) {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  status("#colStatus", "写真を処理中…");
  try { colPhoto = { kind: "new", b64: await compressImage(f) }; renderColPhoto(); status("#colStatus", ""); }
  catch { status("#colStatus", "写真の読み込みに失敗しました", "err"); }
}
function nextColId() {
  let max = 0;
  columns.forEach((c) => { const m = /(\d+)$/.exec(c.id || ""); if (m) max = Math.max(max, parseInt(m[1], 10)); });
  return "c" + String(max + 1).padStart(3, "0");
}
async function publishColumn() {
  if (!cfg.token) { openSettings(); status("#colStatus", "先に ⚙設定 で GitHub トークンを登録してください", "err"); return; }
  const title = $("#c_title").value.trim();
  if (!title) { status("#colStatus", "タイトルを入力してください", "err"); return; }
  const editingId = $("#colSelect").value;
  const id = editingId || nextColId();
  setBusy2("#colPublish", "#colProgress", true);
  try {
    progress2("#colProgress", "最新データを取得中…");
    const file = await ghGet(COLUMNS_PATH);
    if (!file) throw new Error("columns.json が見つかりません");
    const json = JSON.parse(b64decode(file.content));
    json.columns = json.columns || [];

    let image = (colPhoto && colPhoto.kind === "existing") ? colPhoto.path : "";
    if (colPhoto && colPhoto.kind === "new") {
      progress2("#colProgress", "写真をアップロード中…");
      const fname = `col-${id}-${Date.now()}.jpg`;
      await ghPut(`${PHOTO_DIR}/${fname}`, colPhoto.b64, `コラム写真: ${title}`);
      image = `data/photos/${fname}`;
    }
    const rec = {
      id, title,
      tag: $("#c_tag").value.trim() || "コラム",
      date: $("#c_date").value || today(),
      excerpt: $("#c_excerpt").value.trim(),
      image,
      body: $("#c_body").value.trim(),
    };
    const ex = json.columns.find((x) => x.id === id);
    if (ex) Object.assign(ex, rec); else json.columns.unshift(rec);

    progress2("#colProgress", "保存中…");
    await ghPut(COLUMNS_PATH, b64encode(JSON.stringify(json, null, 2) + "\n"), `コラム: ${title} を${ex ? "更新" : "追加"}`, file.sha);
    columns = json.columns; refreshColSelect(); $("#colSelect").value = id; fillColForm(rec);
    setBusy2("#colPublish", "#colProgress", false);
    status("#colStatus", `✅ 「${title}」を公開しました。1〜2分でHPに出ます。`, "ok");
  } catch (e) {
    setBusy2("#colPublish", "#colProgress", false);
    status("#colStatus", "✗ 公開に失敗：" + e.message, "err");
  }
}
async function deleteColumn() {
  const id = $("#colSelect").value; if (!id) return;
  const c = columns.find((x) => x.id === id);
  if (!confirm(`「${c ? c.title : id}」を消しますか？`)) return;
  setBusy2("#colPublish", "#colProgress", true);
  try {
    const file = await ghGet(COLUMNS_PATH);
    const json = JSON.parse(b64decode(file.content));
    json.columns = (json.columns || []).filter((x) => x.id !== id);
    await ghPut(COLUMNS_PATH, b64encode(JSON.stringify(json, null, 2) + "\n"), `コラム削除: ${id}`, file.sha);
    columns = json.columns; refreshColSelect(); $("#colSelect").value = ""; clearColForm();
    setBusy2("#colPublish", "#colProgress", false);
    status("#colStatus", "🗑 消しました。1〜2分でHPに反映されます。", "ok");
  } catch (e) {
    setBusy2("#colPublish", "#colProgress", false);
    status("#colStatus", "✗ 削除に失敗：" + e.message, "err");
  }
}

/* ---------------- 日誌 ---------------- */
async function loadDiaryLocal() {
  try {
    const res = await fetch("data/diary.json", { cache: "no-store" });
    diary = (await res.json()).entries || [];
  } catch { diary = []; }
  renderDiaryList();
}
function dkey(e) { return (e.year || 0) * 10000 + (e.month || 0) * 100 + (e.day || 0); }
function renderDiaryList() {
  const box = $("#diaryList");
  const rows = diary.map((e, i) => ({ e, i })).sort((a, b) => dkey(b.e) - dkey(a.e)).slice(0, 15);
  if (!rows.length) { box.innerHTML = `<p class="adm-note">まだ日誌がありません。</p>`; return; }
  box.innerHTML = rows.map(({ e, i }) => `
    <div class="adm-dcard">
      <div class="adm-dcard__d">${e.year}/${e.month}/${e.day || "?"}</div>
      <div class="adm-dcard__m">
        <b>${esc(e.species)}</b>${e.place ? ` <span>📍${esc(e.place)}</span>` : ""}${e.edib ? ` <span class="adm-dcard__tag">${esc(e.edib)}</span>` : ""}
        ${e.note ? `<div class="adm-dcard__n">${esc(e.note)}</div>` : ""}
      </div>
      <button type="button" data-del="${i}" title="消す">🗑</button>
    </div>`).join("");
}
async function publishDiary() {
  if (!cfg.token) { openSettings(); status("#diaryStatus", "先に ⚙設定 で GitHub トークンを登録してください", "err"); return; }
  const date = $("#d_date").value, place = $("#d_place").value.trim(), sp = $("#d_species").value.trim();
  if (!date || !place || !sp) { status("#diaryStatus", "日付・採集場所・キノコの名前は必須です", "err"); return; }
  const [y, m, d] = date.split("-").map(Number);
  const entry = { year: y, month: m, day: d, place, species: sp,
    edib: $("#d_edib").value.trim(), weather: $("#d_weather").value.trim(), note: $("#d_note").value.trim() };
  setBusy2("#diaryPublish", "#diaryProgress", true);
  try {
    progress2("#diaryProgress", "保存中…");
    const file = await ghGet(DIARY_PATH);
    if (!file) throw new Error("diary.json が見つかりません");
    const json = JSON.parse(b64decode(file.content));
    json.entries = json.entries || []; json.entries.push(entry);
    await ghPut(DIARY_PATH, b64encode(JSON.stringify(json, null, 1) + "\n"), `日誌: ${date} ${sp}`, file.sha);
    diary = json.entries; renderDiaryList();
    ["d_place", "d_species", "d_edib", "d_note"].forEach((id) => { $("#" + id).value = ""; });
    setBusy2("#diaryPublish", "#diaryProgress", false);
    status("#diaryStatus", `✅ ${date} の「${sp}」を日誌に追加しました。1〜2分でHPに出ます。`, "ok");
  } catch (e) {
    setBusy2("#diaryPublish", "#diaryProgress", false);
    status("#diaryStatus", "✗ 保存に失敗：" + e.message, "err");
  }
}
async function deleteDiary(i) {
  const e = diary[i]; if (!e) return;
  if (!confirm(`${e.year}/${e.month}/${e.day || "?"} の「${e.species}」を消しますか？`)) return;
  try {
    const file = await ghGet(DIARY_PATH);
    const json = JSON.parse(b64decode(file.content));
    json.entries = json.entries || [];
    const k = json.entries.findIndex((x) => x.year === e.year && x.month === e.month && x.day === e.day && x.species === e.species && x.place === e.place && (x.note || "") === (e.note || ""));
    if (k >= 0) json.entries.splice(k, 1);
    await ghPut(DIARY_PATH, b64encode(JSON.stringify(json, null, 1) + "\n"), `日誌削除: ${e.year}/${e.month}/${e.day} ${e.species}`, file.sha);
    diary = json.entries; renderDiaryList();
    status("#diaryStatus", "🗑 消しました。1〜2分でHPに反映されます。", "ok");
  } catch (err) { status("#diaryStatus", "✗ 削除に失敗：" + err.message, "err"); }
}

function setBusy2(btn, prog, b) { $(btn).disabled = b; $(prog).hidden = !b; if (!b) $(prog).textContent = ""; }
function progress2(prog, msg) { $(prog).hidden = false; $(prog).textContent = "⏳ " + msg; }

/* ---------------- みんなからの写真投稿 ---------------- */
let pstLoaded = false;

async function loadPosts(force) {
  if (!window.Kinoko) return;
  const on = await window.Kinoko.enabled();
  $("#pstOff").hidden = on;
  $("#pstBox").hidden = !on;
  if (!on) return;
  if (pstLoaded && !force) return;
  pstLoaded = true;
  const list = await window.Kinoko.posts(ADMIN_PW);
  drawPosts(list || []);
}

function drawPosts(list) {
  const box = $("#pstList");
  box.innerHTML = "";
  if (!list.length) { box.textContent = "まだ投稿がありません。"; return; }
  list.forEach((p) => box.appendChild(postCard(p)));
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function postCard(p) {
  const c = el("div", "adm-post" + (p.state === "公開" ? " is-live" : ""));
  const img = el("img", "adm-post__img");
  img.src = p.photo; img.loading = "lazy"; img.alt = "";
  c.appendChild(img);

  const b = el("div", "adm-post__body");
  const head = el("p", "adm-post__head");
  head.appendChild(el("b", null, p.name || "ななし"));
  head.appendChild(el("span", "adm-post__state", p.state));
  if (p.place) head.appendChild(el("span", "adm-post__place", "📍 " + p.place));
  head.appendChild(el("span", "adm-post__date", p.date));
  b.appendChild(head);
  if (p.text) b.appendChild(el("p", "adm-post__text", p.text));

  const btns = el("div", "adm-post__btns");
  const mk = (label, act, cls) => {
    const bt = el("button", cls, label);
    bt.type = "button";
    bt.addEventListener("click", async () => {
      if (act === "trash" && !confirm("この投稿を消しますか？（写真も消えます）")) return;
      bt.disabled = true;
      const d = await window.Kinoko.moderate({ key: ADMIN_PW, id: p.id, act });
      if (d && d.ok) drawPosts(d.posts || []); else bt.disabled = false;
    });
    return bt;
  };
  btns.appendChild(p.state === "公開" ? mk("↩ 下げる", "hide") : mk("✓ 公開する", "show", "is-go"));
  btns.appendChild(mk("🗑 消す", "trash", "is-bad"));
  b.appendChild(btns);

  const cl = el("div", "adm-post__cmts");
  (p.comments || []).forEach((m) => {
    const line = el("div", "adm-cmt" + (m.admin ? " is-admin" : ""));
    line.appendChild(el("b", null, m.name || "ななし"));
    line.appendChild(el("span", null, m.text));
    const del = el("button", null, "消す");
    del.type = "button";
    del.addEventListener("click", async () => {
      if (!confirm("このコメントを消しますか？")) return;
      del.disabled = true;
      const d = await window.Kinoko.moderate({ key: ADMIN_PW, id: p.id, act: "delcmt", text: m.text });
      if (d && d.ok) drawPosts(d.posts || []); else del.disabled = false;
    });
    line.appendChild(del);
    cl.appendChild(line);
  });
  b.appendChild(cl);

  const f = el("form", "adm-post__reply");
  const t = document.createElement("input");
  t.maxLength = 400; t.placeholder = "答えを書く（採集者として載ります）";
  const sb = el("button", null, "答える"); sb.type = "submit";
  f.appendChild(t); f.appendChild(sb);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!t.value.trim()) return;
    sb.disabled = true;
    const d = await window.Kinoko.addComment({ id: p.id, text: t.value, key: ADMIN_PW });
    sb.disabled = false;
    if (d && d.ok) { t.value = ""; loadPosts(true); }
  });
  b.appendChild(f);

  c.appendChild(b);
  return c;
}

/* ---------------- グッズ ---------------- */
let goodsCfg = null, goodsPhoto = null, goodsLoaded = false;

async function loadGoods(force) {
  if (goodsLoaded && !force) return;
  goodsLoaded = true;
  try {
    const r = await fetch("data/goods.json?t=" + Date.now(), { cache: "no-store" });
    goodsCfg = await r.json();
  } catch (e) {
    goodsCfg = { shopUrl: "", note: "", items: [] };
  }
  $("#g_shop").value = goodsCfg.shopUrl || "";
  $("#g_note").value = goodsCfg.note || "";
  refreshGoodsSelect();
  clearGoodsForm();
}

function refreshGoodsSelect() {
  const sel = $("#goodsSelect"), cur = sel.value;
  const items = goodsCfg.items || [];
  const dup = {};
  items.forEach((it) => { dup[it.name] = (dup[it.name] || 0) + 1; });
  sel.innerHTML = `<option value="">＋ 新しい商品を出す</option>`;
  items.forEach((it, i) => {
    const o = document.createElement("option");
    o.value = it.id;
    o.textContent = `${i + 1}. ${goodsLabel(it)}`;
    if (dup[it.name] > 1) o.textContent += `［${it.id}］`;
    sel.appendChild(o);
  });
  sel.value = cur;
  renderGoodsList();
}

function goodsLabel(it) {
  return (it.name || "（名前なし）") + (it.price ? `（${it.price}）` : "");
}

/* いま出ている商品を一覧で見せる（ここからも直す・消すができる） */
function renderGoodsList() {
  const box = $("#goodsListBody");
  if (!box) return;
  const items = goodsCfg.items || [];
  if (!items.length) {
    box.innerHTML = `<p class="adm-note">まだ商品がありません。下の欄に入れて「公開する」を押してください。</p>`;
    return;
  }
  box.innerHTML = items.map((it, i) => {
    const thumb = it.design
      ? `<span class="adm-grow__img" style="background-image:url('${esc(it.design)}')"></span>`
      : `<span class="adm-grow__img is-none">写真なし</span>`;
    const sub = [it.price, it.url ? "リンクあり" : "リンクなし"].filter(Boolean).join(" ・ ");
    return `<div class="adm-grow" data-id="${esc(it.id)}">
        <span class="adm-grow__no">${i + 1}</span>
        ${thumb}
        <span class="adm-grow__txt">
          <b>${esc(it.name || "（名前なし）")}</b>
          <small>${esc(sub)}　<code>${esc(it.id)}</code></small>
        </span>
        <span class="adm-grow__btns">
          <button type="button" class="btn-outline btn-sm" data-act="edit">直す</button>
          <button type="button" class="btn-outline btn-sm btn-danger" data-act="del">🗑 消す</button>
        </span>
      </div>`;
  }).join("");
}


function setGoodsMode(it) {
  const m = $("#goodsMode"), btn = $("#goodsPublish");
  if (!m) return;
  if (it) {
    m.hidden = false;
    m.textContent = `いま「${it.name || it.id}」を直しています。公開するとこの商品が置きかわります。`;
    if (btn) btn.textContent = "🛍 この商品を直して公開";
  } else {
    m.hidden = true;
    m.textContent = "";
    if (btn) btn.textContent = "🛍 新しい商品として出す";
  }
}

function fillGoodsForm(it) {
  setGoodsMode(it);
  $("#g_name").value = it.name || "";
  $("#g_price").value = it.price || "";
  $("#g_url").value = it.url || "";
  $("#g_desc").value = it.desc || "";
  goodsPhoto = it.design ? { kind: "existing", path: it.design } : null;
  renderGoodsPhoto();
  $("#goodsDelete").hidden = false;
  status("#goodsStatus", "");
}

function clearGoodsForm() {
  setGoodsMode(null);
  ["g_name", "g_price", "g_url", "g_desc"].forEach((id) => { $("#" + id).value = ""; });
  goodsPhoto = null; renderGoodsPhoto();
  $("#goodsDelete").hidden = true;
  status("#goodsStatus", "");
}

function renderGoodsPhoto() {
  const box = $("#goodsPhotoBox");
  if (!goodsPhoto) {
    box.innerHTML = `<p class="adm-note adm-photolist__empty">写真はまだありません。</p>`;
    return;
  }
  const src = goodsPhoto.kind === "new" ? `data:image/jpeg;base64,${goodsPhoto.b64}` : goodsPhoto.path;
  box.innerHTML = `<div class="adm-pcard is-main">
      <div class="adm-pcard__img" style="background-image:url('${src}')"></div>
      <div class="adm-pcard__ctrl"><button type="button" data-act="del">🗑 消す</button></div>
    </div>`;
}

async function onGoodsPhotoSelected(e) {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  status("#goodsStatus", "写真を処理中…");
  try {
    goodsPhoto = { kind: "new", b64: await compressImage(f, 1200, 0.85) };
    renderGoodsPhoto(); status("#goodsStatus", "");
  } catch { status("#goodsStatus", "写真の読み込みに失敗しました", "err"); }
}

function nextGoodsId() {
  let max = 0;
  (goodsCfg.items || []).forEach((it) => {
    const m = /(\d+)$/.exec(it.id || "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return "g" + String(max + 1).padStart(3, "0");
}

async function publishGoods() {
  if (!canGoods()) { status("#goodsStatus", "グッズを編集するには 314 でログインしてください", "err"); return; }
  if (!cfg.token) { openSettings(); status("#goodsStatus", "先に ⚙設定 で GitHub トークンを登録してください", "err"); return; }
  const name = $("#g_name").value.trim();
  if (!name) { status("#goodsStatus", "商品名を入力してください", "err"); return; }
  const editingId = $("#goodsSelect").value;
  const id = editingId || nextGoodsId();
  setBusy2("#goodsPublish", "#goodsProgress", true);
  try {
    progress2("#goodsProgress", "最新データを取得中…");
    const file = await ghGet(GOODS_PATH);
    if (!file) throw new Error("goods.json が見つかりません");
    const json = JSON.parse(b64decode(file.content));
    json.items = json.items || [];
    json.shopUrl = $("#g_shop").value.trim();
    json.note = $("#g_note").value.trim();

    let design = (goodsPhoto && goodsPhoto.kind === "existing") ? goodsPhoto.path : "";
    if (goodsPhoto && goodsPhoto.kind === "new") {
      progress2("#goodsProgress", "写真をアップロード中…");
      const fname = `item-${id}-${Date.now()}.jpg`;
      await ghPut(`${GOODS_DIR}/${fname}`, goodsPhoto.b64, `グッズ写真: ${name}`);
      design = `data/goods/${fname}`;
    }

    const rec = { id, name, price: $("#g_price").value.trim(),
                  url: $("#g_url").value.trim(), desc: $("#g_desc").value.trim(), design };
    const ex = json.items.find((x) => x.id === id);
    if (ex) Object.assign(ex, rec); else json.items.push(rec);

    progress2("#goodsProgress", "保存中…");
    await ghPut(GOODS_PATH, b64encode(JSON.stringify(json, null, 2) + "\n"),
                `グッズ: ${name} を${ex ? "更新" : "追加"}`, file.sha);
    goodsCfg = json; refreshGoodsSelect(); $("#goodsSelect").value = id; fillGoodsForm(rec);
    setBusy2("#goodsPublish", "#goodsProgress", false);
    status("#goodsStatus", `✅ 「${name}」を公開しました。1〜2分でHPに出ます。`, "ok");
  } catch (e) {
    setBusy2("#goodsPublish", "#goodsProgress", false);
    status("#goodsStatus", "✗ 公開に失敗：" + e.message, "err");
  }
}

async function deleteGoods(id) {
  if (!canGoods()) { status("#goodsStatus", "グッズを編集するには 314 でログインしてください", "err"); return; }
  if (typeof id !== "string" || !id) id = $("#goodsSelect").value;
  if (!id) { status("#goodsStatus", "先に消したい商品をえらんでください", "err"); return; }
  if (!cfg.token) { openSettings(); status("#goodsStatus", "先に ⚙設定 で GitHub トークンを登録してください", "err"); return; }
  const it = (goodsCfg.items || []).find((x) => x.id === id);
  if (!confirm(`「${it ? goodsLabel(it) : id}」を消しますか？\n（もとに戻せません）`)) return;
  setBusy2("#goodsPublish", "#goodsProgress", true);
  try {
    progress2("#goodsProgress", "最新データを取得中…");
    const file = await ghGet(GOODS_PATH);
    if (!file) throw new Error("goods.json が見つかりません");
    const json = JSON.parse(b64decode(file.content));
    if (!(json.items || []).some((x) => x.id === id)) throw new Error("その商品はすでにありません");
    progress2("#goodsProgress", "保存中…");
    json.items = (json.items || []).filter((x) => x.id !== id);
    await ghPut(GOODS_PATH, b64encode(JSON.stringify(json, null, 2) + "\n"), `グッズ: ${id} を削除`, file.sha);
    goodsCfg = json; refreshGoodsSelect(); $("#goodsSelect").value = ""; clearGoodsForm();
    setBusy2("#goodsPublish", "#goodsProgress", false);
    status("#goodsStatus", `✅ 「${it ? it.name : id}」を消しました。1〜2分でHPから消えます。`, "ok");
  } catch (e) {
    setBusy2("#goodsPublish", "#goodsProgress", false);
    status("#goodsStatus", "✗ 失敗：" + e.message, "err");
  }
}

/* スズリなどの長いページ名から、商品名だけを取り出す
   例）「イワオトキノコ / イワオトキノコ ( iwaotokinoko )のコットンツイルバケットハット通販 ∞ SUZURI」
       →「コットンツイルバケットハット」 */
function tidyShopTitle(t, url) {
  const info = suzuriInfo(url);
  if (info && info.kind) return info.kind;
  let s = String(t || "").trim();
  s = s.replace(/\s*[∞|｜|]\s*(SUZURI|スズリ|BASE|MINNE|minne)[^]*$/i, "");  // 末尾のサイト名
  s = s.replace(/^[^/]{1,30}\s*\/\s*/, "");                                  // 先頭の「ショップ名 / 」
  s = s.replace(/^.*?\s*\([^)]*\)\s*の/, "");                               // 「〜 ( id )の」
  s = s.replace(/通販[^]*$/, "");                                              // 「…通販」以降
  s = s.replace(/[（(]スズリ[）)]?$/, "").trim();
  s = s.replace(/[・･、。,.\s]+$/, "").trim();
  if (!s || s.length > 30) s = String(t || "").trim().slice(0, 30);
  return s;
}

/* スズリの商品URLから「何の品物か」を読み取る
   スズリのページは、どの品物でも説明文が「元になったデザインの名前」で
   共通になってしまうため、URL の品目部分から自分で組み立てる。
   例）…/20988482/trad-pocketable-tote-m/m/black → ポケッタブルトート・黒 */
var SUZURI_ITEMS = [
  ["heavy-weight-t-shirt", "ヘビーウェイトTシャツ"],
  ["big-silhouette-t-shirt", "ビッグシルエットTシャツ"],
  ["oversized-t-shirt", "オーバーサイズTシャツ"],
  ["long-sleeve-t-shirt", "ロングスリーブTシャツ"],
  ["one-point-t-shirt", "ワンポイントTシャツ"],
  ["dry-t-shirt", "ドライTシャツ"],
  ["t-shirt", "Tシャツ"],
  ["bucket-hat", "バケットハット"],
  ["cap", "キャップ"],
  ["pocketable-tote", "ポケッタブルトート"],
  ["lunch-tote", "ランチトート"],
  ["tote-bag", "トートバッグ"],
  ["tote", "トートバッグ"],
  ["sacoche", "サコッシュ"],
  ["shoulder", "ショルダーバッグ"],
  ["hoodie", "パーカー"],
  ["pullover", "パーカー"],
  ["zip", "ジップパーカー"],
  ["sweat", "スウェット"],
  ["big-mug", "ビッグマグカップ"],
  ["mug", "マグカップ"],
  ["glass", "グラス"],
  ["bottle", "ボトル"],
  ["sticker", "ステッカー"],
  ["towel-handkerchief", "タオルハンカチ"],
  ["hand-towel", "ハンドタオル"],
  ["towel", "タオル"],
  ["acrylic-block", "アクリルブロック"],
  ["clear-file", "クリアファイル"],
  ["notebook", "ノート"],
  ["smartphone-case", "スマホケース"],
  ["iphone", "スマホケース"],
  ["apron", "エプロン"],
  ["cushion", "クッション"],
  ["blanket", "ブランケット"],
  ["badge", "缶バッジ"],
  ["keychain", "キーホルダー"],
  ["socks", "くつ下"]
];

var SUZURI_COLORS = {
  white: "白", black: "黒", navy: "紺", natural: "ナチュラル", beige: "ベージュ",
  gray: "グレー", grey: "グレー", charcoal: "チャコール", ivory: "アイボリー",
  sand: "サンド", khaki: "カーキ", olive: "オリーブ", brown: "茶", red: "赤",
  burgundy: "バーガンディ", pink: "ピンク", purple: "紫", blue: "青", green: "緑",
  yellow: "黄", mustard: "マスタード", orange: "オレンジ", silver: "シルバー", gold: "ゴールド"
};

function suzuriInfo(url) {
  const m = /suzuri\.jp\/[^/]+\/\d+\/([^/?#]+)(?:\/([^/?#]+))?(?:\/([^/?#]+))?/.exec(String(url || ""));
  if (!m) return null;
  const slug = m[1].toLowerCase();
  let kind = "";
  for (const [k, ja] of SUZURI_ITEMS) { if (slug.indexOf(k) >= 0) { kind = ja; break; } }
  const size = (m[2] || "").toLowerCase();
  const last = (m[3] || "").toLowerCase();
  return { kind: kind, size: size, color: SUZURI_COLORS[last] || "" };
}

/* お店の定型文（クーポン案内・「◯◯がつくった◯◯」など）は使わない。
   スズリではどの品物でも同じ文になるので、品目から短い説明を組み立てる。 */
function tidyShopDesc(t, url) {
  const info = suzuriInfo(url);
  let s = String(t || "").trim();
  const boiler = /の購入ページです|がつくった|クーポン|色やサイズも選択可能/.test(s);

  if (info && info.kind && (boiler || !s)) {
    let d = "イワオトキノコのしるしが入った" + info.kind + "です。";
    if (info.size && info.size !== "one") {
      d += info.color ? info.color + "のほか、色やサイズが選べます。" : "色やサイズが選べます。";
    } else if (info.color) {
      d += info.color + "のほか、色が選べます。";
    }
    return d;
  }
  if (boiler) return "";
  s = s.replace(/[^。！!]*(クーポン|セール|送料無料)[^。！!]*[。！!]?/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, 120);
}

/* 商品URLから名前・写真・値段を読み込む */
async function fetchGoodsMeta() {
  if (!canGoods()) { status("#goodsStatus", "グッズを編集するには 314 でログインしてください", "err"); return; }
  const url = $("#g_url").value.trim();
  const msg = $("#goodsFetchMsg");
  if (!url) { status("#goodsStatus", "先に商品のURLを貼ってください", "err"); return; }
  if (!window.Kinoko) { status("#goodsStatus", "読み込みの準備ができていません", "err"); return; }
  const on = await window.Kinoko.enabled();
  if (!on) {
    status("#goodsStatus", "自動読み込みには Google スプレッドシートの接続が必要です（docs/ranking-setup.md）", "err");
    return;
  }
  const btn = $("#goodsFetch");
  btn.disabled = true;
  msg.textContent = "商品ページを読んでいます…";
  const d = await window.Kinoko.fetchMeta(ADMIN_PW, url, true);
  btn.disabled = false;
  if (!d || !d.ok) {
    msg.textContent = "読み込めませんでした（" + ((d && d.error) || "通信エラー") + "）。手で入力してください。";
    return;
  }
  const got = [];
  if (d.title) { $("#g_name").value = tidyShopTitle(d.title, url); got.push("名前"); }
  if (d.price) { $("#g_price").value = d.price; got.push("値段"); }
  const desc = tidyShopDesc(d.desc, url);
  $("#g_desc").value = desc;
  if (desc) got.push("説明");
  if (d.imageB64) { goodsPhoto = { kind: "new", b64: d.imageB64 }; renderGoodsPhoto(); got.push("写真"); }
  else if (d.image) { goodsPhoto = { kind: "existing", path: d.image }; renderGoodsPhoto(); got.push("写真(リンク)"); }
  msg.textContent = got.length
    ? "読み込みました：" + got.join("・")
      + "。説明はスズリの文がどの商品も同じなので、こちらで組み立てています。ご自分の言葉に書き直してください。"
    : "このページからは何も読み取れませんでした。手で入力してください。";
}
