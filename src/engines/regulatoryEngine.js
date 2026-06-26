export function evaluateRegulation(days){
  const alerts=[];
  const sorted=[...days].sort((a,b)=>a.date.localeCompare(b.date));
  for(let i=0;i<sorted.length;i++){
    const d=sorted[i];
    if(d.classification==='Folga regulamentar'){
      alerts.push({level:'OK',date:d.date,title:'Folga regulamentar reconhecida',detail:'DO/DR e equivalentes contam como folga/repouso de 24h, mas não contam como jornada.'});
      continue;
    }
    if(isRestOrInactive(d)) continue;

    // Avalia jornada por apresentação/bloco operacional, não pela soma diária.
    // Isso evita falso alerta quando há duas jornadas no mesmo dia com repouso entre elas.
    for(const j of dutyBlocks(d)){
      const maxDuty = 12;
      if(j.hours > maxDuty) alerts.push({level:'WARN',date:d.date,title:'Possível extrapolação de jornada',detail:`Jornada estimada de ${j.hours}h acima do limite base configurado de ${maxDuty}h. Confirmar composição da tripulação, ACT e dados reais de apresentação/corte.`});
    }

    const rest = previousRest(sorted,i);
    if(rest !== null && rest < 10) alerts.push({level:'WARN',date:d.date,title:'Repouso inferior a 10h',detail:`Repouso estimado de ${rest}h entre jornadas. A configuração atual considera OK descanso simples de hotel a partir de 10h, mantendo alerta apenas abaixo disso.`});
    if(d.dutyHours>0 && crossesNight(d)) alerts.push({level:'INFO',date:d.date,title:'Madrugada operacional',detail:'Evento cruza parcial ou totalmente o período 00:00–06:00. Usar para janela de 168h e monitoramento de fadiga.'});
  }
  alerts.push(...evaluateConsecutiveNights(sorted));
  return alerts;
}
function isRestOrInactive(day){
  const ev=day.events||[];
  return !day.dutyHours || (ev.length && ev.every(e=>['REST','DAY_OFF','LEAVE','MEDICAL_LEAVE','FATIGUE'].includes(e.category)||e.kind==='DAY_OFF'));
}
function dutyBlocks(day){
  const events=(day.events||[]).filter(e=>e.countsAsDuty && (e.dutyHours||0)>0);
  if(!events.length) return [];
  const groups=new Map();
  for(const e of events){
    const key=e.reportTime || e.startTime || `${e.code}-${e.dutyHours}`;
    groups.set(key, Math.max(groups.get(key)||0, e.dutyHours||0));
  }
  return [...groups.entries()].map(([key,hours])=>({key,hours:round(hours)}));
}
function previousRest(days, idx){
  if(idx<=0) return null;
  const prev = [...days.slice(0,idx)].reverse().find(d=>d.dutyHours>0 && d.lastEnd);
  const cur = days[idx];
  if(!prev || !cur.firstStart || cur.dutyHours<=0) return null;
  const a=new Date(`${prev.date}T${prev.lastEnd}:00`); let b=new Date(`${cur.date}T${cur.firstStart}:00`);
  while(b<a) b.setDate(b.getDate()+1);
  return Math.round(((b-a)/36e5)*10)/10;
}
function crossesNight(day){
  if(day.dutyHours<=0) return false;
  return day.events.some(e=>{
    if(!e.countsAsDuty) return false;
    const start=e.reportTime||e.startTime, end=e.debriefTime||e.endTime||e.arrTime;
    if(!start||!end) return false;
    return clockInWindow(start,end,'00:00','06:00');
  });
}
function clockInWindow(start,end,wStart,wEnd){
  const s=mins(start), e0=mins(end); let e=e0; if(e<=s) e+=1440;
  const windows=[[mins(wStart),mins(wEnd)],[mins(wStart)+1440,mins(wEnd)+1440]];
  return windows.some(([a,b])=>Math.max(s,a)<Math.min(e,b));
}
function mins(t){const [h,m]=t.split(':').map(Number); return h*60+m;}
function evaluateConsecutiveNights(days){
  const res=[]; let streak=0;
  for(const d of days){
    if(d.dutyHours>0 && crossesNight(d)) streak++; else if(d.classification==='Folga regulamentar' || isRestOrInactive(d)) streak=0;
    if(streak>2) res.push({level:'WARN',date:d.date,title:'Possível atenção à regra de madrugadas consecutivas',detail:'Mais de 2 madrugadas consecutivas detectadas preliminarmente. Confirmar regra aplicável e janela de 168h.'});
  }
  return res;
}
function round(n){return Math.round((Number(n)||0)*10)/10;}
