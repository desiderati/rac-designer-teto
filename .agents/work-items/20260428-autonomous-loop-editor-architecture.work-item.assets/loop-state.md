# Autonomous Loop State

## Run Contract

- Mode: run
- Workflow: executar um programa de refatoração arquitetural em loops pequenos, com baseline, mudança, limpeza, verificação e checkpoint a cada frente.
- Target: editor RAC inteiro, com foco em remover Fabric.js de UI, hooks de alto nível e coordenação de estado; introduzir ports/adapters, commands, store coesa, JSDoc em contratos públicos e testes de regressão.
- Worktree: `C:\Projetos\personal\rac-designer-teto-autonomous-editor-architecture`
- Branch: `codex/autonomous-loop/editor-architecture`
- Loop-state path: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/loop-state.md`
- Max iterations: 10 macro-loops, com até 5 subiterações por macro-loop quando necessário.
- Stop criteria: parar quando os critérios finais forem satisfeitos com evidência, quando 10 macro-loops forem concluídos, quando duas falhas repetidas não produzirem progresso, quando o próximo passo exigir decisão de produto/arquitetura não definida, ou quando a mudança implicar push, merge, deploy, produção, credenciais ou sistemas externos.
- Safety policy: sem push, merge, deploy, mutação remota, comandos destrutivos ou recursos de produção sem confirmação explícita; preservar mudanças alheias; manter alterações dentro da worktree isolada.
- Evidence policy: `rg` para imports de Fabric e dependências proibidas, testes Vitest relevantes, `npm run build`, `npm run lint` quando proporcional, E2E quando o fluxo visual for tocado, `git diff --check`, revisão de diff e checklist arquitetural por loop.

## Program Loops

| Loop | Frente | Status | Critério de saída |
| --- | --- | --- | --- |
| 1 | Baseline e contrato arquitetural | completed | inventário de acoplamentos, regra de fronteiras, plano executável e testes-base definidos |
| 2 | Tipos serializáveis e contratos do editor | completed | seleção/ids/posições sem Fabric como contrato público |
| 3 | Store e commands | completed | comandos explícitos e store sem duplicar fonte de verdade |
| 4 | Canvas ports | completed | portas sem Fabric para eventos/render/histórico/snapshot quando necessário |
| 5 | Piloti como fatia vertical | completed | UI/hooks de piloti sem `CanvasGroup` como dependência pública |
| 6 | Vistas, terreno e house type | in_progress | regras e comandos separados do runtime gráfico |
| 7 | Contraventamento | in_progress | fluxo origem/destino e renderização visual separados por contratos |
| 8 | Histórico, import/export e rebuild | in_progress | convergência para estado serializável sem canvas como fonte canônica |
| 9 | Fabric factories e adapter final | pending | Fabric restrito à fronteira aprovada |
| 10 | God files, JSDoc e consolidação | pending | arquivos grandes fatiados, JSDoc nos contratos e documentação atualizada |

## Checkpoints

| Iteration | Goal | Changes | Verification | Decision | Next |
| --- | --- | --- | --- | --- | --- |
| 1 | Inicializar worktree e contrato operacional | Criada worktree e este loop-state | `git status --short --branch` na worktree | Continuar Loop 1 | Mapear acoplamentos e gerar plano/contratos |
| 1 | Baseline automatizado e inventário inicial | Criados plano, checklist e baseline de fronteira Fabric | `npm run test`, `npm run build`, `npm run lint`; `rg` arquitetural | Loop 1 pode avançar para consolidação | Aguardar arquitetura final e iniciar Loop 2 |
| 1 | Registrar decisão arquitetural proposta | Criado ADR-001 e indexação mínima em docs/OBSIDIAN | `npm run build` passou após contratos iniciais | Decisão fica `proposed` até validação dos loops | Continuar Loop 2 |
| 2 | Criar contratos serializáveis de seleção | Adicionados `editor-ids.ts`, `editor-selection.ts` e smoke test | Teste falhou por arquivo ausente e passou após implementação; `npm run build` passou | Contrato base criado, sem migração de consumidores ainda | Iniciar commands/store |
| 3 | Criar store e commands iniciais | Adicionados `editor-command.ts`, `editor-store.ts` e smoke test | Teste falhou por arquivo ausente e passou após implementação | Store cobre seleção serializável, sem substituir `houseManager` | Criar canvas ports |
| 4 | Criar canvas ports mínimos | Adicionados ports de evento, render e documento com fake adapter em teste | 3 testes de contracts/store/ports passaram; `npm run build` passou | Ports representam capacidades do editor, não métodos Fabric | Iniciar fatia de piloti |
| 5 | Iniciar fatia vertical de piloti | `PilotiCanvasSelection` agora carrega `editorSelection` serializável como campo transitório | Teste de piloti falhou antes do DTO e passou após implementação | Compatibilidade preservada; consumidores antigos ainda usam `group` | Expandir migração dos consumidores |
| 6 | Criar referência serializável de vista | Adicionados `editor-view.ts` e smoke test | Teste falhou por arquivo ausente e passou após implementação | Contrato prepara substituição gradual de runtime visual nas views | Usar em mappers/rebuild futuramente |
| 7 | Criar draft serializável de contraventamento | Adicionados `editor-contraventamento.ts` e smoke test | Teste falhou por arquivo ausente e passou após implementação | Fluxo origem/destino/lado tem contrato sem runtime visual | Migrar hooks de contraventamento futuramente |
| 8 | Validar bloco inicial | Contracts, store, ports e piloti selection validados juntos | 6 arquivos de teste, 13 testes; `npm run build`; `npm run lint`; `git diff --check`; check `rg` sem ocorrências na nova fronteira | Bloco inicial pronto para revisão | Próximo loop deve migrar consumidores reais |
| 9 | Ligar store real ao editor | `RacEditor` passou a compor `EditorStoreProvider`; seleção de piloti dispara commands serializáveis | Testes focados, build e lint passaram | Provider pertence à borda do editor, não apenas à página | Migrar outros editores inline para o mesmo store |
| 10 | Remover runtime visual do editor de piloti | `PilotiEditor` e `usePilotiEditor` deixaram de receber `CanvasGroup`; criado `PilotiEditorPort` com adapter legado | Testes focados passaram; `tsc --noEmit --project tsconfig.app.json` passou | Piloti agora tem porta de aplicação, mas visual feedback ainda usa runtime canvas fora do modal | Atacar navegação/visual feedback por adapter de canvas |
| 11 | Generalizar seleção serializável | Parede, linear e terreno passaram a emitir `editorSelection`; runtime ganhou `editorObjectId` serializável | Testes focados e lint passaram | Seleções legadas preservadas para edição visual; DTOs públicos já existem para store | Migrar ações de aplicação para usar `objectId` em vez de referência |
| 12 | Criar read port da casa | Criados `HouseReadPort` e adapter legado; toolbar e parte da composição do editor usam a porta | Suíte completa passou: 75 arquivos e 197 testes; typecheck de `src` passou | Leitura começa a sair do singleton sem alterar comportamento | Criar write ports/use cases para terreno, família e vistas |
| 13 | Validar fechamento da rodada | Build, lint, diff-check e checagens de fronteira executados | `npm run build` passou; lint só com warning pré-existente; `git diff --check` sem problemas; sem Fabric em contracts/store/ports/application ports/modal piloti | Rodada de 8+ loops concluída sem push/merge/commit | Registrar changelog e entregar síntese |

| 14 | Convergir estrutura para o desenho aprovado | Contracts foram movidos para `canvas/types`, ports para `canvas`, store/commands para `store`, bootstrap para `src/bootstrap` e adapters legados para `infra/house` | `tsc --noEmit`; testes focados; suíte completa; build; lint; `git diff --check`; `rg` sem imports antigos | A estrutura da conversa original faz sentido e foi adotada, exceto `infra/canvas` até existir adapter real | Criar port/adaptador de canvas com capacidade concreta |
| 15 | Reduzir primeira fatia de `CanvasHandle.canvas` | `CanvasHandle` ganhou capacidades pequenas de render, contagem de seleção e feedback visual de piloti; `usePilotiActions` e `RacEditorCanvas` pararam de acessar `.canvas` diretamente | `tsc --noEmit`; testes focados 9/20; suíte completa 75/197; build; lint com warning pré-existente; `git diff --check`; `rg` sem `.canvas` nos arquivos-alvo | A migração deve ser por capacidades do editor, não por exposição do objeto Fabric | Atacar os 13 acessos restantes a `CanvasHandle.canvas` por portas/use cases |
| 16 | Encapsular projeção/reset do canvas no handle | `CanvasHandle` passou a expor `resetSurface`, `getCanvasPointScreenPosition` e `getGroupLocalPointScreenPosition`; tutorial e ferramentas deixaram de ler Fabric diretamente | `tsc --noEmit`; testes focados 11/24; suíte completa 75/197; build; lint com warning pré-existente; `git diff --check` | Projeção de coordenadas pertence ao canvas adapter/handle, não aos hooks de tutorial | Atacar os 10 acessos restantes por fronts separados |
| 17 | Encapsular edição genérica de objetos | Estratégia de edição genérica foi movida para `lib/canvas`; `CanvasHandle` aplica edição e salva histórico; hooks de wall/linear deixaram de ler Fabric | `tsc --noEmit`; teste novo da estratégia; testes focados 10/22; suíte completa 76/199; build; lint com warning pré-existente; `git diff --check` | Edição visual de objeto pertence ao canvas handle/adapter; modais seguem como UI pura | Promover worktree para branch principal incluindo `.agents/*` |

## Failure Signatures

- None yet.

## Previous Stop

Historical stop marker from the previous autonomous run before this continuation.

## Current State

- Reason: execução retomada após aprovação do usuário para continuar a refatoração incremental.
- Last verified state: estrutura convergida ao desenho aprovado e primeira fatia de `CanvasHandle.canvas` removida dos consumidores de piloti/contagem de seleção.
- Remaining work: migrar os 8 acessos restantes a `CanvasHandle.canvas`, separar write ports/use cases de vistas/terreno/família, isolar import/export/rebuild e reduzir `house-manager.ts`/`RacEditor.tsx`.
