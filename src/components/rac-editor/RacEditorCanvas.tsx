import React from 'react';
import {
  Canvas,
  CanvasHandle,
  PilotiCanvasSelection,
  ContraventamentoCanvasSelection,
  ObjectCanvasSelection,
  LineArrowDistanceCanvasSelection,
} from './Canvas';
import {InfoBar} from './InfoBar';
import {TutorialStepId} from './hooks/useRacTutorialFlow';

interface RacEditorCanvasProps {
  canvasRef: React.Ref<CanvasHandle>;
  tutorialStep: TutorialStepId | null;
  showTips: boolean;
  showZoomControls: boolean;
  infoMessage: string;
  isEditorOpen: boolean;
  isContraventamentoMode: boolean;
  isSelectingContraventamentoDestination: boolean;
  isPilotiEligibleForContraventamento: (pilotiId: string) => boolean;
  onSelectionMessage: (message: string) => void;
  onSelectionAuxCleanup: () => void;
  onZoomInteraction: () => void;
  onPilotiSelect: (selection: PilotiCanvasSelection | null) => void;
  onObjectSelect: (selection: ObjectCanvasSelection | null) => void;
  onLineArrowDistanceSelect: (selection: LineArrowDistanceCanvasSelection | null) => void;
  onDelete: () => void;
  onContraventamentoPilotiClick: (pilotiId: string, col: number, row: number, group: ContraventamentoCanvasSelection['group']) => void;
  onContraventamentoSelect: (selection: ContraventamentoCanvasSelection | null) => void;
  onContraventamentoCancel: () => void;
}

export function RacEditorCanvas({
  canvasRef,
  tutorialStep,
  showTips,
  showZoomControls,
  infoMessage,
  isEditorOpen,
  isContraventamentoMode,
  isSelectingContraventamentoDestination,
  isPilotiEligibleForContraventamento,
  onSelectionMessage,
  onSelectionAuxCleanup,
  onZoomInteraction,
  onPilotiSelect,
  onObjectSelect,
  onLineArrowDistanceSelect,
  onDelete,
  onContraventamentoPilotiClick,
  onContraventamentoSelect,
  onContraventamentoCancel,
}: RacEditorCanvasProps) {
  return (
    <div className="h-full p-2.5 overflow-hidden relative">
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
        onObjectSelect={onObjectSelect}
        onLineArrowDistanceSelect={onLineArrowDistanceSelect}
        isEditorOpen={isEditorOpen}
        onDelete={onDelete}
        showZoomControls={showZoomControls}
        isContraventamentoMode={isContraventamentoMode}
        isSelectingContraventamentoDestination={isSelectingContraventamentoDestination}
        isPilotiEligibleForContraventamento={isPilotiEligibleForContraventamento}
        onContraventamentoPilotiClick={onContraventamentoPilotiClick}
        onContraventamentoSelect={onContraventamentoSelect}
        onContraventamentoCancel={onContraventamentoCancel}
      >
        {showTips &&
          <div
            className="sm:absolute sm:bottom-2.5 sm:left-1/2 sm:-translate-x-1/2 max-w-md w-full pointer-events-auto">
            <InfoBar message={infoMessage}/>
          </div>
        }
      </Canvas>
    </div>
  );
}
