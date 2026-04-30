# Autonomous Loop State

## Run Contract

- Mode: run
- Workflow: executar oito ciclos de refatoração para reduzir acoplamento do `rac-editor`, com commit ao final de cada ciclo.
- Target: `src/components/rac-editor`, `src/infra/house`, `src/domain/house`, documentação operacional em `.agents` e documentação durável quando necessário.
- Execution surface: checkout atual.
- Branch: main
- Worktree, if any: nenhum.
- Loop-state path: `.agents/work-items/20260430-autonomous-loop-rac-editor-clean-architecture.work-item.assets/loop-state.md`
- Max iterations: 8
- Completed iterations: 3
- Stop criteria: oito ciclos concluídos com evidência proporcional, commits locais separados e revisão final dos commits não enviados.
- Safety policy: sem worktree, sem push, sem merge, sem deploy, sem mutação remota e sem comandos destrutivos fora dos arquivos tocados pela frente.
- Evidence policy: typecheck, testes focados por ciclo, build/lint quando o blast radius justificar, `git diff --check`, inspeções `rg` para dependências legadas e revisão final dos commits locais não enviados.

## Checkpoints

| Iteration | Goal | Changes | Verification | Decision | Next |
| --- | --- | --- | --- | --- | --- |
| 1 | Retirar `CanvasGroup` de `HouseRuntimeSnapshot` e `HouseStatePort` | `HouseRuntimeSnapshot<TGroup>` e `HouseStatePort<TGroup>` passaram a ser genéricos; consumidores de canvas declaram `HouseRuntimeSnapshot<CanvasGroup>` explicitamente. | `tsc` passou; testes focados de house-manager/terrain/runtime passaram, 3 arquivos e 13 testes; `git diff --check` passou. | Prosseguir. | Generificar serviços/runtime do `house-manager` para reduzir imports diretos de `CanvasGroup`. |
| 2 | Generificar runtime visual e query service do `house-manager` | Criados `HouseRuntimeGroupRef` e `HouseVisualRuntimePort<TGroup>`; `HouseManagerCanvasRuntime` e `HouseManagerQueryService` passaram a ser genéricos; `CanvasHouseRuntimePort` especializa a porta visual com `CanvasGroup`. | `tsc` passou; testes focados de house-manager/terrain/runtime/ports passaram, 4 arquivos e 15 testes; `git diff --check` passou. | Prosseguir. | Separar leitura lógica da casa de leitura de runtime visual. |
| 3 | Separar leitura lógica de runtime visual | `HouseStatePort` passou a retornar `HouseState`; criado `HouseRuntimeSnapshotPort<TGroup>`; `house-store` passou a expor hooks separados para estado lógico e runtime, mantendo `useHouseSnapshot` como alias de compatibilidade. | `tsc` passou; testes focados de infra/bootstrap/house-manager passaram, 3 arquivos e 14 testes; `git diff --check` passou. | Prosseguir. | Decompor `useRacEditorController`. |

## Failure Signatures

- None yet.

## Final Stop

- Reason:
- Remaining work:
