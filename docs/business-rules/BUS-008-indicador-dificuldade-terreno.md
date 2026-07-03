---
title: Indicador de Dificuldade do Terreno
id: BUS-008
doc_type: business-rule
doc_set: business-rules
order: 8
status: active
lang: pt-BR
---

# Indicador de Dificuldade do Terreno

## Objetivo

Definir como o RAC comunica uma leitura sintética da dificuldade operacional do terreno da casa.

O indicador usa a mesma fórmula do antigo indicador de risco do PDF, mas na interface do editor e
na listagem de casas deve ser apresentado ao usuário como `Dificuldade`.

## Regra

1. O cabeçalho do PDF não exibe mais o campo textual `Complexidade`.
2. O cabeçalho do PDF exibe um gauge à esquerda do nome da família.
3. O canvas do editor exibe um gauge vertical de `Dificuldade` no lado direito central da área de
   trabalho quando há casa ativa.
4. A listagem de casas exibe uma coluna `Dificuldade`, com um gauge horizontal compacto em cada
   linha.
5. No canvas e na listagem, o hover ou foco do gauge exibe a faixa atual e a legenda das faixas
   `Baixa`, `Média`, `Alta` e `Crítica`.
6. No canvas, o gauge vertical também exibe controles circulares para editar os fatores usados no
   cálculo: um botão acima para `Perfil do Solo`, com menu compacto, e quatro botões abaixo para
   alternar obstáculos hidráulicos, subterrâneos, elevados e servidões vizinhas.
7. O gauge apresenta um valor inteiro de 0 a 100.
8. O valor é calculado a partir de:
    - perfil do solo;
    - complexidade derivada do desnível do terreno;
    - obstáculos hidráulicos, subterrâneos, elevados e servidões vizinhas;
    - média das alturas dos pilotis.
9. A configuração da casa não possui campo manual de `Complexidade do Terreno`; essa categoria não
   é persistida e sempre é calculada a partir dos níveis dos pilotis.
10. O indicador é uma heurística operacional para triagem visual. Ele não substitui avaliação
    técnica, vistoria de campo ou laudo geotécnico.

## Fórmula

O cálculo segue uma soma ponderada de fatores:

```text
dificuldade =
  pontos do desnível
+ pontos do solo
+ pontos dos obstáculos
+ pontos da média dos pilotis
```

No RAC:

1. O desnível derivado dos níveis dos pilotis soma até `30` pontos.
2. O perfil do solo soma até `25` pontos, preservando a proporção entre os pesos definidos.
3. Os obstáculos somam até `20` pontos, preservando a proporção entre os pesos definidos.
4. A média das alturas dos pilotis soma até `50` pontos:
    - média de `1,0 m`: `0` ponto;
    - média de `3,5 m`: `50` pontos;
    - médias intermediárias seguem a fórmula `pontosPilotis = (médiaPilotis - 1,0) * 20`,
      limitada ao intervalo de `0` a `50`.
5. A soma é arredondada para inteiro e limitada ao intervalo de `0` a `100`. Como o componente de
   pilotis pode chegar a `50` pontos, a soma teórica pode exceder `100` antes do limite final.
6. Quando a casa ainda não possui pilotis no desenho, o desnível é considerado não informado e a
   complexidade usada no cálculo é `Plano`.
7. O contrato de `siteAssessment` usa somente os nomes atuais de solo e obstáculos. Como o produto
   ainda está em fase de draft local, o contrato anterior foi descartado e não possui fallback de
   leitura.

## Pesos

### Solo

| Solo                            | Peso | Pontos no gauge |
|---------------------------------|-----:|----------------:|
| Terreno Estável / Argiloso      |    1 |               0 |
| Não informado                   |  1,5 |            4,17 |
| Terreno Firme / Duro            |    2 |            8,33 |
| Solo Molhado                    |    3 |           16,67 |
| Lençol Freático / Água no Fundo |    4 |              25 |

`Solo Molhado` mantém o mesmo peso operacional do perfil técnico interno `alluvial`; a mudança desta regra é de
nomenclatura visível para a pessoa usuária, sem migração de dados.

### Desnível

|         Desnível dos pilotis | Complexidade derivada | Pontos no gauge |
|-----------------------------:|-----------------------|----------------:|
|   `0 cm <= desnível < 30 cm` | Plano                 |               0 |
|  `30 cm <= desnível < 60 cm` | Moderado              |             7,5 |
|  `60 cm <= desnível < 90 cm` | Íngreme               |              15 |
| `90 cm <= desnível < 120 cm` | Muito íngreme         |            22,5 |
|         `120 cm <= desnível` | Extremo               |              30 |

