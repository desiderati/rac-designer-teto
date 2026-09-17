---
title: "Bug Analysis - mapeamento entre planta e vistas elevadas"
doc_role: bug-analysis
status: confirmed
created: 2026-07-09
updated: 2026-07-09
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, rac-editor, canvas, vistas-elevadas ]
aliases: [ mapeamento entre planta e vistas elevadas ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: inconsistência entre planta, porta e vistas elevadas nos tipos 3 e 6
- origem do relato: teste
- ambiente: editor RAC local
- status analítico: confirmado
- estado da correção: validada
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: renderização da planta e das vistas elevadas após carregar, reconstruir ou sincronizar casas.
- sintoma observado: porta e marcador de vista elevada podiam não aparecer na planta; em cenários dos tipos 3 e 6,
  laterais esquerda e direita eram invertidas quando a porta ou a vista frontal estavam em posições específicas.
- impacto percebido: a planta deixava de indicar a vista elevada correta e os rótulos relativos ficavam incompatíveis
  com a orientação real da casa.
- limitações ou incertezas iniciais: o relato original era intermitente e não veio com um documento mínimo anexado.

## 3. Contrato de Falha Observável

- cenário original reportado: casas dos tipos 3 e 6 com porta, vista frontal ou vista elevada deslocadas para lados
  específicos da planta.
- fronteira observável do relato: planta do editor, marcador de porta, marcador de referência de vista e rótulos das
  vistas elevadas.
- reprodução mínima que deve falhar antes da correção: carregar estado com `views[*].side` correto e `sideMappings`
  vazio ou defasado; a planta não encontra a porta ou calcula laterais sobre uma orientação obsoleta.
- cenário de controle que deve continuar passando: estados já consistentes continuam preservando o mesmo pareamento
  entre `top`, `bottom`, `left`, `right` e as vistas lógicas.
- evidência necessária para considerar resolvido: o agregado reconstrói `sideMappings` a partir das instâncias de vista
  e os marcadores/rótulos usam a orientação reconstruída.

## 4. Escopo Afetado

- fluxos afetados: carregamento de documento, sincronização de estado da casa, renderização da planta e rótulos de
  vistas elevadas.
- regras de negócio afetadas: `BUS-003-vistas-por-tipo`.
- módulos, componentes ou serviços envolvidos: `HouseAggregate`, `EditorHouseController`, marcadores de porta e
  referência de vista, helper de rótulos de vista.
- contratos, schemas ou interfaces envolvidos: `HouseState`, `HouseSideMappings`, `HouseViewInstance`.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade | Evidência disponível | Status |
|---------------------|------------------|----------------------|--------|
| Domínio da casa | Normalizar estado carregado | `HouseAggregate.fromState` | observado |
| Use case de vistas | Reconstruir índice por lado | `rebuildSideMappingsFromViews` | observado |
| Controller do editor | Atualizar marcadores a partir do estado normalizado | smoke test de documento carregado | observado |
| Canvas | Renderizar porta e referência de vista | testes de marcador de porta e referência | observado |
| Helper de rótulo | Calcular lateral relativa por tipo e orientação primária | smoke tests de tipos 3 e 6 | observado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: `views[*].side` define a posição canônica de cada vista; `sideMappings` é apenas um índice derivado
  para consulta rápida por lado da planta.
- fluxo real: o agregado aceitava `sideMappings` carregado como fonte já consistente, permitindo divergência entre
  vistas, planta e rótulos.
- ponto de divergência identificado: entrada do estado no agregado, antes da renderização e da sincronização de
  marcadores.

## 7. Hipóteses Causais

| Hipótese | Evidências a favor | Evidências contra | O que ainda falta saber | Como validar | Status |
|----------|--------------------|-------------------|-------------------------|--------------|--------|
| `sideMappings` defasado era tratado como canônico | porta e referência dependiam desse índice; rebuild já existia no domínio | helpers de orientação funcionavam quando recebiam mapeamento coerente | validação manual no editor com o caso original exato | smoke tests de agregado, controller e canvas | confirmada |
| Erro isolado do desenho da porta | ausência sumia ao reconstruir o índice | o problema também afetava rótulos de laterais | nada relevante | testes de marcador | descartada |
| Tabela de orientação relativa estava totalmente invertida | havia sintomas de inversão em cenários específicos | cenários já cobertos passavam; falha dependia do estado de entrada | validação manual adicional | ampliação dos cenários de tipo 3 e 6 | descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste, log, print, diff ou relato: testes focados de agregado, controller, marcadores e rótulos.
- interpretação permitida: a causa comum era uma divergência estrutural entre fonte canônica e índice derivado.

### Pontos de código, contrato ou regra

- `src/domain/house/house.aggregate.ts`: normaliza `sideMappings` ao reconstruir o agregado.
- `src/domain/house/use-cases/house-views.use-case.ts`: fornece a reconstrução determinística por `views[*].side`.
- `src/components/rac-editor/@canvas/lib/house-top-view-door-marker.ts`: consome o índice reconstruído.
- `src/components/rac-editor/lib/house-view.ts`: calcula rótulos relativos sobre orientação coerente.

## 9. Classe do Defeito ou Regressão

- classe: estado derivado persistido ou carregado como fonte canônica.
- por que esta classificação se aplica: a renderização falhava quando dois campos que deveriam representar o mesmo
  pareamento entravam em conflito.

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: reconstruir `sideMappings` em `HouseAggregate.fromState` usando `views[*].side`.
- por que resolve a causa: toda entrada de estado passa a alinhar o índice por lado com as instâncias reais de vista
  antes de controller e canvas consultarem esse índice.
- riscos e impactos laterais: baixo risco; documentos com `views[*].side` incorreto continuarão refletindo esse erro
  porque esse campo agora é tratado explicitamente como fonte canônica.

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: tipo 6 com frontal em `top` e `bottom`; tipo 3 com porta em `left` e `right`.
- cenário que poderia mascarar a correção: estado novo já consistente entre `views` e `sideMappings`.
- cenário de controle que deve continuar passando: marcadores e rótulos existentes para posições já cobertas.
- risco de recorrência se a correção for apenas sintomática: alto, caso cada marcador tente corrigir localmente o
  mapeamento em vez de normalizar o agregado.

## 12. Validação Executada

- validação de camada: smoke tests de domínio e helper de rótulos.
- validação de integração: smoke test de `EditorHouseController` carregando documento com `sideMappings` vazio.
- validação na fronteira original: não executada manualmente no navegador.
- testes executados: suites focadas de agregado, controller, marcadores, orientação e layout de vistas.
- validação manual ou operacional: não executada.
- build, lint ou smoke relevante: `npm run lint` e `npm run build`.
- critério de sucesso observado: todos os testes focados passaram após isolar a suite de controller; lint e build
  concluíram sem erro.
- limitações ou validações bloqueadas: primeira rodada combinada teve timeout em teste antigo de controller por tempo
  de suite; o mesmo arquivo passou isolado.

## 13. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a causa foi confirmada e coberta por testes automatizados na fronteira de domínio,
  controller e canvas, mas o caso original não foi reexecutado manualmente no editor.
- o que ainda ficaria necessário para elevar o status, se parcial ou bloqueado: validação manual no editor com os
  cenários dos tipos 3 e 6 reportados nos testes da versão 5.0.

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma dúvida nova identificada na regra de orientação.
- por que ainda importa: não aplicável.

## 15. Artefatos Relacionados

- incidente correlato: não informado
- PR, commit ou diff relacionado: diff local da sessão de 2026-07-09
- sidecar de anexos: não informado
- documentos correlatos: `docs/business-rules/BUS-003-vistas-por-tipo.md`
