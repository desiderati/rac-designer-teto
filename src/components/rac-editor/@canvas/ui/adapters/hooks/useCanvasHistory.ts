import {useRef} from 'react';
import type {CanvasDocumentPort} from '@/components/rac-editor/@canvas/ports/CanvasDocumentPort.ts';
import type {HouseDrawingDocumentPort} from '@/components/rac-editor/ports/HouseDrawingDocumentPort.ts';
import type {
  HouseDrawingCanvasDocument,
  HouseDrawingDocument,
} from '@/shared/types/house-drawing-document.ts';

interface CanvasHistoryEntry {
  canvasDocument: HouseDrawingCanvasDocument;
  houseDocument: HouseDrawingDocument | null;
}

export interface SaveCanvasHistoryOptions {
  notifyDocumentChange?: boolean;
}

interface UseCanvasHistoryArgs {
  createCanvasDocumentPort: () => CanvasDocumentPort | null;
  houseDrawingDocumentPort: HouseDrawingDocumentPort;
  updateMinimapObjects: () => void;
  onHistorySave: () => void;
  onSelectionChange: (hint: string) => void;
  onCanvasDocumentLoaded: () => void;
}

export function useCanvasHistory({
  createCanvasDocumentPort,
  houseDrawingDocumentPort,
  updateMinimapObjects,
  onHistorySave,
  onSelectionChange,
  onCanvasDocumentLoaded,
}: UseCanvasHistoryArgs) {

  const historyRef = useRef<CanvasHistoryEntry[]>([]);
  const historyProcessingRef = useRef(false);

  const saveHistory = (options: SaveCanvasHistoryOptions = {}) => {
    if (historyProcessingRef.current) return;

    const canvasDocument =
      createCanvasDocumentPort()?.exportCanvasDocument();
    if (!canvasDocument) return;

    const houseDocument =
      houseDrawingDocumentPort.exportHouseDrawingDocument(canvasDocument);

    if (historyRef.current.length > 50) historyRef.current.shift();
    historyRef.current.push({
      canvasDocument,
      houseDocument,
    });
    updateMinimapObjects();
    if (options.notifyDocumentChange !== false) {
      onHistorySave();
    }
  };

  const clearHistory = () => {
    historyRef.current = [];
    updateMinimapObjects();
  };

  const undo = () => {
    const canvasDocumentPort = createCanvasDocumentPort();
    if (historyRef.current.length <= 1 || !canvasDocumentPort) return;

    historyProcessingRef.current = true;
    historyRef.current.pop();

    const previousEntry = historyRef.current[historyRef.current.length - 1];
    canvasDocumentPort.loadCanvasDocument(previousEntry.canvasDocument).then((loaded) => {
      if (!loaded) {
        historyProcessingRef.current = false;
        return;
      }

      onCanvasDocumentLoaded();

      if (previousEntry.houseDocument) {
        houseDrawingDocumentPort.importHouseDrawingDocument(previousEntry.houseDocument);
      }

      updateMinimapObjects();
      onHistorySave();
      historyProcessingRef.current = false;
      onSelectionChange('Desfazer realizado.');
    }).catch(() => {
      historyProcessingRef.current = false;
    });
  };

  return {
    historyRef,
    historyProcessingRef,
    saveHistory,
    clearHistory,
    undo,
  };
}
