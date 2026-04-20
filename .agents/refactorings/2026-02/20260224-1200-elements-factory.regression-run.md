---
title: "Regression Run — Elements Factory"
doc_role: regression-run
created: 2026-02-24
updated: 2026-04-20
tags: [ refactoring, regression-run ]
---

# Regression Run — Elements Factory

> Documento retroconvertido em 2026-04-20 a partir de `2026-02-24/regression-run.md`.

> O ledger original registra evidências em `2026-02-25`; essa data foi preservada no corpo/proveniência, sem quebrar o
> basename canônico da rodada.

## 1. Identificação e Vínculos

- prompt durável de origem:
  `.agents/prompts/refactoring-elements-factory.prompt.md`
- documento principal de refactoring:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.refactoring.md`
- regression checklist de origem:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.regression-checklist.md`
- review de origem:
  não aplicável
- slugs de candidatos desta rodada:
  não aplicável
- perfil de risco: `high`
- modo de execução: `direct`

## 2. Preparação da Rodada

- baseline consultado:
  checklist legado da mega refatoração de `2026-02-24`.
- hotfixes aplicados antes da revalidação:
  compatibilidade do debug bridge para E2E, ajuste de expectativa de toolbar, reforço de actionability nos helpers de
  E2E,
  correções de import e de typing estrito, novo spec `modal-editors`, smoke de imports legados e hotfixes em
  canvas/piloti visual.
- mudanças estruturais sob teste:
  migração de paths, reorganização da factory, integração com editores lineares/parede, ajustes de tipagem e suporte de
  regressão.
- observações iniciais:
  rodada factual de revalidação registrada em `2026-02-25`, absorvida aqui como proveniência.

## 3. Evidências de Execução

### Evidência 1

- comando:
  `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`
- escopo do comando:
  tipagem estrita
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  PASS na rodada e PASS após hotfix wave 2
- hotfix aplicado antes deste resultado:
  guards de contraventamento, remoção de `any`, ajustes de narrowing e contratos de helper
- rerun?: `sim`
- evidência indireta coletada:
  contratos de tipo relevantes para factory/editor permaneceram consistentes.
- lacunas restantes:
  tipagem verde não substituiu validação manual de todos os tipos de elemento.

### Evidência 2

- comando:
  `npm run test -- --run`
- escopo do comando:
  smoke/unit
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  `117/117`
- hotfix aplicado antes deste resultado:
  novo smoke de imports legados, hotfixes de piloti visual e ajustes de contratos
- rerun?: `sim`
- evidência indireta coletada:
  a rodada preservou o pacote de testes locais mesmo após hotfixes.
- lacunas restantes:
  cobertura funcional manual ainda parcial para alguns elementos.

### Evidência 3

- comando:
  `npm run build`
- escopo do comando:
  build de produção
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  PASS, reexecutado após hotfix
- hotfix aplicado antes deste resultado:
  correções de tipagem/import e ajustes de helpers
- rerun?: `sim`
- evidência indireta coletada:
  paths e contratos principais ficaram coerentes após a rodada.
- lacunas restantes:
  build não garante correção visual de scaling.

### Evidência 4

- comando:
  `npm run test:e2e -- --workers=1`
- escopo do comando:
  E2E serial
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  `17/17`
- hotfix aplicado antes deste resultado:
  alias `getHousePiloti`, ajuste de expectativa em `toolbar-overflow`, actionability reforçada, novo spec
  `modal-editors`
- rerun?: `não`
- evidência indireta coletada:
  canvas, modal editors, piloti, toolbar, viewer 3D e house views ficaram verdes na rodada.
- lacunas restantes:
  alguns fluxos manuais detalhados continuaram fora do E2E.

### Evidência 5

- comando:
  `npm run test:regression`
- escopo do comando:
  pacote consolidado
- resultado esperado:
  verde
- status real: `pass`
- contagem ou saída relevante:
  `34 files`, `117 tests`, build PASS e Playwright `17/17`
- hotfix aplicado antes deste resultado:
  conjunto completo de correções preparatórias da rodada
- rerun?: `não`
- evidência indireta coletada:
  a mega refatoração ficou estável nas superfícies principais da rodada.
- lacunas restantes:
  lint global permaneceu como dívida.

### Evidência 6

- comando:
  `npm run lint` / `npx eslint .`
- escopo do comando:
  lint geral
- resultado esperado:
  verde
- status real: `fail`
- contagem ou saída relevante:
  falha atribuída a dívida legada fora do escopo
- hotfix aplicado antes deste resultado:
  não aplicável
- rerun?: `não`
- evidência indireta coletada:
  foi necessário distinguir risco novo de passivo antigo.
- lacunas restantes:
  higiene global da base.

## 4. Resultado Consolidado

- itens validados com evidência direta:
  tsc strict, smoke/unit, build, E2E serial, pacote de regressão, edição inline de parede/lineares, toolbar e parte
  importante do fluxo 3D.
- itens validados indiretamente:
  ausência de imports legados e estabilidade geral da mega refatoração.
- itens pendentes:
  lint global e parte de cenários manuais completos por tipo de elemento.
- blockers remanescentes:
  nenhum blocker fatal preservado após a rodada factual.

## 5. Hotfixes e Revalidações

### Hotfix 1

- problema observado:
  incompatibilidades de debug bridge e expectativas E2E após a reorganização.
- correção aplicada:
  alias `getHousePiloti`, ajustes de helper de clique e expectativa de toolbar.
- comando(s) de revalidação:
  `npm run test:e2e -- --workers=1`
- resultado após revalidação:
  `17/17 PASS`

### Hotfix 2

- problema observado:
  problemas de tipagem estrita e contratos de runtime.
- correção aplicada:
  guards, remoção de `any`, ajuste de narrowing e restauração de overloads/contratos citados no ledger.
- comando(s) de revalidação:
  `npx tsc -p tsconfig.app.json --noEmit --strict --pretty false`, `npm run test -- --run`, `npm run build`
- resultado após revalidação:
  todos `PASS`

### Hotfix 3

- problema observado:
  risco de regressão silenciosa por imports legados e sincronização de editor inline.
- correção aplicada:
  smoke `legacy-imports` e spec `modal-editors`.
- comando(s) de revalidação:
  `npm run test -- --run src/infra/legacy-imports.smoke.test.ts`, `npm run test:e2e -- --workers=1`
- resultado após revalidação:
  `PASS`

## 6. Lacunas Remanescentes

- lacuna:
  lint global da base.
- impacto:
  a frente não encerra o passivo geral de higiene.
- decisão tomada:
  registrar como dívida legada fora do escopo desta rodada.

- lacuna:
  alguns cenários manuais detalhados de criação e contraventamento.
- impacto:
  futuras ondas ainda precisam checklist explícito.
- decisão tomada:
  preservar o checklist como contrato durável da frente.

## 7. Artefatos Relacionados

- sidecar de evidências:
  não aplicável
- changelog diário:
  `.changelogs/changelog-20260420.md`
- arquivos alterados:
  artefatos retroconvertidos desta wave
