import React, {ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {Drawer, DrawerContent} from '@/components/ui/drawer.tsx';
import {useFloatingEditor} from '@/components/rac-editor/modals/editors/hooks/useFloatingEditor.ts';

interface FloatingEditorProps {
  isOpen: boolean;
  isMobile: boolean;
  anchorPosition?: { x: number; y: number; };
  header: ReactNode;
  cardContent: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
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
  onConfirm,
  onCancel,
}: FloatingEditorProps) {

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
          <Button variant='outline' className='flex-1 bg-white' onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button className='flex-1' onClick={onConfirm} disabled={isConfirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent>
          <div className='px-4 pb-4'>
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
        style={
          panelPos
            ? {position: 'fixed', left: panelPos.x, top: panelPos.y}
            : anchorPosition
              ? {position: 'fixed', left: anchorPosition.x + 12, top: anchorPosition.y + 12}
              : {position: 'fixed', left: 24, top: 24}
        }>
        {editorBody}
      </div>
    </>
  );
}
