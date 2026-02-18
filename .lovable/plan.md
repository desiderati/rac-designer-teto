
## Reformular a Vista Frontal (e Traseira) da Casa

### Contexto Atual

A função `createHouseFrontBack` em `src/lib/canvas-utils.ts` (linhas 625–856) gera a vista frontal/traseira como um **retângulo + triângulo simétrico no topo**. O objetivo é substituir essa representação por três seções arquitetônicas:

1. **Diagonal Esquerda** — painel com telhado inclinado (alto à esquerda, baixo à direita onde encontra a Capela)
2. **Capela** — painel central com topo arqueado (curva convexa simulada com Bezier)
3. **Diagonal Direita** — painel com telhado inclinado (baixo à esquerda onde encontra a Capela, alto à direita)

A **Vista Frontal** terá: janela na Diagonal Esquerda + porta e janela na Diagonal Direita.
A **Vista Traseira** terá: sem elementos (apenas a estrutura).

---

### Análise das Proporções (baseada nas imagens de referência)

A largura total atual é `plantWidth` (≈ 366px para s=0.6). As três seções dividem essa largura da seguinte forma, mantendo as proporções dos diagramas:

- **Diagonal Esquerda**: ~40% da largura total → `diagonalW = plantWidth * 0.40`
- **Capela**: ~20% da largura total → `chapelaW = plantWidth * 0.20`
- **Diagonal Direita**: ~40% da largura total → `diagonalW = plantWidth * 0.40`

As alturas (conforme diagramas):
- Altura do corpo da parede: `bodyH = 220 * s` (mantida)
- Lado alto das diagonais: `bodyH + roofExtraH` onde `roofExtraH ≈ 40 * s`
- Lado baixo das diagonais (encontro com a Capela): `bodyH` (sem acréscimo)
- Altura total da Capela: `bodyH + capH` onde `capH ≈ 50 * s` (ponto máximo do arco)

---

### Geometria de Cada Seção

```text
Vista Frontal (de frente para a casa):

    *                               *
   /|                               |\
  / |          (arco)               | \
 /  |        /        \             |  \
*   |       /          \            |   *
|   |      *            *           |   |
|   |      |            |           |   |
|   |[jan] |   CAPELA   |  [porta]  |   |
|   |      |            | [janela]  |   |
*___*______*____________*___________*___*
    |      |            |           |
  pilotis                         pilotis

Diagonal Esq  | Capela | Diagonal Dir
```

**Diagonal Esquerda** — Polyline de 4 pontos:
- Bottom-left: `(0, bodyH)`
- Top-left: `(0, 0)` ← ponto mais alto
- Top-right: `(diagonalW, roofExtraH)` ← mais baixo que o left
- Bottom-right: `(diagonalW, bodyH)`

Preenchimento retangular + linha diagonal no topo.

**Capela** — Forma com topo em arco (ogiva):
- Laterais retas: de `bodyH` até `capH_base`
- Topo: Path bezier ou Polyline com pontos aproximando o arco
- A curva do topo da vila pode ser aproximada com 5–7 pontos de uma curva quadrática

**Diagonal Direita** — Espelho da Diagonal Esquerda:
- Bottom-left: `(0, bodyH)`  
- Top-left: `(0, roofExtraH)` ← mais baixo (encontra a Capela)
- Top-right: `(diagonalW, 0)` ← ponto mais alto
- Bottom-right: `(diagonalW, bodyH)`

---

### Posicionamento dos Pilotis

Os 4 pilotis da vista frontal ficam abaixo do corpo da casa, na mesma lógica atual. A margem entre pilotis será mantida (`margin = 55 * s`, `step`). Não muda a lógica de pilotis — apenas a geometria do corpo/telhado acima deles.

---

### Janela e Porta

**Vista Frontal:**
- **Diagonal Esquerda**: 1 janela centralizada verticalmente no painel
- **Diagonal Direita**: 1 porta (mais à esquerda do painel) + 1 janela (mais à direita)

**Vista Traseira:**
- Sem janelas ou portas (apenas a estrutura das três seções)

Os elementos (janela/porta) serão posicionados com as mesmas dimensões atuais (`windowW = 90 * s`, `windowH = 75 * s`, `doorW = 100 * s`, `doorH = 180 * s`), centralizando verticalmente no corpo retangular de cada painel (abaixo da linha do telhado diagonal).

---

### Detalhes Técnicos

**Arquivo modificado:** `src/lib/canvas-utils.ts`

**Função modificada:** `createHouseFrontBack` (linhas 625–856)

A lógica atual que cria:
- `roofFill` (Polygon triangular simétrico)
- `bodyFill` (Rect retangular)
- `roofLines` (2 linhas diagonais simétricas)
- `bodyStroke` (Polyline do contorno do corpo)

Será substituída por:

**Para cada seção (Diagonal Esq, Capela, Diagonal Dir):**
- `sectionFill`: Polygon/Polyline com preenchimento `#eeeeee`
- `sectionStroke`: Polyline de contorno com `stroke: "#333"`, `strokeWidth: 2`

**Arco da Capela:**
Como Fabric não tem Path Bezier direto de forma simples, o arco será aproximado com um `Polyline` de ~9 pontos calculados matematicamente seguindo uma curva senoidal ou quadrática entre os dois lados do teto da Chapel.

**Coordenadas do sistema:**
Todos os pontos são relativos ao canto superior-esquerdo do grupo (X=0, Y=0 = topo-esquerdo da seção mais alta). O `bodyH` continua sendo a altura do corpo das paredes, e `roofH` passa a ser a altura extra das diagonais acima do `bodyH`.

**Compatibilidade:**
- Os pilotis continuam exatamente como antes (linhas 638–699)
- O terreno (`createGroundElements`) continua como antes
- O `houseView`, `isFlippedHorizontally` e outros metadados do grupo são mantidos
- Nenhuma outra função precisa ser alterada

---

### Resumo das Alterações

| O que muda | Onde | Impacto |
|---|---|---|
| Geometria do telhado e corpo da vista frontal/traseira | `createHouseFrontBack` em `canvas-utils.ts` | Visual da vista 2D |
| Posição das janelas e porta | Dentro de `createHouseFrontBack` | Visual dos elementos |
| Nenhuma outra lógica é afetada | — | Pilotis, terreno, 3D, export funcionam normalmente |
