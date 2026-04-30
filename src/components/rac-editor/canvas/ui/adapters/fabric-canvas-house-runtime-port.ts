import type {Canvas as FabricCanvas} from 'fabric';
import type {CanvasHouseRuntimePort} from '@/components/rac-editor/canvas/ports/CanvasHouseRuntimePort.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  isCanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/canvas/lib';
import {readPilotiDataFromCanvas} from '@/components/rac-editor/canvas/lib/canvas-rebuild.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';

/**
 * Adapta o canvas Fabric ao contrato mínimo usado pela projeção visual da casa.
 */
export function createCanvasHouseRuntimePort(canvas: FabricCanvas): CanvasHouseRuntimePort {
  return {
    requestRenderAll: () => canvas.requestRenderAll(),

    includesGroup: (group: CanvasGroup) => canvas.getObjects().includes(group),

    getHouseGroups: () =>
      canvas.getObjects().filter((object): object is CanvasGroup => isCanvasGroup(object)),

    readPilotis: (currentPilotis: Record<string, HousePiloti>) =>
      readPilotiDataFromCanvas(canvas, currentPilotis),

    resolveTerrainType: (fallbackTerrainType: number) =>
      resolveTerrainTypeFromFabricCanvas({
        canvas,
        fallbackTerrainType,
      }),
  };
}

function resolveTerrainTypeFromFabricCanvas(params: {
  canvas: FabricCanvas | null;
  fallbackTerrainType: number;
}): number {
  const fromCanvas = params.canvas?.getObjects()
    .find((object): object is CanvasGroup => {
      const runtime = toCanvasGroup(object);
      return (
        runtime?.myType === 'house'
        && runtime.houseView !== 'top'
        && Number.isFinite(Number(runtime.groundTerrainType))
      );
    });

  const terrainFromCanvas = Number(fromCanvas?.groundTerrainType);
  if (Number.isFinite(terrainFromCanvas)) {
    return normalizeTerrainSolidityLevel(terrainFromCanvas);
  }

  return params.fallbackTerrainType;
}
