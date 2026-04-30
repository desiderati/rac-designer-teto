---
doc_role: refactoring-execution
resource_slug: house-runtime-snapshot-generico
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: snapshot de runtime da casa genérico

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/lib/house-runtime-snapshot.ts`
  - `src/components/rac-editor/ports/HouseStatePort.ts`
  - `src/components/rac-editor/lib/house-manager-*.ts`
  - `src/components/rac-editor/@canvas/lib/house-3d-projection.ts`
  - `src/infra/house/house-manager-state-adapter.ts`

## 2. Diagnóstico

`HouseRuntimeSnapshot` importava `CanvasGroup` diretamente, o que fazia o contrato de snapshot da casa carregar um tipo concreto do canvas mesmo quando o consumidor só precisava conhecer a forma lógica do runtime.

## 3. Transformação Executada

- `HouseRuntimeSnapshot` passou a aceitar `TGroup = unknown`.
- `HouseStatePort` passou a aceitar `TGroup = unknown`.
- Pontos que ainda precisam de grupo visual passaram a declarar `HouseRuntimeSnapshot<CanvasGroup>` explicitamente.
- O adapter de estado da casa passou a especializar `HouseStatePort<CanvasGroup>`.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- `rtk npm exec -- vitest run src/components/rac-editor/lib/house-manager.smoke.test.ts src/components/rac-editor/lib/house-manager-terrain.smoke.test.ts src/infra/house/house-manager-state-runtime-adapter.smoke.test.ts`: passou, 3 arquivos e 13 testes.
- `rtk git diff --check`: passou.
- `rtk rg` confirmou que `CanvasGroup` ainda permanece em pontos explícitos de runtime/adapter, agora como dívida localizada para o próximo ciclo.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: o ciclo materializa uma decisão de fronteira relevante e deixa uma trilha útil para os próximos cortes.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: a decisão ainda é incremental; a promoção para ADR deve esperar a consolidação da separação completa entre runtime visual e estado lógico da casa.
