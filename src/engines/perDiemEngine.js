const MEAL_WINDOWS = [
  {key:'cafe', label:'Café da manhã', start:'05:00', end:'08:00'},
  {key:'almoco', label:'Almoço', start:'11:00', end:'13:00'},
  {key:'jantar', label:'Jantar', start:'19:00', end:'20:00'},
  {key:'ceia', label:'Ceia', start:'00:00', end:'01:00'}
];
export function calculatePerDiems(days){
  const meals=[];
  for(const day of days){
    for(const ev of day.events){
      if(!ev.countsAsDuty && ev.category!=='HOME_STANDBY') continue;
      const start = ev.reportTime || ev.startTime;
      const end = ev.debriefTime || ev.endTime || ev.arrTime;
      if(!start || !end) continue;
      const interval = normalizeInterval(ev.date,start,end);
      for(const w of MEAL_WINDOWS){
        for(const mealInterval of mealIntervalsAround(ev.date,w)){
          if(overlap(interval, mealInterval)) meals.push({date:mealInterval.date, label:w.label, event:ev.code, paymentWeekStart:weekStartWednesday(mealInterval.date)});
        }
      }
    }
  }
  const unique = dedupeMeals(meals);
  const groups = new Map();
  for(const meal of unique){
    const start = meal.paymentWeekStart;
    if(!groups.has(start)) groups.set(start,{start, end:addDays(start,6), payDate:addDays(start,8), count:0, meals:[]});
    groups.get(start).count++; groups.get(start).meals.push(meal);
  }
  return [...groups.values()].sort((a,b)=>a.start.localeCompare(b.start));
}
function dedupeMeals(meals){
  const seen=new Set(); const out=[];
  for(const m of meals){ const k=`${m.date}|${m.label}|${m.event}`; if(!seen.has(k)){seen.add(k);out.push(m);} }
  return out;
}
function normalizeInterval(date,start,end){
  const a=new Date(`${date}T${start}:00`); let b=new Date(`${date}T${end}:00`); if(b<=a)b.setDate(b.getDate()+1); return {start:a,end:b};
}
function mealIntervalsAround(date,w){
  const ds=[addDays(date,-1),date,addDays(date,1)];
  return ds.map(d=>({date:d, ...normalizeInterval(d,w.start,w.end)}));
}
function overlap(a,b){return a.start < b.end && b.start < a.end;}
function weekStartWednesday(dateISO){
  const d=new Date(`${dateISO}T00:00:00`); const day=d.getDay(); // 0 dom, 3 qua
  const diff=(day-3+7)%7; d.setDate(d.getDate()-diff); return d.toISOString().slice(0,10);
}
function addDays(dateISO,n){const d=new Date(`${dateISO}T00:00:00`);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
