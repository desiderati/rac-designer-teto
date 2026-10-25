import {useState} from 'react';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel} from '@/components/ui/alert-dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
import {ConfirmationLayout} from '@/components/ui/ConfirmationLayout.tsx';
import {ConfirmationErrorToast} from '@/components/ui/ConfirmationErrorToast.tsx';
export function DestructiveConfirmationDialog({open, onOpenChange, onConfirm, title, description, confirmLabel, pendingLabel}: {
  open: boolean; onOpenChange(open: boolean): void; onConfirm(): void | Promise<void>;
  title: string; description: string; confirmLabel: string; pendingLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <AlertDialog open={open} onOpenChange={value => {if (!pending) {setError(null); onOpenChange(value);}}}>
    <AlertDialogContent aria-busy={pending} onClick={event => event.stopPropagation()}>
      <ConfirmationErrorToast message={error}/>
      <ConfirmationLayout title={<AlertDialogTitle>{title}</AlertDialogTitle>} description={<AlertDialogDescription>{description}</AlertDialogDescription>}
        actions={<AlertDialogFooter cancel={<AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>}
        confirm={<Button variant='destructive' disabled={pending} onClick={() => {
          setPending(true); setError(null);
          void Promise.resolve().then(onConfirm).then(() => onOpenChange(false))
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'))
            .finally(() => setPending(false));
        }}>{pending ? pendingLabel : confirmLabel}</Button>}/>}/>
    </AlertDialogContent>
  </AlertDialog>;
}
