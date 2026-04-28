---
title: Regras de Nível do Piloti
id: BUS-004
doc_type: business-rule
doc_set: business-rules
order: 4
status: active
lang: pt-BR
---

# Regras de Nível do Piloti

## Objetivo

Definir como o nível dos pilotis é calculado, editado e mantido consistente em todo o projeto.

## Conceito de nível

O nível representa a altura de referência do terreno sob um piloti, em metros. Influencia a
visualização 2D/3D, a altura recomendada do piloti, o diagnóstico de proporção estrutural e as escadas automáticas.

- **Mínimo global:** 0.20 m
- **Máximo global:** 1.75 m (metade da maior altura disponível, 3.5 m / 2)
- **Limite máximo permitido por piloti:** `Altura do piloti / 2`
- **Relação usada para recomendação estrutural:** `Altura recomendada >= nível * 3`

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
3. Ao alterar o nível pelo slider:
    - o nível escolhido é mantido exatamente como o usuário deixou;
    - a altura do piloti é recalculada com a menor altura disponível que satisfaça `altura >= nível * 3`.
4. Ao alterar a altura manualmente pelos botões:
    - a altura escolhida é mantida;
    - se o nível atual ultrapassar o máximo permitido da nova altura (`altura / 2`), o nível é reduzido para esse
      limite;
    - se a nova altura continuar compatível, o nível permanece como estava.

### Síntese operacional

| Ação do usuário         | Altura recalculada? | Nível recalculado?              |
|-------------------------|---------------------|---------------------------------|
| Alterar o nível         | **Sim**, pela recomendação (`altura >= nível * 3`) | Não (mantém o valor escolhido) |
| Botão de altura (menor) | Não                 | Sim, se nível > nova altura / 2 |
| Botão de altura (maior) | Não                 | Não                             |

## Regras de limite

1. O nível tem mínimo e máximo válidos.
2. O máximo permitido por piloti acompanha a regra `nível <= altura / 2`.
3. O sistema não deve aceitar nível acima da capacidade permitida para a altura manual atual.

## Regras de alteração de altura de piloti

Ao modificar a altura de um piloti:

1. **Altura menor → nível pode diminuir:** se o nível atual supera o novo máximo (`nova altura / 2`),
   o nível é configurado para `nova altura / 2`. Caso contrário, permanece inalterado.

2. **Altura maior → nível nunca aumenta:** o nível não é recalculado, apenas a altura muda.
   O nível permanece exatamente como estava.

> **Resumo:** Modificação de altura de piloti só modifica o nível quando a nova altura é menor que a atual e o
> nível corrente ultrapassa o novo limite máximo.

## Regras de recomendação de altura

1. A altura recomendada usa a menor altura disponível que satisfaça `altura >= nível * 3`.
2. A mesma relação é usada para diagnosticar pilotis fora de proporção.
3. Quando o valor calculado ultrapassa opções disponíveis, o sistema usa a maior opção válida.
4. Um piloti pode continuar dentro do limite permitido (`altura / 2`) e ainda assim ficar fora da proporção
   recomendada (`altura >= nível * 3`).

## Regras de interpolação

1. Níveis de pilotis intermediários devem manter coerência com os cantos definidos.
2. Ao alterar o nível de um piloti de canto, os níveis dos demais pilotis podem ser recalculados por interpolação
   bilinear.
3. Após essa interpolação, as alturas recomendadas dos pilotis afetados também podem ser recalculadas
   automaticamente.
4. Se a edição do canto trouxe uma altura manual explícita junto com o novo nível, a altura do piloti editado deve ser
   preservada depois do recálculo global.

## Regras de feedback e segurança

1. O usuário deve perceber quando houve ajuste automático por limite ou por recomendação.
2. O sistema não pode manter valores inválidos escondidos.

## Regras de consistência

1. Alterações de nível devem refletir corretamente em:
    - visual 2D (altura do piloti em todas as vistas de elevação),
    - visual 3D,
    - regras que dependem de nível (como contraventamento e escadas automáticas).
        - escadas automáticas (contagem de degraus depende do nível de terreno).

2. Em importação, exportação e desfazer/refazer, os níveis devem se manter estáveis
   e coerentes entre si.
