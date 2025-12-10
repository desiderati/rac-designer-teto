import { useEffect, useRef, useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';

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

const MINIMAP_SIZE = 120;

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
  const [isDragging, setIsDragging] = useState(false);

  // Calculate the scale factor for minimap
  const scale = MINIMAP_SIZE / Math.max(canvasWidth, canvasHeight);

  // Calculate viewport rectangle dimensions in minimap
  const viewRectWidth = (viewportWidth / zoom) * scale;
  const viewRectHeight = (viewportHeight / zoom) * scale;

  // Calculate viewport rectangle position in minimap
  const viewRectX = (viewportX / zoom) * scale;
  const viewRectY = (viewportY / zoom) * scale;

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
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
      {/* Zoom Slider */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium">{Math.round(zoom * 100)}%</span>
        <div className="h-24 flex items-center">
          <Slider
            orientation="vertical"
            min={50}
            max={200}
            step={10}
            value={[zoom * 100]}
            onValueChange={(value) => onZoomChange(value[0] / 100)}
            className="h-full"
          />
        </div>
      </div>

      {/* Minimap */}
      <div
        ref={minimapRef}
        className="bg-background/90 border border-border rounded-lg shadow-lg cursor-crosshair overflow-hidden"
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
            className="absolute border-2 border-primary bg-primary/20 rounded-sm transition-all duration-75"
            style={{
              width: Math.max(8, viewRectWidth),
              height: Math.max(8, viewRectHeight),
              left: Math.max(0, Math.min(viewRectX, MINIMAP_SIZE - viewRectWidth)),
              top: Math.max(0, Math.min(viewRectY, MINIMAP_SIZE - viewRectHeight)),
            }}
          />
        </div>
      </div>
    </div>
  );
}
