import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HouseRuntimePort} from '@/components/rac-editor/store/HouseRuntimePort.ts';

export const legacyHouseRuntimePort: HouseRuntimePort = {
  initializeCanvas: (canvasPort) => houseManager.initialize(canvasPort),
};
