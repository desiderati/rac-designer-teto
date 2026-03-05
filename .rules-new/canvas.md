# Regras do Canvas 2D

## Objetivo

Definir como o editor 2D reage a seleção, navegação, edição e estado de ferramentas, garantindo previsibilidade.

## Regras de interação do usuário

1. Seleção e feedback

    - Ao selecionar objeto, a barra de informação e os destaques visuais devem refletir o alvo atual.
    - Ao limpar seleção, o sistema remove realces transitórios.
    - Em vista elevada selecionada, o sistema destaca terreno e também a borda correspondente na planta.

2. Navegação e viewport

    - Zoom pode ocorrer por slider, wheel e gesto touch.
    - Pan pode ocorrer por arraste e minimapa.
    - O minimapa sempre representa viewport atual e objetos principais.

3. Edição contextual

    - Seleção de piloti abre fluxo de piloti.
    - Seleção de parede/objeto linear abre editor correspondente.
    - Seleção de terreno em elevação abre editor de terreno.

4. Modos concorrentes

    - Modo desenho desativa seleção para evitar conflito.
    - Ações de inserção de texto desativam desenho antes de inserir.
    - Em modo contraventamento, o clique em piloti segue regras de origem/destino, não o fluxo comum de edição.

## Regras de segurança e consistência

1. Exclusão de planta

    - A planta (`top`) só pode ser removida quando não houver outras vistas.
    - Se houver outras vistas, a exclusão é bloqueada com mensagem explícita.

2. Undo/redo e histórico

    - Toda mudança material (inserção, remoção, alterações estruturais) deve registrar histórico.
    - Recuperações de estado devem reidratar seleção/visualizações sem inconsistência de realce.

3. Limpeza de estado auxiliar

    - Sempre que a seleção muda, tooltips/tutorial balloons temporários devem ser fechados para evitar sobreposição de
      contexto.

## Regras de tutorial no canvas

- Ao inserir certos elementos pela primeira vez (muro, linha, seta, distância), o sistema mostra balão contextual de
  ajuda.
- Exibição é controlada por flag persistida em storage para não repetir indefinidamente.

## Evidências no código

- Componente principal do canvas:
    - `src/components/rac-editor/ui/canvas/Canvas.tsx`

- Setup, eventos e ciclo de vida:
    - `src/components/rac-editor/hooks/canvas/useCanvasFabricSetup.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasContainerLifecycle.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasPointerInteractions.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasSelectionActions.ts`

- Viewport/minimapa:
    - `src/components/rac-editor/hooks/canvas/useCanvasViewport.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasMinimapObjects.ts`
    - `src/components/rac-editor/ui/Minimap.tsx`

- Ações globais e ferramentas:
    - `src/components/rac-editor/hooks/canvas/useCanvasActions.ts`
    - `src/components/rac-editor/hooks/canvas/useCanvasTools.ts`

- Motor de renderização 2D:
    - `src/components/rac-editor/lib/canvas/canvas.ts`
    - `src/components/rac-editor/lib/canvas/canvas-rebuild.ts`
    - `src/components/rac-editor/lib/canvas/hints.ts`

## Evidências em testes

- E2E:
    - `e2e/canvas.spec.ts`
    - `e2e/modal-editors.spec.ts`

- Smoke:
    - `src/components/rac-editor/hooks/canvas/useCanvasSelectionActions.smoke.test.ts`
    - `src/components/rac-editor/lib/canvas/canvas-rebuild.smoke.test.ts`
    - `src/components/rac-editor/lib/canvas/canvas-screen-position.smoke.test.ts`
