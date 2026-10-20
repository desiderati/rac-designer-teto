import {useCallback, useEffect, useState, type RefObject} from 'react';
import type {Canvas} from 'fabric';

/** Une o arrasto nativo (inclusive ActiveSelection) ao arrasto manual por toque. */
export function useCanvasObjectMovement({fabricCanvasRef, enabled, houseId}: {
  fabricCanvasRef: RefObject<Canvas | null>;
  enabled: boolean;
  houseId?: string | null;
}) {
  const [isObjectMoving, setIsObjectMoving] = useState(false);
  const onObjectMovingChange = useCallback((moving: boolean) => setIsObjectMoving(enabled && moving), [enabled]);

  useEffect(() => {
    setIsObjectMoving(false);
    const canvas = fabricCanvasRef.current;
    if (!enabled || !canvas) return;
    const start = () => setIsObjectMoving(true);
    const stop = () => setIsObjectMoving(false);
    canvas.on('object:moving', start);
    canvas.on('object:modified', stop);
    canvas.on('mouse:up', stop);
    canvas.on('selection:cleared', stop);
    // O toque pode terminar fora do Canvas ou ser cancelado pelo navegador.
    const endings = ['touchend', 'touchcancel', 'pointerup', 'pointercancel'] as const;
    endings.forEach(event => document.addEventListener(event, stop, true));
    window.addEventListener('blur', stop);
    return () => {
      canvas.off('object:moving', start);
      canvas.off('object:modified', stop);
      canvas.off('mouse:up', stop);
      canvas.off('selection:cleared', stop);
      endings.forEach(event => document.removeEventListener(event, stop, true));
      window.removeEventListener('blur', stop);
      stop();
    };
  }, [enabled, fabricCanvasRef, houseId]);

  return {isObjectMoving, onObjectMovingChange};
}
