/* Local profiles are atomic snapshots. Legacy keys stay untouched for recovery. */
function createAccountStore(){
  var prefix='trainingsplan.v3.accounts.minmax-workouttracker.', metaKey=prefix+'meta';
  var keys=['plan','customExercises','exerciseSpec','sessions','drafts','ui','plans','theme','colors','builderDraft'].map(function(k){return 'trainingsplan.v1.'+k;}).concat(['trainingsplan.v2.recovery','trainingsplan.v2.outbox']);
  var ok=true, owner='guest', profile={values:{}}, meta=null, error=null;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function readRaw(k,fallback){var raw=localStorage.getItem(k);return raw ? JSON.parse(raw) : fallback;}
  function profileKey(id){return prefix+'profile.'+encodeURIComponent(id);}
  function writeRaw(k,v){var raw=JSON.stringify(v);localStorage.setItem(k,raw);if(localStorage.getItem(k)!==raw)throw new Error('Browser-Speicher konnte nicht geprüft werden.');}
  function meaningful(v){return ['plan','customExercises','exerciseSpec','sessions','drafts','plans','theme','colors','builderDraft'].some(function(k){var x=v['trainingsplan.v1.'+k];return x&&Object.keys(x).length>0;})||Object.keys(v['trainingsplan.v2.outbox']||{}).length>0;}
  var legacy={};
  try{
    keys.forEach(function(k){var x=readRaw(k,null);if(x!==null)legacy[k]=x;});
    meta=readRaw(metaKey,null);
    if(!meta){
      var pending=meaningful(legacy);
      if(pending)writeRaw(prefix+'legacyBackup',{values:legacy,savedAt:new Date().toISOString()});
      owner=pending?'legacy':'guest';
      profile={values:legacy};writeRaw(profileKey(owner),profile);
      // Only queued operations carry a reliable pre-upgrade account owner.
      Object.values(legacy['trainingsplan.v2.outbox']||{}).forEach(function(item){
        if(!item.owner||['local','guest','legacy'].includes(item.owner))return;
        var p=readRaw(profileKey(item.owner),{values:{}}),box=p.values['trainingsplan.v2.outbox']||{};
        box[item.owner+':'+item.id]=item;p.values['trainingsplan.v2.outbox']=box;writeRaw(profileKey(item.owner),p);
      });
      meta={version:1,active:owner,legacyPending:pending,declined:{}};writeRaw(metaKey,meta);
    }
    owner=meta.active||'guest';profile=readRaw(profileKey(owner),{values:{}});
    if(!profile||!profile.values)throw new Error('Der lokale Kontobereich konnte nicht gelesen werden.');
  }catch(e){ok=false;error=e.message;profile={values:legacy};owner='legacy';meta=meta||{active:owner,legacyPending:meaningful(legacy),declined:{}};}
  function commit(p,id){try{writeRaw(profileKey(id),p);}catch(e){ok=false;error=e.message;throw new Error('Kontodaten konnten nicht gesichert werden. Der Abgleich bleibt angehalten.');}}
  function checkOwner(){var current=readRaw(metaKey,meta);if(current.active!==owner)throw new Error('Das Konto wurde in einem anderen Fenster gewechselt. Bitte die App neu laden.');}
  return {
    get available(){return ok;},get owner(){return owner;},get error(){return error;},metaKey:metaKey,
    read:function(k,fallback){try{var v=keys.includes(k)?profile.values[k]:readRaw(k,null);return v==null?fallback:clone(v);}catch(e){return fallback;}},
    write:function(k,v){if(!keys.includes(k)){if(ok)writeRaw(k,v);return;}if(!ok){profile.values[k]=clone(v);return;}checkOwner();var next=readRaw(profileKey(owner),profile);next.values[k]=clone(v);commit(next,owner);profile=next;},
    activate:function(id){if(!ok)throw new Error(error||'Browser-Speicher nicht verfügbar.');var next=readRaw(profileKey(id),{values:{}});if(!next||!next.values)throw new Error('Kontodaten sind beschädigt; bitte die Sicherung verwenden.');commit(next,id);var m=readRaw(metaKey,meta);m.active=id;writeRaw(metaKey,m);meta=m;owner=id;profile=next;},
    needsAssignment:function(id){var m=readRaw(metaKey,meta);return !!(m.legacyPending&&!(m.declined||{})[id]);},
    hasLegacy:function(){return !!readRaw(metaKey,meta).legacyPending;},
    decline:function(id){var m=readRaw(metaKey,meta);m.declined=m.declined||{};m.declined[id]=true;writeRaw(metaKey,m);meta=m;},
    hasGuest:function(){return meaningful(readRaw(profileKey('guest'),{values:{}}).values);},
    transfer:function(source,id){
      var m=readRaw(metaKey,meta);if(source==='legacy'&&!m.legacyPending)throw new Error('Diese Daten wurden bereits einem Konto zugeordnet.');
      var src=readRaw(profileKey(source),{values:{}}),dst=readRaw(profileKey(id),{values:{}}),v=clone(src.values),target=dst.values;
      Object.keys(target).forEach(function(k){
        if(k==='trainingsplan.v1.sessions'){
          var map=new Map((v[k]||[]).map(function(s){return [s.dayId+'_'+s.date,s];}));
          (target[k]||[]).forEach(function(s){var old=map.get(s.dayId+'_'+s.date);map.set(s.dayId+'_'+s.date,Object.assign({},s,{entries:Object.assign({},old&&old.entries,s.entries)}));});v[k]=Array.from(map.values());
        }else if(k==='trainingsplan.v1.plans'){var all=(target[k]||[]).slice();(v[k]||[]).forEach(function(p){if(!all.some(function(t){return t.id===p.id;}))all.push(p);});v[k]=all;}
        else if(['trainingsplan.v1.plan','trainingsplan.v1.customExercises','trainingsplan.v1.exerciseSpec','trainingsplan.v1.drafts'].includes(k))v[k]=Object.assign({},v[k],target[k]);
        else v[k]=target[k];
      });
      var box=clone(target['trainingsplan.v2.outbox']||{});
      Object.values(src.values['trainingsplan.v2.outbox']||{}).forEach(function(item){if(item.owner===id||item.owner==='local'||item.owner===source){item.owner=id;box[id+':'+item.id]=item;}});
      v['trainingsplan.v2.outbox']=box;commit({values:v},id);
      if(source==='legacy'){m.legacyPending=false;m.legacyClaimedBy=id;writeRaw(metaKey,m);meta=m;}
    }
  };
}

