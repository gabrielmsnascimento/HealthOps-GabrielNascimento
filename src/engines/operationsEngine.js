export function summarizeOperations(days){
  const totalDuty = days.reduce((s,d)=>s+d.dutyHours,0);
  const totalFlight = days.reduce((s,d)=>s+d.flightHours,0);
  const dayOffs = days.filter(d=>d.events.some(e=>e.isDayOff)).length;
  const flights = days.filter(d=>d.events.some(e=>e.kind==='FLIGHT')).length;
  return { totalDuty:round(totalDuty), totalFlight:round(totalFlight), dayOffs, flightDays:flights, totalDays:days.length };
}
export function classifyToday(days, todayISO = new Date().toISOString().slice(0,10)){
  const day = days.find(d=>d.date===todayISO);
  if(!day) return {status:'NO_DATA', title:'Sem dados disponíveis para a data de hoje.', alerts:['Importe/processar a escala do mês para atualizar a análise.']};
  const alerts=[];
  if(day.events.some(e=>e.isDayOff)) alerts.push('Folga regulamentar reconhecida: sem jornada e sem tempo de voo.');
  if(day.dutyHours>=10) alerts.push('Carga operacional elevada: priorizar hidratação, alimentação e sono.');
  return {status:'OK', title:day.classification, day, alerts};
}
function round(n){return Math.round(n*10)/10}
