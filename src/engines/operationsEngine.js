export function summarizeOperations(days){
  const totalDuty = round(days.reduce((s,d)=>s+d.dutyHours,0));
  const totalFlight = round(days.reduce((s,d)=>s+d.flightHours,0));
  const dayOffs = days.filter(d=>d.classification==='Folga regulamentar').length;
  const flightDays = days.filter(d=>d.classification==='Voo').length;
  const trainingDays = days.filter(d=>d.classification==='Treinamento').length;
  const standbyDays = days.filter(d=>d.classification.includes('Reserva')||d.classification.includes('Sobreaviso')).length;
  return { totalDuty,totalFlight,dayOffs,flightDays,trainingDays,standbyDays,totalDays:days.length };
}
export function classifyToday(days, todayISO = new Date().toISOString().slice(0,10)){
  const day = days.find(d=>d.date===todayISO);
  if(!day) return {status:'NO_DATA', title:'Sem dados disponíveis para hoje', alerts:['Importe e processe a escala do mês para atualizar a análise.']};
  const alerts=[];
  if(day.classification==='Folga regulamentar') alerts.push('Folga reconhecida: não conta como jornada nem tempo de voo.');
  if(day.dutyHours>=10) alerts.push('Carga operacional elevada: priorize hidratação, refeições e sono.');
  if(day.events.some(e=>e.category==='AIRPORT_STANDBY')) alerts.push('Reserva em aeroporto: manter alimentação, água e plano de descanso.');
  return {status:'OK', title:day.classification, day, alerts};
}
function round(n){return Math.round((Number(n)||0)*10)/10;}
