

# Corrigir replicacao de altura no canvas ao selecionar piloti

## Problema

Ao remover o `key` dinamico do `PilotiEditor`, o componente nao remonta mais quando o piloti muda. Isso causa um problema de sincronizacao: o `useEffect` que sincroniza os valores temporarios a partir das props pode sobrescrever a altura selecionada pelo usuario antes dela ser aplicada ao canvas, pois o efeito roda apos cada mudanca de props (incluindo `currentHeight`).

## Solucao

Adicionar sincronizacao de estado durante o render (render-time state update) no `PilotiEditor.tsx`, garantindo que os valores sincronizem imediatamente quando `pilotiId` muda, sem depender do `useEffect` assincrono. E tambem garantir que cliques de altura sempre atualizem o canvas imediatamente via `houseManager.updatePiloti`, mesmo quando auto-navigate esta desligado.

## Detalhes tecnicos

### `src/components/rac-editor/PilotiEditor.tsx`

1. **Sincronizacao durante render**: No bloco que ja detecta mudanca de `pilotiId` durante render (linhas ~101-104), adicionar chamadas `setTempHeight(currentHeight)` etc. para que React reinicie o render com valores corretos imediatamente (padrao oficial do React para "derived state").

2. **Atualizar canvas ao clicar altura (sem auto-navigate)**: No `handleHeightClick`, quando `autoNavigatePiloti` esta OFF, alem de `setTempHeight(h)`, chamar tambem `houseManager.updatePiloti(pilotiId, { height: h, isMaster: tempIsMaster, nivel: ... })` e `onHeightChange(h)` para que a mudanca reflita no canvas em tempo real, sem precisar esperar o "Aplicar".

