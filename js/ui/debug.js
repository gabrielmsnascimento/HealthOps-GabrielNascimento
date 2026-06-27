export function renderDebug(state){return `<div class="card"><h2>Debug</h2><pre class="error">${state.debug.map(d=>`${d.time} — ${d.msg}`).join('\n')||'Sem eventos.'}</pre></div>`}
