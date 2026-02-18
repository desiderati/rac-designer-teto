
# Atualização do Modelo 3D — Terreno Real com Níveis

## Diagnóstico

### Estado Atual do Modelo 3D

O componente `Ground()` em `House3DScene.tsx` renderiza apenas um plano plano simples a `y = -1`, sem qualquer relação com os dados reais de nível (nivel) definidos pelo usuário no editor.

### Dados Disponíveis

O `HouseManager` já possui os níveis dos 4 pilotis de canto:

```text
piloti_0_0 (A1) → canto frontal-esquerdo
piloti_3_0 (A4) → canto frontal-direito
piloti_0_2 (C1) → canto traseiro-esquerdo
piloti_3_2 (C4) → canto traseiro-direito
```

Cada `PilotiData` tem `nivel` (em metros) e `height` (em metros). O nível representa a profundidade do terreno abaixo da base da casa — portanto, o terreno fica a `HOUSE_BASE_Y - pilotiHeight + nivel * PILOTI_BASE_HEIGHT * fator` na coordenada Y do modelo 3D.

### Relação Terreno × Piloti

No sistema 2D:
- A base da casa está no topo dos pilotis (`HOUSE_BASE_Y`)
- O terreno intercepta o piloti a `nivel * 100 * scale` abaixo do topo do piloti
- Portanto: `terrainY = HOUSE_BASE_Y - pilotiHeight + nivel * pilotiScale`

No sistema 3D (adaptado):
- `HOUSE_BASE_Y = PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE = 30`
- `pilotiHeight = PILOTI_BASE_HEIGHT * data.height` (ex: 1.0m → 30, 2.0m → 60)
- `terrainOffset = nivel * PILOTI_BASE_HEIGHT` (ex: nivel=0.2 → 0.2 * 30 = 6)
- `terrainY_at_corner = HOUSE_BASE_Y - pilotiHeight + terrainOffset`

A casa sempre sobe `HOUSE_BASE_Y` unidades do terreno, mas o terreno pode estar em alturas diferentes em cada canto.

---

## O Que Será Implementado

### 1. Passagem do dado `pilotis` completo já existe

O `House3DViewer` já sincroniza e passa `pilotis` (com `nivel` e `height`) para `House3DScene`. Nenhuma alteração necessária no `House3DViewer.tsx`.

### 2. Função de cálculo de altura do terreno em cada canto

Em `House3DScene.tsx`, nova função pura:

```typescript
function getCornerTerrainY(pilotis: Record<string, PilotiData>, col: number, row: number): number {
  const id = `piloti_${col}_${row}`;
  const data = pilotis[id] ?? { height: 1.0, nivel: 0.2 };
  const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
  const terrainOffset = data.nivel * PILOTI_BASE_HEIGHT;
  return HOUSE_BASE_Y - pilotiHeight + terrainOffset;
}
```

Os 4 cantos do grid 3×4 de pilotis são col=0,row=0 (frente-esq), col=3,row=0 (frente-dir), col=0,row=2 (trás-esq), col=3,row=2 (trás-dir).

### 3. Componente `Terrain` (substitui `Ground`)

Um novo componente `Terrain` que:

- Recebe os 4 níveis dos cantos e o tipo da casa
- Cria uma malha 3D usando `THREE.BufferGeometry` com interpolação bilinear das 4 alturas dos cantos
- A malha é maior que a casa (extensão de 50 unidades em cada lado), igual à lógica 2D
- O interior usa interpolação bilinear entre os 4 cantos para ser fiel ao modelo real
- Cor verde-terreno com opacidade

A malha do terreno tem a mesma forma do plano mas com alturas variáveis nos vértices:

```text
Frente (Z = +hd + extensão):
  Esquerda (X = -hw - ext) → terrainY(A1)
  Direita  (X = +hw + ext) → terrainY(A4)

Trás (Z = -hd - extensão):
  Esquerda (X = -hw - ext) → terrainY(C1)
  Direita  (X = +hw + ext) → terrainY(C4)
```

A geometria será um `PlaneGeometry` subdividido com vértices ajustados manualmente no eixo Y via `positionAttribute`, criando um plano inclinado que interpola bilinearmente entre os 4 cantos.

