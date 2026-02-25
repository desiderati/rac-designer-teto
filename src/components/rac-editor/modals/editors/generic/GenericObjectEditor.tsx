import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {X} from 'lucide-react';
import {Drawer, DrawerContent} from '@/components/ui/drawer.tsx';
import {GenericObjectEditorIcon} from './GenericObjectEditorIcon.tsx';
import {useGenericObjectEditorDraft} from './hooks/useGenericObjectEditorDraft.ts';
import {
  GenericObjectEditorType
} from '@/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts';
import {GENERIC_OBJECT_EDITOR_COLOR_PALETTE} from '@/config.ts';

export interface GenericObjectEditorAnchorPosition {
  x: number;
  y: number;
}

export interface GenericObjectEditorPanelProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  anchorPosition?: GenericObjectEditorAnchorPosition;
}

interface GenericObjectEditorProps {
  editorType: GenericObjectEditorType;
  currentValue: string;
  currentColor: string;
  isOpen: GenericObjectEditorPanelProps['isOpen'];
  isMobile: GenericObjectEditorPanelProps['isMobile'];
  onApply: (newValue: string, newColor: string) => void;
  onClose: GenericObjectEditorPanelProps['onClose'];
  anchorPosition?: GenericObjectEditorPanelProps['anchorPosition'];
}

export function GenericObjectEditor({
  editorType,
  currentValue,
  currentColor,
  isOpen,
  isMobile,
  onApply,
  onClose,
  anchorPosition
}: GenericObjectEditorProps) {
  const {draft, setDraft, resetDraft} = useGenericObjectEditorDraft(
    {value: currentValue, color: currentColor},
    isOpen
  );

  const tempValue = draft.value;
  const tempColor = draft.color;
  const [panelPos, setPanelPos] = useState<{ x: number; y: number; } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({x: 0, y: 0});

  useEffect(() => {
    setPanelPos(null);
  }, [isOpen]);

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
    resetDraft();
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
      y: (anchorPosition?.y ?? 200) - 60
    };

    dragOffset.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPanelPos({
        x: ev.clientX - dragOffset.current.x,
        y: ev.clientY - dragOffset.current.y
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
      case 'wall':
        return 'Muro ou Outro Objeto';

      case 'distance':
        return 'Distância';

      case 'line':
        return 'Linha Reta';

      case 'arrow':
        return 'Seta Simples';
    }
  };

  const getPlaceholder = (): string => {
    switch (editorType) {
      case 'wall':
        return 'Ex.: Muro, Vizinho, etc.';

      case 'distance':
        return 'Ex.: 1,0m';

      case 'line':
        return 'Ex: 5m, limite, etc.';

      case 'arrow':
        return 'Ex: 5m, desnível, etc.';
    }
  };

  if (!isOpen) return null;

  const title = getTitle();

  const colorPalette =
    <div className='grid grid-cols-4 gap-2 justify-items-center'>
      {GENERIC_OBJECT_EDITOR_COLOR_PALETTE.map((c) =>
        <button
          key={c.value}
          onClick={
            () => setDraft((prev) => ({...prev, color: c.value}))
          }
          className={`w-14 h-14 rounded-xl border-[3px] transition-all flex items-center justify-center ${
            tempColor === c.value ? 'border-primary scale-105' : 'border-border'}`
          }
          style={{backgroundColor: c.value}}
          title={c.name}>

          {tempColor === c.value &&
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
              <path d='M4 10.5L8 14.5L16 6.5' stroke='white' strokeWidth='2.5' strokeLinecap='round'
                    strokeLinejoin='round'/>
            </svg>
          }
        </button>
      )}
    </div>;

  const editorBody =
    <div className='flex flex-col gap-4'>
      {/* Header: icon + title + close */}
      <div className='flex items-center gap-3'>
        <GenericObjectEditorIcon type={editorType} className='w-16 h-12 flex-shrink-0'/>
        <span className='font-bold text-2xl flex-1 text-center'>{title}</span>
        <Button
          variant='outline'
          size='icon'
          onClick={handleCancel}
          className='h-8 w-8 rounded-full bg-white flex-shrink-0'>

          <X className='h-4 w-4'/>
        </Button>
      </div>

      {/* White card body */}
      <div className='bg-white rounded-xl p-4 space-y-5'>
        <Input
          type='text'
          value={tempValue}
          onChange={
            (e) =>
              setDraft((prev) => ({...prev, value: e.target.value}))
          }
          onKeyDown={handleKeyDown}
          className='text-center placeholder:text-muted-foreground/50'
          placeholder={getPlaceholder()}
          autoFocus/>

        <Separator/>

        {colorPalette}
      </div>

      {/* Action buttons */}
      <div className='flex gap-[16px]'>
        <Button variant='outline' className='flex-1 bg-white' onClick={handleCancel}>
          Cancelar
        </Button>
        <Button className='flex-1' onClick={handleApply}>
          Confirmar
        </Button>
      </div>
    </div>;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <div className='p-6'>
            {editorBody}
          </div>
        </DrawerContent>
      </Drawer>);
  }

  // Desktop: Draggable floating panel
  const pos = panelPos || {
    x: (anchorPosition?.x ?? 200) + 10,
    y: (anchorPosition?.y ?? 200) - 60
  };

  return (
    <>
      <div className='fixed inset-0 z-40' onClick={handleCancel}/>
      <div
        className='fixed z-50 bg-background rounded-xl border shadow-md p-6 min-w-[280px] cursor-move select-none'
        style={{left: pos.x, top: pos.y}}
        onMouseDown={handleDragStart}>

        {editorBody}
      </div>
    </>
  );
}
