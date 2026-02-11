

# Corrigir bug: Editar Objeto so abre uma vez

## Problema raiz

Quando o usuario edita um objeto (wall) pela primeira vez e aplica um nome, o objeto `Rect` e envolvido em um `Group` com `myType === 'wall'`. No proximo duplo-clique, o alvo e um `Group`, nao mais um `Rect`. A condicao na linha 816 do `Canvas.tsx` exige `target.type === 'rect'`, entao o grupo nunca e reconhecido como wall.

## Correcao

### `src/components/rac-editor/Canvas.tsx`

No handler `mouse:dblclick` (linha ~815), expandir a condicao para aceitar tambem grupos com `myType === 'wall'`:

**Antes:**
```text
if (target.type === 'rect' && (target as any).myType === 'wall') {
  handleObjectNameSelection(target as Rect);
  return;
}
```

**Depois:**
```text
// Wall pode ser um Rect solo ou um Group (quando ja tem label)
if ((target as any).myType === 'wall') {
  if (target.type === 'rect') {
    handleObjectNameSelection(target as Rect);
  } else if (target.type === 'group') {
    // Encontrar o Rect dentro do grupo
    const wallRect = (target as Group).getObjects().find(
      (o: any) => o.type === 'rect'
    ) as Rect | undefined;
    if (wallRect) {
      handleObjectNameSelection(wallRect);
    }
  }
  return;
}
```

Isso garante que, independente de o wall estar solo ou agrupado com label, o duplo-clique abre o editor corretamente.

### `src/components/rac-editor/Canvas.tsx` - `handleObjectNameSelection`

Na funcao `handleObjectNameSelection` (linha ~724), a busca pelo label existente precisa tambem verificar dentro do grupo pai:

**Antes (linha 725-728):**
```text
const existingLabel = canvas.getObjects().find(
  (obj: any) => obj.myType === 'wallLabel' && obj.labelFor === wall
) as IText | undefined;
const currentValue = existingLabel?.text?.trim() || '';
```

**Depois:**
```text
// Verificar label no grupo pai (se o wall ja foi agrupado)
const parentGroup = (wall as any)._group || (wall as any).group;
let currentValue = '';
if (parentGroup) {
  const existingLabel = parentGroup.getObjects().find(
    (o: any) => o.myType === 'wallLabel'
  ) as IText | undefined;
  currentValue = existingLabel?.text?.trim() || '';
} else {
  const existingLabel = canvas.getObjects().find(
    (obj: any) => obj.myType === 'wallLabel' && obj.labelFor === wall
  ) as IText | undefined;
  currentValue = existingLabel?.text?.trim() || '';
}
```

Tambem ajustar o calculo de posicao na tela para usar as coordenadas do grupo quando aplicavel (left/top do grupo, nao do rect interno que agora tem coordenadas relativas).

### Posicao do popup

Quando o wall esta dentro de um grupo, suas coordenadas `left`/`top` sao relativas ao grupo. O `screenX`/`screenY` deve usar as coordenadas do grupo pai:

```text
const wallLeft = parentGroup ? (parentGroup.left || 0) : (wall.left || 0);
const wallTop = parentGroup ? (parentGroup.top || 0) : (wall.top || 0);
```

## Resumo das alteracoes

- **1 arquivo**: `src/components/rac-editor/Canvas.tsx`
  - Expandir condicao de duplo-clique para aceitar groups com `myType === 'wall'`
  - Ajustar busca de label existente para verificar dentro do grupo
  - Ajustar calculo de posicao para usar coordenadas do grupo quando aplicavel

