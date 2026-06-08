/* =========================================================
   用宗シラス漁ものがたり  -  game.js
   指でキャラを動かして シラス漁 → 加工 → 調理 → 販売 → 経営強化
   ========================================================= */
(() => {
  "use strict";

  const SAVE_KEY = "mochimune_shirasu_save_v1";

  /* ---------- 拠点（ゾーン）定義 ---------- */
  // x,y はキャンバスに対する割合（0〜1）
  const ZONES = {
    sea:     { id: "sea",     name: "シラス漁",  stage: "①漁",   icon: "🌊", x: 0.50, y: 0.28, land: false },
    process: { id: "process", name: "加工場",    stage: "②加工", icon: "♨️", x: 0.20, y: 0.80, land: true  },
    kitchen: { id: "kitchen", name: "調理場",    stage: "③調理", icon: "🍳", x: 0.50, y: 0.80, land: true  },
    shop:    { id: "shop",    name: "販売所",    stage: "④販売", icon: "🏪", x: 0.80, y: 0.80, land: true  },
  };

  /* ---------- アップグレード定義 ---------- */
  const UPGRADES = {
    boat: {
      icon: "🚤", name: "漁船",
      lvNames: ["手こぎ船", "小型船", "中型船", "大型船", "最新鋭船", "船団"],
      costs: [200, 600, 1500, 3500, 8000],
      desc: () => "漁獲スピードと船の積載量アップ",
    },
    machine: {
      icon: "♨️", name: "加工機",
      lvNames: ["手作業", "小型釜", "大型釜", "自動釜", "高速ライン", "最新ライン"],
      costs: [150, 500, 1300, 3000, 7000],
      desc: () => "釜揚げ加工のスピードと保管量アップ",
    },
    menu: {
      icon: "🍚", name: "メニュー開発",
      lvNames: ["釜揚げシラス", "シラス丼", "沖あがり丼", "かき揚げ膳", "特上海鮮丼"],
      costs: [300, 900, 2200, 5000],
      desc: (lv) => "新メニューで売値アップ → 次：" ,
    },
    port: {
      icon: "⚓", name: "港の拡張",
      lvNames: ["小さな港", "にぎわい港", "観光港", "大漁港", "用宗ブランド港"],
      costs: [500, 1500, 4000, 9000],
      desc: () => "お客さんが増え、保管量も増加",
    },
    staff: {
      icon: "🧑‍🍳", name: "従業員を雇う",
      lvNames: ["なし", "1人（加工自動）", "2人（調理も自動）", "3人（販売も自動）"],
      costs: [400, 1200, 3000],
      desc: () => "いない場所も自動で働いてくれる",
    },
  };

  // メニューの売値（レベル別）
  const MENU_VALUE = [80, 140, 200, 280, 380];
  const PROCESSED_VALUE = 30; // 釜揚げを丼にせず直売りした場合

  /* ---------- ゲーム状態 ---------- */
  let S = newGame();

  function newGame() {
    return {
      money: 0,
      raw: 0,          // 生シラス
      processed: 0,    // 釜揚げシラス
      dishes: 0,       // 料理（丼など）
      reputation: 50,  // 評判 0〜100
      day: 1,
      dayTimer: 0,
      lv: { boat: 0, machine: 0, menu: 0, port: 0, staff: 0 },
      // 一時効果
      machineBroken: false,
      machineFixTimer: 0,
      catchMult: 1,
      catchMultTimer: 0,
      demandBonus: 0,
      demandBonusTimer: 0,
      eventTimer: 30,  // 最初のイベントまでの秒数
      totalEarned: 0,
    };
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        S = Object.assign(newGame(), d);
        S.lv = Object.assign({ boat: 0, machine: 0, menu: 0, port: 0, staff: 0 }, d.lv || {});
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ---------- 派生パラメータ ---------- */
  const params = {
    catchRate:   () => (2.0 + 1.5 * S.lv.boat) * S.catchMult,
    boatCap:     () => 12 + 8 * S.lv.boat,
    processRate: () => 1.5 + 1.2 * S.lv.machine,
    processedCap:() => 10 + 6 * S.lv.machine + 4 * S.lv.port,
    cookRate:    () => 1.0 + 0.4 * S.lv.menu,
    dishesCap:   () => 8 + 5 * S.lv.menu + 4 * S.lv.port,
    menuValue:   () => MENU_VALUE[S.lv.menu] || MENU_VALUE[0],
    sellRate:    () => (0.8 + 0.5 * S.lv.port) * (S.reputation / 50) + S.demandBonus,
  };

  /* =========================================================
     キャンバス・描画
     ========================================================= */
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;

  // 背景画像（参考画像から切り出した富士山＋用宗漁港のパノラマ）
  const bgImg = new Image();
  let bgReady = false;
  bgImg.onload = () => { bgReady = true; };
  bgImg.src = "assets/harbor-bg.png";

  // シラスのイラスト素材（生＝バケツ / 加工＝パック / 料理＝丼）
  function loadImg(src) {
    const i = new Image();
    i._ready = false;
    i.onload = () => { i._ready = true; };
    i.src = src;
    return i;
  }
  const IMG = {
    raw:  loadImg("assets/raw-shirasu.png"),
    pack: loadImg("assets/pack-shirasu.png"),
    bowl: loadImg("assets/shirasu-bowl.png"),
  };
  // 高さ指定でアスペクト維持してセンター描画。未ロード時は false
  function drawSprite(im, cx, cy, targetH) {
    if (!im || !im._ready) return false;
    const r = im.width / im.height;
    const h = targetH, w = h * r;
    ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    return true;
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  function zonePx(z) { return { x: z.x * W, y: z.y * H }; }
  const minDim = () => Math.min(W, H);
  const activationR = () => Math.max(48, minDim() * 0.16);

  /* ---------- キャラクター ---------- */
  const player = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: 0, py: 0 };
  let playerInit = false;

  function currentZone() {
    let best = null, bestD = Infinity;
    for (const k in ZONES) {
      const p = zonePx(ZONES[k]);
      const d = Math.hypot(player.px - p.x, player.py - p.y);
      if (d < activationR() && d < bestD) { bestD = d; best = ZONES[k]; }
    }
    return best;
  }

  /* ---------- 入力（タッチ＆マウス） ---------- */
  let dragging = false;
  function setTarget(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) / r.width;
    const y = (clientY - r.top) / r.height;
    player.tx = Math.max(0.04, Math.min(0.96, x));
    player.ty = Math.max(0.06, Math.min(0.94, y));
  }
  canvas.addEventListener("touchstart", (e) => {
    dragging = true; setTarget(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (dragging) setTarget(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", () => { dragging = false; });
  canvas.addEventListener("mousedown", (e) => { dragging = true; setTarget(e.clientX, e.clientY); });
  canvas.addEventListener("mousemove", (e) => { if (dragging) setTarget(e.clientX, e.clientY); });
  window.addEventListener("mouseup", () => { dragging = false; });

  /* ---------- パーティクル（+◯ 表示） ---------- */
  const particles = [];
  function pop(x, y, text, color) {
    particles.push({ x, y, text, color, life: 1, vy: -28 });
  }

  /* =========================================================
     ゲームループ
     ========================================================= */
  let paused = true;     // モーダル中・タイトル中は停止
  let last = 0;

  // 売上/秒（直近1秒の獲得額）
  let incomeRate = 0, earnTimer = 0, lastTotalEarned = 0;

  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (!paused) update(dt);
    render(t);
  }

  function update(dt) {
    if (!playerInit) { player.px = player.x * W; player.py = player.y * H; playerInit = true; }

    // キャラ移動
    const targetX = player.tx * W, targetY = player.ty * H;
    const dx = targetX - player.px, dy = targetY - player.py;
    const dist = Math.hypot(dx, dy);
    const speed = minDim() * 1.4; // px/sec
    if (dist > 2) {
      const step = Math.min(dist, speed * dt);
      player.px += (dx / dist) * step;
      player.py += (dy / dist) * step;
    }

    const zone = currentZone();
    const here = zone ? zone.id : null;
    const staff = S.lv.staff;

    // 各拠点の稼働（その場にいる or 従業員が自動化）
    const seaActive     = here === "sea";
    const processActive = here === "process" || staff >= 1;
    const cookActive    = here === "kitchen" || staff >= 2;
    const sellActive    = here === "shop"    || staff >= 3;

    // 海：シラス漁
    if (seaActive && S.raw < params.boatCap()) {
      S.raw = Math.min(params.boatCap(), S.raw + params.catchRate() * dt);
    }

    // 加工場：生 → 釜揚げ
    if (processActive && !S.machineBroken) {
      const room = params.processedCap() - S.processed;
      const amt = Math.min(params.processRate() * dt, S.raw, room);
      if (amt > 0) { S.raw -= amt; S.processed += amt; }
    }

    // 調理場：釜揚げ → 料理
    if (cookActive) {
      const room = params.dishesCap() - S.dishes;
      const amt = Math.min(params.cookRate() * dt, S.processed, room);
      if (amt > 0) { S.processed -= amt; S.dishes += amt; }
    }

    // 販売所：料理・釜揚げ → お金
    if (sellActive) {
      let cap = params.sellRate() * dt;
      // 料理を優先して売る
      if (S.dishes >= 1 && cap > 0) {
        const n = Math.min(Math.floor(cap) + (Math.random() < (cap % 1) ? 1 : 0), Math.floor(S.dishes));
        if (n > 0) {
          S.dishes -= n;
          const gain = n * params.menuValue();
          S.money += gain; S.totalEarned += gain;
          cap -= n;
          const p = zonePx(ZONES.shop);
          pop(p.x, p.y - 30, "+" + gain + "円", "#ffd24a");
          S.reputation = Math.min(100, S.reputation + n * 0.15);
        }
      }
      // 余裕があれば釜揚げを直売り
      if (cap > 0 && S.processed >= 1) {
        const n = Math.min(Math.floor(cap), Math.floor(S.processed));
        if (n > 0) {
          S.processed -= n;
          const gain = n * PROCESSED_VALUE;
          S.money += gain; S.totalEarned += gain;
          const p = zonePx(ZONES.shop);
          pop(p.x, p.y - 30, "+" + gain + "円", "#ffd24a");
        }
      }
    }

    // 一時効果の減衰
    if (S.catchMultTimer > 0) { S.catchMultTimer -= dt; if (S.catchMultTimer <= 0) S.catchMult = 1; }
    if (S.demandBonusTimer > 0) { S.demandBonusTimer -= dt; if (S.demandBonusTimer <= 0) S.demandBonus = 0; }
    if (S.machineBroken && S.machineFixTimer > 0) {
      S.machineFixTimer -= dt;
      if (S.machineFixTimer <= 0) { S.machineBroken = false; toast("加工機が直った！", "good"); }
    }

    // 売上/秒の更新
    earnTimer += dt;
    if (earnTimer >= 1) {
      incomeRate = (S.totalEarned - lastTotalEarned) / earnTimer;
      lastTotalEarned = S.totalEarned;
      earnTimer = 0;
    }

    // 日数の経過
    S.dayTimer += dt;
    if (S.dayTimer >= 45) { S.dayTimer = 0; S.day++; toast("☀️ " + S.day + "日目の朝", ""); }

    // ランダムイベント
    S.eventTimer -= dt;
    if (S.eventTimer <= 0) { triggerRandomEvent(); S.eventTimer = 22 + Math.random() * 20; }

    // パーティクル更新
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.y += p.vy * dt; p.life -= dt * 1.1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    updateHUD(zone);
    saveThrottle(dt);
  }

  let saveAcc = 0;
  function saveThrottle(dt) { saveAcc += dt; if (saveAcc > 3) { saveAcc = 0; save(); } }

  /* =========================================================
     描画
     ========================================================= */
  function render(t) {
    ctx.clearRect(0, 0, W, H);

    // 背景：富士山＋漁港パノラマを上部にフル幅で配置
    const bandH = bgReady ? W * (bgImg.height / bgImg.width) : H * 0.32;
    if (bgReady) {
      ctx.drawImage(bgImg, 0, 0, W, bandH);
    } else {
      let sg = ctx.createLinearGradient(0, 0, 0, bandH);
      sg.addColorStop(0, "#bfe6f5"); sg.addColorStop(1, "#1a6fa0");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, bandH);
    }

    const dockTop = H * 0.66;

    // 海（漁エリア）：パノラマ下端から桟橋まで
    let g = ctx.createLinearGradient(0, bandH, 0, dockTop);
    g.addColorStop(0, "#2b86a8");
    g.addColorStop(1, "#0f5a78");
    ctx.fillStyle = g;
    ctx.fillRect(0, bandH - 1, W, dockTop - bandH + 1);

    // 波
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      const yy = bandH + (dockTop - bandH) * (0.18 + row * 0.22);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const y = yy + Math.sin((x * 0.03) + t * 0.002 + row) * 4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 桟橋（木のデッキ）
    g = ctx.createLinearGradient(0, dockTop, 0, H);
    g.addColorStop(0, "#b98a5a");
    g.addColorStop(1, "#9a6f44");
    ctx.fillStyle = g;
    ctx.fillRect(0, dockTop, W, H - dockTop);
    // 岸壁ライン
    ctx.fillStyle = "#7a5a3a";
    ctx.fillRect(0, dockTop - 5, W, 7);
    // 板の継ぎ目
    ctx.strokeStyle = "rgba(0,0,0,0.10)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, dockTop); ctx.lineTo(x, H); ctx.stroke();
    }

    // 生産フローの矢印（① → ② → ③ → ④）
    drawFlowArrows();

    // 拠点を描画
    drawSea(t);
    drawBuilding(ZONES.process, buildBarRaw());
    drawBuilding(ZONES.kitchen, buildBarProcessed());
    drawBuilding(ZONES.shop, buildBarDishes());

    // アクティブ拠点のハイライト
    const zone = currentZone();
    if (zone) {
      const p = zonePx(zone);
      ctx.beginPath();
      ctx.arc(p.x, p.y, activationR(), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,200,80,0.9)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 目的地マーカー
    if (Math.hypot(player.tx * W - player.px, player.ty * H - player.py) > 6) {
      ctx.beginPath();
      ctx.arc(player.tx * W, player.ty * H, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }

    drawPlayer(t);

    // パーティクル
    ctx.textAlign = "center";
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  // 拠点のレベルと効率%（タイクーン風表示用）
  function zoneLv(id) {
    return { sea: S.lv.boat, process: S.lv.machine, kitchen: S.lv.menu, shop: S.lv.port }[id];
  }
  function zoneEffPct(id) {
    switch (id) {
      case "sea":     return Math.round(((params.catchRate() / S.catchMult) / 2.0 - 1) * 100);
      case "process": return Math.round((params.processRate() / 1.5 - 1) * 100);
      case "kitchen": return Math.round((params.cookRate() / 1.0 - 1) * 100);
      case "shop":    return Math.round(((0.8 + 0.5 * S.lv.port) / 0.8 - 1) * 100);
    }
    return 0;
  }

  function drawFlowArrows() {
    const sea = zonePx(ZONES.sea), pr = zonePx(ZONES.process),
          ki = zonePx(ZONES.kitchen), sh = zonePx(ZONES.shop);
    arrow(sea.x - minDim() * 0.12, sea.y + activationR() * 0.7, pr.x, pr.y - minDim() * 0.16);
    arrow(pr.x + minDim() * 0.12, pr.y, ki.x - minDim() * 0.12, ki.y);
    arrow(ki.x + minDim() * 0.12, ki.y, sh.x - minDim() * 0.12, sh.y);
  }

  function drawSea(t) {
    const p = zonePx(ZONES.sea);
    // 漁場の輪
    ctx.beginPath();
    ctx.arc(p.x, p.y, activationR() * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    // ブイ
    emoji("🛟", p.x + activationR() * 0.7, p.y - activationR() * 0.45, 22);
    // 生シラス（バケツ）＆数量
    if (!drawSprite(IMG.raw, p.x, p.y, activationR() * 1.15)) {
      emoji("🐟", p.x, p.y, 30 + (S.lv.boat * 2));
    }
    const txt = Math.floor(S.raw) + " / " + params.boatCap();
    badge(txt, p.x, p.y + activationR() * 0.55);
    // ステージ見出し＋Lv/効率
    stageHeader(ZONES.sea, p.x, p.y - activationR() * 0.78);
  }

  function drawBuilding(z, bar) {
    const p = zonePx(z);
    const w = Math.max(64, minDim() * 0.2);
    const h = w * 0.7;
    // 建物
    roundRect(p.x - w / 2, p.y - h / 2, w, h, 10);
    ctx.fillStyle = "#fff7e8";
    ctx.fill();
    ctx.strokeStyle = "#b58a55";
    ctx.lineWidth = 3;
    ctx.stroke();
    // 屋根
    ctx.beginPath();
    ctx.moveTo(p.x - w / 2 - 6, p.y - h / 2);
    ctx.lineTo(p.x, p.y - h / 2 - h * 0.34);
    ctx.lineTo(p.x + w / 2 + 6, p.y - h / 2);
    ctx.closePath();
    ctx.fillStyle = "#c0584e";
    ctx.fill();
    // アイコン（加工＝パック / 調理＝丼 のイラスト、無ければ絵文字）
    const sprite = { process: IMG.pack, kitchen: IMG.bowl }[z.id];
    if (!drawSprite(sprite, p.x, p.y + 2, h * 0.95)) {
      emoji(z.icon, p.x, p.y - 2, Math.min(40, w * 0.42));
    }
    // 販売所には商品（丼）を添える
    if (z.id === "shop") drawSprite(IMG.bowl, p.x + w * 0.34, p.y + h * 0.12, h * 0.5);
    // 故障表示
    if (z.id === "process" && S.machineBroken) {
      emoji("🔧", p.x + w * 0.32, p.y - h * 0.32, 22);
    }
    // ステージ見出し（屋根の上）
    stageHeader(z, p.x, p.y - h / 2 - h * 0.34 - 10);
    // 在庫バー
    drawBar(p.x - w / 2, p.y + h / 2 + 6, w, 8, bar.ratio, bar.color, bar.text);
    // Lv ＋ 効率%
    lvBadge(z.id, p.x, p.y + h / 2 + 30);
  }

  // ステージ見出し（①漁 など）
  function stageHeader(z, x, y) {
    ctx.font = "bold 13px sans-serif";
    const w = ctx.measureText(z.stage + " " + z.name).width + 16;
    roundRect(x - w / 2, y - 11, w, 22, 11);
    ctx.fillStyle = "rgba(20,98,127,0.92)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(z.stage + " " + z.name, x, y);
  }

  // Lv ＋ 効率%（緑バッジ）
  function lvBadge(id, x, y) {
    const lv = zoneLv(id);
    const eff = zoneEffPct(id);
    const txt = "Lv." + lv + (eff > 0 ? "  +" + eff + "%" : "");
    ctx.font = "bold 12px sans-serif";
    const w = ctx.measureText(txt).width + 14;
    roundRect(x - w / 2, y - 10, w, 20, 10);
    ctx.fillStyle = eff > 0 ? "rgba(54,179,126,0.95)" : "rgba(120,130,140,0.9)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, y);
  }

  function buildBarRaw() {
    return { ratio: S.processed / params.processedCap(), color: "#36b37e",
             text: "釜揚げ " + Math.floor(S.processed) + "/" + params.processedCap() };
  }
  function buildBarProcessed() {
    return { ratio: S.dishes / params.dishesCap(), color: "#e8923a",
             text: "料理 " + Math.floor(S.dishes) + "/" + params.dishesCap() };
  }
  function buildBarDishes() {
    return { ratio: Math.min(1, S.reputation / 100), color: "#d6a93a",
             text: "評判 " + Math.round(S.reputation) };
  }

  function drawPlayer(t) {
    const bob = Math.sin(t * 0.006) * 3;
    const x = player.px, y = player.py + bob;
    // 影
    ctx.beginPath();
    ctx.ellipse(player.px, player.py + 16, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
    // 体
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#ff8c42";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    emoji("🎣", x, y, 22);
  }

  /* ---------- 描画ユーティリティ ---------- */
  function emoji(ch, x, y, size) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = size + "px sans-serif";
    ctx.fillText(ch, x, y);
  }
  function label(text, x, y) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#20323c";
    ctx.fillText(text, x, y);
  }
  function badge(text, x, y) {
    ctx.font = "bold 14px sans-serif";
    const w = ctx.measureText(text).width + 16;
    roundRect(x - w / 2, y - 11, w, 22, 11);
    ctx.fillStyle = "rgba(32,50,60,0.85)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }
  function drawBar(x, y, w, h, ratio, color, text) {
    ratio = Math.max(0, Math.min(1, ratio || 0));
    roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fill();
    if (ratio > 0) {
      roundRect(x, y, w * ratio, h, h / 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    if (text) {
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#20323c";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(text, x + w / 2, y + h + 2);
    }
  }
  function arrow(x1, y1, x2, y2) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = 12;
    ctx.strokeStyle = "rgba(255,140,66,0.9)";
    ctx.fillStyle = "rgba(255,140,66,0.9)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(ang) * head, y2 - Math.sin(ang) * head);
    ctx.stroke();
    // 矢じり
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
    ctx.lineCap = "butt";
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* =========================================================
     HUD / トースト
     ========================================================= */
  const el = (id) => document.getElementById(id);
  function updateHUD(zone) {
    el("hud-money").textContent = Math.floor(S.money).toLocaleString();
    el("hud-rate").textContent = Math.round(incomeRate).toLocaleString();
    el("hud-raw").textContent = Math.floor(S.raw);
    el("hud-processed").textContent = Math.floor(S.processed);
    el("hud-dishes").textContent = Math.floor(S.dishes);
    el("hud-rep").textContent = Math.round(S.reputation);
    el("hud-day").textContent = S.day;

    const banner = el("action-banner");
    if (zone) {
      banner.classList.remove("hidden");
      banner.textContent = zone.icon + " " + zone.name + " で作業中…";
    } else {
      banner.classList.add("hidden");
    }
  }

  function toast(msg, type) {
    const area = el("toast-area");
    const d = document.createElement("div");
    d.className = "toast " + (type || "");
    d.textContent = msg;
    area.appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

  /* =========================================================
     ランダムイベント
     ========================================================= */
  function triggerRandomEvent() {
    const pool = [];
    // マイナス
    if (!S.machineBroken && S.lv.machine >= 0) pool.push({ w: 3, fn: evMachineBreak });
    pool.push({ w: 3, fn: evPoorCatch });
    if (S.reputation > 20) pool.push({ w: 2, fn: evComplaint });
    // プラス
    pool.push({ w: 2, fn: evGoodCatch });
    pool.push({ w: 2, fn: evTourBus });

    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    for (const p of pool) { if ((r -= p.w) <= 0) { p.fn(); return; } }
  }

  function evPoorCatch() {
    S.catchMult = 0.4; S.catchMultTimer = 15;
    toast("🌊 不漁…しばらくシラスが獲れにくい", "bad");
  }
  function evGoodCatch() {
    S.catchMult = 2.2; S.catchMultTimer = 14;
    toast("🐟 大漁の群れ発見！漁獲アップ", "good");
  }
  function evTourBus() {
    S.demandBonus = 1.5; S.demandBonusTimer = 16;
    S.reputation = Math.min(100, S.reputation + 5);
    toast("🚌 観光バス到着！お客さんが急増", "good");
  }
  function evComplaint() {
    const cost = Math.min(S.money, 200 + S.lv.menu * 100);
    showEvent("😣", "クレーム発生",
      "「シラスの鮮度が落ちてる！」とお客さんからクレーム。評判が下がりました。",
      [
        { label: "謝罪する（" + Math.round(cost) + "円）", primary: true, fn: () => {
            S.money -= cost; S.reputation = Math.min(100, S.reputation + 8);
            toast("誠意ある対応で信頼回復", "good");
          } },
        { label: "気にしない", fn: () => {
            S.reputation = Math.max(0, S.reputation - 15);
            toast("評判が下がった…", "bad");
          } },
      ]);
  }
  function evMachineBreak() {
    const cost = 150 + S.lv.machine * 120;
    showEvent("🔧", "加工機が故障！",
      "釜揚げの加工機が止まってしまった。直さないと加工ができません。",
      [
        { label: "すぐ修理（" + cost + "円）", primary: true, fn: () => {
            if (S.money >= cost) { S.money -= cost; toast("加工機を修理した！", "good"); }
            else { S.machineBroken = true; S.machineFixTimer = 15; toast("お金が足りず自力修理中…", "bad"); }
          } },
        { label: "自分で直す（15秒）", fn: () => {
            S.machineBroken = true; S.machineFixTimer = 15;
            toast("加工機が止まっている…", "bad");
          } },
      ]);
  }

  function showEvent(icon, title, desc, actions) {
    paused = true;
    el("event-icon").textContent = icon;
    el("event-title").textContent = title;
    el("event-desc").textContent = desc;
    const box = el("event-actions");
    box.innerHTML = "";
    actions.forEach((a) => {
      const b = document.createElement("button");
      b.textContent = a.label;
      if (!a.primary) b.className = "secondary";
      b.onclick = () => { a.fn(); closeModal("event-modal"); save(); };
      box.appendChild(b);
    });
    el("event-modal").classList.remove("hidden");
  }

  /* =========================================================
     ショップ（アップグレード）
     ========================================================= */
  function renderShop() {
    el("shop-money").textContent = Math.floor(S.money).toLocaleString();
    const list = el("shop-list");
    list.innerHTML = "";
    for (const key in UPGRADES) {
      const u = UPGRADES[key];
      const lv = S.lv[key];
      const maxLv = u.costs.length;
      const isMax = lv >= maxLv;
      const cost = isMax ? 0 : u.costs[lv];

      const item = document.createElement("div");
      item.className = "shop-item";

      const nextName = u.lvNames[Math.min(lv + 1, u.lvNames.length - 1)];
      let descTxt = u.desc(lv);
      if (key === "menu") descTxt = "新メニューで売値アップ → 次：「" + nextName + "」(" + (MENU_VALUE[Math.min(lv + 1, MENU_VALUE.length - 1)]) + "円)";

      item.innerHTML =
        '<div class="si-ico">' + u.icon + "</div>" +
        '<div class="si-body">' +
          '<div class="si-name">' + u.name + "</div>" +
          '<div class="si-lv">現在：' + u.lvNames[lv] + "（Lv." + lv + "/" + maxLv + "）</div>" +
          '<div class="si-desc">' + descTxt + "</div>" +
        "</div>";

      const btn = document.createElement("button");
      btn.className = "buy-btn";
      if (isMax) { btn.textContent = "MAX"; btn.classList.add("maxed"); btn.disabled = true; }
      else {
        btn.textContent = cost.toLocaleString() + "円";
        btn.disabled = S.money < cost;
        btn.onclick = () => buy(key);
      }
      item.appendChild(btn);
      list.appendChild(item);
    }
  }

  function buy(key) {
    const u = UPGRADES[key];
    const lv = S.lv[key];
    if (lv >= u.costs.length) return;
    const cost = u.costs[lv];
    if (S.money < cost) return;
    S.money -= cost;
    S.lv[key]++;
    toast("⬆️ " + u.name + " → " + u.lvNames[S.lv[key]], "good");
    save();
    renderShop();
  }

  /* =========================================================
     画面・モーダル制御
     ========================================================= */
  function openModal(id) {
    paused = true;
    if (id === "shop-modal") renderShop();
    el(id).classList.remove("hidden");
  }
  function closeModal(id) {
    el(id).classList.add("hidden");
    // 他にモーダルが開いておらず、ゲーム中（タイトル非表示）なら再開
    const anyOpen = [...document.querySelectorAll(".modal")].some((m) => !m.classList.contains("hidden"));
    const inGame = el("title-screen").classList.contains("hidden");
    if (!anyOpen && inGame) paused = false;
  }

  function startGame() {
    el("title-screen").classList.add("hidden");
    el("game-screen").classList.remove("hidden");
    resize();
    playerInit = false;
    lastTotalEarned = S.totalEarned;
    incomeRate = 0; earnTimer = 0;
    paused = false;
  }

  /* ---------- ボタン配線 ---------- */
  el("start-btn").addEventListener("click", () => { load(); startGame(); });
  el("reset-btn").addEventListener("click", () => {
    if (confirm("最初からやり直しますか？（セーブが消えます）")) {
      localStorage.removeItem(SAVE_KEY);
      S = newGame();
      startGame();
    }
  });
  el("shop-btn").addEventListener("click", () => openModal("shop-modal"));
  el("help-btn").addEventListener("click", () => openModal("help-modal"));
  document.querySelectorAll(".close-btn").forEach((b) => {
    b.addEventListener("click", () => closeModal(b.dataset.close));
  });

  /* ---------- 起動 ---------- */
  resize();
  requestAnimationFrame(loop);
})();
