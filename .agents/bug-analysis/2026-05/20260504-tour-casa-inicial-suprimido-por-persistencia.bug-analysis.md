---
title: "Bug Analysis — tour inicial da casa suprimido por persistência"
doc_role: bug-analysis
status: confirmed
created: 2026-05-04
updated: 2026-05-04
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, guided-tour, rac-editor ]
aliases: [ tour inicial da casa não aparece ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: o tour de Vista Planta e Vista Elevada não aparecia ao inserir a primeira casa
  no canvas
- origem do relato: usuário
- ambiente: branch `temp`, aplicação React/Vite local
- status analítico: confirmado
- estado da correção: aplicada e validada

## 2. Contexto e Sintoma Observado

- contexto funcional: o guided-tour autônomo escuta o evento `rac:house-initial-views-inserted` emitido pelo canvas após
  inserir e reposicionar a planta e a vista elevada.
- sintoma observado: ao inserir a casa pela primeira vez no canvas, os dois balões esperados não eram exibidos.
- impacto percebido: o usuário perdia a orientação contextual sobre a vista planta e a vista elevada no momento em que
  essas vistas eram criadas.
- limitações ou incertezas iniciais: era necessário separar falha de emissão/consumo do evento de uma possível supressão
  por storage.

## 3. Escopo Afetado

- fluxos afetados: inserção inicial da casa no canvas e pequeno fluxo contextual da casa.
- regras de negócio afetadas: a primeira inserção da casa no canvas deve orientar o usuário sobre Vista Planta e Vista
  Elevada.
- módulos envolvidos:
    - `src/components/guided-tour/hooks/useGuidedTourRuntime.ts`
    - `src/components/guided-tour/tours/rac-editor-tour.ts`
    - `src/components/guided-tour/ports/types.ts`
    - `src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx`
    - `e2e/guided-tour.spec.ts`
- contratos envolvidos: evento `rac:house-initial-views-inserted` com alvos dinâmicos.

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: sempre que a casa é inserida pela primeira vez no canvas e o evento contextual é emitido, o
  guided-tour
  deve abrir o balão da Vista Planta e, após OK, o balão da Vista Elevada.
- fluxo real: se `guided-tour:rac-house-initial-views:completed` estivesse marcado com a revisão atual, o runtime
  descartava o evento e não criava item ativo.
- ponto de divergência identificado: o runtime aplicava a conclusão persistida global a um fluxo contextual disparado
  por evento de canvas.

## 5. Hipóteses Causais

| Hipótese                                                             | Evidências a favor                                                                                                                         | Evidências contra                                                                              | Status     |
|----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|------------|
| O evento da inserção inicial deixou de ser emitido                   | sintoma ocorria no momento da inserção da casa                                                                                             | teste de `useCanvasHouseViewActions` continuou validando emissão com dois alvos                | descartada |
| O guided-tour não conseguia renderizar o fluxo quando recebia evento | poderia explicar ausência dos balões                                                                                                       | teste existente validava evento com storage não atual; E2E isolado passou após permitir replay | descartada |
| A conclusão persistida com revisão atual suprimia o tour contextual  | teste novo falhou antes da correção quando `completed=true` e `revision=top-view`; código filtrava por `!isGuidedTourCompleted(candidate)` | nenhuma após reprodução                                                                        | confirmada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- o teste focado novo falhou antes da correção procurando `role="dialog"` após o evento com conclusão persistida atual.
- o teste passou após permitir que o trigger do tour contextual faça replay mesmo quando já concluído.
- o E2E novo confirmou a sequência real Vista Planta -> Vista Elevada ao criar a casa.

### Pontos de código, contrato ou regra

- `useGuidedTourRuntime`: filtrava tours por evento usando apenas `!isGuidedTourCompleted(candidate)`.
- `rac-editor-tour`: o tour `rac-house-initial-views` agora declara `replayWhenCompleted: true` no trigger.
- `types.ts`: o contrato de `triggerEvent` passou a aceitar replay explícito, sem mudar o padrão dos demais tours.

## 7. Classe do Defeito ou Regressão

- classe: regressão de semântica de persistência.
- por que esta classificação se aplica: uma persistência global adequada para o tutorial introdutório foi aplicada a um
  tour contextual que deve responder à ocorrência real de inserção da casa no canvas.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente: adicionar `replayWhenCompleted` ao trigger de tours e habilitar essa opção apenas para
  `rac-house-initial-views`.
- por que resolve a causa: o evento contextual da casa deixa de ser bloqueado por conclusão global anterior, enquanto o
  tutorial introdutório e os tips continuam usando a persistência já existente.
- riscos e impactos laterais: E2E que não valida tutorial precisa descartar os dois balões após criar a casa; o helper
  compartilhado foi atualizado para fazer isso por padrão.

## 9. Validação Executada

- testes executados:
    - `npm run test -- src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx`
    -
  `npm run test -- src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts`
    - `npm run test`
- validação E2E:
    - `npx playwright test e2e/guided-tour.spec.ts --project=chromium`
    - `npx playwright test e2e/guided-tour.spec.ts e2e/viewer-3d.spec.ts --project=chromium`
    - `npx playwright test --project=chromium --workers=1`
    - `npx playwright test --project=chromium`
- build, lint ou smoke relevante:
    - `npm run lint`
    - `npm run build`
    - `git diff --check`
- critério de sucesso observado: o fluxo real exibiu Vista Planta e Vista Elevada, e as suítes unitária, E2E, lint e
  build passaram.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma para a correção aplicada.
- por que ainda importa: não se aplica.

## 11. Artefatos Relacionados

- incidente correlato: não há.
- PR, commit ou diff relacionado: mudanças locais na branch `temp`.
- sidecar de anexos: não há.
- documentos correlatos:
    - `.agents/bug-analysis/2026-05/20260502-tip-piloti-nao-aparece-apos-inserir-casa.bug-analysis.md`
    - `.agents/changelogs/2026-05/20260504.changelog.md`
