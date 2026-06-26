const MAIN_MEALS = [
  {key:'almoco', label:'Almoço', start:'11:00', end:'13:00'},
  {key:'jantar', label:'Jantar', start:'19:00', end:'20:00'}
];
const CEIA = {key:'ceia', label:'Ceia', start:'23:00', end:'23:59'};
const BREAKFAST = {key:'cafe', label:'Café da manhã', start:'05:00', end:'08:00'};
const TAXI = {key:'taxi', label:'Táxi', start:'00:00', end:'05:59'};
const BASE='BSB';

export function calculatePerDiems(days){
  const awayIntervals = buildAwayIntervals(days);
  const meals=[];
  const dayMap=new Map(days.map(d=>[d.date,d]));
  const allDates=[...new Set([...days.map(d=>d.date),...datesCoveredByAway(awayIntervals)])].sort();
  for(const date of allDates){
    const day=dayMap.get(date) || {date,classification:'Pernoite fora da base',events:[]};
    if(day.classification==='Folga regulamentar') continue;
    const events=day.events||[];
    const flightOrReserve=events.some(e=>e.kind==='FLIGHT'||e.category==='AIRPORT_STANDBY');
    const trainingOnly=!flightOrReserve && events.some(e=>e.category==='TRAINING');
    const away=awayOverlapsDate(awayIntervals,date);

    if(trainingOnly){
      meals.push(makeMeal(date,'Almoço','principal','Treinamento: contar com atenção e validar critério da empresa/ACT *'));
      continue;
    }
    if(!flightOrReserve && !away) continue;

    for(const w of MAIN_MEALS){
      if(events.some(e=>eventOverlapsWindow(e,date,w)) || awayOverlapsWindow(awayIntervals,date,w)){
        meals.push(makeMeal(date,w.label,'principal', reasonForMeal(events, awayIntervals, date, w)));
      }
    }
    if(events.some(e=>eventOverlapsWindow(e,date,CEIA))){
      meals.push(makeMeal(date,'Ceia','principal','Atividade operacional sobreposta à janela da ceia'));
    }
    if(events.some(e=>breakfastTrigger(e,date))){
      meals.push(makeMeal(date,'Café da manhã','cafe','Café separado: início/retorno operacional na base ou saída da base para programação com pernoite'));
    }
    if(events.some(e=>baseTaxiTrigger(e,date))){
      meals.push(makeMeal(date,'Táxi','taxi','Apresentação ou encerramento na base entre 00h00 e 05h59'));
    }
  }
  const unique=dedupeMeals(meals);
  const groups=new Map();
  for(const meal of unique){
    const start=weekStartWednesday(meal.date);
    if(!groups.has(start)) groups.set(start,{start,end:addDays(start,6),payDate:addDays(start,8),principal:0,cafe:0,taxi:0,count:0,meals:[]});
    const g=groups.get(start);
    g[meal.type]++; g.count++; g.meals.push(meal);
  }
  return [...groups.values()].sort((a,b)=>a.start.localeCompare(b.start));
}
function buildAwayIntervals(days){
  const flights=days.flatMap(d=>(d.events||[]).filter(e=>e.kind==='FLIGHT')).sort((a,b)=>dateTime(a.date,a.depTime||a.startTime||'00:00')-dateTime(b.date,b.depTime||b.startTime||'00:00'));
  const intervals=[]; let awayStart=null;
  for(const f of flights){
    if(!awayStart && f.dep===BASE && f.arr && f.arr!==BASE) awayStart = dateTime(f.date, f.arrTime || f.endTime || '23:59');
    if(awayStart && f.arr===BASE) { intervals.push({start:awayStart,end:dateTime(f.date, f.arrTime || f.endTime || '23:59')}); awayStart=null; }
  }
  if(awayStart && days.length) intervals.push({start:awayStart,end:dateTime(days.at(-1).date,'23:59')});
  return intervals;
}

function datesCoveredByAway(intervals){
  const out=[];
  for(const i of intervals){
    const d=new Date(i.start); d.setHours(0,0,0,0);
    const end=new Date(i.end); end.setHours(0,0,0,0);
    while(d<=end){ out.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1); }
  }
  return out;
}
function awayOverlapsDate(intervals,date){
  const a=dateTime(date,'00:00'), b=dateTime(date,'23:59');
  return intervals.some(i=>i.start<b && a<i.end);
}

function awayOverlapsWindow(intervals,date,w){const win=normalizeInterval(date,w.start,w.end); return intervals.some(i=>i.start<win.end && win.start<i.end);}
function reasonForMeal(events, intervals, date, w){
  if(events.some(e=>eventOverlapsWindow(e,date,w))) return 'Atividade programada sobreposta à janela da refeição';
  if(awayOverlapsWindow(intervals,date,w)) return 'Programação fora da base / pernoite operacional';
  return 'Regra operacional configurada';
}
function breakfastTrigger(e,date){
  // Saída da base para pernoite/programação fora da base: regra operacional LATAM configurável.
  if(e.kind==='FLIGHT' && e.dep===BASE && e.arr && e.arr!==BASE) return true;
  // Apresentação/encerramento na base dentro da janela do café.
  const start=e.reportTime||e.startTime||e.depTime; const end=e.debriefTime||e.endTime||e.arrTime;
  if((e.dep===BASE||!e.dep) && start && start>=BREAKFAST.start && start<=BREAKFAST.end) return true;
  if(e.arr===BASE && end && end>=BREAKFAST.start && end<=BREAKFAST.end) return true;
  return false;
}
function baseTaxiTrigger(e,date){
  const points=[];
  if((e.dep===BASE || !e.dep) && (e.reportTime||e.startTime)) points.push(e.reportTime||e.startTime);
  if(e.arr===BASE && (e.debriefTime||e.endTime||e.arrTime)) points.push(e.debriefTime||e.endTime||e.arrTime);
  return points.some(t=>t>=TAXI.start && t<=TAXI.end);
}
function eventOverlapsWindow(e,date,w){
  const start=e.reportTime || e.startTime || e.depTime;
  const end=e.debriefTime || e.endTime || e.arrTime;
  if(!start||!end) return false;
  return overlap(normalizeInterval(date,start,end), normalizeInterval(date,w.start,w.end));
}
function makeMeal(date,label,type,reason){return {date,label,type,reason,paymentWeekStart:weekStartWednesday(date)}}
function dedupeMeals(meals){const seen=new Set(); const out=[]; for(const m of meals){const k=`${m.date}|${m.label}|${m.type}`; if(!seen.has(k)){seen.add(k);out.push(m)}} return out.sort((a,b)=>(a.date+a.type+a.label).localeCompare(b.date+b.type+b.label));}
function dateTime(date,time){return new Date(`${date}T${time}:00`);}
function normalizeInterval(date,start,end){const a=dateTime(date,start);let b=dateTime(date,end);if(b<=a)b.setDate(b.getDate()+1);return {start:a,end:b};}
function overlap(a,b){return a.start < b.end && b.start < a.end;}
function weekStartWednesday(dateISO){const d=new Date(`${dateISO}T00:00:00`);const diff=(d.getDay()-3+7)%7;d.setDate(d.getDate()-diff);return d.toISOString().slice(0,10);}
function addDays(dateISO,n){const d=new Date(`${dateISO}T00:00:00`);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
