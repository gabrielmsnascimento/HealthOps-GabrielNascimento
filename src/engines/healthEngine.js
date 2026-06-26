export function buildHealthAlerts(state){
  const today = new Date().toISOString().slice(0,10);
  const check = state.checkins?.[today] || {};
  const alerts=[];
  const water = Number(check.waterMl||0);
  const caffeine = Number(check.caffeineMg||0);
  if(water < 1500) alerts.push({level:'WARN', text:'Você ainda não ingeriu água suficiente — fique atento.'});
  if(caffeine >= 300) alerts.push({level:'DANGER', text:'Cuidado! Consumo de cafeína elevado.'});
  if(!check.exerciseDone) alerts.push({level:'INFO', text:'Já fez exercício hoje? Não esqueça de marcar.'});
  if(!check.meals || check.meals.length===0) alerts.push({level:'INFO', text:'Ainda não há registro de alimentação hoje.'});
  return alerts;
}
export function estimateFatigue(day){
  if(!day) return {score:null,label:'Sem dados'};
  let score = 20;
  if(day.events.some(e=>e.isDayOff)) score -= 15;
  score += day.dutyHours * 4;
  score += day.flightHours * 3;
  const night = day.events.some(e=>/T(0[0-5]|2[2-3])/.test(`${e.date}T${e.report||e.depTime||e.startTime||''}`));
  if(night) score += 18;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return {score, label: score<30?'Baixa':score<60?'Moderada':'Alta'};
}
