# Regras de Nível do Piloti

## Objetivo

Definir como o nível dos pilotis é calculado, editado e mantido consistente em todo o projeto.

## Conceito de nível

O nível representa a altura de referência do terreno sob um piloti, em metros. Influencia a
visualização 2D/3D, a altura recomendada do piloti e as escadas automáticas.

- **Mínimo global:** 0.20 m
- **Máximo global:** 1.75 m (metade da maior altura disponível, 3.5 m / 2)
- **Máximo por piloti:** `Altura do Piloti / 2`

### Alturas disponíveis e máximos de nível

| Altura do piloti | Nível máximo permitido |
|------------------|------------------------|
| 1.0 m            | 0.50 m                 |
| 1.5 m            | 0.75 m                 |
| 2.0 m            | 1.00 m                 |
| 2.5 m            | 1.25 m                 |
| 3.0 m            | 1.50 m                 |
| 3.5 m            | 1.75 m                 |

## Regras de edição

1. O nível pode ser alterado livremente entre o mínimo global (0.20 m) e o máximo global (1.75 m)
2. Ao confirmar alteração, o valor deve ser aplicado imediatamente.
3. Ao alterar o nível, aplica-se a "regra de ouro":
    - A altura do piloti é **sempre recalculada** com a menor altura disponível tal que `nivel ≤ altura / 2`.
      Se nenhuma altura satisfizer a condição (nível muito alto), usa a altura do maior piloti disponível.
    - O nível escolhido é mantido exatamente como o usuário deixou.

### Regra de ouro (síntese)

| Ação do usuário         | Altura recalculada? | Nível recalculado?              |
|-------------------------|---------------------|---------------------------------|
| Alterar o nível         | **Sim**, sempre     | Não (mantém o valor escolhido)  |
| Botão de altura (menor) | Não                 | Sim, se nível > nova altura / 2 |
| Botão de altura (maior) | Não                 | Não                             |

## Regras de limite

1. O nível tem mínimo e máximo válidos.
2. O máximo acompanha as regras estruturais da altura disponível de piloti.
3. O sistema não deve aceitar nível acima da capacidade estrutural.

## Regras de alteração de altura de piloti

Ao modificar a altura de um piloti:

1. **Altura menor → nível pode diminuir:** se o nível atual supera o novo máximo (`nova altura / 2`),
   o nível é configurado para `nova altura / 2`. Caso contrário, permanece inalterado.

2. **Altura maior → nível nunca aumenta:** o nível não é recalculado, apenas a altura muda.
   O nível permanece exatamente como estava.

> **Resumo:** Modificação de altura de piloti só modifica o nível quando a nova altura é menor que a atual e o
> nível corrente ultrapassa o novo limite máximo.

## Regras de recomendação de altura

1. A altura recomendada do piloti depende do nível definido.
2. Quando o valor calculado ultrapassa opções disponíveis, o sistema usa a maior opção válida.

## Regras de interpolação

1. Níveis de pilotis intermediários devem manter coerência com os cantos definidos.
2. Ajustes nos cantos podem recalcular recomendações dos intermediários sem quebrar o estado manual necessário.
3. Ao alterar um piloti de **canto**, os pilotis intermediários são recalculados por interpolação bilinear:

    1. **Somente os níveis** dos pilotis intermediários são interpolados — as **alturas nunca são
       recalculadas** neste contexto.
    2. A altura manualmente escolhida para o canto editado é aplicada antes da interpolação e não
       pode ser sobrescrita por ela.

## Regras de feedback e segurança

1. O usuário deve perceber quando houve ajuste automático por limite.
2. O sistema não pode manter valores inválidos escondidos.

## Regras de consistência

1. Alterações de nível devem refletir corretamente em:
    - visual 2D (altura do piloti em todas as vistas de elevação),
    - visual 3D,
    - regras que dependem de nível (como contraventamento e escadas automáticas).
        - escadas automáticas (contagem de degraus depende do nível de terreno).

2. Em importação, exportação e desfazer/refazer, os níveis devem se manter estáveis
   e coerentes entre si.
