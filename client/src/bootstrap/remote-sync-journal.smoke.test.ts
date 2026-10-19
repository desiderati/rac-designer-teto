import {describe, expect, it, vi} from 'vitest';
import {createReactiveConstructionSiteSessionStorage, persistReactiveConstructionSites} from './useRemoteConstructionSiteSessionStorage.ts';
import type {RemoteJournalSnapshot, RemoteSyncJournal} from '@/infra/storage/remote-sync-journal.ts';
import type {ConstructionSiteState} from '@/shared/types/construction-site.ts';

function state(code = 'CC-BASE'): ConstructionSiteState {
  return {
    constructionSite: {id: 'site-1', externalCode: code, constructionDate: '2026-10-19',
      communityId: 'community-1', status: 'in_progress', documentVersion: 1,
      createdAt: '2026-10-19', updatedAt: '2026-10-19'},
    communities: [], families: [], monitors: [], houses: [],
  };
}

function memoryJournal() {
  let value: RemoteJournalSnapshot | null = null;
  const journal: RemoteSyncJournal = {
    read: async () => value && structuredClone(value),
    write: async (snapshot) => { value = structuredClone(snapshot); },
  };
  return journal;
}

describe('journal de intenção remota', () => {
  it('preserva edição recebida enquanto a atualização remota está sendo gravada', async () => {
    const journal = memoryJournal();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const original = journal.write;
    vi.spyOn(journal, 'write').mockImplementationOnce(async snapshot => { await gate; await original(snapshot); });
    const send = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state()], send, {journal});
    const refreshed = storage.refresh(async () => [state('REMOTO')], () => undefined);
    await vi.waitFor(() => expect(journal.write).toHaveBeenCalledOnce());
    storage.write([state('NOVA-EDICAO')]);
    release();
    expect(await refreshed).toBe(false);
    await vi.waitFor(async () => expect((await journal.read())?.synchronized[0].constructionSite.externalCode).toBe('NOVA-EDICAO'));
    expect(storage.read().constructionSites[0].constructionSite.externalCode).toBe('NOVA-EDICAO');
  });

  it('retoma o restante da fila quando a decisão chega antes de o envio conflitante encerrar', async () => {
    const a = state('A');
    const b = state('B'); b.constructionSite.id = 'site-2';
    const remote = state('REMOTO'); remote.constructionSite.documentVersion = 2;
    const journal = memoryJournal();
    let calls = 0;
    const send = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        storage.replace?.([remote], 'site-1');
        return false;
      }
      return true;
    });
    const storage = createReactiveConstructionSiteSessionStorage([a, b], send, {journal});
    storage.write([]);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    await vi.waitFor(async () => expect((await journal.read())?.synchronized).toEqual([remote]));
  });

  it('confirma a intenção durável antes de chamar a rede', async () => {
    const journal = memoryJournal();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const write = vi.spyOn(journal, 'write').mockImplementation(async () => { await gate; });
    const send = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state()], send, {journal});
    storage.write([state('EDITADO')]);
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    expect(send).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
  });

  it('bloqueia o envio se a persistência falha e permite nova tentativa sem perder a intenção', async () => {
    const journal = memoryJournal();
    const original = journal.write;
    const write = vi.spyOn(journal, 'write').mockRejectedValue(new Error('quota'));
    const failure = vi.fn();
    const send = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state()], send, {journal, onPersistenceError: failure});
    storage.write([state('EDITADO')]);
    await vi.waitFor(() => expect(failure).toHaveBeenCalled());
    expect(send).not.toHaveBeenCalled();
    expect(storage.read().constructionSites[0].constructionSite.externalCode).toBe('EDITADO');
    write.mockImplementation(original);
    storage.resume?.();
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    await vi.waitFor(async () => expect((await journal.read())?.synchronized[0].constructionSite.externalCode).toBe('EDITADO'));
  });

  it('recupera após recarga uma intenção não enviada e sua versão-base original', async () => {
    const journal = memoryJournal();
    const offline = vi.fn(async () => false);
    const storage = createReactiveConstructionSiteSessionStorage([state()], offline, {journal});
    storage.write([state('PENDENTE')]);
    await vi.waitFor(() => expect(offline).toHaveBeenCalledOnce());
    await vi.waitFor(async () => expect((await journal.read())?.document[0].constructionSite.externalCode).toBe('PENDENTE'));
    const recovered = (await journal.read())!;
    const online = vi.fn(async () => true);
    const restored = createReactiveConstructionSiteSessionStorage(recovered.document, online, {
      journal, initialSynchronized: recovered.synchronized,
    });
    expect(online).not.toHaveBeenCalled();
    restored.resume?.();
    await vi.waitFor(() => expect(online).toHaveBeenCalledOnce());
    expect(online.mock.calls[0]).toEqual([[state('PENDENTE')], [state()]]);
  });

  it('não envia novamente um documento já confirmado após recarga', async () => {
    const journal = memoryJournal();
    const settled = vi.fn();
    const storage = createReactiveConstructionSiteSessionStorage([state()], async () => true, {journal, onSettled: settled});
    storage.write([state('SALVO')]);
    await vi.waitFor(() => expect(settled).toHaveBeenCalled());
    const recovered = (await journal.read())!;
    const send = vi.fn(async () => true);
    createReactiveConstructionSiteSessionStorage(recovered.document, send, {
      journal, initialSynchronized: recovered.synchronized,
    }).resume?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).not.toHaveBeenCalled();
  });

  it('mantém novas edições durante o envio e confirma a base em ordem', async () => {
    const journal = memoryJournal();
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => { finish = resolve; });
    const send = vi.fn().mockImplementationOnce(async () => { await gate; return true; }).mockResolvedValue(true);
    const storage = createReactiveConstructionSiteSessionStorage([state()], send, {journal});
    storage.write([state('PRIMEIRO')]);
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    storage.write([state('SEGUNDO')]);
    await vi.waitFor(async () => expect((await journal.read())?.document[0].constructionSite.externalCode).toBe('SEGUNDO'));
    finish();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls[1]).toEqual([[state('SEGUNDO')], [state('PRIMEIRO')]]);
  });

  it('uma sessão invalidada não envia a fila usando a identidade seguinte', async () => {
    let active = true;
    const journal = memoryJournal();
    const send = vi.fn(async () => true);
    const storage = createReactiveConstructionSiteSessionStorage([state()], send, {journal, isActive: () => active});
    active = false;
    storage.write([state('CONTA-ANTERIOR')]);
    await vi.waitFor(async () => expect((await journal.read())?.document[0].constructionSite.externalCode).toBe('CONTA-ANTERIOR'));
    expect(send).not.toHaveBeenCalled();
  });

  it('confirma cada documento do lote no disco antes de recuperar uma falha posterior', async () => {
    const journal = memoryJournal();
    const a = state('A');
    const b = state('B'); b.constructionSite.id = 'site-2';
    const next = structuredClone([a, b]);
    next.forEach(entry => { entry.constructionSite.externalCode += '-EDITADO'; });
    let offline = true;
    const save = vi.fn(async (entry: ConstructionSiteState) => {
      if (entry.constructionSite.id === 'site-2' && offline) throw new Error('offline');
      entry.constructionSite.documentVersion = (entry.constructionSite.documentVersion ?? 0) + 1;
    });
    const repo = {save, remove: vi.fn(async () => undefined)};
    const storage = createReactiveConstructionSiteSessionStorage([a, b], (n, p) =>
      persistReactiveConstructionSites(repo, n, p, undefined, undefined, undefined, undefined, undefined,
        () => true, (id, saved) => storage.acknowledge(id, saved)), {journal});
    storage.write(next);
    await vi.waitFor(async () => {
      const synced = (await journal.read())!.synchronized;
      expect(synced.find(entry => entry.constructionSite.id === 'site-1')?.constructionSite.documentVersion).toBe(2);
      expect(synced.find(entry => entry.constructionSite.id === 'site-2')?.constructionSite.documentVersion).toBe(1);
      expect(save).toHaveBeenCalledTimes(2);
    });
    offline = false;
    save.mockClear();
    const recovered = (await journal.read())!;
    const restored = createReactiveConstructionSiteSessionStorage(recovered.document, (n, p) =>
      persistReactiveConstructionSites(repo, n, p, undefined, undefined, undefined, undefined, undefined,
        () => true, (id, saved) => restored.acknowledge(id, saved)),
    {journal, initialSynchronized: recovered.synchronized});
    restored.resume?.();
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].constructionSite.id).toBe('site-2');
  });
});
