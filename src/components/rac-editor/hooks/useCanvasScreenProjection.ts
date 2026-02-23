import {MutableRefObject, RefObject, useCallback} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/lib/canvas-utils';
import {getCanvasViewportOffset} from '@/components/rac-editor/utils/canvas-screen-position';

interface UseCanvasScreenProjectionArgs {
  containerRef: RefObject<HTMLDivElement | null>;
  zoomRef: MutableRefObject<number>;
  viewportXRef: MutableRefObject<number>;
  viewportYRef: MutableRefObject<number>;
  containerSizeRef: MutableRefObject<{ width: number; height: number }>;
}

export function useCanvasScreenProjection({
  containerRef,
  zoomRef,
  viewportXRef,
  viewportYRef,
  containerSizeRef,
}: UseCanvasScreenProjectionArgs) {
  const getCanvasOffsetFromState = useCallback((params: {
    zoom: number;
    viewportX: number;
    viewportY: number;
    containerWidth: number;
    containerHeight: number;
  }) => {
    return getCanvasViewportOffset({
      canvasPosition: {
        x: params.viewportX,
        y: params.viewportY,
        zoom: params.zoom,
      },
      containerWidth: params.containerWidth,
      containerHeight: params.containerHeight,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    });
  }, []);

  const getCurrentScreenPoint = useCallback((canvasPoint: { x: number; y: number }) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    const currentZoom = zoomRef.current;
    const currentContainerSize = containerSizeRef.current;
    const {canvasX, canvasY} = getCanvasOffsetFromState({
      zoom: currentZoom,
      viewportX: viewportXRef.current,
      viewportY: viewportYRef.current,
      containerWidth: currentContainerSize.width,
      containerHeight: currentContainerSize.height,
    });

    return {
      x: containerRect.left + canvasPoint.x * currentZoom + canvasX,
      y: containerRect.top + canvasPoint.y * currentZoom + canvasY,
    };
  }, [containerRef, containerSizeRef, getCanvasOffsetFromState, viewportXRef, viewportYRef, zoomRef]);

  const getVisibleCenter = useCallback(() => {
    const currentZoom = zoomRef.current;
    const {width: containerWidth, height: containerHeight} = containerSizeRef.current;

    if (!containerWidth || !containerHeight) {
      return {x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2};
    }

    const {canvasX, canvasY} = getCanvasOffsetFromState({
      zoom: currentZoom,
      viewportX: viewportXRef.current,
      viewportY: viewportYRef.current,
      containerWidth,
      containerHeight,
    });

    const screenCenterX = containerWidth / 2;
    const screenCenterY = containerHeight / 2;

    const centerX = (screenCenterX - canvasX) / currentZoom;
    const centerY = (screenCenterY - canvasY) / currentZoom;

    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH, centerX)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT, centerY)),
    };
  }, [containerSizeRef, getCanvasOffsetFromState, viewportXRef, viewportYRef, zoomRef]);

  return {
    getCanvasOffsetFromState,
    getCurrentScreenPoint,
    getVisibleCenter,
  };
}
