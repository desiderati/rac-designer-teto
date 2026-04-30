import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import type {
  CanvasDocumentHandle,
  CanvasHistoryHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import {useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';
import type {HouseWritePort} from '@/components/rac-editor/ports/HouseWritePort.ts';

interface UseRacEditorJsonActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
  houseWritePort: Pick<HouseWritePort, 'rebuildHouseFromCanvas'>;
}

export function useRacEditorJsonActions({
  canvasRef,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
  houseWritePort,
}: UseRacEditorJsonActionsArgs) {
  const emitHouseStoreChange = useHouseStoreEmitter();

  const handleExportJSON = useCallback(() => {
    const projectJson = canvasRef.current?.createDocumentPort()?.exportProjectJson();
    if (!projectJson) return;

    const blob = new Blob([projectJson], {type: 'application/json'});
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
  }, [canvasRef, setInfoMessage]);

  const handleImportJSON = useCallback((file: File) => {
    const documentPort = canvasRef.current?.createDocumentPort();
    if (!documentPort) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawContent = event.target?.result;
      if (typeof rawContent !== 'string') {
        toast.error(TOAST_MESSAGES.invalidJsonFile);
        return;
      }

      try {
        const loaded = await documentPort.loadProjectJson(rawContent);
        if (!loaded) return;

        resetContraventamentoFlow();
        houseWritePort.rebuildHouseFromCanvas();
        syncContraventamentoElevations();
        emitHouseStoreChange();
        canvasRef.current?.saveHistory();
        setInfoMessage(EDITOR_INFO_MESSAGES.projectLoaded);
        toast.success(TOAST_MESSAGES.projectLoadedSuccessfully);
      } catch {
        toast.error(TOAST_MESSAGES.invalidJsonFile);
      }
    };
    reader.readAsText(file);
  }, [
    canvasRef,
    emitHouseStoreChange,
    houseWritePort,
    resetContraventamentoFlow,
    setInfoMessage,
    syncContraventamentoElevations,
  ]);

  return {
    handleExportJSON,
    handleImportJSON,
  };
}

