import React from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input.tsx';
import {Separator} from '@/components/ui/separator.tsx';
import {X} from 'lucide-react';
import {GenericObjectEditorIcon} from './GenericObjectEditorIcon.tsx';
import {useGenericObjectEditorDraft} from './hooks/useGenericObjectEditorDraft.ts';
import {FloatingEditor} from '@/components/rac-editor/modals/editors/FloatingEditor.tsx';
import {
  GenericObjectEditorType
} from '@/components/rac-editor/modals/editors/generic/strategies/generic-object-editor-strategy.ts';
import {GENERIC_OBJECT_EDITOR_COLOR_PALETTE} from '@/shared/config.ts';

interface GenericObjectEditorProps {
  editorType: GenericObjectEditorType;
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

  const getTitle = (): string => {
    switch (editorType) {
      case 'wall':
        return 'Muro/Vizinho';

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

  return (
    <FloatingEditor
      header={
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
      }
      cardContent={
        <>
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
