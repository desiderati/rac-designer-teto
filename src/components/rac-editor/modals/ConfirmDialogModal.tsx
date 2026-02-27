import {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';

interface ConfirmDialogModalProps {
  isMobile: boolean;
  isOpen: boolean;
  title: string;
  description?: string;
  content?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function ConfirmDialogModal({
  isMobile,
  isOpen,
  title,
  description,
  content,
  confirmLabel,
  cancelLabel = 'Cancelar',
  handleConfirm,
  handleCancel,
}: ConfirmDialogModalProps) {
  const mainCard =
    <div className='bg-white rounded-xl p-4 space-y-5'>
      {content ?? <p className='text-sm text-muted-foreground'>{description}</p>}
    </div>;

  const actionButtons = (extraClass = '') =>
    <div className={`flex gap-[16px] ${extraClass}`}>
      <Button variant='outline' className='flex-1 bg-white' onClick={handleCancel}>
        {cancelLabel}
      </Button>
      <Button className='flex-1' onClick={handleConfirm}>
        {confirmLabel}
      </Button>
    </div>;

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className='sm:max-w-sm' hideCloseButton>
          <DialogHeader className='text-center'>
            <DialogTitle className='text-center text-2xl'>{title}</DialogTitle>
          </DialogHeader>
          {mainCard}
          {actionButtons()}
        </DialogContent>
      </Dialog>);
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DrawerContent>
        <DrawerHeader className='text-center pb-2'>
          <DrawerTitle className='text-center text-2xl'>{title}</DrawerTitle>
        </DrawerHeader>
        <div className='px-4 pb-4'>
          {mainCard}
          {actionButtons('mt-4')}
        </div>
      </DrawerContent>
    </Drawer>);
}