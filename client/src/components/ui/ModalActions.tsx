import {Fragment, useSyncExternalStore, type ReactNode} from 'react';
import {cn} from '@/components/rac-editor/lib/utils.ts';

const stackedQuery = '(width < 460px)';
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(stackedQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const getSnapshot = () => window.matchMedia(stackedQuery).matches;

export interface ModalActionsProps {
  cancel?: ReactNode;
  confirm: ReactNode;
  className?: string;
}

/** DOM order follows the approved visual order, including keyboard navigation. */
export function ModalActions({cancel, confirm, className}: ModalActionsProps) {
  const stacked = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const pair = Boolean(cancel);
  const cancelAction = <Fragment key='cancel'>{cancel}</Fragment>;
  const confirmAction = <Fragment key='confirm'>{confirm}</Fragment>;
  return <div className={cn('rac-modal-actions', className)} data-layout={stacked ? 'stacked' : 'inline'} data-action-count={pair ? 'pair' : 'single'}>
    {pair ? stacked ? [confirmAction, cancelAction] : [cancelAction, confirmAction] : confirmAction}
  </div>;
}
