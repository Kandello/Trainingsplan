const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
const start='/* ACCOUNT STORAGE START */',end='/* ACCOUNT STORAGE END */';
const block=start+'\n'+fs.readFileSync('tools/account-storage.js','utf8')+'\n'+end;
if(html.includes(start))html=html.slice(0,html.indexOf(start))+block+html.slice(html.indexOf(end)+end.length);
else html=html.replace('const store = (function(){',block+'\n\nconst store = (function(){');
html=html.replace(/const store = \(function\(\)\{[\s\S]*?\}\)\(\);/,'const store = createAccountStore();');
fs.writeFileSync('index.html',html);
