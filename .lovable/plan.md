

# Plano: Ajustes de UX, Painel Generico, Tutorial e Posicionamento

## 10 itens a implementar

---

### 1. Titulo da modal choose-instance

**Arquivo:** `src/components/rac-editor/SideSelector.tsx` (linha 130)

Substituir o titulo dinamico:
- De: `` `Qual '${getViewLabel(viewType)}' deseja mostrar?` ``
- Para logica condicional:
  - Se `viewType === 'side1'` (Quadrado Fechado): `"Qual dos quadrados fechados deseja mostrar?"`
  - Se `viewType === 'back'` e tipo3 (Lateral): `"Qual das laterais deseja mostrar?"`
  - Fallback: manter formato atual

---

### 2. Ordem dos slots na modal choose-instance (Esquerda antes de Direita)

**Arquivo:** `src/lib/house-manager.ts` (metodo `getPreAssignedSlots`, linha 741)

O metodo itera `Object.entries(preAssignedSlots)` que retorna na ordem de insercao. Para tipo6, `side1_0` = right, `side1_1` = left (quando front=top). Resultado: Direita aparece primeiro.

Solucao: Ordenar o array `result` para que `left` apareca antes de `right` e `top` antes de `bottom`:
```
result.sort((a, b) => {
  const order = { left: 0, right: 1, top: 0, bottom: 1 };
  return (order[a.side] ?? 0) - (order[b.side] ?? 0);
});
```

Tambem mudar os labels de "Esquerda"/"Direita" para "Esquerdo"/"Direito" quando for Quadrado Fechado:
- Na verdade, o label vem de `getSideLabel()` que retorna "Esquerda"/"Direita". Melhor ajustar diretamente no SideSelector para usar labels contextuais ("Esquerdo"/"Direito" para side1 tipo6).

---

### 3. Dicas em balao amarelo (nao toast) para Muro, Linha e Seta

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

Substituir os 3 `toast.info(...)` (linhas 620, 680, 696) por um sistema de balao amarelo similar ao `PilotiTutorialBalloon`.

Criar um componente generico `OnboardingBalloon` (ou reutilizar PilotiTutorialBalloon com props de texto customizado):

**Novo arquivo:** `src/components/rac-editor/OnboardingBalloon.tsx`

- Props: `position: {x,y}`, `text: string`, `onClose: () => void`
- Visual identico ao PilotiTutorialBalloon (fundo amber-100, seta, botao fechar)

No RACEditor:
- Novo estado: `onboardingBalloon: { position: {x,y}, text: string } | null`
- Ao adicionar muro/linha/seta pela primeira vez, calcular posicao do objeto recem-inserido e mostrar balao
- O balao fecha ao clicar no X ou ao interagir com o canvas

---

### 4. Painel generico unificado para Objeto, Linha, Seta e Distancia

**Novo arquivo:** `src/components/rac-editor/GenericEditor.tsx`

Painel unico com:
- Campo de texto (input) 
- Paleta de 10 cores (mesma do LineArrowEditor)
- Titulo: depende do tipo ("Editar Objeto", "Editar Distancia", sem titulo para linha/seta)
- Botoes Cancelar / Aplicar
- **Movivel no canvas** (draggable): usar `onMouseDown` no header para arrastar o painel
- Icone de "mover" (faGripVertical ou faUpDownLeftRight) no header indicando que pode ser arrastado
- Popover em desktop (posicao fixa com drag), Drawer em mobile

Este componente substitui:
- `ObjectNameEditor.tsx` (atualmente so tem campo de texto, agora ganha paleta de cores)
- `LineArrowEditor.tsx` (atualmente tem texto + cores + titulo que sera removido)
- `DistanceEditor.tsx` (atualmente so tem campo de texto, agora ganha paleta de cores)

Pode-se manter os 3 arquivos antigos mas refatora-los para usar GenericEditor internamente, ou substituir por chamadas diretas ao GenericEditor no RACEditor.

**Detalhes do editor por tipo:**
- **Objeto (wall):** Titulo "Editar Objeto" (antigo "Definir Nome do Objeto"), campo texto, paleta cores
- **Linha Reta:** Sem titulo "Editar Linha Reta", apenas campo texto + paleta cores
- **Seta Simples:** Sem titulo "Editar Seta Simples", apenas campo texto + paleta cores
- **Distancia:** Titulo "Editar Distancia", campo texto, paleta cores

