import {type ReactNode, useLayoutEffect, useRef} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {ModalFrame} from '@/components/ui/ModalFrame.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle} from '@/components/ui/drawer.tsx';
import {useFloatingEditor} from '@/components/rac-editor/@modals/hooks/useFloatingEditor.ts';
import {useFloatingEditorViewport} from '@/components/rac-editor/@modals/hooks/useFloatingEditorViewport.ts';
import {useEditorPorts} from '@/bootstrap/editor-bootstrap.ts';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import './FloatingEditor.css';

interface FloatingEditorProps {
  presentation?: 'floating' | 'inline';
  isOpen: boolean;
  isMobile: boolean;
  anchorPosition?: {x: number; y: number};
  header?: ReactNode;
  headerTone?: 'plain' | 'section';
  ariaLabel?: string;
  cardContent: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  dataGuidedTourId?: string;
  className?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FloatingEditor({presentation = 'floating', isOpen, isMobile, anchorPosition,
  header, headerTone = 'plain', ariaLabel = 'Editor do item selecionado', cardContent,
  confirmLabel, cancelLabel = 'Cancelar', isConfirmDisabled = false, dataGuidedTourId,
  className, onConfirm, onCancel}: FloatingEditorProps) {
  const isDrawer = isMobile && presentation === 'floating';
  const viewport = useFloatingEditorViewport(isOpen && isDrawer);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const {settingsPort} = useEditorPorts();
  const {openEditorsAtFixedPosition} = settingsPort.getSettings();
  const {panelPos, handleDragStart} = useFloatingEditor({
    isOpen: isOpen && presentation === 'floating', anchorPosition, onCancel, panelRef, initialTop: 8,
  });
  useLayoutEffect(() => {
    if (!isOpen || !isMobile) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches('input, textarea, select, [contenteditable="true"]') && contentRef.current?.contains(focused)) {
      focused.scrollIntoView?.({block: 'nearest'});
    }
  }, [isOpen, isMobile, viewport.height, viewport.bottom]);
  if (!isOpen) return null;

  const body = <ModalFrame
    className={cn('rac-floating-frame', presentation === 'inline' && 'rac-floating-inline-frame')}
    headerTone={headerTone}
    header={header ? <div className={presentation === 'inline' ? undefined : 'cursor-move'}
      onMouseDown={presentation === 'inline' ? undefined : handleDragStart}>{header}</div> : undefined}
    actions={presentation === 'inline' ? undefined : <ActionDock testId='floating-editor-actions'
      mobileDocked={false} className='rac-floating-actions'>
      <ModalActions
        cancel={<Button type='button' data-action='cancel' variant='outline' onClick={onCancel}>{cancelLabel}</Button>}
        confirm={<Button type='button' onClick={onConfirm} disabled={isConfirmDisabled}>{confirmLabel}</Button>}/>
    </ActionDock>}
  >
    <div ref={contentRef} data-no-drag data-vaul-no-drag
      className={cn('rac-floating-content', presentation !== 'inline' && 'space-y-4', presentation === 'inline' && 'piloti-inline-card')}>
      {cardContent}
    </div>
  </ModalFrame>;

  if (presentation === 'inline') return <section aria-label={ariaLabel}
    className='rac-theme rac-floating-inline min-w-0 rounded-2xl bg-slate-100 p-2 text-slate-950'>{body}</section>;

  if (isDrawer) return <Drawer open repositionInputs={false} onOpenChange={open => !open && onCancel()}>
    <DrawerContent className={cn('rac-theme rac-modal-shell rac-floating-drawer mt-0 overflow-hidden', className)}
      style={{maxHeight: Math.max(0, viewport.height - 8), bottom: viewport.bottom}}>
      <DrawerHeader className='sr-only'><DrawerTitle>{ariaLabel}</DrawerTitle>
        <DrawerDescription>Edite as propriedades do item selecionado e confirme ou cancele a alteração.</DrawerDescription>
      </DrawerHeader>
      <div className='rac-floating-drawer-inner' data-guided-tour-id={dataGuidedTourId}>{body}</div>
    </DrawerContent>
  </Drawer>;

  const position = panelPos ?? (openEditorsAtFixedPosition ? {x: 88, y: 8}
    : anchorPosition ? {x: anchorPosition.x + 12, y: 8} : {x: 24, y: 8});
  return <>
    <div className='fixed inset-0 z-40' onClick={onCancel}/>
    <div ref={panelRef} role='dialog' aria-label={ariaLabel} data-guided-tour-id={dataGuidedTourId}
      className={cn('rac-theme rac-modal-shell rac-standard-modal rac-floating-editor select-none', className)}
      onMouseDown={header ? undefined : handleDragStart}
      style={{left: `clamp(8px, ${position.x}px, calc(100vw - var(--rac-editor-width, 304px) - 8px))`, top: position.y}}>
      {body}
    </div>
  </>;
}
