import {FabricImage, type Canvas as FabricCanvas} from 'fabric';
import type {HouseManagerCanvasPort} from '@/components/rac-editor/store/HouseManagerCanvasPort.ts';
import type {HousePiloti} from '@/shared/types/house.ts';
import {
  CanvasGroup,
  isCanvasGroup,
  toCanvasGroup,
} from '@/components/rac-editor/lib/canvas';
import {readPilotiDataFromCanvas} from '@/components/rac-editor/lib/canvas/canvas-rebuild.ts';
import {normalizeTerrainSolidityLevel} from '@/shared/config.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {create3DSnapshotImagePatch} from '@/components/rac-editor/lib/house-snapshot.ts';

/**
 * Adapta o canvas Fabric ao contrato minimo usado pelo estado da casa.
 */
export function createHouseManagerCanvasPort(canvas: FabricCanvas): HouseManagerCanvasPort {
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

    insert3DSnapshot: (dataUrl: string) =>
      insert3DSnapshotOnFabricCanvas({
        canvas,
        dataUrl,
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

async function insert3DSnapshotOnFabricCanvas(params: {
  canvas: FabricCanvas | null;
  dataUrl: string;
}): Promise<boolean> {
  if (!params.canvas) return false;
  if (!params.dataUrl) return false;

  try {
    const image =
      await FabricImage.fromURL(params.dataUrl, {crossOrigin: 'anonymous'});
    const center = params.canvas.getVpCenter();

    image.set(
      create3DSnapshotImagePatch({
        centerX: center.x,
        centerY: center.y,
        imageWidth: image.width ?? 1,
        imageHeight: image.height ?? 1,
        canvasWidth: params.canvas.getWidth() || CANVAS_WIDTH,
        canvasHeight: params.canvas.getHeight() || CANVAS_HEIGHT,
      }),
    );
    image.setControlsVisibility?.({mtr: false});
    params.canvas.add(image);
    params.canvas.setActiveObject(image);
    params.canvas.requestRenderAll();
    return true;

  } catch (error) {
    console.error('[HouseManager] Failed to insert 3D snapshot on canvas:', error);
    return false;
  }
}
