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

## Failure Signatures

- Primeira tentativa de typecheck falhou porque a nova worktree não tinha `node_modules`; `npm install` resolveu a ausência de dependências locais.
- Typecheck falhou uma vez porque `ElementStrategyKey` não era reexportado pelo barrel de factory; o tipo foi exportado em `factory/elements/index.ts`.

## Current State

- Last verified state: primeira subetapa da stage 2 validada.
- Remaining work: reduzir os 8 acessos diretos remanescentes e começar a quebrar os consumidores de `getCanvas` por write ports/use cases.
