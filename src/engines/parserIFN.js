import { ACTIVITY_CATALOG, FLIGHT_RE, activityMeta } from '../data/activityCatalog.js';

const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const DATE_RE = /^(\d{2})-([A-Za-z]{3})-(\d{4})\b/;
const TIME_RE = /^\d{2}:\d{2}$/;
const AIRPORT_RE = /^[A-Z]{3}$/;
const PURE_FLIGHT_RE = /^LA\d{3,4}$/;
const PAIRING_FLIGHT_RE = /^(LA\d{3,4})\//;

export async function extractPdfText(file){
  if(!file) return '';
  if(file.type === 'text/plain' || file.name?.toLowerCase().endsWith('.txt')) return await file.text();
  const buffer = await file.arrayBuffer();
  if(!window.pdfjsLib) throw new Error('PDF.js não carregou. Recarregue o app com internet ativa.');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({data:buffer}).promise;
  const pages=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map();
    for(const item of content.items){
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if(!rows.has(y)) rows.set(y, []);
      rows.get(y).push({x, str:item.str});
    }
    const lines = [...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,items])=>items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n');
}

export function parseIFNRoster(text){
  const rawLines = String(text||'').split(/\n+/).map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
  const rows = mergeRosterRows(rawLines);
  const events = [];
  let currentReport = null;
  for(const row of rows){
    const parsed = parseRosterRow(row, currentReport);
    if(parsed){
      if(Array.isArray(parsed)) events.push(...parsed); else events.push(parsed);
      const last = Array.isArray(parsed) ? parsed[parsed.length-1] : parsed;
      if(last?.reportTime) currentReport = last.reportTime;
    }
  }
  const days = groupEventsByDay(events);
  return {events, days, rows, rawText:text};
}

