---
title: "Bug Analysis - inserção inicial de níveis no modo manual"
doc_role: bug-analysis
status: confirmed
created: 2026-06-17
updated: 2026-06-17
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, piloti, nivel ]
aliases: [ inserção inicial de níveis no modo manual ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: níveis iniciais da casa eram limitados como edição manual de piloti
- origem do relato: QA
- ambiente: editor RAC local
- status analítico: confirmado
- estado da correção: aplicada
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: fluxo de criação da casa, após setup de pilotis e definição dos níveis dos quatro cantos.
- sintoma observado: com a preferência global de altura manual ativa, a casa era inserida com níveis `0,50` nos cantos
  mesmo quando o wizard havia mostrado níveis maiores e alturas recomendadas corretas.
- impacto percebido: terreno e pilotis nasciam com dados diferentes do que foi confirmado no wizard.
- limitações ou incertezas iniciais: a validação automatizada cobre a fronteira de hook/controller; não foi executada
  reprodução manual em navegador nesta análise.

## 3. Contrato de Falha Observável

- cenário original reportado: selecionar níveis iniciais como `0,45`, `0,95`, `1,11` e `1,45` enquanto o editor está no
  modo manual e inserir a casa.
- fronteira observável do relato: vista planta inserida no canvas após confirmação do wizard.
- reprodução mínima que deve falhar antes da correção: confirmar níveis iniciais com `autoAdjustPilotiHeightsFromNivel`
  falso e observar que níveis acima de `0,50` são reduzidos pela altura padrão `1,0 m`.
- cenário de controle que deve continuar passando: edição manual posterior de um piloti continua alterando apenas o
  piloti selecionado e respeitando `nível <= altura atual / 2`.
- evidência necessária para considerar resolvido: comando de inserção inicial aplica níveis e alturas recomendadas
  independentemente da preferência manual, enquanto edição manual normal mantém o comportamento anterior.

## 4. Escopo Afetado

- fluxos afetados: criação inicial da casa, definição de níveis, inserção da planta e primeira vista elevada.
- regras de negócio afetadas: `BUS-004-piloti-nivel`.
- módulos, componentes ou serviços envolvidos: `useCanvasHouseViewActions`, `HouseWritePort`,
  `EditorHouseController`, `EditorHousePilotiCommandService`.
- contratos, schemas ou interfaces envolvidos: `HousePilotiWritePort`.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira      | Responsabilidade                                  | Evidência disponível                                           | Status    |
|--------------------------|---------------------------------------------------|----------------------------------------------------------------|-----------|
| Wizard de níveis         | Coletar níveis dos cantos e mestre                | prints do relato e `NivelDefinitionEditor`                     | observado |
| Hook de inserção         | Aplicar níveis antes de criar vistas              | `useCanvasHouseViewActions` chamava `updatePiloti` + recálculo | observado |
| Porta de escrita da casa | Separar comandos de edição e criação              | novo contrato `applyInitialPilotiNiveis`                       | observado |
| Domínio de pilotis       | Interpolar níveis e calcular alturas recomendadas | `recalculateRecommendedPilotiData`                             | observado |
| Canvas                   | Renderizar dados já materializados                | coberto indiretamente pelo hook                                | inferido  |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: na inserção inicial, confirmar níveis deve interpolar os 12 pilotis e calcular alturas recomendadas
  como no modo automático, sem depender da preferência global.
- fluxo real: o hook chamava a edição normal de piloti; em modo manual, essa edição limitava o nível pela altura atual
  padrão de `1,0 m`, reduzindo valores acima de `0,50`.
- ponto de divergência identificado: o fluxo de criação inicial reutilizava o comando de edição manual posterior.

## 7. Hipóteses Causais

| Hipótese                                 | Evidências a favor                                                     | Evidências contra                  | O que ainda falta saber       | Como validar                        | Status     |
|------------------------------------------|------------------------------------------------------------------------|------------------------------------|-------------------------------|-------------------------------------|------------|
| Inserção inicial reutiliza edição manual | testes RED reproduziram ausência de comando dedicado e níveis cortados | modo automático continuava correto | validação manual em navegador | smoke tests de hook/controller      | confirmada |
| Wizard calcula níveis errados            | prints mostram recomendações corretas antes da inserção                | valores mudam só após inserir      | nenhum ponto relevante        | inspeção de `NivelDefinitionEditor` | descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste RED em `editor-house-controller.smoke.test.ts`: `applyInitialPilotiNiveis` inexistia.
- teste RED em `useCanvasHouseViewActions.smoke.test.ts`: o hook não chamava comando dedicado de inserção inicial.
- interpretação permitida: a falha estava na transição do wizard para o estado lógico da casa.

### Pontos de código, contrato ou regra

- `src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.ts`: aplicava níveis iniciais por edição normal.
- `src/components/rac-editor/lib/editor-house-piloti-command-service.ts`: passou a ter comando de inserção inicial.
- `docs/business-rules/BUS-004-piloti-nivel.md`: passou a explicitar a exceção da criação inicial.

## 9. Classe do Defeito ou Regressão

- classe: vazamento de preferência global de edição para fluxo de criação inicial.
- por que esta classificação se aplica: uma regra de edição posterior foi reutilizada em uma etapa de materialização
  inicial, onde a casa ainda precisa nascer coerente com recomendações automáticas.

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: criar comando `applyInitialPilotiNiveis` na porta de escrita da casa e usá-lo apenas no fluxo
  de inserção inicial.
- por que resolve a causa: o comando aplica os níveis dos cantos e força recomputação automática de níveis interpolados
  e alturas recomendadas, sem alterar a regra manual de edição normal.
- riscos e impactos laterais: ampliação do contrato de `HousePilotiWritePort`; mocks e adapters precisam implementar o
  novo método.

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: níveis acima de `0,50`, alturas disponíveis limitadas e valores inválidos no payload inicial.
- cenário que poderia mascarar a correção: testar apenas modo automático, onde o bug não aparecia.
- cenário de controle que deve continuar passando: `altera somente o piloti selecionado quando o ajuste automático está
  desativado`.
- risco de recorrência se a correção for apenas sintomática: voltar a chamar `updatePiloti` no wizard reintroduz o
  clamp pela altura atual.

## 12. Validação Executada

- validação de camada: smoke test do controller para modo manual com inserção inicial.
- validação de integração: smoke test do hook garantindo comando dedicado antes da criação das vistas.
- validação na fronteira original: não executada em navegador nesta análise.
- testes executados:
    - `npm run test -- src/components/rac-editor/lib/editor-house-controller.smoke.test.ts`
    - `npm run test -- src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts`
    -
    `npm run test -- src/components/rac-editor/lib/editor-house-controller.smoke.test.ts src/components/rac-editor/@canvas/hooks/useCanvasHouseViewActions.smoke.test.ts src/bootstrap/editor-house-ports.smoke.test.ts src/components/rac-editor/@modals/ui/editors/piloti/PilotiEditor.smoke.test.tsx`
    - `npm run test`
- validação manual ou operacional: não executada.
- build, lint ou smoke relevante:
    - `npm run lint`
    - `npm run build`
    - `git diff --check`
- critério de sucesso observado: níveis `0,95`, `1,11`, `1,45` permanecem e alturas recomendadas são calculadas mesmo
  com preferência manual.
- limitações ou validações bloqueadas: a suíte completa emitiu aviso de múltiplas instâncias de Three.js, sem falhar.

## 13. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a reprodução automatizada falhou antes da correção e passou depois.
- o que ainda ficaria necessário para elevar o status: validar manualmente o fluxo completo no browser/canvas.

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma aberta.
- por que ainda importa: não aplicável.

## 15. Artefatos Relacionados

- incidente correlato: não aplicável
- PR, commit ou diff relacionado: diff local ainda não commitado
- sidecar de anexos: não aplicável
- documentos correlatos: `docs/business-rules/BUS-004-piloti-nivel.md`
