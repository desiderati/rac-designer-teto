import React, {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
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
  isOpen: boolean;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  header: ReactNode;
  cardContent: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  dataGuidedTourId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FloatingEditor({
  isOpen,
  isMobile,
  anchorPosition,
  header,
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
      <div className='cursor-move' onMouseDown={handleDragStart}>{header}</div>

      <div className='bg-white rounded-xl p-4 space-y-4' data-no-drag>
        {cardContent}
      </div>

      <div className='flex w-full flex-col gap-3' data-no-drag>
        <div className='flex w-full gap-[16px]'>
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
      </div>
    </div>;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent>
          <DrawerHeader className='sr-only'>
            <DrawerTitle>Editor do item selecionado</DrawerTitle>
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
