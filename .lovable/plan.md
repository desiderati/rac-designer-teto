

# Corrigir useEffect que sobrescreve altura selecionada

## Problema

O `useEffect` (linhas 118-144) sincroniza os valores temporarios **toda vez** que qualquer prop muda, incluindo `currentHeight`. Quando o usuario clica uma altura:

1. `handleHeightClick` chama `onHeightChange(h)` e `houseManager.updatePiloti`
2. O componente pai atualiza e passa `currentHeight` com o novo valor
3. O `useEffect` dispara por causa de `currentHeight` nas dependencias
4. `setTempHeight(currentHeight)` sobrescreve o valor — criando um ciclo que pode impedir a atualizacao visual

A sincronizacao render-time (linhas 108-116) ja cuida da troca de `pilotiId`. O `useEffect` so precisa lidar com a posicao inicial do popover.

## Solucao

### `src/components/rac-editor/PilotiEditor.tsx`

1. **Remover a sincronizacao de valores do useEffect** (linhas 129-133): apagar as linhas `setTempHeight`, `setTempIsMaster`, `setTempNivel` e `setTempNivelInput` de dentro do useEffect.

2. **Simplificar dependencias do useEffect**: manter apenas `isOpen` e `anchorPosition` como dependencias, ja que o efeito so precisa controlar a posicao inicial do popover na primeira abertura.

O bloco render-time (linhas 108-116) ja garante que os valores sincronizam imediatamente ao trocar de piloti, sem competir com o useEffect.

