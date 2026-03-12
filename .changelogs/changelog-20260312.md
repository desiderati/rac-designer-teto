# Changelog — 2026-03-12

## feat(modals): modal "Configuração de Pilotis" antes da Definição de Nível

### Resumo

Adicionado novo modal **PilotiSetupModal** no fluxo de inserção de casa, permitindo ao usuário selecionar 6 de 9 alturas disponíveis antes de definir os níveis dos cantos.

### Fluxo atualizado

```
HouseTypeSelector → SideSelector → PilotiSetupModal (NOVO) → NivelDefinitionEditor → Canvas
```

### Arquivos criados

- `src/components/rac-editor/ui/modals/editors/PilotiSetupModal.tsx` — Modal com grid 3x3, botões toggle, contador "X de 6 selecionadas"

### Arquivos modificados

- `src/shared/types/house.ts` — Adicionado `ALL_PILOTI_HEIGHTS` (9 alturas)
- `src/shared/types/piloti.ts` — Adicionado `getRecommendedHeightFromHeights(nivel, heights)`
- `src/components/rac-editor/lib/house-manager.ts` — Campo `_selectedPilotiHeights` com getter/setter/max
- `src/components/rac-editor/hooks/useRacEditorModalState.ts` — Estado `pilotiSetupOpen`
- `src/components/rac-editor/hooks/canvas/useCanvasHouseViewActions.ts` — Fluxo redireciona para PilotiSetup antes de NivelDefinition
- `src/components/rac-editor/ui/RacEditorHouseTypeSelector.tsx` — Renderiza PilotiSetupModal
- `src/components/rac-editor/ui/RacEditor.tsx` — Passa props do PilotiSetup
- `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx` — `maxNivel` dinâmico baseado na maior altura selecionada
- `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx` — Usa alturas dinâmicas do houseManager
