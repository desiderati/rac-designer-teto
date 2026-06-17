---
title: Indicador de Risco do Terreno no PDF
id: BUS-008
doc_type: business-rule
doc_set: business-rules
order: 8
status: active
lang: pt-BR
---

# Indicador de Risco do Terreno no PDF

## Objetivo

Definir como o PDF do RAC comunica, no cabeçalho, uma leitura sintética do risco operacional do
terreno da casa ativa.

## Regra

1. O cabeçalho do PDF não exibe mais o campo textual `Complexidade`.
2. O cabeçalho exibe um gauge à esquerda do nome da família.
3. O gauge apresenta um valor inteiro de 0 a 100.
4. O valor é calculado a partir de:
   - perfil do solo;
   - complexidade do terreno;
   - obstáculos subterrâneos, elevados e recuos vizinhos;
   - média das alturas dos pilotis.
5. O indicador é uma heurística operacional para triagem visual no relatório. Ele não substitui
   avaliação técnica, vistoria de campo ou laudo geotécnico.

## Fórmula

O cálculo segue uma matriz simples de risco:

```text
risco = probabilidade x severidade
```

No RAC:

1. `probabilidade` usa a complexidade do terreno e a pressão dos obstáculos.
2. `severidade` usa o perfil do solo e a pressão dos obstáculos.
3. Cada obstáculo selecionado adiciona uma pressão própria aos dois fatores.
4. Cada fator é limitado entre `1` e `5`.
5. A média das alturas dos pilotis gera um multiplicador linear de dificuldade:
   - média de `1,0 m`: multiplicador `1,0`;
   - média de `3,5 m`: multiplicador `2,0`;
   - médias intermediárias são interpoladas proporcionalmente.
6. O produto com o multiplicador de pilotis é normalizado para `0` a `100`, com limite superior
   em `100`.

## Pesos

### Solo

| Solo | Pontuação |
|---|---:|
| Firme | 1 |
| Não informado | 2 |
| Argila / solto | 3 |
| Água no fundo | 4 |

### Complexidade

| Complexidade | Pontuação |
|---|---:|
| Plano | 1 |
| Moderado | 2 |
| Íngreme | 3 |
| Muito íngreme | 4 |

Observação: `Extremo` permanece aceito apenas como valor legado em documentos existentes. Na edição
da casa, esse valor deve ser apresentado e salvo como `Muito íngreme`.

### Obstáculos

Cada opção marcada soma:

| Obstáculo | Pontuação |
|---|---:|
| Subterrâneos | 1,25 |
| Elevados | 0,25 |
| Recuos vizinhos | 0,75 |

### Pilotis

O cálculo usa a média das alturas de todos os pilotis da casa ativa. A média é limitada ao intervalo
canônico de `1,0 m` a `3,5 m`.

| Média dos pilotis | Multiplicador |
|---:|---:|
| 1,0 m | 1,0x |
| 3,5 m | 2,0x |

Exemplo: média de `3,0 m` aplica multiplicador `1,8x`.

## Faixas

| Valor | Faixa |
|---:|---|
| 0-24 | Baixa |
| 25-49 | Média |
| 50-74 | Alta |
| 75-100 | Crítica |

## Fundamentação

A fórmula usa uma matriz de risco porque esse padrão é simples, auditável e compatível com práticas
de avaliação por probabilidade e severidade. A decisão também reflete que riscos de construção
incluem condições do terreno, condições do solo, restrições do local e dificuldade estrutural
associada à altura média dos pilotis.

Referências usadas para a regra:

- [OSHA, `Hazard Identification and Assessment`](https://www.osha.gov/safety-management/hazard-identification).
- [CCOHS, `Hazard and Risk - Risk Assessment`](https://www.ccohs.ca/oshanswers/hsprograms/hazard/risk_assessment.html).
- [ROADEX Network, `Geotechnical risk management`](https://www.roadex.org/e-learning/lessons/roads-on-peat/geotechnical-risk-management/).
- [RICS, `Management of risk`](https://www.rics.org/content/dam/ricsglobal/documents/standards/management_of_risk_1st_edition_rics.pdf).

## Critérios de validação

1. O PDF não deve renderizar `Complexidade` como campo de cabeçalho.
2. O gauge deve ter tamanho fixo e não deslocar os metadados do cabeçalho.
3. O nome da família e líderes devem respeitar a largura real disponível.
4. O valor do gauge deve ser testado com pelo menos:
   - risco baixo;
   - risco médio;
   - risco crítico.
