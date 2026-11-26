// Trainingsansicht: Vorschlag aus Tendenz, Ein-Tipp-Bestätigung, zugeklappte
// Karten und das rote ✕ zum Verwerfen mit Rückgängig.
const assert=require('node:assert/strict'),{run,exercise,secondExercise}=require('./test.cjs');
const pull='tb-pullups';
const history=[
 {date:'2026-10-01',dayId:'total',entries:{[exercise]:{w:45,t:'hold'},[secondExercise]:{w:60,t:'down'}}},
 {date:'2026-10-08',dayId:'total',entries:{[exercise]:{w:47.5,t:'up'},[secondExercise]:{w:62,t:'down'}}}
];
const q=(a,id,sel)=>a.w.document.querySelector(`[data-ex="${id}"]${sel?' '+sel:''}`);
function type(a,id,value,commit){const i=q(a,id,'.wfield input');i.value=value;i.dispatchEvent(new a.w.Event('input',{bubbles:true}));if(commit)i.dispatchEvent(new a.w.Event('change',{bubbles:true}));}
(async()=>{
 const a=await run({local:history});a.get('showTab("total")');
 // Suggestion: last weight + last increase for "up", minus it for "down".
 assert.equal(a.get(`JSON.stringify(suggestionOf('${exercise}'))`),JSON.stringify({w:50,t:'up'}));
 assert.equal(a.get(`suggestionOf('${secondExercise}').w`),60,'Down uses the last increase as step');
 assert.equal(q(a,exercise,'.wfield input').placeholder,'50');
 assert.equal(q(a,exercise,'[data-trend-ex]').textContent,'▲');
 assert.equal(q(a,exercise,'.suggest-kg').textContent,'50');
 assert.equal(q(a,exercise,'.ex-plan'),null,'The original plan weight is hidden once there is history');
 q(a,exercise,'.suggest').click();
 assert.equal(a.get(`drafts['${exercise}'].w`),'50');assert.equal(a.get(`isLogged('${exercise}')`),false,'A taken suggestion needs a trend');
 // Weight + trend logs the exercise and collapses the card.
 q(a,exercise,'.seg button[data-t="up"]').click();
 assert.equal(a.get(`isLogged('${exercise}')`),true);assert.equal(q(a,exercise,'.ex-check').hidden,false,'Green indicator');
 assert.equal(q(a,exercise).classList.contains('is-collapsed'),true);
 assert.equal(q(a,exercise,'.ex-sum').textContent,'50 kg ▲');
 assert.equal(q(a,exercise,'.ex-more').inert,true);
 // Tapping the head opens it again, tapping again closes it.
 q(a,exercise,'.ex-sum').click();assert.equal(q(a,exercise).classList.contains('is-collapsed'),false);
 q(a,exercise,'.ex-head').click();assert.equal(q(a,exercise).classList.contains('is-collapsed'),true);
 // Trend first, then weight: collapses when the field is left, not while typing.
 q(a,secondExercise,'.seg button[data-t="hold"]').click();q(a,secondExercise,'.wfield input').focus();type(a,secondExercise,'6');
 assert.equal(q(a,secondExercise).classList.contains('is-collapsed'),false,'The card stays open while typing');
 type(a,secondExercise,'60',true);assert.equal(a.get(`isLogged('${secondExercise}')`),true);
 assert.equal(q(a,secondExercise).classList.contains('is-collapsed'),true);
 // Body weight: the trend alone confirms.
 q(a,pull,'.seg button[data-t="up"]').click();assert.equal(a.get(`confirmedEntry('${pull}').w`),0);
 assert.equal(a.w.document.getElementById('summary-title-total').textContent,'3 von 7 bestätigt');
 // Red ✕ discards everything, undo restores it.
 const discard=a.w.document.getElementById('discard-total');assert.equal(discard.disabled,false);
 discard.click();assert.equal(a.get('hasTrainingInput("total")'),false);assert.equal(a.get('ui.activeTraining'),null);
 const t=a.w.document.getElementById('toast');assert.equal(t.classList.contains('has-action'),true);
 assert.equal(a.w.document.getElementById('discard-total').disabled,true);
 t.querySelector('.toast-action').click();
 assert.equal(a.get(`drafts['${exercise}'].w`),'50');assert.equal(a.get('ui.activeTraining.dayId'),'total');
 assert.equal(q(a,exercise).classList.contains('is-collapsed'),true,'Restored confirmed cards are collapsed again');
 // Saving resets the cards.
 a.get('saveDay(dayById("total"))');await a.settle();
 assert.equal(q(a,exercise).classList.contains('is-collapsed'),false);assert.equal(q(a,exercise,'.ex-sum').hidden,true);
 assert.equal(q(a,exercise,'.wfield input').placeholder,'52,5','The new suggestion follows the saved trend');
 a.dom.window.close();

 // Untouched suggestions are not saved; a weight without trend is asked for.
 const b=await run({local:history});b.get('showTab("total")');
 b.w.document.getElementById('prefill-total').click();
 assert.equal(b.get('countOpen(dayById("total"))'),0,'Taken-over suggestions alone are not incomplete');
 type(b,secondExercise,'61');
 b.get('saveDay(dayById("total"))');await b.settle();
 assert.equal(b.w.document.getElementById('confirm-dialog').open,true,'Weight without trend asks before saving');
 assert.match(b.w.document.getElementById('confirm-dlg-body').textContent,/AnySquat/);
 b.w.document.getElementById('confirm-yes').click();await b.settle();
 const saved=JSON.parse(b.get(`JSON.stringify(findSession("total",todayISO()))`));
 assert.deepEqual(Object.keys(saved.entries),[secondExercise],'Only the touched exercise is saved');
 assert.deepEqual(saved.entries[secondExercise],{w:61,t:'hold'});
 assert.equal(b.get('hasTrainingInput("total")'),false);
 // One button edits sets and repetitions together.
 assert.equal(q(b,exercise,'.spec-chip').textContent,'2×6–8');
 q(b,exercise,'.spec-chip').click();
 const inputs=b.w.document.querySelectorAll('#spec-fields input');assert.equal(inputs.length,3);
 inputs[0].value='3';inputs[1].value='8';inputs[2].value='10';
 inputs[2].dispatchEvent(new b.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 assert.equal(b.get(`POOL['${exercise}'].sets`),3);assert.equal(b.get(`POOL['${exercise}'].rmax`),10);
 assert.equal(q(b,exercise,'.spec-chip').textContent,'3×8–10');
 b.dom.window.close();
 console.log('PASS: trend suggestion/step, weight+trend logging, green indicator, incomplete-save prompt, combined sets/reps, collapsible cards, body weight, discard with undo, reset after saving');
})().catch(e=>{console.error(e);process.exitCode=1;});
