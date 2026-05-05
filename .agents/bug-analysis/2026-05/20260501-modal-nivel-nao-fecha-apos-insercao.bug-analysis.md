---
title: "Bug Analysis - Modal de nível não fecha após inserir casa"
doc_role: bug-analysis
status: confirmed
created: 2026-05-01
updated: 2026-05-01
supersedes:
superseded_by:
tags: [ bug-analysis, bug, rac-editor, canvas, modal ]
aliases: [ modal de nível não fecha após inserir casa ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: modal de definição de nível permanecia aberta após inserir a casa no Canvas
- origem do relato: usuário
- ambiente: editor RAC local em React/Vite
- status analítico: confirmado
- estado da correção: aplicada e validada

## 2. Contexto e Sintoma Observado

- contexto funcional: fluxo inicial de criação de casa, seleção de tipo/lado e confirmação dos níveis dos pilotis.
- sintoma observado: após clicar em `Inserir`, a casa era criada no Canvas, mas a modal continuava aberta.
- impacto percebido: o usuário precisava lidar com uma modal obsoleta mesmo após a ação principal ter sido concluída.
- limitações ou incertezas iniciais: o relato veio por imagem e descrição; não havia stack trace fornecido.

## 3. Escopo Afetado

- fluxos afetados: inserção inicial de casa no Canvas.
- regras de negócio afetadas: `BUS-001-canvas` e `BUS-004-piloti-nivel`.
- módulos, componentes ou serviços envolvidos:
    - `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`
    - `src/components/rac-editor/@modals/ui/editors/NivelDefinitionEditor.tsx`
- contratos, schemas ou interfaces envolvidos: nenhum contrato público alterado.

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: confirmar níveis, aplicar dados dos pilotis, inserir planta/vista inicial, reposicionar grupos e
  fechar a modal.
- fluxo real: confirmar níveis aplicava os dados e inseria a casa, mas o handler quebrava antes de limpar o estado
  modal.
- ponto de divergência identificado: `handleNiveisApplied` referenciava `TIMINGS.stackedViewRepositionDelayMs` sem
  importar `TIMINGS`.

## 5. Hipóteses Causais

| Hipótese                                                       | Evidências a favor                                                                                               | Evidências contra                                                                                        | Status     |
|----------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|------------|
| Referência indefinida interrompe o handler antes do fechamento | `TIMINGS` era usado no `setTimeout` antes de `setNivelDefinitionOpen(false)`; a inserção acontecia antes do erro | nenhuma evidência contrária após inspeção                                                                | confirmada |
| O `Dialog` ignorava mudança de `isOpen` controlado             | sintoma visível era modal aberta                                                                                 | `ConfirmDialogModal` é controlado e outros fluxos usam o mesmo padrão                                    | descartada |
| `NivelDefinitionEditor` bloqueava fechamento via `appliedRef`  | há lógica específica para suprimir cancelamento pós-apply                                                        | o fechamento efetivo depende do pai limpar `nivelDefinitionOpen`; o bloqueio apenas evita reset indevido | descartada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- relato do usuário: modal permanecia aberta após inserção da casa.
- inspeção do código: `handleNiveisApplied` limpava a modal somente após executar o trecho que usava `TIMINGS`.
- validação: E2E mínimo de criação de casa passou após importar `TIMINGS`.

### Pontos de código, contrato ou regra

- arquivo: `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`
- responsabilidade no defeito: coordenar aplicação dos níveis, criação da planta/vista inicial e fechamento da modal.

## 7. Classe do Defeito ou Regressão

- classe: erro de referência em fluxo assíncrono de UI.
- por que esta classificação se aplica: uma dependência de configuração usada no handler não estava importada,
  interrompendo a sequência antes da limpeza do estado visual.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente: importar `TIMINGS` de `@/shared/config.ts` no arquivo que já usava o valor.
- por que resolve a causa: elimina a referência indefinida e permite que o handler alcance
  `setNivelDefinitionOpen(false)`.
- riscos e impactos laterais: baixo; não altera regra de negócio, assinatura de hook ou comportamento de layout.

## 9. Validação Executada

- testes executados:
    - `npx eslint src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`
    - `npx playwright test e2e/house-views-limits.spec.ts --project=chromium -g "M4: mantém planta" --timeout=60000`
    - `npm run build`
- validação manual: não executada.
- build, lint ou smoke relevante: lint focado, E2E focado e build passaram.
- critério de sucesso observado: o fluxo de criação da casa passou pelo botão `Inserir`, fechou a modal e confirmou
  planta/vista inicial no snapshot.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma.
- por que ainda importa: não aplicável.

## 11. Artefatos Relacionados

- incidente correlato: não há.
- PR, commit ou diff relacionado: alteração local ainda não commitada.
- sidecar de anexos: não há.
- documentos correlatos:
    - `docs/business-rules/BUS-001-canvas.md`
    - `docs/business-rules/BUS-004-piloti-nivel.md`
