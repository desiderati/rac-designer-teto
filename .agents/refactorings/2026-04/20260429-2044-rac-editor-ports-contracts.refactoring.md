---
title: "Refactoring - Contratos de Ports do RAC Editor"
doc_role: refactoring
created: 2026-04-29
updated: 2026-04-29
tags: [ refactoring, rac-editor, ports, canvas, house ]
---

# Refactoring - Contratos de Ports do RAC Editor

## 1. Contexto e Escopo

- prompt de origem: `.agents/refactorings/prompts/refactoring-rac-editor-ports-contracts.prompt.md`
- objetivo: corrigir nomes, diretórios e semântica dos Ports antes de novos ciclos de decomposição.
- escopo incluído: Ports do RAC editor, Ports de canvas, adapters de house/canvas, viewer 3D e documentação canônica.
- escopo excluído: mudança funcional deliberada, troca de runtime gráfico, worktree, push e deploy.
- perfil de risco: `medium`
- modo de execução: `direct`

## 2. Diagnóstico

- `store/` misturava stores reais com contratos de capacidade.
- `PilotiEditorPort` duplicava semanticamente os contratos de leitura e escrita de pilotis.
- `HouseEditorPort` e `HousePilotiPort` agregavam capacidades sem deixar claro se o consumidor lia, escrevia ou fazia ambos.
- `HouseWritePort` herdava leituras de vista, tornando o nome menos honesto.
- `insert3DSnapshotOnCanvas` estava na porta de ciclo de vida da casa, embora a ação pertença ao canvas.
- `CanvasHouseManagerPort` carregava o nome do legado, não a capacidade real.

## 3. Decisões

- `src/components/rac-editor/store` fica reservado a stores reais.
- Ports gerais do editor passam para `src/components/rac-editor/ports`.
- Ports do canvas passam para `src/components/rac-editor/canvas/ports`.
- `CanvasHouseManagerPort` foi renomeado para `CanvasHouseRuntimePort`.
- `PilotiEditorPort` foi substituído por `HousePilotiReadPort` e `HousePilotiWritePort`, mantidos em `HousePilotiPort.ts` sem tipo agregado.
- `HouseViewReadPort` e `HouseViewWritePort` foram movidos para `HouseViewPort.ts`.
- `HouseReadPort` passou a compor leituras de setup, ciclo de vida, terreno, vistas e pilotis.
- `HouseWritePort` passou a compor apenas comandos de setup, ciclo de vida, terreno, vistas e pilotis.
- O bootstrap passou a expor `houseReadPort` e `houseWritePort`, sem `HouseEditorPort`.
- Inserção de snapshot 3D passou a depender de `CanvasSnapshotPort`.

## 4. Execução

- Movidos e documentados Ports de house, canvas e domínio.
- Criado `HouseViewPort.ts` para separar leitura e escrita de vistas.
- Criado `CanvasSnapshotPort.ts` e adapter Fabric dedicado.
- `useHouse3DViewerActions` passou a inserir snapshots via `canvasRef.current.createSnapshotPort()`.
- `house-manager-read-adapter.ts` passou a implementar as leituras de casa, vistas, terreno e pilotis.
- `house-manager-write-adapter.ts` ficou restrito aos comandos de escrita da casa.
- `usePilotiEditor` passou a depender de `HousePilotiReadPort` e `HousePilotiWritePort`, com dados de domínio.
- Removido o adapter `house-manager-piloti-editor-adapter.ts`.
- Atualizados README e `PLAY-004` para refletir `ports/` e `canvas/ports/`.

## 5. Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- Testes focados de Ports/adapters/house: passaram, 9 arquivos e 22 testes.
- `rtk npm run test`: passou, 86 arquivos e 222 testes.
- `rtk npm run build`: passou.
- `rtk npm run lint`: passou.
- `rtk git diff --check`: passou.
- Varredura `rg` não encontrou `PilotiEditorPort`, `insert3DSnapshotOnCanvas`,
  `CanvasHouseManagerPort`, `HouseManagerCanvasPort` ou imports antigos de Port no código de produção.
- Varredura `rg` não encontrou `HouseEditorPort`, `HousePilotiPort` agregado ou `housePort` no código de produção.
- Varredura simples de JSDoc verificou 17 arquivos de Port sem encontrar membros sem comentário imediato.

## 6. Outcome / Verdict

- veredito: `completed`
- classificação de fechamento: `durável`
- justificativa da classificação: mudança estrutural de contrato que deve permanecer como referência.
- referência do changelog: `.agents/changelogs/2026-04/20260429.changelog.md`
- recomendação de ADR no fechamento: `não`
- justificativa curta da recomendação de ADR: a ADR da fronteira Fabric já cobre a direção; este ciclo corrige nomenclatura e contratos internos.
