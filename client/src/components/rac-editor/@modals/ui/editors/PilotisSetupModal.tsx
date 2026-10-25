import {useCallback, useState} from 'react';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';
import {ALL_PILOTI_HEIGHTS, DEFAULT_HOUSE_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';

export interface PilotisSetupResult {
  selectedHeights: number[];
}

interface PilotisSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: PilotisSetupResult) => void;
  initialSelectedHeights?: readonly number[];
}

const REQUIRED_SELECTED_COUNT = DEFAULT_HOUSE_PILOTI_HEIGHTS.length;

export function PilotisSetupModal({isOpen, onClose, onConfirm, initialSelectedHeights = DEFAULT_HOUSE_PILOTI_HEIGHTS}: PilotisSetupModalProps) {
  const isMobile = useIsMobile();
  const [selectedHeights, setSelectedHeights] = useState<Set<number>>(() => new Set(initialSelectedHeights));

  const toggleHeight = useCallback((h: number) => {
    setSelectedHeights((prev) => {
      const next = new Set(prev);
      if (next.has(h)) {
        next.delete(h);
      } else if (next.size < REQUIRED_SELECTED_COUNT) {
        next.add(h);
      }
      return next;
    });
  }, []);

  const canConfirm = selectedHeights.size === REQUIRED_SELECTED_COUNT;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    const sorted = [...selectedHeights].sort((a, b) => a - b);
    onConfirm({selectedHeights: sorted});
    setSelectedHeights(new Set(initialSelectedHeights));
  }, [canConfirm, selectedHeights, onConfirm, initialSelectedHeights]);

  const handleCancel = useCallback(() => {
    setSelectedHeights(new Set(initialSelectedHeights));
    onClose();
  }, [onClose, initialSelectedHeights]);

  const content = (
    <div className='pilotis-setup-grid grid w-full grid-cols-4 justify-items-stretch gap-2'>
      {ALL_PILOTI_HEIGHTS.map((h) => {
        const isSelected = selectedHeights.has(h);
        const isDisabled = !isSelected && selectedHeights.size >= REQUIRED_SELECTED_COUNT;
        return <button key={h} type='button' onClick={() => toggleHeight(h)}
          aria-pressed={isSelected} disabled={isDisabled}
          className={`aspect-square min-h-11 w-full rounded-lg border text-base font-semibold transition-colors flex items-center justify-center shadow-sm ${isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          {formatPilotiHeight(h)}
        </button>;
      })}
    </div>
  );

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      title='Pilotis'
      titleAccessory={`(${selectedHeights.size}/${REQUIRED_SELECTED_COUNT} selecionados)`}
      content={content}
      mainCardClassName='w-full'
      surfaceClassName='rac-pilotis-setup-dialog'
      dialogContentClassName='w-[360px] max-w-[calc(100vw-16px)] p-4'
      confirmLabel='Confirmar'
      isConfirmDisabled={!canConfirm}
      actionButtonsClassName='w-full'
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
    />
  );
}
