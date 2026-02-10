

# Plano: Melhorias de UX, Fossa, Linhas/Setas e Dicas

## 8 itens a implementar

---

### 1. Remover descricao da modal "choose-instance" e ajustar labels

**Arquivo:** `src/components/rac-editor/SideSelector.tsx`

- Remover o texto `SheetDescription` / `DialogDescription` ("Selecione a instancia que deseja adicionar ao canvas") no modo `choose-instance`
- Garantir que os labels dos slots sigam a ordem correta (Esquerdo/Direito ou Superior/Inferior)

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

- Ajustar a ordem dos slots passados ao SideSelector. Atualmente os slots vem do `houseManager.getPreAssignedSlots()`. Revisar se a ordem ja esta correta (Esquerdo antes de Direito).

---

### 2. Reordenar botoes do submenu de casa

**Arquivo:** `src/components/rac-editor/Toolbar.tsx`

**Tipo 6 (atual: Frontal, Traseira, Quadrado Fechado):**
- Manter: Visao Frontal, Quadrado Fechado, Visao Traseira (mover Traseira para depois de Quadrado Fechado)

**Tipo 3 (atual: Lateral, Quadrado Aberto, Quadrado Fechado):**
- Reordenar para: Quadrado Aberto, Visao Lateral, Quadrado Fechado

---

### 3. Forma irregular para Fossa

**Arquivo:** `src/lib/canvas-utils.ts`

- Substituir o `Rect` com cantos arredondados por um `Polygon` com pontos irregulares simulando uma circunferencia "desigual" (forma organica tipo blob)
- Usar 8-10 pontos com variacao aleatoria de raio para criar o contorno irregular
- Manter o label "Fossa" centralizado

---

### 4. Dica na primeira vez que adicionar Objeto/Muro

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

- Ao chamar `handleAddWall()`, verificar `localStorage.getItem('rac-wall-tip-shown')`
- Se nao foi mostrada, exibir `toast.info("Clique duas vezes para definir ou alterar o nome do objeto")` e salvar no localStorage

---

### 5. Dica do Zoom associada ao botao

**Arquivo:** `src/components/rac-editor/Tutorial.tsx`

- Ajustar o passo `zoom-minimap` para que a seta aponte diretamente para o botao do Zoom no toolbar (nao para o controle de zoom em si)
- Atualmente o tutorial aponta `bottom: "20px", left: "110px"` com `arrowDirection: "left"` -- precisa ajustar a posicao para ficar ao lado do botao faMagnifyingGlass no toolbar (que fica na posicao vertical do menu principal, acima da lixeira)

---

### 6. Editor de texto/cor para Linhas Retas e Setas Simples (double-click)

**Arquivos novos:** `src/components/rac-editor/LineArrowEditor.tsx`

Criar um editor (Popover em desktop, Drawer em mobile) com:
- Campo de texto para associar um label
- Paleta de 10 cores para alterar a cor da linha/seta
- Cores sugeridas: preto, vermelho, azul, verde, laranja, roxo, marrom, rosa, cinza, amarelo

**Arquivo:** `src/components/rac-editor/Canvas.tsx`

- No handler `mouse:dblclick`, adicionar verificacao para `myType === 'line'` e `myType === 'arrow'`
- Para linhas: o target e diretamente a Line
- Para setas: o target e um Group
- Calcular posicao na tela e emitir callback `onLineArrowSelect`

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

- Adicionar estado `lineArrowSelection` e `isLineArrowEditorOpen`
- Renderizar o componente `LineArrowEditor`
- Ao aplicar texto: criar um IText associado ao objeto (similar ao ObjectNameEditor)
- Ao aplicar cor: alterar o `stroke` (ou `fill` para triangulo da seta) de todos os sub-objetos

---

### 7. Dica na primeira vez que adicionar Linha Reta ou Seta Simples

**Arquivo:** `src/components/rac-editor/RACEditor.tsx`

- Ao chamar `handleAddLine()`, verificar `localStorage.getItem('rac-line-tip-shown')`
- Se nao foi mostrada, exibir `toast.info("Clique duas vezes para definir um texto ou a cor da linha reta")` e salvar
- Ao chamar `handleAddArrow()`, verificar `localStorage.getItem('rac-arrow-tip-shown')`
- Se nao foi mostrada, exibir `toast.info("Clique duas vezes para definir um texto ou a cor da seta simples")` e salvar

---

### 8. Corrigir deformacao da ponta da seta ao redimensionar

**Arquivo:** `src/lib/canvas-utils.ts`

O handler `scaling` atual da seta:
```typescript
group.on("scaling", function (this: Group) {
  const nw = this.width! * this.scaleX!;
  (this._objects[0] as Rect).set({ width: nw });
  (this._objects[1] as Triangle).set({ left: nw / 2 });
  this.set({ width: nw, scaleX: 1, scaleY: 1 });
});
```

O problema: `scaleY: 1` e definido mas o triangulo (ponta) herda a escala do grupo antes do reset, deformando-o. A correcao:
- Apos o reset de `scaleX/scaleY`, forcar o triangulo a manter suas dimensoes originais (`width` e `height` fixos)
- Apenas reposicionar o triangulo no final da linha (left = nw/2)
- Resetar `scaleX` e `scaleY` do proprio triangulo para 1

---

## Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| `src/components/rac-editor/SideSelector.tsx` | Remover descricao no modo choose-instance |
| `src/components/rac-editor/Toolbar.tsx` | Reordenar botoes dos submenus tipo 6 e tipo 3 |
| `src/lib/canvas-utils.ts` | Fossa com forma irregular (Polygon), correcao seta scaling |
| `src/components/rac-editor/RACEditor.tsx` | Dicas para wall/line/arrow, estado do LineArrowEditor |
| `src/components/rac-editor/Tutorial.tsx` | Reposicionar dica zoom para apontar ao botao |
| `src/components/rac-editor/Canvas.tsx` | Double-click handler para line/arrow |
| `src/components/rac-editor/LineArrowEditor.tsx` | Novo componente editor de texto/cor |

