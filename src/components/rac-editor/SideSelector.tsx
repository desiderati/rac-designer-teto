import { useEffect, useState } from 'react';
import { HouseSide, ViewType, houseManager } from '@/lib/house-manager';
import { TwoCardSelector } from './TwoCardSelector';
import { PilotiGridIcon } from './PilotiGridIcon';

export interface InstanceSlot {
  label: string;
  side: HouseSide;
  onCanvas: boolean;
}

interface SideSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: ViewType;
  onSelectSide: (side: HouseSide) => void;
  mode?: 'position' | 'choose-instance';
  instanceSlots?: InstanceSlot[];
}

export function SideSelector({ isOpen, onClose, viewType, onSelectSide, mode = 'position', instanceSlots }: SideSelectorProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    return houseManager.subscribe(() => forceUpdate((v) => v + 1));
  }, [isOpen]);

  const houseType = houseManager.getHouseType();
  const isLongSide = viewType === 'front' || viewType === 'back';

  const handleSelect = (side: HouseSide) => {
    onSelectSide(side);
    onClose();
  };

  // --- Position mode ---
  if (mode === 'position') {
    if (isLongSide) {
      // Casa Tipo 6: front view → Superior / Inferior
      return (
        <TwoCardSelector
          isOpen={isOpen}
          onClose={onClose}
          title="Lado Porta Casa Tipo 6"
          left={{
            label: 'Superior',
            icon: <PilotiGridIcon highlight="top" />,
            onClick: () => handleSelect('top'),
          }}
          right={{
            label: 'Inferior',
            icon: <PilotiGridIcon highlight="bottom" />,
            onClick: () => handleSelect('bottom'),
          }}
        />
      );
    } else {
      // Casa Tipo 3: side2 view → Esquerdo / Direito
      return (
        <TwoCardSelector
          isOpen={isOpen}
          onClose={onClose}
          title="Lado Porta Casa Tipo 3"
          left={{
            label: 'Esquerdo',
            icon: <PilotiGridIcon highlight="left" />,
            onClick: () => handleSelect('left'),
          }}
          right={{
            label: 'Direito',
            icon: <PilotiGridIcon highlight="right" />,
            onClick: () => handleSelect('right'),
          }}
        />
      );
    }
  }

  // --- Choose-instance mode ---
  const slots = instanceSlots || [];

  if (viewType === 'back' && houseType === 'tipo3') {
    // Laterais: Superior / Inferior
    const topSlot = slots.find(s => s.side === 'top');
    const bottomSlot = slots.find(s => s.side === 'bottom');
    return (
      <TwoCardSelector
        isOpen={isOpen}
        onClose={onClose}
        title="Qual das laterais deseja mostrar?"
        left={{
          label: 'Superior',
          icon: <PilotiGridIcon highlight="top" />,
          onClick: () => handleSelect('top'),
          disabled: topSlot?.onCanvas,
          subtext: topSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
        right={{
          label: 'Inferior',
          icon: <PilotiGridIcon highlight="bottom" />,
          onClick: () => handleSelect('bottom'),
          disabled: bottomSlot?.onCanvas,
          subtext: bottomSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
      />
    );
  }

  if (viewType === 'side1') {
    // Quadrados: Esquerdo / Direito
    const leftSlot = slots.find(s => s.side === 'left');
    const rightSlot = slots.find(s => s.side === 'right');
    return (
      <TwoCardSelector
        isOpen={isOpen}
        onClose={onClose}
        title="Qual dos quadrados deseja mostrar?"
        left={{
          label: 'Esquerdo',
          icon: <PilotiGridIcon highlight="left" />,
          onClick: () => handleSelect('left'),
          disabled: leftSlot?.onCanvas,
          subtext: leftSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
        right={{
          label: 'Direito',
          icon: <PilotiGridIcon highlight="right" />,
          onClick: () => handleSelect('right'),
          disabled: rightSlot?.onCanvas,
          subtext: rightSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
      />
    );
  }

  // Fallback (shouldn't happen)
  return null;
}
