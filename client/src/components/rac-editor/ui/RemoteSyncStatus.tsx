import { useState } from 'react';
import { AlertTriangle, Cloud, Server } from 'lucide-react';
import { useRemoteSync } from '@/contexts/RemoteSyncContext.tsx';
import { summarizeConstructionSiteChanges } from '@/domain/construction-site/construction-site-conflict-summary.ts';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

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
  const hasMergeConflicts = conflict.conflicts.length > 0;
  const remoteOnlySummary = summarizeRemoteOnlyEntities(conflict.remoteOnlyEntities);
  const localChanges = summarizeConstructionSiteChanges(conflict.baseState, conflict.localState);
  const remoteChanges = summarizeConstructionSiteChanges(conflict.baseState, conflict.remoteState);

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
      <DialogContent hideCloseButton className='flex max-h-[calc(100dvh-1rem)] min-w-0 w-[calc(100vw-1rem)] max-w-2xl flex-col gap-0 overflow-hidden border-amber-200 bg-white p-0 sm:w-[calc(100vw-2rem)]'>
        <DialogHeader className='shrink-0 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6'>
          <div className='mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700'>
            <AlertTriangle className='h-5 w-5'/>
          </div>
          <DialogTitle>Conflito de sincronização</DialogTitle>
          <DialogDescription>
            Outra sessão salvou esta Construção TETO enquanto você editava. Revise as diferenças antes de escolher como continuar.
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:px-6'>
          <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
            <ConflictVersion
              label={`Suas alterações · base v${conflict.baseState?.constructionSite.documentVersion ?? local.documentVersion ?? '?'}`}
              state={local}
              tone='blue'
              dateLabel='Última alteração local'
              changedAt={local.updatedAt}
              changes={localChanges}
            />
            <ConflictVersion
              label={`Versão do servidor · v${conflict.remoteVersion}`}
              state={remote}
              tone='amber'
              dateLabel='Salva no servidor'
              changedAt={conflict.remoteSavedAt}
              changes={remoteChanges}
            />
          </div>

          <div className={`rounded-lg px-3 py-2 text-xs leading-5 ${hasMergeConflicts ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
            <strong>{hasMergeConflicts ? 'Proteção contra perda:' : 'Merge seguro:'}</strong>{' '}
            {hasMergeConflicts
              ? 'não é seguro combinar automaticamente estas alterações. Nenhuma versão será substituída sem uma nova ação explícita.'
              : 'as alterações independentes serão combinadas sem remover entidades criadas pela outra sessão.'}
          </div>

          {remoteOnlySummary && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900'>
              <strong>Atenção:</strong> {remoteOnlySummary}. Esses dados não serão apagados pelo merge.
            </div>
          )}

          {hasMergeConflicts && (
            <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800'>
              <p className='font-semibold'>Há alterações concorrentes no mesmo dado.</p>
              <p className='mt-1'>Use a versão remota e reabra a Construção para reaplicar manualmente o que estava sendo editado.</p>
            </div>
          )}

          <div className='rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600'>
            <strong className='text-slate-800'>Usar a versão remota</strong> preserva o que já está compartilhado e descarta apenas as alterações locais deste documento.
          </div>
        </div>

        <ActionDock testId='remote-sync-conflict-actions' surface='dialog' mobileDocked={false} className='shrink-0 border-t border-slate-200 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6'>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-between'>
            <Button className='min-h-10 w-full whitespace-normal sm:w-auto' type='button' variant='outline' disabled={isResolving} onClick={() => void resolve(sync.useRemoteVersion)}>
              <Server className='mr-2 h-4 w-4'/>
              Usar versão remota
            </Button>
            <Button className='min-h-10 w-full whitespace-normal sm:w-auto' type='button' disabled={isResolving || hasMergeConflicts} onClick={() => void resolve(sync.keepLocalVersion)}>
              <Cloud className='mr-2 h-4 w-4'/>
              Mesclar sem remover dados
            </Button>
          </div>
        </ActionDock>
      </DialogContent>
    </Dialog>
  );
}

function ConflictVersion({
  label,
  state,
  tone,
  dateLabel,
  changedAt,
  changes,
}: {
  label: string;
  state: { externalCode: string; constructionDate: string; status: string };
  tone: 'blue' | 'amber';
  dateLabel: string;
  changedAt?: string;
  changes: string[];
}) {
  return (
    <div className={`min-w-0 rounded-xl border p-3 ${tone === 'blue' ? 'border-blue-200 bg-blue-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
      <p className='text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500'>{label}</p>
      <p className='mt-2 break-words text-sm font-bold text-slate-900'>{state.externalCode}</p>
      <p className='mt-1 text-xs text-slate-600'>Data da construção: {state.constructionDate}</p>
      <p className='mt-1 text-xs text-slate-600'>Status: {formatStatus(state.status)}</p>
      <p className='mt-1 text-xs text-slate-600'>{dateLabel}: {formatVersionDate(changedAt)}</p>
      <div className='mt-3 border-t border-slate-200 pt-2'>
        <p className='text-xs font-semibold text-slate-800'>Mudanças por entidade desde a versão-base</p>
        <ul className='mt-1 list-disc space-y-0.5 pl-4 text-xs leading-5 text-slate-700'>
          {changes.map((change) => <li key={change}>{change}</li>)}
        </ul>
      </div>
    </div>
  );
}

function formatVersionDate(value?: string): string {
  if (!value) return 'Horário indisponível';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Horário indisponível';
  return new Intl.DateTimeFormat('pt-BR', {dateStyle: 'short', timeStyle: 'short'}).format(date);
}

function summarizeRemoteOnlyEntities(entities: Array<{kind: string}>): string | null {
  if (entities.length === 0) return null;
  const counts = new Map<string, number>();
  for (const entity of entities) counts.set(entity.kind, (counts.get(entity.kind) ?? 0) + 1);
  const labels: Record<string, [string, string]> = {
    houses: ['casa', 'casas'],
    families: ['família', 'famílias'],
    monitors: ['monitor', 'monitores'],
    communities: ['comunidade', 'comunidades'],
  };
  const parts = [...counts.entries()].map(([kind, count]) => `${count} ${labels[kind]?.[count === 1 ? 0 : 1] ?? kind}`);
  return `a versão do servidor contém ${parts.join(', ')} que sua sessão ainda não tinha`;
}

function formatStatus(value: string): string {
  return value === 'in_progress' ? 'Em andamento' : value === 'completed' ? 'Concluída' : 'Arquivada';
}
