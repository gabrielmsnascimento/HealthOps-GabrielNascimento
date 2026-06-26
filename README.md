# HealthOps Aeronauta v0.5.1

Correção focada no parser de escala iFlight Neo / Roster Report.

## Novidades

- Leitura real de PDF no navegador via PDF.js.
- Parser compatível com datas no formato `01-Jun-2026`.
- Reconhecimento de linhas de voo LATAM (`LA####`), aeroportos e horários.
- Preserva múltiplos itens no mesmo dia para exportação ICS/CSV.
- Dashboard agrega o dia atual sem inventar dados quando não há escala para hoje.
- Status de importação mostra dias, itens e setores processados.

## Fluxo

1. Abrir aba **Escala**.
2. Selecionar o PDF do roster.
3. Conferir o texto extraído.
4. Clicar em **Processar escala e atualizar app**.
5. Conferir Dashboard, Jornada e Exportações.

## Observação

Os cálculos de jornada/regulamentação ainda são preliminares. O módulo não substitui conferência formal por Lei 13.475/17, RBAC 117, ACT aplicável, empresa, sindicato ou autoridade competente.
