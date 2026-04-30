import {houseManager} from '@/components/rac-editor/@canvas/lib/canvas-house-manager.ts';
import {
  createHouse3DProjectionPort,
  createHouseManagerReadPort,
  createHouseManagerRuntimePort,
  createHouseManagerStatePorts,
  createHouseManagerWritePort,
} from '@/bootstrap/editor-house-port-adapters.ts';

export const editorHouseReadPort = createHouseManagerReadPort(houseManager);
export const editorHouseWritePort = createHouseManagerWritePort(houseManager);
export const editorHouseRuntimePort = createHouseManagerRuntimePort(houseManager);

export const {
  houseStatePort: editorHouseStatePort,
  houseRuntimeSnapshotPort: editorHouseRuntimeSnapshotPort,
} = createHouseManagerStatePorts(houseManager);

export const editorHouse3DProjectionPort = createHouse3DProjectionPort(() => houseManager.getHouse());
