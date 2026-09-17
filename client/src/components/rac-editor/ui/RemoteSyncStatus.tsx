import { useState } from 'react';
import { AlertTriangle, Check, Cloud, CloudOff, RefreshCw, Server, X } from 'lucide-react';
import { useRemoteSync } from '@/contexts/RemoteSyncContext.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';

export function RemoteSyncStatus() {
  const sync = useRemoteSync();
  const status = getStatusCopy(sync.status);

  return (
    <>
      <div className='pointer-events-none fixed right-4 top-4 z-40 flex max-w-[min(92vw,420px)] flex-col items-end gap-2'>
        <div
          role='status'
          aria-live='polite'
          className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-md ${status.className}`}
        >
          <status.Icon className={`h-3.5 w-3.5 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} aria-hidden='true'/>
          <span>{status.label}</span>
          {sync.lastSyncedAt && sync.status === 'synced' ? (
            <span className='hidden font-normal opacity-70 sm:inline'>· {formatTime(sync.lastSyncedAt)}</span>
          ) : null}
          {sync.status === 'error' ? (
            <button type='button' aria-label='Fechar erro de sincronização' onClick={sync.dismissError} className='rounded-full p-0.5 hover:bg-black/10'>
              <X className='h-3.5 w-3.5'/>
            </button>
          ) : null}
        </div>
        {sync.errorMessage && sync.status !== 'conflict' ? (
          <div className='pointer-events-auto flex items-center gap-3 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700 shadow-md'>
            <span className='max-w-64'>{sync.errorMessage}</span>
            <Button type='button' size='sm' variant='outline' className='h-7 bg-white text-xs' onClick={() => void sync.retry()}>
              Tentar novamente
            </Button>
          </div>
        ) : null}
      </div>
      <RemoteConflictDialog/>
    </>
  );
}

function RemoteConflictDialog() {
  const sync = useRemoteSync();
  const conflict = sync.conflict;
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const local = conflict.localState.constructionSite;
  const remote = conflict.remoteState.constructionSite;

  const resolve = async (action: () => Promise<void>) => {
    setIsResolving(true);
    try {
      await action();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent hideCloseButton className='max-w-2xl border-amber-200 bg-white'>
        <DialogHeader>
          <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700'>
            <AlertTriangle className='h-5 w-5'/>
          </div>
          <DialogTitle>Conflito de sincronização</DialogTitle>
          <DialogDescription>
            Outra sessão salvou esta Construção TETO enquanto você editava. Escolha qual versão deve permanecer na base compartilhada.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-3 sm:grid-cols-2'>
          <ConflictVersion label='Suas alterações' state={local} tone='blue'/>
          <ConflictVersion label={`Versão do servidor · v${conflict.remoteVersion}`} state={remote} tone='amber'/>
        </div>

        <div className='rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600'>
          <strong className='text-slate-800'>Importante:</strong> manter suas alterações substituirá a versão do servidor. Usar a versão remota descartará apenas as alterações locais deste documento.
        </div>

        <DialogFooter className='gap-2 sm:justify-between'>
          <Button type='button' variant='outline' disabled={isResolving} onClick={() => void resolve(sync.useRemoteVersion)}>
            <Server className='mr-2 h-4 w-4'/>
            Usar versão remota
          </Button>
          <Button type='button' disabled={isResolving} onClick={() => void resolve(sync.keepLocalVersion)}>
            <Cloud className='mr-2 h-4 w-4'/>
            Manter minhas alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConflictVersion({
  label,
  state,
  tone,
}: {
  label: string;
  state: { externalCode: string; constructionDate: string; status: string };
  tone: 'blue' | 'amber';
}) {
  return (
    <div className={`rounded-xl border p-3 ${tone === 'blue' ? 'border-blue-200 bg-blue-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
      <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500'>{label}</p>
      <p className='mt-2 text-sm font-bold text-slate-900'>{state.externalCode}</p>
      <p className='mt-1 text-xs text-slate-600'>Data da construção: {state.constructionDate}</p>
      <p className='mt-1 text-xs text-slate-600'>Status: {formatStatus(state.status)}</p>
    </div>
  );
}

function getStatusCopy(status: ReturnType<typeof useRemoteSync>['status']) {
  if (status === 'syncing') return { label: 'Sincronizando…', className: 'border-blue-200 bg-blue-50 text-blue-700', Icon: RefreshCw };
  if (status === 'pending') return { label: 'Alteração pendente', className: 'border-amber-200 bg-amber-50 text-amber-700', Icon: CloudOff };
  if (status === 'conflict') return { label: 'Ação necessária', className: 'border-amber-300 bg-amber-100 text-amber-800', Icon: AlertTriangle };
  if (status === 'error') return { label: 'Falha ao sincronizar', className: 'border-red-200 bg-red-50 text-red-700', Icon: CloudOff };
  return { label: 'Sincronizado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: Check };
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value === 'in_progress' ? 'Em andamento' : value === 'completed' ? 'Concluída' : 'Arquivada';
}
