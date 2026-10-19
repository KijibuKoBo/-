/* インスタ用の動画を、実際に遊んで録る */
const { chromium } = require('playwright-core');
const seed = require('./seed.js');
const fs = require('fs'), path = require('path');
const D = __dirname, VID = path.join(D, 'vid');
fs.rmSync(VID, { recursive: true, force: true });
fs.mkdirSync(VID, { recursive: true });
const URL = 'file:///home/user/-/game/index.html?day=2026-11-08';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  /* ---- 1本目：図鑑とお部屋（ゲームの画面まるごと） ---- */
  {
    const c = await b.newContext({
      viewport: { width: 430, height: 950 },
      recordVideo: { dir: path.join(VID, 'a'), size: { width: 430, height: 950 } }
    });
    const p = await c.newPage();
    await p.goto(URL);
    await p.waitForFunction(() => typeof save === 'function');
    await seed(p);
    await p.goto(URL);
    await p.waitForFunction(() => typeof avReady !== 'undefined' && avReady, { timeout: 20000 });
    await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')));
    await p.waitForTimeout(700);

    /* 図鑑をゆっくり見る */
    await p.evaluate(() => { renderDex(); openModal('dex-modal'); });
    await p.waitForTimeout(1400);
    for (let i = 0; i < 46; i++) {
      await p.evaluate(() => { const m = document.querySelector('#dex-modal .modal'); m.scrollTop += 26; });
      await p.waitForTimeout(42);
    }
    await p.waitForTimeout(900);
    await p.evaluate(() => closeModal('dex-modal'));
    await p.waitForTimeout(600);

    /* お部屋を見て、部屋を切りかえる */
    await p.evaluate(() => { state.room.bg = 'petit'; renderRoom(); openModal('room-modal'); });
    await p.waitForTimeout(1800);
    for (const id of ['day', 'attic', 'green', 'night']) {
      await p.evaluate((r) => { state.room.bg = r; renderRoom(); }, id);
      await p.waitForTimeout(1250);
    }
    await p.evaluate(() => { state.room.bg = 'petit'; renderRoom(); });
    await p.waitForTimeout(1300);

    await c.close();
    console.log('   a 録れた');
  }

  /* ---- 2本目：釘打ちを、ねらって打つ ---- */
  {
    const c = await b.newContext({
      viewport: { width: 430, height: 950 },
      recordVideo: { dir: path.join(VID, 'b'), size: { width: 430, height: 950 } }
    });
    const p = await c.newPage();
    await p.goto('file:///home/user/-/game/index.html?mg=rhythm');
    await p.waitForFunction(() => document.querySelector('#kgNails'));
    await p.waitForTimeout(1200);
    const box = await p.locator('.act-stage').boundingBox();
    const t0 = Date.now();
    while (Date.now() - t0 < 13000) {
      const x = await p.evaluate(() => {
        const gs = [...document.querySelectorAll('#kgNails g')];
        let best = null, bd = 9;
        for (const g of gs) {
          const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
          if (!m) continue;
          const d = Math.abs(+m[2] - 200);
          if (d < bd) { bd = d; best = +m[1]; }
        }
        return best;
      });
      if (x !== null) {
        await p.mouse.move(box.x + box.width * x / 300, box.y + box.height * 0.67);
        await p.mouse.down(); await p.mouse.up();
      }
      await p.waitForTimeout(45);
    }
    await p.waitForTimeout(600);
    await c.close();
    console.log('   b 録れた');
  }

  /* ---- 3本目：木の目利き ---- */
  {
    const c = await b.newContext({
      viewport: { width: 430, height: 950 },
      recordVideo: { dir: path.join(VID, 'c'), size: { width: 430, height: 950 } }
    });
    const p = await c.newPage();
    await p.goto('file:///home/user/-/game/index.html?mg=mekiki');
    await p.waitForFunction(() => document.querySelector('.act-stage svg *'));
    await p.waitForTimeout(1200);
    const box = await p.locator('.act-stage').boundingBox();
    const t0 = Date.now();
    while (Date.now() - t0 < 9000) {
      /* 良い板だけを追いかける。節のある板からは逃げる */
      const x = await p.evaluate(() => {
        const svg = document.querySelector('.act-stage svg');
        const gs = [...svg.querySelectorAll('#mkWorld g, #mkWorld image')];
        let tx = null, ty = -1;
        svg.querySelectorAll('g').forEach(g => {
          const m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(g.getAttribute('transform') || '');
          if (!m) return;
          const y = +m[2];
          const href = (g.querySelector('image') || {}).href;
          const good = g.innerHTML.indexOf('p_bad') < 0;
          if (good && y > ty && y < 230) { ty = y; tx = +m[1]; }
        });
        return tx;
      });
      if (x !== null) {
        await p.mouse.move(box.x + box.width * Math.max(20, Math.min(280, x)) / 300,
                           box.y + box.height * 0.85);
      }
      await p.waitForTimeout(60);
    }
    await c.close();
    console.log('   c 録れた');
  }

  await b.close();
  for (const d of ['a', 'b', 'c']) {
    const f = fs.readdirSync(path.join(VID, d))[0];
    fs.renameSync(path.join(VID, d, f), path.join(VID, d + '.webm'));
    console.log('  ', d + '.webm', (fs.statSync(path.join(VID, d + '.webm')).size / 1024 / 1024).toFixed(1) + ' MB');
  }
})();
