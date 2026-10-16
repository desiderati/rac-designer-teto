---
title: Orientação 3D sem elevações
doc_role: bug-analysis
status: confirmed
created: 2026-10-16
updated: 2026-10-16
tags: [bug-analysis, regression, viewer-3d]
---

# Orientação 3D sem elevações

## Identificação, contexto e contrato de falha

Relato humano: porta e seta da planta funcionam; porta e janelas aparecem na face oposta no 3D em alguns casos. O usuário confirmou que havia apenas a planta. Alvo desta correção: código local, sem publicação ou alteração de dados remotos.

A orientação 3D deve respeitar o lado escolhido na criação da planta, antes da inserção das elevações, conforme BUS-007. Controle: manter as atribuições explícitas e o fallback de documentos sem orientação. Evidência atual: `fixed-in-test`; aceite na cena original ainda não realizado.

## Camadas, fluxo e causa

| Camada | Evidência |
|---|---|
| Estado da casa | `buildAutoAssignedSides` registra a escolha em `preAssignedSides`; `sideMappings` ainda pode estar vazio. |
| Planta | `resolveTopDoorMarkerSide` usa a pré-atribuição quando não há atribuição explícita. |
| Projeção Canvas/documento | Ambos os produtores de `House3DProjection` omitiam `preAssignedSides`. |
| Modelo 3D | Sem a escolha, resolvia as faces padrão para aberturas, escada e câmera. |
| Cena original | Screenshots humanos anteriores; sem captura nova do mesmo documento. |

A hipótese de perda da orientação foi confirmada no contrato de dados consumido pela cena: quatro testes falharam antes da correção, para tipo 6/inferior e tipo 3/direito, nos caminhos Canvas e documento. O gerador de aberturas devolvia a face oposta à esperada. Nenhuma inversão global de eixos foi necessária. Não foi determinado o commit histórico que introduziu o defeito.

## Correção e controles

Propagar a pré-atribuição na projeção serializável e usá-la no modelo somente quando a vista que contém a porta ainda não possui lado explícito. Derivar aberturas e escada da mesma orientação; câmera e iluminação recebem a face da porta pelo fluxo existente. Não modificar o estado canônico nem os cálculos 2D.

A propriedade de projeção é opcional para preservar consumidores legados. Os testes cobrem quatro orientações válidas, ambos os produtores, precedência explícita, porta/janelas/escada/câmera, ausência de mutação do estado e fallback sem pré-atribuição.

## Validação e limites

- Antes: 4 falhas e 16 controles aprovados no novo arquivo de regressão.
- Depois: 44 testes aprovados em seis arquivos, incluindo os 20 testes novos, projeção Fabric, escadas, aberturas, câmera e snapshot PDF.
- TypeScript aprovado; ESLint sem erros, com aviso preexistente de dependências em `useHouse3DViewerModel`; diff restrito sem erros de whitespace.
- IAB local abriu um documento de outra frente, “Validação de elementos”; nenhuma alteração foi feita nele. A aba temporária foi fechada. Não tratar os testes de dados como aceite visual da cena fornecida pelo usuário.
- Revisão local posterior sem achados bloqueantes, com os 44 testes reexecutados e aprovados. Correção restrita a esta frente; alterações paralelas preservadas e sem publicação remota.

## Critério de aceite visual

Reabrir o 3D da mesma casa com apenas a planta: porta, janelas e escada devem ocupar a face correspondente à porta 2D, mantendo a relação com os pilotis e o terreno. Uma pose de câmera previamente salva continua sendo restaurada; isso não altera a orientação física da casa.
