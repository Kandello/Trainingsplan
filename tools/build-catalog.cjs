// Reproducible offline snapshot. Input is downloaded separately from wger.
const fs=require('fs'), {JSDOM}=require('jsdom');
const source=JSON.parse(fs.readFileSync('artifacts/wger-source.json','utf8').replace(/^\uFEFF/,''));
const licenses=Object.fromEntries(source.results.map(e=>[e.license.id,e.license]));
const document=new JSDOM('').window.document;
const text=value=>{const el=document.createElement('div');el.innerHTML=value||'';return el.textContent.replace(/\s+/g,' ').trim();};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
const muscleIds={1:'biceps',2:'shoulders',3:'chest',4:'chest',5:'triceps',6:'abs',7:'calves',8:'glutes',9:'back',10:'quads',11:'hamstrings',12:'back',13:'biceps',14:'abs',15:'calves'};
const categories={Abs:'abs',Arms:'biceps',Back:'back',Calves:'calves',Chest:'chest',Legs:'quads',Shoulders:'shoulders'};
const curated={
129:['Brustpresse','chest','machine','chest',true,true],135:['Butterfly-Maschine','chest','machine','pecdeck',true,false],
75:['Kurzhantel-Bankdrücken','chest','dumbbell','dumbbell',false,true],73:['Langhantel-Bankdrücken','chest','barbell','barbell',false,true],537:['Kurzhantel-Schrägbankdrücken','chest','dumbbell','dumbbell',false,true],
355:['Latzug','back','machine','pulldown',true,true],512:['Sitzendes Kabelrudern','back','cable','row',true,true],81:['Einarmiges Kurzhantelrudern','back','dumbbell','dumbbell',false,true],83:['Langhantelrudern','back','barbell','barbell',false,true],310:['Brustgestütztes Kurzhantelrudern','back','dumbbell','dumbbell',true,true],
543:['Schulterpresse an der Maschine','shoulders','machine','shoulder',true,true],567:['Kurzhantel-Schulterdrücken','shoulders','dumbbell','dumbbell',false,true],348:['Kurzhantel-Seitheben','shoulders','dumbbell','dumbbell',true,false],139:['Reverse Butterfly','shoulders','machine','pecdeck',true,false],
371:['Beinpresse','quads','machine','legpress',true,true],369:['Beinstrecker','quads','machine','extension',true,false],203:['Goblet-Kniebeuge','quads','dumbbell','dumbbell',true,true],615:['Langhantel-Kniebeuge','quads','barbell','barbell',false,true],
364:['Sitzender Beinbeuger','hamstrings','machine','curl',true,true],365:['Liegender Beinbeuger','hamstrings','machine','curl',true,true],507:['Rumänisches Kreuzheben','hamstrings','barbell','barbell',false,true],
1528:['Glute-Drive-Maschine','glutes','machine','hip',true,true],292:['Hüftbrücke','glutes','bodyweight','bodyweight',true,true],1642:['Kurzhantel-Hip-Thrust','glutes','dumbbell','dumbbell',false,true],
590:['Sitzendes Wadenheben','calves','machine','calf',true,false],622:['Stehendes Wadenheben','calves','machine','calf',true,false],
95:['Bizepscurl am Kabel','biceps','cable','cable',true,false],92:['Kurzhantel-Bizepscurl','biceps','dumbbell','dumbbell',true,false],91:['Langhantel-Bizepscurl','biceps','barbell','barbell',false,false],
659:['Trizepsdrücken am Seil','triceps','cable','cable',true,false],211:['Kurzhantel-Trizepsstrecken','triceps','dumbbell','dumbbell',false,false],
172:['Crunch-Maschine','abs','machine','abs',true,false],167:['Crunch','abs','bodyweight','bodyweight',true,false],173:['Kabel-Crunch','abs','cable','cable',true,false],48:['Handgelenkcurl','forearms','barbell','barbell',true,false]
};
const benefits={chest:'Unterstützt Drückbewegungen und das Schieben im Alltag.',back:'Unterstützt Zugbewegungen und eine belastbare Rückenmuskulatur.',shoulders:'Hilft beim Heben und Tragen über Schulterhöhe.',biceps:'Unterstützt das Beugen der Arme und das Heranziehen von Lasten.',triceps:'Unterstützt das Strecken der Arme und Druckbewegungen.',forearms:'Unterstützt Griffkraft und das sichere Halten von Lasten.',abs:'Unterstützt die Stabilisierung des Rumpfes bei Belastung.',glutes:'Unterstützt Hüftstreckung, Aufstehen und Treppensteigen.',quads:'Unterstützt Knie­streckung, Aufstehen und Treppensteigen.',hamstrings:'Unterstützt Kniebeugung und Hüftstreckung.',calves:'Unterstützt Abdrücken beim Gehen und die Kontrolle im Sprunggelenk.'};
const setup={machine:'Sitz, Polster und Startposition auf deine Körpergröße einstellen. Bewegliche Gelenke an der vorgesehenen Geräteachse ausrichten; Gewicht und Sicherungen prüfen.',cable:'Passenden Griff und Kabelhöhe wählen. Karabiner prüfen und stabil stehen oder sitzen.',dumbbell:'Passende Kurzhanteln wählen und sicher aufnehmen. Falls nötig die Bank einstellen; genug Platz für die Bewegung lassen.',barbell:'Scheiben sichern und die Ablage auf passende Höhe einstellen. Bei Übungen unter der Hantel geeignete Sicherheitsablagen nutzen.',bodyweight:'Eine stabile, rutschfeste Unterlage und genügend Bewegungsraum wählen.',kettlebell:'Die Kettlebell sicher greifen; ausreichend Abstand zu Menschen und Gegenständen halten.',band:'Band und Befestigung auf Schäden und sicheren Halt prüfen.'};
const cues={
129:['Griffe ungefähr auf mittlerer Brusthöhe.','Schulterblätter an der Lehne lassen.','Kontrolliert drücken, ohne die Schultern hochzuziehen.'],
371:['Füße stabil aufstellen, Knie folgen den Fußspitzen.','Nur so tief absenken, wie das Becken an der Lehne bleibt.','Kontrolliert drücken, Knie nicht ruckartig durchstrecken.'],
355:['Brust leicht anheben, Schultern von den Ohren weg.','Ellbogen nach unten zur Seite führen.','Stange vor dem Körper ziehen, ohne Schwung.'],
512:['Rumpf ruhig halten.','Ellbogen kontrolliert nach hinten führen.','Nicht mit dem Oberkörper zurückreißen.'],
364:['Knie an der Geräteachse ausrichten.','Oberschenkelpolster passend einstellen.','Beugen und zurückführen, ohne das Becken anzuheben.'],
365:['Knie an der Geräteachse ausrichten.','Becken auf dem Polster lassen.','Beine kontrolliert beugen, nicht ins Hohlkreuz ausweichen.'],
369:['Knie an der Geräteachse ausrichten.','Rücken an der Lehne lassen.','Kontrolliert strecken und langsam zurückführen.'],
543:['Griffe etwa auf Schulterhöhe einstellen.','Rumpf stabil und Rücken an der Lehne lassen.','Drücken ohne die Schultern hochzuziehen.'],
507:['Hüfte nach hinten schieben, Knie leicht gebeugt.','Hantel dicht an den Beinen führen.','Nur so weit absenken, wie der Rücken kontrolliert bleibt.'],
615:['Fußsohlen belastet lassen.','Knie folgen den Fußspitzen.','Rumpf stabil halten und kontrolliert aufstehen.'],
659:['Ellbogen nah am Körper lassen.','Arme strecken, ohne die Schultern mitzubewegen.','Langsam zurückführen.'],
167:['Rippen zum Becken führen.','Nacken entspannt lassen.','Nicht am Kopf ziehen.']};
function infer(e,n){
 const raw=e.equipment.map(x=>x.name).join(' ').toLowerCase(), a=n.toLowerCase();
 if(/kurzhantel|\bkh\b|dumbbell/.test(a+' '+raw))return 'dumbbell';
 if(/kabel|seil|cable/.test(a+' '+raw))return 'cable';
 if(/langhantel|\blh\b|sz-|smith|multipresse|barbell/.test(a+' '+raw))return 'barbell';
 if(/kettlebell/.test(a+' '+raw))return 'kettlebell';
 if(/band|expander/.test(a+' '+raw))return 'band';
 if(/maschine|gerät|brustpresse|chest press|hammer-strength|beinpresse|leg press|beinstreck|beinbeug|butterfly|latzug|wadenheben.*sitz|glute drive/.test(a))return 'machine';
 if(/bodyweight|gym mat|none|pull-up/.test(raw)||/liegestütz|klimmz|crunch|plank|hüftbrücke|sit.?up|sit ups|beinheben|beine heben|deadbug|nordic curl|superman|flutter kicks|copenhagen|einbeinige knie|kosaken/.test(a))return 'bodyweight';
 if(/kreuzheben|deadlift|überkopfkniebeuge|push press|trap-bar|rack deadlift/.test(a))return 'barbell';
 return 'other';
}
function imageFor(n,eq){if(eq==='other')return 'equipment';if(eq!=='machine')return eq;const s=n.toLowerCase();return /beinpresse|hackenschmidt/.test(s)?'legpress':/beinstreck/.test(s)?'extension':/beinbeug/.test(s)?'curl':/latzug/.test(s)?'pulldown':/rudern/.test(s)?'row':/schulter/.test(s)?'shoulder':/waden/.test(s)?'calf':/glute|hip|hüft/.test(s)?'hip':/crunch|bauch/.test(s)?'abs':/butterfly|pec/i.test(s)?'pecdeck':/brust/i.test(s)?'chest':'equipment';}
const seen=new Set(), catalogue=[];
for(const e of source.results){
 const de=e.translations.find(t=>t.language===1), en=e.translations.find(t=>t.language===2);
 if(!de||e.category.name==='Cardio'||!(de.license_author||e.license_author||(de.author_history||[]).length))continue;
 let name=text(de.name).replace(/\bKH\b/g,'mit Kurzhanteln').replace(/\bLH\b/g,'mit Langhantel').replace(/\bMP\b/g,'an der Multipresse').replace(/Einbenig/gi,'einbeinig');
 if(/dehn|stretch|mobilit|meditation|laufen|joggen|sprung|sprünge|jump|burpee|hold|plank|stabilisation|balance|walk|standwaage|unterarmstütz|halten|stützhalt|wandsitz|hampelmann|hängen|limber|snap down|wall angels|schulterdislok|recruitment pulls|steigungen|YWT|upper back|tuck l-sit/i.test(name)&&!curated[e.id])continue;
 const c=curated[e.id];if(c)name=c[0];
 name=name.replace(/ (links|rechts)$/i,'');
 const key=norm(name);if(seen.has(key))continue;seen.add(key);
 let muscles=[...new Set(e.muscles.map(m=>muscleIds[m.id]).filter(Boolean))];
 if(c)muscles=[c[1],...muscles.filter(m=>m!==c[1])];
 if(/handgelenk|unterarm/.test(name.toLowerCase()))muscles=['forearms'];
 if(!muscles.length)muscles=[/trizeps/i.test(name)?'triceps':categories[e.category.name]];
 const equipment=c?c[2]:infer(e,name), description=text(de.description);
 catalogue.push({id:'wger-'+e.id,name,aliases:[en?.name||'',...de.aliases.map(a=>a.alias||a.name||'')].filter(Boolean),muscles,
 secondary:[...new Set(e.muscles_secondary.map(m=>muscleIds[m.id]).filter(m=>m&&!muscles.includes(m)))],equipment,image:c?c[3]:imageFor(name,equipment),
 standard:!!c,beginner:c?c[4]:false,main:c?c[5]:false,
 description:description||'Die Zielmuskeln werden bei dieser Kraftübung gegen einen Widerstand belastet.',setup:setup[equipment]||'Benötigtes Gerät und sichere Ausgangsposition anhand der Übungsanleitung prüfen. Die Geräteform kann je nach Studio abweichen.',
 cues:cues[e.id]||['Bewegung ruhig und kontrolliert ausführen.','Eine stabile Ausgangsposition halten.','Bewegungsumfang ohne Ausweichbewegungen wählen.'],benefit:benefits[muscles[0]],
 source:'https://wger.de/en/exercise/'+e.id+'/view/',authors:[...new Set([de.license_author,...(de.author_history||[]),e.license_author].filter(Boolean))],
 license:(licenses[de.license]||e.license).short_name,licenseUrl:(licenses[de.license]||e.license).url,
 classificationLicense:de.license!==e.license.id?{name:e.license.short_name,url:e.license.url}:null,
 tutorial:c?'https://wger.de/en/exercise/'+e.id+'/view/':null});
}
if(catalogue.length<500)throw Error('Only '+catalogue.length+' qualified entries');
catalogue.sort((a,b)=>a.name.localeCompare(b.name,'de'));
fs.writeFileSync('studio-data.js','/* Offline wger exercise snapshot; entry-specific attribution and licenses below.\n * Adaptations: German normalization, equipment/muscle classification, own cues. */\n(function(root){"use strict";\nvar catalogue='+JSON.stringify(catalogue)+';\n'+fs.readFileSync('tools/studio-engine.js','utf8')+'\n})(typeof window!=="undefined"?window:globalThis);\n');
console.log('Built '+catalogue.length+' exercises; '+catalogue.filter(e=>e.standard).length+' curated standards');
