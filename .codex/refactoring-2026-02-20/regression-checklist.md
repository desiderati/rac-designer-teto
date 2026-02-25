# Checklist de Regressão (Fase 0)

## Lotes de validação manual (M)

### Lote 1

- M1: Criar casa `tipo6`.
- M2: Criar casa `tipo3`.
- M3: Abrir o `Piloti Editor` sem tela branca/erro fatal.

### Lote 2

- M4: Adicionar vista superior.
- M5: Adicionar/remover vistas frontal/traseira/lateral respeitando limite por tipo.
- M6: Validar seleção de lado e bloqueio de lados já ocupados.

## Fluxo base

- Abrir o editor sem erros no console.
- Criar casa `tipo6`.
- Criar casa `tipo3`.

## Vistas e gerenciamento de casa

- Adicionar vista superior.
- Adicionar/remover vistas frontal/traseira/lateral conforme limite do tipo.
- Validar seleção de lado e bloqueio de lados já ocupados.

### Cobertura e2e atual (vistas)

- Tipo 6: limite de frontal, inserção/remoção/reinserção de traseira, inserção/remoção/reinserção de quadrado fechado.
- Tipo 3: limite de quadrado aberto, seleção de lado para lateral, limite de lateral, inserção/remoção/reinserção de lateral, inserção/remoção/reinserção de quadrado aberto.

## Pilotis

- Editar altura de piloti.
- Marcar/desmarcar piloti master e validar regra de master único.
- Editar nível e validar labels/solo.

## Canvas

- Zoom in/out por controle e gesto.
- Pan por mouse/touch.
- Minimap movendo viewport.
- Undo/redo.
- Copiar/colar objeto.

## Contraventamento

- Entrar no modo contraventamento.
- Selecionar primeiro e segundo piloti.
- Remover contraventamento.

## Persistência e serialização

- Exportar JSON.
- Importar JSON e validar restauração de vistas/pilotis.
- Validar persistência de tutorial e configurações.

## 3D

- Abrir visualizador 3D.
- Validar render para `tipo6` e `tipo3`.
- Inserir snapshot 3D no canvas 2D.




## Rodada 2026-02-22 - Rename + Extrações

### Nomenclatura e contratos

- [x] componente raiz padronizado como `RacEditor` no código-fonte.
- [x] componente de editores inline padronizado como `RacEditorModalEditors`.
- [x] Imports e paths atualizados (`src/pages/Index.tsx` e `src/components/rac-editor/*`).
- [x] Referências de documentação sincronizadas para `RacEditor`.

### Estrutura e regras

- [x] Setup de Fabric concentrado em `useCanvasFabricSetup`.
- [x] Fluxo de contraventamento concentrado em `useContraventamento`.
- [x] Fluxo de vistas/tipo de casa concentrado em `useRacViewActions`.
- [x] `.rules/canvas.md` atualizado com contrato de `useCanvasFabricSetup`.
- [x] `.rules/contraventamento.md` atualizado com contrato de `useContraventamento`.
- [x] `.rules/toolbar.md` e `.rules/vistas-por-tipo.md` atualizados com `useRacViewActions`.

### Validação obrigatória da rodada

- [x] `npx eslint` (arquivos tocados da rodada)
- [x] `npm run test`
- [x] `npm run build`
- [x] Revalidação final pós rename case-sensitive com `git mv` (`test`, `build`, `eslint` dos arquivos tocados).

## Rodada 2026-02-22 - Continuidade (passos 79/80)

### Lint e tipagem

- [x] `useCanvasFabricSetup.ts` sem `any` explícito e sem `eslint-disable`.
- [x] `exhaustive-deps` resolvido via leitura de callbacks/refs atuais por `latestArgsRef`.
- [x] `npx eslint` validado para:
  - `src/components/rac-editor/RacEditor.tsx`
  - `src/components/rac-editor/Canvas.tsx`
  - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
  - `src/components/rac-editor/hooks/useCanvasTools.ts`
  - `src/components/rac-editor/hooks/useContraventamento.ts`
  - `src/components/rac-editor/hooks/useCanvasHouseViewActions.ts`

### Refatoração estrutural incremental

