---
title: "Bug Analysis — contraventamento deslocado em planta existente"
doc_role: bug-analysis
status: partial
created: 2026-10-19
updated: 2026-10-19
supersedes:
superseded_by:
tags: [bug-analysis, bug, regression, canvas, contraventamento]
aliases: [contraventamento em vista superior existente]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- Relato: “Problema na colocação do contraventamento quando já existe vista superior no canvas!”
- Origem: usuário, por captura do Canvas, com invocação de `support-analyst`.
- Ambiente original: versão, URL, sequência exata e documento não informados.
- Alvo desta investigação: `local-only`; diagnóstico de código e geometria, sem mutação remota.
- Status analítico: causa sustentada por reprodução direta na camada Fabric; ligação com a ação original ainda parcial.
- Correção: implementada separadamente pelo agente principal durante a análise, com validação local.
- Evidência global: `partial`. Não equivale a `validated-at-original-boundary`.

## 2. Contexto e Sintoma Observado

A captura mostra a planta selecionada, referências “Frontal” e “Lateral Direita”, porta no topo e duas vigas
verticais na coluna A1/B1/C1. Uma viga atravessa os centros dos pilotis; a outra está deslocada à esquerda.
As duas começam e terminam acima dos pontos esperados. A imagem sustenta o defeito geométrico, mas não informa
se cada viga foi inserida manualmente, gerada automaticamente ou restaurada de um desenho salvo.

Não há evidência de indisponibilidade operacional. `incident-analysis` foi consultada e encaminha defeitos
sem foco em impacto operacional ao roteiro de bug; não foi aberto incidente nem postmortem.

## 3. Contrato de Falha Observável

- Cenário: inserir contraventamento em uma planta que já contém anotações de vistas elevadas.
- Fronteira original: posição visível das vigas em relação aos pilotis no Canvas.
- Reprodução mínima de camada: criar planta real, acrescentar referências de elevação frontal/topo e
  lateral/esquerda, inserir vigas esquerda e direita de A1 a C1 e comparar com o centro local dos círculos.
- Controle: inserir vigas em planta sem marcadores; inserir as vigas antes de acrescentar marcadores.
- Resolução na fronteira original: repetir a ação pela interface com a planta anotada, comprovar tangência
  de cada lado e extremos corretos e verificar persistência/reabertura se a promessa abranger o documento salvo.

## 4. Escopo Afetado

- Inserção vertical manual e automática: ambas convergem em `addContraventamentoBeam`.
- Inserção horizontal manual: usa a mesma premissa incorreta em `addHorizontalContraventamentoBeam`.
- Regra `BUS-006`: lados e destinos devem corresponder aos pilotis; vistas relacionadas são sincronizadas.
- Não foi demonstrado defeito na elegibilidade, na ocupação dos lados ou na projeção de elevações.
- Código/testes da aplicação pertencem à implementação conduzida pelo agente principal; este diagnóstico
  escreveu apenas o relatório e o sidecar de evidências.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade | Evidência | Status |
|---|---|---|---|
| Interface/piloti | Selecionar lado e destino | Relato e imagem; caminho original desconhecido | observado parcialmente |
| Orquestração manual | `useCanvasContraventamentoCommands` busca planta, insere e sincroniza | Fonte local | observado |
| Orquestração automática | `refreshAutoContraventamentoOnTopView` chama a mesma criação vertical | Fonte local | observado |
| Domínio | Elegibilidade, coluna/linha, lados ocupados | Contrato BUS-006 e call sites | observado; sem falha demonstrada |
| Geometria/Fabric | Criar Rect e coordenadas locais, relayout de Group | Experimento direto antes/depois | observado |
| Persistência/autosave | Salvar/restaurar geometria e metadados | Fora do experimento | não verificado |
| Navegador original | Executar a ação exata do usuário | Captura original, sem sessão/documento identificado | não verificado |

## 6. Fluxo Esperado vs. Fluxo Real

Esperado: coordenadas da grade da casa + centro atual do corpo dentro do grupo → posição tangente aos pilotis.

