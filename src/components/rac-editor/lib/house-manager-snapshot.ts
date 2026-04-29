import {Canvas as FabricCanvas, FabricImage} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {create3DSnapshotImagePatch} from '@/components/rac-editor/lib/house-snapshot.ts';

/**
 * Insere a captura do viewer 3D no canvas ativo.
 */
export async function insert3DSnapshotOnCanvas(params: {
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
