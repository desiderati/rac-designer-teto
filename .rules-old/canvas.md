# Regras do Componente Canvas

Este documento descreve o comportamento operacional do `Canvas` 2D do editor RAC.

## 1. Responsabilidade

`Canvas.tsx` concentra composição de interações 2D e delega responsabilidades para hooks:

1. `useCanvasViewport`
2. `useCanvasHistory`
3. `useCanvasClipboard`
4. `useCanvasHouseSelection`
5. `useContraventamentoRefs`
6. `useCanvasFabricSetup` (setup do Fabric + binding de eventos e atalhos de canvas)
7. `useCanvasPointerInteractions` (pan/wheel/touch/pinch e prevenção de zoom do browser)
8. `CanvasOverlays` (feedback de pinch + minimap/zoom mobile/desktop + renderização dos filhos com regras de tutorial)
9. `useCanvasScreenProjection` (projeção de ponto do canvas para tela, cálculo de offset e centro visível)
10. `useCanvasMinimapObjects` (snapshot de objetos para minimap)
11. `useCanvasContainerLifecycle` (sincronização de resize do container e clamp de viewport)

Dentro de `useCanvasFabricSetup`, os bindings de evento foram quebrados em hooks especializados:

1. `useCanvasSelectionActions`
2. `useContraventamentoEvents`
3. `useCanvasKeyboardShortcuts`
4. `useCanvasEditorEvents`

Além dos hooks, a seleção de piloti foi movida para helper dedicado:

1. `canvas-piloti-selection`

## 2. Contratos expostos

### 2.1 `CanvasHandle`

API exposta por `ref`:

1. `saveHistory()`
2. `clearHistory()`
3. `undo()`
4. `copy()`
5. `paste()`
6. `getCanvasPosition()`
7. `getVisibleCenter()`

### 2.2 Callbacks de seleção

`Canvas` pode emitir seleções tipadas para abrir editores:

1. piloti
2. distância
3. nome de objeto
4. linha/seta
5. contraventamento

## 3. Regras de interação

## 3.1 Atalhos de teclado

1. `Delete` / `Backspace`
    - ignora quando foco está em input/textarea/select/contenteditable
    - ignora quando um editor está aberto (`isAnyEditorOpen`)
    - prioriza `onDelete` do pai para manter sincronização com `houseManager`
2. `Ctrl/Cmd + C`: `copy()`
3. `Ctrl/Cmd + V`: `paste()`
4. `Ctrl/Cmd + Z`: `undo()`
5. `L` e `Z` (fluxo do `RacEditor`) são tratados no hook `useRacHotkeys`, com bloqueio quando foco está em campos de
   edição ou quando há modificadores (`Ctrl/Cmd/Alt`)
6. no setup Fabric, os atalhos globais e snap de rotação são registrados por `useCanvasKeyboardShortcuts`
7. snap de rotação ortogonal (`0/90/180/270`) também deve valer para `line` (não apenas `arrow/dimension`)
8. snap de rotação usa tolerância de `10°` em torno dos ângulos ortogonais

## 3.2 Zoom e viewport

1. faixa de zoom: `0.25` a `2.0`
2. viewport sempre clamped nos limites do canvas
3. `Ctrl + wheel` faz zoom interno e previne zoom do browser
4. wheel sem modificador faz pan
5. cálculo de offset do canvas (centrado vs deslocado por viewport) é centralizado no util
   `getCanvasViewportOffset` para manter consistência entre render e ancoragem de editores
6. handlers de ponteiro (`mouse`/`wheel`/`touch`) no componente container são centralizados em
   `useCanvasPointerInteractions`
7. projeção de tela (`getCurrentScreenPoint`) e centro visível (`getVisibleCenter`) são centralizados em
   `useCanvasScreenProjection` para manter consistência com o offset usado no render
8. resize de container e clamp de viewport são centralizados em `useCanvasContainerLifecycle`
9. `line`, `arrow` e `dimension` escalam apenas no eixo longitudinal (sem crescimento vertical/diagonal):
    - `lockScalingY = true`;
    - controles diagonais (`tl/tr/bl/br`) ocultos;
    - handlers de `scaling` normalizam `scaleX/scaleY` dos filhos para evitar deformações cumulativas
