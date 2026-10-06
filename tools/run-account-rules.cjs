const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),artifacts=path.join(root,'artifacts');
fs.mkdirSync(artifacts,{recursive:true});
fs.copyFileSync(path.join(root,'firestore.rules'),path.join(artifacts,'firestore-account-test.rules'));
fs.writeFileSync(path.join(artifacts,'account-emulator.json'),JSON.stringify({firestore:{rules:'firestore-account-test.rules'},emulators:{auth:{host:'127.0.0.1',port:9099},firestore:{host:'127.0.0.1',port:8080},hub:{host:'127.0.0.1',port:4400},ui:{enabled:false},singleProjectMode:true}},null,2));
const cli=path.join(process.env.APPDATA||'', 'npm/node_modules/firebase-tools/lib/bin/firebase.js');
if(!fs.existsSync(cli))throw new Error('Firebase CLI fehlt. Für diesen lokalen Test wird firebase-tools benötigt.');
const env={...process.env,FIREBASE_CLI_DISABLE_MOTD:'1'};
const portable=path.join(artifacts,'java-test-runtime');
if(fs.existsSync(portable)){const runtime=fs.readdirSync(portable).find(n=>n.startsWith('jdk-'));if(runtime){env.JAVA_HOME=path.join(portable,runtime);env.PATH=path.join(env.JAVA_HOME,'bin')+path.delimiter+env.PATH;}}
const child=spawn(process.execPath,[cli,'emulators:exec','--only','auth,firestore','--project','demo-minmax-accounts','--config','account-emulator.json','"'+process.execPath+'" "'+path.join(root,'tools/test-account-rules.cjs')+'"'],{cwd:artifacts,env,stdio:'inherit',windowsHide:true});
child.on('exit',code=>{process.exitCode=code||0;});child.on('error',e=>{console.error(e);process.exitCode=1;});
