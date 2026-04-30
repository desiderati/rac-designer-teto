---
title: "Refactoring - Fronteira do runtime do editor"
doc_role: refactoring
created: 2026-04-28
updated: 2026-04-28
tags: [refactoring, architecture, rac-editor]
---

# Refactoring - Fronteira do runtime do editor

## 1. Contexto e Escopo

- prompt de origem desta execução: `.agents/refactorings/prompts/refactoring-editor-runtime-boundary.prompt.md`
- review de origem (opcional): não aplicável.
- objetivo operacional: convergir a estrutura do editor para fronteiras explícitas e reduzir dependências diretas do runtime Fabric em UI/hooks.
- escopo incluído: organização de `bootstrap`, contratos de canvas/editor, store local, adapters legados de house e primeira redução de `CanvasHandle.canvas`.
- escopo excluído: reescrita completa de `house-manager.ts`, import/export, histórico, debug bridge e validação visual manual.
- slugs de candidatos selecionados para esta rodada: `editor-runtime-boundary`, `canvas-handle-escape-hatch`.
- slugs de candidatos deliberadamente adiados: `house-manager-god-file`, `rac-editor-god-file`, `fabric-adapter-final`.
- constraints relevantes: preservar comportamento, manter Fabric no runtime visual durante a migração, sem push/merge/deploy.
- perfil de risco: `medium`
- modo de execução: `direct`

## 2. Inventário e Diagnóstico

### 2.1 Inventário funcional

- superfície analisada: editor RAC, hooks de canvas, store do editor, contratos serializáveis, adapters legados de house.
- funções/entrypoints relevantes: `RacEditor`, `Canvas`, `usePilotiActions`, `usePilotiEditor`, `EditorStore`, `HouseReadPort`, `PilotiEditorPort`.
- integrações e serviços externos: Fabric.js como runtime visual local; sem serviços remotos tocados.

### 2.2 Mapa de Acoplamento

- pontos de alto fan-in/fan-out: `CanvasHandle.canvas`, `houseManager`, `RacEditor.tsx`.
- dependências internas críticas: seleção visual de objetos, contagem de vistas, edição de piloti e renderização de canvas.
- fronteiras naturais de módulo: `bootstrap` para composição, `canvas` para contratos de interação visual, `store` para estado/commands, `infra` para adapters legados.

### 2.3 Catálogo de Smells

- `[SOLID]` DIP fraco quando hooks/UI dependem diretamente de objetos Fabric.
- `[CLEAN]` arquivos grandes acumulam coordenação de UI, estado e runtime visual.
- `[PATTERN]` ports/adapters ajudam quando representam capacidades reais, não apenas novos nomes.
- `[RISK]` `CanvasHandle.canvas` continua como escape hatch e pode perpetuar dependência em Fabric.
- `[DX]` testes ficam mais difíceis quando seleção e escrita dependem de referências vivas do canvas.

### 2.4 Cobertura de Testes

- cobertura existente: Vitest cobre domínio, canvas helpers, store, ports e fluxos principais de UI.
- áreas sem rede de segurança: validação visual manual do editor e fluxos completos de import/export/histórico.
- risco associado: médio; mitigado por typecheck, testes focados, suíte completa, build e lint.

### 2.5 Continuidade da Frente

