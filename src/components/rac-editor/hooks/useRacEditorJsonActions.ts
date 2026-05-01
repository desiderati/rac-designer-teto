import {Dispatch, RefObject, SetStateAction, useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';
import {parseHouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';

interface UseRacEditorJsonActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  setInfoMessage: Dispatch<SetStateAction<string>>;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

export function useRacEditorJsonActions({
  canvasRef,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseRacEditorJsonActionsArgs) {
  const emitHouseStoreChange = useHouseStoreEmitter();
  const {houseDrawingDocumentPort} = useEditorPorts();

  const handleExportJSON = useCallback(() => {
    const canvasDocument = canvasRef.current?.createDocumentPort()?.exportCanvasDocument();
    if (!canvasDocument) return;

    const projectDocument = houseDrawingDocumentPort.exportHouseDrawingDocument(canvasDocument);
    if (!projectDocument) return;

    const projectJson = JSON.stringify(projectDocument, null, 2);
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
  }, [canvasRef, houseDrawingDocumentPort, setInfoMessage]);

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
        const projectDocument = parseHouseDrawingDocument(rawContent);
        const loaded = await documentPort.loadCanvasDocument(projectDocument.canvas);
        if (!loaded) return;

        resetContraventamentoFlow();
        houseDrawingDocumentPort.importHouseDrawingDocument(projectDocument);
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
    houseDrawingDocumentPort,
    resetContraventamentoFlow,
    setInfoMessage,
    syncContraventamentoElevations,
  ]);

  return {
    handleExportJSON,
    handleImportJSON,
  };
}

