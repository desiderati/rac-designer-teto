import type {ReactNode} from 'react';
import {ModalFrame} from './ModalFrame.tsx';

interface ConfirmationLayoutProps {
  title: ReactNode;
  icon?: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
}

/** Shared confirmation composition; the caller retains Radix semantics and actions. */
export function ConfirmationLayout({title, icon, description, children, actions}: ConfirmationLayoutProps) {
  return <ModalFrame
    className='rac-confirmation-layout'
    header={<div className='rac-confirmation-heading'>{icon ? <span className='rac-confirmation-icon'>{icon}</span> : null}{title}</div>}
    actions={actions}
    contentClassName='space-y-4'>
    {description}
    {children}
  </ModalFrame>;
}
