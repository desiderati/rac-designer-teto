
# Manter posicao do painel de piloti ao navegar

## Problema

O `PilotiEditor` usa `key={pilotiSelection?.pilotiId ?? 'closed'}` no `RACEditor.tsx` (linha 1401). Isso forca o React a destruir e recriar o componente inteiro toda vez que o piloti selecionado muda (navegacao com setas ou auto-navegacao). Como consequencia, o estado `popoverPos` eh resetado e o painel volta para a posicao inicial, mesmo que o usuario tenha arrastado o painel para outra posicao.

## Solucao

1. **Remover o `key` dinamico** em `RACEditor.tsx` (linha 1401) - o `key` baseado no `pilotiId` nao eh mais necessario porque o `PilotiEditor` ja sincroniza o estado interno via `useEffect` quando `pilotiId` muda.

2. **Ajustar logica de posicao no `PilotiEditor.tsx`** - garantir que `popoverPos` so eh resetado quando o editor fecha e reabre (primeira abertura), nunca durante navegacao entre pilotis. A logica atual com `isFirstOpen` ja faz isso corretamente, entao basta remover o `key` para funcionar.

## Detalhe tecnico

### `src/components/rac-editor/RACEditor.tsx`
- Linha 1401: remover `key={pilotiSelection?.pilotiId ?? 'closed'}` do componente `PilotiEditor`

### `src/components/rac-editor/PilotiEditor.tsx`
- Nenhuma alteracao necessaria - a logica de `isFirstOpen` + `userDraggedRef` ja preserva a posicao corretamente quando o componente nao eh remontado
