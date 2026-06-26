export function buildHealthAlerts(state){
  const today = new Date().toISOString().slice(0,10);
  const c = state.checkins?.[today] || {};
  const alerts=[];
  if((c.waterMl||0)<1500) alerts.push({level:'WARN', text:'Você ainda não ingeriu água suficiente hoje. Fique atento.'});
  if((c.caffeineMg||0)>=300) alerts.push({level:'DANGER', text:'Cuidado: consumo de cafeína elevado.'});
  if(!c.exerciseDone) alerts.push({level:'INFO', text:'Já fez exercício hoje? Não esqueça de marcar.'});
  if(!c.meals || !Object.keys(c.meals).length) alerts.push({level:'INFO', text:'Nenhuma refeição registrada hoje.'});
  return alerts;
}
export function estimateFatigue(day){
  if(!day) return {label:'Sem dados',score:null};
  let score=20;
  if(day.dutyHours>=8) score+=20;
  if(day.dutyHours>=10) score+=20;
  if(day.flightHours>=6) score+=10;
  if(day.classification==='Folga regulamentar') score=10;
  if(day.events.some(e=>e.category==='AIRPORT_STANDBY')) score+=10;
  score=Math.max(0,Math.min(100,score));
  return {score,label:score>=70?'Alta':score>=40?'Moderada':'Baixa'};
}
