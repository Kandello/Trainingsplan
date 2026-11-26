// Übersicht und Fortschritt: ein Menü statt Kopfleiste, Kacheln mit
// relativem Datum, Kalenderleiste der letzten 6 Wochen, Zeitraum und Bestwert.
const assert=require('node:assert/strict'),{run,exercise}=require('./test.cjs');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const ago=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return iso(d);};
(async()=>{
 const local=[
  {date:ago(400),dayId:'total',entries:{[exercise]:{w:30,t:'up'}}},
  {date:ago(40),dayId:'total',entries:{[exercise]:{w:50,t:'up'}}},
  {date:ago(9),dayId:'total',entries:{[exercise]:{w:45,t:'down'}}},
  {date:ago(2),dayId:'total',entries:{[exercise]:{w:47.5,t:'up'}}},
  {date:ago(1),dayId:'upper',entries:{'ub-close-grip-latzug':{w:40,t:'hold'}}}
 ];
 const a=await run({local});
 const doc=a.w.document;
 // Header: only one menu button; plans, colors, sync and data live in the sheet.
 assert.equal(doc.querySelectorAll('.app-header > button').length,1);
 const menu=doc.getElementById('menu-dialog');assert.equal(menu.open,false);
 doc.getElementById('menu-btn').click();assert.equal(menu.open,true);
 assert.ok(menu.contains(doc.getElementById('plan-bar'))&&menu.contains(doc.getElementById('color-btn'))&&menu.contains(doc.getElementById('sync-chip')));
 assert.equal(doc.querySelector('#plan-bar .plan-btn-new').textContent,'Neuer Plan');
 doc.getElementById('color-btn').click();assert.equal(menu.open,false,'Choosing an entry closes the menu');
 assert.ok(doc.getElementById('color-dialog').hasAttribute('open'));
 assert.equal(doc.getElementById('menu-dot').className,doc.getElementById('sync-dot').className,'Sync status as a dot on the menu button');
 // The plan name in the overview opens the same menu.
 doc.querySelector('.overview-eyebrow').click();assert.equal(menu.open,true);a.get('closeMenu()');assert.equal(menu.open,false);
 // Tiles: relative last training plus the exact date.
 const tile=id=>doc.querySelector(`[data-overview-day="${id}"]`);
 assert.equal(tile('total').querySelector('.day-tile-rel').textContent,'Vor 2 Tagen');
 assert.equal(tile('upper').querySelector('.day-tile-rel').textContent,'Gestern');
 assert.equal(tile('lower').querySelector('.day-tile-rel').textContent,'Noch nie','Days never trained keep the same two lines');
 assert.equal(tile('lower').querySelector('.day-tile-last time').textContent,'–');
 assert.equal(a.get(`relDay('${ago(0)}')`),'Heute');assert.equal(a.get(`relDay('${ago(21)}')`),'Vor 3 Wochen');
 // Calendar: 6 weeks of Monday–Sunday, trained days filled.
 const cells=doc.querySelectorAll('#train-cal .cal-day');assert.equal(cells.length,42);
 assert.equal(doc.querySelectorAll('#train-cal .cal-day.is-trained').length,3,'Only the last 6 weeks count');
 assert.equal(doc.querySelectorAll('#train-cal .cal-day.is-today').length,1);
 assert.match(doc.querySelector('#train-cal .cal-head strong').textContent,/^3$/);
 // Progress: no data buttons any more; range and best value for one exercise.
 a.get('showTab("progress")');
 assert.equal(doc.querySelector('#panel-progress .data-tools'),null);
 a.get(`ui.metric='ex:${exercise}';renderProgress()`);
 assert.match(doc.getElementById('chart-sub').textContent,/^Bestwert 50 kg · /);
 assert.match(doc.getElementById('chart-sub').textContent,/\+17,5 kg im Zeitraum$/);
 assert.equal(doc.querySelectorAll('#chart-wrap .best-ring').length,1);
 doc.querySelector('.range-chip[data-range="3m"]').click();
 assert.equal(a.get('ui.range'),'3m');
 assert.match(doc.getElementById('chart-sub').textContent,/−2,5 kg im Zeitraum$/,'Older points drop out of the range');
 assert.equal(a.get(`inRange(historyOf('${exercise}')).length`),3);
 doc.querySelector('.range-chip[data-range="all"]').click();assert.equal(a.get(`inRange(historyOf('${exercise}')).length`),4);
 a.dom.window.close();
 console.log('PASS: single menu button with plans/colors/sync/data, sync dot, relative tile dates, 6-week calendar, progress range and best value');
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1);});
