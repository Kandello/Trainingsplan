// A returning account with delayed authentication/server replies; no cloud access.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
function mockFirebase(){
 const user={uid:'qa-user',email:'test@example.test',isAnonymous:false},auth={currentUser:user},listeners=[];
 const records=[{date:'2026-09-30',dayId:'total',entries:{'tb-lying-leg-curl':{w:50,t:'hold'}}}];
 let plan={plans:[],spec:{},exercises:{},order:{},updatedAt:1},callback,events=0;
 const delay=()=>new Promise(r=>setTimeout(r,80));
 const snap=p=>({metadata:{fromCache:false,hasPendingWrites:false},data:()=>plan,forEach:fn=>records.forEach(v=>fn({data:()=>v}))});
 const deliver=l=>{events++;l.fn(snap(l.path));};
 return {
  get events(){return events;},emitPlan:v=>{plan=v;listeners.filter(l=>!l.path.endsWith('/sessions')).forEach(deliver);},
  repeatAuth:()=>callback(user),getApps:()=>[],initializeApp:options=>({options}),initializeFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),
  getAuth:()=>auth,getRedirectResult:async()=>null,onAuthStateChanged:(a,fn)=>{callback=fn;setTimeout(()=>fn(user),80);},
  collection:(db,...p)=>p.join('/'),doc:(db,...p)=>p.join('/'),serverTimestamp:()=>123,
  getDocsFromServer:async p=>{await delay();return snap(p);},getDocFromServer:async p=>{await delay();return snap(p);},
  setDoc:async(p,v)=>{assertPath(p);if(!p.endsWith('/sessions'))plan=v;listeners.forEach(deliver);},
  onSnapshot:(p,opts,fn)=>{const l={path:p,fn};listeners.push(l);queueMicrotask(()=>deliver(l));const timer=setTimeout(()=>{if(listeners.includes(l))deliver(l);},80);return ()=>{clearTimeout(timer);const i=listeners.indexOf(l);if(i>=0)listeners.splice(i,1);};}
 };
 function assertPath(p){if(!p.startsWith('users/qa-user/'))throw Error('Unexpected account path');}
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('(function(){','window.MockFirebase=('+mockFirebase.toString()+')();\n(function(){').replace('await import(SDK_URL)','await Promise.resolve(window.MockFirebase)').replace(/\}\)\(\);\s*<\/script>/,'window.__test=e=>eval(e);})();\n</script>');
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname,f=path.resolve(root,'.'+name);
 if(name==='/'||name==='/index.html'){res.setHeader('Content-Type','text/html');res.end(html);return;}
 if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.jpg')?'image/jpeg':name.endsWith('.webp')?'image/webp':'application/json');res.end(fs.readFileSync(f));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
  const c=await browser.newContext({viewport:{width:412,height:915},serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
   const prefix='trainingsplan.v3.accounts.minmax-workouttracker.';
   localStorage.setItem(prefix+'meta',JSON.stringify({version:1,active:'qa-user',legacyPending:false,declined:{}}));
   localStorage.setItem(prefix+'profile.qa-user',JSON.stringify({values:{'trainingsplan.v1.ui':{minMaxPlanEnabled:true},'trainingsplan.v1.sessions':[{date:'2026-09-30',dayId:'total',entries:{'tb-lying-leg-curl':{w:50,t:'hold'}}}],'trainingsplan.v1.drafts':{'tb-lying-leg-curl':{w:'51'}}}}));
   window.__mounts=0;window.__fades=0;window.__tileChanges=0;
   new MutationObserver(records=>records.forEach(record=>{
    for(const node of record.addedNodes){if(node.id==='panel-overview'){window.__mounts++;window.__firstTile=window.__firstTile||node.querySelector('.day-tile');}if(node.matches&&node.matches('.day-tile'))window.__tileChanges++;}
   })).observe(document,{childList:true,subtree:true});
   document.addEventListener('animationstart',e=>{if(e.target.id==='panel-overview')window.__fades++;});
  });
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>window.__test('Sync.state.status')==='ready'&&window.MockFirebase.events>=4);
  assert.deepEqual(await p.evaluate(()=>({mounts:window.__mounts,fades:window.__fades,tiles:window.__tileChanges,same:window.__firstTile===document.querySelector('.day-tile')})),{mounts:1,fades:0,tiles:4,same:true},'Authentication, reconciliation and duplicate listeners keep the original tiles');
  await p.locator('[data-overview-day="total"]').click();const input=p.locator('[data-ex="tb-lying-leg-curl"] input');await input.fill('52');await input.focus();
  await p.evaluate(()=>window.MockFirebase.repeatAuth());await p.waitForFunction(()=>window.__test('Sync.state.status')==='ready'&&window.MockFirebase.events>=8);
  assert.equal(await input.inputValue(),'52');assert.equal(await input.evaluate(e=>document.activeElement===e),true);assert.equal(await p.evaluate(()=>window.__mounts),1,'A repeated auth event preserves in-progress input and its DOM');
  await p.evaluate(()=>window.MockFirebase.emitPlan({order:{},exercises:{},spec:{},plans:[],templates:[{id:'tpl-focus',name:'Testvorlage',days:[{name:'Tag',exercises:[]}]}]}));
  assert.equal(await p.evaluate(()=>window.__test('userTemplates[0].name')),'Testvorlage');assert.equal(await input.inputValue(),'52');assert.equal(await input.evaluate(e=>document.activeElement===e),true);assert.equal(await p.evaluate(()=>window.__mounts),1,'Template-only sync must not rebuild the ongoing workout');
  await p.evaluate(()=>window.MockFirebase.emitPlan({order:{},exercises:{},spec:{'tb-lying-leg-curl':{sets:3}},plans:[],updatedAt:99}));
  assert.equal(await p.evaluate(()=>window.__test("exSpec['tb-lying-leg-curl'].sets")),3);assert.equal(await p.evaluate(()=>window.__mounts),2,'A real remote plan change is still applied');
  await p.evaluate(()=>window.MockFirebase.emitPlan({updatedAt:100,plans:[],spec:{'tb-lying-leg-curl':{sets:3}},exercises:{},order:{}}));assert.equal(await p.evaluate(()=>window.__mounts),2,'Property order and timestamps alone do not restart the view');
  assert.deepEqual(errors,[]);await c.close();console.log('PASS: delayed startup keeps one overview mount, four original tiles, zero fade animations; repeated auth preserves focused drafts; real remote changes still apply');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
