
# Refatoração Completa do Modelo 3D

## Diagnóstico dos Problemas Atuais

### 1. Telhado Incorreto
O telhado atual (`Roof`) é um prisma triangular simples com pico centralizado — igual a uma casa convencional. A vista frontal/traseira real tem geometria de 3 seções:
- **Diagonal Esquerda (40%):** `diagW = 244 * s` de largura, triangular
- **Capela Central (20%):** `chapelW = 122 * s`, forma de trapézio/pirâmide
- **Diagonal Direita (40%):** espelho da esquerda

As medidas exatas de `canvas-utils.ts`:
```
diagH1 = 213 * s  → altura da quina lateral da diagonal (do topo da parede)
diagH2 = 261 * s  → altura total da seção diagonal (distância ao pico superior)
diagW  = 244 * s  → largura de cada diagonal (40% da largura total)
chapelW = 122 * s → largura da chapel (20% da largura total)
bodyH  = 273 * s  → altura da parede
```

O pico da chapel está a `0` no sistema de coordenadas frontal (topo absoluto). Os cantos das diagonais estão a `bodyH - diagH2` de altura. O ápice é centralizado no eixo X.

### 2. Terreno Incorreto
O problema na geometria do terreno é que a variável `j` em `PlaneGeometry` mapeia `j=0` para o topo do plano (Y positivo antes da rotação), que após a rotação `-Math.PI/2` se torna a frente (`+Z` no mundo). Mas o `v` calculado como `j / (N-1)` mapeia `j=0 → v=0 → frente`, enquanto a interpolação trata `v=0` como frente (A1/A4). Isso parece correto. Porém, há um bug sutil: o índice `idx = j * N + i` não é o índice correto para `PlaneGeometry` — o `PlaneGeometry` com `N-1` segmentos tem `N` vértices por lado, e o índice correto é exatamente `j * N + i`, então isso está correto.

O problema real é que `TERRAIN_EXT = 50` está em unidades 3D, enquanto as dimensões da casa estão em torno de `HOUSE_WIDTH = 610 * 0.6 * 0.5 = 183` e `HOUSE_DEPTH = 300 * 0.6 * 0.5 = 90`. A extensão de `50` unidades é muito pequena para o scale total.

Além disso, `PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE = 30` e `HOUSE_BASE_Y = 30`. Com `pilotiHeight = PILOTI_BASE_HEIGHT * data.height = 30 * 1.0 = 30` e `terrainOffset = 0.2 * 30 = 6`:
- `terrainY = 30 - 30 + 6 = 6`

Isso coloca o terreno a `y=6`, mas o `HOUSE_BASE_Y = 30`. Os pilotis têm `visualHeight = 30 - 6 = 24`. Parece correto matematicamente, mas o terreno pode estar sendo renderizado acima ou abaixo do esperado visualmente.

O maior problema é que após a rotação de `-Math.PI/2` no eixo X do `PlaneGeometry`, o eixo que apontava em `+Z` (normal do plano, onde colocamos a altura com `setZ`) aponta agora para `+Y` mundial. Isso está correto. Mas o mapeamento `j=0 → frente` pode estar invertido em relação à orientação esperada visualmente.

### 3. Portas e Janelas
As posições em `initializeDefaultElements` foram definidas com medidas que não correspondem mais à geometria atual das vistas reformuladas.

---

## O Que Será Refatorado

### Arquivo Único: `src/components/rac-editor/House3DScene.tsx`

---

## Seção 1: Dimensões e Constantes

Rever todas as constantes com base nas medidas reais de `canvas-utils.ts`:

```
BASE_TOP_WIDTH = 610
BASE_TOP_HEIGHT = 300
SCALE_2D = 0.6
MODEL_SCALE = 0.5

HOUSE_WIDTH  = 610 * 0.6 * 0.5 = 183
HOUSE_DEPTH  = 300 * 0.6 * 0.5 = 90
BODY_HEIGHT  = 273 * 0.6 * 0.5 = 81.9  ← bodyH da canvas-utils

Telhado (de canvas-utils):
diagH1  = 213 * 0.6 * 0.5 = 63.9
diagH2  = 261 * 0.6 * 0.5 = 78.3
diagW   = 244 * 0.6 * 0.5 = 73.2
chapelW = 122 * 0.6 * 0.5 = 36.6

Pilotis:
COLUMN_DISTANCE  = 155 * 0.6 * 0.5 = 46.5
ROW_DISTANCE     = 135 * 0.6 * 0.5 = 40.5
PILOTI_RADIUS    = 15 * 0.6 * 0.5 = 4.5
PILOTI_BASE_HEIGHT = 60 * 0.5 = 30
HOUSE_BASE_Y       = 30

TERRAIN_EXT = 80  ← aumentar para ser visualmente proporcional
```

