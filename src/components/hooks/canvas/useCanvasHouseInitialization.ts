import {RefObject, useEffect} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/canvas/Canvas.tsx';
import {houseManager} from '@/components/lib/house-manager.ts';
import {TIMINGS} from '@/shared/config.ts';

interface UseCanvasHouseInitializationArgs {
  canvasRef: RefObject<CanvasHandle | null>;
}

export function useCanvasHouseInitialization({canvasRef}: UseCanvasHouseInitializationArgs) {

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const canvas = canvasRef.current?.canvas;
      if (canvas) {
        houseManager.initialize(canvas);
        window.clearInterval(id);
      }
      tries += 1;
      if (tries > TIMINGS.houseInitializationMaxRetries) {
        window.clearInterval(id);
      }
    }, TIMINGS.houseInitializationPollMs);

    return () => window.clearInterval(id);
  }, [canvasRef]);
}
