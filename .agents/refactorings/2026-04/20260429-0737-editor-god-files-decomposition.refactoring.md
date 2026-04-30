# RefatoraÃ§Ã£o - DecomposiÃ§Ã£o de `RacEditor.tsx` e `house-manager.ts`

## Contexto

Esta etapa continuou a refatoraÃ§Ã£o arquitetural do editor RAC no branch `main`, sem worktree. O objetivo era decompor
os dois arquivos mais concentradores: `RacEditor.tsx` e `house-manager.ts`.

## Problema

- `RacEditor.tsx` acumulava provider, composiÃ§Ã£o de hooks, Ã¡rvore visual e lazy loading do visualizador 3D.
- `house-manager.ts` acumulava singleton, estado/persistÃªncia, sessÃ£o, canvas runtime, rebuild, snapshot, views, piloti e efeitos automÃ¡ticos.
- Alguns fluxos de UI ainda chamavam o singleton diretamente em vez de usar portas transitÃ³rias ou snapshots de estado.

## DecisÃµes

- Manter `RacEditor.tsx` como raiz fina com `EditorStoreProvider`.
- Mover composiÃ§Ã£o do editor para `RacEditorContent`.
- Mover renderizaÃ§Ã£o declarativa para `RacEditorLayout`.
- Mover lazy loading do visualizador 3D para `RacEditor3DViewerOverlay`.
- Transformar `house-manager.ts` em export da instÃ¢ncia legada.
- Mover a classe para `HouseManagerFacade`, delegando responsabilidades para mÃ³dulos especÃ­ficos.
- Introduzir `HouseManagerCanvasPort` para que o manager nÃ£o dependa de `FabricCanvas`.

## MÃ³dulos extraÃ­dos

- `house-manager-state.ts`: posse do aggregate e persistÃªncia.
- `house-manager-session.ts`: metadados de sessÃ£o/famÃ­lia/alturas selecionadas.
- `house-manager-canvas-runtime.ts`: acesso ao canvas por port.
- `house-manager-fabric-canvas-adapter.ts`: adaptaÃ§Ã£o Fabric -> port de canvas.
- `house-manager-notifier.ts`: assinatura e notificaÃ§Ã£o.
- `house-manager-views.ts`: registro, remoÃ§Ã£o e rebuild de vistas.
- `house-manager-piloti.ts`: atualizaÃ§Ã£o e cÃ¡lculo de pilotis.
- `house-manager-auto-effects.ts`: portas de topo, escadas e contraventamento automÃ¡tico.
- `house-manager-snapshot.ts`: inserÃ§Ã£o de imagem 3D no canvas.

## MigraÃ§Ãµes de acoplamento

- Restart do tutorial usa `HouseWritePort.resetHouse`.
- Undo e import JSON usam `HouseWritePort.rebuildHouseFromCanvas`.
- Snapshot 3D usa `HouseWritePort.insert3DSnapshotOnCanvas`.
- Leitura de alturas e tipo de terreno usa `HouseReadPort`.
- Contraventamento e seleÃ§Ã£o de canvas usam `useHouseSnapshot` para leitura reativa.

## ValidaÃ§Ã£o

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- Testes focados: passaram, 13 arquivos e 54 testes.
- `rtk npm run test`: passou, 78 arquivos e 205 testes.
- `rtk npm run lint`: passou com warning prÃ©-existente em `House3DScene.tsx`.
- `rtk npm run build`: passou.
- `rtk git diff --check`: sem problemas.

## Estado final

- `RacEditor.tsx` tem apenas a raiz do provider.
- `house-manager.ts` tem apenas o export do singleton legado.
- A lÃ³gica pesada foi distribuÃ­da em mÃ³dulos coesos e testados.
- Restam como fronteiras legadas: `house-store`, debug bridge e inicializaÃ§Ã£o do manager.

## AtualizaÃ§Ã£o - 2026-04-29 10:36

### Continuidade executada

- Removido o escape hatch getRuntimeCanvas() do CanvasHandle.
- Criadas portas documentais, debug, runtime e estado da casa.
- Criados adapters Fabric para documento, debug, comandos e HouseManagerCanvasPort.
- Movidos hooks com dependÃªncia Fabric para ui/canvas/adapters/hooks.
- ExtraÃ­dos HouseManagerCommandService e HouseManagerQueryService.
- Promovida a regra de recomendaÃ§Ã£o de piloti para src/domain/house/use-cases/house-piloti.use-case.ts.
- ExtraÃ­dos useRacEditorController, useRacEditorCanvasController e useRacEditorContraventamentoController.

### RevisÃ£o do estado final

- Canvas.tsx nÃ£o importa Fabric diretamente e nÃ£o expÃµe runtime.
- src/components/rac-editor/hooks, store, domÃ­nio e infra nÃ£o importam Fabric diretamente.
- Consumidores diretos do singleton houseManager ficaram restritos a adapters de infra e testes de caracterizaÃ§Ã£o.
- house-store, debug bridge e inicializaÃ§Ã£o jÃ¡ passam por ports/adapters transitÃ³rios.
- useRacEditorController ainda Ã© grande, mas nÃ£o Ã© mais componente visual e jÃ¡ comeÃ§ou a ser dividido por fluxo.

### ValidaÃ§Ã£o adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Recorte amplo de Vitest em editor/store/adapters/domÃ­nio/infra: passou, 66 arquivos e 184 testes.
- rtk npm run build: passou.
- rtk npm run lint: passou com warning pré-existente em House3DScene.tsx.

## Atualizacao - 2026-04-29 12:03

### Continuidade executada

