export const MEAL_WINDOWS = {
  breakfast:['05:00','08:00'], lunch:['11:00','13:00'], dinner:['19:00','20:00'], supper:['23:00','00:00']
};
export function latamWeek(date, helpers){
  const d=helpers.parseIso(date); const day=d.getDay(); const back=(day+4)%7;
  const start=new Date(d); start.setDate(d.getDate()-back);
  const end=new Date(start); end.setDate(start.getDate()+6);
  const pay=new Date(end); pay.setDate(end.getDate()+2);
  return {start:helpers.iso(start), end:helpers.iso(end), pay:helpers.iso(pay)};
}
