---
title: "Refactoring — Elements Factory"
doc_role: refactoring
created: 2026-02-24
updated: 2026-04-20
tags: [ refactoring ]
---

# Refactoring — Elements Factory

> Documento retroconvertido em 2026-04-20 a partir do acervo legado de `2026-02-24`.
>
> O horário `1200` do basename foi sintetizado apenas para atender o padrão canônico `yyyyMMdd-hhmm`.

## 1. Contexto e Escopo

- prompt de origem desta execução:
  `.agents/prompts/refactoring-elements-factory.prompt.md`
- review de origem (opcional):
  não aplicável
- objetivo operacional:
  consolidar a frente de criação e normalização de elementos do canvas sem voltar ao monólito histórico.
- escopo incluído:
  strategies de elementos, helpers compartilhados, guards de scaling, tipagem de objetos e integração com editores
  lineares/parede.
- escopo excluído:
  reestruturação ampla da feature RAC além dos pontos de integração imediata com a factory.
- slugs de candidatos selecionados para esta rodada:
  não aplicável
- slugs de candidatos deliberadamente adiados:
  não aplicável
- constraints relevantes:
  preservar comportamento visual dos elementos, manter integração com toolbar e editores, evitar monólito de factory.
- perfil de risco: `high`
- modo de execução: `direct`
- fontes legadas absorvidas:
    - `refactoring-plan.md` de `2026-02-24`
    - `regression-checklist.md` de `2026-02-24`
    - `regression-run.md` de `2026-02-24`
- mapeamento legado -> atual:
    - `src/lib/canvas/factory/elements-factory.ts` legado ->
      `src/components/rac-editor/lib/canvas/factory/elements/*`
    - helper de estado linear legado ->
      `src/components/rac-editor/ui/modals/editors/generic/helpers/*`

## 2. Inventário e Diagnóstico

### 2.1 Inventário funcional

- superfície analisada:
  criação de linha, seta, distância, parede, água, escada, porta, árvore, fossa e texto; binding de scaling; helpers de
  edição linear.
- funções/entrypoints relevantes:
  strategies por tipo, `index.ts`, helpers compartilhados, normalizações e binders.
- integrações e serviços externos:
  runtime de canvas/Fabric, toolbar, modais de edição e suites de smoke/E2E.

### 2.2 Mapa de Acoplamento

- pontos de alto fan-in/fan-out:
  registry da factory, helpers compartilhados e leitores de estado de editores.
- dependências internas críticas:
  strategy -> shared helper -> tipos de canvas -> editores genéricos/toolbar.
- fronteiras naturais de módulo:
  strategies por elemento, `shared.ts`, helpers de editor e contratos de tipo.

### 2.3 Catálogo de Smells

- `[SOLID]` monólito histórico com múltiplas responsabilidades.
- `[CLEAN]` duplicação de guards de scaling e magic numbers visuais.
- `[PATTERN]` Strategy Pattern válido, mas ainda com oportunidades de consolidar helpers comuns.
- `[RISK]` typing frouxo e regressão silenciosa em scaling ou binding.
- `[DX]` dificuldade de saber onde ajustar contrato de criação vs. contrato de edição.

### 2.4 Cobertura de Testes

- cobertura existente:
  o acervo legado registra build, tipagem, smoke, E2E e `test:regression` verdes após a rodada.
- áreas sem rede de segurança:
  alguns fluxos manuais de criação detalhada de todos os elementos ainda não estavam cobertos integralmente.
- risco associado:
  alto, mas circunscrito à superfície da factory e integrações imediatas.

### 2.5 Continuidade da Frente

- prompt durável anterior consultado:
  nenhum no padrão novo; este arquivo inaugura a frente.
- execuções anteriores consultadas:
  bundle legado de `2026-02-24` com revalidação factual em `2026-02-25`.
- o que já foi resolvido:
  extração de funções de normalização, binding functions, tipagem melhorada e adoção prática de strategies.
- regressões ou falhas ainda abertas:
  lint global legado e oportunidades remanescentes de abstração de guards/constantes.
- blockers atuais:
  nenhum blocker fatal histórico após a revalidação.

## 3. Findings

### Finding 1

- descrição:
  a frente nasceu porque `elements-factory.ts` centralizava criação, normalização, typing e utilitários demais.
- problema estrutural:
  god module.
- severidade: `critical`
- impacto:
  pequena mudança em um tipo de elemento podia gerar regressão em outro sem isolamento claro.

### Finding 2

- descrição:
  o padrão de guard e normalização apareceu duplicado em múltiplos elementos.
- problema estrutural:
  duplication / shotgun surgery.
- severidade: `high`
- impacto:
  manutenção cara e risco de divergência entre line/arrow/distance/wall.

### Finding 3

- descrição:
  criação de elemento e contratos de edição visual compartilhavam conhecimento implícito demais.
- problema estrutural:
  hidden coupling.
- severidade: `high`
- impacto:
  fragilidade entre factory, toolbar e modais.

## 4. Solution Design

### 4.1 Arquitetura proposta

- módulos/arquivos:
  `factory/elements/*.strategy.ts`, `shared.ts`, `index.ts` e helpers dos editores genéricos.
- responsabilidade de cada módulo:
  strategy cria e normaliza um tipo; helper compartilhado concentra padrões reais; editor lê/aplica estado por contrato
  explícito.
- estratégia de namespace:
  preservar a factory como conjunto de módulos pequenos; não recriar arquivo central monolítico.

### 4.2 Decisões de design

#### Decisão 1

