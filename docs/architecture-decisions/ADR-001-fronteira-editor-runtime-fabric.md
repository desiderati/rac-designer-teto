---
title: "ADR-001 — Fronteira do Editor RAC com o Runtime Fabric"
doc_role: architecture-decision-record
adr_number: ADR-001
decision_mode: previo
status: proposed
created: 2026-04-28
updated: 2026-04-29
supersedes:
superseded_by:
decision_source: ".agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/loop-state.md"
tags: [ adr, architecture, decision, rac-editor, fabric ]
aliases: [ ADR-001, Fronteira do Editor RAC com o Runtime Fabric ]
---

# ADR-001 — Fronteira do Editor RAC com o Runtime Fabric

Status permitido: `proposed` | `accepted` | `deprecated` | `superseded`.

## 1. Contexto

- problema que queremos resolver:
  - O editor RAC usa Fabric.js como runtime gráfico, mas objetos Fabric aparecem hoje em contratos públicos de UI, hooks
    e coordenação de estado. Isso eleva o custo de testes e dificulta refatorações seguras.
- restrições reais do ambiente:
  - O repositório já trata `src/components/rac-editor` como miniaplicação interna.
  - O playbook vigente não recomenda mover Fabric para `src/infra` por generalização.
  - O estado atual ainda usa `HouseState<CanvasGroup>` em pontos transitórios, mas o `CanvasHandle` público já não
    expõe a instância Fabric.
- por que a decisão importa agora:
  - A refatoração planejada pretende remover vazamentos de Fabric, reduzir god files e preparar expansão futura do
    editor com commands, store e ports testáveis.
- evidências consultadas:
  - `docs/engineering-playbook/PLAY-004-project-structure.md`
  - `docs/engineering-playbook/PLAY-102-frontend-state-and-hooks.md`
  - `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/fabric-boundary-baseline.md`
  - `src/components/rac-editor/lib/house-manager.ts`
  - `src/components/rac-editor/@canvas/ui/Canvas.tsx`
  - `src/components/rac-editor/@canvas/lib/canvas.ts`

## 2. Decisão

- decisão adotada:
  - Propor uma fronteira local do editor na qual Fabric.js permanece apenas em runtime, adapters e factories de canvas,
    enquanto UI, hooks de alto nível, commands, store e domínio conversam por contratos serializáveis.
- arquitetura escolhida:
  - Refatoração incremental feature-local, com camada anticorrupção entre contratos do editor e objetos Fabric.
- componentes ou áreas principais:
  - Contracts serializáveis do editor.
  - Commands e store da feature.
  - Canvas ports.
  - Fabric adapters/factories/runtime.
  - Domínio e use-cases puros.
- responsabilidades:
  - UI renderiza componentes e dispara intenções.
  - Commands representam mutações do editor.
  - Store coordena estado serializável e notifica listeners.
  - Domain valida regras e invariantes.
  - Canvas ports definem capacidades necessárias do canvas.
  - Fabric adapter/factories implementam o runtime visual.
- fluxo principal:
  - UI -> Command -> Store -> Domain/use-cases -> estado -> listeners -> CanvasRenderPort -> Fabric adapter.
  - Fabric event -> CanvasEventPort -> seleção serializável -> Command -> Store.
- modo da decisão: prévio
- custo de reversão:
  - Médio a alto após migração de commands/store e substituição gradual de `houseManager`, pois a decisão passa a
    orientar contratos públicos internos e testes.

## 3. Alternativas consideradas

### Alternativa A: Manter arquitetura atual e extrair helpers pontuais

- descrição:
  - Continuar usando `houseManager`, `CanvasHandle.canvas`, `CanvasGroup` e Fabric em hooks, extraindo apenas helpers
    locais para reduzir tamanho de arquivos.
- benefícios:
  - Menor risco imediato.
  - Menos alterações estruturais.
- custos ou riscos:
  - Não resolve o vazamento principal de runtime gráfico nos contratos.
  - Mantém testes dependentes de dublês de Fabric.
  - Não cria base clara para expansão do editor.
- por que não foi escolhida:
  - A dor principal é de fronteira arquitetural, não apenas tamanho de arquivo.

### Alternativa B: Migração hexagonal completa em big bang

- descrição:
  - Criar store, commands, ports, adapters e persistência nova em uma única virada ampla.
- benefícios:
  - Resultado conceitualmente limpo mais rapidamente.
  - Menos código transitório.
- custos ou riscos:
  - Alto risco de regressão em histórico, import/export, rebuild, piloti, contraventamento e viewer 3D.
  - Dificulta revisar e validar comportamento incrementalmente.
  - Contraria o playbook local ao abrir camadas por reflexo.
- por que não foi escolhida:
  - O editor tem comportamento visual e domínio acoplados o bastante para exigir migração por fatias verticais.

