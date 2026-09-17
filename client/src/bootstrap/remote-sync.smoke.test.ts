import { describe, expect, it, vi } from 'vitest';
import {
  createReactiveConstructionSiteSessionStorage,
  persistReactiveConstructionSites,
} from './useRemoteConstructionSiteSessionStorage.ts';
import type { ConstructionSiteState } from '@/shared/types/construction-site.ts';

function state(id: string, version = 1): ConstructionSiteState {
  return {
    constructionSite: {
      id,
      externalCode: id.toUpperCase(),
      documentVersion: version,
      constructionDate: '2026-09-17',
      communityId: `community-${id}`,
      status: 'in_progress',
      createdAt: '2026-09-17T00:00:00.000Z',
      updatedAt: '2026-09-17T00:00:00.000Z',
    },
    communities: [],
    families: [],
    monitors: [],
    houses: [],
  };
}

describe('remote construction site session storage', () => {
  it('replaces local state without scheduling a remote write', () => {
    const onWrite = vi.fn(async () => undefined);
    const storage = createReactiveConstructionSiteSessionStorage([state('old')], onWrite);

    storage.replace?.([state('remote', 4)]);

    expect(storage.read().constructionSites.map((entry) => entry.constructionSite.id)).toEqual(['remote']);
    expect(onWrite).not.toHaveBeenCalled();
  });

  it('serializes writes and reports a successful sync', async () => {
    const onWrite = vi.fn(async () => undefined);
    const storage = createReactiveConstructionSiteSessionStorage([state('site')], onWrite);

    storage.write([state('site', 1), state('new-site', 1)]);
    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(1));

    expect(onWrite).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ constructionSite: expect.objectContaining({ id: 'new-site' }) })]),
      expect.arrayContaining([expect.objectContaining({ constructionSite: expect.objectContaining({ id: 'site' }) })]),
    );
  });
});

describe('persistReactiveConstructionSites', () => {
  it('persists changed documents and removes deleted documents', async () => {
    const repository = {
      save: vi.fn(async () => undefined),
      remove: vi.fn(async () => undefined),
    };
    const setStatus = vi.fn();
    const setLastSyncedAt = vi.fn();

    await persistReactiveConstructionSites(
      repository,
      [state('kept', 1)],
      [state('kept', 1), state('deleted', 1)],
      setStatus,
      setLastSyncedAt,
    );

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.remove).toHaveBeenCalledWith('deleted');
    expect(setStatus).toHaveBeenLastCalledWith('synced');
    expect(setLastSyncedAt).toHaveBeenCalledTimes(1);
  });
});
