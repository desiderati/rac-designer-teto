import type {ReactNode} from 'react';

interface ToastMessageProps {
  title: ReactNode;
  detail?: ReactNode | (() => ReactNode);
  children?: ReactNode;
  leadingIcon?: ReactNode;
}

/** Conteúdo compartilhado pelo host Sonner, progresso do PDF e decisão de imagem 3D. */
export function ToastMessage({title, detail, children, leadingIcon}: ToastMessageProps) {
  const resolvedDetail = typeof detail === 'function' ? detail() : detail;
  return (
    <div className='rac-toast-message'>
      {leadingIcon ? <span className='rac-toast-inline-icon' aria-hidden='true'>{leadingIcon}</span> : null}
      <p className='rac-toast-task-title'>{title}</p>
      {resolvedDetail ? <p className='rac-toast-task-detail'>{resolvedDetail}</p> : null}
      {children}
    </div>
  );
}
