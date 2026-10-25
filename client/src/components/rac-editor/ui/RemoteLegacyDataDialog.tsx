import { Database, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {ConfirmationLayout} from '@/components/ui/ConfirmationLayout.tsx';
import {InformationPanel} from '@/components/ui/InformationPanel.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {ConfirmationErrorToast} from '@/components/ui/ConfirmationErrorToast.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

export function RemoteLegacyDataDialog({
  open,
  onConfirmDiscard,
  onKeepLocal,
  busy = false,
  error,
}: {
  open: boolean;
  onConfirmDiscard: () => Promise<void>;
  onKeepLocal: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !busy) onKeepLocal(); }}>
      <DialogContent hideCloseButton className='max-w-lg border-amber-200 bg-white'>
        <ConfirmationErrorToast message={error}/>
        <ConfirmationLayout
          title={<DialogTitle>Encontramos dados locais antigos</DialogTitle>}
          icon={<span className='bg-amber-100 text-amber-700'><ShieldAlert className='h-5 w-5'/></span>}
          description={<DialogDescription>Existe uma cópia de Construções TETO salva neste navegador. A base remota é a fonte oficial desta versão do RAC Designer.</DialogDescription>}
          actions={<ActionDock testId='remote-legacy-data-actions' surface='dialog' spacing='flush'>
            <ModalActions
              cancel={<Button type='button' data-action='cancel' variant='outline' disabled={busy} onClick={onKeepLocal}>Manter e sair</Button>}
              confirm={<Button type='button' disabled={busy} onClick={() => void onConfirmDiscard()}>{busy ? 'Limpando dados…' : 'Apagar dados locais e continuar'}</Button>}/>
          </ActionDock>}>
          <InformationPanel title='O que acontecerá?' icon={<Database/>} tone='warning' notice='Esta ação é necessária para evitar misturar uma cópia antiga com a base compartilhada.'>
            <p>Os dados locais serão apagados deste navegador e a base global será carregada do servidor. Nada será enviado automaticamente.</p>
          </InformationPanel>
        </ConfirmationLayout>
      </DialogContent>
    </Dialog>
  );
}

export function LegacyDataBlockedState({ onReview }: { onReview: () => void }) {
  return (
    <div className='grid h-full place-items-center px-6 text-center'>
      <section className='max-w-md rounded-2xl border border-amber-200 bg-white/95 p-7 shadow-sm'>
        <ShieldAlert className='mx-auto h-8 w-8 text-amber-600'/>
        <h1 className='mt-3 text-xl font-bold text-slate-900'>A base remota está protegida</h1>
        <p className='mt-2 text-sm leading-6 text-slate-600'>Os dados locais continuam intactos. Para entrar na base global, revise a confirmação e escolha apagá-los explicitamente.</p>
        <Button type='button' className='mt-5' onClick={onReview}>Revisar decisão</Button>
      </section>
    </div>
  );
}
