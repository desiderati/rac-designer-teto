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
const SLIDER_HEIGHT = 80;
const THUMB_SIZE = 12;
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;

export function ZoomSlider({ zoom, onZoomChange, highlight = false }: ZoomSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  
  const zoomPercent = Math.round(zoom * 100);
  const normalizedZoom = (zoomPercent - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const thumbY = (THUMB_SIZE / 2) + (1 - normalizedZoom) * (SLIDER_HEIGHT - THUMB_SIZE);

  const updateZoomFromMouse = useCallback((clientY: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(SLIDER_HEIGHT, relativeY));
    
    const zoomValue = MAX_ZOOM - (normalizedY / SLIDER_HEIGHT) * (MAX_ZOOM - MIN_ZOOM);
    onZoomChange(zoomValue / 100);
  }, [onZoomChange]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSliderDragging(true);
    updateZoomFromMouse(e.clientY);
  }, [updateZoomFromMouse]);

  const handleSliderMove = useCallback((e: MouseEvent) => {
    if (!isSliderDragging) return;
    updateZoomFromMouse(e.clientY);
  }, [isSliderDragging, updateZoomFromMouse]);

  const handleMouseUp = useCallback(() => {
    setIsSliderDragging(false);
  }, []);

  useEffect(() => {
    if (isSliderDragging) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleSliderMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSliderDragging, handleSliderMove, handleMouseUp]);

  return (
    <div className={`flex flex-col items-center gap-1 ${highlight ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg p-1' : ''}`}>
      <span className="text-[10px] text-muted-foreground font-medium">{zoomPercent}%</span>
      <div 
        ref={sliderRef}
        className="relative bg-background/90 border border-border rounded cursor-pointer"
        style={{ width: 16, height: SLIDER_HEIGHT }}
        onMouseDown={handleSliderMouseDown}
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-0.5 bg-muted-foreground/30 rounded" />
        <div 
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow transition-all duration-75"
          style={{ top: thumbY - THUMB_SIZE / 2 }}
        />
      </div>
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
