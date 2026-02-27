import React, {useCallback, useEffect, useRef, useState} from 'react';
import {MINIMAP} from '@/shared/config.ts';

interface MinimapObject {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  type: string;
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
  objects?: MinimapObject[];
  highlight?: boolean;
}

export const MINIMAP_SIZE = MINIMAP.size;

export function Minimap({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
  zoom,
  onViewportChange,
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

  const updateViewportFromPosition =
    useCallback((clientX: number, clientY: number) => {
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

  const handleMinimapClick =
    useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
      window.addEventListener('touchmove', handleTouchMove, {passive: false});
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
      data-testid='rac-minimap'
      className={
        `bg-background/90 border border-border rounded shadow-lg cursor-crosshair overflow-hidden touch-none
          ${highlight
          ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75'
          : ''
        }`
      }
      style={{
        width: MINIMAP_SIZE,
        height: MINIMAP_SIZE,
      }}
      onClick={handleMinimapClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div
        className='bg-card relative'
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
      >
        {objects.map((obj, index) => (
          <div
            key={index}
            className='absolute bg-muted-foreground/40 border border-muted-foreground/60'
            style={{
              left: obj.left * scale,
              top: obj.top * scale,
              width: Math.max(MINIMAP.minObjectSize, obj.width * scale),
              height: Math.max(MINIMAP.minObjectSize, obj.height * scale),
              transform: `rotate(${obj.angle}deg)`,
              transformOrigin: 'center center',
            }}
          />
        ))}

        <div
          className='absolute border border-primary bg-primary/20 rounded-sm transition-all duration-75'
          style={{
            width: Math.max(MINIMAP.minViewportSize, viewRectWidth),
            height: Math.max(MINIMAP.minViewportSize, viewRectHeight),
            left: Math.max(0, Math.min(viewRectX, MINIMAP_SIZE - viewRectWidth)),
            top: Math.max(0, Math.min(viewRectY, MINIMAP_SIZE - viewRectHeight)),
          }}
        />
      </div>
    </div>
  );
}
