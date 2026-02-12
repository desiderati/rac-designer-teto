

# Correção: updateGroundInGroup corrompe coordenadas ao reordenar Z

## Diagnóstico

Mesmo após remover as chamadas intermediárias de `refreshHouseGroupRendering`, o problema persiste porque o próprio `updateGroundInGroup` faz um ciclo de `remove/add` para reorganizar a ordem Z (linhas 1232-1239 de canvas-utils.ts):

```text
updateGroundInGroup:
  1. Remove ground antigos (ok)
  2. Lê coordenadas dos pilotis (ok, ainda corretas)
  3. Cria novos elementos de terreno (ok)
  4. group.remove(...normal)       <-- CORROMPE coordenadas
  5. group.add(groundBack, normal, groundFront)  <-- Coordenadas já erradas
  
Depois:
  refreshHouseGroupRendering:
  6. group.remove(...tudo)         <-- Corrompe de novo
  7. group.add(...tudo)            <-- Dupla transformação
```

O `group.remove()` + `group.add()` no Fabric.js v6 transforma coordenadas entre espaço local e global. Quando os objetos já estão em coordenadas locais, o `add()` aplica a transformação novamente, deslocando tudo.

## Solução

Eliminar o ciclo de remove/add de objetos normais dentro de `updateGroundInGroup`. Em vez disso, apenas adicionar os novos elementos de terreno ao grupo e delegar a reorganização Z para `refreshHouseGroupRendering`, que já faz um remove/add completo.

Para garantir a ordem Z correta, modificar `refreshHouseGroupRendering` para ordenar os objetos antes de re-adicioná-los: ground fill/line no fundo, objetos normais no meio, markers/labels no topo.

## Detalhes técnicos

### Arquivo: `src/lib/canvas-utils.ts`

**`updateGroundInGroup` (linhas 1227-1241):** Substituir toda a lógica de reempilhamento por um simples `group.add(...)` dos novos elementos:

```typescript
// Antes (problemático):
const normal = group.getObjects().filter(...);
if (normal.length) group.remove(...normal);
if (groundBack.length) group.add(...groundBack);
if (normal.length) group.add(...normal);
if (groundFront.length) group.add(...groundFront);

// Depois (corrigido):
if (groundBack.length) group.add(...(groundBack as any));
if (groundFront.length) group.add(...(groundFront as any));
```

Os elementos serão adicionados ao final da lista. A ordem Z será corrigida pelo `refreshHouseGroupRendering` na sequência.

**`refreshHouseGroupRendering` (linhas 423-450):** Adicionar ordenação Z antes de re-adicionar os objetos:

```typescript
export function refreshHouseGroupRendering(group: Group): void {
  (group as any).objectCaching = false;
  const objects = group.getObjects();

  objects.forEach((obj: any) => {
    obj.objectCaching = false;
    obj.dirty = true;
    obj.setCoords?.();
  });

  group.remove(...objects);

  // Ordenar: ground fill/line -> normais -> markers/labels
  const groundBack = objects.filter((o: any) => o.isGroundFill || o.isGroundLine);
  const groundFront = objects.filter((o: any) => o.isNivelMarker || o.isNivelLabel);
  const normal = objects.filter((o: any) => !o.isGroundElement);
  const sorted = [...groundBack, ...normal, ...groundFront];

  group.add(...sorted);

  // ... resto da função (Polyline/Polygon, cache, bounds)
}
```

### Arquivo: `src/lib/house-manager.ts`

Nenhuma alteração necessária — a estrutura do `updatePiloti` com refresh único ao final permanece como está.

## Resumo do fluxo corrigido

```text
updatePiloti:
  1. updatePilotiHeight  -> modifica rect (sem remove/add)
  2. updatePilotiMaster  -> modifica visual (sem remove/add)
  3. updateGroundInGroup -> remove ground antigo, lê coords (corretas!),
                           cria ground novo, adiciona ao grupo (sem tocar nos normais)
  4. refreshHouseGroupRendering -> remove tudo, ordena por Z, re-adiciona uma única vez
```

Coordenadas só são transformadas uma vez, no passo 4, garantindo estabilidade.

