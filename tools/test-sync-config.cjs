const assert=require('node:assert/strict'),{run,local,exercise}=require('./test.cjs');
(async()=>{
 const fresh=await run({signedOut:true,missingConfig:true,includeMinMax:false});
 assert.equal(fresh.calls.initialized,1);assert.equal(fresh.get('Sync.state.status'),'signed-out');assert.equal(fresh.get('Sync.configured()'),true);
 fresh.get('renderDialog()');assert.match(fresh.w.document.getElementById('sync-dlg-body').textContent,/Mit Google anmelden/);assert.doesNotMatch(fresh.w.document.getElementById('sync-dlg-body').textContent,/Firestore-Datenbank anlegen|apiKey|Konfiguration speichern/);fresh.dom.window.close();
 const upgrade=await run({local,missingConfig:true,autoClaim:false});assert.equal(upgrade.get('Sync.state.status'),'assignment');assert.equal(upgrade.calls.writes.length,0);assert.equal(upgrade.calls.reads.length,0);
 upgrade.get('Sync.assignLegacy(true)');await upgrade.settle();assert.equal(upgrade.get('Sync.state.status'),'ready');assert.equal(upgrade.get('sessions[0].entries['+JSON.stringify(exercise)+'].w'),20);assert.equal(JSON.parse(upgrade.w.localStorage.getItem('trainingsplan.v1.sessions'))[0].entries[exercise].w,20);
 await upgrade.changeAuth('friend');assert.equal(upgrade.get('sessions.length'),0);assert.equal(upgrade.calls.writes.some(p=>p.startsWith('users/friend/sessions/')),false);await upgrade.changeAuth('google-user');assert.equal(upgrade.get('sessions[0].entries['+JSON.stringify(exercise)+'].w'),20);upgrade.dom.window.close();
 console.log('PASS: absent external/local configuration uses bundled public MinMax settings; Google login replaces setup wizard; legacy data still requires assignment; cross-account isolation retained');
})().catch(e=>{console.error(e);process.exitCode=1;});
