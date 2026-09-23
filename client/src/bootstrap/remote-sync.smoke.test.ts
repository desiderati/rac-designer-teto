import { TRPCClientError } from '@trpc/client';
import { describe, expect, it, vi } from 'vitest';
import {
  createReactiveConstructionSiteSessionStorage,
  persistReactiveConstructionSites,
} from './useRemoteConstructionSiteSessionStorage.ts';
import { mergeConstructionSiteStates } from '@/domain/construction-site/construction-site-conflict-merge.ts';
import { RemoteConstructionSiteRepositoryAdapter } from '@/infra/persistence/remote-construction-site-repository.adapter.ts';
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

function house(id: string) {
  return {
    id,
    constructionSiteId: 'site-1',
    familyId: `family-${id}`,
    houseType: 'tipo6' as const,
    terrainType: 1,
    status: 'draft' as const,
    designSettings: {selectedPilotiHeights: []},
    siteAssessment: {},
    pilotiLayout: {points: []},
    drawingDocument: {schemaVersion: 1, house: null, canvas: {schemaVersion: 1 as const, objects: []}, views: {}},
    version: 1,
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
  };
}

function createSharedCasServer(initialState: ConstructionSiteState) {
  let currentState = structuredClone(initialState);
  let documentVersion = initialState.constructionSite.documentVersion ?? 1;

  const createClient = () => ({
    constructionSites: {
      list: {query: vi.fn(async () => [{id: 'site-1'}])},
      load: {query: vi.fn(async () => ({state: structuredClone(currentState), documentVersion}))},
      save: {mutate: vi.fn(async ({state: next, expectedDocumentVersion}: {state: ConstructionSiteState; expectedDocumentVersion: number}) => {
        if (expectedDocumentVersion !== documentVersion) {
          throw new TRPCClientError('conflict', {
            result: {error: {message: 'conflict', code: 409, data: {code: 'CONFLICT'}}},
          } as never);
        }
        currentState = structuredClone(next);
        documentVersion += 1;
        return {documentVersion};
      })},
    },
    storage: {uploadImage: {mutate: vi.fn()}},
  });

  return {
    createClient,
    getState: () => ({state: structuredClone(currentState), documentVersion}),
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

  it('reproduz duas sessões concorrentes e combina as casas sem aceitar lost update silencioso', async () => {
    const base = state('site-1', 1);
    const server = createSharedCasServer(base);
    const operatorA = new RemoteConstructionSiteRepositoryAdapter(server.createClient() as never);
    const operatorB = new RemoteConstructionSiteRepositoryAdapter(server.createClient() as never);
    const baseA = await operatorA.load('site-1');
    const baseB = await operatorB.load('site-1');
    expect(baseA).not.toBeNull();
    expect(baseB).not.toBeNull();

    const localA = structuredClone(baseA!);
    localA.houses.push(house('house-thais'));
    await operatorA.save(localA);

    const localB = structuredClone(baseB!);
    localB.houses.push(house('house-felipe'));
    await expect(operatorB.save(localB)).rejects.toBeInstanceOf(TRPCClientError);

    const remoteAfterConflict = await operatorB.load('site-1');
    const merged = mergeConstructionSiteStates(baseB, localB, remoteAfterConflict!);

    expect(merged.ok).toBe(true);
    expect(merged.state?.houses.map((entry) => entry.id)).toEqual(['house-thais', 'house-felipe']);
    expect(server.getState().state.houses.map((entry) => entry.id)).toEqual(['house-thais']);
  });
});
