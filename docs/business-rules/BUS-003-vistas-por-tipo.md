---
title: Regras de Vistas por Tipo de Casa
id: BUS-003
doc_type: business-rule
doc_set: business-rules
order: 3
status: active
lang: pt-BR
---

# Regras de Vistas por Tipo de Casa

## Objetivo

Definir quais vistas podem ser criadas em cada tipo de casa e como funciona inserção, bloqueio e
remoção.

## Tipos de vista

1. Planta.
2. Vista frontal/posterior/lateral, conforme o tipo de casa.
3. Quadrado fechado.
4. Quadrado aberto.

## Regras de limite por tipo de casa

### Tipo 6

1. Planta: 1
2. Frontal: 1
3. Posterior: 1
4. Lateral: 2, diferenciadas no canvas como `Lateral Esquerda` e `Lateral Direita`
5. Quadrado aberto: 0

### Tipo 3

1. Planta: 1
2. Frontal: 0
3. Lateral: 2, diferenciadas no canvas como `Lateral Esquerda` e `Lateral Direita`
4. Quadrado fechado: 1
5. Quadrado aberto: 1

## Regras de inserção

1. Se ainda houver vaga
    - Inserção é permitida.

2. Se limite já foi atingido
    - Inserção é bloqueada e o usuário recebe aviso.

3. Quando necessário
    - O sistema pede seleção de lado ou de instância antes de inserir.

4. Se existir apenas uma opção válida
    - Inserção acontece direto, sem etapa extra.

## Regras de remoção

1. Ao remover uma vista, a vaga correspondente deve ser liberada.

2. Após remoção, deve ser possível inserir novamente dentro dos limites.

3. A planta segue regra especial:
    - Só pode ser removida se não houver outras vistas ativas.

## Regras do fluxo inicial

1. Escolha de tipo de casa inicia configuração das primeiras vistas.
2. Definição de níveis faz parte da preparação inicial.
3. Após confirmar, o sistema cria a planta e a vista inicial do tipo escolhido.
4. Se o fluxo inicial for cancelado, o estado parcial deve ser limpo.

## Regras de consistência

1. Importação, desfazer/refazer e reconstrução não podem violar limites por tipo.
2. Contagem de vistas deve permanecer correta após qualquer operação.
3. Rótulos e comportamento devem continuar coerentes com o tipo de casa ativo.

## Regras de identificação no canvas

1. Cada vista elevada mantém referência interna pela ordem de inserção no canvas.

2. A vista elevada exibe apenas uma etiqueta superior com o nome da vista, logo acima da própria vista.
    - Exemplo: `Frontal`.

3. A planta exibe o marcador triangular correspondente a cada vista elevada inserida.

4. O marcador triangular fica pareado com o lado da planta associado à vista.

5. A base do triângulo deve ficar paralela ao lado da planta.

6. A ponta do triângulo deve apontar para o lado da planta correspondente.

7. O triângulo não deve exibir número interno.

8. O texto do nome deve ficar paralelo à base do triângulo.

9. O nome da vista deve ficar do lado externo da base:
    - Superior: acima da base.
    - Inferior: abaixo da base.
    - Esquerdo: à esquerda da base.
    - Direito: à direita da base.
