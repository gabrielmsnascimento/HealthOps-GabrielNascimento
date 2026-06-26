export function evaluateRegulation(days, config={}){
  const rules = { simpleRestOkHours:10, baseDutyLimitHours:12, ...config };
  const alerts=[];
  let previousDutyDay=null;
  for(const day of days){
    const isDayOff = day.events.some(e=>e.isDayOff);
    if(isDayOff){
      alerts.push({date:day.date, level:'OK', title:'Folga regulamentar reconhecida', detail:'DO/DR e equivalentes contam como folga/repouso de 24h, mas não contam como jornada.'});
      continue;
    }
    if(day.dutyHours > rules.baseDutyLimitHours){
      alerts.push({date:day.date, level:'WARN', title:'Possível extrapolação de jornada', detail:`Jornada estimada de ${day.dutyHours}h acima do limite base configurado de ${rules.baseDutyLimitHours}h. Conferir Lei 13.475/17, RBAC 117 e ACT aplicável.`});
    }
    if(previousDutyDay){
      const rest = restBetween(previousDutyDay, day);
      if(rest !== null && rest < rules.simpleRestOkHours){
        alerts.push({date:day.date, level:'WARN', title:'Repouso inferior a 10h', detail:`Repouso estimado de ${rest}h entre jornadas. Verificar regra aplicável e dados reais de corte/apresentação.`});
      } else if(rest !== null && rest >= rules.simpleRestOkHours && rest < 12){
        alerts.push({date:day.date, level:'INFO', title:'Repouso mínimo operacional', detail:`Repouso estimado de ${rest}h. Considerado OK pelo parâmetro atual de 10h, mas mantido como ponto de atenção de fadiga.`});
      }
    }
    if(day.dutyHours>0) previousDutyDay=day;
  }
  alerts.push(...checkEarlyAfterSingleDayOff(days));
  return alerts;
}
function restBetween(prev, current){
  const prevLast = lastDutyTime(prev); const curFirst = firstDutyTime(current);
  if(!prevLast || !curFirst) return null;
  return Math.round(((curFirst-prevLast)/36e5)*10)/10;
}
function firstDutyTime(day){
  const ev = day.events.find(e=>e.countsAsDuty && (e.report || e.startTime || e.depTime));
  if(!ev) return null;
  return new Date(`${day.date}T${ev.report || ev.startTime || ev.depTime}:00`);
}
function lastDutyTime(day){
  const duty = day.events.filter(e=>e.countsAsDuty);
  if(!duty.length) return null;
  const last = duty[duty.length-1];
  const time = last.arrTime || last.endTime || last.depTime || last.report;
  if(!time) return null;
  let dt = new Date(`${day.date}T${time}:00`);
  const first = firstDutyTime(day); if(first && dt<first) dt.setDate(dt.getDate()+1);
  return dt;
}
function checkEarlyAfterSingleDayOff(days){
  const out=[];
  for(let i=1;i<days.length;i++){
    const prev = days[i-1], cur=days[i];
    const prevOff = prev.events.some(e=>e.isDayOff);
    const curFirst = firstDutyTime(cur);
    if(prevOff && curFirst && curFirst.getHours()<10){
      out.push({date:cur.date, level:'WARN', title:'Apresentação antes das 10h após monofolga', detail:'Ponto de atenção: apresentação em horário matinal após uma única folga regulamentar. Conferir ACT aplicável.'});
    }
  }
  return out;
}
