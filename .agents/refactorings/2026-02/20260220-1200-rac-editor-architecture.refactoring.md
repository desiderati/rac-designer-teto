---
title: "Refactoring — Arquitetura do editor RAC"
doc_role: refactoring
created: 2026-02-20
updated: 2026-04-20
tags: [ refactoring ]
---

# Refactoring — Arquitetura do editor RAC

> Documento retroconvertido em 2026-04-20 a partir do acervo legado já absorvido na camada durável atual.
>
> O horário `1200` do basename foi sintetizado apenas para atender o padrão canônico `yyyyMMdd-hhmm`.
>
> Documentos irmãos desta execução:
> `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-checklist.md`
> `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-run.md`

## 1. Contexto e Escopo

- prompt de origem desta execução:
  `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- review de origem (opcional):
  não havia `code-review` no padrão novo; a continuidade veio de `analysis-report.md` e planos legados.
- objetivo operacional:
  reduzir acoplamento estrutural do editor RAC, separar UI, hooks, runtime de canvas, domínio, persistência e projeção
  3D.
- escopo incluído:
  `RacEditor`, `Canvas`, `house-manager`, 2D/3D, toolbar, modais, tutorial, views, pilotis, rebuild/import e flows de
  canvas.
- escopo excluído:
  componentes genéricos de `src/components/ui/*` e mudanças de comportamento externo do produto.
- slugs de candidatos selecionados para esta rodada:
  não aplicável no legado.
- slugs de candidatos deliberadamente adiados:
  não aplicável no legado.
- constraints relevantes:
  preservar UX do editor, não reintroduzir paths legados como estado atual, manter baseline antes de reestruturação
  ampla.
- perfil de risco: `high`
- modo de execução: `gated`
- fontes legadas absorvidas:
    - `refactoring-plan.md` de `2026-02-20`
    - `regression-checklist.md` de `2026-02-20`
    - `regression-run.md` de `2026-02-20`
    - `refactoring-plan.md` de `2026-02-26`
    - `analysis-report.md` de `2026-02-27`
    - `refactoring-plan.md` de `2026-02-27`
    - `regression-checklist.md` de `2026-02-27`
- mapeamento legado -> atual:
    - `src/components/rac-editor/RacEditor.tsx` -> `src/components/rac-editor/ui/RacEditor.tsx`
    - `src/components/rac-editor/Canvas.tsx` -> `src/components/rac-editor/ui/canvas/Canvas.tsx`
      e `src/components/rac-editor/hooks/canvas/*`
    - `src/lib/house-manager.ts` -> `src/components/rac-editor/lib/house-manager.ts`
    - `src/lib/canvas-utils.ts` -> `src/components/rac-editor/lib/canvas/*`
    - `House3DScene` / `House3DViewer` -> `src/components/rac-editor/ui/3d/*`

## 2. Inventário e Diagnóstico

### 2.1 Inventário funcional

- superfície analisada:
  editor principal, toolbar, modais, canvas 2D, piloti, views, contraventamento, tutorial, persistência e visualização
  3D.
- funções/entrypoints relevantes:
  criação de casa, gestão de vistas, edição de piloti, ações de toolbar, viewport/histórico do canvas, snapshot 3D,
  import/export.
- integrações e serviços externos:
  runtime de canvas/Fabric, storage local, viewer 3D e suites de teste locais.

### 2.2 Mapa de Acoplamento

- pontos de alto fan-in/fan-out:
  `RacEditor`, `Canvas`, `house-manager`, `House3DScene`, `House3DViewer`.
- dependências internas críticas:
  UI -> hooks -> lib/canvas -> manager -> domínio compartilhado; viewer 3D -> parsers -> estado da casa;
  toolbar/modais -> seleção ativa.
- fronteiras naturais de módulo:
  `ui/*`, `hooks/*`, `lib/canvas/*`, `lib/3d/*`, `lib/house-manager.ts`, `src/domain/*`, `src/infra/*`.

### 2.3 Catálogo de Smells

- `[SOLID]` componente raiz e hooks com responsabilidades demais.
- `[CLEAN]` utilitários grandes, wiring espalhado, magic numbers e casts de runtime.
- `[PATTERN]` necessidade de strategies, helpers compartilhados e portas explícitas nas fronteiras certas.
- `[RISK]` regressões de viewport, rebuild/import, 3D e wiring de modais.
- `[DX]` baixa previsibilidade de onde editar sem quebrar o editor inteiro.

### 2.4 Cobertura de Testes

- cobertura existente:
  o acervo histórico mostra evolução real de smoke/E2E, mas a análise de `2026-02-27` ainda marca cobertura baixa para a
  superfície total do editor.
- áreas sem rede de segurança:
  parte relevante de 3D, contraventamento ponta a ponta, import/export e algumas áreas críticas de
  `components/rac-editor`.
- risco associado:
  alto; a própria frente nasceu exigindo Fase 0.

### 2.5 Continuidade da Frente

- prompt durável anterior consultado:
  nenhum no padrão novo; este arquivo inaugura a frente.
- execuções anteriores consultadas:
  bundle legado de `2026-02-20`, continuidade de `2026-02-22/23`, reanálises de `2026-02-26/27`.
- o que já foi resolvido:
  segmentação relevante de hooks/canvas, introdução de `src/domain`, `src/infra`, `src/shared` e parsers 3D mais
  explícitos.
- regressões ou falhas ainda abertas:
  hooks ainda volumosos, `RacEditor` ainda central, risco de wiring e baixa cobertura em áreas específicas.
- blockers atuais:
  blast radius alto e dependência contínua de regressão explícita.

## 3. Findings

### Finding 1

- descrição:
  a frente histórica foi aberta porque `RacEditor`, `Canvas` e `house-manager` concentravam coordenação demais.
- problema estrutural:
  god component + orchestration hub + global state coupling.
- severidade: `critical`
- impacto:
  qualquer mudança em modal, toolbar, viewport ou estado da casa podia quebrar múltiplos fluxos.

### Finding 2

- descrição:
  o runtime de canvas acumulava viewport, histórico, seleção, atalhos, pointer interactions e rebuild sem fronteira
  simples.
- problema estrutural:
  shotgun surgery + hidden side effects.
- severidade: `high`
- impacto:
  regressões frequentes em zoom/pan/minimap/copy-paste/undo-redo e dificuldade de testar isolamento.

### Finding 3

- descrição:
  a fronteira 2D/3D misturava visualização, parsing e parte da regra da casa.
- problema estrutural:
  feature envy + mixed responsibilities.
- severidade: `high`
- impacto:
  risco de divergência entre projeto 2D, visualização 3D e snapshot.

### Finding 4

- descrição:
  o fluxo de tutorial, settings e persistência local aparecia em camadas visuais e de wiring do editor.
- problema estrutural:
  DIP/SRP violados.
- severidade: `medium`
- impacto:
  baixa testabilidade e aumento do acoplamento incidental da UI.

### Finding 5

- descrição:
  a cobertura histórica melhorou bastante, mas a frente ainda dependia de checklist/run explícitos para suportar
  mudanças amplas.
- problema estrutural:
  risk hotspot.
- severidade: `high`
- impacto:
  refatorações grandes sem baseline tenderiam a produzir regressão difícil de detectar.

## 4. Solution Design

### 4.1 Arquitetura proposta

- módulos/arquivos:
    - `src/components/rac-editor/ui/*` para composição visual e containers finos
    - `src/components/rac-editor/hooks/*` para flows coesos
    - `src/components/rac-editor/lib/canvas/*` para runtime e helpers 2D
    - `src/components/rac-editor/lib/3d/*` para parsing/projeção 3D
    - `src/components/rac-editor/lib/house-manager.ts` como fronteira transitória, não centro absoluto
    - `src/domain/*` e `src/infra/*` para regras e adapters explícitos
- responsabilidade de cada módulo:
  UI compõe; hooks coordenam; `lib` executa detalhes da feature; domínio decide regra; infra implementa
  storage/adapters.
- estratégia de namespace:
  considerar os paths legados apenas como proveniência; a estrutura atual é a autoridade.

### 4.2 Decisões de design

#### Decisão 1

- decisão tomada:
  preservar a decomposição por fatias funcionais em vez de uma reescrita “clean architecture” de uma vez.
- alternativas consideradas:
  big bang arquitetural; introdução precoce de novas camadas genéricas.
- justificativa:
  o próprio acervo histórico convergiu para redução incremental do risco.
- trade-offs aceitos:
  coexistência temporária de estruturas transitórias.
- candidata a ADR: não

#### Decisão 2

- decisão tomada:
  manter checklist e run explícitos para esta frente ampla.
- alternativas consideradas:
  confiar apenas em narrativa de refactoring.
- justificativa:
  o ledger legado provou valor justamente por separar contrato e evidência.
- trade-offs aceitos:
  mais artefatos Markdown para manter.
- candidata a ADR: não

## 5. Implementation Plan

### Passo 1

- o que muda:
  recalibrar baseline e mapear hotspots atuais antes de qualquer nova extração estrutural.
- status da frente: `retomado`
- pré-condição para executar:
  checklist atualizado e leitura deste bundle retroconvertido.
- finding / slug de candidato relacionado:
  Findings 1, 2, 5.
- transformação:
  `extract baseline`
- por quê:
  a frente é de alto risco e já tem histórico de regressões.
- critério de verificação:
  checklist e run atualizados com evidência recente.
- rollback:
  parar a frente sem mudança estrutural.

### Passo 2

- o que muda:
  seguir reduzindo coordenação indevida em `RacEditor` e `Canvas` por hooks coesos e módulos claros.
- status da frente: `retomado`
- pré-condição para executar:
  baseline funcional e aprovação explícita se a rodada for ampla.
- finding / slug de candidato relacionado:
  Findings 1 e 2.
- transformação:
  `extract hook` + `extract module`
- por quê:
  esses hotspots continuam definindo o custo de mudança do editor.
- critério de verificação:
  fluxos críticos do canvas e dos modais seguem íntegros.
- rollback:
  reverter a fatia funcional recém-extraída.

### Passo 3

- o que muda:
  manter 3D como projeção derivada e estabilizar a fronteira com o estado 2D.
- status da frente: `retomado`
- pré-condição para executar:
  contrato atual entre viewer, parsers e snapshot mapeado.
- finding / slug de candidato relacionado:
  Finding 3.
- transformação:
  `move` + `extract module`
- por quê:
  o 3D é um hotspot funcional e arquitetural ao mesmo tempo.
- critério de verificação:
  viewer abre, renderiza e insere snapshot sem quebrar o 2D.
- rollback:
  restaurar parser/adaptação anterior da fatia tocada.

## 6. Validation Strategy

- perfil de risco:
  `high`
- modo de execução:
  `gated`
- justificativa do modo:
  frente ampla com histórico de regressões, persistência, wiring e fronteira 2D/3D.
- Fase 0 / baseline:
  obrigatória.
- regression checklist da rodada:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-checklist.md`
- validação local:
  smoke tests, build, tipagem e E2E críticos.
- validação remota:
  não aplicável ao acervo legado; registrar como gap quando necessário.
- critérios de aceite:
  fluxos críticos preservados e evidência factual atualizada.
- gaps de validação intencionais:
  lint global legado e parte de validação manual visual 3D/contraventamento.

## 7. Registro de Execução

### Ciclo 1/1

#### Prompt de origem

- arquivo:
  `.agents/prompts/refactoring-rac-editor-architecture.prompt.md`
- vínculo explícito:
  prompt durável retrocalibrado a partir do acervo de `2026-02-20` a `2026-02-27`
- objetivo do ciclo:
  consolidar em um bundle durável único a trajetória histórica da frente ampla do editor.

#### Executado

- findings / slugs de candidatos atacados neste ciclo:
    - decomposição inicial de canvas/editor
    - expansão de baseline e E2E
    - extrações incrementais em `RacEditor`, `Canvas`, tutorial, piloti e views
    - primeiros movimentos de domínio/aplicação
- regression run / evidências desta rodada:
  ver documento irmão `20260220-1200-rac-editor-architecture.regression-run.md`
- item:
  subrodadas históricas de `2026-02-20`, `2026-02-22`, `2026-02-23` e continuidade analítica `2026-02-26/27` foram
  absorvidas neste registro.

#### Validação

- item:
  baseline manual e expansão progressiva de smoke/E2E preservados no ledger factual.

#### Smells remanescentes

- `critical`:
  nenhum comprovadamente aberto após a retroconversão; a frente segue com risco alto, mas não com blocker factual novo.
- `high`:
  componente raiz ainda central, hooks volumosos, fronteira 2D/3D ainda sensível.
- `medium`:
  persistência/configurações/tutoriais e legibilidade de alguns contratos.
- `low`:
  naming e simplificações de detalhes locais.

#### Decisão

- findings / slugs de candidatos adiados neste ciclo:
  consolidações adicionais de domínio, store central e eventual ADR de fronteira.
- continuar | encerrar | aguardar aprovação:
  encerrar o bundle retroativo e usar o prompt durável para futuras ondas.

## 8. Outcome / Verdict

- veredito: `partial`
- resultado alcançado:
  o acervo legado da frente ampla foi convertido em contrato durável, checklist e ledger no padrão novo, preservando a
  continuidade histórica e o mapeamento para a estrutura atual.
- findings / slugs de candidatos endereçados:
  Findings 1 a 5 foram absorvidos como memória operacional explícita da frente.
- findings / slugs de candidatos adiados:
  aprofundamentos futuros em store, redução adicional de `RacEditor` e estabilização total da fronteira 2D/3D.
- classificação de fechamento: `durável`
- justificativa da classificação:
  esta frente tem valor histórico e consultivo suficiente para sustentar novas ondas de refatoração sem depender do
  acervo legado bruto.
- registro durável destino:
  este próprio arquivo
- referência do changelog:
  `.changelogs/changelog-20260420.md`
- desvios decididos:
  absorver `2026-02-26/27` como continuidade analítica em vez de fabricar segunda execução.
- riscos residuais:
  não confundir paths legados com estado atual e não reabrir a frente sem checklist/run explícitos.

## 9. Artefatos Relacionados

### 9.1 Artefatos operacionais

- code-review de origem:
  não havia `code-review` no padrão novo para esta frente.
- work-item:
  não materializado.
- changelog diário:
  `.changelogs/changelog-20260420.md`
- execuções absorvidas neste registro durável:
  rodadas históricas de `2026-02-22`, `2026-02-23`, reanálises `2026-02-26/27`
- regression checklist da execução:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-checklist.md`
- regression run da execução:
  `.agents/refactorings/2026-02/20260220-1200-rac-editor-architecture.regression-run.md`
- sidecar da execução:
  não aplicável
- arquivos alterados:
  artefatos retroconvertidos em `.agents/prompts/`, `.agents/refactorings/` e `.agents/refactorings/heuristics/`

### 9.2 Decisões promovidas

- ADRs criados nesta frente:
  nenhum
- ADRs relacionados:
  nenhum
