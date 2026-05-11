---
title: Refactoring Backlog
doc_type: index
doc_set: refactoring-backlog
status: active
lang: pt-BR
---

# Refactoring Backlog

Esta pasta registra backlogs técnicos de refatoração com escopo delimitado.

Estes documentos não são ADRs, Playbooks ou decisões arquiteturais duráveis. Eles existem para organizar frentes de
refatoração que ainda precisam de execução, validação, descarte ou promoção para uma documentação mais estável.

## Quando usar

Use esta pasta quando uma frente de refatoração:

1. tiver escopo técnico claro;
2. ainda não justificar uma decisão arquitetural durável;
3. não for apenas histórico operacional local de `.agents/refactorings/`;
4. precisar de critérios objetivos de ativação, parada e encerramento.

## Quando não usar

Não use esta pasta para:

1. decisões arquiteturais já aceitas, que pertencem a `docs/architecture-decisions/`;
2. regras permanentes de engenharia, que pertencem a `docs/engineering-playbook/`;
3. histórico bruto de execução, que pertence localmente a `.agents/refactorings/`;
4. listas genéricas de melhorias sem dor técnica identificável.

## Ciclo de vida

Um item deve sair daqui quando:

1. for implementado;
2. for descartado;
3. virar decisão arquitetural em ADR;
4. virar regra durável em Playbook;
5. deixar de representar dor técnica real.

Quando todos os itens de um backlog forem resolvidos, descartados ou promovidos, o arquivo deve ser removido ou marcado
como encerrado com a justificativa correspondente.

## Convenção de nomes

Os arquivos seguem o formato:

```text
BACK-00x-{slug}.md
```

O identificador `BACK` indica backlog técnico condicionado. Ele não substitui `ADR`, `PLAY`, `BUS` ou `PRD`.

## Backlogs ativos

- `BACK-001-rac-editor-refactoring.md`
    - Cortes finais e condicionais de refatoração do RAC Editor.
