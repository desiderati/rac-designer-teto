import { TRPCClientError } from '@trpc/client';
import { describe, expect, it, vi } from 'vitest';
import {
  createReactiveConstructionSiteSessionStorage,
  persistReactiveConstructionSites,
} from './useRemoteConstructionSiteSessionStorage.ts';
import { mergeConstructionSiteStates } from '@/domain/construction-site/construction-site-conflict-merge.ts';
import { RemoteConstructionSiteRepositoryAdapter } from '@/infra/persistence/remote-construction-site-repository.adapter.ts';
import type { RemoteSyncConflict } from '@/contexts/RemoteSyncContext.tsx';
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
      load: {query: vi.fn(async () => ({state: structuredClone(currentState), documentVersion, savedAt: '2026-09-24T13:00:00.000Z'}))},
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
    const onWrite = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state('old')], onWrite);

    storage.replace?.([state('remote', 4)]);

    expect(storage.read().constructionSites.map((entry) => entry.constructionSite.id)).toEqual(['remote']);
    expect(onWrite).not.toHaveBeenCalled();
  });

  it('serializes writes and reports a successful sync', async () => {
    const onWrite = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state('site')], onWrite);

    storage.write([state('site', 1), state('new-site', 1)]);
    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(1));

    expect(onWrite).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ constructionSite: expect.objectContaining({ id: 'new-site' }) })]),
      expect.arrayContaining([expect.objectContaining({ constructionSite: expect.objectContaining({ id: 'site' }) })]),
    );
  });

  it('retoma uma escrita falha usando o estado local mais recente', async () => {
    const onWrite = vi.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const base = state('site-1');
    const storage = createReactiveConstructionSiteSessionStorage([base], onWrite);
    const first = structuredClone(base);
    first.houses.push(house('house-1'));
    storage.write([first]);
    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const latest = structuredClone(first);
    latest.houses.push(house('house-2'));
    storage.write([latest]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onWrite).toHaveBeenCalledTimes(1);

    storage.resume?.();
    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(2));
    expect(onWrite.mock.calls[1][0][0].houses.map((entry: {id: string}) => entry.id)).toEqual(['house-1', 'house-2']);
    expect(onWrite.mock.calls[1][1]).toEqual([base]);
  });

  it('envia o estado mais recente após concluir uma escrita em andamento', async () => {
    let finishFirst!: () => void;
    const firstWrite = new Promise<void>((resolve) => { finishFirst = resolve; });
    const onWrite = vi.fn()
      .mockImplementationOnce(async () => { await firstWrite; return true; })
      .mockResolvedValueOnce(true);
    const base = state('site-1');
    const storage = createReactiveConstructionSiteSessionStorage([base], onWrite);
    const first = structuredClone(base);
    first.houses.push(house('house-1'));
    const latest = structuredClone(first);
    latest.houses.push(house('house-2'));

    storage.write([first]);
    storage.write([latest]);
    expect(onWrite).toHaveBeenCalledTimes(1);
    finishFirst();

    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(2));
    expect(onWrite.mock.calls[1][0][0].houses.map((entry: {id: string}) => entry.id)).toEqual(['house-1', 'house-2']);
    expect(onWrite.mock.calls[1][1][0].houses.map((entry: {id: string}) => entry.id)).toEqual(['house-1']);
  });

  it('adota a transformação feita pelo save sem reencaminhar o mesmo documento', async () => {
    const onWrite = vi.fn(async (next: ConstructionSiteState[]) => {
      next[0].constructionSite.photoDataUrl = 'https://storage.example/construction-photo.png';
      return true;
    });
    const base = state('site-1');
    const storage = createReactiveConstructionSiteSessionStorage([base], onWrite);
    const withEmbeddedPhoto = structuredClone(base);
    withEmbeddedPhoto.constructionSite.photoDataUrl = 'data:image/png;base64,ZmFrZQ==';

    storage.write([withEmbeddedPhoto]);
    await vi.waitFor(() => expect(onWrite).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onWrite).toHaveBeenCalledTimes(1);
    expect(storage.read().constructionSites[0].constructionSite.photoDataUrl)
      .toBe('https://storage.example/construction-photo.png');
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

  it('não grava a próxima escrita enfileirada após conflito e preserva o estado local para o merge', async () => {
    const server = createSharedCasServer(state('site-1', 1));
    const operatorA = new RemoteConstructionSiteRepositoryAdapter(server.createClient() as never);
    const clientB = server.createClient();
    const operatorB = new RemoteConstructionSiteRepositoryAdapter(clientB as never);
    const baseA = (await operatorA.load('site-1'))!;
    const baseB = (await operatorB.load('site-1'))!;

    const remote = structuredClone(baseA);
    remote.houses.push(house('house-thais'));
    await operatorA.save(remote);

    let conflict: RemoteSyncConflict | null = null;
    const onWrite = vi.fn(async (next: ConstructionSiteState[], previous: ConstructionSiteState[]) => (
      persistReactiveConstructionSites(operatorB, next, previous, undefined, undefined, undefined, (value) => {
        conflict = value;
      }, (id) => storage.read().constructionSites.find((entry) => entry.constructionSite.id === id))
    ));
    const storage = createReactiveConstructionSiteSessionStorage([baseB], onWrite);
    const first = structuredClone(baseB);
    first.houses.push(house('house-felipe-1'));
    const second = structuredClone(first);
    second.houses.push(house('house-felipe-2'));

    storage.write([first]);
    storage.write([second]);
    await vi.waitFor(() => expect(conflict).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(conflict!.remoteSavedAt).toBe('2026-09-24T13:00:00.000Z');
    expect(clientB.constructionSites.save.mutate).toHaveBeenCalledTimes(1);
    expect(server.getState().state.houses.map((entry) => entry.id)).toEqual(['house-thais']);
    expect(storage.read().constructionSites[0].houses.map((entry) => entry.id)).toEqual([
      'house-felipe-1',
      'house-felipe-2',
    ]);
    expect(conflict!.localState.houses.map((entry) => entry.id)).toEqual([
      'house-felipe-1',
      'house-felipe-2',
    ]);

    const merged = mergeConstructionSiteStates(
      conflict!.baseState,
      storage.read().constructionSites[0],
      conflict!.remoteState,
    );
    expect(merged.ok).toBe(true);
    merged.state!.constructionSite.documentVersion = conflict!.remoteVersion;
    operatorB.setDocumentVersion('site-1', conflict!.remoteVersion);
    await operatorB.save(merged.state!);
    storage.replace?.([merged.state!], 'site-1');

    expect(server.getState().state.houses.map((entry) => entry.id)).toEqual([
      'house-thais',
      'house-felipe-1',
      'house-felipe-2',
    ]);
  });

  it('bloqueia o merge quando a edição enfileirada conflita com o mesmo campo remoto', async () => {
    const server = createSharedCasServer(state('site-1', 1));
    const operatorA = new RemoteConstructionSiteRepositoryAdapter(server.createClient() as never);
    const operatorB = new RemoteConstructionSiteRepositoryAdapter(server.createClient() as never);
    const baseA = (await operatorA.load('site-1'))!;
    const baseB = (await operatorB.load('site-1'))!;
    const remote = structuredClone(baseA);
    remote.constructionSite.externalCode = 'THAIS';
    await operatorA.save(remote);

    let conflict: RemoteSyncConflict | null = null;
    const storage = createReactiveConstructionSiteSessionStorage([baseB], (next, previous) => (
      persistReactiveConstructionSites(operatorB, next, previous, undefined, undefined, undefined, (value) => {
        conflict = value;
      }, (id) => storage.read().constructionSites.find((entry) => entry.constructionSite.id === id))
    ));
    const first = structuredClone(baseB);
    first.houses.push(house('house-felipe'));
    const second = structuredClone(first);
    second.constructionSite.externalCode = 'FELIPE';

    storage.write([first]);
    storage.write([second]);
    await vi.waitFor(() => expect(conflict).not.toBeNull());

    expect(conflict!.localState.constructionSite.externalCode).toBe('FELIPE');
    expect(conflict!.conflicts).toContain('constructionSite.externalCode: alterações concorrentes no mesmo campo');
    expect(server.getState().state.constructionSite.externalCode).toBe('THAIS');
  });
});
