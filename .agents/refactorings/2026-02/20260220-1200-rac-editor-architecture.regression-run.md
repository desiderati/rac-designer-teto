---
title: "Regression Run — Arquitetura do editor RAC"
doc_role: regression-run
created: 2026-02-20
updated: 2026-04-20
tags: [ refactoring, regression-run ]
---

# Regression Run — Arquitetura do editor RAC

> Documento retroconvertido em 2026-04-20 a partir de `2026-02-20/regression-run.md` e subrodadas absorvidas.

> Este documento é um ledger factual. Evite narrativa longa; registre evidência.

## 1. Identificação e Vínculos

- prompt durável de origem:
  `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- documento principal de refactoring:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.refactoring.md`
- regression checklist de origem:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-checklist.md`
- review de origem:
  não aplicável
- slugs de candidatos desta rodada:
  não aplicável
- perfil de risco: `high`
- modo de execução: `gated`

## 2. Preparação da Rodada

- baseline consultado:
  checklist de Fase 0 com fluxos de casa, views, piloti, canvas, persistência e 3D.
- hotfixes aplicados antes da revalidação:
  remoção de referência inválida em `PilotiEditor.tsx`, ajustes de settings/storage e extrações incrementais de hooks
  citadas no ledger legado.
- mudanças estruturais sob teste:
  decomposição de editor/canvas, expansão de E2E, extrações de hooks, primeiros movimentos de domínio/aplicação e
  estabilização de 3D.
- observações iniciais:
  o próprio ledger registra crescimento gradual de cobertura e manutenção do build durante as subrodadas.

## 3. Evidências de Execução

### Evidência 1

- comando:
  `npm test`
- escopo do comando:
  baseline inicial local da rodada
- resultado esperado:
  smoke/unit verdes
- status real: `pass`
- contagem ou saída relevante:
  `12/12` no início da rodada
- hotfix aplicado antes deste resultado:
  nenhum
- rerun?: `não`
- evidência indireta coletada:
  criação de `tipo6`/`tipo3` e regras básicas de views/piloti cobertas por smoke tests do manager.
- lacunas restantes:
  canvas, contraventamento, 3D e import/export ainda dependiam de validação adicional.

### Evidência 2

- comando:
  `npm run build`
- escopo do comando:
  build de produção
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  build passou repetidamente ao longo da rodada
- hotfix aplicado antes deste resultado:
  nenhum no baseline; reexecutado após correções pontuais
- rerun?: `sim`
- evidência indireta coletada:
  reforço de que paths e contratos principais continuavam coerentes durante a decomposição.
- lacunas restantes:
  build não substituía validação funcional do editor.

### Evidência 3

- comando:
  `npm run lint`
- escopo do comando:
  lint geral
- resultado esperado:
  verde
- status real: `fail`
- contagem ou saída relevante:
  falhou por dívida legada, principalmente ligada a `no-explicit-any`
- hotfix aplicado antes deste resultado:
  nenhum
- rerun?: `não`
- evidência indireta coletada:
  a frente já precisava separar qualidade nova de passivo herdado.
- lacunas restantes:
  lint geral ficou como gap explícito e não como bloqueio de toda a rodada.

### Evidência 4

- comando:
  `npm run test:e2e -- e2e/rac-regression.spec.ts`
- escopo do comando:
  house views e regressão E2E consolidada inicial
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  progressão histórica `6/6`, depois `10/10` e depois `14/14`
- hotfix aplicado antes deste resultado:
  correção da tela branca do `Piloti Editor` e expansão de suporte de debug/test ids.
- rerun?: `sim`
- evidência indireta coletada:
  fluxos de vistas, piloti, canvas, toolbar e viewer 3D passaram a ter evidência E2E concreta.
- lacunas restantes:
  parte de contraventamento e import/export ainda não estava totalmente coberta.

### Evidência 5

- comando:
  `npm run test:e2e -- e2e/house-views-limits.spec.ts e2e/canvas.spec.ts e2e/toolbar-overflow.spec.ts e2e/viewer-3d.spec.ts e2e/piloti.spec.ts`
- escopo do comando:
  suíte E2E quebrada por domínio após refatoração dos specs
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  `14/14`
- hotfix aplicado antes deste resultado:
  quebra do spec monolítico em specs por domínio para reduzir intermitência.
- rerun?: `sim`
- evidência indireta coletada:
  a reorganização dos testes preservou a cobertura funcional obtida antes.
- lacunas restantes:
  cobertura ainda parcial frente ao escopo completo da frente ampla.

### Evidência 6

- comando:
  `npm run test -- --run` + `npm run build` + `npm run test:e2e -- --workers=1`
- escopo do comando:
  subrodadas históricas de continuidade `2026-02-22` e `2026-02-23`
- resultado esperado:
  verdes
- status real: `pass`
- contagem ou saída relevante:
  `120/120`, depois `121/121`, com `16/16` E2E serial nas rodadas documentadas
- hotfix aplicado antes deste resultado:
  extrações incrementais como `useCanvasTools`, `useRacEditorJsonActions`, `useCanvasGroupingActions`,
  `useCanvasPointerInteractions`, `usePilotiActions`, `useCanvasEditorEvents`, `useTutorialUiActions`.
- rerun?: `sim`
- evidência indireta coletada:
  decomposição incremental preservou o comportamento nos passos absorvidos.
- lacunas restantes:
  lint global e parte de validação manual.

### Evidência 7

- comando:
  `npm run test:regression`
- escopo do comando:
  validação consolidada da Fase 7 incremental de domínio/aplicação
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  progressão histórica com `16/16`, `20/20`, `28/28` e `31/31` em smoke/unit, além de Playwright `16/16`
- hotfix aplicado antes deste resultado:
  introdução gradual de `house-use-cases`, `house-application`, `house-views-*` e rebuild de views no domínio.
- rerun?: `sim`
- evidência indireta coletada:
  a migração parcial para domínio/aplicação foi sustentada por evidência factual, não apenas por plano.
- lacunas restantes:
  a frente ampla ainda permaneceu aberta e exigiu reanálise em `2026-02-26/27`.

## 4. Resultado Consolidado

- itens validados com evidência direta:
  criação de casa, limites de vistas, parte relevante de piloti, canvas, toolbar, viewer 3D, build e smoke/unit
  progressivos.
- itens validados indiretamente:
  manutenção de contratos internos durante extrações incrementais e primeiros movimentos de domínio.
- itens pendentes:
  lint geral legado, parte de contraventamento ponta a ponta e validações manuais completas de import/export e 3D.
- blockers remanescentes:
  nenhum blocker fatal registrado após as revalidações absorvidas; restaram riscos estruturais para ondas seguintes.

## 5. Hotfixes e Revalidações

### Hotfix 1

- problema observado:
  tela branca ao abrir `Piloti Editor`.
- correção aplicada:
  remoção de referência inválida em `src/components/rac-editor/PilotiEditor.tsx`.
- comando(s) de revalidação:
  `npm test`, `npm run build`, `npm run test:e2e -- e2e/rac-regression.spec.ts`
- resultado após revalidação:
  todos `PASS`

### Hotfix 2

- problema observado:
  necessidade de tornar settings/storage e `useCanvasFabricSetup` mais resilientes na continuidade.
- correção aplicada:
  endurecimento de `updateSetting` e revalidação dirigida do hook/setting.
- comando(s) de revalidação:
  `npx eslint ...`, `npm run test -- --run`, `npm run build`, `npm run test:e2e -- --workers=1`
- resultado após revalidação:
  rodada documentada como `PASS`

### Hotfix 3

- problema observado:
  flakiness e baixa legibilidade do spec monolítico de regressão.
- correção aplicada:
  quebra da suíte E2E por domínio.
- comando(s) de revalidação:
  specs quebrados executados explicitamente
- resultado após revalidação:
  `14/14 PASS`

## 6. Lacunas Remanescentes

- lacuna:
  lint global ainda falhando por dívida histórica fora do escopo.
- impacto:
  reduz confiança de higiene geral, mas não invalida o baseline factual da frente.
- decisão tomada:
  registrar como gap estrutural, não como falha da retroconversão.

- lacuna:
  parte das validações de contraventamento e import/export permaneceu manual ou parcial.
- impacto:
  futuras ondas ainda precisam checklist/run explícitos.
- decisão tomada:
  manter a frente em alto risco e preservar este ledger como memória consultável.

## 7. Artefatos Relacionados

- sidecar de evidências:
  não aplicável
- changelog diário:
  `.changelogs/changelog-20260420.md`
- arquivos alterados:
  artefatos retroconvertidos desta wave
