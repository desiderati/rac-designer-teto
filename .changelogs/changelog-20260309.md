# Changelog — 2026-03-09

## feat(modals): Modal de Configuração da Família antes da seleção de tipo de casa

### Resumo

Adicionado um novo modal "Configuração da Família" que aparece antes do seletor de tipo de casa. O modal permite:

1. **Nome da Família** — campo de texto obrigatório usado para identificação
2. **Seleção de 6 alturas de pilotis** — grid 3x3 com 9 opções (1,0 / 1,2 / 1,5 / 2,0 / 2,2 / 2,5 / 3,0 / 3,2 / 3,5), onde o usuário deve escolher exatamente 6

### Arquivos criados

- `src/components/rac-editor/ui/modals/editors/FamilySetupModal.tsx` — novo modal com input de nome + grid de alturas toggle

### Arquivos modificados

- `src/shared/types/house.ts` — adicionado `ALL_PILOTI_HEIGHTS` (9 valores) e mantido `DEFAULT_HOUSE_PILOTI_HEIGHTS` (6 valores padrão)
- `src/shared/types/piloti.ts` — `getRecommendedHeight` aceita array dinâmico de alturas; `MAX_AVAILABLE_PILOTI_HEIGHT` usa `ALL_PILOTI_HEIGHTS`
- `src/components/rac-editor/lib/house-manager.ts` — adicionados `familyName`, `selectedPilotiHeights` com getters/setters; reset limpa valores
- `src/components/rac-editor/hooks/useRacEditorModalState.ts` — adicionado state `familySetupOpen`
- `src/components/rac-editor/ui/RacEditorHouseTypeSelector.tsx` — inclui `FamilySetupModal` antes do `HouseTypeSelector`
- `src/components/rac-editor/ui/RacEditor.tsx` — handler `handleFamilySetupConfirm` armazena dados no `houseManager` e abre `HouseTypeSelector`
- `src/components/rac-editor/hooks/tutorial/useTutorialMenuActions.ts` — fluxo de inserção abre `FamilySetupModal` em vez de `HouseTypeSelector` diretamente
- `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx` — usa `houseManager.getSelectedPilotiHeights()` em vez de `DEFAULT_HOUSE_PILOTI_HEIGHTS`
