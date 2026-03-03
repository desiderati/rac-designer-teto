import {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';

interface ConfirmDialogModalProps {
  isMobile: boolean;
  isOpen: boolean;
  title?: string;
  description?: string;
  content?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
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
  isConfirmDisabled = false,
  handleConfirm,
  handleCancel,
}: ConfirmDialogModalProps) {
  const hasTitle = Boolean(title?.trim());
  const resolvedTitle = title?.trim() || 'Janela de confirmação';
  const dialogDescription =
    description?.trim() || 'Janela de confirmação. Você pode confirmar ou cancelar.';

  const modalBody =
    content ?? <p className='text-sm text-muted-foreground'>{description}</p>;

  const mainCard = hasTitle ?
    <div className='bg-white rounded-xl p-4 space-y-5'>
      {modalBody}
    </div> :
    modalBody;

  const actionButtons = (extraClass = '') =>
    <div className={`flex gap-[16px] ${extraClass}`}>
      <Button
        variant='outline'
        className='flex-1 bg-white disabled:pointer-events-auto disabled:cursor-not-allowed'
        onClick={handleCancel}>
        {cancelLabel}
      </Button>
      <Button
        className='flex-1 disabled:pointer-events-auto disabled:cursor-not-allowed'
        onClick={handleConfirm}
        disabled={isConfirmDisabled}>
        {confirmLabel}
      </Button>
    </div>;

  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className='sm:max-w-sm' hideCloseButton>
          <DialogHeader className={hasTitle ? 'text-center' : 'sr-only'}>
            <DialogTitle className={hasTitle ? 'text-center text-2xl' : 'sr-only'}>
              {resolvedTitle}
            </DialogTitle>
            <DialogDescription className='sr-only'>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          {mainCard}
          {actionButtons()}
        </DialogContent>
      </Dialog>);
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DrawerContent>
        <DrawerHeader className={hasTitle ? 'text-center pb-2' : 'sr-only'}>
          <DrawerTitle className={hasTitle ? 'text-center text-2xl' : 'sr-only'}>
            {resolvedTitle}
          </DrawerTitle>
          <DrawerDescription className='sr-only'>
            {dialogDescription}
          </DrawerDescription>
        </DrawerHeader>
        <div className='px-4 pb-4'>
          {mainCard}
          {actionButtons('mt-4')}
        </div>
      </DrawerContent>
    </Drawer>);
}
