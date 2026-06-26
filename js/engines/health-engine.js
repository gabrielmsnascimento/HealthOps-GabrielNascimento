export function trainingRecommendation(day){
  if(!day) return {key:'sem', label:'Sem dados'};
  if(day.classification==='Folga regulamentar') return {key:'forte', label:'Treino possível'};
  if(day.classification==='Voo' && day.fatigue>=75) return {key:'recuperacao', label:'Recuperação'};
  if(day.classification==='Voo' && day.fatigue>=45) return {key:'leve', label:'Leve/mobilidade'};
  if(day.classification==='Treinamento') return {key:'leve', label:'Leve após atividade'};
  if(day.classification==='Reserva/Sobreaviso') return {key:'curto', label:'Curto flexível'};
  return {key:'moderado', label:'Moderado'};
}
