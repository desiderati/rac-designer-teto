---
title: "Bug Analysis — auto-contraventamento não recalcula por altura do piloti"
doc_role: bug-analysis
status: confirmed
created: 2026-05-13
updated: 2026-05-13
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, contraventamento ]
aliases: [ auto-contraventamento por altura do piloti ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: auto-contraventamento não era recalculado na inserção inicial real da casa nem
  quando apenas a altura do piloti mudava.
- origem do relato: QA
- ambiente: RAC Editor local
- status analítico: confirmado
- estado da correção: validada

## 2. Contexto e Sintoma Observado

- contexto funcional: criação de casa no canvas e edição de pilotis.
- sintoma observado: o contraventamento automático parecia responder a alterações de nível dos pilotis de ponta, mas não
  a alterações de altura; na inserção inicial, o recalculo podia ocorrer antes da planta existir no runtime visual.
- impacto percebido: contraventamento ausente em casas que já exigiam travamento estrutural pela regra de proporção.
- limitações ou incertezas iniciais: a percepção de "só chamar nos pilotis das pontas" precisava ser separada entre
  gatilho lógico e efeito visual no canvas.

## 3. Escopo Afetado

- fluxos afetados: inserção inicial da casa, edição de piloti, auto-contraventamento.
- regras de negócio afetadas: elegibilidade estrutural por proporção `height < nivel * 3`.
- módulos, componentes ou serviços envolvidos:
    - `src/domain/house/use-cases/house-piloti.use-case.ts`
    - `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`
    - `src/components/rac-editor/lib/editor-house-controller.ts`
    - `src/components/rac-editor/@canvas/lib/house-auto-contraventamento.ts`
- contratos, schemas ou interfaces envolvidos:
    - `HouseWritePort`
    - `EditorHouseWriteSource`

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: qualquer alteração que possa mudar a proporção estrutural do piloti deve recalcular o
  auto-contraventamento quando há planta; na inserção inicial, o recalculo deve ocorrer depois que a planta foi inserida
  no canvas.
- fluxo real:
    - `resolvePilotiUpdateEffects` só considerava mudança de `nivel`.
    - `registerView('top')` chamava o efeito antes de `addObjectToCanvas`, quando o grupo visual ainda não existia para
      `canvas.getObjects()`.
- ponto de divergência identificado: gatilho lógico incompleto e momento incorreto do refresh na criação da planta.

## 5. Hipóteses Causais

| Hipótese                                                             | Evidências a favor                                                                                                                                          | Evidências contra                                                                                     | Status     |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|------------|
| Mudança de altura não dispara auto-contraventamento                  | teste novo em `house-piloti.use-case.smoke.test.ts` falhou com `shouldRefreshAutoContraventamento === false`; regra de elegibilidade usa `height` e `nivel` | nenhuma após reprodução                                                                               | confirmada |
| Inserção inicial dispara refresh antes de a planta existir no canvas | `useCanvasHouseViewActions` registrava a vista antes de `addObjectToCanvas`; runtime visual consulta grupos via canvas                                      | teste de controller isolado mascarava o problema porque o grupo já estava no canvas antes do registro | confirmada |
| Rotina visual de auto-contraventamento não cria vigas                | smoke tests de `house-auto-contraventamento.ts` já cobriam criação e remoção quando a rotina é chamada                                                      | falhas apareceram antes de chegar à rotina visual                                                     | descartada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- teste vermelho inicial:
    - `rtk npm run test -- src/domain/house/use-cases/house-piloti.use-case.smoke.test.ts`
    - `rtk npm run test -- src/components/rac-editor/lib/editor-house-controller.smoke.test.ts`
- validação em navegador: após inserir uma casa e reduzir apenas `piloti_1_1.height` para `1.0`, a planta passou a
  conter `1` objeto `isAutoContraventamento`.

### Pontos de código, contrato ou regra

- `house-piloti.use-case.ts`: decisão de efeitos de atualização de piloti.
- `useCanvasHouseViewActions.ts`: ordem real entre registro lógico, inserção no canvas e persistência do desenho.
- `HouseWritePort`: comando explícito para recalcular contraventamento no estado visual atual.

## 7. Classe do Defeito ou Regressão

- classe: gatilho derivado incompleto e efeito visual disparado cedo demais.
- por que esta classificação se aplica: a regra de domínio estava correta quando chamada, mas os pontos de orquestração
  não cobriam todos os eventos estruturais relevantes.

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente:
    - considerar mudança de `height` em `resolvePilotiUpdateEffects`;
    - expor `refreshAutoContraventamentoForCurrentHouse`;
    - chamar o refresh após `addObjectToCanvas` quando a vista registrada é a planta.
- por que resolve a causa: o cálculo passa a ser acionado quando a proporção pode mudar e no momento em que o grupo
  visual já é observável pelo runtime.
- riscos e impactos laterais: refresh adicional pode ser no-op em alterações proporcionais, mas preserva consistência
  visual e tem baixo custo na superfície atual.

## 9. Validação Executada

- testes executados:
    -
    `rtk npm run test -- src/domain/house/use-cases/house-piloti.use-case.smoke.test.ts src/components/rac-editor/lib/editor-house-controller.smoke.test.ts src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts src/components/rac-editor/@canvas/lib/house-auto-contraventamento.smoke.test.ts`
    - `rtk npm run test -- --testTimeout 20000`
- validação manual:
    - navegador local em `http://127.0.0.1:5200/`; `debug.updatePiloti('piloti_1_1', {height: 1.0})` produziu
      `autoContraventamentos: 1`.
- build, lint ou smoke relevante:
    - `rtk git diff --check`
    - `rtk npm run lint`
    - `rtk npm run test:architecture`
    - `rtk npm run build`
- critério de sucesso observado: testes focados, suíte completa, lint, build e verificação manual passaram.

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida: se a rotina deve reposicionar automaticamente contraventamento já existente quando a linha extrema ideal muda,
  mesmo sem criar/remover objeto.
- por que ainda importa: esse é um refinamento geométrico além do bug confirmado de ausência de chamada.

## 11. Artefatos Relacionados

- incidente correlato: não aplicável.
- PR, commit ou diff relacionado: trabalho local em `codex/construction-site-management`.
- sidecar de anexos: não aplicável.
- documentos correlatos:
    - `.agents/bug-analysis/2026-05/20260512-troca-casa-canvas-nao-restaura-documento.bug-analysis.md`

## 12. Reabertura e Correção Complementar

- reabertura: o relato posterior mostrou que a correção anterior cobria o caminho direto de controller, mas ainda
  deixava uma lacuna no fluxo visual completo.
- causa complementar confirmada: `refreshAutoContraventamentoInAllViews` só sincronizava as vistas elevadas quando a
  planta mudava na mesma chamada. Se a planta já possuía contraventamento automático e a elevação era adicionada depois,
  a projeção era ignorada.
- ajuste aplicado:
    - `syncContraventamentoElevationViews` passou a retornar se alterou projeções;
    - `refreshAutoContraventamentoInAllViews` passou a sincronizar elevações mesmo quando a planta já estava estável;
    - `addViewToCanvas` passou a chamar o refresh após inserir qualquer vista da casa, não apenas a planta.
- teste vermelho acrescentado: vista elevada adicionada depois de uma planta já contraventada não recebia projeções;
  antes da correção o segundo refresh retornava `false`.
- validação complementar:
    - `rtk npm run test -- house-auto-contraventamento.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- useCanvasHouseViewActions.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- contraventamento.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- house-piloti.use-case.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- editor-house-controller.smoke.test.ts --testTimeout 20000`
    - `rtk npm run test -- --testTimeout 20000`: 104 arquivos, 332 testes.
    - `rtk npm run lint`
    - `rtk npm run test:architecture`
    - `rtk npm run build`
- validação manual em navegador:
    - alterar altura pelo editor real de piloti de `2,0` para `1,0` criou `1` auto-contraventamento na planta;
    - inserir depois o `Quadrado Fechado` esquerdo criou `2` projeções de contraventamento na elevação lateral.
- observação sobre E2E: `rtk npm run test:e2e -- piloti.spec.ts` falhou antes do caso de piloti porque o helper da suíte
  ainda espera abrir diretamente no canvas, enquanto o app atual inicia no gerenciamento de Construções TETO sem
  construção cadastrada.
