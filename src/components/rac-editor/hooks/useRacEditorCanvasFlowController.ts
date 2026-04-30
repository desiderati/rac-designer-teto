import {useCanvasHouseInitialization} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseInitialization.ts';
import {useCanvasController} from '@/components/rac-editor/@canvas/hooks/useCanvasController.ts';

type CanvasControllerArgs = Parameters<typeof useCanvasController>[0];

/**
 * Coordena a inicialização e os comandos principais do canvas no editor RAC.
 */
export function useRacEditorCanvasFlowController(args: CanvasControllerArgs) {
  useCanvasHouseInitialization({canvasRef: args.canvasRef});

  return useCanvasController(args);
}
