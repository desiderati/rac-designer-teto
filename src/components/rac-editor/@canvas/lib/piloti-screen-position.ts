interface CanvasContainerRectLike {
  left: number;
  top: number;
}

interface CanvasPoint {
  x: number;
  y: number;
}

export function projectCanvasPointToScreenPoint(params: {
  groupMatrix: number[];
  localCanvasPoint: CanvasPoint;
  canvasContainer: CanvasContainerRectLike;
  viewportTransform?: number[];
}): { x: number; y: number } {

  const canvasPoint = {
    x: params.groupMatrix[4] + params.localCanvasPoint.x * params.groupMatrix[0],
    y: params.groupMatrix[5] + params.localCanvasPoint.y * params.groupMatrix[3],
  };
  const viewport = params.viewportTransform ?? [1, 0, 0, 1, 0, 0];

  return {
    x: params.canvasContainer.left + canvasPoint.x * viewport[0] + viewport[4],
    y: params.canvasContainer.top + canvasPoint.y * viewport[3] + viewport[5],
  };
}
