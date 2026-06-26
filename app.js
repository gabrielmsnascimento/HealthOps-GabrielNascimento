const KEY_CHECKINS='healthops_checkins_v3';
const KEY_ROSTER='healthops_roster_v3';
const APP_VERSION='3.2';
const KEY_REMINDERS='healthops_reminders_v32';

const julyRoster=[
 {date:'2026-07-01',type:'Alta carga',startTime:'',endTime:'18:45',summary:'Pairing iniciado em 28/06. Chegada BSB 18:45. Prioridade: hidratação e recuperação.'},
 {date:'2026-07-02',type:'Alta carga',summary:'4 pernas BSB-GYN-BSB-REC-BSB. Dia de alta carga operacional.'},
 {date:'2026-07-03',type:'Performance',summary:'DO. Janela boa para treino completo se sono estiver adequado.'},
 {date:'2026-07-04',type:'Performance',summary:'DO. Treino completo ou caminhada longa.'},
 {date:'2026-07-05',type:'Performance',summary:'DO. Preparar alimentação e sono para próximo pairing.'},
 {date:'2026-07-06',type:'Operacional',startTime:'18:35',summary:'Apresentação 18:35. Posicionamento BSB-CGH.'},
 {date:'2026-07-07',type:'Operacional',summary:'C32F e retorno CGH-BSB à noite. Manutenção leve.'},
 {date:'2026-07-08',type:'Alta carga',summary:'Início pairing BSB-GIG-GRU-XAP-GRU. Evitar treino pesado.'},
 {date:'2026-07-09',type:'Recuperação',endTime:'05:45',summary:'Madrugada GRU-THE-GRU, chegada 05:45. Café + dormir até 12-13h.'},
 {date:'2026-07-10',type:'Recuperação',endTime:'23:40',summary:'Chegada MCZ 23:40 e pernoite. Sono e hidratação.'},
 {date:'2026-07-11',type:'Operacional',startTime:'13:25',endTime:'15:55',summary:'MCZ-BSB 13:25-15:55. Caminhada leve se houver disposição.'},
 {date:'2026-07-12',type:'Performance',summary:'DO. Treino completo se recuperação ≥70.'},
 {date:'2026-07-13',type:'Performance',summary:'DO. Preparar sono para apresentação cedo.'},
 {date:'2026-07-14',type:'Alta carga',summary:'BSB-BEL-FOR. Pairing com madrugada na sequência.'},
 {date:'2026-07-15',type:'Recuperação',endTime:'08:50',summary:'FOR-GRU chega 08:50. Café + dormir até 12-13h. Nova madrugada PMW.'},
 {date:'2026-07-16',type:'Recuperação',endTime:'06:15',summary:'PMW-GRU chega 06:15. Prioridade: sono, água, comida real.'},
 {date:'2026-07-17',type:'Alta carga',endTime:'17:30',summary:'GRU-CXJ-GRU-BSB, chegada 17:30. Final de pairing.'},
 {date:'2026-07-18',type:'Performance',summary:'DR. Recuperação + treino se acordar bem.'},
 {date:'2026-07-19',type:'Performance',summary:'DR. Treino completo ideal.'},
 {date:'2026-07-20',type:'Alta carga',summary:'BSB-AJU-BSB-GRU. Dia com múltiplas pernas.'},
 {date:'2026-07-21',type:'Alta carga',summary:'GRU-PMW-GRU-BSB. Dia longo; meta é manutenção.'},
 {date:'2026-07-22',type:'Operacional',startTime:'17:20',summary:'Apresentação 17:20, posicionamento BSB-CGH.'},
 {date:'2026-07-23',type:'Operacional',startTime:'09:00',endTime:'18:00',summary:'MCK CGH 09:00-18:00. Treino leve ou mobilidade.'},
 {date:'2026-07-24',type:'Operacional',summary:'Retorno CGH-BSB cedo. Sono e caminhada leve.'},
 {date:'2026-07-25',type:'Performance',summary:'DR. Janela de treino completo.'},
 {date:'2026-07-26',type:'Performance',summary:'DR. Treino completo ou piscina.'},
 {date:'2026-07-27',type:'Performance',summary:'DO. Preparar semana e alimentação.'},
 {date:'2026-07-28',type:'Operacional',startTime:'06:30',endTime:'12:30',summary:'ASB 06:30-12:30. Treino curto à tarde se sono bom.'},
 {date:'2026-07-29',type:'Alta carga',summary:'BSB-GRU-SSA-GRU. Início pairing com madrugada EZE.'},
 {date:'2026-07-30',type:'Recuperação',endTime:'04:50',summary:'EZE-GRU chega 04:50. Café + dormir até 12-13h. Nova saída à noite.'},
 {date:'2026-07-31',type:'Recuperação',endTime:'19:55',summary:'BEL-BSB 17:20-19:55. Fechar mês com recuperação.'}
];

