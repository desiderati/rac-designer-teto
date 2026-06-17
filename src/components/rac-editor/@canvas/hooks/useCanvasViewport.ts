import {SetStateAction, useCallback, useEffect, useReducer, useRef} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {ZOOM_LIMITS} from '@/shared/config.ts';
import {
  readCanvasViewportStorage,
  writeCanvasViewportStorage,
} from '@/components/rac-editor/@canvas/lib/canvas-viewport-storage.ts';

/** Margin kept around the canvas when fitting to the visible container. */
const FIT_TO_VIEW_MARGIN = 0.95;

interface CanvasViewportState {
  zoom: number;
  viewportX: number;
  viewportY: number;
  containerSize: { width: number; height: number };
  isPanning: boolean;
  isPinching: boolean;
  isSingleFingerPanning: boolean;
}

const initialCanvasViewPortState: CanvasViewportState = {
  zoom: 1,
  viewportX: 0,
  viewportY: 0,
  containerSize: {width: 0, height: 0},
  isPanning: false,
  isPinching: false,
  isSingleFingerPanning: false,
};

function createInitialCanvasViewPortState(): CanvasViewportState {
  const storedViewport = readCanvasViewportStorage();
  return {
    ...initialCanvasViewPortState,
    zoom: storedViewport.zoom,
    viewportX: storedViewport.viewportX,
    viewportY: storedViewport.viewportY,
  };
}

type CanvasViewportAction =
  | { type: 'setZoom'; value: number }
  | { type: 'setViewport'; value: { x: number; y: number } }
  | { type: 'setViewportX'; value: number }
  | { type: 'setViewportY'; value: number }
  | { type: 'setContainerSize'; value: { width: number; height: number } }
  | { type: 'setIsPanning'; value: boolean }
  | { type: 'setIsPinching'; value: boolean }
  | { type: 'setIsSingleFingerPanning'; value: boolean };

function reducer(state: CanvasViewportState, action: CanvasViewportAction): CanvasViewportState {
  switch (action.type) {
    case 'setZoom':
      return {...state, zoom: action.value};

    case 'setViewport':
      return {...state, viewportX: action.value.x, viewportY: action.value.y};

    case 'setViewportX':
      return {...state, viewportX: action.value};

    case 'setViewportY':
      return {...state, viewportY: action.value};

    case 'setContainerSize':
      return {...state, containerSize: action.value};

    case 'setIsPanning':
      return {...state, isPanning: action.value};

    case 'setIsPinching':
      return {...state, isPinching: action.value};

    case 'setIsSingleFingerPanning':
      return {...state, isSingleFingerPanning: action.value};

    default:
      return state;
  }
}

interface UseCanvasViewportArgs {
  onMinimapInteraction?: () => void;
  onZoomInteraction?: () => void;
}

