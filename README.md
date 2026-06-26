# HealthOps Aeronautas v1.0-beta.2

Versão beta focada em corrigir o núcleo operacional antes de ampliar login/sincronização.

## Principais mudanças

- Restaura aba Saúde/check-in com alimentação por refeição, tipos de treino e hidratação/cafeína.
- Corrige leitura de FH em trechos com debrief + FH 00:00, como LA3263 e LA3168.
- Refina diárias: principais, café e táxi separados; cálculo por dia/período, não por voo.


- Parser IFN/iFlight Neo reestruturado por eventos.
- Separação real entre jornada, tempo de voo, treinamento, reserva, sobreaviso e folga.
- DO/DR e equivalentes tratados como folga regulamentar de 24h, sem entrar em jornada.
- R320, CBF, EMER, CRMBSB, ASB e voos LA agora usam duração do próprio roster.
- Motor regulatório revisado com alertas menos genéricos.
- Cálculo de diárias por refeições, com apuração LATAM de quarta a terça e pagamento na quinta seguinte.
- UI reconstruída com cards, tabelas, botões e checkboxes padronizados.
- Debug do parser nas configurações.

## Regra de diárias implementada

A contagem usa as janelas da CCT 2025/2026: café 05:00–08:00, almoço 11:00–13:00, jantar 19:00–20:00 e ceia 00:00–01:00. Esta versão conta quantidades, sem valores.

## Aviso

O app é ferramenta de apoio. Não substitui jurídico, ACT, empresa, sindicato, ANAC ou avaliação médica.
