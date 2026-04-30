---
doc_role: refactoring-execution
resource_slug: house-state-runtime-ports
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: portas separadas para estado lógico e runtime visual da casa

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/ports/HouseStatePort.ts`
  - `src/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts`
  - `src/infra/house/house-manager-state-adapter.ts`
  - `src/components/rac-editor/lib/house-store.ts`
  - `src/bootstrap/editor-bootstrap.ts`

## 2. Diagnóstico

O antigo `HouseStatePort` entregava snapshot de runtime, o que confundia estado lógico com projeção visual. Isso mantinha a UI dependente de um contrato com grupos visuais mesmo quando só precisava de dados lógicos da casa.

## 3. Transformação Executada

- `HouseStatePort` passou a retornar `HouseState` lógico por `getStateSnapshot`.
- Criado `HouseRuntimeSnapshotPort<TGroup>` para snapshots com grupos visuais resolvidos.
- O adapter atual expõe portas separadas para estado lógico e runtime visual.
- `house-store` passou a oferecer `useHouseStateSnapshot` e `useHouseRuntimeSnapshot`.
- `useHouseSnapshot` permanece como alias de compatibilidade para o runtime atual.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados de infra, bootstrap e house-manager: passaram, 3 arquivos e 14 testes.
- `rtk git diff --check`: passou.
- `rtk rg` não encontrou usos antigos de `getSnapshot()` ou `HouseStatePort<...>` em `src`.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: a separação de contratos corrige uma ambiguidade semântica central e será referência para os próximos ciclos.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `sim`
- justificativa curta da recomendação de ADR: a distinção entre estado lógico e runtime visual tem valor futuro de consulta e impacta a direção dos ports/adapters do editor.
