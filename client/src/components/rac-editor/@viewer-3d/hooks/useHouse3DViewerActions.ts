import {useCallback, useEffect, useRef, useState} from 'react';
import type {RefObject} from 'react';
import {toast} from '@/components/ui/sonner.tsx';
import type {HouseType} from '@/shared/types/house.ts';
import {TOAST_MESSAGES} from '@/shared/config.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import type {HouseIllustrationPort} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';
import type {House3DViewerCameraPoseReader} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  removeHouse3DViewerCameraPose,
  writeHouse3DViewerCameraPose,
  createHouse3DDoorFacingCameraPose,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import type {House3DDoorFace} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {
  readHouse3DViewerPreferences,
  writeHouse3DViewerPreferences,
} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';
import {useHouse3DImageInsertion} from '@/contexts/House3DImageInsertionContext.tsx';
import type {HouseDrawingViewer3DDocument} from '@/shared/types/house-drawing-document.ts';

const EDITOR_TOAST_POSITION = 'bottom-right' as const;

interface UseHouse3DViewerActionsArgs {
  houseType: HouseType;
  hasHouseViews: boolean;
  doorFace?: House3DDoorFace;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
  cameraPoseStorageKey: string | null;
  viewerPreferencesStorageKey: string | null;
  houseIllustrationPort?: HouseIllustrationPort;
  viewer3DPort?: {
    getViewer3D?: () => HouseDrawingViewer3DDocument | null;
    setViewer3D?: (value: HouseDrawingViewer3DDocument) => void;
  };
  onDocumentChange?: () => void;
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
  doorFace,
  onOpenChange,
  canvasRef,
  cameraPoseStorageKey,
  viewerPreferencesStorageKey,
  houseIllustrationPort,
  viewer3DPort,
  onDocumentChange,
}: UseHouse3DViewerActionsArgs) {
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState(
    () => (viewer3DPort?.getViewer3D?.() ?? readHouse3DViewerPreferences(viewerPreferencesStorageKey)).wallColor,
  );
  const [hideBelowTerrain, setHideBelowTerrain] = useState(
    () => (viewer3DPort?.getViewer3D?.() ?? readHouse3DViewerPreferences(viewerPreferencesStorageKey)).hideBelowTerrain,
  );
  const [isSceneReady, setIsSceneReady] = useState(false);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraPoseReaderRef = useRef<House3DViewerCameraPoseReader | null>(null);
  const generationInFlightRef = useRef(false);
  const {
    pendingImage,
    isGenerating: isGeneratingIllustration,
    publishImage,
    setGenerating,
    insertPendingImage,
    registerCanvasGetter,
  } = useHouse3DImageInsertion();

  useEffect(() => {
    const preferences = viewer3DPort?.getViewer3D?.() ?? readHouse3DViewerPreferences(viewerPreferencesStorageKey);
    setWallColor(preferences.wallColor);
    setHideBelowTerrain(preferences.hideBelowTerrain);
  }, [viewerPreferencesStorageKey, viewer3DPort]);

  const getCanvasHandle = useCallback(() => canvasRef.current, [canvasRef]);

  useEffect(() => registerCanvasGetter(getCanvasHandle), [getCanvasHandle, registerCanvasGetter]);

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
    const previous = viewer3DPort?.getViewer3D?.();
    if (previous) {
      viewer3DPort?.setViewer3D?.({...previous, cameraPose: null});
      onDocumentChange?.();
    }
    setResetKey((key) => key + 1);
  }, [cameraPoseStorageKey, clearSceneReadiness, onDocumentChange, viewer3DPort]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((fullscreen) => !fullscreen);
  }, []);

  const persistCurrentCameraPose = useCallback(() => {
    const pose = cameraPoseReaderRef.current?.()
      ?? (houseType ? createHouse3DDoorFacingCameraPose({doorFace: doorFace ?? 'front', compact: false}) : null);
    writeHouse3DViewerCameraPose(cameraPoseStorageKey, pose);
  }, [cameraPoseStorageKey, doorFace, houseType]);

  const persistCurrentViewerPreferences = useCallback(() => {
    writeHouse3DViewerPreferences(viewerPreferencesStorageKey, {
      wallColor,
      hideBelowTerrain,
    });
  }, [hideBelowTerrain, viewerPreferencesStorageKey, wallColor]);

  const handleWallColorChange = useCallback((nextWallColor: string) => {
    setWallColor(nextWallColor);
    writeHouse3DViewerPreferences(viewerPreferencesStorageKey, {
      wallColor: nextWallColor,
      hideBelowTerrain,
    });

    const previous = viewer3DPort?.getViewer3D?.();
    if (!previous) return;

    viewer3DPort?.setViewer3D?.({...previous, wallColor: nextWallColor});
    onDocumentChange?.();
  }, [hideBelowTerrain, onDocumentChange, viewer3DPort, viewerPreferencesStorageKey]);

  const handleClose = useCallback(() => {
    const pose = cameraPoseReaderRef.current?.()
      ?? (houseType ? createHouse3DDoorFacingCameraPose({doorFace: doorFace ?? 'front', compact: false}) : null);
    persistCurrentCameraPose();
    persistCurrentViewerPreferences();
    viewer3DPort?.setViewer3D?.({
      cameraPose: pose ? {
        position: [...pose.position],
        target: [...pose.target],
        fov: pose.fov,
        zoom: pose.zoom,
      } : null,
      wallColor,
      hideBelowTerrain,
    });
    onDocumentChange?.();
    onOpenChange(false);
  }, [doorFace, hideBelowTerrain, houseType, onDocumentChange, onOpenChange, persistCurrentCameraPose, persistCurrentViewerPreferences, viewer3DPort, wallColor]);

  const handleDialogOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }

    onOpenChange(true);
  }, [handleClose, onOpenChange]);

  const handleInsertOnCanvas = useCallback(async () => {
    if (generationInFlightRef.current) return;

    if (pendingImage) {
      await insertPendingImage();
      return;
    }

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
        description: 'Abra o Canvas para habilitar a inserção e clique novamente em “Inserir”.',
      });
      return;
    }

    const screenshotDataUrl = webglCanvas.toDataURL('image/png');
    generationInFlightRef.current = true;
    setGenerating(true);

    try {
      let imageDataUrl = screenshotDataUrl;
      let storageUrl: string | null = null;
      let source: 'illustration' | 'screenshot' = 'screenshot';

      try {
        const illustration = houseIllustrationPort?.generateFromDataUrl
          ? await houseIllustrationPort.generateFromDataUrl(screenshotDataUrl, {wallColor})
          : null;
        const illustrationDataUrl = illustration?.dataUrl;
        if (illustrationDataUrl?.startsWith('data:image/')) {
          imageDataUrl = illustrationDataUrl;
          storageUrl = illustration.storageUrl;
          source = 'illustration';
        }
      } catch (error) {
        console.error('[House3DViewer] Falha ao gerar ilustração da casa; usando captura 3D:', error);
      }

      if (!storageUrl && houseIllustrationPort?.persistDataUrl) {
        try {
          storageUrl = await houseIllustrationPort.persistDataUrl(
            imageDataUrl,
            source === 'illustration' ? 'casa-3d-ilustracao.png' : 'casa-3d-screenshot.png',
          );
        } catch (error) {
          console.error('[House3DViewer] Falha ao persistir imagem 3D:', error);
        }
      }

      publishImage({dataUrl: imageDataUrl, storageUrl, source});
    } catch (error) {
      console.error('[House3DViewer] Falha inesperada ao preparar captura 3D:', error);
      let storageUrl: string | null = null;
      try {
        storageUrl = houseIllustrationPort?.persistDataUrl
          ? await houseIllustrationPort.persistDataUrl(screenshotDataUrl, 'casa-3d-screenshot.png')
          : null;
      } catch (persistError) {
        console.error('[House3DViewer] Falha ao persistir fallback 3D:', persistError);
      }

      publishImage({dataUrl: screenshotDataUrl, storageUrl, source: 'screenshot'});
    } finally {
      generationInFlightRef.current = false;
      setGenerating(false);
    }
  }, [hasHouseViews, houseIllustrationPort, houseType, insertPendingImage, pendingImage, publishImage, setGenerating, wallColor]);

  return {
    resetKey,
    isFullscreen,
    wallColor,
    setWallColor,
    handleWallColorChange,
    hideBelowTerrain,
    setHideBelowTerrain,
    isSceneReady,
    isGeneratingIllustration,
    hasPendingIllustration: Boolean(pendingImage),
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
