---
title: Documentação do Diretório docs
doc_type: index
doc_role: index
doc_set: docs
status: active
lang: pt-BR
---

# Documentação do Diretório `docs/`

## Objetivo

Este diretório reúne documentação versionada do produto e da governança técnica do repositório, para
leitura de pessoas técnicas e não técnicas. A maior parte do conteúdo é durável; documentos
transitórios devem declarar explicitamente seu ciclo de vida.

## Como usar estes documentos

1. Ler primeiro este arquivo para entender a organização.

2. Depois abrir o tema específico que deseja validar.

3. Em discussões de produto, priorizar `business-rules/README.md` como porta de entrada das regras
   funcionais.

4. Quando a discussão for de escopo, especificação ou evolução de iniciativa, consultar
   `product-requirements/`.

5. Quando a discussão for de arquitetura local, convenções ou critérios de implementação, consultar
   `engineering-playbook/`.

## Temas disponíveis

1. [architecture-decisions/](architecture-decisions/)
    - Registros de decisão arquitetural durável, usando o padrão `ADR-NNN-{slug}.md`.

2. [business-rules/README.md](business-rules/README.md)
    - Regras funcionais do produto, organizadas por ordem canônica em `BUS-00x-*` e indexadas em
      `business-rules/README.md`.

3. [engineering-playbook/README.md](engineering-playbook/README.md)
    - Constituição técnica do repositório: princípios, arquitetura, stack, convenções e critérios de decisão.
      O playbook combina um núcleo comum em `PLAY-001` a `PLAY-006` com módulos específicos de família, hoje
      materializados apenas na faixa frontend `PLAY-101` a `PLAY-105`.

4. [refactoring-backlog/README.md](refactoring-backlog/README.md)
    - Backlogs técnicos transitórios de refatoração, organizados por arquivos `BACK-00x-*`, com critério explícito de
      ativação, descarte, promoção ou encerramento.

5. [code-scaffolds/README.md](code-scaffolds/README.md)
    - Scaffolds aprovados com utilidade operacional real, organizados por responsabilidade como domínio,
      persistência e testes.

6. [ui-definitions/README.md](ui-definitions/README.md)
    - Definições duráveis de comportamento visual para superfícies operacionais, áreas dimensionadas e exportações.

7. [product-requirements/README.md](product-requirements/README.md)
    - PRDs canônicos do projeto, com basename `PRD-{id_number}-{slug}.prd`, sidecar `*.prd.assets/` e JSON derivado
      opcional.

## Princípios deste diretório

1. Linguagem clara e orientada a comportamento de produto.

2. Foco em regra funcional e, quando aplicável, em governança técnica durável.

3. Atualização contínua conforme o produto evolui.

4. Coerência entre documentos (sem regras conflitantes).

5. PRDs versionados e rastreáveis para iniciativas que precisem de especificação durável.

6. Backlogs técnicos transitórios devem ter critério claro de saída para não virarem documentação
   permanente por inércia.

## Quando atualizar

Atualize estas regras quando houver mudança em:

1. Fluxo de interação para o usuário.
2. Limite/regra de negócio.
3. Regra de segurança operacional do editor.
4. Processo oficial dos agentes de refatoração.
5. Constituição técnica do repositório ou scaffolds aprovados.
