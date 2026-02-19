import { TwoCardSelector } from './TwoCardSelector';
import { ContraventamentoSide } from '@/lib/canvas-utils';
import { ContraventamentoSideIcon } from './ContraventamentoSideIcon';

interface ContraventamentoSideSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSide: (side: ContraventamentoSide) => void;
  disabledSides?: ContraventamentoSide[];
}

export function ContraventamentoSideSelector({
  isOpen,
  onClose,
  onSelectSide,
  disabledSides = [],
}: ContraventamentoSideSelectorProps) {
  const isLeftDisabled = disabledSides.includes('left');
  const isRightDisabled = disabledSides.includes('right');

  return (
    <TwoCardSelector
      isOpen={isOpen}
      onClose={onClose}
      title="Em qual lado deseja contraventar?"
      left={{
        label: 'Esquerdo',
        icon: <ContraventamentoSideIcon side="left" />,
        onClick: () => onSelectSide('left'),
        disabled: isLeftDisabled,
      }}
      right={{
        label: 'Direito',
        icon: <ContraventamentoSideIcon side="right" />,
        onClick: () => onSelectSide('right'),
        disabled: isRightDisabled,
      }}
    />
  );
}
