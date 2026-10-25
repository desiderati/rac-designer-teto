import {Suspense, useEffect, useMemo} from 'react';
import {Loader2} from 'lucide-react';
import {Canvas} from '@react-three/fiber';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover.tsx';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
  faCamera,
  faCompress,
  faExpand,
  faEyeSlash,
  faPalette,
  faRotateRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {House3DScene} from './House3DScene.tsx';
import {House3DViewerCameraRig} from '@/components/rac-editor/@viewer-3d/ui/House3DViewerCameraRig.tsx';
import type {RefObject} from 'react';
import {HOUSE_3D_WALL_COLOR_OPTIONS} from '@/shared/config.ts';
import {useHouse3DViewerModel} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts';
import {useHouse3DViewerActions} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerActions.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import {
  createHouse3DDoorFacingLightingPreset,
  getHouse3DViewerCameraPoseStorageKey,
  readHouse3DViewerCameraPose,
  resolveHouse3DDoorFace,
} from '@/components/rac-editor/@viewer-3d/lib/camera-pose.ts';
import {getHouse3DViewerPreferencesStorageKey} from '@/components/rac-editor/@viewer-3d/lib/viewer-preferences.ts';
import type {HouseIllustrationPort} from '@/components/rac-editor/ports/HouseIllustrationPort.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {useCanvasMobileViewport} from '@/components/rac-editor/lib/use-canvas-mobile-viewport.ts';

interface House3DViewerProps {
  readOnly?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
  activeHouseId: string | null;
  houseIllustrationPort?: HouseIllustrationPort;
  onDocumentChange?: () => void;
}

function readPersistedCameraPose(storageKey: string | null, storageRevision: number) {
  void storageRevision;
  return readHouse3DViewerCameraPose(storageKey);
}

