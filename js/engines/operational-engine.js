export function classifyOperationalDay(events){
  const types = new Set(events.map(e => e.type));
  if(types.has('flight')) return 'Voo';
  if(types.has('training')) return 'Treinamento';
  if(types.has('reserve') || types.has('standby')) return 'Reserva/Sobreaviso';
  if(types.has('rest')) return 'Folga regulamentar';
  if(types.has('vacation')) return 'Férias/VC';
  return 'Sem dados';
}
