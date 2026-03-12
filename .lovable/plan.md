

## Plano: Modal "Configuração de Pilotis" antes da Definição de Nível

### Resumo

Criar um modal "Configuração de Pilotis" que aparece **logo antes** do NivelDefinitionEditor no fluxo de inserção da casa. O usuário seleciona 6 de 9 alturas disponíveis. O layout segue o padrão do PilotiEditor (grid 3x3 com botões toggle). O valor máximo do nível passa a depender do maior piloti selecionado.

### Fluxo atualizado

```text
HouseTypeSelector → SideSelector → PilotiSetupModal (NOVO) → NivelDefinitionEditor → Canvas
```

### Arquivo a criar

**`src/components/rac-editor/ui/modals/editors/PilotiSetupModal.tsx`**
- Usa `ConfirmDialogModal` (mesmo padrão do NivelDefinitionEditor)
- Título: "Configuração de Pilotis"
- Subtítulo: "Tamanho dos Pilotis"
- Grid 3x3 com 9 botões toggle para alturas: 1.0, 1.2, 1.5, 2.0, 2.2, 2.5, 3.0, 3.2, 3.5
- Mesma aparência dos botões de altura do PilotiEditor (`bg-primary/10` inativo, `bg-primary text-primary-foreground` ativo)
- Botão "Confirmar" habilitado quando exatamente 6 alturas selecionadas
- Contador visual: "X de 6 selecionadas"
- `onConfirm(heights: number[])` retorna as 6 alturas ordenadas

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/shared/types/house.ts` | Adicionar `ALL_PILOTI_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.2, 2.5, 3.0, 3.2, 3.5]` |
| `src/components/rac-editor/lib/house-manager.ts` | Adicionar campo `_selectedPilotiHeights: number[]` com getter/setter. Inicializa com `DEFAULT_HOUSE_PILOTI_HEIGHTS`. Reset limpa para default. |
| `src/components/rac-editor/hooks/useRacEditorModalState.ts` | Adicionar `pilotiSetupOpen` / `setPilotiSetupOpen` |
| `src/components/rac-editor/hooks/canvas/useCanvasHouseViewActions.ts` | No `handleSideSelected`, ao transicionar para nível, abrir `pilotiSetupOpen` em vez de `nivelDefinitionOpen`. Adicionar handler `handlePilotiSetupConfirm` que salva as alturas no houseManager e abre `nivelDefinitionOpen`. |
| `src/components/rac-editor/ui/RacEditorHouseTypeSelector.tsx` | Adicionar `PilotiSetupModal` com props de open/close/confirm |
| `src/components/rac-editor/ui/RacEditor.tsx` | Passar `pilotiSetupOpen`/handlers para `RacEditorHouseTypeSelector` |
| `src/components/rac-editor/ui/modals/editors/NivelDefinitionEditor.tsx` | `maxNivel` passa a usar `getMaxNivelForPilotiHeight(houseManager.getMaxSelectedPilotiHeight())` em vez do global fixo |
| `src/components/rac-editor/ui/modals/editors/piloti/PilotiEditor.tsx` | Usar `houseManager.getSelectedPilotiHeights()` em vez de `DEFAULT_HOUSE_PILOTI_HEIGHTS` |
| `src/shared/types/piloti.ts` | Adicionar `getRecommendedHeightFromHeights(nivel, heights)` que aceita array dinâmico. `MAX_AVAILABLE_PILOTI_NIVEL` permanece como constante global (baseada no 3.5). |

