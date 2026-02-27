# Regras do Componente Toolbar

Este documento descreve o contrato funcional da `Toolbar` do RAC editor.

## 1. Responsabilidade

`Toolbar.tsx` é uma view de comandos. Regras de negócio ficam no pai (`RacEditor` + `houseManager`) e em hooks
dedicados de orquestração.

No `RacEditor`, ações de inserção de elementos/linhas/desenho foram extraídas para `useCanvasTools`, que centraliza
o fluxo comum de add (`addCanvasObject`: fechamento de menu + add + tutorial) e os handlers de desenho/texto.

As ações de projeto do overflow (`exportar JSON`, `importar JSON` e `excluir seleção`) foram extraídas para
`useRacEditorJsonActions`, mantendo as mesmas regras de negócio de remoção e sincronização.

Os contadores de limite por vista enviados para `Toolbar` também usam helper único (`getToolbarViewCount`) para
manter o mesmo contrato com menor repetição.

O fluxo de ações de vistas/tipo de casa (seleção de lado, níveis e inserção inicial) é delegado para
`useCanvasHouseViewActions`, mantendo o `RacEditor` como orquestrador.

Ações de `Agrupar`/`Desagrupar` (incluindo confirmação de desagrupamento) são delegadas para
`useCanvasGroupingActions`, mantendo o mesmo contrato da toolbar.

Interações de menu/tutorial (toggle de submenus, selector de tipo de casa e gates de tutorial) são delegadas para
`useTutorialMenuActions`, mantendo o `RacEditor` como composição de fluxos.

Fluxo de reinício do tutorial/canvas (confirmação, reset de estado e limpeza de overlays de tutorial) é delegado para
`useTutorialUiActions`.

Overlays/modais do editor (seletor de tipo de casa, settings, tutorial/balões, confirmações e editor de níveis) foram
extraídos para `RacEditorModals`, mantendo `RacEditor` como orquestrador de estado.

Helpers locais de interação canvas/menu no `RacEditor` (canvas ativo, centro visível, add no centro, fechamento de
menus e desligamento do modo desenho) foram consolidados em `useCanvasInteractionActions`.

Composição do `ToolbarActionMap` no `RacEditor` foi extraída para `useToolbarActions`, mantendo o contrato da
`Toolbar` e reduzindo objeto inline no componente raiz.

No `RacEditor`, o cálculo de `isAnyEditorOpen` e o wiring de seleções inline (`distance/objectName/line-arrow`) para o
`Canvas` foram extraídos para `useGenericObjectEditorBindings`.

No componente de toolbar, a estrutura visual foi quebrada em composição:

1. `ToolbarButtons` (botões base FAB/submenu)
2. `ToolbarMainMenu` (menu lateral esquerdo)
3. `ToolbarOverflowMenu` (menu de overflow à direita)
4. `toolbar-config` (mapeamento de ícones/comandos por seção)

## 2. Contrato de comandos

Todos os comandos entram por `ToolbarActionMap` (callbacks injetados):

1. casa/vistas
2. elementos
3. linhas e desenho
4. import/export/pdf
5. 3D, dicas, configurações, reinício

## 3. Estrutura de menus

## 3.1 Menu principal

1. botão principal abre/fecha menu lateral
2. submenus controlados por `activeSubmenu`:
    - `house`
    - `elements`
    - `lines`
    - `overflow`

## 3.2 Casa por tipo

Tipo 6:

1. `Visão Frontal` -> `front`
2. `Visão Traseira` -> `back`
3. `Quadrado Fechado` -> `side1` (até 2)

Tipo 3:

1. `Quadrado Aberto` -> `side2`
2. `Visão Lateral` -> `back` (até 2)
3. `Quadrado Fechado` -> `side1`

## 3.3 Estado de limite

1. botões de vista recebem `isAtLimit` para feedback visual
2. bloqueio efetivo de regra ocorre no fluxo de add do `RacEditor`/`houseManager`
3. quando no limite, usuário recebe `toast` de erro no fluxo de add

## 3.4 Overflow

Comandos de overflow:

1. abrir projeto JSON
2. exportar JSON
3. salvar PDF
4. visualizar em 3D
5. reiniciar canvas
6. toggle de dicas
7. configurações

Regras do fluxo de projeto:

