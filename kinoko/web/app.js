/* =========================================================
   長岡きのこ採集記  —  アプリ本体（依存ライブラリなし）
   ========================================================= */

const EDIBILITY_COLORS = {
  "食用": "#4f7a45",
  "毒": "#b03a2e",
  "食不適": "#9a8f73",
};

const state = {
  all: [],
  meta: {},
  search: "",
  edibility: "すべて",
  sort: "date-desc",
};

const $ = (sel) => document.querySelector(sel);

/* ---------- 初期化 ---------- */
init();

async function init() {
  try {
    const res = await fetch("data/records.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.all = data.records || [];
    state.meta = data.meta || {};
  } catch (err) {
    // file:// で開いた場合など fetch に失敗しても画面を壊さない
    console.warn("records.json を読み込めませんでした:", err);
    showLoadError();
    return;
  }
  renderStats();
  renderEdibilityFilter();
  bindControls();
  render();
}

/* ---------- 統計 ---------- */
function renderStats() {
  const recs = state.all;
  const species = new Set(recs.map((r) => r.wamei)).size;
  const years = recs.map((r) => new Date(r.date).getFullYear()).filter(Boolean);
  const span = years.length ? Math.max(...years) - Math.min(...years) + 1 : 0;
  const areas = new Set(recs.map((r) => (r.area || "").split(" ")[0]).filter(Boolean)).size;

  const stats = [
    { num: recs.length, label: "採集記録" },
    { num: species, label: "種類" },
    { num: span ? `${span}` : "—", label: "年にわたる記録" },
    { num: areas, label: "採集エリア" },
  ];
  $("#stats").innerHTML = stats
    .map((s) => `<div class="stat"><div class="stat__num">${s.num}</div><div class="stat__label">${s.label}</div></div>`)
    .join("");
}

/* ---------- 食毒フィルタ ---------- */
function renderEdibilityFilter() {
  const kinds = ["すべて", ...Object.keys(EDIBILITY_COLORS)];
  $("#edibilityFilter").innerHTML = kinds
    .map((k) => {
      const dot = EDIBILITY_COLORS[k]
        ? `<span class="dot" style="background:${EDIBILITY_COLORS[k]}"></span>`
        : "";
      const pressed = k === state.edibility ? "true" : "false";
      return `<button class="chip" data-edibility="${k}" aria-pressed="${pressed}">${dot}${k}</button>`;
    })
    .join("");
}

/* ---------- イベント ---------- */
function bindControls() {
  $("#search").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    render();
  });
  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  $("#edibilityFilter").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.edibility = btn.dataset.edibility;
    document.querySelectorAll("#edibilityFilter .chip").forEach((c) =>
      c.setAttribute("aria-pressed", c === btn ? "true" : "false")
    );
    render();
  });
  $("#modeToggle").addEventListener("click", (e) => {
    const on = document.body.classList.toggle("book-mode");
    e.target.setAttribute("aria-pressed", on ? "true" : "false");
    e.target.textContent = on ? "通常モード" : "図鑑モード";
  });

  // モーダル
  $("#modal").addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ---------- 絞り込み・並び替え ---------- */
function getVisible() {
  let list = [...state.all];

  if (state.edibility !== "すべて") {
    list = list.filter((r) => r.edibility === state.edibility);
  }
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter((r) =>
      [r.wamei, r.kana, r.gakumei, r.family, r.area, r.habitat, r.host, ...(r.aka || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  switch (state.sort) {
    case "date-asc":
      list.sort((a, b) => a.date.localeCompare(b.date));
      break;
    case "name":
      list.sort((a, b) => (a.kana || a.wamei).localeCompare(b.kana || b.wamei, "ja"));
      break;
    case "rating":
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default: // date-desc
      list.sort((a, b) => b.date.localeCompare(a.date));
  }
  return list;
}

/* ---------- 描画 ---------- */
function render() {
  const list = getVisible();
  const gallery = $("#gallery");
  $("#empty").hidden = list.length > 0;
  gallery.innerHTML = list.map(cardHTML).join("");

  gallery.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => {
      if (document.body.classList.contains("book-mode")) return;
      openModal(el.dataset.id);
    });
  });
}

function photoHTML(r, placeholderClass = "card__placeholder") {
  if (r.photo) {
    return `<img src="${escapeAttr(r.photo)}" alt="${escapeAttr(r.wamei)}" loading="lazy" />`;
  }
  return `<span class="${placeholderClass}">菌</span>`;
}

function cardHTML(r) {
  const warn = (r.lookalikes && r.lookalikes.length)
    ? `<span class="card__warn">⚠ 似た毒きのこに注意</span>`
    : "";
  return `
  <article class="card" data-id="${r.id}">
    <div class="card__photo">
      <span class="badge badge--${r.edibility}">${r.edibility}</span>
      ${photoHTML(r)}
    </div>
    <div class="card__body">
      <h2 class="card__wamei">${escapeHTML(r.wamei)}</h2>
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

/* ---------- モーダル ---------- */
function openModal(id) {
  const r = state.all.find((x) => x.id === id);
  if (!r) return;
  const edClass = r.edibility === "食用" ? "edible" : r.edibility === "毒" ? "poison" : "unfit";

  const dl = [
    ["採集日", formatDate(r.date)],
    ["科", r.family],
    ["別名", (r.aka || []).join("・")],
    ["採集地", r.area],
    ["標高", r.elevation ? `${r.elevation} m` : ""],
    ["発生環境", r.habitat],
    ["共生・宿主", r.host],
    ["季節", r.season],
    ["天候", r.weather],
    ["採集量", r.quantity],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHTML(v)}</dd>`)
    .join("");

  const sections = [];
  if (r.taste) sections.push(section("味・食べ方", `<p>${escapeHTML(r.taste)}</p>`));
  if (r.notes) sections.push(section("覚え書き", `<p>${escapeHTML(r.notes)}</p>`));
  if (r.caution || (r.lookalikes && r.lookalikes.length)) {
    const look = (r.lookalikes && r.lookalikes.length)
      ? `<div class="lookalikes">${r.lookalikes.map((l) => `<span class="lookalike">${escapeHTML(l)}</span>`).join("")}</div>`
      : "";
    sections.push(
      section(
        "注意・似たきのこ",
        `<div class="caution-box"><strong>⚠</strong> ${escapeHTML(r.caution || "判別に注意が必要です。")}</div>${look}`
      )
    );
  }

  const rating = r.rating
    ? `<div class="modal__section"><span class="rating">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span></div>`
    : "";

  $("#modalBody").innerHTML = `
    <div class="modal__hero">${photoHTML(r)}</div>
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

  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
}

function section(title, inner) {
  return `<div class="modal__section"><h3>${title}</h3>${inner}</div>`;
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

/* ---------- ユーティリティ ---------- */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function escapeAttr(s) { return escapeHTML(s); }

function showLoadError() {
  $("#gallery").innerHTML = "";
  const empty = $("#empty");
  empty.hidden = false;
  empty.innerHTML =
    "データを読み込めませんでした。<br />ローカルで開く場合は簡易サーバー（例：<code>python3 -m http.server</code>）経由でアクセスしてください。";
}
