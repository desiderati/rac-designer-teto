import {useCallback, useRef, useState} from 'react';
import type {RefObject} from 'react';
import {toast} from 'sonner';
import type {HouseType} from '@/shared/types/house.ts';
import {HOUSE_3D_WALL_COLORS, TOAST_MESSAGES} from '@/shared/config.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import type {House3DViewerCameraPoseReader} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  removeHouse3DViewerCameraPose,
  writeHouse3DViewerCameraPose,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';

interface UseHouse3DViewerActionsArgs {
  houseType: HouseType;
  hasHouseViews: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
  cameraPoseStorageKey: string | null;
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
  canvasRef,
  cameraPoseStorageKey,
}: UseHouse3DViewerActionsArgs) {

  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState(HOUSE_3D_WALL_COLORS.viewerInitialColor);
  const [hideBelowTerrain, setHideBelowTerrain] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraPoseReaderRef = useRef<House3DViewerCameraPoseReader | null>(null);

  const registerCameraPoseReader = useCallback((reader: House3DViewerCameraPoseReader | null) => {
    cameraPoseReaderRef.current = reader;
  }, []);

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
    removeHouse3DViewerCameraPose(cameraPoseStorageKey);
    setResetKey((key) => key + 1);
  }, [cameraPoseStorageKey, clearSceneReadiness]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((fullscreen) => !fullscreen);
  }, []);

  const persistCurrentCameraPose = useCallback(() => {
    const pose = cameraPoseReaderRef.current?.() ?? null;
    writeHouse3DViewerCameraPose(cameraPoseStorageKey, pose);
  }, [cameraPoseStorageKey]);

  const handleClose = useCallback(() => {
    persistCurrentCameraPose();
    onOpenChange(false);
  }, [onOpenChange, persistCurrentCameraPose]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }

    onOpenChange(true);
  }, [handleClose, onOpenChange]);

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
      const inserted = await canvasRef.current?.createSnapshotPort()?.insertImageSnapshot(dataUrl) ?? false;
      if (inserted) {
        toast.success(TOAST_MESSAGES.house3DInsertedSuccessfully);
      } else {
        toast.error(TOAST_MESSAGES.failedToInsertHouse3DOnCanvas);
      }
    } catch (error) {
      console.error('[House3DViewer] Falha ao capturar screenshot 3D:', error);
      toast.error(TOAST_MESSAGES.failedToCaptureHouse3DImage);
    }
  }, [canvasRef, hasHouseViews, houseType]);

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
    registerCameraPoseReader,
    handleReset,
    toggleFullscreen,
    handleClose,
    handleDialogOpenChange,
    handleInsertOnCanvas,
  };
}
