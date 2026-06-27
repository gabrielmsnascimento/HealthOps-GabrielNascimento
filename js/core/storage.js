export const Store={
 key:'healthops-v3-state',
 load(){try{return JSON.parse(localStorage.getItem(this.key))||{imports:{},activeMonth:null,medsToday:[],protocols:[],debug:[]}}catch{return{imports:{},activeMonth:null,medsToday:[],protocols:[],debug:[]}}},
 save(s){localStorage.setItem(this.key,JSON.stringify(s))},
 log(s,msg){s.debug.unshift({time:new Date().toISOString(),msg});s.debug=s.debug.slice(0,80);this.save(s)}
};
