# 📊 Relatório de Análise Profunda (Agent 1 v2)

**Data da Análise:** 27 de Fevereiro de 2026
**Commit Head:** `c18108c` — `refactor(architecture): refatorar domínio e reorganizar módulos centrais`
**Commits desde última análise (24/02):** 5 commits, 149 arquivos alterados (+2852/-3824 linhas)

---

## 1. Estrutura de Arquivos

A refatoração recente foi massiva: o commit principal (`c18108c`) tocou **146 arquivos** com um saldo líquido de **-1052
linhas**, o que é um excelente sinal de simplificação.

| Métrica                            | Valor             |
|:-----------------------------------|:------------------|
| Total de arquivos `.ts`/`.tsx`     | **214**           |
| Arquivos `.ts`                     | 127               |
| Arquivos `.tsx`                    | 87                |
| Linhas de código (core, sem `ui/`) | **18.956**        |
| Linhas de código (total com `ui/`) | **22.919**        |
| Arquivos de teste (unit)           | **19**            |
| Arquivos de teste (e2e)            | **6**             |
| Ratio testes/fonte                 | **19/195 (9.7%)** |

### Distribuição por Camada

| Camada                      | Linhas | Arquivos |
|:----------------------------|:-------|:---------|
| `src/domain`                | 1.378  | 10       |
| `src/infra`                 | 201    | 6        |
| `src/shared`                | 509    | 5        |
| `src/components/lib`        | 6.545  | 57       |
| `src/components/rac-editor` | 10.180 | 80       |
| `src/components/ui`         | 3.963  | 49       |

### Top 10 Maiores Arquivos (excluindo `ui/`)

| Arquivo                                                | Linhas |
|:-------------------------------------------------------|:-------|
| `components/lib/canvas/piloti.ts`                      | 847    |
| `rac-editor/RacEditor.tsx`                             | 569    |
| `components/lib/canvas/contraventamento.ts`            | 521    |
| `rac-editor/House3DScene.tsx`                          | 482    |
| `components/lib/house-manager.ts`                      | 437    |
| `components/lib/canvas/piloti-visual.ts`               | 378    |
| `rac-editor/canvas/hooks/useCanvasHouseViewActions.ts` | 347    |
| `rac-editor/canvas/Canvas.tsx`                         | 345    |
| `rac-editor/hooks/useContraventamentoCommands.ts`      | 317    |
| `rac-editor/modals/editors/piloti/PilotiEditor.tsx`    | 311    |

---

## 2. Clean Architecture

A separação de camadas está **bem definida** e sem violações de dependência:

- **Domínio** (`src/domain/`): Contém o `HouseAggregate` (264 linhas), a `HousePersistencePort` (interface), e 4 use
  cases. **Nenhuma dependência** de `components` ou `infra`.
- **Infra** (`src/infra/`): Implementação da persistência (`InMemoryHousePersistenceAdapter`) e settings. Depende apenas do
  domínio e shared.
- **Shared** (`src/shared/`): Tipos e configurações centralizadas. **Nenhuma dependência** de domínio ou infra.

### Ports/Adapters

A `HousePersistencePort` é a única porta formal. A implementação `InMemoryHousePersistenceAdapter` a implementa corretamente. A
arquitetura está funcional, mas o número de portas é baixo para o tamanho do projeto.

### Strategy Pattern

O Strategy Pattern foi implementado com sucesso para os elementos do canvas:

| Tipo       | Arquivo                |
|:-----------|:-----------------------|
| `line`     | `line.strategy.ts`     |
| `arrow`    | `arrow.strategy.ts`    |
| `distance` | `distance.strategy.ts` |
| `wall`     | `wall.strategy.ts`     |
| `water`    | `water.strategy.ts`    |
| `door`     | `door.strategy.ts`     |
| `stairs`   | `stairs.strategy.ts`   |
| `fossa`    | `fossa.strategy.ts`    |
| `tree`     | `tree.strategy.ts`     |
| `text`     | `text.strategy.ts`     |

A interface `ElementStrategy` é limpa e a factory (`index.ts`) registra todas as strategies em um
`Record<ElementStrategyKey, ElementStrategy>`.

