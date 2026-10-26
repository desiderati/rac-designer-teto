import type { Request, Response } from 'express';
import {
  getStorageAssetLifecycleSummary,
  getStorageRetentionScheduleByTaskUid,
  quarantineUnreferencedStorageAssets,
} from './db.ts';
import { sdk } from './_core/sdk.ts';
import { logSafeServerError } from './_core/safe-error-log.ts';

export const STORAGE_RETENTION_SCHEDULED_PATH = '/api/scheduled/storage-retention-quarantine';

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

/** Handler HTTP usado pelo Heartbeat; o corpo não participa da identificação da política. */
export async function handleStorageRetentionHeartbeat(req: Request, res: Response): Promise<void> {
  const timestamp = new Date().toISOString();
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({error: 'cron-only', timestamp});
      return;
    }

    res.json(await runStorageRetentionHeartbeat(user.taskUid));
  } catch (error) {
    logSafeServerError('[storage-retention] heartbeat falhou', error);
    res.status(500).json({
      error: 'storage-retention-failed',
      timestamp,
      context: {url: req.originalUrl, taskUid: 'unavailable'},
    });
  }
}
