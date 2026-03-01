import {useHouseSnapshot} from '@/components/lib/house-store.ts';
import {TwoCardSelector} from './TwoCardSelector.tsx';
import {PilotiGridIcon} from '@/components/rac-editor/modals/editors/piloti/PilotiGridIcon.tsx';
import {HousePreAssignedSideDisplay, HouseSide, HouseViewType} from '@/shared/types/house.ts';

export type HouseSideSelectorMode = 'position' | 'choose-instance';

interface HouseSideSelectorProps {
  houseViewType: HouseViewType;
  mode?: HouseSideSelectorMode;
  isOpen: boolean;
  onClose: () => void;
  onSelectSide: (side: HouseSide) => void;
  houseSideSlots?: HousePreAssignedSideDisplay[];
}

export function HouseSideSelector({
  houseViewType,
  mode = 'position',
  isOpen,
  onClose,
  onSelectSide,
  houseSideSlots
}: HouseSideSelectorProps) {

  const house = useHouseSnapshot();
  const houseType = house?.houseType ?? null;
  const isLongSide = houseViewType === 'front' || houseViewType === 'back';
  const slots = houseSideSlots || [];

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
          title='Lado Porta Casa Tipo 6'
          left={{
            label: 'Superior',
            icon: <PilotiGridIcon highlight='top'/>,
            onClick: () => handleSelect('top'),
          }}
          right={{
            label: 'Inferior',
            icon: <PilotiGridIcon highlight='bottom'/>,
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
          title='Lado Porta Casa Tipo 3'
          left={{
            label: 'Esquerdo',
            icon: <PilotiGridIcon highlight='left'/>,
            onClick: () => handleSelect('left'),
          }}
          right={{
            label: 'Direito',
            icon: <PilotiGridIcon highlight='right'/>,
            onClick: () => handleSelect('right'),
          }}
        />
      );
    }
  }

  // --- Choose-instance mode ---
  if (houseViewType === 'back' && houseType === 'tipo3') {
    // Laterais: Superior / Inferior
    const topSlot = slots.find(s => s.side === 'top');
    const bottomSlot = slots.find(s => s.side === 'bottom');
    return (
      <TwoCardSelector
        isOpen={isOpen}
        onClose={onClose}
        title='Qual das laterais deseja mostrar?'
        left={{
          label: 'Superior',
          icon: <PilotiGridIcon highlight='top'/>,
          onClick: () => handleSelect('top'),
          disabled: topSlot?.onCanvas,
          subtext: topSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
        right={{
          label: 'Inferior',
          icon: <PilotiGridIcon highlight='bottom'/>,
          onClick: () => handleSelect('bottom'),
          disabled: bottomSlot?.onCanvas,
          subtext: bottomSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
      />
    );
  }

  if (houseViewType === 'side1') {
    // Quadrados: Esquerdo / Direito
    const leftSlot = slots.find(s => s.side === 'left');
    const rightSlot = slots.find(s => s.side === 'right');
    return (
      <TwoCardSelector
        isOpen={isOpen}
        onClose={onClose}
        title='Qual dos quadrados deseja mostrar?'
        left={{
          label: 'Esquerdo',
          icon: <PilotiGridIcon highlight='left'/>,
          onClick: () => handleSelect('left'),
          disabled: leftSlot?.onCanvas,
          subtext: leftSlot?.onCanvas ? '(já no canvas)' : undefined,
        }}
        right={{
          label: 'Direito',
          icon: <PilotiGridIcon highlight='right'/>,
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
