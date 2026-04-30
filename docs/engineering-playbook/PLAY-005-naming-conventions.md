---
title: Convenções de Nomenclatura
id: PLAY-005
doc_type: playbook
doc_set: engineering-playbook
family: core
precedence: 5
status: active
lang: pt-BR
---

# Convenções de Nomenclatura

## Objetivo

Estas são as convenções oficiais de nomenclatura do projeto. Consistência em nomes de arquivos, variáveis, funções e
componentes é crucial para legibilidade e manutenibilidade.

## Arquivos de componentes React

- Componentes de produto e feature devem usar PascalCase com extensão TSX.
- Exemplos recomendados: `src/components/rac-editor/ui/RacEditor.tsx`,
  `src/components/rac-editor/@viewer-3d/ui/House3DViewer.tsx`,
  `src/components/rac-editor/@modals/ui/selectors/HouseTypeSelector.tsx`.
- Exemplos a evitar: nomes como my-component.tsx ou user_profile_card.js.
- Exceção vigente: primitives base de shadcn/ui em `src/components/ui` preservam o padrão gerado em lowercase ou
  kebab-case, como `src/components/ui/button.tsx` e `src/components/ui/alert-dialog.tsx`.
- Não renomeie arquivos de `src/components/ui` apenas para forçar PascalCase.

## Arquivos de hooks React

- Use camelCase com prefixo `use`.
- Prefira extensão TS, mas use TSX quando o arquivo realmente precisar de TSX ou de APIs React acopladas a isso.
- Exemplos recomendados: `src/components/rac-editor/hooks/useHouseTypeFlow.ts`,
  `src/components/rac-editor/@canvas/ui/adapters/hooks/useCanvasHistory.ts`,
  `src/components/rac-editor/lib/use-mobile.tsx`.
- Exemplos a evitar: nomes como UserDataHook.ts ou use-form-validation.ts.

## Outros arquivos TypeScript

- Use kebab-case.
- Admita sufixos semânticos com ponto quando o padrão do repositório pedir isso.
- Exemplos recomendados: `src/shared/types/house-rebuild.ts`, `src/infra/storage/settings.storage.ts`,
  `src/domain/house/house.aggregate.ts`.
- Exemplos a evitar: nomes como apiClient.ts ou StringUtils.ts.

## Variáveis e funções

- Use camelCase.
- Exemplos recomendados: `const houseState = ...`, `function calculateRoofArea() { ... }`.
- Exemplos a evitar: `const HouseState = ...`, `function Calculate_Roof_Area() { ... }`.

## Booleanos

- Use prefixos como `is`, `has`, `should` ou `can`.
- Exemplos recomendados: `isOpen`, `hasPermission`.
- Exemplos a evitar: `open`, `permission`.

## Handlers de eventos

- Funções que tratam eventos devem usar prefixo `handle`.
- Exemplos recomendados: `handleClick`, `handleInputChange`.
- Exemplos a evitar: `clickHandler`, `onInputChange` como nome de função local.

## Props de callback

- Props de callback devem usar prefixo `on`.
- Exemplos recomendados: `onClick`, `onSave`.
- Exemplos a evitar: `clickHandler`, `save`.

## Constantes

- Constantes compartilhadas e imutáveis devem usar `UPPER_SNAKE_CASE`.
- Exemplos recomendados: `MAX_RETRIES`, `API_BASE_URL`.
- Exemplos a evitar: `maxRetries`.

## Tipos e interfaces

- Use PascalCase.
- Props de componente devem usar o sufixo `Props`.
- Exemplos recomendados: `HouseState`, `HouseViewType`, `RacEditorCanvasProps`.
- Exemplos a evitar: `house_state`, `house_view_type_interface`.

## Artefatos arquiteturais

- Agregado: `{model}.aggregate.ts`, como `house.aggregate.ts`.
- Porta: `{model}-{concern}.port.ts`, como `house-persistence.port.ts`.
- Adapter: `{location}-{model}-{concern}.adapter.ts`, como `in-memory-house-persistence.adapter.ts`.
- Caso de uso: `{action}.use-case.ts`, como `src/domain/house/use-cases/house-state.use-case.ts`.
- Estratégia: `{element}.strategy.ts`, como
  `src/components/rac-editor/@canvas/lib/factory/elements/door.strategy.ts`.
