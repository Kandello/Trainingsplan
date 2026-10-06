// Public web configuration only; no credentials or server keys are read.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const source=fs.readFileSync('firebase-config.js','utf8'),context={window:{}};
vm.runInNewContext(source,context);
const config=context.window.FIREBASE_CONFIG;
assert.equal(config.projectId,'minmax-workouttracker');
for(const key of ['apiKey','authDomain','appId'])assert.equal(typeof config[key],'string');
const start='/* FIREBASE DEFAULT CONFIG START */',end='/* FIREBASE DEFAULT CONFIG END */';
const block=start+'\nconst DEFAULT_FIREBASE_CONFIG = Object.freeze('+JSON.stringify(config,null,2)+');\n'+end;
const version=crypto.createHash('sha256').update(source).digest('hex').slice(0,12);
let html=fs.readFileSync('index.html','utf8');
if(html.includes(start))html=html.slice(0,html.indexOf(start))+block+html.slice(html.indexOf(end)+end.length);
else html=html.replace('const K_FBCFG =',block+'\nconst K_FBCFG =');
html=html.replace(/<script src="firebase-config\.js(?:\?v=[a-f0-9]+)?"(?: defer)?><\/script>/,'<script src="firebase-config.js?v='+version+'" defer></script>');
fs.writeFileSync('index.html',html);
let sw=fs.readFileSync('sw.js','utf8').replace(/"\.\/firebase-config\.js(?:\?v=[a-f0-9]+)?"/,'"./firebase-config.js?v='+version+'"');
fs.writeFileSync('sw.js',sw);
console.log('Embedded public MinMax configuration and matching offline asset version.');
