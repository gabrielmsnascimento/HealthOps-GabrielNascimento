# Integração com o PWA

1. Rodar a API Python em `http://127.0.0.1:8000`.
2. Adicionar `frontend/healthops-parser-client.js` ao PWA.
3. Na tela de importação, em vez de processar o PDF localmente, chamar:

```js
const result = await window.HealthOpsParserApi.parseRosterWithApi(fileInput.files);
```

4. Usar `result.files[0].journeys` como fonte de verdade para calendário, regulamentação, diárias, recuperação e treinos.

## Observação

O módulo de diárias e comparativo deve continuar existindo no HealthOps, mas ele passará a calcular a partir das jornadas estruturadas retornadas pela API, não a partir do PDF de demonstrativo da empresa.
