

# Corrigir comportamento e consistencia das modais

## Problemas identificados

1. **Reiniciar Canvas (AlertDialog)**: Nao fecha ao clicar fora - por padrao, AlertDialog do Radix bloqueia interacao externa.
2. **GenericEditor (Editar Objeto / Linha Reta / Distancia)**: Sao paineis `div` flutuantes sem overlay, portanto nao tem ESC nem clique-fora. Titulos nao estao centralizados.
3. **Editar Objeto so aparece uma vez**: Apos fechar o editor, `objectNameSelection` e limpo em `handleObjectNameEditorClose`, mas o proximo duplo-clique pode nao estar reabrindo porque o estado `isObjectNameEditorOpen` nao reseta corretamente quando o painel e fechado por meios externos.
4. **Tamanho dos titulos inconsistente**: DialogTitle usa `text-lg` (padrao do componente), GenericEditor usa `text-sm`.

## Alteracoes

### 1. `src/components/ui/alert-dialog.tsx`
- Adicionar handler `onPointerDownOutside` no `AlertDialogPrimitive.Content` que chama o `onOpenChange(false)` via evento. Como o AlertDialog nao suporta isso nativamente, a solucao e adicionar um click handler no `AlertDialogOverlay` que dispara o fechamento.
- Alternativa mais simples: trocar de AlertDialog para Dialog nos dois casos (Reiniciar Canvas e Desagrupar Casa) em `RACEditor.tsx`, ja que Dialog fecha ao clicar fora por padrao.

### 2. `src/components/rac-editor/RACEditor.tsx`
- Substituir os dois AlertDialog (Reiniciar Canvas e Desagrupar Casa) por Dialog padrao, mantendo os botoes Cancelar/Confirmar. Dialog fecha ao clicar fora automaticamente.

### 3. `src/components/rac-editor/GenericEditor.tsx`
- **ESC para fechar**: Adicionar `useEffect` com listener de `keydown` para a tecla Escape que chama `handleCancel()`.
- **Clique fora para fechar**: Adicionar um overlay transparente (`fixed inset-0 z-40`) atras do painel flutuante (`z-50`). Clicar no overlay chama `handleCancel()`.
- **Centralizar titulos**: Alterar o titulo de `text-left` implicito para `text-center` e usar `font-semibold text-base` (ou `text-lg`) para alinhar com o tamanho dos DialogTitle.
- **Bug "so aparece uma vez"**: Verificar se o overlay/clique-fora esta chamando `handleCancel` corretamente, garantindo que os estados `isOpen` e `selection` sejam limpos para permitir reabrir.

### 4. Consistencia de tamanho de titulo
- GenericEditor: trocar de `font-bold text-sm` para `font-semibold text-lg` no titulo, igualando ao `DialogTitle` padrao.

## Detalhes tecnicos

### GenericEditor - overlay + ESC (desktop)
```text
+---------------------------+
| Overlay (fixed inset-0    |
|   z-40, transparent)      |
|   onClick = handleCancel  |
|                           |
|   +--Painel z-50-------+  |
|   | Titulo (centrado)   |  |
|   | Input + Cores       |  |
|   | Cancelar / Aplicar  |  |
|   +--------------------+  |
+---------------------------+
```

### RACEditor - Dialog em vez de AlertDialog
- Substituir `AlertDialog` + `AlertDialogContent` por `Dialog` + `DialogContent` para Reiniciar Canvas e Desagrupar Casa
- Manter botoes Cancelar e Confirmar/Desagrupar manualmente (sem depender de AlertDialogAction/Cancel)

