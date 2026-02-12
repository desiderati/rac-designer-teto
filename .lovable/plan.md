

# Diagnostico: updateGroundInGroup nao capta coordenadas corretas dos pilotis

## O que esta acontecendo

O problema esta na cadeia de chamadas dentro de `updatePiloti` no `house-manager.ts` (linhas 563-572):

```text
1. updatePilotiHeight(group, pilotiId, height)
   |-> Modifica o rect do piloti (height, top do label, etc.)
   |-> Chama refreshHouseGroupRendering(group)    <-- COORDENADAS MUDAM AQUI
       |-> group.remove(...objects)
       |-> group.add(...objects)
       |-> _calcBounds / _updateObjectsCoords
   
2. updatePilotiMaster(group, pilotiId, isMaster, nivel)
   |-> Atualiza pilotiNivel e visual do piloti

3. updateGroundInGroup(group)                     <-- LE COORDENADAS JA ALTERADAS
   |-> leftRect.left, leftRect.top  <-- VALORES ERRADOS
   |-> Cria novos elementos de terreno com posicoes erradas
   |-> Chama refreshHouseGroupRendering(group)    <-- COORDENADAS MUDAM DE NOVO
```

### Causa raiz: `refreshHouseGroupRendering`

A funcao `refreshHouseGroupRendering` (linha 424-451 de canvas-utils.ts) faz:

1. `group.remove(...objects)` -- remove todos os filhos do grupo
2. `group.add(...objects)` -- re-adiciona ao grupo

No Fabric.js v6, quando voce faz `group.add()`, o Fabric transforma as coordenadas dos objetos do espaco global para o espaco local do grupo. Porem, os objetos que foram removidos ja estavam em coordenadas locais. Isso faz com que o Fabric aplique a transformacao duas vezes, deslocando as coordenadas internas dos filhos.

Alem disso, `_calcBounds()` e `_updateObjectsCoords()` recalculam o centro do grupo e ajustam todas as coordenadas dos filhos. Se o piloti cresceu (mudou de altura), o bounding box do grupo muda, o centro desloca, e TODOS os filhos recebem coordenadas ajustadas.

Resultado: quando `updateGroundInGroup` le `leftRect.left` e `leftRect.top`, esses valores ja foram transformados/deslocados pelo `refreshHouseGroupRendering` chamado dentro de `updatePilotiHeight`.

### Problema adicional: altura nao atualiza o terreno

Olhando as linhas 569-572 do house-manager.ts:

```typescript
if (data.nivel !== undefined && CORNER_PILOTI_IDS.includes(pilotiId)) {
  updateGroundInGroup(group);
}
```

O terreno so e atualizado quando o **nivel** muda. Mas a mudanca de **altura** tambem afeta o terreno, pois a posicao Y do terreno depende de `leftRect.top + nivel * 100 * scale`, e o `top` do piloti muda quando a altura muda. Ou seja, mudar a altura do piloti sem atualizar o terreno deixa o solo desalinhado.

## Solucao proposta

### 1. Evitar multiplos `refreshHouseGroupRendering` na mesma operacao

Modificar `updatePilotiHeight` para **nao** chamar `refreshHouseGroupRendering` no final (linha 414). Modificar `updateGroundInGroup` para **nao** chamar `refreshHouseGroupRendering` no final (linha 1242).

O `updatePiloti` no house-manager.ts ficara responsavel por chamar `refreshHouseGroupRendering` uma unica vez no final, depois de todas as sub-operacoes.

### 2. Atualizar o terreno tambem quando a altura muda

No `updatePiloti`, chamar `updateGroundInGroup` para qualquer piloti de canto quando a altura OU o nivel mudar.

### 3. Chamar `refreshHouseGroupRendering` uma unica vez ao final

Remover as chamadas intermediarias e adicionar uma unica chamada ao final do loop de views em `updatePiloti`.

## Detalhes tecnicos

### Arquivo: `src/lib/canvas-utils.ts`

**`updatePilotiHeight` (linha 414):** Remover a chamada `refreshHouseGroupRendering(group)`. Manter apenas `group.canvas?.requestRenderAll()`.

**`updateGroundInGroup` (linha 1242):** Remover a chamada `refreshHouseGroupRendering(group)`.

### Arquivo: `src/lib/house-manager.ts`

**`updatePiloti` (linhas 547-574):** Reestruturar o loop de views para:

```typescript
for (const instance of instances) {
  const group = instance.group;

  // 1. Atualizar masters anteriores (se necessario)
  if (clearedMasters.length) {
    clearedMasters.forEach((id) => {
      const p = this.house!.pilotis[id];
      updatePilotiMaster(group, id, p.isMaster, p.nivel);
    });
  }

  // 2. Atualizar altura do piloti alvo
  const newData = this.house!.pilotis[pilotiId];
  if (data.height !== undefined) {
    updatePilotiHeight(group, pilotiId, newData.height);
  }

  // 3. Atualizar master/nivel do piloti alvo
  if (data.isMaster !== undefined || data.nivel !== undefined) {
    updatePilotiMaster(group, pilotiId, newData.isMaster, newData.nivel);
  }

  // 4. Atualizar terreno se altura OU nivel mudou em piloti de canto
  if ((data.height !== undefined || data.nivel !== undefined) 
      && CORNER_PILOTI_IDS.includes(pilotiId)) {
    updateGroundInGroup(group);
  }

  // 5. Refresh UNICO ao final de todas as operacoes
  refreshHouseGroupRendering(group);
}
```

Isso garante que:
- As coordenadas internas dos pilotis estao estaveis quando `updateGroundInGroup` as le
- O terreno e recriado com base nas coordenadas corretas
- Um unico `refreshHouseGroupRendering` ao final consolida todas as mudancas

