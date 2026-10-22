import React, {useCallback, useEffect, useState} from 'react';
import {Canvas} from '@/components/rac-editor/@canvas/ui/Canvas.tsx';
import type {
  LinearCanvasSelection,
  PilotiCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection,
} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {InfoBar} from './InfoBar.tsx';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasHandle.ts';
import type {HouseDifficultyIndicator} from '@/components/rac-editor/lib/house-difficulty-indicator.ts';
import type {SiteAssessment} from '@/shared/types/construction-site.ts';
import {useCanvasHouseInitialization} from '@/components/rac-editor/@canvas/hooks/useCanvasHouseInitialization.ts';
import {CanvasLoadingState} from './CanvasLoadingState.tsx';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';
import {toast} from '@/components/ui/sonner.tsx';

const MOBILE_CANVAS_TIP_ID = 'rac-mobile-canvas-tip';

interface RacEditorCanvasProps {
  canvasRef: React.RefObject<CanvasHandle | null>;
  activeHouseId?: string | null;
  showTips: boolean;
  showZoomControls: boolean;
  showToolMenuLabels?: boolean;
  infoMessage: string;
  difficultyIndicator?: HouseDifficultyIndicator | null;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: (input: Partial<SiteAssessment>) => void;
  isAnyEditorOpen: boolean;
  isContraventamentoMode: boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  canvasToolMode: CanvasToolMode;
  onToolModeChange?: (mode: CanvasToolMode) => void;
  onZoomChange: (zoom: number) => void;
  onSelectionMessage: (message: string) => void;
  onSelectionAuxCleanup: () => void;
  onZoomInteraction: () => void;
  onPilotiSelect: (selection: PilotiCanvasSelection | null) => void;
  onWallSelect: (selection: WallCanvasSelection | null) => void;
  onLinearSelect: (selection: LinearCanvasSelection | null) => void;
  onTerrainSelect: (selection: TerrainCanvasSelection | null) => void;
  onDelete: () => void;
  onContraventamentoPilotiClick: (col: number, row: number) => void;
  onContraventamentoCancel: () => void;
  onFreeDrawPathCreated: () => void;
  onCanvasDocumentChange: () => void;
  readOnly?: boolean;
  loading?: boolean;
}

export function RacEditorCanvas({
  canvasRef,
  activeHouseId = null,
  showTips,
  showZoomControls,
  showToolMenuLabels = false,
  infoMessage,
  difficultyIndicator = null,
  siteAssessment = null,
  onSiteAssessmentChange,
  isAnyEditorOpen,
  isContraventamentoMode,
  isPilotiEligibleForContraventamento,
  canvasToolMode,
  onToolModeChange,
  onZoomChange,
  onSelectionMessage,
  onSelectionAuxCleanup,
  onZoomInteraction,
  onPilotiSelect,
  onWallSelect,
  onLinearSelect,
  onTerrainSelect,
  onDelete,
  onContraventamentoPilotiClick,
  onContraventamentoCancel,
  onFreeDrawPathCreated,
  onCanvasDocumentChange,
  readOnly = false,
  loading = false,
}: RacEditorCanvasProps) {
  useCanvasHouseInitialization({canvasRef});
  const [hasActiveSelection, setHasActiveSelection] = useState(false);
  const [selectionHintRevision, setSelectionHintRevision] = useState(0);
  const {mobile, portrait} = useCanvasMobileViewport();
  const noop = useCallback(() => {}, []);
  const neverEligibleForContraventamento = useCallback(() => false, []);

  useEffect(() => {
    if (!showTips) return;
    const activeSelectionCount = canvasRef.current?.getActiveObjectCount() ?? 0;
    setHasActiveSelection(activeSelectionCount > 0);
  }, [canvasRef, showTips]);

  const showMobileTip = mobile && !portrait && showTips && hasActiveSelection && !loading && Boolean(infoMessage.trim());
  useEffect(() => {
    if (!showMobileTip) return;
    toast.info('Dica', {
      id: MOBILE_CANVAS_TIP_ID,
      duration: 5_000,
      description: <span dangerouslySetInnerHTML={{__html: infoMessage}}/>,
    });
  }, [infoMessage, selectionHintRevision, showMobileTip]);

  useEffect(() => {
    if (!showMobileTip) return;
    return () => { toast.dismiss(MOBILE_CANVAS_TIP_ID); };
  }, [showMobileTip]);

  const handleSelectionChange = useCallback((message: string) => {
    onSelectionMessage(message);
    onSelectionAuxCleanup();

    const activeSelectionCount = canvasRef.current?.getActiveObjectCount() ?? 0;
    setHasActiveSelection(activeSelectionCount > 0);
    setSelectionHintRevision((current) => current + 1);
  }, [canvasRef, onSelectionAuxCleanup, onSelectionMessage]);

  return (
    <div className='relative h-full min-h-0 min-w-[360px] overflow-hidden' aria-busy={loading}>
      {loading ? (
        <div data-testid='house-canvas-loading' className='absolute inset-0 z-30'>
          <CanvasLoadingState/>
        </div>
      ) : null}
      <Canvas
        ref={canvasRef}
        activeHouseId={activeHouseId}
        readOnly={readOnly}
        onSelectionChange={handleSelectionChange}
        onHistorySave={readOnly ? noop : onCanvasDocumentChange}
        onZoomInteraction={onZoomInteraction}
        onMinimapInteraction={onZoomInteraction}
        onZoomChange={onZoomChange}
        canvasToolMode={canvasToolMode}
        onToolModeChange={onToolModeChange}
        difficultyIndicator={difficultyIndicator}
        siteAssessment={siteAssessment}
        onSiteAssessmentChange={readOnly ? undefined : onSiteAssessmentChange}
        showTips={showTips}
        onPilotiSelect={readOnly ? undefined : onPilotiSelect}
        onWallSelect={readOnly ? undefined : onWallSelect}
        onLinearSelect={readOnly ? undefined : onLinearSelect}
        onTerrainSelect={readOnly ? undefined : onTerrainSelect}
        isAnyEditorOpen={isAnyEditorOpen}
        onDelete={readOnly ? undefined : onDelete}
        showZoomControls={showZoomControls}
        showToolMenuLabels={showToolMenuLabels}
        isContraventamentoMode={readOnly ? false : isContraventamentoMode}
        isPilotiEligibleForContraventamento={readOnly ? neverEligibleForContraventamento : isPilotiEligibleForContraventamento}
        onContraventamentoPilotiClick={readOnly ? undefined : onContraventamentoPilotiClick}
        onContraventamentoCancel={readOnly ? undefined : onContraventamentoCancel}
        onFreeDrawPathCreated={readOnly ? undefined : onFreeDrawPathCreated}
      >
        {!mobile && showTips && hasActiveSelection &&
          <div
            className='sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto'>
            <InfoBar message={infoMessage}/>
          </div>
        }
      </Canvas>
    </div>
  );
}
