import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import type {CanvasEditorVisualHandle} from '@/components/rac-editor/@canvas/ports/CanvasEditorVisualHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import type {CanvasRenderHandle} from '@/components/rac-editor/@canvas/ports/CanvasSurfaceHandle.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';
import {useEditorStore} from '@/bootstrap/editor-bootstrap.ts';
import {
  dispatchRacCanvasObjectEvent,
  type RacCanvasObjectEventKind,
  RAC_CANVAS_OBJECT_SELECTED_EVENT,
} from '@/components/rac-editor/@canvas/lib/canvas-object-dom-events.ts';

interface UsePilotiActionsArgs {
  isContraventamentoMode: boolean;
  canvasRef: RefObject<(CanvasEditorVisualHandle & CanvasHistoryHandle & CanvasRenderHandle) | null>;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  syncContraventamentoElevations: () => void;
  setInfoMessage: Dispatch<SetStateAction<string>>;
}

function dispatchPilotiSelectedEvent(
  selection: Pick<PilotiCanvasSelection, 'screenPosition'>,
  kind: Extract<RacCanvasObjectEventKind, 'piloti' | 'piloti-master'>,
): void {
  const size = 36;
  dispatchRacCanvasObjectEvent(RAC_CANVAS_OBJECT_SELECTED_EVENT, {
    kind,
    rect: {
      left: selection.screenPosition.x - size / 2,
      top: selection.screenPosition.y - size / 2,
      width: size,
      height: size,
    },
  });
}

export function usePilotiEditorActions({
  isContraventamentoMode,
  canvasRef,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  syncContraventamentoElevations,
  setInfoMessage,
}: UsePilotiActionsArgs) {
  const editorStore = useEditorStore();

  const handlePilotiSelect =
    useCallback((selection: PilotiCanvasSelection | null) => {
      if (isContraventamentoMode) return;

      editorStore.dispatch({
        type: 'SELECT_EDITOR_TARGET',
        selection: selection?.editorSelection ?? null,
      });

      setPilotiSelection(selection);
      if (selection) {
        dispatchPilotiSelectedEvent(selection, selection.currentIsMaster ? 'piloti-master' : 'piloti');
        setIsPilotiEditorOpen(true);
      }
    }, [
      editorStore,
      isContraventamentoMode,
      setIsPilotiEditorOpen,
      setPilotiSelection,
    ]);

  const handlePilotiEditorClose = useCallback(() => {
    setIsPilotiEditorOpen(false);
    canvasRef.current?.applyPilotiEditorCloseVisuals();
    setPilotiSelection(null);
    editorStore.dispatch({type: 'CLEAR_EDITOR_SELECTION'});
  }, [canvasRef, editorStore, setIsPilotiEditorOpen, setPilotiSelection]);

  const handlePilotiHeightChange = useCallback((newHeight: number) => {
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    canvasRef.current?.renderAll();
    setInfoMessage(`Altura do piloti atualizada para ${formatPilotiHeight(newHeight)} m.`);
  }, [canvasRef, setInfoMessage, syncContraventamentoElevations]);

  const handlePilotiNavigate = useCallback((
    pilotiId: string,
    height: number,
    isMaster: boolean,
    nivel: number
  ) => {
    const nextScreenPosition =
      isMaster
        ? canvasRef.current?.getPilotiScreenPosition(pilotiId, pilotiSelection?.houseView) ?? null
        : null;

    canvasRef.current?.applyPilotiSelectionVisuals(pilotiId);
    if (nextScreenPosition) {
      dispatchPilotiSelectedEvent({screenPosition: nextScreenPosition}, 'piloti-master');
    }

    setPilotiSelection((previous) => previous ? {
      ...previous,
      pilotiId,
      currentHeight: height,
      currentIsMaster: isMaster,
      currentNivel: nivel,
      editorSelection: {
        ...previous.editorSelection,
        pilotiId,
        screenPosition: nextScreenPosition ?? previous.editorSelection.screenPosition,
      },
      screenPosition: nextScreenPosition ?? previous.screenPosition,
    } : null);

    if (pilotiSelection?.editorSelection) {
      editorStore.dispatch({
        type: 'SELECT_EDITOR_TARGET',
        selection: {
          ...pilotiSelection.editorSelection,
          pilotiId,
          screenPosition: nextScreenPosition ?? pilotiSelection.editorSelection.screenPosition,
        },
      });
    }

    syncContraventamentoElevations();
    setInfoMessage(`Piloti selecionado – Altura atual: ${formatPilotiHeight(height)} m.`);
  }, [canvasRef, editorStore, pilotiSelection, setInfoMessage, setPilotiSelection, syncContraventamentoElevations]);

  return {
    handlePilotiSelect,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
  };
}