function $(id){return document.getElementById(id)}
function safeParse(raw,fallback){try{return JSON.parse(raw)||fallback}catch{return fallback}}
function getCheckins(){return safeParse(localStorage.getItem(KEY_CHECKINS),safeParse(localStorage.getItem('healthops_checkins_v2'),[]))}
function setCheckins(v){localStorage.setItem(KEY_CHECKINS,JSON.stringify(v))}
function getRoster(){return safeParse(localStorage.getItem(KEY_ROSTER),safeParse(localStorage.getItem('healthops_roster_v2'),[]))}
function setRoster(v){localStorage.setItem(KEY_ROSTER,JSON.stringify(sortRoster(v)))}
function todayISO(){return new Date().toISOString().slice(0,10)}
function fmtDate(d){return new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',weekday:'short'})}
function download(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function sortRoster(arr){return [...arr].sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime))}
function csvEscape(v){return `"${String(Array.isArray(v)?v.join(' + '):(v??'')).replaceAll('\"','\"\"')}"`}
function getReminders(){return safeParse(localStorage.getItem(KEY_REMINDERS),{enabled:false,waterInterval:90,activityReminder:'on'})}
function setReminders(v){localStorage.setItem(KEY_REMINDERS,JSON.stringify(v))}

function recovery(c={}){let s=0;const sleepH=Number(c.sleepHours||0),sq=Number(c.sleepQuality||5),en=Number(c.energy||5),mood=Number(c.mood||5),focus=Number(c.focus||5),sound=Number(c.soundSensitivity||5),hr=Number(c.restingHr||0);s+=Math.min(10,sleepH)/10*25;s+=sq/10*20;s+=en/10*18;s+=mood/10*14;s+=focus/10*10;s+=(10-sound)/10*10;if(hr>95)s-=8;if(Number(c.caffeineMg)>=300)s-=4;return Math.max(0,Math.min(100,Math.round(s)))}
function badgesFor(r,c,score){const b=[];if(r?.type)b.push(r.type);if(/madrugada|05:|06:|04:/i.test(r?.summary||''))b.push('madrugada/recuperação');if(score>=75)b.push('janela de performance');if(Number(c.soundSensitivity)>=7)b.push('proteção sensorial');if(c.medTaken==='sim')b.push('BioMag registrado');return b}
function planFor(type,score,r={}){const common=['Água ao acordar + BioMag somente conforme prescrição','Registrar check-in em 2 minutos','Proteína em pelo menos 2-3 refeições'];if(type==='Performance')return[...common,score>=70?'Treino de força 45-60 min':'Treino curto/mobilidade: recuperação ainda baixa','Preparar lanches e sono para próximo bloco'];if(type==='Operacional')return[...common,'Treino curto 20-30 min ou caminhada','Cafeína com limite; evitar perto da janela de sono'];if(type==='Recuperação')return[...common,'Se chegada 05-08h: café da manhã + dormir até 12h-13h','Evitar treino intenso; mobilidade, caminhada leve ou descanso'];return[...common,'Dia crítico: não buscar performance; foco em sono, água e comida real','Reduzir estímulos e proteger janelas de cochilo']}
function classifyFromText(line){const t=line.toUpperCase();const times=(line.match(/\b\d{1,2}:\d{2}\b/g)||[]);if(/\b(DO|DR|FOLGA)\b/.test(t))return'Performance';if(/\b(ASB|MCK|RES|TREIN|CURSO)\b/.test(t))return'Operacional';if(/(04:|05:|06:|07:|08:|MADRUG|CHEGA|CHEGADA)/i.test(line))return'Recuperação';if((t.match(/[A-Z]{3}/g)||[]).length>=4||times.length>=4)return'Alta carga';return'Operacional'}