### Constantes Centralizadas

A centralização de constantes em `shared/config.ts` (289 linhas) foi um avanço significativo. Valores como
`CANVAS_STYLE`, `HOUSE_DEFAULTS`, `PILOTI_STYLE`, `TOOLBAR_THEME` e `TOAST_MESSAGES` estão todos centralizados com
`as const`.

### Problemas Detectados

1. **Funções não exportadas:** `resolveHouseViewInsertion` e `calculateStackedViewPositions` existem em
   `useCanvasHouseViewActions.ts` (camada de componentes), mas os testes tentam importá-las de
   `house-views-layout.use-case.ts` (camada de domínio). Essas funções deveriam ter sido movidas para o domínio durante
   a refatoração.

2. **`this` em função standalone:** Em `canvas-rebuild.ts`, a função `readPilotiDataFromCanvas` usa
   `this.house?.pilotis`, mas é uma função `export function` (não um método de classe). Isso causa
   `TypeError: Cannot read properties of undefined`.

---

## 3. Hooks SRP (Single Responsibility Principle)

### Violações Graves

| Hook                          | `useState` | `useEffect` | `useCallback` | Linhas | Severidade |
|:------------------------------|:-----------|:------------|:--------------|:-------|:-----------|
| `useContraventamentoRefs`     | 0          | **9**       | 0             | 92     | **ALTA**   |
| `useCanvasViewport`           | **8**      | **5**       | **3**         | 102    | **ALTA**   |
| `useCanvasTools`              | 0          | 0           | **14**        | 172    | **MÉDIA**  |
| `useTutorialMenuActions`      | 0          | 0           | **14**        | 121    | **MÉDIA**  |
| `useRacEditorModalState`      | **12**     | 0           | 0             | 67     | **MÉDIA**  |
| `usePilotiEditor`             | **6**      | **4**       | 0             | 286    | **ALTA**   |
| `useContraventamentoCommands` | 0          | 0           | **8**         | 317    | **MÉDIA**  |
| `useContraventamentoQueries`  | 0          | 0           | **8**         | 123    | **MÉDIA**  |

### Análise Detalhada

O `useContraventamentoRefs` é o caso mais emblemático: **9 `useEffect`s** onde 6 deles fazem apenas
`ref.current = prop`, um padrão que pode ser substituído por um único `useEffect` ou por um helper `useLatest`. Os 2
`useEffect`s restantes contêm lógica real de sincronização.

O `useCanvasViewport` gerencia 8 estados relacionados (`zoom`, `viewportX`, `viewportY`, `containerSize`, `isPanning`,
`isPinching`, `isSingleFingerPanning`, `lastPanPoint`) que representam um único conceito: o estado do viewport. Isso é
um candidato clássico para `useReducer`.

O `useRacEditorModalState` com 12 `useState`s é aceitável no contexto (cada estado é um boolean de modal), mas poderia
ser simplificado com um objeto de estado único.

---

## 4. Componentes

### God Component: `RacEditor.tsx`

O `RacEditor.tsx` é o componente mais crítico com **569 linhas** e **94 referências a hooks**. Ele centraliza:

- Gerenciamento de estado de modais (12 estados)
- Fluxo de seleção de tipo de casa
- Ações de contraventamento
- Ações de piloti
- Ações de toolbar
- Tutorial
- Debug bridge
- Hotkeys
- Canvas tools

### Componentes Grandes

| Componente                  | Linhas | Hooks | Arrow Fns |
|:----------------------------|:-------|:------|:----------|
| `RacEditor.tsx`             | 569    | 94    | 4         |
| `House3DScene.tsx`          | 482    | 23    | 4         |
| `Canvas.tsx`                | 345    | 35    | 3         |
| `PilotiEditor.tsx`          | 311    | 5     | 4         |
| `NivelDefinitionEditor.tsx` | 306    | 6     | 9         |
| `House3DViewer.tsx`         | 275    | 30    | 3         |
| `GenericObjectEditor.tsx`   | 261    | 16    | 9         |

---

## 5. Testes

### Estado Atual: 12 Testes Falhando