10. `line` deve normalizar escala longitudinal usando `totalLength = group.width * group.scaleX` e atualizar
    `group.width`
    após o `scaling`, para evitar deslocamento no canvas em vez de redimensionamento.
11. a normalização de escala de `line` deve ser centralizada em helper único do factory (`bindLineGroupScaling` /
    `normalizeLineGroupScaling`) e reutilizada no apply do editor inline, evitando duplicação de comportamento.
12. a normalização de escala de `arrow` deve ser centralizada em helper único do factory
    (`bindArrowCanvasObjectScaling` / `normalizeArrowGroupScaling` / `normalizeArrowCanvasObjectToLength`) e reutilizada
    no apply
    do editor inline, evitando duplicação de comportamento.

## 3.3 Desenho livre

1. `canvas.freeDrawingBrush` é `PencilBrush`
2. cor e espessura vêm de `CANVAS_ELEMENT_STYLE`
3. `decimate = 8` para suavizar traços durante o desenho

## 3.4 Touch

1. 1 toque: pan
2. 2 toques: pinch-to-zoom + pan
3. mostra indicador de percentual durante pinch

## 3.5 Minimap e ZoomSlider

1. minimap mostra viewport atual e objetos simplificados
2. minimap permite reposicionar viewport por click/drag/touch
3. ZoomSlider permite ajuste contínuo do zoom
4. minimap pode ser ocultado quando canvas cabe totalmente na viewport
5. avanço do tutorial de zoom/minimap no `RacEditor` usa handler único (`handleZoomTutorialInteraction`) reaproveitado
   por `onZoomInteraction`, `onMinimapInteraction` e toggle de zoom

## 3.6 Modo contraventamento

1. `Canvas` delega elegibilidade e clique de piloti ao fluxo de contraventamento recebido via props
2. cancelamento do modo pode ser disparado por interação no canvas conforme lógica do fluxo

## 3.7 Editores inline por interação

1. desktop: `double-click` abre edição de dimensão, parede e linha/seta

2. mobile: `tap` abre edição de parede, linha/seta e dimensão (com threshold no centro da dimensão)

3. clique em piloti dentro de grupos de casa (hit-test local) mantém abertura de editor de piloti

4. essas regras de interação são centralizadas em `useCanvasEditorEvents`

5. paredes agrupadas (`group` com `myType = wall`) devem continuar abrindo o `GenericObjectEditor` com valor atual do
   label

6. limpar o nome em `GenericObjectEditor` para parede/linha/seta não pode remover objeto do canvas; apenas oculta/limpa
   label

7. ao inserir `line`, `arrow` ou `dimension`, já deve existir label placeholder `" "` para manter box de seleção
   consistente

8. em `wall` agrupado, atualização de nome/cor deve sempre manter label dentro do grupo (inclusive quando o parent vier
   via `wall.group`)

9. a geometria da seta deve preservar head completo no redimensionamento longitudinal (sem corte em cache/bounds)

10. em `line/arrow` agrupado, atualização de label via `GenericObjectEditor` deve recalcular bounds do grupo sem
    desagrupar, mantendo label corretamente ancorado já na primeira edição (antes de qualquer resize manual)

11. em `line/arrow` agrupado, ao trocar label de `" "` para texto real, não deve haver recomputação estrutural do grupo
    (`addWithUpdate`) durante o apply; apenas `setCoords`/render, para não deslocar visualmente a distância entre linha
    e label

12. em `line/arrow`, o apply da label deve preservar o `top` normalizado já existente no grupo (não impor offset fixo
    novo), alinhando o comportamento com `dimension` e evitando salto visual da label após confirmar no
    `GenericObjectEditor`.

## 3.8 Exclusão por teclado

1. o `Delete/Backspace` delega para `onDelete` quando fornecido pelo `RacEditor`
2. quando não há `onDelete`, a exclusão remove os objetos ativos diretamente do canvas

## 4. Regras de testabilidade

1. container principal com `data-testid="rac-canvas-container"`
2. elemento canvas com `data-testid="rac-editor-canvas-element"`
3. dependência de eventos globais (keyboard/window) exige testes E2E para cobertura real

