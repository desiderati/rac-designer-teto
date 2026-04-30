---
doc_role: refactoring-execution
resource_slug: house-manager-runtime-generico
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: runtime visual genérico no house-manager

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/lib/house-manager-runtime-port.ts`
  - `src/components/rac-editor/lib/house-manager-canvas-runtime.ts`
  - `src/components/rac-editor/lib/house-manager-query-service.ts`
  - `src/components/rac-editor/@canvas/ports/CanvasHouseRuntimePort.ts`

## 2. Diagnóstico

O runtime da casa ainda usava `CanvasGroup` como tipo fixo em estruturas que podiam ser genéricas. Isso dificultava separar o contrato visual mínimo da implementação concreta de canvas.

## 3. Transformação Executada

- Criada a porta genérica `HouseVisualRuntimePort<TGroup>`.
- Criada a referência mínima `HouseRuntimeGroupRef`.
- `HouseManagerCanvasRuntime` passou a ser genérico em `TGroup`.
- `HouseManagerQueryService` passou a devolver grupos por `TGroup`.
- `CanvasHouseRuntimePort` especializa a porta genérica com `CanvasGroup`.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados de house-manager, terrain, runtime e ports de canvas: passaram, 4 arquivos e 15 testes.
- `rtk git diff --check`: passou.
- inspeção `rg` mostrou redução de imports diretos de `CanvasGroup` no runtime/query service.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: o ciclo formaliza um contrato de runtime visual que sustenta os próximos cortes de ports/adapters.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: o contrato ainda está em consolidação e deve ser avaliado junto da separação completa entre leitura lógica e runtime visual.
