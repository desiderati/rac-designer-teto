#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {configureStorageRetentionSchedule} from '../../server/db.ts';
import {STORAGE_RETENTION_SCHEDULED_PATH} from '../../server/storage-retention.ts';
import {logSafeServerError} from '../../server/_core/safe-error-log.ts';

const JOB_NAME = 'rac-storage-retention-quarantine';
const DEFAULT_CRON = '0 0 4 * * *';
const DEFAULT_MIN_UNREFERENCED_AGE_DAYS = 30;
const DEFAULT_PENDING_GRACE_DAYS = 7;
const DESCRIPTION = 'Quarentena lógica diária de assets não referenciados do RAC Designer TETO';

type HeartbeatJob = {
  name?: string;
  task_uid?: string;
  taskUid?: string;
  paused?: boolean;
  enabled?: boolean;
};

type HeartbeatList = {jobs?: HeartbeatJob[]};

function option(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`Valor inválido: ${value}`);
  return parsed;
}

function parseJsonOutput<T>(output: string): T {
  try {
    return JSON.parse(output.trim()) as T;
  } catch {
    // O CLI pode emitir mensagens informativas antes do JSON.
  }
  const lines = output.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line) as T;
    } catch {
      // O CLI pode emitir mensagens informativas antes do JSON.
    }
  }
  throw new Error(`Heartbeat CLI não retornou JSON válido: ${JSON.stringify(output)}`);
}

function heartbeat(args: string[]): unknown {
  return parseJsonOutput(execFileSync('manus-heartbeat', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

function taskUid(job: HeartbeatJob): string | undefined {
  return job.task_uid ?? job.taskUid;
}

const cron = option('cron') ?? DEFAULT_CRON;
const minUnreferencedAgeDays = parsePositiveInteger(
  option('min-unreferenced-age-days'),
  DEFAULT_MIN_UNREFERENCED_AGE_DAYS,
);
const pendingGraceDays = parsePositiveInteger(
  option('pending-grace-days'),
  DEFAULT_PENDING_GRACE_DAYS,
);
const apply = hasFlag('apply');

try {
  const listed = heartbeat(['list']) as HeartbeatList;
  const existing = listed.jobs?.find((job) => job.name === JOB_NAME);
  const existingTaskUid = existing ? taskUid(existing) : undefined;
  const action = existingTaskUid ? 'update' : 'create';

  if (!apply) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      action,
      jobName: JOB_NAME,
      taskUid: existingTaskUid ?? null,
      cron,
      path: STORAGE_RETENTION_SCHEDULED_PATH,
      minUnreferencedAgeDays,
      pendingGraceDays,
      mode: 'logical-quarantine-only',
      nextStep: 'execute with --apply after the WebDev deployment is available',
    }));
  } else {
    const provisioned = existingTaskUid
      ? heartbeat([
        'update', '--task-uid', existingTaskUid, '--cron', cron,
        '--path', STORAGE_RETENTION_SCHEDULED_PATH, '--method', 'POST',
        '--description', DESCRIPTION, '--payload', '{}',
      ]) as HeartbeatJob
      : heartbeat([
        'create', '--name', JOB_NAME, '--cron', cron,
        '--path', STORAGE_RETENTION_SCHEDULED_PATH, '--method', 'POST',
        '--description', DESCRIPTION, '--payload', '{}',
      ]) as HeartbeatJob;
    const provisionedTaskUid = taskUid(provisioned) ?? existingTaskUid;
    if (!provisionedTaskUid) throw new Error('Heartbeat provisionado sem taskUid.');

    if (existing?.paused === true || existing?.enabled === false) {
      heartbeat(['resume', '--task-uid', provisionedTaskUid]);
    }

    await configureStorageRetentionSchedule({
      taskUid: provisionedTaskUid,
      enabled: true,
      minUnreferencedAgeDays,
      pendingGraceDays,
    });

    console.log(JSON.stringify({
      ok: true,
      dryRun: false,
      action,
      jobName: JOB_NAME,
      taskUid: provisionedTaskUid,
      cron,
      path: STORAGE_RETENTION_SCHEDULED_PATH,
      minUnreferencedAgeDays,
      pendingGraceDays,
      mode: 'logical-quarantine-only',
    }));
  }
} catch (error) {
  if (process.env.DEBUG_STORAGE_RETENTION === '1') console.error(error);
  logSafeServerError('[storage-retention] provisionamento do Heartbeat falhou', error);
  console.error(JSON.stringify({ok: false, error: 'Não foi possível provisionar o Heartbeat de retenção.'}));
  process.exitCode = 1;
}

process.exit(process.exitCode ?? 0);
