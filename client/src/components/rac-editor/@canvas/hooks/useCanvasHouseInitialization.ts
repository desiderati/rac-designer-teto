import {RefObject, useLayoutEffect} from 'react';
import type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
import {TIMINGS} from '@/shared/config.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface UseCanvasHouseInitializationArgs {
  canvasRef: RefObject<CanvasHouseRuntimeHandle | null>;
}

export function useCanvasHouseInitialization({canvasRef}: UseCanvasHouseInitializationArgs) {
  const {houseRuntimePort} = useEditorPorts();

  useLayoutEffect(() => {
    let tries = 0;
    const initialize = () => {
      const canvasPort = canvasRef.current?.createCanvasHouseRuntimePort();
      if (canvasPort) {
        houseRuntimePort.initializeCanvas(canvasPort);
        return true;
      }

      return false;
    };

    if (initialize()) return undefined;

    const id = window.setInterval(() => {
      if (initialize()) {
        window.clearInterval(id);
        return;
      }
      tries += 1;
      if (tries > TIMINGS.houseInitializationMaxRetries) {
        window.clearInterval(id);
      }
    }, TIMINGS.houseInitializationPollMs);

    return () => window.clearInterval(id);
  }, [canvasRef, houseRuntimePort]);
}
