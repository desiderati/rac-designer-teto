

## Plano: Cálculo de volume de rachão e brita + correção de erros de build

### 1. Correção dos erros de build existentes (pré-requisito)

**Problema**: 4 arquivos importam `TutorialStepId` e `TutorialHighlight` de `Tutorial.tsx`, mas esses tipos estão em `tutorial.ts`. Além disso, `index.smoke.test.ts` importa `getAllPilotiIds` de `./index.ts` mas esse barrel não reexporta `piloti.ts` (que por sua vez importa de `@/shared/types/piloti.ts`).

**Correções**:
- `toolbar-types.ts`, `ToolbarMainMenu.tsx`, `ToolbarOverflowMenu.tsx`: mudar import de `Tutorial.tsx` para `@/components/rac-editor/lib/tutorial.ts`
- `useTutorialMenuActions.ts`, `RacEditorCanvas.tsx`: idem para `TutorialStepId`
- `index.smoke.test.ts`: importar `getAllPilotiIds` de `@/shared/types/piloti.ts` em vez de `./index.ts`

### 2. Lógica de cálculo de volume (novo módulo)

Criar `src/components/rac-editor/lib/terrain-volume.ts` com funções puras:

**Fórmulas** (cilindro: V = π × (d/2)² × h, convertendo cm para m):
- **Rachão por piloti**: cilindro com altura = `rachao` cm (da config por solidez), diâmetro = `piloti.width` (30cm) + 2 × `sideGravelWidth` (10cm) = 50cm. Total = volume × 12.
- **Brita por piloti**: (cilindro externo − cilindro do piloti). Cilindro externo: altura = nível do piloti em cm (parte enterrada), diâmetro = 50cm. Cilindro piloti: mesma altura, diâmetro = 30cm. Somar para os 12 pilotis (cada um pode ter nível diferente).

```text
Interface pública:
  calculateRachaoVolume(terrainLevel, pilotiCount=12) → m³
  calculateBritaVolume(pilotis: {nivel: number}[]) → m³
  calculateTotalVolumes(terrainLevel, pilotis) → { rachaoM3, britaM3 }
```

Constantes usadas: `TERRAIN_SOLIDITY.levels[n].rachao`, `TERRAIN_SOLIDITY.sideGravelWidth` (10cm), `HOUSE_DIMENSIONS.piloti.width` (30px = 30cm).

### 3. Exibição no TerrainEditor

Adicionar ao `TerrainEditor.tsx`, abaixo do slider, uma seção com os volumes calculados:
- Receber prop `pilotis: Record<string, HousePiloti>` para acessar o nível de cada piloti
- Mostrar: "Rachão total: X,XX m³" e "Brita total: X,XX m³"
- Atualizar em tempo real conforme o slider de solidez muda

### Detalhes técnicos

- Largura do piloti = 30cm (valor em `HOUSE_DIMENSIONS.piloti.width`)
- Largura da brita lateral = 10cm (valor em `TERRAIN_SOLIDITY.sideGravelWidth`)
- Diâmetro total = 30 + 10×2 = 50cm
- Rachão: uniforme para todos os pilotis (mesma altura de rachão)
- Brita: variável por piloti (depende do nível/parte enterrada de cada um)
- Volume do cilindro em m³: π × (d/2)² × h, com d e h em metros

