---
title: "Refactoring - Slices e Ports do RAC Editor"
doc_role: refactoring
created: 2026-04-29
updated: 2026-04-29
tags: [ refactoring, rac-editor, ports, slices ]
---

# Refactoring - Slices e Ports do RAC Editor

## 1. Contexto e Escopo

- prompt de origem desta execução: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo operacional: executar os oito ciclos aprovados para consolidar slices, Ports e orquestração do `rac-editor`.
- escopo incluído: `src/components/rac-editor`, `src/bootstrap`, `src/infra/house` e registros operacionais locais.
- escopo excluído: troca de runtime gráfico, push, merge, deploy, worktree e mudanças funcionais deliberadas.
- constraints relevantes:
  - preservar português do Brasil com acentuação normal em JSDoc e documentação nova;
  - preservar alterações locais já existentes no working tree;
  - manter Fabric restrito à borda de canvas;
  - documentar Ports como contratos públicos internos.
- perfil de risco: `high`
- modo de execução: `direct`

## 2. Inventário e Diagnóstico

- `RacEditor.tsx` já está fino; o peso remanescente está em controllers, viewer 3D, modais e `houseManager`.
- `HouseWritePort` ainda mistura comandos e consultas necessárias ao fluxo de vistas.
- `PilotiEditorPort` está semanticamente ligado ao editor de piloti, mas vive em `store` genérico.
- `viewer3d` e `modals` ainda estão como subdiretórios soltos de `ui`/`lib`/`hooks`.

## 3. Findings

### Finding 1

- descrição: Ports do editor existem, mas parte deles ainda está em localização genérica e sem divisão interna clara.
- problema estrutural: mixed responsibilities.
- severidade: `medium`
- impacto: dificulta evolução de use cases e torna menos claro se a dependência é de leitura, comando ou runtime.

### Finding 2

- descrição: `House3DScene.tsx` e `House3DViewer.tsx` concentram UI, estado, ações e geometria 3D.
- problema estrutural: god component / low cohesion.
- severidade: `high`
- impacto: testes e mudanças no viewer 3D ficam caros e frágeis.

### Finding 3

- descrição: modais e editores flutuantes estão misturados em `ui/modals` e `hooks/modals`.
- problema estrutural: feature scattering.
- severidade: `medium`
- impacto: a tela raiz conhece detalhes demais dos overlays.

## 4. Solution Design

- Criar slices feature-local: `house`, `piloti`, `viewer3d` e `modals`.
- Manter `store` raiz para estado de interação genérico do editor, não para Ports de subdomínios.
- Documentar Ports em JSDoc com acentuação correta.
- Extrair lógica pesada do viewer 3D por modelo, ações, meshes e helpers.
- Reduzir controllers depois que slices estiverem fisicamente estáveis.

## 5. Implementation Plan

1. Reorganizar e documentar Ports de `house` e `piloti`.
2. Criar slice `viewer3d` e mover UI/lib do 3D.
3. Decompor `House3DViewer`.
4. Decompor `House3DScene`.
5. Criar slice `modals` e mover dialogs/editors/selectors/hooks.
6. Reduzir `useRacEditorController` e builders.
7. Avançar use cases/ports de `house`.
8. Consolidar JSDoc, docs e validação ampla.

## 6. Validation Strategy

- baseline inicial:
  - `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
  - `rtk npm run test -- src/components/rac-editor/store src/bootstrap src/infra/house`: passou.
- validação por ciclo: `tsc` e testes focados no slice tocado.
- validação final: testes globais, build, lint e checks arquiteturais via `rg`.

## 7. Registro de Execução

### Ciclo 1/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: reorganizar e documentar Ports de `house` e `piloti`.

#### Executado

- `HouseReadPort`, `HouseWritePort`, `HouseRuntimePort` e `HouseStatePort` foram movidos para `src/components/rac-editor/house/store`.
- `PilotiEditorPort` foi movido para `src/components/rac-editor/piloti/store`.
- `HouseWritePort` passou a agregar subinterfaces semânticas: setup, lifecycle, terrain, views e pilotis.
- JSDoc dos Ports foi reescrito em português do Brasil com acentuação normal.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/house src/components/rac-editor/piloti src/bootstrap src/infra/house`: passou, 3 arquivos e 7 testes.

#### Decisão

- continuar.

### Ciclo 7/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: avançar `house`/use cases sem ampliar dependência de Fabric.

#### Executado

