import {useCallback, useEffect, useReducer, useRef} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/components/lib/canvas';

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

  const [state, dispatch] = useReducer(reducer, initialCanvasViewPortState);

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

  const setZoom = useCallback((value: number) => {
    dispatch({type: 'setZoom', value});
  }, []);

  const setViewportX = useCallback((value: number) => {
    dispatch({type: 'setViewportX', value});
  }, []);

  const setViewportY = useCallback((value: number) => {
    dispatch({type: 'setViewportY', value});
  }, []);

  const setContainerSize = useCallback((value: { width: number; height: number }) => {
    dispatch({type: 'setContainerSize', value});
  }, []);

  const setIsPanning = useCallback((value: boolean) => {
    dispatch({type: 'setIsPanning', value});
  }, []);

  const setIsPinching = useCallback((value: boolean) => {
    dispatch({type: 'setIsPinching', value});
  }, []);

  const setIsSingleFingerPanning = useCallback((value: boolean) => {
    dispatch({type: 'setIsSingleFingerPanning', value});
  }, []);

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
  };
}
