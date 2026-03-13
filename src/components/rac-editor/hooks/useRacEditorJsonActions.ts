import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {toast} from 'sonner';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/lib/canvas';
import {emitHouseStoreChange} from '@/components/rac-editor/lib/house-store.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';

interface UseRacEditorJsonActionsArgs {
  canvasRef: RefObject<CanvasHandle | null>;
  getCanvas: () => FabricCanvas | null;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

export function useRacEditorJsonActions({
  canvasRef,
  getCanvas,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseRacEditorJsonActionsArgs) {

  const handleExportJSON = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const json = canvas.toJSON();
    const blob = new Blob([JSON.stringify(json)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = 'RAC-TETO-Projeto.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setInfoMessage(EDITOR_INFO_MESSAGES.projectSavedAsJson);
    toast.success(TOAST_MESSAGES.projectExportedSuccessfully);
  }, [getCanvas, setInfoMessage]);

  const handleImportJSON = useCallback((file: File) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawContent = event.target?.result;
      if (typeof rawContent !== 'string') {
        toast.error(TOAST_MESSAGES.invalidJsonFile);
        return;
      }

      canvas.clear();
      canvas.loadFromJSON(rawContent).then(() => {
        resetContraventamentoFlow();
        refreshHouseGroupsOnCanvas(canvas);
        houseManager.rebuildFromCanvas();

        canvas.renderAll();
        syncContraventamentoElevations();
        canvasRef.current?.saveHistory();
        setInfoMessage(EDITOR_INFO_MESSAGES.projectLoaded);
        toast.success(TOAST_MESSAGES.projectLoadedSuccessfully);
      });
    };
    reader.readAsText(file);
  }, [canvasRef, getCanvas, resetContraventamentoFlow, setInfoMessage, syncContraventamentoElevations]);

  return {
    handleExportJSON,
    handleImportJSON,
  };
}

