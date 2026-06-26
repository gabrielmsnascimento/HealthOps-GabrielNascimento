# HealthOps Gabriel v3.1

PWA pessoal para acompanhar saúde, rotina de voos, escala, sono, sibutramina/BioMag, TDAH/AH-SD, treinos, alimentação e exportações.

## Novidades da v3.1

- Importação de PDF/TXT da escala com leitura via PDF.js.
- Campo de cafeína por tipo de bebida, com conversão estimada para mg.
- Atividade física com múltiplas caixas de seleção.
- Campo de resumo alimentar sem contagem de calorias.
- Lembretes locais de água e atividade física para Android/PWA, usando janelas acordadas estimadas pela escala.
- Service worker atualizado para notificações locais.

## Observação sobre notificações

Notificações Web em PWA dependem de permissão do navegador e do Android. Sem servidor próprio, elas são lembretes locais enquanto o app/PWA consegue manter timers ativos. Push real em nuvem exigirá backend, como Supabase Edge Functions ou Firebase Cloud Messaging.
