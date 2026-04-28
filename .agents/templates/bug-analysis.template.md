---
title: "Bug Analysis — <título curto do caso>"
doc_role: bug-analysis
status: confirmed
created: AAAA-MM-DD
updated: AAAA-MM-DD
supersedes:
superseded_by:
tags: [ bug-analysis, bug, regression ]
aliases: [ <título curto do caso> ]
---

# Análise Técnica de Bug ou Regressão

> Destino sugerido quando o repositório adotar a convenção:
> `.agents/bug-analysis/YYYY-MM/yyyyMMdd-{bug-slug}.bug-analysis.md`
>
> Sidecar opcional para anexos não Markdown:
> `.agents/bug-analysis/YYYY-MM/yyyyMMdd-{bug-slug}.bug-analysis.assets/`
>
> Se o mesmo caso também tiver incidente operacional, mantenha o `.incident.md`
> correlato como artefato separado e registre apenas cross-link explícito.

## 1. Identificação

- tipo do registro: análise técnica de bug
- bug, defeito ou regressão analisada:
- origem do relato: incidente | QA | teste | code review | auditoria | outro
- ambiente:
- status analítico: confirmado | provável | inconclusivo | descartado
- estado da correção: não aplicada | recomendada | aplicada | validada

## 2. Contexto e Sintoma Observado

- contexto funcional:
- sintoma observado:
- impacto percebido:
- limitações ou incertezas iniciais:

## 3. Escopo Afetado

- fluxos afetados:
- regras de negócio afetadas:
- módulos, componentes ou serviços envolvidos:
- contratos, schemas ou interfaces envolvidos:

## 4. Fluxo Esperado vs. Fluxo Real

- fluxo esperado:
- fluxo real:
- ponto de divergência identificado:

## 5. Hipóteses Causais

| Hipótese | Evidências a favor | Evidências contra | Status                                               |
|----------|--------------------|-------------------|------------------------------------------------------|
|          |                    |                   | confirmada \| provável \| inconclusiva \| descartada |

## 6. Evidências e Pontos Envolvidos

### Evidências observadas

- teste, log, print, diff ou relato:
- interpretação permitida:

### Pontos de código, contrato ou regra

- arquivo, módulo ou contrato:
- responsabilidade no defeito:

## 7. Classe do Defeito ou Regressão

- classe:
- por que esta classificação se aplica:

## 8. Correção Aplicada ou Recomendada

- menor mudança coerente:
- por que resolve a causa:
- riscos e impactos laterais:

## 9. Validação Executada

- testes executados:
- validação manual:
- build, lint ou smoke relevante:
- critério de sucesso observado:

## 10. Dúvidas Residuais de Regra de Negócio

- dúvida:
- por que ainda importa:

## 11. Artefatos Relacionados

- incidente correlato:
- PR, commit ou diff relacionado:
- sidecar de anexos:
- documentos correlatos:
