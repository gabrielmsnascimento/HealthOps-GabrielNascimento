export const ACTIVITY_CATALOG = {
  DO:{label:'Day off', category:'Folga regulamentar', countsAsDuty:false, countsAsRest:true, countsAsFlight:false},
  DR:{label:'Requested day off', category:'Folga regulamentar', countsAsDuty:false, countsAsRest:true, countsAsFlight:false},
  VC:{label:'Vacation', category:'Férias/VC', countsAsDuty:false, countsAsRest:true, countsAsFlight:false},
  HSB:{label:'Home Stand by', category:'Reserva/Sobreaviso', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  HSBE:{label:'Extra Home Stand by', category:'Reserva/Sobreaviso', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  ASB:{label:'Airport stand by', category:'Reserva/Sobreaviso', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  R320:{label:'Periodic A319/320/321', category:'Treinamento', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  CRMBSB:{label:'CRM Training BSB', category:'Treinamento', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  CBF:{label:'Combate ao fogo', category:'Treinamento', countsAsDuty:true, countsAsRest:false, countsAsFlight:false},
  EMER:{label:'Emergências gerais', category:'Treinamento', countsAsDuty:true, countsAsRest:false, countsAsFlight:false}
};
