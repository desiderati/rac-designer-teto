import {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface ConfirmDialogModalProps {
  isMobile: boolean;
  isOpen: boolean;
  title?: string;
  titleAccessory?: ReactNode;
  description?: string;
  content?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  mainCardClassName?: string;
  dialogContentClassName?: string;
  actionButtonsClassName?: string;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function ConfirmDialogModal({
  isMobile,
  isOpen,
  title,
  titleAccessory,
  description,
  content,
  confirmLabel,
  cancelLabel = 'Cancelar',
  isConfirmDisabled = false,
  mainCardClassName,
  dialogContentClassName = 'sm:max-w-sm',
  actionButtonsClassName,
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
    <div className={cn('bg-white rounded-xl p-4 space-y-5', mainCardClassName)}>
      {modalBody}
    </div> :
    modalBody;

  const actionButtons = (extraClass = '') =>
    <div className={cn('flex gap-[16px]', actionButtonsClassName, extraClass)}>
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
        <DialogContent className={dialogContentClassName} hideCloseButton>
          <DialogHeader className={hasTitle ? 'text-center' : 'sr-only'}>
            <DialogTitle
              className={cn(
                hasTitle ? 'text-center text-2xl' : 'sr-only',
                hasTitle && titleAccessory ? 'flex items-baseline justify-center gap-2' : undefined,
              )}>
              <span>{resolvedTitle}</span>
              {hasTitle && titleAccessory ?
                <span className='text-xs font-medium tracking-normal text-muted-foreground'>
                  {titleAccessory}
                </span> :
                null}
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
          <DrawerTitle
            className={cn(
              hasTitle ? 'text-center text-2xl' : 'sr-only',
              hasTitle && titleAccessory ? 'flex items-baseline justify-center gap-2' : undefined,
            )}>
            <span>{resolvedTitle}</span>
            {hasTitle && titleAccessory ?
              <span className='text-xs font-medium tracking-normal text-muted-foreground'>
                {titleAccessory}
              </span> :
              null}
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
