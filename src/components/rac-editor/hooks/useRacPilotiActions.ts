import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import type {
  CanvasHandle,
  ContraventamentoCanvasSelection,
  PilotiSelection,
} from '@/components/rac-editor/Canvas';
import {formatPilotiHeight} from '@/lib/canvas-utils';
import {applyPilotiEditorCloseVisuals, applyPilotiSelectionVisuals} from '@/lib/canvas/piloti-visual-feedback';

interface UseRacPilotiActionsArgs {
  isContraventamentoMode: boolean;
  onContraventamentoSelect: (selection: ContraventamentoCanvasSelection | null) => void;
  hasPilotiTutorial: boolean;
  closePilotiTutorial: () => void;
  canvasRef: RefObject<CanvasHandle | null>;
  pilotiSelection: PilotiSelection | null;
  setPilotiSelection: Dispatch<SetStateAction<PilotiSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  syncContraventamentoElevations: () => void;
  setInfoMessage: Dispatch<SetStateAction<string>>;
}

export function useRacPilotiActions({
  isContraventamentoMode,
  onContraventamentoSelect,
  hasPilotiTutorial,
  closePilotiTutorial,
  canvasRef,
  pilotiSelection,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  syncContraventamentoElevations,
  setInfoMessage,
}: UseRacPilotiActionsArgs) {
  const handlePilotiSelect = useCallback((selection: PilotiSelection | null) => {
    if (isContraventamentoMode) return;
    if (selection) onContraventamentoSelect(null);

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
    isContraventamentoMode,
    onContraventamentoSelect,
    setIsPilotiEditorOpen,
    setPilotiSelection,
  ]);

  const handlePilotiEditorClose = useCallback(() => {
    setIsPilotiEditorOpen(false);
    const canvas = canvasRef.current?.canvas;
    const group = pilotiSelection?.group;
    if (group && canvas) {
      const activeObject = canvas.getActiveObject();
      const houseStillSelected = activeObject === group;
      applyPilotiEditorCloseVisuals({
        groupObjects: group.getObjects(),
        houseStillSelected,
      });
      canvas.renderAll();
    }
    setPilotiSelection(null);
  }, [canvasRef, pilotiSelection, setIsPilotiEditorOpen, setPilotiSelection]);

  const handlePilotiHeightChange = useCallback((newHeight: number) => {
    syncContraventamentoElevations();
    canvasRef.current?.saveHistory();
    canvasRef.current?.canvas?.renderAll();
    setInfoMessage(`Altura do piloti atualizada para ${formatPilotiHeight(newHeight)} m.`);
  }, [canvasRef, setInfoMessage, syncContraventamentoElevations]);

  const handlePilotiNavigate = useCallback((
    pilotiId: string,
    height: number,
    isMaster: boolean,
    nivel: number
  ) => {
    if (!pilotiSelection?.group) return;

    const canvas = canvasRef.current?.canvas;
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    applyPilotiSelectionVisuals(canvasObjects, pilotiId);
    canvas.renderAll();

    setPilotiSelection((previous) => previous ? {
      ...previous,
      pilotiId,
      currentHeight: height,
      currentIsMaster: isMaster,
      currentNivel: nivel,
    } : null);

    syncContraventamentoElevations();
    setInfoMessage(`Piloti selecionado – Altura atual: ${formatPilotiHeight(height)} m.`);
  }, [canvasRef, pilotiSelection?.group, setInfoMessage, setPilotiSelection, syncContraventamentoElevations]);

  return {
    handlePilotiSelect,
    handlePilotiEditorClose,
    handlePilotiHeightChange,
    handlePilotiNavigate,
  };
}
