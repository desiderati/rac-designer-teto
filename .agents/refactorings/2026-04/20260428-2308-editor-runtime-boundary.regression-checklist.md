---
title: "Regression Checklist - Fronteira do runtime do editor"
doc_role: regression-checklist
created: 2026-04-28
updated: 2026-04-28
tags: [refactoring, regression, rac-editor]
---

# Regression Checklist - Fronteira do runtime do editor

## Escopo

- Frente: `editor-runtime-boundary`
- Execução: `.agents/refactorings/2026-04/20260428-2308-editor-runtime-boundary.refactoring.md`
- Objetivo: validar que a reorganização de bootstrap/canvas/store/infra e a primeira redução de
  `CanvasHandle.canvas` preservam comportamento observável.

## Checagens Locais

- [x] TypeScript compila sem erros.
- [x] Testes focados de bootstrap, store, canvas ports e piloti passam.
- [x] Suíte Vitest completa passa.
- [x] Build de produção passa.
- [x] Lint não introduz erro novo.
- [x] `git diff --check` não encontra whitespace inválido.
- [x] `rg` não encontra imports antigos de `application`, `contracts`, `canvas/ports` ou store legado em `src`/`docs`.
- [x] `usePilotiActions.ts` e `RacEditorCanvas.tsx` não acessam mais `canvasRef.current.canvas`.
- [x] `useCanvasTools.ts` e `useTutorialUiActions.ts` não acessam mais `canvasRef.current.canvas`.
- [x] `useWallEditorActions.ts` e `useLinearEditorActions.ts` não acessam mais `canvasRef.current.canvas`.

## Gaps Intencionais

- Validação visual manual do editor não foi executada neste ciclo.
- Ainda existem 8 acessos diretos a `CanvasHandle.canvas` em outros hooks; eles ficam como alvo explícito do próximo ciclo.
- `house-manager.ts` e `RacEditor.tsx` ainda não foram decompostos de forma substancial.
