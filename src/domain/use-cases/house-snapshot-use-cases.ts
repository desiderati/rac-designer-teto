export const SNAPSHOT_MAX_CANVAS_RATIO = 0.45;

export interface SnapshotScaleParams {
  imageWidth: number;
  imageHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface SnapshotPlacementParams extends SnapshotScaleParams {
  centerX: number;
  centerY: number;
}

export interface SnapshotImagePatch {
  left: number;
  top: number;
  originX: 'center';
  originY: 'center';
  scaleX: number;
  scaleY: number;
  selectable: true;
  evented: true;
  hasControls: true;
  hasBorders: true;
  lockMovementX: false;
  lockMovementY: false;
  lockScalingX: false;
  lockScalingY: false;
  lockRotation: true;
}

export function calculateSnapshotScale(params: SnapshotScaleParams): number {
  const safeImageWidth = Math.max(params.imageWidth || 0, 1);
  const safeImageHeight = Math.max(params.imageHeight || 0, 1);
  const safeCanvasWidth = params.canvasWidth || 1300;
  const safeCanvasHeight = params.canvasHeight || 1300;
  const maxWidth = safeCanvasWidth * SNAPSHOT_MAX_CANVAS_RATIO;
  const maxHeight = safeCanvasHeight * SNAPSHOT_MAX_CANVAS_RATIO;

  return Math.min(maxWidth / safeImageWidth, maxHeight / safeImageHeight, 1);
}

export function create3DSnapshotImagePatch(params: SnapshotPlacementParams): SnapshotImagePatch {
  const scale = calculateSnapshotScale(params);
  return {
    left: params.centerX,
    top: params.centerY,
    originX: 'center',
    originY: 'center',
    scaleX: scale,
    scaleY: scale,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true,
    lockMovementX: false,
    lockMovementY: false,
    lockScalingX: false,
    lockScalingY: false,
    lockRotation: true,
  };
}
