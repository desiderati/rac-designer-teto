import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';

interface ConfirmDialogModalProps {
  isMobile: boolean;
  isOpen: boolean;
  title?: string;
  titleAccessory?: ReactNode;
  description?: string;
  content?: ReactNode;
  headerContent?: ReactNode;
  headerTone?: 'plain' | 'section';
  contentClassName?: string;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  mainCardClassName?: string;
  dialogContentClassName?: string;
  surfaceClassName?: string;
  actionButtonsClassName?: string;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function ConfirmDialogModal({isMobile, isOpen, title, titleAccessory, description, content, headerContent, headerTone = 'plain', contentClassName, confirmLabel, cancelLabel = 'Cancelar', isConfirmDisabled = false, mainCardClassName, dialogContentClassName = 'sm:max-w-sm', surfaceClassName, actionButtonsClassName, handleConfirm, handleCancel}: ConfirmDialogModalProps) {
  const hasTitle = Boolean(title?.trim());
  const resolvedTitle = title?.trim() || 'Janela de confirmação';
  const dialogDescription = description?.trim() || 'Janela de confirmação. Você pode confirmar ou cancelar.';
  const Header = isMobile ? DrawerHeader : DialogHeader;
  const Title = isMobile ? DrawerTitle : DialogTitle;
  const Description = isMobile ? DrawerDescription : DialogDescription;
  const visibleTitle = hasTitle && !headerContent;
  const accessibleHeader = <Header className={visibleTitle ? 'text-center' : 'sr-only'}>
    <Title className={cn('text-center', titleAccessory && 'flex items-baseline justify-center gap-2')}>
      <span>{resolvedTitle}</span>
      {hasTitle && titleAccessory ? <span className='text-xs font-medium tracking-normal text-muted-foreground'>{titleAccessory}</span> : null}
    </Title>
    <Description className='sr-only'>{dialogDescription}</Description>
  </Header>;
  const actions = <ActionDock testId='confirm-dialog-actions' surface={isMobile ? 'drawer' : 'dialog'} spacing='flush'>
    <ModalActions className={actionButtonsClassName}
      cancel={<Button data-action='cancel' variant='outline' className='bg-white disabled:pointer-events-auto disabled:cursor-not-allowed' onClick={handleCancel}>{cancelLabel}</Button>}
      confirm={<Button className='disabled:pointer-events-auto disabled:cursor-not-allowed' onClick={handleConfirm} disabled={isConfirmDisabled}>{confirmLabel}</Button>}/>
  </ActionDock>;
  const composition = <>
    {!visibleTitle ? accessibleHeader : null}
    <ModalFrame headerTone={headerTone} header={headerContent || (visibleTitle ? accessibleHeader : undefined)} actions={actions} contentClassName={contentClassName}>
      <div data-testid='confirm-dialog-scroll-content' className={cn('min-w-0', hasTitle && 'space-y-5', mainCardClassName)}>
        {content ?? <p className='text-sm text-muted-foreground'>{description}</p>}
      </div>
    </ModalFrame>
  </>;
  if (isMobile) return <Drawer open={isOpen} onOpenChange={open => !open && handleCancel()}>
    <DrawerContent className={surfaceClassName}>{composition}</DrawerContent>
  </Drawer>;
  return <Dialog open={isOpen} onOpenChange={open => !open && handleCancel()}>
    <DialogContent className={cn(dialogContentClassName, surfaceClassName)} hideCloseButton>{composition}</DialogContent>
  </Dialog>;
}
