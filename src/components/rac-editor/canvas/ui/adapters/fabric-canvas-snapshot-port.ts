import {FabricImage, type Canvas as FabricCanvas} from 'fabric';
import type {CanvasSnapshotPort} from '@/components/rac-editor/canvas/ports/CanvasSnapshotPort.ts';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {create3DSnapshotImagePatch} from '@/components/rac-editor/lib/house-snapshot.ts';

/**
 * Adapta o canvas Fabric ao contrato de inserção de snapshots.
 */
export function createFabricCanvasSnapshotPort(canvas: FabricCanvas): CanvasSnapshotPort {
  return {
    insertImageSnapshot: (dataUrl) =>
      insertImageSnapshotOnFabricCanvas({
        canvas,
        dataUrl,
      }),
  };
}

async function insertImageSnapshotOnFabricCanvas(params: {
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
    console.error('[CanvasSnapshotPort] Falha ao inserir snapshot no canvas:', error);
    return false;
  }
}
