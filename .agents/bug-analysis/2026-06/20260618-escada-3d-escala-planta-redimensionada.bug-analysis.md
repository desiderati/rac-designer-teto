---
title: "Bug Analysis - Escada 3D em escala de planta redimensionada"
doc_role: bug-analysis
status: confirmed
created: 2026-06-18
updated: 2026-06-18
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression, viewer-3d, escada ]
aliases: [ escada 3d redimensionada ]
---

# Análise Técnica de Bug ou Regressão

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada: escada do viewer 3D ficava larga demais e deslocada quando a
  vista elevada era derivada de uma planta redimensionada.
- origem do relato: usuário
- ambiente: editor RAC local
- status analítico: confirmado
- estado da correção: aplicada e validada em testes
- status de evidência: fixed-in-test

## 2. Contexto e Sintoma Observado

- contexto funcional: visualizador 3D da casa, usando escada automática projetada das vistas elevadas.
- sintoma observado: a escada aparecia com largura visual excessiva e deslocada à direita do ponto
  esperado.
- impacto percebido: leitura incorreta do modelo 3D antes de promover a versão.
- limitações ou incertezas iniciais: a validação visual manual no browser não foi executada nesta
  rodada.

## 3. Contrato de Falha Observável

- cenário original reportado: abrir o visualizador 3D em casa com escada automática após fluxos de
  inserção/redimensionamento de vistas.
- fronteira observável do relato: cena 3D renderizada.
- reprodução mínima que deve falhar antes da correção: vista elevada gerada a partir de planta 2x,
  com escada automática projetada diretamente para o parser 3D.
- cenário de controle que deve continuar passando: vistas em escala canônica e escadas de tipo 3 e
  tipo 6 sem redimensionamento.
- evidência necessária para considerar resolvido: parser normaliza largura e centro da escada para a
  escala canônica antes da malha 3D.

## 4. Escopo Afetado

- fluxos afetados: canvas 2D para projeção serializável, parser de escada 3D e viewer 3D.
- regras de negócio afetadas: `BUS-007` exige que escadas acompanhem dados reais do projeto sem
  virar uma versão alternativa das regras.
- módulos, componentes ou serviços envolvidos:
  - `src/components/rac-editor/@viewer-3d/lib/parsers/stairs-parser.ts`
  - `src/components/rac-editor/@viewer-3d/lib/stairs-parser.smoke.test.ts`
  - `src/components/rac-editor/@canvas/lib/house-3d-projection.smoke.test.ts`
- contratos, schemas ou interfaces envolvidos: `House3DElevationViewProjection` e `Stairs3DData`.

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade | Evidência disponível | Status |
|---------------------|------------------|----------------------|--------|
| Canvas/Fabric | Gerar vistas em escala visual atual | teste com planta escalada 2x | observado |
| Projeção 3D | Transportar medidas serializáveis do canvas | `house-3d-projection.smoke.test.ts` | observado |
| Parser 3D | Converter projeção visual para modelo canônico da cena | `stairs-parser.smoke.test.ts` | observado |
| Malha 3D | Renderizar escada a partir do modelo já normalizado | `House3DScene.smoke.test.tsx` | observado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado: medidas visuais da elevação devem ser normalizadas pela largura canônica da face
  antes de entrar no modelo 3D fixo.
- fluxo real: o parser usava `stairWidth` e `centerFromLeft` em escala visual da elevação, mesmo
  quando a fachada/lateral vinha ampliada por redimensionamento da planta.
- ponto de divergência identificado: `parseStairsFromElevationViews`, antes de devolver
  `Stairs3DData`.

## 7. Hipóteses Causais

| Hipótese | Evidências a favor | Evidências contra | O que ainda falta saber | Como validar | Status |
|----------|--------------------|-------------------|-------------------------|--------------|--------|
| Largura vinha duplicada do objeto Fabric | plausível pelo sintoma visual | reprodução canônica trouxe `41,5`, não dobro | não aplicável | projeção real com factory | descartada |
| Face da escada divergia da face da porta | imagem sugeria deslocamento lateral | parser e elementos 3D usam o mesmo mapeamento de face | validação visual final | comparar parsers | inconclusiva |
| Parser não normalizava escala da vista elevada | planta 2x gera fachada/escada 2x, mas casa 3D é fixa | nenhum teste anterior cobria esse caso | validação visual manual | teste de planta 2x e parser normalizado | confirmada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste de projeção com planta em escala 2x demonstrou `doorWidth` e `stairs.width` ampliados antes
  do parser.
