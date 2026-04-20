---
title: "Refactoring Heuristic — Canvas do editor RAC"
doc_role: refactoring-heuristic
created: 2026-02-20
updated: 2026-04-20
heuristic_slug: canvas
scope_type: runtime
status: active
confidence: high
applicable_resource_slugs:
  - rac-editor-architecture
  - elements-factory
consumers: [ refactoring ]
tags: [ refactoring, heuristic, canvas ]
---

# Refactoring Heuristic — Canvas do editor RAC

> Revisão humana recomendada antes de usar este arquivo como base durável.

## 1. Contexto e Escopo

- escopo heurístico: runtime 2D do editor, incluindo viewport, seleção, rebuild, normalização, strategies e integração
  com Fabric.
- superfície observada: `ui/canvas/Canvas.tsx`, `hooks/canvas/*`, `lib/canvas/*`, `lib/canvas/factory/*`,
  `lib/house-manager.ts`.
- `resource-slugs` associados: `rac-editor-architecture`, `elements-factory`
- prompts duráveis associados:
    - `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
    - `.agents/prompts/refactoring-elements-factory.prompt.md`
- evidências fortes:
    - o plano de `2026-02-20` coloca `canvas-utils` e `Canvas.tsx` entre os maiores hotspots do sistema.
    - o checklist histórico insiste em zoom/pan/minimap/undo/redo/copy-paste/import-export.
    - a árvore atual já segmenta viewport, history, selection, pointer interactions e strategies por elemento.
- evidências fracas:
    - ainda há dependências indiretas entre runtime de canvas e manager que exigem leitura cuidadosa a cada rodada.

## 2. Sinais de Ativação

- sinal: o código mexe com viewport, seleção, gestures, histórico ou manipulação de objetos.
- evidência: docs de `canvas.md`, hooks atuais e histórico de regressão do editor.

- sinal: a frente mexe com rebuild, import/export, contraventamento ou normalização visual.
- evidência: checklist e ledger legados destacam essas superfícies como áreas frágeis.

- sinal: details de Fabric começam a se espalhar fora da fronteira esperada.
- evidência: histórico antigo e warnings de arquitetura sobre canvas/source-of-truth.

## 3. Sinais de Suspensão

- condição de suspensão: a mudança não toca runtime do canvas nem objetos desenháveis.
- por que suspender: a heurística ficaria decorativa.

- condição de suspensão: a frente é puramente de domínio sem qualquer tradução para o canvas.
- por que suspender: outra heurística passa a ser dominante.

## 4. Heurísticas Ativas

### Heurística 1

- enunciado: o canvas deve ser projeção e executor de interação, não fonte de verdade do projeto.
- por que tende a funcionar neste contexto: sempre que o canvas assume papel de estado canônico, rebuild/import/export e
  3D ficam frágeis.
- quando aplicar: em `house-manager`, rebuild, import/export, selection e strategies.
- quando suspender: apenas em helpers puramente geométricos e locais.
- como falsificar: se mover mais decisão para fora do canvas piorar o desempenho ou a rastreabilidade sem reduzir
  acoplamento.
- custo de errar: alto.
- reversibilidade: média.

### Heurística 2

- enunciado: wiring do Fabric deve ficar isolado em hooks e helpers explícitos, com cleanup e contrato claros.
- por que tende a funcionar neste contexto: o histórico do projeto mostra regressões em setup, keyboard shortcuts,
  pointer interactions e seleção.
- quando aplicar: ao tocar `useCanvasFabricSetup`, eventos, editor events, keyboard shortcuts e pointer interactions.
- quando suspender: quando a mudança for puramente de regra de domínio, sem wiring.
- como falsificar: se a extração fragmentar demais o ciclo de vida e tornar o fluxo impossível de auditar.
- custo de errar: médio.
- reversibilidade: alta.

### Heurística 3

- enunciado: guards e normalizações compartilhadas devem ser centralizados quando o padrão já se repetiu materialmente.
- por que tende a funcionar neste contexto: a duplicação do `__normalizingScale` e de normalizações visuais foi um smell
  explícito do acervo.
- quando aplicar: ao tocar strategies de linha, seta, distância, parede e helpers compartilhados.
- quando suspender: quando só houver uma implementação real e o shared helper for mais caro do que o benefício.
- como falsificar: se o helper compartilhado virar um utilitário genérico opaco.
- custo de errar: médio.
- reversibilidade: alta.

## 5. Anti-heurísticas e Falhas Comuns

### Anti-heurística 1

- enunciado: confiar em rebuild/import como “efeito colateral que deve se ajustar sozinho”.
- risco gerado: estado inconsistente, side mappings quebrados e regressão difícil de detectar.
- sintoma de abuso: fluxos de import/export sem validação explícita.

### Anti-heurística 2

- enunciado: espalhar casts e runtime typing frouxo porque “Fabric exige”.
- risco gerado: narrowing quebrado, contratos implícitos e falhas só em runtime.
- sintoma de abuso: helpers e strategies cheios de casts ad hoc.

## 6. Implicações para Refactoring

- smells e hotspots relacionados:
    - canvas as source of truth
    - hidden side effects in event wiring
    - duplicated normalization guards
    - loose runtime typing
- transformações preferenciais:
    - `extract hook`
    - `extract helper`
    - `move`
    - `introduce interface`
- transformações a evitar:
    - utilitário gigante de canvas
    - wiring espalhado por componentes de UI
- heurísticas irmãs relevantes:
    - `visual-editor`
    - `3d-scene`

## 7. Implicações para Regressão

- fluxos críticos afetados:
    - zoom, pan e minimap
    - seleção, copy/paste e undo/redo
    - import/export e rebuild
    - edição inline e contraventamento
- riscos arquiteturais:
    - perda de sincronização entre estado e projeção
    - flakiness de E2E
    - regressão de tipos em runtime
- validação mínima esperada:
    - smoke/E2E dos fluxos de canvas
    - build e tipagem
    - evidência explícita para rebuild/import/export quando houver mudança estrutural

## 8. Calibração e Limites

- quando esta heurística deixa de ajudar: quando a rodada não toca runtime 2D nem factories/selection/history.
- o que mudou desde a versão anterior: primeira materialização retroativa combinando o acervo de fevereiro e a estrutura
  atual segmentada.
- critérios de deprecação: o canvas deixar de concentrar risco arquitetural relevante ou migrar para fronteira
  completamente encapsulada.
- revisão humana recomendada: conferir sempre se a refatoração reduziu risco real ou apenas deslocou wiring.
