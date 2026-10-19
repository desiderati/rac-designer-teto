import {useState} from 'react';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel} from '@/components/ui/alert-dialog.tsx';
import {Button} from '@/components/ui/button.tsx';
export function DestructiveConfirmationDialog({open, onOpenChange, onConfirm, title, description, confirmLabel, pendingLabel}: {
  open: boolean; onOpenChange(open: boolean): void; onConfirm(): void | Promise<void>;
  title: string; description: string; confirmLabel: string; pendingLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <AlertDialog open={open} onOpenChange={value => {if (!pending) {setError(null); onOpenChange(value);}}}>
    <AlertDialogContent aria-busy={pending} onClick={event => event.stopPropagation()}>
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      {error ? <p role='alert' className='text-sm text-red-700'>{error}</p> : null}
      <AlertDialogFooter className='grid grid-cols-2 gap-2 sm:space-x-0'>
        <AlertDialogCancel className='m-0 h-10 w-full' disabled={pending}>Cancelar</AlertDialogCancel>
        <Button className='h-10 w-full' variant='destructive' disabled={pending} onClick={() => {
          setPending(true); setError(null);
          void Promise.resolve().then(onConfirm).then(() => onOpenChange(false))
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a ação.'))
            .finally(() => setPending(false));
        }}>{pending ? pendingLabel : confirmLabel}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
