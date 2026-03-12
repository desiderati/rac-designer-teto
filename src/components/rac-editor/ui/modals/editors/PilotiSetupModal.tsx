import {useState} from 'react';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ConfirmDialogModal} from '@/components/rac-editor/ui/modals/ConfirmDialogModal.tsx';
import {ALL_PILOTI_HEIGHTS} from '@/shared/types/house.ts';
import {formatPilotiHeight} from '@/shared/types/piloti.ts';

const REQUIRED_COUNT = 6;

interface PilotiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (heights: number[]) => void;
}

export function PilotiSetupModal({isOpen, onClose, onConfirm}: PilotiSetupModalProps) {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (h: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(h)) {
        next.delete(h);
      } else if (next.size < REQUIRED_COUNT) {
        next.add(h);
      }
      return next;
    });
  };

  const canConfirm = selected.size === REQUIRED_COUNT;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const sorted = [...selected].sort((a, b) => a - b);
    onConfirm(sorted);
    setSelected(new Set());
  };

  const handleCancel = () => {
    setSelected(new Set());
    onClose();
  };

  const content = (
    <div className='flex flex-col gap-4'>
      <div className='space-y-4'>
        <p className='text-sm font-medium text-center'>Tamanho dos Pilotis</p>
        <div className='grid grid-cols-3 gap-2'>
          {ALL_PILOTI_HEIGHTS.map((h) => {
            const isActive = selected.has(h);
            return (
              <button
                key={h}
                type='button'
                onClick={() => toggle(h)}
                className={`
                  h-10 rounded-lg text-sm font-semibold transition-colors
                  ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-foreground hover:bg-primary/20'}
                `}
              >
                {formatPilotiHeight(h)}
              </button>
            );
          })}
        </div>
        <p className='text-xs text-muted-foreground text-center'>
          {selected.size} de {REQUIRED_COUNT} selecionadas
        </p>
      </div>
    </div>
  );

  return (
    <ConfirmDialogModal
      isMobile={isMobile}
      isOpen={isOpen}
      title='Configuração de Pilotis'
      content={content}
      confirmLabel='Confirmar'
      isConfirmDisabled={!canConfirm}
      handleConfirm={handleConfirm}
      handleCancel={handleCancel}
    />
  );
}
