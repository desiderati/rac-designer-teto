import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import {createHouse3DProjectionPort} from '@/components/rac-editor/adapters/house-3d-projection-adapter.ts';
import {createHouseManagerReadPort} from '@/components/rac-editor/adapters/house-manager-read-adapter.ts';
import {createHouseManagerRuntimePort} from '@/components/rac-editor/adapters/house-manager-runtime-adapter.ts';
import {createHouseManagerStatePorts} from '@/components/rac-editor/adapters/house-manager-state-adapter.ts';
import {createHouseManagerWritePort} from '@/components/rac-editor/adapters/house-manager-write-adapter.ts';

export const editorHouseReadPort = createHouseManagerReadPort(houseManager);
export const editorHouseWritePort = createHouseManagerWritePort(houseManager);
export const editorHouseRuntimePort = createHouseManagerRuntimePort(houseManager);

export const {
  houseStatePort: editorHouseStatePort,
  houseRuntimeSnapshotPort: editorHouseRuntimeSnapshotPort,
} = createHouseManagerStatePorts(houseManager);

export const editorHouse3DProjectionPort = createHouse3DProjectionPort(() => houseManager.getHouse());
