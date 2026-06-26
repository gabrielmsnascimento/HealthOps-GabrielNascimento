# HealthOps Aeronautas v1.0-beta.7

Atualização focada na robustez do parser de PDFs IFN/iFlight Neo para escalas históricas.

## Correções principais

- Parser IFN v2 com normalização de linhas quebradas por PDF.
- Ignora linhas `<==` de pareamentos que começaram no mês anterior.
- Reconhece melhor `HSB`, `HSBE`, `DO`, `DR`, `VC`, `ASB`, `R320`, `CRMBSB`, `CBF`, `EMER` e voos `LA####`.
- Separa eventos por data real usando marcadores `(+1)`, `(+2)`, `(+3)`.
- Recalcula tempo de voo por trecho quando a coluna FH vem zerada no PDF.
- Evita alertas para férias/VC e folgas regulamentares.
- Debug do parser com linhas ignoradas, não processadas e eventos reconhecidos.

## Observação

O motor segue em beta. Use o modo Debug para validar Março, Abril, Maio e Junho antes de liberar para outros testadores.


## v1.0-beta.7
- Corrige leitura real de PDF no navegador usando PDF.js.
- Bloqueia processamento de binário PDF (%PDF) como texto.
- Adiciona limpeza de imports inválidos da biblioteca.
- Mantém parser IFN v2 para escalas históricas.
