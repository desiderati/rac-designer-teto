

## Correcao do leftX e rightX no updateGroundInGroup

### Problema

Na funcao `updateGroundInGroup` (linha 1142-1144 de `canvas-utils.ts`), as variaveis `leftX` e `rightX` estao recebendo o `left` dos retangulos dos pilotis de canto, mas deveriam receber os limites extremos da vista (como e feito na criacao inicial).

Na criacao inicial:
- Front/Back: `leftX = 0`, `rightX = 2 * margin + 3 * step` (largura total)
- Side: `leftX = 0`, `rightX = sideWidth` (largura total)

No update: `leftX = leftRect.left` e `rightX = rightRect.left` (posicao do piloti, nao a borda da vista)

### Solucao

**Arquivo: `src/lib/canvas-utils.ts`** - funcao `updateGroundInGroup`

Substituir o calculo de `leftX` e `rightX` (linhas 1142-1145) para derivar os limites da vista a partir dos objetos estruturais do grupo:

1. Encontrar o objeto da parede (`isHouseBody` ou `isHouseRoof`) ou, alternativamente, o retangulo que define a largura da vista
2. Usar `left = 0` como `leftX` (o grupo sempre comeca em 0 internamente) e `left + width` do objeto mais largo como `rightX`
3. Como fallback, varrer todos os objetos nao-ground do grupo e pegar `min(left)` e `max(left + width)` para determinar os extremos

Codigo aproximado:
```typescript
// Encontrar limites da vista (parede ou telhado definem a largura)
const structuralObjs = objects.filter((o: any) => !o.isGroundElement && !o.isPilotiRect && !o.isPilotiLabel);
let viewLeftX = Infinity;
let viewRightX = -Infinity;
for (const o of structuralObjs) {
  const oLeft = (o as any).left ?? 0;
  const oWidth = (o as any).width ?? 0;
  if (oLeft < viewLeftX) viewLeftX = oLeft;
  if (oLeft + oWidth > viewRightX) viewRightX = oLeft + oWidth;
}
if (!isFinite(viewLeftX)) viewLeftX = 0;
if (!isFinite(viewRightX)) viewRightX = rightCenterX + (rightRect.width ?? 30) / 2;

const leftX = viewLeftX;
const rightX = viewRightX;
```

As variaveis `leftCenterX` e `rightCenterX` permanecem como estao (centro dos pilotis de canto).

### Secao tecnica

- Linhas afetadas: 1142-1145 em `src/lib/canvas-utils.ts`
- Apenas a funcao `updateGroundInGroup` precisa ser alterada
- A criacao inicial ja esta correta
- O `generateGroundLinePoints` recebe `leftX` e `rightX` como extremos da polyline, entao a correcao garante que o terreno cobre toda a largura da vista

