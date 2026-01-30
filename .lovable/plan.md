
## Diagnóstico Final

O problema está na combinação incorreta de propriedades ao criar o `Line`:

**Código atual (ERRADO):**
```typescript
const highlightLine = new Line(coords, {
  originX: 'center',
  originY: 'center',
  left: 0,
  top: 0,
  // coords = [-w/2, -h/2, w/2, -h/2] por exemplo
});
```

**O que isso causa:**
- `originX/Y: 'center'` diz ao Fabric que o ponto de referência da linha é seu centro geométrico
- `left: 0, top: 0` posiciona esse centro em (0,0) do grupo
- MAS as coordenadas `[-w/2, -h/2, w/2, -h/2]` já são offsets negativos pensando em um sistema centrado
- Resultado: a linha fica deslocada para o canto superior esquerdo do canvas

**Solução:**
Usar o mesmo padrão das linhas de dimensão (que funcionam): definir `originX: 'center', originY: 'center'` mas **NÃO** definir `left/top`, deixando o Fabric calcular automaticamente a posição baseada nas coordenadas.

---

## Plano de Correção (Única Mudança)

### Arquivo: `src/components/rac-editor/Canvas.tsx`

**Mudança na criação do Line (linhas 399-412):**

Remover `left: 0` e `top: 0` da configuração do highlight:

```typescript
// ANTES (errado):
const highlightLine = new Line(coords, {
  stroke: '#3b82f6',
  strokeWidth: 4,
  strokeUniform: true,
  selectable: false,
  evented: false,
  originX: 'center',
  originY: 'center',
  left: 0,        // ← REMOVER
  top: 0,         // ← REMOVER
});

// DEPOIS (correto):
const highlightLine = new Line(coords, {
  stroke: '#3b82f6',
  strokeWidth: 4,
  strokeUniform: true,
  selectable: false,
  evented: false,
  originX: 'center',
  originY: 'center',
  // NÃO definir left/top - deixar Fabric calcular baseado nas coordenadas
});
```

---

## Por Que Isso Resolve

1. As coordenadas `[-w/2, -h/2, w/2, -h/2]` (para side=top) definem a linha de uma ponta a outra
2. Com `originX/Y: 'center'`, o Fabric calcula `left/top` automaticamente como o centro da linha
3. Quando adicionado ao grupo (que tem o corpo da casa centrado em 0,0), a linha fica exatamente na borda superior do corpo
4. O `refreshHouseGroupRendering(topGroup)` já está sendo chamado, garantindo que o cache seja atualizado

---

## Nenhuma Outra Alteração

- NÃO mexemos em HouseManager
- NÃO mexemos na lógica de inserção de vistas
- NÃO mexemos no editor de pilotis
- NÃO mexemos no cálculo de coordenadas (que está correto)
- NÃO mexemos no refresh do grupo (que está correto)

---

## Detalhes Técnicos

A correção segue exatamente o padrão usado em `createDimension()` (canvas-utils.ts, linhas 887-911):

```typescript
// Padrão que funciona (linha de dimensão):
const line = new Line([-w / 2, 0, w / 2, 0], {
  stroke: color,
  strokeWidth: 2,
  originX: "center",
  originY: "center",
  // NÃO tem left/top
});
```

---

## Critérios de Teste

1. Selecionar Frontal → linha azul aparece no lado correto da Planta (Superior ou Inferior)
2. Selecionar Lateral → linha azul aparece no lado Esquerda ou Direita
3. Clicar no vazio → linha some
4. Selecionar Planta → linha some
5. Mover/rotacionar Planta → linha permanece colada
6. Editor de pilotis → continua funcionando normalmente
