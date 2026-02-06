import { Suspense, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { House3DScene } from './House3DScene';
import { houseManager, HouseType, PilotiData } from '@/lib/house-manager';

interface House3DViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function House3DViewer({ open, onOpenChange }: House3DViewerProps) {
  const [houseType, setHouseType] = useState<HouseType>(null);
  const [pilotis, setPilotis] = useState<Record<string, PilotiData>>({});
  const [resetKey, setResetKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync with HouseManager
  const syncFromManager = useCallback(() => {
    const house = houseManager.getHouse();
    if (house) {
      setHouseType(house.houseType);
      setPilotis({ ...house.pilotis });
    }
  }, []);

  // Subscribe to HouseManager changes
  useEffect(() => {
    if (!open) return;
    
    // Initial sync
    syncFromManager();
    
    // Subscribe to changes
    const unsubscribe = houseManager.subscribe(syncFromManager);
    
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`p-0 gap-0 ${isFullscreen ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-3xl w-full h-[70vh]'}`}
      >
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Visualizador 3D
            </DialogTitle>
            <div className="flex gap-2">
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
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Arraste para rotacionar • Scroll para zoom • Shift+Arraste para mover
          </p>
        </DialogHeader>

        <div className="flex-1 bg-gradient-to-b from-sky-100 to-sky-200 relative" style={{ minHeight: '400px' }}>
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
              <Canvas key={resetKey} shadows>
                <PerspectiveCamera 
                  makeDefault 
                  position={[150, 120, 200]} 
                  fov={50} 
                />
                
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight 
                  position={[50, 100, 50]} 
                  intensity={0.8} 
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                />
                <directionalLight 
                  position={[-50, 50, -50]} 
                  intensity={0.3} 
                />
                
                {/* Scene */}
                <House3DScene houseType={houseType} pilotis={pilotis} />
                
                {/* Controls */}
                <OrbitControls 
                  enablePan 
                  enableZoom 
                  enableRotate
                  minDistance={50}
                  maxDistance={500}
                  target={[0, 40, 0]}
                />
              </Canvas>
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
