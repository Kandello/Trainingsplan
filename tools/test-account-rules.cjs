// Only the local demo project is used. No production credentials or data.
const assert=require('node:assert/strict');
const {initializeApp,deleteApp}=require('firebase/app');
const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword}=require('firebase/auth');
const {getFirestore,connectFirestoreEmulator,doc,collection,setDoc,getDoc,getDocs,deleteDoc}=require('firebase/firestore');
(async()=>{
 const apps=[];
 async function client(name,signedIn=true){const app=initializeApp({apiKey:'demo-key',projectId:'demo-minmax-accounts'},'rules-'+name);apps.push(app);const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080);const user=signedIn?(await createUserWithEmailAndPassword(auth,name+'-'+Date.now()+'@example.test','test-password-123')).user:null;return {db,uid:user&&user.uid};}
 try{
  const a=await client('a'),b=await client('b'),guest=await client('guest',false);
  const session={date:'2026-10-06',dayId:'total',entries:{test:{w:25,t:'hold'}}};
  const path=id=>'users/'+id+'/sessions/total_2026-10-06',plan=id=>'users/'+id+'/state/plan';
  await setDoc(doc(a.db,path(a.uid)),session);await setDoc(doc(b.db,path(b.uid)),{...session,entries:{test:{w:50,t:'up'}}});
  await setDoc(doc(a.db,plan(a.uid)),{plans:[{id:'a',name:'A',days:[]}]});await setDoc(doc(b.db,plan(b.uid)),{plans:[{id:'b',name:'B',days:[]}]});
  assert.equal((await getDoc(doc(a.db,path(a.uid)))).data().entries.test.w,25);assert.equal((await getDocs(collection(b.db,'users',b.uid,'sessions'))).size,1);
  for(const [client,other] of [[a,b],[b,a]]){
   await assert.rejects(getDoc(doc(client.db,path(other.uid))),e=>e.code==='permission-denied');
   await assert.rejects(getDocs(collection(client.db,'users',other.uid,'sessions')),e=>e.code==='permission-denied');
   await assert.rejects(setDoc(doc(client.db,path(other.uid)),session),e=>e.code==='permission-denied');
   await assert.rejects(deleteDoc(doc(client.db,path(other.uid))),e=>e.code==='permission-denied');
   await assert.rejects(getDoc(doc(client.db,plan(other.uid))),e=>e.code==='permission-denied');
   await assert.rejects(setDoc(doc(client.db,plan(other.uid)),{plans:[]}),e=>e.code==='permission-denied');
  }
  await assert.rejects(getDoc(doc(guest.db,path(a.uid))),e=>e.code==='permission-denied');
  await assert.rejects(setDoc(doc(guest.db,plan(a.uid)),{}),e=>e.code==='permission-denied');
  assert.equal((await getDoc(doc(a.db,path(a.uid)))).data().entries.test.w,25);assert.equal((await getDoc(doc(b.db,path(b.uid)))).data().entries.test.w,50);
  console.log('PASS: real Auth/Firestore emulators: independent accounts, own reads/writes, cross-account read/query/write/delete denied, guest denied, originals intact');
 }finally{await Promise.all(apps.map(deleteApp));}
})().catch(e=>{console.error(e);process.exitCode=1;});
