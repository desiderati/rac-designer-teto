import { useState, useEffect } from 'react';
import { FabricObject, IText, Canvas as FabricCanvas, Group, Line, Rect, Triangle } from 'fabric';
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

const COLOR_PALETTE = [
  { name: 'Preto', value: '#000000' },
  { name: 'Vermelho', value: '#e74c3c' },
  { name: 'Azul', value: '#3498db' },
  { name: 'Verde', value: '#27ae60' },
  { name: 'Laranja', value: '#e67e22' },
  { name: 'Roxo', value: '#8e44ad' },
  { name: 'Marrom', value: '#795548' },
  { name: 'Rosa', value: '#e91e63' },
  { name: 'Cinza', value: '#7f8c8d' },
  { name: 'Amarelo', value: '#f1c40f' },
];

export interface LineArrowSelection {
  object: FabricObject;
  myType: 'line' | 'arrow';
  currentColor: string;
  currentLabel: string;
  screenPosition: { x: number; y: number };
}

interface LineArrowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selection: LineArrowSelection | null;
  canvas: FabricCanvas | null;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onValueChange: (newLabel: string, newColor: string) => void;
}

export function LineArrowEditor({
  isOpen,
  onClose,
  selection,
  canvas,
  isMobile,
  anchorPosition,
  onValueChange,
}: LineArrowEditorProps) {
  const [tempLabel, setTempLabel] = useState('');
  const [tempColor, setTempColor] = useState('#000000');

  useEffect(() => {
    if (selection) {
      setTempLabel(selection.currentLabel);
      setTempColor(selection.currentColor);
    }
  }, [selection, isOpen]);

  const handleApply = () => {
    if (!selection || !canvas) return;

    const obj = selection.object;
    const color = tempColor;
    const label = tempLabel.trim();

    // Apply color
    if (selection.myType === 'line') {
      (obj as Line).set({ stroke: color });
    } else if (selection.myType === 'arrow') {
      const group = obj as Group;
      const objects = group.getObjects();
      objects.forEach((child: any) => {
        if (child.type === 'rect') {
          child.set({ fill: color });
        }
        if (child.type === 'triangle') {
          child.set({ fill: color });
        }
      });
    }

    // Handle label: find existing or create new
    const existingLabel = canvas.getObjects().find(
      (o: any) => o.myType === 'lineArrowLabel' && o.labelFor === obj
    ) as IText | undefined;

    if (label) {
      if (existingLabel) {
        existingLabel.set({ text: label, fill: color });
      } else {
        const objCenter = obj.getCenterPoint();
        const textLabel = new IText(label, {
          fontSize: 14,
          fontFamily: 'Arial',
          fill: color,
          left: objCenter.x,
          top: objCenter.y - 20,
          originX: 'center',
          originY: 'center',
          editable: false,
          selectable: true,
          backgroundColor: 'rgba(255,255,255,0.8)',
        });
        (textLabel as any).myType = 'lineArrowLabel';
        (textLabel as any).labelFor = obj;
        canvas.add(textLabel);
      }
    } else if (existingLabel) {
      canvas.remove(existingLabel);
    }

    canvas.requestRenderAll();
    onValueChange(label, color);
    onClose();
  };

  const editorContent = (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Texto</label>
        <Input
          value={tempLabel}
          onChange={(e) => setTempLabel(e.target.value)}
          placeholder="Ex: 5m, limite, etc."
          className="h-9"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Cor</label>
        <div className="grid grid-cols-5 gap-2">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c.value}
              onClick={() => setTempColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                tempColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>
      <Button onClick={handleApply} size="sm" className="w-full">
        Aplicar
      </Button>
    </div>
  );

  if (!isOpen || !selection) return null;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {selection.myType === 'line' ? 'Editar Linha Reta' : 'Editar Seta Simples'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">{editorContent}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Popover
  const popoverX = anchorPosition?.x ?? 0;
  const popoverY = anchorPosition?.y ?? 0;

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <div
          className="fixed w-0 h-0"
          style={{ left: popoverX, top: popoverY }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64" side="right" align="center">
        <div className="text-sm font-semibold mb-2">
          {selection.myType === 'line' ? 'Editar Linha Reta' : 'Editar Seta Simples'}
        </div>
        {editorContent}
      </PopoverContent>
    </Popover>
  );
}
