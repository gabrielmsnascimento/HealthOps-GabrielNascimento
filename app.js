import { extractPdfText, parseIFNRoster } from './src/engines/parserIFN.js';
import { summarizeOperations, classifyToday } from './src/engines/operationsEngine.js';
import { evaluateRegulation } from './src/engines/regulatoryEngine.js';
import { buildHealthAlerts, estimateFatigue } from './src/engines/healthEngine.js';
import { MEDICATION_CATALOG } from './src/data/medicationCatalog.js';

const APP_VERSION='v1.0-alpha.2';
const STORAGE_KEY='healthops_v1_alpha2_state';
let state = loadState();

function loadState(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {days:[], rawText:'', checkins:{}, meds:[], config:{hiddenTabs:[]}}}catch{return {days:[], rawText:'', checkins:{}, meds:[], config:{hiddenTabs:[]}}}
}
function saveState(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll();}

function initTabs(){
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=> activateTab(btn.dataset.tab)));
  applyMenuPreferences();
}
function activateTab(tabName){
  const targetButton = document.querySelector(`.tab[data-tab="${tabName}"]:not([hidden])`) || document.querySelector('.tab:not([hidden])');
  if(!targetButton) return;
  document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active'));
  targetButton.classList.add('active');
  const panel=document.getElementById(targetButton.dataset.tab);
  if(panel) panel.classList.add('active');
}
function applyMenuPreferences(){
  const hidden = state.config?.hiddenTabs || [];
  document.querySelectorAll('.tab').forEach(btn=>{
    const protectedTabs=['today','settings'];
    btn.hidden = hidden.includes(btn.dataset.tab) && !protectedTabs.includes(btn.dataset.tab);
  });
  const active=document.querySelector('.tab.active');
  if(active?.hidden) activateTab('today');
}
function renderAll(){applyMenuPreferences(); renderHeroSummary(); renderToday(); renderRoster(); renderOps(); renderRules(); renderMeds(); renderSettings();}

function renderHeroSummary(){
  const el=document.getElementById('heroSummary');
  const today=classifyToday(state.days);
  const medsToday=getTakenMeds().length;
  el.innerHTML=`<div class="small">Versão atual</div><div class="metric" style="font-size:24px">${APP_VERSION}</div><p>${today.title}</p><p class="small">${state.days.length} dias processados · ${state.meds.length} medicações · ${medsToday} tomadas hoje</p>`;
}

function renderToday(){
  const el=document.getElementById('today');
  const today=classifyToday(state.days);
  const healthAlerts=buildHealthAlerts(state);
  const fatigue = today.day ? estimateFatigue(today.day) : {label:'Sem dados',score:null};
  const todayTaken=getTakenMeds();
  const pendingMeds=state.meds.filter(m=>!todayTaken.includes(m.name));
  const nextDays=state.days.filter(d=>d.date>=new Date().toISOString().slice(0,10)).slice(0,4);
  const statusClass=today.status==='NO_DATA'?'warn':fatigue.score>=70?'danger':fatigue.score>=45?'warn':'ok';
  const alerts=[...(today.alerts||[]).map(t=>({level:'INFO',text:t})),...healthAlerts];
  if(state.meds.length && pendingMeds.length) alerts.push({level:'WARN',text:`Você ainda tem ${pendingMeds.length} item(ns) de medicação/suplemento pendente(s) hoje.`});
  el.innerHTML=`
    <div class="section-title"><h2>Hoje</h2><span class="badge info">${new Date().toLocaleDateString('pt-BR')}</span></div>
    <div class="grid">
      <div class="card ${statusClass}"><h2>Status operacional</h2><div class="metric">${today.title}</div><p class="submetric">${today.day?today.day.classification:'Sem dados disponíveis para a data de hoje'}</p></div>
      <div class="card"><h2>Fadiga estimada</h2><div class="metric">${fatigue.label}</div><p class="submetric">${fatigue.score===null?'Sem escala para hoje':fatigue.score+'/100'}</p></div>
      <div class="card"><h2>Medicações</h2><div class="metric">${todayTaken.length}/${state.meds.length}</div><p class="submetric">itens marcados hoje</p></div>
    </div>
    <div class="card"><h2>Alertas e lembretes</h2>${alerts.map(a=>`<div class="alert ${a.level==='DANGER'?'danger':a.level==='WARN'?'warn':'ok'}">${a.text}</div>`).join('')||'<div class="empty">Sem alertas no momento.</div>'}</div>
    <div class="card"><h2>Próximos 4 dias</h2>${nextDays.length?nextDays.map(d=>`<div class="event"><strong>${fmtDate(d.date)} — ${d.classification}</strong><p class="muted">Jornada: ${d.dutyHours}h · Voo: ${d.flightHours}h · Eventos: ${d.events.map(e=>e.code).join(', ')}</p></div>`).join(''):'<div class="empty">Sem próximos dias na escala importada.</div>'}</div>
  `;
}