export function House3DViewer({readOnly = false, open, onOpenChange, canvasRef, activeHouseId, houseIllustrationPort, onDocumentChange}: House3DViewerProps) {
  const {mobile, landscape} = useCanvasMobileViewport();
  const {houseDrawingDocumentPort} = useEditorPorts();
  const {
    houseType,
    hasHouseViews,
    canRenderHouse,
    isProjectionLoading,
    pilotis,
    tipo6FrontSide,
    tipo3OpenSide,
    contraventamentos,
    stairs,
  } = useHouse3DViewerModel({retryProjection: open});
  const cameraPoseStorageKey = useMemo(
    () => getHouse3DViewerCameraPoseStorageKey(activeHouseId),
    [activeHouseId],
  );
  const viewerPreferencesStorageKey = useMemo(
    () => getHouse3DViewerPreferencesStorageKey(activeHouseId),
    [activeHouseId],
  );
  const doorFace = useMemo(
    () => resolveHouse3DDoorFace(houseType, tipo6FrontSide, tipo3OpenSide),
    [houseType, tipo3OpenSide, tipo6FrontSide],
  );
  const lightingPreset = useMemo(
    () => createHouse3DDoorFacingLightingPreset(doorFace),
    [doorFace],
  );

  const {
    resetKey,
    isFullscreen,
    wallColor,
    handleWallColorChange,
    hideBelowTerrain,
    setHideBelowTerrain,
    isSceneReady,
    clearSceneReadiness,
    isGeneratingIllustration,
    hasPendingIllustration,
    handleCanvasCreated,
    registerCameraPoseReader,
    handleReset,
    toggleFullscreen,
    handleClose,
    handleDialogOpenChange,
    handleInsertOnCanvas,
  } = useHouse3DViewerActions({
    readOnly,
    houseType,
    hasHouseViews,
    doorFace,
    onOpenChange,
    canvasRef,
    cameraPoseStorageKey,
    viewerPreferencesStorageKey,
    houseIllustrationPort,
    viewer3DPort: houseDrawingDocumentPort,
    onDocumentChange,
  });
  const persistedCameraPose = useMemo(
    () => {
      const savedViewer3D = houseDrawingDocumentPort.getViewer3D?.();
      return savedViewer3D
        ? savedViewer3D.cameraPose
        : readPersistedCameraPose(cameraPoseStorageKey, resetKey);
    },
    [cameraPoseStorageKey, houseDrawingDocumentPort, resetKey],
  );

  useEffect(() => {
    if (!open || canRenderHouse) return;
    clearSceneReadiness();
  }, [canRenderHouse, clearSceneReadiness, open]);

  const dialogClass = isFullscreen
    ? 'max-w-none w-[calc(100vw-16px)] h-[calc(100dvh-16px)]'
    : landscape
      ? 'max-w-none w-[50vw] h-[calc(100dvh-16px)]'
      : 'max-w-3xl w-[calc(100vw-16px)] h-[70dvh]';

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        hideCloseButton
        data-rac-expanded={isFullscreen}
        className={`p-0 gap-0 flex min-h-0 min-w-0 max-h-[calc(100dvh-16px)] flex-col overflow-hidden rounded-lg ${dialogClass}`}
      >
        <ModalFrame contentClassName='flex flex-col' header={<DialogHeader className='text-left'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <DialogTitle className='text-lg font-semibold'>
              Visualizador 3D
            </DialogTitle>
            <div className='flex flex-wrap gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    title='Cor das Paredes'
                    disabled={readOnly || !isSceneReady}
                  >
                    <FontAwesomeIcon icon={faPalette}/>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='rac-theme w-auto p-3' side='bottom' align='end'>
                  <p className='text-xs font-medium mb-2 text-muted-foreground'>Cor das paredes</p>
                  <div className='grid grid-cols-4 gap-1.5'>
                    {HOUSE_3D_WALL_COLOR_OPTIONS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        className={`w-7 h-7 rounded border-2 transition-all ${wallColor === colorOption.value ? 'border-primary scale-110' : 'border-border hover:border-primary/50'}`}
                        style={{backgroundColor: colorOption.value}}
                        title={colorOption.name}
                        onClick={() => handleWallColorChange(colorOption.value)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant={hideBelowTerrain ? 'default' : 'outline'}
                size='icon'
                onClick={() => setHideBelowTerrain((previous) => !previous)}
                title={hideBelowTerrain ? 'Mostrar abaixo do terreno' : 'Ocultar abaixo do terreno'}
                disabled={!isSceneReady}
              >
                <FontAwesomeIcon icon={faEyeSlash}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                title={isGeneratingIllustration
                  ? 'Preparando imagem 3D…'
                  : hasPendingIllustration
                    ? 'Inserir imagem 3D no Canvas'
                    : 'Gerar imagem 3D para inserir no Canvas'}
                aria-label={isGeneratingIllustration
                  ? 'Preparando imagem 3D'
                  : hasPendingIllustration
                    ? 'Inserir imagem 3D no Canvas'
                    : 'Gerar imagem 3D para inserir no Canvas'}
                onClick={handleInsertOnCanvas}
                disabled={readOnly || !canRenderHouse || !isSceneReady || isGeneratingIllustration}
              >
                {isGeneratingIllustration ? <Loader2 className='h-4 w-4 animate-spin'/> : <FontAwesomeIcon icon={faCamera}/>}
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={handleReset}
                title='Enquadrar casa'
                aria-label='Enquadrar casa'
                disabled={!isSceneReady}
              >
                <FontAwesomeIcon icon={faRotateRight}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Sair do Fullscreen' : 'Fullscreen'}
                disabled={!isSceneReady}
              >
                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={handleClose}
                title={isGeneratingIllustration ? 'Fechar — a imagem continuará sendo gerada' : 'Fechar'}
                aria-label={isGeneratingIllustration ? 'Fechar; a imagem continuará sendo gerada' : 'Fechar'}
              >
                <FontAwesomeIcon icon={faXmark}/>
              </Button>
            </div>
          </div>
          <DialogDescription className='sr-only'>
            {mobile
              ? 'Arraste para rotacionar • Use dois dedos para zoom e mover'
              : 'Arraste para rotacionar • Scroll para zoom • Shift+arraste para mover'}
          </DialogDescription>
        </DialogHeader>}>

        <div className='relative min-h-0 min-w-0 flex-1 overflow-hidden bg-gradient-to-b from-muted to-muted/50' data-testid='house-3d-viewport'>
          {isProjectionLoading ? (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground'>
              <div className='animate-spin rounded-full h-10 w-10 border-4 border-muted-foreground/20 border-t-primary'/>
              <p className='text-sm animate-pulse'>Carregando a planta da casa…</p>
            </div>
          ) : !canRenderHouse ? (
            <div className='absolute inset-0 flex items-center justify-center text-muted-foreground'>
              <p>Nenhuma casa criada. Adicione uma planta primeiro.</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
                <div className='animate-spin rounded-full h-10 w-10 border-4 border-muted-foreground/20 border-t-primary'/>
                <p className='text-sm text-muted-foreground animate-pulse'>Carregando visualizador 3D...</p>
              </div>
            }>
              <Canvas
                key={resetKey}
                resize={{offsetSize: true}}
                shadows
                gl={{preserveDrawingBuffer: true}}
                onCreated={({gl}) => {
                  handleCanvasCreated(gl.domElement);
                }}
              >
                <House3DViewerCameraRig
                  doorFace={doorFace}
                  persistedPose={persistedCameraPose}
                  onCameraPoseReaderChange={registerCameraPoseReader}
                />

                <ambientLight intensity={0.6}/>
                <directionalLight
                  position={lightingPreset.primaryPosition}
                  intensity={0.8}
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                  shadow-bias={-0.0005}
                  shadow-normalBias={0.03}
                  shadow-camera-near={20}
                  shadow-camera-far={500}
                  shadow-camera-left={-260}
                  shadow-camera-right={260}
                  shadow-camera-top={260}
                  shadow-camera-bottom={-260}
                />
                <directionalLight
                  position={lightingPreset.fillPosition}
                  intensity={0.3}
                />

                <House3DScene
                  houseType={houseType}
                  pilotis={pilotis}
                  contraventamentos={contraventamentos}
                  stairs={stairs}
                  wallColor={wallColor}
                  tipo6FrontSide={tipo6FrontSide}
                  tipo3OpenSide={tipo3OpenSide}
                  hideBelowTerrain={hideBelowTerrain}
                />

              </Canvas>
            </Suspense>
          )}
        </div>
        </ModalFrame>
      </DialogContent>
    </Dialog>
  );
}
