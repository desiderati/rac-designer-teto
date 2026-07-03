---
title: Regras de Materiais de Terreno
id: BUS-009
doc_type: business-rule
doc_set: business-rules
order: 9
status: active
lang: pt-BR
---

# Regras de Materiais de Terreno

## Objetivo

Definir como o editor calcula e apresenta os materiais de base do terreno para uma casa.

## Conceitos principais

1. Rachão
    - Material de base calculado por piloti conforme o tipo de solo.

2. Brita
    - Material de preenchimento calculado em torno do piloti conforme o nível de terreno.

3. Pedras
    - Soma operacional de rachão e brita.
    - Fórmula canônica: `pedras = rachão + brita`.

## Cálculo de rachão

1. O cálculo usa um cilindro externo por piloti.

2. O diâmetro externo é composto por:
    - largura real do piloti usada para cálculo;
    - duas laterais de brita.

3. A altura de rachão varia conforme o tipo de solo.

4. O volume recebe o fator de vazio de rachão.

5. Quando a casa não informa pilotis, o cálculo usa o fallback operacional de 12 pilotis.

### Tabela de cama de rachão

| Tipo de solo | Descrição     | Cama de rachão |
|--------------|---------------|----------------|
| 1            | Seco          | 10 cm          |
| 2            | Argiloso      | 15 cm          |
| 3            | Água no fundo | 20 cm          |
| 4            | Bastante água | 25 cm          |
| 5            | Submerso      | 30 cm          |

Os mesmos valores alimentam a informação exibida na modal de terreno e a altura usada no cálculo de
volume de rachão.

## Cálculo de brita

1. Para cada piloti, o cálculo usa o volume do cilindro externo menos o volume do cilindro do
   piloti.

2. O nível do piloti é convertido de metros para centímetros antes do cálculo.

3. O volume recebe o fator de vazio de brita.

4. A soma considera todos os pilotis da casa.

## Cálculo de pedras

1. Pedras sempre corresponde à soma dos volumes calculados de rachão e brita.
2. O sistema não deve tratar pedras como um terceiro material independente.
3. A interface deve usar a regra centralizada quando exibir esses totais.
4. O PDF RAC não deve exibir os campos detalhados de rachão, brita e pedras.

## Regras de apresentação

1. A interface deve diferenciar rachão, brita e pedras.
2. Quando o total de pedras for exibido, o rótulo deve usar `Rachão | Brita`.
3. A exportação em PDF deve omitir a seção de materiais de base.
