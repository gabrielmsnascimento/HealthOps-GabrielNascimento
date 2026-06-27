export function evaluateRegulatory(day){
  const alerts=[];
  if(!day) return [{level:'info',title:'Sem dados',message:'Não há escala processada para a data.'}];
  if(day.classification==='Folga regulamentar') alerts.push({level:'ok',title:'Folga regulamentar reconhecida',message:'Conta como folga/repouso e não como jornada.'});
  if(day.classification==='Férias/VC') alerts.push({level:'ok',title:'Férias/VC reconhecida',message:'Não conta como programação operacional nem gera alerta de madrugada.'});
  if(day.duty>12) alerts.push({level:'attention',title:'Possível extrapolação de jornada',message:'Confirmar composição da tripulação, ACT e dados reais de apresentação/corte.'});
  return alerts;
}
