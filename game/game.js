/* =========================================================
   用宗シラス漁ものがたり  -  game.js（縦スクロール・運搬型）
   下＝陸（加工/調理/販売＋客）｜中＝通常の海（船で漁）｜上＝大漁場（大型船で解放）
   指で漁師を上下に動かす。魚に重なって漁→担いで運搬→加工→調理→販売。
   ========================================================= */
(() => {
  "use strict";

  const SAVE_KEY = "mochimune_shirasu_save_v3";

  const ITEM = { raw: "raw", pack: "pack", bowl: "bowl" };

  /* ---------- ワールド上の縦配置（worldH に対する割合） ----------
     0.00–0.30 : 大漁場（プレミアム／大型船で解放）
     0.30–0.62 : 通常の海（船で漁）
     0.62      : 岸壁ライン
     0.62–1.00 : 陸（加工場・調理場・販売所・お客さん）
  */
  const OPEN_BOTTOM = 0.30;  // 大漁場の下端
  const SHORE       = 0.62;  // 岸壁（海と陸の境界）

  const ZONES = {
    process: { id: "process", name: "加工場", stage: "②加工", x: 0.26, y: 0.72, input: ITEM.raw,  output: ITEM.pack },
    cook:    { id: "cook",    name: "調理場", stage: "③調理", x: 0.26, y: 0.90, input: ITEM.pack, output: ITEM.bowl },
    sales:   { id: "sales",   name: "販売所", stage: "④販売", x: 0.62, y: 0.84, input: ITEM.bowl, output: null      },
  };

  const UPGRADES = {
    boat: {
      icon: "🚤", name: "漁船",
      lvNames: ["小舟", "小型船", "中型船", "大型船", "最新鋭船", "船団"],
      costs: [150, 450, 1200, 3000, 7000],
      desc: (lv) => lv < 3 ? "移動速度・積載量UP／Lv3(大型船)で大漁場が解放！" : "移動速度・積載量UP／大漁場の魚が増える",
    },
    process: { icon: "♨️", name: "加工場", lvNames: ["手作業", "小型釜", "大型釜", "自動釜", "高速ライン", "最新ライン"], costs: [200, 600, 1500, 3500, 8000], desc: () => "釜揚げ加工のスピード・保管量アップ" },
    cook:    { icon: "🍳", name: "調理場", lvNames: ["屋台", "小さな厨房", "本格厨房", "セントラルキッチン", "名店の厨房"], costs: [250, 750, 1800, 4200], desc: () => "丼を作るスピード・保管量アップ" },
    sales:   { icon: "🏪", name: "販売所", lvNames: ["露店", "直売所", "観光直売所", "大型直売所", "用宗ブランド店"], costs: [300, 900, 2200, 5200], desc: () => "お客さんが増え、丼の売値もアップ" },
  };

  const BOAT_UNLOCK_LV = 3; // 大漁場の解放Lv

  /* ---------- 状態 ---------- */
  let S = newGame();
  function newGame() {
    return {
      money: 0, reputation: 50, day: 1, dayTimer: 0,
      lv: { boat: 0, process: 0, cook: 0, sales: 0 },
      stock: { process: { in: 0, out: 0 }, cook: { in: 0, out: 0 }, sales: { in: 0, out: 0 } },
      machineBroken: false, machineFixTimer: 0,
      fishMult: 1, fishMultTimer: 0,
      demandBonus: 0, demandBonusTimer: 0,
      eventTimer: 30, totalEarned: 0,
    };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      const r = localStorage.getItem(SAVE_KEY);
      if (r) {
        const d = JSON.parse(r);
        S = Object.assign(newGame(), d);
        S.lv = Object.assign({ boat: 0, process: 0, cook: 0, sales: 0 }, d.lv || {});
        S.stock = Object.assign(newGame().stock, d.stock || {});
        return true;
      }
    } catch (e) {}
    return false;
  }
  const boatUnlocked = () => S.lv.boat >= BOAT_UNLOCK_LV;

  /* ---------- 派生パラメータ ---------- */
  const P = {
    playerSpeed: () => 1.0 + 0.16 * S.lv.boat,
    carryCap:    () => 14 + 5 * S.lv.boat,
    nearFish:    () => Math.round((5 + 1.5 * S.lv.boat) * S.fishMult),
    openFish:    () => boatUnlocked() ? Math.round((10 + 2 * (S.lv.boat - BOAT_UNLOCK_LV)) * S.fishMult) : 0,
    processRate: () => 1.2 + 0.8 * S.lv.process,
    processCap:  () => 12 + 6 * S.lv.process,
    cookRate:    () => 1.0 + 0.6 * S.lv.cook,
    cookCap:     () => 10 + 5 * S.lv.cook,
    salesCap:    () => 12 + 6 * S.lv.sales,
    bowlPrice:   () => 100 + 45 * S.lv.sales,
    customerCount: () => Math.min(12, 3 + S.lv.sales + S.demandBonus),
    buyInterval: () => (1.8 - 0.12 * S.lv.sales) / Math.max(0.4, S.reputation / 60),
  };

  /* ---------- キャンバス・アセット ---------- */
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1, WH = 0, cameraY = 0;

  const worldH = () => Math.max(H * 2.4, H + 200);

  const bgImg = new Image(); let bgReady = false;
  bgImg.onload = () => { bgReady = true; }; bgImg.src = "assets/harbor-bg.png";
  function loadImg(src) { const i = new Image(); i._ready = false; i.onload = () => { i._ready = true; }; i.src = src; return i; }
  const IMG = {
    raw: loadImg("assets/raw-shirasu.png"), pack: loadImg("assets/pack-shirasu.png"), bowl: loadImg("assets/shirasu-bowl.png"),
    fisher: loadImg("assets/fisher.png"),
    boatSmall: loadImg("assets/boat-small.png"), boatLarge: loadImg("assets/boat-large.png"),
    bldProcess: loadImg("assets/bld-process.png"), bldCook: loadImg("assets/bld-cook.png"), bldSales: loadImg("assets/bld-sales.png"),
    schoolSmall: loadImg("assets/school-small.png"), schoolLarge: loadImg("assets/school-large.png"),
    cust: [loadImg("assets/customer-a.png"), loadImg("assets/customer-b.png"), loadImg("assets/customer-c.png"), loadImg("assets/customer-d.png")],
  };
  const itemImg = (t) => ({ raw: IMG.raw, pack: IMG.pack, bowl: IMG.bowl }[t]);
  function drawSprite(im, cx, cy, th) { if (!im || !im._ready) return false; const r = im.width / im.height, h = th, w = h * r; ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h); return true; }
  // 左右反転つき描画（dir: 1=右向きそのまま / -1=左右反転）
  function drawSpriteFlip(im, cx, cy, th, dir) {
    if (!im || !im._ready) return false;
    const r = im.width / im.height, h = th, w = h * r;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(dir < 0 ? -1 : 1, 1);
    ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); return true;
  }
  const bldImg = (id) => ({ process: IMG.bldProcess, cook: IMG.bldCook, sales: IMG.bldSales }[id]);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; WH = worldH();
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  const minDim = () => Math.min(W, H);
  const zonePx = (z) => ({ x: z.x * W, y: z.y * WH });
  const stationR = () => Math.max(46, minDim() * 0.14);
  const bandH = () => bgReady ? Math.min(WH * 0.16, W * (bgImg.height / bgImg.width)) : WH * 0.1;

  /* ---------- キャラ ---------- */
  const player = { tx: 0.5, ty: 0.52, px: 0, py: 0, carry: 0, carryType: null, facing: 1 };
  let playerInit = false;
  const topLimit = () => (boatUnlocked() ? bandH() + 20 : OPEN_BOTTOM * WH + 18);

  /* ---------- 魚 ---------- */
  let fishNear = [], fishOpen = [];
  function makeFish(big, yMin, yMax) {
    return { x: 12 + Math.random() * (W - 24), y: yMin + Math.random() * (yMax - yMin), a: Math.random() * Math.PI * 2, sp: minDim() * (0.1 + Math.random() * 0.09), big };
  }
  function nearBounds() { return [OPEN_BOTTOM * WH + 14, SHORE * WH - 14]; }
  function openBounds() { return [bandH() + 14, OPEN_BOTTOM * WH - 14]; }
  function syncFish() {
    const nb = nearBounds(), ob = openBounds();
    const nN = P.nearFish(), oN = P.openFish();
    while (fishNear.length < nN) fishNear.push(makeFish(false, nb[0], nb[1]));
    while (fishNear.length > nN) fishNear.pop();
    while (fishOpen.length < oN) fishOpen.push(makeFish(true, ob[0], ob[1]));
    while (fishOpen.length > oN) fishOpen.pop();
  }

  /* ---------- 客 ---------- */
  let customers = [];
  function syncCustomers() {
    const n = P.customerCount();
    while (customers.length < n) customers.push({ t: 0.4 + Math.random() * 1.6 });
    while (customers.length > n) customers.pop();
  }

  /* ---------- 入力 ---------- */
  let dragging = false;
  function setTarget(cx, cy) {
    const r = canvas.getBoundingClientRect();
    player.tx = Math.max(0.04, Math.min(0.96, (cx - r.left) / r.width));
    const worldY = (cy - r.top) + cameraY;
    player.ty = Math.max(0.0, Math.min(1.0, worldY / WH));
  }
  canvas.addEventListener("touchstart", (e) => { dragging = true; setTarget(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  canvas.addEventListener("touchmove", (e) => { if (dragging) setTarget(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  canvas.addEventListener("touchend", () => { dragging = false; });
  canvas.addEventListener("mousedown", (e) => { dragging = true; setTarget(e.clientX, e.clientY); });
  canvas.addEventListener("mousemove", (e) => { if (dragging) setTarget(e.clientX, e.clientY); });
  window.addEventListener("mouseup", () => { dragging = false; });

  /* ---------- パーティクル（ワールド座標） ---------- */
  const particles = [];
  function pop(x, y, text, color) { particles.push({ x, y, text, color, life: 1, vy: -30 }); }

  /* =========================================================
     ループ
     ========================================================= */
  let paused = true, last = 0;
  let incomeRate = 0, earnTimer = 0, lastTotalEarned = 0;
  function loop(t) { requestAnimationFrame(loop); const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; if (!paused) update(dt); render(t); }

  function nearestStation() {
    let best = null, bd = Infinity;
    for (const k in ZONES) { const p = zonePx(ZONES[k]); const d = Math.hypot(player.px - p.x, player.py - p.y); if (d < stationR() && d < bd) { bd = d; best = ZONES[k]; } }
    return best;
  }

  function update(dt) {
    WH = worldH();
    if (!playerInit) { player.px = player.tx * W; player.py = player.ty * WH; playerInit = true; syncFish(); }

    // 移動
    const txp = player.tx * W, typ = player.ty * WH;
    const dx = txp - player.px, dy = typ - player.py, dist = Math.hypot(dx, dy);
    const speed = minDim() * P.playerSpeed();
    if (dist > 2) { const step = Math.min(dist, speed * dt); player.px += dx / dist * step; player.py += dy / dist * step; if (Math.abs(dx) > 3) player.facing = dx < 0 ? -1 : 1; }
    // 範囲制限（未解放なら大漁場に入れない）
    player.px = Math.max(6, Math.min(W - 6, player.px));
    player.py = Math.max(topLimit(), Math.min(WH - 6, player.py));

    // カメラ（キャラ追従）
    cameraY = Math.max(0, Math.min(WH - H, player.py - H * 0.5));

    // 漁
    if (fishNear.length !== P.nearFish() || fishOpen.length !== P.openFish()) syncFish();
    const canFish = (player.carryType === null || player.carryType === ITEM.raw) && player.carry < P.carryCap();
    const nb = nearBounds(), ob = openBounds();
    updateFish(fishNear, nb, dt, canFish);
    updateFish(fishOpen, ob, dt, canFish);

    // 拠点で荷降ろし／積み込み
    const st = nearestStation();
    if (st) handleStation(st, dt);

    produce(dt);
    sell(dt);

    if (S.fishMultTimer > 0) { S.fishMultTimer -= dt; if (S.fishMultTimer <= 0) S.fishMult = 1; }
    if (S.demandBonusTimer > 0) { S.demandBonusTimer -= dt; if (S.demandBonusTimer <= 0) S.demandBonus = 0; }
    if (S.machineBroken && S.machineFixTimer > 0) { S.machineFixTimer -= dt; if (S.machineFixTimer <= 0) { S.machineBroken = false; toast("加工機が直った！", "good"); } }

    earnTimer += dt;
    if (earnTimer >= 1) { incomeRate = (S.totalEarned - lastTotalEarned) / earnTimer; lastTotalEarned = S.totalEarned; earnTimer = 0; }
    S.dayTimer += dt; if (S.dayTimer >= 45) { S.dayTimer = 0; S.day++; toast("☀️ " + S.day + "日目の朝", ""); }
    S.eventTimer -= dt; if (S.eventTimer <= 0) { triggerRandomEvent(); S.eventTimer = 22 + Math.random() * 20; }

    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.y += p.vy * dt; p.life -= dt * 1.1; if (p.life <= 0) particles.splice(i, 1); }

    syncCustomers();
    updateHUD(st);
    saveThrottle(dt);
  }

  function updateFish(arr, bounds, dt, canFish) {
    for (const fz of arr) {
      fz.x += Math.cos(fz.a) * fz.sp * dt; fz.y += Math.sin(fz.a) * fz.sp * dt;
      if (fz.x < 8 || fz.x > W - 8) { fz.a = Math.PI - fz.a; fz.x = Math.max(8, Math.min(W - 8, fz.x)); }
      if (fz.y < bounds[0] || fz.y > bounds[1]) { fz.a = -fz.a; fz.y = Math.max(bounds[0], Math.min(bounds[1], fz.y)); }
      if (Math.random() < 0.01) fz.a += (Math.random() - 0.5);
      const hitR = fz.big ? minDim() * 0.09 : minDim() * 0.06;
      if (canFish && Math.hypot(player.px - fz.x, player.py - fz.y) < hitR) {
        const gain = fz.big ? 2 : 1;
        player.carryType = ITEM.raw; player.carry = Math.min(P.carryCap(), player.carry + gain);
        pop(fz.x, fz.y - 18, "+" + gain, "#eaf6ff");
        Object.assign(fz, makeFish(fz.big, bounds[0], bounds[1]));
      }
    }
  }

  function handleStation(z, dt) {
    const sk = S.stock[z.id]; const rate = 16 * dt;
    if (z.input && player.carryType === z.input && player.carry > 0) {
      const room = (z.id === "sales" ? P.salesCap() : 9999) - sk.in;
      const amt = Math.min(rate, player.carry, Math.max(0, room));
      if (amt > 0) { player.carry -= amt; sk.in += amt; if (player.carry <= 0.001) { player.carry = 0; player.carryType = null; } }
      return;
    }
    if (z.output && sk.out > 0 && (player.carryType === null || player.carryType === z.output) && player.carry < P.carryCap()) {
      const amt = Math.min(rate, sk.out, P.carryCap() - player.carry);
      if (amt > 0) { sk.out -= amt; player.carry += amt; player.carryType = z.output; }
    }
  }
  function produce(dt) {
    const pr = S.stock.process;
    if (!S.machineBroken) { const a = Math.min(P.processRate() * dt, pr.in, P.processCap() - pr.out); if (a > 0) { pr.in -= a; pr.out += a; } }
    const ck = S.stock.cook;
    const b = Math.min(P.cookRate() * dt, ck.in, P.cookCap() - ck.out); if (b > 0) { ck.in -= b; ck.out += b; }
  }
  function sell(dt) {
    const sa = S.stock.sales, interval = P.buyInterval();
    for (const c of customers) {
      c.t -= dt;
      if (c.t <= 0) {
        if (sa.in >= 1) {
          sa.in -= 1; const gain = P.bowlPrice(); S.money += gain; S.totalEarned += gain;
          S.reputation = Math.min(100, S.reputation + 0.2);
          const p = zonePx(ZONES.sales); pop(p.x + stationR() * 0.5, p.y - 6, "+" + gain, "#ffd24a");
          c.t = interval * (0.7 + Math.random() * 0.6);
        } else c.t = 0.4;
      }
    }
  }
  let saveAcc = 0;
  function saveThrottle(dt) { saveAcc += dt; if (saveAcc > 3) { saveAcc = 0; save(); } }

  /* =========================================================
     描画
     ========================================================= */
  function render(t) {
    ctx.clearRect(0, 0, W, H);
    WH = worldH();
    cameraY = Math.max(0, Math.min(WH - H, player.py - H * 0.5));

    ctx.save();
    ctx.translate(0, -cameraY);

    const bh = bandH(), openB = OPEN_BOTTOM * WH, shore = SHORE * WH;

    // 大漁場（上）背景：濃い外洋ブルー
    let g = ctx.createLinearGradient(0, 0, 0, openB);
    g.addColorStop(0, "#0d4f74"); g.addColorStop(1, "#0a3f5e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, openB);
    // 上部に富士山パノラマ（遠景）
    if (bgReady) ctx.drawImage(bgImg, 0, 0, W, bh);

    // 通常の海（中）
    g = ctx.createLinearGradient(0, openB, 0, shore);
    g.addColorStop(0, "#2b86a8"); g.addColorStop(1, "#11607f");
    ctx.fillStyle = g; ctx.fillRect(0, openB, W, shore - openB);

    // 波
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
    drawWaves(bh + 10, openB, t); drawWaves(openB, shore, t);

    // 陸（下）
    g = ctx.createLinearGradient(0, shore, 0, WH);
    g.addColorStop(0, "#e7d6a4"); g.addColorStop(1, "#d3bd83");
    ctx.fillStyle = g; ctx.fillRect(0, shore, W, WH - shore);
    ctx.fillStyle = "#7a8a8f"; ctx.fillRect(0, shore - 5, W, 7);

    // 見出し
    badge("⭐ 大漁場（魚が沢山！）", W / 2, bh + (openB - bh) * 0.5, "rgba(10,79,110,0.85)");
    badge("① 海でシラス漁", W / 2, openB + (shore - openB) * 0.42, "rgba(20,98,127,0.8)");

    // 大漁場ロック表示
    if (!boatUnlocked()) {
      ctx.strokeStyle = "rgba(255,210,90,0.9)"; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
      ctx.beginPath(); ctx.moveTo(0, openB); ctx.lineTo(W, openB); ctx.stroke(); ctx.setLineDash([]);
      // ブイ
      for (let x = 20; x < W; x += 60) emoji("🟠", x, openB, 16);
      badge("🚧 大型船(Lv" + BOAT_UNLOCK_LV + ")で解放", W / 2, openB - 18, "rgba(180,90,40,0.92)", 12);
    }

    // 魚
    for (const fz of fishOpen) drawFish(fz);
    for (const fz of fishNear) drawFish(fz);

    // 船
    drawBoat();

    // 矢印（②→③→④）
    drawArrows();

    // 拠点
    drawStation(ZONES.process); drawStation(ZONES.cook); drawStation(ZONES.sales);
    drawCustomers(t);

    // ハイライト
    const st = nearestStation();
    if (st) { const p = zonePx(st); ctx.beginPath(); ctx.arc(p.x, p.y, stationR(), 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,200,80,0.9)"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]); }

    // 目的地
    if (Math.hypot(player.tx * W - player.px, player.ty * WH - player.py) > 6) { ctx.beginPath(); ctx.arc(player.tx * W, player.ty * WH, 7, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill(); }

    drawPlayer(t);

    // パーティクル
    ctx.textAlign = "center";
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.font = "bold 18px sans-serif"; ctx.fillText(p.text, p.x, p.y); }
    ctx.globalAlpha = 1;

    ctx.restore();

    drawScrollHint();
  }

  function drawWaves(y0, y1, t) {
    for (let r = 0; r < 3; r++) {
      const yy = y0 + (y1 - y0) * (0.25 + r * 0.3);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) { const y = yy + Math.sin(x * 0.03 + t * 0.002 + r) * 3; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  function drawFish(fz) {
    const dir = Math.cos(fz.a) >= 0 ? 1 : -1;
    const im = fz.big ? IMG.schoolLarge : IMG.schoolSmall;
    const th = fz.big ? minDim() * 0.14 : minDim() * 0.085;
    if (!drawSpriteFlip(im, fz.x, fz.y, th, dir)) {
      const sc = fz.big ? 1.8 : 1.0;
      ctx.save(); ctx.translate(fz.x, fz.y); ctx.scale(dir * sc, sc);
      ctx.fillStyle = fz.big ? "#bfe0c8" : "#cfe8f5"; ctx.strokeStyle = fz.big ? "#5fae86" : "#6fb6d6"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -5); ctx.lineTo(-14, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function drawBoat() {
    const x = W * 0.5, y = (OPEN_BOTTOM + SHORE) / 2 * WH;
    const im = boatUnlocked() ? IMG.boatLarge : IMG.boatSmall;
    if (!drawSprite(im, x, y, minDim() * 0.3)) { ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = (minDim() * 0.11) + "px sans-serif"; ctx.fillText(boatUnlocked() ? "🚢" : "🛥️", x, y); }
  }
  function drawArrows() {
    const pr = zonePx(ZONES.process), ck = zonePx(ZONES.cook), sa = zonePx(ZONES.sales);
    arrow(pr.x, pr.y + stationR() * 0.7, ck.x, ck.y - stationR() * 0.7);
    arrow(ck.x + stationR() * 0.7, ck.y - stationR() * 0.2, sa.x - stationR() * 0.8, sa.y + stationR() * 0.4);
  }
  function drawStation(z) {
    const p = zonePx(z), w = Math.max(70, minDim() * 0.27), h = w * 0.62;
    // 建物（実イラスト。無ければ簡易ハウス）
    const bld = bldImg(z.id);
    if (!drawSprite(bld, p.x, p.y - h * 0.05, minDim() * 0.38)) {
      roundRect(p.x - w / 2, p.y - h / 2, w, h, 10); ctx.fillStyle = "#fff7e8"; ctx.fill();
      ctx.strokeStyle = "#b58a55"; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x - w / 2 - 6, p.y - h / 2); ctx.lineTo(p.x, p.y - h / 2 - h * 0.32); ctx.lineTo(p.x + w / 2 + 6, p.y - h / 2); ctx.closePath(); ctx.fillStyle = "#c0584e"; ctx.fill();
    }
    const sk = S.stock[z.id];
    if (z.id === "sales") drawStack(itemImg(ITEM.bowl), p.x, p.y + h * 0.12, h * 0.5, sk.in, p.x - w * 0.34);
    else { drawStack(itemImg(z.output), p.x, p.y + h * 0.12, h * 0.5, sk.out, p.x - w * 0.36); if (sk.in > 0.5) badge("原料 " + Math.floor(sk.in), p.x + w * 0.18, p.y - h * 0.28, "rgba(32,50,60,0.7)", 11); }
    if (z.id === "process" && S.machineBroken) emoji("🔧", p.x + w * 0.34, p.y - h * 0.3, 22);
    stageHeader(z, p.x, p.y - h / 2 - h * 0.32 - 10);
    const lv = { process: S.lv.process, cook: S.lv.cook, sales: S.lv.sales }[z.id];
    lvBadge(p.x, p.y + h / 2 + 14, "Lv." + lv);
  }
  function drawStack(im, cx, cy, itemH, count, baseX) {
    const n = Math.floor(count), shown = Math.min(8, n);
    for (let i = 0; i < shown; i++) { const col = i % 4, row = Math.floor(i / 4); drawSprite(im, baseX + col * itemH * 0.7 + itemH * 0.35, cy - row * itemH * 0.45, itemH * 0.9); }
    if (n > 0) badge("×" + n, cx + minDim() * 0.11, cy, "rgba(32,50,60,0.85)", 13);
  }
  function drawCustomers(t) {
    const sa = zonePx(ZONES.sales);
    const baseX = sa.x, baseY = sa.y + stationR() * 1.25, gap = Math.max(24, minDim() * 0.07), cols = 3;
    const ch = Math.max(22, minDim() * 0.085);
    for (let i = 0; i < customers.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = baseX + (col - (cols - 1) / 2) * gap, y = baseY + row * gap * 0.95 + Math.sin(t * 0.004 + i) * 1.5;
      const im = IMG.cust[i % IMG.cust.length];
      if (!drawSprite(im, x, y, ch)) {
        ctx.fillStyle = ["#e8923a", "#5aa9d6", "#8ec06b", "#d683a8", "#b58cd6"][i % 5];
        roundRect(x - 8, y - 2, 16, 18, 6); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - 8, 7, 0, Math.PI * 2); ctx.fillStyle = "#ffe0bd"; ctx.fill();
      }
    }
  }
  function drawPlayer(t) {
    const bob = Math.sin(t * 0.006) * 2, x = player.px, y = player.py + bob;
    const ph = Math.max(40, minDim() * 0.12); // キャラの高さ
    // 影
    ctx.beginPath(); ctx.ellipse(x, player.py + ph * 0.42, ph * 0.32, ph * 0.12, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fill();
    // 漁師（向きで左右反転）。画像が無ければ丸でフォールバック
    if (!drawSpriteFlip(IMG.fisher, x, y, ph, player.facing)) {
      ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fillStyle = "#ff8c42"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke(); emoji("🎣", x, y, 20);
    }
    // 手持ちが頭の上に積み上がる
    const cnt = Math.floor(player.carry);
    if (cnt > 0 && player.carryType) {
      const im = itemImg(player.carryType), ih = ph * 0.34, vis = Math.min(cnt, 8), top = y - ph * 0.55;
      for (let i = 0; i < vis; i++) drawSprite(im, x + Math.sin(i * 1.7) * 3, top - i * (ih * 0.42), ih);
      badge("×" + cnt, x + ph * 0.42, top - ih * 0.3, "rgba(32,50,60,0.9)", 11);
    }
  }
  function drawScrollHint() {
    // 上下にまだマップがある事を示す矢印
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "16px sans-serif"; ctx.globalAlpha = 0.5;
    if (cameraY > 6) ctx.fillText("▲", W - 16, 14);
    if (cameraY < WH - H - 6) ctx.fillText("▼", W - 16, H - 14);
    ctx.globalAlpha = 1;
  }

  /* ---------- 描画ユーティリティ ---------- */
  function emoji(ch, x, y, size) { ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = size + "px sans-serif"; ctx.fillText(ch, x, y); }
  function badge(text, x, y, bg, fs) {
    ctx.font = "bold " + (fs || 13) + "px sans-serif"; const w = ctx.measureText(text).width + 14;
    roundRect(x - w / 2, y - (fs ? fs - 1 : 11), w, (fs ? fs + 8 : 22), 10); ctx.fillStyle = bg || "rgba(32,50,60,0.85)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
  }
  function stageHeader(z, x, y) {
    const txt = z.stage + " " + z.name; ctx.font = "bold 13px sans-serif"; const w = ctx.measureText(txt).width + 16;
    roundRect(x - w / 2, y - 11, w, 22, 11); ctx.fillStyle = "rgba(20,98,127,0.92)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y);
  }
  function lvBadge(x, y, txt) { ctx.font = "bold 12px sans-serif"; const w = ctx.measureText(txt).width + 14; roundRect(x - w / 2, y - 10, w, 20, 10); ctx.fillStyle = "rgba(54,179,126,0.95)"; ctx.fill(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y); }
  function arrow(x1, y1, x2, y2) {
    const ang = Math.atan2(y2 - y1, x2 - x1), head = 11;
    ctx.strokeStyle = "rgba(255,140,66,0.85)"; ctx.fillStyle = "rgba(255,140,66,0.85)"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * head, y2 - Math.sin(ang) * head); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5)); ctx.lineTo(x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5)); ctx.closePath(); ctx.fill(); ctx.lineCap = "butt";
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* =========================================================
     HUD / トースト
     ========================================================= */
  const el = (id) => document.getElementById(id);
  function updateHUD(st) {
    el("hud-money").textContent = Math.floor(S.money).toLocaleString();
    el("hud-rate").textContent = Math.round(incomeRate).toLocaleString();
    el("hud-rep").textContent = Math.round(S.reputation);
    el("hud-day").textContent = S.day;
    const cimg = el("hud-carry-img"), cnt = el("hud-carry");
    if (player.carry > 0 && player.carryType) {
      cimg.style.visibility = "visible";
      cimg.src = "assets/" + ({ raw: "raw-shirasu", pack: "pack-shirasu", bowl: "shirasu-bowl" }[player.carryType]) + ".png";
      cnt.textContent = Math.floor(player.carry) + "/" + P.carryCap();
    } else { cimg.style.visibility = "hidden"; cnt.textContent = "0/" + P.carryCap(); }
    const banner = el("action-banner"); let msg = null;
    if (player.py < SHORE * WH) {
      msg = player.py < OPEN_BOTTOM * WH ? "⭐ 大漁場：大きな群れ＝シラス2倍！" : "🌊 海で漁中：魚に重なってシラスGET！";
    } else if (st) {
      if (st.input && player.carryType === st.input && player.carry > 0) msg = st.stage + " " + st.name + "：荷降ろし中…";
      else if (st.output && S.stock[st.id].out > 0) msg = st.stage + " " + st.name + "：積み込み中…";
      else msg = st.stage + " " + st.name;
    }
    if (msg) { banner.classList.remove("hidden"); banner.textContent = msg; } else banner.classList.add("hidden");
  }
  function toast(msg, type) { const d = document.createElement("div"); d.className = "toast " + (type || ""); d.textContent = msg; el("toast-area").appendChild(d); setTimeout(() => d.remove(), 2600); }

  /* =========================================================
     イベント
     ========================================================= */
  function triggerRandomEvent() {
    const pool = [];
    if (!S.machineBroken) pool.push({ w: 3, fn: evMachineBreak });
    pool.push({ w: 3, fn: evPoorCatch }); if (S.reputation > 20) pool.push({ w: 2, fn: evComplaint });
    pool.push({ w: 2, fn: evGoodCatch }); pool.push({ w: 2, fn: evTourBus });
    const total = pool.reduce((s, p) => s + p.w, 0); let r = Math.random() * total;
    for (const p of pool) { if ((r -= p.w) <= 0) { p.fn(); return; } }
  }
  function evPoorCatch() { S.fishMult = 0.4; S.fishMultTimer = 15; toast("🌊 不漁…魚が減った", "bad"); }
  function evGoodCatch() { S.fishMult = 2.2; S.fishMultTimer = 14; toast("🐟 大漁の群れ発見！", "good"); }
  function evTourBus() { S.demandBonus = 3; S.demandBonusTimer = 16; S.reputation = Math.min(100, S.reputation + 5); toast("🚌 観光バス到着！お客急増", "good"); }
  function evComplaint() {
    const cost = Math.min(S.money, 200 + S.lv.sales * 100);
    showEvent("😣", "クレーム発生", "「鮮度が落ちてる！」とクレーム。評判が下がりました。", [
      { label: "謝罪する（" + Math.round(cost) + "円）", primary: true, fn: () => { S.money -= cost; S.reputation = Math.min(100, S.reputation + 8); toast("信頼を回復した", "good"); } },
      { label: "気にしない", fn: () => { S.reputation = Math.max(0, S.reputation - 15); toast("評判が下がった…", "bad"); } },
    ]);
  }
  function evMachineBreak() {
    const cost = 150 + S.lv.process * 120;
    showEvent("🔧", "加工機が故障！", "加工機が止まった。直さないとパックが作れません。", [
      { label: "すぐ修理（" + cost + "円）", primary: true, fn: () => { if (S.money >= cost) { S.money -= cost; toast("修理した！", "good"); } else { S.machineBroken = true; S.machineFixTimer = 15; toast("お金が足りず自力修理中…", "bad"); } } },
      { label: "自分で直す（15秒）", fn: () => { S.machineBroken = true; S.machineFixTimer = 15; toast("加工機が止まっている…", "bad"); } },
    ]);
  }
  function showEvent(icon, title, desc, actions) {
    paused = true;
    el("event-icon").textContent = icon; el("event-title").textContent = title; el("event-desc").textContent = desc;
    const box = el("event-actions"); box.innerHTML = "";
    actions.forEach((a) => { const b = document.createElement("button"); b.textContent = a.label; if (!a.primary) b.className = "secondary"; b.onclick = () => { a.fn(); closeModal("event-modal"); save(); }; box.appendChild(b); });
    el("event-modal").classList.remove("hidden");
  }

  /* =========================================================
     ショップ
     ========================================================= */
  function renderShop() {
    el("shop-money").textContent = Math.floor(S.money).toLocaleString();
    const list = el("shop-list"); list.innerHTML = "";
    for (const key in UPGRADES) {
      const u = UPGRADES[key], lv = S.lv[key], maxLv = u.costs.length, isMax = lv >= maxLv, cost = isMax ? 0 : u.costs[lv];
      const item = document.createElement("div"); item.className = "shop-item";
      item.innerHTML = '<div class="si-ico">' + u.icon + "</div><div class=\"si-body\"><div class=\"si-name\">" + u.name + "</div><div class=\"si-lv\">現在：" + u.lvNames[lv] + "（Lv." + lv + "/" + maxLv + "）</div><div class=\"si-desc\">" + u.desc(lv) + "</div></div>";
      const btn = document.createElement("button"); btn.className = "buy-btn";
      if (isMax) { btn.textContent = "MAX"; btn.classList.add("maxed"); btn.disabled = true; }
      else { btn.textContent = cost.toLocaleString() + "円"; btn.disabled = S.money < cost; btn.onclick = () => buy(key); }
      item.appendChild(btn); list.appendChild(item);
    }
  }
  function buy(key) {
    const u = UPGRADES[key], lv = S.lv[key];
    if (lv >= u.costs.length || S.money < u.costs[lv]) return;
    S.money -= u.costs[lv]; S.lv[key]++;
    toast("⬆️ " + u.name + " → " + u.lvNames[S.lv[key]], "good");
    if (key === "boat" && S.lv.boat === BOAT_UNLOCK_LV) toast("⭐ 大漁場が解放された！上にスクロール！", "good");
    save(); renderShop();
  }

  /* =========================================================
     画面・モーダル
     ========================================================= */
  function openModal(id) { paused = true; if (id === "shop-modal") renderShop(); el(id).classList.remove("hidden"); }
  function closeModal(id) { el(id).classList.add("hidden"); const anyOpen = [...document.querySelectorAll(".modal")].some((m) => !m.classList.contains("hidden")); if (!anyOpen && el("title-screen").classList.contains("hidden")) paused = false; }
  function startGame() { el("title-screen").classList.add("hidden"); el("game-screen").classList.remove("hidden"); resize(); playerInit = false; lastTotalEarned = S.totalEarned; incomeRate = 0; earnTimer = 0; paused = false; }

  el("start-btn").addEventListener("click", () => { load(); startGame(); });
  el("reset-btn").addEventListener("click", () => { if (confirm("最初からやり直しますか？（セーブが消えます）")) { localStorage.removeItem(SAVE_KEY); S = newGame(); startGame(); } });
  el("shop-btn").addEventListener("click", () => openModal("shop-modal"));
  el("help-btn").addEventListener("click", () => openModal("help-modal"));
  document.querySelectorAll(".close-btn").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));

  resize();
  requestAnimationFrame(loop);
})();
