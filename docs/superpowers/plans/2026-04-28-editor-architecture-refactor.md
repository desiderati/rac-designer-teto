# Editor Architecture Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o editor RAC para que domínio, estado, UI e runtime gráfico tenham fronteiras explícitas, com Fabric.js restrito à borda de canvas.

**Architecture:** A aplicação deve convergir para comandos e estado serializáveis. UI e hooks de alto nível consomem ports, commands e store; Fabric permanece apenas em adapters, factories e runtime de canvas. Durante a transição, o `houseManager` existente pode atuar como façade temporária, mas não deve ganhar novas responsabilidades.

**Tech Stack:** React, TypeScript, Vite, Fabric.js, Vitest, React Testing Library, Playwright.

---

## Contexto e Evidência Inicial

- Baseline em worktree isolada: `C:\Projetos\personal\rac-designer-teto-autonomous-editor-architecture`.
- Branch: `codex/autonomous-loop/editor-architecture`.
- `npm run test`: passou com 69 arquivos e 181 testes.
- `npm run build`: passou.
- `npm run lint`: passou com 1 warning pré-existente em `House3DScene.tsx`.
- Inventário inicial: 47 arquivos referenciam `fabric`.
- Hotspots medidos:
  - `src/components/rac-editor/ui/RacEditor.tsx`: 578 linhas.
  - `src/components/rac-editor/lib/house-manager.ts`: 542 linhas.
  - `src/components/rac-editor/ui/canvas/Canvas.tsx`: 347 linhas.
  - `src/components/rac-editor/hooks/canvas/useCanvasEditorEvents.ts`: 279 linhas.
  - `src/components/rac-editor/hooks/canvas/useCanvasFabricSetup.ts`: 239 linhas.
  - `src/components/rac-editor/hooks/usePilotiEditor.ts`: 239 linhas.

## Critérios Arquiteturais

- `domain` não pode importar React, Fabric, UI, browser API ou adapters concretos.
- `store` e commands não podem importar Fabric nem componentes React.
- UI e hooks de alto nível não devem depender de `CanvasGroup`, `CanvasObject`, `FabricCanvas` ou `FabricObject`.
- Fabric pode permanecer em `src/components/rac-editor/lib/canvas/**` durante a transição, mas o alvo final é restringi-lo a adapters, factories e runtime de canvas.
- Contratos públicos devem ser serializáveis sempre que representarem estado, seleção, comando ou evento.
- JSDoc deve documentar ports, commands, stores, adapters e regras não óbvias; funções triviais não recebem JSDoc ornamental.

## Macro-Loops

### Task 1: Baseline e Contrato Arquitetural

**Files:**
- Modify: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/loop-state.md`
- Create: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/fabric-boundary-baseline.md`
- Create: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/architecture-checklist.md`
- Create: `docs/superpowers/plans/2026-04-28-editor-architecture-refactor.md`

- [x] **Step 1: Criar worktree isolada**

Run: `git worktree add -b codex/autonomous-loop/editor-architecture ..\rac-designer-teto-autonomous-editor-architecture main`
Expected: branch e worktree criadas.

- [x] **Step 2: Instalar dependências na worktree**

Run: `npm install`
Expected: `node_modules` completo e binários de Vite/Vitest/ESLint disponíveis.

- [x] **Step 3: Rodar baseline automatizado**

Run:

```bash
npm run test
npm run build
npm run lint
```

Expected: testes e build passam; lint pode manter apenas warning pré-existente.

- [ ] **Step 4: Registrar baseline arquitetural**

Run:

```bash
rg -l "fabric" src
rg -n "CanvasGroup|CanvasObject|FabricCanvas|FabricObject|houseManager" src/components/rac-editor src/domain src/infra src/shared
```

Expected: inventário factual salvo no work-item assets.

### Task 2: Tipos Serializáveis e Contratos do Editor

**Files:**
- Create: `src/components/rac-editor/canvas/types/editor-selection.ts`
- Create: `src/components/rac-editor/canvas/types/editor-ids.ts`
- Test: `src/components/rac-editor/canvas/types/editor-selection.smoke.test.ts`

- [ ] **Step 1: Definir tipos serializáveis de seleção**

Create `EditorSelection`, `EditorSelectionKind`, `EditorPoint`, `EditorObjectId`, `EditorViewId`.
Esses tipos não podem importar `fabric` nem `lib/canvas`.

- [ ] **Step 2: Adicionar smoke test de serialização**

Validar que as seleções de piloti, parede, linear, terreno e contraventamento aceitam apenas dados serializáveis.

- [ ] **Step 3: Rodar validação estreita**

Run: `npm run test -- src/components/rac-editor/canvas/types`
Expected: testes passam.

### Task 3: Store e Commands

**Files:**
- Create: `src/components/rac-editor/store/commands/types.ts`
- Create: `src/components/rac-editor/store/EditorStateStore.ts`
- Test: `src/components/rac-editor/store/EditorStateStore.smoke.test.ts`

- [ ] **Step 1: Definir commands iniciais**

Criar commands para seleção, atualização de piloti, terreno e vistas sem importar Fabric.

- [ ] **Step 2: Criar store incremental**

O store inicial deve operar como camada serializável e pode delegar para `houseManager` apenas por façade temporária.

- [ ] **Step 3: Testar idempotência e notificação**

Selecionar o mesmo objeto duas vezes não deve emitir mudança observável desnecessária.

### Task 4: Canvas Ports

**Files:**
- Create: `src/components/rac-editor/canvas/CanvasEventPort.ts`
- Create: `src/components/rac-editor/canvas/CanvasRenderPort.ts`
- Create: `src/components/rac-editor/canvas/CanvasDocumentPort.ts`
- Test: `src/components/rac-editor/canvas/canvas-ports.smoke.test.ts`

- [ ] **Step 1: Definir portas sem Fabric**

As portas devem depender apenas dos tipos serializáveis do editor.

- [ ] **Step 2: Criar fake adapter de teste**

O fake adapter prova que hooks/store podem ser testados sem Fabric.

### Task 5: Piloti como Fatia Vertical

**Files:**
- Modify: `src/components/rac-editor/lib/canvas/piloti-selection.ts`
- Modify: `src/components/rac-editor/hooks/usePilotiEditorActions.ts`
- Modify: `src/components/rac-editor/hooks/usePilotiEditor.ts`
- Modify: `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx`
- Test: testes existentes de piloti e novos testes de contrato quando necessário.

- [ ] **Step 1: Remover `CanvasGroup` do contrato público de seleção de piloti**

`PilotiEditor` e hooks de piloti devem receber dados serializáveis e consultar estado por store/façade.

- [ ] **Step 2: Manter manipulação visual no adapter/runtime**

Destaque, limpeza de destaque e navegação visual continuam possíveis, mas não como responsabilidade da UI.

### Task 6: Vistas, Terreno e House Type

**Files:**
- Modify: `src/components/rac-editor/hooks/canvas/useCanvasHouseViewActions.ts`
- Modify: `src/components/rac-editor/ui/modals/TerrainEditorModal.tsx` ou equivalentes reais após inspeção.
- Modify: `src/components/rac-editor/lib/house-manager.ts`
- Test: `house-views*`, terrain e E2E seletivo.

- [ ] **Step 1: Separar intenção de criação de vista da criação Fabric concreta**

UI dispara comando; adapter/factory cria runtime visual.

- [ ] **Step 2: Remover leitura direta de `houseManager` da UI onde houver selector serializável disponível**

Preservar compatibilidade até o store assumir a leitura.

### Task 7: Contraventamento

**Files:**
- Modify: `src/components/rac-editor/hooks/useContraventamento*.ts`
- Modify: `src/components/rac-editor/lib/canvas/contraventamento.ts`
- Modify: `src/components/rac-editor/lib/house-auto-contraventamento.ts`
- Test: smoke e E2E para criação/remoção/sync.

- [ ] **Step 1: Isolar elegibilidade como regra testável**

Origem/destino, coluna, lado e ocupação devem ser verificáveis sem Fabric.

- [ ] **Step 2: Manter renderização visual em adapter/helper de canvas**

Contraventamento visual não deve determinar a regra canônica.

### Task 8: Histórico, Import/Export e Rebuild

**Files:**
- Modify: `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
- Modify: `src/components/rac-editor/hooks/canvas/useCanvasHistory.ts`
- Modify: `src/components/rac-editor/lib/canvas/canvas-rebuild.ts`
- Create: fixtures JSON em local apropriado após inspeção.

