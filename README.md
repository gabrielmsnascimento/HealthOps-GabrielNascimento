# HealthOps Gabriel v3.2 Parser Core

Atualização focada na Prioridade 1: parser operacional por jornadas.

Inclui:
- Parser IFN v5 estrutural para PDFs de escala publicada e executada;
- leitura de linhas LATAM com colunas CC/CCM + OP/PS;
- separação de jornadas por apresentação e não apenas por dia civil;
- correção de HSB/HSBE/ASB para não usar coluna DH como duração;
- DO/DR/VC/OFF sem jornada;
- voos LA8 com pós-corte de 45 min;
- base para validar publicada × executada usando demonstrativos da empresa como gabarito de classificação.

Observação: demonstrativos de pagamento são usados como referência de calibração, mas a entrada principal continua sendo escala publicada/executada IFN.
