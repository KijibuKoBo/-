/* インスタの束（1080×1350）を組む */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const D = __dirname;
const RAW = path.join(D, 'raw');
const OUT = path.join(D, 'out');
fs.mkdirSync(OUT, { recursive: true });

const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(path.join(RAW, f)).toString('base64');
const IMG = {
  'room-wide': b64('el-room.png'),
  room: b64('el-room.png'),
  dex: b64('m-dex-modal.png'),
  craft: b64('el-craft.png'),
  kugi: b64('mg-kugi.png'),
  mekiki: b64('mg-mekiki.png'),
  cert: b64('cert.png'),
  room2: b64('el-room2.png'),
  certtop: b64('certtop.png')
};
const frames = JSON.parse(fs.readFileSync(path.join(D, 'frames.json'), 'utf8'));
const font = fs.readFileSync(path.join(D, 'zen-inline.css'), 'utf8');
const br = (s) => String(s).replace(/\n/g, '<br>');

const css = `
${font}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#2b2b2b}
.f{
  width:1080px;height:1350px;position:relative;overflow:hidden;
  font-family:"Zen Maru Gothic","IPAPGothic",sans-serif;
  color:#6b4a2f;
  background:
    repeating-linear-gradient(0deg, rgba(176,138,99,.055) 0 2px, transparent 2px 30px),
    radial-gradient(circle at 50% -8%, #fff8e8 0%, #faf3e3 58%, #f3e7cd 100%);
  display:flex;flex-direction:column;
}
.f::after{
  content:"";position:absolute;inset:0;pointer-events:none;
  box-shadow:inset 0 0 0 14px #f3e7cd, inset 0 0 0 17px #caa06d;
}
.pad{padding:76px 84px 0}
.kicker{font-size:30px;font-weight:700;color:#b08a63;letter-spacing:.14em;text-align:center}
.ttl{font-size:74px;font-weight:700;line-height:1.42;letter-spacing:.01em;text-align:center}
.cover .ttl{font-size:84px;margin-top:22px}
.sub{font-size:31px;color:#8a6446;text-align:center;margin-top:18px;letter-spacing:.06em}
.body{font-size:35px;font-weight:500;color:#8a6446;line-height:1.95;text-align:center;margin-top:24px}
.shot{
  flex:1;display:flex;align-items:center;justify-content:center;
  padding:40px 84px 0;min-height:0;
}
.shot img{
  max-width:100%;max-height:100%;display:block;
  border:5px solid #caa06d;border-radius:26px;
  box-shadow:0 14px 30px rgba(107,74,47,.22);
}
.shot.crop{overflow:hidden}
.shot.crop .win{
  width:100%;max-height:100%;overflow:hidden;border:5px solid #caa06d;border-radius:26px;
  box-shadow:0 14px 30px rgba(107,74,47,.22);background:#fffdf5;
}
.shot.crop .win img{border:0;border-radius:0;box-shadow:none;max-height:none;width:100%}
.foot{
  padding:0 84px 70px;text-align:center;font-size:30px;color:#b08a63;letter-spacing:.08em;
}
.pill{
  display:inline-block;margin-top:10px;
  font-size:34px;font-weight:700;color:#8a6a2f;
  border:3px solid #c9a24b;background:#fdf3d5;border-radius:999px;padding:14px 40px;
}
.n{
  position:absolute;right:46px;top:44px;
  font-size:26px;font-weight:700;color:#b08a63;letter-spacing:.1em;
}
.url{
  font-size:42px;font-weight:700;color:#6b4a2f;letter-spacing:.01em;
  border:4px dashed #c9a24b;border-radius:22px;background:#fffdf5;
  padding:26px 20px;margin:0 84px;text-align:center;
}
.note{font-size:29px;color:#b08a63;text-align:center;margin-top:20px;letter-spacing:.06em}
.last .shot{padding-top:24px}
`;

const frameHtml = (f, i, n) => {
  if (f.kind === 'cover') return `
    <div class="f cover">
      <div class="pad">
        <div class="kicker">${f.kicker}</div>
        <div class="ttl">${br(f.title)}</div>
        <div class="sub">${f.sub}</div>
      </div>
      <div class="shot crop"><div class="win"><img src="${IMG[f.img]}"></div></div>
      <div class="foot"><span class="pill">${f.foot}</span></div>
    </div>`;
  if (f.kind === 'last') return `
    <div class="f last">
      <div class="n">${i} / ${n}</div>
      <div class="pad">
        <div class="ttl">${br(f.title)}</div>
        <div class="body">${br(f.body)}</div>
      </div>
      <div class="shot"><img src="${IMG[f.img]}"></div>
      <div class="url">${f.url}</div>
      <div class="foot"><div class="note">${f.note}</div></div>
    </div>`;
  return `
    <div class="f">
      <div class="n">${i} / ${n}</div>
      <div class="pad">
        <div class="ttl">${br(f.title)}</div>
        <div class="body">${br(f.body)}</div>
      </div>
      <div class="shot ${/dex/.test(f.img) ? 'crop' : ''}">${
        /dex/.test(f.img)
          ? `<div class="win"><img src="${IMG[f.img]}"></div>`
          : `<img src="${IMG[f.img]}">`}</div>
      <div class="foot"></div>
    </div>`;
};

(async () => {
  const n = frames.length;
  const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>` +
    frames.map((f, k) => frameHtml(f, k + 1, n)).join('');
  fs.writeFileSync(path.join(D, 'frames.html'), html);

  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + path.join(D, 'frames.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  const els = await p.$$('.f');
  for (let i = 0; i < els.length; i++) {
    const f = path.join(OUT, `ig-${String(i + 1).padStart(2, '0')}.png`);
    await els[i].screenshot({ path: f });
    console.log('  ', path.basename(f));
  }
  await b.close();
})();
