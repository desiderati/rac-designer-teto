
# Plano: Sincronização 2D/3D e Correção do Modelo 3D

## Problemas Identificados

### 1. Pilotis não atualizam no modelo 3D
O `House3DViewer` atualmente recria os pilotis com os dados do HouseManager, mas há um problema de sincronização:
- O `resetKey` do Canvas não é atualizado quando pilotis mudam
- O componente `Piloti3D` precisa receber um key único baseado nos dados para forçar re-render

### 2. Janelas e portas fora de proporção
Os valores atuais de dimensões relativas (0-1) estão sendo multiplicados por dimensões incorretas:
- `element.width * HOUSE_WIDTH` assume que `width=0.15` é 15% da largura total
- Mas na imagem de referência, as janelas são muito menores proporcionalmente
- A posição Y também está errada (usando `HOUSE_HEIGHT` mas deveria considerar a altura visual real)

### 3. Sincronização 2D → HouseManager
Atualmente, o HouseManager inicializa elementos padrão, mas:
- Não há sincronização bidirecional com o canvas 2D
- Quando o usuário insere no canvas vistas com janelas/portas no 2D, elas não são registradas no HouseManager

---

## Solução Proposta

### Parte 1: Correção das Dimensões do Modelo 3D

Recalcular as constantes e proporções para corresponder à imagem de referência:

```text
Dimensões base da casa 2D:
- Largura corpo: 610 * 0.6 = 366px (planta)
- Profundidade: 300 * 0.6 = 180px (planta)
- Altura corpo: 220 * 0.6 = 132px (elevação)
- Altura telhado: 80 * 0.6 = 48px

Proporções 3D corrigidas:
- Casa apoiada diretamente nos pilotis (HOUSE_BASE_Y = altura máxima dos pilotis)
- Pilotis estendem do chão (Y=0) até a base da casa
- Janelas/portas usam dimensões absolutas em pixels, não relativas
```

### Parte 2: Correção do Sistema de Elementos

#### Atual (problemático):
```typescript
interface HouseElement {
  width: number;  // 0-1 relativo (ex: 0.15)
  height: number; // 0-1 relativo (ex: 0.25)
}
```

#### Novo (dimensões absolutas em unidades da casa):
```typescript
interface HouseElement {
  width: number;  // Em pixels da casa 2D (ex: 90 = janela)
  height: number; // Em pixels da casa 2D (ex: 75 = janela)
}
```

Valores típicos da casa 2D:
- Janela: 90×75 px
- Porta: 100×180 px

### Parte 3: Sincronização Pilotis em Tempo Real

Atualizar o `House3DScene` para usar keys dinâmicos que forçam re-render:

```typescript
{Object.entries(pilotis).map(([id, data]) => (
  <Piloti3D 
    key={`${id}_${data.height}_${data.isMaster}`} // Key inclui dados
    pilotiId={id} 
    data={data} 
  />
))}
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/lib/house-manager.ts` | Alterar `initializeDefaultElements()` para usar dimensões absolutas em pixels |
| `src/components/rac-editor/House3DScene.tsx` | Recalcular dimensões da casa, corrigir posicionamento de pilotis e elementos, usar dimensões absolutas |
| `src/components/rac-editor/House3DViewer.tsx` | Ajustar sync para forçar atualização quando pilotis mudam |

---

## Detalhes Técnicos

### House3DScene.tsx - Correções

#### 1. Constantes base alinhadas com canvas-utils:
```typescript
// Dimensões base (matching 2D)
const BASE_TOP_WIDTH = 610;
const BASE_TOP_HEIGHT = 300;
const BODY_HEIGHT = 220;
const ROOF_HEIGHT = 80;
const SCALE_2D = 0.6; // Escala usada no canvas 2D

// Escala 3D (para tamanho visual adequado)
const MODEL_SCALE = 0.5;

// Dimensões finais 3D
const HOUSE_WIDTH = BASE_TOP_WIDTH * SCALE_2D * MODEL_SCALE;  // 183
const HOUSE_DEPTH = BASE_TOP_HEIGHT * SCALE_2D * MODEL_SCALE; // 90
const HOUSE_HEIGHT = BODY_HEIGHT * SCALE_2D * MODEL_SCALE;    // 66
```

#### 2. Base da casa apoiada nos pilotis:
```typescript
// A base da casa fica na altura máxima dos pilotis (altura 1.0)
const PILOTI_BASE_HEIGHT = 60 * MODEL_SCALE; // Altura de um piloti com height=1.0
const HOUSE_BASE_Y = PILOTI_BASE_HEIGHT; // Casa começa onde piloti de altura 1.0 termina

// Piloti com height > 1.0 empurra a casa para cima proporcionalmente
```

#### 3. Elementos com dimensões absolutas:
```typescript
function HouseElement3D({ element }: { element: HouseElement }) {
  // Converter de pixels 2D para unidades 3D
  const elementWidth = element.width * SCALE_2D * MODEL_SCALE;
  const elementHeight = element.height * SCALE_2D * MODEL_SCALE;
  
  // Posição X: converter de pixels 2D para 3D
  const xOffset = (element.x * SCALE_2D * MODEL_SCALE) - HOUSE_WIDTH / 2;
  
  // Posição Y: do topo do corpo da casa menos offset
  const yOffset = HOUSE_BASE_Y + HOUSE_HEIGHT - element.y * SCALE_2D * MODEL_SCALE - elementHeight / 2;
  
  // ... resto
}
```

### house-manager.ts - Elementos Padrão

```typescript
initializeDefaultElements(): void {
  if (!this.house?.houseType) return;
  this.house.elements = [];
  
  if (this.house.houseType === 'tipo6') {
    // Porta: 100×180 px, posicionada no corpo da casa
    this.addElement({
      type: 'door',
      face: 'front',
      x: 250,   // Posição X em pixels do canto esquerdo
      y: 40,    // Posição Y em pixels do topo do corpo
      width: 100,
      height: 180,
    });
    
    // Janela 1: 90×75 px
    this.addElement({
      type: 'window',
      face: 'front',
      x: 40,
      y: 40,
      width: 90,
      height: 75,
    });
    
    // Janela 2: próxima à porta
    this.addElement({
      type: 'window',
      face: 'front',
      x: 365,
      y: 40,
      width: 90,
      height: 75,
    });
  }
}
```

---

## Diagrama de Sincronização

```text
+------------------+       notify()       +------------------+
|  Canvas 2D       | ------------------> |  House3DViewer   |
|  (Fabric.js)     |                      |  (React State)   |
+------------------+                      +------------------+
       |                                          |
       | updatePiloti()                           | setPilotis({...})
       v                                          v
+------------------+       subscribe      +------------------+
|  HouseManager    | <------------------ |  useEffect       |
|  (Singleton)     |                      |  syncFromManager |
+------------------+                      +------------------+
       |                                          |
       | pilotis, elements                        | Re-render com
       |                                          | dados atualizados
       v                                          v
+------------------+                      +------------------+
|  Estado Central  |                      |  House3DScene    |
|  pilotis: {}     |                      |  props: pilotis  |
|  elements: []    |                      |  props: elements |
+------------------+                      +------------------+
```

---

## Resultado Esperado

1. **Pilotis sincronizados**: Alterações de altura no 2D refletem imediatamente no 3D
2. **Janelas/portas proporcionais**: Tamanhos corretos baseados nas dimensões reais da casa 2D
3. **Casa apoiada nos pilotis**: A base da casa encosta no topo dos pilotis
4. **Elementos posicionados corretamente**: Janelas e portas nas posições certas em cada face
