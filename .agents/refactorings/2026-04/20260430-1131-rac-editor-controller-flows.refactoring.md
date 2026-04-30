---
doc_role: refactoring-execution
resource_slug: rac-editor-controller-flows
resource_kind: hook
status: completed
lang: pt-BR
---

# Refatoração: fluxos extraídos do controlador RAC editor

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/hooks/useRacEditorController.ts`
  - `src/components/rac-editor/hooks/useRacEditorCanvasFlowController.ts`
  - `src/components/rac-editor/hooks/useRacEditorDocumentHotkeysController.ts`
  - `src/components/rac-editor/hooks/useRacEditorModalEditorController.ts`

## 2. Diagnóstico

`useRacEditorController` ainda concentra a composição geral da tela. Parte da complexidade vinha de acoplar diretamente inicialização de canvas, documentos, hotkeys e editores modais em um único hook.

## 3. Transformação Executada

- Extraído `useRacEditorCanvasFlowController`.
- Extraído `useRacEditorDocumentHotkeysController`.
- Extraído `useRacEditorModalEditorController`.
- `useRacEditorController` deixou de importar diretamente hooks de documento, hotkeys, canvas básico e editores modais.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados de hooks/bootstrap: passaram, 1 arquivo e 2 testes.
- `rtk git diff --check`: passou.
- `rtk rg` não encontrou imports dos hooks extraídos no controlador raiz.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: o ciclo reduz acoplamento de composição do controlador raiz e prepara cortes maiores.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: extração local de hooks não possui custo de reversão ou valor decisório suficiente para ADR.
