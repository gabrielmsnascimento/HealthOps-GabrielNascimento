# HealthOps Aeronautas v2.0-alpha.7-clean

Build simplificado para testes de leitura de escalas antes da aplicação mobile definitiva.

## O que muda
- Estrutura reduzida: `index.html`, `manifest.json`, `service-worker.js`, `.nojekyll` e `README.md`.
- O app não depende mais de arquivos antigos `app.js`, `styles.css`, `css/`, `js/` ou `src/` para rodar esta versão de teste.
- Service Worker em modo network-first, limpando caches antigos.
- Versão visível: `v2.0-alpha.7-clean`.

## Como subir no GitHub
1. Descompacte este ZIP.
2. Envie todos os arquivos para a raiz do repositório.
3. Se possível, apague arquivos antigos duplicados que não são usados nesta versão: `app.js`, `styles.css`, pastas `css`, `js`, `src` e `docs` antigas.
4. Aguarde o GitHub Pages publicar.
5. No celular, remova o PWA/atalho antigo ou limpe cache e instale novamente.

Commit sugerido:

```text
v2.0-alpha.7-clean - Build simplificado para testes de parser
```
