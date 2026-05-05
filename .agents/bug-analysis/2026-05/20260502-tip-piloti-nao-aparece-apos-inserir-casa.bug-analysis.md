---
title: "Bug Analysis — tip do piloti não aparece após inserir casa"
doc_role: bug-analysis
status: confirmed
created: 2026-05-02
updated: 2026-05-02
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, guided-tour, rac-editor ]
aliases: [ tip do piloti após inserir casa ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: o balão do piloti mestre não aparecia quando a casa era inserida
- origem do relato: usuário
- ambiente: branch `temp`, aplicação React/Vite local
- status analítico: confirmado
- estado da correção: aplicada e validada

## 2. Contexto e Sintoma Observado

- contexto funcional: o guided-tour passou a ouvir eventos globais para exibir tips e fluxos sem acoplar o RacEditor.
- sintoma observado: ao inserir a casa, o balão do piloti mestre não aparecia.
- impacto percebido: o usuário não recebia orientação inicial sobre o piloti mestre nem sobre a vista elevada criada.
- limitações ou incertezas iniciais: era necessário confirmar se a falha estava no runtime do guided-tour ou na ausência
  de evento durante a inserção inicial da casa.

## 3. Escopo Afetado

- fluxos afetados: aplicação dos níveis iniciais e inserção da planta + vista elevada.
- regras de negócio afetadas: a inserção inicial da casa deve orientar o usuário primeiro no piloti mestre e depois na
  vista elevada.
- módulos envolvidos:
    - `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`
    - `src/components/rac-editor/@canvas/lib/canvas-object-dom-events.ts`
    - `src/components/guided-tour/hooks/useGuidedTourRuntime.ts`
    - `src/components/guided-tour/tours/rac-editor-tour.ts`
- contratos envolvidos: evento `rac:house-initial-views-inserted` com alvos dinâmicos.

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: após inserir e reposicionar a planta e a vista elevada, o canvas informa os retângulos do piloti
  mestre e da vista elevada; o guided-tour inicia um pequeno fluxo de duas etapas.
- fluxo real: o canvas não emitia nenhum evento na inserção inicial; o evento de piloti existente só ocorria quando um
  piloti era selecionado.
- ponto de divergência identificado: ausência de evento de inserção inicial da casa.

## 5. Hipóteses Causais

| Hipótese                                                        | Evidências a favor                                                                                    | Evidências contra                                                                  | Status                            |
|-----------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|-----------------------------------|
| A inserção inicial da casa não emitia evento para o guided-tour | código só emitia evento de piloti em seleção; teste novo falhou sem nenhum evento após aplicar níveis | nenhuma após inspeção do fluxo                                                     | confirmada                        |
| O runtime do guided-tour não conseguia iniciar fluxo por evento | não havia suporte a tours disparados por eventos com múltiplos alvos                                  | teste novo do host validou o comportamento após implementar o contrato             | confirmada como lacuna de suporte |
| O tip de piloti estava bloqueado por storage                    | storage pode suprimir tips vistos                                                                     | relato era específico da inserção da casa, e o fluxo não emitia evento nessa etapa | secundária                        |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- `usePilotiEditorActions` despachava `rac:canvas-object-selected` apenas em seleção de piloti.
- `useCanvasHouseViewActions.handleNiveisApplied` inseria planta e vista elevada sem publicar evento.
- teste novo de `useCanvasHouseViewActions` falhou antes da correção e passou depois.
- teste novo de `GuidedTourHost` validou a sequência Piloti Mestre -> Vista Elevada.

### Pontos de código, contrato ou regra

- `useCanvasHouseViewActions`: calcula os retângulos em tela após reposicionar planta e vista elevada.
- `canvas-object-dom-events`: define o evento genérico emitido pelo canvas.
- `useGuidedTourRuntime`: inicia tours por evento e usa retângulos dinâmicos por etapa.
- `rac-editor-tour`: configura o tour curto de inserção inicial.

## 7. Classe do Defeito ou Regressão

- classe: lacuna de integração por evento ausente.
- por que se aplica: o guided-tour só pode reagir a fatos externos; a inserção inicial da casa não publicava o fato
  necessário.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente: emitir `rac:house-initial-views-inserted` após reposicionar os grupos iniciais e permitir que
  o guided-tour inicie um fluxo configurado por evento.
- por que resolve a causa: o runtime passa a receber os dois alvos reais em coordenadas de tela e avança do piloti
  mestre para a vista elevada.
- riscos e impactos laterais: baixo; o RacEditor continua sem importar ou controlar o guided-tour, emitindo apenas um
  evento genérico de canvas.

## 9. Validação Executada

- testes executados:
    -
    `npm run test -- src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx`
    -
    `npm run test -- src/components/rac-editor/@canvas/hooks/useCanvasTools.smoke.test.ts src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx`
    - `npm run test -- src/components/rac-editor/@menus/ui/FamilyName.smoke.test.tsx`
- build, lint ou smoke relevante:
    - `npm run lint`
    - `npm run build`
    - `git diff --check`
- observação: uma execução completa de `npm run test` teve timeout isolado em `FamilyName.smoke.test.tsx`; o arquivo
  passou em rerun isolado.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma para a sequência solicitada.
- por que ainda importa: não se aplica.

## 11. Artefatos Relacionados

- incidente correlato: não há.
- PR, commit ou diff relacionado: mudanças locais na branch `temp`.
- sidecar de anexos: imagens enviadas no relato do usuário.
- documentos correlatos: changelog de 2026-05-02.
