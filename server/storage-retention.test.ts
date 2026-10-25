import {beforeEach, describe, expect, it, vi} from 'vitest';

const db = vi.hoisted(() => ({
  getStorageRetentionScheduleByTaskUid: vi.fn(),
  quarantineUnreferencedStorageAssets: vi.fn(),
  getStorageAssetLifecycleSummary: vi.fn(),
}));

vi.mock('./db.ts', () => db);

import {runStorageRetentionHeartbeat} from './storage-retention.ts';

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
});
