import {beforeEach, describe, expect, it, vi} from 'vitest';

const db = vi.hoisted(() => ({
  getStorageRetentionScheduleByTaskUid: vi.fn(),
  quarantineUnreferencedStorageAssets: vi.fn(),
  getStorageAssetLifecycleSummary: vi.fn(),
}));
const auth = vi.hoisted(() => ({authenticateRequest: vi.fn()}));

vi.mock('./db.ts', () => db);
vi.mock('./_core/sdk.ts', () => ({sdk: auth}));

import {
  handleStorageRetentionHeartbeat,
  runStorageRetentionHeartbeat,
  STORAGE_RETENTION_SCHEDULED_PATH,
} from './storage-retention.ts';

describe('storage retention heartbeat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('acknowledges an orphan schedule without attempting lifecycle mutations', async () => {
    db.getStorageRetentionScheduleByTaskUid.mockResolvedValue(null);

    await expect(runStorageRetentionHeartbeat('task-orphan')).resolves.toEqual({
      ok: true,
      skipped: 'orphan_schedule',
      taskUid: 'task-orphan',
    });
    expect(db.quarantineUnreferencedStorageAssets).not.toHaveBeenCalled();
  });

  it('runs only the reversible ledger quarantine using the stored policy', async () => {
    db.getStorageRetentionScheduleByTaskUid.mockResolvedValue({
      minUnreferencedAgeDays: 30,
      pendingGraceDays: 7,
    });
    db.quarantineUnreferencedStorageAssets.mockResolvedValue({quarantined: 2, inspected: 5});
    db.getStorageAssetLifecycleSummary.mockResolvedValue({pending: 1, active: 9, quarantined: 2, manualReview: 0});

    await expect(runStorageRetentionHeartbeat('task-retention')).resolves.toEqual({
      ok: true,
      taskUid: 'task-retention',
      quarantined: 2,
      inspected: 5,
      lifecycle: {pending: 1, active: 9, quarantined: 2, manualReview: 0},
    });
    expect(db.quarantineUnreferencedStorageAssets).toHaveBeenCalledWith({
      minUnreferencedAgeDays: 30,
      pendingGraceDays: 7,
    });
  });

  it('keeps the scheduled route cron-only', async () => {
    auth.authenticateRequest.mockResolvedValue({isCron: false});
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    await handleStorageRetentionHeartbeat({originalUrl: STORAGE_RETENTION_SCHEDULED_PATH} as never, res as never);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'cron-only'}));
  });

  it('uses the authenticated taskUid and returns the reversible result', async () => {
    auth.authenticateRequest.mockResolvedValue({isCron: true, taskUid: 'task-retention'});
    db.getStorageRetentionScheduleByTaskUid.mockResolvedValue(null);
    const res = {json: vi.fn()};
    await handleStorageRetentionHeartbeat({originalUrl: STORAGE_RETENTION_SCHEDULED_PATH} as never, res as never);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      skipped: 'orphan_schedule',
      taskUid: 'task-retention',
    });
  });
});
