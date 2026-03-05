# Regras de Vistas por Tipo de Casa

## Objetivo

Definir quais vistas podem ser criadas em cada tipo de casa e como funciona inserção, bloqueio e remoção.

## Tipos de vista

1. Planta.
2. Visão frontal.
3. Visão traseira/lateral (dependendo do tipo).
4. Quadrado fechado.
5. Quadrado aberto.

## Regras de limite por tipo de casa

### Tipo 6

1. Planta: 1
2. Visão frontal: 1
3. Visão traseira: 1
4. Quadrado fechado: 2
5. Quadrado aberto: 0

### Tipo 3

1. Planta: 1
2. Visão frontal: 0
3. Visão lateral: 2
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
