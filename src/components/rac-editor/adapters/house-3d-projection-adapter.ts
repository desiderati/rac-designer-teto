import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';

export const house3DProjectionPort: House3DProjectionPort = {
  getProjection: () => createHouse3DProjectionFromCanvasHouse(houseManager.getHouse()),
};
