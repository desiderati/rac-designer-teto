import { useState } from 'react';
import { AlertTriangle, Cloud, Server } from 'lucide-react';
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

/**
 * Conflitos exigem uma decisão explícita. O status transitório de sincronização
 * fica no indicador compacto da TopBar, onde não compete com 3D/Exportar.
 */
export function RemoteSyncStatus() {
  return <RemoteConflictDialog/>;
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

function formatStatus(value: string): string {
  return value === 'in_progress' ? 'Em andamento' : value === 'completed' ? 'Concluída' : 'Arquivada';
}
