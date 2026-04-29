import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {CanvasGroup} from '@/components/rac-editor/canvas/lib';
import type {HouseStatePort} from '@/components/rac-editor/house/store/HouseStatePort.ts';

export const houseManagerStatePort: HouseStatePort<CanvasGroup> = {
  subscribe: (listener) => houseManager.subscribe(listener),
  getSnapshot: () => houseManager.getHouse(),
};
