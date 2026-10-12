/* 開催日の決まった催しのテスト */
const { chromium } = require('playwright-core');
const KEY='matsunaga-craft-story-v1';
const F='file:///home/user/-/game/index.html';
let bad=0;
const ok=(c,m,x)=>{console.log((c?'  ok   ':'  NG   ')+m+(!c&&x!=null?'  → '+x:''));if(!c)bad++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:420,height:900}});
  const err=[];p.on('pageerror',e=>err.push('PAGEERROR '+e.message));
  p.on('console',m=>{if(m.type()==='error')err.push('CONSOLE '+m.text());});
  const boot=async(url)=>{
    await p.goto(url);
    await p.evaluate(k=>localStorage.removeItem(k), KEY);
    await p.reload();
    await p.waitForFunction(()=>typeof avReady!=='undefined'&&avReady,{timeout:20000});
    await p.waitForTimeout(200);
  };

  console.log('\n■ 催しの中身');
  await boot(F);
  const e=await p.evaluate(()=>EVENTS[0]);
  ok(e.title==='ドール工房ツアー','名前は「ドール工房ツアー」',e.title);
  ok(JSON.stringify(e.days)==='["2026-11-08"]','開催日は 2026-11-08',JSON.stringify(e.days));
  ok(e.code==='ねこあし','合言葉は ねこあし',e.code);
  ok(e.key==='neko','QRの印は neko',e.key);
  ok(e.guests===true&&e.gift===true,'お客さま5人と小刀つき');
  ok(e.extra.length===3,'限定の設計図3種',e.extra.length);

  console.log('\n■ その日でないときは受けつけない');
  const before=await p.evaluate(()=>{
    const r=findEvent('ねこあし');
    return {early:!!r.early,late:!!r.late,ok:eventOk(r),msg:eventNg(r),today:todayStr()};
  });
  ok(!before.ok,'きょう（'+before.today+'）は受けつけない');
  ok(before.early&&!before.late,'「まだ先」と判じている');
  ok(/まだ来ておらん/.test(before.msg),'ことばも「まだ来ておらん」',before.msg);
  console.log('        ' + before.msg);

  await boot(F+'?day=2026-11-20');
  const after=await p.evaluate(()=>{
    const r=findEvent('ねこあし'); return {early:!!r.early,late:!!r.late,msg:eventNg(r)};
  });
  ok(after.late&&!after.early,'過ぎた日は「過ぎた」と判じている');
  ok(/過ぎてしもうた/.test(after.msg),'ことばも「過ぎてしもうた」',after.msg);
  console.log('        ' + after.msg);

  console.log('\n■ 当日は受けつける');
  await boot(F+'?day=2026-11-08');
  const onday=await p.evaluate(()=>{
    const r=findEvent('ねこあし');
    return {ok:eventOk(r), live:eventLive(EVENTS[0]), today:todayStr()};
  });
  ok(onday.today==='2026-11-08','けいこの日づけが効く',onday.today);
  ok(onday.ok,'当日は合言葉が通る');

  /* 書き方のゆれ */
  const vary=await p.evaluate(()=>['ねこあし','ネコアシ','ねこ あし','ネコあし','ねこあし ','neko']
    .map(t=>[t, eventOk(findEvent(t))]));
  vary.forEach(([t,v])=>ok(v, `「${t}」でも通る`));
  ok(await p.evaluate(()=>!eventOk(findEvent('ねこのあし'))), 'ちがう言葉は通らない');

  console.log('\n■ 当日に、職人をつくって合言葉を入れる');
  await boot(F+'?day=2026-11-08');
  const made=await p.evaluate(async()=>{
    openAvatarEditor(true);
    await new Promise(r=>setTimeout(r,250));
    document.querySelector('#av-name').value='けん';
    document.querySelector('#av-code').value='ねこあし';
    document.querySelector('#av-done').click();
    await new Promise(r=>setTimeout(r,500));
    return {joined:eventOpen(), title:playerTitle(), tool:state.tool,
            on:(state.event.doll||{}).on, day:(state.event.doll||{}).day,
            dex:dexTotal(), extra:EVENTS[0].extra.filter(id=>extraOpen(id)).length,
            guests:eventHas('guests')};
  });
  ok(made.joined,'催しに入れた');
  ok(made.title==='記念日の見習い','称号がつく',made.title);
  ok(made.tool==='gift','あの日の小刀を持っている',made.tool);
  ok(made.on==='2026-11-08','開催日が記録される',made.on);
  ok(made.extra===3,'限定の設計図3種が開く',made.extra);
  ok(made.guests,'特別なお客さま5人が来る');
  ok(made.dex===49,'図鑑が49マスになる',made.dex);

  /* 記念証に開催日が出る */
  const cert=await p.evaluate(()=>{
    renderCert();
    return (document.querySelector('.cert-event')||{}).textContent||'';
  });
  ok(/ドール工房ツアー/.test(cert),'記念証に催しの名前',cert);
  ok(/2026-11-08/.test(cert),'記念証に開催日',cert);
  console.log('        ' + cert.replace(/\s+/g,' ').trim());

  console.log('\n■ 当日を過ぎても、一度受けとった人はそのまま');
  await p.goto(F);     // けいこの日づけを外す ＝ きょうに戻る
  await p.waitForFunction(()=>typeof avReady!=='undefined'&&avReady,{timeout:20000});
  await p.waitForTimeout(300);
  const keep=await p.evaluate(()=>({joined:eventOpen(), title:playerTitle(),
    tool:state.tool, dex:dexTotal(), today:todayStr()}));
  ok(keep.joined,'日が変わっても、催しの職人のまま');
  ok(keep.title==='記念日の見習い','称号も残る',keep.title);
  ok(keep.tool==='gift','小刀も残る',keep.tool);
  ok(keep.dex===49,'図鑑も49マスのまま',keep.dex);

  console.log('\n■ QRカードのURL');
  await boot(F+'?k=neko&day=2026-11-08');
  const qr=await p.evaluate(async()=>{
    openAvatarEditor(true);
    await new Promise(r=>setTimeout(r,250));
    return {filled:document.querySelector('#av-code').value,
            msg:document.querySelector('#av-code-msg').textContent,
            green:document.querySelector('#av-code-msg').classList.contains('ok')};
  });
  ok(qr.filled==='ねこあし','カードから来ると合言葉が入っている',qr.filled);
  ok(qr.green,'受けつけた印（緑）が出る');
  ok(/入りました/.test(qr.msg),'ことばも通った知らせ',qr.msg);

  await boot(F+'?k=neko');     // 当日でない日にカードを読んだとき
  const qrEarly=await p.evaluate(async()=>{
    openAvatarEditor(true);
    await new Promise(r=>setTimeout(r,250));
    return {msg:document.querySelector('#av-code-msg').textContent,
            green:document.querySelector('#av-code-msg').classList.contains('ok')};
  });
  ok(!qrEarly.green,'当日より前にカードを読んでも、受けつけない');
  ok(/まだ来ておらん/.test(qrEarly.msg),'そのことを伝える',qrEarly.msg);

  console.log('\n■ ページのエラー');
  if(err.length){err.slice(0,6).forEach(e=>console.log('  NG   '+e));bad+=err.length;}
  else console.log('  ok   なし');
  await b.close();
  console.log(bad?`\n✗ ${bad}件 だめ`:'\n✓ すべて通った');
  process.exit(bad?1:0);
})();
