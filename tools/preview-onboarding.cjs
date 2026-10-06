// Browser checks use isolated empty profiles; Firebase never contacts a server.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('Sync.init();',"Sync.state.status='signed-out';renderChip();").replace(/\}\)\(\);\s*<\/script>/,'window.__test=e=>eval(e);})();\n</script>');
const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://localhost').pathname,f=path.resolve(root,'.'+n);if(n==='/'||n==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',n.endsWith('.js')?'text/javascript':n.endsWith('.webp')?'image/webp':'image/svg+xml');res.end(fs.readFileSync(f));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{for(const width of [360,412,1280]){
  const context=await browser.newContext({viewport:{width,height:915},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
  assert.equal(await page.locator('#studio-dialog').evaluate(d=>d.open),true);assert.equal(await page.locator('#sync-dialog').evaluate(d=>d.open),false);
  const check=async()=>{const metrics=await page.locator('#studio-dialog').evaluate(d=>({overflow:d.scrollWidth>d.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,small:[...d.querySelectorAll('button,input')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.width<43.9||r.height<43.9);}).map(e=>e.textContent)}));assert.equal(metrics.overflow,false);assert.equal(metrics.pageOverflow,false);assert.deepEqual(metrics.small,[]);};
  await check();await page.screenshot({path:path.join(root,'artifacts','onboarding-home-'+width+'.png')});
  await page.getByRole('button',{name:'Vorlage wählen'}).click();await page.getByLabel('Vorlage suchen',{exact:true}).fill('roman');
  const toggle=page.getByRole('button',{name:'Romans MinMax-Plan 4 Tage',exact:true});await toggle.click();await check();
  await page.screenshot({path:path.join(root,'artifacts','onboarding-roman-'+width+'.png')});
  await page.getByRole('button',{name:'Vorlage bearbeiten',exact:true}).click();await page.getByRole('button',{name:'Mit Standardübungen'}).click();
  await check();assert.equal(await page.locator('.studio-editor-row').count(),7);
  await page.getByRole('button',{name:'Plan speichern',exact:true}).click();
  assert.equal(await page.locator('.ex').count(),25);assert.equal(await page.evaluate(()=>window.__test('PLANS.length')),1);
  assert.equal(await page.evaluate(()=>window.__test('sessions.length')),0);assert.equal(await page.locator('#studio-dialog').evaluate(d=>d.open),false);
  await page.reload();assert.equal(await page.locator('#studio-dialog').evaluate(d=>d.open),false);assert.equal(await page.locator('#sync-dialog').evaluate(d=>d.open),false);
  assert.deepEqual(errors,[]);console.log('PASS: builder-first/Roman accordion/editor/save/reload '+width+'px; no overlaps, 44px actions and no sync modal');await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
