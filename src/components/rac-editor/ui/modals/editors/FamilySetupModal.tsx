import {useCallback, useState} from 'react';
import {Input} from '@/components/ui/input.tsx';
import {Label} from '@/components/ui/label.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';
import {ALL_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';

export interface FamilySetupResult {
  familyName: string;
  selectedHeights: number[];
}

interface FamilySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: FamilySetupResult) => void;
}

const DEFAULT_SELECTED: Set<number> = new Set([1.0, 1.5, 2.0, 2.5, 3.0, 3.5]);

export function FamilySetupModal({isOpen, onClose, onConfirm}: FamilySetupModalProps) {
  const isMobile = useIsMobile();
  const [familyName, setFamilyName] = useState('');
  const [selectedHeights, setSelectedHeights] = useState<Set<number>>(() => new Set(DEFAULT_SELECTED));

  const toggleHeight = useCallback((h: number) => {
    setSelectedHeights((prev) => {
      const next = new Set(prev);
      if (next.has(h)) {
        next.delete(h);
      } else if (next.size < 6) {
        next.add(h);
      }
      return next;
    });
  }, []);

  const canConfirm = familyName.trim().length > 0 && selectedHeights.size === 6;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    const sorted = [...selectedHeights].sort((a, b) => a - b);
    onConfirm({familyName: familyName.trim(), selectedHeights: sorted});
    setFamilyName('');
    setSelectedHeights(new Set(DEFAULT_SELECTED));
  }, [canConfirm, familyName, selectedHeights, onConfirm]);

  const handleCancel = useCallback(() => {
    setFamilyName('');
    setSelectedHeights(new Set(DEFAULT_SELECTED));
    onClose();
  }, [onClose]);

  const content = (
    <div className='flex flex-col gap-4'>
      <div className='space-y-2'>
        <Label htmlFor='family-name' className='text-sm font-medium'>
          Nome da Família
        </Label>
        <Input
          id='family-name'
          placeholder='Ex: Silva'
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          autoFocus
        />
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-medium'>Alturas dos Pilotis</p>
          <span className='text-xs text-muted-foreground'>
            {selectedHeights.size}/6 selecionadas
          </span>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {ALL_PILOTI_HEIGHTS.map((h) => {
            const isSelected = selectedHeights.has(h);
            const isDisabled = !isSelected && selectedHeights.size >= 6;
            return (
              <button
                key={h}
                type='button'
                onClick={() => toggleHeight(h)}
                disabled={isDisabled}
                className={`
                  rounded-lg py-2.5 text-sm font-semibold transition-all border
                  ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-border hover:border-primary/50'}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {formatPilotiHeight(h)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      title='Configuração da Família'
      content={content}
      confirmLabel='Continuar'
      isConfirmDisabled={!canConfirm}
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
    />
  );
}
