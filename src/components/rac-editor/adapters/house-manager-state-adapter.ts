import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';

export const houseManagerStatePort: HouseStatePort = {
  subscribe: (listener) => houseManager.subscribe(listener),
  getStateSnapshot: () => houseManager.getHouseState(),
};

export const houseManagerRuntimeSnapshotPort: HouseRuntimeSnapshotPort = {
  subscribe: (listener) => houseManager.subscribe(listener),
  getRuntimeSnapshot: () => houseManager.getHouse(),
};
