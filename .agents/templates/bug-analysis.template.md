---
title: "Bug Analysis - <título curto do caso>"
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
- status de evidência: reproduced | root-cause-confirmed | fixed-in-test | validated-at-original-boundary | partial |
  blocked

## 2. Contexto e Sintoma Observado

- contexto funcional:
- sintoma observado:
- impacto percebido:
- limitações ou incertezas iniciais:

## 3. Contrato de Falha Observável

- cenário original reportado:
- fronteira observável do relato:
- reprodução mínima que deve falhar antes da correção:
- cenário de controle que deve continuar passando:
- evidência necessária para considerar resolvido:

## 4. Escopo Afetado

- fluxos afetados:
- regras de negócio afetadas:
- módulos, componentes ou serviços envolvidos:
- contratos, schemas ou interfaces envolvidos:

## 5. Mapa de Camadas e Fronteiras

| Camada ou fronteira | Responsabilidade | Evidência disponível | Status                                                   |
|---------------------|------------------|----------------------|----------------------------------------------------------|
|                     |                  |                      | observado \| inferido \| não aplicável \| não verificado |

## 6. Fluxo Esperado vs. Fluxo Real

- fluxo esperado:
- fluxo real:
- ponto de divergência identificado:

## 7. Hipóteses Causais

| Hipótese | Evidências a favor | Evidências contra | O que ainda falta saber | Como validar | Status                                               |
|----------|--------------------|-------------------|-------------------------|--------------|------------------------------------------------------|
|          |                    |                   |                         |              | confirmada \| provável \| inconclusiva \| descartada |

## 8. Evidências e Pontos Envolvidos

### Evidências observadas

- teste, log, print, diff ou relato:
- interpretação permitida:

### Pontos de código, contrato ou regra

- arquivo, módulo ou contrato:
- responsabilidade no defeito:

## 9. Classe do Defeito ou Regressão

- classe:
- por que esta classificação se aplica:

## 10. Correção Aplicada ou Recomendada

- menor mudança coerente:
- por que resolve a causa:
- riscos e impactos laterais:

## 11. Validação Executada

- validação de camada:
- validação de integração:
- validação na fronteira original:
- testes executados:
- validação manual ou operacional:
- build, lint ou smoke relevante:
- critério de sucesso observado:
- limitações ou validações bloqueadas:

## 12. Status de Evidência

- status final:
- por que este status se aplica:
- o que ainda ficaria necessário para elevar o status, se parcial ou bloqueado:

## 13. Dúvidas Residuais de Regra de Negócio

- dúvida:
- por que ainda importa:

## 14. Artefatos Relacionados

- incidente correlato:
- PR, commit ou diff relacionado:
- sidecar de anexos:
- documentos correlatos:
