---
title: "Bug Analysis - Terreno no modo manual de nível do piloti"
doc_role: bug-analysis
status: confirmed
created: 2026-06-17
updated: 2026-06-17
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, terrain, pilotis ]
aliases: [ terreno manual de nível do piloti ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: terreno visual deslocava pontos não editados no modo manual de nível do piloti
- origem do relato: usuário
- ambiente: local
- status analítico: confirmado
- estado da correção: validada
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: edição de nível de piloti com `autoAdjustPilotiHeightsFromNivel` desativado.
- sintoma observado: ao alterar um nível em modo manual, a representação visual do terreno podia inclinar a vista e
  deslocar pontos associados a outros pilotis.
- impacto percebido: a visualização 2D comunicava alteração de terreno em pontos que, pela regra manual, deveriam
  permanecer intactos.
- limitações ou incertezas iniciais: não houve validação manual no navegador durante a correção.

## 3. Contrato de Falha Observável

- cenário original reportado: no modo manual, alterar o nível de um piloti não pode alterar a representação do terreno
  nos demais pontos.
- fronteira observável do relato: geometria do terreno nas vistas elevadas do canvas.
- reprodução mínima que deve falhar antes da correção: mudar o nível de um piloti extremo em uma vista lateral com
  três pilotis e observar deslocamento do Y do terreno no piloti intermediário.
- cenário de controle que deve continuar passando: modo automático continua recalculando níveis e alturas quando
  aplicável; escadas automáticas continuam lendo o terreno calculado.
- evidência necessária para considerar resolvido: teste de geometria deve provar que o ponto de terreno do piloti não
  editado permanece no mesmo Y após alterar outro piloti.

## 4. Escopo Afetado

- fluxos afetados: edição de nível de piloti e redesenho de terreno em elevações.
- regras de negócio afetadas: `BUS-004` modo manual de nível do piloti.
- módulos, componentes ou serviços envolvidos:
    - `src/components/rac-editor/@canvas/lib/terrain.ts`
    - `src/components/rac-editor/@canvas/lib/piloti-visual.ts`
    - `src/components/rac-editor/lib/editor-house-controller.smoke.test.ts`
- contratos, schemas ou interfaces envolvidos: nenhum contrato externo.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira     | Responsabilidade                                    | Evidência disponível                           | Status         |
|-------------------------|-----------------------------------------------------|------------------------------------------------|----------------|
| Modal/comando de piloti | Enviar novo nível para o piloti selecionado         | testes existentes do controller                | observado      |
| Domínio da casa         | Preservar demais pilotis em modo manual             | teste `altera somente o piloti selecionado...` | observado      |
| Runtime visual 2D       | Redesenhar terreno a partir dos níveis renderizados | `updateGroundInGroup` usava apenas extremos    | observado      |
| Browser/canvas real     | Percepção visual final no editor                    | não exercitado manualmente                     | não verificado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: no modo manual, apenas o piloti editado muda de nível; a linha do terreno deve manter os pontos dos
  demais pilotis visíveis nas mesmas coordenadas.
- fluxo real: o estado dos demais pilotis permanecia correto, mas o terreno era recalculado por uma linha entre os dois
  extremos da vista, deslocando visualmente pontos intermediários.
- ponto de divergência identificado: `updateGroundInGroup` derivava a polyline do terreno somente dos dois pilotis de
  canto resolvidos por `resolveHouseElevationCornerPilotiIds`.

## 7. Hipóteses Causais

| Hipótese                                                | Evidências a favor                                 | Evidências contra                                        | O que ainda falta saber     | Como validar                            | Status     |
|---------------------------------------------------------|----------------------------------------------------|----------------------------------------------------------|-----------------------------|-----------------------------------------|------------|
| O domínio ainda altera demais pilotis em modo manual    | sintoma visual parecia propagação global           | teste existente confirma piloti intermediário intacto    | nada                        | `editor-house-controller.smoke.test.ts` | descartada |
| O terreno é redesenhado usando apenas extremos da vista | `updateGroundInGroup` lia `leftRect` e `rightRect` | não havia teste específico de geometria                  | validação visual manual     | teste novo de terreno                   | confirmada |
| Escadas automáticas alteram a linha do terreno          | escadas usam interpolação de terreno               | sintoma ocorre no redesenho de terreno, antes de escadas | validação visual de escadas | smoke de escadas                        | descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- `BUS-004` define que no modo manual apenas o piloti selecionado é modificado.
- `updateGroundInGroup` calculava `leftNivelY` e `rightNivelY` a partir dos dois extremos da elevação.
- teste novo prova que mudar o extremo esquerdo mantém o Y do terreno no piloti intermediário.

### Pontos de código, contrato ou regra

- `terrain.ts`: origem da polyline e do preenchimento do terreno.
- `piloti-visual.ts`: chama `updateGroundInGroup` quando altura ou nível muda.
- `BUS-004`: regra funcional do modo manual.

## 9. Classe do Defeito ou Regressão

- classe: divergência entre estado correto e projeção visual derivada.
- por que esta classificação se aplica: o estado lógico dos pilotis já preservava os demais pontos, mas o desenho do
  terreno fazia uma interpolação visual implícita entre extremos.

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: gerar a polyline do terreno com todos os pilotis visíveis como âncoras, não apenas com os
  extremos.
- por que resolve a causa: cada piloti visível passa a fixar seu próprio ponto de terreno; alterar um nível muda só a
  âncora correspondente, enquanto os demais pontos permanecem ancorados nos seus níveis atuais.
- riscos e impactos laterais: baixo; o terreno continua contínuo entre pontos e o modo automático preserva seu
  comportamento porque os níveis dos demais pilotis continuam sendo recalculados no domínio quando aplicável.

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: vistas laterais com três pilotis; vistas frontais/traseiras com quatro pilotis; alteração de
  nível em extremo; alteração de nível intermediário.
- cenário que poderia mascarar a correção: todos os níveis iguais, pois a linha não deslocaria visualmente.
- cenário de controle que deve continuar passando: escadas automáticas e regras de altura/nível dos pilotis.
- risco de recorrência se a correção for apenas sintomática: alto se o terreno continuar dependente apenas dos cantos.

## 12. Validação Executada

- validação de camada: `terrain.smoke.test.ts` para geração e amostragem da linha do terreno.
- validação de integração: `editor-house-controller.smoke.test.ts` para preservar regra manual no estado da casa.
- validação na fronteira original: parcial; não houve teste visual no navegador.
- testes executados:
    -
    `npx vitest run src/components/rac-editor/@canvas/lib/terrain.smoke.test.ts src/components/rac-editor/@canvas/lib/piloti.smoke.test.ts src/components/rac-editor/@canvas/lib/piloti-visual.smoke.test.ts src/components/rac-editor/@canvas/lib/house-auto-stairs.smoke.test.ts src/components/rac-editor/lib/editor-house-controller.smoke.test.ts`
    - `npx tsc --noEmit --pretty false`
    - `npm run lint`
    -
    `git diff --check -- src/components/rac-editor/@canvas/lib/terrain.ts src/components/rac-editor/@canvas/lib/terrain.smoke.test.ts docs/business-rules/BUS-004-piloti-nivel.md`
- validação manual ou operacional: não executada.
- build, lint ou smoke relevante: lint, typecheck e 36 testes focados passaram.
- critério de sucesso observado: ponto do piloti intermediário manteve o mesmo Y após alterar o nível do extremo.
- limitações ou validações bloqueadas: validação visual no browser não foi executada.

## 13. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a causa raiz foi reproduzida e coberta em teste de geometria do canvas; a fronteira
  visual original ainda não foi exercitada manualmente no navegador.
- o que ainda ficaria necessário para elevar o status: abrir o editor, ativar modo manual, alterar um nível e verificar
  visualmente que só o ponto daquele piloti se move.

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma pendente para a correção aplicada.
- por que ainda importa: não aplicável.

## 15. Artefatos Relacionados

- incidente correlato: não aplicável.
- PR, commit ou diff relacionado: diff local.
- sidecar de anexos: não aplicável.
- documentos correlatos: `docs/business-rules/BUS-004-piloti-nivel.md`.
