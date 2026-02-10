
# Melhorias Visuais do Modelo 3D Baseadas na Referencia

## Mudancas Identificadas na Imagem de Referencia

1. **Telhado com textura ondulada (telha de amianto)**: O telhado mostra linhas horizontais paralelas simulando folhas de amianto/fibrocimento ondulado, e possui um beiral (overhang) que se estende alem das paredes.

2. **Janelas como recortes na parede**: Em vez de caixas brancas sobrepostas na superficie, as janelas sao aberturas/buracos nas paredes com profundidade visivel, mostrando o interior mais escuro.

3. **Portas como recortes na parede**: Similar as janelas, as portas sao aberturas recortadas na parede com profundidade, nao blocos brancos colados.

4. **Paredes com espessura**: As paredes nao sao planos finos; possuem espessura visivel (como tijolos reais).

5. Os pilotios continuam tendo seção circular

---

## Plano de Implementacao

### 1. Paredes com Espessura (Wall Thickness)

Substituir os planos finos (`planeGeometry`) por caixas com espessura (`boxGeometry`). Definir uma constante `WALL_THICKNESS` (aproximadamente 4-5 unidades) para dar volume realista.

### 2. Janelas e Portas como Recortes (CSG ou Abordagem Visual)

Como CSG (Constructive Solid Geometry) e complexo no Three.js, usar a abordagem visual:
- Renderizar cada parede como multiplos segmentos ao redor das aberturas
- Ou: manter as paredes inteiras e renderizar as aberturas como buracos escuros com profundidade (caixa escura recuada para dentro da parede)
- Na pratica: substituir o elemento branco atual por uma caixa com cor escura/interior que simula o recorte, e adicionar uma moldura (frame) ao redor

A abordagem mais simples e eficaz: manter a parede solida e renderizar o elemento como um "buraco visual" -- uma caixa com a cor do interior (escuro) embutida na parede, com uma moldura fina ao redor.

### 3. Telhado com Efeito de Ondulacao (Corrugated Roof)

Criar uma textura procedural com linhas horizontais paralelas para simular as ondulacoes do amianto:
- Usar um `CanvasTexture` gerado programaticamente com linhas alternadas claras/escuras
- Aplicar como mapa de textura no material do telhado
- Adicionar beiral (overhang) de ~10 unidades alem das paredes em todas as direcoes

### 4. Beiral do Telhado (Roof Overhang)

Estender as dimensoes do telhado alem das paredes (`HOUSE_WIDTH + overhang * 2` e `HOUSE_DEPTH + overhang * 2`).

---

## Detalhes Tecnicos

**Arquivo:** `src/components/rac-editor/House3DScene.tsx`

### Novas Constantes
```
WALL_THICKNESS = 4
ROOF_OVERHANG = 12
PILOTI_SIZE = PILOTI_RADIUS * 1.6 (secao quadrada)
```

### Telhado com Textura Procedural
Criar funcao `createCorrugatedTexture()` que retorna um `THREE.CanvasTexture` com listras horizontais alternando tons de cinza, simulando as ondulacoes do fibrocimento. Aplicar como `map` no material do telhado.

### Paredes com Espessura
Cada parede usa `boxGeometry` com args `[width, height, WALL_THICKNESS]` em vez de `planeGeometry`.

### Elementos como Aberturas
- Fundo escuro (cor `#1a1a1a`) embutido na parede para simular profundidade
- Moldura fina ao redor da abertura na cor da parede ou levemente mais escura
- Remover o bloco branco atual

Apenas o arquivo `House3DScene.tsx` sera modificado.
