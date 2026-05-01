---
title: Estado e Hooks no Frontend
id: PLAY-102
doc_type: playbook
doc_set: engineering-playbook
family: frontend
precedence: 102
status: active
lang: pt-BR
---

# Estado e Hooks no Frontend

## Objetivo

Descrever como hooks e estado estão organizados hoje no repositório e quais guardrails valem para evoluções futuras.
Este documento não existe para fingir que uma store injetada já existe.

## Quando criar um hook customizado

Extraia lógica para um hook customizado quando houver comportamento reutilizável, ligação com estado compartilhado ou
coordenação entre UI e dependências externas.

## Forma de retorno

Prefira retornar objeto em vez de array. Isso deixa o contrato mais explícito e reduz erro de ordem na desestruturação.

## Hierarquia de estado

1. Estado local com `useState` ou `useReducer` para UI simples e isolada.
2. Estado elevado quando irmãos compartilham o mesmo dado.
3. Contexto quando múltiplos níveis da árvore precisam da mesma instância.
4. Coordenação compartilhada da feature para estado durável do editor.

## Estado atual do projeto

- O projeto não usa biblioteca genérica de estado global como Zustand ou Redux.
- O estado compartilhado do editor é coordenado pela própria feature.
- `houseManager` é o coordenador atual desse estado.
- `useHouseStoreVersion` expõe a versão reativa do estado compartilhado com `useSyncExternalStore`.
- `useHouseStateSnapshot` expõe o estado lógico atual da casa, sem objetos de runtime visual.
- `useHouseRuntimeSnapshot` expõe o snapshot de runtime visual quando o consumidor precisa da projeção do canvas.
- O alias ambíguo `useHouseSnapshot` foi removido; código novo deve escolher explicitamente entre
  `useHouseStateSnapshot` e `useHouseRuntimeSnapshot`.
- Estados modais, flags visuais e fluxos temporários continuam distribuídos em hooks locais da feature.
- Não abra automaticamente uma store genérica na raiz.

## Fontes de verdade

- Evite fontes paralelas de verdade para a mesma informação.
- O estado estrutural da casa não deve ser duplicado em hooks locais desconectados do `houseManager`.
- O canvas continua sendo projeção e mecanismo de interação, não a definição única do estado.
- Leituras lógicas devem preferir `HouseStatePort` e `useHouseStateSnapshot`.
- Leituras que dependem da projeção visual devem preferir `HouseRuntimeSnapshotPort` e `useHouseRuntimeSnapshot`.
- Se um novo store surgir no futuro, ele deve substituir explicitamente a coordenação atual no mesmo change.

## Papel dos hooks na feature editor

- Ler dados compartilhados do editor.
- Disparar comandos e atualizações sobre `houseManager` ou abstrações equivalentes que existirem de fato.
- Registrar listeners, bindings do canvas e sincronizações com a UI.
- Manter fronteiras legíveis entre leitura, comando e binding.

## Uso de Fabric em hooks

- É aceitável importar Fabric em hooks de adapter dentro de `src/components/rac-editor/@canvas/ui/adapters/hooks`.
- Hooks do slice `@canvas` podem conhecer `CanvasGroup`/`CanvasObject` quando estiverem coordenando runtime visual
  concreto.
- Hooks gerais em `src/components/rac-editor/hooks` devem falar com ports, callbacks e tipos serializáveis, não com
  instâncias Fabric ou grupos concretos do canvas.
- Quando um hook precisar acessar o canvas por ref, ele deve depender do menor handle necessário, importado do arquivo
  de capacidade específico em `@canvas/ports`.
- `CanvasInteractionPort`/`CanvasHandle` não deve ser usado como atalho em hooks de fluxo; ele é composição transitória
  do ref do componente `Canvas`.
- Não espalhe Fabric para hooks genéricos, `shared`, `domain`, `infra` ou componentes fora do slice `canvas`.

## Debug bridge

- Pontes globais de debug devem ficar isoladas no slice que conhece o runtime concreto.
- No editor RAC, a API `window.__racDebug` é instalada por `@canvas/hooks/useCanvasDebugBridge.ts` e montada em
  `@canvas/lib/canvas-debug-bridge.ts`.
- Hooks gerais podem acionar essa ponte, mas não devem reconstruir diretamente a API global nem importar tipos concretos
  do canvas para isso.

## O que hooks não podem fazer

- Conter regra de domínio que deveria morar em `src/domain` ou em utilitário dedicado da feature.
- Abrir uma segunda fonte compartilhada de estado paralela ao `houseManager` sem plano explícito.
- Virar um god-hook sem fronteira legível entre leitura, comando e binding.

## Evolução futura

- Se no futuro o repositório migrar para store injetado via Context ou composition root dedicado, isso só entra aqui
  quando o código existir.
- Não documente `HouseStateStore` ou camadas de bootstrap como presentes antes da implementação real.
- Toda transição de coordenação de estado deve ser explícita, incremental e acompanhada de atualização simultânea deste
  playbook.
