// Fresh profiles and mocked sync; compare layout with the finish disabled.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const prepare=raw=>raw.replace('Sync.init();',"Sync.state.status='ready';renderChip();").replace(/\}\)\(\);\s*<\/script>/,'window.__test=e=>eval(e);})();\n</script>');
const current=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Remove only the finish block so this comparison remains useful after release.
const baseline=current.replace(/<style>\s*\/\* Edle Oberflächen:[\s\S]*?<\/style>/,'');
const pages={'/':prepare(current),'/baseline':prepare(baseline)};
const server=http.createServer((req,res)=>{const n=new URL(req.url,'http://localhost').pathname,f=path.resolve(root,'.'+n);if(pages[n]){res.setHeader('Content-Type','text/html');res.end(pages[n]);return;}if(!f.startsWith(root+path.sep)||n==='/sw.js'||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',n.endsWith('.js')?'text/javascript':n.endsWith('.jpg')?'image/jpeg':n.endsWith('.webp')?'image/webp':n.endsWith('.svg')?'image/svg+xml':'application/json');res.end(fs.readFileSync(f));});
const looks=[{id:'standard',theme:{}},{id:'salbei',theme:{bg:'#e7eee5',box:'#f5f8f2'}},{id:'personal',theme:{bg:'#e8f1fb',box:'#fff1de'}}];
const fixture=look=>({theme:look.theme,sessions:['2026-09-11','2026-09-16','2026-09-30'].map((date,i)=>({date,dayId:'total',entries:{'tb-lying-leg-curl':{w:[55,55,50][i],t:'hold'},'tb-any-squat':{w:[13.75,15,12.5][i],t:'down'}}})),drafts:{'tb-lying-leg-curl':{w:'50'},'tb-any-squat':{w:'12,5',sug:true}}});
async function visit(browser,url,width,look,styled){
 const c=await browser.newContext({viewport:{width,height:915},deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'}),p=await c.newPage(),errors=[],geometry={};p.on('pageerror',e=>errors.push(e.message));
 await c.addInitScript(data=>{localStorage.setItem('trainingsplan.v1.ui',JSON.stringify({minMaxPlanEnabled:true}));for(const key of ['sessions','drafts','theme'])localStorage.setItem('trainingsplan.v1.'+key,JSON.stringify(data[key]));},fixture(look));
 const measure=async(name,selectors)=>{
  await p.evaluate(()=>scrollTo(0,0));
  geometry[name]=await p.evaluate(list=>list.flatMap(sel=>[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height;}).map(e=>{const r=e.getBoundingClientRect();return {sel,w:r.width,h:r.height,x:r.x,y:r.y};})),selectors);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name);
  if(styled)await p.screenshot({path:path.join(root,'artifacts','surfaces-'+look.id+'-'+name+'-'+width+'.png'),animations:'disabled'});
 };
 const finish=async(selector)=>{if(styled)assert.ok((await p.locator(selector).first().evaluate(e=>getComputedStyle(e).backgroundImage)).includes('linear-gradient'),selector);};
 const box=async selector=>{if(styled){const color=look.theme.box||'#f0f5f9';const actual=await p.locator(selector).first().evaluate(e=>{const s=getComputedStyle(e);return {base:s.backgroundColor,image:s.backgroundImage,opacity:s.opacity};});const rgb=color.match(/\w\w/g).map(x=>parseInt(x,16));assert.equal(actual.base,'rgb('+rgb.join(', ')+')');assert.ok(actual.image.includes('145deg'));assert.equal(actual.opacity,'1');}};
 try{
  await p.goto(url);await measure('overview',['.day-tile','.app-header button']);await box('.day-tile');assert.equal(await p.locator('.tabbar').isVisible(),false);
  await p.locator('[data-overview-day="total"]').click();await measure('training',['#panel-total .ex','#panel-total .wfield','#panel-total .spec-chip','#panel-total .btn-primary','.tabbar']);await box('#panel-total .ex');
  if(styled){assert.equal(await p.locator('#panel-total .wfield').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');assert.equal(await p.locator('.ex-check').first().getAttribute('aria-pressed'),'true');}
  await p.locator('#panel-total .spec-chip').first().click();await measure('prescription',['#spec-dialog','#spec-dialog input']);await finish('#spec-dialog');await p.keyboard.press('Escape');
  await p.locator('#panel-total .ex-swap').first().click();await measure('swap',['#swap-dialog','#swap-dialog button','#swap-dialog input']);await finish('#swap-dialog');await p.locator('#swap-cancel').click();
  await p.evaluate(()=>window.__test("drafts={};saveDrafts();refreshFromData()"));assert.equal(await p.locator('#save-total').isDisabled(),true);assert.equal(await p.locator('#confirmall-total').isDisabled(),true);
  for(const sel of ['#save-total','#confirmall-total']){const css=await p.locator(sel).evaluate(e=>{const s=getComputedStyle(e);return {opacity:s.opacity,color:s.backgroundColor};});assert.equal(css.opacity,'1');assert.ok(css.color.startsWith('rgb('));}
  await p.locator('#tab-progress').click();await measure('progress',['.progress-card','#chart-wrap','#legend button','.log-card','.picker select','.data-tools button','.tabbar']);await finish('.progress-card');
  if(styled){assert.equal(await p.locator('#chart-wrap').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');assert.ok(await p.locator('.picker select').evaluate(e=>getComputedStyle(e).backgroundImage.includes('data:image/svg+xml')));}
  await p.locator('.log-card>summary').click();await measure('log-open',['.log-card','.log-item>summary']);await p.locator('.log-card>summary').click();
  await p.locator('#color-btn').click();await measure('colors',['#color-dialog','#color-dialog button']);await finish('#color-dialog');await finish('.look-preview-card');
  await p.locator('#color-mode-custom').click();await p.locator('#color-target-box').click();await measure('color-custom',['#color-dialog','.color-candidate','#color-hex']);
  assert.equal((await p.locator('#color-hex').inputValue()).toLowerCase(),look.theme.box||'#f0f5f9');
  assert.equal(await p.locator('.color-candidate').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
  await p.locator('#color-close').click();await p.locator('#sync-chip').click();await measure('sync',['#sync-dialog','#sync-dialog button']);await finish('#sync-dialog');await p.locator('#sync-close').click();
  await p.locator('.plan-btn-new').click();await measure('studio-home',['#studio-dialog','.studio-choice','.studio-home-hero']);await finish('.studio-choice');
  await p.getByRole('button',{name:'Vorlage wählen'}).click();await p.locator('.studio-template-toggle').first().click();await measure('templates',['.studio-template','.studio-chip']);
  assert.equal(await p.locator('.studio-template.is-open').evaluate(e=>getComputedStyle(e).borderTopWidth),'2px');
  await p.getByRole('button',{name:'Vorlage bearbeiten',exact:true}).click();await p.getByRole('button',{name:'Selbst füllen'}).click();await measure('editor',['.studio-editor-row','.studio-input','.studio-secondary']);
  await p.getByRole('button',{name:'Übung wählen',exact:true}).first().click();await p.getByLabel('Übung suchen',{exact:true}).fill('brustpresse');await measure('library',['.studio-result','.studio-select','.studio-thumb']);await finish('.studio-result');
  await p.getByRole('button',{name:'Information zu Brustpresse',exact:true}).click();await measure('info',['.studio-info-card','.studio-info-image']);await finish('.studio-info-card:not(.cues)');
  await p.locator('#studio-close').click();await p.evaluate(()=>window.__test('openNewPlan(true)'));await p.getByRole('button',{name:'Entwurf verwerfen',exact:true}).click();await measure('confirm',['#confirm-dialog','#confirm-dialog button']);await p.locator('#confirm-yes').click();
  await p.getByRole('button',{name:'Plan empfehlen'}).click();await p.getByRole('button',{name:'Weiter',exact:true}).click();await measure('interview',['.studio-choice','.studio-input']);
  assert.equal(await p.locator('.studio-choice.is-selected').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(23, 43, 68)');
  assert.deepEqual(await p.evaluate(()=>JSON.parse(JSON.stringify(window.__test('theme')))),look.theme,'Finishes must not rewrite colors');
  if(styled){await p.evaluate(()=>{const sheet=[...document.styleSheets].find(s=>s.ownerNode.textContent.includes('/* Edle Oberflächen:'));for(let i=sheet.cssRules.length-1;i>=0;i--)if(sheet.cssRules[i].cssText.startsWith('@supports'))sheet.deleteRule(i);});await box('.day-tile');}
  assert.deepEqual(errors,[]);
  return geometry;
 }finally{await c.close();}
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{const url='http://127.0.0.1:'+server.address().port;
 for(const width of [360,412,1280])for(const look of looks){const before=await visit(browser,url+'/baseline',width,look,false),after=await visit(browser,url,width,look,true);for(const [name,rows] of Object.entries(before)){assert.equal(after[name].length,rows.length,name);rows.forEach((r,i)=>{for(const k of ['w','h','x','y'])assert.ok(Math.abs(r[k]-after[name][i][k])<1,name+' '+r.sel+' '+k+' '+r[k]+' => '+after[name][i][k]);});}console.log('PASS: surfaces '+width+'px '+look.id+', all page layouts unchanged; gradients, white fields/chart, state borders, solid disabled buttons, exact personal colors; screenshots');}
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
