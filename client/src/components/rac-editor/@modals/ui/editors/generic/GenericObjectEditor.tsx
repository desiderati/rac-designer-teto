import React from 'react';
import {Input} from '@/components/ui/input.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {FloatingEditor} from '@/components/rac-editor/@modals/ui/editors/FloatingEditor.tsx';
import type {GenericCanvasObjectEditorType} from '@/components/rac-editor/@canvas/ports/CanvasSelectionPort.ts';
import {GENERIC_OBJECT_EDITOR_COLOR_PALETTE} from '@/shared/config.ts';
import {useGenericObjectEditorDraft} from '@/components/rac-editor/@modals/hooks/useGenericObjectEditorDraft.ts';

interface GenericObjectEditorProps {
  editorType: GenericCanvasObjectEditorType;
  currentValue: string;
  currentColor: string;
  isOpen: boolean;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  onApply: (newValue: string, newColor: string) => void;
  onClose: () => void;
}

export function GenericObjectEditor({
  editorType,
  currentValue,
  currentColor,
  isOpen,
  isMobile,
  anchorPosition,
  onApply,
  onClose,
}: GenericObjectEditorProps) {

  const {draft, setDraft, resetDraft} = useGenericObjectEditorDraft(
    {value: currentValue, color: currentColor},
    isOpen
  );

  const tempValue = draft.value;
  const tempColor = draft.color;

  const handleApply = () => {
    const value = tempValue.trim();
    onApply(editorType === 'text' ? value : value.slice(0, 50), tempColor);
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

  const getTitle = (): string => {
    switch (editorType) {
      case 'wall':
        return 'Muro';

      case 'square': return 'Quadrado';
      case 'triangle': return 'Triângulo';
      case 'circle': return 'Círculo';
      case 'text': return 'Texto';
      case 'freehand': return 'Desenho Livre';

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

      case 'square':
      case 'triangle':
      case 'circle': return 'Nome do objeto';
      case 'text': return 'Texto';
      case 'freehand': return '';

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

  return (
    <FloatingEditor
      ariaLabel={`Editar ${title}`}
      cardContent={
        <>
          {editorType !== 'freehand' && <Input
            type='text'
            aria-label={title}
            value={tempValue}
            maxLength={editorType === 'text' ? undefined : 50}
            onChange={
              (e) =>
                setDraft((prev) => ({...prev, value: editorType === 'text' ? e.target.value : e.target.value.slice(0, 50)}))
            }
            onKeyDown={handleKeyDown}
            className='text-center placeholder:text-muted-foreground/50'
            placeholder={getPlaceholder()}
            autoFocus/>}

          {editorType !== 'freehand' && <Separator/>}

          {colorPalette}
        </>
      }
      isOpen={isOpen}
      isMobile={isMobile}
      anchorPosition={anchorPosition}
      confirmLabel='Confirmar'
      onConfirm={handleApply}
      onCancel={handleCancel}
    />);
}