- Extraída `resolvePilotiUpdateEffects` para `src/domain/house/use-cases/house-piloti.use-case.ts`.
- `house-manager-piloti` passou a consumir a decisão pura do domínio e manteve apenas a sincronização visual.
- Smoke test do use case cobre a decisão de atualização de nível sem depender do canvas.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/domain/house src/components/rac-editor/lib/house-manager-piloti.ts src/components/rac-editor/lib/house-manager.smoke.test.ts`: passou, 8 arquivos e 48 testes.

#### Decisão

- continuar.

### Ciclo 6/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: reduzir ruído de orquestração e corrigir JSDoc em português.

#### Executado

- Removidos separadores de seção corrompidos de `useRacEditorController`.
- Corrigidos JSDoc sem acentuação em `useRacEditorController`, `useRacEditorCanvasController`,
  `house-manager-command-service` e `house-manager-effects`.
- Registrada a decisão de não extrair handlers maiores antes da próxima rodada de `house`/ports.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/hooks src/infra/house`: passou, 3 arquivos e 7 testes.

#### Decisão

- continuar.

### Ciclo 5/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: criar slice próprio para modais e editores flutuantes.

#### Executado

- Movidos dialogs, selectors e editors para `src/components/rac-editor/modals/ui`.
- Movidos hooks específicos de modais para `src/components/rac-editor/modals/hooks`.
- Movidos wrappers `RacEditorModals`, `RacEditorModalEditors` e `RacEditorHouseTypeSelector` para o slice.
- Imports de código foram atualizados para a nova fronteira.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/modals`: passou, 1 arquivo e 1 teste.

#### Decisão

- continuar.

### Ciclo 4/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: decompor `House3DScene`.

#### Executado

- Criado `scene-geometry.ts` para helpers geométricos compartilhados da cena.
- Criados `House3DTerrainMeshes.tsx`, `House3DStructureMeshes.tsx` e `House3DStairsMesh.tsx`.
- `House3DScene.tsx` passou a compor malhas e elementos 3D, sem concentrar toda a geometria.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/viewer3d`: passou, 6 arquivos e 16 testes.

#### Decisão

- continuar.

### Ciclo 3/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: decompor `House3DViewer`.

#### Executado

- Criado `useHouse3DViewerModel` para derivar a projeção 3D a partir do snapshot da casa.
- Criado `useHouse3DViewerActions` para reset, fullscreen, captura WebGL e inserção no canvas.
- `House3DViewer.tsx` ficou concentrado em dialog, controles e montagem da cena.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/viewer3d`: passou, 6 arquivos e 16 testes.

#### Decisão

- continuar.

### Ciclo 2/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: criar slice próprio para o viewer 3D.

#### Executado

- `House3DViewer.tsx`, `House3DScene.tsx`, overlay e smoke test foram movidos para `src/components/rac-editor/viewer3d/ui`.
- Parsers, constantes e testes 3D foram movidos para `src/components/rac-editor/viewer3d/lib`.
- Imports de código foram atualizados para a nova fronteira.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test -- src/components/rac-editor/viewer3d`: passou, 6 arquivos e 16 testes.

#### Decisão

- continuar.

### Ciclo 8/8

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-rac-editor-slices-ports.prompt.md`
- objetivo do ciclo: consolidar documentação, JSDoc e validação ampla.

#### Executado

- README e playbook foram atualizados para refletir os slices atuais `modals`, `viewer3d`, `house` e `piloti`.
- Exemplos de paths antigos em docs canônicos foram substituídos pelos paths vigentes.
- Comentários e JSDoc tocados foram normalizados em português do Brasil com acentuação.
- Confirmado que imports antigos de `ui/3d`, `lib/3d`, `ui/modals`, `hooks/modals` e Ports em `store` não existem mais no código.
- Confirmado que referências diretas a Fabric em produção permanecem restritas a `src/components/rac-editor/canvas`.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm run test`: passou, 85 arquivos e 222 testes.
- `rtk npm run build`: passou.
- `rtk npm run lint`: passou.
- `rtk git diff --check`: passou.
- `rtk rg` não encontrou imports de paths antigos no código de produção.
- `rtk rg` não encontrou arquivos de produção com `fabric` fora de `src/components/rac-editor/canvas`.

#### Decisão

- encerrar.

## 8. Outcome / Verdict

- veredito: `completed`
- resultado alcançado: oito ciclos executados no branch atual, sem worktree.
- classificação de fechamento: `durável`
- justificativa da classificação: frente estrutural ampla com valor de continuidade.
- referência do changelog: `.agents/changelogs/2026-04/20260429.changelog.md`
- recomendação de ADR no fechamento: não
- justificativa curta da recomendação de ADR: a decisão de fronteira Fabric já está coberta por ADR existente; esta execução é consolidação.
