---
title: "Bug Analysis — tips do guided-tour não reaparecem"
doc_role: bug-analysis
status: confirmed
created: 2026-05-02
updated: 2026-05-02
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, guided-tour ]
aliases: [ tips do guided-tour não reaparecem ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: tips do guided-tour não voltavam a aparecer durante nova rodada manual do
  tutorial
- origem do relato: usuário
- ambiente: branch `temp`, aplicação React/Vite local
- status analítico: confirmado
- estado da correção: aplicada e validada

## 2. Contexto e Sintoma Observado

- contexto funcional: o guided-tour substituiu o tutorial próprio do RacEditor e passou a controlar fluxo, tips e
  storage.
- sintoma observado: após iterações de teste, os tips contextuais deixavam de aparecer.
- impacto percebido: o tutorial podia ser reiniciado, mas os tips associados aos objetos do canvas permaneciam
  suprimidos.
- limitações ou incertezas iniciais: não havia evidência automatizada de que o hook do canvas emitia os eventos reais.

## 3. Escopo Afetado

- fluxos afetados: reinício manual do tutorial RAC e tips de objetos do canvas.
- regras de negócio afetadas: persistência de tips deve existir, mas não deve impedir uma nova rodada manual do
  tutorial.
- módulos envolvidos:
    - `src/components/guided-tour/hooks/useGuidedTourRuntime.ts`
    - `src/components/guided-tour/store/guided-tour-storage.ts`
    - `src/components/rac-editor/@canvas/hooks/useCanvasTools.ts`
- contratos envolvidos: eventos DOM `rac:canvas-object-inserted` e flags `guided-tour:rac-tip:*`.

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: ao abrir manualmente o tutorial RAC, o progresso do fluxo e os tips contextuais daquele registry
  voltam a ficar aptos a aparecer.
- fluxo real: `startTour(..., true)` chamava `resetGuidedTourProgress(tour)` sem repassar os tips; com isso, flags como
  `guided-tour:rac-tip:wall` e chaves legadas continuavam marcadas.
- ponto de divergência identificado: chamada incompleta de reset no runtime do guided-tour.

## 5. Hipóteses Causais

| Hipótese                                              | Evidências a favor                                                                           | Evidências contra                                                                          | Status     |
|-------------------------------------------------------|----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|------------|
| Reinício manual não limpava flags de tips             | teste novo reproduziu `guided-tour:rac-tip:wall` permanecendo `true` após iniciar o tutorial | tips ainda apareciam quando evento era despachado manualmente com storage limpo            | confirmada |
| Canvas não emitia eventos de tips                     | ainda não havia cobertura direta do hook `useCanvasTools`                                    | teste novo confirmou emissão para `line` e `wall`                                          | descartada |
| Overlay ou botão OK quebraram a renderização dos tips | alteração visual ocorreu antes do relato                                                     | testes do `GuidedTourHost` continuaram renderizando tips quando evento e storage permitiam | descartada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- teste `GuidedTourHost` falhou inicialmente esperando `guided-tour:rac-tip:wall` nulo após reinício manual.
- após a correção, o mesmo teste passou.
- testes novos de `useCanvasTools` validam emissão do evento real e fallback de retângulo do objeto.

### Pontos de código, contrato ou regra

- `useGuidedTourRuntime.startTour`: responsável por reiniciar o fluxo manualmente.
- `resetGuidedTourProgress`: já possuía suporte para limpar tips, mas o runtime não passava a lista.
- `useCanvasTools`: responsável por emitir eventos de inserção de objetos de tip.

## 7. Classe do Defeito ou Regressão

- classe: regressão de persistência por integração incompleta.
- por que se aplica: a função de storage suportava limpeza de tips, mas o fluxo de reinício manual não usava essa
  capacidade.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente: chamar `resetGuidedTourProgress(tour, registry.tips)` quando `startTour` é acionado com
  `force`.
- por que resolve a causa: remove os flags atuais e legados dos tips configurados, permitindo que os eventos futuros
  mostrem os balões novamente.
- riscos e impactos laterais: reiniciar manualmente o tutorial passa a reabrir tips já vistos; isso é coerente com a
  intenção de uma nova rodada guiada.

## 9. Validação Executada

- testes executados:
  -
  `npm run test -- src/components/guided-tour/ui/GuidedTourHost.smoke.test.tsx src/components/rac-editor/@canvas/hooks/useCanvasTools.smoke.test.ts`
    - `npm run test`
- build, lint ou smoke relevante:
    - `npm run lint`
    - `npm run build`
- critério de sucesso observado: todos os comandos passaram; suíte completa com 97 arquivos e 273 testes.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma para a correção aplicada.
- por que ainda importa: não se aplica.

## 11. Artefatos Relacionados

- incidente correlato: não há.
- PR, commit ou diff relacionado: mudanças locais na branch `temp`.
- sidecar de anexos: não há.
- documentos correlatos: changelog de 2026-05-02.
