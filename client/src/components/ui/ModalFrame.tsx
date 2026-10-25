import type {ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';

export interface ModalFrameProps {
  header?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  headerTone?: 'plain' | 'section';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
}

/** Explicit regions keep the title and actions outside the only scrollport. */
export function ModalFrame({header, children, actions, headerTone = 'plain', className, headerClassName, contentClassName, actionsClassName}: ModalFrameProps) {
  return <div className={cn('rac-modal-frame', className)} data-rac-modal-frame data-header-tone={headerTone}>
    {header ? <div data-rac-modal-region='header' className={headerClassName}>{header}</div> : null}
    <div data-rac-modal-region='content' className={contentClassName}>{children}</div>
    {actions ? <div data-rac-modal-region='actions' className={actionsClassName}>{actions}</div> : null}
  </div>;
}
