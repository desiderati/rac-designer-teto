import { useState } from 'react';
import { AlertTriangle, CircleCheck, Cloud, Server } from 'lucide-react';
import {useRemoteSync} from '@/contexts/useRemoteSync.ts';
import { summarizeConstructionSiteChanges } from '@/domain/construction-site/construction-site-conflict-summary.ts';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import {ConfirmationLayout} from '@/components/ui/ConfirmationLayout.tsx';
import {InformationPanel, type InformationTone} from '@/components/ui/InformationPanel.tsx';
import {ModalActions} from '@/components/ui/ModalActions.tsx';
import {ActionDock} from '@/components/ui/ActionDock.tsx';

/**
 * Conflitos exigem uma decisão explícita. O status transitório de sincronização
 * fica no indicador compacto da TopBar, onde não compete com 3D/Exportar.
 */
export function RemoteSyncStatus({visible = true}: {visible?: boolean}) {
  if (!visible) return null;
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
  const isRemoval = conflict.operation === 'remove';
  const canRemove = remote.status === 'archived';
  const remoteOnlySummary = summarizeRemoteOnlyEntities(conflict.remoteOnlyEntities);
  const localChanges = isRemoval ? ['Exclusão desta Construção TETO solicitada.']
    : summarizeConstructionSiteChanges(conflict.baseState, conflict.localState);
  const remoteChanges = summarizeConstructionSiteChanges(conflict.baseState, conflict.remoteState);

  const resolve = async (action: () => Promise<void>) => {
    setIsResolving(true);
    try {
      await action();
    } finally {
      setIsResolving(false);
    }
  };

  return <Dialog open onOpenChange={() => undefined}>
    <DialogContent hideCloseButton className='max-w-2xl'>
      <ConfirmationLayout
        title={<DialogTitle>Conflito de sincronização</DialogTitle>}
        icon={<span className='bg-amber-100 text-amber-700'><AlertTriangle className='h-5 w-5'/></span>}
        description={<DialogDescription>{isRemoval
          ? 'Outra sessão alterou esta Construção TETO antes da exclusão. Revise a versão atual antes de manter ou confirmar a exclusão.'
          : 'Outra sessão salvou esta Construção TETO enquanto você editava. Revise as diferenças antes de escolher como continuar.'}</DialogDescription>}
        actions={<ActionDock testId='remote-sync-conflict-actions' surface='dialog' spacing='flush'>
          <ModalActions
            cancel={<Button type='button' data-action='cancel' variant='outline' disabled={isResolving} onClick={() => void resolve(sync.useRemoteVersion)}><Server className='mr-2 h-4 w-4'/>Usar versão remota</Button>}
            confirm={<Button type='button' variant={isRemoval ? 'destructive' : 'default'} disabled={isResolving || (isRemoval ? !canRemove : hasMergeConflicts)} onClick={() => void resolve(sync.keepLocalVersion)}><Cloud className='mr-2 h-4 w-4'/>{isRemoval ? 'Confirmar exclusão' : 'Mesclar sem remover dados'}</Button>}/>
        </ActionDock>}>
        <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
          <ConflictVersion label={`${isRemoval ? 'Exclusão solicitada' : 'Suas alterações'} · base v${conflict.baseState?.constructionSite.documentVersion ?? local.documentVersion ?? '?'}`}
            state={local} tone='blue' dateLabel='Última alteração local' changedAt={local.updatedAt} changes={localChanges}/>
          <ConflictVersion label={`Versão do servidor · v${conflict.remoteVersion}`}
            state={remote} tone='amber' dateLabel='Salva no servidor' changedAt={conflict.remoteSavedAt} changes={remoteChanges}/>
        </div>
        <SyncNotices isRemoval={isRemoval} canRemove={canRemove} hasMergeConflicts={hasMergeConflicts} remoteOnlySummary={remoteOnlySummary}/>
        <InformationPanel title='Usar a versão remota'>
          <p>{isRemoval ? 'Cancela sua intenção de excluir e mantém a construção compartilhada.' : 'Preserva o que já está compartilhado e descarta apenas as alterações locais deste documento.'}</p>
        </InformationPanel>
      </ConfirmationLayout>
    </DialogContent>
  </Dialog>;
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
    <InformationPanel title={label} tone={tone === 'blue' ? 'info' : 'server'} icon={tone === 'blue' ? <Cloud/> : <Server/>} className='rac-conflict-version'>
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
    </InformationPanel>
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

function SyncNotices({isRemoval, canRemove, hasMergeConflicts, remoteOnlySummary}: {isRemoval:boolean; canRemove:boolean; hasMergeConflicts:boolean; remoteOnlySummary:string | null}) {
  const title = isRemoval || remoteOnlySummary ? 'Atenção' : hasMergeConflicts ? 'Proteção contra perda' : 'Merge seguro';
  const tone: InformationTone = hasMergeConflicts && !isRemoval ? 'danger' : isRemoval || remoteOnlySummary ? 'warning' : 'success';
  const Icon = tone === 'success' ? CircleCheck : AlertTriangle;
  return <InformationPanel title={title} tone={tone} icon={<Icon/>}>
    {isRemoval ? <p>{canRemove ? 'Confirmar exclusão removerá a versão remota mostrada, incluindo as alterações da outra sessão.' : 'A construção não está mais arquivada e não pode ser excluída. Use a versão remota para continuar.'}</p>
      : <p>{hasMergeConflicts ? 'Não é seguro combinar automaticamente estas alterações. Nenhuma versão será substituída sem uma nova ação explícita.' : 'As alterações independentes serão combinadas sem remover entidades criadas pela outra sessão.'}</p>}
    {remoteOnlySummary && !isRemoval ? <p>{remoteOnlySummary}. Esses dados não serão apagados pelo merge.</p> : null}
    {hasMergeConflicts && !isRemoval ? <><p className='font-semibold'>Há alterações concorrentes no mesmo dado.</p><p>Use a versão remota e reabra a Construção para reaplicar manualmente o que estava sendo editado.</p></> : null}
  </InformationPanel>;
}
