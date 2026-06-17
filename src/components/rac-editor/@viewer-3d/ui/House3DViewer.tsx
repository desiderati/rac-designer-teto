import {Suspense, useEffect} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
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
import {House3DDefaultCamera} from '@/components/rac-editor/@viewer-3d/ui/House3DDefaultCamera.tsx';
import type {RefObject} from 'react';
import {HOUSE_3D_WALL_COLOR_OPTIONS} from '@/shared/config.ts';
import {useHouse3DViewerModel} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerModel.ts';
import {useHouse3DViewerActions} from '@/components/rac-editor/@viewer-3d/hooks/useHouse3DViewerActions.ts';
import type {CanvasSnapshotHandle} from '@/components/rac-editor/@canvas/ports/CanvasSnapshotHandle.ts';
import {
  HOUSE_3D_CAMERA_TARGET,
} from '@/components/rac-editor/@viewer-3d/lib/constants.ts';

interface House3DViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: RefObject<CanvasSnapshotHandle | null>;
}

export function House3DViewer({open, onOpenChange, canvasRef}: House3DViewerProps) {
  const {
    houseType,
    hasHouseViews,
    canRenderHouse,
    pilotis,
    tipo6FrontSide,
    tipo3OpenSide,
    contraventamentos,
    stairs,
  } = useHouse3DViewerModel();

  const {
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
  } = useHouse3DViewerActions({
    houseType,
    hasHouseViews,
    onOpenChange,
    canvasRef,
  });

  useEffect(() => {
    if (!open || canRenderHouse) return;
    clearSceneReadiness();
  }, [canRenderHouse, clearSceneReadiness, open]);

  const dialogClass = isFullscreen
    ? 'max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh]'
    : 'max-w-3xl w-full h-[70vh] max-h-[70vh]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={`p-0 gap-0 flex flex-col ${dialogClass}`}
      >
        <DialogHeader className='p-4 pb-2 border-b'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-lg font-semibold'>
              Visualizador 3D
            </DialogTitle>
            <div className='flex gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    title='Cor das Paredes'
                    disabled={!isSceneReady}
                  >
                    <FontAwesomeIcon icon={faPalette}/>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-3' side='bottom' align='end'>
                  <p className='text-xs font-medium mb-2 text-muted-foreground'>Cor das paredes</p>
                  <div className='grid grid-cols-4 gap-1.5'>
                    {HOUSE_3D_WALL_COLOR_OPTIONS.map((colorOption) => (
                      <button
                        key={colorOption.value}
                        className={`w-7 h-7 rounded border-2 transition-all ${wallColor === colorOption.value ? 'border-primary scale-110' : 'border-border hover:border-primary/50'}`}
                        style={{backgroundColor: colorOption.value}}
                        title={colorOption.name}
                        onClick={() => setWallColor(colorOption.value)}
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
                title='Inserir no Canvas'
                onClick={handleInsertOnCanvas}
                disabled={!canRenderHouse || !isSceneReady}
              >
                <FontAwesomeIcon icon={faCamera}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={handleReset}
                title='Resetar Câmera'
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
                title='Fechar'
              >
                <FontAwesomeIcon icon={faXmark}/>
              </Button>
            </div>
          </div>
          <DialogDescription className='text-sm text-muted-foreground'>
            Arraste para rotacionar • Scroll para zoom • Shift+arraste para mover
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 bg-gradient-to-b from-muted to-muted/50 relative' style={{minHeight: '400px'}}>
          {!canRenderHouse ? (
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
                shadows
                gl={{preserveDrawingBuffer: true}}
                onCreated={({gl}) => {
                  handleCanvasCreated(gl.domElement);
                }}
              >
                <House3DDefaultCamera/>

                <ambientLight intensity={0.6}/>
                <directionalLight
                  position={[50, 100, 50]}
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
                  position={[-50, 50, -50]}
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

                <OrbitControls
                  enablePan
                  enableZoom
                  enableRotate
                  minDistance={80}
                  maxDistance={700}
                  target={HOUSE_3D_CAMERA_TARGET}
                />
              </Canvas>
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
