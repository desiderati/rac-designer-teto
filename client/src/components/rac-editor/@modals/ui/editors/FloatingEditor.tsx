import React, {ReactNode, useLayoutEffect, useRef} from 'react';
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
import {useFloatingEditorViewport} from '@/components/rac-editor/@modals/hooks/useFloatingEditorViewport.ts';
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

  const viewport = useFloatingEditorViewport(isOpen && isMobile && presentation === 'floating');
  const contentRef = useRef<HTMLDivElement>(null);
  const isDrawer = isMobile && presentation === 'floating';
  // Com o teclado em paisagem, reservar o rodapé pode deixar menos espaço que um campo.
  const scrollWholeEditor = isDrawer && viewport.height < 160;

  useLayoutEffect(() => {
    if (!isOpen || !isMobile) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches('input, textarea, select') && contentRef.current?.contains(focused)) {
      focused.scrollIntoView?.({block: 'nearest'});
    }
  }, [isOpen, isMobile, viewport.height, viewport.bottom]);

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
    <div
      className={isDrawer
        ? `flex min-h-0 flex-1 flex-col gap-4${scrollWholeEditor ? ' overflow-y-auto overscroll-contain' : ''}`
        : 'flex flex-col gap-4'}
      data-vaul-no-drag={isDrawer ? '' : undefined}
    >
      <div ref={contentRef} className={isDrawer && !scrollWholeEditor ? 'flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain' : 'flex shrink-0 flex-col gap-4'} data-vaul-no-drag>
        {header ? <div className={presentation === 'inline' ? '' : 'cursor-move'} onMouseDown={presentation === 'inline' ? undefined : handleDragStart}>{header}</div> : null}

        <div className={presentation === 'inline'
          ? 'piloti-inline-card min-w-0 shrink-0 space-y-4 rounded-xl bg-white p-2'
          : 'shrink-0 space-y-4 rounded-xl bg-white p-4'} data-no-drag>
          {cardContent}
        </div>
      </div>

      {presentation !== 'inline' ? <ActionDock
        testId='floating-editor-actions'
        surface={isMobile ? 'drawer' : 'dialog'}
        spacing='flush'
        mobileDocked
        className={scrollWholeEditor ? 'static mx-0 mt-0 w-full shrink-0' : isMobile ? 'mt-0 shrink-0' : undefined}
      >
        <div className='grid w-full grid-cols-2 gap-4 [&>button]:h-auto [&>button]:min-h-10 [&>button]:min-w-0 [&>button]:whitespace-normal [&>button]:py-2' data-no-drag>
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
      </ActionDock> : null}
    </div>;

  if (presentation === 'inline') {
    return isOpen ? (
      <section aria-label={ariaLabel} className='min-w-0 rounded-2xl bg-slate-100 p-2 text-slate-950'>
        {editorBody}
      </section>
    ) : null;
  }

  if (isMobile) {
    return (
      <Drawer open={isOpen} repositionInputs={false} onOpenChange={(open) => !open && onCancel()}>
        <DrawerContent
          className='mt-0 overflow-hidden'
          style={{maxHeight: Math.max(0, viewport.height - 8), bottom: viewport.bottom}}
        >
          <DrawerHeader className='sr-only'>
            <DrawerTitle>{ariaLabel}</DrawerTitle>
            <DrawerDescription>
              Edite as propriedades do item selecionado e confirme ou cancele a alteração.
            </DrawerDescription>
          </DrawerHeader>
          <div
            className='flex min-h-0 flex-1 flex-col px-4 pb-4'
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
