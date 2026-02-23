import {RefObject, useEffect} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/Canvas';
import {houseManager} from '@/lib/house-manager';

interface UseRacHouseInitializationArgs {
  canvasRef: RefObject<CanvasHandle | null>;
}

export function useRacHouseInitialization({canvasRef}: UseRacHouseInitializationArgs) {
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const canvas = canvasRef.current?.canvas;
      if (canvas) {
        houseManager.initialize(canvas);
        window.clearInterval(id);
      }
      tries += 1;
      if (tries > 50) {
        window.clearInterval(id);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [canvasRef]);
}
