import {
  getStorageAssetLifecycleSummary,
  getStorageRetentionScheduleByTaskUid,
  quarantineUnreferencedStorageAssets,
} from './db.ts';

export type StorageRetentionHeartbeatResult = {
  ok: true;
  skipped?: 'orphan_schedule';
  taskUid: string;
  quarantined?: number;
  inspected?: number;
  lifecycle?: Awaited<ReturnType<typeof getStorageAssetLifecycleSummary>>;
};

/**
 * Executa somente a transição reversível para quarentena do ledger local.
 * Não enumera e não remove arquivos do Storage Manus.
 */
export async function runStorageRetentionHeartbeat(taskUid: string): Promise<StorageRetentionHeartbeatResult> {
  const schedule = await getStorageRetentionScheduleByTaskUid(taskUid);
  if (!schedule) return {ok: true, skipped: 'orphan_schedule', taskUid};

  const result = await quarantineUnreferencedStorageAssets({
    minUnreferencedAgeDays: schedule.minUnreferencedAgeDays,
    pendingGraceDays: schedule.pendingGraceDays,
  });
  const lifecycle = await getStorageAssetLifecycleSummary();
  return {ok: true, taskUid, ...result, lifecycle};
}
