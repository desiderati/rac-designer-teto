import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faExpand, faCompress, faXmark, faPalette, faCamera } from '@fortawesome/free-solid-svg-icons';
import { House3DScene, Contraventamento3DData } from './House3DScene';
import { houseManager, HouseType, PilotiData, HouseElement } from '@/lib/house-manager';
import { toast } from 'sonner';

const WALL_COLORS = [
  { name: 'Terracota', value: '#c4967a' },
  { name: 'Bege', value: '#d4b896' },
  { name: 'Cinza', value: '#d4d4d4' },
  { name: 'Branco', value: '#f0f0f0' },
  { name: 'Azul', value: '#a8c4d8' },
  { name: 'Verde', value: '#b8d4b8' },
  { name: 'Rosa', value: '#e0b8b8' },
  { name: 'Amarelo', value: '#f5e6a3' },
];

interface House3DViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function House3DViewer({ open, onOpenChange }: House3DViewerProps) {
  const [houseType, setHouseType] = useState<HouseType>(null);
  const [pilotis, setPilotis] = useState<Record<string, PilotiData>>({});
  const [elements, setElements] = useState<HouseElement[]>([]);
  const [tipo3OpenSide, setTipo3OpenSide] = useState<'left' | 'right' | null>(null);
  const [contraventamentos, setContraventamentos] = useState<Contraventamento3DData[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wallColor, setWallColor] = useState('#a8c4d8');
  const webglCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with HouseManager
  const syncFromManager = useCallback(() => {
    const house = houseManager.getHouse();
    if (!house) {
      setHouseType(null);
      setPilotis({});
      setElements([]);
      setTipo3OpenSide(null);
      setContraventamentos([]);
      return;
    }

    setHouseType(house.houseType);
    setPilotis({ ...house.pilotis });
    setElements([...houseManager.getElements()]);
    if (house.houseType === 'tipo3') {
      // 3D scene lateral axis is mirrored relative to 2D side assignments.
      // Keep "quadrado aberto" (side2) on the same semantic side selected in canvas.
      const openSide: 'left' | 'right' | null =
        house.sideAssignments.left === 'side2' ? 'right' :
          house.sideAssignments.right === 'side2' ? 'left' :
            null;
      setTipo3OpenSide(openSide);
    } else {
      setTipo3OpenSide(null);
    }

    const topGroup = house.views.top[0]?.group;
    const parsedContraventamentos: Contraventamento3DData[] = [];

    topGroup?.getObjects().forEach((obj: any, index: number) => {
      if (!obj?.isContraventamento) return;

      const col = Number(obj.contraventamentoCol);
      const startRowRaw = Number(obj.contraventamentoStartRow);
      const endRowRaw = Number(obj.contraventamentoEndRow);
      if (!Number.isInteger(col) || col < 0 || col > 3) return;
      if (!Number.isInteger(startRowRaw) || !Number.isInteger(endRowRaw)) return;

      const startRow = Math.min(startRowRaw, endRowRaw);
      const endRow = Math.max(startRowRaw, endRowRaw);
      if (startRow === endRow || startRow < 0 || endRow > 2) return;

      const side = obj.contraventamentoSide === 'left' || obj.contraventamentoSide === 'right'
        ? obj.contraventamentoSide
        : 'right';
      const anchorPilotiId = typeof obj.contraventamentoAnchorPilotiId === 'string' && obj.contraventamentoAnchorPilotiId
        ? obj.contraventamentoAnchorPilotiId
        : `piloti_${col}_${startRow}`;
      const id = String(obj.contraventamentoId ?? `contrav_3d_${index}`);
      parsedContraventamentos.push({ id, col, startRow, endRow, side, anchorPilotiId });
    });

    setContraventamentos(parsedContraventamentos);
  }, []);

  // Subscribe to HouseManager changes
  useEffect(() => {
    if (!open) return;
    
    // Initial sync
    syncFromManager();
    
    // Subscribe to changes - sync é chamado automaticamente quando pilotis mudam
    const unsubscribe = houseManager.subscribe(() => {
      // Re-sync sempre que HouseManager notificar mudanças
      syncFromManager();
    });
    
    return () => {
      unsubscribe();
    };
  }, [open, syncFromManager]);

  const handleReset = () => {
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
      toast.error('Nenhuma casa 3D para inserir.');
      return;
    }

    const webglCanvas = webglCanvasRef.current;
    if (!webglCanvas) {
      toast.error('Canvas 3D não disponível.');
      return;
    }

    try {
      const dataUrl = webglCanvas.toDataURL('image/png');
      const inserted = await houseManager.insert3DSnapshotOnCanvas(dataUrl);
      if (inserted) {
        toast.success('Visão 3D inserida no canvas.');
      } else {
        toast.error('Não foi possível inserir no canvas.');
      }
    } catch (error) {
      console.error('[House3DViewer] Failed to capture 3D screenshot:', error);
      toast.error('Falha ao capturar a imagem 3D.');
    }
  }, [houseType]);

  // Fixed dialog dimensions
  const dialogClass = isFullscreen 
    ? 'max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh]' 
    : 'max-w-3xl w-full h-[70vh] max-h-[70vh]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton 
        className={`p-0 gap-0 flex flex-col ${dialogClass}`}
      >
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Visualizador 3D
            </DialogTitle>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Cor das Paredes"
                  >
                    <FontAwesomeIcon icon={faPalette} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" side="bottom" align="end">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Cor das Paredes</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {WALL_COLORS.map((c) => (
                      <button
                        key={c.value}
                        className={`w-7 h-7 rounded border-2 transition-all ${wallColor === c.value ? 'border-primary scale-110' : 'border-border hover:border-primary/50'}`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                        onClick={() => setWallColor(c.value)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                title="Inserir no Canvas"
                onClick={handleInsertOnCanvas}
                disabled={!houseType}
              >
                <FontAwesomeIcon icon={faCamera} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                title="Resetar Câmera"
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Sair do Fullscreen' : 'Fullscreen'}
              >
                <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                title="Fechar"
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Arraste para rotacionar • Scroll para zoom • Shift+Arraste para mover
          </p>
        </DialogHeader>

        <div className="flex-1 bg-gradient-to-b from-muted to-muted/50 relative" style={{ minHeight: '400px' }}>
          {!houseType ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>Nenhuma casa criada. Adicione uma planta primeiro.</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }>
              <Canvas
                key={resetKey}
                shadows
                gl={{ preserveDrawingBuffer: true }}
                onCreated={({ gl }) => {
                  webglCanvasRef.current = gl.domElement;
                }}
              >
                <PerspectiveCamera 
                  makeDefault 
                  position={[200, 180, 280]} 
                  fov={45} 
                />
                
                {/* Lighting */}
                <ambientLight intensity={0.6} />
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
                  elements={elements}
                  contraventamentos={contraventamentos}
                  wallColor={wallColor}
                  tipo3OpenSide={tipo3OpenSide}
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
