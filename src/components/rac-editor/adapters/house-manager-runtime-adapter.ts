import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';
import type {HouseVisualRuntimePort} from '@/components/rac-editor/lib/house-manager-runtime-port.ts';

interface HouseManagerRuntimeSource {
  initialize(canvasPort: HouseVisualRuntimePort<CanvasGroup>): void;
}

export function createHouseManagerRuntimePort(houseManager: HouseManagerRuntimeSource): HouseRuntimePort<CanvasGroup> {
  return {
    initializeCanvas: (canvasPort) => houseManager.initialize(canvasPort),
  };
}
