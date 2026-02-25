import {useCallback, useEffect, useRef, useState} from 'react';
import {MINIMAP, ZOOM_SLIDER} from '@/config.ts';

const ZOOM_SLIDER_WIDTH = MINIMAP.size;
const ZOOM_THUMB_SIZE = ZOOM_SLIDER.thumbSize;
const ZOOM_MIN_VALUE = ZOOM_SLIDER.minPercent;
const ZOOM_MAX_VALUE = ZOOM_SLIDER.maxPercent;

interface ZoomSliderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  highlight?: boolean;
}

export function ZoomSlider({zoom, onZoomChange, highlight = false}: ZoomSliderProps) {

  const sliderRef = useRef<HTMLDivElement>(null);
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  const zoomPercent = Math.round(zoom * 100);
  const normalizedZoom = (zoomPercent - ZOOM_MIN_VALUE) / (ZOOM_MAX_VALUE - ZOOM_MIN_VALUE);
  const thumbX = (ZOOM_THUMB_SIZE / 2) + normalizedZoom * (ZOOM_SLIDER_WIDTH - ZOOM_THUMB_SIZE);

  const updateZoomFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const normalizedX = Math.max(0, Math.min(ZOOM_SLIDER_WIDTH, relativeX));

    const zoomValue = ZOOM_MIN_VALUE + (normalizedX / ZOOM_SLIDER_WIDTH) * (ZOOM_MAX_VALUE - ZOOM_MIN_VALUE);
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
      window.addEventListener('touchmove', handleSliderTouchMove, {passive: false});
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
    <div
      className={
        `flex flex-col items-center gap-0.5 ${highlight
          ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg p-1'
          : ''
        }`}>
      <span className='text-[9px] text-muted-foreground font-medium'>{zoomPercent}%</span>
      <div
        ref={sliderRef}
        data-testid='rac-zoom-slider'
        className='relative bg-background/90 border border-border rounded cursor-pointer touch-none'
        style={{width: ZOOM_SLIDER_WIDTH, height: ZOOM_SLIDER.height}}
        onMouseDown={handleSliderMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className='absolute top-1/2 -translate-y-1/2 left-1 right-1 h-0.5 bg-muted-foreground/30 rounded'/>
        <div
          className='absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow transition-all duration-75'
          style={{left: thumbX - ZOOM_THUMB_SIZE / 2}}
        />
      </div>
    </div>
  );
}
