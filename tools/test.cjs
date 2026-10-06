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
 if(options.remotePlan)documents.set('users/google-user/state/plan',structuredClone(options.remotePlan));
 (options.remote||[]).forEach(s=>documents.set('users/google-user/sessions/'+sessionKey(s),structuredClone(s)));
 const auth={currentUser:options.signedOut?null:{uid:options.uid||'google-user',email:'test@example.com',isAnonymous:false}};
 let authCallback, listeners=[], failWrites=!!options.failWrites,failSignOut=false,delayReads=!!options.delayReads,delayWrites=false;
 const delayedReads=[],delayedWrites=[];
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
  getDocsFromServer:async path=>{calls.reads.push(path);assert.equal(path.split('/')[1],auth.currentUser.uid);const result=snap(values(path));if(delayReads)await new Promise(r=>delayedReads.push(r));return result;},
  getDocFromServer:async path=>{calls.reads.push(path);return snap(documents.has(path)?[documents.get(path)]:[]);},
  setDoc:async(path,v,opts)=>{
    if(failWrites) throw {code:'permission-denied'};
    assert.equal(path.split('/')[1],auth.currentUser.uid);
    if(delayWrites)await new Promise(r=>delayedWrites.push(r));
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
  signOut:async()=>{if(failSignOut)throw {code:'auth/network-request-failed'};auth.currentUser=null;authCallback(null);}
 };
 w.MockFirebase=F;
 w.eval(fs.readFileSync('studio-data.js','utf8'));
 if(options.storage)Object.entries(options.storage).forEach(([k,v])=>w.localStorage.setItem(k,v));
 if(options.local)w.localStorage.setItem('trainingsplan.v1.sessions',JSON.stringify(options.local));
 if(options.outbox)w.localStorage.setItem('trainingsplan.v2.outbox',JSON.stringify(options.outbox));
 if(options.config)w.localStorage.setItem('trainingsplan.v1.firebaseConfig',JSON.stringify(options.config));
 if(options.plans)w.localStorage.setItem('trainingsplan.v1.plans',JSON.stringify(options.plans));
 if(options.theme)w.localStorage.setItem('trainingsplan.v1.theme',JSON.stringify(options.theme));
 if(options.colors)w.localStorage.setItem('trainingsplan.v1.colors',JSON.stringify(options.colors));
 if(options.drafts)w.localStorage.setItem('trainingsplan.v1.drafts',JSON.stringify(options.drafts));
 if(options.exercises)w.localStorage.setItem('trainingsplan.v1.customExercises',JSON.stringify(options.exercises));
 if(options.ui)w.localStorage.setItem('trainingsplan.v1.ui',JSON.stringify(options.ui));
 // Existing training/color fixtures use the original plan. New-install tests
 // explicitly opt out to exercise the builder-only start without this flag.
 if(options.includeMinMax!==false){const ui=JSON.parse(w.localStorage.getItem('trainingsplan.v1.ui')||'{}');ui.minMaxPlanEnabled=true;w.localStorage.setItem('trainingsplan.v1.ui',JSON.stringify(ui));}
 if(options.signedOut && !options.legacy){
   const prefix='trainingsplan.v3.accounts.minmax-workouttracker.',values={};
   Object.keys(w.localStorage).filter(k=>/^trainingsplan\.v[12]\./.test(k)&&!k.endsWith('firebaseConfig')).forEach(k=>values[k]=JSON.parse(w.localStorage.getItem(k)));
   if(!options.storage){w.localStorage.setItem(prefix+'meta',JSON.stringify({version:1,active:'guest',legacyPending:false,declined:{}}));w.localStorage.setItem(prefix+'profile.guest',JSON.stringify({values}));}
 }
 if(!options.missingConfig)w.eval(fs.readFileSync('firebase-config.js','utf8'));
 w.eval(script.replace('await import(SDK_URL)','await Promise.resolve(window.MockFirebase)').replace(/\}\)\(\);\s*$/, 'window.testEval = expression => eval(expression);\n})();'));
 const settle=async()=>{for(let i=0;i<10;i++)await new Promise(resolve=>setTimeout(resolve,0));};
 await settle();
 if(options.autoClaim!==false&&w.testEval('Sync.state.status')==='assignment'){w.testEval('Sync.assignLegacy(true)');await settle();}
 return {w,dom,calls,get:expr=>w.testEval(expr),documents,settle,changeAuth:async id=>{auth.currentUser=id?{uid:id,email:id+'@example.com',isAnonymous:false}:null;authCallback(auth.currentUser);await settle();},snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),setFailure:v=>{failWrites=v;},setSignOutFailure:v=>{failSignOut=v;},setDelayReads:v=>{delayReads=v;},releaseReads:()=>delayedReads.splice(0).forEach(r=>r()),setDelayWrites:v=>{delayWrites=v;},releaseWrites:()=>delayedWrites.splice(0).forEach(r=>r()),listeners:()=>listeners.slice(),snap,emitCache:()=>listeners.filter(l=>l.path.endsWith('/sessions')).forEach(l=>l.fn(snap([],{fromCache:true,hasPendingWrites:false})))};
}
if(require.main===module)(async()=>{
 const a=await run({local,remote});
 assert.equal(a.get('Sync.state.status'),'ready');
 assert.equal(a.get('Sync.state.project'),'minmax-workouttracker');
 assert.equal(a.get(`sessions[0].entries['${exercise}'].w`),25);
 assert.equal(a.get(`sessions[0].entries['${secondExercise}'].w`),10);
 assert.equal(a.get('sessions.length'),1);assert.equal(a.get('PLANS.length'),1);
 assert.deepEqual(Array.from(a.get('DAYS.map(d=>d.id)')),['total','upper','lower','arms']);
 assert.equal(a.w.document.querySelector(`[data-trend-ex="${exercise}"]`).textContent,'▲');
 const recovery=a.get('store.read(K_RECOVERY,null)');
 assert.equal(recovery.sessions[0].entries[exercise].w,20);
 a.emitCache();assert.equal(a.get('sessions.length'),1);assert.equal(a.get('Sync.state.status'),'pending');
 a.get('Sync.retry()');await a.settle();assert.equal(a.get('Sync.state.status'),'ready');
 a.setFailure(true);
 a.get(`sessions[0].entries['${exercise}']={w:27,t:'hold'};saveSessions();Sync.push(sessions[0])`);await a.settle();
 assert.equal(a.get('Sync.state.status'),'error');assert.ok(Object.keys(a.get('store.read("trainingsplan.v2.outbox",{})')).length);
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
 const selectedTheme=()=>JSON.parse(JSON.stringify(colors.get('store.read(K_THEME,{})')));
 click('color-btn');assert.ok(doc.getElementById('color-dialog').hasAttribute('open'));
 assert.equal(doc.querySelectorAll('input[type="color"]').length,0);
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
 const storedColors=JSON.parse(JSON.stringify(colors.get('store.read(K_COLORS,{})')));
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
 const overview=await run({signedOut:true});
 const summary=()=>overview.w.document.getElementById('summary-title-total').textContent;
 assert.equal(summary(),'0 von 7 bestätigt');
 const first=overview.w.document.querySelector(`[data-ex="${exercise}"]`);
 first.querySelector('input').value='50';first.querySelector('input').dispatchEvent(new overview.w.Event('input'));
 assert.equal(summary(),'0 von 7 bestätigt','Typed values are not confirmed');
 first.querySelector('.ex-check').click();assert.equal(summary(),'1 von 7 bestätigt');
 const second=overview.w.document.querySelector(`[data-ex="${secondExercise}"]`);
 second.querySelector('input').value='12,5';second.querySelector('input').dispatchEvent(new overview.w.Event('input'));
 overview.w.document.getElementById('confirmall-total').click();assert.equal(summary(),'2 von 7 bestätigt');
 overview.w.document.getElementById('save-total').click();assert.equal(summary(),'0 von 7 bestätigt');
 assert.equal(Object.keys(overview.get('sessions[0].entries')).length,2);overview.dom.window.close();
 const exercises={},base=[];
 for(let i=0;i<15;i++){const id='large-'+i;base.push(id);exercises[id]=i<13?{id,n:'Test '+i,dayId:'large-day',planId:'large',sets:2,rmin:6,rmax:8,p:''}:{id,empty:true,dayId:'large-day',planId:'large'};}
 const largePlan={id:'large',name:'Large',days:[{id:'large-day',name:'Test',base}]};
 const large=await run({signedOut:true,plans:[largePlan],exercises,ui:{activePlanId:'large'},drafts:{'large-0':{w:'20'}}});
 const largeProgress=large.w.document.getElementById('summary-progress-large-day');
 assert.equal(large.w.document.getElementById('summary-title-large-day').textContent,'1 von 13 bestätigt');
 assert.equal(largeProgress.classList.contains('is-continuous'),true);assert.equal(largeProgress.children.length,1);
 large.get('customEx=Object.fromEntries(Object.entries(customEx).map(([id,e])=>[id,{id,empty:true,dayId:e.dayId,planId:e.planId}]));rebuildPlanRegistry();rebuildAll()');
 assert.equal(large.w.document.getElementById('summary-title-large-day').textContent,'Noch keine Übungen');
 assert.equal(large.w.document.getElementById('summary-progress-large-day').hidden,true);large.dom.window.close();
 const studioRemote={order:{},spec:{},plans:[{id:'studio-cloud',name:'Cloud Studio',builder:{input:{days:1,years:0},templateId:'full'},days:[{id:'studio-cloud-day',name:'Ganzkörper',base:['studio-cloud-ex','studio-empty']}]}],exercises:{'studio-cloud-ex':{id:'studio-cloud-ex',n:'Brustpresse',catalogueId:'wger-129',dayId:'studio-cloud-day',planId:'studio-cloud',sets:2,rmin:8,rmax:12,p:''},'studio-empty':{id:'studio-empty',empty:true,targetMuscle:'back',dayId:'studio-cloud-day',planId:'studio-cloud'}}};
 const syncedStudio=await run({local,remotePlan:studioRemote});
 assert.equal(syncedStudio.get('userPlans[0].builder.templateId'),'full');assert.equal(syncedStudio.get('customEx["studio-cloud-ex"].catalogueId'),'wger-129');assert.equal(syncedStudio.get('customEx["studio-empty"].targetMuscle'),'back');
 syncedStudio.setFailure(true);syncedStudio.get('Sync.pushPlan()');await syncedStudio.settle();assert.equal(syncedStudio.get('Sync.state.status'),'error');syncedStudio.setFailure(false);syncedStudio.get('Sync.retry()');await syncedStudio.settle();assert.equal(syncedStudio.get('Sync.state.status'),'ready');
 const cloudState=syncedStudio.documents.get('users/google-user/state/plan');assert.equal(cloudState.plans[0].builder.templateId,'full');assert.equal(cloudState.exercises['studio-cloud-ex'].catalogueId,'wger-129');assert.equal(cloudState.exercises['studio-empty'].targetMuscle,'back');assert.equal(syncedStudio.get('sessions[0].entries["tb-lying-leg-curl"].w'),20);syncedStudio.dom.window.close();
 console.log('PASS: Studio metadata through cloud pull, failed push and retry; existing local sessions survive');
 console.log('PASS: live training summary, individual/all confirmations, save reset, empty slots, 13-exercise progress and empty days');
 console.log('PASS: color sets, favorites/reload, exact hex, HSL controls, invalid values, explicit lightening, recent colors, reset and local isolation');
 console.log('PASS: MinMax plan/configuration, project isolation, cloud/local merge, backup, trend icons, cache protection, failed writes/retry, deletions, custom plans and Google login');
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={run,local,remote,exercise,secondExercise};
