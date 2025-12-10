import { useState, useEffect } from 'react';
import { Group } from 'fabric';
import { Minus, Plus } from 'lucide-react';
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
import { PILOTI_HEIGHTS, updatePilotiHeight, formatPilotiHeight } from '@/lib/canvas-utils';

interface PilotiEditorProps {
  isOpen: boolean;
  onClose: () => void;
  pilotiId: string | null;
  currentHeight: number;
  group: Group | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onHeightChange: (newHeight: number) => void;
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
}: PilotiEditorProps) {
  const [tempHeight, setTempHeight] = useState(currentHeight);

  useEffect(() => {
    setTempHeight(currentHeight);
  }, [currentHeight, isOpen]);

  const handleIncrement = () => {
    const currentIndex = PILOTI_HEIGHTS.indexOf(tempHeight);
    if (currentIndex < PILOTI_HEIGHTS.length - 1) {
      setTempHeight(PILOTI_HEIGHTS[currentIndex + 1]);
    }
  };

  const handleDecrement = () => {
    const currentIndex = PILOTI_HEIGHTS.indexOf(tempHeight);
    if (currentIndex > 0) {
      setTempHeight(PILOTI_HEIGHTS[currentIndex - 1]);
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

  const HeightControls = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={tempHeight === PILOTI_HEIGHTS[0]}
          className="h-12 w-12"
        >
          <Minus className="h-6 w-6" />
        </Button>
        
        <div className="text-4xl font-bold min-w-[100px] text-center">
          {formatPilotiHeight(tempHeight)} m
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={tempHeight === PILOTI_HEIGHTS[PILOTI_HEIGHTS.length - 1]}
          className="h-12 w-12"
        >
          <Plus className="h-6 w-6" />
        </Button>
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
            <DrawerTitle>Altura do Piloti</DrawerTitle>
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
          <h4 className="font-medium text-sm text-center">Altura do Piloti</h4>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={tempHeight === PILOTI_HEIGHTS[0]}
              className="h-10 w-10"
            >
              <Minus className="h-5 w-5" />
            </Button>
            
            <div className="text-2xl font-bold min-w-[80px] text-center">
              {formatPilotiHeight(tempHeight)} m
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={tempHeight === PILOTI_HEIGHTS[PILOTI_HEIGHTS.length - 1]}
              className="h-10 w-10"
            >
              <Plus className="h-5 w-5" />
            </Button>
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
