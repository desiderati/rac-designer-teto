
## Corrigir espaçamento abaixo do título no modal "Escolha o Tipo de Casa"

### Problema
O espaço acima do título (padding-top do DialogContent = 24px) e maior que o espaço abaixo dele (gap entre os filhos = 16px). Visualmente, o titulo parece deslocado para baixo.

### Solucao
Adicionar `pt-2` (8px extra) ao container dos cards dentro do `HouseTypeSelector`, totalizando 24px (16px do gap + 8px do pt-2), igualando ao padding superior de 24px.

Tambem aplicar o mesmo ajuste na versao mobile (Sheet).

### Detalhes tecnicos

**Arquivo**: `src/components/rac-editor/HouseTypeSelector.tsx`

- Alterar a div do `content` de:
  ```
  <div className="flex flex-row gap-4 justify-center">
  ```
  Para:
  ```
  <div className="flex flex-row gap-4 justify-center pt-2">
  ```

Isso compensara a diferenca entre o `p-6` do container e o `gap-4` entre os elementos internos, tornando o espacamento visual simetrico.