---

## Seção 2: Novo Telhado (Roof)

A geometria correta em 3D do telhado da vista frontal/traseira:

```text
Largura total: HOUSE_WIDTH = 183
  diagW  = 73.2  (40%)
  chapelW = 36.6 (20%)
  diagW  = 73.2  (40%)

Profundidade: HOUSE_DEPTH = 90

Alturas (em Y, relativo ao topo da parede = HOUSE_BASE_Y + BODY_HEIGHT):
  Quinas laterais: diagH2 - diagH1 = 78.3 - 63.9 = 14.4 acima da parede
  Picos internos (cantos chapel): diagH2 = 78.3 acima da parede  
  Pico do centro da chapel: diagH2 = 78.3 acima da parede
```

Simplificando: o contorno frontal do telhado é:
```
(-hw, 0)                    → canto esquerdo (base da diagonal esq)
(-hw + diagW, diagH2-diagH1) → quina interna da diagonal esq = (−hw+73.2, +14.4) 
(0, diagH2-diagH1)           → base da chapel = (+0, +14.4) ... não, o pico da chapel é em y=0 no sistema frontal
```

Reanalisando a polyline de `bodyStroke`:
```
(0, bodyH - diagH1)        → canto esq, está a diagH1=63.9 do topo da parede
(bodyW/2, 0)               → pico central (topo absoluto)
(bodyW, bodyH - diagH1)    → canto dir
(bodyW, bodyH)             → base dir
(0, bodyH)                 → base esq
```

Ou seja: o contorno frontal **completo** é um pentágono onde:
- Os dois cantos laterais inferiores estão em `y = bodyH` (base)
- As "quinas" laterais superiores estão em `y = bodyH - diagH1`
- O pico central está em `y = 0`

O pico central está a `diagH1 = 63.9` acima dos cantos laterais, e os cantos laterais estão a `bodyH - diagH1 = 81.9 - 63.9 = 18` da base.

Mas há a estrutura de 3 seções (fill diferente para chapel central). A silhueta externa do telhado é o pentágono acima. A "chapel" é a seção central com fill cinza-médio — mas na visão 3D, o que importa é a **forma volumétrica do telhado**.

A forma 3D do telhado é:
- Um "ridge" (cumeeira) horizontal no centro da profundidade (`z=0`), com o pico em `y = diagH2 - diagH1 + diagH1 = diagH2` acima da base da parede? Não.

Voltando ao diagrama frontal: o pico aparece em Y=0, as bases das diagonais em `bodyH - diagH1`. Isso mapeia para 3D:
- Y do pico = `HOUSE_BASE_Y + BODY_HEIGHT + DIAG_H1` (diagH1 acima do topo da parede)
- Os cantos laterais ficam NO TOPO DA PAREDE: `HOUSE_BASE_Y + BODY_HEIGHT`

A estrutura 3D do telhado (extrusão frontal→traseiro):
- **Frente (z = +hd) e Trás (z = -hd)**: perfil pentagonal idêntico
- As "faces do telhado" conectam frente e trás
- Não há ridge horizontal simples — o pico corre do centro frontal ao centro traseiro

A forma volumétrica é uma **casca de pirâmide pentagonal extrudida**:

```text
Vista Frontal (5 pontos no plano Z=+hd):
  P1: (-hw, baseY)         → canto inf-esq
  P2: (-hw, wallTopY)      → canto sup-esq  
  P3: (0, peakY)           → pico central
  P4: (hw, wallTopY)       → canto sup-dir
  P5: (hw, baseY)          → canto inf-dir

Vista Traseira (5 pontos no plano Z=-hd): espelho dos mesmos pontos

Onde:
  baseY    = HOUSE_BASE_Y + BODY_HEIGHT (base do telhado = topo da parede)
  wallTopY = baseY + (diagH2 - diagH1)  ← "quina" do telhado nas bordas laterais
  peakY    = baseY + diagH1             ← pico central

Simplificando com diagH1 e diagH2:
  diagH2 - diagH1 = 78.3 - 63.9 = 14.4  → altura extra dos cantos laterais
  diagH1 = 63.9                          → altura do pico acima dos cantos
```

Então as faces do telhado são:
1. **Face inclinada esquerda** (front+back): triângulo ou trapezoide de `(-hw, wallTopY)` a `(0, peakY)` nas faces Z=+hd e Z=-hd
2. **Face inclinada direita** (front+back): espelho
3. **Topo esquerdo** (lateral): conecta `(-hw, wallTopY, +hd)` a `(-hw, wallTopY, -hd)` (borda horizontal)
4. **Topo direito** (lateral): idem para `(hw, wallTopY, ±hd)`
5. **Cumeeira** (ridge): conecta `(0, peakY, +hd)` a `(0, peakY, -hd)`

