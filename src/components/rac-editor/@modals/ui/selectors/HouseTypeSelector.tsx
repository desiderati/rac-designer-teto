import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDoorOpen, faHome} from '@fortawesome/free-solid-svg-icons';
import {TwoCardSelector} from './TwoCardSelector.tsx';
import {HouseType} from '@/shared/types/house.ts';

interface HouseTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: HouseType) => void;
}

export function HouseTypeSelector({isOpen, onClose, onSelectType}: HouseTypeSelectorProps) {
  const handleSelect = (type: HouseType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <TwoCardSelector
      isOpen={isOpen}
      onClose={onClose}
      title='Escolha o Tipo de Casa'
      left={{
        label: 'Casa Tipo 6',
        icon: <FontAwesomeIcon icon={faHome} className='text-4xl text-primary'/>,
        onClick: () => handleSelect('tipo6'),
      }}
      right={{
        label: 'Casa Tipo 3',
        icon: <FontAwesomeIcon icon={faDoorOpen} className='text-4xl text-primary'/>,
        onClick: () => handleSelect('tipo3'),
      }}
    />
  );
}
