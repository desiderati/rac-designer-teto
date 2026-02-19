import { TwoCardSelector } from './TwoCardSelector';
import { ContraventamentoSide } from '@/lib/canvas-utils';

interface ContraventamentoSideSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSide: (side: ContraventamentoSide) => void;
  disabledSides?: ContraventamentoSide[];
}

function ContraventamentoSideIcon({ side }: { side: ContraventamentoSide }) {
  // Keep the whole icon composition centered while placing the beam tangent
  // to the piloti stack on the selected side.
  const pilotiCenterX = side === 'left' ? 34 : 30;
  const beamX = side === 'left' ? pilotiCenterX - 10 : pilotiCenterX + 6;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x={beamX} y="8" width="4" height="48" rx="2" fill="#8B4513" />
      <circle cx={pilotiCenterX} cy="14" r="6" fill="#0ea5e9" />
      <circle cx={pilotiCenterX} cy="32" r="6" fill="#0ea5e9" />
      <circle cx={pilotiCenterX} cy="50" r="6" fill="#0ea5e9" />
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
