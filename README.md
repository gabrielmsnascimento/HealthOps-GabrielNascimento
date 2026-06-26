# HealthOps — v0.5.0

PWA especializado para aeronautas: escala, jornada, regulamentação, fadiga, saúde, medicações/protocolos, calendário e exportações.

## Novidades v0.5.0

- Arquitetura por motores:
  - `OpsEngine`: parser de escala, próximos dias, classificação operacional.
  - `DutyEngine`: cálculo preliminar de jornada, repouso e pontos de atenção.
  - `FatigueEngine`: índice de recuperação/fadiga com sono, hidratação, cafeína, treino e carga operacional.
  - `MedicationEngine`: catálogo/protocolos com Modo Aeronauta.
  - `ExportEngine`: exportação CSV/ICS.
- Nova aba **Jornada**.
- Dashboard não presume dados quando a escala de hoje não existe.
- Botão **Processar escala e atualizar app** após upload/texto.
- Próximos 4 dias baseados somente na escala importada/manual.
- Alertas como “ponto de atenção”, não como conclusão jurídica.

## Como atualizar no GitHub

1. Descompacte o ZIP.
2. Envie os arquivos descompactados para a raiz do repositório.
3. Commit sugerido: `v0.5.0 - Motores de operações, jornada e fadiga`.

## Aviso

O HealthOps é uma ferramenta de organização pessoal e apoio. Não substitui ANAC, CMA, médico examinador, empresa, sindicato, ACT aplicável ou interpretação jurídica/profissional.
