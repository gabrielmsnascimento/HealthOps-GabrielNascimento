/* Parser IFN/iFlight Neo v2 - módulo de referência.
   A implementação executável da beta está em index.html para uso direto no GitHub Pages. */
export function normalizeRosterText(raw){
  return String(raw||'')
    .replace(/[\u000c\ufffe]/g,' ')
    .replace(/(HSB|HSBE|ASB|CRMBSB|R320|CBF|EMER)\s*-\s*/g,'$1-')
    .replace(/(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})/g,'\n$1-$2-$3')
    .replace(/\n\s*([A-Z]{2}\d{4})/g,'\n$1')
    .replace(/\s+/g,' ')
    .replace(/(\d{2}-\w{3}-\d{4})/g,'\n$1')
    .trim();
}
export const PARSER_NOTES = [
  'Ignorar linhas <== herdadas de mês anterior quando não pertencem ao período ativo.',
  'Reconhecer DO/DR como folga regulamentar, VC como férias, HSB/HSBE/ASB como sobreaviso/reserva.',
  'Recalcular FH quando o PDF vier zerado, usando DEP/ARR por etapa.'
];