export function useCanvasViewport({
  onMinimapInteraction,
  onZoomInteraction
}: UseCanvasViewportArgs) {

  const [state, dispatch] = useReducer(reducer, initialCanvasViewPortState, createInitialCanvasViewPortState);

  const lastPanPoint = useRef({x: 0, y: 0});
  const lastPinchDistance = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const pinchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const singleFingerStartPoint = useRef<{ x: number; y: number } | null>(null);
  const singleFingerMoved = useRef(false);

  const zoomRef = useRef(state.zoom);
  const viewportXRef = useRef(state.viewportX);
  const viewportYRef = useRef(state.viewportY);
  const containerSizeRef = useRef(state.containerSize);

  useEffect(() => {
    zoomRef.current = state.zoom;
    viewportXRef.current = state.viewportX;
    viewportYRef.current = state.viewportY;
    containerSizeRef.current = state.containerSize;
  }, [state]);

  useEffect(() => {
    writeCanvasViewportStorage({
      zoom: state.zoom,
      viewportX: state.viewportX,
      viewportY: state.viewportY,
    });
  }, [state.zoom, state.viewportX, state.viewportY]);

  const handleViewportChange = useCallback((x: number, y: number) => {
    dispatch({type: 'setViewport', value: {x, y}});
    onMinimapInteraction?.();
  }, [onMinimapInteraction]);

  const handleZoomChange = useCallback((newZoom: number) => {
    const centerX = state.viewportX + state.containerSize.width / 2;
    const centerY = state.viewportY + state.containerSize.height / 2;

    const zoomRatio = newZoom / state.zoom;
    const newViewportX = centerX * zoomRatio - state.containerSize.width / 2;
    const newViewportY = centerY * zoomRatio - state.containerSize.height / 2;

    dispatch({type: 'setZoom', value: newZoom});

    const maxX = Math.max(0, CANVAS_WIDTH * newZoom - state.containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * newZoom - state.containerSize.height);
    dispatch({
      type: 'setViewport',
      value: {
        x: Math.max(0, Math.min(newViewportX, maxX)),
        y: Math.max(0, Math.min(newViewportY, maxY)),
      },
    });

    onZoomInteraction?.();
  }, [onZoomInteraction, state]);

  const setZoom = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(zoomRef.current) : value;
    dispatch({type: 'setZoom', value: resolved});
  }, [zoomRef]);

  const setViewportX = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(viewportXRef.current) : value;
    dispatch({type: 'setViewportX', value: resolved});
  }, [viewportXRef]);

  const setViewportY = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(viewportYRef.current) : value;
    dispatch({type: 'setViewportY', value: resolved});
  }, [viewportYRef]);

  const setContainerSize = useCallback((value: SetStateAction<{ width: number; height: number }>) => {
    const resolved = typeof value === 'function'
      ? value(containerSizeRef.current)
      : value;
    dispatch({type: 'setContainerSize', value: resolved});
  }, [containerSizeRef]);

  const setIsPanning = useCallback((value: boolean) => {
    dispatch({type: 'setIsPanning', value});
  }, []);

  const setIsPinching = useCallback((value: boolean) => {
    dispatch({type: 'setIsPinching', value});
  }, []);

  const setIsSingleFingerPanning = useCallback((value: boolean) => {
    dispatch({type: 'setIsSingleFingerPanning', value});
  }, []);

  /**
   * Fit the canvas inside the visible container.
   *
   * Computes the largest zoom that keeps the entire canvas visible (with a
   * small margin) and re-centers the viewport. No-op while the container has
   * not been measured yet.
   */
  const fitToView = useCallback(() => {
    const {width, height} = containerSizeRef.current;
    if (width <= 0 || height <= 0) return;

    const fitZoomRaw = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT) * FIT_TO_VIEW_MARGIN;
    const fitZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, fitZoomRaw));

    const overflowX = Math.max(0, CANVAS_WIDTH * fitZoom - width);
    const overflowY = Math.max(0, CANVAS_HEIGHT * fitZoom - height);

    dispatch({type: 'setZoom', value: fitZoom});
    dispatch({
      type: 'setViewport',
      value: {x: overflowX / 2, y: overflowY / 2},
    });

    onZoomInteraction?.();
  }, [onZoomInteraction]);

  return {
    zoom: state.zoom,
    setZoom,
    viewportX: state.viewportX,
    setViewportX,
    viewportY: state.viewportY,
    setViewportY,
    containerSize: state.containerSize,
    setContainerSize,
    isPanning: state.isPanning,
    setIsPanning,
    isPinching: state.isPinching,
    setIsPinching,
    isSingleFingerPanning: state.isSingleFingerPanning,
    setIsSingleFingerPanning,
    lastPanPoint,
    lastPinchDistance,
    lastPinchCenter,
    pinchTimeoutRef,
    singleFingerStartPoint,
    singleFingerMoved,
    zoomRef,
    viewportXRef,
    viewportYRef,
    containerSizeRef,
    handleViewportChange,
    handleZoomChange,
    fitToView,
  };
}
