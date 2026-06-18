---
title: "Bug Analysis - Hover do gauge vertical de dificuldade"
doc_role: bug-analysis
status: confirmed
created: 2026-06-17
updated: 2026-06-17
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, frontend, rac-editor ]
aliases: [ hover-gauge-dificuldade-vertical ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: hover do gauge vertical de dificuldade não exibia tooltip no canvas
- origem do relato: QA
- ambiente: local
- status analítico: confirmado
- estado da correção: aplicada e validada em teste focado
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: indicador vertical de dificuldade no lado direito do canvas RAC
- sintoma observado: o hover do medidor vertical não exibia a legenda de faixas
- impacto percebido: a UI mantinha o gauge limpo, mas não permitia descobrir as faixas pelo hover no canvas
- limitações ou incertezas iniciais: validação manual no navegador real não foi executada nesta análise

## 3. Contrato de Falha Observável

- cenário original reportado: passar o mouse sobre o gauge vertical de dificuldade no canvas
- fronteira observável do relato: overlay do canvas, não o componente `HouseDifficultyGauge` isolado
- reprodução mínima que deve falhar antes da correção: `HouseDifficultyControls` deve exigir que o `meter` vertical
  reative eventos de ponteiro dentro do grupo com `pointer-events-none`
- cenário de controle que deve continuar passando: botões de solo e obstáculos continuam interativos
- evidência necessária para considerar resolvido: teste focado confirma `pointer-events-auto` no `meter` vertical e
  smoke tests do gauge continuam verdes

## 4. Escopo Afetado

- fluxos afetados: leitura do indicador de dificuldade no canvas
- regras de negócio afetadas: `BUS-008`, que define hover/foco do gauge com faixa atual e legenda das faixas
- módulos, componentes ou serviços envolvidos:
    - `src/components/rac-editor/ui/HouseDifficultyControls.tsx`
    - `src/components/rac-editor/ui/HouseDifficultyGauge.tsx`
    - `src/components/rac-editor/@canvas/ui/CanvasOverlays.tsx`
- contratos, schemas ou interfaces envolvidos: nenhum schema ou persistência

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira       | Responsabilidade                                  | Evidência disponível                                                                    | Status    |
|---------------------------|---------------------------------------------------|-----------------------------------------------------------------------------------------|-----------|
| `HouseDifficultyGauge`    | Renderizar meter e tooltip                        | smoke test isolado já passava                                                           | observado |
| `HouseDifficultyControls` | Compor gauge, solo e obstáculos no rail do canvas | grupo usava `pointer-events-none`; botões tinham `pointer-events-auto`; gauge não tinha | observado |
| `CanvasOverlays`          | Posicionar o rail sobre o canvas                  | renderiza `HouseDifficultyControls` no lado direito                                     | observado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: o overlay ignora eventos fora dos controles, mas botões e gauge reativam eventos individualmente
- fluxo real: apenas botões reativavam eventos; o gauge permanecia dentro do grupo `pointer-events-none`
- ponto de divergência identificado: ausência de `pointer-events-auto` no `meter` vertical usado como trigger do tooltip

## 7. Hipóteses Causais

| Hipótese                                                 | Evidências a favor                                                                                | Evidências contra                                             | O que ainda falta saber            | Como validar                           | Status     |
|----------------------------------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------|------------------------------------|----------------------------------------|------------|
| `pointer-events-none` no grupo bloqueia o hover do gauge | botões explicitamente usam `pointer-events-auto`; gauge não usava; teste falhou antes da correção | componente isolado do gauge funciona quando fora do overlay   | validação visual em navegador real | teste de caracterização e hover manual | confirmada |
| Tooltip Radix não abre em elementos `role=meter`         | teste isolado do gauge abre no hover/foco                                                         | não explica a diferença entre horizontal e vertical no canvas | não aplicável após evidência       | smoke test do gauge                    | descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste antes da correção: `HouseDifficultyControls.smoke.test.tsx` falhou esperando `pointer-events-auto` no `meter`
- teste após a correção: suíte focada de gauge e controles passou com 8 testes

### Pontos de código, contrato ou regra

- `HouseDifficultyControls.tsx`: compõe o rail com `pointer-events-none`
- `HouseDifficultyGauge.tsx`: recebe `meterClassName` e aplica a classe no elemento `role='meter'`

## 9. Classe do Defeito ou Regressão

- classe: bug de camada de interação em overlay
- por que esta classificação se aplica: o componente visual funcionava isolado, mas perdia hover quando inserido no
  overlay do canvas por causa do bloqueio de eventos do container

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: passar `meterClassName='pointer-events-auto'` no gauge vertical dentro de
  `HouseDifficultyControls`
- por que resolve a causa: o elemento que atua como trigger do tooltip volta a receber eventos de ponteiro, sem tornar
  o restante do overlay capturável
- riscos e impactos laterais: baixo; mantém a estratégia existente de reativar eventos apenas em elementos interativos

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: modo mobile recolhível, botões de solo/obstáculo e foco por teclado
- cenário que poderia mascarar a correção: testar apenas `HouseDifficultyGauge` isolado, sem o container do canvas
- cenário de controle que deve continuar passando: toggles de obstáculos e menu de solo
- risco de recorrência se a correção for apenas sintomática: novos elementos interativos dentro do rail podem repetir o
  erro se não reativarem eventos

## 12. Validação Executada

- validação de camada: `HouseDifficultyControls.smoke.test.tsx` caracteriza o contrato de eventos do `meter`
- validação de integração: `HouseDifficultyGauge.smoke.test.tsx` continua cobrindo tooltip de gauge horizontal/vertical
- validação na fronteira original: parcial, por inferência direta do overlay; sem navegador real nesta rodada
- testes executados:
    - `npm run test -- src/components/rac-editor/ui/HouseDifficultyControls.smoke.test.tsx`
    -
    `npm run test -- src/components/rac-editor/ui/HouseDifficultyControls.smoke.test.tsx src/components/rac-editor/ui/HouseDifficultyGauge.smoke.test.tsx`
- validação manual ou operacional: não executada
- build, lint ou smoke relevante: smoke tests focados
- critério de sucesso observado: 8 testes focados passaram após a correção
- limitações ou validações bloqueadas: nenhuma bloqueante; validação visual em navegador real segue útil

## 13. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a causa foi reproduzida por caracterização do contrato de eventos e corrigida em teste
- o que ainda ficaria necessário para elevar o status: validação manual ou E2E no canvas em navegador real

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma
- por que ainda importa: não aplicável

## 15. Artefatos Relacionados

- incidente correlato: não aplicável
- PR, commit ou diff relacionado: diff local pós-commit `b98b3c1`
- sidecar de anexos: não aplicável
- documentos correlatos: `docs/business-rules/BUS-008-indicador-dificuldade-terreno.md`
