import { useState, useEffect } from 'react';
import { FabricObject, IText, Canvas as FabricCanvas, Group } from 'fabric';
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

interface ObjectNameEditorProps {
  isOpen: boolean;
  onClose: () => void;
  object: FabricObject | null;
  canvas: FabricCanvas | null;
  currentValue: string;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onValueChange: (newValue: string) => void;
}

export function ObjectNameEditor({
  isOpen,
  onClose,
  object,
  canvas,
  currentValue,
  isMobile,
  anchorPosition,
  onValueChange,
}: ObjectNameEditorProps) {
  const [tempValue, setTempValue] = useState(currentValue);

  useEffect(() => {
    setTempValue(currentValue);
  }, [currentValue, isOpen]);

  const handleApply = () => {
    if (object && canvas) {
      const name = tempValue.trim();
      
      // Check if the object is already in a group with a label
      const parentGroup = (object as any)._group as Group | undefined;
      const existingLabel = parentGroup?.getObjects().find(
        (obj: any) => obj.myType === 'wallLabel'
      ) as IText | undefined;
      
      if (parentGroup && existingLabel) {
        // Update existing label in group
        if (name) {
          existingLabel.set('text', name);
          parentGroup.setCoords();
        } else {
          // Remove label from group - ungroup and remove label
          const groupLeft = parentGroup.left || 0;
          const groupTop = parentGroup.top || 0;
          
          canvas.remove(parentGroup);
          object.set({
            left: groupLeft,
            top: groupTop,
          });
          object.setCoords();
          canvas.add(object);
        }
      } else if (name && !parentGroup) {
        // Create new label and group it with the object
        const objCenter = object.getCenterPoint();
        
        const label = new IText(name, {
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#333333',
          originX: 'center',
          originY: 'center',
          textAlign: 'center',
          selectable: false,
          evented: false,
        });
        
        (label as any).myType = 'wallLabel';
        
        // Remove object from canvas before grouping
        canvas.remove(object);
        
        // Reset object position to origin for grouping
        const objLeft = object.left || 0;
        const objTop = object.top || 0;
        object.set({ left: 0, top: 0, originX: 'center', originY: 'center' });
        
        // Position label below the object
        const objHeight = object.height || 0;
        const objScaleY = object.scaleY || 1;
        label.set({ left: 0, top: (objHeight * objScaleY) / 2 + 12 });
        
        // Create group
        const group = new Group([object, label], {
          left: objLeft,
          top: objTop,
          originX: 'center',
          originY: 'center',
        });
        
        // Preserve object properties on group
        (group as any).myType = (object as any).myType;
        (group as any).pilotiId = (object as any).pilotiId;
        (group as any).wallId = (object as any).wallId;
        
        canvas.add(group);
        canvas.setActiveObject(group);
      }
      
      canvas.renderAll();
      onValueChange(name);
    }
    onClose();
  };

  const handleCancel = () => {
    setTempValue(currentValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  const EditorContent = () => (
    <div className="space-y-4">
      <Input
        id="object-name-value"
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-center placeholder:text-muted-foreground/50"
        placeholder="Ex.: Vizinho, Muro, etc."
        autoFocus
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">Definir Nome do Objeto</DrawerTitle>
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
          <h3 className="font-bold text-lg text-center">Definir Nome do Objeto</h3>
          
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
