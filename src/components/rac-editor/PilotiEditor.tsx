import { useState, useEffect } from 'react';
import { Group } from 'fabric';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { 
  PILOTI_HEIGHTS, 
  updatePilotiAll, 
  formatPilotiHeight, 
  getPilotiName, 
  getAdjacentPilotiId,
  getPilotiFromGroup,
  getAllPilotiIds
} from '@/lib/canvas-utils';

interface PilotiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  currentIsMaster?: boolean;
  currentNivel?: number;
  group: Group | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number, isMaster: boolean, nivel: number) => void;
}

export function PilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  currentIsMaster = false,
  currentNivel = 0.3,
  group,
  isMobile,
  anchorPosition,
  onHeightChange,
  onNavigate,
}: PilotiEditorProps) {
  const [tempHeight, setTempHeight] = useState(currentHeight);
  const [tempIsMaster, setTempIsMaster] = useState(currentIsMaster);
  const [tempNivel, setTempNivel] = useState(currentNivel);

  useEffect(() => {
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
  }, [currentHeight, currentIsMaster, currentNivel, isOpen, pilotiId]);

  const pilotiName = pilotiId ? getPilotiName(pilotiId) : '';
  const allIds = getAllPilotiIds();
  const currentIndex = pilotiId ? allIds.indexOf(pilotiId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allIds.length - 1 && currentIndex >= 0;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!pilotiId || !group) return;
    
    const newId = getAdjacentPilotiId(pilotiId, direction);
    if (!newId) return;
    
    // Apply current changes before navigating
    if (tempHeight !== currentHeight || tempIsMaster !== currentIsMaster || tempNivel !== currentNivel) {
      updatePilotiAll(group, pilotiId, tempHeight, tempIsMaster, tempNivel);
      onHeightChange(tempHeight);
    }
    
    // Get new piloti data
    const pilotiData = getPilotiFromGroup(group, newId);
    if (pilotiData && onNavigate) {
      onNavigate(newId, pilotiData.height, pilotiData.isMaster, pilotiData.nivel);
      setTempHeight(pilotiData.height);
      setTempIsMaster(pilotiData.isMaster);
      setTempNivel(pilotiData.nivel);
    }
  };

  const handleApply = () => {
    if (group && pilotiId) {
      updatePilotiAll(group, pilotiId, tempHeight, tempIsMaster, tempNivel);
      onHeightChange(tempHeight);
    }
    onClose();
  };

  const handleCancel = () => {
    setTempHeight(currentHeight);
    setTempIsMaster(currentIsMaster);
    setTempNivel(currentNivel);
    onClose();
  };

  const handleNivelChange = (value: string) => {
    // Allow comma as decimal separator
    const normalized = value.replace(',', '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && num >= 0) {
      setTempNivel(num);
    }
  };

  const NavigationHeader = () => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate('prev')}
        disabled={!hasPrev}
        className="h-8 w-8"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
      </Button>
      
      <span className="font-bold text-2xl min-w-[80px] text-center">
        Piloti {pilotiName}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate('next')}
        disabled={!hasNext}
        className="h-8 w-8"
      >
        <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
      </Button>
    </div>
  );

  const HeightControls = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-2">
      <Label className={compact ? "text-sm font-medium" : "text-base font-medium"}>Altura do piloti</Label>
      <div className={compact ? "flex gap-1 flex-wrap justify-center" : "flex gap-1.5 justify-center"}>
        {PILOTI_HEIGHTS.map((h) => (
          <Button
            key={h}
            variant={tempHeight === h ? 'default' : 'outline'}
            size={compact ? "sm" : "default"}
            onClick={() => setTempHeight(h)}
            className={compact ? "min-w-[40px] h-8 text-xs" : "flex-1 px-1 text-base"}
          >
            {formatPilotiHeight(h)}
          </Button>
        ))}
      </div>
    </div>
  );

  const MasterControls = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="is-master" className={compact ? "text-sm font-medium" : "text-base font-medium"}>
          Definir piloti como mestre?
        </Label>
        <Switch
          id="is-master"
          checked={tempIsMaster}
          onCheckedChange={setTempIsMaster}
        />
      </div>
      
      {tempIsMaster && (
        <div className="pl-2 border-l-2 border-primary/30">
          <div className="flex items-center gap-2">
            <Input
              id="nivel"
              type="text"
              value={formatPilotiHeight(tempNivel)}
              onChange={(e) => handleNivelChange(e.target.value)}
              className={compact ? "w-20 text-center" : "w-24 text-center text-base"}
              placeholder="0,30"
            />
            <div className="flex flex-col">
              <Label htmlFor="nivel" className={compact ? "text-sm font-medium whitespace-nowrap" : "text-base font-medium whitespace-nowrap"}>
                Nível do mestre (m)
              </Label>
              <p className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
                Parte visível acima do terreno
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              <NavigationHeader />
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-6">
            <MasterControls />
            <HeightControls />
          </div>
          <DrawerFooter className="flex-row gap-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancelar
              </Button>
            </DrawerClose>
            <Button className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <PopoverTrigger asChild>
        <div
          className="fixed pointer-events-none"
          style={{
            left: anchorPosition?.x ?? 0,
            top: anchorPosition?.y ?? 0,
            width: 1,
            height: 1,
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-popover min-w-[280px]" side="right" align="center">
        <div className="space-y-4">
          <NavigationHeader />
          
          <MasterControls compact />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Altura do piloti</Label>
            <div className="flex gap-1 flex-wrap justify-center">
              {PILOTI_HEIGHTS.map((h) => (
                <Button
                  key={h}
                  variant={tempHeight === h ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTempHeight(h)}
                  className="min-w-[40px] h-8 text-xs"
                >
                  {formatPilotiHeight(h)}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
