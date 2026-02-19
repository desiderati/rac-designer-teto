import { TwoCardSelector } from './TwoCardSelector';
import { ContraventamentoSide } from '@/lib/canvas-utils';

interface ContraventamentoSideSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSide: (side: ContraventamentoSide) => void;
  disabledSides?: ContraventamentoSide[];
}

function ContraventamentoSideIcon({ side }: { side: ContraventamentoSide }) {
  const beamX = side === 'left' ? 18 : 30;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x={beamX} y="8" width="4" height="48" rx="2" fill="#8B4513" />
      <circle cx="24" cy="14" r="6" fill="#0ea5e9" />
      <circle cx="24" cy="32" r="6" fill="#0ea5e9" />
      <circle cx="24" cy="50" r="6" fill="#0ea5e9" />
    </svg>
  );
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

