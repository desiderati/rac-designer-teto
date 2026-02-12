
# Correcao: Terreno do lado direito menor na insercao inicial

## Problema

Na funcao `createHouseFrontBack`, o `rightX` do terreno e calculado como `2 * margin + 3 * step + 50`, que matematicamente equivale a `bodyW - pilotW + 50`. Isso faz o terreno ficar `pilotW` (30 pixels escalados) mais curto que deveria no lado direito.

Na funcao de atualizacao (`updateGroundInGroup`), o calculo usa os limites dos objetos estruturais (paredes e telhado), que cobrem toda a largura `bodyW`, resultando em `rightX = bodyW + 50`. Por isso, apos editar um piloti, o terreno fica correto.

## Solucao

Usar `bodyW` como referencia direta em vez da formula baseada em margin/step/pilotW:

### Arquivo: `src/lib/canvas-utils.ts`

**`createHouseFrontBack` (linha 731):**
- Trocar `rightX = 2 * margin + 3 * step + 50` por `rightX = bodyW + 50`

**`createHouseSide` (linha 893):** Verificar se ha problema similar. Atualmente usa `rightX = sideWidth + 50`, que parece correto se `sideWidth` ja representa a largura total da vista.

## Detalhe tecnico

- `margin = 55 * s`, `pilotW = 30 * s`, `step = (bodyW - 2*margin - pilotW) / 3`
- `2*margin + 3*step = 2*margin + bodyW - 2*margin - pilotW = bodyW - pilotW`
- Portanto `2*margin + 3*step + 50 = bodyW - pilotW + 50` (faltam ~30px escalados)
- Correcao: `bodyW + 50` alinha com o comportamento do `updateGroundInGroup`
