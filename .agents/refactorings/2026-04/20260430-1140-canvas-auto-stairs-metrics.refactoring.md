---
doc_role: refactoring-execution
resource_slug: canvas-auto-stairs-metrics
resource_kind: module
status: completed
lang: pt-BR
---

# Refatoração: métricas de escadas automáticas do canvas

## 1. Contexto e Escopo

- Prompt usado: `.agents/refactorings/prompts/refactoring-rac-editor-architecture.prompt.md`
- Frente relacionada: `rac-editor-architecture`
- Escopo direto:
  - `src/components/rac-editor/@canvas/lib/house-auto-stairs.ts`
  - `src/components/rac-editor/@canvas/lib/house-auto-stairs-metrics.ts`

## 2. Diagnóstico

`house-auto-stairs.ts` concentrava manipulação de objetos Fabric, cálculo de métricas, interpolação de níveis e criação visual das escadas. Isso deixava o arquivo grande e dificultava testar/entender a parte matemática separadamente.

## 3. Transformação Executada

- Extraído `house-auto-stairs-metrics.ts` para métricas e interpolações puras.
- Mantida em `house-auto-stairs.ts` a manipulação de grupos e objetos do canvas.
- Normalizados line endings dos dois arquivos tocados.

## 4. Evidência

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados de auto-stairs e auto-contraventamento: passaram, 2 arquivos e 12 testes.
- `rtk git diff --check`: passou.
- `house-auto-stairs.ts` caiu de 531 para 388 linhas.

## 5. Fechamento

- classificação de fechamento: `durável`
- justificativa da classificação: a extração cria uma divisão estável entre cálculo puro e manipulação visual do canvas.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260430.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: a decisão é uma extração interna do slice `@canvas`, sem alternativa arquitetural ampla.