function activateAccount(id){
  if(store.owner!==id)document.querySelectorAll('dialog[open]:not(#sync-dialog)').forEach(function(d){if(typeof d.close==='function')d.close();else d.removeAttribute('open');});
  store.activate(id);
  document.getElementById('main').hidden=false;document.getElementById('plan-bar').hidden=false;
  sessions=store.read(K_SESSIONS,[]);drafts=store.read(K_DRAFTS,{});ui=store.read(K_UI,{});
  planOrder=store.read(K_PLAN,{});customEx=store.read(K_CUSTOMEX,{});exSpec=store.read(K_EXSPEC,{});userPlans=store.read(K_PLANS,[]);
  theme=store.read(K_THEME,{});colorLibrary=store.read(K_COLORS,{favorites:[],recent:[]});
  colorLibrary.favorites=colorLibrary.favorites||[];colorLibrary.recent=colorLibrary.recent||[];
  if(!store.read(K_RECOVERY,null))store.write(K_RECOVERY,{sessions:sessions,drafts:drafts,plan:{order:planOrder,exercises:customEx,spec:exSpec,plans:userPlans},savedAt:new Date().toISOString()});
  activePlanId=ui.activePlanId||MINMAX_PLAN_ID;hiddenSeries={};colorMode='looks';colorTarget='bg';
  rebuildPlanRegistry();applyTheme();renderPlanBar();buildTabs();rebuildAll();
}
