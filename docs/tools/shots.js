/* 提案書に載せる画面を撮る */
const { chromium } = require('playwright-core');
const KEY='matsunaga-craft-story-v1';
const DAY='file:///home/user/-/game/index.html?day=2026-11-08';
const seed = {
  ver:14, exp:600, level:5, money:68000, day:9,
  player:{ name:'けん', avatar:{skin:0,hairColor:1,hair:3,eyes:0,mouth:0,hat:0,glasses:1,beard:0,ear:0,art:1} },
  completed:{ stool:{count:4,best:'A',bestScore:82,bestPop:60,ace:true},
              tea_table:{count:2,best:'S',bestScore:96,bestPop:93,ace:true},
              mirror_stand:{count:1,best:'B',bestScore:70,bestPop:40,ace:false},
              rose_sofa:{count:1,best:'S',bestScore:94,bestPop:70,ace:true} },
  craftLog:{woods:{oak:3,walnut:2,cherry:1,maple:1,beech:1,ash:1,teak:1,mahogany:1},
            finishS:{oil:true,wax:true}, hi:22, total:7},
  event:{doll:{day:3,on:'2026-11-08'}}, boost:{quality:0,pop:0,action:0}
};
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
  const shot=async(sel,name)=>{ const el=await p.$(sel); await el.screenshot({path:'../shots/'+name+'.jpg'}); console.log('→',name); };

  // ① 職人をつくる画面
  await boot();
  await p.evaluate(async()=>{ avDraft.hair=3; avDraft.hairColor=1; renderAvatarEditor();
    await new Promise(r=>setTimeout(r,300)); });
  await shot('#avatar-modal .modal','avatar');

  // ② 記念証
  await boot(seed);
  await p.evaluate(()=>{renderCert();openModal('cert-modal');});
  await p.waitForTimeout(700);
  await shot('#cert-modal .modal','cert');

  // ③ 仕入れ（木材の絵）
  await boot(seed);
  await p.click('#btn-market'); await p.waitForTimeout(600);
  await p.evaluate(()=>{ const m=document.querySelector('#market-modal .modal'); m.scrollTop=0; });
  await shot('#market-modal .modal','market');

  // ④ 図鑑 → 本物があります
  await boot(seed);
  await p.click('#btn-dex'); await p.waitForTimeout(700);
  await p.evaluate(()=>document.querySelector('.dex-real').scrollIntoView({block:'center'}));
  await p.waitForTimeout(300);
  await shot('#dex-modal .modal','dex');

  // ⑤ 本物のページ
  await boot(seed);
  await p.evaluate(()=>{renderPetit();openModal('petit-modal');});
  await p.waitForTimeout(800);
  await shot('#petit-modal .modal','petit');

  // ⑥ 制作の山場（ミニゲーム）
  await boot(seed);
  await p.evaluate(async()=>{
    MATERIALS.forEach(m=>state.materials[m.id]=9);
    document.querySelector('.select-item[data-id="stool"]').click();
    await new Promise(r=>setTimeout(r,350));
  });
  await p.waitForTimeout(400);
  await shot('#card-area','prep');
  await b.close();
})();
