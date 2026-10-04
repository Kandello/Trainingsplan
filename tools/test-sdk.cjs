const fs=require('fs'),crypto=require('crypto'),assert=require('node:assert/strict'),vm=require('vm');
(async()=>{
 const code=fs.readFileSync('vendor/firebase.js','utf8');
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 const version=crypto.createHash('sha256').update(code).digest('hex').slice(0,12);
 const url=html.match(/const SDK_URL = "([^"]+)"/)[1];
 assert.equal(url,'./vendor/firebase.js?v='+version);
 assert.ok(sw.includes('"'+url+'"'),'Offline installation must cache the exact module URL');
 const sdk=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 for(const name of ['getDocsFromServer','getDocFromServer','initializeFirestore','getAuth','onSnapshot','signInWithPopup']){
   assert.equal(typeof sdk[name],'function','Actual SDK must export '+name);
 }
 const handlers={},stored=new Map(),base='https://example.com/';
 let offline=false,networkCalls=0;
 const cache={put:async(request,response)=>stored.set(typeof request==='string'?request:request.url,response),match:async request=>stored.get(typeof request==='string'?request:request.url)};
 const self={location:{origin:'https://example.com'},addEventListener:(name,fn)=>handlers[name]=fn};
 vm.runInNewContext(sw,{self,URL,Response,caches:{open:async()=>cache,match:cache.match},fetch:async()=>{
   networkCalls++;if(offline)throw new Error('offline');return new Response('current-sdk');
 }});
 stored.set(base+'vendor/firebase.js',new Response('old-sdk'));
 stored.set('./index.html',new Response('<html>fallback</html>'));
 async function request(path,mode='cors'){
   let result;handlers.fetch({request:{method:'GET',url:new URL(path,base).href,mode},respondWith:value=>result=value});
   return result;
 }
 assert.equal(await (await request(url)).text(),'current-sdk','Must bypass stale unversioned SDK');
 assert.equal(networkCalls,1);
 offline=true;
 assert.equal(await (await request(url)).text(),'current-sdk','Matching version must work offline');
 assert.equal((await request('./vendor/missing.js')).type,'error','Missing scripts must not receive HTML');
 assert.equal(await (await request('./offline-page','navigate')).text(),'<html>fallback</html>');
 console.log('PASS: actual Firebase exports, matching SDK content version, stale cache bypass, offline module and navigation fallbacks');
})().catch(e=>{console.error(e);process.exitCode=1;});
