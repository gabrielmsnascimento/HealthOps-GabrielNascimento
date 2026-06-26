export function medicationStatus(item){
  if(!item) return {status:'desconhecido', reason:'Item não cadastrado.'};
  return {status:item.status||'compatível', reason:item.reason||item.note||'Revisar orientação individual.'};
}
export function groupByPeriod(meds){
  return meds.reduce((acc,m)=>{ const p=m.period||'Sem horário'; (acc[p] ||= []).push(m); return acc; },{});
}