function mergeRosterRows(lines){
  const rows=[]; let current=null;
  for(const line of lines){
    if(/^Roster Report|^Date\s|^GABRIEL|^FLYING HRS|^Pairing\//i.test(line)) continue;
    if(DATE_RE.test(line)){
      if(current) rows.push(current);
      current=line;
    }else if(current){
      // Continuações curtas do Pairing/Activity quebrado, ex.: 20-P
      if(/^\d{2}-P$/.test(line) || /^\(\+1\)$/.test(line)) current += ' ' + line;
      else if(PURE_FLIGHT_RE.test(line.split(' ')[0]) || TIME_RE.test(line.split(' ')[0]) || ACTIVITY_CATALOG[line.split(' ')[0]]){
        rows.push(current); current = current.replace(DATE_RE, current.match(DATE_RE)?.[0] || '') + ' ' + line;
      }else current += ' ' + line;
    }
  }
  if(current) rows.push(current);
  return rows;
}

function parseRosterRow(row, inheritedReport){
  const dm = row.match(DATE_RE); if(!dm) return null;
  const date = toISO(dm[1], dm[2], dm[3]);
  const line = row.replace(DATE_RE,'').replace(/\(\+1\)/g,'(+1)').trim();
  const tokens = line.split(' ').filter(Boolean);
  if(!tokens.length) return null;

  const pureFlightIdx = tokens.findIndex(t=>PURE_FLIGHT_RE.test(t));
  const pairingIdx = tokens.findIndex(t=>PAIRING_FLIGHT_RE.test(t));
  const flightIdx = pureFlightIdx >= 0 ? pureFlightIdx : pairingIdx;
  if(flightIdx >= 0) return parseFlightRow(date, tokens, flightIdx, inheritedReport, row);

  const activityIdx = tokens.findIndex(t=>activityMeta(normalizeActivityToken(t)).category !== 'ACTIVITY');
  if(activityIdx >= 0) return parseActivityRow(date, tokens, activityIdx, row);

  return null;
}

function normalizeActivityToken(t){ return String(t||'').replace(/\/.*$/,''); }

function parseActivityRow(date, tokens, activityIdx, raw){
  const code = normalizeActivityToken(tokens[activityIdx]);
  const meta = activityMeta(code);
  const times = tokens.filter(t=>TIME_RE.test(t));
  let startTime = times[0] || '';
  let endTime = times.length >= 2 ? times[times.length-2] : '';
  let explicitDuration = null;

  // No roster IFN, para atividades não-voo o último HH:MM costuma ser duração total (DH/SDC).
  if(times.length >= 2){
    const last = times[times.length-1];
    const lastHours = durationToHours(last);
    const span = diffHours(date, times[0], times[times.length-2] || times[1]);
    if(lastHours <= 12 && Math.abs(lastHours - span) < 0.25) explicitDuration = lastHours;
    else if(['TRAINING','AIRPORT_STANDBY'].includes(meta.category) && lastHours <= 12) explicitDuration = lastHours;
  }
  if(meta.category === 'DAY_OFF' || meta.countsAsDayOff){
    return makeEvent({date, code, kind:'DAY_OFF', label:meta.label, category:meta.category, startTime:'', endTime:'', dutyHours:0, flightHours:0, countsAsDuty:false, countsAsRest:true, isDayOff:true, raw, reason:meta.reason});
  }
  const dutyHours = meta.countsAsDuty ? (explicitDuration ?? (startTime && endTime ? diffHours(date,startTime,endTime) : (meta.defaultHours || 0))) : 0;
  return makeEvent({date, code, kind:meta.category, label:meta.label, category:meta.category, startTime, endTime, dutyHours, flightHours:0, countsAsDuty:!!meta.countsAsDuty, countsAsRest:!!meta.countsAsRest, isDayOff:false, raw, reason:meta.reason});
}

function parseFlightRow(date, tokens, flightIdx, inheritedReport, raw){
  const pairing = tokens.find(t=>PAIRING_FLIGHT_RE.test(t));
  const flightToken = tokens[flightIdx];
  const code = (flightToken.match(PAIRING_FLIGHT_RE)?.[1] || flightToken);
  const reportTime = findReportTime(tokens, flightIdx) || inheritedReport || '';

  const depIdx = findAirportTimePair(tokens, flightIdx+1);
  const arrIdx = depIdx >= 0 ? findAirportTimePair(tokens, depIdx+2) : -1;
  const dep = depIdx>=0 ? tokens[depIdx] : '';
  const depTime = depIdx>=0 ? tokens[depIdx+1] : '';
  const arr = arrIdx>=0 ? tokens[arrIdx] : '';
  const arrTime = arrIdx>=0 ? tokens[arrIdx+1] : '';
  const afterArr = arrIdx>=0 ? tokens.slice(arrIdx+2).filter(t=>TIME_RE.test(t)) : [];
  const blockTime = depTime && arrTime ? diffHours(date,depTime,arrTime) : 0;
  const parsedAfter = parseAfterArrival(date, arrTime, afterArr, blockTime);
  const flightHours = parsedAfter.flightHours ?? blockTime;
  const endTime = parsedAfter.debriefTime || (arrTime ? addMinutesClock(arrTime, 30) : '');
  let dutyHours = 0;
  if(reportTime && endTime) dutyHours = diffHours(date, reportTime, endTime);
  if(parsedAfter.explicitDuty && parsedAfter.explicitDuty > dutyHours) dutyHours = parsedAfter.explicitDuty;
  return makeEvent({date, code, kind:'FLIGHT', label:'Voo', category:'FLIGHT', pairing, reportTime, startTime:depTime, dep, depTime, arr, arrTime, endTime, debriefTime:parsedAfter.debriefTime, dutyHours, flightHours, countsAsDuty:true, isDayOff:false, raw, reason:'Etapa de voo; tempo de voo e jornada são calculados separadamente.'});
}

function parseAfterArrival(date, arrTime, afterArr, blockTime=0){
  if(!afterArr.length) return {};
  const first = afterArr[0];
  const second = afterArr[1];
  const third = afterArr[2];
  // No IFN, quando o primeiro horário após a chegada está até 3h depois da chegada,
  // ele é Debrief/encerramento, não duração de voo. O próximo campo é FH.
  // Isso corrige casos PS/extra como LA3263 e LA3168, onde havia 14:55/19:25 sendo lido como 14.9h/19.4h de voo.
  if(arrTime && clockAfterWithin(date, arrTime, first, 3)){
    return {debriefTime:first, flightHours: second ? durationToHours(second) : blockTime, explicitDuty: third ? durationToHours(third) : null};
  }
  return {flightHours:durationToHours(first), explicitDuty: second ? durationToHours(second) : null};
}

function findReportTime(tokens, flightIdx){
  for(let i=flightIdx-1;i>=0;i--){ if(TIME_RE.test(tokens[i])) return tokens[i]; }
  return '';
}
function findAirportTimePair(tokens, start){
  for(let i=start;i<tokens.length-1;i++){ if(AIRPORT_RE.test(tokens[i]) && TIME_RE.test(tokens[i+1])) return i; }
  return -1;
}
function makeEvent(e){
  return {...e, dutyHours:round(e.dutyHours||0), flightHours:round(e.flightHours||0)};
}

function groupEventsByDay(events){
  const map = new Map();
  for(const ev of events){ if(!map.has(ev.date)) map.set(ev.date,{date:ev.date, events:[]}); map.get(ev.date).events.push(ev); }
  return [...map.values()].map(day=>{
    const hasDayOff = day.events.some(e=>e.isDayOff);
    const hasFlight = day.events.some(e=>e.kind==='FLIGHT');
    const hasAirportStandby = day.events.some(e=>e.category==='AIRPORT_STANDBY');
    const hasHomeStandby = day.events.some(e=>e.category==='HOME_STANDBY');
    const hasTraining = day.events.some(e=>e.category==='TRAINING');
    const flightHours = day.events.reduce((s,e)=>s+(e.kind==='FLIGHT'?e.flightHours:0),0);
    let dutyHours = 0;
    if(hasFlight){
      const flightEvents = day.events.filter(e=>e.kind==='FLIGHT');
      const groups = new Map();
      for(const e of flightEvents){
        const key = e.reportTime || 'sem-apresentacao';
        groups.set(key, Math.max(groups.get(key)||0, e.dutyHours||0));
      }
      dutyHours = [...groups.values()].reduce((s,h)=>s+h,0);
      // Soma atividades não voo que eventualmente estejam no mesmo dia.
      dutyHours += day.events.filter(e=>e.kind!=='FLIGHT' && e.countsAsDuty).reduce((s,e)=>s+e.dutyHours,0);
    }else{
      dutyHours = day.events.reduce((s,e)=>s+(e.countsAsDuty?e.dutyHours:0),0);
    }
    const startTimes = day.events.map(e=>e.reportTime||e.startTime).filter(Boolean);
    const endTimes = day.events.map(e=>e.debriefTime||e.endTime||e.arrTime).filter(Boolean);
    const classification = hasDayOff ? 'Folga regulamentar' : hasFlight ? 'Voo' : hasAirportStandby ? 'Reserva aeroporto' : hasHomeStandby ? 'Sobreaviso' : hasTraining ? 'Treinamento' : 'Atividade';
    return {...day, classification, dutyHours:round(dutyHours), flightHours:round(flightHours), firstStart:firstClock(startTimes), lastEnd:lastClock(endTimes)};
  }).sort((a,b)=>a.date.localeCompare(b.date));
}

function toISO(day, mon, year){ return new Date(Number(year), MONTHS[mon], Number(day)).toISOString().slice(0,10); }
function durationToHours(hhmm){ const [h,m]=hhmm.split(':').map(Number); return round(h+m/60); }
function diffHours(date,start,end){ const a=new Date(`${date}T${start}:00`); let b=new Date(`${date}T${end}:00`); if(b<a)b.setDate(b.getDate()+1); return round((b-a)/36e5); }
function addMinutesClock(time, min){ const [h,m]=time.split(':').map(Number); const d=new Date(2000,0,1,h,m+min); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function clockAfterWithin(date, base, candidate, hours){ const a=new Date(`${date}T${base}:00`); let b=new Date(`${date}T${candidate}:00`); if(b<a)b.setDate(b.getDate()+1); return (b-a)/36e5 >=0 && (b-a)/36e5 <= hours; }
function firstClock(times){ return times.slice().sort()[0] || ''; }
function lastClock(times){ return times.slice().sort().at(-1) || ''; }
function round(n){return Math.round((Number(n)||0)*10)/10;}
