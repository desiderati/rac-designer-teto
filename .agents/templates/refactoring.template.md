---
title: "Refactoring — <título curto da frente>"
doc_role: refactoring
created: AAAA-MM-DD
updated: AAAA-MM-DD
tags: [ refactoring ]
---

# Refactoring — <título curto da frente>

> Quando este documento for produzido em português, preserve a acentuação normal e grave em UTF-8.
>
> Documentos irmãos opcionais desta execução:
> `.agents/refactorings/YYYY-MM/yyyyMMdd-hhmm-{execution-slug}.regression-checklist.md`
> `.agents/refactorings/YYYY-MM/yyyyMMdd-hhmm-{execution-slug}.regression-run.md`

## 1. Contexto e Escopo

- prompt de origem desta execução:
- review de origem (opcional):
- objetivo operacional:
- escopo incluído:
- escopo excluído:
- slugs de candidatos selecionados para esta rodada:
- slugs de candidatos deliberadamente adiados:
- constraints relevantes:
- perfil de risco: `low | medium | high`
- modo de execução: `direct | gated`

## 2. Inventário e Diagnóstico

### 2.1 Inventário funcional

- superfície analisada:
- funções/entrypoints relevantes:
- integrações e serviços externos:

### 2.2 Mapa de Acoplamento

- pontos de alto fan-in/fan-out:
- dependências internas críticas:
- fronteiras naturais de módulo:

### 2.3 Catálogo de Smells

- `[SOLID]`
- `[CLEAN]`
- `[PATTERN]`
- `[RISK]`
- `[DX]`

### 2.4 Cobertura de Testes

- cobertura existente:
- áreas sem rede de segurança:
- risco associado:

### 2.5 Continuidade da Frente

- prompt local anterior consultado:
- execuções anteriores consultadas:
- o que já foi resolvido:
- regressões ou falhas ainda abertas:
- blockers atuais:

## 3. Findings

> Repita o bloco abaixo quantas vezes forem necessárias. Não limite a seção a dois findings.

### Finding N

- descrição:
- problema estrutural: <!-- usar vocabulário: god class, feature envy, shotgun surgery, etc. -->
- severidade: `critical | high | medium | low`
- impacto:

## 4. Solution Design

### 4.1 Arquitetura proposta

- módulos/arquivos:
- responsabilidade de cada módulo:
- estratégia de namespace:

### 4.2 Decisões de design

#### Decisão 1

- decisão tomada:
- alternativas consideradas:
- justificativa:
- trade-offs aceitos:
- candidata a ADR: sim | não

## 5. Implementation Plan

> Ordene os passos por blocker atual → risco → blast radius → esforço. Não reproponha passos já concluídos sem
> mudança material de contexto.

### Passo 1

- o que muda:
- status da frente: `novo | pendente | retomado | replanejado`
- pré-condição para executar:
- finding / slug de candidato relacionado:
- transformação: <!-- extract method, extract module, inline, move, rename, etc. -->
- por quê:
- critério de verificação:
- rollback:

### Passo 2

- o que muda:
- status da frente:
- pré-condição para executar:
- finding / slug de candidato relacionado:
- transformação:
- por quê:
- critério de verificação:
- rollback:

## 6. Validation Strategy

- perfil de risco:
- modo de execução:
- justificativa do modo:
- Fase 0 / baseline:
- regression checklist da rodada:
- validação local:
- validação remota:
- critérios de aceite:
- gaps de validação intencionais:

## 7. Registro de Execução

> Repita o bloco abaixo para cada ciclo executado. Não consolide ciclos diferentes em um único bloco.

### Ciclo N/{{max_cycles}}

#### Prompt de origem

- arquivo:
- vínculo explícito:
- objetivo do ciclo:

#### Executado

- findings / slugs de candidatos atacados neste ciclo:
- regression run / evidências desta rodada:
- item

#### Validação

- item

#### Smells remanescentes

- `critical`:
- `high`:
- `medium`:
- `low`:

#### Decisão

- findings / slugs de candidatos adiados neste ciclo:
- continuar | encerrar | aguardar aprovação

## 8. Outcome / Verdict

- veredito: `pass | partial | fail | waiting-approval`
- resultado alcançado:
- findings / slugs de candidatos endereçados:
- findings / slugs de candidatos adiados:
- classificação de fechamento: `durável | consolidar-em-durável-existente | changelog-only`
- justificativa da classificação:
- registro durável destino:
- referência do changelog:
- recomendação de ADR no fechamento: `sim | não`
- justificativa curta da recomendação de ADR:
- desvios decididos:
- riscos residuais:

## 9. Artefatos Relacionados

### 9.1 Artefatos operacionais

- code-review de origem:
- work-item:
- changelog diário:
- execuções absorvidas neste registro durável:
- regression checklist da execução:
- regression run da execução:
- sidecar da execução:
- arquivos alterados:

### 9.2 Decisões promovidas

- ADRs criados nesta frente:
- ADRs relacionados:
