/* Human-editable plan templates. Only whitelisted plan structure is retained. */
var TemplateText=(function(){
  var groups={chest:'Brust',back:'Rücken',shoulders:'Schultern',biceps:'Bizeps',triceps:'Trizeps',forearms:'Unterarme',abs:'Bauch',glutes:'Gesäß',quads:'Vordere Oberschenkel',hamstrings:'Hintere Oberschenkel',calves:'Waden'};
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim()||String(s||'').toLowerCase().trim();}
  function name(v,label){if(typeof v!=='string'||!v.trim()||v.trim().length>80||/[\x00-\x1f\x7f]/.test(v))throw new Error(label+' braucht einen Namen mit 1–80 Zeichen ohne Zeilenumbruch.');return v.trim();}
  function number(v){if(!Number.isInteger(v)||v<1||v>99)throw new Error('Sätze und Wiederholungen müssen ganze Zahlen zwischen 1 und 99 sein.');return v;}
  function clean(value){
    if(!value||!Array.isArray(value.days)||!value.days.length||value.days.length>14)throw new Error('Eine Vorlage braucht 1–14 Trainingstage.');
    return {name:name(value.name,'Der Plan'),days:value.days.map(function(day){
      if(!day||!Array.isArray(day.exercises)||day.exercises.length>50)throw new Error('Ein Trainingstag darf höchstens 50 Übungen enthalten.');
      var seen=new Set();return {name:name(day.name,'Der Trainingstag'),exercises:day.exercises.map(function(e){
        if(!e||typeof e!=='object')throw new Error('Ungültige Übung.');
        if(e.empty)return {empty:true,targetMuscle:groups[e.targetMuscle]?e.targetMuscle:null};
        var n=name(e.name,'Die Übung'),key=norm(n);if(seen.has(key))throw new Error('Die Übung „'+n+'“ steht mehrfach im selben Trainingstag.');seen.add(key);
        var min=number(e.rmin),max=number(e.rmax==null?min:e.rmax);if(max<min)throw new Error('Die obere Wiederholungszahl darf nicht kleiner als die untere sein.');
        var row={name:n,sets:number(e.sets),rmin:min,rmax:max,bodyweight:!!e.bodyweight};
        if(typeof e.catalogueId==='string'&&/^wger-\d+$/.test(e.catalogueId))row.catalogueId=e.catalogueId;
        if(groups[e.targetMuscle])row.targetMuscle=e.targetMuscle;
        return row;
      })};
    })};
  }
  function escape(s){return s.replace(/\\/g,'\\\\').replace(/\|/g,'\\|');}
  function columns(s){var parts=[''];for(var i=0;i<s.length;i++){var c=s[i];if(c==='\\'&&(s[i+1]==='\\'||s[i+1]==='|'))parts[parts.length-1]+=s[++i];else if(c==='|')parts.push('');else parts[parts.length-1]+=c;}return parts.map(function(p){return p.trim();});}
  function stringify(value){var d=clean(value),lines=['MinMax-Vorlage: 1','Plan: '+d.name,'','# Übung | Sätze | Wiederholungen','# Optional: | Körpergewicht. Leerer Platz: Platz: Muskel','# Kommentarzeilen beginnen mit #. Zeichen | im Namen als \\| schreiben.'];
    d.days.forEach(function(day){lines.push('','['+day.name+']');day.exercises.forEach(function(e){lines.push(e.empty?'Platz: '+(groups[e.targetMuscle]||'Beliebig'):(/^(#|Übung:)/.test(e.name)?'Übung: ':'')+escape(e.name)+' | '+e.sets+' | '+(e.rmin===e.rmax?e.rmin:e.rmin+'-'+e.rmax)+(e.bodyweight?' | Körpergewicht':''));});});var text=lines.join('\n')+'\n';if(new Blob([text]).size>131072)throw new Error('Die Textvorlage ist zu groß (maximal 128 KB).');return text;
  }
  function parse(text,studio){
    if(typeof text!=='string'||text.length>131072)throw new Error('Die Textvorlage ist zu groß (maximal 128 KB).');
    var result={name:'',days:[]},day=null,header=false;
    text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/).forEach(function(raw,index){var s=raw.trim();if(!s||s[0]==='#')return;var explicit=s.startsWith('Übung:');if(explicit)s=s.slice(6).trim();try{
      if(!header){if(s!=='MinMax-Vorlage: 1')throw new Error('Die erste Inhaltszeile muss „MinMax-Vorlage: 1“ lauten.');header=true;return;}
      if(!explicit&&s.startsWith('Plan:')&&(!day||!s.includes('|'))){if(day||result.name)throw new Error('„Plan:“ darf nur einmal vor den Trainingstagen stehen.');result.name=name(s.slice(5),'Der Plan');return;}
      if(!explicit&&s[0]==='['&&s.endsWith(']')){if(!result.name)throw new Error('Vor den Tagen fehlt „Plan: Dein Planname“.');day={name:name(s.slice(1,-1),'Der Trainingstag'),exercises:[]};result.days.push(day);return;}
      if(!day)throw new Error('Vor den Übungen fehlt ein Trainingstag in eckigen Klammern.');
      if(!explicit&&s.startsWith('Platz:')&&!s.includes('|')){var muscle=s.slice(6).trim(),id=Object.keys(groups).find(function(k){return norm(k)===norm(muscle)||norm(groups[k])===norm(muscle);});if(!id&&norm(muscle)!=='beliebig')throw new Error('Unbekannter Muskel für den leeren Platz.');day.exercises.push({empty:true,targetMuscle:id||null});return;}
      var p=columns(s);if(p.length<3||p.length>4)throw new Error('Erwartet: Übungsname | Sätze | Wiederholungen.');
      if(!/^\d{1,2}$/.test(p[1]))throw new Error('Die Satzanzahl muss eine ganze Zahl zwischen 1 und 99 sein.');
      var reps=p[2].match(/^(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?$/);if(!reps)throw new Error('Wiederholungen als Zahl oder Bereich schreiben, z. B. 10 oder 8-12.');
      if(p.length===4&&norm(p[3])!=='korpergewicht')throw new Error('Die vierte Spalte darf nur „Körpergewicht“ enthalten.');
      var e={name:name(p[0],'Die Übung'),sets:number(Number(p[1])),rmin:number(Number(reps[1])),rmax:number(Number(reps[2]||reps[1])),bodyweight:p.length===4};
      if(e.rmax<e.rmin)throw new Error('Der Wiederholungsbereich ist vertauscht.');if(day.exercises.some(function(x){return !x.empty&&norm(x.name)===norm(e.name);}))throw new Error('Diese Übung steht bereits in diesem Tag.');
      var match=studio&&studio.catalogue.find(function(x){return norm(x.name)===norm(e.name);});if(match){e.catalogueId=match.id;e.targetMuscle=match.muscles[0];e.bodyweight=e.bodyweight||match.equipment==='bodyweight';}day.exercises.push(e);
    }catch(e){throw new Error('Zeile '+(index+1)+': '+e.message);}});
    if(!header)throw new Error('Die Datei enthält keine MinMax-Vorlage.');return clean(result);
  }
  function library(items){if(!Array.isArray(items))return [];var ids=new Set();return items.flatMap(function(t){try{if(!t||typeof t.id!=='string'||!/^tpl-[a-zA-Z0-9_-]{1,80}$/.test(t.id)||ids.has(t.id))return [];var item=t.deleted?{id:t.id,deleted:true}:Object.assign({id:t.id},clean(t));ids.add(t.id);return [item];}catch(e){return [];}});}
  function merge(local,remote,preferLocal){var map=new Map();library(local).forEach(function(t){map.set(t.id,t);});library(remote).forEach(function(t){if(!preferLocal||!map.has(t.id))map.set(t.id,t);});return Array.from(map.values());}
  return {normalize:norm,clean:clean,stringify:stringify,parse:parse,library:library,merge:merge};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TemplateText;
