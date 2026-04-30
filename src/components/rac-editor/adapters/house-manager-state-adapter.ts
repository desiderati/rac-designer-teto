import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseStatePort} from '@/components/rac-editor/ports/HouseStatePort.ts';
import type {HouseRuntimeSnapshotPort} from '@/components/rac-editor/ports/HouseRuntimeSnapshotPort.ts';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';
import type {HouseState} from '@/shared/types/house.ts';

interface HouseManagerStateSource {
  subscribe(listener: () => void): () => void;
  getHouseState(): HouseState | null;
  getHouse(): HouseRuntimeSnapshot<CanvasGroup> | null;
}

export function createHouseManagerStatePorts(houseManager: HouseManagerStateSource): {
  houseStatePort: HouseStatePort;
  houseRuntimeSnapshotPort: HouseRuntimeSnapshotPort<CanvasGroup>;
} {
  return {
    houseStatePort: {
      subscribe: (listener) => houseManager.subscribe(listener),
      getStateSnapshot: () => houseManager.getHouseState(),
    },
    houseRuntimeSnapshotPort: {
      subscribe: (listener) => houseManager.subscribe(listener),
      getRuntimeSnapshot: () => houseManager.getHouse(),
    },
  };
}
