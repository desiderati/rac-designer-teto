---
title: "Regression Checklist — <título curto da rodada>"
doc_role: regression-checklist
created: AAAA-MM-DD
updated: AAAA-MM-DD
tags: [ refactoring, regression-checklist ]
---

# Regression Checklist — <título curto da rodada>

> Destino sugerido quando a rodada exigir contrato explícito de regressão:
> `.agents/refactorings/YYYY-MM/yyyyMMdd-hhmm-{execution-slug}.regression-checklist.md`

## 1. Identificação da Rodada

- prompt local da frente:
- documento principal de refactoring:
- review de origem:
- slugs de candidatos selecionados:
- perfil de risco: `low | medium | high`
- modo de execução: `direct | gated`
- razão do modo escolhido:
- Fase 0 ativada?: `sim | não`

## 2. Contexto desta Rodada

- objetivo operacional:
- escopo incluído:
- escopo excluído:
- blockers atuais:
- baseline esperado do comportamento:

## 3. Fluxos Críticos

### Fluxo N

- nome:
- por que é crítico:
- evidência mínima esperada:
- risco se quebrar:

## 4. Riscos Arquiteturais

### Risco N

- risco:
- gatilho ou área sensível:
- evidência necessária para confiar:
- fallback ou rollback se falhar:

## 5. Validação Automática Obrigatória

### Validação N

- comando:
- escopo do comando:
- resultado esperado:
- obrigatória?: `sim | não`
- observações:

## 6. Validação Manual Prevista

### Cenário N

- cenário:
- objetivo:
- evidência esperada:
- status planejado: `planejado | adiado`

## 7. Critério de Aceite da Rodada

- condição de aceite:
- condições de bloqueio:
- lacunas toleradas nesta rodada:

## 8. Gaps Intencionais e Adiamentos

- gap ou adiamento:
- justificativa:
- evidência faltante:
- próximo passo esperado:

## 9. Gate de Aprovação

- requer aprovação antes da execução estrutural?: `sim | não`
- estado atual: `não aplicável | aguardando aprovação | aprovado`
- evidência da aprovação na sessão:

## 10. Artefatos Relacionados

- regression run da rodada:
- sidecar de evidências:
- changelog diário:
- arquivos alvo:
