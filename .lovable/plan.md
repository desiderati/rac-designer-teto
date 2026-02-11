

## Minimap da Planta no Modal de Posicionamento

### Problema Atual
O grid de pilotis no modal "Posicionar Vista" usa um layout de grade uniforme (aspect ratio 4:3) com pilotis grandes que ocupam toda a celula. Isso nao transmite visualmente que se trata de uma planta baixa da casa, confundindo usuarios.

### Solucao
Redesenhar o minimap para se parecer com a planta baixa real da casa:
- Retangulo com proporcao mais proxima da planta real (aproximadamente 2:1, largura maior que altura)
- Pilotis como circulos pequenos posicionados nas bordas e centro, simulando a posicao real na planta
- Borda do retangulo representando as paredes da casa
- Exibir a altura de cada piloti dentro do circulo (como na imagem de referencia)

### Mudancas

**Arquivo: `src/components/rac-editor/SideSelector.tsx`**

1. Alterar o `aspectRatio` do container de `4/3` para `2/1` para refletir a proporcao real da planta
2. Substituir o layout de grade CSS (`grid`) por posicionamento absoluto dos pilotis, colocando-os nas posicoes corretas dentro do retangulo:
   - Linha A (A1-A4): topo, distribuidos horizontalmente
   - Linha B (B1-B4): meio, distribuidos horizontalmente  
   - Linha C (C1-C4): base, distribuidos horizontalmente
3. Reduzir o tamanho dos circulos dos pilotis (de `aspect-square` preenchendo a celula para circulos fixos de ~24px)
4. Exibir a altura do piloti (ex: "1.0") dentro de cada circulo em fonte pequena
5. Aplicar as mesmas mudancas nos dois blocos de renderizacao do grid (modo `isLongSide` para Vista Frontal e modo lateral para Quadrado Aberto)

### Detalhes Tecnicos

- Os pilotis serao posicionados com `position: absolute` usando porcentagens para manter responsividade:
  - Linha A: `top: ~8%`, colunas em `~12%, 37%, 63%, 88%`
  - Linha B: `top: ~50%`
  - Linha C: `top: ~92%`
- Cada piloti tera `width: 24px, height: 24px` com `transform: translate(-50%, -50%)` para centralizar
- A altura sera lida do `pilotiData` e formatada (ex: `1.0`)
- O destaque ao hover dos botoes laterais continuara funcionando com a mesma logica `getPilotiHighlight`
- O codigo do grid e duplicado (para `isLongSide` e para lateral), ambos serao atualizados de forma identica