- [x] extraído `src/components/rac-editor/hooks/useCanvasTools.ts`.
- [x] `RacEditor.tsx` reduzido de 1211 para 1073 linhas com delegação das ações de elementos/linhas/desenho.

### Validação obrigatória pós-refatoração

- [x] `npm run test -- --run` (120/120)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-23 - Correção dirigida (settings/useCanvasFabricSetup)

### Arquivos alvo solicitados

- [x] `src/lib/settings.ts`
- [x] `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`

### Correções aplicadas

- [x] `updateSetting` resiliente a falha de escrita em storage.
- [x] teste smoke de falha de escrita em storage (`settings.smoke.test.ts`).
- [x] lint/tipos revalidados em `useCanvasFabricSetup.ts`.

### Validação obrigatória da rodada

- [x] `npx eslint src/lib/settings.ts src/lib/settings.smoke.test.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-23 - Refatoração incremental (passo 82)

### Escopo

- [x] extração das ações de projeto de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
- [x] delegação de `export/import/delete` no `RacEditor`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passos 83/84)

### Escopo

- [x] extração de `Agrupar/Desagrupar` do `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasGroupingActions.ts`
- [x] split de eventos de `useCanvasFabricSetup` em hooks dedicados:
  - `src/components/rac-editor/hooks/useCanvasSelectionEvents.ts`
  - `src/components/rac-editor/hooks/useCanvasContraventamentoEvents.ts`
  - `src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts`
- [x] integração dos novos binders com cleanup explícito no `useCanvasFabricSetup`.
- [x] correção de lint no `useCanvasFabricSetup` sem desabilitar regras (`exhaustive-deps` resolvido por dependências explícitas).

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasSelectionEvents.ts src/components/rac-editor/hooks/useCanvasContraventamentoEvents.ts src/components/rac-editor/hooks/useCanvasKeyboardShortcuts.ts src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useCanvasGroupingActions.ts src/lib/settings.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 85)

### Escopo

- [x] extração dos handlers de ponteiro/touch do `Canvas` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasPointerInteractions.ts`
- [x] delegação de pan/wheel/pinch/single-finger pan no `Canvas`.
- [x] preservação do fluxo de minimap/zoom e feedback de pinch.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasPointerInteractions.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 86)

### Escopo

- [x] extração das ações de piloti de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/usePilotiActions.ts`
- [x] delegação de seleção/fechamento/navegação/altura de piloti no `RacEditor`.
- [x] preservação das regras de sincronização de elevações, histórico e feedback visual.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/usePilotiActions.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passos 87/88)

### Escopo

- [x] extração dos eventos inline de `useCanvasFabricSetup` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasEditorEvents.ts`
- [x] integração de bind/unbind de inline events no setup Fabric.
- [x] extração dos handlers de menu/tutorial de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useTutorialMenuActions.ts`
- [x] delegação de toggles de menu/submenu, gates de tutorial, toggle de dicas/zoom e click-outside.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useTutorialMenuActions.ts src/components/rac-editor/RacEditor.tsx`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 89)

### Escopo

- [x] extração do fluxo de tutorial/restart/onboarding de `RacEditor` para hooks dedicados:
  - `src/components/rac-editor/hooks/useTutorialUiActions.ts`
  - `src/components/rac-editor/hooks/useCanvasHouseInitialization.ts`
- [x] delegação de confirmação de reinício, reset de canvas/tutorial e controle de balão de piloti.
- [x] delegação da inicialização do `houseManager` quando canvas fica disponível.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useTutorialUiActions.ts src/components/rac-editor/hooks/useCanvasHouseInitialization.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/useTutorialMenuActions.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 90)

### Escopo

- [x] extração do bloco de edição genérica de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useWallEditorActions.ts`
- [x] delegação de apply/cores/tipo dos editores inline para o hook.
- [x] preservação da integração com `RacEditorModalEditors`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useWallEditorActions.ts src/components/rac-editor/hooks/useTutorialUiActions.ts src/components/rac-editor/hooks/useCanvasHouseInitialization.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 91)

### Escopo

- [x] extração dos overlays visuais/controles de zoom do `Canvas` para componente dedicado:
  - `src/components/rac-editor/CanvasOverlays.tsx`
- [x] delegação de pinch feedback, minimap/zoom desktop-mobile e renderização de `children`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/CanvasOverlays.tsx`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 92)