- decisão tomada:
  adotar Strategy Pattern como centro da factory.
- alternativas consideradas:
  arquitetura de classes mais pesada ou manter funções monolíticas.
- justificativa:
  o próprio legado registra ganho claro de testabilidade e organização após a estratégia.
- trade-offs aceitos:
  maior quantidade de arquivos, com fronteiras mais claras.
- candidata a ADR: não

#### Decisão 2

- decisão tomada:
  manter checklist/run explícitos por se tratar de refatoração estrutural com impacto em elementos centrais do editor.
- alternativas consideradas:
  narrar tudo apenas no plano.
- justificativa:
  a rodada teve hotfixes reais antes da revalidação.
- trade-offs aceitos:
  mais documentação operacional.
- candidata a ADR: não

## 5. Implementation Plan

### Passo 1

- o que muda:
  confirmar e preservar a decomposição da factory por strategies e helpers explícitos.
- status da frente: `retomado`
- pré-condição para executar:
  checklist/run atualizados.
- finding / slug de candidato relacionado:
  Findings 1 e 3.
- transformação:
  `extract strategy`
- por quê:
  é a base da arquitetura atual da frente.
- critério de verificação:
  criação e edição visual seguem funcionando por tipo de elemento.
- rollback:
  restaurar a fatia tocada e revalidar.

### Passo 2

- o que muda:
  reduzir duplicação real de normalização e guards.
- status da frente: `retomado`
- pré-condição para executar:
  testes e build verdes antes da mudança.
- finding / slug de candidato relacionado:
  Finding 2.
- transformação:
  `extract helper`
- por quê:
  o legado já aponta duplicação material de `scaling guard`.
- critério de verificação:
  scaling de line/arrow/distance/wall continua coerente.
- rollback:
  reverter helper compartilhado e voltar ao guard local.

## 6. Validation Strategy

- perfil de risco:
  `high`
- modo de execução:
  `direct`
- justificativa do modo:
  checklist/run existiram, mas o acervo não preserva gate explícito desta rodada.
- Fase 0 / baseline:
  ativada.
- regression checklist da rodada:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.regression-checklist.md`
- validação local:
  tsc strict, test, build, E2E serial e pacote de regressão.
- validação remota:
  não aplicável.
- critérios de aceite:
  criação/edição de elementos preservada e validações automáticas principais verdes.
- gaps de validação intencionais:
  lint global legado e parte de criação manual detalhada de todos os elementos.

## 7. Registro de Execução

### Ciclo 1/1

#### Prompt de origem

- arquivo:
  `.agents/prompts/refactoring-elements-factory.prompt.md`
- vínculo explícito:
  prompt durável retrocalibrado a partir do bundle legado de `2026-02-24`
- objetivo do ciclo:
  converter em memória durável a rodada histórica da factory.

#### Executado

- findings / slugs de candidatos atacados neste ciclo:
  decomposição em strategies, extração de normalizações e binders, tipagem melhorada, helpers de editores lineares.
- regression run / evidências desta rodada:
  ver documento irmão `20260224-1200-elements-factory.regression-run.md`
- item:
  hotfixes de tipagem, E2E e debug bridge documentados no ledger histórico foram absorvidos.

#### Validação

- item:
  tsc strict, `117/117` em test, build, `17/17` em E2E serial e `test:regression` verdes no acervo.

#### Smells remanescentes

- `critical`:
  nenhum no bundle histórico consolidado.
- `high`:
  duplicação residual de guards/constantes e risco de divergência entre factory e editores.
- `medium`:
  oportunidades de consolidar shared helpers com mais precisão.
- `low`:
  melhorias cosméticas e naming local.

#### Decisão

- findings / slugs de candidatos adiados neste ciclo:
  abstração futura de `withScalingGuard` e centralização mais madura de constantes.
- continuar | encerrar | aguardar aprovação:
  encerrar o bundle retroativo e manter o prompt como contrato da frente.

## 8. Outcome / Verdict

- veredito: `partial`
- resultado alcançado:
  a rodada histórica de `elements-factory` foi convertida em prompt durável, checklist e ledger no padrão novo.
- findings / slugs de candidatos endereçados:
  Findings 1 a 3 absorvidos como memória consultável da frente.
- findings / slugs de candidatos adiados:
  duplicação residual de guards e centralização adicional de defaults/constantes.
- classificação de fechamento: `durável`
- justificativa da classificação:
  a frente continua valiosa como memória de por que a factory não deve regressar ao monólito.
- registro durável destino:
  este próprio arquivo
- referência do changelog:
  `.changelogs/changelog-20260420.md`
- desvios decididos:
  preservar a execução em `20260224-1200` e registrar `2026-02-25` apenas no corpo/proveniência do ledger.
- riscos residuais:
  não usar a heurística `react` como guia principal desta frente sem evidência nova.

## 9. Artefatos Relacionados

### 9.1 Artefatos operacionais

- code-review de origem:
  não havia `code-review` no padrão novo.
- work-item:
  não materializado.
- changelog diário:
  `.changelogs/changelog-20260420.md`
- execuções absorvidas neste registro durável:
  revalidação factual preservada em `2026-02-25` dentro do ledger irmão
- regression checklist da execução:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.regression-checklist.md`
- regression run da execução:
  `.agents/refactorings/2026-02/20260224-1200-elements-factory.regression-run.md`
- sidecar da execução:
  não aplicável
- arquivos alterados:
  artefatos retroconvertidos desta wave

### 9.2 Decisões promovidas

- ADRs criados nesta frente:
  nenhum
- ADRs relacionados:
  nenhum
