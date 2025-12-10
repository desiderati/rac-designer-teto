import { useEffect, useRef, useState, useCallback } from 'react';

interface MinimapObject {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  type: string;
}

interface ZoomSliderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  highlight?: boolean;
}

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportX: number;
  viewportY: number;
  zoom: number;
  onViewportChange: (x: number, y: number) => void;
  visible: boolean;
  objects?: MinimapObject[];
  highlight?: boolean;
}

const MINIMAP_SIZE = 75;
const SLIDER_WIDTH = 80;
const THUMB_SIZE = 12;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;

export function ZoomSlider({ zoom, onZoomChange, highlight = false }: ZoomSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  
  const zoomPercent = Math.round(zoom * 100);
  const normalizedZoom = (zoomPercent - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const thumbX = (THUMB_SIZE / 2) + normalizedZoom * (SLIDER_WIDTH - THUMB_SIZE);

  const updateZoomFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const normalizedX = Math.max(0, Math.min(SLIDER_WIDTH, relativeX));
    
    const zoomValue = MIN_ZOOM + (normalizedX / SLIDER_WIDTH) * (MAX_ZOOM - MIN_ZOOM);
    onZoomChange(zoomValue / 100);
  }, [onZoomChange]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSliderDragging(true);
    updateZoomFromPosition(e.clientX);
  }, [updateZoomFromPosition]);

  const handleSliderMove = useCallback((e: MouseEvent) => {
    if (!isSliderDragging) return;
    updateZoomFromPosition(e.clientX);
  }, [isSliderDragging, updateZoomFromPosition]);

  const handleSliderTouchMove = useCallback((e: TouchEvent) => {
    if (!isSliderDragging) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      updateZoomFromPosition(e.touches[0].clientX);
    }
  }, [isSliderDragging, updateZoomFromPosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSliderDragging(true);
    if (e.touches.length > 0) {
      updateZoomFromPosition(e.touches[0].clientX);
    }
  }, [updateZoomFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsSliderDragging(false);
  }, []);

  useEffect(() => {
    if (isSliderDragging) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleSliderTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSliderMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleSliderTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isSliderDragging, handleSliderMove, handleSliderTouchMove, handleMouseUp]);

  return (
    <div className={`flex items-center gap-2 ${highlight ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg p-1' : ''}`}>
      <div 
        ref={sliderRef}
        className="relative bg-background/90 border border-border rounded cursor-pointer touch-none"
        style={{ width: SLIDER_WIDTH, height: 16 }}
        onMouseDown={handleSliderMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 h-0.5 bg-muted-foreground/30 rounded" />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow transition-all duration-75"
          style={{ left: thumbX - THUMB_SIZE / 2 }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground font-medium min-w-[32px]">{zoomPercent}%</span>
    </div>
  );
}

export function Minimap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
  zoom,
  onViewportChange,
  visible,
  objects = [],
  highlight = false,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate the scale factor for minimap
  const scale = MINIMAP_SIZE / Math.max(canvasWidth, canvasHeight);

  // Calculate viewport rectangle dimensions in minimap
  const viewRectWidth = (viewportWidth / zoom) * scale;
  const viewRectHeight = (viewportHeight / zoom) * scale;

  // Calculate viewport rectangle position in minimap
  const viewRectX = (viewportX / zoom) * scale;
  const viewRectY = (viewportY / zoom) * scale;

  const updateViewportFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const canvasX = (clickX / scale) * zoom - (viewportWidth / 2);
    const canvasY = (clickY / scale) * zoom - (viewportHeight / 2);

    onViewportChange(
      Math.max(0, Math.min(canvasX, canvasWidth * zoom - viewportWidth)),
      Math.max(0, Math.min(canvasY, canvasHeight * zoom - viewportHeight))
    );
  }, [scale, zoom, viewportWidth, viewportHeight, canvasWidth, canvasHeight, onViewportChange]);

  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateViewportFromPosition(e.clientX, e.clientY);
  }, [updateViewportFromPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateViewportFromPosition(e.clientX, e.clientY);
  }, [isDragging, updateViewportFromPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    if (e.touches.length > 0) {
      updateViewportFromPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [updateViewportFromPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      updateViewportFromPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [isDragging, updateViewportFromPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={minimapRef}
      className={`bg-background/90 border border-border rounded shadow-lg cursor-crosshair overflow-hidden touch-none ${highlight ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75' : ''}`}
      style={{
        width: MINIMAP_SIZE,
        height: MINIMAP_SIZE,
      }}
      onClick={handleMinimapClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className="bg-card relative"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
      >
        {objects.map((obj, index) => (
          <div
            key={index}
            className="absolute bg-muted-foreground/40 border border-muted-foreground/60"
            style={{
              left: obj.left * scale,
              top: obj.top * scale,
              width: Math.max(2, obj.width * scale),
              height: Math.max(2, obj.height * scale),
              transform: `rotate(${obj.angle}deg)`,
              transformOrigin: 'center center',
            }}
          />
        ))}
        
        <div
          className="absolute border border-primary bg-primary/20 rounded-sm transition-all duration-75"
          style={{
            width: Math.max(4, viewRectWidth),
            height: Math.max(4, viewRectHeight),
            left: Math.max(0, Math.min(viewRectX, MINIMAP_SIZE - viewRectWidth)),
            top: Math.max(0, Math.min(viewRectY, MINIMAP_SIZE - viewRectHeight)),
          }}
        />
      </div>
    </div>
  );
}
