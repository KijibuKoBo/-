const { chromium } = require('playwright-core');
const KEY='matsunaga-craft-story-v1';
const DAY='file:///home/user/-/game/index.html?day=2026-11-08';
const seed = require('./seed.json');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:430,height:950},deviceScaleFactor:2});
  const boot=async(s)=>{
    await p.goto(DAY);
    await p.evaluate(({k,v})=>{localStorage.clear(); if(v) localStorage.setItem(k,v);},
      {k:KEY,v:s?JSON.stringify(s):null});
    await p.goto(DAY);
    await p.waitForFunction(()=>typeof avReady!=='undefined'&&avReady,{timeout:20000});
    await p.waitForTimeout(500);
  };
  // 記念証は、証書そのものだけを撮る
  await boot(seed);
  await p.evaluate(()=>{renderCert();openModal('cert-modal');});
  await p.waitForTimeout(700);
  await (await p.$('#cert-body .cert')).screenshot({path:'../shots/cert.jpg'});
  // 合言葉の欄
  await boot();
  await p.evaluate(()=>{ document.querySelector('#av-code').value='ねこあし'; });
  await (await p.$('#av-event')).screenshot({path:'../shots/code.jpg'});
  await b.close(); console.log('ok');
})();