### Obstáculos

Cada opção marcada soma:

| Obstáculo                     | Peso | Pontos no gauge |
|-------------------------------|-----:|----------------:|
| Hidráulicos                   | 0,80 |            6,15 |
| Subterrâneos                  | 1,00 |            7,69 |
| Elevados                      | 0,20 |            1,54 |
| Servidões vizinhas / Esquadro | 0,60 |            4,62 |

### Pilotis

O cálculo usa a média das alturas de todos os pilotis da casa ativa. A média é limitada ao intervalo
canônico de `1,0 m` a `3,5 m` e gera até `50` pontos.
Para fins exclusivos deste cálculo, alturas de `3,8 m` são tratadas como `3,5 m`, evitando variação
adicional no indicador sem alterar a altura real do piloti no projeto.

```text
pontosPilotis = clamp((médiaPilotis - 1,0) * 20, 0, 50)
```

Exemplos:

| Média dos pilotis | Pontos dos pilotis |
|------------------:|-------------------:|
|             1,0 m |                  0 |
|             1,5 m |                 10 |
|             2,0 m |                 20 |
|             2,5 m |                 30 |
|             3,0 m |                 40 |
|             3,2 m |                 44 |
|             3,5 m |                 50 |

Com solo `Lençol Freático / Água no Fundo`, desnível plano e sem obstáculos:

| Média dos pilotis | Pontuação final esperada |
|------------------:|-------------------------:|
|             2,5 m |                       55 |
|             3,0 m |                       65 |
|             3,5 m |                       75 |

## Faixas

|  Valor | Faixa   |
|-------:|---------|
|   0-24 | Baixa   |
|  25-49 | Média   |
|  50-74 | Alta    |
| 75-100 | Crítica |

## Fundamentação

A fórmula usa soma ponderada porque esse padrão é simples, auditável e evita que um fator baixo
anule agravantes importantes. A decisão também reflete que riscos de construção incluem condições
do terreno, condições do solo, restrições do local e dificuldade estrutural associada à altura média
dos pilotis.

Referências usadas para a regra:

- [OSHA, `Hazard Identification and Assessment`](https://www.osha.gov/safety-management/hazard-identification).
- [CCOHS, `Hazard and Risk - Risk Assessment`](https://www.ccohs.ca/oshanswers/hsprograms/hazard/risk_assessment.html).
- [ROADEX Network,
  `Geotechnical risk management`](https://www.roadex.org/e-learning/lessons/roads-on-peat/geotechnical-risk-management/).
- [RICS,
  `Management of risk`](https://www.rics.org/content/dam/ricsglobal/documents/standards/management_of_risk_1st_edition_rics.pdf).

## Critérios de validação

1. O PDF não deve renderizar `Complexidade` como campo de cabeçalho.
2. O gauge do PDF deve ter tamanho fixo e não deslocar os metadados do cabeçalho.
3. O nome da família e líderes devem respeitar a largura real disponível.
4. O canvas deve renderizar o gauge vertical fora do objeto Fabric, sem afetar exportação ou
   interação com o desenho.
5. Os controles circulares do canvas devem alterar apenas `siteAssessment` da casa ativa; o botão de
   solo deve permitir `Não informado`, `Terreno Estável / Argiloso`, `Terreno Firme / Duro`,
   `Solo Molhado` e `Lençol Freático / Água no Fundo`, e os quatro botões de obstáculo devem
   funcionar como toggles independentes.
6. A listagem de casas deve manter contrato explícito de colunas e exibir gauge horizontal por
   linha na coluna `Dificuldade`.
7. O gauge e seus controles devem expor nomes e estados acessíveis com valor, faixa, seleção de solo
   e estado pressionado dos obstáculos, sem depender apenas da cor. O hover/foco do gauge deve
   detalhar as quatro faixas visuais.
8. A complexidade não deve aparecer como campo editável nem como propriedade persistida em
   `siteAssessment`.
9. O valor do gauge deve ser testado com pelo menos:
    - dificuldade baixa;
    - dificuldade média;
    - dificuldade crítica.
10. A derivação por desnível deve ser testada nas faixas de `30 cm`, `60 cm`, `90 cm` e `120 cm`.
