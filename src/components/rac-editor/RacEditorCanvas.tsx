import React from 'react';
import {
  Canvas,
  CanvasHandle,
  LinearCanvasSelection,
  TerrainCanvasSelection,
  WallCanvasSelection,
} from '@/components/rac-editor/canvas/Canvas.tsx';
import {InfoBar} from './InfoBar.tsx';
import {TutorialStepId} from '@/components/rac-editor/tutorial/Tutorial.tsx';
import {PilotiCanvasSelection} from '@/components/lib/canvas';

interface RacEditorCanvasProps {
  canvasRef: React.Ref<CanvasHandle>;
  tutorialStep: TutorialStepId | null;
  showTips: boolean;
  showZoomControls: boolean;
  infoMessage: string;
  isAnyEditorOpen: boolean;
  isContraventamentoMode: boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
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
}

export function RacEditorCanvas({
  canvasRef,
  tutorialStep,
  showTips,
  showZoomControls,
  infoMessage,
  isAnyEditorOpen,
  isContraventamentoMode,
  isPilotiEligibleForContraventamento,
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
}: RacEditorCanvasProps) {

  return (
    <div className='h-full p-2.5 overflow-hidden relative'>
      <Canvas
        ref={canvasRef}
        onSelectionChange={(msg) => {
          onSelectionMessage(msg);
          onSelectionAuxCleanup();
        }}
        onHistorySave={() => {
        }}
        onZoomInteraction={onZoomInteraction}
        onMinimapInteraction={onZoomInteraction}
        tutorialHighlight={tutorialStep}
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
      >
        {showTips &&
          <div
            className='sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto'>
            <InfoBar message={infoMessage}/>
          </div>
        }
      </Canvas>
    </div>
  );
}
