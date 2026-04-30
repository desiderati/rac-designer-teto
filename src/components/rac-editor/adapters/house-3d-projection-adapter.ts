import {createHouse3DProjectionFromCanvasHouse} from '@/components/rac-editor/@canvas/lib/house-3d-projection.ts';
import type {House3DProjectionPort} from '@/components/rac-editor/ports/House3DProjectionPort.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {HouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-runtime-snapshot.ts';

export function createHouse3DProjectionPort(
  getHouse: () => HouseRuntimeSnapshot<CanvasGroup> | null,
): House3DProjectionPort {
  return {
    getProjection: () => createHouse3DProjectionFromCanvasHouse(getHouse()),
  };
}
