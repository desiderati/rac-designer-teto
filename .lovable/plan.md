

## Plano: 4 correções e ajustes

### 1. PilotiSetupModal — botões com mesma fonte/tamanho do PilotiEditor

**Arquivo:** `src/components/rac-editor/ui/modals/editors/PilotiSetupModal.tsx`

- Mudar classes dos botões de `h-10 rounded-lg text-sm` para `rounded-xl text-lg py-3` (mesmo que `getHeightButtonClasses` em `usePilotiEditor.ts`)
- Remover o parágrafo `"{selected.size} de {REQUIRED_COUNT} selecionadas"`
- Mudar texto de `"Tamanho dos Pilotis"` para `"Selecione seis tamanhos possíveis de Pilotis para a casa:"`

### 2. Porta não renderizada na vista planta após importação JSON

**Arquivo:** `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`

Após `rebuildFromCanvas()`, os `sideMappings` são reconstruídos pelo aggregate, mas `refreshTopDoorMarkers` depende de `this.house.sideMappings` estar correto. O `rebuildFromCanvas` já chama `notify()` que dispara `refreshTopDoorMarkers`. Porém, o canvas pode não ter renderizado os objetos atualizados antes do `renderAll`.

Solução: Após `houseManager.rebuildFromCanvas()`, chamar explicitamente `canvas.requestRenderAll()` e adicionar um `setTimeout` para forçar um segundo `renderAll` que garanta a atualização visual dos marcadores de porta.

### 3. Bloquear inserção de casa após importação de JSON com casa

**Arquivo:** `src/components/rac-editor/ui/toolbar/ToolbarMainMenu.tsx` (linha 64)

O botão de casa já verifica `houseType`: `houseType ? actions.toggleHouseMenu() : actions.openHouseTypeSelector()`. Após importação, `rebuildFromCanvas` restaura o `houseType` e `useToolbarHouseViewCounts` retorna o tipo correto. Porém, o componente `ToolbarMainMenu` pode não re-renderizar porque `houseManager.getHouseType()` não é reativo (não usa React state).

**Arquivo:** `src/components/rac-editor/ui/RacEditor.tsx`

O `currentHouseType` vem de `useToolbarHouseViewCounts` que lê `houseManager.getHouseType()`. Esse hook é chamado em cada render, mas o `houseStoreVersion` (que força re-render) pode não ser incrementado após import.

**Solução:** No `handleImportJSON`, após `rebuildFromCanvas()`, garantir que `houseStore.notify()` é chamado (o `rebuildFromCanvas` já chama `this.notify()` que inclui o store). Se o problema persistir, forçar re-render via `houseStore`.

Verificar se `rebuildFromCanvas` → `notify()` → incrementa `houseStoreVersion`. Se sim, o comportamento correto já está implementado. O bug pode ser que a toolbar não re-renderiza. Investigar mais na implementação.

### 4. Loading do Visualizador 3D dentro da mesma modal

**Arquivo:** `src/components/rac-editor/ui/RacEditor.tsx` (linhas 595-610)

Remover o `Suspense` com fallback de `Dialog` separado. Em vez disso, passar uma prop `isLoading` para o `House3DViewer`.

**Arquivo:** `src/components/rac-editor/ui/3d/House3DViewer.tsx`

Mover o `Suspense` fallback para dentro do próprio `House3DViewer`, no lugar do conteúdo 3D. A modal já existe com header/botões — o loading spinner aparece na área do canvas (div `flex-1`). Os botões (palette, hide, camera, reset, fullscreen) ficam desabilitados enquanto carrega, exceto o botão Fechar (X).

**Mudança em `RacEditor.tsx`:**
```tsx
// Remover Suspense wrapper, usar apenas:
{is3DViewerOpen && (
  <LazyHouse3DViewer open={is3DViewerOpen} onOpenChange={setIs3DViewerOpen} />
)}
```

Mas `LazyHouse3DViewer` é `lazy()` — precisa de Suspense. A solução é manter o Suspense mas usar o mesmo layout da modal como fallback: renderizar o `House3DViewer` shell (header + botões desabilitados + spinner na área de conteúdo) como fallback estático.

Alternativa mais simples: Mover o `Suspense` para **dentro** de `House3DViewer.tsx`, envolvendo apenas o `<Canvas>`. Assim a modal sempre renderiza com seu header e botões, e o spinner fica no lugar do canvas 3D enquanto carrega. Os botões que dependem do canvas (camera, reset) ficam desabilitados até o canvas estar pronto.

**Implementação:**
- `House3DViewer.tsx`: Adicionar estado `isSceneReady` (false até o Canvas `onCreated` ser chamado). Desabilitar botões (palette, hide below, camera, reset, fullscreen) quando `!isSceneReady`. Manter botão X sempre habilitado.
- O `Suspense` já existe internamente (linha 253). O fallback interno já mostra o spinner. Só precisamos desabilitar os botões do header quando `!isSceneReady`.
- Em `RacEditor.tsx`: Remover o `Suspense` externo com Dialog separado. Manter apenas um Suspense simples com fallback nulo (ou o mesmo spinner inline) envolvendo o lazy import.

