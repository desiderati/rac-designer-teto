import {ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet.tsx';
import {useIsMobile} from '@/components/rac-editor/lib/use-mobile.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';

interface TwoCardConfig {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  subtext?: string;
}

interface TwoCardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  left: TwoCardConfig;
  right: TwoCardConfig;
}

function TwoCardButton({label, icon, onClick, disabled, subtext}: TwoCardConfig) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-3 rounded-xl border px-4 py-5 transition-colors duration-200',
        disabled
          ? 'bg-muted/50 border-muted-foreground/20 text-muted-foreground cursor-not-allowed'
          : 'bg-[#f7fafc] hover:bg-[#eff8fd] hover:border-primary border-border'
      )}
    >
      <div className='flex items-center justify-center h-14'>
        {icon}
      </div>
      <div className='flex flex-col items-center gap-0.5'>
        <h3 className='font-semibold text-foreground text-center text-base'>{label}</h3>
        {subtext && <span className='text-xs opacity-70'>{subtext}</span>}
      </div>
    </button>
  );
}

export function TwoCardSelector({isOpen, onClose, title, left, right}: TwoCardSelectorProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className='flex flex-row gap-4 justify-center'>
      <TwoCardButton {...left} />
      <TwoCardButton {...right} />
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='sm:max-w-sm' hideCloseButton>
          <ModalFrame className='rac-two-card-selector' header={<DialogHeader className='text-center'>
            <DialogTitle className='text-center text-2xl'>{title}</DialogTitle>
            <DialogDescription className='sr-only'>
              Selecione uma das duas opções disponíveis.
            </DialogDescription>
          </DialogHeader>}>
          {content}
          </ModalFrame>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side='bottom' className='h-auto max-h-[80vh] rounded-t-xl'>
        <ModalFrame className='rac-two-card-selector' header={<SheetHeader className='text-center'>
          <SheetTitle className='text-center text-2xl'>{title}</SheetTitle>
        </SheetHeader>}>
        {content}
        </ModalFrame>
      </SheetContent>
    </Sheet>
  );
}