1. `exportar JSON` serializa o canvas atual e baixa `RAC-TETO-Projeto.json`.
2. `importar JSON` limpa o canvas, carrega o JSON e então:
    - reseta fluxo de contraventamento;
    - normaliza grupos de casa no canvas;
    - reconstrói estado do `houseManager` via `rebuildFromCanvas`;
    - sincroniza contraventamentos nas elevações;
    - salva histórico.
3. `excluir seleção`:
    - se há contraventamento selecionado, remove apenas o contraventamento e sincroniza elevações;
    - se a seleção contém a planta (`top`), só permite excluir quando não houver outras vistas;
    - ao remover a planta, o `houseType` é resetado.

Regra de robustez para configurações:

1. falha de persistência em `localStorage` não deve quebrar o fluxo de UI;
2. confirmação no modal de configurações deve seguir funcional mesmo sem escrita persistida.

Confirmações de ações destrutivas do fluxo de toolbar (`reiniciar`/`desagrupar`) são renderizadas por
`ConfirmDialogModal` (arquivo `ConfirmDialogModal.tsx`), com comportamento consistente em `Dialog` (desktop) e
`Drawer` (mobile).

## 3.5 Tutorial e dicas

1. ao inserir `muro`, `linha`, `seta` e `distância`, o tutorial pode exibir um balão contextual:
    - cada dica aparece apenas uma vez (persistido em `tutorial.storage`);
    - o balão é posicionado usando o centro do objeto recém-criado.

## 4. Acessibilidade e testabilidade

1. botões usam `aria-label` e `title` com o mesmo texto do comando
2. nomes dos botões são base para seletores E2E por role/name

## 5. Checklist de cobertura E2E (arquivo)

Cobertura atual em `e2e/views-limits.spec.ts` e `e2e/toolbar-overflow.spec.ts`:

1. [x] abertura de `Casa TETO (Opções)`
2. [x] comandos de vistas por tipo (`Visão Frontal`, `Visão Traseira`, `Visão Lateral`, `Quadrado Fechado`,
   `Quadrado Aberto`)
3. [x] bloqueio por limite (frontal, lateral, quadrado aberto, quadrado fechado)
4. [x] ciclo remove/reinsere de vistas após limite
5. [x] comandos de `Elementos` (muro, escada, árvore, água/rio, fossa)
6. [x] comandos de `Linhas` (linha reta, seta simples, distância)
7. [x] comandos de `Overflow` para `3D`, `dicas` e `configurações`
8. [ ] comandos de `Overflow` para `import/export/pdf/reinício`

## 6. Referências de código

- `src/components/rac-editor/Toolbar.tsx`
- `src/components/rac-editor/toolbar/ToolbarButtons.tsx`
- `src/components/rac-editor/toolbar/ToolbarMainMenu.tsx`
- `src/components/rac-editor/toolbar/ToolbarOverflowMenu.tsx`
- `src/components/rac-editor/toolbar/toolbar-config.ts`
- `src/components/rac-editor/toolbar/helpers/toolbar-types.ts`
- `src/components/rac-editor/RacEditor.tsx`
- `src/components/rac-editor/canvas/hooks/useCanvasTools.ts`
- `src/components/rac-editor/hooks/useRacEditorJsonActions.ts`
- `src/components/rac-editor/canvas/hooks/useCanvasHouseViewActions.ts`
- `src/components/rac-editor/canvas/hooks/useCanvasGroupingActions.ts`
- `src/components/rac-editor/tutorial/hooks/useTutorialMenuActions.ts`
- `src/components/rac-editor/tutorial/hooks/useTutorialUiActions.ts`
- `src/components/rac-editor/canvas/hooks/useCanvasHouseInitialization.ts`
- `src/components/rac-editor/RacEditorModals.tsx`
- `src/components/rac-editor/canvas/hooks/useCanvasInteractionActions.ts`
- `src/components/rac-editor/toolbar/hooks/useToolbarActions.ts`
- `src/components/rac-editor/hooks/useGenericObjectEditorBindings.ts`
- `src/components/rac-editor/modals/ConfirmDialogModal.tsx`
- `src/components/lib/house-manager.ts`
- `e2e/views-limits.spec.ts`
- `e2e/toolbar-overflow.spec.ts`


