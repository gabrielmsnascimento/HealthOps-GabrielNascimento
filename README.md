# HealthOps Gabriel v3

PWA local/offline para acompanhar saúde, escala de voo, sono, treino, alimentação, TDAH/AH-SD e uso prescrito de sibutramina/BioMag.

## Como rodar localmente

1. Descompacte a pasta.
2. Abra um terminal dentro da pasta.
3. Rode:

```bash
python -m http.server 8000
```

4. Acesse:

```txt
http://localhost:8000
```

No celular, hospede em GitHub Pages, Netlify, Vercel ou servidor HTTPS e use “Adicionar à tela inicial”.

## O que mudou na v3

- Check-in expandido com sibutramina/BioMag, FC, pressão, água, café, fome, foco e sensibilidade sonora.
- Dashboard com badges, recuperação e alertas inteligentes.
- Escala manual editável.
- Parser de texto mais flexível para escala copiada do iFlight Neo/PDF.
- Exportação de CSV de check-ins.
- Exportação de CSV da escala.
- Exportação de CSV de calendário.
- Exportação de arquivo ICS para calendários.
- Backup JSON completo.
- Migração básica dos dados da v2 para v3 quando existirem no mesmo navegador.

## Próximas etapas sugeridas

- Importação real de PDF com PDF.js.
- Edição/exclusão individual de itens da escala.
- Gráficos mensais.
- Banco local IndexedDB.
- Login/sincronização com Supabase.
- Integração oficial com iFlight Neo apenas se houver API/exportação autorizada.
