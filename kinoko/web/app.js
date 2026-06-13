/* =========================================================
   石原巖のキノコ採集記録  —  アプリ本体（依存ライブラリなし）
   index.html（ホーム）と zukan.html（図鑑）の両方で動作
   ========================================================= */

const EDIBILITY_COLORS = { "食用": "#5a7d4a", "毒": "#b03a2e", "食不適": "#9a8f73" };
const HOME_PREVIEW_COUNT = 8;

const state = {
  records: [],
  columns: [],
  meta: {},
  search: "",
  edibility: "すべて",
  sort: "date-desc",
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isZukan = !!$("#gallery");

init();

async function init() {
  setYear();
  bindNav();
  bindModal();

  try {
    const res = await fetch("data/records.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.records = data.records || [];
    state.meta = data.meta || {};
  } catch (err) {
    console.warn("records.json を読み込めませんでした:", err);
    showLoadError();
    return;
  }

  if (isZukan) {
    renderStats();
    renderEdibilityFilter();
    bindControls();
    renderGallery();
  } else {
    renderHome();
    await loadColumns();
  }
}

/* ---------------- ホーム ---------------- */
function renderHome() {
  const cnt = $("#aboutCount");
  if (cnt) cnt.textContent = `${state.records.length}種を記録（順次追加中）`;

  const preview = [...state.records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, HOME_PREVIEW_COUNT);
  const grid = $("#galleryPreview");
  if (grid) {
    grid.innerHTML = preview.map(cardHTML).join("");
    hydratePhotos(grid);
    bindCardClicks(grid);
  }
}

async function loadColumns() {
  const grid = $("#columnGrid");
  if (!grid) return;
  try {
    const res = await fetch("data/columns.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.columns = data.columns || [];
  } catch (err) {
    console.warn("columns.json を読み込めませんでした:", err);
    grid.closest(".column-sec")?.style.setProperty("display", "none");
    return;
  }
  grid.innerHTML = state.columns.map(columnCardHTML).join("");
  hydratePhotos(grid);
  grid.querySelectorAll(".col-card").forEach((el) =>
    el.addEventListener("click", () => openColumn(el.dataset.id))
  );
}

/* ---------------- 図鑑（zukan） ---------------- */
function renderStats() {
  const recs = state.records;
  const species = new Set(recs.map((r) => r.wamei)).size;
  const years = recs.map((r) => new Date(r.date).getFullYear()).filter(Boolean);
  const span = years.length ? Math.max(...years) - Math.min(...years) + 1 : 0;
  const areas = new Set(recs.map((r) => (r.area || "").split(" ")[0]).filter(Boolean)).size;
  const stats = [
    { num: recs.length, label: "採集記録" },
    { num: species, label: "種類" },
    { num: span || "—", label: "年にわたる記録" },
    { num: areas, label: "採集エリア" },
  ];
  $("#stats").innerHTML = stats
    .map((s) => `<div class="stat"><div class="stat__num">${s.num}</div><div class="stat__label">${s.label}</div></div>`)
    .join("");
}

function renderEdibilityFilter() {
  const kinds = ["すべて", ...Object.keys(EDIBILITY_COLORS)];
  $("#edibilityFilter").innerHTML = kinds
    .map((k) => {
      const dot = EDIBILITY_COLORS[k] ? `<span class="dot" style="background:${EDIBILITY_COLORS[k]}"></span>` : "";
      return `<button class="chip" data-edibility="${k}" aria-pressed="${k === state.edibility}">${dot}${k}</button>`;
    })
    .join("");
}

function bindControls() {
  $("#search").addEventListener("input", (e) => { state.search = e.target.value.trim(); renderGallery(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGallery(); });
  $("#edibilityFilter").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.edibility = btn.dataset.edibility;
    $$("#edibilityFilter .chip").forEach((c) => c.setAttribute("aria-pressed", c === btn));
    renderGallery();
  });
  $("#modeToggle").addEventListener("click", (e) => {
    const on = document.body.classList.toggle("book-mode");
    e.target.setAttribute("aria-pressed", on);
    e.target.textContent = on ? "通常モード" : "図鑑モード";
  });
}

function getVisible() {
  let list = [...state.records];
  if (state.edibility !== "すべて") list = list.filter((r) => r.edibility === state.edibility);
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter((r) =>
      [r.wamei, r.kana, r.gakumei, r.family, r.area, r.habitat, r.host, ...(r.aka || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }
  switch (state.sort) {
    case "date-asc": list.sort((a, b) => a.date.localeCompare(b.date)); break;
    case "name": list.sort((a, b) => (a.kana || a.wamei).localeCompare(b.kana || b.wamei, "ja")); break;
    case "rating": list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    default: list.sort((a, b) => b.date.localeCompare(a.date));
  }
  return list;
}

function renderGallery() {
  const list = getVisible();
  const grid = $("#gallery");
  $("#empty").hidden = list.length > 0;
  grid.innerHTML = list.map(cardHTML).join("");
  hydratePhotos(grid);
  bindCardClicks(grid);
}

/* ---------------- カード ---------------- */
function photoAttr(photo) { return photo ? `data-photo="${escapeAttr(photo)}"` : ""; }

function cardHTML(r) {
  const warn = r.lookalikes && r.lookalikes.length ? `<span class="card__warn">⚠ 似た毒キノコに注意</span>` : "";
  return `
  <article class="card" data-id="${r.id}">
    <div class="card__media">
      <span class="badge badge--${r.edibility}">${r.edibility}</span>
      <div class="ph" ${photoAttr(r.photo)} data-label="${escapeAttr(r.wamei)}"></div>
    </div>
    <div class="card__body">
      <h3 class="card__wamei">${escapeHTML(r.wamei)}</h3>
      <p class="card__gakumei">${escapeHTML(r.gakumei || "")}</p>
      <div class="card__meta">
        <span>📅 ${formatDate(r.date)}</span>
        <span>📍 ${escapeHTML(r.area || "—")}</span>
        <span>🌲 ${escapeHTML(r.habitat || "—")}</span>
        ${warn}
      </div>
      <div class="card__entry-extra">
        ${r.notes ? `<p>${escapeHTML(r.notes)}</p>` : ""}
        ${r.caution ? `<p class="card__warn">注意：${escapeHTML(r.caution)}</p>` : ""}
      </div>
    </div>
  </article>`;
}

function columnCardHTML(c) {
  return `
  <article class="col-card" data-id="${c.id}">
    <div class="col-card__media"><div class="ph" ${photoAttr(c.image)} data-label="${escapeAttr(c.tag || "コラム")}"></div></div>
    <div class="col-card__tag">${escapeHTML(c.tag || "コラム")}<span class="col-card__date">${formatDate(c.date)}</span></div>
    <h3 class="col-card__title">${escapeHTML(c.title)}</h3>
    <p class="col-card__excerpt">${escapeHTML(c.excerpt || "")}</p>
  </article>`;
}

function bindCardClicks(root) {
  root.querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => {
      if (document.body.classList.contains("book-mode")) return;
      openModal(el.dataset.id);
    })
  );
}

/* ---------------- 画像のフォールバック ---------------- */
function hydratePhotos(root) {
  $$(".ph[data-photo]", root).forEach((el) => {
    const url = el.getAttribute("data-photo");
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${url}")`;
      el.setAttribute("data-loaded", "1");
    };
    img.src = url; // 失敗時はプレースホルダのまま
  });
}

/* ---------------- モーダル ---------------- */
function openModal(id) {
  const r = state.records.find((x) => x.id === id);
  if (!r) return;
  const edClass = r.edibility === "食用" ? "edible" : r.edibility === "毒" ? "poison" : "unfit";
  const dl = [
    ["採集日", formatDate(r.date)], ["科", r.family], ["別名", (r.aka || []).join("・")],
    ["採集地", r.area], ["標高", r.elevation ? `${r.elevation} m` : ""], ["発生環境", r.habitat],
    ["共生・宿主", r.host], ["季節", r.season], ["天候", r.weather], ["採集量", r.quantity],
  ].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${escapeHTML(v)}</dd>`).join("");

  const sections = [];
  if (r.taste) sections.push(section("味・食べ方", `<p>${escapeHTML(r.taste)}</p>`));
  if (r.notes) sections.push(section("覚え書き", `<p>${escapeHTML(r.notes)}</p>`));
  if (r.caution || (r.lookalikes && r.lookalikes.length)) {
    const look = r.lookalikes && r.lookalikes.length
      ? `<div class="lookalikes">${r.lookalikes.map((l) => `<span class="lookalike">${escapeHTML(l)}</span>`).join("")}</div>` : "";
    sections.push(section("注意・似たキノコ",
      `<div class="caution-box"><strong>⚠</strong> ${escapeHTML(r.caution || "判別に注意が必要です。")}</div>${look}`));
  }
  const rating = r.rating ? `<div class="modal__section"><span class="rating">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span></div>` : "";

  $("#modalBody").innerHTML = `
    <div class="modal__hero"><div class="ph" ${photoAttr(r.photo)} data-label="${escapeAttr(r.wamei)}"></div></div>
    <div class="modal__content">
      <h2 class="modal__wamei" id="modalTitle">${escapeHTML(r.wamei)} <span class="modal__kana">（${escapeHTML(r.kana || "")}）</span></h2>
      <p class="modal__gakumei">${escapeHTML(r.gakumei || "")}</p>
      <div class="modal__tags">
        <span class="tag tag--${edClass}">${escapeHTML(r.edibility)}</span>
        ${r.family ? `<span class="tag">${escapeHTML(r.family)}</span>` : ""}
        ${r.season ? `<span class="tag">${escapeHTML(r.season)}</span>` : ""}
      </div>
      <dl class="dl">${dl}</dl>
      ${sections.join("")}
      ${rating}
    </div>`;
  hydratePhotos($("#modalBody"));
  openModalShell();
}

function openColumn(id) {
  const c = state.columns.find((x) => x.id === id);
  if (!c) return;
  const body = (c.body || "").split("\n").filter(Boolean).map((p) => `<p>${escapeHTML(p)}</p>`).join("");
  $("#modalBody").innerHTML = `
    <div class="modal__hero"><div class="ph" ${photoAttr(c.image)} data-label="${escapeAttr(c.tag || "コラム")}"></div></div>
    <div class="modal__content">
      <div class="modal__tags"><span class="tag">${escapeHTML(c.tag || "コラム")}</span><span class="tag">${formatDate(c.date)}</span></div>
      <h2 class="modal__wamei" id="modalTitle">${escapeHTML(c.title)}</h2>
      <div class="modal__section col-body">${body}</div>
    </div>`;
  hydratePhotos($("#modalBody"));
  openModalShell();
}

function section(title, inner) { return `<div class="modal__section"><h3>${title}</h3>${inner}</div>`; }
function openModalShell() { $("#modal").hidden = false; document.body.style.overflow = "hidden"; }
function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }

function bindModal() {
  const modal = $("#modal");
  if (!modal) return;
  modal.addEventListener("click", (e) => { if (e.target.dataset.close !== undefined) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

/* ---------------- ナビ ---------------- */
function bindNav() {
  const burger = $("#hamburger");
  const drawer = $("#drawer");
  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const open = drawer.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
    });
    drawer.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => { drawer.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); })
    );
  }
  const topbar = $(".topbar");
  if (topbar && document.body.classList.contains("home")) {
    const onScroll = () => topbar.classList.toggle("scrolled", window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}

/* ---------------- ユーティリティ ---------------- */
function setYear() { const y = $("#year"); if (y) y.textContent = new Date().getFullYear(); }
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) { return escapeHTML(s); }
function showLoadError() {
  const grid = $("#galleryPreview") || $("#gallery");
  if (grid) grid.innerHTML = `<p class="empty">データを読み込めませんでした。ローカルでは簡易サーバー（例：<code>python3 -m http.server</code>）経由で開いてください。</p>`;
}
