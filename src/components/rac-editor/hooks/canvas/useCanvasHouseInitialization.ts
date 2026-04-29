import {RefObject, useEffect} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/ui/canvas/Canvas.tsx';
import {legacyHouseRuntimePort} from '@/infra/house/legacy-house-runtime-adapter.ts';
import {TIMINGS} from '@/shared/config.ts';

interface UseCanvasHouseInitializationArgs {
  canvasRef: RefObject<CanvasHandle | null>;
}

export function useCanvasHouseInitialization({canvasRef}: UseCanvasHouseInitializationArgs) {

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const canvasPort = canvasRef.current?.createHouseManagerCanvasPort();
      if (canvasPort) {
        legacyHouseRuntimePort.initializeCanvas(canvasPort);
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
