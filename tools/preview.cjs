// Isolated browser QA: sample records exist only in fresh browser contexts.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'index.html'),'utf8');
const html=raw.replace('Sync.init();',"Sync.state.status='ready'; renderChip();").replace(/\}\)\(\);\s*<\/script>/,"window.__test = expression => eval(expression);})();\n</script>");
const fixture={sessions:['2026-09-11','2026-09-16','2026-09-30'].map((date,i)=>({date,dayId:'total',entries:{
 'tb-lying-leg-curl':{w:[55,55,50][i],t:'hold'},'tb-any-squat':{w:[13.75,15,12.5][i],t:'hold'},'tb-barbell-incline-press':{w:[23.75,23.75,22.5][i],t:'hold'}
} })),drafts:{'tb-lying-leg-curl':{w:'50'},'tb-any-squat':{w:'12,5'},'tb-barbell-incline-press':{w:'22,5',sug:true}}};
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 if(name==='/' || name==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 const target=path.resolve(root,'.'+name);
 if(!target.startsWith(root+path.sep) || name==='/sw.js'){res.writeHead(404);res.end();return;}
 if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.svg')?'image/svg+xml':name.endsWith('.jpg')?'image/jpeg':'application/json');res.end(fs.readFileSync(target));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const output=path.join(root,'artifacts');fs.mkdirSync(output,{recursive:true});
 try{
  for(const width of [360,412,1280]){
   const context=await browser.newContext({viewport:{width,height:width===1280?1000:1100},deviceScaleFactor:2,serviceWorkers:'block'});
   await context.addInitScript(data=>{localStorage.setItem('trainingsplan.v1.sessions',JSON.stringify(data.sessions));localStorage.setItem('trainingsplan.v1.drafts',JSON.stringify(data.drafts));},fixture);
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('[data-overview-day="total"]').click();await page.locator('#summary-title-total').waitFor();
   assert.equal(await page.locator('#summary-title-total').textContent(),'2 von 7 bestätigt');
   const metrics=await page.evaluate(()=>{
    const title=document.querySelector('.plan-btn.is-active'),bar=document.querySelector('.plan-bar'),sync=document.querySelector('.sync-chip');
    const a=title.getBoundingClientRect(),b=bar.getBoundingClientRect(),s=sync.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,titleVisible:a.left>=b.left&&a.right<=b.right,titleClipped:title.scrollWidth>title.clientWidth,
     syncOverlaps:s.left<b.right-1,
     small:[...document.querySelectorAll('.app-header button,.view.is-active .ex-swap,.view.is-active .spec-chip,.view.is-active .ex-check:not([hidden]),.view.is-active .seg button,.view.is-active .btn-primary,.view.is-active .btn-confirm-all')].filter(el=>{const r=el.getBoundingClientRect();return r.width<43.9||r.height<43.9;}).map(el=>el.className)};
   });
   assert.equal(metrics.overflow,false,JSON.stringify(metrics));assert.equal(metrics.titleVisible,true,JSON.stringify(metrics));assert.equal(metrics.titleClipped,false);
   assert.equal(metrics.syncOverlaps,false);assert.deepEqual(metrics.small,[]);
   await page.screenshot({path:path.join(output,'minmax-'+width+'.png'),fullPage:false,animations:'disabled'});
   await page.locator('#tab-progress').click();
   const chart=await page.locator('#chart-wrap svg').boundingBox();assert.ok(chart.height<=225);
   const legend=page.locator('#legend button');assert.equal(await legend.count(),7);
   const chips=await legend.evaluateAll(items=>items.map(e=>({height:e.getBoundingClientRect().height,overflow:e.scrollWidth>e.clientWidth+1,border:getComputedStyle(e).borderTopColor,name:e.textContent})));
   assert.ok(chips.every(e=>e.height>=23.9&&e.height<=26&&!e.overflow),JSON.stringify(chips));assert.equal(await page.locator('#legend .lkey').count(),0);
   const firstColor=chips[0].border;await legend.first().click();assert.equal(await legend.first().getAttribute('aria-pressed'),'false');assert.equal(await legend.nth(1).evaluate(e=>getComputedStyle(e).borderTopColor),chips[1].border);
   await legend.first().focus();await page.keyboard.press('Enter');assert.equal(await legend.first().getAttribute('aria-pressed'),'true');assert.equal(await legend.first().evaluate(e=>getComputedStyle(e).borderTopColor),firstColor);
   assert.equal(await page.locator('.log-card').evaluate(e=>e.open),false);assert.equal(await page.locator('#log-body').isVisible(),false);
   await page.screenshot({path:path.join(output,'progress-compact-'+width+'.png'),animations:'disabled'});
   const logHeading=page.locator('.log-card>summary');await logHeading.click();assert.equal(await page.locator('#log-body').isVisible(),true);
   await page.locator('.log-item>summary').first().click();
   const loggedWeight=page.getByLabel('Gewicht LyingLegCurl am 2026-09-30',{exact:true});await loggedWeight.fill('51');await loggedWeight.press('Tab');
   assert.equal(await page.evaluate(()=>window.__test("findSession('total','2026-09-30').entries['tb-lying-leg-curl'].w")),51);
   await logHeading.click();assert.equal(await page.locator('#log-body').isVisible(),false);await page.evaluate(()=>window.__test('renderLog()'));
   await logHeading.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#log-body').isVisible(),true);assert.equal(await loggedWeight.inputValue(),'51');
   await page.screenshot({path:path.join(output,'progress-log-open-'+width+'.png'),animations:'disabled'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await logHeading.click();await page.evaluate(()=>window.__test('sessions=[];saveSessions();renderProgress();renderLog()'));assert.equal(await page.locator('#log-body').isVisible(),false);
   await logHeading.click();assert.equal(await page.locator('#log-body .empty-note').isVisible(),true);await logHeading.click();
   if(width===412){
    await page.locator('#tab-total').click();
    await page.locator('#save-total').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'minmax-save.png'),animations:'disabled'});
    await page.locator('#color-btn').click();await page.screenshot({path:path.join(output,'minmax-colors.png'),animations:'disabled'});await page.locator('#color-close').click();
    await page.locator('#tab-progress').click();await page.screenshot({path:path.join(output,'minmax-progress.png'),animations:'disabled'});
   }
   assert.deepEqual(errors,[]);console.log('PASS: real browser '+width+'px, training/title/touch targets; compact chart/colored legend toggles; log disclosure by touch/keyboard, edit survives collapse and refresh, empty log; screenshots');await context.close();
  }
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
