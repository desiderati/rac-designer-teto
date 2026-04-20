# Regras de Piloti Mestre

## Objetivo

Garantir que o projeto sempre tenha, no máximo, um piloti mestre por vez e que isso apareça de forma clara para quem
usa.

## Regra principal

1. Só pode existir um piloti mestre em toda a casa.

## Onde o mestre pode ser definido

1. Na definição inicial de níveis.
2. No editor de piloti durante a edição normal.

## Comportamento ao escolher novo mestre

1. Ao marcar um piloti como mestre:
    - Ele passa a ser o único mestre.
    - Qualquer mestre anterior é desmarcado automaticamente.

2. Essa troca deve ser aplicada de forma imediata e consistente no projeto.

## Regras visuais

1. O piloti mestre deve ter destaque visual claro.
2. O destaque deve aparecer de forma consistente nas vistas em que essa informação for exibida.

## Regras de persistência

1. Ao salvar, exportar, importar e reconstruir projeto, a regra de mestre único deve permanecer válida.
2. Em desfazer/refazer, o estado do mestre deve acompanhar o histórico.

## Regras de edição simultânea

1. Alterações de mestre não podem criar estados ambíguos (dois mestres ao mesmo tempo).
2. Se houver conflito de atualização, prevalece a regra de mestre único.