- prompt durável anterior consultado: não havia.
- execuções anteriores consultadas: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/loop-state.md`.
- o que já foi resolvido: contratos serializáveis, store inicial, ports de canvas, read/write ports legados para piloti/house, estrutura alinhada ao desenho discutido.
- regressões ou falhas ainda abertas: nenhuma observada.
- blockers atuais: remoção incremental dos demais acessos a `CanvasHandle.canvas` e decomposição de `house-manager.ts`.

## 3. Findings

### Finding 1

- descrição: Fabric.js vazava para hooks e UI por meio de `CanvasHandle.canvas`.
- problema estrutural: leaky abstraction.
- severidade: `high`
- impacto: dificulta testes e impede que UI dependa de capacidades sem conhecer o runtime gráfico.

### Finding 2

- descrição: a estrutura inicial de contratos estava correta em intenção, mas parte dela ficava distante do desenho aprovado pelo usuário.
- problema estrutural: module boundary drift.
- severidade: `medium`
- impacto: piora navegabilidade e reduz a clareza de onde procurar bootstrap, ports, store e adapters.

## 4. Solution Design

### 4.1 Arquitetura proposta

- módulos/arquivos:
  - `src/bootstrap/*`: composição e contexto do editor.
  - `src/components/rac-editor/canvas/*`: ports e tipos públicos de canvas/editor.
  - `src/components/rac-editor/store/*`: store, commands e application ports do editor.
  - `src/infra/house/*`: adapters legados que encapsulam `houseManager`.
- responsabilidade de cada módulo: manter dependências caminhando de UI para contratos e adapters, não de UI para Fabric/house singleton.
- estratégia de namespace: barrel mínimo em `canvas/types.ts` para tipos públicos.

### 4.2 Decisões de design

#### Decisão 1

- decisão tomada: não criar `src/infra/canvas/FabricCanvasAdapter.ts` até haver um port concreto a implementar.
- alternativas consideradas: mover Fabric para `infra/canvas` imediatamente como casca nominal.
- justificativa: um adapter sem contrato real apenas deslocaria acoplamento e passaria falsa sensação de arquitetura limpa.
- trade-offs aceitos: a pasta `infra/canvas` fica pendente por mais um ciclo.
- candidata a ADR: não; a decisão já está coberta pelo ADR proposto sobre fronteira do editor/runtime.

## 5. Implementation Plan

### Passo 1

- o que muda: mover contratos e store para a estrutura aprovada.
- status da frente: `concluído`
- pré-condição para executar: testes existentes e plano de arquitetura.
- finding / slug de candidato relacionado: `editor-runtime-boundary`
- transformação: move.
- por quê: alinhar estrutura com a linguagem operacional da equipe.
- critério de verificação: imports antigos ausentes e build/testes passando.
- rollback: reverter moves e imports correspondentes.

### Passo 2

- o que muda: expor capacidades pequenas em `CanvasHandle` para piloti e contagem de seleção.
- status da frente: `concluído`
- pré-condição para executar: manter comportamento visual por delegação interna ao canvas.
- finding / slug de candidato relacionado: `canvas-handle-escape-hatch`
- transformação: introduce interface.
- por quê: reduzir acesso direto ao runtime Fabric nos consumidores.
- critério de verificação: `usePilotiActions.ts` e `RacEditorCanvas.tsx` sem `canvasRef.current.canvas`, testes e typecheck passando.
- rollback: retornar chamadas diretas ao canvas legado.

## 6. Validation Strategy

- perfil de risco: médio.
- modo de execução: direto.
- justificativa do modo: há suíte local robusta e as mudanças foram incrementais.
- Fase 0 / baseline: ativa; baseline coberto por loop-state, testes existentes e smoke tests adicionados em ciclos anteriores.
- regression checklist da rodada: `.agents/refactorings/2026-04/20260428-2308-editor-runtime-boundary.regression-checklist.md`.
- validação local: typecheck, testes focados, suíte completa, build, lint, diff-check e `rg`.
- validação remota: não aplicável; sem push/deploy.
- critérios de aceite: comportamento preservado, estrutura convergente e nenhuma dependência antiga nas fronteiras movidas.
- gaps de validação intencionais: sem inspeção visual manual neste ciclo.

## 7. Registro de Execução

### Ciclo 1/3

#### Prompt de origem

- arquivo: `.agents/refactorings/prompts/refactoring-editor-runtime-boundary.prompt.md`
- vínculo explícito: frente `editor-runtime-boundary`
- objetivo do ciclo: alinhar estrutura e reduzir primeira dependência direta de `CanvasHandle.canvas`.

#### Executado

- findings / slugs de candidatos atacados neste ciclo: `editor-runtime-boundary`, `canvas-handle-escape-hatch`.
- regression run / evidências desta rodada: `.agents/refactorings/2026-04/20260428-2308-editor-runtime-boundary.regression-run.md`.
- estrutura convergida para `bootstrap`, `canvas`, `store` e `infra/house`.
- `CanvasHandle` passou a expor capacidades pequenas para renderização, contagem de seleção e feedback visual de piloti.
- `usePilotiActions.ts` e `RacEditorCanvas.tsx` deixaram de acessar `canvasRef.current.canvas`.
- `CanvasHandle` passou a expor projeção de pontos e reset de superfície.
- `useCanvasTools.ts` e `useTutorialUiActions.ts` deixaram de acessar `canvasRef.current.canvas`.
- A estratégia de edição genérica foi movida de modal UI para `lib/canvas`.
- `CanvasHandle` passou a aplicar edição genérica de objetos e salvar histórico.
- `useWallEditorActions.ts` e `useLinearEditorActions.ts` deixaram de acessar `canvasRef.current.canvas`.

#### Validação

- `rtk npm exec -- tsc --noEmit --project tsconfig.app.json`: passou.
- testes focados: passaram, 9 arquivos e 20 testes.
- `rtk npm run test`: passou, 75 arquivos e 197 testes.
- `rtk npm run build`: passou.
- `rtk npm run lint`: passou com warning pré-existente em `House3DScene.tsx`.
- `rtk git diff --check`: passou.
- testes focados de tutorial/projeção/canvas: passaram, 11 arquivos e 24 testes.
- teste novo de estratégia genérica: passou.
- suíte completa após a última fatia: passou, 76 arquivos e 199 testes.

#### Smells remanescentes

- `critical`: nenhum identificado nesta rodada.
- `high`: `house-manager.ts` ainda é núcleo pesado; `CanvasHandle.canvas` ainda possui 8 acessos diretos em outros hooks.
- `medium`: import/export, histórico e debug bridge ainda dependem de Fabric.
- `low`: alguns nomes de fronteira ainda podem ser refinados após novas migrações reais.

#### Decisão

- findings / slugs de candidatos adiados neste ciclo: `house-manager-god-file`, `rac-editor-god-file`, `fabric-adapter-final`.
- continuar | encerrar | aguardar aprovação: continuar em próximo ciclo.

## 8. Outcome / Verdict

- veredito: `pass`
- resultado alcançado: estrutura convergida e redução real de `CanvasHandle.canvas` validada em piloti, contagem de seleção, tutorial, projeção visual e edição genérica.
- findings / slugs de candidatos endereçados: `editor-runtime-boundary`, parcialmente `canvas-handle-escape-hatch`.
- findings / slugs de candidatos adiados: `house-manager-god-file`, `rac-editor-god-file`, `fabric-adapter-final`.
- classificação de fechamento: `durável`
- justificativa da classificação: a rodada define fronteiras consultáveis para ciclos posteriores e registra decisão deliberada de não criar adapter nominal.
- registro durável destino: este arquivo.
- referência do changelog: `.agents/changelogs/2026-04/20260428.changelog.md`
- desvios decididos: `infra/canvas/FabricCanvasAdapter.ts` adiado até existir port concreto.
- riscos residuais: 8 acessos diretos restantes a `CanvasHandle.canvas`, God Files e validação visual manual pendente.
- recomendação de ADR no fechamento: não.
- justificativa curta da recomendação de ADR: o ADR proposto existente já cobre a decisão arquitetural principal desta frente.

## 9. Artefatos Relacionados

### 9.1 Artefatos operacionais

- code-review de origem: não aplicável.
- work-item: `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/loop-state.md`
- changelog diário: `.agents/changelogs/2026-04/20260428.changelog.md`
- execuções absorvidas neste registro durável: ciclo estrutural de 2026-04-28 23:08.
- regression checklist da execução: `.agents/refactorings/2026-04/20260428-2308-editor-runtime-boundary.regression-checklist.md`
- regression run da execução: `.agents/refactorings/2026-04/20260428-2308-editor-runtime-boundary.regression-run.md`
- sidecar da execução: não aplicável.
- arquivos alterados: ver `git diff --stat`.

### 9.2 Decisões promovidas

- ADRs criados nesta frente: nenhum novo.
- ADRs relacionados: `docs/architecture-decisions/ADR-001-fronteira-editor-runtime-fabric.md`
