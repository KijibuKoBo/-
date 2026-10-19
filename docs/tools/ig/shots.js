/* インスタ用の素材を、実際のゲームから撮る */
const { chromium } = require('playwright-core');
const seed = require('./seed.js');
const URL = 'file:///home/user/-/game/index.html?day=2026-11-08';
const OUT = '/tmp/claude-0/-home-user--/7aac3a01-e435-58a5-8958-b9e0c86a0373/scratchpad/ig/raw/';
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 3 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));

  await p.goto(URL);
  await p.waitForFunction(() => typeof state === 'object' && typeof save === 'function');
  await seed(p);
  await p.goto(URL);
  await p.waitForFunction(() => typeof avReady !== 'undefined' && avReady, { timeout: 20000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')));

  const shot = async (name, sel) => {
    await p.waitForTimeout(450);
    const el = sel ? await p.$(sel) : null;
    if (el) await el.screenshot({ path: OUT + name + '.png' });
    else await p.screenshot({ path: OUT + name + '.png' });
    console.log('  ', name);
  };
  const modal = async (name, fn) => {
    await p.evaluate(fn);
    await p.waitForTimeout(700);
    await shot(name, '#' + name.replace(/^m-/, '') + ' .modal');
    await p.evaluate(() => document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')));
  };

  /* 1. 工房のてっぺん（ヘッダーごと） */
  await shot('home');

  /* 2. 設計をえらぶ */
  await p.evaluate(() => { renderSelect(); });
  await p.waitForTimeout(500);
  await shot('select');

  /* 3. 作っているところ */
  await p.evaluate(() => {
    const f = furnitureById('skull_cabinet') || FURNITURE[6];
    state.currentId = f.id; state.stepIndex = 3; state.craftUsed = 7;
    state.craft = { design: DESIGNS[0].id, wood: 'walnut', finish: FINISHES[0].id };
    state.craftBoost = { quality: 0, pop: 0, action: 0 };
    state.quality = BASE_QUALITY + 22; state.actionScore = null;
    render();
  });
  await shot('craft');

  /* 4〜6. 山場（釘打ち・木の目利き・木取り） */
  for (const [key, label] of [['rhythm','mg-kugi'], ['mekiki','mg-mekiki'], ['kidori','mg-kidori']]) {
    const pg = await b.newPage({ viewport: { width: 430, height: 950 }, deviceScaleFactor: 3 });
    pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto('file:///home/user/-/game/index.html?mg=' + key);
    await pg.waitForFunction(() => document.querySelector('.act-stage svg *'));
    await pg.waitForTimeout(key === 'rhythm' ? 3400 : 2600);
    await (await pg.$('.act-stage')).screenshot({ path: OUT + label + '.png' });
    console.log('  ', label);
    await pg.close();
  }

  /* 素材として、部品だけを撮る */
  await p.evaluate(() => { render(); });
  await p.waitForTimeout(400);
  await shot('el-craft', '#craft-card');
  await p.evaluate(() => { renderRoom(); openModal('room-modal'); });
  await p.waitForTimeout(900);
  await shot('el-room', '#room-stage');
  await p.evaluate(() => { state.room.bg = 'day'; renderRoom(); });
  await p.waitForTimeout(900);
  await shot('el-room2', '#room-stage');
  await p.evaluate(() => { state.room.bg = 'petit'; renderRoom(); });
  await p.evaluate(() => document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')));

  /* 7. 図鑑 */
  await modal('m-dex-modal', () => { renderDex(); openModal('dex-modal'); });
  /* 8. お部屋 */
  await modal('m-room-modal', () => { renderRoom(); openModal('room-modal'); });
  /* 9. 記念証 */
  await p.evaluate(() => { renderCert(); openModal('cert-modal'); });
  await p.waitForTimeout(800);
  await shot('cert', '#cert-body .cert');
  await p.evaluate(() => document.querySelectorAll('.modal-back.open').forEach(m => m.classList.remove('open')));
  /* 10. 本物の家具 */
  await modal('m-petit-modal', () => { renderPetit(); openModal('petit-modal'); });

  console.log('errors:', errs.length ? errs.slice(0, 3) : 'なし');
  await b.close();
})();
