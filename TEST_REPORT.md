# HealthOps Motor Normativo v2.0-alpha.1

Camadas implementadas:

1. Lei nº 13.475/2017
2. RBAC 117 oficial
3. Guia RBAC 117 / Apêndice B
4. CCT Aeronautas 2025/2026
5. ACT LATAM Comissários 2025/2027
6. Parâmetros HealthOps configuráveis

## Regras iniciais

- DO/DR/VC não geram jornada nem tempo de voo.
- Operação na madrugada detectada por cruzamento entre 00h00 e 06h00.
- Limites de jornada/voo para tripulação simples usam tabela-base do Guia RBAC 117 Apêndice B.
- ASB validado como reserva de aeroporto até 6h.
- HSB/HSBE validado como sobreaviso até 12h.
- Treinamentos são jornada/atividade, mas não tempo de voo.
- Repouso de hotel >=10h fica como OK operacional, mantendo alerta de fadiga separado.
- Diárias seguem janelas da CCT/ACT e agrupamento LATAM quarta–terça.

## Testes com escalas enviadas

Esta versão inclui painel “Motor Normativo v2” e “Testes automáticos” no app. Após importar Março, Abril, Maio, Junho ou Julho, o painel valida:

- folgas e férias sem jornada;
- reserva ASB <=6h;
- HSB/HSBE <=12h;
- treinamentos sem FH;
- VC sem alerta de madrugada;
- regras normativas carregadas.

Os cálculos continuam em modo beta e devem ser conferidos manualmente antes de qualquer uso formal.
