import { cn } from '@/lib/utils';
import { HouseType } from '@/lib/house-manager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { TwoCardSelector } from './TwoCardSelector';

interface HouseTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: HouseType) => void;
  tutorialLocked?: boolean;
}

export function HouseTypeSelector({ isOpen, onClose, onSelectType, tutorialLocked = false }: HouseTypeSelectorProps) {
  const handleSelect = (type: HouseType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <TwoCardSelector
      isOpen={isOpen}
      onClose={onClose}
      title="Escolha o Tipo de Casa"
      left={{
        label: 'Casa Tipo 6',
        icon: <FontAwesomeIcon icon={faHome} className="text-4xl text-primary" />,
        onClick: () => handleSelect('tipo6'),
      }}
      right={{
        label: 'Casa Tipo 3',
        icon: <FontAwesomeIcon icon={faDoorOpen} className="text-4xl text-primary" />,
        onClick: () => handleSelect('tipo3'),
      }}
      tutorialLocked={tutorialLocked}
    />
  );
}
