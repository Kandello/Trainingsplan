// Zwei App-Instanzen (z. B. Home-Bildschirm-App im Hintergrund und neu
// gestartete Instanz) teilen sich localStorage. Eine im Hintergrund
// eingefrorene Instanz darf nach dem Speichern in der anderen Instanz keine
// veralteten Entwürfe zurückschreiben und muss beim Zurückkehren den
// aktuellen Stand zeigen.
const assert=require('node:assert/strict'),{run,exercise,secondExercise}=require('./test.cjs');
const record={date:'2026-09-30',dayId:'total',entries:{[exercise]:{w:50,t:'hold'}}};
function type(a,id,value){const i=a.w.document.querySelector(`[data-ex="${id}"] input`);i.value=value;i.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
function click(a,id,sel){a.w.document.querySelector(`[data-ex="${id}"] ${sel}`).click();}
(async()=>{
 const a=await run({local:[record]});a.get('showTab("total")');
 type(a,exercise,'52');click(a,exercise,'.ex-check');click(a,exercise,'.seg button[data-t="up"]');
 const profileKey=a.get('store.metaKey').replace('meta','profile.google-user');
 const before=a.w.localStorage.getItem(profileKey);
 // Simulate the other instance: it saved the workout, so its drafts are gone.
 const other=JSON.parse(before);other.values['trainingsplan.v1.drafts']={};
 other.values['trainingsplan.v1.sessions']=[record,{date:'2026-10-02',dayId:'total',entries:{[exercise]:{w:52,t:'up'}}}];
 const ui=other.values['trainingsplan.v1.ui'];ui.activeTraining=null;
 a.w.localStorage.setItem(profileKey,JSON.stringify(other));
 // A stale write (any tap in the old instance) must not resurrect the drafts.
 type(a,secondExercise,'30');
 const after=JSON.parse(a.w.localStorage.getItem(profileKey));
 assert.equal(after.values['trainingsplan.v1.drafts'][exercise],undefined,'A stale instance does not write old drafts back');
 assert.equal(a.get(`drafts['${exercise}']`),undefined,'The stale instance reloads the newer state');
 assert.equal(a.get('sessions.length'),2,'Newer sessions from the other instance are visible');
 assert.equal(a.get('hasTrainingInput("total")'),false,'The saved day is no longer in progress');
 const hint=a.w.document.querySelector(`[data-ex="${exercise}"] .last-trend`);assert.equal(hint.className,'last-trend up');
 a.dom.window.close();

 // Returning to a frozen instance reloads before the person can tap anything.
 const b=await run({local:[record]});b.get('showTab("total")');type(b,exercise,'52');click(b,exercise,'.ex-check');
 const key=b.get('store.metaKey').replace('meta','profile.google-user');
 const saved=JSON.parse(b.w.localStorage.getItem(key));saved.values['trainingsplan.v1.drafts']={};
 saved.values['trainingsplan.v1.sessions']=[record,{date:'2026-10-02',dayId:'total',entries:{[exercise]:{w:52,t:'down'}}}];
 b.w.localStorage.setItem(key,JSON.stringify(saved));
 b.w.document.dispatchEvent(new b.w.Event('visibilitychange'));await b.settle();
 assert.equal(b.get(`drafts['${exercise}']`),undefined,'Visibility return reloads the stored drafts');
 assert.equal(b.w.document.querySelector(`[data-ex="${exercise}"] input`).value,'','The old value is no longer shown');
 assert.equal(b.w.document.querySelector(`[data-ex="${exercise}"] .last-trend`).className,'last-trend down');
 // storage events from another window are applied as well.
 const again=JSON.parse(b.w.localStorage.getItem(key));again.values['trainingsplan.v1.drafts']={[secondExercise]:{w:'31'}};
 const raw=JSON.stringify(again);b.w.localStorage.setItem(key,raw);
 b.w.dispatchEvent(new b.w.StorageEvent('storage',{key,newValue:raw}));await b.settle();
 assert.equal(b.get(`drafts['${secondExercise}'].w`),'31');
 // Own writes keep working normally after the reload.
 type(b,exercise,'40');assert.equal(JSON.parse(b.w.localStorage.getItem(key)).values['trainingsplan.v1.drafts'][exercise].w,'40');
 b.dom.window.close();

 // Unconfirmed entries with a chosen trend are not silently discarded.
 const c=await run({local:[record]});c.get('showTab("total")');
 type(c,exercise,'52');click(c,exercise,'.ex-check');
 click(c,secondExercise,'.seg button[data-t="up"]');type(c,secondExercise,'30');
 c.get('saveDay(dayById("total"))');await c.settle();
 assert.equal(c.w.document.getElementById('confirm-dialog').open,true,'Saving asks about the unconfirmed trend');
 c.w.document.getElementById('confirm-yes').click();await c.settle();
 const today=c.get('todayISO()');const s=c.get(`JSON.stringify(findSession("total","${today}"))`);
 assert.equal(JSON.parse(s).entries[secondExercise].t,'up','The confirmed trend is saved');
 assert.equal(c.get('hasTrainingInput("total")'),false);
 c.dom.window.close();
 // Cancelling keeps everything for a later decision.
 const d=await run({local:[record]});d.get('showTab("total")');
 click(d,secondExercise,'.seg button[data-t="up"]');type(d,secondExercise,'30');type(d,exercise,'52');click(d,exercise,'.ex-check');
 d.get('saveDay(dayById("total"))');await d.settle();d.w.document.getElementById('confirm-no').click();await d.settle();
 assert.equal(d.get(`drafts['${secondExercise}'].t`),'up');assert.equal(d.get(`findSession("total","${d.get('todayISO()')}")`),null);
 d.dom.window.close();
 console.log('PASS: stale instances reload instead of resurrecting saved drafts; visibility/storage refresh; unconfirmed trends are confirmed or kept');
})().catch(e=>{console.error(e);process.exitCode=1;});
