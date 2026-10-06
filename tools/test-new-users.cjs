const assert=require('node:assert/strict');
const {run,local}=require('./test.cjs');
const lead=app=>app.w.document.getElementById('sync-dlg-lead').textContent;
const body=app=>app.w.document.getElementById('sync-dlg-body').textContent;

(async()=>{
 // No pre-created profile: exercise the actual first-install initialization.
 const fresh=await run({signedOut:true,legacy:true,missingConfig:true,autoClaim:false});
 assert.equal(fresh.get('store.hasLegacy()'),false);
 fresh.get('renderDialog()');
 assert.match(body(fresh),/Mit Google anmelden/);
 assert.doesNotMatch(lead(fresh)+body(fresh),/zuordnen|@/i);
 await fresh.changeAuth('new-user');
 assert.equal(fresh.get('Sync.state.status'),'ready');
 assert.equal(fresh.get('store.owner'),'new-user');
 assert.equal(fresh.get('sessions.length'),0);
 assert.equal(fresh.get('userPlans.length'),0);
 assert.equal(fresh.get('Sync.state.email'),'new-user@example.com');
 fresh.get('renderDialog()');
 assert.match(body(fresh),/new-user@example\.com/);
 assert.doesNotMatch(lead(fresh)+body(fresh),/zuordnen/i);
 assert.ok(fresh.calls.reads.every(p=>p.startsWith('users/new-user/')));
 assert.ok(fresh.calls.writes.every(p=>p==='users/new-user/state/plan'));
 await fresh.changeAuth('another-user');fresh.get('renderDialog()');
 assert.equal(fresh.get('Sync.state.status'),'ready');
 assert.match(body(fresh),/another-user@example\.com/);
 assert.doesNotMatch(lead(fresh)+body(fresh),/new-user@example\.com|zuordnen/i);
 await fresh.changeAuth(null);fresh.get('renderDialog()');
 assert.doesNotMatch(lead(fresh)+body(fresh),/@/);
 fresh.dom.window.close();

 // Existing unassigned local data can be claimed only explicitly. The prompt
 // must name the current Google account, including after an account change.
 const upgrade=await run({local,autoClaim:false});
 assert.equal(upgrade.get('Sync.state.status'),'assignment');
 upgrade.get('renderDialog()');assert.match(lead(upgrade),/test@example\.com/);
 await upgrade.changeAuth('new-user');
 assert.equal(upgrade.get('Sync.state.status'),'assignment');
 assert.match(lead(upgrade),/new-user@example\.com/);
 assert.doesNotMatch(lead(upgrade)+body(upgrade),/test@example\.com/);
 assert.equal(upgrade.calls.reads.length,0);
 assert.equal(upgrade.calls.writes.length,0);
 upgrade.get('Sync.assignLegacy(false)');await upgrade.settle();
 assert.equal(upgrade.get('Sync.state.status'),'ready');
 assert.equal(upgrade.get('sessions.length'),0);
 assert.ok(upgrade.calls.writes.every(p=>p==='users/new-user/state/plan'));
 upgrade.dom.window.close();
 console.log('PASS: new installs have no assignment prompt; account display uses only current Google identity; stale emails cleared on switch/sign-out; legacy prompt follows current account and cannot upload without consent');
})().catch(e=>{console.error(e);process.exitCode=1;});
