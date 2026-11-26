// Pausentimer: Uhrsymbol je Übung, Einstellung, Endzeitpunkt, Randlinie,
// Signal am Ende, Fortsetzen nach Neuladen und Synchronisierung der Dauer.
const assert=require('node:assert/strict'),{run,exercise,secondExercise}=require('./test.cjs');
const q=(a,id,sel)=>a.w.document.querySelector(`[data-ex="${id}"] ${sel}`);
(async()=>{
 const a=await run({local:[{date:'2026-09-30',dayId:'total',entries:{[exercise]:{w:50,t:'hold'}}}]});a.get('showTab("total")');
 let now=1_800_000_000_000;a.w.Date.now=()=>now;
 const vib=[];a.w.navigator.vibrate=v=>{vib.push(v);return true;};
 const btn=()=>q(a,exercise,'.rest-btn');
 assert.equal(btn().querySelector('.rest-txt').textContent,'','No time stored yet');
 // First tap without a stored time opens the setting.
 btn().click();const dlg=a.w.document.getElementById('rest-dialog');assert.equal(dlg.open,true);
 assert.equal(a.w.document.querySelectorAll('.rest-preset').length,4);
 a.w.document.getElementById('rest-plus').click();assert.equal(a.w.document.getElementById('rest-value').textContent,'1:45');
 a.w.document.getElementById('rest-start').click();
 assert.equal(dlg.open,false);
 assert.equal(a.get(`exSpec['${exercise}'].rest`),105,'The chosen time is stored per exercise');
 assert.equal(a.get(`POOL['${exercise}'].rest`),105);
 assert.equal(a.get('ui.restTimer.exId'),exercise);assert.equal(a.get('ui.restTimer.endAt'),now+105000);
 assert.equal(btn().classList.contains('is-running'),true);assert.equal(btn().querySelector('.rest-txt').textContent,'1:45');
 const edge=a.w.document.querySelector('.rest-edge');assert.ok(edge&&edge.classList.contains('is-on'),'Edge line is shown');
 assert.ok(edge.querySelector('path').getAttribute('d').startsWith('M'+(a.w.innerWidth/2)+' 2.5 H'),'Starts at the top centre, clockwise');
 // Remaining time counts down on the clock symbol.
 now+=63000;a.get('RestTimer.tick()');assert.equal(btn().querySelector('.rest-txt').textContent,'0:42');
 assert.deepEqual(vib,[],'No warning before the end');
 // Tapping the running clock cancels.
 btn().click();assert.equal(a.get('ui.restTimer'),null);assert.equal(edge.classList.contains('is-on'),false);
 assert.equal(btn().querySelector('.rest-txt').textContent,'1:45','Shows the stored time again');
 // With a stored time one tap starts; at the end: one second vibration.
 btn().click();assert.equal(a.get('ui.restTimer.total'),105);assert.equal(dlg.open,false);
 now+=105000;a.get('RestTimer.tick()');
 assert.deepEqual(vib,[1000]);assert.equal(a.get('ui.restTimer'),null);assert.equal(btn().classList.contains('is-running'),false);
 // A preset saves and starts at once; a second exercise replaces the running pause.
 a.get(`RestTimer.openSheet('${secondExercise}')`);a.w.document.querySelectorAll('.rest-preset')[1].click();
 assert.equal(a.get(`exSpec['${secondExercise}'].rest`),120);assert.equal(a.get('ui.restTimer.exId'),secondExercise);
 btn().click();assert.equal(a.get('ui.restTimer.exId'),exercise,'Only one pause runs at a time');
 assert.equal(q(a,secondExercise,'.rest-btn').classList.contains('is-running'),false);
 // The stored time travels with the plan to the cloud.
 await a.settle();const plan=a.documents.get('users/google-user/state/plan');assert.equal(plan.spec[exercise].rest,105);assert.equal(plan.spec[secondExercise].rest,120);
 // Sets/reps edits keep the rest time.
 a.get(`setSpec('${exercise}',{sets:3})`);assert.equal(a.get(`exSpec['${exercise}'].rest`),105);
 // A running pause survives a reload and continues from its end time.
 const snap=a.snapshot();a.dom.window.close();
 const b=await run({storage:snap});b.w.Date.now=()=>now+30000;b.get('RestTimer.resume()');b.get('showTab("total")');
 assert.equal(q(b,exercise,'.rest-btn .rest-txt').textContent,'1:15');assert.equal(q(b,exercise,'.rest-btn').classList.contains('is-running'),true);
 // Coming back after the end signals once, late.
 const bv=[];b.w.navigator.vibrate=v=>{bv.push(v);return true;};b.w.Date.now=()=>now+200000;b.get('RestTimer.resume()');
 assert.deepEqual(bv,[1000]);assert.equal(b.get('ui.restTimer'),null);
 b.dom.window.close();
 console.log('PASS: per-exercise rest time (synced), setting sheet, one-tap start, countdown on clock, cancel, end vibration only, single timer, resume after reload, late signal');
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
