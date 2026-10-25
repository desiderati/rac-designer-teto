import type {ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';

export type InformationTone = 'neutral' | 'info' | 'server' | 'warning' | 'danger' | 'success';
interface InformationPanelProps {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  notice?: ReactNode;
  tone?: InformationTone;
  className?: string;
}

export function InformationPanel({title, icon, children, notice, tone = 'neutral', className}: InformationPanelProps) {
  return <section className={cn('rac-information-panel', className)} data-information-tone={tone}>
    <div className='rac-information-heading'>{icon ? <span className='rac-information-icon' aria-hidden='true'>{icon}</span> : null}<h3>{title}</h3></div>
    <div className='rac-information-content'>{children}</div>
    {notice ? <div className='rac-information-notice'>{notice}</div> : null}
  </section>;
}
