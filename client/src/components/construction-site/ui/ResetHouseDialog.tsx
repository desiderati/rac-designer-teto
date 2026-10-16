import {useState} from 'react';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel} from '@/components/ui/alert-dialog.tsx';
import {Button} from '@/components/ui/button.tsx';

export function ResetHouseDialog({open, onOpenChange, onConfirm}: {
  open: boolean; onOpenChange(open: boolean): void; onConfirm(): Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <AlertDialog open={open} onOpenChange={(value) => { if (!pending) {setError(null); onOpenChange(value);} }}>
    <AlertDialogContent aria-busy={pending} onClick={(event) => event.stopPropagation()}>
      <AlertDialogHeader><AlertDialogTitle>Redefinir Casa?</AlertDialogTitle>
        <AlertDialogDescription>Os pilotis, níveis e demais definições da casa serão apagados. Todas as vistas desta casa serão removidas do Canvas. Os demais objetos do Canvas serão mantidos. A casa voltará ao status Inicial e poderá ser definida do zero.</AlertDialogDescription>
      </AlertDialogHeader>
      {error ? <p role='alert' className='text-sm text-red-700'>{error}</p> : null}
      <AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
        <Button variant='destructive' disabled={pending} onClick={() => {
          setPending(true); setError(null);
          void onConfirm().then(() => onOpenChange(false)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível redefinir a casa.')).finally(() => setPending(false));
        }}>{pending ? 'Redefinindo…' : 'Redefinir Casa'}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
