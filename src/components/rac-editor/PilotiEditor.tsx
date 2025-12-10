import { useState, useEffect } from 'react';
import { Group } from 'fabric';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  updatePilotiHeight, 
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
  group: Group | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onHeightChange: (newHeight: number) => void;
  onNavigate?: (pilotiId: string, height: number) => void;
}

export function PilotiEditor({
  isOpen,
  onClose,
  pilotiId,
  currentHeight,
  group,
  isMobile,
  anchorPosition,
  onHeightChange,
  onNavigate,
}: PilotiEditorProps) {
  const [tempHeight, setTempHeight] = useState(currentHeight);

  useEffect(() => {
    setTempHeight(currentHeight);
  }, [currentHeight, isOpen, pilotiId]);

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
    if (tempHeight !== currentHeight) {
      updatePilotiHeight(group, pilotiId, tempHeight);
      onHeightChange(tempHeight);
    }
    
    // Get new piloti data
    const pilotiData = getPilotiFromGroup(group, newId);
    if (pilotiData && onNavigate) {
      onNavigate(newId, pilotiData.height);
      setTempHeight(pilotiData.height);
    }
  };

  const handleApply = () => {
    if (group && pilotiId) {
      updatePilotiHeight(group, pilotiId, tempHeight);
      onHeightChange(tempHeight);
    }
    onClose();
  };

  const handleCancel = () => {
    setTempHeight(currentHeight);
    onClose();
  };

  const NavigationHeader = () => (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleNavigate('prev')}
        disabled={!hasPrev}
        className="h-8 w-8"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
      </Button>
      
      <span className="font-medium text-lg min-w-[80px] text-center">
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

  const HeightControls = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="text-3xl font-bold text-center">
        {formatPilotiHeight(tempHeight)} m
      </div>
      
      <div className="flex gap-2 flex-wrap justify-center">
        {PILOTI_HEIGHTS.map((h) => (
          <Button
            key={h}
            variant={tempHeight === h ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTempHeight(h)}
            className="min-w-[50px]"
          >
            {formatPilotiHeight(h)}
          </Button>
        ))}
      </div>
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
          <div className="p-4">
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
      <PopoverContent className="w-auto p-4 bg-popover" side="right" align="center">
        <div className="space-y-4">
          <NavigationHeader />
          
          <div className="text-2xl font-bold text-center">
            {formatPilotiHeight(tempHeight)} m
          </div>
          
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
