/* =========================================================
   用宗シラス漁ものがたり  -  game.js（運搬型）
   指で漁師を動かす：海で魚を追って漁 → 生シラスを担いで加工場 →
   パックを調理場 → 丼を販売所 → 並ぶお客が購入 → お金 → グレードアップ
   ========================================================= */
(() => {
  "use strict";

  const SAVE_KEY = "mochimune_shirasu_save_v2";

  /* ---------- 品物の種類 ---------- */
  // raw=生シラス(バケツ) / pack=加工シラス(パック) / bowl=シラス丼
  const ITEM = { raw: "raw", pack: "pack", bowl: "bowl" };

  /* ---------- 拠点（ゾーン）定義（縦長レイアウト） ---------- */
  // 上＝海、左上＝加工場、左下＝調理場、中央＝販売所
  const ZONES = {
    process: { id: "process", name: "加工場", stage: "②加工", x: 0.24, y: 0.50, input: ITEM.raw,  output: ITEM.pack },
    cook:    { id: "cook",    name: "調理場", stage: "③調理", x: 0.24, y: 0.82, input: ITEM.pack, output: ITEM.bowl },
    sales:   { id: "sales",   name: "販売所", stage: "④販売", x: 0.60, y: 0.68, input: ITEM.bowl, output: null      },
  };

  /* ---------- アップグレード定義 ---------- */
  const UPGRADES = {
    boat: {
      icon: "🚤", name: "漁船",
      lvNames: ["小舟", "小型船", "中型船", "大型船", "最新鋭船", "船団"],
      costs: [150, 450, 1200, 3000, 7000],
      desc: () => "移動スピード・積載量アップ／魚の群れが増える",
    },
    process: {
      icon: "♨️", name: "加工場",
      lvNames: ["手作業", "小型釜", "大型釜", "自動釜", "高速ライン", "最新ライン"],
      costs: [200, 600, 1500, 3500, 8000],
      desc: () => "釜揚げ加工のスピード・保管量アップ",
    },
    cook: {
      icon: "🍳", name: "調理場",
      lvNames: ["屋台", "小さな厨房", "本格厨房", "セントラルキッチン", "名店の厨房"],
      costs: [250, 750, 1800, 4200],
      desc: () => "丼を作るスピード・保管量アップ",
    },
    sales: {
      icon: "🏪", name: "販売所",
      lvNames: ["露店", "直売所", "観光直売所", "大型直売所", "用宗ブランド店"],
      costs: [300, 900, 2200, 5200],
      desc: () => "お客さんが増え、丼の売値もアップ",
    },
  };

  /* ---------- ゲーム状態 ---------- */
  let S = newGame();

  function newGame() {
    return {
      money: 0,
      reputation: 50,
      day: 1,
      dayTimer: 0,
      lv: { boat: 0, process: 0, cook: 0, sales: 0 },
      // 各拠点の在庫（input待ち / output完成品）
      stock: {
        process: { in: 0, out: 0 },
        cook:    { in: 0, out: 0 },
        sales:   { in: 0, out: 0 },
      },
      // 一時効果
      machineBroken: false, machineFixTimer: 0,
      fishMult: 1, fishMultTimer: 0,
      demandBonus: 0, demandBonusTimer: 0,
      eventTimer: 30,
      totalEarned: 0,
    };
  }

  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        S = Object.assign(newGame(), d);
        S.lv = Object.assign({ boat: 0, process: 0, cook: 0, sales: 0 }, d.lv || {});
        S.stock = Object.assign(newGame().stock, d.stock || {});
        return true;
      }
    } catch (e) {}
    return false;
  }

  /* ---------- 派生パラメータ ---------- */
  const P = {
    playerSpeed: () => 1.05 + 0.16 * S.lv.boat,          // ×minDim px/sec
    carryCap:    () => 12 + 4 * S.lv.boat,               // 積載量
    fishCount:   () => Math.round((6 + 2 * S.lv.boat) * S.fishMult),
    processRate: () => 1.2 + 0.8 * S.lv.process,         // raw→pack /sec
    processCap:  () => 12 + 6 * S.lv.process,
    cookRate:    () => 1.0 + 0.6 * S.lv.cook,            // pack→bowl /sec
    cookCap:     () => 10 + 5 * S.lv.cook,
    salesCap:    () => 12 + 6 * S.lv.sales,              // 丼の陳列上限
    bowlPrice:   () => 100 + 45 * S.lv.sales,
    customerCount: () => Math.min(10, 2 + S.lv.sales + S.demandBonus),
    buyInterval: () => (1.8 - 0.12 * S.lv.sales) / Math.max(0.4, S.reputation / 60),
  };

  /* =========================================================
     キャンバス・アセット
     ========================================================= */
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;

  const bgImg = new Image();
  let bgReady = false;
  bgImg.onload = () => { bgReady = true; };
  bgImg.src = "assets/harbor-bg.png";

  function loadImg(src) {
    const i = new Image(); i._ready = false; i.onload = () => { i._ready = true; }; i.src = src; return i;
  }
  const IMG = {
    raw:  loadImg("assets/raw-shirasu.png"),
    pack: loadImg("assets/pack-shirasu.png"),
    bowl: loadImg("assets/shirasu-bowl.png"),
  };
  function drawSprite(im, cx, cy, targetH) {
    if (!im || !im._ready) return false;
    const r = im.width / im.height, h = targetH, w = h * r;
    ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    return true;
  }
  const itemImg = (type) => ({ raw: IMG.raw, pack: IMG.pack, bowl: IMG.bowl }[type]);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);

  const minDim = () => Math.min(W, H);
  const zonePx = (z) => ({ x: z.x * W, y: z.y * H });
  const stationR = () => Math.max(46, minDim() * 0.14);
  const seaBottom = () => H * 0.32;   // ここより上が海

  /* ---------- キャラクター ---------- */
  const player = { tx: 0.5, ty: 0.55, px: 0, py: 0, carry: 0, carryType: null };
  let playerInit = false;

  /* ---------- 魚 ---------- */
  let fish = [];
  function spawnFish(n) {
    fish = [];
    for (let i = 0; i < n; i++) fish.push(newFish());
  }
  function newFish() {
    return {
      x: Math.random() * W,
      y: Math.random() * (seaBottom() - 30) + 15,
      a: Math.random() * Math.PI * 2,
      sp: minDim() * (0.12 + Math.random() * 0.1),
    };
  }

  /* ---------- お客さん ---------- */
  let customers = [];
  function syncCustomers() {
    const n = P.customerCount();
    while (customers.length < n) customers.push({ t: 0.5 + Math.random() * 1.5 });
    while (customers.length > n) customers.pop();
  }

  /* ---------- 入力 ---------- */
  let dragging = false;
  function setTarget(cx, cy) {
    const r = canvas.getBoundingClientRect();
    player.tx = Math.max(0.04, Math.min(0.96, (cx - r.left) / r.width));
    player.ty = Math.max(0.05, Math.min(0.95, (cy - r.top) / r.height));
  }
  canvas.addEventListener("touchstart", (e) => { dragging = true; setTarget(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  canvas.addEventListener("touchmove", (e) => { if (dragging) setTarget(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  canvas.addEventListener("touchend", () => { dragging = false; });
  canvas.addEventListener("mousedown", (e) => { dragging = true; setTarget(e.clientX, e.clientY); });
  canvas.addEventListener("mousemove", (e) => { if (dragging) setTarget(e.clientX, e.clientY); });
  window.addEventListener("mouseup", () => { dragging = false; });

  /* ---------- パーティクル ---------- */
  const particles = [];
  function pop(x, y, text, color) { particles.push({ x, y, text, color, life: 1, vy: -30 }); }

  /* =========================================================
     ゲームループ
     ========================================================= */
  let paused = true, last = 0;
  let incomeRate = 0, earnTimer = 0, lastTotalEarned = 0;

  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (!paused) update(dt);
    render(t);
  }

  function nearestStation() {
    let best = null, bd = Infinity;
    for (const k in ZONES) {
      const p = zonePx(ZONES[k]);
      const d = Math.hypot(player.px - p.x, player.py - p.y);
      if (d < stationR() && d < bd) { bd = d; best = ZONES[k]; }
    }
    return best;
  }

  function update(dt) {
    if (!playerInit) { player.px = player.tx * W; player.py = player.ty * H; playerInit = true; spawnFish(P.fishCount()); }

    // 移動
    const txp = player.tx * W, typ = player.ty * H;
    const dx = txp - player.px, dy = typ - player.py, dist = Math.hypot(dx, dy);
    const speed = minDim() * P.playerSpeed();
    if (dist > 2) { const step = Math.min(dist, speed * dt); player.px += dx / dist * step; player.py += dy / dist * step; }

    // 魚の遊泳＋漁
    if (fish.length !== P.fishCount()) syncFish();
    const canFish = (player.carryType === null || player.carryType === ITEM.raw) && player.carry < P.carryCap();
    for (const fz of fish) {
      fz.x += Math.cos(fz.a) * fz.sp * dt;
      fz.y += Math.sin(fz.a) * fz.sp * dt;
      if (fz.x < 8 || fz.x > W - 8) { fz.a = Math.PI - fz.a; fz.x = Math.max(8, Math.min(W - 8, fz.x)); }
      if (fz.y < 12 || fz.y > seaBottom() - 12) { fz.a = -fz.a; fz.y = Math.max(12, Math.min(seaBottom() - 12, fz.y)); }
      if (Math.random() < 0.01) fz.a += (Math.random() - 0.5);
      // 漁師と重なったら捕獲
      if (canFish && player.py < seaBottom() + 20 && Math.hypot(player.px - fz.x, player.py - fz.y) < 26) {
        player.carryType = ITEM.raw; player.carry++;
        pop(fz.x, fz.y - 18, "+1", "#eaf6ff");
        Object.assign(fz, newFish()); // 逃した分は新しい群れが湧く
      }
    }

    // 拠点での荷降ろし／積み込み
    const st = nearestStation();
    if (st) handleStation(st, dt);

    // 生産（加工・調理）
    produce(dt);

    // 販売（お客さんが丼を購入）
    sell(dt);

    // 一時効果の減衰
    if (S.fishMultTimer > 0) { S.fishMultTimer -= dt; if (S.fishMultTimer <= 0) S.fishMult = 1; }
    if (S.demandBonusTimer > 0) { S.demandBonusTimer -= dt; if (S.demandBonusTimer <= 0) { S.demandBonus = 0; } }
    if (S.machineBroken && S.machineFixTimer > 0) {
      S.machineFixTimer -= dt;
      if (S.machineFixTimer <= 0) { S.machineBroken = false; toast("加工機が直った！", "good"); }
    }

    // 売上/秒
    earnTimer += dt;
    if (earnTimer >= 1) { incomeRate = (S.totalEarned - lastTotalEarned) / earnTimer; lastTotalEarned = S.totalEarned; earnTimer = 0; }

    // 日数
    S.dayTimer += dt;
    if (S.dayTimer >= 45) { S.dayTimer = 0; S.day++; toast("☀️ " + S.day + "日目の朝", ""); }

    // イベント
    S.eventTimer -= dt;
    if (S.eventTimer <= 0) { triggerRandomEvent(); S.eventTimer = 22 + Math.random() * 20; }

    // パーティクル
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.y += p.vy * dt; p.life -= dt * 1.1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    syncCustomers();
    updateHUD(st);
    saveThrottle(dt);
  }

  function syncFish() {
    const n = P.fishCount();
    while (fish.length < n) fish.push(newFish());
    while (fish.length > n) fish.pop();
  }

  // 拠点：input型を持っていれば降ろす／output完成品があれば積む
  function handleStation(z, dt) {
    const sk = S.stock[z.id];
    const rate = 16 * dt; // 受け渡しスピード
    // 荷降ろし（手持ち=input型）
    if (z.input && player.carryType === z.input && player.carry > 0) {
      // sales は in(=陳列)に上限。process/cook の in は加工待ちバッファ（実質無制限）
      const room = (z.id === "sales" ? P.salesCap() : 9999) - sk.in;
      const amt = Math.min(rate, player.carry, Math.max(0, room));
      if (amt > 0) {
        player.carry -= amt; sk.in += amt;
        if (player.carry <= 0.001) { player.carry = 0; player.carryType = null; }
      }
      return; // 降ろし中は積まない
    }
    // 積み込み（output完成品）
    if (z.output && sk.out > 0 && (player.carryType === null || player.carryType === z.output) && player.carry < P.carryCap()) {
      const amt = Math.min(rate, sk.out, P.carryCap() - player.carry);
      if (amt > 0) { sk.out -= amt; player.carry += amt; player.carryType = z.output; }
    }
  }

  function produce(dt) {
    // 加工場：in(raw) → out(pack)
    const pr = S.stock.process;
    if (!S.machineBroken) {
      const amt = Math.min(P.processRate() * dt, pr.in, P.processCap() - pr.out);
      if (amt > 0) { pr.in -= amt; pr.out += amt; }
    }
    // 調理場：in(pack) → out(bowl)
    const ck = S.stock.cook;
    const amt2 = Math.min(P.cookRate() * dt, ck.in, P.cookCap() - ck.out);
    if (amt2 > 0) { ck.in -= amt2; ck.out += amt2; }
  }

  function sell(dt) {
    const sa = S.stock.sales;
    const interval = P.buyInterval();
    for (const c of customers) {
      c.t -= dt;
      if (c.t <= 0) {
        if (sa.in >= 1) {
          sa.in -= 1;
          const gain = P.bowlPrice();
          S.money += gain; S.totalEarned += gain;
          S.reputation = Math.min(100, S.reputation + 0.2);
          const p = zonePx(ZONES.sales);
          pop(p.x + stationR() * 0.6, p.y - 10, "+" + gain, "#ffd24a");
          c.t = interval * (0.7 + Math.random() * 0.6);
        } else {
          c.t = 0.4; // 在庫切れ：少し待つ
        }
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
    const sb = seaBottom();

    // 背景パノラマ（海の上部に）
    const bandH = bgReady ? Math.min(sb, W * (bgImg.height / bgImg.width)) : sb * 0.6;
    if (bgReady) ctx.drawImage(bgImg, 0, 0, W, bandH);
    else { let g = ctx.createLinearGradient(0,0,0,bandH); g.addColorStop(0,"#bfe6f5"); g.addColorStop(1,"#1a6fa0"); ctx.fillStyle=g; ctx.fillRect(0,0,W,bandH); }

    // 海（漁エリア）
    let g = ctx.createLinearGradient(0, bandH, 0, sb);
    g.addColorStop(0, "#2b86a8"); g.addColorStop(1, "#11607f");
    ctx.fillStyle = g; ctx.fillRect(0, bandH - 1, W, sb - bandH + 1);
    // 波
    ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) {
      const yy = bandH + (sb - bandH) * (0.3 + r * 0.28);
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) { const y = yy + Math.sin(x * 0.03 + t * 0.002 + r) * 3; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }

    // 陸地
    g = ctx.createLinearGradient(0, sb, 0, H);
    g.addColorStop(0, "#e7d6a4"); g.addColorStop(1, "#d3bd83");
    ctx.fillStyle = g; ctx.fillRect(0, sb, W, H - sb);
    ctx.fillStyle = "#7a8a8f"; ctx.fillRect(0, sb - 5, W, 7); // 岸壁

    // 漁エリア見出し
    badge("① 海でシラス漁", W / 2, bandH * 0.5, "rgba(20,98,127,0.85)");

    // 魚
    for (const fz of fish) drawFish(fz, t);

    // 船（漁エリアに浮かべる）
    drawBoat();

    // 矢印（②→③→④の流れ）
    drawArrows();

    // 拠点
    drawStation(ZONES.process);
    drawStation(ZONES.cook);
    drawStation(ZONES.sales);
    drawCustomers(t);

    // ハイライト
    const st = nearestStation();
    if (st) {
      const p = zonePx(st);
      ctx.beginPath(); ctx.arc(p.x, p.y, stationR(), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,200,80,0.9)"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    }

    // 目的地マーカー
    if (Math.hypot(player.tx * W - player.px, player.ty * H - player.py) > 6) {
      ctx.beginPath(); ctx.arc(player.tx * W, player.ty * H, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fill();
    }

    drawPlayer(t);

    // パーティクル
    ctx.textAlign = "center";
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.font = "bold 18px sans-serif"; ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawFish(fz, t) {
    const dir = Math.cos(fz.a) >= 0 ? 1 : -1;
    ctx.save(); ctx.translate(fz.x, fz.y); ctx.scale(dir, 1);
    ctx.fillStyle = "#cfe8f5"; ctx.strokeStyle = "#6fb6d6"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -5); ctx.lineTo(-14, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#20323c"; ctx.beginPath(); ctx.arc(5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBoat() {
    const x = W * 0.82, y = seaBottom() * 0.62;
    ctx.font = (minDim() * 0.085) + "px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(S.lv.boat >= 3 ? "🚢" : "🛥️", x, y);
  }

  function drawArrows() {
    const pr = zonePx(ZONES.process), ck = zonePx(ZONES.cook), sa = zonePx(ZONES.sales);
    arrow(pr.x, pr.y + stationR() * 0.7, ck.x, ck.y - stationR() * 0.7);       // 加工→調理
    arrow(ck.x + stationR() * 0.7, ck.y - stationR() * 0.2, sa.x - stationR() * 0.8, sa.y + stationR() * 0.4); // 調理→販売
  }

  function drawStation(z) {
    const p = zonePx(z);
    const w = Math.max(70, minDim() * 0.26), h = w * 0.62;
    // 建物
    roundRect(p.x - w / 2, p.y - h / 2, w, h, 10); ctx.fillStyle = "#fff7e8"; ctx.fill();
    ctx.strokeStyle = "#b58a55"; ctx.lineWidth = 3; ctx.stroke();
    // 屋根
    ctx.beginPath(); ctx.moveTo(p.x - w / 2 - 6, p.y - h / 2); ctx.lineTo(p.x, p.y - h / 2 - h * 0.32); ctx.lineTo(p.x + w / 2 + 6, p.y - h / 2);
    ctx.closePath(); ctx.fillStyle = "#c0584e"; ctx.fill();

    const sk = S.stock[z.id];
    if (z.id === "sales") {
      // 販売所：陳列された丼（in）
      drawStack(itemImg(ITEM.bowl), p.x, p.y + h * 0.12, h * 0.5, sk.in, p.x - w * 0.34);
    } else {
      // 加工/調理：完成品(out)を積む。中の小さい原料(in)も表示
      drawStack(itemImg(z.output), p.x, p.y + h * 0.12, h * 0.5, sk.out, p.x - w * 0.36);
      // in待ち表示（小）
      if (sk.in > 0.5) badge("原料 " + Math.floor(sk.in), p.x + w * 0.18, p.y - h * 0.28, "rgba(32,50,60,0.7)", 11);
    }
    // 故障
    if (z.id === "process" && S.machineBroken) emoji("🔧", p.x + w * 0.34, p.y - h * 0.3, 22);

    // 見出し
    stageHeader(z, p.x, p.y - h / 2 - h * 0.32 - 10);
    // Lv バッジ
    const lv = { process: S.lv.process, cook: S.lv.cook, sales: S.lv.sales }[z.id];
    lvBadge(p.x, p.y + h / 2 + 14, "Lv." + lv);
  }

  // 完成品スタック表示（最大8個＋数）
  function drawStack(im, cx, cy, itemH, count, baseX) {
    const n = Math.floor(count);
    const shown = Math.min(8, n);
    for (let i = 0; i < shown; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = baseX + col * itemH * 0.7 + itemH * 0.35;
      const y = cy - row * itemH * 0.45;
      if (!drawSprite(im, x, y, itemH * 0.9)) { /* fallback skip */ }
    }
    if (n > 0) badge("×" + n, cx + (minDim() * 0.11), cy, "rgba(32,50,60,0.85)", 13);
  }

  function drawCustomers(t) {
    const sa = zonePx(ZONES.sales);
    const startX = sa.x + stationR() * 0.9;
    const gap = Math.max(26, minDim() * 0.07);
    for (let i = 0; i < customers.length; i++) {
      const x = startX + i * gap, y = sa.y + Math.sin(t * 0.004 + i) * 2;
      if (x > W - 10) continue;
      // 体
      ctx.fillStyle = ["#e8923a", "#5aa9d6", "#8ec06b", "#d683a8", "#b58cd6"][i % 5];
      roundRect(x - 8, y - 2, 16, 18, 6); ctx.fill();
      // 頭
      ctx.beginPath(); ctx.arc(x, y - 8, 7, 0, Math.PI * 2); ctx.fillStyle = "#ffe0bd"; ctx.fill();
    }
  }

  function drawPlayer(t) {
    const bob = Math.sin(t * 0.006) * 3;
    const x = player.px, y = player.py + bob;
    ctx.beginPath(); ctx.ellipse(player.px, player.py + 16, 15, 6, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fillStyle = "#ff8c42"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
    emoji("🎣", x, y, 20);
    // 手持ちの積み荷
    if (player.carry > 0 && player.carryType) {
      const im = itemImg(player.carryType);
      drawSprite(im, x, y - 30, 24);
      badge("×" + Math.floor(player.carry), x + 22, y - 30, "rgba(32,50,60,0.9)", 12);
    }
  }

  /* ---------- 描画ユーティリティ ---------- */
  function emoji(ch, x, y, size) { ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = size + "px sans-serif"; ctx.fillText(ch, x, y); }
  function badge(text, x, y, bg, fs) {
    ctx.font = "bold " + (fs || 13) + "px sans-serif";
    const w = ctx.measureText(text).width + 14;
    roundRect(x - w / 2, y - (fs ? fs - 1 : 11), w, (fs ? fs + 8 : 22), 10); ctx.fillStyle = bg || "rgba(32,50,60,0.85)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
  }
  function stageHeader(z, x, y) {
    const txt = z.stage + " " + z.name;
    ctx.font = "bold 13px sans-serif"; const w = ctx.measureText(txt).width + 16;
    roundRect(x - w / 2, y - 11, w, 22, 11); ctx.fillStyle = "rgba(20,98,127,0.92)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y);
  }
  function lvBadge(x, y, txt) {
    ctx.font = "bold 12px sans-serif"; const w = ctx.measureText(txt).width + 14;
    roundRect(x - w / 2, y - 10, w, 20, 10); ctx.fillStyle = "rgba(54,179,126,0.95)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y);
  }
  function arrow(x1, y1, x2, y2) {
    const ang = Math.atan2(y2 - y1, x2 - x1), head = 11;
    ctx.strokeStyle = "rgba(255,140,66,0.85)"; ctx.fillStyle = "rgba(255,140,66,0.85)"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * head, y2 - Math.sin(ang) * head); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill(); ctx.lineCap = "butt";
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* =========================================================
     HUD / トースト
     ========================================================= */
  const el = (id) => document.getElementById(id);
  function updateHUD(st) {
    el("hud-money").textContent = Math.floor(S.money).toLocaleString();
    el("hud-rate").textContent = Math.round(incomeRate).toLocaleString();
    el("hud-rep").textContent = Math.round(S.reputation);
    el("hud-day").textContent = S.day;
    // 手持ち
    const cimg = el("hud-carry-img"), cnt = el("hud-carry");
    if (player.carry > 0 && player.carryType) {
      cimg.style.visibility = "visible";
      cimg.src = "assets/" + ({ raw: "raw-shirasu", pack: "pack-shirasu", bowl: "shirasu-bowl" }[player.carryType]) + ".png";
      cnt.textContent = Math.floor(player.carry) + "/" + P.carryCap();
    } else {
      cimg.style.visibility = "hidden";
      cnt.textContent = "0/" + P.carryCap();
    }
    const banner = el("action-banner");
    let msg = null;
    if (player.py < seaBottom()) msg = "🌊 海で漁中：魚に重なってシラスGET！";
    else if (st) {
      if (st.input && player.carryType === st.input && player.carry > 0) msg = st.stage + " " + st.name + "：荷降ろし中…";
      else if (st.output && S.stock[st.id].out > 0) msg = st.stage + " " + st.name + "：積み込み中…";
      else msg = st.stage + " " + st.name;
    }
    if (msg) { banner.classList.remove("hidden"); banner.textContent = msg; }
    else banner.classList.add("hidden");
  }
  function toast(msg, type) {
    const d = document.createElement("div");
    d.className = "toast " + (type || ""); d.textContent = msg;
    el("toast-area").appendChild(d); setTimeout(() => d.remove(), 2600);
  }

  /* =========================================================
     ランダムイベント
     ========================================================= */
  function triggerRandomEvent() {
    const pool = [];
    if (!S.machineBroken) pool.push({ w: 3, fn: evMachineBreak });
    pool.push({ w: 3, fn: evPoorCatch });
    if (S.reputation > 20) pool.push({ w: 2, fn: evComplaint });
    pool.push({ w: 2, fn: evGoodCatch });
    pool.push({ w: 2, fn: evTourBus });
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
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
      item.innerHTML =
        '<div class="si-ico">' + u.icon + "</div>" +
        '<div class="si-body"><div class="si-name">' + u.name + "</div>" +
        '<div class="si-lv">現在：' + u.lvNames[lv] + "（Lv." + lv + "/" + maxLv + "）</div>" +
        '<div class="si-desc">' + u.desc(lv) + "</div></div>";
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
    save(); renderShop();
  }

  /* =========================================================
     画面・モーダル制御
     ========================================================= */
  function openModal(id) { paused = true; if (id === "shop-modal") renderShop(); el(id).classList.remove("hidden"); }
  function closeModal(id) {
    el(id).classList.add("hidden");
    const anyOpen = [...document.querySelectorAll(".modal")].some((m) => !m.classList.contains("hidden"));
    if (!anyOpen && el("title-screen").classList.contains("hidden")) paused = false;
  }
  function startGame() {
    el("title-screen").classList.add("hidden");
    el("game-screen").classList.remove("hidden");
    resize();
    playerInit = false;
    lastTotalEarned = S.totalEarned; incomeRate = 0; earnTimer = 0;
    paused = false;
  }

  el("start-btn").addEventListener("click", () => { load(); startGame(); });
  el("reset-btn").addEventListener("click", () => {
    if (confirm("最初からやり直しますか？（セーブが消えます）")) { localStorage.removeItem(SAVE_KEY); S = newGame(); startGame(); }
  });
  el("shop-btn").addEventListener("click", () => openModal("shop-modal"));
  el("help-btn").addEventListener("click", () => openModal("help-modal"));
  document.querySelectorAll(".close-btn").forEach((b) => b.addEventListener("click", () => closeModal(b.dataset.close)));

  resize();
  requestAnimationFrame(loop);
})();
