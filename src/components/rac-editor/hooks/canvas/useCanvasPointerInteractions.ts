import React, {MutableRefObject, RefObject, useCallback, useEffect} from 'react';
import {Canvas as FabricCanvas} from 'fabric';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/components/rac-editor/lib/canvas';
import {INTERACTION_THRESHOLDS, TIMINGS, VIEWPORT, ZOOM_LIMITS} from '@/shared/config.ts';

interface UseCanvasPointerInteractionsArgs {
  containerRef: RefObject<HTMLDivElement | null>;
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  zoom: number;
  containerSize: { width: number; height: number };
  isPanning: boolean;
  setIsPanning: (value: boolean) => void;
  setIsPinching: (value: boolean) => void;
  setIsSingleFingerPanning: (value: boolean) => void;
  lastPanPoint: MutableRefObject<{ x: number; y: number }>;
  lastPinchDistance: MutableRefObject<number | null>;
  lastPinchCenter: MutableRefObject<{ x: number; y: number } | null>;
  pinchTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  singleFingerStartPoint: MutableRefObject<{ x: number; y: number } | null>;
  singleFingerMoved: MutableRefObject<boolean>;
  setViewportX: React.Dispatch<React.SetStateAction<number>>;
  setViewportY: React.Dispatch<React.SetStateAction<number>>;
  handleZoomChange: (newZoom: number) => void;
}

export function useCanvasPointerInteractions({
  containerRef,
  fabricCanvasRef,
  zoom,
  containerSize,
  isPanning,
  setIsPanning,
  setIsPinching,
  setIsSingleFingerPanning,
  lastPanPoint,
  lastPinchDistance,
  lastPinchCenter,
  pinchTimeoutRef,
  singleFingerStartPoint,
  singleFingerMoved,
  setViewportX,
  setViewportY,
  handleZoomChange,
}: UseCanvasPointerInteractionsArgs) {

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };

    container.addEventListener('wheel', preventBrowserZoom, {passive: false});
    return () => container.removeEventListener('wheel', preventBrowserZoom);
  }, [containerRef]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 1) return;
    event.preventDefault();
    setIsPanning(true);
    lastPanPoint.current = {x: event.clientX, y: event.clientY};
  }, [lastPanPoint, setIsPanning]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isPanning) return;

    const deltaX = event.clientX - lastPanPoint.current.x;
    const deltaY = event.clientY - lastPanPoint.current.y;
    lastPanPoint.current = {x: event.clientX, y: event.clientY};

    const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

    setViewportX((previous) => Math.max(0, Math.min(previous - deltaX, maxX)));
    setViewportY((previous) => Math.max(0, Math.min(previous - deltaY, maxY)));
  }, [containerSize, isPanning, lastPanPoint, setViewportX, setViewportY, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, [setIsPanning]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const delta = event.deltaY > 0 ? -ZOOM_LIMITS.wheelStep : ZOOM_LIMITS.wheelStep;
      const newZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom + delta));
      handleZoomChange(newZoom);
      return;
    }

    const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
    const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

    setViewportX((previous) => Math.max(0, Math.min(previous + event.deltaX, maxX)));
    setViewportY((previous) => Math.max(0, Math.min(previous + event.deltaY, maxY)));
  }, [containerSize, handleZoomChange, setViewportX, setViewportY, zoom]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;

    if (event.touches.length === 2) {
      event.preventDefault();
      setIsSingleFingerPanning(false);
      singleFingerStartPoint.current = null;
      singleFingerMoved.current = false;

      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);

      lastPinchCenter.current = {
        x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
      };

      setIsPinching(true);

      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.discardActiveObject();
        canvas.selection = false;
        canvas.renderAll();
      }

      if (pinchTimeoutRef.current) {
        clearTimeout(pinchTimeoutRef.current);
      }
      return;
    }

    if (event.touches.length === 1 && isMobileDevice) {
      singleFingerStartPoint.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      lastPanPoint.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
      singleFingerMoved.current = false;

      const canvas = fabricCanvasRef.current;
      if (canvas) {
        canvas.selection = false;
      }
    }
  }, [
    fabricCanvasRef,
    lastPanPoint,
    lastPinchCenter,
    lastPinchDistance,
    pinchTimeoutRef,
    setIsPinching,
    setIsSingleFingerPanning,
    singleFingerMoved,
    singleFingerStartPoint,
  ]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const isMobileDevice = window.matchMedia(VIEWPORT.mobileMaxWidthQuery).matches;

    if (event.touches.length === 2 && lastPinchDistance.current !== null && lastPinchCenter.current !== null) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      const currentCenter = {
        x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
        y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
      };

      const panDeltaX = lastPinchCenter.current.x - currentCenter.x;
      const panDeltaY = lastPinchCenter.current.y - currentCenter.y;

      const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
      const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

      setViewportX((previous) => Math.max(0, Math.min(previous + panDeltaX, maxX)));
      setViewportY((previous) => Math.max(0, Math.min(previous + panDeltaY, maxY)));

      const delta = (currentDistance - lastPinchDistance.current) * ZOOM_LIMITS.pinchScaleFactor;
      const newZoom = Math.max(ZOOM_LIMITS.min, Math.min(ZOOM_LIMITS.max, zoom + delta));
      if (newZoom !== zoom) {
        handleZoomChange(newZoom);
      }

      lastPinchDistance.current = currentDistance;
      lastPinchCenter.current = currentCenter;
      return;
    }

    if (event.touches.length === 1 && singleFingerStartPoint.current && isMobileDevice) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastPanPoint.current.x;
      const deltaY = touch.clientY - lastPanPoint.current.y;

      const totalDeltaX = Math.abs(touch.clientX - singleFingerStartPoint.current.x);
      const totalDeltaY = Math.abs(touch.clientY - singleFingerStartPoint.current.y);

      if (totalDeltaX > INTERACTION_THRESHOLDS.mobilePanActivation || totalDeltaY > INTERACTION_THRESHOLDS.mobilePanActivation) {
        singleFingerMoved.current = true;
        setIsSingleFingerPanning(true);
        event.preventDefault();

        const maxX = Math.max(0, CANVAS_WIDTH * zoom - containerSize.width);
        const maxY = Math.max(0, CANVAS_HEIGHT * zoom - containerSize.height);

        setViewportX((previous) => Math.max(0, Math.min(previous - deltaX, maxX)));
        setViewportY((previous) => Math.max(0, Math.min(previous - deltaY, maxY)));
      }

      lastPanPoint.current = {x: touch.clientX, y: touch.clientY};
    }
  }, [
    containerSize,
    handleZoomChange,
    lastPanPoint,
    lastPinchCenter,
    lastPinchDistance,
    setIsSingleFingerPanning,
    setViewportX,
    setViewportY,
    singleFingerMoved,
    singleFingerStartPoint,
    zoom,
  ]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null;
    lastPinchCenter.current = null;
    singleFingerStartPoint.current = null;

    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.selection = true;
    }

    setIsSingleFingerPanning(false);
    singleFingerMoved.current = false;

    pinchTimeoutRef.current = setTimeout(() => {
      setIsPinching(false);
    }, TIMINGS.pinchEndDebounceMs);
  }, [
    fabricCanvasRef,
    lastPinchCenter,
    lastPinchDistance,
    pinchTimeoutRef,
    setIsPinching,
    setIsSingleFingerPanning,
    singleFingerMoved,
    singleFingerStartPoint,
  ]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
