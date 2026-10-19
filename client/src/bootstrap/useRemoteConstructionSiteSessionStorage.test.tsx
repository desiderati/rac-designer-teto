import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {TRPCClientError} from '@trpc/client';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';
import type {RemoteJournalSnapshot} from '@/infra/storage/remote-sync-journal.ts';

const mocks = vi.hoisted(() => ({
  records: new Map<string, RemoteJournalSnapshot>(),
  list: vi.fn(), load: vi.fn(), save: vi.fn(), remove: vi.fn(), setDocumentVersion: vi.fn(),
  hasLegacy: vi.fn(), clearLegacy: vi.fn(), login: vi.fn(),
  pendingSessions: vi.fn(), recover: vi.fn(),
  writeJournal: vi.fn(),
}));

vi.mock('@/shared/local-runtime.ts', () => ({isLocalEditorMode: false, isIsolatedLocalMode: false}));
vi.mock('@/const.ts', () => ({startLogin: mocks.login}));
vi.mock('@/lib/trpc-client.ts', () => ({racTrpcClient: {}}));
vi.mock('@/infra/persistence/remote-construction-site-repository.adapter.ts', () => ({
  RemoteConstructionSiteRepositoryAdapter: class {
    list = mocks.list; load = mocks.load; save = mocks.save; remove = mocks.remove;
    setDocumentVersion = mocks.setDocumentVersion;
  },
}));
vi.mock('@/infra/persistence/indexed-db-construction-site-repository.adapter.ts', () => ({
  hasLegacyIndexedDbConstructionSites: mocks.hasLegacy,
  clearLegacyIndexedDbConstructionSites: mocks.clearLegacy,
  IndexedDbConstructionSiteRepositoryAdapter: class {},
}));
vi.mock('@/infra/storage/remote-sync-journal.ts', () => ({
  remoteJournalIdentity: (userId: string) => {
    if (!userId) throw new Error('Identidade ausente');
    return {userId};
  },
  IndexedDbRemoteSyncJournal: class {
    constructor(private identity: {userId: string}) {}
    async read() { return structuredClone(mocks.records.get(this.identity.userId) ?? null); }
    async write(value: RemoteJournalSnapshot) { await mocks.writeJournal(this.identity.userId, value); }
    pendingSessions = mocks.pendingSessions;
    recover = mocks.recover;
  },
}));

import {useRemoteConstructionSiteSessionStorage} from './useRemoteConstructionSiteSessionStorage.ts';

function state(code = 'BASE'): ConstructionSiteState {
  return {
    constructionSite: {id: 'site-1', externalCode: code, constructionDate: '2026-10-19',
      communityId: 'community-1', status: 'in_progress', documentVersion: 1,
      createdAt: '2026-10-19', updatedAt: '2026-10-19'},
    communities: [], families: [], monitors: [], houses: [],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.records.clear();
  mocks.list.mockResolvedValue([{id: 'site-1'}]);
  mocks.load.mockResolvedValue(state());
  mocks.save.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  mocks.hasLegacy.mockResolvedValue(false);
  mocks.clearLegacy.mockResolvedValue(undefined);
  mocks.pendingSessions.mockResolvedValue([]);
  mocks.recover.mockResolvedValue(undefined);
  mocks.writeJournal.mockImplementation(async (userId: string, value: RemoteJournalSnapshot) => {
    mocks.records.set(userId, structuredClone(value));
  });
});

