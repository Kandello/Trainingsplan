// Bewegung: Navigation ohne View-Transition-Unterstützung, Bottom-Sheets
// mit Griff und Wischen zum Schliessen, Haptik beim Einloggen/Speichern.
const assert=require('node:assert/strict'),{run,exercise}=require('./test.cjs');
const record={date:'2026-09-30',dayId:'total',entries:{[exercise]:{w:50,t:'hold'}}};
(async()=>{
 const a=await run({local:[record]});const doc=a.w.document;
 const vib=[];a.w.navigator.vibrate=v=>{vib.push(v);return true;};
 // Without startViewTransition the tile still navigates directly.
 assert.equal(typeof doc.startViewTransition,'undefined');
 doc.querySelector('[data-overview-day="total"]').click();
 assert.equal(a.get('ui.tab'),'total');assert.equal(doc.documentElement.dataset.vt,undefined);
 // Confirm and spec dialogs are bottom sheets with a grip.
 for(const id of ['confirm-dialog','spec-dialog','menu-dialog','rest-dialog','data-dialog']){
  const d=doc.getElementById(id);assert.ok(d.classList.contains('sheet'),id+' is a sheet');assert.ok(d.querySelector('.sheet-grip'),id+' has a grip');
 }
 // Dragging the sheet down past the threshold closes it; a short drag does not.
 doc.querySelector(`[data-ex="${exercise}"] .spec-chip`).click();
 const spec=doc.getElementById('spec-dialog');assert.equal(spec.hasAttribute('open'),true);
 const drag=(dy)=>{spec.dispatchEvent(new a.w.MouseEvent('pointerdown',{clientY:10,bubbles:true}));spec.dispatchEvent(new a.w.MouseEvent('pointermove',{clientY:10+dy,bubbles:true}));spec.dispatchEvent(new a.w.MouseEvent('pointerup',{clientY:10+dy,bubbles:true}));};
 drag(20);assert.equal(spec.hasAttribute('open'),true,'Short drag snaps back');assert.equal(spec.style.transform,'');
 drag(160);assert.equal(spec.hasAttribute('open'),false,'Long drag closes');
 // Logging an exercise gives a short haptic tick; saving a longer one.
 const i=doc.querySelector(`[data-ex="${exercise}"] .wfield input`);i.value='52';i.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 doc.querySelector(`[data-ex="${exercise}"] .seg button[data-t="up"]`).click();
 assert.deepEqual(vib,[12]);
 assert.ok(doc.querySelector('#summary-progress-total .summary-segment.is-new'),'The newly filled segment animates');
 a.get('saveDay(dayById("total"))');await a.settle();assert.deepEqual(vib,[12,20]);
 // Home button returns to the overview.
 doc.querySelector('.view.is-active .btn-home').click();assert.equal(a.get('ui.tab'),'overview');
 a.dom.window.close();
 console.log('PASS: navigation fallback, bottom sheets with grip and drag-to-close, haptics, segment animation');
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
