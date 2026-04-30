import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
} from 'react';
import type {CanvasHandle} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import type {CanvasToolMode} from '@/components/rac-editor/@menus/lib/menu-types.ts';
import {useRacEditorDebugBridge} from '@/components/rac-editor/hooks/useRacEditorDebugBridge.ts';
import {useRacEditorFamilyActions} from '@/components/rac-editor/hooks/useRacEditorFamilyActions.ts';
import {useRacEditorSettingsActions} from '@/components/rac-editor/hooks/useRacEditorSettingsActions.ts';

interface UseRacEditorShellControllerArgs {
  canvasRef: MutableRefObject<CanvasHandle | null>;
  showTipsRef: MutableRefObject<boolean>;
  showZoomControlsRef: MutableRefObject<boolean>;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
  setFamilySetupOpen: Dispatch<SetStateAction<boolean>>;
  setHouseTypeSelectorOpen: Dispatch<SetStateAction<boolean>>;
  setShowZoomControls: Dispatch<SetStateAction<boolean>>;
  setCanvasToolMode: Dispatch<SetStateAction<CanvasToolMode>>;
}

/**
 * Agrupa comandos globais da shell do editor que nao pertencem ao canvas,
 * tutorial ou aos editores modais.
 */
export function useRacEditorShellController({
  canvasRef,
  showTipsRef,
  showZoomControlsRef,
  setPilotiSelection,
  setIsPilotiEditorOpen,
  setFamilySetupOpen,
  setHouseTypeSelectorOpen,
  setShowZoomControls,
  setCanvasToolMode,
}: UseRacEditorShellControllerArgs) {
  const {
    handleFamilySetupConfirm,
    handleRenameFamily,
  } = useRacEditorFamilyActions({
    setFamilySetupOpen,
    setHouseTypeSelectorOpen,
  });

  const {handleSettingsChange} = useRacEditorSettingsActions({
    setShowZoomControls,
  });

  const handleSetCanvasToolMode = useCallback(
    (mode: CanvasToolMode) => setCanvasToolMode(mode),
    [setCanvasToolMode],
  );

  const handleFitToView = useCallback(() => {
    canvasRef.current?.fitToView();
  }, [canvasRef]);

  const handleExit = useCallback(() => {
    console.info('[RacEditor] exit clicked - no sign-out flow wired yet.');
  }, []);

  useRacEditorDebugBridge({
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  });

  return {
    handleFamilySetupConfirm,
    handleRenameFamily,
    handleSettingsChange,
    handleSetCanvasToolMode,
    handleFitToView,
    handleExit,
  };
}
