import {RefObject, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {refreshHouseGroupsOnCanvas} from '@/components/rac-editor/@canvas/lib';
import type {HouseCanvasReconciliationPort} from '@/components/rac-editor/ports/HouseWritePort.ts';

interface UseCanvasHistoryArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  updateMinimapObjects: () => void;
  onHistorySave: () => void;
  onSelectionChange: (hint: string) => void;
  houseCanvasReconciliationPort: HouseCanvasReconciliationPort;
}

export function useCanvasHistory({
  fabricCanvasRef,
  updateMinimapObjects,
  onHistorySave,
  onSelectionChange,
  houseCanvasReconciliationPort,
}: UseCanvasHistoryArgs) {

  const historyRef = useRef<string[]>([]);
  const historyProcessingRef = useRef(false);

  const saveHistory = () => {
    if (historyProcessingRef.current) return;

    if (historyRef.current.length > 50) historyRef.current.shift();
    historyRef.current.push(JSON.stringify(fabricCanvasRef.current));
    updateMinimapObjects();
    onHistorySave();
  };

  const clearHistory = () => {
    historyRef.current = [];
    updateMinimapObjects();
  };

  const undo = () => {
    if (historyRef.current.length > 1 && fabricCanvasRef.current) {
      historyProcessingRef.current = true;
      historyRef.current.pop();

      const prevState = historyRef.current[historyRef.current.length - 1];
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.loadFromJSON(prevState).then(() => {
        refreshHouseGroupsOnCanvas(fabricCanvasRef.current!);
        houseCanvasReconciliationPort.rebuildHouseFromCanvas();

        fabricCanvasRef.current?.renderAll();
        updateMinimapObjects();
        historyProcessingRef.current = false;
        onSelectionChange('Desfazer realizado.');
      });
    }
  };

  return {
    historyRef,
    historyProcessingRef,
    saveHistory,
    clearHistory,
    undo,
  };
}