### Alternativa C: Refatoração incremental feature-local com ports/adapters

- descrição:
  - Criar contratos serializáveis e migrar por loops: seleção, store/commands, canvas ports, piloti, vistas/terreno,
    contraventamento, histórico/rebuild e factories/adapters Fabric.
- benefícios:
  - Melhor equilíbrio entre testabilidade, reversibilidade e alinhamento com o playbook.
  - Permite preservar comportamento enquanto reduz vazamentos medidos.
  - Evita store global genérica e arquitetura ornamental.
- custos ou riscos:
  - Exige código transitório e disciplina para não perpetuar duas fontes de verdade.
  - A migração completa exige vários loops coordenados.
- por que foi escolhida:
  - Ataca o problema real com menor blast radius e evidência por etapa.

## 4. Consequências e trade-offs

### 4.1. Positivas

- UI e hooks de alto nível podem ser testados sem Fabric.
- Commands e store ganham contratos explícitos.
- Fabric deixa de ser linguagem comum da aplicação.
- Futuras integrações de persistência e exportação ficam menos dependentes do runtime gráfico.

### 4.2. Negativas

- A transição terá adapters, mappers e façades temporárias.
- Algumas áreas continuarão usando `CanvasGroup` até que o modelo serializável esteja completo.
- O plano exige disciplina para não criar ports granulares demais.

### 4.3. Trade-offs aceitos

- Aceitar migração incremental em vez de pureza imediata.
- Manter Fabric dentro da feature editor durante a transição.
- Criar ADR `proposed` antes de aceitar a decisão como estado final.

### 4.4. Riscos e mitigação

- Risco: criar uma store paralela ao `houseManager`.
  - Mitigação: usar façade transitória e substituir responsabilidades explicitamente.
- Risco: quebrar import/export e undo.
  - Mitigação: caracterizar round trip JSON e rebuild antes de migrar essa frente.
- Risco: ports virarem wrappers de Fabric.
  - Mitigação: ports devem representar capacidades do editor, não métodos da biblioteca.

## 5. Escopo do MVP

- o que entra:
  - Contratos serializáveis de seleção e ids.
  - Plano de loops e checklist arquitetural.
  - Primeiras migrações de UI/hooks para contratos sem Fabric.
  - Ports de canvas mínimos.
- o que fica fora:
  - Reescrita completa em big bang.
  - Mover Fabric para `src/infra` por generalização antes de existir adapter concreto.
  - Trocar Fabric por outro runtime gráfico.
  - Criar `src/application`, `src/services` ou store global raiz.

## 6. Artefatos e contratos relacionados

- blueprint ou schema relacionado:
  - `src/components/rac-editor/@canvas/store/types/editor-selection.ts`
  - `src/components/rac-editor/@canvas/store/types/editor-ids.ts`
- prompts relacionados:
  - `.agents/prompts/solution-design.prompt.md`
  - `.agents/prompts/implementation-planning.prompt.md`
  - `.agents/prompts/architecture-decision.prompt.md`
- contratos de integração:
  - Canvas ports ainda a materializar nos loops seguintes.
- layout de artefatos:
  - `.agents/work-items/20260428-autonomous-loop-editor-architecture.work-item.assets/`
- superfícies humanas relacionadas:
  - `docs/engineering-playbook/PLAY-004-project-structure.md`
  - `docs/engineering-playbook/PLAY-102-frontend-state-and-hooks.md`
- runbook humano canônico:
  - Não aplicável nesta etapa.

## 7. Evoluções deliberadamente adiadas

- item adiado:
  - Modelo final de `HouseDrawingDocument`.
- motivo do adiamento:
  - Depende da caracterização de import/export, rebuild e persistência.
- item adiado:
  - Substituição completa do `houseManager`.
- motivo do adiamento:
  - Deve ocorrer apenas depois que commands/store e ports estiverem estabilizados.

## 8. Condições de revisão

- o que invalidaria esta decisão:
  - Descoberta de dependência essencial que exija Fabric como contrato público permanente.
  - Necessidade de trocar o runtime gráfico antes da estabilização dos ports.
  - Evidência de que commands/store locais adicionam complexidade sem reduzir acoplamento ou melhorar testes.
- quando revisitar:
  - Após conclusão dos loops de store/commands, canvas ports e histórico/import/export.
- sinais de que outro ADR deve superseder este:
  - A decisão deixar de ser proposta e uma arquitetura final aceita emergir da execução validada.
  - O editor passar a suportar múltiplos runtimes gráficos reais.

## 9. Referências cruzadas

- prompt de origem:
  - Conversa de refatoração retomada em 2026-04-28.
- code review de origem:
  - Nenhum ainda.
- changelog relacionado:
  - `.agents/changelogs/2026-04/20260428.changelog.md`
- outros ADRs relacionados:
  - Nenhum.