Antes da correção, os métodos de criação usavam diretamente `CONTRAVENTAMENTO_COLUMN_X` e
`CONTRAVENTAMENTO_ROW_Y`, como se corpo e origem do grupo coincidissem sempre. A inserção dos marcadores
chama `refreshGroupBounds`, e o LayoutManager do Fabric recentraliza os filhos. Corpo e pilotis permanecem
coerentes entre si, mas sua origem local deixa de ser `(0,0)`. A nova barra ignora esse deslocamento.

Ponto de divergência: cálculo de `colX`, `topY`/`botY`, `left` e `beamTop` na criação da viga,
antes de `appendCanvasGroupObjects`. O helper de append apenas insere as coordenadas recebidas.

## 7. Hipóteses Causais

| Hipótese | A favor | Contra/limite | Validação | Status |
|---|---|---|---|---|
| Origem fixa após recentralização do grupo | Fonte e experimento reproduzem exatamente delta negativo em ambos os eixos | A sequência da sessão original não foi capturada | Planta Fabric real com marcadores e comparação aos pilotis | sustentada diretamente na camada |
| Escala/rotação aplicada duas vezes | Poderia alterar posição visual | Falha já ocorre sem escala/rotação; pós-patch caso transformado passa | Comparação no espaço local e transformações do grupo | desnecessária para explicar o caso |
| Lado escolhido incorretamente pelo domínio | Duas barras parecem cair do mesmo lado | Metadados left/right corretos no experimento; delta é geométrico e uniforme | Conferir metadados e tangência separadamente | descartada para a reprodução |
| Documento antigo já corrompido | Pode explicar barras incorretas após reabrir | Reprodução usa planta nova, sem persistência | Inspecionar documento original, se necessário | hipótese residual para o caso original |

## 8. Evidências e Pontos Envolvidos

- Experimento antes do patch: corpo `(0,0)` e A1 `(-116,25; -67,5)`; após marcadores,
  corpo `(9,5; 7,43)` e A1 `(-106,75; -60,07)`.
- Barras novas antes do patch: esquerda `(-128,75; -67,5)`, direita `(-108,75; -67,5)`.
  Esperado: esquerda `(-119,25; -60,07)`, direita `(-99,25; -60,07)`.
- Erro uniforme: `dx=-9,5`, `dy=-7,43`. A viga direita, largura 5, atravessa x=-106,75 de A1.
- `before-transcript.json` preserva a saída anterior. O hash da fonte anterior não foi capturado.
- `evidence.json` registra a matriz posterior e o hash da fonte corrigida, sem confundir as duas execuções.
- Fontes: `@canvas/lib/contraventamento.ts` (criação vertical/horizontal), `canvas.ts:218` (append),
  `factory/house/house-view-reference-marker.ts:187` (marcadores e bounds),
  `factory/house/house-top.strategy.ts:20` (planta real), `house-auto-contraventamento.ts:65` (automação).

## 9. Classe do Defeito e Recorrência

Inconsistência de espaço de coordenadas: origem mutável do grupo confundida com origem geométrica da casa.

Modo estrito de recorrência aplicado por existir correção da mesma família em
`.agents/changelogs/2026-10/20261016.changelog.md:101`: porta/seta deslocavam após inserir elevações.
Aquela rodada reproduziu oito falhas e ancorou porta/seta no corpo; não cobria inserção de contraventamentos.
O teste `house-plan-annotations.fabric.test.ts` exercita as anotações, mas não cria vigas depois delas.
`contraventamento.smoke.test.ts:21` usa grupo simulado sem relayout, mascarando a premissa `(0,0)`.

A análise de 13/05 sobre auto-contraventamento tratou gatilhos por altura e sincronização tardia das elevações;
não demonstrou a tangência de vigas criadas numa planta cujo grupo já havia sido recentralizado.

## 10. Contrato Mínimo de Correção

