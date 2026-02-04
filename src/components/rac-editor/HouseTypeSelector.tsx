import { cn } from '@/lib/utils';
import { HouseType } from '@/lib/house-manager';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faHouseChimney } from '@fortawesome/free-solid-svg-icons';

interface HouseTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: HouseType) => void;
}

function TypeCard({
  type,
  title,
  onClick,
}: {
  type: HouseType;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200',
        'bg-background hover:bg-accent hover:border-primary',
        'border-border hover:scale-105 active:scale-95',
        'min-w-[140px] flex-1'
      )}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <FontAwesomeIcon
          icon={type === 'tipo6' ? faHome : faHouseChimney}
          className="text-2xl text-primary"
        />
      </div>
      <h3 className="font-semibold text-foreground text-center">{title}</h3>
    </button>
  );
}

export function HouseTypeSelector({ isOpen, onClose, onSelectType }: HouseTypeSelectorProps) {
  const isMobile = useIsMobile();

  const handleSelect = (type: HouseType) => {
    onSelectType(type);
    onClose();
  };

  const content = (
    <div className="flex flex-row gap-4 justify-center py-4">
      <TypeCard
        type="tipo6"
        title="Casa Tipo 6"
        onClick={() => handleSelect('tipo6')}
      />
      <TypeCard
        type="tipo3"
        title="Casa Tipo 3"
        onClick={() => handleSelect('tipo3')}
      />
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha o Tipo de Casa</DialogTitle>
            <DialogDescription>
              Selecione o tipo de casa para definir as vistas disponíveis
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
        <SheetHeader className="text-center pb-2">
          <SheetTitle>Escolha o Tipo de Casa</SheetTitle>
          <SheetDescription>
            Selecione o tipo de casa para definir as vistas disponíveis
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
