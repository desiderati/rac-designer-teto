# Regras de Vistas por Tipo de Casa

Este documento descreve as regras atuais de inserção, remoção e limites de vistas no canvas.

## 1. Objetivo

Garantir comportamento consistente para:

1. limites por `houseType`;
2. seleção de lado quando aplicável;
3. bloqueio quando limite é atingido;
4. liberação de slot após remoção.

## 2. Tipos de vista e rótulos de UI

`HouseViewType` interno:

1. `top` -> Planta
2. `front` -> Visão Frontal
3. `back` -> Visão Traseira (tipo6) / Visão Lateral (tipo3)
4. `side1` -> Quadrado Fechado
5. `side2` -> Quadrado Aberto

Mapeamento de label foi centralizado em caso de uso:

1. `getViewLabelForHouseType(houseViewType, houseType)` em `house-view-label-use-cases`.

## 3. Limites por tipo de casa

Implementação de domínio extraída:

1. os limites e decisões de `canAddView` estão no caso de uso `house-use-cases`;
2. a camada de aplicação (`house-application`) opera via interface `HouseRepository`;
3. operações de ciclo de vida de vistas (`register/remove/cleanup/rebuild sideAssignments`) foram extraídas para
   `house-views-*`;
4. a normalização de rebuild/import (inferência de `houseViewType`/`side` + deduplicação de `instanceId`) está em
   `house-views-rebuild-use-cases`;
5. regras de layout de vistas (lados disponíveis, auto-seleção de lado e slots pré-atribuídos) estão em
   `house-view-layout-use-cases`;
   - a decisão de inserção (`bloqueio`, `inserção direta`, `abrir seletor de instância` ou `abrir seletor de lado`) é
     centralizada em `resolveViewInsertionRequest`;
   - o cálculo de empilhamento vertical inicial (planta em cima e vista inicial embaixo) é centralizado em
     `calculateStackedViewPositions`;
6. regras de marcador da porta na planta (`top`) foram extraídas para `house-top-door-marker-use-cases`;
    - inclui inferência de lado, cálculo de dimensões efetivas do corpo, cálculo de posição e patch visual por marcador;
7. estruturas iniciais de `views` e `sideAssignments` vazias foram extraídas para `house-state-use-cases`;
8. disponibilidade global de vistas (lista de vistas disponíveis + checagem de limite por tipo) foi centralizada em
   `house-use-cases`;
9. consultas genéricas de views (`hasAnyView` e coleta de grupos) foram extraídas para `house-views-use-cases`;
10. fábrica de estado inicial da casa foi extraída para `house-state-factory-use-cases`;
11. contagem por tipo de vista foi centralizada em `house-views-use-cases` (`countViewInstances`);
12. lista canônica dos tipos de vista foi centralizada em `house-use-cases` (`ALL_HOUSE_VIEW_TYPES`);
13. patch de metadata do grupo de vista (`houseViewType`/`houseInstanceId`/`houseSide`) e visibilidade de controles foi
    centralizado em `house-view-metadata-use-cases`;
    - leitura de hints de remoção (`houseViewType`/`instanceId`) também foi centralizada no mesmo caso de uso;
14. `HouseManager` implementa os adaptadores de repositório e mantém o contrato de UI.

### 3.1 `tipo6`

1. `top`: 1
2. `front`: 1
3. `back`: 1
4. `side1`: 2
5. `side2`: 0

### 3.2 `tipo3`

1. `top`: 1
2. `front`: 0
3. `back`: 2
4. `side1`: 1
5. `side2`: 1

## 4. Regras de inserção

1. Ao atingir limite, a inserção é bloqueada e um `toast` de erro é exibido.
2. `top` (planta) não exige seleção de lado.
3. Outras vistas podem exigir seleção de lado conforme `preAssignedSides`.
4. Se houver apenas um lado disponível, a vista é inserida diretamente.
5. Se houver mais de um lado disponível, abre `HouseSideSelector`.
6. transição do `HouseSideSelector` para `NivelDefinitionEditor` (e regra de cancelamento com reset de tipo) é centralizada
   em `side-selector-flow`.

## 5. Regras de seleção de lado

1. Lados longos (`top`/`bottom`) aceitam `front` e `back`.
2. Lados curtos (`left`/`right`) aceitam `side1` e `side2`.
3. Em `choose-instance`, slots já ocupados aparecem desabilitados com indicação `(já no canvas)`.

## 6. Regras de remoção

1. Ao remover uma vista registrada, o `sideAssignment` da instância removida é limpo.
2. A contagem de `views[houseViewType]` é decrementada.
3. Um novo add da mesma vista deve voltar a ser permitido enquanto estiver abaixo do limite.
4. Após `rebuild` (undo/import), se nenhuma vista de casa existir no canvas, `houseType` é limpo para manter
   coerência de regras de inserção.

## 7. Casos validados em E2E

1. Limite de frontal em `tipo6`.
2. Limite de quadrado aberto em `tipo3`.
3. Seleção de lado para lateral em `tipo3`.
4. Limite de lateral em `tipo3` após duas instâncias.
5. Remoção e reinserção de traseira em `tipo6`.
6. Remoção e reinserção de quadrado fechado em `tipo6`.
7. Remoção e reinserção de lateral em `tipo3`.
8. Remoção e reinserção de quadrado aberto em `tipo3`.

## 8. Referências de código

- `src/components/rac-editor/Toolbar.tsx`
- `src/components/rac-editor/HouseSideSelector.tsx`
- `src/components/rac-editor/RacEditor.tsx`
- `src/components/rac-editor/hooks/useCanvasHouseViewActions.ts`
- `src/components/rac-editor/utils/house-view-creation.ts`
- `src/lib/house-manager.ts`
- `src/lib/domain/house-use-cases.ts`
- `src/lib/domain/house-application.ts`
- `src/lib/domain/house-repository.ts`
- `src/lib/domain/house-views-use-cases.ts`
- `src/lib/domain/house-views-application.ts`
- `src/lib/domain/house-views-repository.ts`
- `src/lib/domain/house-views-rebuild-use-cases.ts`
- `src/lib/domain/house-view-layout-use-cases.ts`
- `src/lib/domain/house-top-door-marker-use-cases.ts`
- `src/lib/domain/house-view-metadata-use-cases.ts`
- `src/lib/domain/house-view-label-use-cases.ts`
- `src/lib/domain/house-state-use-cases.ts`
- `src/lib/domain/house-state-factory-use-cases.ts`
- `e2e/views-limits.spec.ts`


