export async function loadMedications(){const r=await fetch('data/medications.json');const data=await r.json();return data.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))}
export function searchMeds(meds,q='',type='all',purpose='all'){q=q.toLowerCase().trim();return meds.filter(m=>(type==='all'||m.type===type)&&(purpose==='all'||m.purpose===purpose)&&(!q||[m.name,m.active,m.class,m.purpose,...(m.doses||[]),...(m.schemes||[])].join(' ').toLowerCase().includes(q))).slice(0,60)}
export function aviationClass(m){return m.aviation||'compatível'}
