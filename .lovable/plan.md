
# Plano: Visualizador 3D Rotacionável da Casa

## Objetivo

Criar um visualizador 3D interativo que renderiza o modelo da casa com base nos dados já existentes no `HouseManager`. O usuário poderá rotacionar, fazer zoom e pan para explorar a casa de todos os ângulos.

---

## Arquitetura da Solução

### Dados Disponíveis (já existentes)

O `HouseManager` já possui todos os dados necessários:

| Dado | Fonte | Uso no 3D |
|------|-------|-----------|
| Dimensões da planta | `BASE_TOP_WIDTH=610`, `BASE_TOP_HEIGHT=300`, escala `s=0.6` | Base da casa (largura x profundidade) |
| Grid de pilotis | 4 colunas × 3 linhas (`piloti_0_0` a `piloti_3_2`) | 12 cilindros posicionados |
| Altura de cada piloti | `pilotiHeight` (1.0 a 3.0) | Altura individual de cada cilindro |
| Piloti mestre | `pilotiIsMaster`, `pilotiNivel` | Destaque visual diferenciado |
| Tipo de casa | `tipo6` ou `tipo3` | Variações na geometria do telhado |

### Stack Tecnológico

- **@react-three/fiber@^8.18**: React renderer para Three.js (compatível com React 18)
- **@react-three/drei@^9.122.0**: Helpers (OrbitControls, Box, Cylinder, etc.)
- **three@>=0.133**: Engine 3D base

---

## Componentes a Criar

### 1. House3DViewer (Componente Principal)

Botão na toolbar que abre um modal/dialog com o canvas 3D.

```text
+------------------------------------------+
|        Visualizador 3D          [X]      |
+------------------------------------------+
|                                          |
|              [Canvas 3D]                 |
|                                          |
|    Arraste para rotacionar               |
|    Scroll para zoom                      |
+------------------------------------------+
```

### 2. House3DScene (Cena 3D)

Composição da casa usando primitivas Three.js:

```text
     /\
    /  \      <- Telhado (geometria triangular)
   /    \
  +------+    <- Corpo da casa (Box)
  |      |
  | Casa |
  |      |
  +------+
  || || ||    <- Pilotis (Cylinders)
```

### 3. Geometrias Específicas

| Elemento | Geometria Three.js | Dimensões Base |
|----------|-------------------|----------------|
| Base da casa | `Box` | 610×220×300 (W×H×D) escalado |
| Telhado | `BufferGeometry` triangular | Largura da casa × 80 altura |
| Pilotis | `Cylinder` | Raio 15, altura dinâmica |

---

## Mapeamento de Posições dos Pilotis

Os pilotis seguem o mesmo grid 4×3 da vista planta:

```text
Visão de cima (planta):

      Col0   Col1   Col2   Col3
Row0   A1     A2     A3     A4
Row1   B1     B2     B3     B4
Row2   C1     C2     C3     C4

Posições X: [-1.5×cD, -0.5×cD, 0.5×cD, 1.5×cD]
Posições Z: [-rD, 0, rD]
```

Onde `cD = 155 * s` e `rD = 135 * s`.

---

## Sincronização com HouseManager

O visualizador 3D será um **subscriber** do HouseManager:

1. Ao abrir o modal, lê o estado atual dos pilotis
2. Subscreve a mudanças via `houseManager.subscribe()`
3. Re-renderiza automaticamente quando pilotis são editados no canvas 2D

```text
+----------------+       subscribe        +------------------+
|  Canvas 2D     |  --------------------> |  House3DViewer   |
|  (Fabric.js)   |                        |  (Three.js)      |
+----------------+                        +------------------+
       |                                          |
       |  updatePiloti()                          |
       v                                          v
+----------------+       notify           +------------------+
| HouseManager   |  --------------------> | Re-render 3D     |
+----------------+                        +------------------+
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/rac-editor/House3DViewer.tsx` | Modal com canvas 3D e controles |
| `src/components/rac-editor/House3DScene.tsx` | Cena Three.js com casa, telhado e pilotis |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/rac-editor/Toolbar.tsx` | Adicionar botão "3D" no submenu ou overflow |
| `src/components/rac-editor/RACEditor.tsx` | Gerenciar estado de abertura do modal 3D |
| `package.json` | Adicionar dependências Three.js |

---

## Detalhes Técnicos

### Inicialização do Canvas 3D

```
<Canvas camera={{ position: [0, 300, 500], fov: 50 }}>
  <ambientLight intensity={0.6} />
  <directionalLight position={[10, 20, 10]} intensity={0.8} />
  <House3DScene />
  <OrbitControls enablePan enableZoom enableRotate />
</Canvas>
```

### Estrutura do House3DScene

1. **Grupo raiz** centrado na origem
2. **Base da casa**: Box com dimensões da planta
3. **Telhado**: Mesh triangular para tipo6, variação para tipo3
4. **12 Pilotis**: Cylinders posicionados no grid, cor diferenciada para mestre
5. **Chão semi-transparente** (opcional) para referência visual

### Cores e Materiais

| Elemento | Cor |
|----------|-----|
| Base da casa | #eeeeee (cinza claro) |
| Telhado | #d4a574 (marrom claro) |
| Piloti normal | #ffffff (branco) |
| Piloti mestre | #d4a574 (marrom, igual ao 2D) |
| Bordas/wireframe | #333333 |

---

## Interatividade

| Controle | Ação |
|----------|------|
| Arrastar mouse | Rotacionar câmera (OrbitControls) |
| Scroll | Zoom in/out |
| Shift + arrastar | Pan (mover câmera) |
| Botão reset | Voltar para posição inicial |

---

## Resultado Esperado

1. Botão "3D" na toolbar abre modal com visualização
2. Casa renderizada com dimensões proporcionais à planta 2D
3. 12 pilotis com alturas corretas e sincronizadas
4. Piloti mestre destacado em marrom
5. Rotação, zoom e pan suaves
6. Atualizações em tempo real ao editar pilotis no 2D
