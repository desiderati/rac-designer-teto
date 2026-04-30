---
title: "Regression Run - Fronteira do runtime do editor"
doc_role: regression-run
created: 2026-04-28
updated: 2026-04-28
tags: [refactoring, regression, rac-editor]
---

# Regression Run - Fronteira do runtime do editor

## Comandos Executados

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`
  - resultado: passou.
- `rtk npm exec -- vitest run src/components/rac-editor/lib/canvas/piloti-visual-feedback.smoke.test.ts src/components/rac-editor/lib/canvas/piloti-selection.smoke.test.ts src/components/rac-editor/lib/rac-editor.smoke.test.ts src/bootstrap src/components/rac-editor/store src/components/rac-editor/canvas`
  - resultado: passou, 9 arquivos e 20 testes.
- `rtk npm run lint`
  - resultado: passou com 1 warning pré-existente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.
- `rtk npm run test`
  - resultado: passou, 75 arquivos e 197 testes.
- `rtk npm run build`
  - resultado: passou, 2721 módulos transformados.
- `rtk git diff --check`
  - resultado: passou.
- `rtk rg -n "canvasRef\.current\?\.canvas|canvasRef\.current\.canvas" src/components/rac-editor/hooks/usePilotiActions.ts src/components/rac-editor/ui/RacEditorCanvas.tsx`
  - resultado: sem ocorrências.
- `rtk npm exec -- vitest run src/components/rac-editor/ui/tutorial/Tutorial.smoke.test.tsx src/components/rac-editor/lib/canvas/canvas-screen-position.smoke.test.ts src/components/rac-editor/lib/canvas/piloti-screen-position.smoke.test.ts src/components/rac-editor/lib/canvas/piloti-visual-feedback.smoke.test.ts src/components/rac-editor/lib/rac-editor.smoke.test.ts src/bootstrap src/components/rac-editor/canvas src/components/rac-editor/store`
  - resultado: passou, 11 arquivos e 24 testes.
- `rtk rg -n "canvasRef\.current\?\.canvas|canvasRef\.current\.canvas" src/components/rac-editor/hooks src/components/rac-editor/ui`
  - resultado: 10 ocorrências remanescentes.
- `rtk npm exec -- vitest run src/components/rac-editor/lib/canvas/generic-object-editor-strategy.smoke.test.ts src/components/rac-editor/lib/canvas/canvas.smoke.test.ts src/components/rac-editor/lib/rac-editor.smoke.test.ts src/components/rac-editor/ui/tutorial/Tutorial.smoke.test.tsx src/bootstrap src/components/rac-editor/canvas src/components/rac-editor/store`
  - resultado: passou, 10 arquivos e 22 testes.
- `rtk npm run test`
  - resultado após a estratégia genérica: passou, 76 arquivos e 199 testes.
- `rtk npm run build`
  - resultado após a estratégia genérica: passou, 2721 módulos transformados.

## Evidência Arquitetural

- Imports antigos de `src/components/rac-editor/application`, `contracts`, `canvas/ports` e store legado não aparecem em `src`/`docs`.
- A estrutura converge para `bootstrap`, `components/rac-editor/canvas`, `components/rac-editor/store` e `infra/house`.
- A criação de `src/infra/canvas/FabricCanvasAdapter.ts` foi deliberadamente adiada até existir um port de canvas real para implementar.

## Pendências

- Restam 8 acessos diretos a `canvasRef.current.canvas` em hooks/UI.
- `house-manager.ts` ainda concentra escrita e rebuild.
- Import/export e histórico ainda dependem de JSON Fabric.