describe('bootstrap remoto com journal', () => {
  it('preserva edição quando a reconexão ocorre antes de terminar a gravação no journal', async () => {
    mocks.records.set('user-A', {document: [state('CACHE')], synchronized: [state('CACHE')]});
    mocks.list.mockRejectedValue(new Error('offline'));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    mocks.writeJournal.mockImplementationOnce(async (userId: string, value: RemoteJournalSnapshot) => {
      await gate;
      mocks.records.set(userId, structuredClone(value));
    });
    act(() => { if (result.current.status === 'ready') result.current.storage.write([state('INTENCAO-LOCAL')]); });
    await waitFor(() => expect(mocks.writeJournal).toHaveBeenCalled());
    mocks.list.mockResolvedValue([{id: 'site-1'}]);
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await act(async () => { release(); });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('synced'));
    if (result.current.status === 'ready') {
      expect(result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('INTENCAO-LOCAL');
    }
    await waitFor(() => expect(mocks.records.get('user-A')?.document[0].constructionSite.externalCode).toBe('INTENCAO-LOCAL'));
  });

  it('descarta uma atualização remota se houver edição durante a consulta', async () => {
    mocks.records.set('user-A', {document: [state('CACHE')], synchronized: [state('CACHE')]});
    mocks.list.mockRejectedValue(new Error('offline'));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    let release!: () => void;
    mocks.list.mockResolvedValue([{id: 'site-1'}]);
    mocks.load.mockImplementationOnce(() => new Promise<ConstructionSiteState>(resolve => {
      release = () => resolve({...state('REMOTO'), constructionSite: {...state('REMOTO').constructionSite, documentVersion: 7}});
    }));
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
    act(() => { if (result.current.status === 'ready') result.current.storage.write([state('EDITADO-DURANTE-CONSULTA')]); });
    await act(async () => { release(); });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('synced'));
    if (result.current.status === 'ready') {
      expect(result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('EDITADO-DURANTE-CONSULTA');
    }
    expect(mocks.setDocumentVersion).not.toHaveBeenCalledWith('site-1', 7);
  });

  it('recupera conflito de exclusão após recarga e permite manter a versão remota', async () => {
    const base = state(); base.constructionSite.status = 'archived';
    const remote = structuredClone(base); remote.constructionSite.documentVersion = 2;
    mocks.records.set('user-A', {document: [], synchronized: [base]});
    mocks.remove.mockRejectedValue(new TRPCClientError('CONFLICT', {
      result: {error: {message: 'CONFLICT', code: 409, data: {code: 'CONFLICT'}}},
    } as never));
    mocks.load.mockResolvedValue(remote);
    const first = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(first.result.current.status === 'ready' && first.result.current.sync.status).toBe('conflict'));
    first.unmount();
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('conflict'));
    if (result.current.status === 'ready') expect(result.current.sync.conflict).toMatchObject({operation: 'remove', remoteVersion: 2});
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    await act(async () => { if (result.current.status === 'ready') await result.current.sync.useRemoteVersion(); });
    await waitFor(() => expect(mocks.records.get('user-A')).toEqual({document: [remote], synchronized: [remote]}));
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it('só repete a exclusão após confirmação e grava a nova versão-base antes da rede', async () => {
    const base = state(); base.constructionSite.status = 'archived';
    const remote = structuredClone(base); remote.constructionSite.documentVersion = 2;
    mocks.records.set('user-A', {document: [], synchronized: [base]});
    mocks.load.mockResolvedValue(remote);
    mocks.remove.mockRejectedValueOnce(new TRPCClientError('CONFLICT', {
      result: {error: {message: 'CONFLICT', code: 409, data: {code: 'CONFLICT'}}},
    } as never)).mockImplementationOnce(async () => {
      expect(mocks.records.get('user-A')).toEqual({document: [], synchronized: [remote]});
    });
    const {result, unmount} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('conflict'));
    await act(async () => { if (result.current.status === 'ready') await result.current.sync.keepLocalVersion(); });
    await waitFor(() => expect(mocks.records.get('user-A')).toEqual({document: [], synchronized: []}));
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(mocks.setDocumentVersion).toHaveBeenLastCalledWith('site-1', 2);
    unmount();
    mocks.list.mockResolvedValue([]);
    const restored = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(restored.result.current.status === 'ready' && restored.result.current.sync.status).toBe('synced'));
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it('só transfere outra fila após confirmação explícita e permite continuar sem transferir', async () => {
    const candidate = {sessionId: 'old-session', revision: 3, savedAt: '2026-10-19T12:00:00.000Z', documentCount: 1};
    mocks.pendingSessions.mockResolvedValue([candidate]);
    const first = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(first.result.current.status).toBe('pending_sessions'));
    expect(mocks.recover).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
    act(() => { if (first.result.current.status === 'pending_sessions') first.result.current.continueCurrent(); });
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    expect(mocks.recover).not.toHaveBeenCalled();
    first.unmount();
    const second = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(second.result.current.status).toBe('pending_sessions'));
    await act(async () => { if (second.result.current.status === 'pending_sessions') await second.result.current.recover(candidate); });
    expect(mocks.recover).toHaveBeenCalledWith('old-session', 3);
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
  });

  it.each(['archived', 'in_progress'] as const)('preserva nova decisão de exclusão quando o remoto está %s', async status => {
    const base = state(); base.constructionSite.status = 'archived';
    const remote = structuredClone(base); remote.constructionSite.documentVersion = 2;
    remote.constructionSite.status = status;
    const newer = structuredClone(remote); newer.constructionSite.documentVersion = 3;
    mocks.records.set('user-A', {document: [], synchronized: [base]});
    mocks.load.mockResolvedValueOnce(remote).mockResolvedValue(newer);
    mocks.remove.mockRejectedValue(new TRPCClientError('CONFLICT', {
      result: {error: {message: 'CONFLICT', code: 409, data: {code: 'CONFLICT'}}},
    } as never));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('conflict'));
    await act(async () => { if (result.current.status === 'ready') await result.current.sync.keepLocalVersion(); });
    if (status === 'archived') {
      await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.conflict?.remoteVersion).toBe(3));
      expect(mocks.remove).toHaveBeenCalledTimes(2);
    } else {
      expect(mocks.remove).toHaveBeenCalledOnce();
      expect(result.current.status === 'ready' && result.current.sync.errorMessage).toContain('não está mais arquivada');
    }
    expect(mocks.records.get('user-A')?.document).toEqual([]);
  });

  it('não exclui quando a confirmação não pode ser preservada no disco', async () => {
    const base = state(); base.constructionSite.status = 'archived';
    const remote = structuredClone(base); remote.constructionSite.documentVersion = 2;
    mocks.records.set('user-A', {document: [], synchronized: [base]});
    mocks.load.mockResolvedValue(remote);
    mocks.remove.mockRejectedValue(new TRPCClientError('CONFLICT', {
      result: {error: {message: 'CONFLICT', code: 409, data: {code: 'CONFLICT'}}},
    } as never));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('conflict'));
    mocks.writeJournal.mockRejectedValue(new Error('quota'));
    await act(async () => { if (result.current.status === 'ready') await result.current.sync.keepLocalVersion(); });
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(result.current.status === 'ready' && result.current.sync.conflict?.operation).toBe('remove');
    expect(result.current.status === 'ready' && result.current.sync.errorMessage).toBe('quota');
  });

  it('confirma localmente a intenção se a construção já não existe no remoto', async () => {
    const base = state(); base.constructionSite.status = 'archived';
    mocks.records.set('user-A', {document: [], synchronized: [base]});
    mocks.load.mockResolvedValue(null);
    mocks.remove.mockRejectedValue(new TRPCClientError('CONFLICT', {
      result: {error: {message: 'CONFLICT', code: 409, data: {code: 'CONFLICT'}}},
    } as never));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('synced'));
    expect(mocks.records.get('user-A')).toEqual({document: [], synchronized: []});
    expect(mocks.remove).toHaveBeenCalledOnce();
  });
  it('preserva a intenção após falha e retoma pelo evento online', async () => {
    mocks.save.mockRejectedValue(new Error('offline'));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => { if (result.current.status === 'ready') result.current.storage.write([state('PENDENTE')]); });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('error'));
    expect(mocks.records.get('user-A')?.document[0].constructionSite.externalCode).toBe('PENDENTE');
    mocks.save.mockResolvedValue(undefined);
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('synced'));
    expect(mocks.records.get('user-A')?.synchronized[0].constructionSite.externalCode).toBe('PENDENTE');
  });

  it('atualiza candidatas sem descartar intenção quando a revisão muda durante a retomada', async () => {
    const candidate = {sessionId: 'old-session', revision: 1, savedAt: '2026-10-19T12:00:00.000Z', documentCount: 1};
    mocks.pendingSessions.mockResolvedValue([candidate]);
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('pending_sessions'));
    mocks.pendingSessions.mockResolvedValue([{...candidate, revision: 2}]);
    mocks.recover.mockRejectedValue(new Error('A fila mudou'));
    await act(async () => { if (result.current.status === 'pending_sessions') await result.current.recover(candidate); });
    expect(result.current.status).toBe('pending_sessions');
    if (result.current.status === 'pending_sessions') {
      expect(result.current.message).toBe('A fila mudou');
      expect(result.current.sessions[0].revision).toBe(2);
    }
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('reconstitui a fila após desmontagem e recarga sem substituir o rascunho pelo servidor', async () => {
    mocks.records.set('user-A', {document: [state('PENDENTE')], synchronized: [state()]});
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('synced'));
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.setDocumentVersion).toHaveBeenCalledWith('site-1', 1);
    expect(mocks.save).toHaveBeenCalledWith(state('PENDENTE'));
  });

  it('mantém a fila da outra conta intacta ao trocar de identidade', async () => {
    mocks.records.set('user-A', {document: [state('PRIVADO-A')], synchronized: [state()]});
    mocks.save.mockRejectedValue(new Error('offline'));
    const {result, rerender} = renderHook(({user}) => useRemoteConstructionSiteSessionStorage(user), {
      initialProps: {user: 'user-A'},
    });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('error'));
    rerender({user: 'user-B'});
    await waitFor(() => expect(result.current.status === 'ready' && result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('BASE'));
    expect(mocks.records.get('user-A')?.document[0].constructionSite.externalCode).toBe('PRIVADO-A');
    expect(mocks.records.get('user-B')?.document[0].constructionSite.externalCode).toBe('BASE');
  });

  it('bloqueia o bootstrap sem identidade em vez de abrir a fila de outra conta', async () => {
    mocks.records.set('user-A', {document: [state('PRIVADO-A')], synchronized: [state()]});
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.records.get('user-A')?.document[0].constructionSite.externalCode).toBe('PRIVADO-A');
  });

  it('não limpa dados ao recusar o descarte; somente confirma a limpeza por ação explícita', async () => {
    mocks.hasLegacy.mockResolvedValue(true);
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('legacy_confirmation'));
    act(() => { if (result.current.status === 'legacy_confirmation') result.current.keepLegacyData(); });
    expect(result.current.status).toBe('blocked');
    expect(mocks.clearLegacy).not.toHaveBeenCalled();
    expect(mocks.list).not.toHaveBeenCalled();
    act(() => { if (result.current.status === 'blocked') result.current.reviewLegacyData(); });
    mocks.hasLegacy.mockResolvedValue(false);
    await act(async () => { if (result.current.status === 'legacy_confirmation') await result.current.discardLegacyData(); });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mocks.clearLegacy).toHaveBeenCalledOnce();
  });

  it('reabre cache reconhecido offline e consulta o remoto ao reconectar', async () => {
    mocks.records.set('user-A', {document: [state('CACHE')], synchronized: [state('CACHE')]});
    mocks.list.mockRejectedValue(new Error('offline'));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('error'));
    if (result.current.status === 'ready') expect(result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('CACHE');
    mocks.list.mockResolvedValue([{id: 'site-1'}]);
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(result.current.status === 'ready' && result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('BASE'));
  });

  it('preserva o diálogo e informa falha da limpeza sem carregar a base remota', async () => {
    mocks.hasLegacy.mockResolvedValue(true);
    mocks.clearLegacy.mockRejectedValue(new Error('transação cancelada'));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status).toBe('legacy_confirmation'));
    await act(async () => { if (result.current.status === 'legacy_confirmation') await result.current.discardLegacyData(); });
    expect(result.current.status).toBe('legacy_confirmation');
    if (result.current.status === 'legacy_confirmation') expect(result.current.message).toBe('transação cancelada');
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('restaura as versões do cache após terminar todas as cargas parciais', async () => {
    mocks.records.set('user-A', {document: [state('CACHE')], synchronized: [state('CACHE')]});
    mocks.list.mockResolvedValue([{id: 'site-1'}, {id: 'site-2'}]);
    let release!: () => void;
    mocks.load.mockImplementation((id: string) => id === 'site-2'
      ? Promise.reject(new Error('offline'))
      : new Promise<ConstructionSiteState>(resolve => {
        release = () => {
          mocks.setDocumentVersion('site-1', 7);
          resolve({...state('REMOTO-7'), constructionSite: {...state().constructionSite, documentVersion: 7}});
        };
      }));
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(result.current.status).toBe('loading');
    act(() => release());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mocks.setDocumentVersion).toHaveBeenLastCalledWith('site-1', 1);
    if (result.current.status === 'ready') {
      expect(result.current.storage.read().constructionSites[0].constructionSite.externalCode).toBe('CACHE');
      expect(result.current.sync.lastSyncedAt).toBeNull();
    }
  });

  it('um conflito recuperado não é resolvido ou reenviado automaticamente ao reconectar', async () => {
    mocks.records.set('user-A', {document: [state('LOCAL')], synchronized: [state()]});
    mocks.save.mockRejectedValue(new TRPCClientError('conflict', {
      result: {error: {message: 'conflict', code: 409, data: {code: 'CONFLICT'}}},
    } as never));
    mocks.load.mockResolvedValue({...state('REMOTO'), constructionSite: {...state('REMOTO').constructionSite, documentVersion: 2}});
    const {result} = renderHook(() => useRemoteConstructionSiteSessionStorage('user-A'));
    await waitFor(() => expect(result.current.status === 'ready' && result.current.sync.status).toBe('conflict'));
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(mocks.records.get('user-A')?.document[0].constructionSite.externalCode).toBe('LOCAL');
    expect(result.current.status === 'ready' && result.current.sync.conflict?.remoteState.constructionSite.externalCode).toBe('REMOTO');
  });
});
