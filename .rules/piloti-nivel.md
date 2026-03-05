# Regras de Nível do Piloti

## Objetivo

Definir como o nível dos pilotis é calculado, editado e mantido consistente em todo o projeto.

## Conceito de nível

1. O nível representa a referência de altura do piloti no terreno.
2. Esse valor influencia visualização, recomendações e regras de outras funções.

## Regras de edição

1. O nível pode ser alterado nos fluxos de edição previstos pelo produto.
2. Ao confirmar alteração, o valor deve ser aplicado imediatamente.
3. Se o valor informado estiver fora do limite permitido, o sistema ajusta automaticamente para o limite válido.

## Regras de limite

1. O nível tem mínimo e máximo válidos.
2. O máximo acompanha as regras estruturais da altura disponível de piloti.
3. O sistema não deve aceitar nível acima da capacidade estrutural.

## Regras de recomendação de altura

1. A altura recomendada do piloti depende do nível definido.
2. Quando o valor calculado ultrapassa opções disponíveis, o sistema usa a maior opção válida.

## Regras de interpolação

1. Níveis de pilotis intermediários devem manter coerência com os cantos definidos.
2. Ajustes nos cantos podem recalcular recomendações dos intermediários sem quebrar o estado manual necessário.

## Regras de feedback e segurança

1. O usuário deve perceber quando houve ajuste automático por limite.
2. O sistema não pode manter valores inválidos escondidos.

## Regras de consistência

1. Alterações de nível devem refletir corretamente em:
    - visual 2D,
    - visual 3D,
    - regras que dependem de nível (como contraventamento e escadas automáticas).

2. Em importação, exportação e desfazer/refazer, os níveis devem se manter estáveis.
