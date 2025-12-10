import { useEffect, useRef, useState, useCallback } from 'react';

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportX: number;
  viewportY: number;
  zoom: number;
  onViewportChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
  visible: boolean;
}

const MINIMAP_SIZE = 75; // 2.5x the previous size of 30

export function Minimap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
  zoom,
  onViewportChange,
  onZoomChange,
  visible,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  // Calculate the scale factor for minimap
  const scale = MINIMAP_SIZE / Math.max(canvasWidth, canvasHeight);

  // Calculate viewport rectangle dimensions in minimap
  const viewRectWidth = (viewportWidth / zoom) * scale;
  const viewRectHeight = (viewportHeight / zoom) * scale;

  // Calculate viewport rectangle position in minimap
  const viewRectX = (viewportX / zoom) * scale;
  const viewRectY = (viewportY / zoom) * scale;

  // Zoom slider config
  const SLIDER_HEIGHT = 80;
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 200;
  const zoomPercent = Math.round(zoom * 100);
  const sliderPosition = ((zoomPercent - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * SLIDER_HEIGHT;

  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates
    const canvasX = (clickX / scale) * zoom - (viewportWidth / 2);
    const canvasY = (clickY / scale) * zoom - (viewportHeight / 2);

    onViewportChange(
      Math.max(0, Math.min(canvasX, canvasWidth * zoom - viewportWidth)),
      Math.max(0, Math.min(canvasY, canvasHeight * zoom - viewportHeight))
    );
  }, [scale, zoom, viewportWidth, viewportHeight, canvasWidth, canvasHeight, onViewportChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !minimapRef.current) return;

    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coordinates to canvas coordinates, centering on cursor
    const canvasX = (clickX / scale) * zoom - (viewportWidth / 2);
    const canvasY = (clickY / scale) * zoom - (viewportHeight / 2);

    onViewportChange(
      Math.max(0, Math.min(canvasX, canvasWidth * zoom - viewportWidth)),
      Math.max(0, Math.min(canvasY, canvasHeight * zoom - viewportHeight))
    );
  }, [isDragging, scale, zoom, viewportWidth, viewportHeight, canvasWidth, canvasHeight, onViewportChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsSliderDragging(false);
  }, []);

  // Slider handlers
  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSliderDragging(true);
    updateZoomFromMouse(e.clientY);
  }, []);

  const updateZoomFromMouse = useCallback((clientY: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(SLIDER_HEIGHT, relativeY));
    
    // Invert: top = max zoom, bottom = min zoom
    const zoomValue = MAX_ZOOM - (normalizedY / SLIDER_HEIGHT) * (MAX_ZOOM - MIN_ZOOM);
    onZoomChange(zoomValue / 100);
  }, [onZoomChange]);

  const handleSliderMove = useCallback((e: MouseEvent) => {
    if (!isSliderDragging) return;
    updateZoomFromMouse(e.clientY);
  }, [isSliderDragging, updateZoomFromMouse]);

  useEffect(() => {
    if (isDragging || isSliderDragging) {
      window.addEventListener('mousemove', isDragging ? handleMouseMove : handleSliderMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', isDragging ? handleMouseMove : handleSliderMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isSliderDragging, handleMouseMove, handleSliderMove, handleMouseUp]);

  if (!visible) return null;

  // Invert slider position (top = 200%, bottom = 50%)
  const thumbY = SLIDER_HEIGHT - sliderPosition;

  return (
    <div className="flex flex-col gap-2 items-center">
      {/* Zoom Slider */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">{zoomPercent}%</span>
        <div 
          ref={sliderRef}
          className="relative bg-background/90 border border-border rounded cursor-pointer"
          style={{ width: 16, height: SLIDER_HEIGHT }}
          onMouseDown={handleSliderMouseDown}
        >
          {/* Track */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-0.5 bg-muted-foreground/30 rounded" />
          
          {/* Triangle Thumb */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-75"
            style={{ top: thumbY - 6 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" className="fill-primary">
              <polygon points="6,12 0,0 12,0" />
            </svg>
          </div>
        </div>
      </div>

      {/* Minimap */}
      <div
        ref={minimapRef}
        className="bg-background/90 border border-border rounded shadow-lg cursor-crosshair overflow-hidden"
        style={{
          width: MINIMAP_SIZE,
          height: MINIMAP_SIZE,
        }}
        onClick={handleMinimapClick}
        onMouseDown={handleMouseDown}
      >
        {/* Canvas representation */}
        <div
          className="bg-card relative"
          style={{
            width: canvasWidth * scale,
            height: canvasHeight * scale,
          }}
        >
          {/* Viewport indicator */}
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
    </div>
  );
}
