# Arquitetura HealthOps v1

## Objetivo

Separar importação, interpretação operacional, regras regulatórias e saúde/fadiga.

## Fluxo

1. Parser IFN lê PDF/TXT e extrai texto.
2. Parser transforma linhas em eventos.
3. Motor Operacional classifica eventos por tipo semântico.
4. Motor Regulatório avalia regras sobre os eventos.
5. Motor Saúde/Fadiga usa os mesmos dados para alertas pessoais.

## Evento semântico

Cada evento possui:

- data
- código/sigla
- categoria
- label
- horários
- se conta como jornada
- se conta como folga
- se conta como repouso
- motivo da classificação

## Decisão importante

Folgas regulamentares como DO e DR têm duração regulamentar, mas não são jornada. Portanto, aparecem como 24h de folga/repouso e 0h de jornada.
