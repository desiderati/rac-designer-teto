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
  como `@canvas/`, `@menus/`, `@modals/`, `@viewer-3d/`, `ui/`, `hooks/`, `lib/`, `ports/` e `store/`.
- `src/components/ui` concentra componentes base compartilhados.
- `src/shared` concentra tipos, constantes e utilitários compartilhados.
- `src/pages`, `src/App.tsx` e `src/main.tsx` montam a aplicação e o roteamento.

## Estado atual do editor

- `src/components/rac-editor/lib/editor-house-controller.ts` é hoje o controller transitório do estado compartilhado da casa.
- `src/components/rac-editor/@canvas/lib/canvas-house-controller.ts` compõe o controller da casa com o runtime visual do
  canvas.
- `src/components/rac-editor/lib/house-store.ts` funciona como bridge reativa baseada em `useSyncExternalStore`.
- `src/bootstrap/editor-house-ports.ts` e `src/bootstrap/editor-house-port-adapters.ts` compõem, por factory, as
  portas transitórias da casa para o editor.
- `src/components/rac-editor/lib/editor-house-*-command-service.ts` separa comandos de setup, terreno, vistas e piloti,
  deixando `EditorHouseCommandService` como roteador transitório.
- `src/components/rac-editor/@canvas` concentra a borda visual 2D: contratos do canvas, hooks de canvas, helpers,
  factories e adapters Fabric.
- `src/components/rac-editor/@canvas/hooks/useCanvasDebugBridge.ts` e
  `src/components/rac-editor/@canvas/lib/canvas-debug-bridge.ts` concentram a ponte global de debug que conhece runtime
  visual concreto.
- `src/components/rac-editor/@menus` concentra a superfície de menus do editor, como `RacEditorMenus`,
  `CanvasToolsMenu`, menus superiores, tipos e configs locais.
- `src/components/rac-editor/@modals` concentra dialogs, selectors, editors flutuantes e hooks específicos de modais.
- `src/components/rac-editor/@viewer-3d` concentra a visualização 3D, incluindo UI, hooks, parsers, geometria e meshes.
- `src/components/rac-editor/ports` concentra Ports internos da feature ligados à casa, vistas, pilotis, runtime e
  leitura/escrita lógica.
- `src/components/rac-editor/@canvas/ports` concentra os Ports próprios da borda visual 2D.
- Handles imperativos do canvas devem ser importados por capacidade específica, como `CanvasDocumentHandle`,
  `CanvasHistoryHandle`, `CanvasSnapshotHandle` ou `CanvasEditorVisualHandle`. O handle amplo
  `CanvasInteractionPort` foi removido; a composição de tela usa `RacEditorCanvasHandle`.
- `src/components/rac-editor/store` fica reservado a stores reais, como `EditorStateStore`.
- `HouseStatePort` expõe leitura reativa do estado lógico da casa, sem objetos de runtime visual.
- `HouseRuntimeSnapshotPort<TGroup>` expõe o snapshot de runtime visual quando a UI precisa observar projeções do canvas.
- `HouseVisualRuntimePort<TGroup>` representa as capacidades mínimas do runtime visual usadas pelo núcleo do editor.
- Tipos e objetos de Fabric devem permanecer no slice `@canvas`, especialmente em `@canvas/ui/adapters` e nos helpers
  visuais de `@canvas/lib`. Código de domínio, infra e hooks gerais do editor não deve importar Fabric diretamente.
- `src/test/rac-editor-boundary.smoke.test.ts` protege o núcleo lógico contra imports diretos de Fabric,
  `@canvas`, tipos concretos `CanvasGroup`/`CanvasObject` e reintrodução de `CanvasInteractionPort`.
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
- Fábricas que adaptam o controller transitório da casa para ports internos do RAC editor devem ficar no bootstrap de composição, não em
  `src/infra`.
- Adapters Fabric devem ficar no slice `src/components/rac-editor/@canvas`, principalmente em `@canvas/ui/adapters`.

## Feature editor

- O editor é tratado como miniaplicação interna com organização própria e responsabilidades claras.
- `@canvas/` concentra a borda visual 2D, com subdiretórios `hooks/`, `lib/`, `ports/`, `store/` e `ui/`.
- `@menus/` concentra menus e ferramentas de superfície, com subdiretórios `hooks/`, `lib/` e `ui/`.
- `@modals/` concentra dialogs, selectors, editors flutuantes e hooks próprios desse fluxo.
- `@viewer-3d/` concentra a experiência 3D, com subdiretórios `hooks/`, `lib/` e `ui/`.
- `ports/` concentra contratos internos de casa, vistas, pilotis e runtime que não pertencem exclusivamente ao canvas.
- `ui/` concentra componentes de composição geral da tela e fluxos que ainda não justificam slice próprio.
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
- Não espalhar novas integrações de Fabric para fora de `src/components/rac-editor/@canvas` sem justificativa clara e
  atualização simultânea deste playbook.
- Não introduzir `CanvasGroup` ou `CanvasObject` fora de `src/components/rac-editor/@canvas`; se uma rotina precisar
  desses tipos, ela pertence ao slice `@canvas`.
- Não reintroduzir `CanvasInteractionPort` como atalho para evitar escolher uma capacidade do canvas.
- Não tratar o JSON do canvas como única fonte de verdade do estado.
- Não aceitar JSON Fabric bruto como formato canônico de projeto; o contrato de importação/exportação deve passar por
  documento RAC versionado.

## Direção de evolução

- Refatorações estruturais devem partir do código existente, não de paths imaginários herdados de discussões antigas.
- Refatorações com Ports and Adapters no editor devem seguir `PLAY-006-ports-and-adapters.md`, separando fatos,
  hipóteses, decisões, riscos e critérios de corte.
- O bootstrap já é o ponto de composição para store, ports e adapters transitórios; novas composições devem ficar ali
  quando não pertencerem exclusivamente ao slice `@canvas`.
- Prefira PRs pequenos que reduzam acoplamento dentro da feature atual antes de abrir novas raízes na árvore.

## Notas de transição

- Distinguir explicitamente entre estado atual, restrição vigente e direção futura.
- Se um path não existe no disco, ele não pode aparecer como contrato canônico presente.
