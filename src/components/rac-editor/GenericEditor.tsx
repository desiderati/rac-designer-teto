import { useState, useEffect, useRef, useCallback } from 'react';
import { FabricObject, IText, Canvas as FabricCanvas, Group, Line, Rect, Triangle } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EditorTypeIcon } from './EditorTypeIcon';

const COLOR_PALETTE = [
  { name: 'Vermelho', value: '#e74c3c' },
  { name: 'Azul', value: '#3498db' },
  { name: 'Verde', value: '#27ae60' },
  { name: 'Amarelo', value: '#f1c40f' },
  { name: 'Preto', value: '#000000' },
  { name: 'Cinza', value: '#7f8c8d' },
  { name: 'Marrom', value: '#795548' },
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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

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

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button, input, textarea, select, a');
    if (isInteractive) return;

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
      case 'dimension': return 'Distância';
      case 'line': return 'Linha Reta';
      case 'arrow': return 'Seta Simples';
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

  const colorPalette = (
    <div className="grid grid-cols-4 gap-2">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c.value}
          onClick={() => setTempColor(c.value)}
          className={`w-14 h-14 rounded-xl border-[3px] transition-all flex items-center justify-center ${
            tempColor === c.value ? 'border-primary scale-105' : 'border-border'
          }`}
          style={{ backgroundColor: c.value }}
          title={c.name}
        >
          {tempColor === c.value && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5L8 14.5L16 6.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  const editorBody = (
    <div className="flex flex-col gap-4">
      {/* Header: icon + title + close */}
      <div className="flex items-center gap-3">
        <EditorTypeIcon type={editorType} className="w-16 h-12 flex-shrink-0" />
        <span className="font-bold text-2xl flex-1 text-center">{title}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 rounded-full bg-white flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* White card body */}
      <div className="bg-white rounded-xl p-4 space-y-5">
        <Input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-center placeholder:text-muted-foreground/50"
          placeholder={getPlaceholder()}
          autoFocus
        />
        <Separator />
        {colorPalette}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 bg-white" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={handleApply}>
          Confirmar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <div className="p-6">
            {editorBody}
          </div>
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
    <>
      <div className="fixed inset-0 z-40" onClick={handleCancel} />
      <div
        className="fixed z-50 bg-background rounded-xl border shadow-md p-6 min-w-[280px] cursor-move select-none"
        style={{ left: pos.x, top: pos.y }}
        onMouseDown={handleDragStart}
      >
        {editorBody}
      </div>
    </>
  );
}
