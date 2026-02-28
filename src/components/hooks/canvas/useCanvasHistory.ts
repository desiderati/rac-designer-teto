import {RefObject, useRef} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {houseManager} from '@/components/lib/house-manager.ts';
import {refreshHouseGroupsOnCanvas} from '@/components/lib/canvas';

interface UseCanvasHistoryArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  updateMinimapObjects: () => void;
  onHistorySave: () => void;
  onSelectionChange: (hint: string) => void;
}

export function useCanvasHistory({
  fabricCanvasRef,
  updateMinimapObjects,
  onHistorySave,
  onSelectionChange,
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
        houseManager.rebuildFromCanvas();

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
