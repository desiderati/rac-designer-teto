import {useCanvasHouseInitialization} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseInitialization.ts';
import {useCanvasController} from '@/components/rac-editor/@canvas/hooks/useCanvasController.ts';
import type {CanvasControllerHandle} from '@/components/rac-editor/@canvas/ports/CanvasControllerHandle.ts';
import type {CanvasHouseRuntimeHandle} from '@/components/rac-editor/@canvas/ports/CanvasHouseRuntimeHandle.ts';
import type {RefObject} from 'react';

type CanvasControllerArgs = Parameters<typeof useCanvasController>[0];
type CanvasFlowHandle = CanvasControllerHandle & CanvasHouseRuntimeHandle;
type CanvasFlowControllerArgs =
  Omit<CanvasControllerArgs, 'canvasRef'>
  & { canvasRef: RefObject<CanvasFlowHandle | null> };

/**
 * Coordena a inicialização e os comandos principais do canvas no editor RAC.
 */
export function useRacEditorCanvasFlowController(args: CanvasFlowControllerArgs) {
  useCanvasHouseInitialization({canvasRef: args.canvasRef});

  return useCanvasController(args);
}
