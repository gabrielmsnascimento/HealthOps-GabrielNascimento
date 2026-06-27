# Relatório de teste — HealthOps v2.0-alpha.1

Escalas de referência consideradas:

- Março/2026: DO, DR, HSB, HSBE, VC, voos OP/PS.
- Abril/2026: HSB, DO, voos nacionais/internacionais e continuidade de pareamentos.
- Maio/2026: continuação de Abril (<==), DO, HSBE e VC.
- Junho/2026: layout tabular IFN diferente, R320, CBF, EMER, ASB, CRMBSB, DO/DR e voos.
- Julho/2026: ASB, MCK, C32F, DO/DR e voos com múltiplas madrugadas.

Validações automatizadas no app:

- DO/DR/VC sem jornada.
- ASB até 6h.
- HSB/HSBE até 12h.
- Treinamentos sem tempo de voo.
- VC sem alerta de madrugada.
- Motor normativo carregado.

Pendências conhecidas:

- Separar com maior precisão tripulação simples/composta/revezamento quando o PDF não explicitar.
- Refinar repouso por base/fora de base e fuso/aclimatação.
- Validar ACT LATAM por cláusula completa após extração final de regras.
- Criar modo de comparação entre planejado x realizado.
