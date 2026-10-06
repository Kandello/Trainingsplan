// Public plan structure only: never copy weights, IDs, trends or training data.
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const literal=html.match(/const BASE_DAYS = (\[[\s\S]*?\n\]);/)[1];
const days=vm.runInNewContext('('+literal+')');
const groups={total:['hamstrings','quads','chest','shoulders','back','calves','abs'],upper:['back','back','back','chest','shoulders','shoulders','shoulders'],lower:['quads','hamstrings','glutes','calves','quads'],arms:['biceps','triceps','biceps','triceps','biceps','shoulders']};
const plan=days.map(d=>({name:d.name,exercises:d.ex.filter(e=>!e.retired).map((e,i)=>({name:e.n,sets:e.sets,rmin:e.rmin,rmax:e.rmax||e.rmin,bodyweight:!!e.bodyweight,targetMuscle:groups[d.id][i],main:['total','upper','lower'].includes(d.id)&&i<4,rest:['total','upper','lower'].includes(d.id)&&i<4?120:90}))}));
const file='tools/studio-engine.js',source=fs.readFileSync(file,'utf8');
fs.writeFileSync(file,source.replace(/\/\* ROMAN PLAN START \*\/[\s\S]*?\/\* ROMAN PLAN END \*\//,'/* ROMAN PLAN START */\nvar romanPlan='+JSON.stringify(plan)+';\n/* ROMAN PLAN END */'));
console.log('Embedded public Roman template: '+plan.map(d=>d.exercises.length).join('/')+' exercises; no weights or history');
