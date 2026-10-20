import {SetStateAction, useCallback, useEffect, useReducer, useRef} from 'react';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {ZOOM_LIMITS} from '@/shared/config.ts';
import {getCanvasViewportOffset} from '@/components/rac-editor/@canvas/lib/canvas-screen-position.ts';
import {
  readCanvasViewportStorage,
  writeCanvasViewportStorage,
} from '@/components/rac-editor/@canvas/lib/canvas-viewport-storage.ts';

/** Margin kept around the canvas when fitting to the visible container. */
const FIT_TO_VIEW_MARGIN = 0.95;

export interface CanvasZoomGesture {
  from: {x: number; y: number};
  to: {x: number; y: number};
}

function getMinimumZoom({width, height}: {width: number; height: number}): number {
  if (width <= 0 || height <= 0) return ZOOM_LIMITS.min;
  return Math.max(ZOOM_LIMITS.fitMin, Math.min(ZOOM_LIMITS.min,
    Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT) * FIT_TO_VIEW_MARGIN));
}

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

function createInitialCanvasViewPortState(houseId?: string | null): CanvasViewportState {
  const storedViewport = readCanvasViewportStorage(houseId);
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
  houseId?: string | null;
  onMinimapInteraction?: () => void;
  onZoomInteraction?: () => void;
}

