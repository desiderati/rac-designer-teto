import { Database, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

export function RemoteLegacyDataDialog({
  open,
  onConfirmDiscard,
  onKeepLocal,
  busy = false,
}: {
  open: boolean;
  onConfirmDiscard: () => Promise<void>;
  onKeepLocal: () => void;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !busy) onKeepLocal(); }}>
      <DialogContent hideCloseButton className='max-w-lg border-amber-200 bg-white'>
        <DialogHeader>
          <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700'>
            <ShieldAlert className='h-5 w-5'/>
          </div>
          <DialogTitle>Encontramos dados locais antigos</DialogTitle>
          <DialogDescription>
            Existe uma cópia de Construções TETO salva neste navegador. A base remota é a fonte oficial desta versão do RAC Designer.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950'>
          <div className='flex gap-3'>
            <Database className='mt-0.5 h-5 w-5 shrink-0 text-amber-700'/>
            <div>
              <p className='font-bold'>O que acontecerá?</p>
              <p>Os dados locais serão apagados deste navegador e a base global será carregada do servidor. Nada será enviado automaticamente.</p>
            </div>
          </div>
          <p className='border-t border-amber-200 pt-3 text-xs text-amber-800'>Esta ação é necessária para evitar misturar uma cópia antiga com a base compartilhada.</p>
        </div>

        <ActionDock testId='remote-legacy-data-actions' surface='dialog' spacing='flush'>
          <div className='flex w-full flex-wrap gap-2 sm:justify-between'>
            <Button type='button' variant='outline' disabled={busy} onClick={onKeepLocal}>
              Manter e sair
            </Button>
            <Button type='button' disabled={busy} onClick={() => void onConfirmDiscard()}>
              {busy ? 'Limpando dados…' : 'Apagar dados locais e continuar'}
            </Button>
          </div>
        </ActionDock>
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