## 5. Checklist de cobertura E2E (arquivo)

Cobertura atual em `e2e/canvas.spec.ts` e suítes relacionadas:

1. [x] abertura de editor de piloti sem crash (fluxo envolvendo canvas/render)
2. [x] fluxos de vistas no canvas (inserção/limites/remoção via debug)
3. [x] zoom por slider
4. [ ] zoom/pan por wheel (mouse) e gesto touch
5. [ ] minimap drag/click com validação de reposicionamento de viewport
6. [ ] undo/redo
7. [ ] copy/paste
8. [ ] delete com e sem editor aberto
9. [ ] seleção de distância/nome/linha-seta

## 6. Referências de código

- `src/components/rac-editor/canvas/Canvas.tsx`
    - componente de composição: viewport, histórico, clipboard, seleção, contraventamento e setup Fabric

- `src/components/rac-editor/canvas/CanvasOverlays.tsx`
    - camada de overlays visuais e controles de zoom/minimap, com comportamento responsivo mobile/desktop

- `src/components/rac-editor/RacEditorCanvas.tsx`
    - encapsula a seção de integração `RacEditor` -> `Canvas` + `InfoBar`, mantendo callbacks e estados do editor
      centralizados

- `src/components/rac-editor/Minimap.tsx`

- `src/components/rac-editor/canvas/hooks/useCanvasViewport.ts`

- `src/components/rac-editor/canvas/hooks/useCanvasHistory.ts`

- `src/components/rac-editor/canvas/hooks/useCanvasClipboard.ts`

- `src/components/rac-editor/canvas/hooks/useCanvasHouseSelection.ts`

- `src/components/rac-editor/canvas/hooks/useContraventamentoRefs.ts`

- `src/components/rac-editor/canvas/hooks/useCanvasFabricSetup.ts`
    - concentra inicialização do `FabricCanvas`, bindings de eventos e cleanup
    - metadados dinâmicos de objetos Fabric são acessados por tipos runtime extraídos para
      `canvas.ts` (sem `eslint-disable`/`any` explícito)
    - refs mutáveis usados pelo setup (`MutableRefObject`) devem preservar escrita em `.current` sem casts inseguros
    - listeners registrados uma única vez leem callbacks/refs atuais por `latestArgsRef`, preservando estabilidade de
      eventos e regra de lint de dependências (`exhaustive-deps`)

- `src/components/lib/canvas/canvas.ts`
    - tipos runtime do Fabric usados no setup de eventos:
        - `CanvasObject`
        - `CanvasPointerPayload`
        - `CanvasMouseEvent`

- `src/components/rac-editor/canvas/hooks/useCanvasSelectionActions.ts`
    - encapsula fluxo de `selection:*`, hints e highlights de piloto/lateral na planta

- `src/components/rac-editor/canvas/hooks/useContraventamentoEvents.ts`
    - encapsula seleção de contraventamento, clique/tap de piloti em modo de contraventamento e cursor contextual

- `src/components/rac-editor/canvas/hooks/useCanvasKeyboardShortcuts.ts`
    - encapsula atalhos globais (`delete/copy/paste/undo`) e snap de rotação (`object:rotating`)

- `src/components/rac-editor/canvas/hooks/useCanvasEditorEvents.ts`
    - encapsula `double-click` desktop e `tap` mobile para abertura dos editores inline (distância, parede e linha/seta)
    - inclui resolução de alvo de parede agrupada para reedição de nome/cor após primeira configuração
    - mantém hit-test local de piloti em grupos de casa para seleção no fluxo de edição

- `src/components/lib/canvas/piloti-selection.ts`
    - encapsula o fluxo completo de seleção de piloti (hit area, regras de contraventamento, projeção em tela e feedback
      visual)
    - reduz complexidade interna do `useCanvasFabricSetup` sem alterar contrato dos callbacks de seleção

- `src/components/rac-editor/canvas/hooks/useCanvasPointerInteractions.ts`
    - encapsula panning com mouse, zoom/pan por wheel, pinch-to-zoom e single-finger pan mobile
    - aplica prevenção de zoom do browser em `Ctrl/Cmd + wheel` no container do canvas

