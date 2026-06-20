interface CanvasContainerRectLike {
  left: number;
  top: number;
}

interface CanvasPoint {
  x: number;
  y: number;
}

export function transformGroupLocalPointToCanvasPoint(params: {
  groupMatrix: number[];
  localCanvasPoint: CanvasPoint;
}): { x: number; y: number } {
  const [a, b, c, d, e, f] = params.groupMatrix;

  return {
    x: a * params.localCanvasPoint.x + c * params.localCanvasPoint.y + e,
    y: b * params.localCanvasPoint.x + d * params.localCanvasPoint.y + f,
  };
}

export function projectCanvasPointToScreenPoint(params: {
  groupMatrix: number[];
  localCanvasPoint: CanvasPoint;
  canvasContainer: CanvasContainerRectLike;
  viewportTransform?: number[];
}): { x: number; y: number } {

  const canvasPoint = transformGroupLocalPointToCanvasPoint(params);
  const viewport = params.viewportTransform ?? [1, 0, 0, 1, 0, 0];

  return {
    x: params.canvasContainer.left + canvasPoint.x * viewport[0] + canvasPoint.y * viewport[2] + viewport[4],
    y: params.canvasContainer.top + canvasPoint.x * viewport[1] + canvasPoint.y * viewport[3] + viewport[5],
  };
}
