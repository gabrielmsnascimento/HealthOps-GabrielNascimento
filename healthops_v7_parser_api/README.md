# HealthOps v7.0 — Parser API

Esta versão separa a leitura pesada dos PDFs do PWA.

## Arquitetura

- PWA HealthOps: interface, calendário, saúde, medicações, motores e armazenamento.
- Parser API Python: leitura dos PDFs LATAM/iFlight/IFN e devolução de JSON estruturado.

Fluxo:

```text
PDF(s) → API Python → tabela normalizada → jornadas JSON → PWA HealthOps
```

## Rodar localmente

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Teste:

```text
http://127.0.0.1:8000/health
```

## Endpoint

`POST /parse-roster`

Campo multipart: `files`, aceitando um ou vários PDFs.

## O que o parser já faz

- Usa `pdfplumber.extract_tables()`, que preserva melhor as colunas do PDF LATAM do que `pdf.js` no navegador.
- Reconstrói as 10 colunas essenciais da escala.
- Usa a data da chave/pairing como referência.
- Aplica `(+1)`, `(+2)`, `(+3)` de forma global.
- Agrupa voos em jornadas a partir da apresentação.
- Retorna voos, origem, destino, decolagem, pouso, apresentação, fim de jornada, tempo de voo e tempo de jornada.

## Próximo passo

Integrar o retorno JSON ao estado central do HealthOps no PWA.
