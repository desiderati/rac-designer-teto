

# Duas Correcoes: Nivel sem Arredondamento + Terreno 50cm Maior na Insercao Inicial

## 1. Nao arredondar valores de nivel

Atualmente, `parseNivelText`, `clampNivel` e o label do maximo aplicam `Math.round(...*100)/100`. Isso sera removido para permitir valores decimais precisos.

### Arquivo: `src/components/rac-editor/PilotiEditor.tsx`

- **Linha 77** (`parseNivelText`): trocar `return Math.round(parsed * 100) / 100` por `return parsed`
- **Linha 81** (`clampNivel`): trocar `Math.round((pilotiHeight * 3 / 4) * 100) / 100` por `pilotiHeight * 3 / 4`
- **Linha 312** (label `maxNivel`): trocar `Math.round((tempHeight * 3 / 4) * 100) / 100` por `tempHeight * 3 / 4`

## 2. Terreno 50cm maior em cada lado na insercao inicial

Na insercao inicial das vistas (frontal/traseira e laterais), o terreno comeca em `leftX = 0` e termina em `rightX = largura_da_vista`. Isso faz com que o terreno fique exatamente do tamanho da vista, sem extensao lateral.

Ja no `updateGroundInGroup` (edicao), o terreno usa `viewLeftX - 50` e `viewRightX + 50`, que e o comportamento correto.

A correcao e aplicar a mesma extensao de 50px (equivalente a 50cm) na insercao inicial:

### Arquivo: `src/lib/canvas-utils.ts`

**`createHouseFrontBack` (linhas 729, 731):**
- Trocar `leftX = 0` por `leftX = -50 * s`
- Trocar `rightX = 2 * margin + 3 * step` por `rightX = 2 * margin + 3 * step + 50 * s`

**`createHouseSide` (linhas 891, 893):**
- Trocar `leftX = 0` por `leftX = -50 * s`
- Trocar `rightX = sideWidth` por `rightX = sideWidth + 50 * s`

Nota: A extensao usa `50 * s` (escalada) para manter consistencia com o sistema de coordenadas. No `updateGroundInGroup`, a extensao ja usa `- 50` e `+ 50` sem escala porque opera em coordenadas locais do grupo ja escaladas.

