// Runde 2: Pausenvorgaben, Beschriftung, Verlauf als Mini-Kacheln, Tagesverlauf, Home-Knopf nur iOS.
const assert=require('node:assert/strict'),{run,exercise}=require('./test.cjs');
(async()=>{
 const local=[1,2,3,4,5,6,7].map(i=>({date:'2026-10-0'+i,dayId:'total',entries:{[exercise]:{w:40+i,t:'up'}}}));
 const a=await run({local});a.get('showTab("total")');const doc=a.w.document;
 a.get(`RestTimer.openSheet('${exercise}')`);
 assert.deepEqual([...doc.querySelectorAll('.rest-preset')].map(b=>b.textContent),['1:30','2:00','2:30','3:00']);
 const card=doc.querySelector(`[data-ex="${exercise}"]`);
 assert.deepEqual([...card.querySelectorAll('.tag-lbl')].map(l=>l.textContent),['Whlg.','Gewicht']);
 assert.equal(card.querySelectorAll('.hist .hitem').length,6,'Six history tiles');
 assert.equal(doc.querySelector('.view[data-view="total"] .btn-home').hidden,true,'No home button outside iOS');
 doc.querySelector('.view[data-view="total"] .day-hist-btn').click();
 assert.equal(doc.getElementById('dayhist-dialog').hasAttribute('open'),true);
 assert.equal(doc.querySelectorAll('#dayhist-body thead th').length,8,'Name column + 7 sessions');
 assert.match(doc.querySelector('#dayhist-body tbody td').textContent,/^47▲$/);
 a.dom.window.close();
 console.log('PASS: rest presets 1:30–3:00, Whlg./Gewicht labels, 6 history tiles, day history sheet, home button iOS-only');
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
