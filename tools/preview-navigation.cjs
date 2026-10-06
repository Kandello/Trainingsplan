// Full page lifecycle and browser history, with isolated sample data and no cloud.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('Sync.init();',"Sync.state.status='ready';renderChip();").replace(/\}\)\(\);\s*<\/script>/,'window.__test=e=>eval(e);})();\n</script>');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname,f=path.resolve(root,'.'+name);
 if(name==='/'||name==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.jpg')?'image/jpeg':name.endsWith('.webp')?'image/webp':name.endsWith('.svg')?'image/svg+xml':'application/json');res.end(fs.readFileSync(f));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{for(const width of [360,412,1280]){
  const c=await b.newContext({viewport:{width,height:915},deviceScaleFactor:2,serviceWorkers:width===412?'allow':'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{if(!localStorage.getItem('test.navigation.seed')){
   localStorage.setItem('test.navigation.seed','1');localStorage.setItem('trainingsplan.v1.ui',JSON.stringify({minMaxPlanEnabled:true}));
   localStorage.setItem('trainingsplan.v1.sessions',JSON.stringify([{dayId:'total',date:'2026-09-30',entries:{'tb-lying-leg-curl':{w:50,t:'hold'}}},{dayId:'arms',date:'2026-10-03',entries:{'ad-db-curl':{w:20,t:'up'}}}]));
  }});
  await p.goto('http://127.0.0.1:'+server.address().port);assert.equal(await p.locator('.tabbar').isVisible(),false);
  await p.locator('.overview-progress').click();assert.equal(await p.locator('.view.is-active').getAttribute('data-view'),'progress');
  const chrome=async()=>{const m=await p.evaluate(()=>{const nav=document.querySelector('.tabbar'),r=nav.getBoundingClientRect();return {carbon:document.body.classList.contains('has-carbon'),overflow:document.documentElement.scrollWidth>innerWidth+1,left:r.left,right:innerWidth-r.right,bottom:innerHeight-r.bottom,round:parseFloat(getComputedStyle(nav).borderRadius),small:[...document.querySelectorAll('.tabbar button')].some(e=>{const q=e.getBoundingClientRect();return q.width<43.9||q.height<43.9;})};});assert.equal(m.carbon,true);assert.equal(m.overflow,false);assert.equal(m.left,6);assert.equal(m.right,6);assert.equal(m.bottom,6);assert.ok(m.round>=16);assert.equal(m.small,false);};
  await chrome();await p.screenshot({path:path.join(root,'artifacts','carbon-progress-'+width+'.png'),animations:'disabled'});await p.goBack();await p.waitForFunction(()=>window.__test('ui.tab')==='overview');assert.equal(await p.locator('.tabbar').isVisible(),false);
  for(const id of ['total','upper','lower','arms']){await p.locator('[data-overview-day="'+id+'"]').click();await chrome();assert.equal(await p.locator('.view.is-active').getAttribute('data-view'),id);await p.goBack();await p.waitForFunction(()=>window.__test('ui.tab')==='overview');}
  await p.locator('[data-overview-day="upper"]').click();await p.locator('#tab-total').click();await p.goBack();await p.waitForFunction(()=>window.__test('ui.tab')==='overview');
  await p.locator('[data-overview-day="total"]').click();await p.locator('#color-btn').click();await p.goBack();await p.waitForFunction(()=>!document.querySelector('#color-dialog').open);assert.equal(await p.evaluate(()=>window.__test('ui.tab')),'total');
  const input=p.locator('[data-ex="tb-lying-leg-curl"] input');await input.fill('52');await p.locator('[data-ex="tb-lying-leg-curl"] .ex-check').click();await p.screenshot({path:path.join(root,'artifacts','carbon-training-'+width+'.png'),animations:'disabled'});
  await p.evaluate(()=>{scrollTo(0,480);dispatchEvent(new PageTransitionEvent('pagehide'));});
  if(width===412){await p.waitForFunction(()=>navigator.serviceWorker.controller);await c.setOffline(true);}
  await p.reload();assert.equal(await p.locator('.view.is-active').getAttribute('data-view'),'total');assert.equal(await input.inputValue(),'52');assert.equal(await p.locator('[data-ex="tb-lying-leg-curl"] .ex-check').getAttribute('aria-pressed'),'true');
  await p.waitForFunction(()=>scrollY>=450);await chrome();await p.goBack();await p.waitForFunction(()=>window.__test('ui.tab')==='overview');assert.equal(await p.locator('.tabbar').isVisible(),false);
  await p.locator('[data-overview-day="total"]').click();await p.locator('#save-total').click();assert.equal(await p.evaluate(()=>window.__test('ui.activeTraining')),null);await p.reload();assert.equal(await p.locator('.view.is-active').getAttribute('data-view'),'overview');assert.equal(await p.locator('.tabbar').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS: '+width+'px carbon on all days/progress, hidden home bar, rounded navigation, real Back incl. dialog, draft/confirmation/scroll resume'+(width===412?' offline':'')+', saved workout returns home on restart');await c.close();
 }}finally{await b.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
