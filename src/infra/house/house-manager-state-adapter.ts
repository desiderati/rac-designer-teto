import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';

export const houseManagerStatePort: HouseStatePort = {
  subscribe: (listener) => houseManager.subscribe(listener),
  getSnapshot: () => houseManager.getHouse(),
};
