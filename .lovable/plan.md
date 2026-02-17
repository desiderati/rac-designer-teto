

## Corrigir modais mobile e editor de objetos

### Problema 1: Traço (drag handle) faltando nos modais mobile

Os modais de Configuracoes, Reiniciar Canvas e Desagrupar Casa usam `Sheet` (radix-dialog) no mobile, que nao tem o traco indicador de arraste. Os editores (Piloti, GenericEditor) usam `Drawer` (vaul) que tem o traco automaticamente. A solucao e trocar `Sheet` por `Drawer` nesses tres modais mobile.

### Problema 2: Espacamento abaixo do card branco no mobile

Nos Sheets mobile, os botoes tem apenas `pt-2` de espacamento acima. Ao migrar para `Drawer`, o padding sera padronizado com `p-4` ou `px-4 pb-4` no container, igual aos outros editores.

### Problema 3: Editor de objeto (nome/cor) nao abre no mobile

No `Canvas.tsx`, a edicao de wall/objeto so dispara no evento `mouse:dblclick` (linha 827), que e filtrado para ignorar mobile (linha 813: `if (window.matchMedia('(max-width: 767px)').matches) return`). Nao existe um handler mobile equivalente para walls. A solucao e adicionar um handler no `mouse:down` para mobile que detecta taps em objetos wall e abre o editor. O mesmo se aplica para linhas e setas.

### Mudancas tecnicas

**Arquivo: `src/components/rac-editor/RACEditor.tsx`**
- Substituir os `Sheet` mobile dos dialogos de Reiniciar Canvas e Desagrupar Casa por `Drawer`/`DrawerContent`
- Manter a mesma estrutura visual: titulo centralizado, card branco, botoes
- Importar componentes do Drawer

**Arquivo: `src/components/rac-editor/SettingsModal.tsx`**
- Substituir `Sheet` mobile por `Drawer`/`DrawerContent`
- Manter titulo centralizado, card branco com toggles, botoes Cancelar/Confirmar

**Arquivo: `src/components/rac-editor/Canvas.tsx`**
- Adicionar handler mobile no `mouse:down` para objetos `wall`, `line` e `arrow`
- Usar o mesmo padrao do handler de piloti (verificar `isMobileDevice`, `isEditorOpenRef`, e usar `setTimeout`)
- Para walls: chamar `handleObjectNameSelection(target as Rect)`
- Para lines: chamar `handleLineArrowSelection(target, 'line')`
- Para arrows: chamar `handleLineArrowSelection(target, 'arrow')`

### Resultado esperado

- Todos os modais mobile terao o traco cinza (drag handle) no topo, igual ao PilotiEditor
- Espacamento consistente abaixo do card branco
- Clicar em um muro/objeto no mobile abrira o editor de nome e cor
- Clicar em linhas e setas no mobile abrira o editor correspondente
