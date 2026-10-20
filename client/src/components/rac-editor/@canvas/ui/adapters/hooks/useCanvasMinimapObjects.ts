import {useCallback, useEffect, useRef, useState, type RefObject} from 'react';
import type {Canvas as FabricCanvas} from 'fabric';

export interface MinimapObjectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  type: string;
}

export function useCanvasMinimapObjects(fabricCanvasRef: RefObject<FabricCanvas | null>, houseId?: string | null) {

  const [minimapObjects, setMinimapObjects] = useState<MinimapObjectSnapshot[]>([]);
  const frameRef = useRef<number | null>(null);

  const updateMinimapObjects = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas) return;

    const objects = canvas.getObjects().map((obj) => {
      // Durante ActiveSelection, left/top pertencem ao grupo temporário.
      const center = obj.getCenterPoint();
      const scale = obj.getObjectScaling();
      const width = Number(obj.width ?? 0) * scale.x;
      const height = Number(obj.height ?? 0) * scale.y;
      return {
        left: center.x - width / 2,
        top: center.y - height / 2,
        width,
        height,
        angle: obj.getTotalAngle(),
        type: obj.type || 'unknown',
      };
    });

    setMinimapObjects(objects);
  }, []);

  const scheduleMinimapUpdate = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas || frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      updateMinimapObjects(canvas);
    });
  }, [updateMinimapObjects]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const onMoving = () => scheduleMinimapUpdate(canvas);
    canvas.on('object:moving', onMoving);
    return () => {
      canvas.off('object:moving', onMoving);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [fabricCanvasRef, houseId, scheduleMinimapUpdate]);

  return {
    minimapObjects,
    updateMinimapObjects,
    scheduleMinimapUpdate,
  };
}