Essa é uma forma de "telhado de duas águas" com pico central — mas com os cantos laterais elevados (não retos). Geometricamente, são 4 faces triangulares/trapezoidais + 2 faces triangulares nas extremidades.

---

## Seção 3: Novo Terreno

### Correção da Orientação

A rotação `-Math.PI/2` no eixo X do `PlaneGeometry` faz:
- X do plano → X do mundo (OK)
- Y do plano → Z do mundo (frente/trás)
- Z do plano (normal) → Y do mundo (altura) ← onde colocamos `setZ`

No `PlaneGeometry` sem rotação:
- `i=0` → `x = -totalWidth/2` (esquerda)
- `j=0` → `y = +totalDepth/2` (topo do plano, que após rotação → Z+ = frente)

Então `j=0` → frente (`+Z`) → pilotis linha A (row=0), ✓

O mapeamento `v = j/(N-1)` com `j=0→frente(A), j=N-1→trás(C)` está correto.

### Correção da Extensão

Aumentar `TERRAIN_EXT` de `50` para `80` para ser mais proporcional à casa (que tem `183×90`).

### Correção do Cálculo terrainY

O atual `getCornerTerrainY`:
```typescript
const pilotiHeight = PILOTI_BASE_HEIGHT * data.height;
const terrainOffset = data.nivel * PILOTI_BASE_HEIGHT;
return HOUSE_BASE_Y - pilotiHeight + terrainOffset;
```

Com defaults: `30 - 30 + 6 = 6`. O `HOUSE_BASE_Y = 30`. Então o terreno fica em y=6, e os pilotis têm altura visual de `30 - 6 = 24`. Isso parece correto, mas visualmente o terreno pode aparecer "dentro" dos pilotis ao invés de "em volta" deles.

O problema real é que a altura do terreno deveria ser calculada usando a altura em metros e o nível em metros, não `PILOTI_BASE_HEIGHT` como fator de escala para o nível:

No sistema 2D: `nivelY = bodyH + nivel * 100 * s` (nível em metros × 100px/m × scale)
No sistema 3D: o nível deve mapear da mesma forma. Se `PILOTI_BASE_HEIGHT = 100px * s = 100 * 0.5 = 50`... mas `PILOTI_BASE_HEIGHT` foi definido como `60 * MODEL_SCALE = 30`, não 50.

A fórmula correta para `terrainY` deve ser:
```
nivelY_3D = nivel_meters * PILOTI_BASE_HEIGHT / 1.0
```
O piloti de 1.0m tem `PILOTI_BASE_HEIGHT = 30` de altura. Então 1m = 30 unidades 3D.
O nivel de 0.2m = 0.2 * 30 = 6 unidades 3D abaixo do topo do piloti.

`terrainY = HOUSE_BASE_Y - nivel * 30 / 1.0` ← mais simples e direto.

Porém a lógica atual usa `pilotiHeight` diferente de `HOUSE_BASE_Y`. Se `data.height = 1.0` e `PILOTI_BASE_HEIGHT = 30`:
- `pilotiHeight = 30 * 1.0 = 30 = HOUSE_BASE_Y` ✓ (coincide apenas quando height=1.0)
- Com `data.height = 2.0`: `pilotiHeight = 60 > HOUSE_BASE_Y = 30` → terrainY negativo!

Esse é o bug: quando o piloti é mais alto que o padrão de 1.0m, o terreno fica abaixo de y=0, o que é incorreto. O terreno deveria simplesmente ficar a `nivel * altura_por_metro` abaixo do topo do piloti (que sempre é `HOUSE_BASE_Y`).

A fórmula correta:
```typescript
// nivel é em metros, HOUSE_BASE_Y é o topo do piloti
// 1 metro = PILOTI_BASE_HEIGHT / 1.0 = 30 unidades 3D
const METERS_TO_3D = PILOTI_BASE_HEIGHT; // 30 unidades por metro
terrainY = HOUSE_BASE_Y - data.nivel * METERS_TO_3D;
```

Isso é independente da altura do piloti — o nível é sempre em relação ao topo (base da casa).

---

## Seção 4: Portas e Janelas (HouseElement3D)

O posicionamento atual calcula `yOffset` a partir do topo do corpo da casa (`HOUSE_BASE_Y + HOUSE_HEIGHT`). As posições em `initializeDefaultElements` foram definidas com medidas antigas.

Dado que o componente `HouseElement3D` usa `element.x`, `element.y`, `element.width`, `element.height` vindos do `HouseManager`, e esses dados são gerenciados pelo `initializeDefaultElements` em `house-manager.ts`, a lógica de posicionamento no 3D precisa ser consistente com a geometria das vistas 2D.

