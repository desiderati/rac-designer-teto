---
title: "Bug Analysis - Contraventamento frontal/posterior com metade da altura"
doc_role: bug-analysis
status: confirmed
created: 2026-06-17
updated: 2026-06-17
tags: [ bug-analysis, regression, rac-editor, canvas, contraventamento ]
aliases: [ contraventamento fachada metade ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: contraventamentos das vistas frontal e posterior eram projetados com metade da altura visual esperada
- origem do relato: usuário
- ambiente: local
- status analítico: confirmado
- estado da correção: validada em teste
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: projeção dos contraventamentos da planta para as vistas elevadas do lado de 6 m.
- sintoma observado: após os ajustes recentes de terreno, os contraventamentos frontal/posterior passaram a aparecer com altura visual pela metade.
- impacto percebido: inconsistência visual entre a regra de `BUS-006` e a representação no canvas.

## 3. Contrato de Falha Observável

- cenário original reportado: contraventamentos nas vistas frontal e posterior não podem aparecer com metade da altura.
- fronteira observável do relato: vista elevada no canvas.
- reprodução mínima: projetar contraventamento horizontal em vista frontal/posterior e verificar a espessura/altura visual.
- cenário de controle: vistas laterais não podem dobrar a espessura; devem usar a mesma base visual das vistas frontal
  e posterior.
- evidência necessária para considerar resolvido: teste deve validar que todas as elevações usam `squareWidth` completo,
  sem aplicar multiplicador nas laterais.

## 4. Causa Identificada

`syncContraventamentoElevationViews` usava `HOUSE_DIMENSIONS.contraventamento.squareWidth / 2` como espessura base das
vistas elevadas. Ao corrigir a base para `squareWidth`, o multiplicador aplicado às laterais deixou essas vistas grossas
demais.

## 5. Correção Aplicada

- A espessura base da elevação passou a usar `HOUSE_DIMENSIONS.contraventamento.squareWidth`.
- O multiplicador das vistas laterais foi removido.
- O teste de contraventamento passou a caracterizar a mesma base para frontal, posterior e laterais.

## 6. Validação Executada

- `npm run test -- src/components/rac-editor/@canvas/lib/contraventamento.smoke.test.ts`
- `npm run test -- src/components/rac-editor/@canvas/lib/contraventamento.smoke.test.ts src/components/rac-editor/@viewer-3d/lib/contraventamento-parser.smoke.test.ts src/components/rac-editor/@viewer-3d/ui/House3DScene.smoke.test.tsx`
- `npm run lint`
- `npm run build`

## 7. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a regra foi caracterizada nos testes de projeção do canvas e validada com testes adjacentes do viewer 3D.
- o que ainda ficaria necessário para elevar o status: inspeção visual manual no navegador com uma vista frontal/posterior contendo contraventamento.
