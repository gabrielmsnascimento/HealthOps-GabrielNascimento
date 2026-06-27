const MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const pad=n=>String(n).padStart(2,'0');
const hmToMin=h=>{if(!h||!/^\d{1,2}:\d{2}/.test(h))return null;let [a,b]=h.match(/\d{1,2}:\d{2}/)[0].split(':').map(Number);return a*60+b};
const diff=(a,b)=>{if(a==null||b==null)return 0;let d=b-a;while(d<0)d+=1440;return d};
function ymdFrom(s){const m=s.match(/(\d{2})-([A-Z][a-z]{2})-(\d{4})/);if(!m)return null;return `${m[3]}-${pad(MON[m[2]]+1)}-${m[1]}`}
function brDate(ymd){const [y,m,d]=ymd.split('-');return `${d}/${m}`}
export async function extractPdfText(file){
 const buf=await file.arrayBuffer();
 if(!window.pdfjsLib){const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';document.head.appendChild(script);await new Promise((res,rej)=>{script.onload=res;script.onerror=rej});pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
 const pdf=await pdfjsLib.getDocument({data:buf}).promise;let out=[];
 for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();const items=content.items.map(it=>({s:it.str,x:it.transform[4],y:Math.round(it.transform[5])}));
  const groups={};items.forEach(it=>{if(!it.s.trim())return;(groups[it.y]??=[]).push(it)});
  Object.keys(groups).sort((a,b)=>b-a).forEach(y=>out.push(groups[y].sort((a,b)=>a.x-b.x).map(i=>i.s).join(' ').replace(/\s+/g,' ')));
 }
 return out.join('\n');
}
export function parseRoster(text){
 const clean=text.replace(/[\u0000-\u001f\uFFFE]/g,' ').replace(/\s+/g,' ');
 const start=clean.match(/Roster Report\s+([0-9]{2}-[A-Za-z]{3}-[0-9]{4})\s*(?:to)?\s*([0-9]{2}-[A-Za-z]{3}-[0-9]{4})/);
 let monthKey=start?ymdFrom(start[1]).slice(0,7):new Date().toISOString().slice(0,7);
 const dateRegex=/(\d{2}-[A-Z][a-z]{2}-\d{4})/g; let positions=[]; let m;
 while((m=dateRegex.exec(clean))) positions.push({i:m.index,date:m[1]});
 let rows=[];
 for(let i=0;i<positions.length;i++){const chunk=clean.slice(positions[i].i, positions[i+1]?.i || clean.length);const ymd=ymdFrom(positions[i].date);if(!ymd)continue; rows.push(...parseChunk(ymd,chunk));}
 const journeys=groupJourneys(rows);
 return {monthKey,rows,journeys,summary:summarize(journeys)};
}
function parseChunk(date,chunk){
 const out=[];
 const special=chunk.match(/\b(DO|DR|VC|ASB|HSB|HSBE|R320|CBF|EMER|CRMBSB|MCK|C32F)\b/g)||[];
 if(special.length && !/\bLA\d{4}\b/.test(chunk)){
   const code=special[0]; const times=[...chunk.matchAll(/\b\d{1,2}:\d{2}(?:\(\+\d\))?/g)].map(x=>x[0]);
   out.push({date,type:code==='DO'||code==='DR'?'rest':code==='VC'?'vacation':code.startsWith('HS')||code==='ASB'?'standby':'training',code,report:times[0]||null,dep:times[1]||times[0]||null,arr:times.at(-2)||null,debrief:times.at(-1)||null,fh:0,dh:durationFromTimes(times[0],times.at(-1))});
   return out;
 }
 const re=/((?:\d{1,2}:\d{2}(?:\(\+\d\))?)?\s*)(LA\d{4}|MCK|C32F)\s+(?:CC\s+)?(OP|PS)?\s*([A-Z]{3})\s+(\d{1,2}:\d{2}(?:\(\+\d\))?)\s+([A-Z]{3})\s+(\d{1,2}:\d{2}(?:\(\+\d\))?)(?:\s+(\d{1,2}:\d{2}(?:\(\+\d\))?))?(?:\s+(\d{2}:\d{2}))?/g;
 let mm; while((mm=re.exec(chunk))){const report=mm[1]?.trim()||null;const code=mm[2];const op=mm[3]||'';const depApt=mm[4],dep=mm[5],arrApt=mm[6],arr=mm[7],debrief=mm[8]||null,fhTxt=mm[9]||null;out.push({date,type:code.startsWith('LA')?'flight':'training',code,op,report,depApt,dep,arrApt,arr,debrief,fh:fhTxt?durationToHours(fhTxt):durationFromTimes(dep,arr),dh:0});}
 return out;
}
function durationToHours(s){const [h,m]=s.split(':').map(Number);return +(h+m/60).toFixed(2)}
function durationFromTimes(a,b){return +(diff(hmToMin(a),hmToMin(b))/60).toFixed(2)}
function groupJourneys(rows){
 const journeys=[];let cur=null;
 rows.forEach(r=>{
  if(r.type==='rest'||r.type==='vacation'){journeys.push({date:r.date,type:r.type,label:r.type==='vacation'?'Férias/VC':'Folga regulamentar',events:[r],report:r.report,fh:0,dh:0});return;}
  const startsNew=!!r.report || !cur || cur.type!==r.type || cur.date!==r.date || (cur.events.length&&diff(hmToMin(cur.events.at(-1).arr),hmToMin(r.dep))>360);
  if(startsNew){cur={date:r.date,type:r.type,label:r.type==='standby'?'Reserva/Sobreaviso':r.type==='training'?'Treinamento':'Jornada de voo',events:[],report:r.report||r.dep,fh:0,dh:0};journeys.push(cur)}
  cur.events.push(r);cur.fh=+(cur.fh+(r.type==='flight'&&r.op!=='PS'?r.fh:0)).toFixed(2);cur.dh=estimateDuty(cur);
 });
 return journeys.map((j,i)=>({...j,id:`J${i+1}`,debrief:lastDebrief(j),reg:reg(j)}));
}
function lastDebrief(j){const e=j.events.at(-1);return e?.debrief||e?.arr||null}
function estimateDuty(j){const a=hmToMin(j.report);const e=j.events.at(-1);if(a==null||!e)return 0;const end=hmToMin(e.debrief||e.arr);return +(diff(a,end)/60).toFixed(2)}
function reg(j){if(j.type!=='flight')return {};const intl=j.events.some(e=>/^LA8/.test(e.code));const last=j.events.at(-1);const cut=last?.arr;const extra=intl?45:30;let endMin=hmToMin(cut);return {postCutMin:extra,end: endMin==null?null:`${pad(Math.floor(((endMin+extra)%1440)/60))}:${pad((endMin+extra)%60)}`}}
function summarize(js){return{days:new Set(js.map(j=>j.date)).size,flight:+js.reduce((a,j)=>a+j.fh,0).toFixed(1),duty:+js.reduce((a,j)=>a+j.dh,0).toFixed(1),rests:js.filter(j=>j.type==='rest'||j.type==='vacation').length}}
export const fmt={brDate};
