# HealthOps Aeronautas v5.5 Parser Real

Build limpo baseado no repositório enviado, com foco em restaurar navegação, importação PDF/TXT e parser por layout visual do PDF.

## Alterações principais

- Substitui a versão quebrada v5.4 por um `index.html` funcional e autocontido.
- Parser tenta ler o PDF por coordenadas visuais, preservando as 10 colunas essenciais da escala IFN/iFlight Neo.
- Regra global para horários com `(+1)`, `(+2)` e `(+3)`.
- Mantém módulos: Início, Escala, Saúde, Medicações, Relatório, Validação e Debug.
- Service Worker com novo cache para evitar ficar preso em versões anteriores.

## Upload no GitHub

Suba todos os arquivos do ZIP na raiz do repositório, substituindo os existentes.
Depois, limpe o cache/reinstale o PWA no celular.
