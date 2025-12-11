import { useState, useEffect } from 'react';
import { Group, IText } from 'fabric';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface DistanceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  currentValue: string;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onValueChange: (newValue: string) => void;
}

export function DistanceEditor({
  isOpen,
  onClose,
  group,
  currentValue,
  isMobile,
  anchorPosition,
  onValueChange,
}: DistanceEditorProps) {
  const [tempValue, setTempValue] = useState(currentValue);

  useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue, isOpen]);

  const handleApply = () => {
    if (group) {
      // Update the IText in the group (it's the 4th element, index 3)
      const textObj = group.getObjects().find(obj => obj.type === 'i-text') as IText;
      if (textObj) {
        textObj.set('text', tempValue || ' ');
        group.dirty = true;
      }
      onValueChange(tempValue);
    }
    onClose();
  };

  const handleCancel = () => {
    setTempValue(currentValue);
    onClose();
  };

  const EditorContent = () => (
    <div className="space-y-4">
      <Input
        id="distance-value"
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        className="text-center"
        placeholder="Ex: 5,00 m"
        autoFocus
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">Editar Distância</DrawerTitle>
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
      <PopoverContent className="w-auto p-4 bg-popover min-w-[220px]" side="right" align="center">
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">Editar Distância</h3>
          
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
