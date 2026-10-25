#!/usr/bin/env node

import {configureStorageRetentionSchedule} from '../../server/db.ts';
import {logSafeServerError} from '../../server/_core/safe-error-log.ts';

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const taskUid = option('task-uid');
const enabled = option('enabled');
const minAge = option('min-unreferenced-age-days');
const grace = option('pending-grace-days');
const recognized = new Set([
  '--task-uid', taskUid,
  '--enabled', enabled,
  '--min-unreferenced-age-days', minAge,
  '--pending-grace-days', grace,
]);
const unexpected = process.argv.slice(2).some((argument) => !recognized.has(argument));

if (!taskUid || !enabled || !minAge || !grace || unexpected || !['true', 'false'].includes(enabled)) {
  console.error(JSON.stringify({
    ok: false,
    error: 'Uso: --task-uid <uid> --enabled <true|false> --min-unreferenced-age-days <dias> --pending-grace-days <dias>.',
  }));
  process.exitCode = 2;
} else {
  try {
    await configureStorageRetentionSchedule({
      taskUid,
      enabled: enabled === 'true',
      minUnreferencedAgeDays: Number(minAge),
      pendingGraceDays: Number(grace),
    });
    console.log(JSON.stringify({
      ok: true,
      taskUid,
      enabled: enabled === 'true',
      minUnreferencedAgeDays: Number(minAge),
      pendingGraceDays: Number(grace),
      mode: 'logical-quarantine-only',
    }));
  } catch (error) {
    logSafeServerError('[storage-retention] configuração administrativa falhou', error);
    console.error(JSON.stringify({ok: false, error: 'Não foi possível gravar a configuração de retenção.'}));
    process.exitCode = 1;
  }
}

process.exit(process.exitCode ?? 0);
