import { extractPdfText, parseIFNRoster } from './src/engines/parserIFN.js';
import { summarizeOperations, classifyToday } from './src/engines/operationsEngine.js';
import { evaluateRegulation } from './src/engines/regulatoryEngine.js';
import { buildHealthAlerts, estimateFatigue } from './src/engines/healthEngine.js';
import { calculatePerDiems } from './src/engines/perDiemEngine.js';
import { MEDICATION_CATALOG } from './src/data/medicationCatalog.js';

const APP_VERSION='v1.0-beta.1';
const STORAGE_KEY='healthops_v1_beta1_state';
let state=loadState();

function defaultState(){return {days:[],rawText:'',checkins:{},meds:[],medsTaken:{},config:{hiddenTabs:[]},debug:false}}
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
function renderAll(){applyMenu();renderHero();renderToday();renderRoster();renderOps();renderRules();renderPerDiem();renderMeds();renderSettings();}
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
  return `<div class="grid"><div><label class="form-field"><span>Água (ml)</span><input id="waterMl" type="number" min="0" step="250" value="${c.waterMl||0}"></label></div><div><label class="form-field"><span>Cafeína (mg)</span><input id="caffeineMg" type="number" min="0" step="20" value="${c.caffeineMg||0}"></label></div><div><label class="checkbox-row"><input id="exerciseDone" type="checkbox" ${c.exerciseDone?'checked':''}><span>Exercício feito hoje</span></label></div></div>`;
}
function bindQuickCheckin(){
  ['waterMl','caffeineMg'].forEach(id=>document.getElementById(id)?.addEventListener('change',e=>{const c=getCheckin();c[id]=Number(e.target.value)||0;setCheckin(c)}));
  document.getElementById('exerciseDone')?.addEventListener('change',e=>{const c=getCheckin();c.exerciseDone=e.target.checked;setCheckin(c)});
}
function renderRoster(){
  const el=document.getElementById('roster');
  el.innerHTML=`<div class="card"><h2>Escala IFN/iFlight Neo</h2><p class="muted">O parser beta agrupa linhas por data, separa voo, jornada, treinamento, reserva e folga.</p><div class="form-field"><label>Arquivo PDF/TXT</label><input id="fileInput" type="file" accept=".pdf,.txt,text/plain,application/pdf"></div><div class="form-field"><label>Texto extraído ou colado</label><textarea id="rosterText">${escapeHtml(state.rawText||'')}</textarea></div><div class="row"><button class="btn primary" id="processRoster">Processar escala</button><button class="btn danger" id="clearRoster">Limpar escala</button></div><p id="parseStatus" class="small muted">${state.days.length?`${state.days.length} dias processados.`:'Nenhuma escala processada.'}</p></div><div class="card"><h2>Dias processados</h2>${renderDaysTable(state.days)}</div>${state.debug?renderDebug():''}`;
  document.getElementById('fileInput').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;const st=document.getElementById('parseStatus');st.textContent='Lendo arquivo...';try{const text=await extractPdfText(file);document.getElementById('rosterText').value=text;st.textContent=`Texto extraído: ${text.length} caracteres. Clique em processar.`;}catch(err){st.textContent='Falha ao ler: '+err.message;}});
  document.getElementById('processRoster').addEventListener('click',()=>{const text=document.getElementById('rosterText').value;const parsed=parseIFNRoster(text);state.rawText=text;state.days=parsed.days;state.rows=parsed.rows;saveState();});
  document.getElementById('clearRoster').addEventListener('click',()=>{state.days=[];state.rawText='';state.rows=[];saveState();});
}
function renderDaysTable(days){
  if(!days.length)return '<div class="empty">Nenhum dia processado.</div>';
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Classificação</th><th>Jornada</th><th>Voo</th><th>Eventos</th></tr></thead><tbody>${days.map(d=>`<tr><td>${fmtDate(d.date)}</td><td>${d.classification}</td><td>${d.dutyHours}h</td><td>${d.flightHours}h</td><td>${d.events.map(e=>`<span class="pill ${e.isDayOff?'ok':e.category==='AIRPORT_STANDBY'?'warn':e.category==='FLIGHT'?'':'ok'}" title="${escapeHtml(e.reason||'')}">${e.code}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
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
  document.getElementById('perdiem').innerHTML=`<div class="card"><h2>Diárias</h2><p class="muted">Contagem por refeição, sem valores. Regra LATAM configurada: apuração de quarta a terça e pagamento na quinta seguinte.</p></div>${groups.length?groups.map(g=>`<div class="card"><h2>${fmtShort(g.start)} a ${fmtShort(g.end)}</h2><div class="metric">${g.count}</div><p class="submetric">diárias/refeições · pagamento previsto ${fmtShort(g.payDate)}</p><details><summary>Ver refeições</summary>${g.meals.map(m=>`<p class="small">${fmtShort(m.date)} · ${m.label} · ${m.event}</p>`).join('')}</details></div>`).join(''):'<div class="card"><div class="empty">Nenhuma diária reconhecida.</div></div>'}`;
}
function renderMeds(){
  const taken=takenMeds();
  document.getElementById('meds').innerHTML=`<div class="card"><h2>Medicações</h2><p class="muted">Banco local beta. O usuário pesquisa o nome; dados técnicos vêm do catálogo, não de perguntas manuais.</p><div class="row"><input id="medSearch" placeholder="Ex.: Atentah, Rosuvastatina, Sibutramina"><button class="btn primary" id="addMed">Adicionar</button></div><div id="medResult"></div></div><div class="card"><h2>Checklist de hoje</h2>${renderMedChecklist(taken)}</div>`;
  document.getElementById('medSearch').addEventListener('input',showMedResult);
  document.getElementById('addMed').addEventListener('click',()=>{const item=findMed();if(item&&!state.meds.some(m=>m.name===item.name)){state.meds.push(item);saveState();}});
  document.querySelectorAll('[data-med-check]').forEach(cb=>cb.addEventListener('change',e=>{state.medsTaken[todayISO()]=state.medsTaken[todayISO()]||[];const name=e.target.dataset.medCheck;if(e.target.checked&&!state.medsTaken[todayISO()].includes(name))state.medsTaken[todayISO()].push(name);if(!e.target.checked)state.medsTaken[todayISO()]=state.medsTaken[todayISO()].filter(x=>x!==name);saveState();}));
}
function showMedResult(){const box=document.getElementById('medResult');const item=findMed();const q=document.getElementById('medSearch').value.trim();if(!q){box.innerHTML='';return}box.innerHTML=item?`<div class="event"><strong>${item.name}</strong> <span class="pill ${medClass(item.aero)}">${item.aero}</span><p>Princípio ativo: ${item.active}</p><p>Doses comuns: ${item.doses.join(', ')}</p><ul>${item.reasons.map(r=>`<li>${r}</li>`).join('')}</ul></div>`:'<p class="muted">Não encontrado no banco local. Futuramente: consulta a base oficial/bula antes de cadastrar.</p>';}
function renderMedChecklist(taken){if(!state.meds.length)return '<div class="empty">Nenhuma medicação adicionada.</div>';return state.meds.map(m=>`<label class="checkbox-row"><input type="checkbox" data-med-check="${m.name}" ${taken.includes(m.name)?'checked':''}><span><b>${m.name}</b> <small class="pill ${medClass(m.aero)}">${m.aero}</small><br><small class="muted">${m.reasons[0]}</small></span></label>`).join('')}
function renderSettings(){
  const tabs=[['roster','Escala'],['ops','Operações'],['rules','Regulamentação'],['perdiem','Diárias'],['meds','Medicações']]; const hidden=state.config.hiddenTabs||[];
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
