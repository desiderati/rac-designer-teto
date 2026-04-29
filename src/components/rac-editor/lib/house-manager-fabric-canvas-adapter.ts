import type {Canvas as FabricCanvas} from 'fabric';
import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  isCanvasGroup,
} from '@/components/rac-editor/lib/canvas';
import {readPilotiDataFromCanvas} from '@/components/rac-editor/lib/canvas/canvas-rebuild.ts';
import {resolveTerrainTypeFromCanvasFallback} from '@/components/rac-editor/lib/house-manager-terrain.ts';
import {insert3DSnapshotOnCanvas} from '@/components/rac-editor/lib/house-manager-snapshot.ts';

export function createHouseManagerCanvasPort(canvas: FabricCanvas): HouseManagerCanvasPort {
  return {
    requestRenderAll: () => canvas.requestRenderAll(),

    includesGroup: (group: CanvasGroup) => canvas.getObjects().includes(group),

    getHouseGroups: () =>
      canvas.getObjects().filter((object): object is CanvasGroup => isCanvasGroup(object)),

    readPilotis: (currentPilotis: Record<string, HousePiloti>) =>
      readPilotiDataFromCanvas(canvas, currentPilotis),

    resolveTerrainType: (fallbackTerrainType: number) =>
      resolveTerrainTypeFromCanvasFallback({
        canvas,
        fallbackTerrainType,
      }),

    insert3DSnapshot: (dataUrl: string) =>
      insert3DSnapshotOnCanvas({
        canvas,
        dataUrl,
      }),
  };
}