### Escopo

- [x] extração do bloco de overlays/modais de `RacEditor` para componente dedicado:
  - `src/components/rac-editor/RacEditorModals.tsx`
- [x] delegação de `HouseTypeSelector`, `Settings`, `3D`, `Tutorial`, balões e confirmações destrutivas.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/RacEditorModals.tsx`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 93)

### Escopo

- [x] extração dos helpers de interação canvas/menu de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasInteractionActions.ts`
- [x] delegação de `getCanvas`, centro visível, add no centro, fechamento de menus e desligamento de desenho.
- [x] revalidação explícita dos arquivos solicitados:
  - `src/lib/settings.ts`
  - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useCanvasInteractionActions.ts src/lib/settings.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Correção de tipagem (passo 94)

### Escopo

- [x] correção de incompatibilidades de tipo em storage/config:
  - `src/lib/persistence/settings.storage.ts`
  - `src/lib/settings.ts` (revalidação)
- [x] correção de refs/runtime types no canvas/editor:
  - `src/components/rac-editor/hooks/useCanvasFabricSetup.ts`
  - `src/components/rac-editor/hooks/useCanvasEditorEvents.ts`
  - `src/components/rac-editor/hooks/useCanvasSelectionEvents.ts`
  - `src/components/rac-editor/hooks/usePilotiActions.ts`
  - `src/lib/canvas/piloti-visual-feedback.ts`
- [x] correção de tipagem estrita auxiliar:
  - `src/components/rac-editor/House3DScene.tsx`
  - `src/lib/domain/house-application.smoke.test.ts`

### Validação obrigatória da rodada

- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npx eslint src/lib/settings.ts src/lib/persistence/settings.storage.ts src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/useCanvasEditorEvents.ts src/components/rac-editor/hooks/usePilotiActions.ts src/lib/canvas/piloti-visual-feedback.ts src/components/rac-editor/hooks/useCanvasSelectionEvents.ts src/components/rac-editor/House3DScene.tsx src/lib/domain/house-application.smoke.test.ts`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 95)

### Escopo

- [x] extração da composição de `ToolbarActionMap` de `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useToolbarActions.ts`
- [x] delegação do objeto `actions` da `Toolbar` no `RacEditor`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useToolbarActions.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 96)

### Escopo

- [x] extração da seção de canvas + infobar do `RacEditor` para componente dedicado:
  - `src/components/rac-editor/RacEditorCanvas.tsx`
- [x] delegação de wiring de callbacks de seleção/zoom/contraventamento no `RacEditor`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/RacEditorCanvas.tsx src/components/rac-editor/hooks/useToolbarActions.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 97)

### Escopo

- [x] compactação da orquestração remanescente em `RacEditor` (destructuring/assinaturas de hooks), sem alterar regra
  de negócio.
- [x] meta de tamanho atendida no arquivo principal:
  - `src/components/rac-editor/RacEditor.tsx` em **443** linhas.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passos 98/99)

### Escopo

- [x] extração da projeção/offset/centro visível do `Canvas` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasScreenProjection.ts`
- [x] extração do snapshot de objetos do minimap para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasMinimapObjects.ts`
- [x] delegação do `Canvas` para os hooks novos mantendo comportamento:
  - `src/components/rac-editor/Canvas.tsx`
- [x] redução de tamanho do `Canvas` para **335** linhas.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasMinimapObjects.ts src/components/rac-editor/hooks/useCanvasScreenProjection.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 100)

### Escopo

- [x] extração da seleção de piloti do `useCanvasFabricSetup` para helper dedicado:
  - `src/components/rac-editor/hooks/canvas-piloti-selection.ts`
- [x] delegação do setup de eventos Fabric para `buildPilotiSelectionHandler`.
- [x] redução de `src/components/rac-editor/hooks/useCanvasFabricSetup.ts` para **313** linhas.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/canvas-piloti-selection.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 101)

### Escopo

- [x] extração do lifecycle de container/viewport do `Canvas` para hook dedicado:
  - `src/components/rac-editor/hooks/useCanvasContainerLifecycle.ts`
- [x] delegação dos efeitos de resize + clamp de viewport no `Canvas`.
- [x] redução de `src/components/rac-editor/Canvas.tsx` para **321** linhas.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/Canvas.tsx src/components/rac-editor/hooks/useCanvasContainerLifecycle.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 102)

### Escopo

- [x] extração do cálculo de `isAnyEditorOpen` e wiring de seleção inline do `RacEditor` para hook dedicado:
  - `src/components/rac-editor/hooks/useGenericObjectEditorBindings.ts`
- [x] delegação dos callbacks de seleção inline (`distance/object name/line-arrow`) no `RacEditor`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/RacEditor.tsx src/components/rac-editor/hooks/useGenericObjectEditorBindings.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 103)

### Escopo

- [x] quebra do `Toolbar` em componentes dedicados:
  - `src/components/rac-editor/toolbar/ToolbarButtons.tsx`
  - `src/components/rac-editor/toolbar/ToolbarMainMenu.tsx`
  - `src/components/rac-editor/toolbar/ToolbarOverflowMenu.tsx`
- [x] extração do mapeamento de ícones/comandos para:
  - `src/components/rac-editor/toolbar/toolbar-config.ts`
- [x] centralização de tipos de toolbar em:
  - `src/components/rac-editor/toolbar/toolbar-types.ts`
- [x] `src/components/rac-editor/Toolbar.tsx` reduzido para composição de alto nível.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/Toolbar.tsx src/components/rac-editor/toolbar/ToolbarButtons.tsx src/components/rac-editor/toolbar/ToolbarMainMenu.tsx src/components/rac-editor/toolbar/ToolbarOverflowMenu.tsx src/components/rac-editor/toolbar/toolbar-config.ts src/components/rac-editor/toolbar/toolbar-types.ts src/components/rac-editor/hooks/useToolbarActions.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 104)

### Escopo

- [x] extração das consultas de contraventamento para hook dedicado:
  - `src/components/rac-editor/hooks/useContraventamentoQueries.ts`
- [x] delegação das consultas no `useContraventamento` (ocupação/elegibilidade/estado do editor).

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useContraventamento.ts src/components/rac-editor/hooks/useContraventamentoQueries.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 105)

### Escopo

- [x] extração dos comandos de contraventamento para hook dedicado:
  - `src/components/rac-editor/hooks/useContraventamentoCommands.ts`
- [x] extração dos efeitos reativos de contraventamento para hook dedicado:
  - `src/components/rac-editor/hooks/useContraventamentoEffects.ts`
- [x] `useContraventamento` simplificado para composição de `queries + commands + effects`.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useContraventamento.ts src/components/rac-editor/hooks/useContraventamentoCommands.ts src/components/rac-editor/hooks/useContraventamentoEffects.ts src/components/rac-editor/hooks/useContraventamentoQueries.ts src/components/rac-editor/hooks/useContraventamento.types.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Refatoração incremental (passo 106)

### Escopo

- [x] extração dos tipos runtime de Fabric de `useCanvasFabricSetup` para:
  - `src/components/rac-editor/hooks/canvas.ts`
- [x] simplificação do `useCanvasFabricSetup` para orquestração de setup/bindings.

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useCanvasFabricSetup.ts src/components/rac-editor/hooks/canvas.ts`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (121/121)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)

## Rodada 2026-02-22 - Bugfix regressão de edição (passo 107)

### Escopo

- [x] correção de perda de draft no `GenericObjectEditor` durante digitação/troca de cor:
  - `src/components/rac-editor/hooks/useGenericObjectEditorDraft.ts`
- [x] teste de regressão automático para não reaparecer:
  - `src/components/rac-editor/modals/editors/GenericObjectEditor.smoke.test.tsx`

### Validação obrigatória da rodada

- [x] `npx eslint src/components/rac-editor/hooks/useGenericObjectEditorDraft.ts src/components/rac-editor/modals/editors/GenericObjectEditor.smoke.test.tsx`
- [x] `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- [x] `npm run test -- --run` (122/122)
- [x] `npm run build`
- [x] `npm run test:e2e -- --workers=1` (16/16)
