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

1. limites e decisões de `canAddView` são consolidados no agregado `HouseAggregate`;
2. operações de ciclo de vida de vistas (`register/remove/cleanup/rebuild sideMappings`) estão em
   `house-views.use-case`;
3. normalização de rebuild/import (inferência de `houseViewType`/`side` + deduplicação de `instanceId`) está em
   `house-views-rebuild.use-case`;
4. regras de layout de vistas (lados disponíveis, auto-seleção de lado e slots pré-atribuídos) estão em
   `house-views-layout.use-case`;
    - a decisão de inserção (`bloqueio`, `inserção direta`, `abrir seletor de instância` ou `abrir seletor de lado`) é
      centralizada em `resolveHouseViewInsertion`;
    - o cálculo de empilhamento vertical inicial (planta em cima e vista inicial embaixo) é centralizado em
      `calculateStackedViewPositions`;
5. regras de marcador da porta na planta (`top`) foram extraídas para `house-top-view-door-marker`;
    - inclui inferência de lado, cálculo de dimensões efetivas do corpo, cálculo de posição e patch visual por marcador;
6. estruturas iniciais de `views` e `sideMappings` vazias foram extraídas para `house-state.use-case`;
7. contagem por tipo de vista usa `HouseAggregate` com `HOUSE_VIEW_LIMITS`;
8. lista canônica dos tipos de vista usa `ALL_HOUSE_VIEW_TYPES`;
9. patch de metadata do grupo de vista (`houseViewType`/`houseInstanceId`/`houseSide`) e visibilidade de controles é
   centralizado em `house-view`;
    - leitura de hints de remoção (`houseViewType`/`instanceId`) também é centralizada no mesmo helper;
10. `HouseManager` é a fonte de verdade em runtime e aplica as regras do agregado.

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
6. Se `preAssignedSides` existir:
    - nenhuma vaga livre bloqueia a ação com `toast`;
    - uma vaga livre adiciona direto;
    - mais de uma vaga abre `HouseSideSelector` em modo `choose-instance`.
7. transição do `HouseSideSelector` para `NivelDefinitionEditor` (e regra de cancelamento com reset de tipo) é
   centralizada em `house-side`.

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
5. Ao remover a planta (`top`), a ação só é permitida quando não há outras vistas no canvas.
6. Ao remover a planta, `houseType` é resetado para manter consistência nas próximas inserções.

## 7. Fluxo inicial (houseType + níveis)

1. Ao selecionar `houseType`, abre `HouseSideSelector` para posicionar a vista inicial:
    - `tipo6`: posiciona `front` (`top`/`bottom`).
    - `tipo3`: posiciona `side2` (`left`/`right`).
2. Na seleção inicial de lado (`mode = position`) sem `preAssignedSides`:
    - o sistema cria `preAssignedSides` automaticamente (`autoAssignAllSides`);
    - abre o `NivelDefinitionEditor` antes de inserir vistas.
3. Ao aplicar níveis:
    - atualiza níveis/mestre dos 4 cantos;
    - calcula alturas recomendadas para os 12 pilotis;
    - adiciona a planta (`top`) e a vista inicial;
    - reposiciona a planta acima e a vista inicial abaixo, com gap configurado.
4. Se o usuário cancelar:
    - no `HouseSideSelector` inicial, `houseType` é resetado;
    - no `NivelDefinitionEditor`, o `houseManager` é resetado e o estado inicial é descartado.

## 8. Casos validados em E2E

1. Limite de frontal em `tipo6`.
2. Limite de quadrado aberto em `tipo3`.
3. Seleção de lado para lateral em `tipo3`.
4. Limite de lateral em `tipo3` após duas instâncias.
5. Remoção e reinserção de traseira em `tipo6`.
6. Remoção e reinserção de quadrado fechado em `tipo6`.
7. Remoção e reinserção de lateral em `tipo3`.
8. Remoção e reinserção de quadrado aberto em `tipo3`.

## 9. Referências de código

- `src/components/rac-editor/Toolbar.tsx`
- `src/components/rac-editor/HouseSideSelector.tsx`
- `src/components/rac-editor/RacEditor.tsx`
- `src/components/rac-editor/canvas/hooks/useCanvasHouseViewActions.ts`
- `src/components/lib/house-view.ts`
- `src/components/lib/house-manager.ts`
- `src/domain/house/house-aggregate.ts`
- `src/domain/house/use-cases/house-views.use-case.ts`
- `src/domain/house/use-cases/house-views-rebuild.use-case.ts`
- `src/domain/house/use-cases/house-views-layout.use-case.ts`
- `src/components/lib/house-top-view-door-marker.ts`
- `src/domain/house/use-cases/house-state.use-case.ts`
- `e2e/views-limits.spec.ts`


