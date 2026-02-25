import {useCallback, useState} from 'react';
import {Canvas as FabricCanvas, FabricObject} from 'fabric';

export interface MinimapObjectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  type: string;
}

export function useCanvasMinimapObjects() {
  const [minimapObjects, setMinimapObjects] = useState<MinimapObjectSnapshot[]>([]);

  const updateMinimapObjects = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas) return;

    const objects = canvas.getObjects().map((obj: FabricObject) => ({
      left: Number(obj.left ?? 0) - (Number(obj.width ?? 0) * Number(obj.scaleX ?? 1)) / 2,
      top: Number(obj.top ?? 0) - (Number(obj.height ?? 0) * Number(obj.scaleY ?? 1)) / 2,
      width: Number(obj.width ?? 0) * Number(obj.scaleX ?? 1),
      height: Number(obj.height ?? 0) * Number(obj.scaleY ?? 1),
      angle: Number(obj.angle ?? 0),
      type: obj.type || 'unknown',
    }));

    setMinimapObjects(objects);
  }, []);

  return {
    minimapObjects,
    updateMinimapObjects,
  };
}
