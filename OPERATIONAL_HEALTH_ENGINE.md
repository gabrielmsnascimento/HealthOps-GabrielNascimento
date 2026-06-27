# Arquitetura HealthOps

Na fase beta, o app roda de forma autocontida pelo `index.html` para simplificar publicação no GitHub Pages.
A estrutura modular em `/js/engines` espelha os motores planejados para a migração definitiva:

- Parser IFN/iFlight Neo
- Motor Operacional
- Motor Regulatório
- Motor de Diárias
- Motor de Saúde/Fadiga
- Motor de Medicações e Suplementações
- Storage local/PWA
