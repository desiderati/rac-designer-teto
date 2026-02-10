import { useState, useEffect, useRef, useCallback } from 'react';
import { FabricObject, IText, Canvas as FabricCanvas, Group, Line, Rect, Triangle } from 'fabric';
import { Button } from '@/components/ui/button';
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
  { name: 'Amarelo', value: '#f1c40f' },
  { name: 'Cinza', value: '#7f8c8d' },
  { name: 'Marrom', value: '#795548' },
  { name: 'Roxo', value: '#8e44ad' },
  { name: 'Rosa', value: '#e91e63' },
  { name: 'Laranja', value: '#e67e22' },
];

export type GenericEditorType = 'wall' | 'line' | 'arrow' | 'dimension';

interface GenericEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editorType: GenericEditorType;
  object: FabricObject | null;
  canvas: FabricCanvas | null;
  currentValue: string;
  currentColor: string;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number };
  onApply: (newValue: string, newColor: string) => void;
}

export function GenericEditor({
  isOpen,
  onClose,
  editorType,
  object,
  canvas,
  currentValue,
  currentColor,
  isMobile,
  anchorPosition,
  onApply,
}: GenericEditorProps) {
  const [tempValue, setTempValue] = useState(currentValue);
  const [tempColor, setTempColor] = useState(currentColor);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setTempValue(currentValue);
    setTempColor(currentColor);
    setPanelPos(null);
  }, [currentValue, currentColor, isOpen]);

  const handleApply = () => {
    onApply(tempValue.trim(), tempColor);
    onClose();
  };

  const handleCancel = () => {
    setTempValue(currentValue);
    setTempColor(currentColor);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  // Dragging logic for desktop panel
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    const currentPos = panelPos || {
      x: (anchorPosition?.x ?? 200) + 10,
      y: (anchorPosition?.y ?? 200) - 60,
    };
    dragOffset.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPanelPos({
        x: ev.clientX - dragOffset.current.x,
        y: ev.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelPos, anchorPosition]);

  const getTitle = (): string => {
    switch (editorType) {
      case 'wall': return 'Editar Objeto';
      case 'dimension': return 'Editar Distância';
      case 'line': return 'Editar Linha Reta';
      case 'arrow': return 'Editar Seta Simples';
    }
  };

  const getPlaceholder = (): string => {
    switch (editorType) {
      case 'wall': return 'Ex.: Vizinho, Muro, etc.';
      case 'dimension': return 'Ex.: 1,0 m';
      case 'line': return 'Ex: 5m, limite, etc.';
      case 'arrow': return 'Ex: 5m, limite, etc.';
    }
  };

  if (!isOpen) return null;

  const title = getTitle();

  const editorContent = (
    <div className="flex flex-col gap-3">
      <Input
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-center placeholder:text-muted-foreground/50"
        placeholder={getPlaceholder()}
        autoFocus
      />
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
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button size="sm" className="flex-1" onClick={handleApply}>
          Aplicar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">{editorContent}</div>
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Draggable floating panel
  const pos = panelPos || {
    x: (anchorPosition?.x ?? 200) + 10,
    y: (anchorPosition?.y ?? 200) - 60,
  };

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl min-w-[220px]"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Draggable header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="p-3 pt-0">
        {editorContent}
      </div>
    </div>
  );
}
