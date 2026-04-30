# Autonomous Loop State

## Run Contract

- Mode: run
- Workflow: executar os oito itens aprovados para reorganizar a feature `rac-editor` em ciclos pequenos.
- Target: `src/components/rac-editor`, bootstrap do editor e registros operacionais locais.
- Execution surface: checkout atual.
- Branch: main
- Worktree, if any: nenhum.
- Loop-state path: `.agents/work-items/20260429-autonomous-loop-rac-editor-structure.work-item.assets/loop-state.md`
- Max iterations: 8
- Completed iterations: 5
- Remaining iterations: 3
- Stop criteria: itens aprovados aplicados com typecheck, testes relevantes, build, lint, diff review e regras de dependência verificadas.
- Safety policy: sem worktree, sem push, sem merge, sem deploy, sem mutação remota e sem comandos destrutivos fora dos arquivos tocados por esta frente.
- Evidence policy: `tsc`, testes focados, `npm run test`, `npm run build`, `npm run lint`, `git diff --check`, inspeções `rg` de imports Fabric e paths legados.

## Autonomy Boundaries

- Allowed: mover arquivos dentro de `src/components/rac-editor`, atualizar imports, renomear símbolos acordados, atualizar registros locais de continuidade e executar verificações locais.
- Requires confirmation: ampliar escopo para domínio fora da frente aprovada, mudar comportamento funcional, criar worktree, push, merge, deploy ou mutação remota.
- Blocked: operação destrutiva ampla, alteração de segredo, infra, produção ou recursos externos.

## Checkpoints

| Iteration | Goal | Changes | Evidence | Decision | Next |
|-----------|------|---------|----------|----------|------|
| 1 | Consolidar `canvas` fisicamente | Movidos hooks, lib, ui e ports/tipos de canvas para `src/components/rac-editor/canvas/{hooks,lib,store,ui}`; contrato serializável antigo renomeado para `CanvasSerializedDocumentPort`. | `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou. | Prosseguir. | Validar fronteira Fabric e seguir para provider/store. |
| 2 | Fechar vazamentos Fabric fora do slice `canvas` | Movido `house-auto-stairs` para `canvas/lib`; extraído `createHouseGroupForView` para `canvas/lib/house-view-groups.ts`; `house-view.ts` ficou restrito a metadados e labels. | `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou. | Prosseguir. | Renomear provider/store do editor. |
| 3 | Renomear provider do editor | `EditorStoreProvider` virou `RacEditorStoreProvider`; mensagens de erro e testes foram atualizados. | `tsc` passou; `vitest run src/bootstrap/editor-context.smoke.test.tsx src/components/rac-editor/canvas/store/canvas-ports.smoke.test.ts` passou, 4 testes. | Prosseguir. | Migrar `toolbar` para `menus` com `CanvasToolsMenu`. |
| 4 | Migrar `toolbar` para `menus` | Movidos hooks, tipos, configs e UI para `src/components/rac-editor/menus`; `Toolbar` virou `RacEditorMenus`; `SideRail` virou `CanvasToolsMenu`; `UserAvatarMenu` virou `UserMenu`. | `tsc` passou; `vitest run src/components/rac-editor/menus src/components/rac-editor/hooks/useHotkeys.smoke.test.tsx` passou, 6 arquivos e 13 testes. | Prosseguir. | Atualizar registros de continuidade e rodar validação ampla. |
| 5 | Validar e registrar a iteração | README, playbook, ADR, changelog e registro de refatoração atualizados; validação ampla executada. | `tsc` passou; `npm run test` passou, 85 arquivos e 221 testes; `npm run build` passou; `npm run lint` passou com warning pré-existente; `rg` validou fronteiras; `git diff --check` teve apenas avisos LF -> CRLF. | Parar por critérios satisfeitos. | Stage e commit. |

## Failure Signatures

- None yet.

## Final Stop

- Reason: critérios aprovados da iteração satisfeitos com evidência.
- Remaining work: próximos ciclos podem separar `viewer3d`, `modals`, domínio `house`/use cases e reduzir `useRacEditorController`.
- Next action: stage e commit da iteração.
