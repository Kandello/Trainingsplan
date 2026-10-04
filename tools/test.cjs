const {JSDOM}=require('jsdom');
const fs=require('fs'), assert=require('node:assert/strict'), vm=require('node:vm');
const raw=fs.readFileSync('index.html','utf8');
const script=raw.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const exercise='tb-lying-leg-curl', secondExercise='tb-any-squat';
const local=[{date:'2026-09-10',dayId:'total',entries:{[exercise]:{w:20,t:'down'},[secondExercise]:{w:10,t:'hold'}}}];
const remote=[{date:'2026-09-10',dayId:'total',entries:{[exercise]:{w:25,t:'up'}}}];
const sessionKey=s=>s.dayId+'_'+s.date;

async function run(options={}){
 const dom=new JSDOM(raw,{url:'https://kandello.github.io/Trainingsplan/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.CSS={escape:s=>s};
 const documents=new Map();
 (options.remote||[]).forEach(s=>documents.set('users/google-user/sessions/'+sessionKey(s),structuredClone(s)));
 const auth={currentUser:options.signedOut?null:{uid:'google-user',email:'test@example.com',isAnonymous:false}};
 let authCallback, listeners=[], failWrites=!!options.failWrites;
 const calls={initialized:0,reads:[],writes:[],popups:0,redirects:0};
 const snap=(values,metadata={fromCache:false,hasPendingWrites:false})=>({metadata,forEach:fn=>values.forEach(v=>fn({id:v.id,data:()=>v})),data:()=>values[0]});
 const values=path=>[...documents].filter(([k])=>k.startsWith(path+'/')).map(([,v])=>v);
 const emit=()=>listeners.forEach(l=>l.fn(l.path.endsWith('/sessions')?snap(values(l.path)):snap(documents.has(l.path)?[documents.get(l.path)]:[])));
 const F={
  getApps:()=>options.activeProject?[{}]:[],getApp:()=>({options:{projectId:options.activeProject}}),
  initializeApp:conf=>{calls.initialized++;assert.equal(conf.projectId,'minmax-workouttracker');return {options:conf};},
  initializeFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),
  getAuth:()=>auth,getRedirectResult:async()=>null,onAuthStateChanged:(a,fn)=>{authCallback=fn;fn(auth.currentUser);},
  collection:(db,...p)=>p.join('/'),doc:(db,...p)=>p.join('/'),serverTimestamp:()=>123,deleteField:()=>({delete:true}),
  getDocsFromServer:async path=>{calls.reads.push(path);assert.match(path,/^users\/google-user\//);return snap(values(path));},
  getDocFromServer:async path=>{calls.reads.push(path);return snap(documents.has(path)?[documents.get(path)]:[]);},
  setDoc:async(path,v,opts)=>{
    if(failWrites) throw {code:'permission-denied'};
    calls.writes.push(path);
    const prev=documents.get(path);
    documents.set(path,opts?.merge&&prev?{...prev,...v,entries:{...prev.entries,...v.entries}}:structuredClone(v));
    const saved=documents.get(path);
    Object.keys(saved.entries||{}).forEach(id=>{if(saved.entries[id].delete)delete saved.entries[id];});
    emit();
  },
  deleteDoc:async path=>{if(failWrites) throw {code:'permission-denied'};calls.writes.push(path);documents.delete(path);emit();},
  onSnapshot:(path,opts,fn)=>{if(typeof opts==='function')fn=opts;const l={path,fn};listeners.push(l);queueMicrotask(()=>fn(path.endsWith('/sessions')?snap(values(path)):snap(documents.has(path)?[documents.get(path)]:[])));return ()=>{listeners=listeners.filter(x=>x!==l);};},
  GoogleAuthProvider:class{},
  signInWithPopup:async()=>{calls.popups++;if(options.popupError)throw {code:options.popupError};auth.currentUser={uid:'google-user',email:'test@example.com',isAnonymous:false};authCallback(auth.currentUser);},
  signInWithRedirect:async()=>{calls.redirects++;},
  signOut:async()=>{auth.currentUser=null;authCallback(null);}
 };
 w.MockFirebase=F;
 if(options.local)w.localStorage.setItem('trainingsplan.v1.sessions',JSON.stringify(options.local));
 if(options.outbox)w.localStorage.setItem('trainingsplan.v2.outbox',JSON.stringify(options.outbox));
 if(options.config)w.localStorage.setItem('trainingsplan.v1.firebaseConfig',JSON.stringify(options.config));
 if(options.plans)w.localStorage.setItem('trainingsplan.v1.plans',JSON.stringify(options.plans));
 if(options.theme)w.localStorage.setItem('trainingsplan.v1.theme',JSON.stringify(options.theme));
 if(options.colors)w.localStorage.setItem('trainingsplan.v1.colors',JSON.stringify(options.colors));
 w.eval(fs.readFileSync('firebase-config.js','utf8'));
 w.eval(script.replace('await import(SDK_URL)','await Promise.resolve(window.MockFirebase)').replace(/\}\)\(\);\s*$/, 'window.testEval = expression => eval(expression);\n})();'));
 const settle=async()=>{for(let i=0;i<10;i++)await new Promise(resolve=>setTimeout(resolve,0));};
 await settle();
 return {w,dom,calls,get:expr=>w.testEval(expr),documents,settle,setFailure:v=>{failWrites=v;},emitCache:()=>listeners.filter(l=>l.path.endsWith('/sessions')).forEach(l=>l.fn(snap([],{fromCache:true,hasPendingWrites:false})))};
}
(async()=>{
 const a=await run({local,remote});
 assert.equal(a.get('Sync.state.status'),'ready');
 assert.equal(a.get('Sync.state.project'),'minmax-workouttracker');
 assert.equal(a.get(`sessions[0].entries['${exercise}'].w`),25);
 assert.equal(a.get(`sessions[0].entries['${secondExercise}'].w`),10);
 assert.equal(a.get('sessions.length'),1);assert.equal(a.get('PLANS.length'),1);
 assert.deepEqual(Array.from(a.get('DAYS.map(d=>d.id)')),['total','upper','lower','arms']);
 assert.equal(a.w.document.querySelector(`[data-trend-ex="${exercise}"]`).textContent,'▲');
 const recovery=JSON.parse(a.w.localStorage.getItem('trainingsplan.v2.recovery'));
 assert.equal(recovery.sessions[0].entries[exercise].w,20);
 a.emitCache();assert.equal(a.get('sessions.length'),1);assert.equal(a.get('Sync.state.status'),'pending');
 a.get('Sync.retry()');await a.settle();assert.equal(a.get('Sync.state.status'),'ready');
 a.setFailure(true);
 a.get(`sessions[0].entries['${exercise}']={w:27,t:'hold'};saveSessions();Sync.push(sessions[0])`);await a.settle();
 assert.equal(a.get('Sync.state.status'),'error');assert.ok(Object.keys(JSON.parse(a.w.localStorage.getItem('trainingsplan.v2.outbox'))).length);
 a.setFailure(false);a.get('Sync.retry()');await a.settle();
 assert.equal(a.get('Sync.state.status'),'ready');assert.equal(a.get(`sessions[0].entries['${exercise}'].w`),27);
 assert.equal(a.w.document.querySelector(`[data-trend-ex="${exercise}"]`).textContent,'●');
 a.setFailure(true);a.get('var saved=sessions[0];sessions=[];saveSessions();Sync.removeSession(saved)');await a.settle();
 assert.equal(a.get('Sync.state.status'),'error');
 a.setFailure(false);a.get('Sync.retry()');await a.settle();assert.equal(a.get('sessions.length'),0);
 a.get('Sync.retry()');await a.settle();assert.equal(a.get('sessions.length'),0);
 a.dom.window.close();

 const pending={'google-user:total_2026-09-10':{operation:'entryDeletes',owner:'google-user',id:'total_2026-09-10',data:{session:local[0],exIds:[exercise]},token:'test'}};
 const b=await run({local,remote,outbox:pending});
 assert.equal(b.get(`sessions[0].entries['${exercise}']`),undefined);
 assert.equal(b.get(`sessions[0].entries['${secondExercise}'].w`),10);
 assert.equal(b.get('Sync.state.status'),'ready');b.dom.window.close();

 const wrongConfig={apiKey:'test',projectId:'other-project'};
 const c=await run({local,config:wrongConfig});
 assert.equal(c.get('Sync.state.status'),'error');assert.equal(c.calls.initialized,0);
 assert.equal(c.calls.reads.length,0);assert.equal(c.calls.writes.length,0);
 assert.equal(c.get('sessions.length'),1);c.get('renderDialog()');
 assert.match(c.w.document.getElementById('sync-dlg-body').textContent,/Konfiguration zurücksetzen/);
 assert.match(c.get(`Sync.saveConfig('${JSON.stringify(wrongConfig)}')`),/minmax-workouttracker/);c.dom.window.close();
 const d=await run({activeProject:'other-project'});
 assert.equal(d.get('Sync.state.status'),'error');assert.equal(d.calls.reads.length,0);assert.equal(d.calls.writes.length,0);d.dom.window.close();

 const custom={id:'custom',name:'Eigener Plan',days:[{id:'custom-day',name:'Training',base:[]}]};
 const e=await run({plans:[custom],signedOut:true});
 assert.equal(e.get('PLANS.length'),2);assert.equal(e.get('Sync.state.status'),'signed-out');
 await e.get('Sync.signIn()');await e.settle();assert.equal(e.calls.popups,1);assert.equal(e.get('Sync.state.status'),'ready');e.dom.window.close();
 const f=await run({signedOut:true,popupError:'auth/popup-blocked'});
 await f.get('Sync.signIn()');assert.equal(f.calls.redirects,1);f.dom.window.close();
 const g=await run({signedOut:true,popupError:'auth/popup-closed-by-user'});
 await g.get('Sync.signIn()');assert.equal(g.calls.redirects,0);assert.equal(g.get('Sync.state.status'),'error');g.dom.window.close();

 const colors=await run({signedOut:true,theme:{bg:'#f9f9f7',box:'#fcfcfb'}});
 const doc=colors.w.document;
 const click=id=>{assert.ok(doc.getElementById(id),id);doc.getElementById(id).click();};
 const input=(id,value)=>{const el=doc.getElementById(id);el.value=value;el.dispatchEvent(new colors.w.Event('input',{bubbles:true}));};
 const selectedTheme=()=>JSON.parse(colors.w.localStorage.getItem('trainingsplan.v1.theme'));
 click('color-btn');assert.ok(doc.getElementById('color-dialog').hasAttribute('open'));
 assert.equal(doc.querySelectorAll('input[type="color"]').length,1);
 assert.equal(doc.documentElement.dataset.background,'carbon');
 assert.equal(doc.documentElement.style.getPropertyValue('--carbon-color'),'#15283e');
 click('color-set-1');assert.deepEqual(selectedTheme(),{bg:'#e7eee5',box:'#f5f8f2'});
 assert.equal(doc.documentElement.style.getPropertyValue('--plane'),'#e7eee5');
 click('color-save-look');assert.equal(colors.get('colorLibrary.favorites.length'),1);
 click('color-set-3');click('color-favorite-0');
 assert.deepEqual(selectedTheme(),{bg:'#e7eee5',box:'#f5f8f2'});
 click('color-mode-custom');
 input('color-hex','#E8F1FB');
 assert.equal(selectedTheme().bg,'#e7eee5','Typing must only update the draft');
 assert.equal(doc.getElementById('color-draft-preview').style.getPropertyValue('--look-bg'),'#e8f1fb');
 click('color-apply');assert.equal(selectedTheme().bg,'#e8f1fb','Exact hex must survive the HSL display');
 assert.equal(colors.get('colorLibrary.recent[0]'),'#e8f1fb');
 input('color-hex','#zzzzzz');assert.equal(doc.getElementById('color-apply').disabled,true);
 click('color-apply');assert.equal(selectedTheme().bg,'#e8f1fb');
 input('color-hex','DEF');click('color-apply');assert.equal(selectedTheme().bg,'#ddeeff');
 input('color-h-number','121');input('color-s-number','40');input('color-l-number','92');
 assert.equal(doc.getElementById('color-h').value,'121');
 assert.equal(doc.getElementById('color-s').value,'40');
 assert.equal(doc.getElementById('color-l').value,'92');
 const controlled=doc.getElementById('color-hex').value.toLowerCase();
 click('color-apply');assert.equal(selectedTheme().bg,controlled);
 input('color-l-number','101');assert.equal(doc.getElementById('color-apply').disabled,true);
 input('color-hex','#000000');
 const light=colors.get('ensureLight("#000000",0.75)');
 assert.match(doc.getElementById('color-feedback').textContent,new RegExp(light.toUpperCase()));
 assert.equal(doc.getElementById('color-apply').textContent,'Aufgehellte Farbe übernehmen');
 assert.equal(doc.getElementById('color-draft-preview').style.getPropertyValue('--look-bg'),light);
 click('color-apply');assert.equal(selectedTheme().bg,light,'Visible light variant must equal applied hex');
 click('color-target-box');input('color-hex','#FFF1DE');click('color-apply');
 assert.equal(selectedTheme().box,'#fff1de');assert.equal(selectedTheme().bg,light);
 const recent=colors.get('colorLibrary.recent[1]');click('color-recent-1');
 assert.equal(selectedTheme().box,recent);assert.equal(colors.get('colorLibrary.recent[0]'),recent);
 for(let i=0;i<15;i++){input('color-hex','#f0'+(240+i).toString(16)+'fa');click('color-apply');}
 const storedColors=JSON.parse(colors.w.localStorage.getItem('trainingsplan.v1.colors'));
 assert.equal(storedColors.recent.length,12);assert.equal(new Set(storedColors.recent).size,12);
 click('color-reset');assert.equal(doc.documentElement.style.getPropertyValue('--plane'),'');
 assert.equal(doc.documentElement.style.getPropertyValue('--ex-bg'),'');
 assert.equal(colors.get('colorLibrary.favorites.length'),1);assert.equal(colors.get('colorLibrary.recent.length'),12);
 assert.equal(colors.calls.writes.length,0,'Local color choices must not write training/cloud data');
 colors.dom.window.close();
 const reloaded=await run({signedOut:true,colors:storedColors});
 reloaded.get('renderColorDialog()');reloaded.w.document.getElementById('color-favorite-0').click();
 assert.equal(reloaded.get('theme.bg'),'#e7eee5');assert.equal(reloaded.get('theme.box'),'#f5f8f2');
 assert.equal(reloaded.get('colorLibrary.recent.length'),12);
 reloaded.w.document.getElementById('color-save-look').click();assert.equal(reloaded.get('colorLibrary.favorites.length'),0);
 reloaded.dom.window.close();
 assert.equal(colors.get('normalizeHex("#12345678")'),null);
 assert.equal(colors.get('hslToHex({h:360,s:100,l:50})'),'#ff0000');
 console.log('PASS: color sets, favorites/reload, exact hex, HSL controls, invalid values, explicit lightening, recent colors, reset and local isolation');
 console.log('PASS: MinMax plan/configuration, project isolation, cloud/local merge, backup, trend icons, cache protection, failed writes/retry, deletions, custom plans and Google login');
})().catch(e=>{console.error(e);process.exitCode=1;});
