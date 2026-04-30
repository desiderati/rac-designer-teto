---
doc_role: refactoring-execution
resource_slug: modals-piloti-editor-classes
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: classes visuais do editor de piloti

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/@modals/hooks/usePilotiEditor.ts`
  - `src/components/rac-editor/@modals/lib/piloti-editor-classes.ts`
  - `src/components/rac-editor/@modals/lib/piloti-editor-classes.smoke.test.ts`

## 2. Diagnóstico

`usePilotiEditor` misturava estado/interação do editor com regras puras de classes de botões. Isso aumentava ruído no hook e dificultava validar estados visuais simples sem montar o hook inteiro.

## 3. Transformação Executada

- Extraídas funções puras de classe para `@modals/lib`.
- Adicionado smoke test para seleção de altura e botão de contraventamento.
- Preservada a API retornada por `usePilotiEditor`.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- teste focado de classes do editor de piloti: passou, 1 arquivo e 2 testes.
- `rtk git diff --check`: passou.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: o ciclo cria uma separação estável entre regra visual pura e hook de interação.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: extração interna de UI, sem decisão arquitetural ampla.
