import {useCallback, useState} from 'react';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/@modals/ui/ConfirmDialogModal.tsx';
import {getPilotiHeightButtonClasses} from '@/components/rac-editor/@modals/lib/piloti-editor-classes.ts';
import {ALL_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';

export interface PilotisSetupResult {
  selectedHeights: number[];
}

interface PilotisSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: PilotisSetupResult) => void;
}

const DEFAULT_SELECTED: Set<number> = new Set([1.0, 1.2, 1.5, 2.0, 2.5, 3.0]);

export function PilotisSetupModal({isOpen, onClose, onConfirm}: PilotisSetupModalProps) {
  const isMobile = useIsMobile();
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

  const canConfirm = selectedHeights.size === 6;

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    const sorted = [...selectedHeights].sort((a, b) => a - b);
    onConfirm({selectedHeights: sorted});
    setSelectedHeights(new Set(DEFAULT_SELECTED));
  }, [canConfirm, selectedHeights, onConfirm]);

  const handleCancel = useCallback(() => {
    setSelectedHeights(new Set(DEFAULT_SELECTED));
    onClose();
  }, [onClose]);

  const getHeightButtonClassName = (height: number, isSelected: boolean, isDisabled: boolean) => {
    if (!isMobile) {
      return `
        h-16 w-full rounded-2xl border text-lg font-semibold transition-all
        flex items-center justify-center shadow-sm
        ${isSelected
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'}
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `;
    }

    if (isDisabled) {
      return `
        h-16 w-16 rounded-2xl border border-transparent bg-primary/10 text-muted-foreground text-lg font-semibold
        flex items-center justify-center opacity-50 cursor-not-allowed
      `;
    }

    return getPilotiHeightButtonClasses({
      height,
      clickedHeight: null,
      tempHeight: isSelected ? height : Number.NaN,
    });
  };

  const content = (
    <div className={isMobile
      ? 'grid grid-cols-3 justify-items-center gap-3 max-w-[240px] mx-auto'
      : 'grid grid-cols-3 gap-3 w-full'}>
      {ALL_PILOTI_HEIGHTS.map((h) => {
        const isSelected = selectedHeights.has(h);
        const isDisabled = !isSelected && selectedHeights.size >= 6;
        return (
          <button
            key={h}
            type='button'
            onClick={() => toggleHeight(h)}
            disabled={isDisabled}
            className={getHeightButtonClassName(h, isSelected, isDisabled)}
          >
            {formatPilotiHeight(h)}
          </button>
        );
      })}
    </div>
  );

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      title='Pilotis'
      titleAccessory={`(${selectedHeights.size}/6 selecionados)`}
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
