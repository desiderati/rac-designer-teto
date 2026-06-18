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

interface RacEditorCanvasProps {
  canvasRef: React.RefObject<CanvasHandle | null>;
  showTips: boolean;
  showZoomControls: boolean;
  infoMessage: string;
  difficultyIndicator?: HouseDifficultyIndicator | null;
  siteAssessment?: SiteAssessment | null;
  onSiteAssessmentChange?: (input: Partial<SiteAssessment>) => void;
  isAnyEditorOpen: boolean;
  isContraventamentoMode: boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  canvasToolMode: CanvasToolMode;
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
}

export function RacEditorCanvas({
  canvasRef,
  showTips,
  showZoomControls,
  infoMessage,
  difficultyIndicator = null,
  siteAssessment = null,
  onSiteAssessmentChange,
  isAnyEditorOpen,
  isContraventamentoMode,
  isPilotiEligibleForContraventamento,
  canvasToolMode,
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
}: RacEditorCanvasProps) {
  const [hasActiveSelection, setHasActiveSelection] = useState(false);

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
    <div className='h-full overflow-hidden relative'>
      <Canvas
        ref={canvasRef}
        onSelectionChange={handleSelectionChange}
        onHistorySave={onCanvasDocumentChange}
        onZoomInteraction={onZoomInteraction}
        onMinimapInteraction={onZoomInteraction}
        onZoomChange={onZoomChange}
        canvasToolMode={canvasToolMode}
        difficultyIndicator={difficultyIndicator}
        siteAssessment={siteAssessment}
        onSiteAssessmentChange={onSiteAssessmentChange}
        showTips={showTips}
        onPilotiSelect={onPilotiSelect}
        onWallSelect={onWallSelect}
        onLinearSelect={onLinearSelect}
        onTerrainSelect={onTerrainSelect}
        isAnyEditorOpen={isAnyEditorOpen}
        onDelete={onDelete}
        showZoomControls={showZoomControls}
        isContraventamentoMode={isContraventamentoMode}
        isPilotiEligibleForContraventamento={isPilotiEligibleForContraventamento}
        onContraventamentoPilotiClick={onContraventamentoPilotiClick}
        onContraventamentoCancel={onContraventamentoCancel}
        onFreeDrawPathCreated={onFreeDrawPathCreated}
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
