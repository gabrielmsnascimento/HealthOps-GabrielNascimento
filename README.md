# HealthOps Gabriel v3.2

Correção focada na importação de escala e na percepção correta do dia.

## Novidades da v3.2

- Dashboard agora usa apenas a escala da data exata de hoje.
- Quando não houver escala para hoje, mostra “Sem dados disponíveis para a data de hoje”, sem presumir alta carga.
- PDF passa a preservar linhas por posição visual, melhorando o parser.
- Botão renomeado para “Processar escala e atualizar app”.
- Prévia de quantos itens o parser encontrou antes de gravar.
- Bloco “Próximos 4 dias” no dashboard.
- Botão para limpar somente a escala.
- Exemplo de julho não é mais usado como fallback automático.

## Fluxo correto

1. Selecione o PDF/TXT da escala.
2. Verifique se o texto apareceu no campo.
3. Clique em “Processar escala e atualizar app”.
4. Revise na aba Escala.
5. Exporte CSV/ICS se quiser levar para calendário.
