import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';

export const houseManagerRuntimePort: HouseRuntimePort<CanvasGroup> = {
  initializeCanvas: (canvasPort) => houseManager.initialize(canvasPort),
};
