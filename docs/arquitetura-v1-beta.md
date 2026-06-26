# Arquitetura v1 beta

Fluxo principal:

1. Parser IFN lê PDF/TXT e gera eventos.
2. Motor operacional agrupa eventos por dia.
3. Motor regulatório avalia jornada, repouso e madrugadas.
4. Motor de diárias conta refeições por janela CCT.
5. Motor saúde gera alertas de hidratação, cafeína, exercício e fadiga.

Modelo mental:

- Voo: etapa com tempo de voo próprio e jornada agrupada por apresentação.
- Treinamento: conta jornada pela duração informada no roster.
- Reserva aeroporto: conta jornada pela duração informada no roster.
- Sobreaviso: disponibilidade, não tratado como jornada base nesta versão.
- Folga: 24h regulamentares, zero jornada e zero voo.
