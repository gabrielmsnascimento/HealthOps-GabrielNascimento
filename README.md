export const FLIGHT_RE = /^LA\d{3,4}(?:\/.*)?$/;

export const ACTIVITY_CATALOG = {
  // Folgas regulamentares e equivalentes
  DO:{label:'Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga regulamentar de 24h; conta como folga/repouso, não como jornada.'},
  DR:{label:'Requested Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga solicitada de 24h; conta como folga/repouso, não como jornada.'},
  DOA:{label:'Additional Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga adicional; não conta como jornada.'},
  DOR:{label:'Returned Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga retornada; não conta como jornada.'},
  DOR1:{label:'Required Day Off 1', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga requerida; não conta como jornada.'},
  DOR2:{label:'Required Day Off 2', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga requerida; não conta como jornada.'},
  DOR3:{label:'Required Day Off 3', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga requerida; não conta como jornada.'},
  DW:{label:'Weekend Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga de fim de semana; não conta como jornada.'},
  DC:{label:'Couple Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga conjunta; não conta como jornada.'},
  DH:{label:'Holiday Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga feriado; não conta como jornada.'},
  DB:{label:'Birthday Day Off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga aniversário; não conta como jornada.'},
  DBC:{label:'Birthday couple day off', category:'DAY_OFF', countsAsDayOff:true, countsAsRest:true, countsAsDuty:false, defaultHours:24, reason:'Folga aniversário/conjugue; não conta como jornada.'},
  VC:{label:'Vacation / folga de escala', category:'REST', countsAsDayOff:false, countsAsRest:true, countsAsDuty:false, defaultHours:0, reason:'Atividade de repouso/indisponibilidade, não conta como jornada.'},
  REST:{label:'Rest', category:'REST', countsAsRest:true, countsAsDuty:false, defaultHours:0, reason:'Repouso programado.'},
  REP:{label:'Post journey rest', category:'REST', countsAsRest:true, countsAsDuty:false, defaultHours:0, reason:'Repouso pós-jornada.'},

  // Reserva / sobreaviso
  ASB:{label:'Airport stand by', category:'AIRPORT_STANDBY', countsAsDuty:true, defaultHours:null, reason:'Reserva em aeroporto; conta como jornada pelo período programado.'},
  ASB1:{label:'Airport stand by 1', category:'AIRPORT_STANDBY', countsAsDuty:true, defaultHours:null, reason:'Reserva em aeroporto; conta como jornada pelo período programado.'},
  ASB2:{label:'Airport stand by 2', category:'AIRPORT_STANDBY', countsAsDuty:true, defaultHours:null, reason:'Reserva em aeroporto; conta como jornada pelo período programado.'},
  ASB3:{label:'Airport stand by 3', category:'AIRPORT_STANDBY', countsAsDuty:true, defaultHours:null, reason:'Reserva em aeroporto; conta como jornada pelo período programado.'},
  HSB:{label:'Home Stand by', category:'HOME_STANDBY', countsAsDuty:false, countsAsStandby:true, defaultHours:null, reason:'Sobreaviso em local de escolha; não é jornada de voo, mas é disponibilidade.'},
  HSB1:{label:'Home Stand by 1', category:'HOME_STANDBY', countsAsDuty:false, countsAsStandby:true, defaultHours:null, reason:'Sobreaviso em local de escolha.'},
  HSB2:{label:'Home Stand by 2', category:'HOME_STANDBY', countsAsDuty:false, countsAsStandby:true, defaultHours:null, reason:'Sobreaviso em local de escolha.'},
  HSB3:{label:'Home Stand by 3', category:'HOME_STANDBY', countsAsDuty:false, countsAsStandby:true, defaultHours:null, reason:'Sobreaviso em local de escolha.'},

  // Treinamentos e reuniões
  R320:{label:'Periodic A319/320/321', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento periódico; jornada pelo período informado na escala.'},
  CBF:{label:'Combate ao fogo', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento; jornada pelo período informado.'},
  EMER:{label:'Emergências gerais', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento; jornada pelo período informado.'},
  CRM:{label:'CRM Training', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento; jornada pelo período informado.'},
  CRMBSB:{label:'CRM Training BSB', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento; jornada pelo período informado.'},
  WEB:{label:'Online training', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento online; jornada pelo período informado.'},
  WEB1:{label:'Online training 1', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento online; jornada pelo período informado.'},
  WEB2:{label:'Online training 2', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento online; jornada pelo período informado.'},
  WEB3:{label:'Online training 3', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento online; jornada pelo período informado.'},
  TFD1:{label:'Initial Fatigue + Safety case', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento de fadiga/safety case; jornada pelo período informado.'},
  TFD2:{label:'Initial Fatigue', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento de fadiga; jornada pelo período informado.'},
  TFTG:{label:'Fatigue Training', category:'TRAINING', countsAsDuty:true, defaultHours:null, reason:'Treinamento de fadiga; jornada pelo período informado.'},
  APR:{label:'Apresentação', category:'REPORT', countsAsDuty:true, defaultHours:null, reason:'Apresentação para programação.'},
  CMA:{label:'Aeronautic Medical Certificate', category:'MEDICAL_ADMIN', countsAsDuty:false, defaultHours:null, reason:'Atividade administrativa/médica.'},

  // Ausências/afastamentos comuns
  MOF:{label:'Medical Out of Flight', category:'MEDICAL_LEAVE', countsAsDuty:false, defaultHours:0, reason:'Afastamento médico fora de voo.'},
  OOF:{label:'Out of flight', category:'LEAVE', countsAsDuty:false, defaultHours:0, reason:'Fora de voo.'},
  SICK:{label:'Sick', category:'MEDICAL_LEAVE', countsAsDuty:false, defaultHours:0, reason:'Afastamento por doença.'},
  FTG:{label:'Fatigue', category:'FATIGUE', countsAsDuty:false, defaultHours:0, reason:'Registro relacionado a fadiga.'}
};

export function activityMeta(code){
  if(!code) return {};
  if(ACTIVITY_CATALOG[code]) return ACTIVITY_CATALOG[code];
  if(/^LA\d+/.test(code)) return {label:'Voo', category:'FLIGHT', countsAsDuty:true};
  if(/^CRM/.test(code)) return ACTIVITY_CATALOG.CRM;
  if(/^WEB/.test(code)) return ACTIVITY_CATALOG.WEB;
  if(/^ASB/.test(code)) return ACTIVITY_CATALOG.ASB;
  if(/^HSB/.test(code)) return ACTIVITY_CATALOG.HSB;
  return {label:code, category:'ACTIVITY', countsAsDuty:false, defaultHours:0, reason:'Sigla não classificada no banco local.'};
}
