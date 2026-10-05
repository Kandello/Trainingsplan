const fs=require('fs');
const start='/* STUDIO UI START */',end='/* STUDIO UI END */';
let html=fs.readFileSync('index.html','utf8');
const ui=start+'\n'+fs.readFileSync('tools/studio-ui.js','utf8')+'\n'+end+'\n';
if(html.includes(start))html=html.slice(0,html.indexOf(start))+ui+html.slice(html.indexOf(end)+end.length).replace(/^\r?\n/,'');
else html=html.replace('var newPlanCtx = null;',ui+'\nvar newPlanCtx = null;');
fs.writeFileSync('index.html',html);
console.log('Embedded Studio UI');
