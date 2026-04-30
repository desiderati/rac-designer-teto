# Baseline de Fronteira Fabric

## Data e Contexto

- Worktree: `C:\Projetos\personal\rac-designer-teto-autonomous-editor-architecture`
- Branch: `codex/autonomous-loop/editor-architecture`
- Baseline antes de refatoração funcional.

## Validação Inicial

- `npm run test`: passou, 69 arquivos e 181 testes.
- `npm run build`: passou.
- `npm run lint`: passou com 1 warning pré-existente em `src/components/rac-editor/ui/3d/House3DScene.tsx`.

## Métricas Iniciais

- Arquivos com referência a `fabric`: 47.
- Hotspots por tamanho:
  - `src/components/rac-editor/ui/RacEditor.tsx`: 578 linhas.
  - `src/components/rac-editor/lib/house-manager.ts`: 542 linhas.
  - `src/components/rac-editor/ui/canvas/Canvas.tsx`: 347 linhas.
  - `src/components/rac-editor/hooks/canvas/useCanvasEditorEvents.ts`: 279 linhas.
  - `src/components/rac-editor/hooks/canvas/useCanvasFabricSetup.ts`: 239 linhas.
  - `src/components/rac-editor/hooks/usePilotiEditor.ts`: 239 linhas.

## Vazamentos Principais

- `house-manager.ts` mantém `HouseAggregate<CanvasGroup>`, `HousePersistencePort<CanvasGroup>` e `FabricCanvas`.
- `CanvasHandle` expõe `canvas: FabricCanvas | null`.
- Seleções públicas carregam `CanvasGroup`:
  - `PilotiCanvasSelection`.
  - `WallCanvasSelection`.
  - `LinearCanvasSelection`.
  - `TerrainCanvasSelection`.
  - `ContraventamentoCanvasSelection`.
- Hooks de alto nível recebem `CanvasHandle` ou `FabricCanvas`.
- `house-store` expõe snapshot que pode conter grupos Fabric por causa de `HouseState<CanvasGroup>`.
- Histórico/import/export dependem de JSON Fabric e chamam `houseManager.rebuildFromCanvas()`.

## Fronteira Legítima Atual

- `src/components/rac-editor/hooks/canvas/**` para setup/eventos/ponteiro enquanto a transição não termina.
- `src/components/rac-editor/lib/canvas/factory/**` para criação de objetos Fabric.
- `src/components/rac-editor/lib/canvas/**` para helpers de runtime canvas.

## Fronteira Alvo

- Adapters Fabric.
- Factories Fabric.
- Runtime interno de canvas.
- Testes específicos dessa fronteira.

## Snapshot Após Rodada Inicial

- Contracts, store e canvas ports novos não importam Fabric.
- `PilotiEditor` e `usePilotiEditor` não referenciam `CanvasGroup`, `FabricCanvas`, `fabric` ou `houseManager`.
- `houseManager` permanece encapsulado nos adapters legados `legacyPilotiEditorPort` e `legacyHouseReadPort` para as fatias migradas.
- Seleções legadas de piloti, parede, linear e terreno agora carregam DTOs `editorSelection` serializáveis para migração gradual dos consumidores.
- Objetos de canvas passaram a ter `editorObjectId` serializável quando uma seleção pública precisa de identidade estável.

## Ordem Recomendada

1. Criar DTOs serializáveis de seleção.
2. Trocar consumidores externos de `CanvasHandle.canvas` por comandos de alto nível.
3. Separar estado puro da casa de runtime visual.
4. Criar mapper explícito entre runtime canvas e estado/rebuild.
5. Reduzir barrel `lib/canvas/index.ts`.
6. Isolar histórico/import/export.
7. Refatorar piloti, vistas, terreno e contraventamento contra os contratos novos.
