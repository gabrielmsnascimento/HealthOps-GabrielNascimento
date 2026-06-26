import { extractPdfText, parseIFNRoster } from './src/engines/parserIFN.js';
import { summarizeOperations, classifyToday } from './src/engines/operationsEngine.js';
import { evaluateRegulation } from './src/engines/regulatoryEngine.js';
import { buildHealthAlerts, estimateFatigue } from './src/engines/healthEngine.js';
import { calculatePerDiems } from './src/engines/perDiemEngine.js';
import { MEDICATION_CATALOG } from './src/data/medicationCatalog.js';

const APP_VERSION='v1.0-beta.4';
const STORAGE_KEY='healthops_v1_beta4_state';
let state=loadState();

function defaultState(){return {days:[],rawText:'',checkins:{},meds:[],medsTaken:{},protocols:[],config:{hiddenTabs:['ops']},debug:false}}
function loadState(){try{return {...defaultState(),...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}}catch{return defaultState()}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}

function init(){
  document.getElementById('versionBadge').textContent=APP_VERSION;
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>activateTab(btn.dataset.tab)));
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  renderAll();
}
function activateTab(tab){
  const btn=document.querySelector(`.tab[data-tab="${tab}"]:not([hidden])`)||document.querySelector('.tab:not([hidden])');
  if(!btn)return;
  document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active'));
  btn.classList.add('active'); document.getElementById(btn.dataset.tab)?.classList.add('active');
}
function applyMenu(){
  const hidden=state.config?.hiddenTabs||[];
  document.querySelectorAll('.tab').forEach(btn=>{btn.hidden=hidden.includes(btn.dataset.tab)&&!['today','settings'].includes(btn.dataset.tab)});
  if(document.querySelector('.tab.active')?.hidden) activateTab('today');
}
function renderAll(){applyMenu();renderHero();renderToday();renderRoster();renderRules();renderPerDiem();renderHealth();renderMeds();renderSettings();}
function renderHero(){
  const s=summarizeOperations(state.days); const today=classifyToday(state.days);
  document.getElementById('heroSummary').innerHTML=`<div class="small muted">${APP_VERSION}</div><div class="metric">${state.days.length}</div><p class="submetric">dias processados</p><p><b>Hoje:</b> ${today.title}</p><p class="small muted">${s.totalFlight}h voo · ${s.totalDuty}h jornada · ${s.dayOffs} folgas</p>`;
}
function renderToday(){
  const today=classifyToday(state.days); const day=today.day; const fatigue=estimateFatigue(day); const alerts=[...(today.alerts||[]).map(text=>({level:'INFO',text})),...buildHealthAlerts(state)];
  const next=state.days.filter(d=>d.date>=todayISO()).slice(0,4);
  document.getElementById('today').innerHTML=`
    <div class="grid">
      <div class="card"><h2>Hoje</h2><div class="metric">${day?day.classification:'Sem dados'}</div><p class="submetric">${day?fmtDate(day.date):'Importe a escala'}</p></div>
      <div class="card"><h2>Jornada</h2><div class="metric">${day?day.dutyHours+'h':'—'}</div><p class="submetric">Tempo de voo: ${day?day.flightHours+'h':'—'}</p></div>
      <div class="card"><h2>Fadiga</h2><div class="metric">${fatigue.label}</div><p class="submetric">${fatigue.score===null?'Sem cálculo':fatigue.score+'/100'}</p></div>
      <div class="card"><h2>Medicações</h2><div class="metric">${takenMeds().length}/${state.meds.length}</div><p class="submetric">itens tomados hoje</p></div>
    </div>
    <div class="card"><h2>Alertas e lembretes</h2>${alerts.length?alerts.map(a=>`<div class="alert ${levelClass(a.level)}">${a.text}</div>`).join(''):'<div class="empty">Sem alertas no momento.</div>'}</div>
    <div class="card"><h2>Próximos 4 dias</h2>${next.length?next.map(d=>`<div class="event"><strong>${fmtDate(d.date)} — ${d.classification}</strong><p class="muted">Jornada ${d.dutyHours}h · Voo ${d.flightHours}h · ${d.events.map(e=>e.code).join(', ')}</p></div>`).join(''):'<div class="empty">Sem próximos dias na escala importada.</div>'}</div>
    <div class="card"><h2>Check-in rápido</h2>${renderQuickCheckin()}</div>`;
  bindQuickCheckin();
}
function renderQuickCheckin(){
  const c=getCheckin();
  const meals=Object.keys(c.meals||{}).length;
  const workouts=(c.workouts||[]).length;
  const caffeine=totalCaffeine(c);
  return `<div class="grid"><div><label class="form-field"><span>Água (ml)</span><input id="waterMl" type="number" min="0" step="250" value="${c.waterMl||0}"></label></div><div><label class="form-field"><span>Cafeína</span><select id="quickCaffeine"><option value="">Adicionar bebida</option><option value="Expresso|60">Expresso</option><option value="Café pequeno|80">Café pequeno</option><option value="Café médio|160">Café médio</option><option value="Café grande|240">Café grande</option><option value="Refrigerante cola|40">Refrigerante cola</option><option value="Energético|80">Energético</option></select></label><p class="submetric">Total estimado: ${caffeine} mg</p></div><div><label class="checkbox-row"><input id="exerciseDone" type="checkbox" ${c.exerciseDone?'checked':''}><span>Exercício feito hoje<br><small class="muted">${workouts} atividade(s) marcadas</small></span></label></div></div><p class="small muted">Refeições registradas hoje: ${meals}. Para detalhes, abra a aba Saúde.</p>`;
}
function bindQuickCheckin(){
  document.getElementById('waterMl')?.addEventListener('change',e=>{const c=getCheckin();c.waterMl=Number(e.target.value)||0;setCheckin(c)});
  document.getElementById('quickCaffeine')?.addEventListener('change',e=>{if(!e.target.value)return;const [label,mg]=e.target.value.split('|');const c=getCheckin();c.caffeineItems=c.caffeineItems||[];c.caffeineItems.push({label,mg:Number(mg),at:new Date().toISOString()});c.caffeineMg=totalCaffeine(c);setCheckin(c)});
  document.getElementById('exerciseDone')?.addEventListener('change',e=>{const c=getCheckin();c.exerciseDone=e.target.checked;setCheckin(c)});
}
function renderRoster(){
  const el=document.getElementById('roster');
  const s=summarizeOperations(state.days);
  el.innerHTML=`<div class="card"><h2>Escala IFN/iFlight Neo</h2><p class="muted">Resumo operacional e análise por recomendação de treino. A importação da escala fica no final da página.</p><div class="grid"><div class="mini-card"><h3>Dias processados</h3><div class="metric">${s.totalDays}</div></div><div class="mini-card"><h3>Jornada total</h3><div class="metric">${s.totalDuty}h</div></div><div class="mini-card"><h3>Tempo de voo</h3><div class="metric">${s.totalFlight}h</div></div><div class="mini-card"><h3>Folgas</h3><div class="metric">${s.dayOffs}</div></div></div></div>
  <div class="card"><h2>Dias processados</h2>${renderDaysTable(state.days)}</div>
  ${renderTrainingGroups(state.days)}
  ${state.debug?renderDebug():''}
  <div class="card"><h2>Importar ou atualizar escala</h2><p class="muted">Carregue PDF/TXT ou cole o texto. Depois clique em processar.</p><div class="form-field"><label>Arquivo PDF/TXT</label><input id="fileInput" type="file" accept=".pdf,.txt,text/plain,application/pdf"></div><div class="form-field"><label>Texto extraído ou colado</label><textarea id="rosterText">${escapeHtml(state.rawText||'')}</textarea></div><div class="row"><button class="btn primary" id="processRoster">Processar escala</button><button class="btn danger" id="clearRoster">Limpar escala</button></div><p id="parseStatus" class="small muted">${state.days.length?`${state.days.length} dias processados.`:'Nenhuma escala processada.'}</p></div>`;
  document.getElementById('fileInput').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;const st=document.getElementById('parseStatus');st.textContent='Lendo arquivo...';try{const text=await extractPdfText(file);document.getElementById('rosterText').value=text;st.textContent=`Texto extraído: ${text.length} caracteres. Clique em processar.`;}catch(err){st.textContent='Falha ao ler: '+err.message;}});
  document.getElementById('processRoster').addEventListener('click',()=>{const text=document.getElementById('rosterText').value;const parsed=parseIFNRoster(text);state.rawText=text;state.days=parsed.days;state.rows=parsed.rows;saveState();});
  document.getElementById('clearRoster').addEventListener('click',()=>{state.days=[];state.rawText='';state.rows=[];saveState();});
}
function renderDaysTable(days){
  if(!days.length)return '<div class="empty">Nenhum dia processado.</div>';
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Classificação</th><th>Jornada</th><th>Voo</th><th>Treino sugerido</th><th>Eventos</th></tr></thead><tbody>${days.map(d=>{const rec=recommendWorkout(d);return `<tr><td>${fmtDate(d.date)}</td><td>${d.classification}</td><td>${d.dutyHours}h</td><td>${d.flightHours}h</td><td><span class="workout-chip ${rec.className}">${rec.label}</span></td><td>${d.events.map(e=>`<span class="pill ${e.isDayOff?'ok':e.category==='AIRPORT_STANDBY'?'warn':e.category==='FLIGHT'?'':'ok'}" title="${escapeHtml(e.reason||'')}">${e.code}</span>`).join('')}</td></tr>`}).join('')}</tbody></table></div>`;
}
function renderTrainingGroups(days){
  if(!days.length)return '';
  const groups={};
  for(const d of days){const r=recommendWorkout(d);groups[r.key]=groups[r.key]||{rec:r,days:[]};groups[r.key].days.push(d);}
  return `<div class="card"><h2>Dias por treino recomendado</h2><div class="training-grid">${Object.values(groups).map(g=>`<div class="training-card ${g.rec.className}"><h3>${g.rec.label}</h3><p class="small muted">${g.rec.reason}</p>${g.days.map(d=>`<span class="date-pill">${fmtShort(d.date)}</span>`).join('')}</div>`).join('')}</div></div>`;
}
function recommendWorkout(day){
  if(!day)return {key:'none',label:'Sem dados',reason:'Importe a escala.',className:'rec-none'};
  if(day.classification==='Folga regulamentar')return {key:'complete',label:'Treino completo',reason:'Folga regulamentar: melhor janela para treino estruturado, se recuperação estiver boa.',className:'rec-complete'};
  if(day.classification==='Voo' && (day.dutyHours>=9 || day.events.some(e=>e.isNight)))return {key:'light',label:'Leve/mobilidade',reason:'Jornada longa ou madrugada: priorizar mobilidade, caminhada leve e recuperação.',className:'rec-light'};
  if(day.classification.includes('Reserva')||day.classification==='Treinamento')return {key:'short',label:'Treino curto + caminhada',reason:'Dia com programação sem voo: bom para treino curto, caminhada ou mobilidade.',className:'rec-short'};
  if(day.classification==='Voo')return {key:'moderate',label:'Curto/moderado',reason:'Voo com carga moderada: manter treino breve se houver energia.',className:'rec-moderate'};
  return {key:'recovery',label:'Recuperação',reason:'Dia operacional incerto: priorizar sono, água e alongamento.',className:'rec-recovery'};
}
function renderDebug(){return `<div class="card"><h2>Debug do parser</h2>${(state.rows||[]).slice(0,80).map(r=>`<p class="small"><code>${escapeHtml(r)}</code></p>`).join('')}</div>`}
function renderOps(){
  const s=summarizeOperations(state.days);
  document.getElementById('ops').innerHTML=`<div class="grid"><div class="card"><h2>Jornada total</h2><div class="metric">${s.totalDuty}h</div></div><div class="card"><h2>Tempo de voo</h2><div class="metric">${s.totalFlight}h</div></div><div class="card"><h2>Folgas</h2><div class="metric">${s.dayOffs}</div></div><div class="card"><h2>Reserva/Trein.</h2><div class="metric">${s.standbyDays+s.trainingDays}</div></div></div><div class="card"><h2>Eventos operacionais</h2>${state.days.flatMap(d=>d.events.map(e=>`<div class="event"><strong>${fmtDate(e.date)} — ${e.code}</strong><p>${e.label} · ${e.category}</p><p class="small muted">Jornada: ${e.dutyHours}h · Voo: ${e.flightHours}h · Conta jornada: ${e.countsAsDuty?'sim':'não'}</p><p>${e.reason||''}</p></div>`)).join('')||'<div class="empty">Nenhum evento.</div>'}</div>`;
}
function renderRules(){
  const alerts=evaluateRegulation(state.days);
  document.getElementById('rules').innerHTML=`<div class="card"><h2>Regulamentação</h2><p class="muted">Alertas preliminares. Não substitui ACT, jurídico, empresa, sindicato ou ANAC.</p></div>${alerts.map(a=>`<div class="card"><div class="alert ${levelClass(a.level)}"><h3>${fmtDate(a.date)} — ${a.title}</h3><p>${a.detail}</p></div></div>`).join('')||'<div class="card"><div class="empty">Sem alertas.</div></div>'}`;
}
function renderPerDiem(){
  const groups=calculatePerDiems(state.days);
  document.getElementById('perdiem').innerHTML=`<div class="card"><h2>Diárias</h2><p class="muted">Contagem por período/dia, não por voo. Refeições principais: almoço, jantar e ceia. Café e táxi aparecem separados. Apuração LATAM: quarta a terça, pagamento na quinta seguinte.</p></div>${groups.length?groups.map(g=>`<div class="card"><h2>${fmtShort(g.start)} a ${fmtShort(g.end)}</h2><div class="grid"><div><div class="metric">${g.principal}</div><p class="submetric">refeições principais</p></div><div><div class="metric">${g.cafe}</div><p class="submetric">cafés</p></div><div><div class="metric">${g.taxi}</div><p class="submetric">táxis</p></div></div><p class="submetric">pagamento previsto ${fmtShort(g.payDate)}</p><details><summary>Ver itens</summary>${renderPerDiemItems(g.meals)}</details></div>`).join(''):'<div class="card"><div class="empty">Nenhuma diária reconhecida.</div></div>'}`;
}
function renderPerDiemItems(meals){
  const byDate={};
  for(const m of meals){
    const key=fmtShort(m.date);
    byDate[key]=byDate[key]||[];
    if(!byDate[key].includes(m.label)) byDate[key].push(m.label);
  }
  return Object.entries(byDate).map(([date,items])=>`<p class="small"><b>${date}</b> - ${items.join(', ')}</p>`).join('');
}
function renderHealth(){
  const c=getCheckin();
  const meals=c.meals||{};
  const workoutOptions=['Treino curto','Treino completo','Mobilidade','Alongamento','Caminhada','Corrida','Piscina','Bike','Funcional'];
  const selected=new Set(c.workouts||[]);
  document.getElementById('health').innerHTML=`<div class="card"><h2>Saúde e check-in</h2><p class="muted">Registre alimentação por refeição, hidratação, cafeína e tipos de treino.</p><div class="grid"><label class="form-field"><span>Água (ml)</span><input id="healthWater" type="number" min="0" step="250" value="${c.waterMl||0}"></label><label class="form-field"><span>Adicionar cafeína</span><select id="healthCaffeineDrink"><option value="">Selecione tipo/tamanho</option><option value="Expresso|60">Expresso</option><option value="Café pequeno|80">Café pequeno</option><option value="Café médio|160">Café médio</option><option value="Café grande|240">Café grande</option><option value="Refrigerante cola|40">Refrigerante cola</option><option value="Energético|80">Energético</option></select><small class="muted">Total estimado hoje: ${totalCaffeine(c)} mg</small></label></div><div id="caffeineList">${renderCaffeineList(c)}</div></div>
  <div class="card"><h2>Alimentação</h2><div class="meal-grid"><label class="form-field"><span>Refeição</span><select id="mealType"><option>Café da manhã</option><option>Almoço</option><option>Lanche</option><option>Jantar</option><option>Ceia</option></select></label><label class="form-field"><span>Descrição</span><input id="mealDesc" placeholder="Ex.: arroz, frango, salada; lanche leve no voo"></label><button class="btn primary" id="addMeal">Adicionar</button></div><div id="mealList">${Object.entries(meals).length?Object.entries(meals).map(([k,v])=>`<div class="event"><strong>${k}</strong><p>${escapeHtml(v)}</p><button class="btn secondary small-btn" data-remove-meal="${k}">Remover</button></div>`).join(''):'<div class="empty">Nenhuma refeição registrada hoje.</div>'}</div></div>
  <div class="card"><h2>Treino feito</h2><div class="check-grid">${workoutOptions.map(w=>`<label class="checkbox-row compact"><input type="checkbox" data-workout="${w}" ${selected.has(w)?'checked':''}><span>${w}</span></label>`).join('')}</div></div>`;
  document.getElementById('healthWater')?.addEventListener('change',e=>{const c=getCheckin();c.waterMl=Number(e.target.value)||0;setCheckin(c)});
  document.getElementById('healthCaffeineDrink')?.addEventListener('change',e=>{if(!e.target.value)return;const [label,mg]=e.target.value.split('|');const c=getCheckin();c.caffeineItems=c.caffeineItems||[];c.caffeineItems.push({label,mg:Number(mg),at:new Date().toISOString()});c.caffeineMg=totalCaffeine(c);setCheckin(c)});
  document.querySelectorAll('[data-remove-caffeine]').forEach(b=>b.addEventListener('click',e=>{const c=getCheckin();c.caffeineItems=(c.caffeineItems||[]).filter((_,i)=>i!==Number(e.target.dataset.removeCaffeine));c.caffeineMg=totalCaffeine(c);setCheckin(c)}));
  document.getElementById('addMeal')?.addEventListener('click',()=>{const c=getCheckin();c.meals=c.meals||{};const type=document.getElementById('mealType').value;const desc=document.getElementById('mealDesc').value.trim();if(desc){c.meals[type]=desc;setCheckin(c)}});
  document.querySelectorAll('[data-remove-meal]').forEach(b=>b.addEventListener('click',e=>{const c=getCheckin();delete c.meals[e.target.dataset.removeMeal];setCheckin(c)}));
  document.querySelectorAll('[data-workout]').forEach(cb=>cb.addEventListener('change',e=>{const c=getCheckin();c.workouts=c.workouts||[];const val=e.target.dataset.workout;if(e.target.checked&&!c.workouts.includes(val))c.workouts.push(val);if(!e.target.checked)c.workouts=c.workouts.filter(x=>x!==val);c.exerciseDone=c.workouts.length>0;setCheckin(c)}));
}
function renderMeds(){
  const taken=takenMeds();
  const periods=['Ao acordar','Manhã','Tarde','Noite','Antes de dormir'];
  document.getElementById('meds').innerHTML=`<div class="card"><h2>Medicações e suplementações</h2><p class="muted">Pesquise no banco local, defina período de ingestão e prazo. Depois salve como protocolo favorito para reutilizar.</p><div class="med-add-grid"><input id="medSearch" placeholder="Ex.: Atentah, Rosuvastatina, Sibutramina"><select id="medPeriod">${periods.map(p=>`<option>${p}</option>`).join('')}</select><select id="medTerm"><option>Uso contínuo</option><option>7 dias</option><option>14 dias</option><option>30 dias</option><option>Manipulado/ciclo</option></select><button class="btn primary" id="addMed">Adicionar</button></div><div id="medResult"></div><div class="row"><button class="btn secondary" id="saveProtocol">Salvar lista atual como favorito</button><button class="btn secondary" id="loadProtocol">Carregar favorito</button></div><p class="small muted">Favoritos salvos: ${(state.protocols||[]).length}</p></div><div class="card"><h2>Checklist de hoje</h2>${renderMedChecklist(taken)}</div>`;
  document.getElementById('medSearch').addEventListener('input',showMedResult);
  document.getElementById('addMed').addEventListener('click',()=>{const item=findMed();if(item&&!state.meds.some(m=>m.name===item.name)){state.meds.push({...item,period:document.getElementById('medPeriod').value,term:document.getElementById('medTerm').value});saveState();}});
  document.getElementById('saveProtocol').addEventListener('click',()=>{if(!state.meds.length)return;state.protocols=state.protocols||[];state.protocols.push({name:'Protocolo '+new Date().toLocaleDateString('pt-BR'),meds:state.meds});saveState();});
  document.getElementById('loadProtocol').addEventListener('click',()=>{const p=(state.protocols||[]).at(-1);if(p){state.meds=p.meds;saveState();}});
  document.querySelectorAll('[data-med-check]').forEach(cb=>cb.addEventListener('change',e=>{state.medsTaken[todayISO()]=state.medsTaken[todayISO()]||[];const name=e.target.dataset.medCheck;if(e.target.checked&&!state.medsTaken[todayISO()].includes(name))state.medsTaken[todayISO()].push(name);if(!e.target.checked)state.medsTaken[todayISO()]=state.medsTaken[todayISO()].filter(x=>x!==name);saveState();}));
}
function showMedResult(){const box=document.getElementById('medResult');const item=findMed();const q=document.getElementById('medSearch').value.trim();if(!q){box.innerHTML='';return}box.innerHTML=item?`<div class="event"><strong>${item.name}</strong> <span class="pill ${medClass(item.aero)}">${item.aero}</span><p>Princípio ativo: ${item.active}</p><p>Doses comuns: ${item.doses.join(', ')}</p><ul>${item.reasons.map(r=>`<li>${r}</li>`).join('')}</ul></div>`:'<p class="muted">Não encontrado no banco local. Futuramente: consulta a base oficial/bula antes de cadastrar.</p>';}
function renderMedChecklist(taken){
  if(!state.meds.length)return '<div class="empty">Nenhuma medicação ou suplementação adicionada.</div>';
  const order=['Ao acordar','Manhã','Tarde','Noite','Antes de dormir'];
  const groups={};
  for(const m of state.meds){const p=m.period||'Manhã';groups[p]=groups[p]||[];groups[p].push(m);}
  return order.filter(p=>groups[p]).map(p=>`<div class="med-period"><h3>${p}</h3>${groups[p].map(m=>`<label class="checkbox-row"><input type="checkbox" data-med-check="${m.name}" ${taken.includes(m.name)?'checked':''}><span><b>${m.name}</b> <small class="pill ${medClass(m.aero)}">${m.aero}</small> <small class="pill">${m.term||'Uso contínuo'}</small><br><small class="muted">${m.reasons[0]}</small></span></label>`).join('')}</div>`).join('');
}
function renderCaffeineList(c){
  const items=c.caffeineItems||[];
  if(!items.length)return '<p class="small muted">Nenhuma bebida com cafeína registrada hoje.</p>';
  return items.map((it,i)=>`<span class="pill">${it.label} · ${it.mg}mg <button class="inline-x" data-remove-caffeine="${i}">×</button></span>`).join('');
}
function totalCaffeine(c){
  if(c.caffeineItems?.length)return c.caffeineItems.reduce((s,i)=>s+(Number(i.mg)||0),0);
  return Number(c.caffeineMg)||0;
}
function renderSettings(){
  const tabs=[['roster','Escala'],['rules','Regulamentação'],['perdiem','Diárias'],['health','Saúde/Check-in'],['meds','Medicações e suplementações']]; const hidden=state.config.hiddenTabs||[];
  document.getElementById('settings').innerHTML=`<div class="card"><h2>Configurações</h2><p>Versão: <b>${APP_VERSION}</b></p><label class="checkbox-row"><input id="debugToggle" type="checkbox" ${state.debug?'checked':''}><span>Ativar debug do parser</span></label></div><div class="card"><h2>Menu principal</h2>${tabs.map(([id,label])=>`<label class="checkbox-row"><input data-menu-toggle="${id}" type="checkbox" ${hidden.includes(id)?'':'checked'}><span>${label}</span></label>`).join('')}</div>`;
  document.getElementById('debugToggle').addEventListener('change',e=>{state.debug=e.target.checked;saveState();});
  document.querySelectorAll('[data-menu-toggle]').forEach(cb=>cb.addEventListener('change',e=>{const id=e.target.dataset.menuToggle;state.config.hiddenTabs=state.config.hiddenTabs||[];if(e.target.checked)state.config.hiddenTabs=state.config.hiddenTabs.filter(x=>x!==id);else if(!state.config.hiddenTabs.includes(id))state.config.hiddenTabs.push(id);saveState();}));
}
function findMed(){const q=document.getElementById('medSearch')?.value.trim().toLowerCase()||'';return MEDICATION_CATALOG.find(m=>m.name.toLowerCase().includes(q)||m.active.toLowerCase().includes(q));}
function takenMeds(){return state.medsTaken?.[todayISO()]||[]}
function getCheckin(){state.checkins=state.checkins||{};state.checkins[todayISO()]=state.checkins[todayISO()]||{};return state.checkins[todayISO()]}
function setCheckin(c){state.checkins[todayISO()]=c;saveState()}
function todayISO(){return new Date().toISOString().slice(0,10)}
function fmtDate(iso){return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}
function fmtShort(iso){return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function levelClass(l){return l==='DANGER'?'danger':l==='WARN'?'warn':l==='OK'?'ok':''}
function medClass(a){return a==='COMPATÍVEL'?'ok':a==='RESTRITO'?'warn':'danger'}
init();