---

### 5. Texto agrupado a linha/seta

**Arquivo:** `src/components/rac-editor/LineArrowEditor.tsx` ou novo GenericEditor

Atualmente o texto da linha/seta e um IText separado no canvas (`lineArrowLabel`). Mudar para:
- Ao aplicar texto, criar um Group contendo [linha/seta original + IText]
- O IText deve ficar centralizado horizontalmente com o objeto
- Similar ao padrao do ObjectNameEditor que agrupa objeto + label

---

### 6. Tutorial: avancar ao clicar no botao de zoom

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

Atualmente o tutorial avanca ao usar zoom/minimap (linhas 1151-1156). Precisa tambem avancar ao clicar no botao de toggle zoom:

Na linha 1129, o `onToggleZoomControls` e `() => setShowZoomControls(!showZoomControls)`. Adicionar logica de avanco tutorial:
```typescript
onToggleZoomControls={() => {
  setShowZoomControls(!showZoomControls);
  if (tutorialStep === 'zoom-minimap') advanceTutorial('zoom-minimap');
}}
```

---

### 7. Planta e vista nao sobrepostas

**Arquivo:** `src/components/rac-editor/RACEditor.tsx` (metodo `handleSideSelected`, linha 384)

Quando `sideSelectorMode === 'position'` e nao ha pre-assigned slots (primeira vez):
- Atualmente ambas sao adicionadas via `addViewToCanvas` que usa `addObjectToCanvas` que posiciona no centro visivel
- Resultado: ambas ficam sobrepostas

Solucao: Apos adicionar planta e vista frontal, reposicionar:
- Planta fica acima, vista fica abaixo
- Calcular offset baseado nas alturas dos objetos
- O centro visual deve ser o ponto medio entre os dois objetos

```typescript
// After adding both:
const plantGroup = houseManager.getHouse()?.views.top[0]?.group;
const viewGroup = /* the just-added view group */;
if (plantGroup && viewGroup) {
  const center = getVisibleCenter();
  const gap = 30; // pixels between them
  const totalHeight = (plantGroup.height || 0) + gap + (viewGroup.height || 0);
  plantGroup.set({ left: center.x, top: center.y - totalHeight / 2 + (plantGroup.height || 0) / 2 });
  viewGroup.set({ left: center.x, top: center.y + totalHeight / 2 - (viewGroup.height || 0) / 2 });
  plantGroup.setCoords();
  viewGroup.setCoords();
  canvas.renderAll();
}
```

---

### 8. Cor na Distancia

Ja coberto pelo item 4 (painel generico). O DistanceEditor passara a usar o GenericEditor com paleta de cores. Ao aplicar cor, alterar o `stroke`/`fill` dos elementos do grupo de dimensao (linhas, triangulos, texto).

---

### 9. (Numero 10 do usuario) Titulo "Editar Objeto" em vez de "Definir Nome do Objeto"

Coberto pelo item 4. O titulo do editor de objetos muda de "Definir Nome do Objeto" para "Editar Objeto".

---

## Arquivos a Modificar/Criar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/rac-editor/SideSelector.tsx` | Titulo condicional da modal choose-instance |
| `src/lib/house-manager.ts` | Ordenar slots (Esquerdo antes de Direito) |
| `src/components/rac-editor/OnboardingBalloon.tsx` | **Novo** - balao amarelo generico para dicas |
| `src/components/rac-editor/GenericEditor.tsx` | **Novo** - painel unificado com texto + cores + drag |
| `src/components/rac-editor/RACEditor.tsx` | Baloes de dica, tutorial zoom, posicionamento planta+vista, integrar GenericEditor |
| `src/components/rac-editor/ObjectNameEditor.tsx` | Remover ou refatorar para usar GenericEditor |
| `src/components/rac-editor/LineArrowEditor.tsx` | Remover ou refatorar para usar GenericEditor, agrupar texto |
| `src/components/rac-editor/DistanceEditor.tsx` | Refatorar para usar GenericEditor com cores |
| `src/components/rac-editor/Tutorial.tsx` | Sem alteracao (posicao zoom ja ajustada) |

