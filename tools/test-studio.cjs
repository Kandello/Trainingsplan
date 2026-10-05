const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const S=require('../studio-data.js');
assert.ok(S.catalogue.length>=500);assert.equal(new Set(S.catalogue.map(e=>e.id)).size,S.catalogue.length);
assert.equal(new Set(S.catalogue.map(e=>S.normalize(e.name))).size,S.catalogue.length);
assert.equal(S.templates.length,10);
assert.ok(S.search('bench press','chest').length);assert.ok(S.search('brustpresse','chest','machine').length);
assert.ok(S.search('','','').every(e=>e.authors.length&&e.licenseUrl&&e.setup&&e.cues.length));
for(const days of [1,2,3,4,5])for(const goal of ['muscle','strength','max'])for(const level of ['beginner','intermediate','expert'])for(const years of [0,.5,3])for(const minutes of [30,120])for(const preference of ['machine','mixed','free']){
 const input={days,goal,level,years,minutes,preference,priorities:['chest','quads','back']},plan=S.generate(input);
 assert.equal(plan.days.length,days);assert.deepEqual(plan,S.generate(input));
 const primary=new Set();plan.days.forEach(day=>{assert.ok(day.exercises.length);assert.ok(S.estimate(day,input)<=minutes,JSON.stringify({input,day}));assert.equal(new Set(day.exercises.map(e=>e.catalogueId)).size,day.exercises.length);day.exercises.forEach(row=>{const e=S.byId[row.catalogueId];assert.ok(e.standard);if(years<1||level==='beginner'){assert.ok(e.beginner);assert.ok(row.sets<=2);}assert.ok(row.sets>=1&&row.sets<=4);assert.ok(row.rmin>0&&row.rmax>=row.rmin);primary.add(e.muscles[0]);});});
 ['chest','back','quads','hamstrings','glutes'].forEach(m=>assert.ok(primary.has(m),m));
}
S.templates.forEach(t=>{const input={days:t.days[0]},filled=S.create(t.id,input,false),empty=S.create(t.id,input,true);assert.equal(filled.days.length,t.days[0]);assert.ok(empty.days.every(d=>d.exercises.every(e=>e.empty&&e.targetMuscle)));});
assert.equal(S.config({days:99,minutes:1,priorities:['chest','chest','wrong','back','quads','abs']}).priorities.length,3);
console.log('PASS: 521-entry catalogue, aliases, licenses, ten templates and 810 deterministic generator profiles');

