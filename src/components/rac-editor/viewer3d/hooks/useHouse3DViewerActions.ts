import {useCallback, useRef, useState} from 'react';
import {toast} from 'sonner';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import type {HouseType} from '@/shared/types/house.ts';
import {HOUSE_3D_WALL_COLORS, TOAST_MESSAGES} from '@/shared/config.ts';

interface UseHouse3DViewerActionsArgs {
  houseType: HouseType;
  hasHouseViews: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Concentra ações imperativas do visualizador 3D.
 *
 * Captura de canvas WebGL, reset de câmera e fullscreen são detalhes do viewer,
 * não do componente de layout nem do estado canônico da casa.
 */
export function useHouse3DViewerActions({
  houseType,
  hasHouseViews,
  onOpenChange,
}: UseHouse3DViewerActionsArgs) {
  const {houseWritePort} = useEditorPorts();
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState(HOUSE_3D_WALL_COLORS.viewerInitialColor);
  const [hideBelowTerrain, setHideBelowTerrain] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const clearSceneReadiness = useCallback(() => {
    setIsSceneReady(false);
    webglCanvasRef.current = null;
  }, []);

  const handleCanvasCreated = useCallback((canvas: HTMLCanvasElement) => {
    webglCanvasRef.current = canvas;
    setIsSceneReady(true);
  }, []);

  const handleReset = useCallback(() => {
    clearSceneReadiness();
    setResetKey((key) => key + 1);
  }, [clearSceneReadiness]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((fullscreen) => !fullscreen);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleInsertOnCanvas = useCallback(async () => {
    if (!houseType || !hasHouseViews) {
      toast.error(TOAST_MESSAGES.noHouse3DToInsert);
      return;
    }

    const webglCanvas = webglCanvasRef.current;
    if (!webglCanvas) {
      toast.error(TOAST_MESSAGES.house3DCanvasUnavailable);
      return;
    }

    try {
      const dataUrl = webglCanvas.toDataURL('image/png');
      const inserted = await houseWritePort.insert3DSnapshotOnCanvas(dataUrl);
      if (inserted) {
        toast.success(TOAST_MESSAGES.house3DInsertedSuccessfully);
      } else {
        toast.error(TOAST_MESSAGES.failedToInsertHouse3DOnCanvas);
      }
    } catch (error) {
      console.error('[House3DViewer] Falha ao capturar screenshot 3D:', error);
      toast.error(TOAST_MESSAGES.failedToCaptureHouse3DImage);
    }
  }, [hasHouseViews, houseType, houseWritePort]);

  return {
    resetKey,
    isFullscreen,
    wallColor,
    setWallColor,
    hideBelowTerrain,
    setHideBelowTerrain,
    isSceneReady,
    clearSceneReadiness,
    handleCanvasCreated,
    handleReset,
    toggleFullscreen,
    handleClose,
    handleInsertOnCanvas,
  };
}
