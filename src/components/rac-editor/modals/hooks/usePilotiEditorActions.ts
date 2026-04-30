import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/canvas/ports/CanvasInteractionPort.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/canvas/ports/CanvasSelectionPort.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';
import {useEditorStore} from '@/bootstrap/editor-bootstrap.ts';

interface UsePilotiActionsArgs {
  isContraventamentoMode: boolean;
  hasPilotiTutorial: boolean;
  closePilotiTutorial: () => void;
  canvasRef: RefObject<CanvasHandle | null>;
  pilotiSelection: PilotiCanvasSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  syncContraventamentoElevations: () => void;
  setInfoMessage: Dispatch<SetStateAction<string>>;
}

export function usePilotiEditorActions({
  isContraventamentoMode,
  hasPilotiTutorial,
  closePilotiTutorial,
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
        setIsPilotiEditorOpen(true);
        if (hasPilotiTutorial) {
          closePilotiTutorial();
        }
      }
    }, [
      closePilotiTutorial,
      hasPilotiTutorial,
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
    canvasRef.current?.applyPilotiSelectionVisuals(pilotiId);

    setPilotiSelection((previous) => previous ? {
      ...previous,
      pilotiId,
      currentHeight: height,
      currentIsMaster: isMaster,
      currentNivel: nivel,
      editorSelection: {
        ...previous.editorSelection,
        pilotiId,
      },
    } : null);

    if (pilotiSelection.editorSelection) {
      editorStore.dispatch({
        type: 'SELECT_EDITOR_TARGET',
        selection: {
          ...pilotiSelection.editorSelection,
          pilotiId,
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
