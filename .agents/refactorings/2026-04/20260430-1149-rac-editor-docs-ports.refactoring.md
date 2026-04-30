---
doc_role: refactoring-execution
resource_slug: rac-editor-docs-ports
resource_kind: documentation
status: completed
lang: pt-BR
---

# Refatoração: documentação dos ports e slices do RAC editor

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `README.md`
  - `docs/engineering-playbook/PLAY-004-project-structure.md`
  - `docs/engineering-playbook/PLAY-102-frontend-state-and-hooks.md`
  - `docs/architecture-decisions/ADR-001-fronteira-editor-runtime-fabric.md`
  - `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`

## 2. Diagnóstico

A documentação durável ainda misturava caminhos anteriores aos slices prefixados com `@` e não descrevia com precisão a
separação recém-criada entre leitura lógica da casa e snapshot de runtime visual. Isso deixava a trilha arquitetural menos
confiável justamente na fronteira que orienta os próximos ciclos.

## 3. Transformação Executada

- Atualizados os slices canônicos do editor para `@canvas`, `@menus`, `@modals` e `@viewer-3d`.
- Documentada a distinção entre `HouseStatePort`, `HouseRuntimeSnapshotPort<TGroup>` e
  `HouseVisualRuntimePort<TGroup>`.
- Atualizado o playbook de hooks para orientar quando usar `useHouseStateSnapshot` e `useHouseRuntimeSnapshot`.
- Mantido `useHouseSnapshot` apenas como alias transitório de compatibilidade.
- Corrigida a referência de `editor-ids.ts` no ADR de fronteira do Fabric.
- Recalibrado o prompt durável da frente para não apontar mais para paths legados como estrutura vigente.

## 4. Evidência

- `rtk rg` não encontrou referências antigas a `canvas/`, `menus/`, `modals/`, `viewer3d/`, `ui/canvas`,
  `hooks/canvas`, `lib/canvas`, `ui/3d` ou `@canvas/types/editor-ids` nos documentos verificados.
- `rtk git diff --check`: passou.
- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.

## 5. Fechamento

- classificação de fechamento: `consolidar-em-durável-existente`
- justificativa da classificação: o ciclo estabiliza documentação canônica já existente, sem abrir uma decisão
  arquitetural nova.
- registro durável destino: README, playbooks, ADR-001 e prompt durável da frente.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `sim, atualizar ADR existente`
- justificativa curta da recomendação de ADR: a separação entre estado lógico e runtime visual deve ser incorporada à
  decisão de fronteira do Fabric, em vez de virar um ADR isolado prematuro.
