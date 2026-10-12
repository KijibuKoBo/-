const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto('file:///home/user/-/docs/proposal.html');
  await p.waitForTimeout(800);
  await p.pdf({
    path: '/home/user/-/docs/松永工房クラフトストーリー-ご提案.pdf',
    format: 'A4', printBackground: true,
    margin: { top: '18mm', bottom: '16mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8pt;color:#8a7a64;text-align:center;font-family:sans-serif;">'
      + '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });
  console.log('PDF を書き出した');
  await b.close();
})();