export function useCanvasViewport({
  houseId,
  onMinimapInteraction,
  onZoomInteraction,
}: UseCanvasViewportArgs) {
  const [state, dispatch] = useReducer(
    reducer,
    houseId,
    createInitialCanvasViewPortState,
  );

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
  const previousHouseIdRef = useRef(houseId);
  const skipViewportPersistenceRef = useRef(false);

  useEffect(() => {
    zoomRef.current = state.zoom;
    viewportXRef.current = state.viewportX;
    viewportYRef.current = state.viewportY;
    containerSizeRef.current = state.containerSize;
  }, [state]);

  // O Canvas é reutilizado quando a casa ativa muda. Reidratar o viewport
  // explicitamente aqui impede que a casa seguinte herde o pan/zoom anterior.
  useEffect(() => {
    if (previousHouseIdRef.current === houseId) return;
    previousHouseIdRef.current = houseId;
    skipViewportPersistenceRef.current = true;
    const storedViewport = readCanvasViewportStorage(houseId);
    // A troca preserva o zoom atual; apenas o deslocamento pertence à casa.
    dispatch({type: 'setIsPanning', value: false});
    dispatch({type: 'setIsSingleFingerPanning', value: false});
    dispatch({type: 'setZoom', value: zoomRef.current});
    dispatch({type: 'setViewport', value: {
      x: storedViewport.viewportX,
      y: storedViewport.viewportY,
    }});
  }, [houseId]);

  useEffect(() => {
    if (skipViewportPersistenceRef.current) {
      skipViewportPersistenceRef.current = false;
      return;
    }

    writeCanvasViewportStorage({
      zoom: state.zoom,
      viewportX: state.viewportX,
      viewportY: state.viewportY,
    }, houseId);
  }, [houseId, state.zoom, state.viewportX, state.viewportY]);

  const handleViewportChange = useCallback((x: number, y: number) => {
    viewportXRef.current = x;
    viewportYRef.current = y;
    dispatch({type: 'setViewport', value: {x, y}});
    onMinimapInteraction?.();
  }, [onMinimapInteraction]);

  const handleZoomChange = useCallback((newZoom: number, gesture?: CanvasZoomGesture) => {
    const size = containerSizeRef.current;
    newZoom = Math.max(getMinimumZoom(size), Math.min(ZOOM_LIMITS.max, newZoom));
    const from = gesture?.from ?? {x: size.width / 2, y: size.height / 2};
    const to = gesture?.to ?? from;
    const {canvasX, canvasY} = getCanvasViewportOffset({
      canvasPosition: {x: viewportXRef.current, y: viewportYRef.current, zoom: zoomRef.current},
      containerWidth: size.width, containerHeight: size.height,
      canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT,
    });
    const newViewportX = (from.x - canvasX) * newZoom / zoomRef.current - to.x;
    const newViewportY = (from.y - canvasY) * newZoom / zoomRef.current - to.y;

    dispatch({type: 'setZoom', value: newZoom});

    const maxX = Math.max(0, CANVAS_WIDTH * newZoom - size.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * newZoom - size.height);
    zoomRef.current = newZoom;
    viewportXRef.current = Math.max(0, Math.min(newViewportX, maxX));
    viewportYRef.current = Math.max(0, Math.min(newViewportY, maxY));
    dispatch({
      type: 'setViewport',
      value: {
        x: viewportXRef.current,
        y: viewportYRef.current,
      },
    });

    onZoomInteraction?.();
  }, [onZoomInteraction]);

  const setZoom = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(zoomRef.current) : value;
    dispatch({type: 'setZoom', value: resolved});
  }, []);

  const setViewportX = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(viewportXRef.current) : value;
    dispatch({type: 'setViewportX', value: resolved});
  }, []);

  const setViewportY = useCallback((value: SetStateAction<number>) => {
    const resolved = typeof value === 'function' ? value(viewportYRef.current) : value;
    dispatch({type: 'setViewportY', value: resolved});
  }, []);

  const setContainerSize = useCallback((value: SetStateAction<{ width: number; height: number }>) => {
    const resolved = typeof value === 'function'
      ? value(containerSizeRef.current)
      : value;
    dispatch({type: 'setContainerSize', value: resolved});
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

  /** Fit the canvas inside the visible container. */
  const fitToView = useCallback(() => {
    const {width, height} = containerSizeRef.current;
    if (width <= 0 || height <= 0) return;

    const fitZoomRaw = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT) * FIT_TO_VIEW_MARGIN;
    const fitZoom = Math.max(getMinimumZoom({width, height}), Math.min(ZOOM_LIMITS.max, fitZoomRaw));

    const overflowX = Math.max(0, CANVAS_WIDTH * fitZoom - width);
    const overflowY = Math.max(0, CANVAS_HEIGHT * fitZoom - height);

    dispatch({type: 'setZoom', value: fitZoom});
    dispatch({
      type: 'setViewport',
      value: {x: overflowX / 2, y: overflowY / 2},
    });

    onZoomInteraction?.();
  }, [onZoomInteraction]);

  /** Enquadra os limites dos objetos existentes, inclusive após pan/zoom salvos. */
  const fitContent = useCallback((bounds: {left: number; top: number; width: number; height: number} | null) => {
    if (!bounds) {
      fitToView();
      return;
    }
    const {width, height} = containerSizeRef.current;
    if (width <= 0 || height <= 0) return;
    const margin = 0.88;
    const fitZoom = Math.max(getMinimumZoom({width, height}), Math.min(ZOOM_LIMITS.max,
      Math.min(width * margin / Math.max(bounds.width, 1), height * margin / Math.max(bounds.height, 1))));
    const centerX = (bounds.left + bounds.width / 2) * fitZoom;
    const centerY = (bounds.top + bounds.height / 2) * fitZoom;
    dispatch({type: 'setZoom', value: fitZoom});
    dispatch({type: 'setViewport', value: {
      x: Math.max(0, Math.min(centerX - width / 2, Math.max(0, CANVAS_WIDTH * fitZoom - width))),
      y: Math.max(0, Math.min(centerY - height / 2, Math.max(0, CANVAS_HEIGHT * fitZoom - height))),
    }});
    onZoomInteraction?.();
  }, [fitToView, onZoomInteraction]);

  /** Centraliza limites carregados sem tocar nos objetos Fabric. */
  const fitContentInView = useCallback((
    bounds: {left: number; top: number; width: number; height: number} | null,
    force = false,
  ) => {
    if (!bounds) return;
    const {width, height} = containerSizeRef.current;
    if (width <= 0 || height <= 0) return;

    const currentZoom = zoomRef.current;
    const contentZoom = Math.min(
      width * 0.88 / Math.max(bounds.width, 1),
      height * 0.88 / Math.max(bounds.height, 1),
    );
    const targetZoom = Math.max(
      getMinimumZoom({width, height}),
      Math.min(ZOOM_LIMITS.max, currentZoom, contentZoom),
    );
    const centerX = (bounds.left + bounds.width / 2) * targetZoom;
    const centerY = (bounds.top + bounds.height / 2) * targetZoom;
    const maxViewportX = Math.max(0, CANVAS_WIDTH * targetZoom - width);
    const maxViewportY = Math.max(0, CANVAS_HEIGHT * targetZoom - height);

    if (force || targetZoom !== currentZoom) {
      dispatch({type: 'setZoom', value: targetZoom});
      dispatch({type: 'setViewport', value: {
        x: Math.max(0, Math.min(centerX - width / 2, maxViewportX)),
        y: Math.max(0, Math.min(centerY - height / 2, maxViewportY)),
      }});
      onZoomInteraction?.();
    }
  }, [onZoomInteraction]);

  return {
    zoom: state.zoom,
    minimumZoom: getMinimumZoom(state.containerSize),
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
    fitContent,
    fitContentInView,
  };
}
