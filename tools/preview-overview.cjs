// Isolated example records. No Firebase calls or production user data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('Sync.init();',"Sync.state.status='ready';renderChip();").replace(/\}\)\(\);\s*<\/script>/,'window.__test=e=>eval(e);})();\n</script>');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+name);
 if(name==='/'||name==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.jpg')?'image/jpeg':name.endsWith('.webp')?'image/webp':name.endsWith('.svg')?'image/svg+xml':'application/json');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{for(const width of [360,412,1280]){
  const context=await browser.newContext({viewport:{width,height:915},deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   localStorage.setItem('trainingsplan.v1.ui',JSON.stringify({minMaxPlanEnabled:true,tab:'arms'}));
   localStorage.setItem('trainingsplan.v1.sessions',JSON.stringify([{dayId:'total',date:'2026-09-30',entries:{'tb-lying-leg-curl':{w:50,t:'hold'}}},{dayId:'arms',date:'2026-10-03',entries:{'ad-preacher-curl':{w:20,t:'hold'}}}]));
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  assert.equal(await page.locator('.view.is-active').getAttribute('data-view'),'overview');assert.equal(await page.locator('.day-tile').count(),4);assert.equal(await page.locator('.day-tile time').count(),2);
  const image=await page.evaluate(()=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>resolve(null);img.src='assets/carbon.jpg';}));assert.equal(image.width,610);
  const check=async()=>{const m=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,small:[...document.querySelectorAll('.day-tile,.tabbar button,.app-header button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<43.9||r.height<43.9);}).map(e=>e.textContent),clipped:[...document.querySelectorAll('.day-tile-name,.tabbar button span')].some(e=>e.scrollWidth>e.clientWidth+1),overlaps:[...document.querySelectorAll('.day-tile')].some(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('strong').getBoundingClientRect();return b.left<a.left||b.right>a.right;})}));assert.equal(m.overflow,false);assert.deepEqual(m.small,[]);assert.equal(m.clipped,false);assert.equal(m.overlaps,false);};
  await check();await page.screenshot({path:path.join(root,'artifacts','overview-'+width+'.png'),animations:'disabled'});
  await page.locator('[data-overview-day="arms"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.view.is-active').getAttribute('data-view'),'arms');assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('is-overview')),false);
  await page.getByRole('tab',{name:'Übersicht',exact:true}).click();assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('is-overview')),true);
  await page.evaluate(()=>window.__test("userPlans=[{id:'long',name:'Ein Plan mit fünf Tagen',days:Array.from({length:5},(_,i)=>({id:'long-'+i,name:i?'Tag '+(i+1):'Brust, Schultern und Trizeps — ein langer Trainingstag',base:[]}))}];rebuildPlanRegistry();switchPlan('long')"));
  assert.equal(await page.locator('.day-tile').count(),5);await check();assert.equal(await page.locator('.day-tile time').count(),0);
  await page.screenshot({path:path.join(root,'artifacts','overview-long-'+width+'.png'),animations:'disabled'});
  assert.deepEqual(errors,[]);console.log('PASS: overview '+width+'px, blue photo, full titles, dates, keyboard, 44px targets and five-day layout');await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
