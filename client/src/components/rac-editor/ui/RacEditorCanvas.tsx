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
  const noop = useCallback(() => {}, []);
  const neverEligibleForContraventamento = useCallback(() => false, []);

  useEffect(() => {
    if (!showTips) return;
    const activeSelectionCount = canvasRef.current?.getActiveObjectCount() ?? 0;
    setHasActiveSelection(activeSelectionCount > 0);
  }, [canvasRef, showTips]);

  const handleSelectionChange = useCallback((message: string) => {
    onSelectionMessage(message);
    onSelectionAuxCleanup();

    const activeSelectionCount = canvasRef.current?.getActiveObjectCount() ?? 0;
    setHasActiveSelection(activeSelectionCount > 0);
  }, [canvasRef, onSelectionAuxCleanup, onSelectionMessage]);

  return (
    <div className='relative h-full min-h-0 min-w-[360px] overflow-hidden' aria-busy={loading}>
      {loading ? <div data-testid='house-canvas-loading' role='status' className='absolute inset-0 z-30 grid place-items-center bg-slate-50/95'><div className='flex items-center gap-3 rounded-xl border bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm'><span className='h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'/>Carregando Canvas da casa selecionada…</div></div> : null}
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
        {showTips && hasActiveSelection &&
          <div
            className='sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto'>
            <InfoBar message={infoMessage}/>
          </div>
        }
      </Canvas>
    </div>
  );
}