function init(){document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));document.querySelectorAll('input[type=range]').forEach(inp=>{const out=inp.parentElement.querySelector('output');const upd=()=>out.textContent=inp.value;inp.addEventListener('input',upd);upd()});$('checkinForm').date.value=todayISO();$('manualRosterForm').date.value=todayISO();$('checkinForm').onsubmit=saveCheckin;setupCaffeine();$('manualRosterForm').onsubmit=addManualRoster;$('loadJuly').onclick=()=>{setRoster(julyRoster);renderAll()};$('clearRoster').onclick=()=>{if(confirm('Limpar somente a escala processada?')){localStorage.removeItem(KEY_ROSTER);renderAll()}};$('parseRoster').onclick=parseRosterText;$('clearData').onclick=()=>{if(confirm('Limpar check-ins e escala importada?')){localStorage.removeItem(KEY_CHECKINS);localStorage.removeItem(KEY_ROSTER);location.reload()}};$('exportCsv').onclick=exportCheckinsCsv;$('exportRosterCsv').onclick=exportRosterCsv;$('exportCalendarCsv').onclick=exportCalendarCsv;$('exportIcs').onclick=exportIcs;$('exportBackup').onclick=exportBackup;$('rosterFile').onchange=handleRosterFile; $('enableNotifications').onclick=enableReminders; $('disableNotifications').onclick=disableReminders; hydrateReminderSettings(); renderAll();registerSW();setupInstall();scheduleReminderLoop()}
function renderAll(){renderDashboard();renderRoster();renderStats()}
function showTab(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('view-'+name).classList.add('active');document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='stats')renderStats();if(name==='roster')renderRoster()}