1. Resolver o centro atual do corpo da casa no espaço local do grupo no momento da inserção.
2. Somar esse deslocamento às coordenadas da grade em ambos os métodos, vertical e horizontal.
3. Preservar dimensões, metadados, lados, regras de elegibilidade e comportamento de grupos sem corpo.
4. Verificar erro geométrico contra os círculos reais, em vez de comparar apenas com constantes da implementação.

Este contrato foi entregue ao agente principal; não foi fornecido código corrigido como parte do diagnóstico.
O agente principal aplicou a implementação separadamente. Risco principal: não extrapolar o sucesso de nova
inserção para a recuperação automática de geometrias erradas já persistidas.

## 11. Edge Cases e Controles

- Planta sem marcadores e inserção anterior aos marcadores: controles que não devem regredir.
- Tipos 3 e 6; marcadores em lados diferentes, repetição de refresh, remoção/reinserção de elevações.
- Vertical esquerda/direita e horizontal superior/inferior; origem/destino invertidos.
- Planta movida, rotacionada e com escala não uniforme: medir no espaço local e confirmar resultado visível.
- Mais de uma planta: cada grupo tem seu próprio centro; não reutilizar offset de outra instância.
- Metadados antigos ausentes: inferências geométricas existentes ainda usam constantes; não foi validada migração.
- Vigas já incorretas não são reposicionadas por esta correção de criação.
  `refreshAutoContraventamentoOnTopView` retorna cedo quando já existe viga na coluna.

## 12. Validação Executada

- Support-analyst: experimento Fabric real via Node/tsx + JSDOM reproduziu o deslocamento antes do patch.
- Agente principal: informou dois testes vermelhos, tipos 3/6, diferença -128,75 versus -119,25.
- Support-analyst, após o patch concorrente: cinco cenários/10 vigas alinhados na matriz do sidecar:
  sem marcadores, marcadores antes/depois da inserção, horizontal e escala/rotação.
- Agente principal: informou 37 testes aprovados em cinco arquivos e `pnpm check` aprovado.
- Navegador local: E2E aprovado em cenário equivalente (Chromium, 1440×1000): criar planta, inserir Frontal, mover elevação para expor a planta, ativar Seleção e inserir três vigas pelos controles. Tangência verificada no Canvas e captura real em outputs/contraventamento-planta-existente-20261019/contraventamentos-alinhados.png.
- TypeScript app/E2E, ESLint e diff check aprovados. Fontes finais e hashes em outputs/contraventamento-planta-existente-20261019/validation.json.
- Preparação E2E: tentativas iniciais clicavam sobre a elevação sobreposta/em Panning e não inseriam vigas; corrigido o harness, sem alteração adicional de produto.
- Nenhum teste de produção foi escrito pelo support-analyst; o script do sidecar é uma caracterização diagnóstica.
- Nenhum commit, push, deploy ou mutação remota foi realizado por este diagnóstico.

## 13. Status de Evidência

- `partial` no vínculo com o relato original.
- Reprodução direta e causa demonstradas na camada Fabric; correção observada na matriz independente de geometria.
- `fixed-in-test` informado pelo agente principal e corroborado pela caracterização pós-patch.
- Cenário equivalente de inserção validado na interface local; documento original e eventual recuperação de barras antigas não foram exercitados. O status global permanece partial em relação à sessão/documento original, com fixed-in-test e validação visual local concluídos.

## 14. Dúvidas Residuais

A versão/documento original e a rota de inserção não foram informados. Não impedem a reprodução do defeito de
coordenadas, mas limitam a afirmação de cobertura de autosave, reload e dados existentes.

## 15. Artefatos Relacionados

- Sidecar: `20261019-contraventamento-planta-existente.bug-analysis.assets/`.
- Continuidade do agente principal: `.agents/work-items/2026-10/20261019-contraventamento-vista-superior.work-item.md`.
- Análise anterior: `.agents/bug-analysis/2026-05/20260513-auto-contraventamento-nao-recalcula-por-altura.bug-analysis.md`.
- Regra: `docs/business-rules/BUS-006-contraventamento.md`.
- Changelog da sessão sob responsabilidade do agente principal, junto à correção e sua validação visual.
