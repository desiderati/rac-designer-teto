import {RefObject, useEffect} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/store/CanvasInteractionPort.ts';
import {TIMINGS} from '@/shared/config.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseCanvasHouseInitializationArgs {
  canvasRef: RefObject<CanvasHandle | null>;
}

export function useCanvasHouseInitialization({canvasRef}: UseCanvasHouseInitializationArgs) {
  const {houseRuntimePort} = useEditorPorts();

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      const canvasPort = canvasRef.current?.createHouseManagerCanvasPort();
      if (canvasPort) {
        houseRuntimePort.initializeCanvas(canvasPort);
        window.clearInterval(id);
      }
      tries += 1;
      if (tries > TIMINGS.houseInitializationMaxRetries) {
        window.clearInterval(id);
      }
    }, TIMINGS.houseInitializationPollMs);

    return () => window.clearInterval(id);
  }, [canvasRef, houseRuntimePort]);
}
