import {useCallback, useEffect, useRef, useState} from 'react';
import type {RefObject} from 'react';
import {toast} from 'sonner';
import type {HouseType} from '@/shared/types/house.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import type {HouseIllustrationPort} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';
import type {House3DViewerCameraPoseReader} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  removeHouse3DViewerCameraPose,
  writeHouse3DViewerCameraPose,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  readHouse3DViewerPreferences,
  writeHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';

const EDITOR_TOAST_POSITION = 'bottom-right' as const;

interface UseHouse3DViewerActionsArgs {
  houseType: HouseType;
  hasHouseViews: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
  cameraPoseStorageKey: string | null;
  viewerPreferencesStorageKey: string | null;
  houseIllustrationPort?: HouseIllustrationPort;
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
  viewerPreferencesStorageKey,
  houseIllustrationPort,
}: UseHouse3DViewerActionsArgs) {

  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState(
    () => readHouse3DViewerPreferences(viewerPreferencesStorageKey).wallColor,
  );
  const [hideBelowTerrain, setHideBelowTerrain] = useState(
    () => readHouse3DViewerPreferences(viewerPreferencesStorageKey).hideBelowTerrain,
  );
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraPoseReaderRef = useRef<House3DViewerCameraPoseReader | null>(null);
  const generationInFlightRef = useRef(false);

  useEffect(() => {
    const preferences = readHouse3DViewerPreferences(viewerPreferencesStorageKey);
    setWallColor(preferences.wallColor);
    setHideBelowTerrain(preferences.hideBelowTerrain);
  }, [viewerPreferencesStorageKey]);

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

  const persistCurrentViewerPreferences = useCallback(() => {
    writeHouse3DViewerPreferences(viewerPreferencesStorageKey, {
      wallColor,
      hideBelowTerrain,
    });
  }, [hideBelowTerrain, viewerPreferencesStorageKey, wallColor]);

  const handleClose = useCallback(() => {
    persistCurrentCameraPose();
    persistCurrentViewerPreferences();
    onOpenChange(false);
  }, [onOpenChange, persistCurrentCameraPose, persistCurrentViewerPreferences]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }

    onOpenChange(true);
  }, [handleClose, onOpenChange]);

  const handleInsertOnCanvas = useCallback(async () => {
    if (generationInFlightRef.current) return;

    if (!houseType || !hasHouseViews) {
      toast.error(TOAST_MESSAGES.noHouse3DToInsert, {
        position: EDITOR_TOAST_POSITION,
      });
      return;
    }

    const webglCanvas = webglCanvasRef.current;
    if (!webglCanvas) {
      toast.error(TOAST_MESSAGES.house3DCanvasUnavailable, {
        position: EDITOR_TOAST_POSITION,
        duration: 7000,
        description: 'Abra o Canvas, aguarde a casa carregar e clique novamente em “Inserir no Canvas”.',
      });
      return;
    }

    const screenshotDataUrl = webglCanvas.toDataURL('image/png');
    const generationToastId = toast.loading('Gerando imagem 3D…', {
      position: EDITOR_TOAST_POSITION,
      duration: Infinity,
      description: 'Você pode continuar editando; a imagem será inserida quando ficar pronta.',
    });
    generationInFlightRef.current = true;

    try {
      setIsGeneratingIllustration(true);
      const illustration = houseIllustrationPort
        ? await houseIllustrationPort.generateFromDataUrl(screenshotDataUrl)
        : null;
      const imageDataUrl = illustration?.dataUrl ?? screenshotDataUrl;
      let storageUrl = illustration?.storageUrl ?? null;

      if (!storageUrl && houseIllustrationPort?.persistDataUrl) {
        storageUrl = await houseIllustrationPort.persistDataUrl(imageDataUrl, 'casa-3d-fallback.png');
      }

      const inserted = await canvasRef.current?.createSnapshotPort()?.insertImageSnapshot(imageDataUrl, {storageUrl}) ?? false;
      if (inserted) {
        toast.success(
          illustration?.dataUrl
            ? 'Imagem 3D pronta e inserida no Canvas.'
            : TOAST_MESSAGES.house3DInsertedSuccessfully,
          {
            id: generationToastId,
            position: EDITOR_TOAST_POSITION,
            duration: 5000,
            description: 'A imagem foi adicionada ao histórico do editor.',
          },
        );
      } else {
        toast.error(TOAST_MESSAGES.failedToInsertHouse3DOnCanvas, {
          id: generationToastId,
          position: EDITOR_TOAST_POSITION,
          duration: 6000,
          description: 'Abra o Canvas e tente inserir a imagem novamente quando ele estiver disponível.',
        });
      }
    } catch (error) {
      console.error('[House3DViewer] Falha ao gerar ilustração da casa:', error);
      let storageUrl: string | null = null;
      try {
        storageUrl = houseIllustrationPort?.persistDataUrl
          ? await houseIllustrationPort.persistDataUrl(screenshotDataUrl, 'casa-3d-fallback.png')
          : null;
      } catch (persistError) {
        console.error('[House3DViewer] Falha ao persistir fallback 3D:', persistError);
      }
      const inserted = await canvasRef.current?.createSnapshotPort()?.insertImageSnapshot(screenshotDataUrl, {storageUrl}) ?? false;
      if (inserted) {
        toast.warning('Imagem 3D inserida com o screenshot técnico como fallback.', {
          id: generationToastId,
          position: EDITOR_TOAST_POSITION,
          duration: 6000,
          description: 'A geração da ilustração falhou, mas seu trabalho foi preservado.',
        });
      } else {
        toast.error(TOAST_MESSAGES.failedToCaptureHouse3DImage, {
          id: generationToastId,
          position: EDITOR_TOAST_POSITION,
          duration: 6000,
        });
      }
    } finally {
      generationInFlightRef.current = false;
      setIsGeneratingIllustration(false);
    }
  }, [canvasRef, hasHouseViews, houseIllustrationPort, houseType]);

  return {
    resetKey,
    isFullscreen,
    wallColor,
    setWallColor,
    hideBelowTerrain,
    setHideBelowTerrain,
    isSceneReady,
    isGeneratingIllustration,
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