function renderDashboard(){
  const date=todayISO();
  const roster=getRoster();
  const r=roster.find(x=>x.date===date);
  const c=getCheckins().filter(x=>x.date===date).at(-1)||{};
  const hasCheckin=Object.keys(c).length>0;
  const score=hasCheckin?recovery(c):NaN;
  $('todayTitle').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
  $('dayType').textContent=r?.type||'Sem dados da escala';
  $('daySummary').textContent=r? r.summary : 'Sem dados disponíveis para a data de hoje. Importe/processa a escala do mês ou adicione o dia manualmente.';
  $('todayBadges').innerHTML=r?badgesFor(r,c,score).map(x=>`<span class="badge">${x}</span>`).join(''):'<span class="badge">sem escala para hoje</span>';
  $('recoveryScore').textContent=isNaN(score)?'--':score;
  $('mSleep').textContent=c.sleepHours?`${c.sleepHours}h`:'—';
  $('mEnergy').textContent=c.energy??'—';
  $('mFocus').textContent=c.focus??'—';
  $('mSound').textContent=c.soundSensitivity??'—';
  $('todayPlan').innerHTML=(r?planFor(r.type,score,r):['Importe/processa a escala para liberar recomendações do dia.','Se hoje é folga, registre check-in e use treino conforme energia/sono.','Sem escala válida, o app não presume alta carga.']).map(x=>`<li>${x}</li>`).join('');
  const insights=[];
  if(!r) insights.push('Sem escala para hoje: nenhuma classificação operacional será presumida.');
  if(Number(c.soundSensitivity)>=7)insights.push('Sensibilidade sonora alta: priorize fone ANC, ambientes previsíveis e pausa sensorial.');
  if(Number(c.caffeineMg)>=300)insights.push('Cafeína elevada: observar impacto em sono, FC, hiperatividade e insônia.');
  if(Number(c.sleepHours)>0&&Number(c.sleepHours)<5.5)insights.push('Sono curto: hoje é dia de recuperação/manutenção, não de performance.');
  if(Number(c.restingHr)>=95)insights.push('FC de repouso elevada: registre contexto e converse com seu médico se persistir.');
  if(/palpitação|FC elevada/i.test(c.medEffects||''))insights.push('Efeito relevante da sibutramina registrado: monitore pressão/FC e evite cafeína excessiva.');
  if(score>=75)insights.push('Boa recuperação: janela favorável para treino de força ou tarefa importante.');
  if(!insights.length)insights.push('Sem alertas relevantes. Faça o check-in para gerar leituras melhores.');
  $('insights').innerHTML=insights.map(i=>`<div class="insight">${i}</div>`).join('');
  renderUpcoming();
}
function saveCheckin(e){e.preventDefault();const fd=new FormData(e.target);const obj=Object.fromEntries(fd.entries());obj.workoutDone=fd.getAll('workoutDone');obj.caffeineLog=safeParse(obj.caffeineLog,[]);const arr=getCheckins().filter(x=>x.date!==obj.date);arr.push({...obj,savedAt:new Date().toISOString()});setCheckins(arr);renderAll();alert('Check-in salvo.');showTab('dashboard')}
function addManualRoster(e){e.preventDefault();const obj=Object.fromEntries(new FormData(e.target).entries());if(!obj.summary)obj.summary=`${obj.type} ${obj.startTime||''}${obj.endTime?' - '+obj.endTime:''}`;setRoster([...getRoster().filter(x=>!(x.date===obj.date&&x.summary===obj.summary)),obj]);e.target.reset();$('manualRosterForm').date.value=todayISO();renderAll()}
function renderRoster(){const r=getRoster();$('rosterList').innerHTML=r.length?r.map(x=>{const cls=x.type==='Alta carga'?'Alta':x.type;const time=[x.startTime,x.endTime].filter(Boolean).join('–');return`<article class="roster-card ${cls}"><h3><span>${fmtDate(x.date)}</span><span>${x.type}</span></h3><p>${time?time+' · ':''}${x.summary}</p></article>`}).join(''):'<div class="panel"><p class="muted">Nenhuma escala processada ainda. Use a aba Importar ou adicione manualmente.</p></div>'} 
function renderUpcoming(){
  const el=$('upcomingDays'); if(!el)return;
  const roster=getRoster(); const out=[]; const base=new Date(todayISO()+'T12:00:00');
  for(let i=0;i<4;i++){const d=new Date(base);d.setDate(base.getDate()+i);const iso=d.toISOString().slice(0,10);const r=roster.find(x=>x.date===iso);const label=i===0?'Hoje':d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});out.push(`<div class="mini-day ${r?(r.type==='Alta carga'?'Alta':r.type):'Sem'}"><strong>${label}</strong><span>${r? r.type:'Sem dados'}</span><small>${r? (r.summary||'—'):'Nenhuma informação da escala para esta data.'}</small></div>`)}
  el.innerHTML=out.join('');
}
function parseRosterText(){
  const txt=$('rosterText').value.trim();
  if(!txt){$('importStatus').textContent='Cole algum texto da escala antes.';return}
  const parsed=parseRosterLines(txt);
  if(parsed.length){
    setRoster(parsed);
    $('importStatus').innerHTML=`✅ Escala processada: ${parsed.length} itens adicionados. Próximos 4 dias atualizados no Início. Agora você pode exportar CSV/ICS ou revisar na aba Escala.`;
    renderAll();
    showTab('roster');
  }else{
    $('importStatus').textContent='Não consegui interpretar automaticamente. O texto foi lido, mas não encontrei linhas com data + código/horário. Tente copiar uma parte da escala com datas visíveis ou adicione itens manualmente.';
  }
}
function parseRosterLines(txt){
  const normalized=txt.replace(/\r/g,'\n').replace(/(\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?)/g,'\n$1');
  const raw=normalized.split(/\n+/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const parsed=[];let currentYear=new Date().getFullYear();
  for(const line of raw){
    const dateMatch=line.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
    if(!dateMatch)continue;
    const d=dateMatch[1].padStart(2,'0'),m=dateMatch[2].padStart(2,'0');let y=dateMatch[3]||currentYear;if(String(y).length===2)y='20'+y;
    const date=`${y}-${m}-${d}`;
    const clean=line.replace(/\s+/g,' ').trim();
    if(!isLikelyRosterLine(clean))continue;
    const times=clean.match(/\b\d{1,2}:\d{2}\b/g)||[];
    parsed.push({date,type:classifyFromText(clean),startTime:times[0]||'',endTime:times.length>1?times[times.length-1]:'',summary:clean.slice(0,260)});
  }
  const byKey=new Map();
  for(const item of parsed){byKey.set(`${item.date}|${item.startTime}|${item.endTime}|${item.summary}`,item)}
  return sortRoster([...byKey.values()]);
}
function isLikelyRosterLine(line){
  const t=line.toUpperCase();
  return /\b(DO|DR|FOLGA|ASB|MCK|RES|TREIN|CURSO|LA\d+)\b/.test(t)||/[A-Z]{3}\s*[-\/]\s*[A-Z]{3}/.test(t)||(t.match(/\b[A-Z]{3}\b/g)||[]).length>=2||/\b\d{1,2}:\d{2}\b/.test(t);
}
function renderStats(){const arr=getCheckins();const avg=k=>{const vals=arr.map(x=>Number(x[k])).filter(v=>!isNaN(v)&&v>0);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—'};$('avgSleep').textContent=avg('sleepHours');$('avgMood').textContent=avg('mood');$('avgSound').textContent=avg('soundSensitivity');$('totalCheckins').textContent=arr.length}
function exportCheckinsCsv(){const arr=getCheckins();if(!arr.length){alert('Sem check-ins para exportar.');return}const headers=[...new Set(arr.flatMap(Object.keys))];const csv=[headers.join(';'),...arr.map(o=>headers.map(h=>csvEscape(o[h])).join(';'))].join('\n');download('healthops_checkins.csv',csv,'text/csv;charset=utf-8')}
function exportRosterCsv(){const arr=getRoster();const headers=['date','type','startTime','endTime','summary'];const csv=[headers.join(';'),...arr.map(o=>headers.map(h=>csvEscape(o[h])).join(';'))].join('\n');download('healthops_escala.csv',csv,'text/csv;charset=utf-8')}
function exportCalendarCsv(){const rows=[['Subject','Start Date','Start Time','End Date','End Time','Description','Location']];for(const r of getRoster()){const subject=`HealthOps - ${r.type}`;const sd=r.date.split('-').reverse().join('/');const start=r.startTime||'08:00';let end=r.endTime||addMinutes(start,45);rows.push([subject,sd,start,sd,end,r.summary,''])}const csv=rows.map(row=>row.map(csvEscape).join(',')).join('\n');download('healthops_calendario.csv',csv,'text/csv;charset=utf-8')}
function addMinutes(t,m){const [h,mi]=t.split(':').map(Number);const d=new Date(2000,0,1,h||8,mi||0);d.setMinutes(d.getMinutes()+m);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function icsDate(date,time){return `${date.replaceAll('-','')}T${(time||'0800').replace(':','').padEnd(4,'0')}00`}
function exportIcs(){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HealthOps//Gabriel//PT-BR'];getRoster().forEach((r,i)=>{const start=r.startTime||'08:00',end=r.endTime||addMinutes(start,45);lines.push('BEGIN:VEVENT',`UID:healthops-${r.date}-${i}@local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART:${icsDate(r.date,start)}`,`DTEND:${icsDate(r.date,end)}`,`SUMMARY:${escapeIcs('HealthOps - '+r.type)}`,`DESCRIPTION:${escapeIcs(r.summary)}`,'END:VEVENT')});lines.push('END:VCALENDAR');download('healthops_calendario.ics',lines.join('\r\n'),'text/calendar;charset=utf-8')}
function escapeIcs(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n')}
function exportBackup(){const payload={app:'HealthOps Gabriel',version:APP_VERSION,exportedAt:new Date().toISOString(),checkins:getCheckins(),roster:getRoster()};download('healthops_backup.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8')}
function registerSW(){if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('service-worker.js').catch(()=>{})}
let deferredPrompt;function setupInstall(){window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$('installBtn').classList.add('hidden')}}}
init();


function setupCaffeine(){
  const log=[];
  const render=()=>{const total=log.reduce((s,x)=>s+x.mg,0);$('caffeineMg').value=total;$('caffeineLog').value=JSON.stringify(log);$('caffeineSummary').textContent=log.length?`Cafeína: ${total} mg · ${log.map(x=>`${x.qty}x ${x.label}`).join(' + ')}`:'Cafeína: 0 mg'};
  $('addCaffeine').onclick=()=>{const [key,mgRaw]=$('caffeineType').value.split('|');const qty=Math.max(1,Number($('caffeineQty').value||1));const label=$('caffeineType').selectedOptions[0].textContent.replace(/\s*\(~.*?\)/,'');log.push({type:key,label,qty,mg:qty*Number(mgRaw)});render()};
  $('clearCaffeine').onclick=()=>{log.splice(0,log.length);render()};
  render();
}

async function handleRosterFile(e){
  const file=e.target.files?.[0];
  if(!file){$('importStatus').textContent='';return}
  $('importStatus').textContent=`Lendo ${file.name}...`;
  try{
    let text='';
    if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
      if(!window.pdfjsLib) throw new Error('Biblioteca PDF.js não carregou. Confira sua conexão e tente novamente.');
      const buffer=await file.arrayBuffer();
      const pdf=await pdfjsLib.getDocument({data:buffer}).promise;
      const pages=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);
        const content=await page.getTextContent();
        pages.push(pdfItemsToLines(content.items));
      }
      text=pages.join('\n');
    }else{
      text=await file.text();
    }
    $('rosterText').value=text.trim();
    const preview=parseRosterLines(text);
    $('importStatus').innerHTML=`Arquivo lido: ${file.name}. Prévia: ${preview.length} itens possíveis. Clique em <strong>Processar escala e atualizar app</strong> para subir os dados para o HealthOps.`;
  }catch(err){
    $('importStatus').textContent=`Não consegui ler o arquivo: ${err.message}`;
  }
}
function pdfItemsToLines(items){
  const rows=[];
  for(const item of items){
    const tx=item.transform||[0,0,0,0,0,0];
    const x=Math.round(tx[4]); const y=Math.round(tx[5]);
    let row=rows.find(r=>Math.abs(r.y-y)<=3);
    if(!row){row={y,items:[]};rows.push(row)}
    row.items.push({x,str:item.str});
  }
  rows.sort((a,b)=>b.y-a.y);
  return rows.map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
}

function awakeWindowFor(date=todayISO()){
  const r=getRoster().find(x=>x.date===date);
  if(!r)return{start:'08:00',end:'22:30',reason:'padrão'};
  const txt=`${r.summary||''} ${r.type||''}`;
  if(r.type==='Recuperação'||/(chega|chegada|04:|05:|06:|07:|08:)/i.test(txt))return{start:'13:00',end:'22:30',reason:'recuperação pós-madrugada'};
  if(r.startTime){return{start:addMinutes(r.startTime,-180),end:r.endTime?addMinutes(r.endTime,90):'23:00',reason:'escala operacional'}};
  if(r.type==='Performance')return{start:'08:00',end:'22:30',reason:'dia livre/performance'};
  return{start:'08:00',end:'22:30',reason:'escala'};
}
function minutesNow(){const d=new Date();return d.getHours()*60+d.getMinutes()}
function timeToMin(t){const [h,m]=String(t).split(':').map(Number);return (h||0)*60+(m||0)}
function hydrateReminderSettings(){const r=getReminders();$('waterInterval').value=String(r.waterInterval||90);$('activityReminder').value=r.activityReminder||'on';$('notificationStatus').textContent=r.enabled?'Lembretes ativados neste aparelho.':'Lembretes desativados.'}
async function enableReminders(){
  if(!('Notification'in window)){$('notificationStatus').textContent='Este navegador não oferece notificações Web.';return}
  const perm=await Notification.requestPermission();
  if(perm!=='granted'){$('notificationStatus').textContent='Permissão de notificação não concedida.';return}
  setReminders({enabled:true,waterInterval:Number($('waterInterval').value||90),activityReminder:$('activityReminder').value,lastWater:null,lastActivity:null});
  hydrateReminderSettings();notify('HealthOps ativo','Vou lembrar água e atividade conforme sua janela acordada estimada.');scheduleReminderLoop();
}
function disableReminders(){setReminders({...getReminders(),enabled:false});hydrateReminderSettings()}
function notify(title,body){
  if(Notification.permission!=='granted')return;
  if(navigator.serviceWorker?.controller){navigator.serviceWorker.controller.postMessage({type:'notify',title,body});}
  else new Notification(title,{body,icon:'manifest.json'});
}
function scheduleReminderLoop(){
  clearTimeout(window.__healthopsReminderTimer);
  const tick=()=>{
    const cfg=getReminders();
    if(cfg.enabled&&Notification.permission==='granted'){
      const aw=awakeWindowFor(); const now=minutesNow(); const start=timeToMin(aw.start), end=timeToMin(aw.end);
      if(now>=start&&now<=end){
        const today=todayISO(); const stamp=new Date().toISOString();
        const lastWater=cfg.lastWater?new Date(cfg.lastWater):null;
        const dueWater=!lastWater||((Date.now()-lastWater.getTime())/60000>=Number(cfg.waterInterval||90));
        if(dueWater){cfg.lastWater=stamp;notify('Água agora','Janela acordada estimada: '+aw.reason+'. Beba água e registre no check-in.');}
        const lastAct=cfg.lastActivity?new Date(cfg.lastActivity):null;
        const alreadyWorked=(getCheckins().find(c=>c.date===today)?.workoutDone||[]).length>0;
        const activityHour= rHour(awakeWindowFor().start, 8);
        if(cfg.activityReminder==='on'&&!alreadyWorked&&now>=activityHour&&!lastAct){cfg.lastActivity=stamp;notify('Movimento HealthOps','Se couber na escala: caminhada, mobilidade ou treino curto hoje.');}
        setReminders(cfg);
      }
    }
    window.__healthopsReminderTimer=setTimeout(tick,15*60*1000);
  };
  tick();
}
function rHour(start,offset){return Math.min(timeToMin(start)+offset*60,20*60)}