function renderRoster(){
  const el=document.getElementById('roster');
  el.innerHTML=`<div class="card"><h2>Escala IFN/iFlight Neo</h2><p class="muted">Selecione um PDF/TXT ou cole o texto. Depois clique em processar.</p>
    <div class="form-field"><label>Arquivo PDF/TXT</label><input id="fileInput" type="file" accept=".pdf,.txt,text/plain,application/pdf" /></div>
    <div class="form-field"><label>Texto extraído ou colado</label><textarea id="rosterText" placeholder="Texto extraído da escala...">${escapeHtml(state.rawText||'')}</textarea></div>
    <div class="row"><button class="btn primary" id="processRoster">Processar escala</button><button class="btn secondary" id="pasteSample">Usar texto colado</button><button class="btn danger" id="clearRoster">Limpar escala</button></div>
    <p id="parseStatus" class="muted small">${state.days.length?`${state.days.length} dias processados.`:'Nenhuma escala processada.'}</p></div>
    <div class="card"><h2>Dias processados</h2>${renderDaysTable(state.days)}</div>`;
  document.getElementById('fileInput').addEventListener('change', async (ev)=>{
    const file=ev.target.files[0]; if(!file) return;
    const status=document.getElementById('parseStatus'); status.textContent='Lendo PDF/TXT...';
    try{ const text=await extractPdfText(file); document.getElementById('rosterText').value=text; status.textContent=`Texto extraído: ${text.length} caracteres. Clique em processar.`; }
    catch(err){ status.textContent='Falha ao ler arquivo: '+err.message; }
  });
  document.getElementById('processRoster').addEventListener('click',()=>{
    const text=document.getElementById('rosterText').value; const parsed=parseIFNRoster(text);
    state.rawText=text; state.days=parsed.days; saveState();
  });
  document.getElementById('pasteSample').addEventListener('click',()=>{state.rawText=document.getElementById('rosterText').value; saveState();});
  document.getElementById('clearRoster').addEventListener('click',()=>{state.days=[];state.rawText='';saveState();});
}
function renderDaysTable(days){
  if(!days.length) return '<p class="muted">Nenhum dia processado.</p>';
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Classificação</th><th>Jornada</th><th>Voo</th><th>Eventos</th></tr></thead><tbody>${days.map(d=>`<tr><td>${fmtDate(d.date)}</td><td>${d.classification}</td><td>${d.dutyHours}h</td><td>${d.flightHours}h</td><td>${d.events.map(e=>`<span class="pill ${e.isDayOff?'ok':''}" title="${escapeHtml(e.reason||'')}">${e.code}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderOps(){
  const el=document.getElementById('ops'); const s=summarizeOperations(state.days);
  el.innerHTML=`<div class="grid"><div class="card"><h2>Jornada total</h2><div class="metric">${s.totalDuty}h</div></div><div class="card"><h2>Tempo de voo</h2><div class="metric">${s.totalFlight}h</div></div><div class="card"><h2>Folgas</h2><div class="metric">${s.dayOffs}</div></div><div class="card"><h2>Dias com voo</h2><div class="metric">${s.flightDays}</div></div></div><div class="card"><h2>Eventos operacionais</h2>${renderEvents()}</div>`;
}
function renderEvents(){return state.days.flatMap(d=>d.events.map(e=>`<div class="event"><strong>${fmtDate(e.date)} — ${e.code}</strong><p>${e.label} · ${e.category}</p><p class="muted">${e.reason||'Sem motivo cadastrado.'}</p><p class="small">Conta como jornada: <b>${e.countsAsDuty?'sim':'não'}</b> · Conta como folga: <b>${e.isDayOff?'sim':'não'}</b></p></div>`)).join('')||'<p class="muted">Nenhum evento.</p>'}

function renderRules(){
  const alerts=evaluateRegulation(state.days);
  document.getElementById('rules').innerHTML=`<div class="card"><h2>Regulamentação</h2><p class="muted">Motor inicial. Os alertas indicam pontos de atenção e não substituem ACT, jurídico, empresa, sindicato ou ANAC.</p></div><div class="list">${alerts.map(a=>`<div class="card ${a.level==='WARN'?'danger':a.level==='OK'?'ok':'warn'}"><h3>${fmtDate(a.date)} — ${a.title}</h3><p>${a.detail}</p></div>`).join('')||'<div class="card"><p class="muted">Sem alertas.</p></div>'}</div>`;
}

function renderMeds(){
  const today = new Date().toISOString().slice(0,10); const taken = state.medsTaken?.[today] || [];
  document.getElementById('meds').innerHTML=`<div class="card"><h2>Medicações</h2><p class="muted">Banco inicial para aeronautas. Pesquise e adicione sem preencher dados técnicos manualmente.</p><div class="row"><input id="medSearch" placeholder="Ex.: Atentah, Rosuvastatina, Sibutramina"/><button class="btn primary" id="addMed">Adicionar</button></div><div id="medResult"></div></div><div class="card"><h2>Checklist de hoje</h2>${renderMedChecklist(taken)}</div>`;
  document.getElementById('medSearch').addEventListener('input',showMedResult);
  document.getElementById('addMed').addEventListener('click',()=>{const q=document.getElementById('medSearch').value.trim().toLowerCase(); const item=MEDICATION_CATALOG.find(m=>m.name.toLowerCase().includes(q)||m.active.toLowerCase().includes(q)); if(item && !state.meds.some(m=>m.name===item.name)){state.meds.push(item); saveState();}});
  document.querySelectorAll('[data-med-check]').forEach(cb=>cb.addEventListener('change',e=>{state.medsTaken=state.medsTaken||{}; state.medsTaken[today]=state.medsTaken[today]||[]; const name=e.target.dataset.medCheck; if(e.target.checked && !state.medsTaken[today].includes(name)) state.medsTaken[today].push(name); if(!e.target.checked) state.medsTaken[today]=state.medsTaken[today].filter(x=>x!==name); saveState();}));
}
function showMedResult(){
 const q=document.getElementById('medSearch').value.trim().toLowerCase(); const box=document.getElementById('medResult'); if(!q){box.innerHTML='';return} const item=MEDICATION_CATALOG.find(m=>m.name.toLowerCase().includes(q)||m.active.toLowerCase().includes(q)); box.innerHTML=item?`<div class="event"><strong>${item.name}</strong> <span class="pill ${item.aero==='COMPATÍVEL'?'ok':item.aero==='RESTRITO'?'warn':'danger'}">${item.aero}</span><p>Princípio ativo: ${item.active}</p><ul>${item.reasons.map(r=>`<li>${r}</li>`).join('')}</ul></div>`:'<p class="muted">Não encontrado no banco local. Na próxima fase, este ponto será integrado a base oficial/API.</p>';
}
function renderMedChecklist(taken){if(!state.meds.length) return '<p class="muted">Nenhuma medicação adicionada.</p>'; return state.meds.map(m=>`<label class="checkbox-row"><input type="checkbox" data-med-check="${m.name}" ${taken.includes(m.name)?'checked':''}/><span>${m.name} <small class="pill ${m.aero==='COMPATÍVEL'?'ok':m.aero==='RESTRITO'?'warn':'danger'}">${m.aero}</small></span></label>`).join('')}

function renderSettings(){
  const tabs=[
    ['roster','Escala'],['ops','Operações'],['rules','Regulamentação'],['meds','Medicações']
  ];
  const hidden=state.config?.hiddenTabs||[];
  document.getElementById('settings').innerHTML=`
    <div class="card"><h2>Configurações</h2><p>Versão: <b>${APP_VERSION}</b></p><p class="muted">Fase 2: Design system, dashboard revisado e menu personalizável. Fase 1 preservada: parser IFN, motores operacional/regulatório e banco local.</p></div>
    <div class="card"><h2>Menu principal</h2><p class="muted">Escolha quais módulos aparecem no menu. Hoje e Configurações ficam sempre visíveis.</p><div class="switch-list">
      ${tabs.map(([id,label])=>`<label class="checkbox-row"><input type="checkbox" data-menu-toggle="${id}" ${!hidden.includes(id)?'checked':''}/><span>${label}<br><small class="muted">${menuDescription(id)}</small></span></label>`).join('')}
    </div></div>
    <div class="card"><h2>Aparência</h2><div class="grid"><div><b>Componentes padronizados</b><p class="muted">Botões, checkboxes, cards, inputs, tabelas e alertas agora usam o mesmo tamanho e espaçamento.</p></div><div><b>Pronto para beta</b><p class="muted">A próxima fase pode adicionar login Google, Supabase e feedback de testadores.</p></div></div></div>`;
  document.querySelectorAll('[data-menu-toggle]').forEach(cb=>cb.addEventListener('change',e=>{
    state.config=state.config||{}; state.config.hiddenTabs=state.config.hiddenTabs||[];
    const id=e.target.dataset.menuToggle;
    if(e.target.checked) state.config.hiddenTabs=state.config.hiddenTabs.filter(x=>x!==id);
    else if(!state.config.hiddenTabs.includes(id)) state.config.hiddenTabs.push(id);
    saveState();
  }));
}
function menuDescription(id){return {roster:'Importação e processamento IFN',ops:'Resumo operacional da escala',rules:'Pontos de atenção legais/regulatórios',meds:'Protocolos e checklist diário'}[id]||''}
function getTakenMeds(){const today = new Date().toISOString().slice(0,10); return state.medsTaken?.[today] || []}

function fmtDate(iso){return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
initTabs(); renderAll();
