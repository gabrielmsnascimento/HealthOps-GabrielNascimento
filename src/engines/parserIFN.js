import { ACTIVITY_CATALOG, FLIGHT_RE } from '../data/activityCatalog.js';

const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const DATE_RE = /^(\d{2})-([A-Za-z]{3})-(\d{4})\b/;
const TIME_RE = /^\d{2}:\d{2}$/;
const AIRPORT_RE = /^[A-Z]{3}$/;

export async function extractPdfText(file){
  if(!file) return '';
  if(file.type === 'text/plain') return await file.text();
  const buffer = await file.arrayBuffer();
  if(!window.pdfjsLib) throw new Error('PDF.js não carregou. Verifique a conexão e recarregue o app.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({data:buffer}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const rows = new Map();
    content.items.forEach(item=>{
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if(!rows.has(y)) rows.set(y,[]);
      rows.get(y).push({x,str:item.str});
    });
    const lines = [...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,items])=>items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n');
}

export function parseIFNRoster(text){
  const lines = String(text||'').split(/\n+/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const events=[]; let currentDate=null; let lastReport=null;
  for(const raw of lines){
    const dateMatch = raw.match(DATE_RE);
    let line = raw;
    if(dateMatch){
      currentDate = toISO(dateMatch[1], dateMatch[2], dateMatch[3]);
      line = raw.replace(DATE_RE,'').trim();
    }
    if(!currentDate) continue;
    if(!line || /^Roster Report|^Date |^GABRIEL|^FLYING HRS/i.test(line)) continue;
    const event = parseLine(currentDate, line, lastReport);
    if(event){
      events.push(event);
      if(event.report) lastReport = event.report;
    }
  }
  return { events, days: groupEventsByDay(events), rawText:text };
}

function parseLine(dateISO, line, inheritedReport){
  const tokens = line.split(' ').filter(Boolean);
  const flight = tokens.find(t=>FLIGHT_RE.test(t));
  const activityToken = findActivityToken(tokens);
  const firstTime = tokens.find(t=>TIME_RE.test(t));
  const airports = tokens.filter(t=>AIRPORT_RE.test(t));

  if(flight){
    const depIdx = tokens.findIndex((t,i)=>AIRPORT_RE.test(t) && TIME_RE.test(tokens[i+1]||''));
    const arrIdx = depIdx>=0 ? tokens.findIndex((t,i)=>i>depIdx+1 && AIRPORT_RE.test(t) && TIME_RE.test(tokens[i+1]||'')) : -1;
    const dep = depIdx>=0 ? tokens[depIdx] : airports[0] || '';
    const depTime = depIdx>=0 ? tokens[depIdx+1] : '';
    const arr = arrIdx>=0 ? tokens[arrIdx] : airports[1] || '';
    const arrTime = arrIdx>=0 ? tokens[arrIdx+1] : '';
    const report = line.match(/(\d{2}:\d{2})/)?.[1] || inheritedReport || '';
    return normalizeEvent({date:dateISO, kind:'FLIGHT', code:flight, label:'Voo', report, dep, depTime, arr, arrTime, raw:line});
  }

  if(activityToken){
    const meta = ACTIVITY_CATALOG[activityToken] || {};
    const times = tokens.filter(t=>TIME_RE.test(t));
    return normalizeEvent({date:dateISO, kind:meta.category || 'ACTIVITY', code:activityToken, label:meta.label || activityToken, report:firstTime || '', startTime:times[0] || '', endTime:times[times.length-1] || '', raw:line, meta});
  }

  if(firstTime && inheritedReport){
    return normalizeEvent({date:dateISO, kind:'TIME_ROW', code:'TIME_ROW', label:'Linha horária não classificada', report:firstTime, raw:line});
  }
  return null;
}

function findActivityToken(tokens){
  return tokens.find(t=>ACTIVITY_CATALOG[t]) || null;
}

function normalizeEvent(e){
  const meta = e.meta || ACTIVITY_CATALOG[e.code] || {};
  const countsAsDuty = e.kind === 'FLIGHT' ? true : Boolean(meta.countsAsDuty);
  const countsAsRest = Boolean(meta.countsAsRest);
  const isDayOff = Boolean(meta.countsAsDayOff);
  const durationHours = isDayOff ? 0 : estimateDuration(e);
  return {...e, countsAsDuty, countsAsRest, isDayOff, durationHours, reason: meta.reason || '', category: meta.category || e.kind};
}

function estimateDuration(e){
  if(e.kind === 'FLIGHT' && e.depTime && e.arrTime) return diffHours(e.date,e.depTime,e.arrTime);
  if(e.startTime && e.endTime && e.startTime !== e.endTime) return diffHours(e.date,e.startTime,e.endTime);
  return 0;
}

function diffHours(date, start, end){
  const a = new Date(`${date}T${start}:00`); let b = new Date(`${date}T${end}:00`);
  if(b<a) b.setDate(b.getDate()+1);
  return Math.round(((b-a)/36e5)*10)/10;
}

function groupEventsByDay(events){
  const map = new Map();
  for(const ev of events){
    if(!map.has(ev.date)) map.set(ev.date,{date:ev.date, events:[]});
    map.get(ev.date).events.push(ev);
  }
  return [...map.values()].map(day=>{
    const dutyHours = day.events.reduce((s,e)=>s+(e.countsAsDuty?e.durationHours:0),0);
    const flightHours = day.events.reduce((s,e)=>s+(e.kind==='FLIGHT'?e.durationHours:0),0);
    const hasDayOff = day.events.some(e=>e.isDayOff);
    const hasFlight = day.events.some(e=>e.kind==='FLIGHT');
    const hasStandby = day.events.some(e=>['AIRPORT_STANDBY','HOME_STANDBY'].includes(e.category));
    const hasTraining = day.events.some(e=>e.category==='TRAINING');
    const classification = hasDayOff ? 'Folga regulamentar' : hasFlight ? 'Voo' : hasStandby ? 'Reserva/Sobreaviso' : hasTraining ? 'Treinamento' : 'Atividade';
    return {...day, dutyHours:Math.round(dutyHours*10)/10, flightHours:Math.round(flightHours*10)/10, classification};
  }).sort((a,b)=>a.date.localeCompare(b.date));
}

function toISO(day, mon, year){
  const d = new Date(Number(year), MONTHS[mon], Number(day));
  return d.toISOString().slice(0,10);
}
