import {Suspense, useCallback, useEffect, useRef, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei';
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
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import {House3DScene} from './House3DScene.tsx';
import {houseManager} from '@/components/rac-editor/lib/house-manager.ts';
import type {HousePiloti, HouseType, HouseViewType} from '@/shared/types/house.ts';
import {useHouseStoreVersion} from '@/components/rac-editor/lib/house-store.ts';
import {
  Contraventamento3DData,
  parseContraventamentosFromTopView
} from '@/components/rac-editor/lib/3d/contraventamento-parser.ts';
import {parseStairsFromElevationViews, Stairs3DData} from '@/components/rac-editor/lib/3d/stairs-parser.ts';
import {toast} from 'sonner';
import {HOUSE_3D_WALL_COLOR_OPTIONS, HOUSE_3D_WALL_COLORS, TOAST_MESSAGES} from '@/shared/config.ts';

interface House3DViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function House3DViewer({open, onOpenChange}: House3DViewerProps) {
  const houseVersion = useHouseStoreVersion();
  const [houseType, setHouseType] = useState<HouseType>(null);
  const [pilotis, setPilotis] = useState<Record<string, HousePiloti>>({});
  const [tipo6FrontSide, setTipo6FrontSide] = useState<'top' | 'bottom' | null>(null);
  const [tipo3OpenSide, setTipo3OpenSide] = useState<'left' | 'right' | null>(null);
  const [contraventamentos, setContraventamentos] = useState<Contraventamento3DData[]>([]);
  const [stairs, setStairs] = useState<Stairs3DData>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState(HOUSE_3D_WALL_COLORS.viewerInitialColor);
  const [hideBelowTerrain, setHideBelowTerrain] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with HouseManager
  const syncFromManager = useCallback(() => {
    const house = houseManager.getHouse();
    if (!house) {
      setHouseType(null);
      setPilotis({});
      setTipo6FrontSide(null);
      setTipo3OpenSide(null);
      setContraventamentos([]);
      setStairs(null);
      return;
    }

    setHouseType(house.houseType);
    setPilotis({...house.pilotis});
    if (house.houseType === 'tipo6') {
      const frontSide: 'top' | 'bottom' | null =
        house.sideMappings.top === 'front' ? 'top' :
          house.sideMappings.bottom === 'front' ? 'bottom' :
            null;
      setTipo6FrontSide(frontSide);
    } else {
      setTipo6FrontSide(null);
    }
    if (house.houseType === 'tipo3') {
      // 3D scene lateral axis is mirrored relative to 2D side assignments.
      // Keep "quadrado aberto" (side2) on the same semantic side selected in canvas.
      const openSide: 'left' | 'right' | null =
        house.sideMappings.left === 'side2' ? 'right' :
          house.sideMappings.right === 'side2' ? 'left' :
            null;
      setTipo3OpenSide(openSide);
    } else {
      setTipo3OpenSide(null);
    }

    const topGroup = house.views.top[0]?.group;
    setContraventamentos(parseContraventamentosFromTopView(topGroup));

    const elevationViews = [
      ...house.views.front.map(
        (view) =>
          ({viewType: 'front' as HouseViewType, group: view.group})
      ),
      ...house.views.back.map(
        (view) =>
          ({viewType: 'back' as HouseViewType, group: view.group})
      ),
      ...house.views.side1.map(
        (view) =>
          ({viewType: 'side1' as HouseViewType, group: view.group})
      ),
      ...house.views.side2.map(
        (view) =>
          ({viewType: 'side2' as HouseViewType, group: view.group})
      ),
    ];

    setStairs(parseStairsFromElevationViews({
      houseType: house.houseType,
      sideMappings: house.sideMappings,
      elevationViews,
    }));
  }, []);

  // Sync from global house state while the viewer is open
  useEffect(() => {
    if (!open) return;
    syncFromManager();
  }, [open, houseVersion, syncFromManager]);

  const handleReset = () => {
    setIsSceneReady(false);
    setResetKey((k) => k + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((f) => !f);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleInsertOnCanvas = useCallback(async () => {
    if (!houseType) {
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
      const inserted = await houseManager.insert3DSnapshotOnCanvas(dataUrl);
      if (inserted) {
        toast.success(TOAST_MESSAGES.house3DInsertedSuccessfully);
      } else {
        toast.error(TOAST_MESSAGES.failedToInsertHouse3DOnCanvas);
      }
    } catch (error) {
      console.error('[House3DViewer] Failed to capture 3D screenshot:', error);
      toast.error(TOAST_MESSAGES.failedToCaptureHouse3DImage);
    }
  }, [houseType]);

  // Fixed dialog dimensions
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
                  >
                    <FontAwesomeIcon icon={faPalette}/>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-3' side='bottom' align='end'>
                  <p className='text-xs font-medium mb-2 text-muted-foreground'>Cor das Paredes</p>
                  <div className='grid grid-cols-4 gap-1.5'>
                    {HOUSE_3D_WALL_COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        className={`w-7 h-7 rounded border-2 transition-all ${wallColor === c.value ? 'border-primary scale-110' : 'border-border hover:border-primary/50'}`}
                        style={{backgroundColor: c.value}}
                        title={c.name}
                        onClick={() => setWallColor(c.value)}
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
              >
                <FontAwesomeIcon icon={faEyeSlash}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                title='Inserir no Canvas'
                onClick={handleInsertOnCanvas}
                disabled={!houseType}
              >
                <FontAwesomeIcon icon={faCamera}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={handleReset}
                title='Resetar Câmera'
              >
                <FontAwesomeIcon icon={faRotateRight}/>
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Sair do Fullscreen' : 'Fullscreen'}
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
            Arraste para rotacionar • Scroll para zoom • Shift+Arraste para mover
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 bg-gradient-to-b from-muted to-muted/50 relative' style={{minHeight: '400px'}}>
          {!houseType ? (
            <div className='absolute inset-0 flex items-center justify-center text-muted-foreground'>
              <p>Nenhuma casa criada. Adicione uma planta primeiro.</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
                <div className='animate-spin rounded-full h-10 w-10 border-4 border-muted-foreground/20 border-t-primary'/>
                <p className='text-sm text-muted-foreground animate-pulse'>Carregando visualizador 3D…</p>
              </div>
            }>
              <Canvas
                key={resetKey}
                shadows
                gl={{preserveDrawingBuffer: true}}
                onCreated={({gl}) => {
                  webglCanvasRef.current = gl.domElement;
                }}
              >
                <PerspectiveCamera
                  makeDefault
                  position={[200, 180, 280]}
                  fov={45}
                />

                {/* Lighting */}
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

                {/* Scene */}
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

                {/* Controls */}
                <OrbitControls
                  enablePan
                  enableZoom
                  enableRotate
                  minDistance={80}
                  maxDistance={700}
                  target={[0, 60, 0]}
                />
              </Canvas>
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

