import {Dispatch, RefObject, MutableRefObject, SetStateAction, useEffect} from 'react';
import type {
  CanvasDebugHandle,
  CanvasScreenProjectionHandle,
  CanvasViewportHandle,
} from '@/components/rac-editor/@canvas/ports/CanvasInteractionPort.ts';
import type {CanvasGroup} from '@/components/rac-editor/@canvas/lib';
import type {PilotiCanvasSelection} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {useHouseRuntimeSnapshot} from '@/components/rac-editor/lib/house-store.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {installRacEditorDebugBridge} from '@/components/rac-editor/@canvas/lib/canvas-debug-bridge.ts';

interface UseRacEditorDebugBridgeParams {
  canvasRef: RefObject<(CanvasDebugHandle & CanvasScreenProjectionHandle & CanvasViewportHandle) | null>;
  showTipsRef: MutableRefObject<boolean>;
  showZoomControlsRef: MutableRefObject<boolean>;
  setPilotiSelection: Dispatch<SetStateAction<PilotiCanvasSelection | null>>;
  setIsPilotiEditorOpen: Dispatch<SetStateAction<boolean>>;
}

export function useCanvasDebugBridge(params: UseRacEditorDebugBridgeParams): void {

  const {
    canvasRef,
    showTipsRef,
    showZoomControlsRef,
    setPilotiSelection,
    setIsPilotiEditorOpen,
  } = params;
  const houseSnapshot = useHouseRuntimeSnapshot<CanvasGroup>();
  const {houseReadPort, houseWritePort} = useEditorPorts();

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    return installRacEditorDebugBridge({
      getCanvasHandle: () => canvasRef.current,
      getShowTips: () => showTipsRef.current,
      getShowZoomControls: () => showZoomControlsRef.current,
      houseReadPort,
      houseWritePort,
      houseSnapshot,
      setPilotiSelection,
      setIsPilotiEditorOpen,
    });
  }, [
    canvasRef,
    houseReadPort,
    houseSnapshot,
    houseWritePort,
    setPilotiSelection,
    setIsPilotiEditorOpen,
    showTipsRef,
    showZoomControlsRef,
  ]);
}
