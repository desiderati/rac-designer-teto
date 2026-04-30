# Autonomous Loop State

## Run Contract

- Mode: run
- Workflow: executar as oito etapas aprovadas para consolidar `rac-editor` em slices coesos.
- Target: `src/components/rac-editor`, `src/bootstrap`, `src/infra/house` e documentação operacional local.
- Execution surface: checkout atual.
- Branch: main
- Worktree, if any: nenhum.
- Loop-state path: `.agents/work-items/20260429-autonomous-loop-rac-editor-slices-ports.work-item.assets/loop-state.md`
- Max iterations: 8
- Completed iterations: 8
- Remaining iterations: 0
- Stop criteria: etapas aplicadas com comportamento preservado, Ports documentados, JSDoc em pt-BR com acentuação, typecheck e testes relevantes verdes.
- Safety policy: sem worktree, sem push, sem merge, sem deploy, sem mutação remota e sem comandos destrutivos fora dos arquivos desta frente.
- Evidence policy: `tsc`, testes focados por slice, `npm run test`, `npm run build`, `npm run lint`, `git diff --check` e inspeções `rg` de fronteiras.

## User Constraints

- Preservar português do Brasil com acentuação normal em JSDoc e documentação nova.
- Revisar se os métodos em `House*Port` e `PilotiEditorPort` estão semanticamente organizados.
- Documentar os Ports como contratos públicos internos, não como wrappers opacos do `houseManager`.
- Usar o branch atual, sem worktree.

## Baseline

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou antes das mudanças deste loop.
- `rtk npm run test -- src/components/rac-editor/store src/bootstrap src/infra/house`: passou antes das mudanças deste loop, 4 arquivos e 11 testes.
- Working tree inicial já tinha alterações locais em Ports, adapters de `house` e serviços do `house-manager`; essas mudanças serão preservadas.

## Checkpoints

| Iteration | Goal | Changes | Evidence | Decision | Next |
|-----------|------|---------|----------|----------|------|
| 1 | Reorganizar e documentar Ports | Movidos `House*Port` para `src/components/rac-editor/house/store`; movido `PilotiEditorPort` para `src/components/rac-editor/piloti/store`; `HouseWritePort` foi dividido em subinterfaces documentadas. | `tsc` passou; testes focados de `house`, `piloti`, `bootstrap` e `infra/house` passaram, 3 arquivos e 7 testes. | Prosseguir. | Criar slice `viewer3d` e mover UI/lib do 3D. |
| 2 | Criar slice `viewer3d` | Movidos `House3DViewer`, `House3DScene`, overlay, testes e parsers/constants 3D para `src/components/rac-editor/viewer3d/{ui,lib}`; imports de código atualizados. | `tsc` passou; `vitest run src/components/rac-editor/viewer3d` passou, 6 arquivos e 16 testes. | Prosseguir. | Decompor `House3DViewer` em modelo, ações e UI. |
| 3 | Decompor `House3DViewer` | Criados `useHouse3DViewerModel` e `useHouse3DViewerActions`; o componente ficou focado no dialog e na cena. | `tsc` passou; `vitest run src/components/rac-editor/viewer3d` passou, 6 arquivos e 16 testes. | Prosseguir. | Decompor `House3DScene` em meshes/helpers. |
| 4 | Decompor `House3DScene` | Criados `House3DTerrainMeshes`, `House3DStructureMeshes`, `House3DStairsMesh` e `scene-geometry`; `House3DScene` virou compositor. | `tsc` passou; `vitest run src/components/rac-editor/viewer3d` passou, 6 arquivos e 16 testes. | Prosseguir. | Criar slice `modals`. |
| 5 | Criar slice `modals` | Movidos dialogs, selectors, editors, hooks de modais e wrappers de overlay para `src/components/rac-editor/modals/{ui,hooks}`; imports atualizados. | `tsc` passou; `vitest run src/components/rac-editor/modals` passou, 1 arquivo e 1 teste. | Prosseguir. | Reduzir `useRacEditorController` e builders. |
| 6 | Limpar controller e JSDoc | Removidos separadores corrompidos de `useRacEditorController`; JSDoc sem acentuação corrigido em controller, canvas controller e serviços do house-manager. | `tsc` passou; `vitest run src/components/rac-editor/hooks src/infra/house` passou, 3 arquivos e 7 testes. | Prosseguir. | Avançar use cases/ports de `house`. |
| 7 | Avançar use cases de `house` | Extraída `resolvePilotiUpdateEffects` para `domain/house/use-cases/house-piloti.use-case.ts`; `house-manager-piloti` passou a consumir a decisão pura. | `tsc` passou; testes de `domain/house` e `house-manager` passaram, 8 arquivos e 48 testes. | Prosseguir. | Consolidar docs, checks arquiteturais e validação ampla. |
| 8 | Consolidar documentação e validação | README e playbook atualizados para `modals`, `viewer3d`, `house` e `piloti`; comentários/JSDoc tocados foram normalizados em pt-BR com acentuação; inspeções de fronteira confirmaram ausência de Fabric fora de `canvas`. | `tsc`, `npm run test`, `npm run build`, `npm run lint`, `git diff --check` e inspeções `rg` passaram. | Encerrar loop. | Commitar o fechamento no branch atual. |

## Failure Signatures

- None yet.
