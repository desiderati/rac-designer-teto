import {ReactNode} from 'react';
import {LoaderCircle, RefreshCw} from 'lucide-react';
import {Minimap} from '@/components/rac-editor/ui/Minimap.tsx';
import {CANVAS_HEIGHT, CANVAS_WIDTH} from '@/shared/constants.ts';
import {HouseDifficultyControls} from '@/components/rac-editor/ui/HouseDifficultyControls.tsx';
import type {HouseDifficultyIndicator} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import type {SiteAssessment} from '@/shared/types/construction-site.ts';

interface CanvasOverlaysProps {
  showZoomControls: boolean;
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
  difficultyIndicator?: HouseDifficultyIndicator | null;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: (input: Partial<SiteAssessment>) => void;
  onReloadDrawing?: () => void;
  isReloadingDrawing?: boolean;
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
  difficultyIndicator,
  siteAssessment,
  onSiteAssessmentChange,
  onReloadDrawing,
  isReloadingDrawing = false,
  children,
}: CanvasOverlaysProps) {

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

      {onReloadDrawing ? (
        <button
          type='button'
          aria-label='Recarregar desenho do Canvas'
          title='Recarregar desenho do Canvas'
          aria-busy={isReloadingDrawing}
          disabled={isReloadingDrawing}
          onClick={(event) => {
            event.stopPropagation();
            onReloadDrawing();
          }}
          className='absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-70'
        >
          {isReloadingDrawing ? (
            <LoaderCircle className='h-4 w-4 animate-spin' aria-hidden='true'/>
          ) : (
            <RefreshCw className='h-4 w-4' aria-hidden='true'/>
          )}
        </button>
      ) : null}

      {/* Desktop: minimapa em posição fixa */}
      {showZoomControls && (
        <div
          className='absolute left-2.5 bottom-2.5 z-10 flex-col items-start gap-1 transition-all duration-200 hidden sm:flex'>
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
            highlight={false}
          />
        </div>
      )}

      {difficultyIndicator ? (
        <>
          <div className='absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 min-[767px]:block'>
            <HouseDifficultyControls
              indicator={difficultyIndicator}
              siteAssessment={siteAssessment}
              onSiteAssessmentChange={onSiteAssessmentChange}
            />
          </div>
          <div className='absolute right-1 top-1/2 z-10 -translate-y-1/2 min-[767px]:hidden'>
            <HouseDifficultyControls
              indicator={difficultyIndicator}
              siteAssessment={siteAssessment}
              onSiteAssessmentChange={onSiteAssessmentChange}
              enableMobileCollapse
            />
          </div>
        </>
      ) : null}

      {/* Mobile: minimapa e InfoBar empilhados no contêiner flex */}
      <div
        className='absolute left-2.5 bottom-2.5 right-2.5 z-10 flex flex-col items-start gap-2 sm:hidden'>
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
            highlight={false}
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
