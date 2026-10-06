const assert=require('node:assert/strict'),{run,exercise}=require('./test.cjs');
const tile=(a,id)=>a.w.document.querySelector('[data-overview-day="'+id+'"]');
(async()=>{
 const records=[
  {dayId:'total',date:'2026-09-30',entries:{[exercise]:{w:50,t:'hold'}}},
  {dayId:'arms',date:'2026-10-03',entries:{'ad-preacher-curl':{w:20,t:'up'}}},
  {dayId:'total',date:'2026-09-11',entries:{[exercise]:{w:55,t:'hold'}}}
 ];
 const a=await run({local:records,drafts:{[exercise]:{w:'51',t:'hold'}}});
 assert.equal(a.get('Sync.state.status'),'ready');assert.equal(a.get('ui.tab'),'overview');
 assert.equal(a.w.document.getElementById('sync-dialog').open,false);assert.equal(a.w.document.getElementById('studio-dialog').open,false);
 assert.equal(a.w.document.querySelectorAll('.day-tile').length,4);
 assert.equal(tile(a,'total').querySelector('time').textContent,'30.09.2026');assert.equal(tile(a,'arms').querySelector('time').textContent,'03.10.2026');
 assert.equal(tile(a,'upper').querySelector('time'),null);assert.equal(tile(a,'lower').querySelector('time'),null);
 const before=JSON.stringify(a.get('sessions'));
 tile(a,'total').click();assert.equal(a.get('ui.tab'),'total');assert.equal(a.w.document.body.classList.contains('is-overview'),false);
 a.get('activateAccount("google-user",{deferStart:true})');assert.equal(a.get('ui.tab'),'total','Late same-account restoration preserves an open training day');
 assert.equal(a.get(`drafts['${exercise}'].w`),'51');
 a.get('showTab("overview")');assert.equal(a.w.document.body.classList.contains('is-overview'),true);assert.equal(JSON.stringify(a.get('sessions')),before);
 tile(a,'total').focus();
 a.get(`sessions.push({dayId:'total',date:'2026-10-05',entries:{'${exercise}':{w:52,t:'hold'}}});saveSessions()`);
 assert.equal(tile(a,'total').querySelector('time').textContent,'05.10.2026');assert.equal(a.w.document.activeElement,tile(a,'total'));
 a.get("sessions.push({dayId:'total',date:'2026-10-06',entries:{}});saveSessions()");assert.equal(tile(a,'total').querySelector('time').textContent,'05.10.2026','An empty record is not a completed workout');
 a.get("sessions=sessions.filter(s=>s.date!=='2026-10-05');saveSessions();refreshFromData()");assert.equal(tile(a,'total').querySelector('time').textContent,'30.09.2026');
 a.get("sessions=sessions.filter(s=>s.dayId!=='arms');saveSessions()");assert.equal(tile(a,'arms').querySelector('time'),null);
 await a.changeAuth(null);assert.equal(a.w.document.querySelectorAll('.day-tile').length,0);assert.equal(a.w.document.body.classList.contains('is-overview'),false);
 await a.changeAuth('friend');assert.equal(a.get('PLANS.length'),0);assert.equal(a.w.document.querySelectorAll('.day-tile').length,0);
 await a.changeAuth('google-user');assert.equal(a.get('ui.tab'),'overview');assert.equal(a.w.document.querySelectorAll('.day-tile').length,4);assert.equal(a.get(`drafts['${exercise}'].w`),'51');
 a.dom.window.close();
 for(const n of [1,3,5,9]){
  const plan={id:'custom',name:'Eigener Plan',days:Array.from({length:n},(_,i)=>({id:'custom-'+i,name:i?'Tag '+(i+1):'Ein langer vollständiger Trainingstag',base:[]}))};
  const b=await run({signedOut:true,includeMinMax:false,plans:[plan],ui:{activePlanId:'custom'}});
  assert.equal(b.get('ui.tab'),'overview');assert.equal(b.w.document.querySelectorAll('.day-tile').length,n);assert.equal(b.w.document.querySelectorAll('.day-tile time').length,0);
  assert.equal(tile(b,'custom-0').querySelector('strong').textContent,plan.days[0].name);
  tile(b,'custom-0').click();const saved=b.snapshot();b.dom.window.close();
  const c=await run({storage:saved,signedOut:true,includeMinMax:false});assert.equal(c.get('ui.tab'),'custom-0','An opened, unfinished training survives restart');assert.equal(c.w.document.querySelectorAll('.day-tile').length,n);c.dom.window.close();
 }
 const empty=await run({signedOut:true,includeMinMax:false});assert.equal(empty.w.document.querySelectorAll('.day-tile').length,0);assert.equal(empty.w.document.getElementById('studio-dialog').open,true);empty.dom.window.close();
 console.log('PASS: day counts, complete names, latest nonempty dates, live log refresh, focus/draft preservation, account isolation, late authentication and restart overview');
})().catch(e=>{console.error(e);process.exitCode=1;});