const raw=fs.readFileSync('index.html','utf8'),script=raw.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const key='trainingsplan.v1.builderDraft';
function app(saved){const dom=new JSDOM(raw,{url:'https://kandello.github.io/Trainingsplan/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.CSS={escape:s=>s};w.eval(fs.readFileSync('studio-data.js','utf8'));if(saved)Object.keys(saved).forEach(k=>w.localStorage.setItem(k,saved[k]));w.eval(script.replace('Sync.init();',"Sync.state.status='ready';renderChip();").replace(/\}\)\(\);\s*$/,'window.testEval=expression=>eval(expression);})();'));return {dom,w,get:s=>w.testEval(s),click:text=>{const b=[...w.document.querySelectorAll('#studio-dialog button')].find(b=>b.textContent.trim()===text);assert.ok(b,'Missing button '+text);b.click();},snapshot:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))};}
(async()=>{
const sessions=JSON.stringify([{date:'2026-10-03',dayId:'arms',entries:{'ad-oh-triceps':{w:30,t:'hold'}}}]);
const a=app({'trainingsplan.v1.sessions':sessions});a.get('openNewPlan()');assert.ok(a.w.document.getElementById('studio-dialog').open);
a.click('Vorlage wählenZehn Strukturen mit verständlichen Vor- und Nachteilen.');
let toggles=a.w.document.querySelectorAll('.studio-template-toggle');assert.equal(toggles.length,10);assert.equal(a.w.document.querySelector('#studio-footer .studio-primary').disabled,true);toggles[0].click();assert.equal(a.w.document.querySelectorAll('.studio-template.is-open').length,1);assert.equal(a.w.document.querySelector('.studio-template.is-open').querySelector('.studio-template-toggle strong').textContent,'Ganzkörper');assert.equal(a.w.document.querySelector('.studio-template-toggle').getAttribute('aria-expanded'),'true');a.w.document.querySelectorAll('.studio-template-toggle')[1].click();assert.equal(a.w.document.querySelectorAll('.studio-template.is-open').length,1);a.w.document.querySelectorAll('.studio-template-toggle')[1].click();assert.equal(a.w.document.querySelectorAll('.studio-template.is-open').length,0);
a.w.document.querySelectorAll('.studio-template-toggle')[0].click();a.click('Vorlage bearbeiten');a.click('Selbst füllenMuskelhinweise geben jedem leeren Platz eine Richtung.');assert.equal(a.get('userPlans.length'),0);assert.ok(a.get('StudioUI.state.draft.days[0].exercises[0].empty'));
a.click('Übung wählen');const plus=[...a.w.document.querySelectorAll('.studio-result-actions button')].find(b=>b.getAttribute('aria-label')==='Brustpresse auswählen');assert.ok(plus);plus.click();assert.equal(a.get('StudioUI.state.draft.days[0].exercises[0].catalogueId'),'wger-129');
const saved=a.snapshot();a.dom.window.close();const b=app(saved);b.get('openNewPlan()');assert.equal(b.get('StudioUI.state.screen'),'editor');assert.equal(b.get('StudioUI.state.draft.days[0].exercises[0].catalogueId'),'wger-129');assert.equal(b.get('userPlans.length'),0);b.click('Plan speichern');assert.equal(b.get('userPlans.length'),1);assert.equal(b.w.localStorage.getItem('trainingsplan.v1.sessions'),sessions);assert.equal(b.get('activePlanId'),b.get('userPlans[0].id'));assert.equal(b.get('userPlans[0].builder.templateId'),'full');const cid=b.get('userPlans[0].days[0].base[0]');assert.equal(b.get('customEx['+JSON.stringify(cid)+'].catalogueId'),'wger-129');
b.get('StudioUI.openPicker('+JSON.stringify(cid)+')');assert.ok(b.w.document.querySelector('.studio-results'));b.w.document.querySelector('.studio-result-actions button').click();assert.ok(b.w.document.querySelector('.studio-info-card.cues'));assert.ok(b.w.document.querySelector('.studio-attribution a'));b.click('Zurück');
b.get('document.getElementById("studio-close").click()');b.get('openNewPlan()');b.click('Plan empfehlenSechs kurze Fragen. Ein passender Startplan.');b.click('Weiter');b.click('Ich starte gerade');assert.equal(b.get('StudioUI.state.input.years'),0);for(let i=0;i<4;i++)b.click('Weiter');assert.equal(b.get('StudioUI.state.step'),5);b.click('Plan erstellen');assert.equal(b.get('StudioUI.state.draft.days.length'),3);
b.click('Plan speichern');assert.equal(b.get('userPlans.length'),2);assert.equal(b.w.localStorage.getItem('trainingsplan.v1.sessions'),sessions);
assert.notEqual(b.get('userPlans[0].days[0].base[0]'),b.get('userPlans[1].days[0].base[0]'));

let exported;b.w.URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};b.w.URL.revokeObjectURL=()=>{};b.w.HTMLAnchorElement.prototype.click=()=>{};b.get('exportData()');
const exportedText=await new Promise(resolve=>{const reader=new b.w.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(exported);});
const payload=JSON.parse(exportedText);assert.equal(payload.version,3);assert.equal(payload.plan.plans.length,2);assert.ok(payload.plan.plans.every(p=>p.builder));
const imported=app();imported.get('importData()');let input=imported.w.document.querySelector('input[type=file]');
// importData creates a detached input; intercept createElement for the next call.
const originalCreate=imported.w.document.createElement.bind(imported.w.document);imported.w.document.createElement=function(tag){const node=originalCreate(tag);if(tag==='input')input=node;return node;};
imported.get('importData()');Object.defineProperty(input,'files',{value:[new imported.w.File([exportedText],'backup.json',{type:'application/json'})]});input.dispatchEvent(new imported.w.Event('change'));await new Promise(r=>setTimeout(r,30));
assert.equal(imported.get('userPlans.length'),2);assert.equal(imported.get('userPlans[0].builder.templateId'),'full');assert.equal(imported.get('customEx['+JSON.stringify(cid)+'].catalogueId'),'wger-129');assert.equal(imported.get('customEx['+JSON.stringify(payload.plan.plans[0].days[0].base[1])+'].targetMuscle'),'back');assert.equal(imported.get('sessions.length'),1);
const legacy=JSON.stringify({sessions:payload.sessions,plan:{order:{},spec:{},exercises:{}}});imported.get('importData()');Object.defineProperty(input,'files',{value:[new imported.w.File([legacy],'legacy.json')],configurable:true});input.dispatchEvent(new imported.w.Event('change'));await new Promise(r=>setTimeout(r,30));assert.equal(imported.get('sessions.length'),1);assert.equal(imported.get('userPlans.length'),2);
imported.dom.window.close();
b.get('openNewPlan()');b.click('Plan empfehlenSechs kurze Fragen. Ein passender Startplan.');b.get('document.getElementById("studio-back").click()');b.click('Entwurf verwerfen');b.w.document.getElementById('confirm-no').click();await new Promise(r=>setTimeout(r,0));assert.equal(b.get('StudioUI.state.origin'),'interview');b.click('Entwurf verwerfen');b.w.document.getElementById('confirm-yes').click();await new Promise(r=>setTimeout(r,0));assert.equal(b.get('StudioUI.state.origin'),'');assert.equal(b.get('userPlans.length'),2);b.dom.window.close();
console.log('PASS: accordion, empty templates, picker, info/cues, local draft/reload, interview, commit, metadata and unchanged training history');

})().catch(e=>{console.error(e);process.exitCode=1;});
