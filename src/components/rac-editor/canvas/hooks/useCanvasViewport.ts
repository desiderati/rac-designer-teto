import {useCallback, useEffect, useRef, useState} from "react";
import {CANVAS_HEIGHT, CANVAS_WIDTH} from "@/components/lib/canvas";

interface UseCanvasViewportArgs {
  onMinimapInteraction?: () => void;
  onZoomInteraction?: () => void;
}

export function useCanvasViewport({
  onMinimapInteraction,
  onZoomInteraction
}: UseCanvasViewportArgs) {

  const [zoom, setZoom] = useState(1);
  const [viewportX, setViewportX] = useState(0);
  const [viewportY, setViewportY] = useState(0);
  const [containerSize, setContainerSize] = useState({width: 0, height: 0});
  const [isPanning, setIsPanning] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [isSingleFingerPanning, setIsSingleFingerPanning] = useState(false);

  const lastPanPoint = useRef({x: 0, y: 0});
  const lastPinchDistance = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const pinchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const singleFingerStartPoint = useRef<{ x: number; y: number } | null>(null);
  const singleFingerMoved = useRef(false);

  const zoomRef = useRef(zoom);
  const viewportXRef = useRef(viewportX);
  const viewportYRef = useRef(viewportY);
  const containerSizeRef = useRef(containerSize);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    viewportXRef.current = viewportX;
  }, [viewportX]);

  useEffect(() => {
    viewportYRef.current = viewportY;
  }, [viewportY]);

  useEffect(() => {
    containerSizeRef.current = containerSize;
  }, [containerSize]);

  const handleViewportChange = useCallback((x: number, y: number) => {
    setViewportX(x);
    setViewportY(y);
    onMinimapInteraction?.();
  }, [onMinimapInteraction]);

  const handleZoomChange = useCallback((newZoom: number) => {
    const centerX = viewportX + containerSize.width / 2;
    const centerY = viewportY + containerSize.height / 2;

    const zoomRatio = newZoom / zoom;
    const newViewportX = centerX * zoomRatio - containerSize.width / 2;
    const newViewportY = centerY * zoomRatio - containerSize.height / 2;

    setZoom(newZoom);

    const maxX = Math.max(0, CANVAS_WIDTH * newZoom - containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * newZoom - containerSize.height);
    setViewportX(Math.max(0, Math.min(newViewportX, maxX)));
    setViewportY(Math.max(0, Math.min(newViewportY, maxY)));

    onZoomInteraction?.();
  }, [zoom, viewportX, viewportY, containerSize, onZoomInteraction]);

  return {
    zoom,
    setZoom,
    viewportX,
    setViewportX,
    viewportY,
    setViewportY,
    containerSize,
    setContainerSize,
    isPanning,
    setIsPanning,
    isPinching,
    setIsPinching,
    isSingleFingerPanning,
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
