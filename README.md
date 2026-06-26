# HealthOps Aeronauta v0.5.5

PWA para aeronautas com dashboard, escala iFlight Neo, jornada, fadiga, medicações/protocolos, check-in e exportação CSV/ICS.

## Novidades v0.5.5
- Alimentação por refeição: selecione o tipo, descreva e adicione múltiplos registros no dia.
- Dashboard com alertas de água, cafeína, alimentação, exercício e medicações pendentes.
- Checklist de medicações preserva itens já tomados no dia e mantém pendentes selecionáveis.
- Motor de siglas IFN com descrições operacionais para escala importada.
- Repouso entre jornadas simples ajustado para referência de 10h; mantém alertas de fadiga sem marcar 10h+ como repouso insuficiente.
- Cache PWA atualizado para forçar atualização no GitHub Pages.

## Como atualizar
Envie todos os arquivos descompactados para a raiz do repositório GitHub e faça commit.


## v0.5.5
- DO, DR e demais códigos de Day Off passam a ser classificados como Folga Regulamentar de 24h.
- Folgas regulamentares não entram como programação/jornada no motor de jornada.
- O motor exibe motivo explícito quando reconhecer folga regulamentar.
- Descanso simples de 10h ou mais permanece OK, com alertas separados apenas para risco de fadiga.