- Criado `EditorPortsContext` para compor ports da casa no bootstrap.
- Migrados consumidores de UI/hooks para `useEditorPorts`.
- Renomeados adapters `legacy-house-*` para `house-manager-*`.
- Renomeado `legacyPilotiEditorPort` para `houseManagerPilotiEditorPort`.
- Extraidos `useRacEditorTutorialController` e `useRacEditorShellController`.
- Extraido `HouseManagerEffects` da fachada do manager.
- Movidas as regras puras `resolveHouseViewInsertion` e `calculateStackedViewPositions` para o dominio.

### Revisao do estado final

- Imports `legacyHouse*Port` nao aparecem mais na UI/hooks/bootstrap.
- Adapters sobre `houseManager` estao em `src/infra/house/house-manager-*-adapter.ts`.
- O bootstrap virou a zona de composicao dos ports atuais.
- O hook principal do editor ainda e grande, mas ja delega canvas, tutorial, shell, contraventamento, documentos e toolbar.
- A fachada do manager segue publica, porem efeitos automaticos, comandos, queries, runtime, estado e sessao estao separados.

### Validacao adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Testes focados de dominio/editor/infra: passaram.
- rtk npm run test: passou, 84 arquivos e 221 testes.
- rtk npm run build: passou.
- rtk npm run lint: passou com warning pre-existente em House3DScene.tsx.
- rtk git diff --check: sem erros de whitespace, com warnings locais de conversao LF -> CRLF.

## Atualizacao - 2026-04-29 12:24

### Continuidade executada

- Criado `CanvasInteractionPort` para o contrato imperativo antes declarado em `Canvas.tsx`.
- Criado `CanvasSelectionPort` para os tipos de selecao emitidos pelo canvas.
- Migrados hooks, modais e `RacEditorCanvas` para depender desses contratos em vez de importar tipos do componente visual.
- `Canvas.tsx` passou a implementar contratos de store/ports e deixou de ser fonte publica desses tipos.

### Revisao do estado final

- Hooks de `src/components/rac-editor/hooks` nao importam mais `Canvas.tsx`.
- `RacEditorCanvas.tsx` e o unico consumidor direto do componente `Canvas`.
- O acoplamento com Fabric continua restrito ao componente/adapters/factories de canvas.

### Validacao adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Testes focados de bootstrap/canvas/editor: passaram, 4 arquivos e 8 testes.

## Atualizacao - 2026-04-29 12:30

### Continuidade executada

- Criado `useRacEditorToolbarController` para agregar toolbar model e read model da casa.
- Criado `HouseManagerSessionService` para coordenar familia, alturas selecionadas, reset e sync de projeto.
- `HouseManagerFacade` passou a delegar sessao ao novo servico.

### Revisao do estado final

- O controller principal tem menos dependencias diretas de hooks de leitura.
- A fachada do manager reduziu mais uma responsabilidade concreta sem alterar o contrato publico.

### Validacao adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Testes focados do manager/infra: passaram, 3 arquivos e 17 testes.

## Atualizacao - 2026-04-29 12:36

### Continuidade executada

- Criado `buildRacEditorLayoutProps` para montar o contrato visual do layout.
- `useRacEditorController` deixou de conter o bloco aninhado de `RacEditorLayoutProps`.

### Revisao do estado final

- O controller principal permanece como orquestrador de fluxos.
- A traducao para props visuais fica isolada e tipada.

### Validacao adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Testes focados de editor/bootstrap/canvas: passaram, 3 arquivos e 4 testes.

## Atualizacao - 2026-04-29 12:40

### Continuidade executada

- Removido acesso `topGroup.canvas?.requestRenderAll()` de `useContraventamentoCommands`.
- Renderizacao passou a ser solicitada por `canvasRef.current?.renderAll()`.

### Revisao do estado final

- Hooks de aplicacao nao acionam mais renderizacao por propriedade `.canvas` de objetos Fabric.
- Acesso direto ao runtime permanece restrito aos adapters/factories de canvas.

### Validacao adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- Testes focados de contraventamento/manager: passaram, 2 arquivos e 19 testes.

## Atualização - 2026-04-29 15:10

### Continuidade executada

- Consolidado `src/components/rac-editor/canvas` como slice com `hooks`, `lib`, `store` e `ui`.
- Movidos ports/tipos do canvas para `canvas/store`.
- Movidos helpers, factories e adapters Fabric para `canvas/lib` e `canvas/ui`.
- Movido `house-auto-stairs` para `canvas/lib`, por ser lógica visual Fabric.
- Extraído `createHouseGroupForView` para `canvas/lib/house-view-groups.ts`.
- Renomeado `EditorStoreProvider` para `RacEditorStoreProvider`.
- Consolidado `src/components/rac-editor/menus` com hooks, lib e UI.
- Renomeados `Toolbar` para `RacEditorMenus`, `SideRail` para `CanvasToolsMenu` e `UserAvatarMenu` para `UserMenu`.
- Atualizados README, playbook e ADR para refletir a estrutura vigente.

### Revisão do estado final

- `canvas` agora é a fronteira visual 2D explícita do editor.
- `menus` substitui a antiga taxonomia `toolbar`.
- Imports de Fabric em produção ficam restritos ao slice `canvas`.
- `house-view.ts` voltou a concentrar apenas metadados e labels, sem importar Fabric.
- `RacEditorLayout` renderiza `menus`, `canvas`, seletores, modais, tutorial e viewer.

### Validação adicional

- rtk npm exec -- tsc --noEmit --project tsconfig.app.json: passou.
- rtk npm run test: passou, 85 arquivos e 221 testes.
- rtk npm run build: passou.
- rtk npm run lint: passou com warning pré-existente em House3DScene.tsx.
- rtk rg confirmou ausência de imports Fabric em produção fora de canvas.
- rtk rg confirmou ausência de imports para paths antigos de canvas/toolbar.
- rtk git diff --check retornou apenas avisos locais de LF -> CRLF.

