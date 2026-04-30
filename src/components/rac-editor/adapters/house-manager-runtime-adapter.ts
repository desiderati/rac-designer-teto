import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/ports/HouseRuntimePort.ts';

export const houseManagerRuntimePort: HouseRuntimePort = {
  initializeCanvas: (canvasPort) => houseManager.initialize(canvasPort),
};
