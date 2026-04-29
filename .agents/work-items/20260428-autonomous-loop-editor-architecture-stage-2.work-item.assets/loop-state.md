# Autonomous Loop State - Editor Architecture Stage 2

## Run Contract

- Mode: run
- Workflow: continuar a refatoração arquitetural do editor RAC em ciclos pequenos após promoção da primeira worktree para `main`.
- Target: reduzir os vazamentos remanescentes de Fabric.js em hooks de alto nível, começando pelas frentes que podem migrar para capacidades explícitas do `CanvasHandle` sem alterar comportamento externo.
- Worktree: `C:\Projetos\personal\rac-designer-teto-autonomous-editor-architecture-stage-2`
- Branch: `codex/autonomous-loop/editor-architecture-stage-2`
- Loop-state path: `.agents/work-items/20260428-autonomous-loop-editor-architecture-stage-2.work-item.assets/loop-state.md`
- Max iterations: 5 ciclos nesta etapa.
- Stop criteria: parar quando a fatia selecionada estiver validada, quando o próximo passo exigir decisão arquitetural nova, quando duas falhas repetidas não gerarem progresso, ou antes de push/merge/deploy.
- Safety policy: sem push, merge, deploy, mutação remota ou produção; preservar mudanças locais do worktree principal.
- Evidence policy: `rg` para inventário de `CanvasHandle.canvas`, typecheck, testes focados, lint, build e `git diff --check`.

## Session Continuation - 2026-04-29

- User constraint: no more worktrees in this session.
- Execution location: current branch `main`.
- Operational decision: continue the autonomous-loop style in small, validated increments directly on the current working tree.

## Baseline

- Estado inicial da etapa: `main` em `c80d9f9`, com primeira rodada promovida localmente e `.agents/*` versionado.
- Inventário inicial: 8 ocorrências diretas de `canvasRef.current.canvas` em hooks/UI.
- Frentes remanescentes:
  - `useCanvasActions` ainda fornece `getCanvas` para import/export, PDF, house views e contraventamento.
  - `useCanvasHouseInitialization` inicializa `houseManager` com runtime Fabric.
  - `useRacEditorDebugBridge` ainda lê o runtime diretamente em modo DEV.

## Checkpoints

| Iteration | Goal | Changes | Verification | Decision | Next |
| --- | --- | --- | --- | --- | --- |
| 1 | Remover Fabric indireto de `useCanvasTools` | `CanvasHandle` ganhou `createElementObject`, `addObjectAtVisibleCenter` e `setDrawingModeEnabled`; `useCanvasTools` deixou de receber `getCanvas` e de importar `FabricCanvas` | `tsc --noEmit`; testes focados 4/8; lint com warning pré-existente; build; `git diff --check` | Criação de elementos passa a pertencer ao handle/canvas, não ao hook de toolbar | Atacar `useCanvasActions.getCanvas` por consumidores menores ou criar port de mutação de canvas |
| 2 | Remover o campo público `CanvasHandle.canvas` e iniciar ports de escrita | `CanvasHandle.canvas` foi removido; `getRuntimeCanvas()` ficou como escape hatch deprecado; `deleteActiveObjects` virou capacidade do handle; `HouseWritePort` e `legacyHouseWritePort` passaram a cobrir família, terreno, deleção e fluxo de vistas; `RacEditor`, `useCanvasActions` e `useCanvasHouseViewActions` deixaram de depender diretamente do `houseManager`; helpers de terreno/elevations foram extraídos de `house-manager.ts` para `house-manager-terrain.ts` | `tsc --noEmit`; testes focados 12/38; `npm run test` 78/205; `npm run lint` com warning pré-existente; `npm run build`; `git diff --check`; `rg` sem `CanvasHandle['canvas']` ou `canvasRef.current?.canvas` | Manter `getRuntimeCanvas()` explicitamente deprecado para import/export, PDF, contraventamento e debug enquanto capacidades/ports menores substituem consumidores | Migrar consumidores de `getCanvas` por portas documentais e comandos de canvas; continuar decomposição de `house-manager.ts` por registro/remoção de vistas e snapshot 3D |

| 3 | Decompor `RacEditor.tsx` e `house-manager.ts` como God Files | `RacEditor.tsx` virou raiz fina de provider; `RacEditorContent`, `RacEditorLayout` e `RacEditor3DViewerOverlay` separam composicao, apresentacao e lazy 3D; `house-manager.ts` virou export do singleton; `HouseManagerFacade` delega estado, sessao, runtime de canvas, notificacao, views, piloti, snapshot e efeitos automaticos; consumidores simples migraram para ports/store | `tsc --noEmit`; testes focados 13/54; `npm run test` 78/205; `npm run lint` com warning pre-existente; `npm run build`; `git diff --check` | Os arquivos-alvo deixaram de ser concentradores de comportamento; a fachada legada permanece como ponto de transicao controlado | Continuar removendo `getRuntimeCanvas()` e substituir debug/inicializacao/house-store por portas dedicadas quando houver nova etapa |

## Failure Signatures

- Primeira tentativa de typecheck falhou porque a nova worktree não tinha `node_modules`; `npm install` resolveu a ausência de dependências locais.
- Typecheck falhou uma vez porque `ElementStrategyKey` não era reexportado pelo barrel de factory; o tipo foi exportado em `factory/elements/index.ts`.

## Current State

- Last verified state: terceira subetapa da stage 2 validada no branch atual `main`, sem worktree.
- Remaining work: migrar consumidores transitórios de `getRuntimeCanvas()`/`getCanvas` em PDF/debug e inicialização do `houseManager`; substituir fronteiras legadas do `house-store`/debug por portas dedicadas quando houver novo ciclo.
