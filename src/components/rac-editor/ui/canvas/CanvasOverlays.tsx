import {ReactNode} from 'react';
import {Minimap} from '../Minimap.tsx';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/components/rac-editor/lib/canvas';
import {ZoomSlider} from '@/components/rac-editor/ui/ZoomSlider.tsx';

interface CanvasOverlaysProps {
  showZoomControls: boolean;
  tutorialHighlight: 'main-fab' | 'house' | 'elements' | 'zoom-minimap' | 'more-options' | null | undefined;
  isPinching: boolean;
  zoom: number;
  onZoomChange: (value: number) => void;
  containerWidth: number;
  containerHeight: number;
  viewportX: number;
  viewportY: number;
  onViewportChange: (x: number, y: number) => void;
  minimapObjects: Array<{
    left: number;
    top: number;
    width: number;
    height: number;
    angle: number;
    type: string;
  }>;
  showTips: boolean;
  children?: ReactNode;
}

export function CanvasOverlays({
  showZoomControls,
  tutorialHighlight,
  isPinching,
  zoom,
  onZoomChange,
  containerWidth,
  containerHeight,
  viewportX,
  viewportY,
  onViewportChange,
  minimapObjects,
  showTips,
  children,
}: CanvasOverlaysProps) {
  const isZoomTutorialHighlighted = tutorialHighlight === 'zoom-minimap';
  return (
    <>
      {/* Pinch-zoom feedback indicator */}
      {isPinching && (
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none'>
          <div
            className='bg-foreground/80 text-background px-4 py-2 rounded-full text-lg font-medium shadow-lg animate-scale-in'>
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}

      {/* Desktop: Minimap fixed position */}
      {showZoomControls && (
        <div
          className={`absolute left-2.5 bottom-2.5 flex-col items-start gap-1 transition-all duration-200 hidden sm:flex ${isZoomTutorialHighlighted ? 'z-50' : 'z-10'}`}>
          <div
            className={isZoomTutorialHighlighted ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg' : ''}>
            <ZoomSlider
              zoom={zoom}
              onZoomChange={onZoomChange}
              highlight={false}
            />
          </div>
          <Minimap
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            viewportWidth={containerWidth}
            viewportHeight={containerHeight}
            viewportX={viewportX}
            viewportY={viewportY}
            zoom={zoom}
            onViewportChange={onViewportChange}
            objects={minimapObjects}
            highlight={isZoomTutorialHighlighted}
          />
        </div>
      )}

      {/* Mobile: Minimap + InfoBar stacked in flex container */}
      <div
        className={`absolute left-2.5 bottom-2.5 right-2.5 flex flex-col items-start gap-2 sm:hidden ${isZoomTutorialHighlighted ? 'z-50' : 'z-10'}`}>
        {showZoomControls && (
          <>
            <div
              className={isZoomTutorialHighlighted ? 'animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 rounded-lg' : ''}>
              <ZoomSlider
                zoom={zoom}
                onZoomChange={onZoomChange}
                highlight={false}
              />
            </div>
            <Minimap
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
              viewportWidth={containerWidth}
              viewportHeight={containerHeight}
              viewportX={viewportX}
              viewportY={viewportY}
              zoom={zoom}
              onViewportChange={onViewportChange}
              objects={minimapObjects}
              highlight={isZoomTutorialHighlighted}
            />
          </>
        )}
        {/* Mobile InfoBar rendered here */}
        {showTips && children}
      </div>

      {/* Desktop: Children (InfoBar) - centered at bottom */}
      <div className='hidden sm:block'>
        {children}
      </div>
    </>
  );
}
