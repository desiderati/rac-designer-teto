---
title: Estrutura do Projeto
id: PLAY-004
doc_type: playbook
doc_set: engineering-playbook
family: core
precedence: 4
status: active
lang: pt-BR
---

# Estrutura do Projeto

## Objetivo

Este documento descreve a estrutura vigente do projeto e as transições que ainda precisam ser tratadas explicitamente.
Ele existe para evitar dois erros comuns:

1. Documentar arquitetura futura como se já estivesse implementada.
2. Abrir novas camadas por reflexo, sem evidência no repositório.

## Estrutura atual

- `src/domain/house` concentra o agregado e os casos de uso puros do domínio da casa.
- `src/infra` concentra persistência in-memory, storage local e settings.
- `src/components/rac-editor` concentra a feature principal como miniaplicação interna, hoje organizada em slices
  como `canvas/`, `menus/`, `ui/`, `hooks/`, `lib/` e `store/`.
- `src/components/ui` concentra componentes base compartilhados.
- `src/shared` concentra tipos, constantes e utilitários compartilhados.
- `src/pages`, `src/App.tsx` e `src/main.tsx` montam a aplicação e o roteamento.

## Estado atual do editor

- `src/components/rac-editor/lib/house-manager.ts` é hoje a fachada legada do estado compartilhado da casa.
- `src/components/rac-editor/lib/house-store.ts` funciona como bridge reativa baseada em `useSyncExternalStore`.
- `src/components/rac-editor/canvas` concentra a borda visual 2D: contratos do canvas, hooks de canvas, helpers,
  factories e adapters Fabric.
- `src/components/rac-editor/menus` concentra a superfície de menus do editor, como `RacEditorMenus`,
  `CanvasToolsMenu`, menus superiores, tipos e configs locais.
- Tipos e objetos de Fabric devem permanecer no slice `canvas`, especialmente em `canvas/ui/adapters` e nos helpers
  visuais de `canvas/lib`. Código de domínio, infra e hooks gerais do editor não deve importar Fabric diretamente.
- Esse é o estado real atual e deve ser documentado como tal.

## Domínio

- O domínio continua sendo o núcleo da aplicação.
- Ele contém regras, invariantes e casos de uso ligados ao modelo da casa.
- `src/domain/house/house.aggregate.ts` representa o agregado central.
- `src/domain/house/house-persistence.port.ts` define o contrato de persistência do agregado.
- `src/domain/house/use-cases/*.use-case.ts` concentra regras e transformações do domínio.
- O domínio não deve importar React, Fabric ou componentes visuais.

## Infraestrutura

- A infraestrutura implementa contratos e detalhes técnicos concretos.
- `src/infra/persistence` implementa persistência concreta.
- `src/infra/storage` contém integrações com armazenamento local.
- Novas integrações de persistência, storage local e browser APIs devem preferir `src/infra`.
- Não mova Fabric para `src/infra` por generalização; a integração atual com canvas é borda da feature editor.

## Feature editor

- O editor é tratado como miniaplicação interna com organização própria e responsabilidades claras.
- `canvas/` concentra a borda visual 2D, com subdiretórios `hooks/`, `lib/`, `store/` e `ui/`.
- `menus/` concentra menus e ferramentas de superfície, com subdiretórios `hooks/`, `lib/` e `ui/`.
- `ui/` concentra componentes de composição geral da tela, modais, tutorial e viewer 3D enquanto esses slices ainda
  não forem separados.
- `hooks/` concentra orquestração geral, leitura de estado e comandos que não pertencem diretamente a um slice mais
  específico.
- `lib/` concentra coordenação compartilhada e lógica local do editor que ainda não pertence a `canvas`, `menus` ou
  `domain`.

## Fluxo de dependência

- A feature editor pode depender de domain, shared, infra já existente e módulos da própria feature.
- Infra pode depender de contratos definidos fora dela para implementar persistência e storage.
- Domain não deve depender de components, React, Fabric ou detalhes concretos de infra.
- Pages e `src/App.tsx` devem continuar como composição de UI, sem absorver regra de domínio.

## Restrições estruturais

- Não criar raízes genéricas de application, services ou store sem decisão arquitetural explícita.
- Não usar shared como lixeira para regra de negócio.
- Não espalhar novas integrações de Fabric para fora de `src/components/rac-editor/canvas` sem justificativa clara e
  atualização simultânea deste playbook.
- Não tratar o JSON do canvas como única fonte de verdade do estado.

## Direção de evolução

- Refatorações estruturais devem partir do código existente, não de paths imaginários herdados de discussões antigas.
- Se surgir necessidade real de bootstrap, store injetado ou adapter dedicado de canvas, introduza isso no mesmo change
  que materializar a nova camada.
- Até lá, qualquer menção a essas camadas deve aparecer como proposta futura, nunca como estrutura vigente.
- Prefira PRs pequenos que reduzam acoplamento dentro da feature atual antes de abrir novas raízes na árvore.

## Notas de transição

- Distinguir explicitamente entre estado atual, restrição vigente e direção futura.
- Se um path não existe no disco, ele não pode aparecer como contrato canônico presente.
