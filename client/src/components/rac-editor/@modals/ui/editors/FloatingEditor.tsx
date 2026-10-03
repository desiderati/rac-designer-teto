import React, {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer.tsx';
import {useFloatingEditor} from '@/components/rac-editor/@modals/hooks/useFloatingEditor.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';

interface FloatingEditorProps {
  presentation?: 'floating' | 'inline';
  isOpen: boolean;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  header?: ReactNode;
  ariaLabel?: string;
  cardContent: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  dataGuidedTourId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FloatingEditor({
  presentation = 'floating',
  isOpen,
  isMobile,
  anchorPosition,
  header,
  ariaLabel = 'Editor do item selecionado',
  cardContent,
  confirmLabel,
  cancelLabel = 'Cancelar',
  isConfirmDisabled = false,
  dataGuidedTourId,
  onConfirm,
  onCancel,
}: FloatingEditorProps) {

  const {settingsPort} = useEditorPorts();
  const {openEditorsAtFixedPosition} = settingsPort.getSettings();
  const fallbackDesktopPos = openEditorsAtFixedPosition
    ? {position: 'fixed' as const, left: 88, top: 24}
    : anchorPosition
      ? {position: 'fixed' as const, left: anchorPosition.x + 12, top: anchorPosition.y + 12}
      : {position: 'fixed' as const, left: 24, top: 24};

  const {panelPos, handleDragStart} = useFloatingEditor({
    isOpen,
    anchorPosition,
    onCancel: onCancel,
  });

  const editorBody =
    <div className='flex flex-col gap-4'>
      {header ? <div className={presentation === 'inline' ? '' : 'cursor-move'} onMouseDown={presentation === 'inline' ? undefined : handleDragStart}>{header}</div> : null}

      <div className='bg-white rounded-xl p-4 space-y-4' data-no-drag>
        {cardContent}
      </div>

      <ActionDock
        testId='floating-editor-actions'
        surface={isMobile ? 'drawer' : 'dialog'}
        spacing='flush'
        mobileDocked={presentation !== 'inline'}
      >
        <div className='flex w-full gap-[16px]' data-no-drag>
          <Button
            variant='outline'
            className='flex-1 bg-white disabled:pointer-events-auto disabled:cursor-not-allowed'
            onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className='flex-1 disabled:pointer-events-auto disabled:cursor-not-allowed'
            onClick={onConfirm}
            disabled={isConfirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </ActionDock>
    </div>;

  if (presentation === 'inline') {
    return isOpen ? (
      <section aria-label={ariaLabel} className='rounded-2xl bg-slate-100 p-3 text-slate-950 sm:p-4'>
        {editorBody}
      </section>
    ) : null;
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent>
          <DrawerHeader className='sr-only'>
            <DrawerTitle>{ariaLabel}</DrawerTitle>
            <DrawerDescription>
              Edite as propriedades do item selecionado e confirme ou cancele a alteração.
            </DrawerDescription>
          </DrawerHeader>
          <div
            className='px-4 pb-4'
            data-guided-tour-id={dataGuidedTourId}
          >
            {editorBody}
          </div>
        </DrawerContent>
      </Drawer>);
  }

  return (
    <>
      <div className='fixed inset-0 z-40' onClick={onCancel}/>
      <div
        className='fixed z-50 bg-background rounded-xl border shadow-md p-6 min-w-[280px] select-none'
        role='dialog'
        aria-label={ariaLabel}
        onMouseDown={header ? undefined : handleDragStart}
        data-guided-tour-id={dataGuidedTourId}
        style={
          panelPos
            ? {position: 'fixed', left: panelPos.x, top: panelPos.y}
            : fallbackDesktopPos
        }>
        {editorBody}
      </div>
    </>
  );
}
