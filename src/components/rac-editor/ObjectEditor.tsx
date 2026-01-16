import { useState, useEffect } from 'react';
import { FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface ObjectEditorProps {
  isOpen: boolean;
  onClose: () => void;
  object: FabricObject | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onValueChange: () => void;
}

export function ObjectEditor({
  isOpen,
  onClose,
  object,
  isMobile,
  anchorPosition,
  onValueChange,
}: ObjectEditorProps) {
  const [tempWidth, setTempWidth] = useState('');
  const [tempHeight, setTempHeight] = useState('');

  useEffect(() => {
    if (object && isOpen) {
      // Get actual dimensions (considering scale)
      const width = (object.width || 0) * (object.scaleX || 1);
      const height = (object.height || 0) * (object.scaleY || 1);
      setTempWidth(width.toFixed(1));
      setTempHeight(height.toFixed(1));
    }
  }, [object, isOpen]);

  const handleApply = () => {
    if (object) {
      const newWidth = parseFloat(tempWidth) || 0;
      const newHeight = parseFloat(tempHeight) || 0;
      
      if (newWidth > 0 && newHeight > 0) {
        // Set the new dimensions (reset scale first)
        object.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
        });
        object.setCoords();
        onValueChange();
      }
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  const getObjectLabel = (): string => {
    const myType = (object as any)?.myType;
    switch (myType) {
      case 'wall': return 'Muro';
      case 'gate': return 'Porta';
      case 'stairs': return 'Escada';
      case 'water': return 'Água';
      case 'tree': return 'Árvore';
      default: return 'Objeto';
    }
  };

  const EditorContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="object-width" className="text-xs text-muted-foreground">
            Largura (px)
          </Label>
          <Input
            id="object-width"
            type="number"
            value={tempWidth}
            onChange={(e) => setTempWidth(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center"
            min="1"
            step="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="object-height" className="text-xs text-muted-foreground">
            Altura (px)
          </Label>
          <Input
            id="object-height"
            type="number"
            value={tempHeight}
            onChange={(e) => setTempHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center"
            min="1"
            step="1"
          />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">Editar {getObjectLabel()}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <EditorContent />
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
      <PopoverContent className="w-auto p-4 bg-popover min-w-[260px]" side="right" align="center">
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Editar {getObjectLabel()}</h3>
          
          <EditorContent />
          
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
