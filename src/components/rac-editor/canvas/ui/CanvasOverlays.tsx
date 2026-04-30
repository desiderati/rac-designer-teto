import {ReactNode} from 'react';
import {Minimap} from '@/components/rac-editor/ui/Minimap.tsx';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';

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

/**
 * Sobreposições do canvas: indicador de pinch zoom, minimapa e filhos do InfoBar.
 *
 * O ZoomSlider inferior esquerdo foi removido quando os menus foram refatorados
 * para o layout alinhado ao Stitch. O zoom agora fica disponível pelo FAB
 * superior central e pelas interações de roda/pinch.
 */
export function CanvasOverlays({
  showZoomControls,
  tutorialHighlight,
  isPinching,
  zoom,
  onZoomChange: _onZoomChange,
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
      {/* Indicador de feedback do pinch zoom */}
      {isPinching && (
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none'>
          <div
            className='bg-foreground/80 text-background px-4 py-2 rounded-full text-lg font-medium shadow-lg animate-scale-in'>
            {Math.round(zoom * 100)}%
          </div>
        </div>
      )}

      {/* Desktop: minimapa em posição fixa */}
      {showZoomControls && (
        <div
          className={`absolute left-2.5 bottom-2.5 flex-col items-start gap-1 transition-all duration-200 hidden sm:flex ${isZoomTutorialHighlighted ? 'z-50' : 'z-10'}`}>
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

      {/* Mobile: minimapa e InfoBar empilhados no contêiner flex */}
      <div
        className={`absolute left-2.5 bottom-2.5 right-2.5 flex flex-col items-start gap-2 sm:hidden ${isZoomTutorialHighlighted ? 'z-50' : 'z-10'}`}>
        {showZoomControls && (
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
        )}
        {/* InfoBar mobile renderizado aqui */}
        {showTips && children}
      </div>

      {/* Desktop: filhos (InfoBar) centralizados abaixo */}
      <div className='hidden sm:block'>
        {children}
      </div>
    </>
  );
}