- teste de parser passou a cobrir tipo 6 e lateral tipo 3 redimensionadas.

### Pontos de código, contrato ou regra

- arquivo, módulo ou contrato: `stairs-parser.ts`
- responsabilidade no defeito: converter coordenadas de uma vista visualmente escalada para a escala
  canônica do viewer 3D.

## 9. Classe do Defeito ou Regressão

- classe: falta de normalização em fronteira de projeção visual para modelo canônico.
- por que esta classificação se aplica: o canvas pode variar escala visual; o viewer 3D possui
  dimensões fixas derivadas de `HOUSE_3D_SCALE`.

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente: normalizar `centerFromLeft` e `stairWidth` por
  `larguraCanônicaDaElevação / bodyWidthProjetado`.
- por que resolve a causa: remove a escala visual da vista elevada antes da malha 3D calcular posição
  e largura.
- riscos e impactos laterais: parser de mocks antigos precisou usar larguras canônicas reais; baixo
  risco para geração da escada 2D, que não foi alterada.

## 11. Edge Cases e Cenários de Controle

- edge cases relevantes: tipo 6 em fachada frontal/traseira; tipo 3 em lateral `side2`; projeções sem
  `bodyLeft`; projeções sem `isHouseBody` usando porta como fallback.
- cenário que poderia mascarar a correção: validar apenas vistas em escala canônica.
- cenário de controle que deve continuar passando: parser com `bodyLeft` real e escadas incompletas
  ignoradas.
- risco de recorrência se a correção for apenas sintomática: alto, porque qualquer redimensionamento
  da planta voltaria a contaminar a cena 3D.

## 12. Validação Executada

- validação de camada: parser de escada 3D com tipo 6 e tipo 3 redimensionados.
- validação de integração: projeção com factory real de planta/fachada em escala 2x.
- validação na fronteira original: parcial; cena 3D testada por smoke, sem browser manual.
- testes executados:
  - `npm run test -- src/components/rac-editor/@viewer-3d/lib/stairs-parser.smoke.test.ts`
  - `npm run test -- src/components/rac-editor/@canvas/lib/house-3d-projection.smoke.test.ts`
  - `npm run test -- src/components/rac-editor/@viewer-3d/ui/House3DScene.smoke.test.tsx`
  - `npm run test -- src/components/rac-editor/@canvas/lib/house-auto-stairs.smoke.test.ts`
  - `npm run test -- src/components/rac-editor/@viewer-3d/lib/constants.smoke.test.ts`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `git diff --check -- src/components/rac-editor/@viewer-3d/lib/parsers/stairs-parser.ts src/components/rac-editor/@viewer-3d/lib/stairs-parser.smoke.test.ts src/components/rac-editor/@canvas/lib/house-3d-projection.smoke.test.ts`
- validação manual ou operacional: não executada.
- build, lint ou smoke relevante: typecheck e lint passaram.
- critério de sucesso observado: o parser passa a devolver largura e centro normalizados quando a
  vista elevada vem de planta 2x.
- limitações ou validações bloqueadas: validação visual no navegador ainda recomendada.

## 13. Status de Evidência

- status final: fixed-in-test
- por que este status se aplica: a causa raiz foi reproduzida em teste integrado e corrigida no
  parser; a cena 3D adjacente permanece verde.
- o que ainda ficaria necessário para elevar o status: validar manualmente no viewer 3D com casa tipo
  3 e tipo 6 após redimensionar a planta.

## 14. Dúvidas Residuais de Regra de Negócio

- dúvida: nenhuma identificada.
- por que ainda importa: não aplicável.

## 15. Artefatos Relacionados

- incidente correlato: não aplicável.
- PR, commit ou diff relacionado: mudanças locais ainda não commitadas.
- sidecar de anexos: não aplicável.
- documentos correlatos: `docs/business-rules/BUS-007-viewer-3d.md`.
