const APP_VERSION='0.5.0';
const K={roster:'healthops_roster_v050',checkins:'healthops_checkins_v050',meds:'healthops_meds_v050',settings:'healthops_settings_v050'};
const $=id=>document.getElementById(id);
const todayISO=()=>new Date().toISOString().slice(0,10);
const fmtDate=s=>new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
const load=(k,d)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(d));
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const byDate=(a,b)=>a.date.localeCompare(b.date);
function download(name,content,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

const OpsEngine={
 classify(item){
  const raw=((item.raw||'')+' '+(item.summary||'')+' '+(item.code||'')).toUpperCase();
  const start=item.startTime||'', end=item.endTime||'';
  const h=t=>t?parseInt(t.split(':')[0],10):null;
  if(/\b(DO|DR|FOLGA|OFF)\b/.test(raw)) return {type:'Folga',load:'Sem',summary:'Folga/descanso identificado na escala.'};
  if(/\b(RES|RSV|SOBREAVISO|ASB|SBY)\b/.test(raw)) return {type:'Reserva/Sobreaviso',load:'Operacional',summary:'Dia de reserva/sobreaviso. Manter prontidão e rotina leve.'};
  const sh=h(start), eh=h(end);
  if((eh!==null&&eh<9)||(sh!==null&&sh<5)||/MADR|RED EYE|NOTUR/.test(raw)) return {type:'Madrugada/Recuperação',load:'Alta',summary:'Operação em madrugada ou chegada cedo. Priorizar sono, hidratação e recuperação.'};
  if(/\b(APR|APRESENT|VOO|BSB|GRU|CGH|GIG|REC|FOR|SSA|BEL|CNF|SDU|POA|CWB|MCZ|AJU|THE|PMW)\b/.test(raw)) return {type:'Voo/Operacional',load:'Operacional',summary:'Dia operacional. Ajustar treino conforme sono e fadiga.'};
  return {type:'Dados importados',load:'Operacional',summary:item.summary||'Item importado da escala.'};
 },
 parseText(text){
  const lines=(text||'').split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const out=[]; let year=new Date().getFullYear();
  for(const line of lines){
   const dateMatch=line.match(/(?:^|\D)(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
   if(!dateMatch) continue;
   const dd=dateMatch[1].padStart(2,'0'), mm=dateMatch[2].padStart(2,'0');
   const yy=dateMatch[3]? (dateMatch[3].length===2?'20'+dateMatch[3]:dateMatch[3]) : String(year);
   const times=[...line.matchAll(/\b(\d{1,2})[:h](\d{2})\b/g)].map(m=>`${m[1].padStart(2,'0')}:${m[2]}`);
   const item={date:`${yy}-${mm}-${dd}`,startTime:times[0]||'',endTime:times[times.length-1]||'',raw:line,summary:line};
   Object.assign(item,this.classify(item)); out.push(item);
  }
  const map=new Map(); out.forEach(i=>map.set(i.date,{...(map.get(i.date)||{}),...i}));
  return [...map.values()].sort(byDate);
 },
 today(roster){return roster.find(r=>r.date===todayISO())||null},
 next(roster,n=4){const t=todayISO(); return roster.filter(r=>r.date>=t).sort(byDate).slice(0,n)}
};

const DutyEngine={
 settings:{maxDutyDay:12,maxDutyNight:10,minRest:12},
 calc(item,prev){
  const start=item.startTime, end=item.endTime; let dutyHours=null, restHours=null, flags=[];
  if(start&&end){let s=new Date(item.date+'T'+start), e=new Date(item.date+'T'+end); if(e<s)e.setDate(e.getDate()+1); dutyHours=(e-s)/36e5;}
  if(prev?.endTime&&start){let p=new Date(prev.date+'T'+prev.endTime), s=new Date(item.date+'T'+start); if(p>s)p.setDate(p.getDate()-1); restHours=(s-p)/36e5;}
  const night=(start&&parseInt(start)<6)||(end&&parseInt(end)<8);
  const limit=night?this.settings.maxDutyNight:this.settings.maxDutyDay;
  if(dutyHours!==null&&dutyHours>limit) flags.push('Jornada estimada acima do limite base configurado. Conferir RBAC/ACT.');
  if(restHours!==null&&restHours<this.settings.minRest) flags.push('Repouso estimado abaixo da referência base. Conferir regra aplicável.');
  if(item.load==='Alta') flags.push('Alta carga operacional: atenção a fadiga, sono e alimentação.');
  return {...item,dutyHours,restHours,night,flags};
 },
 analyze(roster){return roster.sort(byDate).map((r,i,a)=>this.calc(r,a[i-1]))}
};

const FatigueEngine={
 score(day,checkin){
  if(!day&&!checkin) return {score:null,parts:['Sem escala/check-in para hoje.']};
  let score=70, parts=[];
  const sleep=Number(checkin?.sleepHours||0)+Number(checkin?.napMinutes||0)/60;
  if(sleep){ if(sleep>=7){score+=12;parts.push('Sono adequado +12')} else if(sleep<5){score-=18;parts.push('Sono curto -18')} else {parts.push('Sono intermediário')}}
  if(day?.load==='Alta'){score-=18;parts.push('Alta carga operacional -18')}
  if(day?.type?.includes('Madrugada')){score-=15;parts.push('Madrugada/chegada cedo -15')}
  const water=Number(checkin?.waterMl||0); if(water>=2200){score+=8;parts.push('Boa hidratação +8')} else if(water>0&&water<1200){score-=8;parts.push('Hidratação baixa -8')}
  const caf=Number(checkin?.caffeineMg||0); if(caf>300){score-=8;parts.push('Cafeína elevada -8')}
  if(checkin?.trainingIntensity==='Intensa'&&day?.load==='Alta'){score-=10;parts.push('Treino intenso em alta carga -10')}
  score=Math.max(0,Math.min(100,Math.round(score)));
  return {score,parts};
 }
};

const MedicationEngine={
 catalog:[
  {name:'Rosuvastatina',dose:'10 mg',kind:'Medicamento',risk:'compatible',when:'Noite'},
  {name:'Ômega 3',dose:'',kind:'Suplemento',risk:'compatible',when:'Manhã'},
  {name:'Magnésio dimalato',dose:'300 mg',kind:'Suplemento',risk:'compatible',when:'Noite'},
  {name:'Metilcobalamina + Metilfolato',dose:'1 mg + 3 mg',kind:'Manipulado',risk:'compatible',when:'Manhã'},
  {name:'Zinco + Cromo + Selênio',dose:'30 mg + 500 mcg + 150 mcg',kind:'Manipulado',risk:'compatible',when:'Manhã'},
  {name:'Vit D + A + K2 + Cálcio',dose:'10000 UI + 500 UI + 150 mcg + 150 mg',kind:'Manipulado',risk:'attention',when:'Manhã'},
  {name:'Sibutramina',dose:'10 mg',kind:'Medicamento',risk:'sensitive',when:'Manhã',note:'Inibidor de apetite: item sensível para aeronautas; exige validação médica/CMA.'}
 ],
 defaultProtocol(){return this.catalog.map((x,i)=>({...x,id:'med_'+i,active:true}))},
 riskLabel(r){return {compatible:'🟢 Compatível',attention:'🟡 Atenção',restricted:'🟠 Restrito',sensitive:'🔴 Sensível'}[r]||'🟡 Atenção'}
};

const ExportEngine={
 csv(roster){return 'Data,Tipo,Carga,Inicio,Fim,Resumo\n'+roster.map(r=>[r.date,r.type,r.load,r.startTime,r.endTime,(r.summary||'').replaceAll('"','""')].map(v=>`"${v||''}"`).join(',')).join('\n')},
 ics(roster){const ev=roster.map((r,i)=>{const dt=r.date.replaceAll('-',''); const st=(r.startTime||'09:00').replace(':','')+'00'; const en=(r.endTime||r.startTime||'10:00').replace(':','')+'00'; return `BEGIN:VEVENT\nUID:healthops-${r.date}-${i}@local\nDTSTAMP:${dt}T000000\nDTSTART:${dt}T${st}\nDTEND:${dt}T${en}\nSUMMARY:${r.type||'Escala'}\nDESCRIPTION:${(r.summary||'').replace(/\n/g,' ')}\nEND:VEVENT`}).join('\n'); return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//HealthOps//Aeronauta//PT-BR\n${ev}\nEND:VCALENDAR`}
};

let state={roster:load(K.roster,[]),checkins:load(K.checkins,{}),meds:load(K.meds,[]),settings:load(K.settings,{profile:'aeronauta'})};

function render(){renderHeader();renderDashboard();renderRoster();renderDuty();renderCheckin();renderMeds();renderFatigue()}
function renderHeader(){$('todayTitle').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});}
function renderDashboard(){const day=OpsEngine.today(state.roster), c=state.checkins[todayISO()], f=FatigueEngine.score(day,c); $('dayType').textContent=day?day.type:'Sem dados disponíveis'; $('daySummary').textContent=day?day.summary:'Sem dados disponíveis para a data de hoje. Importe/processa a escala do mês para análise correta.'; $('recoveryScore').textContent=f.score??'--'; $('mDuty').textContent=day?(day.startTime||'—')+' → '+(day.endTime||'—'):'—'; $('mSleep').textContent=c?.sleepHours?c.sleepHours+'h':'—'; $('mEnergy').textContent=c?.energy??'—'; $('mWater').textContent=c?.waterMl?c.waterMl+' ml':'—'; $('todayBadges').innerHTML=day?`<span class="badge">${day.load}</span><span class="badge">${day.date}</span>`:'<span class="badge">Sem escala hoje</span>'; $('upcomingDays').innerHTML=OpsEngine.next(state.roster,4).map(d=>`<div class="mini-day ${d.load}"><strong>${fmtDate(d.date)}</strong><span>${d.type}</span><small>${d.summary}</small></div>`).join('')||'<p class="muted">Sem próximos dias importados.</p>'; const ins=[]; if(!day)ins.push('Importe a escala para liberar recomendações de sono, treino, água e jornada.'); if(day?.load==='Alta')ins.push('Priorize hidratação, alimentação simples e treino leve/mobilidade.'); if(day?.type?.includes('Madrugada'))ins.push('Planeje bloco de sono pós-madrugada e evite treino intenso.'); $('insights').innerHTML=ins.map(x=>`<p class="insight">${x}</p>`).join('')||'<p class="insight">Dia adequado para rotina normal, se o check-in estiver bom.</p>'; renderProtocolCards();}
function renderProtocolCards(){const meds=state.meds.filter(m=>m.active); const groups={Manhã:meds.filter(m=>m.when==='Manhã'),Noite:meds.filter(m=>m.when==='Noite')}; $('todayProtocols').innerHTML=Object.entries(groups).map(([g,items])=>`<div class="protocol-card"><strong>${g}</strong><span>${items.length} itens</span><small>${items.filter(i=>i.risk==='sensitive').length?'Contém item sensível':''}</small></div>`).join('')}
function renderRoster(){$('rosterList').innerHTML=state.roster.map(r=>`<article class="roster-card ${r.load}"><h3><span>${fmtDate(r.date)}</span><span>${r.type}</span></h3><p>${r.startTime||'—'} → ${r.endTime||'—'}</p><p>${r.summary}</p></article>`).join('')||'<p class="muted">Nenhuma escala processada.</p>'}
function renderDuty(){const rows=DutyEngine.analyze([...state.roster]); $('dutyList').innerHTML=rows.map(r=>`<article class="roster-card ${r.load}"><h3><span>${fmtDate(r.date)}</span><span>${r.dutyHours? r.dutyHours.toFixed(1)+'h':'sem horário'}</span></h3><p>Repouso anterior: ${r.restHours? r.restHours.toFixed(1)+'h':'—'} | Noturno: ${r.night?'sim':'não'}</p>${r.flags.map(f=>`<p class="danger-text">• ${f}</p>`).join('')||'<p class="muted">Sem ponto de atenção preliminar.</p>'}</article>`).join('')||'<p class="muted">Importe a escala para calcular jornada.</p>'}
function renderCheckin(){['energy','focus'].forEach(id=>{const el=$(id),out=$(id+'Out'); if(el&&out){out.textContent=el.value; el.oninput=()=>out.textContent=el.value}}); const acts=['Treino curto','Treino completo','Mobilidade','Alongamento','Caminhada','Corrida','Piscina','Bike','Funcional']; $('trainingChecks').innerHTML=acts.map(a=>`<label><input type="checkbox" value="${a}" name="training"> ${a}</label>`).join(''); $('medChecklist').innerHTML=state.meds.filter(m=>m.active).map(m=>`<label><input type="checkbox" value="${m.id}" name="medtaken"> ${m.name}</label>`).join('')||'<p class="muted">Cadastre/carregue medicações.</p>'}
function renderMeds(){ $('medList').innerHTML=state.meds.map(m=>`<div class="med-group"><div class="med-row"><div><strong>${m.name}</strong><small>${m.kind} • ${m.dose||'dose livre'} • ${m.when}</small></div><span class="tag ${m.risk}">${MedicationEngine.riskLabel(m.risk)}</span></div>${m.note?`<p class="danger-text">${m.note}</p>`:''}</div>`).join('')||'<p class="muted">Nenhuma medicação cadastrada.</p>'}
function renderFatigue(){const f=FatigueEngine.score(OpsEngine.today(state.roster),state.checkins[todayISO()]); $('fatigueScore').textContent=f.score??'--'; $('fatigueBreakdown').innerHTML=f.parts.map(p=>`<p class="insight">${p}</p>`).join('')}

async function readFile(file){if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){return 'Leitura direta de PDF no PWA está em modo experimental nesta versão. Se o texto não aparecer completo, copie e cole o conteúdo da escala aqui.\n\nArquivo selecionado: '+file.name} return await file.text()}

document.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b)return; if(b.dataset.view){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active')); $('view-'+b.dataset.view).classList.add('active'); b.classList.add('active')} if(b.dataset.caf){$('caffeineMg').value=Number($('caffeineMg').value||0)+Number(b.dataset.caf)}});
$('rosterFile').addEventListener('change',async e=>{const f=e.target.files[0]; if(!f)return; $('parseStatus').textContent='Arquivo selecionado: '+f.name; $('rosterText').value=await readFile(f);});
$('processRoster').onclick=()=>{const parsed=OpsEngine.parseText($('rosterText').value); state.roster=parsed; save(K.roster,state.roster); $('parseStatus').textContent=parsed.length?`${parsed.length} dias/itens processados e salvos.`:'Nenhum item reconhecido. Confira se o texto contém datas e horários.'; render()};
$('clearRoster').onclick=()=>{state.roster=[];save(K.roster,[]);render()};
$('checkinForm').onsubmit=e=>{e.preventDefault(); const data={date:todayISO(),sleepHours:$('sleepHours').value,napMinutes:$('napMinutes').value,energy:$('energy').value,focus:$('focus').value,waterMl:$('waterMl').value,caffeineMg:$('caffeineMg').value,training:[...document.querySelectorAll('input[name=training]:checked')].map(x=>x.value),trainingIntensity:$('trainingIntensity').value,trainingMinutes:$('trainingMinutes').value,foodSummary:$('foodSummary').value,medsTaken:[...document.querySelectorAll('input[name=medtaken]:checked')].map(x=>x.value)}; state.checkins[todayISO()]=data; save(K.checkins,state.checkins); alert('Check-in salvo.'); render()};
$('loadGabrielProtocol').onclick=()=>{state.meds=MedicationEngine.defaultProtocol(); save(K.meds,state.meds); render()};
$('addMedBtn').onclick=()=>{const name=prompt('Nome do medicamento/suplemento/manipulado:'); if(!name)return; const dose=prompt('Dose/descrição:')||''; const when=prompt('Horário padrão: Manhã, Tarde ou Noite','Manhã')||'Manhã'; const risk=prompt('Classificação: compatible, attention, restricted ou sensitive','attention')||'attention'; state.meds.push({id:'med_'+Date.now(),name,dose,when,risk,kind:'Outro',active:true}); save(K.meds,state.meds); render()};
$('exportCsv').onclick=()=>download('healthops_escala.csv',ExportEngine.csv(state.roster),'text/csv');
$('exportIcs').onclick=()=>download('healthops_calendario.ics',ExportEngine.ics(state.roster),'text/calendar');
$('backupJson').onclick=()=>download('healthops_backup_v050.json',JSON.stringify(state,null,2),'application/json');
$('actProfile').onchange=e=>{state.settings.act=e.target.value;save(K.settings,state.settings)};

if('serviceWorker'in navigator) navigator.serviceWorker.register('./service-worker.js');
let deferred; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').classList.remove('hidden')}); $('installBtn').onclick=()=>deferred?.prompt();
render();
