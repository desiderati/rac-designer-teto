import {useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';
import {useFloatingEditorViewport} from '../../hooks/useFloatingEditorViewport.ts';
import './CanvasSideEditorPanel.css';

interface CanvasSideEditorPanelProps extends HTMLAttributes<HTMLElement> {
  ariaLabel: string;
  fixedHeight?: boolean;
  children: ReactNode;
  onClose: () => void;
  onEscape?: () => void;
  onConfirm?: () => void;
}

/** Superfície comum dos editores explícitos no Canvas mobile horizontal. */
export function CanvasSideEditorPanel({
  ariaLabel, fixedHeight = false, children, onClose, onEscape, onConfirm, className = '', ...attributes
}: CanvasSideEditorPanelProps) {
  const viewport = useFloatingEditorViewport(true);
  const panelRef = useRef<HTMLElement>(null);
  const maxHeight = Math.min(425, Math.max(0, viewport.height - 16));
  const scrollActions = viewport.height < 160;

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      (onEscape ?? onClose)();
    };
    window.addEventListener('keydown', close, true);
    return () => window.removeEventListener('keydown', close, true);
  }, [onEscape, onClose]);

  useLayoutEffect(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches('input, textarea, select') && panelRef.current?.contains(focused)) {
      focused.scrollIntoView?.({block: 'nearest'});
    }
  }, [viewport.height, viewport.bottom]);

  return <>
    <div aria-hidden='true' className='canvas-side-editor-dismiss' onPointerDown={event => {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }}/>
    <aside {...attributes} ref={panelRef} role='dialog' aria-label={ariaLabel} aria-modal='false'
      className={`canvas-side-editor-panel${fixedHeight ? ' canvas-side-editor-fixed' : ''} ${className}`}
      style={{top: `calc(100% - ${viewport.bottom + viewport.height / 2}px)`, maxHeight}}
      onMouseDown={event => event.stopPropagation()}
      onTouchStart={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}>
      {children}
      {onConfirm ? <ActionDock testId='canvas-side-editor-actions' mobileDocked={false}
        className={`canvas-side-editor-actions${scrollActions ? ' canvas-side-editor-actions-scroll' : ''}`}>
        <div className='grid grid-cols-2 gap-2'>
          <Button type='button' variant='outline' className='h-11 min-w-0 rounded-lg bg-slate-100 px-3 text-sm' onClick={onClose}>Cancelar</Button>
          <Button type='button' className='h-11 min-w-0 rounded-lg bg-blue-600 px-3 text-sm text-white hover:bg-blue-700' onClick={onConfirm}>Confirmar</Button>
        </div>
      </ActionDock> : null}
    </aside>
  </>;
}
