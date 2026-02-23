interface CanvasContainerRectLike {
  left: number;
  top: number;
}

interface GroupLocalPoint {
  x: number;
  y: number;
}

export function projectGroupLocalPointToScreen(params: {
  groupMatrix: number[];
  localPoint: GroupLocalPoint;
  containerRect: CanvasContainerRectLike;
  viewportTransform?: number[];
}): { x: number; y: number } {

  const canvasPoint = {
    x: params.groupMatrix[4] + params.localPoint.x * params.groupMatrix[0],
    y: params.groupMatrix[5] + params.localPoint.y * params.groupMatrix[3],
  };
  const viewport = params.viewportTransform ?? [1, 0, 0, 1, 0, 0];

  return {
    x: params.containerRect.left + canvasPoint.x * viewport[0] + viewport[4],
    y: params.containerRect.top + canvasPoint.y * viewport[3] + viewport[5],
  };
}