### 4. Ajuste dos Pilotis no Terreno

Atualmente, os pilotis têm altura fixa (`PILOTI_BASE_HEIGHT * data.height`) e seu centro fica em `HOUSE_BASE_Y - pilotiHeight / 2`. O topo sempre fica em `HOUSE_BASE_Y`.

Com o terreno real, os pilotis precisam ter o **fundo** tocando o terreno real em vez de flutuar. A posição do fundo do piloti no 3D deve coincidir com o `terrainY` interpolado para aquele pilar. Como os pilotis não são apenas de canto, a altura visual de cada piloti será:

```text
visualTop    = HOUSE_BASE_Y (fixo — a casa não muda de altura)
visualBottom = terrainY interpolado para (col, row)
visualHeight = visualTop - visualBottom
yCenter      = (visualTop + visualBottom) / 2
```

Isso requer interpolar o terrainY para cada piloti (não só os 4 cantos) usando interpolação bilinear dos 4 valores de canto. A função `getCornerTerrainY` retorna os valores dos cantos, e a interpolação bilinear distribui para os pilotis intermediários.

### 5. Linha de Terreno Nos Pilotis de Canto (Marcador Visual Opcional)

Não será necessária nenhuma marcação adicional — o terreno visual já deixará claro onde o solo intercepta os pilotis.

---

## Alterações Técnicas por Arquivo

### `src/components/rac-editor/House3DScene.tsx`

**Mudanças:**

1. Adicionar função `interpolateTerrain(pilotis, col, row)` — interpola bilinearmente o Y do terreno para qualquer posição da grade
2. Substituir componente `Ground()` por `Terrain({ pilotis })`:
   - Criar `BufferGeometry` com grade NxM de vértices
   - Calcular Y de cada vértice via interpolação bilinear
   - Aplicar `computeVertexNormals()` para iluminação correta
   - Material: verde-acinzentado terroso com `receiveShadow`
3. Atualizar `Piloti3D` para receber o `terrainY` real (via interpolação) e ajustar:
   - `pilotiHeight` = `HOUSE_BASE_Y - terrainY` (topo fixo em HOUSE_BASE_Y, base no terreno)
   - `yCenter` = `(HOUSE_BASE_Y + terrainY) / 2`
4. Atualizar `House3DScene` para passar pilotis completos para `Piloti3D` e `Terrain`

**Nenhuma outra mudança é necessária:**
- `House3DViewer.tsx` já sincroniza `pilotis` com nivel — sem alteração
- `house-manager.ts` — sem alteração
- `House3DScene` props já têm `pilotis: Record<string, PilotiData>` com nivel

---

## Detalhes da Geometria do Terreno

```text
Extensão lateral: EXT = 50 (unidades 3D)
Largura total: HOUSE_WIDTH + 2*EXT
Profundidade total: HOUSE_DEPTH + 2*EXT

Grid de subdivisão: 20x20 vértices (suficiente para interpolação suave)

Para cada vértice (i, j) no grid NxN:
  u = i / (N-1)   → 0 = esquerda, 1 = direita  (eixo X)
  v = j / (N-1)   → 0 = frente,   1 = trás      (eixo Z)
  
  y(u, v) = (1-u)*(1-v) * yA1
           + u*(1-v)     * yA4
           + (1-u)*v     * yC1
           + u*v         * yC4

Onde yA1..yC4 são os terrainY dos 4 cantos calculados via piloti data.
```

Esta é exatamente a mesma interpolação bilinear usada em `calculateAndApplyRecommendedHeights()` do HouseManager — garantindo consistência entre o terreno 3D e o sistema de cálculo de alturas.

---

## Resumo das Mudanças

| Arquivo | Tipo | Descrição |
|---|---|---|
| `House3DScene.tsx` | Modificação | Substituir Ground por Terrain com interpolação, ajustar Piloti3D com terrainY real |
| `House3DViewer.tsx` | Nenhuma | Já passa pilotis com nivel corretamente |
| `house-manager.ts` | Nenhuma | Já tem os dados necessários |
