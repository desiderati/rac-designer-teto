export interface CanvasViewportPosition {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasContainerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export function getCanvasViewportOffset(params: {
  canvasPosition: CanvasViewportPosition;
  containerWidth: number;
  containerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}): { canvasX: number; canvasY: number } {

  const {x: viewportX, y: viewportY, zoom} = params.canvasPosition;
  const scaledWidth = params.canvasWidth * zoom;
  const scaledHeight = params.canvasHeight * zoom;
  const canvasX = scaledWidth <= params.containerWidth
    ? (params.containerWidth - scaledWidth) / 2
    : -viewportX;
  const canvasY = scaledHeight <= params.containerHeight
    ? (params.containerHeight - scaledHeight) / 2
    : -viewportY;

  return {canvasX, canvasY};
}

export function toCanvasScreenPoint(params: {
  canvasPosition: CanvasViewportPosition;
  containerRect: CanvasContainerRect;
  canvasWidth: number;
  canvasHeight: number;
  point: CanvasPoint;
}): CanvasPoint {

  const {zoom} = params.canvasPosition;
  const {canvasX, canvasY} = getCanvasViewportOffset({
    canvasPosition: params.canvasPosition,
    containerWidth: params.containerRect.width,
    containerHeight: params.containerRect.height,
    canvasWidth: params.canvasWidth,
    canvasHeight: params.canvasHeight,
  });

  return {
    x: params.containerRect.left + params.point.x * zoom + canvasX,
    y: params.containerRect.top + params.point.y * zoom + canvasY,
  };
}
