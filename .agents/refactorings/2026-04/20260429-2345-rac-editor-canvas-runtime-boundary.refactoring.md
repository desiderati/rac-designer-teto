# Refatoração - Fronteira de runtime do canvas no RAC editor

## Contexto

Esta etapa continuou a frente `rac-editor-architecture` no branch `main`, sem worktree. O objetivo foi reduzir
dependências semânticas de Fabric/Canvas fora do slice `canvas` e atacar o ponto estrutural mais sensível: o
`house-manager` ainda mantinha o estado canônico como `HouseState<CanvasGroup>`.

## Decisões

- Modais e hooks gerais não recebem mais `CanvasObject` para edição genérica.
- `PilotiCanvasSelection` foi promovido para `canvas/ports` e deixou de carregar `group`.
- O tutorial recebe apenas posição de tela; a leitura de grupo fica no hook de canvas.
- Contraventamento e helpers visuais de porta superior/contraventamento foram concentrados no slice `canvas`.
- O viewer3d consome `House3DProjectionPort` e parsers baseados em DTOs.
- O estado interno do `house-manager` usa referências lógicas de vista (`string`).
- Grupos concretos ficam em registry de runtime e são projetados por `HouseRuntimeSnapshot` apenas quando necessário.
- A projeção runtime é cacheada entre notificações para cumprir o contrato de `useSyncExternalStore`.

## Evidências

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test`: passou, 85 arquivos e 220 testes.
- `rtk npm run build`: passou.
- `rtk npm run lint`: passou.
- `rtk git diff --check`: passou.
- `rtk rg` não encontrou `HouseState<CanvasGroup>` no núcleo `house-manager`/domain/infra/bootstrap.
- `rtk rg` não encontrou imports de `canvas/lib` em `viewer3d`, `modals` e hooks gerais.

## Pendências

- Transformar a fronteira pública de registro/remoção de vistas em DTO/command de runtime, reduzindo `CanvasGroup` em
  `HouseWritePort` e adapters.
- Avaliar se `house-manager-canvas-runtime`, `house-manager-views` e `house-manager-piloti` devem migrar para um adapter
  de canvas/infra mais explícito.
- Revalidar manualmente fluxos visuais complexos: abrir editor de piloti, navegar pilotis, editar contraventamento,
  alternar terreno, abrir viewer3d e remover/recriar vistas.
