---
doc_role: refactoring-execution
resource_slug: house-manager-state-snapshot
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: snapshot lógico fora da fachada do house-manager

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/lib/house-manager.facade.ts`
  - `src/components/rac-editor/lib/house-state-snapshot.ts`
  - `src/components/rac-editor/lib/house-state-snapshot.smoke.test.ts`

## 2. Diagnóstico

`HouseManagerFacade` ainda carregava lógica auxiliar de cópia do estado lógico, além de comentários que apenas repetiam nomes de métodos. Isso aumentava ruído no núcleo da fachada sem acrescentar semântica.

## 3. Transformação Executada

- Extraído `createHouseStateSnapshot`.
- Adicionado smoke test para garantir cópia das coleções mutáveis.
- Removidos comentários redundantes em métodos públicos autoexplicativos.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados de snapshot, house-manager e adapters de estado/runtime: passaram, 3 arquivos e 13 testes.
- `rtk git diff --check`: passou.
- `house-manager.facade.ts` ficou com 228 linhas após o corte.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: o ciclo reduz ruído da fachada e cria um helper testado para leitura lógica.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: trata-se de extração local, sem decisão arquitetural nova.