- [ ] **Step 1: Caracterizar round trip JSON**

Preservar views, pilotis, mestre, terreno, contraventamentos, escadas e metadados listados em `canvasObjectProps`.

- [ ] **Step 2: Introduzir mapper explícito entre runtime canvas e estado serializável**

`rebuildFromCanvas` deve convergir para fonte de verdade serializável, não ampliar dependência de Fabric.

### Task 9: Fabric Factories e Adapter Final

**Files:**
- Move/Modify: `src/components/rac-editor/lib/canvas/factory/**`
- Create/Modify: adapter Fabric após as portas estabilizarem.
- Test: smoke de factories e adapter.

- [ ] **Step 1: Definir fronteira final de Fabric**

`rg "fabric" src` deve retornar apenas arquivos da fronteira aprovada e testes específicos.

- [ ] **Step 2: Reduzir barrel `lib/canvas/index.ts`**

Separar exports públicos de tipos serializáveis dos helpers de runtime.

### Task 10: God Files, JSDoc e Consolidação

**Files:**
- Modify: `src/components/rac-editor/ui/RacEditor.tsx`
- Modify: `src/components/rac-editor/lib/house-manager.ts`
- Modify: `src/components/rac-editor/ui/canvas/Canvas.tsx`
- Modify: docs/playbook e business rules somente quando comportamento ou contrato documentado mudar.

- [ ] **Step 1: Fatiar por responsabilidades**

Extrair fluxos coesos, sem criar abstrações globais genéricas.

- [ ] **Step 2: Adicionar JSDoc público**

Cobrir ports, commands, store, adapters e regras não óbvias.

- [ ] **Step 3: Rodar regressão final**

Run:

```bash
npm run test
npm run build
npm run lint
npm run test:e2e
git diff --check
```

Expected: tudo passa ou lacunas residuais ficam registradas no loop-state.

## Checks Arquiteturais Recorrentes

```bash
rg -n "fabric" src/components/rac-editor src/domain src/shared -g "!*.test.*" -g "!*.smoke.*"
rg -n "CanvasGroup|CanvasObject|FabricCanvas|FabricObject" src/components/rac-editor/ui src/components/rac-editor/hooks
rg -n "houseManager" src/components/rac-editor/ui src/components/rac-editor/hooks
rg -n "export const houseManager|new HouseManager" src
```

## Critério Final de Aceite

- Domínio sem React/Fabric.
- Store sem Fabric.
- UI sem Fabric.
- Hooks de comando/estado de alto nível sem Fabric.
- Fabric restrito a adapters/factories/runtime de canvas.
- Commands e seleção serializáveis.
- `RacEditor.tsx`, `house-manager.ts` e `Canvas.tsx` sem concentração incompatível de responsabilidades.
- JSDoc em contratos públicos e regras arquiteturais não óbvias.
- Testes e build passam.