**O posicionamento atual no 3D para face 'front':**
```typescript
position = [hw - xOffset - elementWidth / 2, yPos, hd + depth / 2];
```

O X é invertido (começa do direito para o esquerdo). Mas na vista frontal 2D, `x=0` é o canto esquerdo da casa e aumenta para a direita. No 3D, `x=-hw` é a esquerda e `x=hw` é a direita. Portanto `xOffset` cresce da esquerda → direita, mas o 3D usa `hw - xOffset`, que cresce da direita → esquerda. Esta inversão está documentada na memória de arquitetura como correta para alinhamento visual.

O `yOffset` parte do topo da parede para baixo. O `yPos` calculado:
```typescript
yPos = HOUSE_BASE_Y + HOUSE_HEIGHT - yOffset - elementHeight / 2
```
Com o novo `HOUSE_HEIGHT` sendo `BODY_HEIGHT = 81.9`, os elementos serão posicionados dentro da região de paredes verticais — correto.

Porém, para corrigir o posicionamento mais preciso dos elementos, as medidas em `initializeDefaultElements` precisam ser revisadas para refletir as novas dimensões. Mas essas medidas estão em `house-manager.ts`. **Não modificaremos `house-manager.ts` nesta entrega** — apenas a lógica de renderização 3D em `House3DScene.tsx`.

---

## Resumo das Mudanças no `House3DScene.tsx`

### 1. Constantes atualizadas
```
HOUSE_WIDTH  = 610 * 0.6 * 0.5 = 183
HOUSE_DEPTH  = 300 * 0.6 * 0.5 = 90
BODY_HEIGHT  = 273 * 0.6 * 0.5 ≈ 81.9
PILOTI_BASE_HEIGHT = 60 * 0.5 = 30
HOUSE_BASE_Y = PILOTI_BASE_HEIGHT = 30

Telhado:
DIAG_H1 = 213 * 0.6 * 0.5 = 63.9  ← altura do pico acima dos cantos laterais
DIAG_H2 = 261 * 0.6 * 0.5 = 78.3  ← altura total da seção diagonal
DIAG_W  = 244 * 0.6 * 0.5 = 73.2  ← largura de cada diagonal
CHAPEL_W = 122 * 0.6 * 0.5 = 36.6

TERRAIN_EXT = 80
```

### 2. Telhado — `Roof` reescrito
Geometria pentagonal extrudida com 3 seções visuais:
- 2 faces frontais/traseiras (pentágonos)
- 4 faces inclinadas do telhado (conectando frente e trás)
- Arestas com `<Line>` para definição visual

Perfil frontal/traseiro (5 pontos):
```
(-hw, 0, ±hd)         → canto inferior-esq (base da parede)
(-hw, wallEdgeH, ±hd) → quina lateral-esq do telhado  
(0,   peakH, ±hd)     → pico central
(hw,  wallEdgeH, ±hd) → quina lateral-dir do telhado
(hw,  0, ±hd)         → canto inferior-dir (base da parede)
```

Onde:
- `wallEdgeH = DIAG_H2 - DIAG_H1` (altura extra dos cantos = 14.4)
- `peakH = DIAG_H1` (altura do pico = 63.9)
- Tudo relativo a `roofBaseY = HOUSE_BASE_Y + BODY_HEIGHT`

### 3. Terreno — `getCornerTerrainY` corrigida
```typescript
function getCornerTerrainY(pilotis, col, row): number {
  const data = pilotis[`piloti_${col}_${row}`] ?? DEFAULT;
  // nivel em metros, PILOTI_BASE_HEIGHT unidades por metro
  return HOUSE_BASE_Y - data.nivel * PILOTI_BASE_HEIGHT;
}
```

### 4. `HouseBody` — BODY_HEIGHT corrigido
A constante `HOUSE_HEIGHT` será renomeada para usar o valor correto `BODY_HEIGHT = 273 * SCALE_2D * MODEL_SCALE`.

### 5. Tipo3 — parede esquerda removida corretamente
A lógica `isOpenLeft = houseType === 'tipo3'` continua, mas as arestas serão revisadas para a nova geometria.

### 6. `HouseElement3D` — sem alteração na lógica
A lógica de posicionamento permanece a mesma, pois depende dos dados vindos do `HouseManager`. O benefício da correção do `BODY_HEIGHT` já melhora o posicionamento automaticamente.

---

## Arquivos Alterados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/components/rac-editor/House3DScene.tsx` | Reescrita | Telhado pentagonal, terreno corrigido, constantes corretas |
| `src/lib/house-manager.ts` | Nenhuma | Dados de elementos mantidos sem alteração |
| `src/components/rac-editor/House3DViewer.tsx` | Nenhuma | Sincronização já correta |
