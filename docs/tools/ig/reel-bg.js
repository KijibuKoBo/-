/* リール（1080×1920）の下敷きを作る */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const D = __dirname;
const font = fs.readFileSync(path.join(D, 'zen-inline.css'), 'utf8');
fs.mkdirSync(path.join(D, 'reel'), { recursive: true });

const SEGS = [
  { t: "山場は、あなたの手で", s: "光る帯に重なった瞬間、その板を叩く" },
  { t: "節のある板は、よける", s: "良い板だけを、受け台で受ける" },
  { t: "出てくる家具は、ぜんぶ本物", s: "写真のまま、図鑑にしました" },
  { t: "作った家具は、お部屋へ", s: "本物のドールハウスに、並べられます" }
];
const URLTXT = "kijibukobo.github.io/-/game/";

const css = `
${font}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#222}
.r{
  width:1080px;height:1920px;position:relative;overflow:hidden;
  font-family:"Zen Maru Gothic","IPAPGothic",sans-serif;color:#6b4a2f;
  background:
    repeating-linear-gradient(0deg, rgba(176,138,99,.055) 0 2px, transparent 2px 32px),
    radial-gradient(circle at 50% -6%, #fff8e8 0%, #faf3e3 56%, #f3e7cd 100%);
}
.r::after{content:"";position:absolute;inset:0;pointer-events:none;
  box-shadow:inset 0 0 0 16px #f3e7cd, inset 0 0 0 19px #caa06d}
.kick{position:absolute;top:150px;left:0;right:0;text-align:center;
  font-size:30px;font-weight:700;color:#b08a63;letter-spacing:.18em}
.t{position:absolute;top:218px;left:0;right:0;text-align:center;
  font-size:76px;font-weight:700;line-height:1.35}
.s{position:absolute;top:350px;left:0;right:0;text-align:center;
  font-size:34px;font-weight:500;color:#8a6446;letter-spacing:.04em}
.u{position:absolute;bottom:150px;left:0;right:0;text-align:center;
  font-size:38px;font-weight:700;color:#8a6a2f}
.u span{border:3px dashed #c9a24b;background:#fffdf5;border-radius:999px;padding:18px 46px}
/* 終わりの一枚 */
.end .big{position:absolute;top:620px;left:0;right:0;text-align:center;
  font-size:86px;font-weight:700;line-height:1.4}
.end .mid{position:absolute;top:900px;left:0;right:0;text-align:center;
  font-size:38px;font-weight:500;color:#8a6446;line-height:1.9}
.end .u{bottom:560px;font-size:46px}
.end .note{position:absolute;bottom:440px;left:0;right:0;text-align:center;
  font-size:32px;color:#b08a63;letter-spacing:.08em}
`;

const html = `<!doctype html><meta charset="utf-8"><style>${css}</style>` +
  SEGS.map(g => `
    <div class="r">
      <div class="kick">松永工房クラフトストーリー</div>
      <div class="t">${g.t}</div>
      <div class="s">${g.s}</div>
      <div class="u"><span>${URLTXT}</span></div>
    </div>`).join('') +
  `<div class="r end">
     <div class="kick">松永工房クラフトストーリー</div>
     <div class="big">工房が、<br>ゲームになりました。</div>
     <div class="mid">静岡の小さな工房がつくる<br>ドール家具が、そのまま出てきます。</div>
     <div class="u"><span>${URLTXT}</span></div>
     <div class="note">ブラウザで、無料で、登録なしで</div>
   </div>`;

(async () => {
  fs.writeFileSync(path.join(D, 'reel.html'), html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(D, 'reel.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  const els = await p.$$('.r');
  for (let i = 0; i < els.length; i++) {
    await els[i].screenshot({ path: path.join(D, 'reel', `bg${i + 1}.png`) });
    console.log('   bg' + (i + 1));
  }
  await b.close();
})();
