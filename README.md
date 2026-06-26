# HealthOps Aeronauta v0.5.2

PWA local/offline para aeronautas, com motores de escala, jornada/regulamentação, fadiga, medicações/protocolos e exportações CSV/ICS.

## Novidades da v0.5.2

- Badge fixo com a versão do app no canto inferior direito.
- Medicações agora exibem o motivo da classificação aeronáutica.
- Sibutramina e itens sensíveis mostram justificativa operacional, não apenas etiqueta vermelha.
- Jornada/regulamentação agora exibe pontos de atenção com motivo e referência da regra.
- Primeiros alertas estruturados para:
  - carga operacional alta;
  - repouso abaixo da referência base;
  - jornada acima do limite base configurado;
  - possíveis madrugadas em janela de 168h;
  - apresentação antes das 10h após monofolga.

## Aviso

Os cálculos regulatórios são preliminares e servem como apoio operacional. Devem ser conferidos com Lei 13.475/17, RBAC 117, ACT aplicável, empresa, sindicato e/ou autoridade competente.

## Publicação no GitHub Pages

Envie os arquivos descompactados para a raiz do repositório e publique pela branch `main` em `/root`.

Commit sugerido:

```text
v0.5.2 - Badge de versão e motivos de alertas
```
