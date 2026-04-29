import {useCallback, useState} from 'react';
import {Input} from '@/components/ui/input.tsx';
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

const DEFAULT_SELECTED: Set<number> = new Set([1.0, 1.2, 1.5, 2.0, 2.5, 3.0]);

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
    <div className='flex flex-col items-center gap-4'>
      <div className='w-full'>
        <Input
          id='family-name'
          className='placeholder:text-muted-foreground/60'
          placeholder='Nome da Família'
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          autoFocus
        />
      </div>

      <div className='flex flex-col items-center gap-3 w-full'>
        <p className='text-sm font-medium text-center'>
          Pilotis{' '}
          <span className='text-xs text-muted-foreground font-normal'>
            ({selectedHeights.size}/6 selecionados)
          </span>
        </p>
        <div className='grid grid-cols-3 gap-3 w-full'>
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
                  h-16 w-full rounded-2xl border text-lg font-semibold transition-all
                  flex items-center justify-center shadow-sm
                  ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'}
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
      title='Designação'
      content={content}
      mainCardClassName='md:max-w-[248px] mx-auto w-full !p-4'
      dialogContentClassName='sm:max-w-[280px] p-4'
      confirmLabel='Confirmar'
      isConfirmDisabled={!canConfirm}
      actionButtonsClassName='md:max-w-[248px] mx-auto w-full'
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
    />
  );
}
