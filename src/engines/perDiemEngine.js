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
    if(isRestOnly(day)) continue;

    const events=day.events||[];
    const operational=events.some(e=>e.kind==='FLIGHT'||e.category==='AIRPORT_STANDBY'||e.category==='TRAINING');
    const away=awayOverlapsDate(awayIntervals,date);
    if(!operational && !away) continue;

    // Refeições principais: almoço e jantar são devidas por atividade na janela ou por estar fora da base/pernoite operacional.
    for(const w of MAIN_MEALS){
      if(events.some(e=>eventOverlapsWindow(e,date,w)) || awayOverlapsWindow(awayIntervals,date,w)){
        meals.push(makeMeal(date,w.label,'principal'));
      }
    }
    // Ceia: somente com atividade operacional sobreposta à janela da ceia, início/encerramento de jornada ou voo.
    if(events.some(e=>eventOverlapsWindow(e,date,CEIA) || startsOrEndsInWindow(e,date,CEIA))){
      meals.push(makeMeal(date,'Ceia','principal'));
    }
    // Café: separado apenas se houver apresentação/atividade operacional dentro de 05:00-08:00.
    // Não gera café automaticamente por estar em hotel/pernoite, pois o café do hotel pode estar incluído.
    if(events.some(e=>breakfastTrigger(e,date,awayIntervals))){
      meals.push(makeMeal(date,'Café da manhã','cafe'));
    }
    if(events.some(e=>baseTaxiTrigger(e,date))){
      meals.push(makeMeal(date,'Táxi','taxi'));
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

function isRestOnly(day){
  const ev=day.events||[];
  return ev.length && ev.every(e=>e.category==='REST'||e.kind==='DAY_OFF'||e.category==='DAY_OFF'||e.category==='LEAVE'||e.category==='MEDICAL_LEAVE');
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
function awayOverlapsDate(intervals,date){const a=dateTime(date,'00:00'), b=dateTime(date,'23:59');return intervals.some(i=>i.start<b && a<i.end);}
function awayOverlapsWindow(intervals,date,w){const win=normalizeInterval(date,w.start,w.end); return intervals.some(i=>i.start<win.end && win.start<i.end);}
function breakfastTrigger(e,date,awayIntervals){
  // Se o tripulante está em pernoite/hotel na janela do café, não computa automaticamente.
  if(awayOverlapsWindow(awayIntervals,date,BREAKFAST)) return false;
  return startsOrEndsInWindow(e,date,BREAKFAST);
}
function startsOrEndsInWindow(e,date,w){
  const points=[e.reportTime,e.startTime,e.depTime,e.debriefTime,e.endTime,e.arrTime].filter(Boolean);
  return points.some(t=>timeInWindow(t,w.start,w.end));
}
function baseTaxiTrigger(e,date){
  const points=[];
  if((e.dep===BASE || !e.dep) && (e.reportTime||e.startTime)) points.push(e.reportTime||e.startTime);
  if(e.arr===BASE && (e.debriefTime||e.endTime||e.arrTime)) points.push(e.debriefTime||e.endTime||e.arrTime);
  return points.some(t=>timeInWindow(t,TAXI.start,TAXI.end));
}
function eventOverlapsWindow(e,date,w){
  const start=e.reportTime || e.startTime || e.depTime;
  const end=e.debriefTime || e.endTime || e.arrTime;
  if(!start||!end) return false;
  return overlap(normalizeInterval(date,start,end), normalizeInterval(date,w.start,w.end));
}
function timeInWindow(t,start,end){const m=mins(t), a=mins(start), b=mins(end); return m>=a && m<=b;}
function mins(t){const [h,m]=t.split(':').map(Number);return h*60+m;}
function makeMeal(date,label,type){return {date,label,type,paymentWeekStart:weekStartWednesday(date)}}
function dedupeMeals(meals){const seen=new Set(); const out=[]; for(const m of meals){const k=`${m.date}|${m.label}|${m.type}`; if(!seen.has(k)){seen.add(k);out.push(m)}} return out.sort((a,b)=>(a.date+a.type+a.label).localeCompare(b.date+b.type+b.label));}
function dateTime(date,time){return new Date(`${date}T${time}:00`);}
function normalizeInterval(date,start,end){const a=dateTime(date,start);let b=dateTime(date,end);if(b<=a)b.setDate(b.getDate()+1);return {start:a,end:b};}
function overlap(a,b){return a.start < b.end && b.start < a.end;}
function weekStartWednesday(dateISO){const d=new Date(`${dateISO}T00:00:00`);const diff=(d.getDay()-3+7)%7;d.setDate(d.getDate()-diff);return d.toISOString().slice(0,10);}
function addDays(dateISO,n){const d=new Date(`${dateISO}T00:00:00`);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
