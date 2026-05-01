import {RefObject, useCallback} from 'react';
import {toast} from 'sonner';
import type {CanvasDocumentHandle} from '@/components/rac-editor/@canvas/ports/CanvasDocumentHandle.ts';
import type {CanvasHistoryHandle} from '@/components/rac-editor/@canvas/ports/CanvasHistoryHandle.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useHouseStoreEmitter} from '@/components/rac-editor/lib/house-store.ts';
import {EDITOR_INFO_MESSAGES, TOAST_MESSAGES} from '@/shared/config.ts';
import {parseHouseDrawingDocument} from '@/shared/types/house-drawing-document.ts';

interface UseHouseDrawingDocumentActionsArgs {
  canvasRef: RefObject<(CanvasDocumentHandle & CanvasHistoryHandle) | null>;
  setInfoMessage: (message: string) => void;
  resetContraventamentoFlow: () => void;
  syncContraventamentoElevations: () => void;
}

/**
 * Orquestra importação/exportação do documento RAC canônico da casa ativa.
 *
 * O hook não conhece JSON Fabric: ele combina o documento visual do canvas com
 * `HouseDrawingDocumentPort` e rejeita formatos antigos no parser documental.
 */
export function useHouseDrawingDocumentActions({
  canvasRef,
  setInfoMessage,
  resetContraventamentoFlow,
  syncContraventamentoElevations,
}: UseHouseDrawingDocumentActionsArgs) {
  const emitHouseStoreChange = useHouseStoreEmitter();
  const {houseDrawingDocumentPort} = useEditorPorts();

  const handleExportHouseDrawingDocument = useCallback(() => {
    const canvasDocument = canvasRef.current?.createDocumentPort()?.exportCanvasDocument();
    if (!canvasDocument) return;

    const projectDocument = houseDrawingDocumentPort.exportHouseDrawingDocument(canvasDocument);
    if (!projectDocument) return;

    const documentJson = JSON.stringify(projectDocument, null, 2);
    if (!documentJson) return;

    const blob = new Blob([documentJson], {type: 'application/json'});
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

  const handleImportHouseDrawingDocument = useCallback((file: File) => {
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
    handleExportHouseDrawingDocument,
    handleImportHouseDrawingDocument,
  };
}