- `src/components/rac-editor/canvas/hooks/useCanvasScreenProjection.ts`
    - encapsula `getCanvasOffsetFromState`, `getCurrentScreenPoint` e `getVisibleCenter`
    - mantém cálculo consistente entre transform do canvas e posicionamento de overlays/editors

- `src/components/rac-editor/canvas/hooks/useCanvasMinimapObjects.ts`
    - encapsula snapshot dos objetos renderizados (bounds/ângulo/tipo) para feed do minimap

- `src/components/rac-editor/canvas/hooks/useCanvasContainerLifecycle.ts`
    - encapsula observação de resize do container e clamp do viewport em mudanças de zoom/tamanho

- `src/components/rac-editor/modals/editors/generic/hooks/useGenericObjectEditor.ts`
    - estado e handlers dos editores inline (distância, nome de objeto e linha/seta) consumidos pelo `RacEditor`

- `src/components/rac-editor/modals/editors/generic/hooks/useGenericObjectEditorBindings.ts`
    - compõe `useGenericObjectEditor` no `RacEditor` e centraliza:
        - cálculo de `isAnyEditorOpen` repassado ao `Canvas`;
        - wiring de callbacks de seleção inline (`distance/object name/line-arrow`) entre `Canvas` e editores.

- `src/components/rac-editor/modals/editors/generic/hooks/useGenericObjectEditorDraft.ts`
    - contrato do draft de edição: deve sincronizar valores iniciais ao abrir o editor e em `reset`, sem sobrescrever a
      digitação/seleção de cor durante a edição aberta.

- `src/components/rac-editor/modals/editors/generic/hooks/useWallEditorActions.ts`
    - aplica alterações dos editores inline de distância e parede com persistência de histórico e mensagens de feedback

- `src/components/rac-editor/modals/editors/generic/hooks/useLinearEditorActions.ts`
    - aplica alterações do editor inline de linha (nome/cor) com fluxo de `apply` especializado no próprio hook
      e persistência de histórico/feedback

- `src/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts`
    - regra única de apply para `wall/line/arrow/distance`, mantendo labels e cores consistentes

- `src/components/rac-editor/hooks/useHotkeys.ts`
    - centraliza os atalhos `L` (modo desenho) e `Z` (zoom/minimap) do `RacEditor`

- `src/components/lib/canvas/canvas-screen-position.ts`
    - projeção de coordenadas de ponto do canvas para posição absoluta de tela em overlays do editor

- `src/components/rac-editor/modals/editors/generic/helpers/linear-object-state.ts`
    - leitura de metadados de linha/seta (cor e rótulo) para abertura do editor sem acoplar lógica no `Canvas`

- `src/components/lib/canvas/factory/elements/index.ts`
    - registry de `ElementStrategy` e resolução de factories por tipo
- `src/components/lib/canvas/factory/elements/line.strategy.ts`
    - helpers de escala longitudinal da linha (`bindLineGroupScaling`, `normalizeLineGroupScaling`)
      reutilizados por criação e por apply inline
- `src/components/lib/canvas/factory/elements/arrow.strategy.ts`
    - helpers de escala longitudinal da seta (`bindArrowCanvasObjectScaling`, `normalizeArrowGroupScaling`,
      `normalizeArrowCanvasObjectToLength`) reutilizados por criação e por apply inline

- `src/components/lib/canvas/piloti-screen-position.ts`
    - projeção de ponto local do piloti (group matrix + viewport transform) para posição absoluta de tela

- `src/components/lib/canvas/piloti-visual-feedback.ts`
    - estilos visuais de seleção de piloti (highlight global, highlight do piloti ativo e restauração visual)
    - utilitários recebem coleções `unknown[]` com type guards internos para evitar casts frágeis de objetos Fabric

- `src/components/lib/canvas/canvas-rebuild.ts`
    - inclui filtro de grupos de casa e mapeamentos para rebuild/piloti
    - operações: `collectHouseGroupRebuildSources`, `collectHouseGroupPilotiSources`, `findTopViewGroupCandidate`
    - `useCanvasSelectionActions.ts` reutiliza `findTopViewGroupCandidate` para localizar a planta no highlight lateral