| Arquivo de Teste                            | Falhas | Causa Raiz                           |
|:--------------------------------------------|:-------|:-------------------------------------|
| `house-views-layout.use-case.smoke.test.ts` | 3      | Funções não exportadas do módulo     |
| `house-top-view-door-marker.smoke.test.ts`  | 7      | Funções não exportadas do módulo     |
| `house-manager.smoke.test.ts`               | 2      | Bug de `this` em `canvas-rebuild.ts` |

### Cobertura de Testes

| Área                     | Arquivos Fonte | Arquivos de Teste | Cobertura |
|:-------------------------|:---------------|:------------------|:----------|
| `domain/`                | 5              | 5                 | **100%**  |
| `infra/`                 | 4              | 2                 | **50%**   |
| `components/lib/`        | 45             | 8                 | **18%**   |
| `components/rac-editor/` | 75             | 4                 | **5%**    |
| **Total**                | **195**        | **19**            | **9.7%**  |

### Módulos Críticos Sem Testes

Os seguintes módulos de alta complexidade não possuem nenhum teste:

- `piloti.ts` (847 linhas) — lógica core de pilotis
- `contraventamento.ts` (521 linhas) — lógica de contraventamento
- `house-manager.ts` (437 linhas) — parcialmente coberto
- `house-dimensions.ts` (190 linhas) — novo arquivo sem testes
- `canvas-rebuild.ts` (141 linhas) — novo arquivo sem testes
- Todos os 11 arquivos de `*.strategy.ts` na factory de elementos

---

## 6. Padrões de Código

### Pontos Positivos

- **Zero `any`/`unknown` em código de produção** (excluindo testes e UI).
- **Zero `TODO`/`FIXME`/`HACK`** no código.
- **Zero `console.log`/`console.warn`/`console.error`** em código de produção.
- **Zero violações de dependência entre camadas** (domínio não importa de componentes, shared não importa de domínio).
- **Constantes bem centralizadas** em `shared/config.ts` com `as const`.

### Problemas Detectados

1. **Typo em nomes de arquivo:** `house-top.straregy.ts` e `house.straregy.ts` (deveria ser `strategy`).
2. **Duplicação do `scaling guard`:** O padrão `__normalizingScale` está copiado em 4 strategies (`arrow`, `distance`,
   `line`, `wall`), totalizando ~32 linhas duplicadas.
3. **Funções privadas testadas diretamente:** Os testes de `house-top-view-door-marker` importam 6 funções que são
   `function` (sem `export`), indicando que a refatoração moveu as funções mas esqueceu de exportá-las.

---

## 📋 Resumo de Issues Detectadas

| #  | Severidade  | Tipo         | Descrição                                          | Arquivo(s)                                   |
|:---|:------------|:-------------|:---------------------------------------------------|:---------------------------------------------|
| 1  | **BLOCKER** | Bug          | `this` em `readPilotiDataFromCanvas` é `undefined` | `canvas-rebuild.ts:65`                       |
| 2  | **BLOCKER** | Bug          | `resolveHouseViewInsertion` não exportada          | `house-views-layout.use-case.ts`             |
| 3  | **BLOCKER** | Bug          | `calculateStackedViewPositions` não exportada      | `house-views-layout.use-case.ts`             |
| 4  | **BLOCKER** | Bug          | 6 funções não exportadas em door-marker            | `house-top-view-door-marker.ts`              |
| 5  | **ALTA**    | Typo         | Nomes de arquivo com `straregy`                    | `house-top.straregy.ts`, `house.straregy.ts` |
| 6  | **ALTA**    | Duplicação   | `__normalizingScale` em 4 strategies               | `arrow/distance/line/wall.strategy.ts`       |
| 7  | **ALTA**    | SRP          | 9 `useEffect`s em `useContraventamentoRefs`        | `useContraventamentoRefs.ts`                 |
| 8  | **ALTA**    | SRP          | 8 `useState`s em `useCanvasViewport`               | `useCanvasViewport.ts`                       |
| 9  | **ALTA**    | Complexidade | God Component com 94 hooks                         | `RacEditor.tsx`                              |
| 10 | **MÉDIA**   | Cobertura    | 9.7% de cobertura de testes                        | Projeto inteiro                              |
